"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/lib/store";
import {
  User,
  Building2,
  Sparkles,
  Palette,
  Bot,
  Save,
  CheckCircle2,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Coins,
  ShieldCheck,
  Check,
  Globe,
  Quote as QuoteIcon
} from "lucide-react";

const BRAND_COLORS = [
  { id: "emerald", name: "Émeraude Téranga", bg: "bg-emerald-500", border: "border-emerald-500", text: "text-emerald-500", ring: "ring-emerald-500" },
  { id: "sky", name: "Océan Dakar", bg: "bg-sky-500", border: "border-sky-500", text: "text-sky-500", ring: "ring-sky-500" },
  { id: "indigo", name: "Indigo Tech", bg: "bg-indigo-500", border: "border-indigo-500", text: "text-indigo-500", ring: "ring-indigo-500" },
  { id: "amber", name: "Or Sahélien", bg: "bg-amber-500", border: "border-amber-500", text: "text-amber-500", ring: "ring-amber-500" },
  { id: "rose", name: "Corail Rose", bg: "bg-rose-500", border: "border-rose-500", text: "text-rose-500", ring: "ring-rose-500" },
];

const SECTORS = [
  "Immobilier & Résidences",
  "Prêt-à-porter, Mode & Chaussures",
  "Électronique, Smartphones & High-tech",
  "Services & Conseil aux Entreprises",
  "Restauration, Traiteur & Événements",
  "Automobile, Location & Pièces",
  "Commerce Général & Distribution"
];

const CITIES = [
  "Dakar (Almadies, Plateau, Mermoz...)",
  "Thiès & Diamniadio",
  "Saly & Mbour (Petite Côte)",
  "Saint-Louis",
  "Autre Ville / International"
];

const CURRENCIES = [
  { code: "FCFA", label: "Franc CFA (XOF)", symbol: "FCFA" },
  { code: "EUR", label: "Euro (€)", symbol: "€" },
  { code: "USD", label: "Dollar US ($)", symbol: "$" }
];

