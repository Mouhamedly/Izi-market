"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store";
import {
  MessageSquare,
  Users,
  Sparkles,
  ArrowUpRight,
  Bot,
  ChevronRight,
  BookOpen,
  Smartphone,
  CalendarDays,
  Video,
  Clock,
  FileText,
  Search,
  Phone,
  UploadCloud,
  ExternalLink,
  MessageCircle,
  Plus,
  UserPlus
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { formatAppointmentSlot } from "@/lib/calendar";
import { isContactEligibleForFollowup } from "@/lib/followup";
import { formatFCFA } from "@/lib/quotes";
import { WhatsAppSimulatorModal } from "@/components/simulator/WhatsAppSimulatorModal";
import { AddContactModal } from "@/components/contacts/AddContactModal";

export default function DashboardPage() {
  const { business, contacts, conversations, messages, catalog, faqs, appointments, quotes } = useApp();
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const [contactFilter, setContactFilter] = useState<string>("all");

  // Statistiques calculées
  const totalConversations = conversations.length;
  const totalContacts = contacts.length;
  const newContactsThisWeek = contacts.filter((c) => c.status === "nouveau" || c.status === "interesse").length;
  
  // Prospects inactifs > 3 jours à relancer
  const inactiveCount = contacts.filter((c) => {
    const conv = conversations.find((cv) => cv.contact_id === c.id);
    const convMessages = conv ? messages.filter((m) => m.conversation_id === conv.id) : [];
    return isContactEligibleForFollowup(c, business, conv, convMessages).eligible;
  }).length;
  
  // Taux de réponse IA
  const totalOutMessages = messages.filter((m) => m.direction === "out").length;
  const aiOutMessages = messages.filter((m) => m.sender === "ai").length;
  const aiRate = totalOutMessages > 0 ? Math.round((aiOutMessages / totalOutMessages) * 100) : 85;

  // Répartition par étape du pipeline
  const pipelineStats = [
    { label: "Nouveaux", status: "nouveau", count: contacts.filter((c) => c.status === "nouveau").length, color: "bg-blue-500" },
    { label: "Intéressés", status: "interesse", count: contacts.filter((c) => c.status === "interesse").length, color: "bg-indigo-500" },
    { label: "Visites / RDV", status: "rdv", count: contacts.filter((c) => c.status === "rdv").length, color: "bg-amber-500" },
    { label: "En Négociation", status: "negociation", count: contacts.filter((c) => c.status === "negociation").length, color: "bg-purple-500" },
    { label: "Clients Conclus", status: "client", count: contacts.filter((c) => c.status === "client").length, color: "bg-emerald-500" },
  ];

  // 5 derniers messages
  const recentMessages = [...messages].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

  // Filtrage des contacts pour la section Répertoire du Dashboard
  const filteredContacts = contacts.filter((c) => {
    const q = contactSearch.toLowerCase().trim();
    const matchesSearch =
      q === "" ||
      (c.name || "").toLowerCase().includes(q) ||
      c.wa_phone.includes(q) ||
      (c.need || "").toLowerCase().includes(q) ||
      (c.notes || "").toLowerCase().includes(q);
    const matchesFilter = contactFilter === "all" || c.status === contactFilter;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "nouveau":
        return { label: "Nouveau", cls: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800" };
      case "interesse":
        return { label: "Intéressé", cls: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800" };
      case "rdv":
        return { label: "Visite / RDV", cls: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800" };
      case "negociation":
        return { label: "Négociation", cls: "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800" };
      case "client":
        return { label: "Client Conclu", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" };
      case "perdu":
        return { label: "Archivé / Perdu", cls: "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800" };
      default:
        return { label: status, cls: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700" };
    }
  };

  return (
    <div className="p-3.5 sm:p-6 md:p-8 space-y-5 sm:space-y-8 max-w-7xl mx-auto">
      
      {/* Top Banner : Accueil et Statut */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-4.5 sm:p-6 md:p-8 shadow-xl border border-emerald-800/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] sm:text-xs font-semibold backdrop-blur-md border border-emerald-500/30">
              <Sparkles className="h-3.5 w-3.5" />
              Assistant Commercial WhatsApp Connecté
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight">
              Bonjour, {business.name} 👋
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/80 max-w-xl">
              Votre assistant IA Claude qualifie vos prospects WhatsApp 24h/24 au Sénégal. Vos données sont synchronisées en direct.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <button
              onClick={() => setIsSimulatorOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white text-slate-900 hover:bg-emerald-50 text-xs font-bold transition-all shadow-md hover:scale-[1.02] cursor-pointer flex-1 sm:flex-initial"
            >
              <Smartphone className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Tester le Simulateur</span>
            </button>
            <Link
              href="/app/inbox"
              className="inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-emerald-600/80 hover:bg-emerald-600 text-white text-xs font-bold backdrop-blur-md transition-all border border-emerald-500/40 flex-1 sm:flex-initial text-center"
            >
              <MessageSquare className="h-4 w-4 shrink-0" />
              <span>Ouvrir la boîte</span>
            </Link>
          </div>
        </div>

        {/* Effet décoratif de fond */}
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>
      </div>

      {/* Cartes KPIs (2 colonnes sur mobile, 4 sur desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        
        {/* KPI 1: Conversations */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Conversations
            </span>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
              <MessageSquare className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {totalConversations}
            </p>
            <span className="text-xs font-semibold text-emerald-600 flex items-center">
              <ArrowUpRight className="h-3.5 w-3.5" /> +28%
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Fils de discussion actifs</p>
        </div>

        {/* KPI 2: Prospects */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Prospects Qualifiés
            </span>
            <div className="h-8 w-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {totalContacts}
            </p>
            <span className="text-xs font-semibold text-emerald-600 flex items-center">
              <ArrowUpRight className="h-3.5 w-3.5" /> +{newContactsThisWeek} cette sem.
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Enregistrés dans le CRM</p>
        </div>

        {/* KPI 3: Taux IA */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Taux Réponse IA
            </span>
            <div className="h-8 w-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center">
              <Bot className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {aiRate}%
            </p>
            <span className="text-xs font-semibold text-purple-600 flex items-center">
              Claude 3.5
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Réponses automatisées rapides</p>
        </div>

        {/* KPI 4: Base de connaissances */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Connaissances
            </span>
            <div className="h-8 w-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {faqs.length + catalog.length}
            </p>
            <span className="text-xs font-semibold text-slate-500">
              {catalog.length} offres / {faqs.length} FAQs
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Sources d'entraînement IA</p>
        </div>

      </div>

      {/* Alerte Relance J+3 si des prospects sont sans retour */}
      {inactiveCount > 0 && (
        <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 border border-amber-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {inactiveCount} prospect{inactiveCount > 1 ? "s" : ""} sans retour depuis plus de 3 jours
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-extrabold uppercase">
                  Relance J+3
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Ces prospects ont reçu vos offres mais n'ont pas encore répondu. Une relance bienveillante augmente vos conversions de 45%.
              </p>
            </div>
          </div>

          <Link
            href="/app/prospects"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors flex items-center gap-1.5 self-start sm:self-auto shrink-0 shadow-xs"
          >
            <span>Voir et relancer</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* Grid Central : Pipeline Commercial & Activité en Direct */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Colonne 1 & 2 : Pipeline Kanban Progression */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Avancement du Pipeline Commercial
              </h2>
              <p className="text-xs text-slate-500">
                Suivi des opportunités générées depuis WhatsApp
              </p>
            </div>
            <Link
              href="/app/prospects"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-500 flex items-center gap-1"
            >
              Voir le Kanban <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Barres de pipeline */}
          <div className="space-y-4">
            {pipelineStats.map((item) => {
              const percentage = totalContacts > 0 ? Math.round((item.count / totalContacts) * 100) : 0;
              return (
                <div key={item.status} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {item.label}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {item.count} prospect{item.count > 1 ? "s" : ""} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.max(percentage, 5)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Raccourcis d'actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              href="/app/connaissances"
              className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-slate-200/80 dark:border-slate-800 transition-colors text-center block"
            >
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                + Ajouter une FAQ
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Pour enrichir l'IA</p>
            </Link>

            <Link
              href="/app/catalogue"
              className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-slate-200/80 dark:border-slate-800 transition-colors text-center block"
            >
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                Catalogue Produits & Biens
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">{catalog.length} offres actives</p>
            </Link>

            <Link
              href="/app/parametres"
              className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-slate-200/80 dark:border-slate-800 transition-colors text-center block"
            >
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                Réglages IA & WhatsApp
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Ton, accueil, webhook</p>
            </Link>
          </div>
        </div>

        {/* Colonne 3 : Derniers Messages Reçus en direct */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Activité Récente
            </h2>
            <Link
              href="/app/inbox"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-500 flex items-center gap-1"
            >
              Ouvrir <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 space-y-3 pt-1">
            {recentMessages.map((msg) => {
              const conv = conversations.find((c) => c.id === msg.conversation_id);
              const contactName = conv?.contact?.name || "Prospect WhatsApp";

              return (
                <div key={msg.id} className="pt-3 first:pt-0">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-900 dark:text-white truncate">
                      {contactName}
                    </span>
                    <span className="text-[10px] text-slate-400" suppressHydrationWarning>
                      {formatDate(msg.created_at)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {msg.body}
                  </p>

                  <div className="mt-1.5 flex items-center gap-2">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        msg.sender === "ai"
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                          : msg.sender === "agent"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                      }`}
                    >
                      {msg.sender === "ai" ? "IA Claude" : msg.sender === "agent" ? "Agent Humain" : "Client"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* NOUVELLE SECTION : Contacts & Prospects Répertoire */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        
        {/* En-tête de section avec compteurs et raccourcis */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Contacts & Prospects Répertoire
                </h2>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300/40">
                  {totalContacts} contacts enregistrés
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Accédez directement à vos prospects qualifiés, contacts importés et lancez vos échanges WhatsApp
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
            <button
              onClick={() => setIsAddContactOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>+ Nouveau Contact</span>
            </button>

            <Link
              href="/app/import"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-xs"
            >
              <UploadCloud className="h-3.5 w-3.5 text-emerald-600" />
              <span>Importer (CSV)</span>
            </Link>

            <Link
              href="/app/prospects"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all shadow-xs"
            >
              <span>Pipeline CRM</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Barre de recherche et Filtres par statut */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={contactSearch}
              onChange={(e) => setContactSearch(e.target.value)}
              placeholder="Rechercher par nom, téléphone (+221...), projet..."
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: "all", label: "Tous", count: totalContacts },
              { id: "nouveau", label: "Nouveaux", count: contacts.filter((c) => c.status === "nouveau").length },
              { id: "interesse", label: "Intéressés", count: contacts.filter((c) => c.status === "interesse").length },
              { id: "rdv", label: "RDV / Visites", count: contacts.filter((c) => c.status === "rdv").length },
              { id: "client", label: "Clients", count: contacts.filter((c) => c.status === "client").length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setContactFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors shrink-0 ${
                  contactFilter === tab.id
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* Grille des fiches contacts (Aperçu des 6 plus récents) */}
        {filteredContacts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
              {filteredContacts.slice(0, 6).map((c) => {
                const badge = getStatusBadge(c.status);
                const cleanPhone = c.wa_phone.replace(/\D/g, "");
                const waLink = `https://wa.me/${cleanPhone}`;
                const initials = (c.name || "P")
                  .split(" ")
                  .map((w) => w[0])
                  .filter(Boolean)
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();

                return (
                  <div
                    key={c.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between gap-3 hover:border-emerald-500/40 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                          {initials || "WA"}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                            {c.name || "Prospect Sans Nom"}
                          </h4>
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 hover:underline mt-0.5"
                          >
                            <Phone className="h-2.5 w-2.5" />
                            <span>{c.wa_phone}</span>
                          </a>
                        </div>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </div>

                    {/* Projet / Besoin / Notes */}
                    <div className="bg-white dark:bg-slate-900/60 rounded-xl p-2.5 border border-slate-200/60 dark:border-slate-800 text-[11px] space-y-1">
                      <p className="font-semibold text-slate-700 dark:text-slate-200 line-clamp-1">
                        {c.need ? `🎯 ${c.need}` : "📝 Aucun besoin qualifié pour l'instant"}
                      </p>
                      {c.budget && (
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                          Budget : {c.budget}
                        </p>
                      )}
                      {c.notes && c.notes !== "Importé via fichier" && (
                        <p className="text-[10px] text-slate-400 line-clamp-1 italic">
                          {c.notes}
                        </p>
                      )}
                    </div>

                    {/* Boutons d'action rapide */}
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                        title="Ouvrir discussion WhatsApp"
                      >
                        <MessageSquare className="h-3 w-3" />
                        <span>WhatsApp</span>
                      </a>

                      <Link
                        href={`/app/devis?client=${encodeURIComponent(c.name || "")}&phone=${encodeURIComponent(c.wa_phone)}`}
                        className="py-1.5 px-2.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[11px] border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-colors"
                        title="Créer un devis pour ce prospect"
                      >
                        <FileText className="h-3 w-3 text-emerald-500" />
                        <span>Devis</span>
                      </Link>

                      <Link
                        href="/app/prospects"
                        className="py-1.5 px-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 text-[11px] border border-slate-200 dark:border-slate-700"
                        title="Gérer dans le pipeline"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pied de liste : indicateur et lien vers tous les contacts */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs border-t border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 text-[11px]">
                {filteredContacts.length > 6
                  ? `Affichage des 6 premiers contacts sur un total de ${filteredContacts.length} trouvés.`
                  : `${filteredContacts.length} contact${filteredContacts.length > 1 ? "s" : ""} affiché${filteredContacts.length > 1 ? "s" : ""}.`}
              </span>

              <Link
                href="/app/prospects"
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>Accéder au CRM complet avec glisser-déposer Kanban</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </>
        ) : (
          /* État vide si aucun contact trouvé avec le filtre / recherche */
          <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-white">
                {contactSearch ? "Aucun contact ne correspond à votre recherche" : "Aucun contact enregistré"}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {contactSearch
                  ? "Essayez avec un autre mot-clé ou réinitialisez les filtres."
                  : "Importez votre fichier Excel / Google Contacts pour alimenter votre base commerciale."}
              </p>
            </div>
            {contactSearch ? (
              <button
                onClick={() => { setContactSearch(""); setContactFilter("all"); }}
                className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
              >
                Réinitialiser la recherche
              </button>
            ) : (
              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                <button
                  onClick={() => setIsAddContactOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 shadow-md transition-all cursor-pointer"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>+ Nouveau Contact</span>
                </button>
                <Link
                  href="/app/import"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  <UploadCloud className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Importer mes contacts</span>
                </Link>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Section : Prochains Rendez-vous Google Agenda */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
              <CalendarDays className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Prochains Rendez-vous & Visites Google Agenda
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                  Sync Active
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Créneaux réservés automatiquement par l'IA WhatsApp ou planifiés par votre équipe
              </p>
            </div>
          </div>

          <Link
            href="/app/rendez-vous"
            className="text-xs font-bold text-emerald-600 hover:text-emerald-500 flex items-center gap-1"
          >
            Voir tous les rendez-vous <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {appointments.slice(0, 3).map((appt) => (
            <div
              key={appt.id}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-3 hover:border-emerald-500/40 transition-colors"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {formatAppointmentSlot(appt.start_time, appt.end_time)}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400">
                    Confirmé
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                  {appt.title}
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-1">
                  Prospect : <strong className="text-slate-700 dark:text-slate-300">{appt.contact_name}</strong> ({appt.contact_phone})
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-slate-200/50 dark:border-slate-700/50 text-xs">
                {appt.google_calendar_url && (
                  <a
                    href={appt.google_calendar_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-1.5 px-2 rounded-lg bg-white dark:bg-slate-800 text-center font-bold text-[11px] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1"
                  >
                    <CalendarDays className="h-3 w-3 text-emerald-500" />
                    Google Agenda
                  </a>
                )}
                {appt.google_meet_link && (
                  <a
                    href={appt.google_meet_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-1.5 px-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold text-[11px] hover:bg-blue-100 flex items-center gap-1"
                    title="Google Meet"
                  >
                    <Video className="h-3 w-3" />
                    Meet
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section : Derniers Devis & Offres Commerciales */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Derniers Devis & Offres Commerciales
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                  {quotes.length} Devis
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Propositions proformas envoyées aux prospects WhatsApp
              </p>
            </div>
          </div>

          <Link
            href="/app/devis"
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>Gérer tous les devis</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {quotes.slice(0, 4).map((q) => (
            <div
              key={q.id}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2 hover:border-emerald-500/40 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                  {q.quote_number}
                </span>
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    q.status === "accepte"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                      : q.status === "envoye"
                      ? "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400"
                      : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                  }`}
                >
                  {q.status === "accepte" ? "Signé" : q.status === "envoye" ? "Envoyé WA" : "Brouillon"}
                </span>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {q.contact_name}
                </p>
                <p className="text-[11px] text-slate-500 truncate">{q.title}</p>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                <span className="text-xs font-mono font-extrabold text-slate-900 dark:text-white">
                  {formatFCFA(q.total_amount)}
                </span>
                <Link
                  href="/app/devis"
                  className="text-[10px] font-bold text-emerald-600 hover:underline"
                >
                  Voir
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      <WhatsAppSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
      />

      <AddContactModal
        isOpen={isAddContactOpen}
        onClose={() => setIsAddContactOpen(false)}
      />
    </div>
  );
}
