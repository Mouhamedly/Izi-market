"use client";

import React, { useEffect } from "react";
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
  Package,
  X,
  Compass,
  User,
  LogOut,
  QrCode
} from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";

interface AppSidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function AppSidebar({ mobileOpen = false, onMobileClose }: AppSidebarProps) {
  const pathname = usePathname();
  const { business, updateBusinessSettings, logout, conversations, appointments, quotes, catalog } = useApp();

  const prevPathnameRef = React.useRef(pathname);

  // Fermer le drawer mobile UNIQUEMENT lors d'un vrai changement d'URL
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      if (mobileOpen && onMobileClose) {
        onMobileClose();
      }
    }
  }, [pathname, mobileOpen, onMobileClose]);

  // Bloquer le défilement de l'arrière-plan quand le drawer est ouvert
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

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
      label: "Connexion WhatsApp",
      href: "/app/whatsapp",
      icon: WhatsAppIcon,
      active: pathname.startsWith("/app/whatsapp"),
      badge: business.wa_verify_status === "verified" ? "En ligne" : "À connecter",
      badgeClass: business.wa_verify_status === "verified"
        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
        : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 animate-pulse",
    },
    {
      label: "Boîte de réception",
      href: "/app/inbox",
      icon: MessageSquare,
      active: pathname.startsWith("/app/inbox"),
      badge: unreadTotal > 0 ? unreadTotal : null,
      badgeClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
    },
    {
      label: "Prospects CRM",
      href: "/app/prospects",
      icon: Users,
      active: pathname.startsWith("/app/prospects"),
    },
    {
      label: "Prospection Maps",
      href: "/app/prospection",
      icon: Compass,
      active: pathname.startsWith("/app/prospection"),
      badge: "Apify",
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
      label: "Profil & Marque",
      href: "/app/profil",
      icon: User,
      active: pathname.startsWith("/app/profil"),
    },
    {
      label: "Paramètres",
      href: "/app/parametres",
      icon: Settings,
      active: pathname.startsWith("/app/parametres"),
    },
  ];

  const sidebarContent = (isMobile = false) => (
    <div className="flex flex-col h-full justify-between select-none overflow-y-auto">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 sm:px-6 border-b border-slate-100 dark:border-slate-800/80">
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

          {isMobile && onMobileClose && (
            <button
              onClick={onMobileClose}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Fermer le menu"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Business Selector / Info */}
        <Link
          href="/app/parametres?tab=profile"
          className="group block px-4 py-3 mx-3 my-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-emerald-50/50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700/50 transition-all cursor-pointer shadow-2xs"
          title="Cliquez pour personnaliser votre profil et entreprise"
        >
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black flex items-center justify-center text-xs shadow-sm shrink-0 group-hover:scale-105 transition-transform">
              {business.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {business.name}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {business.sector || "PME Sénégal"}
              </p>
            </div>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (isMobile && onMobileClose) onMobileClose();
                }}
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
                {item.badge !== null && item.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                      item.active
                        ? "bg-white text-emerald-700"
                        : (item as any).badgeClass || "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
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

      {/* Footer System Status & Quick WhatsApp Connect/Disconnect */}
      <div className="p-3.5 m-3 rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100/80 dark:from-slate-800/40 dark:to-slate-800/80 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
        
        {/* WhatsApp Real-Time Connection Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                business.wa_verify_status === "verified" ? "bg-emerald-400" : "bg-amber-400"
              }`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                business.wa_verify_status === "verified" ? "bg-emerald-500" : "bg-amber-500"
              }`} />
            </span>
            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
              {business.wa_verify_status === "verified" ? "WhatsApp Connecté" : "WhatsApp Déconnecté"}
            </span>
          </div>

          <Link
            href="/app/whatsapp"
            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md transition-colors ${
              business.wa_verify_status === "verified"
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
            }`}
          >
            {business.wa_verify_status === "verified" ? "Gérer" : "Connecter"}
          </Link>
        </div>

        {business.wa_verify_status === "verified" ? (
          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
            <span className="font-mono truncate max-w-[120px]">
              {business.wa_phone_number_id || "+221 77..."}
            </span>
            <button
              type="button"
              onClick={() => {
                updateBusinessSettings({
                  wa_verify_status: "unverified",
                  wa_phone_number_id: ""
                });
              }}
              className="text-rose-600 dark:text-rose-400 hover:underline font-bold cursor-pointer"
              title="Déconnecter WhatsApp"
            >
              Déconnecter
            </button>
          </div>
        ) : (
          <Link
            href="/app/whatsapp"
            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-all shadow-xs"
          >
            <QrCode className="h-3 w-3" />
            <span>Scanner QR WhatsApp</span>
          </Link>
        )}

        {/* Platform Logout Button (Déconnexion de l'application à tout moment) */}
        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[11px] font-bold transition-colors cursor-pointer"
            title="Se déconnecter de votre compte IZI MARKET"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Se déconnecter de la plateforme</span>
          </button>
        </div>

      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (visible on md: screens and larger) */}
      <aside className="hidden md:flex w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col justify-between shrink-0">
        {sidebarContent(false)}
      </aside>

      {/* Mobile Drawer (visible when mobileOpen is true on mobile) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop Blur Overlay */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            onClick={onMobileClose}
          />

          {/* Drawer Content */}
          <aside className="relative w-72 max-w-[85vw] h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-2xl z-10 flex flex-col justify-between animate-in slide-in-from-left duration-250">
            {sidebarContent(true)}
          </aside>
        </div>
      )}
    </>
  );
}
