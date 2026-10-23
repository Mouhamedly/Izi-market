"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store";
import {
  User,
  Building2,
  Sparkles,
  Palette,
  Bot,
  LogOut,
  ChevronDown,
  ShieldCheck,
  Calendar,
  ExternalLink,
  Sliders
} from "lucide-react";
import { GoogleIcon } from "@/components/icons/GoogleIcon";

export function UserProfileDropdown() {
  const { business, userEmail, logout, isDemoMode } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayName = business.name || "Mon Entreprise";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || "IZ";

  const ownerName = business.owner_name || (userEmail ? userEmail.split("@")[0].replace(/[._-]/g, " ") : "Responsable");
  const displayEmail = userEmail || business.contact_email || business.google_calendar_email || "compte@izimarket.sn";

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-transparent hover:border-slate-200 dark:hover:border-slate-700/80 transition-all cursor-pointer group"
        aria-label="Menu profil utilisateur"
      >
        <div className="relative">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 text-white font-extrabold flex items-center justify-center text-xs shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
            {initials}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
        </div>

        <div className="hidden lg:flex flex-col text-left leading-tight">
          <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[120px]">
            {displayName}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[120px]">
            {business.sector || "Propriétaire"}
          </span>
        </div>

        <ChevronDown
          className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 hidden sm:block ${
            isOpen ? "rotate-180 text-emerald-500" : "group-hover:text-slate-600 dark:group-hover:text-slate-300"
          }`}
        />
      </button>

      {/* Profile Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-88 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-950/20 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          
          {/* Header Banner */}
          <div className="p-4 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white font-black flex items-center justify-center text-base shadow-lg shadow-emerald-500/25 shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                    {displayName}
                  </h4>
                  <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold truncate capitalize">
                  {ownerName}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1 mt-0.5">
                  <span className="truncate">{displayEmail}</span>
                </p>
              </div>
            </div>

            {/* Status Pills */}
            <div className="mt-3 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Plan Business Pro
              </span>
              {business.google_calendar_connected && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  <GoogleIcon className="h-2.5 w-2.5" /> Google Connecté
                </span>
              )}
            </div>
          </div>

          {/* Quick Menu Items */}
          <div className="p-2 space-y-1">
            <Link
              href="/app/parametres?tab=profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors group cursor-pointer"
            >
              <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <User className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 dark:text-white">Mon Profil & Entreprise</p>
                <p className="text-[10px] text-slate-500">Nom, contact, secteur et coordonnées</p>
              </div>
            </Link>

            <Link
              href="/app/parametres?tab=profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors group cursor-pointer"
            >
              <div className="h-8 w-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Palette className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 dark:text-white">Personnalisation & Marque</p>
                <p className="text-[10px] text-slate-500">Couleurs, devises et thèmes visuels</p>
              </div>
            </Link>

            <Link
              href="/app/parametres?tab=ai"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors group cursor-pointer"
            >
              <div className="h-8 w-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 dark:text-white">Assistant IA & WhatsApp</p>
                <p className="text-[10px] text-slate-500">Ton Téranga, nom de l'IA et signature</p>
              </div>
            </Link>

            <Link
              href="/app/parametres"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors group cursor-pointer"
            >
              <div className="h-8 w-8 rounded-xl bg-slate-500/10 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Sliders className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 dark:text-white">Tous les Paramètres</p>
                <p className="text-[10px] text-slate-500">Intégrations Meta, Google & Sauvegardes</p>
              </div>
            </Link>
          </div>

          {/* Footer / Logout */}
          <div className="p-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40">
            <button
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                Se déconnecter
              </span>
              <span className="text-[10px] text-slate-400">Session sécurisée</span>
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
