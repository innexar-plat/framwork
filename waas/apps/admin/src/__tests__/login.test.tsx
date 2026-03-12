import { render, screen } from "@testing-library/react";
import { useRouter } from "next/navigation";
import LoginPage from "@/app/login/page";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    login: jest.fn(),
    isAuthenticated: false,
    me: null,
  }),
}));

jest.mock("@/lib/i18n", () => ({
  useI18n: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        "auth.login": "Log in",
        "auth.email": "Email",
        "auth.password": "Password",
        "auth.loginError": "Invalid email or password",
        "common.loading": "Loading",
      };
      return map[key] ?? key;
    },
  }),
}));

jest.mock("@/components/language-switcher", () => ({
  LanguageSwitcher: () => <div data-testid="language-switcher">Lang</div>,
}));

jest.mock("@/components/ui/theme-toggle", () => ({
  ThemeToggle: () => <div data-testid="theme-toggle">Theme</div>,
}));

describe("LoginPage", () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ replace: jest.fn() });
  });

  it("renders login form with email and password fields", () => {
    render(<LoginPage />);
    expect(screen.getByRole("heading", { name: /log in/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
  });

  it("has submit button", () => {
    render(<LoginPage />);
    const submit = screen.getByRole("button", { name: /log in/i });
    expect(submit).toHaveAttribute("type", "submit");
  });
});
