"use client";

import React, { useState } from "react";
import Link from "next/link";
import { GoogleMapsScraper } from "@/components/leads/GoogleMapsScraper";
import { FacebookAdsScraper } from "@/components/leads/FacebookAdsScraper";
import { Compass, Users, MapPin, Sparkles } from "lucide-react";

function FacebookIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

export default function ProspectionPage() {
  const [activeTab, setActiveTab] = useState<"gmaps" | "fbads">("fbads");

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-2">
            <Compass className="h-3.5 w-3.5" />
            <span>Génération de Leads & Prospection B2B</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Centre de Prospection Automatisée
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Collectez automatiquement des prospects ultra-qualifiés via les API Apify (Facebook Ads Library & Google Maps) et convertissez-les directement dans votre CRM.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href="/app/prospects"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-xs transition-all"
          >
            <Users className="h-3.5 w-3.5 text-emerald-600" />
            <span>Ouvrir Pipeline CRM</span>
          </Link>
        </div>
      </div>

      {/* Source Selector Tabs */}
      <div className="flex items-center p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/60 max-w-md">
        <button
          type="button"
          onClick={() => setActiveTab("fbads")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "fbads"
              ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <FacebookIcon className="h-3.5 w-3.5 text-blue-600" />
          <span>Facebook Ads Scraper</span>
          <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-md">
            Apify
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("gmaps")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "gmaps"
              ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <MapPin className="h-3.5 w-3.5 text-emerald-600" />
          <span>Google Maps</span>
        </button>
      </div>

      {/* Main Scraper Component Based on Active Tab */}
      {activeTab === "fbads" ? <FacebookAdsScraper /> : <GoogleMapsScraper />}
    </div>
  );
}

