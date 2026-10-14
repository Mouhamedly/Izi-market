"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Bot,
  Users,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Smartphone,
  Building2,
  ShoppingBag
} from "lucide-react";
import { WhatsAppSimulatorModal } from "@/components/simulator/WhatsAppSimulatorModal";
import { AppProvider } from "@/lib/store";

export default function LandingPage() {
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  return (
    <AppProvider>
      <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-white font-sans overflow-x-hidden">
        
        {/* Navigation Bar */}
        <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25">
                <Sparkles className="h-5 w-5" />
              </div>
              <span className="font-extrabold text-2xl tracking-tight text-white flex items-center gap-2">
                IZI Market
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  WA AI
                </span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-300">
              <a href="#features" className="hover:text-emerald-400 transition-colors">
                Fonctionnalités
              </a>
              <a href="#pipeline" className="hover:text-emerald-400 transition-colors">
                Pipeline Commercial
              </a>
              <a href="#usecases" className="hover:text-emerald-400 transition-colors">
                Cas d'usage
              </a>
              <a href="#faq" className="hover:text-emerald-400 transition-colors">
                FAQ
              </a>
            </nav>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSimulatorOpen(true)}
                className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all"
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span>Simulateur Direct</span>
              </button>

              <Link
                href="/connexion"
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-colors"
              >
                Connexion
              </Link>

              <Link
                href="/app"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.02]"
              >
                <span>Accéder à l'App</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative pt-20 pb-28 px-6 overflow-hidden">
          {/* Subtle Ambient Background Gradients */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-emerald-500/15 via-teal-500/10 to-transparent blur-[140px] rounded-full pointer-events-none"></div>

          <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
            
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 shadow-sm animate-pulse">
              <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
              🇸🇳 Conçu spécialement pour les PME & Agences au Sénégal et en Afrique
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1] max-w-4xl mx-auto">
              Ne perdez plus aucun prospect sur{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500">
                WhatsApp
              </span>
              .
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              IZI Market connecte votre WhatsApp Cloud officiel à Claude Sonnet. Vos prospects reçoivent des réponses instantanées basées sur vos offres et prix, pendant que vos leads sont qualifiés dans un CRM en temps réel.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href="/app"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-2xl text-sm font-bold bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 text-slate-950 shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <span>Démarrer l'essai gratuit</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <button
                onClick={() => setIsSimulatorOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-2xl text-sm font-bold bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-800 hover:border-slate-700 shadow-md transition-all"
              >
                <Smartphone className="h-4 w-4 text-emerald-400" />
                <span>Tester une simulation en direct</span>
              </button>
            </div>

            {/* Proof Badges */}
            <div className="pt-8 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Réponse IA en moins de 3 secondes</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Reprise en main humaine en 1 clic</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Devises en FCFA & Ton Téranga local</span>
              </div>
            </div>

          </div>

          {/* Interactive UI Mockup Preview */}
          <div className="max-w-5xl mx-auto mt-16 relative">
            <div className="relative rounded-3xl p-2 bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
              <div className="bg-slate-950 rounded-[22px] p-4 sm:p-8 space-y-6">
                
                {/* Simulated Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="h-3 w-3 rounded-full bg-rose-500/80"></div>
                      <div className="h-3 w-3 rounded-full bg-amber-500/80"></div>
                      <div className="h-3 w-3 rounded-full bg-emerald-500/80"></div>
                    </div>
                    <span className="text-xs font-mono text-slate-400">
                      izimarket.app/inbox • Welma Digital Dakar
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                      Claude 3.5 Sonnet Actif
                    </span>
                  </div>
                </div>

                {/* Simulated Chat Thread */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Left: Chat flow */}
                  <div className="bg-[#0b141a] rounded-2xl p-4 space-y-3 wa-chat-bg dark border border-slate-800">
                    <div className="flex justify-start">
                      <div className="max-w-[85%] rounded-2xl rounded-tl-xs px-3.5 py-2.5 bg-[#202c33] text-xs text-[#e9edef] leading-relaxed">
                        <p className="font-semibold text-emerald-400 text-[10px] mb-1">Moussa Diop (+221 77 456 78 90)</p>
                        Salam alaykoum, je cherche une villa avec piscine à louer à Mermoz pour ma famille. Est-ce disponible ?
                        <span className="text-[9px] text-[#8696a0] block text-right mt-1">10:14</span>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <div className="max-w-[85%] rounded-2xl rounded-tr-xs px-3.5 py-2.5 bg-[#005c4b] text-xs text-white leading-relaxed">
                        <span className="text-[10px] text-emerald-200 font-semibold block mb-1">✨ Répondu par Claude IA</span>
                        Wa Alaykoum Salam M. Diop ! Bienvenue chez Welma Digital 🌿<br/><br/>
                        Oui, nous avons une superbe <b>Villa R+1 avec Piscine à Mermoz Pyrotechnie</b> (4 chambres autonomes, jardin, 1 500 000 FCFA/mois).<br/><br/>
                        Souhaitez-vous planifier une visite sur place ?
                        <span className="text-[9px] text-emerald-200 block text-right mt-1">10:14 • Reçu</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Lead Qualified Live */}
                  <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 space-y-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-slate-300">
                          Qualification Automatique du Lead
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                          Pipeline : RDV Visite
                        </span>
                      </div>

                      <div className="space-y-2.5 text-xs">
                        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between">
                          <span className="text-slate-400">Nom extrait :</span>
                          <span className="font-bold text-white">Moussa Diop</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between">
                          <span className="text-slate-400">Besoin qualifié :</span>
                          <span className="font-bold text-emerald-400">Villa avec piscine Mermoz</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between">
                          <span className="text-slate-400">Budget détecté :</span>
                          <span className="font-bold text-white">1 500 000 FCFA / mois</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Action commerciale :</span>
                      <span className="text-emerald-400 font-bold">Fiche CRM synchronisée ✅</span>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          </div>
        </section>

        {/* Bento Grid Features Section */}
        <section id="features" className="py-24 px-6 border-t border-slate-900 bg-slate-950/50">
          <div className="max-w-7xl mx-auto space-y-16">
            
            <div className="text-center space-y-4 max-w-3xl mx-auto">
              <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Puissance & Simplicité
              </h2>
              <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Tout ce dont une PME africaine a besoin pour accélérer ses ventes
              </p>
              <p className="text-sm text-slate-400">
                Ne manquez plus les demandes nocturnes, les week-ends ou les pics de rush commercial.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Feature 1 */}
              <div className="bg-slate-900/60 rounded-3xl p-8 border border-slate-800 hover:border-emerald-500/50 transition-all space-y-4 group">
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Bot className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  Réponse Intelligente avec Claude 3.5
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  L'IA s'appuie strictement sur vos FAQs et votre catalogue de biens pour répondre sans inventer, avec précision et courtoisie.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-slate-900/60 rounded-3xl p-8 border border-slate-800 hover:border-emerald-500/50 transition-all space-y-4 group">
                <div className="h-12 w-12 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  Pipeline CRM Visuel & Kanban
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Suivez vos opportunités étape par étape : de Nouveau Prospect à Visite/RDV, Négociation, jusqu'à la signature finale.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-slate-900/60 rounded-3xl p-8 border border-slate-800 hover:border-emerald-500/50 transition-all space-y-4 group">
                <div className="h-12 w-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  Reprise en main humaine en 1 clic
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Basculez instantanément la conversation en mode manuel dès qu'un agent souhaite intervenir personnellement.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="bg-slate-900/60 rounded-3xl p-8 border border-slate-800 hover:border-emerald-500/50 transition-all space-y-4 group">
                <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  Ton Téranga & Devises Locales
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  L'IA s'adapte à la culture commerciale ouest-africaine : respect, formules bienveillantes et montants en Francs CFA.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="bg-slate-900/60 rounded-3xl p-8 border border-slate-800 hover:border-emerald-500/50 transition-all space-y-4 group">
                <div className="h-12 w-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Smartphone className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  Meta WhatsApp Cloud API Officielle
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Zéro risque de bannissement ou de blocage WhatsApp. Connectez votre numéro officiel en toute conformité Meta.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="bg-slate-900/60 rounded-3xl p-8 border border-slate-800 hover:border-emerald-500/50 transition-all space-y-4 group">
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  Isolation des données & RLS
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Chaque entreprise dispose d'une étanchéité absolue de ses contacts et messages grâce à Postgres Row Level Security.
                </p>
              </div>

            </div>

          </div>
        </section>

        {/* Use Cases Section */}
        <section id="usecases" className="py-24 px-6 border-t border-slate-900">
          <div className="max-w-7xl mx-auto space-y-16">
            
            <div className="text-center space-y-4 max-w-2xl mx-auto">
              <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Adapté à votre Métier
              </h2>
              <p className="text-3xl font-extrabold text-white">
                Des résultats prouvés pour les entreprises à Dakar et en Afrique
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              <div className="bg-slate-900/70 p-6 rounded-3xl border border-slate-800 space-y-4">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                  <Building2 className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white">
                  Agences Immobilières
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  "Nous recevons des dizaines de messages par jour pour nos appartements aux Almadies et à Mermoz. IZI Market filtre les budgets, présente les biens et prend les RDV de visite automatiquement."
                </p>
                <p className="text-[11px] font-bold text-emerald-400">
                  — Agence Immobilière, Dakar
                </p>
              </div>

              <div className="bg-slate-900/70 p-6 rounded-3xl border border-slate-800 space-y-4">
                <div className="h-10 w-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white">
                  Boutiques & Prêt-à-porter
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  "Nos clientes demandent les tailles, les prix et les options de livraison via Wave à toute heure. L'IA répond immédiatement et enregistre les commandes sans délai."
                </p>
                <p className="text-[11px] font-bold text-emerald-400">
                  — Boutique de Mode, Dakar Plateau
                </p>
              </div>

              <div className="bg-slate-900/70 p-6 rounded-3xl border border-slate-800 space-y-4">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white">
                  Services & Conseils
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  "Avant, les prospects partaient chez les concurrents s'ils attendaient plus de 10 minutes. Avec IZI Market, le premier contact est parfait et nous reprenons les dossiers chauds."
                </p>
                <p className="text-[11px] font-bold text-emerald-400">
                  — Cabinet Conseil, Sénégal
                </p>
              </div>

            </div>

          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-24 px-6 border-t border-slate-900 bg-slate-950/60">
          <div className="max-w-4xl mx-auto space-y-12">
            
            <div className="text-center space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Questions Fréquentes
              </h2>
              <p className="text-3xl font-extrabold text-white">
                Tout ce que vous devez savoir sur IZI Market
              </p>
            </div>

            <div className="space-y-4 text-xs">
              
              <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
                <h3 className="font-bold text-sm text-white">
                  Ai-je besoin d'une carte bancaire internationale pour commencer ?
                </h3>
                <p className="text-slate-400 leading-relaxed">
                  Non ! Le MVP IZI Market est accessible directement avec accès démo et simulateur de test complet.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
                <h3 className="font-bold text-sm text-white">
                  Mon numéro WhatsApp risque-t-il d'être bloqué ?
                </h3>
                <p className="text-slate-400 leading-relaxed">
                  Absolument pas. IZI Market utilise l'API Cloud officielle de Meta (Meta WhatsApp Business Platform), garantissant une sécurité totale et une conformité 100% officielle.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
                <h3 className="font-bold text-sm text-white">
                  Comment tester l'application avant de connecter Meta ?
                </h3>
                <p className="text-slate-400 leading-relaxed">
                  Nous avons intégré un simulateur WhatsApp interactif dans l'application. Vous pouvez immédiatement dialoguer avec Claude Sonnet comme si vous étiez un client sur WhatsApp !
                </p>
              </div>

            </div>

          </div>
        </section>

        {/* CTA Banner */}
        <section className="py-20 px-6 border-t border-slate-900">
          <div className="max-w-5xl mx-auto rounded-3xl p-10 md:p-14 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 border border-emerald-800/40 text-center space-y-6 shadow-2xl relative overflow-hidden">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
              Prêt à booster vos ventes WhatsApp ?
            </h2>
            <p className="text-emerald-100/80 text-sm max-w-xl mx-auto leading-relaxed">
              Activez votre assistant commercial en quelques clics et transformez chaque message en opportunité de vente concrète.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                href="/app"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white text-slate-950 hover:bg-emerald-50 text-sm font-bold shadow-lg transition-all hover:scale-[1.02]"
              >
                Accéder immédiatement au Dashboard
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-6 border-t border-slate-900 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">IZI Market</span>
              <span>— L'assistant commercial WhatsApp IA pour PME africaines.</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/app" className="hover:text-emerald-400">
                Application
              </Link>
              <Link href="/connexion" className="hover:text-emerald-400">
                Connexion
              </Link>
              <Link href="/inscription" className="hover:text-emerald-400">
                Inscription
              </Link>
            </div>
          </div>
        </footer>

        {/* Modal Simulateur Accessible depuis la Landing Page */}
        <WhatsAppSimulatorModal
          isOpen={isSimulatorOpen}
          onClose={() => setIsSimulatorOpen(false)}
        />

      </div>
    </AppProvider>
  );
}
