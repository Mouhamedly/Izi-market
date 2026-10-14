"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store";
import {
  MapPin,
  Search,
  AlertCircle,
  Star,
  Download,
  RefreshCw,
  ArrowRight,
  Globe,
  Check,
  X,
  MessageCircle,
  MessageSquare,
  Send,
  Copy,
  Sparkles,
  Mail
} from "lucide-react";
import { Contact, PipelineStatus } from "@/types/database";

interface ScrapedLead {
  id: string;
  name: string;
  category: string;
  phone: string;
  normalizedPhone: string;
  hasPhone: boolean;
  email?: string;
  hasEmail?: boolean;
  address: string;
  city: string;
  countryCode: string;
  website: string;
  url: string;
  totalScore: number | null;
  reviewsCount: number;
  openingHours?: any;
  scrapedAt: string;
}

export function GoogleMapsScraper() {
  const { business, importContacts } = useApp();

  // Paramètres du Scraper (Inspiré de l'interface Google Maps Leads)
  const [sector, setSector] = useState("Agences Immobilières");
  const [city, setCity] = useState("Dakar");
  const [country, setCountry] = useState("Sénégal");
  const [maxPlaces, setMaxPlaces] = useState<number>(20);
  const [language, setLanguage] = useState("fr");
  const [skipClosedPlaces, setSkipClosedPlaces] = useState(true);

  // Terme de recherche combiné
  const currentSearchTerm = sector.trim() || "Entreprise";
  const currentLocation = city.trim() ? `${city.trim()}, ${country.trim()}` : country.trim();

  // État du Scraping
  const [isScraping, setIsScraping] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [currentDatasetId, setCurrentDatasetId] = useState<string | null>(null);
  const [scrapingStatus, setScrapingStatus] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Résultats & Sélection
  const [results, setResults] = useState<ScrapedLead[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterOnlyWithPhone, setFilterOnlyWithPhone] = useState(false);
  const [targetStatus, setTargetStatus] = useState<PipelineStatus>("nouveau");

  // État de l'import CRM
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    imported: number;
    updated: number;
    total: number;
  } | null>(null);

  // Modal de prospection multi-canal (WhatsApp & Email)
  const [selectedLeadForMessage, setSelectedLeadForMessage] = useState<ScrapedLead | null>(null);
  const [outreachChannel, setOutreachChannel] = useState<"whatsapp" | "email">("whatsapp");
  const [messageTemplate, setMessageTemplate] = useState<"services" | "partenariat" | "rdv">("services");
  const [whatsappText, setWhatsappText] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailRecipient, setEmailRecipient] = useState("");
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [isSavingLeadToCrm, setIsSavingLeadToCrm] = useState(false);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Nettoyage des timers lors du démontage
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  // Décompte du temps écoulé pendant le scraping
  useEffect(() => {
    if (isScraping) {
      setElapsedSeconds(0);
      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isScraping]);

  // Lancer le scraping sur Apify
  const handleStartScrape = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!sector.trim()) return;

    setIsScraping(true);
    setErrorMessage(null);
    setImportResult(null);
    setScrapingStatus("Initialisation de l'acteur Apify (compass/crawler-google-places)...");

    try {
      const response = await fetch("/api/apify/google-maps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start",
          searchTerm: sector.trim(),
          location: currentLocation,
          maxPlaces,
          language,
          skipClosedPlaces
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Échec du démarrage de l'extraction sur Apify.");
      }

      setCurrentRunId(data.runId);
      setCurrentDatasetId(data.datasetId);
      setScrapingStatus("Scraping en cours sur Google Maps via Apify...");

      // Démarrer le polling pour vérifier la progression
      startPolling(data.runId, data.datasetId);
    } catch (err: any) {
      console.error(err);
      setIsScraping(false);
      setErrorMessage(err.message || "Erreur de connexion à Apify.");
    }
  };

  // Annuler le scraping en cours
  const handleCancelScrape = async () => {
    if (!currentRunId) return;
    try {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      await fetch("/api/apify/google-maps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "abort", runId: currentRunId })
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsScraping(false);
      setScrapingStatus("Scraping interrompu.");
    }
  };

  // Sondage régulier du statut du run
  const startPolling = (runId: string, datasetId: string) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/apify/google-maps?runId=${runId}&datasetId=${datasetId}`);
        const result = await res.json();

        if (!result.success && result.error) {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setIsScraping(false);
          setErrorMessage(result.error);
          return;
        }

        if (result.isFinished && result.status === "SUCCEEDED") {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setIsScraping(false);

          const fetchedLeads: ScrapedLead[] = result.leads || [];
          setResults(fetchedLeads);

          // Par défaut, sélectionner tous les leads qui possèdent un numéro de téléphone
          const defaultSelected = new Set<string>();
          fetchedLeads.forEach((lead) => {
            if (lead.hasPhone) defaultSelected.add(lead.id);
          });
          // Si aucun n'a de tél, tout sélectionner
          if (defaultSelected.size === 0) {
            fetchedLeads.forEach((l) => defaultSelected.add(l.id));
          }
          setSelectedIds(defaultSelected);
          setScrapingStatus(`Terminé ! ${fetchedLeads.length} établissements extraits.`);
        } else if (result.status === "RUNNING") {
          setScrapingStatus("Collecte des fiches et numéros de téléphone sur Google Maps...");
        }
      } catch (err) {
        console.error("[Polling error]", err);
      }
    }, 3500); // Poll toutes les 3.5 secondes
  };

  // Filtrage des résultats
  const displayedResults = results.filter((lead) => {
    if (filterOnlyWithPhone && !lead.hasPhone) return false;
    return true;
  });

  // Sélection globale
  const handleToggleSelectAll = () => {
    if (selectedIds.size === displayedResults.length) {
      setSelectedIds(new Set());
    } else {
      const all = new Set<string>();
      displayedResults.forEach((r) => all.add(r.id));
      setSelectedIds(all);
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Importer les prospects sélectionnés dans le CRM
  const handleImportToCRM = async () => {
    const leadsToImport = results.filter((r) => selectedIds.has(r.id));
    if (leadsToImport.length === 0) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      const formattedContacts: Omit<Contact, "id" | "business_id" | "created_at" | "updated_at">[] = leadsToImport.map((lead) => {
        // Préparer une note riche contenant toutes les données de Google Maps
        const notesParts = [
          `[Scraper Google Maps Apify]`,
          lead.category ? `Catégorie : ${lead.category}` : null,
          lead.address ? `Adresse : ${lead.address}` : null,
          lead.city ? `Ville : ${lead.city}` : null,
          lead.totalScore ? `Note : ${lead.totalScore}/5 (${lead.reviewsCount} avis)` : null,
          lead.website ? `Site web : ${lead.website}` : null,
          lead.url ? `Fiche Google Maps : ${lead.url}` : null
        ].filter(Boolean);

        return {
          name: lead.name || "Prospect Google Maps",
          wa_phone: lead.normalizedPhone || lead.phone || "",
          status: targetStatus,
          need: lead.category || "Prospect Google Maps",
          budget: null,
          notes: notesParts.join(" | "),
          last_activity_at: new Date().toISOString(),
          followup_count: 0,
          followup_status: "pending" as const
        };
      });

      const res = await importContacts(formattedContacts, true);
      setImportResult({
        success: true,
        imported: res.imported,
        updated: res.updated,
        total: res.total
      });
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Erreur lors de l'enregistrement des prospects dans Supabase.");
    } finally {
      setIsImporting(false);
    }
  };

  // Télécharger au format CSV
  const handleDownloadCSV = () => {
    if (results.length === 0) return;
    const separator = ";";
    const headers = [
      "Nom Entreprise",
      "Catégorie",
      "Téléphone Formaté",
      "Téléphone Brut",
      "Email",
      "Adresse",
      "Ville",
      "Note",
      "Nombre d'avis",
      "Site Web",
      "Lien Google Maps"
    ];

    const rows = results.map((r) => [
      `"${(r.name || "").replace(/"/g, '""')}"`,
      `"${(r.category || "").replace(/"/g, '""')}"`,
      `"${(r.normalizedPhone || "").replace(/"/g, '""')}"`,
      `"${(r.phone || "").replace(/"/g, '""')}"`,
      `"${(r.email || "").replace(/"/g, '""')}"`,
      `"${(r.address || "").replace(/"/g, '""')}"`,
      `"${(r.city || "").replace(/"/g, '""')}"`,
      `"${r.totalScore ?? ""}"`,
      `"${r.reviewsCount ?? ""}"`,
      `"${(r.website || "").replace(/"/g, '""')}"`,
      `"${(r.url || "").replace(/"/g, '""')}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(separator), ...rows.map((r) => r.join(separator))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `google_maps_leads_${sector.replace(/\s+/g, "_")}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Générateur de message WhatsApp
  const buildWhatsAppMessage = (lead: ScrapedLead, type: "services" | "partenariat" | "rdv") => {
    const bizName = business?.name || "Notre entreprise";
    const leadCategory = lead.category || "votre secteur d'activité";
    const leadCity = lead.city || "votre zone";

    if (type === "services") {
      return `Bonjour ${lead.name},\n\nJe me permets de vous contacter car j'ai découvert votre activité dans le domaine de "${leadCategory}" à ${leadCity}.\n\nNous accompagnons les professionnels comme vous chez ${bizName} pour optimiser votre visibilité, automatiser votre gestion commerciale et attirer davantage de clients qualifiés.\n\nSeriez-vous ouvert(e) à un court échange de 5 minutes cette semaine pour explorer comment nous pourrions vous faire gagner du temps et booster vos résultats ?\n\nBien cordialement,\nL'équipe ${bizName}`;
    }

    if (type === "rdv") {
      return `Bonjour l'équipe de ${lead.name},\n\nJ'ai découvert vos services à ${leadCity} et j'apprécie beaucoup la qualité de vos prestations.\n\nJ'aimerais vous proposer un court échange téléphonique de 10 minutes avec notre responsable afin de vous présenter des opportunités concrètes adaptées aux entreprises de votre secteur.\n\nQuel créneau vous conviendrait le mieux cette semaine (en matinée ou l'après-midi) ?\n\nExcellente journée à vous,\n${bizName}`;
    }

    // Partenariat
    return `Bonjour ${lead.name},\n\nNous développons actuellement un réseau de partenaires de confiance sur ${leadCity} et le profil de votre établissement (${leadCategory}) a particulièrement retenu notre attention.\n\nPourrions-nous échanger brièvement afin d'étudier de potentielles opportunités de collaboration et de synergies commerciales entre nos deux structures ?\n\nAu plaisir d'échanger avec vous,\n${bizName}`;
  };

  // Générateur d'email professionnel (Objet + Corps)
  const buildEmailContent = (lead: ScrapedLead, type: "services" | "partenariat" | "rdv") => {
    const bizName = business?.name || "Notre entreprise";
    const leadCategory = lead.category || "votre secteur d'activité";
    const leadCity = lead.city || "votre zone";

    if (type === "services") {
      return {
        subject: `Opportunité de croissance pour ${lead.name} — ${bizName}`,
        body: `Bonjour l'équipe de ${lead.name},\n\nJ'ai eu le plaisir de découvrir votre activité dans le secteur "${leadCategory}" à ${leadCity}.\n\nChez ${bizName}, nous accompagnons les entreprises pour développer leur visibilité, attirer plus de clients qualifiés et automatiser leur suivi commercial.\n\nAu vu de votre positionnement, nous avons identifié plusieurs axes concrets qui pourraient vous permettre d'accélérer votre croissance et de gagner un temps précieux au quotidien.\n\nSeriez-vous disponible pour un court échange téléphonique de 5 à 10 minutes cette semaine afin d'en discuter ?\n\nJe reste à votre entière disposition.\n\nBien cordialement,\nL'équipe ${bizName}`
      };
    }

    if (type === "rdv") {
      return {
        subject: `Proposition d'échange téléphonique — ${lead.name} & ${bizName}`,
        body: `Bonjour,\n\nJe m'adresse à la direction ou au responsable commercial de ${lead.name}.\n\nNous suivons avec intérêt les entreprises dynamiques du secteur "${leadCategory}" à ${leadCity}, et nous aimerions vous présenter des opportunités concrètes adaptées à votre activité.\n\nAuriez-vous une disponibilité de 10 minutes pour un échange téléphonique cette semaine ?\n\nN'hésitez pas à m'indiquer le jour et le créneau qui vous conviendraient le mieux (matin ou après-midi).\n\nBien cordialement,\n${bizName}`
      };
    }

    // Partenariat
    return {
      subject: `Opportunité de partenariat B2B — ${bizName} & ${lead.name}`,
      body: `Bonjour ${lead.name},\n\nNous développons actuellement un réseau de partenariats stratégiques avec les acteurs clés dans le domaine "${leadCategory}" à ${leadCity}.\n\nNous serions ravis d'étudier avec vous de possibles synergies commerciales mutuellement profitables (recommandations croisées, offres complémentaires).\n\nSeriez-vous ouvert(e) à un premier échange d'introduction cette semaine ?\n\nAu plaisir de vous lire,\n${bizName}`
    };
  };

  const handleOpenMessageModal = (lead: ScrapedLead, initialChannel: "whatsapp" | "email" = "whatsapp") => {
    setSelectedLeadForMessage(lead);
    setOutreachChannel(initialChannel);
    setMessageTemplate("services");

    // Initialiser le texte WhatsApp
    setWhatsappText(buildWhatsAppMessage(lead, "services"));

    // Initialiser l'objet et corps email
    const emailData = buildEmailContent(lead, "services");
    setEmailSubject(emailData.subject);
    setEmailBody(emailData.body);

    // Initialiser le destinataire email
    let initialEmail = lead.email || "";
    if (!initialEmail && lead.website) {
      try {
        const cleanHost = lead.website.replace(/^https?:\/\//i, "").replace(/^www\./i, "").split("/")[0];
        if (cleanHost && cleanHost.includes(".")) {
          initialEmail = `contact@${cleanHost}`;
        }
      } catch {}
    }
    setEmailRecipient(initialEmail);
    setCopiedSuccess(false);
  };

  const handleSelectTemplate = (type: "services" | "partenariat" | "rdv") => {
    if (!selectedLeadForMessage) return;
    setMessageTemplate(type);
    setWhatsappText(buildWhatsAppMessage(selectedLeadForMessage, type));
    const emailData = buildEmailContent(selectedLeadForMessage, type);
    setEmailSubject(emailData.subject);
    setEmailBody(emailData.body);
  };

  const handleCopyCurrentContent = async () => {
    try {
      if (outreachChannel === "whatsapp") {
        await navigator.clipboard.writeText(whatsappText);
      } else {
        const fullEmail = `Objet : ${emailSubject}\n\n${emailBody}`;
        await navigator.clipboard.writeText(fullEmail);
      }
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 3000);
    } catch {}
  };

  const handleSendViaWhatsApp = (lead: ScrapedLead) => {
    const rawPhone = lead.normalizedPhone || lead.phone;
    const digits = rawPhone.replace(/\D/g, "");
    if (!digits) {
      alert("Aucun numéro de téléphone disponible pour ce prospect.");
      return;
    }
    const url = `https://wa.me/${digits}?text=${encodeURIComponent(whatsappText)}`;
    window.open(url, "_blank");
  };

  const handleSendViaEmail = (lead: ScrapedLead) => {
    const recipient = emailRecipient.trim();
    if (!recipient) {
      alert("Veuillez renseigner une adresse email pour ce prospect.");
      return;
    }
    const mailtoUrl = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.location.href = mailtoUrl;
  };

  const handleImportAndSend = async (lead: ScrapedLead) => {
    setIsSavingLeadToCrm(true);
    try {
      const isWa = outreachChannel === "whatsapp";
      const notesParts = [
        isWa ? `[Scraper Google Maps - Démarchage WhatsApp]` : `[Scraper Google Maps - Démarchage Email]`,
        emailRecipient ? `Email : ${emailRecipient}` : null,
        lead.category ? `Catégorie : ${lead.category}` : null,
        lead.address ? `Adresse : ${lead.address}` : null,
        lead.city ? `Ville : ${lead.city}` : null,
        lead.totalScore ? `Note : ${lead.totalScore}/5 (${lead.reviewsCount} avis)` : null,
        lead.website ? `Site web : ${lead.website}` : null,
        isWa ? `Message WhatsApp : "${whatsappText.slice(0, 100)}..."` : `Objet Email : "${emailSubject}"`
      ].filter(Boolean);

      await importContacts([
        {
          name: lead.name || "Prospect Google Maps",
          wa_phone: lead.normalizedPhone || lead.phone || emailRecipient || "Non renseigné",
          status: (messageTemplate === "rdv" ? "rdv" : "interesse") as PipelineStatus,
          need: lead.category || "Prospect Google Maps",
          budget: null,
          notes: notesParts.join(" | "),
          last_activity_at: new Date().toISOString(),
          followup_count: 1,
          followup_status: "pending" as const
        }
      ], true);

      if (isWa) {
        handleSendViaWhatsApp(lead);
      } else {
        handleSendViaEmail(lead);
      }
      setSelectedLeadForMessage(null);
    } catch (e) {
      console.error(e);
      if (outreachChannel === "whatsapp") {
        handleSendViaWhatsApp(lead);
      } else {
        handleSendViaEmail(lead);
      }
    } finally {
      setIsSavingLeadToCrm(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Carte principale de recherche inspirée de la capture d'écran */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/90 dark:border-slate-800 overflow-hidden max-w-3xl mx-auto">
        {/* Entête Vert Forêt Sombre Élégant */}
        <div className="bg-[#12281a] dark:bg-[#0c1a11] px-6 py-8 sm:px-10 sm:py-9 text-center text-white">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-serif">
            Trouver de nouveaux leads
          </h2>
          <p className="text-sm sm:text-base text-emerald-100/80 mt-2 font-normal">
            Remplissez ce formulaire pour lancer l'extraction depuis Google Maps.
          </p>
        </div>

        {/* Corps du Formulaire */}
        <form onSubmit={handleStartScrape} className="p-6 sm:p-9 space-y-6">
          {/* Secteur d'activité */}
          <div className="space-y-2">
            <label className="block text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Secteur d'activité <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                placeholder="ex: Plombier, Agence immobilière, Restaurant..."
                disabled={isScraping}
                className="w-full px-4 py-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-base focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all shadow-xs"
                required
              />
            </div>

            {/* Suggestions rapides sous l'input */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[11px] text-slate-400 font-medium">Suggestions :</span>
              {["Plombier", "Agence immobilière", "Restaurant", "Pharmacie", "Boutique de mode", "Clinique", "Hôtel"].map((kw) => (
                <button
                  key={kw}
                  type="button"
                  onClick={() => setSector(kw)}
                  disabled={isScraping}
                  className={`text-[11px] px-2.5 py-1 rounded-lg transition-all ${
                    sector.toLowerCase() === kw.toLowerCase()
                      ? "bg-[#12281a] text-white font-semibold"
                      : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {kw}
                </button>
              ))}
            </div>
          </div>

          {/* Ligne Ville & Pays */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Ville */}
            <div className="space-y-2">
              <label className="block text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Ville
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="ex: Dakar, Abidjan..."
                disabled={isScraping}
                className="w-full px-4 py-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-base focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all shadow-xs"
              />
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                {["Dakar", "Plateau", "Almadies", "Thiès", "Saly"].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCity(c)}
                    disabled={isScraping}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Pays */}
            <div className="space-y-2">
              <label className="block text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Pays
              </label>
              <div className="relative">
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  disabled={isScraping}
                  className="w-full px-4 py-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-base appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all shadow-xs pr-10 cursor-pointer"
                >
                  <option value="Sénégal">Sénégal</option>
                  <option value="Côte d'Ivoire">Côte d'Ivoire</option>
                  <option value="Mali">Mali</option>
                  <option value="Guinée">Guinée</option>
                  <option value="Cameroun">Cameroun</option>
                  <option value="Bénin">Bénin</option>
                  <option value="Togo">Togo</option>
                  <option value="France">France</option>
                  <option value="Autre">Autre</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Options avancées : Nombre de places, langue, filtres */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Volume à extraire :</span>
              {[10, 20, 50, 100].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setMaxPlaces(num)}
                  disabled={isScraping}
                  className={`px-2.5 py-1 rounded-lg border font-bold transition-all ${
                    maxPlaces === num
                      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-400"
                      : "border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={skipClosedPlaces}
                onChange={(e) => setSkipClosedPlaces(e.target.checked)}
                disabled={isScraping}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>Ignorer les lieux fermés</span>
            </label>
          </div>

          {/* Bouton Rouge Exactement comme la capture d'écran */}
          <button
            type="submit"
            disabled={isScraping || !sector.trim()}
            className="w-full py-4 px-6 rounded-2xl bg-[#d9383a] hover:bg-[#c6282a] active:scale-[0.99] text-white font-bold text-base shadow-lg shadow-red-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
          >
            {isScraping ? (
              <>
                <RefreshCw className="h-5 w-5 animate-spin" />
                <span>Extraction en cours sur Google Maps ({elapsedSeconds}s)...</span>
              </>
            ) : (
              <>
                <Search className="h-5 w-5 stroke-[2.5]" />
                <span>Extraire les prospects</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Message d'erreur */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div className="flex-1">
            <div className="font-bold">Une erreur est survenue lors du scraping</div>
            <div className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">{errorMessage}</div>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="p-1 hover:bg-rose-100 dark:hover:bg-rose-900 rounded-lg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* État en direct pendant l'exécution */}
      {isScraping && (
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 flex flex-col items-center justify-center text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-400 animate-spin" />
            <MapPin className="h-6 w-6 text-emerald-400 absolute inset-0 m-auto animate-pulse" />
          </div>
          <div>
            <div className="text-base font-bold flex items-center justify-center gap-2">
              <span>Collecte en cours sur Google Maps</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-mono">
                {elapsedSeconds}s
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-md">
              {scrapingStatus || "Communication avec l'acteur Apify..."}
            </p>
          </div>
          <div className="text-[11px] text-slate-500">
            Recherche : <span className="text-slate-300 font-semibold">{sector}</span> à{" "}
            <span className="text-slate-300 font-semibold">{currentLocation}</span>
          </div>
        </div>
      )}

      {/* Notification d'import CRM réussi */}
      {importResult && (
        <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Check className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold">
                {importResult.imported} prospects ajoutés au CRM ({importResult.updated} mis à jour)
              </div>
              <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                Les coordonnées Google Maps ont été enregistrées avec succès dans Supabase.
              </div>
            </div>
          </div>
          <Link
            href="/app/prospects"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-all"
          >
            <span>Voir dans le CRM</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* Résultats et tableau d'import */}
      {results.length > 0 && !isScraping && (
        <div className="space-y-4">
          {/* Métriques et Barre d'actions */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Statistiques rapides */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
                <span className="text-slate-400">Total trouvés : </span>
                <span className="font-extrabold text-slate-800 dark:text-slate-100">{results.length}</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                <span>Avec Téléphone : </span>
                <span className="font-extrabold">{results.filter((r) => r.hasPhone).length}</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400 text-xs font-semibold">
                <span>Sélectionnés : </span>
                <span className="font-extrabold">{selectedIds.size}</span>
              </div>
            </div>

            {/* Filtre Téléphone & Sélection */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setFilterOnlyWithPhone(!filterOnlyWithPhone)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                  filterOnlyWithPhone
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
                }`}
              >
                {filterOnlyWithPhone ? "Filtre: Avec Tél uniquement" : "Tous les résultats"}
              </button>

              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                {selectedIds.size === displayedResults.length ? "Tout désélectionner" : "Tout sélectionner"}
              </button>

              <button
                type="button"
                onClick={handleDownloadCSV}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5"
                title="Télécharger la liste au format CSV"
              >
                <Download className="h-3.5 w-3.5 text-slate-500" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Action Barre : Import CRM */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
                Statut dans le CRM :
              </span>
              <select
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value as PipelineStatus)}
                className="py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500"
              >
                <option value="nouveau">Nouveau prospect</option>
                <option value="contacte">Contacté</option>
                <option value="qualifie">Qualifié</option>
                <option value="devis_envoye">Devis envoyé</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleImportToCRM}
              disabled={selectedIds.size === 0 || isImporting}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {isImporting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Enregistrement dans Supabase...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>Importer {selectedIds.size} prospect{selectedIds.size > 1 ? "s" : ""} dans le CRM</span>
                </>
              )}
            </button>
          </div>

          {/* Liste / Tableau des leads */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                  <tr>
                    <th className="p-3.5 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={displayedResults.length > 0 && selectedIds.size === displayedResults.length}
                        onChange={handleToggleSelectAll}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                    </th>
                    <th className="p-3.5">Entreprise & Catégorie</th>
                    <th className="p-3.5">Téléphone WhatsApp</th>
                    <th className="p-3.5">Note & Avis</th>
                    <th className="p-3.5">Adresse / Ville</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {displayedResults.map((lead) => {
                    const isSelected = selectedIds.has(lead.id);
                    return (
                      <tr
                        key={lead.id}
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${
                          isSelected ? "bg-emerald-50/30 dark:bg-emerald-950/20" : ""
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="p-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectOne(lead.id)}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                        </td>

                        {/* Nom & Catégorie */}
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>{lead.name}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                            {lead.category || "Commerce"}
                          </div>
                        </td>

                        {/* Téléphone & Email */}
                        <td className="p-3.5">
                          {lead.hasPhone ? (
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                                {lead.normalizedPhone || lead.phone}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleOpenMessageModal(lead, "whatsapp")}
                                className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 cursor-pointer"
                                title="Préparer message WhatsApp"
                              >
                                <MessageCircle className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Non renseigné</span>
                          )}
                          {lead.email && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[170px] mt-0.5 flex items-center gap-1" title={lead.email}>
                              <Mail className="h-3 w-3 text-sky-500 shrink-0" />
                              <span>{lead.email}</span>
                            </div>
                          )}
                        </td>

                        {/* Note & Avis */}
                        <td className="p-3.5">
                          {lead.totalScore ? (
                            <div className="flex items-center gap-1.5">
                              <div className="flex items-center text-amber-500 font-bold">
                                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 mr-1" />
                                <span>{lead.totalScore.toFixed(1)}</span>
                              </div>
                              <span className="text-[10px] text-slate-400">
                                ({lead.reviewsCount} avis)
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400">—</span>
                          )}
                        </td>

                        {/* Adresse */}
                        <td className="p-3.5 max-w-xs truncate text-slate-600 dark:text-slate-300">
                          <span title={lead.address}>{lead.address || lead.city || "—"}</span>
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 text-right">
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            {lead.url && (
                              <a
                                href={lead.url}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] inline-flex items-center gap-1"
                                title="Voir sur Google Maps"
                              >
                                <MapPin className="h-3 w-3 text-rose-500" />
                                <span className="hidden sm:inline">Maps</span>
                              </a>
                            )}
                            {lead.website && (
                              <a
                                href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] inline-flex items-center gap-1"
                                title="Visiter le site internet"
                              >
                                <Globe className="h-3 w-3 text-teal-500" />
                                <span className="hidden sm:inline">Site</span>
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenMessageModal(lead, "whatsapp")}
                              className="p-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold inline-flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                              title="Contacter ce prospect par message WhatsApp professionnel"
                            >
                              <MessageSquare className="h-3 w-3 text-emerald-500" />
                              <span>WhatsApp</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenMessageModal(lead, "email")}
                              className="p-1.5 rounded-lg border border-sky-500/40 bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 text-[11px] font-semibold inline-flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                              title="Contacter ce prospect par Email professionnel"
                            >
                              <Mail className="h-3 w-3 text-sky-500" />
                              <span>Email</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Prospection Multi-Canal (WhatsApp & Email) */}
      {selectedLeadForMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header du Modal avec couleur adaptée au canal */}
            <div
              className={`px-6 py-5 text-white flex items-start justify-between transition-colors ${
                outreachChannel === "whatsapp"
                  ? "bg-gradient-to-r from-emerald-600 to-teal-700"
                  : "bg-gradient-to-r from-sky-600 to-indigo-700"
              }`}
            >
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-semibold mb-1">
                  <Sparkles className="h-3.5 w-3.5" />
                  Prospection Commerciale B2B
                </div>
                <h3 className="text-xl font-bold tracking-tight">
                  Contacter {selectedLeadForMessage.name}
                </h3>
                <p className="text-xs text-white/80 mt-0.5">
                  {[selectedLeadForMessage.category, selectedLeadForMessage.city].filter(Boolean).join(" • ") || "Prospect Google Maps"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLeadForMessage(null)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Corps du Modal */}
            <div className="p-6 overflow-y-auto space-y-4 text-slate-800 dark:text-slate-100 flex-1">
              {/* Sélecteur de Canal : WhatsApp vs Email */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Canal de contact
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setOutreachChannel("whatsapp")}
                    className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      outreachChannel === "whatsapp"
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOutreachChannel("email")}
                    className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      outreachChannel === "email"
                        ? "bg-sky-600 text-white shadow-md shadow-sky-600/20"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <Mail className="h-4 w-4" />
                    <span>Email Professionnel</span>
                  </button>
                </div>
              </div>

              {/* Détails du Destinataire selon le canal */}
              {outreachChannel === "whatsapp" ? (
                <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 text-xs">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-slate-600 dark:text-slate-300">Numéro WhatsApp :</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {selectedLeadForMessage.normalizedPhone || selectedLeadForMessage.phone || (
                        <span className="text-amber-500 italic">Pas de numéro détecté</span>
                      )}
                    </span>
                  </div>
                  {selectedLeadForMessage.city && (
                    <span className="text-slate-500 dark:text-slate-400">
                      📍 {selectedLeadForMessage.city}
                    </span>
                  )}
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-200/80 dark:border-sky-800/40 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Mail className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0" />
                    <label htmlFor="emailRecipientInput" className="font-semibold">
                      Adresse email du destinataire :
                    </label>
                  </div>
                  <input
                    id="emailRecipientInput"
                    type="email"
                    value={emailRecipient}
                    onChange={(e) => setEmailRecipient(e.target.value)}
                    placeholder="contact@entreprise.com ou direction@..."
                    className="w-full px-3 py-2 rounded-xl border border-sky-300 dark:border-sky-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    {selectedLeadForMessage.email
                      ? "✓ Adresse email détectée automatiquement sur la fiche"
                      : selectedLeadForMessage.website
                      ? `💡 Pré-rempli avec le nom de domaine (${selectedLeadForMessage.website}). Modifiable à volonté.`
                      : "Saisissez l'adresse email de contact du prospect."}
                  </p>
                </div>
              )}

              {/* Sélecteur de Modèle de Message */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Objectif / Modèle de démarchage
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectTemplate("services")}
                    className={`px-3 py-2.5 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer ${
                      messageTemplate === "services"
                        ? outreachChannel === "whatsapp"
                          ? "border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20"
                          : "border-sky-500 bg-sky-50/80 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 ring-2 ring-sky-500/20"
                        : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    💼 Offre de services
                    <p className="text-[10px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                      Proposer vos solutions & accélérer leur activité
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectTemplate("rdv")}
                    className={`px-3 py-2.5 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer ${
                      messageTemplate === "rdv"
                        ? outreachChannel === "whatsapp"
                          ? "border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20"
                          : "border-sky-500 bg-sky-50/80 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 ring-2 ring-sky-500/20"
                        : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    📅 Prise de RDV
                    <p className="text-[10px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                      Proposer un échange rapide de 5-10 min
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectTemplate("partenariat")}
                    className={`px-3 py-2.5 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer ${
                      messageTemplate === "partenariat"
                        ? outreachChannel === "whatsapp"
                          ? "border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20"
                          : "border-sky-500 bg-sky-50/80 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 ring-2 ring-sky-500/20"
                        : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    🤝 Partenariat B2B
                    <p className="text-[10px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                      Synergies & réseau professionnel
                    </p>
                  </button>
                </div>
              </div>

              {/* Éditeur de Contenu (WhatsApp ou Email) */}
              {outreachChannel === "whatsapp" ? (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Message WhatsApp (personnalisable)
                    </label>
                    <button
                      type="button"
                      onClick={handleCopyCurrentContent}
                      className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer font-medium"
                    >
                      {copiedSuccess ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copié !</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copier</span>
                        </>
                      )}
                    </button>
                  </div>
                  <textarea
                    value={whatsappText}
                    onChange={(e) => setWhatsappText(e.target.value)}
                    rows={8}
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 p-4 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 leading-relaxed resize-none text-slate-900 dark:text-white"
                    placeholder="Écrivez votre message WhatsApp..."
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                    <span>✨ Personnalisé avec le nom du prospect et de votre entreprise</span>
                    <span>{whatsappText.length} caractères</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      Objet de l'email
                    </label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                      placeholder="Objet de l'email..."
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Corps de l'email
                      </label>
                      <button
                        type="button"
                        onClick={handleCopyCurrentContent}
                        className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 cursor-pointer font-medium"
                      >
                        {copiedSuccess ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-sky-500" />
                            <span className="text-sky-600 dark:text-sky-400 font-semibold">Copié !</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copier l'email</span>
                          </>
                        )}
                      </button>
                    </div>
                    <textarea
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      rows={8}
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 p-4 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-sky-500 leading-relaxed resize-none text-slate-900 dark:text-white"
                      placeholder="Corps de l'email..."
                    />
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                      <span>✨ Prêt à envoyer via votre logiciel de messagerie</span>
                      <span>{emailBody.length} caractères</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Pied du Modal avec actions adaptées */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSelectedLeadForMessage(null)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold cursor-pointer transition-colors"
              >
                Annuler
              </button>

              <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-2">
                {outreachChannel === "whatsapp" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleSendViaWhatsApp(selectedLeadForMessage)}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-emerald-500/50 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>Ouvrir WhatsApp</span>
                    </button>

                    <button
                      type="button"
                      disabled={isSavingLeadToCrm}
                      onClick={() => handleImportAndSend(selectedLeadForMessage)}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold inline-flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                    >
                      {isSavingLeadToCrm ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      <span>Enregistrer au CRM & Envoyer</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleSendViaEmail(selectedLeadForMessage)}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-sky-500/50 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/50 text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                    >
                      <Mail className="h-4 w-4" />
                      <span>Ouvrir dans ma messagerie</span>
                    </button>

                    <button
                      type="button"
                      disabled={isSavingLeadToCrm}
                      onClick={() => handleImportAndSend(selectedLeadForMessage)}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white text-xs font-bold inline-flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                    >
                      {isSavingLeadToCrm ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      <span>Enregistrer au CRM & Envoyer</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
