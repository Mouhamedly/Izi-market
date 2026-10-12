"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { Quote, QuoteItem, QuoteStatus, Contact, CatalogItem } from "@/types/database";
import {
  formatFCFA,
  calculateQuoteTotals,
  generateNextQuoteNumber,
  generateQuoteWhatsAppMessage
} from "@/lib/quotes";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import {
  FileText,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Send,
  XCircle,
  Eye,
  Trash2,
  Edit,
  ExternalLink,
  Copy,
  Printer,
  Sparkles,
  ArrowRight,
  ChevronDown,
  DollarSign,
  TrendingUp,
  Receipt,
  AlertCircle,
  Calendar,
  User,
  Phone,
  Layers,
  Check
} from "lucide-react";

export default function QuotesPage() {
  const {
    quotes,
    contacts,
    catalog,
    business,
    addQuote,
    updateQuote,
    deleteQuote,
    updateQuoteStatus,
    sendQuoteViaWhatsApp
  } = useApp();

  // Filtres et recherche
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<QuoteStatus | "tous">("tous");

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [viewingProformaQuote, setViewingProformaQuote] = useState<Quote | null>(null);
  const [sharingWhatsAppQuote, setSharingWhatsAppQuote] = useState<Quote | null>(null);

  // Notifications
  const [notification, setNotification] = useState<string | null>(null);
  const [copiedMsg, setCopiedMsg] = useState(false);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // KPIs
  const stats = useMemo(() => {
    const totalAmountAll = quotes.reduce((acc, q) => acc + (q.total_amount || 0), 0);
    const acceptedQuotes = quotes.filter((q) => q.status === "accepte");
    const acceptedAmount = acceptedQuotes.reduce((acc, q) => acc + (q.total_amount || 0), 0);
    const pendingQuotes = quotes.filter((q) => q.status === "envoye");
    const pendingAmount = pendingQuotes.reduce((acc, q) => acc + (q.total_amount || 0), 0);
    const draftQuotes = quotes.filter((q) => q.status === "brouillon");

    const conversionRate = quotes.length > 0
      ? Math.round((acceptedQuotes.length / quotes.length) * 100)
      : 0;

    return {
      totalAmountAll,
      acceptedAmount,
      acceptedCount: acceptedQuotes.length,
      pendingAmount,
      pendingCount: pendingQuotes.length,
      draftCount: draftQuotes.length,
      conversionRate
    };
  }, [quotes]);

  // Filtrage des devis
  const filteredQuotes = useMemo(() => {
    return quotes.filter((q) => {
      const matchesStatus = selectedStatus === "tous" || q.status === selectedStatus;
      const qLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        q.quote_number.toLowerCase().includes(qLower) ||
        q.title.toLowerCase().includes(qLower) ||
        q.contact_name.toLowerCase().includes(qLower) ||
        q.contact_phone.toLowerCase().includes(qLower);
      return matchesStatus && matchesSearch;
    });
  }, [quotes, selectedStatus, searchQuery]);

  // Actions de statut rapide
  const handleQuickStatusChange = async (quoteId: string, status: QuoteStatus) => {
    await updateQuoteStatus(quoteId, status);
    showNotification(`Statut du devis mis à jour : ${status.toUpperCase()}`);
  };

  // Envoi WhatsApp
  const handleOpenWhatsAppShare = (quote: Quote) => {
    setSharingWhatsAppQuote(quote);
  };

  const handleConfirmWhatsAppSend = async () => {
    if (!sharingWhatsAppQuote) return;
    const res = await sendQuoteViaWhatsApp(sharingWhatsAppQuote.id);
    if (res.success) {
      showNotification(`Devis ${sharingWhatsAppQuote.quote_number} envoyé avec succès sur WhatsApp !`);
      if (typeof window !== "undefined") {
        window.open(res.whatsappUrl, "_blank");
      }
      setSharingWhatsAppQuote(null);
    }
  };

  const handleCopyWhatsAppText = (quote: Quote) => {
    const text = generateQuoteWhatsAppMessage(quote, business);
    navigator.clipboard.writeText(text);
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 2000);
  };

  // Suppression
  const handleDeleteQuote = async (id: string, num: string) => {
    if (confirm(`Confirmez-vous la suppression du devis ${num} ?`)) {
      await deleteQuote(id);
      showNotification(`Devis ${num} supprimé.`);
    }
  };

  // Ouverture modal d'édition
  const handleEditQuote = (quote: Quote) => {
    setEditingQuote(quote);
    setIsCreateModalOpen(true);
  };

  const handleNewQuote = () => {
    setEditingQuote(null);
    setIsCreateModalOpen(true);
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      
      {/* Top Banner / Notification */}
      {notification && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20 mb-2">
            <FileText className="h-3.5 w-3.5" /> Devis, Offres & Factures Proformas
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            Devis & Offres Commerciales
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Établissez des propositions tarifaires proformas, partagez-les en 1 clic sur WhatsApp et suivez les signatures de vos clients.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleNewQuote}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Nouveau Devis</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 : Total proposé */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Pipeline Devis Proposé</span>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-xl font-extrabold text-slate-900 dark:text-white">
            {formatFCFA(stats.totalAmountAll)}
          </p>
          <p className="text-[11px] text-slate-400">
            {quotes.length} offre{quotes.length > 1 ? "s" : ""} au total
          </p>
        </div>

        {/* KPI 2 : Devis signés / acceptés */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Devis Acceptés & Signés</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {formatFCFA(stats.acceptedAmount)}
          </p>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">{stats.acceptedCount} devis validé{stats.acceptedCount > 1 ? "s" : ""}</span>
            <span className="font-bold text-emerald-500">{stats.conversionRate}% conversion</span>
          </div>
        </div>

        {/* KPI 3 : En cours de décision (WhatsApp) */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Envoyés sur WhatsApp</span>
            <Send className="h-4 w-4 text-sky-500" />
          </div>
          <p className="text-xl font-extrabold text-sky-600 dark:text-sky-400">
            {formatFCFA(stats.pendingAmount)}
          </p>
          <p className="text-[11px] text-slate-400">
            {stats.pendingCount} en attente de signature
          </p>
        </div>

        {/* KPI 4 : Brouillons */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Brouillons en préparation</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-xl font-extrabold text-slate-900 dark:text-white">
            {stats.draftCount}
          </p>
          <p className="text-[11px] text-slate-400">
            Prêts à être complétés et transmis
          </p>
        </div>
      </div>

      {/* Barre de Recherche et Filtres */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
        
        {/* Recherche */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par prospect, n° de devis, téléphone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
          />
        </div>

        {/* Filtres par statut */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "tous", label: "Tous", count: quotes.length },
            { id: "envoye", label: "Envoyés", count: quotes.filter((q) => q.status === "envoye").length },
            { id: "accepte", label: "Acceptés", count: quotes.filter((q) => q.status === "accepte").length },
            { id: "brouillon", label: "Brouillons", count: quotes.filter((q) => q.status === "brouillon").length },
            { id: "refuse", label: "Refusés", count: quotes.filter((q) => q.status === "refuse").length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedStatus === tab.id
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <span>{tab.label}</span>
              <span className="ml-1.5 opacity-75 font-mono text-[10px]">({tab.count})</span>
            </button>
          ))}
        </div>

      </div>

      {/* Liste des Devis */}
      {filteredQuotes.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
            <Receipt className="h-7 w-7" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Aucun devis trouvé
            </h3>
            <p className="text-xs text-slate-500">
              {searchQuery || selectedStatus !== "tous"
                ? "Aucune proposition ne correspond à vos filtres actuels."
                : "Commencez dès maintenant en créant votre premier devis commercial."}
            </p>
          </div>
          <button
            onClick={handleNewQuote}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Créer mon premier devis</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredQuotes.map((quote) => {
            const isAccepted = quote.status === "accepte";
            const isSent = quote.status === "envoye";
            const isDraft = quote.status === "brouillon";
            const isRejected = quote.status === "refuse";

            const validUntilDate = new Date(quote.valid_until);
            const daysRemaining = Math.ceil(
              (validUntilDate.getTime() - Date.now()) / (1000 * 3600 * 24)
            );

            return (
              <div
                key={quote.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 md:p-6 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5"
              >
                {/* Colonne 1 : Détails & Prospect */}
                <div className="space-y-3 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Badge Numéro */}
                    <span className="px-3 py-1 rounded-xl text-xs font-mono font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                      {quote.quote_number}
                    </span>

                    {/* Badge Statut */}
                    <div className="relative inline-block">
                      <select
                        value={quote.status}
                        onChange={(e) => handleQuickStatusChange(quote.id, e.target.value as QuoteStatus)}
                        className={`text-xs font-extrabold px-3 py-1 rounded-full border appearance-none pr-7 cursor-pointer focus:outline-none ${
                          isAccepted
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                            : isSent
                            ? "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800"
                            : isDraft
                            ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                            : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800"
                        }`}
                      >
                        <option value="brouillon">Brouillon</option>
                        <option value="envoye">Envoyé sur WhatsApp</option>
                        <option value="accepte">Accepté / Signé</option>
                        <option value="refuse">Refusé</option>
                        <option value="expire">Expiré</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none opacity-60" />
                    </div>

                    {/* Date de validité */}
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Validité : {validUntilDate.toLocaleDateString("fr-FR")}
                      {daysRemaining > 0 && daysRemaining <= 7 && (
                        <span className="text-amber-500 font-bold ml-1">({daysRemaining}j restants)</span>
                      )}
                    </span>
                  </div>

                  {/* Titre du devis */}
                  <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                    {quote.title}
                  </h3>

                  {/* Prospect */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      {quote.contact_name}
                    </span>

                    <span className="flex items-center gap-1.5 font-mono text-emerald-600 dark:text-emerald-400">
                      <Phone className="h-3.5 w-3.5" />
                      {quote.contact_phone}
                    </span>

                    <span className="text-slate-400 text-[11px]">
                      {quote.items.length} prestation{quote.items.length > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                {/* Colonne 2 : Montant & Actions */}
                <div className="flex flex-col sm:flex-row lg:flex-col sm:items-center lg:items-end justify-between gap-4 shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                  {/* Montant Total */}
                  <div className="text-left sm:text-right">
                    <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                      Total TTC
                    </p>
                    <p className="text-xl font-black text-slate-900 dark:text-white font-mono">
                      {formatFCFA(quote.total_amount)}
                    </p>
                    {quote.discount_total > 0 && (
                      <p className="text-[10px] text-emerald-500 font-semibold">
                        Remise de {formatFCFA(quote.discount_total)} incluse
                      </p>
                    )}
                  </div>

                  {/* Boutons d'actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Bouton Partager sur WhatsApp */}
                    <button
                      type="button"
                      onClick={() => handleOpenWhatsAppShare(quote)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/30 transition-all cursor-pointer"
                      title="Envoyer au prospect sur WhatsApp"
                    >
                      <WhatsAppIcon className="h-3.5 w-3.5" />
                      <span>WhatsApp</span>
                    </button>

                    {/* Bouton Voir la Proforma */}
                    <button
                      type="button"
                      onClick={() => setViewingProformaQuote(quote)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
                      title="Voir et imprimer la proforma"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Proforma</span>
                    </button>

                    {/* Bouton Modifier */}
                    <button
                      type="button"
                      onClick={() => handleEditQuote(quote)}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Modifier"
                    >
                      <Edit className="h-4 w-4" />
                    </button>

                    {/* Bouton Supprimer */}
                    <button
                      type="button"
                      onClick={() => handleDeleteQuote(quote.id, quote.quote_number)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1 : CRÉATION / MODIFICATION D'UN DEVIS            */}
      {/* ======================================================== */}
      {isCreateModalOpen && (
        <QuoteEditModal
          isOpen={isCreateModalOpen}
          initialQuote={editingQuote}
          quotes={quotes}
          contacts={contacts}
          catalog={catalog}
          business={business}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingQuote(null);
          }}
          onSave={async (quoteData) => {
            if (editingQuote) {
              await updateQuote(editingQuote.id, quoteData);
              showNotification(`Devis ${editingQuote.quote_number} modifié avec succès.`);
            } else {
              const created = await addQuote(quoteData);
              showNotification(`Nouveau devis ${created.quote_number} créé avec succès !`);
            }
            setIsCreateModalOpen(false);
            setEditingQuote(null);
          }}
        />
      )}

      {/* ======================================================== */}
      {/* MODAL 2 : APERÇU FACTURE PROFORMA / IMPRESSION PDF       */}
      {/* ======================================================== */}
      {viewingProformaQuote && (
        <ProformaViewModal
          quote={viewingProformaQuote}
          business={business}
          onClose={() => setViewingProformaQuote(null)}
          onShareWhatsApp={() => {
            const q = viewingProformaQuote;
            setViewingProformaQuote(null);
            setSharingWhatsAppQuote(q);
          }}
        />
      )}

      {/* ======================================================== */}
      {/* MODAL 3 : ENVOI DU DEVIS SUR WHATSAPP                   */}
      {/* ======================================================== */}
      {sharingWhatsAppQuote && (
        <WhatsAppShareModal
          quote={sharingWhatsAppQuote}
          business={business}
          onClose={() => setSharingWhatsAppQuote(null)}
          onConfirmSend={handleConfirmWhatsAppSend}
          onCopy={() => handleCopyWhatsAppText(sharingWhatsAppQuote)}
          copied={copiedMsg}
        />
      )}

    </div>
  );
}

// =========================================================================
// SOUS-COMPOSANT : MODAL D'ÉDITION / CRÉATION D'UN DEVIS
// =========================================================================
interface QuoteEditModalProps {
  isOpen: boolean;
  initialQuote: Quote | null;
  quotes: Quote[];
  contacts: Contact[];
  catalog: CatalogItem[];
  business: any;
  onClose: () => void;
  onSave: (quoteData: any) => Promise<void>;
}

function QuoteEditModal({
  isOpen,
  initialQuote,
  quotes,
  contacts,
  catalog,
  business,
  onClose,
  onSave
}: QuoteEditModalProps) {
  // Champs
  const [selectedContactId, setSelectedContactId] = useState(initialQuote?.contact_id || "");
  const [contactName, setContactName] = useState(initialQuote?.contact_name || "");
  const [contactPhone, setContactPhone] = useState(initialQuote?.contact_phone || "+221 77 ");
  const [contactEmail, setContactEmail] = useState(initialQuote?.contact_email || "");

  const [quoteNumber, setQuoteNumber] = useState(
    initialQuote?.quote_number || generateNextQuoteNumber(quotes)
  );
  const [title, setTitle] = useState(initialQuote?.title || "Offre Commerciale");
  const [validUntil, setValidUntil] = useState(
    initialQuote?.valid_until
      ? initialQuote.valid_until.split("T")[0]
      : new Date(Date.now() + 15 * 24 * 3600 * 1000).toISOString().split("T")[0]
  );
  const [status, setStatus] = useState<QuoteStatus>(initialQuote?.status || "brouillon");
  const [taxRate, setTaxRate] = useState<number>(initialQuote?.tax_rate || 0);
  const [discountTotal, setDiscountTotal] = useState<number>(initialQuote?.discount_total || 0);
  const [paymentTerms, setPaymentTerms] = useState(
    initialQuote?.payment_terms || "Acompte 50% par virement ou Wave à la commande, solde à la livraison."
  );
  const [notes, setNotes] = useState(initialQuote?.notes || "");

  // Lignes d'articles
  const [items, setItems] = useState<QuoteItem[]>(
    initialQuote?.items || [
      {
        id: "item_1",
        description: "Prestation / Produit principal",
        quantity: 1,
        unit_price: 500000,
        discount_percentage: 0,
        total: 500000
      }
    ]
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Synchronisation sélection contact
  const handleSelectContact = (contactId: string) => {
    setSelectedContactId(contactId);
    const found = contacts.find((c) => c.id === contactId);
    if (found) {
      setContactName(found.name || "");
      setContactPhone(found.wa_phone || "");
    }
  };

  // Recalcul des totaux en direct
  const totals = useMemo(() => {
    return calculateQuoteTotals(items, taxRate, discountTotal);
  }, [items, taxRate, discountTotal]);

  // Actions sur les articles
  const handleItemChange = (index: number, field: keyof QuoteItem, value: any) => {
    setItems((prev) => {
      const next = [...prev];
      const current = { ...next[index], [field]: value };
      const q = Number(current.quantity) || 1;
      const pu = Number(current.unit_price) || 0;
      const disc = Number(current.discount_percentage) || 0;
      current.total = Math.round(q * pu * (1 - disc / 100));
      next[index] = current;
      return next;
    });
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        description: "",
        quantity: 1,
        unit_price: 0,
        discount_percentage: 0,
        total: 0
      }
    ]);
  };

  const handleAddFromCatalog = (catalogId: string) => {
    const cat = catalog.find((c) => c.id === catalogId);
    if (!cat) return;

    // Extraire le prix numérique
    const numericPrice = parseInt(cat.price.replace(/\D/g, ""), 10) || 100000;

    setItems((prev) => [
      ...prev,
      {
        id: `item_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        catalog_item_id: cat.id,
        description: cat.title,
        quantity: 1,
        unit_price: numericPrice,
        discount_percentage: 0,
        total: numericPrice
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Génération d'argumentaire avec l'IA
  const handleGenerateAiPitch = () => {
    const summary = items.map((i) => i.description).filter(Boolean).join(", ");
    setNotes(
      `Offre préférentielle calibrée pour ${contactName || "le client"} chez ${business.name}. Inclut nos garanties de service, la mise à disposition rapide et un accompagnement dédié par notre équipe commerciale.`
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactPhone.trim() || items.length === 0) {
      alert("Veuillez renseigner le nom, le numéro de téléphone et au moins une prestation.");
      return;
    }

    setIsSubmitting(true);
    await onSave({
      quote_number: quoteNumber,
      title: title || "Offre Commerciale",
      contact_id: selectedContactId || null,
      contact_name: contactName,
      contact_phone: contactPhone,
      contact_email: contactEmail || null,
      items,
      subtotal: totals.subtotal,
      discount_total: discountTotal,
      tax_rate: taxRate,
      tax_amount: totals.taxAmount,
      total_amount: totals.totalAmount,
      currency: "FCFA",
      status,
      valid_until: new Date(validUntil).toISOString(),
      payment_terms: paymentTerms,
      notes: notes
    });
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl my-8 space-y-6 max-h-[92vh] overflow-y-auto">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-600" />
              <span>{initialQuote ? `Modifier le Devis ${quoteNumber}` : "Nouveau Devis Commercial"}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Remplissez les détails de l'offre pour générer une proforma officielle et le texte WhatsApp.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Section 1 : Prospect & Référence */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Sélectionner un Prospect CRM
              </label>
              <select
                value={selectedContactId}
                onChange={(e) => handleSelectContact(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- Saisie manuelle ou Prospect existant --</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name || "Prospect"} ({c.wa_phone})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Nom du Client *
              </label>
              <input
                type="text"
                required
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Ex: Moussa Diop"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Téléphone WhatsApp *
              </label>
              <input
                type="text"
                required
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+221 77 123 45 67"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-medium focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Section 2 : Métadonnées du Devis */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                N° de Devis
              </label>
              <input
                type="text"
                required
                value={quoteNumber}
                onChange={(e) => setQuoteNumber(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Objet / Titre de la proposition *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Location F4 Almadies Vue Mer (Bail 1 an)"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Date de Validité
              </label>
              <input
                type="date"
                required
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Section 3 : Lignes d'articles & Catalogue */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Prestations & Produits inclus :
              </label>

              <div className="flex items-center gap-2">
                {catalog.length > 0 && (
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddFromCatalog(e.target.value);
                        e.target.value = "";
                      }
                    }}
                    className="text-xs px-3 py-1.5 rounded-xl border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold focus:outline-none"
                  >
                    <option value="">+ Ajouter depuis le Catalogue</option>
                    {catalog.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.title} ({cat.price})
                      </option>
                    ))}
                  </select>
                )}

                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 transition-colors"
                >
                  + Ligne libre
                </button>
              </div>
            </div>

            {/* Table des articles */}
            <div className="space-y-2.5">
              {items.map((item, index) => (
                <div
                  key={item.id || index}
                  className="grid grid-cols-12 gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 items-center"
                >
                  {/* Description */}
                  <div className="col-span-12 sm:col-span-5">
                    <input
                      type="text"
                      required
                      placeholder="Description de la prestation / article"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, "description", e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                    />
                  </div>

                  {/* Quantité */}
                  <div className="col-span-4 sm:col-span-2">
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="Qté"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, "quantity", Number(e.target.value))}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-medium text-center"
                    />
                  </div>

                  {/* Prix unitaire en FCFA */}
                  <div className="col-span-4 sm:col-span-3">
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        required
                        placeholder="Prix Unit. (FCFA)"
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(index, "unit_price", Number(e.target.value))}
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-medium"
                      />
                    </div>
                  </div>

                  {/* Total ligne & Suppression */}
                  <div className="col-span-4 sm:col-span-2 flex items-center justify-between gap-1">
                    <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 truncate">
                      {formatFCFA(item.total)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      disabled={items.length <= 1}
                      className="p-1 text-slate-400 hover:text-rose-500 disabled:opacity-30 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4 : Totaux & Taxes */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between gap-6">
            
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    TVA applicable
                  </label>
                  <select
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    className="text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                  >
                    <option value={0}>0% (Exonéré / Particuliers)</option>
                    <option value={18}>18% (TVA Sénégal légale)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Remise globale (FCFA)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    value={discountTotal}
                    onChange={(e) => setDiscountTotal(Number(e.target.value))}
                    className="text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Modalités de paiement
                </label>
                <input
                  type="text"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  placeholder="Ex: Wave, Orange Money ou Virement bancaire"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                />
              </div>
            </div>

            {/* Récapitulatif chiffres */}
            <div className="w-full sm:w-64 space-y-2 text-xs border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-800 pt-3 sm:pt-0 sm:pl-6">
              <div className="flex justify-between text-slate-500">
                <span>Sous-total HT :</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                  {formatFCFA(totals.subtotal)}
                </span>
              </div>

              {discountTotal > 0 && (
                <div className="flex justify-between text-emerald-500">
                  <span>Remise :</span>
                  <span className="font-mono font-bold">-{formatFCFA(discountTotal)}</span>
                </div>
              )}

              {taxRate > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>TVA ({taxRate}%) :</span>
                  <span className="font-mono font-bold">{formatFCFA(totals.taxAmount)}</span>
                </div>
              )}

              <div className="border-t border-slate-200 dark:border-slate-800 pt-2 flex justify-between text-base font-extrabold text-slate-900 dark:text-white">
                <span>Total TTC :</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">
                  {formatFCFA(totals.totalAmount)}
                </span>
              </div>
            </div>

          </div>

          {/* Section 5 : Notes & Assistance IA */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Remarques & Conditions Particulières :
              </label>
              <button
                type="button"
                onClick={handleGenerateAiPitch}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="h-3 w-3" />
                Générer les arguments commerciaux avec l'IA
              </button>
            </div>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Offre valable sous réserve de disponibilité..."
              className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Boutons Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-200"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? "Enregistrement..." : initialQuote ? "Mettre à jour le Devis" : "Créer le Devis"}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}

// =========================================================================
// SOUS-COMPOSANT : MODAL VUE PROFORMA / IMPRESSION PDF
// =========================================================================
interface ProformaViewModalProps {
  quote: Quote;
  business: any;
  onClose: () => void;
  onShareWhatsApp: () => void;
}

function ProformaViewModal({ quote, business, onClose, onShareWhatsApp }: ProformaViewModalProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white text-slate-900 rounded-3xl max-w-3xl w-full p-8 shadow-2xl space-y-6 my-8 max-h-[92vh] overflow-y-auto print:p-0 print:shadow-none print:max-w-full">
        
        {/* Actions bar (masqué à l'impression) */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Aperçu Facture Proforma
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Imprimer / PDF</span>
            </button>

            <button
              type="button"
              onClick={onShareWhatsApp}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
            >
              <WhatsAppIcon className="h-3.5 w-3.5" />
              <span>Partager sur WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ================= CORPS DE LA PROFORMA ================= */}
        <div className="space-y-8 p-4">
          
          {/* En-tête de la Proforma */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-6">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {business.name}
              </h1>
              <p className="text-xs text-slate-500 mt-1">{business.sector}</p>
              <p className="text-xs text-slate-500">Dakar, Sénégal · WhatsApp Professionnel</p>
            </div>

            <div className="text-right space-y-1">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                DEVIS PROFORMA
              </span>
              <p className="text-sm font-bold font-mono text-slate-800">
                N° {quote.quote_number}
              </p>
              <p className="text-[11px] text-slate-500">
                Émis le : {new Date(quote.created_at).toLocaleDateString("fr-FR")}
              </p>
            </div>
          </div>

          {/* Destinataire & Validité */}
          <div className="grid grid-cols-2 gap-6 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                Proposition établie pour :
              </p>
              <p className="text-sm font-extrabold text-slate-900">{quote.contact_name}</p>
              <p className="text-slate-600 font-mono">{quote.contact_phone}</p>
              {quote.contact_email && <p className="text-slate-500">{quote.contact_email}</p>}
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                Conditions de l'offre :
              </p>
              <p className="text-slate-700">
                <strong>Objet :</strong> {quote.title}
              </p>
              <p className="text-slate-700">
                <strong>Offre valable jusqu'au :</strong> {new Date(quote.valid_until).toLocaleDateString("fr-FR")}
              </p>
              <p className="text-slate-700">
                <strong>Règlement :</strong> {quote.payment_terms || "Wave, Orange Money ou Virement"}
              </p>
            </div>
          </div>

          {/* Tableau des prestations */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Désignation</th>
                  <th className="p-3.5 text-center">Qté</th>
                  <th className="p-3.5 text-right">Prix Unitaire</th>
                  <th className="p-3.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quote.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="p-3.5 font-medium text-slate-900">{item.description}</td>
                    <td className="p-3.5 text-center font-mono">{item.quantity}</td>
                    <td className="p-3.5 text-right font-mono">{formatFCFA(item.unit_price)}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                      {formatFCFA(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totaux & Règlements */}
          <div className="flex justify-between items-start gap-8">
            <div className="flex-1 text-xs text-slate-500 space-y-2">
              {quote.notes && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="font-bold text-slate-700 text-[10px] uppercase">Remarques particulières :</p>
                  <p className="text-slate-600 mt-0.5">{quote.notes}</p>
                </div>
              )}
              <p className="text-[11px] text-slate-400">
                Ce devis fait office de facture proforma. Pour validation, merci de signer avec la mention « Bon pour accord » ou de confirmer par retour WhatsApp.
              </p>
            </div>

            {/* Bloc Total */}
            <div className="w-64 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Sous-total HT :</span>
                <span className="font-mono font-bold">{formatFCFA(quote.subtotal)}</span>
              </div>

              {quote.discount_total > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Remise accordée :</span>
                  <span className="font-mono font-bold">-{formatFCFA(quote.discount_total)}</span>
                </div>
              )}

              {quote.tax_rate > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>TVA ({quote.tax_rate}%) :</span>
                  <span className="font-mono font-bold">{formatFCFA(quote.tax_amount)}</span>
                </div>
              )}

              <div className="border-t-2 border-slate-900 pt-2 flex justify-between text-sm font-black text-slate-900">
                <span>NET À PAYER :</span>
                <span className="font-mono text-emerald-600">{formatFCFA(quote.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* Tampon & Signature */}
          <div className="pt-8 border-t border-slate-200 flex justify-between items-end text-xs">
            <div>
              <p className="text-slate-500">Date et Signature du Client :</p>
              <div className="h-16 w-48 border border-dashed border-slate-300 rounded-xl mt-1"></div>
            </div>

            <div className="text-right">
              <p className="text-slate-500">Pour {business.name} (Service Ventes) :</p>
              <div className="inline-block p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-[10px] mt-1 text-center">
                ✓ Document Certifié Conforme<br />
                {business.name} · IZI Market
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

// =========================================================================
// SOUS-COMPOSANT : MODAL PARTAGE WHATSAPP EN 1 CLIC
// =========================================================================
interface WhatsAppShareModalProps {
  quote: Quote;
  business: any;
  onClose: () => void;
  onConfirmSend: () => Promise<void>;
  onCopy: () => void;
  copied: boolean;
}

function WhatsAppShareModal({
  quote,
  business,
  onClose,
  onConfirmSend,
  onCopy,
  copied
}: WhatsAppShareModalProps) {
  const messageText = generateQuoteWhatsAppMessage(quote, business);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6">
        
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
              <WhatsAppIcon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Transmettre le Devis sur WhatsApp
              </h3>
              <p className="text-xs text-slate-500">
                À destination de <strong>{quote.contact_name}</strong> ({quote.contact_phone})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white">✕</button>
        </div>

        {/* Aperçu du message façon bulle WhatsApp */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Aperçu du message formaté :
          </label>
          <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 text-xs text-slate-200 font-mono whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
            {messageText}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={onCopy}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            <span>{copied ? "Message copié !" : "Copier le texte"}</span>
          </button>

          <button
            type="button"
            onClick={onConfirmSend}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
          >
            <Send className="h-4 w-4" />
            <span>Ouvrir WhatsApp & Envoyer</span>
          </button>
        </div>

      </div>
    </div>
  );
}
