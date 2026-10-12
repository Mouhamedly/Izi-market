"use client";

import React, { useState } from "react";
import { useApp } from "@/lib/store";
import {
  Bot,
  Search,
  Smartphone
} from "lucide-react";
import { WhatsAppSimulatorModal } from "@/components/simulator/WhatsAppSimulatorModal";

export function AppHeader() {
  const { business, updateBusinessSettings, isDemoMode } = useApp();
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  const toggleAi = () => {
    updateBusinessSettings({ ai_enabled: !business.ai_enabled });
  };

  return (
    <>
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between z-20">
        
        {/* Left: Quick Search & Status */}
        <div className="flex items-center gap-4">
          <div className="relative w-72 hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher un prospect, numéro, bien..."
              className="w-full text-xs pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>

          {isDemoMode && (
            <span className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
              Mode Démo / Prêt pour Supabase & Meta
            </span>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          
          {/* Bouton IA Toggle */}
          <button
            onClick={toggleAi}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              business.ai_enabled
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700"
            }`}
            title="Activer ou désactiver les réponses automatiques de Claude"
          >
            <Bot className={`h-3.5 w-3.5 ${business.ai_enabled ? "text-emerald-600 animate-pulse" : "text-slate-400"}`} />
            <span>IA Commerciale {business.ai_enabled ? "Activée" : "En pause"}</span>
          </button>

          {/* Bouton Simulateur WhatsApp (CTA Star) */}
          <button
            onClick={() => setIsSimulatorOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-sm shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>Simulateur WhatsApp</span>
          </button>

          {/* User Avatar */}
          <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700">
            TM
          </div>
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
