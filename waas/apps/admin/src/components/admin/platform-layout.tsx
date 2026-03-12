"use client";

import { AdminFooter } from "./admin-footer";
import { PlatformHeader } from "./platform-header";
import { PlatformSidebar } from "./platform-sidebar";

interface PlatformLayoutProps {
  children: React.ReactNode;
}

export function PlatformLayout({ children }: PlatformLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 md:flex-row">
      <PlatformSidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <PlatformHeader />
        <main className="flex-1 overflow-auto p-6" id="main-content">
          {children}
        </main>
        <AdminFooter />
      </div>
    </div>
  );
}
