"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store";
import {
  Search,
  Kanban,
  List,
  ChevronRight,
  ChevronLeft,
  Phone,
  MessageSquare,
  Clock,
  Send,
  Sparkles,
  CheckCircle2,
  X,
  UploadCloud,
  Plus,
  UserPlus,
  Compass
} from "lucide-react";
import { PipelineStatus, Contact } from "@/types/database";
import {
  isContactEligibleForFollowup,
  calculateDaysInactive,
  generateFollowUpMessage
} from "@/lib/followup";
import { AddContactModal } from "@/components/contacts/AddContactModal";

const PIPELINE_COLUMNS: Array<{ id: PipelineStatus; label: string; color: string; badgeBg: string }> = [
  { id: "nouveau", label: "Nouveaux", color: "border-blue-500", badgeBg: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" },
  { id: "interesse", label: "Intéressés", color: "border-indigo-500", badgeBg: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300" },
  { id: "rdv", label: "Visites / RDV", color: "border-amber-500", badgeBg: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" },
  { id: "negociation", label: "Négociation", color: "border-purple-500", badgeBg: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300" },
  { id: "client", label: "Clients Conclus", color: "border-emerald-500", badgeBg: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" },
  { id: "perdu", label: "Perdus", color: "border-rose-500", badgeBg: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300" }
];

export default function ProspectsPage() {
  const {
    business,
    contacts,
    conversations,
    messages,
    updateContactStatus,
    setSelectedConversationId,
    sendFollowUp,
    sendBatchFollowUps
  } = useApp();

  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOnlyInactive, setFilterOnlyInactive] = useState(false);
  const [mobileColumnFilter, setMobileColumnFilter] = useState<PipelineStatus | "all">("all");

  // État de modal d'ajout de contact
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [addContactDefaultStatus, setAddContactDefaultStatus] = useState<PipelineStatus>("nouveau");

  // État de modal de relance
  const [selectedContactForFollowup, setSelectedContactForFollowup] = useState<Contact | null>(null);
  const [customFollowupMessage, setCustomFollowupMessage] = useState("");
  const [isSendingFollowup, setIsSendingFollowup] = useState(false);
  const [followupFeedback, setFollowupFeedback] = useState<string | null>(null);
  const [isBatchSending, setIsBatchSending] = useState(false);

  // Détection des prospects inactifs > 3 jours
  const inactiveEligibleContacts = useMemo(() => {
    return contacts.filter((c) => {
      const conv = conversations.find((cv) => cv.contact_id === c.id);
      const convMessages = conv ? messages.filter((m) => m.conversation_id === conv.id) : [];
      return isContactEligibleForFollowup(c, business, conv, convMessages).eligible;
    });
  }, [contacts, conversations, messages, business]);

  // Filtrage combiné (Recherche + Inactivité)
  const filteredContacts = useMemo(() => {
    return contacts
      .filter((c) => {
        if (!filterOnlyInactive) return true;
        const conv = conversations.find((cv) => cv.contact_id === c.id);
        const convMessages = conv ? messages.filter((m) => m.conversation_id === conv.id) : [];
        return isContactEligibleForFollowup(c, business, conv, convMessages).eligible;
      })
      .filter((c) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const matchName = c.name?.toLowerCase().includes(q) || false;
        const matchPhone = c.wa_phone.includes(q);
        const matchNeed = c.need?.toLowerCase().includes(q) || false;
        return matchName || matchPhone || matchNeed;
      });
  }, [contacts, filterOnlyInactive, searchQuery, conversations, messages, business]);

  const moveContactStatus = (contactId: string, currentStatus: PipelineStatus, direction: "next" | "prev") => {
    const currentIndex = PIPELINE_COLUMNS.findIndex((col) => col.id === currentStatus);
    if (direction === "next" && currentIndex < PIPELINE_COLUMNS.length - 1) {
      updateContactStatus(contactId, PIPELINE_COLUMNS[currentIndex + 1].id);
    } else if (direction === "prev" && currentIndex > 0) {
      updateContactStatus(contactId, PIPELINE_COLUMNS[currentIndex - 1].id);
    }
  };

  const handleOpenConversation = (contactId: string) => {
    const conv = conversations.find((c) => c.contact_id === contactId);
    if (conv) {
      setSelectedConversationId(conv.id);
    }
  };

  // Ouverture modal de relance individuelle
  const handleOpenFollowupModal = (contact: Contact) => {
    setSelectedContactForFollowup(contact);
    setCustomFollowupMessage(generateFollowUpMessage(contact, business));
  };

  // Envoi de la relance individuelle
  const handleConfirmFollowup = async () => {
    if (!selectedContactForFollowup) return;
    setIsSendingFollowup(true);
    try {
      await sendFollowUp(selectedContactForFollowup.id, customFollowupMessage);
      setFollowupFeedback(`Relance WhatsApp envoyée avec succès à ${selectedContactForFollowup.name || "ce prospect"} !`);
      setSelectedContactForFollowup(null);
      setTimeout(() => setFollowupFeedback(null), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSendingFollowup(false);
    }
  };

  // Relance groupée de tous les prospects inactifs
  const handleBatchFollowUp = async () => {
    if (inactiveEligibleContacts.length === 0) return;
    setIsBatchSending(true);
    try {
      const ids = inactiveEligibleContacts.map((c) => c.id);
      const res = await sendBatchFollowUps(ids);
      setFollowupFeedback(`${res.sentCount} prospects inactifs relancés avec succès sur WhatsApp !`);
      setTimeout(() => setFollowupFeedback(null), 5000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsBatchSending(false);
    }
  };

  return (
    <div className="p-3.5 sm:p-6 md:p-8 space-y-5 sm:space-y-6 max-w-7xl mx-auto">
      
      {/* Toast Feedback */}
      {followupFeedback && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-bold animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="h-4 w-4" />
          <span>{followupFeedback}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            Prospects & Pipeline Commercial
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
              {contacts.length} prospects
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Qualifiés automatiquement par Claude Sonnet depuis WhatsApp avec relance intelligente J+3.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={() => {
              setAddContactDefaultStatus("nouveau");
              setIsAddContactOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/25 transition-all cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            <span>+ Nouveau Contact</span>
          </button>

          <Link
            href="/app/prospection"
            className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600/10 to-teal-600/10 hover:from-emerald-600/20 hover:to-teal-600/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 shadow-xs transition-colors"
          >
            <Compass className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Scraper Maps</span>
          </Link>

          <Link
            href="/app/import"
            className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-emerald-600 hover:border-emerald-500/50 shadow-xs transition-colors"
          >
            <UploadCloud className="h-3.5 w-3.5 text-emerald-600" />
            <span>Importer (CSV)</span>
          </Link>

          {/* Toggle Kanban / Liste */}
          <div className="flex items-center p-1 rounded-xl bg-slate-200/80 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs">
            <button
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                viewMode === "kanban"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              <Kanban className="h-3.5 w-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                viewMode === "list"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bannière de Relance Intelligente J+3 (Si des prospects sont sans retour) */}
      {inactiveEligibleContacts.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 border border-amber-500/30 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {inactiveEligibleContacts.length} prospect{inactiveEligibleContacts.length > 1 ? "s" : ""} sans retour depuis plus de 3 jours
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-extrabold uppercase tracking-wider">
                  Relance J+3 recommandée
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Ne perdez pas ces ventes : {inactiveEligibleContacts.map((c) => c.name || "Prospect").slice(0, 3).join(", ")}
                {inactiveEligibleContacts.length > 3 ? ` et ${inactiveEligibleContacts.length - 3} autres` : ""} attendent une prise de contact bienveillante.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
            <button
              onClick={() => setFilterOnlyInactive(!filterOnlyInactive)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors ${
                filterOnlyInactive
                  ? "bg-amber-500 text-slate-950 border-amber-500 shadow-sm"
                  : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {filterOnlyInactive ? "Afficher tous les prospects" : "Filtrer (+3j inactifs)"}
            </button>

            <button
              onClick={handleBatchFollowUp}
              disabled={isBatchSending}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors flex items-center gap-2 shadow-sm shadow-amber-500/20 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              <span>
                {isBatchSending
                  ? "Envoi en cours..."
                  : `Relancer tout le monde (${inactiveEligibleContacts.length})`}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Barre d'outils et recherche */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, téléphone, besoin..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
          />
        </div>

        {filterOnlyInactive && (
          <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
            <span>Filtre actif : Prospects sans réponse depuis +3j ({filteredContacts.length})</span>
            <button
              onClick={() => setFilterOnlyInactive(false)}
              className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500"
              title="Réinitialiser le filtre"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* VUE 1 : KANBAN */}
      {viewMode === "kanban" && (
        <div className="space-y-4">
          
          {/* Sélecteur d'étape sur mobile */}
          <div className="md:hidden flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setMobileColumnFilter("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors cursor-pointer ${
                mobileColumnFilter === "all"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              }`}
            >
              Toutes les étapes ({filteredContacts.length})
            </button>
            {PIPELINE_COLUMNS.map((col) => {
              const count = filteredContacts.filter((c) => c.status === col.id).length;
              return (
                <button
                  key={col.id}
                  onClick={() => setMobileColumnFilter(col.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors cursor-pointer ${
                    mobileColumnFilter === col.id
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {col.label} ({count})
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-4">
            {PIPELINE_COLUMNS
              .filter((col) => mobileColumnFilter === "all" || col.id === mobileColumnFilter)
              .map((col) => {
                const columnContacts = filteredContacts.filter((c) => c.status === col.id);

            return (
              <div
                key={col.id}
                className="bg-slate-100/70 dark:bg-slate-900/60 rounded-2xl p-3 border border-slate-200/80 dark:border-slate-800 flex flex-col min-w-[240px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {col.label}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${col.badgeBg}`}>
                      {columnContacts.length}
                    </span>
                    <button
                      onClick={() => {
                        setAddContactDefaultStatus(col.id);
                        setIsAddContactOpen(true);
                      }}
                      className="h-5 w-5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-emerald-600 flex items-center justify-center transition-colors cursor-pointer"
                      title={`Ajouter un contact en statut ${col.label}`}
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Cards Container */}
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {columnContacts.length === 0 ? (
                    <div className="py-8 text-center text-[11px] text-slate-400 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl">
                      Aucun prospect
                    </div>
                  ) : (
                    columnContacts.map((contact) => {
                      const conv = conversations.find((cv) => cv.contact_id === contact.id);
                      const convMessages = conv ? messages.filter((m) => m.conversation_id === conv.id) : [];
                      const eligibility = isContactEligibleForFollowup(contact, business, conv, convMessages);

                      return (
                        <div
                          key={contact.id}
                          className="bg-white dark:bg-slate-900 rounded-xl p-3.5 shadow-xs border border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow group relative"
                        >
                          <div className="flex items-start justify-between">
                            <Link
                              href={`/app/prospects/${contact.id}`}
                              className="font-bold text-xs text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 truncate"
                            >
                              {contact.name || "Prospect inconnu"}
                            </Link>

                            <Link
                              href="/app/inbox"
                              onClick={() => handleOpenConversation(contact.id)}
                              className="text-slate-400 hover:text-emerald-600 transition-colors"
                              title="Ouvrir sur WhatsApp Inbox"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                            </Link>
                          </div>

                          <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {contact.wa_phone}
                          </p>

                          {contact.need && (
                            <div className="mt-2.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-300 line-clamp-2">
                              <span className="font-semibold text-emerald-600">Besoin:</span> {contact.need}
                            </div>
                          )}

                          {contact.budget && (
                            <div className="mt-2 flex items-center justify-between text-[11px]">
                              <span className="text-slate-400">Budget:</span>
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                {contact.budget}
                              </span>
                            </div>
                          )}

                          {/* Alerte et action de Relance J+3 */}
                          {eligibility.eligible && (
                            <div className="mt-3 p-2 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-1">
                              <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                <Clock className="h-3 w-3 shrink-0" />
                                <span>{eligibility.daysInactive}j sans retour</span>
                              </div>
                              <button
                                onClick={() => handleOpenFollowupModal(contact)}
                                className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors flex items-center gap-1 shadow-xs shrink-0"
                              >
                                <Send className="h-2.5 w-2.5" />
                                <span>Relancer</span>
                              </button>
                            </div>
                          )}

                          {contact.followup_status === "sent" && !eligibility.eligible && (
                            <div className="mt-2.5 px-2 py-1 rounded-lg bg-emerald-500/10 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 shrink-0" />
                              <span>Relance envoyée ({contact.followup_count || 1})</span>
                            </div>
                          )}

                          {/* Boutons de déplacement rapide dans le pipeline */}
                          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <button
                              onClick={() => moveContactStatus(contact.id, col.id, "prev")}
                              disabled={col.id === "nouveau"}
                              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 disabled:opacity-20"
                              title="Étape précédente"
                            >
                              <ChevronLeft className="h-3.5 w-3.5" />
                            </button>

                            <Link
                              href={`/app/prospects/${contact.id}`}
                              className="text-[10px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                            >
                              Détails →
                            </Link>

                            <button
                              onClick={() => moveContactStatus(contact.id, col.id, "next")}
                              disabled={col.id === "perdu"}
                              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 disabled:opacity-20"
                              title="Étape suivante"
                            >
                              <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
          </div>
        </div>
      )}

      {/* VUE 2 : TABLE LISTE */}
      {viewMode === "list" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Prospect</th>
                  <th className="px-5 py-3.5">Téléphone WhatsApp</th>
                  <th className="px-5 py-3.5">Statut Pipeline</th>
                  <th className="px-5 py-3.5">Inactivité / Relance</th>
                  <th className="px-5 py-3.5">Besoin Qualifié</th>
                  <th className="px-5 py-3.5">Budget Estimé</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredContacts.map((contact) => {
                  const conv = conversations.find((cv) => cv.contact_id === contact.id);
                  const convMessages = conv ? messages.filter((m) => m.conversation_id === conv.id) : [];
                  const eligibility = isContactEligibleForFollowup(contact, business, conv, convMessages);

                  return (
                    <tr key={contact.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white">
                        <Link href={`/app/prospects/${contact.id}`} className="hover:text-emerald-600">
                          {contact.name || "Prospect inconnu"}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400">
                        {contact.wa_phone}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase">
                          {contact.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {eligibility.eligible ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold text-[10px]">
                            <Clock className="h-3 w-3" />
                            <span>{eligibility.daysInactive} jours sans réponse</span>
                          </div>
                        ) : contact.followup_status === "sent" ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" /> Relancé ({contact.followup_count || 1})
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Actif récemment</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-slate-700 dark:text-slate-300 max-w-xs truncate">
                        {contact.need || "—"}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-emerald-600 dark:text-emerald-400">
                        {contact.budget || "—"}
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-2">
                        {eligibility.eligible && (
                          <button
                            onClick={() => handleOpenFollowupModal(contact)}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors inline-flex items-center gap-1"
                          >
                            <Send className="h-3 w-3" />
                            <span>Relancer</span>
                          </button>
                        )}
                        <Link
                          href={`/app/prospects/${contact.id}`}
                          className="font-semibold text-emerald-600 hover:underline"
                        >
                          Consulter
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Prévisualisation et Envoi de Relance */}
      {selectedContactForFollowup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-white space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                    <Send className="h-4 w-4" />
                  </span>
                  <h3 className="text-base font-bold text-white">
                    Relancer {selectedContactForFollowup.name || "le prospect"} sur WhatsApp
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Ce prospect n'a pas répondu depuis plus de 3 jours. Vérifiez et personnalisez le message ci-dessous :
                </p>
              </div>

              <button
                onClick={() => setSelectedContactForFollowup(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Informations prospect */}
            <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Destinataire WhatsApp</span>
                <span className="font-bold text-white">
                  {selectedContactForFollowup.name || "Client"} ({selectedContactForFollowup.wa_phone})
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[10px]">Inactivité constatée</span>
                <span className="font-bold text-amber-400">
                  {calculateDaysInactive(selectedContactForFollowup)} jours de silence
                </span>
              </div>
            </div>

            {/* Zone de texte modifiable (Texte saisi en blanc haute visibilité) */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center justify-between">
                <span>Message de relance WhatsApp (généré par Claude)</span>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Ton Téranga
                </span>
              </label>
              <textarea
                rows={5}
                value={customFollowupMessage}
                onChange={(e) => setCustomFollowupMessage(e.target.value)}
                className="w-full text-xs p-3.5 rounded-2xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium resize-none leading-relaxed"
                placeholder="Votre message de relance..."
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedContactForFollowup(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={handleConfirmFollowup}
                disabled={isSendingFollowup || !customFollowupMessage.trim()}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{isSendingFollowup ? "Envoi de la relance..." : "Envoyer la relance WhatsApp"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'ajout de contact */}
      <AddContactModal
        isOpen={isAddContactOpen}
        onClose={() => setIsAddContactOpen(false)}
        defaultStatus={addContactDefaultStatus}
      />

    </div>
  );
}
