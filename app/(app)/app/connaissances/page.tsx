"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store";
import {
  HelpCircle,
  Package,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Sparkles,
  Search,
  UploadCloud
} from "lucide-react";
import { FAQ, CatalogItem } from "@/types/database";

export default function KnowledgeBasePage() {
  const { faqs, addFaq, updateFaq, deleteFaq, catalog, addCatalogItem, updateCatalogItem, deleteCatalogItem } = useApp();
  const [activeTab, setActiveTab] = useState<"faq" | "catalog">("faq");

  // Recherche
  const [searchQuery, setSearchQuery] = useState("");

  // Modals FAQ
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [faqQuestion, setFaqQuestion] = useState("");
  const [faqAnswer, setFaqAnswer] = useState("");

  // Modals Catalogue
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [editingCatalog, setEditingCatalog] = useState<CatalogItem | null>(null);
  const [catalogTitle, setCatalogTitle] = useState("");
  const [catalogPrice, setCatalogPrice] = useState("");
  const [catalogCategory, setCatalogCategory] = useState("");
  const [catalogDescription, setCatalogDescription] = useState("");
  const [catalogAvailable, setCatalogAvailable] = useState(true);

  // Suggestions de FAQ types pour PME sénégalaise
  const FAQ_SUGGESTIONS = [
    {
      q: "Quels sont les moyens de paiement acceptés ?",
      a: "Nous acceptons les paiements via Wave, Orange Money, virement bancaire et chèque certifié."
    },
    {
      q: "Où se trouvent exactement vos locaux à Dakar ?",
      a: "Nos bureaux sont situés sur la VDN, en face du rond-point Mermoz, ouverts du lundi au samedi."
    },
    {
      q: "Quelles sont les conditions de livraison ou de visite ?",
      a: "La livraison à Dakar est effectuée en 24h. Pour les visites immobilières, nous planifions un rendez-vous 24h à l'avance."
    }
  ];

  // Gestion FAQ
  const handleOpenFaqModal = (faq?: FAQ) => {
    if (faq) {
      setEditingFaq(faq);
      setFaqQuestion(faq.question);
      setFaqAnswer(faq.answer);
    } else {
      setEditingFaq(null);
      setFaqQuestion("");
      setFaqAnswer("");
    }
    setIsFaqModalOpen(true);
  };

  const handleSaveFaq = () => {
    if (!faqQuestion.trim() || !faqAnswer.trim()) return;
    if (editingFaq) {
      updateFaq(editingFaq.id, { question: faqQuestion.trim(), answer: faqAnswer.trim() });
    } else {
      addFaq({ question: faqQuestion.trim(), answer: faqAnswer.trim() });
    }
    setIsFaqModalOpen(false);
  };

  // Gestion Catalogue
  const handleOpenCatalogModal = (item?: CatalogItem) => {
    if (item) {
      setEditingCatalog(item);
      setCatalogTitle(item.title);
      setCatalogPrice(item.price);
      setCatalogCategory(item.category || "");
      setCatalogDescription(item.description || "");
      setCatalogAvailable(item.available);
    } else {
      setEditingCatalog(null);
      setCatalogTitle("");
      setCatalogPrice("");
      setCatalogCategory("");
      setCatalogDescription("");
      setCatalogAvailable(true);
    }
    setIsCatalogModalOpen(true);
  };

  const handleSaveCatalog = () => {
    if (!catalogTitle.trim() || !catalogPrice.trim()) return;
    if (editingCatalog) {
      updateCatalogItem(editingCatalog.id, {
        title: catalogTitle.trim(),
        price: catalogPrice.trim(),
        category: catalogCategory.trim() || "Général",
        description: catalogDescription.trim(),
        available: catalogAvailable
      });
    } else {
      addCatalogItem({
        title: catalogTitle.trim(),
        price: catalogPrice.trim(),
        category: catalogCategory.trim() || "Général",
        description: catalogDescription.trim(),
        available: catalogAvailable,
        image_url: null
      });
    }
    setIsCatalogModalOpen(false);
  };

  const filteredFaqs = faqs.filter(
    (f) =>
      f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCatalog = catalog.filter(
    (c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.category && c.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            Base de Connaissances IA
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
              Claude 3.5 Sonnet
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Les données ci-dessous entraînent les réponses automatiques de votre assistant commercial WhatsApp.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href={activeTab === "faq" ? "/app/import" : "/app/import"}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-emerald-500/50 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all shadow-xs"
          >
            <UploadCloud className="h-4 w-4 text-emerald-500" />
            <span>Importer (CSV / Excel)</span>
          </Link>

          {activeTab === "faq" ? (
            <button
              onClick={() => handleOpenFaqModal()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/30 transition-all"
            >
              <Plus className="h-4 w-4" /> Ajouter une question FAQ
            </button>
          ) : (
            <button
              onClick={() => handleOpenCatalogModal()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/30 transition-all"
            >
              <Plus className="h-4 w-4" /> Ajouter au catalogue
            </button>
          )}
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("faq")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "faq"
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <HelpCircle className="h-4 w-4" />
            <span>FAQ ({faqs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("catalog")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "catalog"
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Package className="h-4 w-4" />
            <span>Catalogue Produits / Biens ({catalog.length})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Filtrer les connaissances..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
          />
        </div>
      </div>

      {/* TAB 1 : FAQ */}
      {activeTab === "faq" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFaqs.map((faq) => (
              <div
                key={faq.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <h3 className="font-bold text-xs text-slate-900 dark:text-white leading-relaxed">
                      {faq.question}
                    </h3>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenFaqModal(faq)}
                        className="p-1 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Modifier"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => deleteFaq(faq.id)}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Suggestions prêtes à être ajoutées */}
          <div className="p-6 rounded-3xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 space-y-3">
            <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> Suggestions de questions fréquentes pour entreprises au Sénégal
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {FAQ_SUGGESTIONS.map((s, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setFaqQuestion(s.q);
                    setFaqAnswer(s.a);
                    setIsFaqModalOpen(true);
                  }}
                  className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200/60 dark:border-emerald-800/40 cursor-pointer hover:border-emerald-500 transition-all text-xs space-y-1"
                >
                  <p className="font-bold text-slate-900 dark:text-white">{s.q}</p>
                  <p className="text-[11px] text-slate-500 line-clamp-2">{s.a}</p>
                  <p className="text-[10px] font-bold text-emerald-600 pt-1">+ Ajouter à ma FAQ</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2 : CATALOGUE */}
      {activeTab === "catalog" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCatalog.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {item.category || "Général"}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenCatalogModal(item)}
                      className="p-1 rounded text-slate-400 hover:text-emerald-600 transition-colors"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => deleteCatalogItem(item.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {item.title}
                </h3>

                <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                  {item.price}
                </p>

                {item.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                    {item.description}
                  </p>
                )}
              </div>

              <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500">Disponibilité :</span>
                <button
                  onClick={() => updateCatalogItem(item.id, { available: !item.available })}
                  className={`flex items-center gap-1.5 font-bold ${
                    item.available
                      ? "text-emerald-600 hover:text-emerald-700"
                      : "text-rose-500 hover:text-rose-600"
                  }`}
                >
                  {item.available ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" /> Disponible
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3.5 w-3.5" /> Indisponible
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal FAQ */}
      {isFaqModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {editingFaq ? "Modifier la question FAQ" : "Nouvelle question FAQ"}
            </h3>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Question fréquemment posée par vos clients
              </label>
              <input
                type="text"
                placeholder="Ex: Quels sont vos délais de livraison à Dakar ?"
                value={faqQuestion}
                onChange={(e) => setFaqQuestion(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Réponse exacte que l'IA doit utiliser
              </label>
              <textarea
                rows={4}
                placeholder="Rédigez la réponse détaillée et précise..."
                value={faqAnswer}
                onChange={(e) => setFaqAnswer(e.target.value)}
                className="w-full text-xs p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed font-medium"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setIsFaqModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveFaq}
                disabled={!faqQuestion.trim() || !faqAnswer.trim()}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40"
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Catalogue */}
      {isCatalogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {editingCatalog ? "Modifier l'article du catalogue" : "Nouvel article au catalogue"}
            </h3>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Titre du produit ou bien immobilier
              </label>
              <input
                type="text"
                placeholder="Ex: Appartement F4 Haut Standing - Almadies"
                value={catalogTitle}
                onChange={(e) => setCatalogTitle(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Prix (FCFA)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 850 000 FCFA / mois"
                  value={catalogPrice}
                  onChange={(e) => setCatalogPrice(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Catégorie
                </label>
                <input
                  type="text"
                  placeholder="Ex: Location Résidentielle"
                  value={catalogCategory}
                  onChange={(e) => setCatalogCategory(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Description détaillée (caractéristiques, équipements, stock)
              </label>
              <textarea
                rows={3}
                placeholder="Ex: 3 chambres climatisées, salon avec terrasse vue mer, cuisine équipée..."
                value={catalogDescription}
                onChange={(e) => setCatalogDescription(e.target.value)}
                className="w-full text-xs p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed font-medium"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="availableCheck"
                checked={catalogAvailable}
                onChange={(e) => setCatalogAvailable(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="availableCheck" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Article actuellement disponible en stock / à la location
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setIsCatalogModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveCatalog}
                disabled={!catalogTitle.trim() || !catalogPrice.trim()}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40"
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
