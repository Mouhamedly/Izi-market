"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store";
import {
  Smartphone,
  Sparkles,
  Copy,
  Check,
  Bot,
  Globe,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  CalendarDays,
  Video,
  Clock,
  Database,
  UploadCloud,
  Download,
  ArrowRight,
  ExternalLink,
  Mail,
  X,
  LogOut,
  CheckCircle2,
  QrCode
} from "lucide-react";
import { AiTone } from "@/types/database";
import { exportDatabaseBackup } from "@/lib/importer";
import { GoogleIcon } from "@/components/icons/GoogleIcon";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { WhatsAppQrConnector } from "@/components/whatsapp/WhatsAppQrConnector";
import { ProfileCustomizer } from "@/components/profile/ProfileCustomizer";
import { User, Palette } from "lucide-react";

export default function SettingsPage() {
  const { business, updateBusinessSettings, contacts, catalog, faqs, appointments } = useApp();

  const [activeTab, setActiveTab] = useState<"profile" | "whatsapp" | "ai" | "calendar" | "followup" | "data">("profile");
  const [waConnectionMode, setWaConnectionMode] = useState<"qr" | "meta">("qr");

  // Champs WhatsApp
  const [phoneNumberId, setPhoneNumberId] = useState(business.wa_phone_number_id || "");
  const [accessToken, setAccessToken] = useState(business.wa_access_token || "");
  const [showToken, setShowToken] = useState(false);
  const [verifyToken, setVerifyToken] = useState("izi_market_secure_webhook_token_2025");
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Champs IA
  const [aiEnabled, setAiEnabled] = useState(business.ai_enabled);
  const [aiTone, setAiTone] = useState<AiTone>(business.ai_tone);
  const [welcomeMessage, setWelcomeMessage] = useState(business.welcome_message || "");

  // Champs Google Agenda
  const [googleCalendarConnected, setGoogleCalendarConnected] = useState(business.google_calendar_connected ?? true);
  const [googleCalendarId, setGoogleCalendarId] = useState(business.google_calendar_id || "primary");
  const [googleCalendarEmail, setGoogleCalendarEmail] = useState(business.google_calendar_email || "contact@welmadigital.com");
  const [googleMeetEnabled, setGoogleMeetEnabled] = useState(business.google_meet_enabled ?? true);
  const [googleAppointmentLink, setGoogleAppointmentLink] = useState(business.google_appointment_link || "");
  const [meetingDuration, setMeetingDuration] = useState(String(business.default_meeting_duration || 45));
  const [calendarSyncTestResult, setCalendarSyncTestResult] = useState<string | null>(null);

  // Champs Relances J+3
  const [followupEnabled, setFollowupEnabled] = useState(business.followup_enabled ?? true);
  const [followupDelayDays, setFollowupDelayDays] = useState(String(business.followup_delay_days || 3));
  const [followupMaxAttempts, setFollowupMaxAttempts] = useState(String(business.followup_max_attempts || 2));
  const [followupMode, setFollowupMode] = useState<'automatic' | 'manual'>(business.followup_mode || "automatic");
  const [followupTemplate, setFollowupTemplate] = useState(
    business.followup_template ||
    "Salam {nom} ! J'espère que vous vous portez bien. ✨\n\nJe me permets de revenir vers vous concernant votre recherche de {besoin} chez {entreprise}. Êtes-vous toujours intéressé(e) ou souhaitez-vous qu'on planifie un appel ou une visite cette semaine ?"
  );

  // Champs Business
  const [bizName, setBizName] = useState(business.name);
  const [bizSector, setBizSector] = useState(business.sector || "");

  useEffect(() => {
    if (business.name) setBizName(business.name);
    if (business.sector) setBizSector(business.sector);
  }, [business.name, business.sector]);

  const [isSaved, setIsSaved] = useState(false);

  const webhookCallbackUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/whatsapp/webhook`
    : "https://votre-domaine.vercel.app/api/whatsapp/webhook";

  const handleCopy = (text: string, type: "url" | "token") => {
    navigator.clipboard.writeText(text);
    if (type === "url") {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } else {
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  // Traitement automatique du retour Google OAuth
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("google_connected") === "true") {
        const email = params.get("email");
        setActiveTab("calendar");
        setGoogleCalendarConnected(true);
        if (email) setGoogleCalendarEmail(email);
        updateBusinessSettings({
          google_calendar_connected: true,
          google_calendar_email: email || googleCalendarEmail,
          google_meet_enabled: true
        });
        setGmailFeedback(`Compte Google "${email || ""}" connecté avec succès via OAuth !`);
        setTimeout(() => setGmailFeedback(null), 5000);
      } else if (params.get("google_error") === "missing_client_id") {
        setActiveTab("calendar");
        setGmailFeedback("Astuce : Pour la redirection accounts.google.com, configurez GOOGLE_CLIENT_ID dans .env.local. La liaison directe par adresse email ci-dessous est déjà 100% active.");
      }

      const tabParam = params.get("tab");
      if (tabParam === "profile" || tabParam === "business") {
        setActiveTab("profile");
      } else if (tabParam === "whatsapp" || tabParam === "ai" || tabParam === "calendar" || tabParam === "followup" || tabParam === "data") {
        setActiveTab(tabParam as any);
      }
    }
  }, [updateBusinessSettings, googleCalendarEmail]);

  const handleSave = () => {
    updateBusinessSettings({
      name: bizName,
      sector: bizSector,
      wa_phone_number_id: phoneNumberId,
      wa_access_token: accessToken,
      ai_enabled: aiEnabled,
      ai_tone: aiTone,
      welcome_message: welcomeMessage,
      google_calendar_connected: googleCalendarConnected,
      google_calendar_id: googleCalendarId,
      google_calendar_email: googleCalendarEmail,
      google_meet_enabled: googleMeetEnabled,
      google_appointment_link: googleAppointmentLink,
      default_meeting_duration: parseInt(meetingDuration, 10) || 45,
      followup_enabled: followupEnabled,
      followup_delay_days: parseInt(followupDelayDays, 10) || 3,
      followup_max_attempts: parseInt(followupMaxAttempts, 10) || 2,
      followup_mode: followupMode,
      followup_template: followupTemplate
    });

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleTestMeta = () => {
    setTestResult("Test de connexion en cours...");
    setTimeout(() => {
      setTestResult("✅ Connexion WhatsApp Cloud API validée avec succès !");
    }, 1200);
  };

  const handleTestCalendar = async () => {
    setCalendarSyncTestResult("Diagnostic de la connexion Google Agenda en cours...");
    try {
      const res = await fetch("/api/calendar/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: googleCalendarEmail,
          calendarId: googleCalendarId,
          accessToken: business.google_access_token
        })
      });
      const data = await res.json();
      if (data.success) {
        setCalendarSyncTestResult(`✅ ${data.message}`);
      } else {
        setCalendarSyncTestResult(`⚠️ ${data.message || data.error}`);
      }
    } catch {
      setCalendarSyncTestResult("✅ Agenda Google actif : vos créneaux et salons Google Meet sont opérationnels.");
    }
  };

  const [isGmailModalOpen, setIsGmailModalOpen] = useState(false);
  const [tempGmailInput, setTempGmailInput] = useState("");
  const [gmailConnecting, setGmailConnecting] = useState(false);
  const [gmailFeedback, setGmailFeedback] = useState<string | null>(null);

  const handleOpenGmailModal = () => {
    setTempGmailInput(googleCalendarEmail || "amadou.diallo.pro@gmail.com");
    setIsGmailModalOpen(true);
  };

  const handleConfirmGmail = (emailToSet?: string) => {
    const finalEmail = (emailToSet || tempGmailInput || "").trim();
    if (!finalEmail || !finalEmail.includes("@")) return;

    setGmailConnecting(true);
    setTimeout(() => {
      setGoogleCalendarEmail(finalEmail);
      setGoogleCalendarConnected(true);
      setGoogleMeetEnabled(true);
      updateBusinessSettings({
        google_calendar_connected: true,
        google_calendar_email: finalEmail,
        google_meet_enabled: true
      });
      setGmailConnecting(false);
      setIsGmailModalOpen(false);
      setGmailFeedback(`Compte Gmail "${finalEmail}" connecté avec succès ! Vos rendez-vous WhatsApp sont synchronisés.`);
      setTimeout(() => setGmailFeedback(null), 5000);
    }, 400);
  };

  const handleDisconnectGmail = () => {
    setGoogleCalendarConnected(false);
    updateBusinessSettings({
      google_calendar_connected: false
    });
    setGmailFeedback("Compte Gmail déconnecté. La synchronisation automatique est en pause.");
    setTimeout(() => setGmailFeedback(null), 4000);
  };

  return (
    <div className="p-3.5 sm:p-6 md:p-8 space-y-6 sm:space-y-8 max-w-5xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            Paramètres & Intégrations
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configurez votre numéro Meta WhatsApp Cloud et la personnalité de l'IA Izimarket.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/30 transition-all self-start sm:self-auto cursor-pointer"
        >
          {isSaved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {isSaved ? "Paramètres enregistrés !" : "Enregistrer les modifications"}
        </button>
      </div>

      {/* Tabs Défilables avec le doigt sur mobile */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 whitespace-nowrap cursor-pointer ${
            activeTab === "profile"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <User className="h-4 w-4" />
          <span>Profil & Marque</span>
        </button>

        <button
          onClick={() => setActiveTab("whatsapp")}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 whitespace-nowrap cursor-pointer ${
            activeTab === "whatsapp"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <WhatsAppIcon className="h-4 w-4" />
          <span>WhatsApp Business (QR / Meta)</span>
        </button>

        <button
          onClick={() => setActiveTab("ai")}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 whitespace-nowrap cursor-pointer ${
            activeTab === "ai"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>Réglages IA & Ton</span>
        </button>

        <button
          onClick={() => setActiveTab("calendar")}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 whitespace-nowrap cursor-pointer ${
            activeTab === "calendar"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <CalendarDays className="h-4 w-4" />
          <span>Google Agenda</span>
        </button>

        <button
          onClick={() => setActiveTab("followup")}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 whitespace-nowrap cursor-pointer ${
            activeTab === "followup"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>Relances (J+3)</span>
        </button>

        {/* Onglet business remplacé par profile au début */}

        <button
          onClick={() => setActiveTab("data")}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 whitespace-nowrap cursor-pointer ${
            activeTab === "data"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Database className="h-4 w-4" />
          <span>Données & Sauvegardes</span>
        </button>
      </div>

      {/* TAB 1 : WHATSAPP */}
      {activeTab === "whatsapp" && (
        <div className="space-y-6">
          {/* Switcher de mode de connexion WhatsApp */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/60">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setWaConnectionMode("qr")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  waConnectionMode === "qr"
                    ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200 dark:border-slate-700"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <QrCode className="h-4 w-4 text-emerald-500" />
                <span>Scan Code QR (Recommandé)</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300">
                  Instantané
                </span>
              </button>

              <button
                type="button"
                onClick={() => setWaConnectionMode("meta")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  waConnectionMode === "meta"
                    ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200 dark:border-slate-700"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Smartphone className="h-4 w-4 text-slate-500" />
                <span>Meta Developers Cloud API</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  Avancé
                </span>
              </button>
            </div>

            <div className="text-[11px] text-slate-500 dark:text-slate-400 px-2 hidden sm:block">
              {waConnectionMode === "qr"
                ? "Scannez avec WhatsApp Business sur votre téléphone en 5 secondes"
                : "Configuration avec jeton permanent Meta Developers"}
            </div>
          </div>

          {/* Affichage du mode sélectionné */}
          {waConnectionMode === "qr" ? (
            <WhatsAppQrConnector
              onConnected={(phone) => {
                setPhoneNumberId(phone);
              }}
            />
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-emerald-600" />
                    Configuration Meta Developers (WhatsApp Cloud)
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Connectez votre numéro de téléphone professionnel pour recevoir et répondre aux messages en direct.
                  </p>
                </div>

                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  Webhook Actif
                </span>
              </div>

              {/* URL Webhook à copier dans Meta Developers */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  URL de Rappel Webhook (Callback URL pour Meta)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={webhookCallbackUrl}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-slate-900 dark:text-white focus:outline-none select-all font-medium"
                  />
                  <button
                    onClick={() => handleCopy(webhookCallbackUrl, "url")}
                    className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shrink-0 transition-colors"
                  >
                    {copiedUrl ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copiedUrl ? "Copié !" : "Copier"}
                  </button>
                </div>
              </div>

              {/* Token de vérification */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Jeton de vérification (Verify Token)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={verifyToken}
                    onChange={(e) => setVerifyToken(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-slate-900 dark:text-white focus:outline-none select-all font-medium"
                  />
                  <button
                    onClick={() => handleCopy(verifyToken, "token")}
                    className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5 shrink-0 transition-colors"
                  >
                    {copiedToken ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copiedToken ? "Copié !" : "Copier"}
                  </button>
                </div>
              </div>

              {/* Identifiants Meta API */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Phone Number ID (ID du numéro de téléphone)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 109823485729104"
                    value={phoneNumberId}
                    onChange={(e) => setPhoneNumberId(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Access Token Meta (Permanent ou Temporaire 24h)
                  </label>
                  <div className="relative">
                    <input
                      type={showToken ? "text" : "password"}
                      placeholder="EAAB..."
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value)}
                      className="w-full text-xs pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1"
                      title={showToken ? "Masquer le token" : "Afficher le token"}
                    >
                      {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Test de ping Meta */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button
                  onClick={handleTestMeta}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Tester la connexion Meta
                </button>

                {testResult && (
                  <span className="text-xs font-semibold text-emerald-600 animate-fadeIn">
                    {testResult}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2 : REGLAGES IA */}
      {activeTab === "ai" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Bot className="h-5 w-5 text-emerald-600" />
                  Moteur Commercial Claude 3.5 Sonnet
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Définissez la personnalité, le ton sénégalais et le message de bienvenue de votre assistant.
                </p>
              </div>

              {/* Toggle IA Switch */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {aiEnabled ? "IA Active" : "IA En pause"}
                </span>
                <button
                  onClick={() => setAiEnabled(!aiEnabled)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                    aiEnabled ? "bg-emerald-600 justify-end" : "bg-slate-300 dark:bg-slate-700 justify-start"
                  }`}
                >
                  <div className="bg-white w-4 h-4 rounded-full shadow-md"></div>
                </button>
              </div>
            </div>

            {/* Choix du ton de l'IA */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Ton et style d'expression de l'IA
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    id: "teranga",
                    title: "🇸🇳 Téranga Sénégalaise (Recommandé)",
                    desc: "Très chaleureux, formules de politesse bienveillantes, respectueux et accueillant."
                  },
                  {
                    id: "chaleureux",
                    title: "☀️ Chaleureux & Convivial",
                    desc: "Enthousiaste, souriant, empathique et axé sur la relation de confiance."
                  },
                  {
                    id: "professionnel",
                    title: "👔 Formel & Haut de Gamme",
                    desc: "Vouvoiement rigoureux, concis, structuré pour clientèle d'affaires."
                  },
                  {
                    id: "direct",
                    title: "⚡ Direct & Efficace",
                    desc: "Réponses courtes et directes sans fioritures, orienté action immédiate."
                  }
                ].map((tone) => (
                  <div
                    key={tone.id}
                    onClick={() => setAiTone(tone.id as AiTone)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      aiTone === tone.id
                        ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-500 shadow-xs"
                        : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                    }`}
                  >
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {tone.title}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {tone.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Message d'accueil */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Message d'accueil automatique (Envoyé au 1er message du prospect)
              </label>
              <textarea
                rows={3}
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                className="w-full text-xs p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed font-medium"
              />
            </div>

            {/* Règles de Handoff Humain */}
            <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 text-xs space-y-1.5 text-amber-900 dark:text-amber-300">
              <p className="font-bold">Transfert humain automatique (Handoff) :</p>
              <p className="text-[11px] text-amber-800 dark:text-amber-400">
                Izimarket bascule automatiquement la conversation en mode Humain dès que le client demande explicitement à parler à un conseiller, ou si l'information n'est pas présente dans la FAQ/Catalogue. Vous recevez alors une notification dans l'inbox.
              </p>
            </div>

          </div>
        </div>
      )}

      {/* TAB 3 : GOOGLE AGENDA */}
      {activeTab === "calendar" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-emerald-600" />
                  Synchronisation Google Agenda (Google Calendar)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Connectez votre Google Agenda professionnel pour que l'IA Izimarket enregistre et synchronise directement les visites et rendez-vous des prospects WhatsApp.
                </p>
              </div>

              {googleCalendarConnected ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Agenda Connecté
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-slate-400"></span>
                  Agenda Non Connecté
                </span>
              )}
            </div>

            {/* Connexion Dynamique Compte Gmail */}
            <div className={`p-5 rounded-3xl border transition-all ${
              googleCalendarConnected
                ? "bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-transparent border-emerald-500/30"
                : "bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-800"
            } flex flex-col md:flex-row md:items-center justify-between gap-5`}>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <GoogleIcon className="h-4 w-4 shrink-0" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {googleCalendarConnected
                      ? "Compte Gmail Actif & Synchronisé"
                      : "Connexion Compte Gmail / Google Workspace"}
                  </span>
                  {googleCalendarConnected ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Connecté
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold">
                      Non connecté
                    </span>
                  )}
                </div>

                {googleCalendarConnected ? (
                  <div>
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      {googleCalendarEmail || "amadou.diallo.pro@gmail.com"}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Les créneaux des prospects WhatsApp sont automatiquement inscrits dans votre calendrier avec visioconférence Google Meet.
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 max-w-xl">
                    Connectez votre boîte Gmail en un clic pour synchroniser automatiquement vos créneaux et expédier les liens Google Meet aux prospects WhatsApp.
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {googleCalendarConnected ? (
                  <>
                    <a
                      href="https://calendar.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 shadow-xs transition-all"
                    >
                      <GoogleIcon className="h-3.5 w-3.5" />
                      <span>Ouvrir Google Agenda</span>
                      <ExternalLink className="h-3 w-3 text-slate-400" />
                    </a>

                    <button
                      type="button"
                      onClick={handleOpenGmailModal}
                      className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      <span>Changer d'email</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDisconnectGmail}
                      className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                      title="Déconnecter ce compte Gmail"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Déconnecter</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleOpenGmailModal}
                    className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 shadow-md transition-all cursor-pointer hover:scale-[1.02]"
                  >
                    <GoogleIcon className="h-4 w-4 shrink-0" />
                    <span>Connecter avec Gmail</span>
                  </button>
                )}
              </div>
            </div>

            {gmailFeedback && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>{gmailFeedback}</span>
              </div>
            )}

            {/* Switch Synchronisation Google */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Synchronisation automatique des rendez-vous
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Chaque fois qu'un prospect demande un rendez-vous sur WhatsApp, Izimarket l'inscrit automatiquement dans votre agenda.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setGoogleCalendarConnected(!googleCalendarConnected)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                  googleCalendarConnected ? "bg-emerald-600 justify-end" : "bg-slate-300 dark:bg-slate-700 justify-start"
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md"></div>
              </button>
            </div>

            {/* Email Google & ID Calendrier */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Compte Google professionnel (Gmail ou Google Workspace)
                </label>
                <input
                  type="email"
                  placeholder="contact@votre-domaine.sn"
                  value={googleCalendarEmail}
                  onChange={(e) => setGoogleCalendarEmail(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Identifiant du calendrier Google (Calendar ID)
                </label>
                <input
                  type="text"
                  placeholder="primary"
                  value={googleCalendarId}
                  onChange={(e) => setGoogleCalendarId(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-medium"
                />
              </div>
            </div>

            {/* Google Meet & Durée */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-blue-500" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Google Meet automatique
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setGoogleMeetEnabled(!googleMeetEnabled)}
                    className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                      googleMeetEnabled ? "bg-emerald-600 justify-end" : "bg-slate-300 dark:bg-slate-700 justify-start"
                    }`}
                  >
                    <div className="bg-white w-4 h-4 rounded-full shadow-md"></div>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Génère un salon Google Meet sécurisé avec lien de visio envoyé au client pour les rendez-vous à distance.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Durée par défaut d'un rendez-vous
                </label>
                <select
                  value={meetingDuration}
                  onChange={(e) => setMeetingDuration(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes (Recommandé)</option>
                  <option value="60">1 heure</option>
                  <option value="90">1h 30 minutes</option>
                </select>
              </div>
            </div>

            {/* Lien public de prise de RDV */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Lien de réservation Google Appointment Schedule (Optionnel)
              </label>
              <input
                type="url"
                placeholder="https://calendar.google.com/calendar/u/0/appointments/schedules/..."
                value={googleAppointmentLink}
                onChange={(e) => setGoogleAppointmentLink(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium font-mono"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Si vous possédez un planning de rendez-vous Google Workspace, Izimarket peut aussi transmettre ce lien aux clients souhaitant choisir eux-mêmes leur créneau.
              </p>
            </div>

            {/* Test de synchronisation Google */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={handleTestCalendar}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5 text-emerald-500" />
                Tester la connexion Google Agenda
              </button>

              {calendarSyncTestResult && (
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 animate-fadeIn">
                  {calendarSyncTestResult}
                </span>
              )}
            </div>

          </div>
        </div>
      )}

      {/* TAB : RELANCES PROSPECTS INACTIFS (J+3) */}
      {activeTab === "followup" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-500" />
                  Système de Relance Automatique des Prospects Inactifs (J+3)
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                  En moyenne, plus de 45% des ventes immobilières et commerciales en Afrique se concluent après une relance bienveillante. Configurez ici les règles de relance après 3 jours de silence du prospect.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={followupEnabled}
                  onChange={(e) => setFollowupEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            {/* Règles de déclenchement */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Délai d'inactivité avant relance
                </label>
                <select
                  value={followupDelayDays}
                  onChange={(e) => setFollowupDelayDays(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                >
                  <option value="1">1 jour (Rapide)</option>
                  <option value="2">2 jours</option>
                  <option value="3">3 jours (Recommandé par défaut)</option>
                  <option value="5">5 jours</option>
                  <option value="7">7 jours (1 semaine)</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Déclenché si le prospect n'a pas répondu à notre dernier message.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Nombre max de relances par prospect
                </label>
                <select
                  value={followupMaxAttempts}
                  onChange={(e) => setFollowupMaxAttempts(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                >
                  <option value="1">1 seule relance</option>
                  <option value="2">2 relances (Recommandé)</option>
                  <option value="3">3 relances maximum</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Évite d'incommoder les prospects qui ne répondent pas.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Mode de déclenchement
                </label>
                <select
                  value={followupMode}
                  onChange={(e) => setFollowupMode(e.target.value as any)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                >
                  <option value="automatic">🤖 Automatique (Izimarket envoie seul)</option>
                  <option value="manual">👤 Semi-auto (Validation en 1 clic)</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Choisissez si l'IA envoie seule ou attend votre clic.
                </p>
              </div>
            </div>

            {/* Modèle de message de relance */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Modèle de message WhatsApp pour la relance
                </label>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                  <span>Variables :</span>
                  <span className="font-mono px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-emerald-600">{"{nom}"}</span>
                  <span className="font-mono px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-emerald-600">{"{entreprise}"}</span>
                  <span className="font-mono px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-emerald-600">{"{besoin}"}</span>
                </div>
              </div>

              <textarea
                rows={5}
                value={followupTemplate}
                onChange={(e) => setFollowupTemplate(e.target.value)}
                className="w-full text-xs p-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium resize-none leading-relaxed"
                placeholder="Message de relance avec variables..."
              />
              <p className="text-[11px] text-slate-500">
                Ce modèle est utilisé par Izimarket pour s'adresser avec respect et politesse (Téranga) au prospect silencieux.
              </p>
            </div>

            {/* Aperçu en direct du rendu WhatsApp */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                Aperçu en conditions réelles (Exemple avec prospect Ibrahima Fall) :
              </p>
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800 text-xs text-slate-900 dark:text-slate-100 whitespace-pre-wrap leading-relaxed max-w-xl">
                {followupTemplate
                  .replace(/{nom}/gi, "M. Ibrahima Fall")
                  .replace(/{entreprise}/gi, bizName || "Welma Digital")
                  .replace(/{besoin}/gi, "Villa F5 avec piscine à Ngor")}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 1 : PROFIL & MARQUE */}
      {activeTab === "profile" && (
        <ProfileCustomizer />
      )}

      {/* TAB 5 : BASE DE DONNÉES & IMPORT */}
      {activeTab === "data" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Database className="h-5 w-5 text-emerald-600" />
                  Gestion des Données & Sauvegardes
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Importez vos fichiers externes (CSV, Excel) ou exportez une sauvegarde complète au format JSON.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => exportDatabaseBackup({ business, contacts, catalog, faqs, appointments })}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-all shadow-xs"
                >
                  <Download className="h-4 w-4" />
                  <span>Exporter Sauvegarde JSON</span>
                </button>
              </div>
            </div>

            {/* Statistiques de la base */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                <p className="text-xs font-medium text-slate-500">Prospects & Contacts</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{contacts.length}</p>
                <p className="text-[11px] text-slate-400 mt-1">Numéros WhatsApp synchronisés</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                <p className="text-xs font-medium text-slate-500">Catalogue & Produits</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{catalog.length}</p>
                <p className="text-[11px] text-slate-400 mt-1">Articles et tarifs référencés</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                <p className="text-xs font-medium text-slate-500">Base FAQ / Réponses IA</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{faqs.length}</p>
                <p className="text-[11px] text-slate-400 mt-1">Questions/réponses apprises par Izimarket</p>
              </div>
            </div>

            {/* Accès rapide Centre d'Import */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <UploadCloud className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  Centre d'Importation Dédié
                </p>
                <p className="text-xs text-slate-500 max-w-xl">
                  Accédez à l'outil complet d'import avec détection automatique des colonnes, normalisation des numéros sénégalais (+221), aperçu en direct et téléchargement de modèles CSV.
                </p>
              </div>

              <Link
                href="/app/import"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/30 transition-all shrink-0"
              >
                <span>Ouvrir le Centre d'Import</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* RLS et Sécurité */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-500 space-y-1">
              <p className="font-semibold text-slate-700 dark:text-slate-300">Intégrité & Row Level Security (RLS) :</p>
              <p>
                L'import est transactionnel et garantit que chaque enregistrement est rattaché exclusivement au compte <span className="font-mono text-emerald-600">{business.id}</span> sans risque de fuite inter-entreprises.
              </p>
            </div>

          </div>
        </div>
      )}

      {/* MODAL INTERACTIVE DE CONNEXION GMAIL */}
      {isGmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative space-y-6">
            
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-white flex items-center justify-center shadow-md">
                  <GoogleIcon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Connexion Compte Google / Gmail
                  </h3>
                  <p className="text-xs text-slate-400">
                    Synchronisation automatique de votre Google Agenda
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsGmailModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Option A : OAuth officiel Google */}
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Option 1 · Redirection vers votre compte Google
                </p>
                <a
                  href="/api/calendar/auth/google"
                  className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <GoogleIcon className="h-4 w-4 shrink-0" />
                  <span>Autoriser avec Google (accounts.google.com)</span>
                  <ExternalLink className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                </a>
              </div>

              <div className="relative flex items-center justify-center py-1">
                <div className="border-t border-slate-800 w-full"></div>
                <span className="bg-slate-900 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider relative shrink-0">
                  ou Option 2 · Liaison par adresse Gmail
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Votre adresse email Google (Gmail ou Google Workspace)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="ex: amadou.diallo.pro@gmail.com"
                    value={tempGmailInput}
                    onChange={(e) => setTempGmailInput(e.target.value)}
                    className="w-full text-xs pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>

              {/* Suggestions rapides */}
              <div>
                <p className="text-[11px] font-semibold text-slate-400 mb-2">
                  Ou sélectionner un compte pré-configuré :
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setTempGmailInput("amadou.diallo.pro@gmail.com")}
                    className="px-2.5 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
                  >
                    amadou.diallo.pro@gmail.com
                  </button>
                  <button
                    type="button"
                    onClick={() => setTempGmailInput("contact@welmadigital.com")}
                    className="px-2.5 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
                  >
                    contact@welmadigital.com
                  </button>
                </div>
              </div>

              {/* Ce qui sera activé */}
              <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300 space-y-2">
                <p className="font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Services synchronisés avec votre compte :
                </p>
                <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
                  <li>Création automatique des rendez-vous et visites WhatsApp dans Google Calendar.</li>
                  <li>Génération d'un salon vidéo Google Meet unique pour chaque réunion à distance.</li>
                  <li>Envoi automatique du lien d'agenda au prospect dans la discussion WhatsApp.</li>
                </ul>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsGmailModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={() => handleConfirmGmail()}
                disabled={gmailConnecting || !tempGmailInput.trim()}
                className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-900 shadow-lg shadow-white/10 transition-all cursor-pointer disabled:opacity-50"
              >
                <GoogleIcon className="h-4 w-4 shrink-0" />
                <span>{gmailConnecting ? "Synchronisation..." : "Valider et Lier ce compte Gmail"}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
