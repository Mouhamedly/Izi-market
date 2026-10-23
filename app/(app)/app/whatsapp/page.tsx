"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { WhatsAppQrConnector } from "@/components/whatsapp/WhatsAppQrConnector";
import {
  QrCode,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Send,
  MessageSquare,
  ArrowRight,
  ExternalLink,
  Sliders
} from "lucide-react";

export default function WhatsAppConnectionPage() {
  const { business, updateBusinessSettings } = useApp();
  const [activeTab, setActiveTab] = useState<"qr" | "advanced">("qr");
  const [disconnectSuccess, setDisconnectSuccess] = useState(false);

  const isConnected = business.wa_verify_status === "verified";
  const activePhone = business.wa_phone_number_id || "+221 77 123 45 67";

  const handleInstantDisconnect = () => {
    updateBusinessSettings({
      wa_verify_status: "unverified",
      wa_phone_number_id: ""
    });

    if (typeof window !== "undefined") {
      try {
        const currentBiz = JSON.parse(localStorage.getItem("izi_business") || "{}");
        localStorage.setItem(
          "izi_business",
          JSON.stringify({
            ...currentBiz,
            wa_verify_status: "unverified",
            wa_phone_number_id: ""
          })
        );
      } catch {}
    }

    setDisconnectSuccess(true);
    setTimeout(() => setDisconnectSuccess(false), 5000);
  };

  return (
    <div className="p-3.5 sm:p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-2">
            <WhatsAppIcon className="h-3.5 w-3.5" />
            <span>Passerelle WhatsApp Multi-Device</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Connexion & Gestion WhatsApp
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Liez votre ligne WhatsApp Business à votre assistant IA IZI MARKET pour automatiser vos réponses, qualifier vos prospects et synchroniser vos ventes. Vous pouvez vous connecter ou vous déconnecter à tout moment.
          </p>
        </div>

        {/* Global Status Pill & Quick Disconnect Button */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isConnected ? (
            <button
              type="button"
              onClick={handleInstantDisconnect}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/60 shadow-xs transition-all cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Déconnecter ce WhatsApp</span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
              <span>En attente de connexion</span>
            </div>
          )}
        </div>
      </div>

      {/* Disconnect Feedback Banner */}
      {disconnectSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
            <span>Votre session WhatsApp a été déconnectée avec succès. Vous pouvez reconnecter n'importe quel numéro à tout moment ci-dessous.</span>
          </div>
          <button
            type="button"
            onClick={() => setDisconnectSuccess(false)}
            className="text-xs font-bold text-emerald-800 dark:text-emerald-200 hover:underline cursor-pointer"
          >
            Fermer
          </button>
        </div>
      )}

      {/* Main Connection Status Card */}
      <div className={`p-6 sm:p-7 rounded-3xl border transition-all ${
        isConnected
          ? "bg-gradient-to-br from-emerald-950/30 via-slate-900 to-slate-900 border-emerald-500/30 shadow-xl"
          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm"
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 ${
              isConnected
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-md shadow-emerald-500/20"
                : "bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700"
            }`}>
              <WhatsAppIcon className="h-8 w-8" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {isConnected ? "WhatsApp Business Connecté & Actif" : "Aucun WhatsApp Connecté"}
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border flex items-center gap-1.5 ${
                  isConnected
                    ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                  {isConnected ? "En Ligne" : "Déconnecté"}
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {isConnected ? (
                  <>
                    Numéro jumelé : <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{activePhone}</strong> · L'assistant IA qualifie vos prospects 24h/24.
                  </>
                ) : (
                  "Votre assistant IA est en attente. Scannez le code QR ci-dessous pour démarrer l'automatisation de vos conversations."
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isConnected ? (
              <button
                type="button"
                onClick={handleInstantDisconnect}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30 transition-all cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Déconnecter à tout moment</span>
              </button>
            ) : (
              <span className="text-xs font-semibold text-slate-400">
                Connexion instantanée en 5 secondes
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Switcher: QR Code Scanner vs Meta Cloud API */}
      <div className="flex items-center p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/60 max-w-md">
        <button
          type="button"
          onClick={() => setActiveTab("qr")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "qr"
              ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <QrCode className="h-3.5 w-3.5" />
          <span>Scanner QR Code</span>
          <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-md">
            Direct
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("advanced")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "advanced"
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Sliders className="h-3.5 w-3.5 text-slate-500" />
          <span>Meta Cloud API (Avancé)</span>
        </button>
      </div>

      {/* Tab 1: Full Interactive QR Connector */}
      {activeTab === "qr" && (
        <WhatsAppQrConnector
          onConnected={(phone) => {
            updateBusinessSettings({
              wa_verify_status: "verified",
              wa_phone_number_id: phone
            });
          }}
          onDisconnected={() => {
            handleInstantDisconnect();
          }}
        />
      )}

      {/* Tab 2: Advanced Meta Cloud API settings link */}
      {activeTab === "advanced" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="space-y-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-emerald-600" />
              <span>Intégration Meta Developers Cloud API</span>
            </h3>
            <p className="text-xs text-slate-500 max-w-xl">
              Si vous préférez utiliser un numéro officiel WhatsApp Business Cloud API avec jeton permanent Meta, vous pouvez configurer vos clés d'accès dans les paramètres avancés.
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/app/parametres?tab=whatsapp"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all"
            >
              <span>Ouvrir la configuration Meta Cloud API</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}
