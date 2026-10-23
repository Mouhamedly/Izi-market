"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/lib/store";
import {
  Search,
  Sparkles,
  ExternalLink,
  MessageCircle,
  AlertCircle,
  CheckCircle2,
  Filter,
  Play,
  RotateCcw,
  Layers,
  Eye,
  Plus
} from "lucide-react";

function FacebookIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function InstagramIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

interface ScrapedAd {
  id: string;
  pageName: string;
  pageId: string;
  pageProfileUrl: string;
  bodyText: string;
  imageUrl: string | null;
  platforms: string[];
  startDate: string | null;
  isActive: boolean;
  linkUrl: string;
  isWhatsAppLink: boolean;
  ctaText: string;
}

export function FacebookAdsScraper() {
  const { addContact } = useApp();

  const [searchTerm, setSearchTerm] = useState("immobilier dakar");
  const [country, setCountry] = useState("SN");
  const [resultsLimit, setResultsLimit] = useState(15);
  const [activeStatus, setActiveStatus] = useState("active");

  const [isLoading, setIsLoading] = useState(false);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [currentDatasetId, setCurrentDatasetId] = useState<string | null>(null);
  const [progressStatus, setProgressStatus] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const [ads, setAds] = useState<ScrapedAd[]>([]);
  const [importedAds, setImportedAds] = useState<Record<string, boolean>>({});

  // Polling du statut Apify
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isLoading && currentRunId) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/apify/facebook-ads?runId=${currentRunId}&datasetId=${currentDatasetId || ""}`);
          const data = await res.json();

          if (!res.ok) {
            setError(data.error || "Erreur de récupération");
            setIsLoading(false);
            return;
          }

          if (data.isFinished) {
            if (data.success && data.ads) {
              setAds(data.ads);
              setProgressStatus(`✅ ${data.ads.length} publicités récupérées avec succès !`);
            } else {
              setError(data.error || "Le scraping s'est terminé sans résultats.");
            }
            setIsLoading(false);
          } else {
            setProgressStatus(data.message || "Scraping de la bibliothèque publicitaire Facebook en cours...");
          }
        } catch (err: any) {
          console.error("Polling error:", err);
        }
      }, 3500);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading, currentRunId, currentDatasetId]);

  const handleStartScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setError(null);
    setIsLoading(true);
    setProgressStatus("Initialisation de l'Acteur Apify facebook-ads-scraper...");
    setAds([]);

    try {
      const res = await fetch("/api/apify/facebook-ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          searchTerm: searchTerm.trim(),
          country,
          resultsLimit,
          activeStatus: "active"
        })
      });

      const data = await res.json();

      if (!res.ok) {
        let msg = data.error || "Échec du lancement du scraper.";
        try {
          if (typeof data.error === "string" && data.error.includes("{")) {
            const jsonPart = data.error.slice(data.error.indexOf("{"));
            const parsed = JSON.parse(jsonPart);
            if (parsed?.error?.message) {
              msg = `Erreur Apify : ${parsed.error.message}`;
            }
          }
        } catch (_) {}
        setError(msg);
        setIsLoading(false);
        return;
      }

      setCurrentRunId(data.runId);
      setCurrentDatasetId(data.datasetId);
      setProgressStatus("Analyse de la bibliothèque Facebook Ads en cours sur Apify...");
    } catch (err: any) {
      setError(err.message || "Erreur réseau");
      setIsLoading(false);
    }
  };

  const handleImportLead = async (ad: ScrapedAd) => {
    try {
      await addContact({
        name: ad.pageName,
        wa_phone: "+221 77 000 00 00", // Numéro provisoire à qualifier
        status: "nouveau",
        need: `Annonceur Facebook Ads : ${ad.pageName}`,
        budget: "Budget publicitaire actif",
        notes: `Texte de la pub : "${ad.bodyText.slice(0, 200)}..." | Lien : ${ad.linkUrl || ad.pageProfileUrl}`
      });

      setImportedAds((prev) => ({ ...prev, [ad.id]: true }));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Search & Filter Form */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="h-8 w-8 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <FacebookIcon className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Scraper Facebook Ads Library via Apify
            </h3>
            <p className="text-[11px] text-slate-500">
              Acteur : <span className="font-mono text-emerald-600">apify/facebook-ads-scraper</span>
            </p>
          </div>
        </div>

        <form onSubmit={handleStartScrape} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Mot-clé de recherche ou Nom de page Facebook
              </label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Ex: immobilier dakar, villa almadies, restaurant..."
                  className="w-full text-xs pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Pays de diffusion
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              >
                <option value="SN">🇸🇳 Sénégal (SN)</option>
                <option value="CI">🇨🇮 Côte d'Ivoire (CI)</option>
                <option value="FR">🇫🇷 France (FR)</option>
                <option value="ALL">🌍 Tous les pays (ALL)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Nombre maximum d'annonces
              </label>
              <select
                value={resultsLimit}
                onChange={(e) => setResultsLimit(Number(e.target.value))}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              >
                <option value={10}>10 annonces</option>
                <option value={20}>20 annonces</option>
                <option value={35}>35 annonces</option>
                <option value={50}>50 annonces</option>
              </select>
            </div>

          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-400">
              Scrape les annonces actives en temps réel avec les images, textes et liens WhatsApp.
            </span>

            <button
              type="submit"
              disabled={isLoading || !searchTerm.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30 transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Scraping en cours...</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Lancer le Scraper Apify</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Live Status indicator */}
        {isLoading && (
          <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300 flex items-center gap-3 animate-pulse">
            <Sparkles className="h-5 w-5 text-blue-500 animate-spin" />
            <div className="flex-1 min-w-0">
              <p className="font-bold">{progressStatus}</p>
              <p className="text-[10px] text-blue-600/80 dark:text-blue-400/80 mt-0.5">
                Exécution distante sur les serveurs Apify (Run ID: {currentRunId || "..."})
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Results Grid */}
      {ads.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>{ads.length} publicités Facebook & Instagram trouvées</span>
            </h3>
            <span className="text-xs text-slate-400">
              Mot-clé : <strong className="text-slate-700 dark:text-slate-300">{searchTerm}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {ads.map((ad) => {
              const isImported = importedAds[ad.id];

              return (
                <div
                  key={ad.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col justify-between"
                >
                  <div className="p-5 space-y-3">
                    
                    {/* Header: Page Name & Platforms */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <a
                          href={ad.pageProfileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-xs text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1.5 group"
                        >
                          <span className="truncate max-w-[180px]">{ad.pageName}</span>
                          <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                        <span className="text-[10px] text-slate-400">
                          {ad.startDate ? `Active depuis le ${ad.startDate}` : "Publicité active"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <span className="p-1 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                          <FacebookIcon className="h-3 w-3" />
                        </span>
                        <span className="p-1 rounded-md bg-pink-50 dark:bg-pink-950/50 text-pink-600 dark:text-pink-400">
                          <InstagramIcon className="h-3 w-3" />
                        </span>
                      </div>
                    </div>

                    {/* Image preview if exists */}
                    {ad.imageUrl && (
                      <div className="h-40 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={ad.imageUrl}
                          alt={ad.pageName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Ad Copy Text */}
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-700 dark:text-slate-300 leading-relaxed max-h-28 overflow-y-auto font-normal">
                      {ad.bodyText || "Pas de texte d'accroche extrait."}
                    </div>

                    {/* WhatsApp CTA detected badge */}
                    {ad.isWhatsAppLink && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <MessageCircle className="h-3 w-3" />
                        <span>Campagne WhatsApp Direct détectée</span>
                      </div>
                    )}

                  </div>

                  {/* Actions Footer */}
                  <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 bg-slate-50/50 dark:bg-slate-900/50">
                    {ad.linkUrl ? (
                      <a
                        href={ad.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        <span>{ad.ctaText}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-[10px] text-slate-400">Lien direct interne</span>
                    )}

                    <button
                      type="button"
                      disabled={isImported}
                      onClick={() => handleImportLead(ad)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isImported
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                          : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
                      }`}
                    >
                      {isImported ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          <span>Importé CRM</span>
                        </>
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5" />
                          <span>Importer Prospect</span>
                        </>
                      )}
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
