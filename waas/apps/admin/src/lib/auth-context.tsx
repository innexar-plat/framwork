"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getMe, login as apiLogin, refreshTokens } from "./api-client";
import type { MeResponse } from "./api-client";

const ACCESS_KEY = "waas-access-token";
const REFRESH_KEY = "waas-refresh-token";

const PLATFORM_ROLES = ["super_admin", "catalog_admin"];

type AuthContextValue = {
  accessToken: string | null;
  isAuthenticated: boolean;
  me: MeResponse | null;
  isPlatformAdmin: boolean;
  hasTenant: boolean;
  login: (email: string, password: string) => Promise<MeResponse | null>;
  logout: () => void;
  getAccessToken: () => string | null;
  /** Fetch /me and update state. Call after login or when token exists. */
  fetchMe: () => Promise<MeResponse | null>;
  /** Try refresh; returns new access token or null. Updates storage and state on success. */
  tryRefresh: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredToken(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setAccessToken(readStoredToken(ACCESS_KEY));
    setMounted(true);
  }, []);

  const fetchMe = useCallback(
    async (tokenOverride?: string): Promise<MeResponse | null> => {
      const token =
        tokenOverride ?? accessToken ?? readStoredToken(ACCESS_KEY);
      if (!token) return null;
      try {
        const res = await getMe(token);
        if (res.success && res.data) {
          setMe(res.data);
          return res.data;
        }
      } catch {
        // ignore
      }
      setMe(null);
      return null;
    },
    [accessToken]
  );

  useEffect(() => {
    if (!mounted || !accessToken) return;
    fetchMe();
  }, [mounted, accessToken, fetchMe]);

  const persistTokens = useCallback((access: string, refresh: string) => {
    try {
      localStorage.setItem(ACCESS_KEY, access);
      localStorage.setItem(REFRESH_KEY, refresh);
    } catch {
      // ignore
    }
    setAccessToken(access);
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<MeResponse | null> => {
      const res = await apiLogin(email, password);
      if (!res.success || !res.data) throw new Error(res.error ?? "Login failed");
      persistTokens(res.data.access_token, res.data.refresh_token);
      return fetchMe(res.data.access_token);
    },
    [persistTokens, fetchMe]
  );

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(ACCESS_KEY);
      localStorage.removeItem(REFRESH_KEY);
    } catch {
      // ignore
    }
    setAccessToken(null);
    setMe(null);
  }, []);

  const getAccessToken = useCallback((): string | null => {
    if (accessToken) return accessToken;
    return readStoredToken(ACCESS_KEY);
  }, [accessToken]);

  const tryRefresh = useCallback(async (): Promise<string | null> => {
    const refresh = readStoredToken(REFRESH_KEY);
    if (!refresh) return null;
    try {
      const res = await refreshTokens(refresh);
      if (!res.success || !res.data) return null;
      persistTokens(res.data.access_token, res.data.refresh_token);
      return res.data.access_token;
    } catch {
      logout();
      return null;
    }
  }, [persistTokens, logout]);

  useEffect(() => {
    if (!mounted) return;
    const token = readStoredToken(ACCESS_KEY);
    if (token) setAccessToken(token);
  }, [mounted]);

  const isPlatformAdmin = Boolean(
    me?.global_role && PLATFORM_ROLES.includes(me.global_role)
  );
  const hasTenant = Boolean(me?.tenant);

  const value = useMemo(
    () => ({
      accessToken: mounted ? accessToken : null,
      isAuthenticated: Boolean(accessToken),
      me,
      isPlatformAdmin,
      hasTenant,
      login,
      logout,
      getAccessToken,
      fetchMe,
      tryRefresh,
    }),
    [
      accessToken,
      mounted,
      me,
      isPlatformAdmin,
      hasTenant,
      login,
      logout,
      getAccessToken,
      fetchMe,
      tryRefresh,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
