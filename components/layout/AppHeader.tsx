"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store";
import {
  Bot,
  Search,
  Smartphone,
  Menu,
  Sparkles
} from "lucide-react";
import { WhatsAppSimulatorModal } from "@/components/simulator/WhatsAppSimulatorModal";
import { UserProfileDropdown } from "./UserProfileDropdown";

interface AppHeaderProps {
  onOpenMobileMenu?: () => void;
}

export function AppHeader({ onOpenMobileMenu }: AppHeaderProps) {
  const { business, updateBusinessSettings, isDemoMode } = useApp();
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  const toggleAi = () => {
    updateBusinessSettings({ ai_enabled: !business.ai_enabled });
  };

  return (
    <>
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 flex items-center justify-between z-20 shrink-0">
        
        {/* Left: Mobile Menu Button & Brand/Search */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          
          {/* Hamburger Menu on Mobile */}
          {onOpenMobileMenu && (
            <button
              onClick={onOpenMobileMenu}
              className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              aria-label="Ouvrir le menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          {/* Mobile Brand Link (visible on mobile only) */}
          <Link href="/app" className="md:hidden flex items-center gap-1.5 shrink-0">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white truncate max-w-[100px] sm:max-w-none">
              IZI Market
            </span>
          </Link>

          {/* Quick Search on Desktop */}
          <div className="relative w-64 lg:w-72 hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher un prospect, numéro, bien..."
              className="w-full text-xs pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>

          {/* Demo Badge (desktop only) */}
          {isDemoMode && (
            <span className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
              Mode Démo
            </span>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          
          {/* Bouton IA Toggle */}
          <button
            onClick={toggleAi}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              business.ai_enabled
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700"
            }`}
            title="Activer ou désactiver les réponses automatiques de Claude"
          >
            <Bot className={`h-3.5 w-3.5 ${business.ai_enabled ? "text-emerald-600 animate-pulse" : "text-slate-400"}`} />
            <span className="hidden sm:inline">IA Commerciale {business.ai_enabled ? "Activée" : "En pause"}</span>
            <span className="sm:hidden text-[11px] font-bold">{business.ai_enabled ? "IA Active" : "IA Off"}</span>
          </button>

          {/* Bouton Simulateur WhatsApp (CTA Star) */}
          <button
            onClick={() => setIsSimulatorOpen(true)}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-sm shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Smartphone className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">Simulateur WhatsApp</span>
            <span className="sm:hidden text-[11px]">Simulateur</span>
          </button>

          {/* Menu Profil Utilisateur Interactif */}
          <UserProfileDropdown />
        </div>
      </header>

      {/* Modal Simulateur */}
      <WhatsAppSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
      />
    </>
  );
}