export function ProfileCustomizer() {
  const { business, updateBusinessSettings, userEmail } = useApp();

  // Profile Identity
  const [ownerName, setOwnerName] = useState(business.owner_name || "");
  const [ownerRole, setOwnerRole] = useState(business.owner_role || "Directeur Général");
  const [contactEmail, setContactEmail] = useState(business.contact_email || userEmail || "");
  const [contactPhone, setContactPhone] = useState(business.contact_phone || "+221 ");

  // Business Identity
  const [bizName, setBizName] = useState(business.name || "");
  const [bizTagline, setBizTagline] = useState(business.tagline || "");
  const [bizSector, setBizSector] = useState(business.sector || SECTORS[0]);
  const [bizCity, setBizCity] = useState(business.city || CITIES[0]);

  // Visual Customization
  const [brandColor, setBrandColor] = useState(business.brand_color || "emerald");
  const [currency, setCurrency] = useState(business.currency || "FCFA");

  // AI & WhatsApp Customization
  const [assistantName, setAssistantName] = useState(business.assistant_name || "Izimarket IA");
  const [signature, setSignature] = useState(business.signature || `— L'équipe ${business.name || ""}`);
  const [aiTone, setAiTone] = useState(business.ai_tone || "teranga");

  const [isSaving, setIsSaving] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);

  // Sync when business changes
  useEffect(() => {
    if (business.name) setBizName(business.name);
    if (business.sector) setBizSector(business.sector);
    if (business.owner_name) setOwnerName(business.owner_name);
    if (business.owner_role) setOwnerRole(business.owner_role);
    if (business.contact_email) setContactEmail(business.contact_email);
    if (business.contact_phone) setContactPhone(business.contact_phone);
    if (business.tagline) setBizTagline(business.tagline);
    if (business.city) setBizCity(business.city);
    if (business.brand_color) setBrandColor(business.brand_color);
    if (business.currency) setCurrency(business.currency);
    if (business.assistant_name) setAssistantName(business.assistant_name);
    if (business.signature) setSignature(business.signature);
    if (business.ai_tone) setAiTone(business.ai_tone);
  }, [business]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);

    try {
      await updateBusinessSettings({
        name: bizName,
        tagline: bizTagline,
        sector: bizSector,
        city: bizCity,
        owner_name: ownerName,
        owner_role: ownerRole,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        brand_color: brandColor,
        currency: currency,
        assistant_name: assistantName,
        signature: signature,
        ai_tone: aiTone
      });

      setShowSavedToast(true);
      setTimeout(() => setShowSavedToast(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const activeColorObj = BRAND_COLORS.find((c) => c.id === brandColor) || BRAND_COLORS[0];

  const initials = bizName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || "IZ";

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      
      {/* Save Notification Toast */}
      {showSavedToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-emerald-600 text-white shadow-2xl shadow-emerald-600/40 animate-in fade-in slide-in-from-bottom-4 duration-300 font-bold text-xs">
          <CheckCircle2 className="h-4 w-4" />
          <span>Profil & Personnalisation enregistrés avec succès !</span>
        </div>
      )}

      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <User className="h-6 w-6 text-emerald-500" />
            Profil & Personnalisation de la Marque
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Adaptez l'identité de votre entreprise, les couleurs de l'application et la voix de votre assistant IA.
          </p>
        </div>

        <button
          onClick={() => handleSave()}
          disabled={isSaving}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 transition-all self-start sm:self-auto cursor-pointer disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Enregistrement...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Enregistrer les modifications</span>
            </>
          )}
        </button>
      </div>

      {/* LIVE PREVIEW HERO CARD (Carte d'identité digitale) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 p-6 sm:p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className={`h-16 w-16 sm:h-20 sm:w-20 rounded-3xl ${activeColorObj.bg} text-white font-black text-xl sm:text-2xl flex items-center justify-center shadow-xl ring-4 ring-white/10 shrink-0`}>
              {initials}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg sm:text-2xl font-black tracking-tight text-white">
                  {bizName || "Votre Nom d'Entreprise"}
                </h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <ShieldCheck className="h-3 w-3" /> Officiel IZI Market
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium italic">
                {bizTagline || "Ajoutez votre slogan commercial ci-dessous"}
              </p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
                <span className="flex items-center gap-1">
                  <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                  {bizSector}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  {bizCity}
                </span>
                <span>•</span>
                <span className="text-emerald-400 font-semibold font-mono">
                  Devise : {currency}
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-1 self-stretch md:self-auto min-w-[200px]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Gérant / Responsable</p>
            <p className="text-xs font-bold text-white">{ownerName || "Nom du gérant"}</p>
            <p className="text-[11px] text-emerald-400 font-medium">{ownerRole}</p>
            <p className="text-[10px] text-slate-400 pt-1 truncate">{contactEmail || userEmail}</p>
          </div>
        </div>
      </div>

      {/* FORM SECTIONS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CARD 1: IDENTITÉ DU RESPONSABLE */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <User className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Profil de l'Utilisateur / Dirigeant
              </h3>
              <p className="text-[11px] text-slate-500">
                Vos informations personnelles en tant qu'administrateur.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Nom complet du responsable
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="Ex: Amadou Diallo"
                  className="w-full text-xs pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Rôle ou Fonction
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={ownerRole}
                  onChange={(e) => setOwnerRole(e.target.value)}
                  placeholder="Ex: Fondateur & CEO, Directeur Commercial..."
                  className="w-full text-xs pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Email de contact
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="contact@entreprise.sn"
                    className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Téléphone direct
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+221 77 123 45 67"
                    className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: MARQUE & ENTREPRISE */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="h-8 w-8 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Identité de l'Entreprise
              </h3>
              <p className="text-[11px] text-slate-500">
                Nom officiel et secteur affichés sur l'ensemble du CRM.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Nom commercial de l'entreprise *
              </label>
              <input
                type="text"
                value={bizName}
                onChange={(e) => setBizName(e.target.value)}
                placeholder="Ex: Mbolyama Immobilier"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Ce nom est utilisé pour saluer sur le tableau de bord : "Bonjour, {bizName || "..."} 👋"
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Slogan / Tagline commerciale
              </label>
              <input
                type="text"
                value={bizTagline}
                onChange={(e) => setBizTagline(e.target.value)}
                placeholder="Ex: L'excellence immobilière au Sénégal"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Secteur d'activité
                </label>
                <select
                  value={bizSector}
                  onChange={(e) => setBizSector(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                >
                  {SECTORS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Ville / Zone géographique
                </label>
                <select
                  value={bizCity}
                  onChange={(e) => setBizCity(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                >
                  {CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 3: PERSONNALISATION GRAPHIQUE & COULEURS */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="h-8 w-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <Palette className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Personnalisation Graphique & Thème
              </h3>
              <p className="text-[11px] text-slate-500">
                Couleur de marque et préférences de facturation.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                Couleur d'accentuation de la marque
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {BRAND_COLORS.map((col) => {
                  const isSelected = brandColor === col.id;
                  return (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => setBrandColor(col.id)}
                      className={`flex items-center gap-2.5 p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? "bg-slate-50 dark:bg-slate-800 border-slate-400 dark:border-slate-600 ring-2 " + col.ring
                          : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      }`}
                    >
                      <span className={`h-5 w-5 rounded-full ${col.bg} flex items-center justify-center text-white shrink-0 shadow-sm`}>
                        {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                      </span>
                      <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                        {col.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                Devise monétaire par défaut
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {CURRENCIES.map((cur) => {
                  const isSelected = currency === cur.code;
                  return (
                    <button
                      key={cur.code}
                      type="button"
                      onClick={() => setCurrency(cur.code)}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-500"
                          : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      }`}
                    >
                      <span className="text-sm font-black font-mono">{cur.symbol}</span>
                      <span className="text-[10px] font-semibold mt-0.5">{cur.code}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* CARD 4: ASSISTANT IA & WHATSAPP */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="h-8 w-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Personnalisation de l'Assistant IA
              </h3>
              <p className="text-[11px] text-slate-500">
                Donnez un nom et une signature à votre intelligence commerciale.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Nom de votre Assistant IA
              </label>
              <div className="relative">
                <Bot className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={assistantName}
                  onChange={(e) => setAssistantName(e.target.value)}
                  placeholder="Ex: Izimarket IA, Awa Conseillère, Mamadou..."
                  className="w-full text-xs pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Ce nom est utilisé lors des réponses automatiques aux prospects.
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Signature commerciale automatique
              </label>
              <div className="relative">
                <QuoteIcon className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder="Ex: — L'équipe commerciale Mbolyama"
                  className="w-full text-xs pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Ton culturel de conversation
              </label>
              <select
                value={aiTone}
                onChange={(e) => setAiTone(e.target.value as any)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
              >
                <option value="teranga">🇸🇳 Téranga Sénégalaise (Chaleureux, poli, bienveillant - Recommandé)</option>
                <option value="chaleureux">☀️ Chaleureux & Amical (Accessible et enthousiaste)</option>
                <option value="professionnel">👔 Formel & Corporate (Idéal cabinets & B2B)</option>
                <option value="direct">⚡ Direct & Efficace (Concis et rapide)</option>
              </select>
            </div>
          </div>
        </div>

      </div>

      {/* BOTTOM ACTION BAR */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <p className="text-xs text-slate-500">
          Toutes les modifications sont synchronisées avec vos prospects et devis.
        </p>
        <button
          onClick={() => handleSave()}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
        >
          {isSaving ? "Sauvegarde en cours..." : "Enregistrer les modifications"}
        </button>
      </div>

    </div>
  );
}
