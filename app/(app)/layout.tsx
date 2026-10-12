"use client";

import React, { useState } from "react";
import { AppProvider } from "@/lib/store";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { MobileNav } from "@/components/layout/MobileNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <AppProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-slate-100 dark:bg-slate-950">
        
        {/* Sidebar (Desktop fixed + Mobile sliding drawer) */}
        <AppSidebar
          mobileOpen={isMobileMenuOpen}
          onMobileClose={() => setIsMobileMenuOpen(false)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <AppHeader onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />
          
          <main className="flex-1 overflow-y-auto bg-slate-50/70 dark:bg-slate-950/70 pb-20 md:pb-0">
            {children}
          </main>
        </div>

        {/* Mobile Bottom Navigation Bar */}
        <MobileNav onOpenMenu={() => setIsMobileMenuOpen(true)} />

      </div>
    </AppProvider>
  );
}
