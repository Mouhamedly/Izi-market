"use client";

import React from "react";
import Link from "next/link";
import { GoogleMapsScraper } from "@/components/leads/GoogleMapsScraper";
import { Compass, Users, Sparkles, ArrowLeft } from "lucide-react";

export default function ProspectionPage() {
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
            Prospection Google Maps
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Collectez automatiquement des commerces et professionnels locaux grâce à l'API Apify Google Maps Scraper, et alimentez votre pipeline de vente en 1 clic.
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

      {/* Main Scraper Component */}
      <GoogleMapsScraper />
    </div>
  );
}
