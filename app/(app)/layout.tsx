"use client";

import React from "react";
import { AppProvider } from "@/lib/store";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-slate-100 dark:bg-slate-950">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <AppHeader />
          <main className="flex-1 overflow-y-auto bg-slate-50/70 dark:bg-slate-950/70">
            {children}
          </main>
        </div>
      </div>
    </AppProvider>
  );
}
