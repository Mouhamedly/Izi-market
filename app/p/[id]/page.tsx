"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { CatalogItem } from "@/types/database";
import { INITIAL_CATALOG, INITIAL_BUSINESS } from "@/lib/mock-data";
import {
  MapPin,
  Map,
  ExternalLink,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Key,
  Home,
  Camera,
  Share2,
  Check,
  Copy,
  Sparkles,
  Building2,
  Phone
} from "lucide-react";

export default function PublicProductPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const itemId = resolvedParams.id;

  const [item, setItem] = useState<CatalogItem | null>(null);
  const [businessName, setBusinessName] = useState<string>("Welma Digital");
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Chercher d'abord dans le localStorage
    let found: CatalogItem | null = null;
    if (typeof window !== "undefined") {
      try {
        const savedCatalogStr = localStorage.getItem("izi_catalog");
        if (savedCatalogStr) {
          const list: CatalogItem[] = JSON.parse(savedCatalogStr);
          found = list.find((i) => i.id === itemId) || null;
        }

        const savedBizStr = localStorage.getItem("izi_business");
        if (savedBizStr) {
          const biz = JSON.parse(savedBizStr);
          if (biz.name) setBusinessName(biz.name);
        }
      } catch (e) {
        console.error("Erreur lecture localStorage:", e);
      }
    }

    // 2. Si non trouvé, chercher dans les mocks initiaux
    if (!found) {
      found = INITIAL_CATALOG.find((i) => i.id === itemId) || null;
    }

    setItem(found);
    setIsLoading(false);
  }, [itemId]);

  const allImages = React.useMemo(() => {
    if (!item) return [];
    if (item.images && item.images.length > 0) return item.images;
    if (item.image_url) return [item.image_url];
    return [];
  }, [item]);

  const isVente = item?.offer_type === "vente";

  // Partage WhatsApp du bien pour le client
  const handleContactWhatsApp = () => {
    if (!item) return;
    const msg = `Salam ! Je vous contacte concernant votre annonce pour : *${item.title}* (${item.price}). Est-ce toujours disponible ?`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-400">Chargement de la fiche du bien...</p>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="h-16 w-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-4">
          <Building2 className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-extrabold">Offre introuvable ou expirée</h1>
        <p className="text-xs text-slate-400 mt-2 max-w-sm">
          Le bien demandé n'est plus disponible ou le lien a expiré. Contactez l'agence pour découvrir nos offres actuelles.
        </p>
        <button
          onClick={() => window.open("https://wa.me/", "_blank")}
          className="mt-6 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg"
        >
          <MessageCircle className="h-4 w-4" />
          <span>Contacter l'agence sur WhatsApp</span>
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Barre supérieure de l'Agence */}
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-xs font-black text-white leading-tight">{businessName}</h2>
            <p className="text-[10px] text-emerald-400 font-semibold">Annonce Immobilière Certifiée</p>
          </div>
        </div>

        <button
          onClick={handleCopyLink}
          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Share2 className="h-3.5 w-3.5" />}
          <span>{copiedLink ? "Lien copié !" : "Partager"}</span>
        </button>
      </header>

      {/* Contenu principal */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6 space-y-6 pb-28">
        
        {/* GALERIE PHOTOS INTERACTIVE */}
        <div className="space-y-3">
          <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 h-72 sm:h-96 group select-none shadow-xl">
            {allImages.length > 0 ? (
              <img
                src={allImages[activePhotoIdx]}
                alt={`${item.title} - Photo ${activePhotoIdx + 1}`}
                className="w-full h-full object-cover transition-all"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-900">
                <Camera className="h-10 w-10 mb-2 opacity-40" />
                <span className="text-xs font-bold">Aucune photo enregistrée</span>
              </div>
            )}

            {/* Badges sur l'image */}
            <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider backdrop-blur-md shadow-md ${
                  isVente ? "bg-indigo-600 text-white" : "bg-emerald-600 text-white"
                }`}
              >
                {isVente ? <Home className="h-3.5 w-3.5" /> : <Key className="h-3.5 w-3.5" />}
                <span>{isVente ? "À Vendre" : "À Louer"}</span>
              </span>

              {item.category && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-950/80 text-white backdrop-blur-md border border-white/10">
                  {item.category}
                </span>
              )}
            </div>

            {/* Flèches de navigation */}
            {allImages.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setActivePhotoIdx((prev) => (prev - 1 + allImages.length) % allImages.length)
                  }
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-slate-950/70 hover:bg-slate-950 text-white backdrop-blur-md flex items-center justify-center transition-all cursor-pointer shadow-lg"
                  title="Photo précédente"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setActivePhotoIdx((prev) => (prev + 1) % allImages.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-slate-950/70 hover:bg-slate-950 text-white backdrop-blur-md flex items-center justify-center transition-all cursor-pointer shadow-lg"
                  title="Photo suivante"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>

                {/* Compteur photo */}
                <div className="absolute bottom-4 right-4 z-10">
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-slate-950/80 text-white backdrop-blur-md border border-white/10 flex items-center gap-1.5">
                    <Camera className="h-3.5 w-3.5 text-emerald-400" />
                    <span>{activePhotoIdx + 1} / {allImages.length}</span>
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Miniatures cliquables */}
          {allImages.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActivePhotoIdx(idx)}
                  className={`relative h-16 w-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                    activePhotoIdx === idx
                      ? "border-emerald-500 scale-95 shadow-md"
                      : "border-slate-800 opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt={`Miniature ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* FICHE DÉTAILLÉE DU BIEN */}
        <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 space-y-5 shadow-sm">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">
              {item.title}
            </h1>
            <p className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono mt-2">
              {item.price}
            </p>
          </div>

          {/* Localisation & Google Maps */}
          {item.address && (
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-white">Adresse / Localisation</p>
                  <p className="text-xs text-slate-300 mt-0.5">{item.address}</p>
                </div>
              </div>

              {item.google_maps_url && (
                <a
                  href={item.google_maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 transition-colors"
                >
                  <Map className="h-3.5 w-3.5" />
                  <span>Voir l'itinéraire sur Google Maps</span>
                  <ExternalLink className="h-3 w-3 ml-0.5" />
                </a>
              )}
            </div>
          )}

          {/* Description */}
          {item.description && (
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Description & Caractéristiques
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {item.description}
              </p>
            </div>
          )}

          {/* Statut Disponibilité */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-800 text-xs">
            <span className="text-slate-400 font-medium">Disponibilité :</span>
            <span className={`font-bold ${item.available ? "text-emerald-400" : "text-rose-400"}`}>
              {item.available ? "Disponible à la visite" : "Actuellement indisponible"}
            </span>
          </div>
        </div>

      </main>

      {/* BARRE FLOTTANTE INFÉRIEURE : CONTACT WHATSAPP */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-slate-950/90 backdrop-blur-md border-t border-slate-800 p-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div className="hidden sm:block">
            <p className="text-xs font-bold text-white truncate">{item.title}</p>
            <p className="text-sm font-black text-emerald-400 font-mono">{item.price}</p>
          </div>

          <button
            onClick={handleContactWhatsApp}
            className="flex-1 sm:flex-initial px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-600/25 transition-all cursor-pointer"
          >
            <MessageCircle className="h-5 w-5 fill-white" />
            <span>Contacter sur WhatsApp pour ce bien</span>
          </button>
        </div>
      </div>
    </div>
  );
}
