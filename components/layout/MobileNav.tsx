"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/lib/store";
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Package,
  FileText,
  Menu
} from "lucide-react";

interface MobileNavProps {
  onOpenMenu: () => void;
}

export function MobileNav({ onOpenMenu }: MobileNavProps) {
  const pathname = usePathname();
  const { conversations, quotes, catalog } = useApp();

  const unreadTotal = conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0);
  const pendingQuotesTotal = quotes.filter(
    (q) => q.status === "envoye" || q.status === "brouillon"
  ).length;

  const items = [
    {
      label: "Accueil",
      href: "/app",
      icon: LayoutDashboard,
      active: pathname === "/app",
    },
    {
      label: "Messages",
      href: "/app/inbox",
      icon: MessageSquare,
      active: pathname.startsWith("/app/inbox"),
      badge: unreadTotal > 0 ? unreadTotal : null,
    },
    {
      label: "Prospects",
      href: "/app/prospects",
      icon: Users,
      active: pathname.startsWith("/app/prospects"),
    },
    {
      label: "Catalogue",
      href: "/app/catalogue",
      icon: Package,
      active: pathname.startsWith("/app/catalogue"),
      badge: catalog.length > 0 ? catalog.length : null,
    },
    {
      label: "Devis",
      href: "/app/devis",
      icon: FileText,
      active: pathname.startsWith("/app/devis"),
      badge: pendingQuotesTotal > 0 ? pendingQuotesTotal : null,
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/90 dark:border-slate-800/90 px-2 py-1.5 shadow-2xl safe-area-pb">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
                item.active
                  ? "text-emerald-600 dark:text-emerald-400 font-extrabold scale-105"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <div className="relative">
                <Icon className={`h-5 w-5 ${item.active ? "stroke-[2.5]" : "stroke-2"}`} />
                {typeof item.badge === "number" && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-emerald-600 text-white text-[9px] font-black flex items-center justify-center shadow-xs">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight font-medium">
                {item.label}
              </span>
              {item.active && (
                <span className="absolute bottom-0 w-6 h-0.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
              )}
            </Link>
          );
        })}

        {/* Bouton Menu Complet */}
        <button
          onClick={onOpenMenu}
          className="relative flex flex-col items-center justify-center py-1 px-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
        >
          <Menu className="h-5 w-5 stroke-2" />
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">Menu</span>
        </button>
      </div>
    </nav>
  );
}
