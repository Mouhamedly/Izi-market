"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store";
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  Users,
  Package,
  HelpCircle,
  Database,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Table,
  MapPin,
  Compass
} from "lucide-react";
import { GoogleMapsScraper } from "@/components/leads/GoogleMapsScraper";
import {
  parseDelimitedText,
  mapRowsToContacts,
  mapRowsToCatalog,
  mapRowsToFaqs,
  downloadCsvTemplate,
  exportDatabaseBackup,
  normalizePhoneNumber
} from "@/lib/importer";

type ImportTab = "contacts" | "catalog" | "faq" | "database" | "google-maps";

export default function ImportDatabasePage() {
  const {
    business,
    contacts,
    catalog,
    faqs,
    appointments,
    importContacts,
    importCatalogItems,
    importFaqs,
    importFullDatabase
  } = useApp();

  const [activeTab, setActiveTab] = useState<ImportTab>("contacts");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [updateExisting, setUpdateExisting] = useState(true);

  // Prévisualisation
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [selectedPhoneCol, setSelectedPhoneCol] = useState<string>("");
  const [selectedNameCol, setSelectedNameCol] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    imported: number;
    updated?: number;
    total: number;
    message: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Réinitialisation lors du changement d'onglet
  const handleTabChange = (tab: ImportTab) => {
    setActiveTab(tab);
    setFile(null);
    setParsedRows([]);
    setRawRows([]);
    setRawHeaders([]);
    setImportResult(null);
  };

  // Lecture du fichier sélectionné
  const handleFileProcess = (selectedFile: File) => {
    setFile(selectedFile);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;

      if (activeTab === "database") {
        try {
          const parsedJson = JSON.parse(content);
          setParsedRows([parsedJson]);
        } catch {
          setParsedRows([]);
        }
      } else {
        const { headers, rows } = parseDelimitedText(content);
        setRawHeaders(headers);
        setRawRows(rows);

        if (activeTab === "contacts") {
          let mapped = mapRowsToContacts(rows);
          // Si aucune colonne n'a matché les noms standards, tenter un mapping automatique sur les chiffres
          if (mapped.length === 0 && rows.length > 0) {
            mapped = rows.map((r) => {
              let phone = "";
              for (const k of Object.keys(r)) {
                const digits = (r[k] || "").replace(/\D/g, "");
                if (digits.length >= 8 && digits.length <= 15) {
                  phone = normalizePhoneNumber(r[k]);
                  break;
                }
              }
              let name = "Prospect";
              for (const k of Object.keys(r)) {
                const val = (r[k] || "").trim();
                if (val && !/^\+?\d+$/.test(val.replace(/\s/g, "")) && val.length > 2) {
                  name = val;
                  break;
                }
              }
              return {
                wa_phone: phone,
                name: name,
                status: "nouveau" as const,
                need: null,
                budget: null,
                notes: "Importé via fichier",
                last_activity_at: new Date().toISOString(),
                followup_count: 0,
                followup_status: "pending" as const
              };
            }).filter((c) => c.wa_phone);

            if (headers.length > 0) {
              setSelectedPhoneCol(headers[0]);
              if (headers.length > 1) setSelectedNameCol(headers[1]);
            }
          }
          setParsedRows(mapped);
        } else if (activeTab === "catalog") {
          const mapped = mapRowsToCatalog(rows);
          setParsedRows(mapped);
        } else if (activeTab === "faq") {
          const mapped = mapRowsToFaqs(rows);
          setParsedRows(mapped);
        }
      }
    };

    reader.readAsText(selectedFile);
  };

  const handleApplyManualColumnMapping = () => {
    if (!selectedPhoneCol || rawRows.length === 0) return;
    const remapped = rawRows.map((row) => {
      const rawPhone = row[selectedPhoneCol] || "";
      const phone = normalizePhoneNumber(rawPhone);
      const name = selectedNameCol ? (row[selectedNameCol] || "Prospect") : "Prospect";
      return {
        wa_phone: phone,
        name: name,
        status: "nouveau" as const,
        need: null,
        budget: null,
        notes: "Importé via fichier",
        last_activity_at: new Date().toISOString(),
        followup_count: 0,
        followup_status: "pending" as const
      };
    }).filter((c) => c.wa_phone);
    setParsedRows(remapped);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  // Exécution de l'importation
  const handleExecuteImport = async () => {
    let rowsToImport = parsedRows;
    if (rowsToImport.length === 0 && rawRows.length > 0) {
      if (activeTab === "contacts") {
        rowsToImport = mapRowsToContacts(rawRows);
      } else if (activeTab === "catalog") {
        rowsToImport = mapRowsToCatalog(rawRows);
      } else if (activeTab === "faq") {
        rowsToImport = mapRowsToFaqs(rawRows);
      }
    }
    if (rowsToImport.length === 0) return;
    setIsProcessing(true);

    try {
      if (activeTab === "contacts") {
        const res = await importContacts(rowsToImport, updateExisting);
        setImportResult({
          success: true,
          imported: res.imported,
          updated: res.updated,
          total: res.total,
          message: `${res.imported} nouveaux prospects importés avec succès (${res.updated} existants mis à jour).`
        });
      } else if (activeTab === "catalog") {
        const res = await importCatalogItems(rowsToImport);
        setImportResult({
          success: true,
          imported: res.imported,
          total: res.imported,
          message: `${res.imported} biens / produits ajoutés à votre catalogue avec succès.`
        });
      } else if (activeTab === "faq") {
        const res = await importFaqs(rowsToImport);
        setImportResult({
          success: true,
          imported: res.imported,
          total: res.imported,
          message: `${res.imported} questions/réponses ajoutées à la base de connaissances IA.`
        });
      } else if (activeTab === "database") {
        const backupData = rowsToImport[0];
        const res = await importFullDatabase(backupData);
        setImportResult({
          success: true,
          imported: (res.counts.contacts || 0) + (res.counts.catalog || 0) + (res.counts.faqs || 0),
          total: (res.counts.contacts || 0) + (res.counts.catalog || 0) + (res.counts.faqs || 0),
          message: `Base de données restaurée : ${res.counts.contacts} prospects, ${res.counts.catalog} offres catalogue et ${res.counts.faqs} FAQs réintégrés.`
        });
      }

      setParsedRows([]);
      setFile(null);
    } catch (err: any) {
      console.error(err);
      setImportResult({
        success: false,
        imported: 0,
        total: 0,
        message: "Erreur lors de l'importation. Veuillez vérifier la structure de votre fichier."
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-2">
            <UploadCloud className="h-3.5 w-3.5" />
            Migration & Importateur de Données
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Import de Base de Données
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Importez facilement vos prospects WhatsApp, fichiers Excel de clients, catalogues immobiliers ou bases FAQ existantes dans IZI Market.
          </p>
        </div>

        <button
          onClick={() => exportDatabaseBackup({ business, contacts, catalog, faqs, appointments })}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all self-start sm:self-auto shadow-xs"
        >
          <Download className="h-4 w-4 text-emerald-600" />
          <span>Exporter Sauvegarde Complète (JSON)</span>
        </button>
      </div>

      {/* Onglets de sélection du type de données */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => handleTabChange("contacts")}
          className={`flex items-center gap-2.5 p-3.5 rounded-2xl text-xs font-bold transition-all text-left border ${
            activeTab === "contacts"
              ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20"
              : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
          }`}
        >
          <Users className="h-4 w-4 shrink-0" />
          <div>
            <span className="block">Prospects & Contacts</span>
            <span className={`text-[10px] block font-normal ${activeTab === "contacts" ? "text-emerald-100" : "text-slate-400"}`}>
              {contacts.length} enregistrés
            </span>
          </div>
        </button>

        <button
          onClick={() => handleTabChange("catalog")}
          className={`flex items-center gap-2.5 p-3.5 rounded-2xl text-xs font-bold transition-all text-left border ${
            activeTab === "catalog"
              ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20"
              : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
          }`}
        >
          <Package className="h-4 w-4 shrink-0" />
          <div>
            <span className="block">Catalogue & Biens</span>
            <span className={`text-[10px] block font-normal ${activeTab === "catalog" ? "text-emerald-100" : "text-slate-400"}`}>
              {catalog.length} offres
            </span>
          </div>
        </button>

        <button
          onClick={() => handleTabChange("faq")}
          className={`flex items-center gap-2.5 p-3.5 rounded-2xl text-xs font-bold transition-all text-left border ${
            activeTab === "faq"
              ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20"
              : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
          }`}
        >
          <HelpCircle className="h-4 w-4 shrink-0" />
          <div>
            <span className="block">Base FAQ & IA</span>
            <span className={`text-[10px] block font-normal ${activeTab === "faq" ? "text-emerald-100" : "text-slate-400"}`}>
              {faqs.length} réponses
            </span>
          </div>
        </button>

        <button
          onClick={() => handleTabChange("database")}
          className={`flex items-center gap-2.5 p-3.5 rounded-2xl text-xs font-bold transition-all text-left border ${
            activeTab === "database"
              ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20"
              : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
          }`}
        >
          <Database className="h-4 w-4 shrink-0" />
          <div>
            <span className="block">Sauvegarde Globale</span>
            <span className={`text-[10px] block font-normal ${activeTab === "database" ? "text-emerald-100" : "text-slate-400"}`}>
              Restauration JSON
            </span>
          </div>
        </button>

        <button
          onClick={() => handleTabChange("google-maps")}
          className={`flex items-center gap-2.5 p-3.5 rounded-2xl text-xs font-bold transition-all text-left border col-span-2 md:col-span-1 ${
            activeTab === "google-maps"
              ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20"
              : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
          }`}
        >
          <Compass className="h-4 w-4 shrink-0 text-amber-400" />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="block">Google Maps</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-400 text-slate-950 font-black">
                APIFY
              </span>
            </div>
            <span className={`text-[10px] block font-normal ${activeTab === "google-maps" ? "text-emerald-100" : "text-slate-400"}`}>
              Scraping B2B direct
            </span>
          </div>
        </button>
      </div>

      {activeTab === "google-maps" ? (
        <GoogleMapsScraper />
      ) : (
        <>
      {/* Résultat d'importation réussi */}
      {importResult && (
        <div
          className={`p-5 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in ${
            importResult.success
              ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
              : "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200"
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 ${
                importResult.success
                  ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-500/20 text-rose-600 dark:text-rose-400"
              }`}
            >
              {importResult.success ? <CheckCircle2 className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
            </div>
            <div>
              <h3 className="text-sm font-bold">
                {importResult.success ? "Importation terminée avec succès !" : "Échec de l'importation"}
              </h3>
              <p className="text-xs opacity-90 mt-0.5">{importResult.message}</p>
            </div>
          </div>

          {importResult.success && (
            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              {activeTab === "contacts" && (
                <Link
                  href="/app/prospects"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <span>Voir dans le Pipeline CRM</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
              {(activeTab === "catalog" || activeTab === "faq") && (
                <Link
                  href="/app/connaissances"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <span>Voir la Base de Connaissances</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          )}
        </div>
      )}

      {/* Guide et Téléchargement du modèle CSV */}
      {activeTab !== "database" && (
        <div className="bg-slate-50 dark:bg-slate-900/60 rounded-3xl p-5 md:p-6 border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              Format recommandé pour l'import {activeTab === "contacts" ? "de vos prospects" : activeTab === "catalog" ? "de votre catalogue" : "de votre FAQ"}
            </h3>
            <p className="text-xs text-slate-500 max-w-xl">
              Téléchargez notre fichier modèle pré-rempli avec des exemples concrets (noms sénégalais, numéros au format +221, prix en FCFA).
            </p>
          </div>

          <button
            onClick={() => downloadCsvTemplate(activeTab as any)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700 transition-colors self-start md:self-auto shrink-0 shadow-xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Télécharger le modèle CSV (.csv)</span>
          </button>
        </div>
      )}

      {/* Zone de Drag and Drop (si aucun fichier sélectionné) */}
      {!file ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
            isDragging
              ? "border-emerald-500 bg-emerald-500/10 scale-[1.01]"
              : "border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:border-emerald-500/60 hover:bg-slate-50 dark:hover:bg-slate-900/80"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={activeTab === "database" ? ".json" : ".csv,.tsv,.txt,.json"}
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFileProcess(e.target.files[0]);
              }
            }}
          />

          <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner">
            <UploadCloud className="h-8 w-8" />
          </div>

          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              Cliquez ou glissez-déposez votre fichier ici
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {activeTab === "database"
                ? "Fichier de sauvegarde complet (.json)"
                : "Fichiers supportés : CSV, Excel exporté en CSV, TSV ou TXT délimité"}
            </p>
          </div>

          <button
            type="button"
            className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 transition-all pointer-events-none"
          >
            <UploadCloud className="h-4 w-4" />
            <span>Sélectionner un fichier sur mon appareil</span>
          </button>
        </div>
      ) : (
        /* CARTE DU FICHIER SÉLECTIONNÉ AVEC BOUTON DE LANCEMENT ULTRA-VISIBLE */
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border-2 border-emerald-500/50 shadow-xl space-y-6 animate-in fade-in">
          <input
            ref={fileInputRef}
            type="file"
            accept={activeTab === "database" ? ".json" : ".csv,.tsv,.txt,.json"}
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFileProcess(e.target.files[0]);
              }
            }}
          />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 border-b border-slate-100 dark:border-slate-800 pb-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/20">
                <FileSpreadsheet className="h-7 w-7" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {file.name}
                  </h3>
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {(file.size / 1024).toFixed(1)} Ko
                  </span>
                </div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    {parsedRows.length > 0
                      ? `${parsedRows.length} ${
                          activeTab === "contacts"
                            ? "prospects reconnus et prêts pour l'import"
                            : activeTab === "catalog"
                            ? "offres prêtes pour l'import"
                            : "lignes prêtes"
                        }`
                      : `${rawRows.length} lignes brutes détectées dans le fichier`}
                  </span>
                </p>
              </div>
            </div>

            {/* BOUTON DE LANCEMENT D'IMPORTATION (IMPOSSIBLE À MANQUER) */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setParsedRows([]);
                  setRawRows([]);
                  setRawHeaders([]);
                }}
                className="px-4 py-3 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              >
                Changer de fichier
              </button>

              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={isProcessing || (parsedRows.length === 0 && rawRows.length === 0)}
                className="inline-flex items-center justify-center gap-2.5 px-7 py-3 rounded-2xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <UploadCloud className="h-4 w-4" />
                )}
                <span>
                  {isProcessing
                    ? "Importation en cours..."
                    : `Lancer l'importation (${parsedRows.length || rawRows.length} ${
                        activeTab === "contacts"
                          ? "prospects"
                          : activeTab === "catalog"
                          ? "offres"
                          : "éléments"
                      })`}
                </span>
              </button>
            </div>
          </div>

          {/* Assistant de mapping manuel si 0 lignes reconnues mais rawRows > 0 */}
          {parsedRows.length === 0 && rawRows.length > 0 && activeTab === "contacts" && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                <AlertTriangle className="h-4 w-4" />
                <span>Sélectionnez la colonne contenant les numéros de téléphone WhatsApp :</span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={selectedPhoneCol}
                  onChange={(e) => setSelectedPhoneCol(e.target.value)}
                  className="text-xs px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                >
                  {rawHeaders.map((h) => (
                    <option key={h} value={h}>
                      Colonne Téléphone : {h}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedNameCol}
                  onChange={(e) => setSelectedNameCol(e.target.value)}
                  className="text-xs px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                >
                  <option value="">-- Colonne Nom (optionnel) --</option>
                  {rawHeaders.map((h) => (
                    <option key={h} value={h}>
                      Colonne Nom : {h}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleApplyManualColumnMapping}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-sm cursor-pointer"
                >
                  Appliquer cette colonne
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tableau de Prévisualisation avant Validation */}
      {parsedRows.length > 0 && activeTab !== "database" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 animate-in fade-in">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Table className="h-4 w-4 text-emerald-600" />
                Prévisualisation des données ({parsedRows.length} lignes prêtes)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Vérifiez la correspondance des colonnes avant de confirmer l'importation.
              </p>
            </div>

            {activeTab === "contacts" && (
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={updateExisting}
                  onChange={(e) => setUpdateExisting(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Mettre à jour les prospects si le numéro WhatsApp existe déjà</span>
              </label>
            )}
          </div>

          {/* Tableau d'aperçu des 5 premières lignes */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                {activeTab === "contacts" && (
                  <tr>
                    <th className="px-4 py-3">Numéro WhatsApp (Formaté)</th>
                    <th className="px-4 py-3">Nom</th>
                    <th className="px-4 py-3">Statut Pipeline</th>
                    <th className="px-4 py-3">Besoin Qualifié</th>
                    <th className="px-4 py-3">Budget</th>
                  </tr>
                )}
                {activeTab === "catalog" && (
                  <tr>
                    <th className="px-4 py-3">Titre de l'Offre</th>
                    <th className="px-4 py-3">Prix</th>
                    <th className="px-4 py-3">Catégorie</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Disponibilité</th>
                  </tr>
                )}
                {activeTab === "faq" && (
                  <tr>
                    <th className="px-4 py-3 w-5/12">Question Fréquente</th>
                    <th className="px-4 py-3 w-7/12">Réponse de l'IA (Claude)</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                {parsedRows.slice(0, 5).map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    {activeTab === "contacts" && (
                      <>
                        <td className="px-4 py-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {row.wa_phone}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                          {row.name || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase">
                            {row.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                          {row.need || "—"}
                        </td>
                        <td className="px-4 py-3 font-semibold text-emerald-600 dark:text-emerald-400">
                          {row.budget || "—"}
                        </td>
                      </>
                    )}
                    {activeTab === "catalog" && (
                      <>
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                          {row.title}
                        </td>
                        <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">
                          {row.price}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                          {row.category}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                          {row.description || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            row.available ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-slate-100 text-slate-600"
                          }`}>
                            {row.available ? "Disponible" : "Indisponible"}
                          </span>
                        </td>
                      </>
                    )}
                    {activeTab === "faq" && (
                      <>
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                          {row.question}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300 leading-relaxed">
                          {row.answer}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {parsedRows.length > 5 && (
            <p className="text-[11px] text-slate-400 text-center">
              Affichage des 5 premières lignes sur un total de {parsedRows.length} lignes à importer.
            </p>
          )}

          {/* Boutons d'action */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => {
                setFile(null);
                setParsedRows([]);
              }}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
            >
              Annuler
            </button>

            <button
              onClick={handleExecuteImport}
              disabled={isProcessing}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/25 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>
                {isProcessing
                  ? "Importation en cours..."
                  : `Confirmer l'importation de ${parsedRows.length} ${
                      activeTab === "contacts"
                        ? "prospects"
                        : activeTab === "catalog"
                        ? "offres"
                        : "questions"
                    }`}
              </span>
            </button>
          </div>

        </div>
      )}

      {/* Prévisualisation de Sauvegarde Globale */}
      {parsedRows.length > 0 && activeTab === "database" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 animate-in fade-in">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Database className="h-4 w-4 text-emerald-600" />
            Fichier de Sauvegarde IZI Market Détecté
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800">
              <span className="text-slate-400 block text-[10px]">Prospects</span>
              <span className="text-base font-bold text-slate-900 dark:text-white">
                {parsedRows[0].contacts?.length || 0}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800">
              <span className="text-slate-400 block text-[10px]">Catalogue</span>
              <span className="text-base font-bold text-slate-900 dark:text-white">
                {parsedRows[0].catalog?.length || 0}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800">
              <span className="text-slate-400 block text-[10px]">FAQs</span>
              <span className="text-base font-bold text-slate-900 dark:text-white">
                {parsedRows[0].faqs?.length || 0}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800">
              <span className="text-slate-400 block text-[10px]">Rendez-vous</span>
              <span className="text-base font-bold text-slate-900 dark:text-white">
                {parsedRows[0].appointments?.length || 0}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => {
                setFile(null);
                setParsedRows([]);
              }}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
            >
              Annuler
            </button>

            <button
              onClick={handleExecuteImport}
              disabled={isProcessing}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/25 transition-all flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isProcessing ? "animate-spin" : ""}`} />
              <span>{isProcessing ? "Restauration en cours..." : "Restaurer toute la base de données"}</span>
            </button>
          </div>
        </div>
      )}
        </>
      )}

    </div>
  );
}
