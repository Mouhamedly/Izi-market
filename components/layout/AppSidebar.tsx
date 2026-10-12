"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/lib/store";
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  CalendarDays,
  BookOpen,
  Settings,
  Sparkles,
  Zap,
  Database,
  FileText,
  Package
} from "lucide-react";

export function AppSidebar() {
  const pathname = usePathname();
  const { business, conversations, appointments, quotes, catalog } = useApp();

  const unreadTotal = conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0);
  const upcomingApptsTotal = appointments.filter(
    (a) => new Date(a.start_time) >= new Date() && a.status === "confirmed"
  ).length;
  const pendingQuotesTotal = quotes.filter(
    (q) => q.status === "envoye" || q.status === "brouillon"
  ).length;

  const navItems = [
    {
      label: "Tableau de bord",
      href: "/app",
      icon: LayoutDashboard,
      active: pathname === "/app",
    },
    {
      label: "Boîte de réception",
      href: "/app/inbox",
      icon: MessageSquare,
      active: pathname.startsWith("/app/inbox"),
      badge: unreadTotal > 0 ? unreadTotal : null,
    },
    {
      label: "Prospects CRM",
      href: "/app/prospects",
      icon: Users,
      active: pathname.startsWith("/app/prospects"),
    },
    {
      label: "Catalogue Produits",
      href: "/app/catalogue",
      icon: Package,
      active: pathname.startsWith("/app/catalogue"),
      badge: catalog.length > 0 ? catalog.length : null,
    },
    {
      label: "Devis & Offres",
      href: "/app/devis",
      icon: FileText,
      active: pathname.startsWith("/app/devis"),
      badge: pendingQuotesTotal > 0 ? pendingQuotesTotal : null,
    },
    {
      label: "Rendez-vous",
      href: "/app/rendez-vous",
      icon: CalendarDays,
      active: pathname.startsWith("/app/rendez-vous"),
      badge: upcomingApptsTotal > 0 ? upcomingApptsTotal : null,
    },
    {
      label: "Connaissances",
      href: "/app/connaissances",
      icon: BookOpen,
      active: pathname.startsWith("/app/connaissances"),
    },
    {
      label: "Import de données",
      href: "/app/import",
      icon: Database,
      active: pathname.startsWith("/app/import"),
    },
    {
      label: "Paramètres",
      href: "/app/parametres",
      icon: Settings,
      active: pathname.startsWith("/app/parametres"),
    },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between shrink-0 select-none">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100 dark:border-slate-800/80">
          <Link href="/app" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                IZI Market
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                  WA
                </span>
              </span>
            </div>
          </Link>
        </div>

        {/* Business Selector / Info */}
        <div className="px-4 py-3 mx-3 my-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-500 text-white font-bold flex items-center justify-center text-xs shadow-sm">
              {business.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {business.name}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {business.sector || "PME Sénégal"}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  item.active
                    ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${item.active ? "text-white" : "text-slate-500 dark:text-slate-400"}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== null && (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                      item.active
                        ? "bg-white text-emerald-700"
                        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer System Status */}
      <div className="p-4 m-3 rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100/80 dark:from-slate-800/40 dark:to-slate-800/80 border border-slate-200/80 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              WhatsApp Cloud
            </span>
          </div>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            En ligne
          </span>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
          <span className="flex items-center gap-1.5">
            <Zap className="h-3 w-3 text-amber-500" />
            Claude 3.5 Sonnet
          </span>
          <span className="font-medium text-slate-700 dark:text-slate-300">Actif</span>
        </div>
      </div>
    </aside>
  );
}
