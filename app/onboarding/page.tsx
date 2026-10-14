"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";
import { AiTone } from "@/types/database";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [companyName, setCompanyName] = useState("Welma Digital");
  const [sector, setSector] = useState("Solutions Digitales & Services");
  const [aiTone, setAiTone] = useState<AiTone>("teranga");
  const [welcomeMessage, setWelcomeMessage] = useState(
    "Salam Alaykoum ! Bienvenue chez Welma Digital. Comment puis-je vous aider aujourd'hui ?"
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedName = sessionStorage.getItem("izi_temp_biz_name");
      if (savedName) setCompanyName(savedName);
    }
  }, []);

  const handleFinish = () => {
    if (typeof window !== "undefined") {
      const biz = {
        id: "biz_" + Date.now(),
        name: companyName,
        sector: sector,
        ai_enabled: true,
        ai_tone: aiTone,
        welcome_message: welcomeMessage,
        opening_hours: null,
        wa_phone_number_id: null,
        wa_access_token: null,
        wa_verify_status: "unverified" as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      localStorage.setItem("izi_business", JSON.stringify(biz));
    }
    router.push("/app");
  };

  const SECTORS = [
    "Immobilier & Résidences",
    "Prêt-à-porter, Mode & Chaussures",
    "Électronique, Smartphones & High-tech",
    "Services & Conseil",
    "Restauration & Traiteur",
    "Automobile & Pièces détachées",
    "Autre Commerce"
  ];

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-6 bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 text-white relative">
      
      <div className="w-full max-w-xl relative z-10 space-y-8">
        
        {/* Progress Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
            <Sparkles className="h-3.5 w-3.5" /> Étape {step} sur 3 • Configuration initiale
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Personnalisez votre Assistant WhatsApp
          </h1>
          <p className="text-xs text-slate-400">
            Adaptez Claude aux spécificités de vos clients au Sénégal
          </p>
        </div>

        {/* Stepper Dots */}
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                s === step ? "w-8 bg-emerald-500" : s < step ? "w-4 bg-emerald-700" : "w-4 bg-slate-800"
              }`}
            />
          ))}
        </div>

        {/* Card */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          
          {/* ETAPE 1 : IDENTITE */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-white">
                Votre entreprise
              </h2>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Nom commercial
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full text-xs px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Secteur d'activité principal
                </label>
                <select
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  className="w-full text-xs px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                >
                  {SECTORS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
                >
                  <span>Suivant : Ton de l'IA</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ETAPE 2 : TON DE L'IA */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-white">
                Comment l'IA doit-elle s'exprimer ?
              </h2>

              <div className="grid grid-cols-1 gap-3">
                {[
                  {
                    id: "teranga",
                    title: "🇸🇳 Téranga Sénégalaise (Recommandé)",
                    desc: "Poli, chaleureux, accueillant, bienveillant. Fait sentir au client qu'il est le bienvenu."
                  },
                  {
                    id: "chaleureux",
                    title: "☀️ Chaleureux & Convivial",
                    desc: "Enthousiaste, dynamique, réactif et souriant."
                  },
                  {
                    id: "professionnel",
                    title: "👔 Professionnel & Structuré",
                    desc: "Vouvoiement rigoureux, précis et formel."
                  }
                ].map((tone) => (
                  <div
                    key={tone.id}
                    onClick={() => setAiTone(tone.id as AiTone)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      aiTone === tone.id
                        ? "bg-emerald-950/40 border-emerald-500 shadow-xs"
                        : "bg-slate-950 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <p className="text-xs font-bold text-white">{tone.title}</p>
                    <p className="text-[11px] text-slate-400 mt-1">{tone.desc}</p>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Retour
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
                >
                  <span>Suivant : Message d'accueil</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ETAPE 3 : ACCUEIL */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-white">
                Premier message automatique
              </h2>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Message de bienvenue WhatsApp
                </label>
                <textarea
                  rows={3}
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  className="w-full text-xs p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-800/40 text-xs text-emerald-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Tout est prêt !
                </p>
                <p className="text-[11px] text-emerald-200/80">
                  Votre espace de travail est prêt avec FAQ, Catalogue et le Simulateur WhatsApp pour tester immédiatement Claude.
                </p>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Retour
                </button>
                <button
                  onClick={handleFinish}
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
                >
                  <span>Accéder à mon tableau de bord</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
