"use client";

import { AdminFooter } from "./admin-footer";
import { TenantHeader } from "./tenant-header";
import { TenantSidebar } from "./tenant-sidebar";

interface TenantLayoutProps {
  children: React.ReactNode;
}

export function TenantLayout({ children }: TenantLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-bg md:flex-row">
      <TenantSidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <TenantHeader />
        <main className="flex-1 overflow-auto p-6" id="main-content">
          {children}
        </main>
        <AdminFooter />
      </div>
    </div>
  );
}
