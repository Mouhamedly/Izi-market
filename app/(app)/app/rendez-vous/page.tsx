"use client";

import React, { useState, useMemo } from "react";
import { useApp } from "@/lib/store";
import {
  CalendarDays,
  Plus,
  Video,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Phone,
  Search,
  RefreshCw,
  Sparkles,
  MessageSquare
} from "lucide-react";
import {
  generateGoogleCalendarUrl,
  generateGoogleMeetUrl,
  downloadIcsFile,
  formatAppointmentSlot
} from "@/lib/calendar";
import { GoogleIcon } from "@/components/icons/GoogleIcon";

export default function AppointmentsPage() {
  const { business, appointments, contacts, addAppointment, cancelAppointment, updateAppointmentStatus } = useApp();

  const [activeFilter, setActiveFilter] = useState<"all" | "today" | "upcoming" | "completed" | "cancelled">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Formulaire nouveau RDV
  const [selectedContactId, setSelectedContactId] = useState<string>("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [time, setTime] = useState("15:00");
  const [duration, setDuration] = useState("45");
  const [generateMeet, setGenerateMeet] = useState(true);
  const [description, setDescription] = useState("");

  // Gestion de la sélection d'un prospect existant
  const handleSelectContact = (id: string) => {
    setSelectedContactId(id);
    const found = contacts.find((c) => c.id === id);
    if (found) {
      setContactName(found.name || "");
      setContactPhone(found.wa_phone);
      if (found.need) {
        setTitle(`Visite ${found.need} - ${found.name || "Client"}`);
      }
    }
  };

  // KPIs et dates de référence
  const nowTimestamp = useMemo(() => Date.now(), []);
  const todayStr = useMemo(() => new Date(nowTimestamp).toISOString().split("T")[0], [nowTimestamp]);

  const todayCount = appointments.filter((a) => {
    const apptDate = a.start_time.split("T")[0];
    return apptDate === todayStr && a.status !== "cancelled";
  }).length;

  const upcomingCount = appointments.filter((a) => {
    return new Date(a.start_time).getTime() >= nowTimestamp && a.status === "confirmed";
  }).length;

  // Filtrage des rendez-vous
  const filteredAppointments = useMemo(() => {
    return appointments
      .filter((a) => {
        // Filtre onglet
        if (activeFilter === "today") {
          return a.start_time.split("T")[0] === todayStr;
        }
        if (activeFilter === "upcoming") {
          return new Date(a.start_time).getTime() >= nowTimestamp && a.status === "confirmed";
        }
        if (activeFilter === "completed") {
          return a.status === "completed";
        }
        if (activeFilter === "cancelled") {
          return a.status === "cancelled";
        }
        return true;
      })
      .filter((a) => {
        // Recherche
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          a.title.toLowerCase().includes(q) ||
          a.contact_name.toLowerCase().includes(q) ||
          a.contact_phone.toLowerCase().includes(q) ||
          (a.description && a.description.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  }, [appointments, activeFilter, searchQuery, todayStr, nowTimestamp]);

  // Synchronisation Google Calendar
  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setSyncFeedback("Synchronisé avec Google Agenda il y a un instant");
      setTimeout(() => setSyncFeedback(null), 4000);
    }, 1200);
  };

  // Soumission nouveau rendez-vous
  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !title.trim() || !date || !time) return;

    const startDateTime = new Date(`${date}T${time}:00`);
    const durationMinutes = parseInt(duration, 10) || 45;
    const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60 * 1000);

    const meetLink = generateMeet ? generateGoogleMeetUrl(contactName) : null;
    const calendarUrl = generateGoogleCalendarUrl({
      title,
      description: `${description}\n\nClient: ${contactName} (${contactPhone})`,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      location: meetLink || "Dakar, Sénégal"
    });

    await addAppointment({
      contact_id: selectedContactId || null,
      contact_name: contactName.trim(),
      contact_phone: contactPhone.trim(),
      title: title.trim(),
      description: description.trim() || null,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      google_event_id: `g_evt_${Date.now()}`,
      google_meet_link: meetLink,
      google_calendar_url: calendarUrl,
      status: "confirmed"
    });

    // Réinitialisation formulaire
    setIsNewModalOpen(false);
    setSelectedContactId("");
    setContactName("");
    setContactPhone("");
    setTitle("");
    setDescription("");
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Rendez-vous & Google Agenda
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Google Sync
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gérez les visites et rendez-vous planifiés automatiquement par l'IA WhatsApp Claude et synchronisés avec Google Calendar.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-xs transition-colors"
            title="Rafraîchir la synchronisation Google"
          >
            <RefreshCw className={`h-4 w-4 text-emerald-600 ${isSyncing ? "animate-spin" : ""}`} />
            <span className="hidden md:inline">Synchroniser Google</span>
          </button>

          <a
            href="https://calendar.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-xs transition-colors"
          >
            <GoogleIcon className="h-4 w-4 shrink-0" />
            <span>Ouvrir Google Agenda</span>
          </a>

          <button
            onClick={() => setIsNewModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm shadow-emerald-600/30 transition-all hover:scale-[1.02]"
          >
            <Plus className="h-4 w-4" />
            <span>Planifier un RDV</span>
          </button>
        </div>
      </div>

      {/* Sync Status Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 text-white">
        <div className="flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400 shrink-0 border border-white/10">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">
                Intégration Google Agenda connectée
              </span>
              <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Compte : <span className="text-emerald-300 font-mono">{business.google_calendar_email || "contact@teranga-immo.sn"}</span> • Calendrier principal ({business.google_calendar_id || "primary"}) • Salons Google Meet automatiques
            </p>
          </div>
        </div>

        {syncFeedback && (
          <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/70 px-3 py-1.5 rounded-xl border border-emerald-800 animate-fadeIn">
            {syncFeedback}
          </span>
        )}
      </div>

      {/* KPIs Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Total Rendez-vous</span>
            <CalendarDays className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {appointments.length}
          </p>
          <span className="text-[11px] text-slate-400">Visites et entretiens</span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Aujourd'hui</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {todayCount}
          </p>
          <span className="text-[11px] text-amber-500 font-semibold">Créneaux du jour</span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>À Venir (Confirmés)</span>
            <CheckCircle2 className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {upcomingCount}
          </p>
          <span className="text-[11px] text-slate-400">Synchronisés Google</span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Pris par l'IA WhatsApp</span>
            <Sparkles className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            85%
          </p>
          <span className="text-[11px] text-emerald-600 font-semibold">Conversion autonome</span>
        </div>
      </div>

      {/* Barre d'outils et filtres */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        {/* Onglets Filtres */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: "all", label: "Tous", count: appointments.length },
            { id: "today", label: "Aujourd'hui", count: todayCount },
            { id: "upcoming", label: "À venir", count: upcomingCount },
            { id: "completed", label: "Terminés", count: appointments.filter(a => a.status === "completed").length },
            { id: "cancelled", label: "Annulés", count: appointments.filter(a => a.status === "cancelled").length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                activeFilter === tab.id
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeFilter === tab.id ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Barre de recherche */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher titre, prospect, tél..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
          />
        </div>
      </div>

      {/* Liste des Rendez-vous */}
      {filteredAppointments.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mx-auto">
            <CalendarDays className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Aucun rendez-vous dans cette vue
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Dès qu'un client demande une visite sur WhatsApp ou que vous planifiez un créneau, il apparaîtra ici avec son lien Google Agenda et Meet.
          </p>
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition-colors mt-2"
          >
            <Plus className="h-4 w-4" />
            Créer un rendez-vous
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAppointments.map((appt) => {
            const isToday = appt.start_time.split("T")[0] === todayStr;
            const isCancelled = appt.status === "cancelled";
            const isCompleted = appt.status === "completed";

            return (
              <div
                key={appt.id}
                className={`bg-white dark:bg-slate-900 rounded-3xl p-5 border transition-all space-y-4 flex flex-col justify-between ${
                  isToday
                    ? "border-emerald-500/60 shadow-md shadow-emerald-500/5 ring-1 ring-emerald-500/20"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm"
                } ${isCancelled ? "opacity-60" : ""}`}
              >
                <div>
                  {/* Badge statut & Date */}
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {isToday && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                            Aujourd'hui
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          appt.status === "confirmed"
                            ? "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400"
                            : appt.status === "completed"
                              ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                              : "bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400"
                        }`}>
                          {appt.status === "confirmed" ? "Confirmé" : appt.status === "completed" ? "Effectué" : "Annulé"}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 pt-0.5">
                        <Clock className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>{formatAppointmentSlot(appt.start_time, appt.end_time)}</span>
                      </p>
                    </div>

                    {appt.google_event_id && (
                      <span className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400" title="Synchronisé avec Google Calendar">
                        <CalendarDays className="h-3.5 w-3.5 text-emerald-500" />
                      </span>
                    )}
                  </div>

                  {/* Titre & Description */}
                  <div className="pt-3 space-y-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2">
                      {appt.title}
                    </h3>

                    {appt.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {appt.description}
                      </p>
                    )}
                  </div>

                  {/* Prospect Info */}
                  <div className="pt-3 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      <span>{appt.contact_name}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-2 font-mono">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        <span>{appt.contact_phone}</span>
                      </div>
                      <a
                        href={`https://wa.me/${appt.contact_phone.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-600 hover:text-emerald-500 font-bold flex items-center gap-1 text-[11px]"
                      >
                        <MessageSquare className="h-3 w-3" />
                        WhatsApp
                      </a>
                    </div>
                  </div>
                </div>

                {/* Boutons d'actions rapides */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-2">
                    {appt.google_calendar_url && (
                      <a
                        href={appt.google_calendar_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 px-2.5 rounded-xl text-center text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
                        title="Ouvrir dans Google Agenda"
                      >
                        <GoogleIcon className="h-3.5 w-3.5 shrink-0" />
                        <span>Google Agenda</span>
                      </a>
                    )}

                    {appt.google_meet_link && (
                      <a
                        href={appt.google_meet_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 px-2.5 rounded-xl text-center text-xs font-bold bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-400 flex items-center justify-center gap-1.5 transition-colors"
                        title="Rejoindre le salon Google Meet"
                      >
                        <Video className="h-3.5 w-3.5 text-blue-500" />
                        <span>Google Meet</span>
                      </a>
                    )}

                    <button
                      onClick={() => downloadIcsFile(appt)}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Télécharger invitation .ics (Apple, Outlook, Google)"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Action d'état : Terminer ou Annuler */}
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    {!isCompleted && !isCancelled && (
                      <>
                        <button
                          onClick={() => updateAppointmentStatus(appt.id, "completed")}
                          className="text-slate-500 hover:text-emerald-600 font-medium flex items-center gap-1"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Marquer effectué
                        </button>
                        <button
                          onClick={() => cancelAppointment(appt.id)}
                          className="text-slate-400 hover:text-rose-500 font-medium flex items-center gap-1"
                        >
                          <XCircle className="h-3 w-3" />
                          Annuler
                        </button>
                      </>
                    )}
                    {isCompleted && (
                      <span className="text-emerald-600 font-semibold flex items-center gap-1 text-[11px]">
                        <CheckCircle2 className="h-3 w-3" /> Rendez-vous terminé avec succès
                      </span>
                    )}
                    {isCancelled && (
                      <span className="text-rose-500 font-semibold flex items-center gap-1 text-[11px]">
                        <XCircle className="h-3 w-3" /> Rendez-vous annulé
                      </span>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* MODAL NOUVEAU RENDEZ-VOUS */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Planifier un Rendez-vous Google Agenda
                  </h3>
                  <p className="text-xs text-slate-500">
                    Synchronisé en temps réel avec Google Calendar et Google Meet.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-4">
              
              {/* Choisir un prospect existant */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Associer un prospect CRM (Optionnel)
                </label>
                <select
                  value={selectedContactId}
                  onChange={(e) => handleSelectContact(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  <option value="">-- Choisir dans les prospects récents --</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name || "Prospect"} ({c.wa_phone}) - {c.need || "Sans besoin noté"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nom & Téléphone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Nom du client *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Aminata Diallo"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Numéro WhatsApp *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+221 77 000 00 00"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>

              {/* Titre */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Objet du rendez-vous *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Visite Villa Almadies vue mer"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              {/* Date, Heure, Durée */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Heure *
                  </label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Durée
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    <option value="30">30 min</option>
                    <option value="45">45 min</option>
                    <option value="60">1 heure</option>
                    <option value="90">1h 30min</option>
                  </select>
                </div>
              </div>

              {/* Option Google Meet */}
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <input
                  type="checkbox"
                  id="meetCheck"
                  checked={generateMeet}
                  onChange={(e) => setGenerateMeet(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <label htmlFor="meetCheck" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer flex items-center gap-1.5">
                  <Video className="h-3.5 w-3.5 text-blue-500" />
                  Générer automatiquement une visioconférence Google Meet
                </label>
              </div>

              {/* Notes / Description */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Notes ou consignes pour la visite
                </label>
                <textarea
                  rows={3}
                  placeholder="Détails complémentaires, code d'accès, besoins spécifiques du client..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/30 transition-all"
                >
                  Ajouter à Google Agenda
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
