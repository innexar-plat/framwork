"use client";

import { AdminFooter } from "./admin-footer";
import { AdminHeader } from "./admin-header";
import { AdminSidebar } from "./admin-sidebar";

interface PanelLayoutProps {
  children: React.ReactNode;
}

export function PanelLayout({ children }: PanelLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-bg md:flex-row">
      <AdminSidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <AdminHeader />
        <main className="flex-1 overflow-auto p-6" id="main-content">
          {children}
        </main>
        <AdminFooter />
      </div>
    </div>
  );
}
