"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store";
import {
  MapPin,
  Search,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Phone,
  Building2,
  Star,
  Download,
  RefreshCw,
  SlidersHorizontal,
  Layers,
  ArrowRight,
  Globe,
  Check,
  X,
  MessageCircle,
  Clock
} from "lucide-react";
import { Contact, PipelineStatus } from "@/types/database";

interface ScrapedLead {
  id: string;
  name: string;
  category: string;
  phone: string;
  normalizedPhone: string;
  hasPhone: boolean;
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

const PRESET_KEYWORDS = [
  "Restaurants",
  "Agences Immobilières",
  "Pharmacies",
  "Boutiques de mode",
  "Salons de coiffure",
  "Cliniques & Médecins",
  "Hôtels",
  "Supermarchés",
  "Garages & Mécanique",
  "Cabinets d'avocats"
];

const PRESET_LOCATIONS = [
  "Dakar, Sénégal",
  "Plateau, Dakar",
  "Almadies, Dakar",
  "Thiès, Sénégal",
  "Saly, Mbour, Sénégal",
  "Saint-Louis, Sénégal",
  "Abidjan, Côte d'Ivoire"
];

export function GoogleMapsScraper() {
  const { importContacts } = useApp();

  // Paramètres du Scraper
  const [searchTerm, setSearchTerm] = useState("Restaurants");
  const [location, setLocation] = useState("Dakar, Sénégal");
  const [maxPlaces, setMaxPlaces] = useState<number>(20);
  const [language, setLanguage] = useState("fr");
  const [skipClosedPlaces, setSkipClosedPlaces] = useState(true);

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
    if (!searchTerm.trim()) return;

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
          searchTerm,
          location,
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
    link.setAttribute("download", `google_maps_leads_${searchTerm.replace(/\s+/g, "_")}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header & Description */}
      <div className="bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-emerald-100 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
              <span>Propulsé par Apify (compass/crawler-google-places)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Scraper Google Maps B2B
            </h2>
            <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed">
              Extrayez en direct les coordonnées des commerces, agences et entreprises locales sur Google Maps (téléphone, note, adresse, site) et importez-les instantanément dans votre CRM WhatsApp.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex items-center gap-3 self-start md:self-auto">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/30 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-6 w-6 text-emerald-300" />
            </div>
            <div className="text-xs">
              <div className="font-bold text-white">Clé API Apify connectée</div>
              <div className="text-emerald-200 text-[11px]">Prêt pour l'extraction de leads</div>
            </div>
          </div>
        </div>
      </div>

      {/* Formulaire de recherche */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs">
        <form onSubmit={handleStartScrape} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Terme de recherche */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                1. Mots-clés ou Secteur d'activité <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Ex : Restaurant, Agence immobilière, Pharmacie..."
                  disabled={isScraping}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all"
                  required
                />
              </div>

              {/* Suggestions rapides */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[11px] text-slate-400">Suggestions :</span>
                {PRESET_KEYWORDS.slice(0, 6).map((kw) => (
                  <button
                    key={kw}
                    type="button"
                    onClick={() => setSearchTerm(kw)}
                    disabled={isScraping}
                    className={`text-[11px] px-2.5 py-1 rounded-lg transition-all ${
                      searchTerm === kw
                        ? "bg-emerald-600 text-white font-semibold"
                        : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {kw}
                  </button>
                ))}
              </div>
            </div>

            {/* Localisation */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                2. Localisation (Ville / Quartier / Pays) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ex : Dakar, Sénégal ou Plateau, Dakar"
                  disabled={isScraping}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all"
                  required
                />
              </div>

              {/* Presets rapides de localisation */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[11px] text-slate-400">Zones :</span>
                {PRESET_LOCATIONS.slice(0, 5).map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setLocation(loc)}
                    disabled={isScraping}
                    className={`text-[11px] px-2.5 py-1 rounded-lg transition-all ${
                      location === loc
                        ? "bg-emerald-600 text-white font-semibold"
                        : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Options avancées : Nombre de places, langue, filtres */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            {/* Nombre d'adresses */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Nombre de contacts à extraire
              </label>
              <div className="flex items-center gap-2">
                {[10, 20, 50, 100].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setMaxPlaces(count)}
                    disabled={isScraping}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                      maxPlaces === count
                        ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-400"
                        : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            {/* Langue */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Langue de recherche
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                disabled={isScraping}
                className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500"
              >
                <option value="fr">Français (fr)</option>
                <option value="en">English (en)</option>
                <option value="es">Español (es)</option>
                <option value="ar">العربية (ar)</option>
              </select>
            </div>

            {/* Ignorer fermés */}
            <div className="space-y-1.5 flex flex-col justify-end">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none py-2">
                <input
                  type="checkbox"
                  checked={skipClosedPlaces}
                  onChange={(e) => setSkipClosedPlaces(e.target.checked)}
                  disabled={isScraping}
                  className="rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <span>Ignorer les lieux fermés définitivement</span>
              </label>
            </div>
          </div>

          {/* Bouton d'action principal */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span>Temps estimé : environ 15 à 30 secondes pour {maxPlaces} fiches</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {isScraping ? (
                <button
                  type="button"
                  onClick={handleCancelScrape}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-all flex items-center justify-center gap-2"
                >
                  <X className="h-4 w-4" />
                  <span>Arrêter</span>
                </button>
              ) : null}

              <button
                type="submit"
                disabled={isScraping || !searchTerm.trim()}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {isScraping ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Scraping en cours ({elapsedSeconds}s)...</span>
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    <span>Lancer le Scraping Google Maps</span>
                  </>
                )}
              </button>
            </div>
          </div>
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
            Recherche : <span className="text-slate-300 font-semibold">{searchTerm}</span> à{" "}
            <span className="text-slate-300 font-semibold">{location}</span>
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

                        {/* Téléphone */}
                        <td className="p-3.5">
                          {lead.hasPhone ? (
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                                {lead.normalizedPhone || lead.phone}
                              </span>
                              <a
                                href={`https://wa.me/${(lead.normalizedPhone || lead.phone).replace(/\D/g, "")}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60"
                                title="Ouvrir discussion WhatsApp"
                              >
                                <MessageCircle className="h-3.5 w-3.5" />
                              </a>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Non renseigné</span>
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
    </div>
  );
}
