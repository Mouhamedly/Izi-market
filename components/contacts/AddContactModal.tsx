"use client";

import React, { useState } from "react";
import { useApp } from "@/lib/store";
import { PipelineStatus } from "@/types/database";
import {
  X,
  UserPlus,
  Phone,
  User,
  Tag,
  DollarSign,
  FileText,
  MessageSquare,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultStatus?: PipelineStatus;
}

const PIPELINE_STATUS_OPTIONS: Array<{ value: PipelineStatus; label: string; badge: string }> = [
  { value: "nouveau", label: "Nouveau (Premier contact)", badge: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
  { value: "interesse", label: "Intéressé (Demande d'infos)", badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300" },
  { value: "rdv", label: "Visite / RDV planifié", badge: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
  { value: "negociation", label: "En Négociation & Devis", badge: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300" },
  { value: "client", label: "Client Conclu (Gagné)", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
  { value: "perdu", label: "Perdu / Sans suite", badge: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300" },
];

export function AddContactModal({ isOpen, onClose, defaultStatus = "nouveau" }: AddContactModalProps) {
  const { addContact } = useApp();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<PipelineStatus>(defaultStatus);
  const [need, setNeed] = useState("");
  const [budget, setBudget] = useState("");
  const [notes, setNotes] = useState("");
  const [openWhatsApp, setOpenWhatsApp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanDigits = phone.replace(/\D/g, "");
    if (!cleanDigits || cleanDigits.length < 7) {
      setError("Veuillez saisir un numéro de téléphone WhatsApp valide (au moins 7 chiffres, ex: +221 77 123 45 67).");
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await addContact({
        name: name.trim() || "Prospect",
        wa_phone: phone.trim(),
        status: status,
        need: need.trim() || null,
        budget: budget.trim() || null,
        notes: notes.trim() || null
      });

      if (openWhatsApp) {
        const cleanPhone = created.wa_phone.replace(/\D/g, "");
        window.open(`https://wa.me/${cleanPhone}`, "_blank");
      }

      // Réinitialiser le formulaire
      setName("");
      setPhone("");
      setStatus(defaultStatus);
      setNeed("");
      setBudget("");
      setNotes("");
      setOpenWhatsApp(false);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError("Une erreur est survenue lors de l'enregistrement du contact.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Nouveau Contact / Prospect
              </h3>
              <p className="text-xs text-slate-500">
                Ajoutez un contact directement dans votre pipeline WhatsApp
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 flex items-center gap-2.5 text-xs font-semibold text-rose-700 dark:text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Nom du contact */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-emerald-600" />
              <span>Nom complet du prospect</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex : Mamadou Diallo, Dr. Ousmane Sow..."
              className="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Numéro WhatsApp */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-emerald-600" />
              <span>Numéro WhatsApp <strong className="text-rose-500">*</strong></span>
            </label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ex : +221 77 123 45 67 ou 771234567"
              className="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[10px] text-slate-400">
              Format sénégalais automatique (+221) ou international complet.
            </p>
          </div>

          {/* Étape Pipeline */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-emerald-600" />
              <span>Étape initiale du Pipeline</span>
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as PipelineStatus)}
              className="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {PIPELINE_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Besoin / Projet */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-emerald-600" />
              <span>Besoin qualifié / Projet recherché</span>
            </label>
            <input
              type="text"
              value={need}
              onChange={(e) => setNeed(e.target.value)}
              placeholder="Ex : Recherche Villa F4 aux Almadies, Studio Plateau..."
              className="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Budget */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
              <span>Budget indicatif</span>
            </label>
            <input
              type="text"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="Ex : 1 200 000 FCFA / mois"
              className="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Notes & Remarques internes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Commentaires, exigences spécifiques, canal de contact..."
              className="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          {/* Option WhatsApp direct */}
          <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={openWhatsApp}
              onChange={(e) => setOpenWhatsApp(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
            />
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
              <span>Ouvrir la discussion WhatsApp immédiatement après l'enregistrement</span>
            </span>
          </label>

          {/* Boutons d'action */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/25 transition-all disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{isSubmitting ? "Enregistrement..." : "Enregistrer le Contact"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
