"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/lib/store";
import {
  ArrowLeft,
  Phone,
  MessageSquare,
  Save,
  Check,
  CalendarDays,
  Video,
  Clock,
  Send,
  Sparkles,
  CheckCircle2,
  X
} from "lucide-react";
import { PipelineStatus } from "@/types/database";
import { formatDate } from "@/lib/utils";
import { formatAppointmentSlot } from "@/lib/calendar";
import {
  isContactEligibleForFollowup,
  calculateDaysInactive,
  generateFollowUpMessage
} from "@/lib/followup";

const STATUS_OPTIONS: Array<{ value: PipelineStatus; label: string }> = [
  { value: "nouveau", label: "Nouveau (Premier contact)" },
  { value: "interesse", label: "Intéressé (Questions spécifiques)" },
  { value: "rdv", label: "Visite / Rendez-vous planifié" },
  { value: "negociation", label: "Négociation & Devis" },
  { value: "client", label: "Client (Vente / Bail conclu)" },
  { value: "perdu", label: "Perdu / Sans suite" },
];

export default function ProspectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contactId = params?.id as string;
  const {
    contacts,
    updateContact,
    conversations,
    messages,
    setSelectedConversationId,
    appointments,
    business,
    sendFollowUp
  } = useApp();

  const contact = contacts.find((c) => c.id === contactId);
  const conversation = conversations.find((c) => c.contact_id === contactId);
  const contactMessages = conversation
    ? messages.filter((m) => m.conversation_id === conversation.id)
    : [];

  const contactAppointments = appointments.filter(
    (a) => a.contact_id === contactId || (contact && a.contact_phone === contact.wa_phone)
  );

  // Éligibilité et inactivité
  const eligibility = contact
    ? isContactEligibleForFollowup(contact, business, conversation, contactMessages)
    : { eligible: false, daysInactive: 0 };
  const daysInactive = contact
    ? calculateDaysInactive(contact, conversation, contactMessages)
    : 0;

  // États locaux de modification
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<PipelineStatus>("nouveau");
  const [need, setNeed] = useState("");
  const [budget, setBudget] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  // État de relance
  const [isFollowupModalOpen, setIsFollowupModalOpen] = useState(false);
  const [followupMessage, setFollowupMessage] = useState("");
  const [isSendingFollowup, setIsSendingFollowup] = useState(false);
  const [followupSuccess, setFollowupSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (contact) {
      setName(contact.name || "");
      setPhone(contact.wa_phone || "");
      setStatus(contact.status);
      setNeed(contact.need || "");
      setBudget(contact.budget || "");
      setNotes(contact.notes || "");
    }
  }, [contact]);

  if (!contact) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center space-y-4">
        <p className="text-sm text-slate-500">Prospect introuvable.</p>
        <Link
          href="/app/prospects"
          className="inline-flex items-center gap-2 text-xs font-bold text-emerald-600"
        >
          <ArrowLeft className="h-4 w-4" /> Retour aux prospects
        </Link>
      </div>
    );
  }

  const handleSave = () => {
    updateContact(contact.id, {
      name,
      wa_phone: phone,
      status,
      need,
      budget,
      notes,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleOpenInbox = () => {
    if (conversation) {
      setSelectedConversationId(conversation.id);
      router.push("/app/inbox");
    }
  };

  const handleOpenFollowupModal = () => {
    if (!contact) return;
    setFollowupMessage(generateFollowUpMessage(contact, business));
    setIsFollowupModalOpen(true);
  };

  const handleSendFollowup = async () => {
    if (!contact) return;
    setIsSendingFollowup(true);
    try {
      await sendFollowUp(contact.id, followupMessage);
      setFollowupSuccess("Relance WhatsApp envoyée avec succès !");
      setIsFollowupModalOpen(false);
      setTimeout(() => setFollowupSuccess(null), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSendingFollowup(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto">
      
      {/* Toast Feedback */}
      {followupSuccess && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-bold animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="h-4 w-4" />
          <span>{followupSuccess}</span>
        </div>
      )}

      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/app/prospects"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Retour à la liste
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenInbox}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 transition-colors"
          >
            <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
            Ouvrir la discussion
          </button>

          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/30 transition-all"
          >
            {isSaved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {isSaved ? "Enregistré !" : "Sauvegarder"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Colonne 1 & 2 : Fiche Prospect Éditable */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-5">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-emerald-600 text-white font-extrabold text-lg flex items-center justify-center shadow-md shadow-emerald-600/20">
                  {name ? name.slice(0, 2).toUpperCase() : "WA"}
                </div>
                <div>
                  <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
                    {name || "Prospect sans nom"}
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-emerald-600" />
                    {phone}
                  </p>
                </div>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 uppercase">
                {status}
              </span>
            </div>

            {/* Champs du formulaire */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Nom complet
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Numéro WhatsApp
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Étape dans le Pipeline
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as PipelineStatus)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Budget estimé (FCFA)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 850 000 FCFA"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Besoin ou Bien recherché (Qualifié par l'IA)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Recherche Appartement 3 chambres aux Almadies"
                  value={need}
                  onChange={(e) => setNeed(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Notes internes & Suivi d'équipe
                </label>
                <textarea
                  rows={4}
                  placeholder="Ajoutez des notes confidentielles sur le prospect (visite, préférences, urgence...)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed font-medium"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span suppressHydrationWarning>Créé le : {formatDate(contact.created_at)}</span>
              <span suppressHydrationWarning>Dernière mise à jour : {formatDate(contact.updated_at)}</span>
            </div>

          </div>
        </div>

        {/* Colonne 3 : Relance, Historique des échanges WhatsApp & Agenda */}
        <div className="space-y-4">
          
          {/* Carte Suivi d'Inactivité & Relance WhatsApp J+3 */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                Relances & Inactivité (J+3)
              </h2>
              {eligibility.eligible && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-extrabold uppercase tracking-wider">
                  À relancer
                </span>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Inactivité constatée :</span>
                <span className={`font-bold ${daysInactive >= 3 ? "text-amber-500" : "text-slate-700 dark:text-slate-300"}`}>
                  {daysInactive === 0 ? "Actif aujourd'hui" : `${daysInactive} jour${daysInactive > 1 ? "s" : ""} sans réponse`}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Relances effectuées :</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {contact.followup_count || 0} / {business.followup_max_attempts || 2}
                </span>
              </div>

              {contact.last_followup_at && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Dernière relance :</span>
                  <span className="text-slate-600 dark:text-slate-400 text-[11px]" suppressHydrationWarning>
                    {formatDate(contact.last_followup_at)}
                  </span>
                </div>
              )}

              {eligibility.eligible ? (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-600 dark:text-amber-400 space-y-2">
                  <p className="text-[11px] font-medium leading-relaxed">
                    Ce prospect n'a pas répondu depuis {daysInactive} jours. Envoyez-lui une relance bienveillante pour relancer la négociation.
                  </p>
                  <button
                    onClick={handleOpenFollowupModal}
                    className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm shadow-amber-500/20"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Envoyer la relance WhatsApp J+3</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleOpenFollowupModal}
                  className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors flex items-center justify-center gap-2"
                >
                  <Send className="h-3.5 w-3.5 text-slate-400" />
                  <span>Envoyer un message de relance</span>
                </button>
              )}
            </div>
          </div>

          {/* Carte Échanges WhatsApp */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-emerald-600" />
                Échanges WhatsApp ({contactMessages.length})
              </h2>
            </div>

            <div className="max-h-[500px] overflow-y-auto space-y-3 pr-1">
              {contactMessages.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">
                  Aucun message enregistré.
                </p>
              ) : (
                contactMessages.map((msg) => {
                  const isOut = msg.direction === "out";

                  return (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-2xl text-xs space-y-1 ${
                        isOut
                          ? "bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 ml-4"
                          : "bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 mr-4"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                        <span>
                          {msg.sender === "ai"
                            ? "🤖 Izimarket IA"
                            : msg.sender === "agent"
                            ? "👤 Agent"
                            : "📱 Client"}
                        </span>
                        <span suppressHydrationWarning>{formatDate(msg.created_at)}</span>
                      </div>
                      <p className="text-slate-800 dark:text-slate-200 leading-relaxed">
                        {msg.body}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={handleOpenInbox}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors text-center block"
              >
                Répondre dans la boîte de réception
              </button>
            </div>
          </div>

          {/* Rendez-vous Google Agenda du prospect */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-emerald-600" />
                Rendez-vous Google Agenda ({contactAppointments.length})
              </h2>
              <Link
                href="/app/rendez-vous"
                className="text-[11px] font-bold text-emerald-600 hover:text-emerald-500"
              >
                + Planifier
              </Link>
            </div>

            {contactAppointments.length === 0 ? (
              <div className="text-center py-5 space-y-2">
                <p className="text-xs text-slate-400">
                  Aucun rendez-vous planifié pour ce prospect.
                </p>
                <Link
                  href="/app/rendez-vous"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                >
                  <CalendarDays className="h-3.5 w-3.5 text-emerald-600" />
                  Bloquer un créneau Google
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {contactAppointments.map((appt) => (
                  <div
                    key={appt.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-2"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {formatAppointmentSlot(appt.start_time, appt.end_time)}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400">
                        {appt.status === "confirmed" ? "Confirmé" : appt.status}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {appt.title}
                    </p>

                    <div className="flex items-center gap-2 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                      {appt.google_calendar_url && (
                        <a
                          href={appt.google_calendar_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-1.5 px-2 rounded-lg bg-white dark:bg-slate-800 text-center text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1"
                        >
                          <CalendarDays className="h-3 w-3 text-emerald-500" />
                          Agenda
                        </a>
                      )}
                      {appt.google_meet_link && (
                        <a
                          href={appt.google_meet_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-1.5 px-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-[11px] font-bold hover:bg-blue-100 flex items-center gap-1"
                        >
                          <Video className="h-3 w-3" />
                          Meet
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Modal Prévisualisation et Envoi de Relance */}
      {isFollowupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-white space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                    <Send className="h-4 w-4" />
                  </span>
                  <h3 className="text-base font-bold text-white">
                    Relancer {contact.name || "le prospect"} sur WhatsApp
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Ce prospect n'a pas répondu depuis {daysInactive} jours. Personnalisez votre message de relance :
                </p>
              </div>

              <button
                onClick={() => setIsFollowupModalOpen(false)}
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
                  {contact.name || "Client"} ({contact.wa_phone})
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[10px]">Inactivité constatée</span>
                <span className="font-bold text-amber-400">
                  {daysInactive} jours de silence
                </span>
              </div>
            </div>

            {/* Zone de texte modifiable (Texte en blanc haute lisibilité) */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center justify-between">
                <span>Message de relance WhatsApp (généré par Izimarket)</span>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Ton Téranga
                </span>
              </label>
              <textarea
                rows={5}
                value={followupMessage}
                onChange={(e) => setFollowupMessage(e.target.value)}
                className="w-full text-xs p-3.5 rounded-2xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium resize-none leading-relaxed"
                placeholder="Votre message de relance..."
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsFollowupModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={handleSendFollowup}
                disabled={isSendingFollowup || !followupMessage.trim()}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{isSendingFollowup ? "Envoi en cours..." : "Envoyer la relance WhatsApp"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
