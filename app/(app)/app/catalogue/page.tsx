"use client";

import React, { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { CatalogItem, CatalogOfferType } from "@/types/database";
import {
  Package,
  Plus,
  Search,
  Tag,
  DollarSign,
  FileText,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  UploadCloud,
  Download,
  LayoutGrid,
  List,
  Sparkles,
  ExternalLink,
  MessageSquare,
  X,
  AlertTriangle,
  MapPin,
  Map,
  Home,
  Key,
  Camera,
  Upload,
  ChevronLeft,
  ChevronRight,
  Star,
  Loader2,
  Share2,
  Copy,
  Check,
  MessageCircle,
  ArrowRight
} from "lucide-react";

// Suggestions de catégories selon le type de transaction
const CATEGORY_SUGGESTIONS: Record<CatalogOfferType, string[]> = {
  location: [
    "Location Résidentielle (Appartement, Villa)",
    "Meublé Court/Moyen Séjour (Studio, Loft)",
    "Immobilier Professionnel (Bureaux, Locaux)",
    "Entrepôt & Logistique",
    "Autre Location"
  ],
  vente: [
    "Vente Résidentielle (Villa, Maison)",
    "Vente Appartement",
    "Vente Terrain & Parcelles",
    "Immeuble de rapport",
    "Locaux Commerciaux",
    "Autre Vente"
  ],
  autre: [
    "Prestation & Service",
    "Conseil & Gestion",
    "Autre Bien"
  ]
};

export default function CataloguePage() {
  const { catalog, addCatalogItem, updateCatalogItem, deleteCatalogItem, business } = useApp();

  // Filtres & Affichage
  const [searchQuery, setSearchQuery] = useState("");
  const [offerTypeFilter, setOfferTypeFilter] = useState<"all" | "location" | "vente">("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<"all" | "available" | "unavailable">("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Modal Ajout / Modification
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [offerType, setOfferType] = useState<CatalogOfferType>("location");
  const [category, setCategory] = useState("");
  const [address, setAddress] = useState("");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [activePreviewIdx, setActivePreviewIdx] = useState<number>(0);
  const [available, setAvailable] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // État navigation photos par carte
  const [cardImageIndex, setCardImageIndex] = useState<Record<string, number>>({});

  // Modal Partage WhatsApp avec Photos
  const [sharingItem, setSharingItem] = useState<CatalogItem | null>(null);
  const [isCopyingImage, setIsCopyingImage] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);

  // Suppression
  const [itemToDelete, setItemToDelete] = useState<CatalogItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Catégories uniques
  const categories = useMemo(() => {
    const set = new Set<string>();
    catalog.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return Array.from(set);
  }, [catalog]);

  // Filtrage des articles
  const filteredCatalog = useMemo(() => {
    return catalog.filter((item) => {
      // Recherche
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        q === "" ||
        item.title.toLowerCase().includes(q) ||
        (item.description || "").toLowerCase().includes(q) ||
        (item.category || "").toLowerCase().includes(q) ||
        (item.address || "").toLowerCase().includes(q) ||
        item.price.toLowerCase().includes(q);

      // Type d'offre (Vente vs Location)
      const matchOfferType =
        offerTypeFilter === "all" ||
        item.offer_type === offerTypeFilter ||
        (!item.offer_type && offerTypeFilter === "location");

      // Catégorie
      const matchCategory = selectedCategory === "all" || item.category === selectedCategory;

      // Disponibilité
      const matchAvailability =
        availabilityFilter === "all" ||
        (availabilityFilter === "available" && item.available) ||
        (availabilityFilter === "unavailable" && !item.available);

      return matchSearch && matchOfferType && matchCategory && matchAvailability;
    });
  }, [catalog, searchQuery, offerTypeFilter, selectedCategory, availabilityFilter]);

  // Compression & Importation de plusieurs images locales depuis l'appareil
  const handleImageFilesSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingImage(true);
    setFormError(null);

    const fileList = Array.from(files);
    const compressedImages: string[] = [];

    const compressFile = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            const MAX_WIDTH = 1200;
            const MAX_HEIGHT = 900;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height = Math.round((height * MAX_WIDTH) / width);
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width = Math.round((width * MAX_HEIGHT) / height);
                height = MAX_HEIGHT;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx?.drawImage(img, 0, 0, width, height);

            // Compression JPEG 82% pour fluidité totale
            const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.82);
            resolve(compressedDataUrl);
          };
          img.onerror = () => reject(new Error("Format d'image non supporté."));
          img.src = event.target?.result as string;
        };
        reader.onerror = () => reject(new Error("Erreur de lecture du fichier."));
        reader.readAsDataURL(file);
      });
    };

    try {
      for (const file of fileList) {
        try {
          const compressed = await compressFile(file);
          compressedImages.push(compressed);
        } catch (err) {
          console.error("Erreur de compression pour le fichier", file.name, err);
        }
      }

      if (compressedImages.length > 0) {
        setImages((prev) => {
          const next = [...prev, ...compressedImages];
          if (prev.length === 0) {
            setActivePreviewIdx(0);
          }
          return next;
        });
        showToast(`${compressedImages.length} photo(s) ajoutée(s) avec succès !`);
      }
    } catch {
      setFormError("Une erreur est survenue lors du traitement des images.");
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Suppression d'une photo de la galerie
  const handleRemoveImage = (indexToRemove: number) => {
    setImages((prev) => {
      const updated = prev.filter((_, idx) => idx !== indexToRemove);
      if (activePreviewIdx >= updated.length) {
        setActivePreviewIdx(Math.max(0, updated.length - 1));
      }
      return updated;
    });
  };

  // Définir comme photo principale (déplacer en position 0)
  const handleSetPrimaryImage = (indexToPromote: number) => {
    if (indexToPromote === 0) return;
    setImages((prev) => {
      const selected = prev[indexToPromote];
      const rest = prev.filter((_, idx) => idx !== indexToPromote);
      return [selected, ...rest];
    });
    setActivePreviewIdx(0);
    showToast("Photo définie comme couverture principale ⭐");
  };

  // Ouverture modal Création / Édition
  const handleOpenModal = (item?: CatalogItem) => {
    setFormError(null);
    if (item) {
      setEditingItem(item);
      setTitle(item.title);
      setPrice(item.price);
      setOfferType(item.offer_type || "location");
      setCategory(item.category || "Location Résidentielle");
      setAddress(item.address || "");
      setGoogleMapsUrl(item.google_maps_url || "");
      setDescription(item.description || "");
      const itemImgs = (item.images && item.images.length > 0)
        ? item.images
        : (item.image_url ? [item.image_url] : []);
      setImages(itemImgs);
      setActivePreviewIdx(0);
      setAvailable(item.available);
    } else {
      setEditingItem(null);
      setTitle("");
      setPrice("");
      setOfferType("location");
      setCategory("Location Résidentielle");
      setAddress("");
      setGoogleMapsUrl("");
      setDescription("");
      setImages([]);
      setActivePreviewIdx(0);
      setAvailable(true);
    }
    setIsModalOpen(true);
  };

  // Enregistrement
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError("Veuillez saisir le nom ou titre du bien/produit.");
      return;
    }
    if (!price.trim()) {
      setFormError("Veuillez indiquer le prix ou loyer (ex: 850 000 FCFA / mois).");
      return;
    }

    const mainImageUrl = images.length > 0 ? images[0] : null;

    try {
      if (editingItem) {
        await updateCatalogItem(editingItem.id, {
          title: title.trim(),
          price: price.trim(),
          offer_type: offerType,
          category: category.trim() || "Immobilier",
          address: address.trim() || null,
          google_maps_url: googleMapsUrl.trim() || null,
          description: description.trim() || null,
          image_url: mainImageUrl,
          images: images.length > 0 ? images : null,
          available
        });
        showToast("Offre mise à jour avec succès !");
      } else {
        await addCatalogItem({
          title: title.trim(),
          price: price.trim(),
          offer_type: offerType,
          category: category.trim() || "Immobilier",
          address: address.trim() || null,
          google_maps_url: googleMapsUrl.trim() || null,
          description: description.trim() || null,
          image_url: mainImageUrl,
          images: images.length > 0 ? images : null,
          available
        });
        showToast("Nouveau bien ajouté au catalogue !");
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setFormError("Erreur lors de l'enregistrement du produit.");
    }
  };

  // Bascule de disponibilité rapide en 1 clic
  const handleToggleAvailability = async (item: CatalogItem) => {
    await updateCatalogItem(item.id, { available: !item.available });
    showToast(
      !item.available
        ? `« ${item.title} » marqué comme disponible.`
        : `« ${item.title} » marqué comme indisponible.`
    );
  };

  // Confirmation de suppression
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    await deleteCatalogItem(itemToDelete.id);
    showToast(`« ${itemToDelete.title} » supprimé du catalogue.`);
    setItemToDelete(null);
  };

  // Convertit une URL ou Data URL en Blob pour les transferts fichiers
  const urlToBlob = async (url: string): Promise<Blob> => {
    const res = await fetch(url);
    return await res.blob();
  };

  // Génère le message WhatsApp propre, nettoyé de tout caractère corrompu Unicode
  const generateWhatsAppMessage = (item: CatalogItem) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const showcaseUrl = `${origin}/p/${item.id}`;
    
    let text = `Salam ! Voici notre offre pour *${item.title}* chez *${business.name}* :\n\n`;
    text += `💵 *Tarif :* ${item.price}\n`;
    if (item.offer_type) {
      text += `🏠 *Type :* ${item.offer_type === "vente" ? "À Vendre" : "À Louer"}\n`;
    }
    if (item.address) {
      text += `📍 *Localisation :* ${item.address}\n`;
    }
    if (item.google_maps_url) {
      text += `🗺️ *Itinéraire Google Maps :* ${item.google_maps_url}\n`;
    }
    const itemPhotos = (item.images && item.images.length > 0) ? item.images : (item.image_url ? [item.image_url] : []);
    if (itemPhotos.length > 0) {
      text += `📸 *Photos HD du bien (${itemPhotos.length} photo${itemPhotos.length > 1 ? "s" : ""}) :*\n👉 ${showcaseUrl}\n`;
    }
    if (item.description) {
      text += `\n📝 *Détails :* ${item.description}\n`;
    }
    text += `\nSouhaitez-vous planifier une visite ou obtenir plus d'informations ?`;
    
    // Nettoie strictement les sélecteurs de variation Unicode (évite les  sur WhatsApp)
    return text.replace(/[\uFE00-\uFE0F]/g, "");
  };

  // Partage natif avec pièces jointes (photos réelles) sur mobile ou navigateurs compatibles
  const handleShareWithNativeFiles = async (item: CatalogItem) => {
    const itemImages = (item.images && item.images.length > 0) ? item.images : (item.image_url ? [item.image_url] : []);
    const messageText = generateWhatsAppMessage(item);

    if (itemImages.length > 0 && typeof navigator !== "undefined" && navigator.canShare) {
      try {
        const filePromises = itemImages.slice(0, 5).map(async (url, idx) => {
          const blob = await urlToBlob(url);
          return new File([blob], `${item.title.replace(/\s+/g, "_").slice(0, 20)}_photo_${idx + 1}.jpg`, {
            type: "image/jpeg"
          });
        });

        const files = await Promise.all(filePromises);

        if (navigator.canShare({ files })) {
          await navigator.share({
            title: item.title,
            text: messageText,
            files: files
          });
          showToast("Photos et message partagés sur WhatsApp !");
          return;
        }
      } catch (e: any) {
        if (e.name !== "AbortError") {
          console.log("Web Share API non supporté ou annulé", e);
        } else {
          return;
        }
      }
    }

    // Si le partage de fichiers natif n'est pas géré par l'OS : ouvrir WhatsApp Web avec le texte & lien des photos
    const waUrl = `https://wa.me/?text=${encodeURIComponent(messageText)}`;
    window.open(waUrl, "_blank");
    showToast("Discussion WhatsApp ouverte !");
  };

  // Copie de l'image principale dans le presse-papier pour Ctrl+V dans WhatsApp Web
  const handleCopyImageToClipboard = async (item: CatalogItem) => {
    const itemImages = (item.images && item.images.length > 0) ? item.images : (item.image_url ? [item.image_url] : []);
    if (itemImages.length === 0) {
      showToast("Aucune photo disponible pour ce bien");
      return;
    }

    setIsCopyingImage(true);
    try {
      const imgUrl = itemImages[0];
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imgUrl;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0);

      canvas.toBlob(async (blob) => {
        if (!blob) {
          showToast("Impossible de copier la photo");
          setIsCopyingImage(false);
          return;
        }
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob })
          ]);
          showToast("Photo copiée ! Allez sur WhatsApp Web et appuyez sur Ctrl + V 📋");
        } catch {
          showToast("Votre navigateur ne permet pas la copie directe d'image.");
        } finally {
          setIsCopyingImage(false);
        }
      }, "image/png");
    } catch (e) {
      console.error(e);
      setIsCopyingImage(false);
      showToast("Erreur lors de la copie de la photo");
    }
  };

  // Téléchargement des photos pour les glisser dans WhatsApp Web
  const handleDownloadPhotos = async (item: CatalogItem) => {
    const itemImages = (item.images && item.images.length > 0) ? item.images : (item.image_url ? [item.image_url] : []);
    if (itemImages.length === 0) {
      showToast("Aucune photo à télécharger");
      return;
    }

    showToast(`Téléchargement de ${itemImages.length} photo(s)...`);
    for (let i = 0; i < itemImages.length; i++) {
      const a = document.createElement("a");
      a.href = itemImages[i];
      a.download = `${item.title.replace(/\s+/g, "_").slice(0, 25)}_photo_${i + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      await new Promise((r) => setTimeout(r, 200));
    }
    showToast("Photos téléchargées ! Glissez-les dans votre discussion WhatsApp.");
  };

  // Ouvre le modal de partage WhatsApp avec photos
  const handleShareOnWhatsApp = (item: CatalogItem) => {
    setSharingItem(item);
  };

  // Ouverture WhatsApp avec texte pré-rempli
  const handleOpenDirectWhatsApp = (item: CatalogItem) => {
    const messageText = generateWhatsAppMessage(item);
    const waUrl = `https://wa.me/?text=${encodeURIComponent(messageText)}`;
    window.open(waUrl, "_blank");
  };

  // Export JSON du catalogue
  const handleExportCatalog = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(catalog, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `catalogue_produits_${business.name.replace(/\s+/g, "_")}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      
      {/* Toast de confirmation */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="h-4 w-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-2">
            <Package className="h-3.5 w-3.5" />
            Catalogue Commercial & Biens Immobiliers
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Catalogue de Produits & Biens
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Gérez vos offres de <strong>Location</strong> et de <strong>Vente</strong> avec adresses, liens Google Maps et photos réelles. Votre assistant IA Claude utilise ce catalogue pour renseigner vos clients sur WhatsApp.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/25 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>+ Nouveau Produit / Bien</span>
          </button>

          <Link
            href="/app/import"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-emerald-600 shadow-xs transition-colors"
          >
            <UploadCloud className="h-3.5 w-3.5 text-emerald-600" />
            <span>Importer (CSV)</span>
          </Link>

          <button
            onClick={handleExportCatalog}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white shadow-xs transition-colors cursor-pointer"
            title="Exporter tout le catalogue"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Exporter</span>
          </button>
        </div>
      </div>

      {/* Cartes KPIs Statistiques */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1 : Total Articles */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Offres
            </span>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {catalog.length}
            </p>
            <span className="text-xs font-bold text-emerald-600">
              Au catalogue
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            {catalog.filter((c) => c.offer_type === "location" || !c.offer_type).length} locations · {catalog.filter((c) => c.offer_type === "vente").length} ventes
          </p>
        </div>

        {/* KPI 2 : En Location */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Locations
            </span>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
              <Key className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {catalog.filter((c) => c.offer_type === "location" || !c.offer_type).length}
            </p>
            <span className="text-xs font-bold text-emerald-600">
              Baux / Mois
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Appartements, villas, studios</p>
        </div>

        {/* KPI 3 : En Vente */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              En Vente
            </span>
            <div className="h-8 w-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center">
              <Home className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {catalog.filter((c) => c.offer_type === "vente").length}
            </p>
            <span className="text-xs font-bold text-indigo-600">
              Acquisitions
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Villas, terrains, immeubles</p>
        </div>

        {/* KPI 4 : Synchronisé avec l'IA */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              IA & WhatsApp
            </span>
            <div className="h-8 w-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-sm font-extrabold text-slate-900 dark:text-white">
              Localisation & Maps
            </p>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              Transmis
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Guide vos clients vers le bien</p>
        </div>

      </div>

      {/* Barre d'outils, Recherche et Filtres */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Champ de recherche */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par titre, quartier (Almadies, Mermoz...), prix..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Filtres Transaction (Location / Vente) & Mode d'affichage */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Toggle Location / Vente */}
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
              <button
                onClick={() => setOfferTypeFilter("all")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  offerTypeFilter === "all"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Tous
              </button>
              <button
                onClick={() => setOfferTypeFilter("location")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  offerTypeFilter === "location"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-emerald-600"
                }`}
              >
                <Key className="h-3 w-3" />
                <span>À Louer</span>
              </button>
              <button
                onClick={() => setOfferTypeFilter("vente")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  offerTypeFilter === "vente"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-indigo-600"
                }`}
              >
                <Home className="h-3 w-3" />
                <span>À Vendre</span>
              </button>
            </div>

            {/* Filtre Disponibilité */}
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
              <button
                onClick={() => setAvailabilityFilter("available")}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  availabilityFilter === "available"
                    ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
                title="Uniquement disponibles"
              >
                Dispos
              </button>
              <button
                onClick={() => setAvailabilityFilter("all")}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  availabilityFilter === "all"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Tous
              </button>
            </div>

            {/* Toggle Grille / Table */}
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-400 hover:text-slate-600"
                }`}
                title="Vue Grille"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === "table"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-400 hover:text-slate-600"
                }`}
                title="Vue Tableau"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Pilules de Catégories */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-colors cursor-pointer ${
              selectedCategory === "all"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
            }`}
          >
            Toutes les catégories ({catalog.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
              }`}
            >
              {cat} ({catalog.filter((c) => c.category === cat).length})
            </button>
          ))}
        </div>
      </div>

      {/* Affichage des Produits : VUE GRILLE */}
      {viewMode === "grid" && filteredCatalog.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in">
          {filteredCatalog.map((item) => {
            const isVente = item.offer_type === "vente";
            const itemImages = (item.images && item.images.length > 0)
              ? item.images
              : (item.image_url ? [item.image_url] : []);
            const currentImgIdx = cardImageIndex[item.id] || 0;
            const displayedImage = itemImages[currentImgIdx] || item.image_url;

            return (
              <div
                key={item.id}
                className="group bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl hover:border-emerald-500/50 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Image du Produit */}
                  <div className="relative h-56 w-full bg-slate-900 overflow-hidden select-none">
                    {displayedImage ? (
                      <img
                        src={displayedImage}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-gradient-to-tr from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-900">
                        <Package className="h-10 w-10 mb-1 opacity-50" />
                        <span className="text-[11px] font-bold">Image non renseignée</span>
                      </div>
                    )}

                    {/* Navigation précédente / suivante si plusieurs photos */}
                    {itemImages.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCardImageIndex((prev) => ({
                              ...prev,
                              [item.id]: (currentImgIdx - 1 + itemImages.length) % itemImages.length
                            }));
                          }}
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-slate-950/75 hover:bg-slate-950 text-white backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md z-10"
                          title="Photo précédente"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCardImageIndex((prev) => ({
                              ...prev,
                              [item.id]: (currentImgIdx + 1) % itemImages.length
                            }));
                          }}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-slate-950/75 hover:bg-slate-950 text-white backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md z-10"
                          title="Photo suivante"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>

                        {/* Compteur de photos */}
                        <div className="absolute top-3 right-3 z-10">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-950/80 text-white backdrop-blur-md shadow-md border border-white/10">
                            <Camera className="h-3 w-3 text-emerald-400" />
                            <span>{currentImgIdx + 1}/{itemImages.length}</span>
                          </span>
                        </div>

                        {/* Petits points indicateurs en bas */}
                        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10">
                          {itemImages.map((_, dotIdx) => (
                            <span
                              key={dotIdx}
                              className={`h-1.5 rounded-full transition-all ${
                                dotIdx === currentImgIdx
                                  ? "w-4 bg-emerald-400 shadow-xs"
                                  : "w-1.5 bg-white/60"
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}

                    {/* Badge À Louer ou À Vendre */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-md ${
                          isVente
                            ? "bg-indigo-600 text-white"
                            : "bg-emerald-600 text-white"
                        }`}
                      >
                        {isVente ? <Home className="h-3 w-3" /> : <Key className="h-3 w-3" />}
                        <span>{isVente ? "À Vendre" : "À Louer"}</span>
                      </span>

                      {/* Statut Stock / Dispo */}
                      <button
                        onClick={() => handleToggleAvailability(item)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold backdrop-blur-md shadow-md transition-all cursor-pointer ${
                          item.available
                            ? "bg-slate-900/80 text-emerald-400 hover:bg-slate-900"
                            : "bg-rose-600/90 text-white hover:bg-rose-700"
                        }`}
                        title="Cliquer pour basculer la disponibilité"
                      >
                        {item.available ? (
                          <>
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Dispo</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3" />
                            <span>Indisponible</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Badge Catégorie si une seule photo */}
                    {itemImages.length <= 1 && (
                      <div className="absolute top-3 right-3 z-10">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-900/80 text-white backdrop-blur-md max-w-[150px] truncate block">
                          {item.category || "Catalogue"}
                        </span>
                      </div>
                    )}

                    {/* Badge Localisation rapide si présent */}
                    {item.address && (
                      <div className="absolute bottom-3 left-3 right-3 z-10">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold bg-slate-950/85 text-white backdrop-blur-md max-w-full shadow-md border border-white/10">
                          <MapPin className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          <span className="truncate">{item.address}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Contenu de la Carte */}
                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                        {item.price}
                      </p>
                    </div>

                    {item.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                        {item.description}
                      </p>
                    )}

                    {/* Lien Google Maps cliquable si renseigné */}
                    {item.google_maps_url && (
                      <a
                        href={item.google_maps_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline pt-0.5"
                      >
                        <Map className="h-3.5 w-3.5" />
                        <span>Voir l'itinéraire sur Google Maps</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Barre d'Actions Inférieure */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                  
                  {/* Partager WhatsApp direct */}
                  <button
                    onClick={() => handleShareOnWhatsApp(item)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors cursor-pointer"
                    title="Partager cette offre sur WhatsApp avec l'adresse et le lien Maps"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>WhatsApp</span>
                  </button>

                  {/* Créer un Devis avec ce produit */}
                  <Link
                    href={`/app/devis?item=${encodeURIComponent(item.title)}&price=${encodeURIComponent(item.price)}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-xs"
                    title="Créer un devis proforma pour ce produit"
                  >
                    <FileText className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Devis</span>
                  </Link>

                  {/* Modifier & Supprimer */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenModal(item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      title="Modifier"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setItemToDelete(item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Supprimer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Affichage des Produits : VUE TABLEAU */}
      {viewMode === "table" && filteredCatalog.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm animate-in fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Bien / Produit</th>
                  <th className="px-4 py-3.5">Type & Catégorie</th>
                  <th className="px-4 py-3.5">Localisation</th>
                  <th className="px-4 py-3.5">Prix / Loyer</th>
                  <th className="px-4 py-3.5">Disponibilité</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredCatalog.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3.5">
                        <div className="relative h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <Package className="h-5 w-5" />
                            </div>
                          )}
                          {item.images && item.images.length > 1 && (
                            <div className="absolute bottom-0 right-0 bg-slate-950/85 text-emerald-400 text-[8px] font-black px-1 py-0.5 rounded-tl backdrop-blur-xs">
                              +{item.images.length - 1}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white truncate">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-slate-400 line-clamp-1 max-w-sm mt-0.5">
                            {item.description || "Aucune description"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 space-y-1">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          item.offer_type === "vente"
                            ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                        }`}
                      >
                        {item.offer_type === "vente" ? "À Vendre" : "À Louer"}
                      </span>
                      <span className="block text-[11px] text-slate-500 font-medium">
                        {item.category || "Catalogue"}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      {item.address ? (
                        <div className="space-y-0.5">
                          <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-emerald-500 shrink-0" />
                            <span className="truncate max-w-[180px]">{item.address}</span>
                          </p>
                          {item.google_maps_url && (
                            <a
                              href={item.google_maps_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5"
                            >
                              <span>Google Maps</span>
                              <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">Non renseignée</span>
                      )}
                    </td>

                    <td className="px-4 py-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {item.price}
                    </td>

                    <td className="px-4 py-4">
                      <button
                        onClick={() => handleToggleAvailability(item)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-colors cursor-pointer ${
                          item.available
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                        }`}
                      >
                        {item.available ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        <span>{item.available ? "Disponible" : "Indisponible"}</span>
                      </button>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleShareOnWhatsApp(item)}
                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer"
                          title="Partager sur WhatsApp"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </button>
                        <Link
                          href={`/app/devis?item=${encodeURIComponent(item.title)}&price=${encodeURIComponent(item.price)}`}
                          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Créer un devis"
                        >
                          <FileText className="h-4 w-4 text-emerald-600" />
                        </Link>
                        <button
                          onClick={() => handleOpenModal(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          title="Modifier"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setItemToDelete(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* État vide si 0 produits */}
      {filteredCatalog.length === 0 && (
        <div className="p-12 rounded-3xl bg-slate-50 dark:bg-slate-900/40 border-2 border-dashed border-slate-200 dark:border-slate-800 text-center space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Package className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {searchQuery ? "Aucune offre ne correspond à votre recherche" : "Votre catalogue est actuellement vide"}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              {searchQuery
                ? "Essayez avec d'autres termes de recherche ou réinitialisez les filtres."
                : "Ajoutez vos premiers biens immobiliers (Location ou Vente) avec photos et localisation pour que l'IA puisse les recommander à vos prospects."}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {searchQuery ? (
              <button
                onClick={() => { setSearchQuery(""); setSelectedCategory("all"); setOfferTypeFilter("all"); setAvailabilityFilter("all"); }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
              >
                Réinitialiser les filtres
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleOpenModal()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/25 transition-all cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>+ Ajouter un premier bien</span>
                </button>
                <Link
                  href="/app/import"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-colors shadow-xs"
                >
                  <UploadCloud className="h-4 w-4 text-emerald-600" />
                  <span>Importer un fichier Excel/CSV</span>
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL : Ajouter / Modifier un Bien ou Produit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div
            className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {editingItem ? "Modifier le Bien / Produit" : "Nouveau Bien / Produit"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ces informations seront transmises à votre assistant IA pour renseigner vos clients
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Formulaire */}
            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
              {formError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 flex items-center gap-2.5 text-xs font-semibold text-rose-700 dark:text-rose-300">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
                  <span>{formError}</span>
                </div>
              )}

              {/* SECTION 1 : À Louer ou À Vendre */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Statut de l'offre : Est-ce un bien à louer ou à vendre ? <strong className="text-rose-500">*</strong></span>
                  <span className="text-[10px] font-semibold text-slate-400">Sélectionnez une option</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setOfferType("location");
                      if (!category || category.includes("Vente")) {
                        setCategory("Location Résidentielle");
                      }
                    }}
                    className={`p-3.5 rounded-2xl border-2 flex items-center gap-3 transition-all cursor-pointer text-left ${
                      offerType === "location"
                        ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 shadow-sm ring-1 ring-emerald-500/20"
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/40"
                    }`}
                  >
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                      offerType === "location"
                        ? "bg-emerald-600 text-white shadow-xs shadow-emerald-600/30"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                    }`}>
                      <Key className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-extrabold uppercase tracking-wide">À Louer</span>
                        {offerType === "location" && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />}
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        Loyer mensuel / séjour
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setOfferType("vente");
                      if (!category || category.includes("Location")) {
                        setCategory("Vente Résidentielle");
                      }
                    }}
                    className={`p-3.5 rounded-2xl border-2 flex items-center gap-3 transition-all cursor-pointer text-left ${
                      offerType === "vente"
                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-200 shadow-sm ring-1 ring-indigo-500/20"
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/40"
                    }`}
                  >
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                      offerType === "vente"
                        ? "bg-indigo-600 text-white shadow-xs shadow-indigo-600/30"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                    }`}>
                      <Home className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-extrabold uppercase tracking-wide">À Vendre</span>
                        {offerType === "vente" && <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />}
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        Prix total d'achat
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Titre */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Nom du bien ou produit <strong className="text-rose-500">*</strong>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    offerType === "location"
                      ? "Ex : Appartement F4 Haut Standing - Almadies"
                      : "Ex : Villa R+2 de Prestige avec Piscine - Ngor"
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Prix & Catégorie */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Prix ou Loyer <strong className="text-rose-500">*</strong></span>
                  </label>
                  <input
                    type="text"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder={offerType === "location" ? "Ex : 850 000 FCFA / mois" : "Ex : 245 000 000 FCFA"}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Catégorie du bien</span>
                  </label>
                  <input
                    type="text"
                    list="category-suggestions"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Choisir ou saisir une catégorie..."
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <datalist id="category-suggestions">
                    {(CATEGORY_SUGGESTIONS[offerType] || []).map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* SECTION 2 : Localisation & Google Maps */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  <span>Adresse & Localisation du bien</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    Adresse ou Quartier où se trouve le bien
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ex : Almadies, Dakar (face à la mer, près de l'ambassade des USA)"
                    className="w-full px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                      <Map className="h-3 w-3 text-blue-500" />
                      <span>Lien Google Maps / Itinéraire</span>
                    </label>
                    {googleMapsUrl && (
                      <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-bold"
                      >
                        Tester le lien <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </div>
                  <input
                    type="url"
                    value={googleMapsUrl}
                    onChange={(e) => setGoogleMapsUrl(e.target.value)}
                    placeholder="Ex : https://maps.app.goo.gl/... ou https://maps.google.com/?q=..."
                    className="w-full px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-400">
                    L'IA Claude enverra ce lien Google Maps à vos prospects WhatsApp pour faciliter leur visite.
                  </p>
                </div>
              </div>

              {/* SECTION 3 : Photos du bien (Importation multiple depuis l'appareil) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Camera className="h-4 w-4 text-emerald-600" />
                    <span>Photos du bien (Importation depuis l'appareil)</span>
                  </label>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {images.length > 0 ? `${images.length} photo${images.length > 1 ? "s" : ""} ajoutée${images.length > 1 ? "s" : ""}` : "Plusieurs photos autorisées"}
                  </span>
                </div>

                {/* Input fichier caché avec sélection MULTIPLE */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageFilesSelect}
                  className="hidden"
                />

                {/* Si aucune image n'est encore sélectionnée : Zone de dépôt principale */}
                {images.length === 0 ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                        const fakeEv = { target: { files: e.dataTransfer.files } } as any;
                        handleImageFilesSelect(fakeEv);
                      }
                    }}
                    className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500/80 rounded-2xl p-7 text-center cursor-pointer transition-all bg-slate-50 dark:bg-slate-800/40 hover:bg-emerald-500/5 flex flex-col items-center justify-center gap-2.5 group"
                  >
                    <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                      {isUploadingImage ? (
                        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                      ) : (
                        <Upload className="h-6 w-6" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-white">
                        {isUploadingImage ? "Optimisation des photos en cours..." : "Importer les photos depuis votre appareil (PC / Téléphone)"}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Glissez-déposez ou cliquez pour sélectionner <strong>une ou plusieurs photos</strong> (PNG, JPG, WEBP)
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={isUploadingImage}
                      className="mt-1 px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 pointer-events-none shadow-xs flex items-center gap-1.5"
                    >
                      <Camera className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Choisir des photos sur mon appareil</span>
                    </button>
                  </div>
                ) : (
                  /* Galerie interactive des photos sélectionnées */
                  <div className="space-y-2.5">
                    {/* Grande vue de l'image sélectionnée */}
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950 h-52 group">
                      <img
                        src={images[activePreviewIdx] || images[0]}
                        alt={`Photo ${activePreviewIdx + 1}`}
                        className="w-full h-full object-contain"
                      />

                      {/* Badge Photo Principale (Couverture) */}
                      <div className="absolute top-2.5 left-2.5">
                        {activePreviewIdx === 0 ? (
                          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white shadow-md flex items-center gap-1">
                            <Star className="h-3 w-3 fill-white" />
                            <span>Photo Principale (Couverture)</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryImage(activePreviewIdx)}
                            className="px-3 py-1 rounded-full text-[10px] font-bold bg-slate-900/85 hover:bg-emerald-600 text-white backdrop-blur-md shadow-md transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Star className="h-3 w-3" />
                            <span>Définir comme principale</span>
                          </button>
                        )}
                      </div>

                      {/* Bouton Supprimer */}
                      <div className="absolute top-2.5 right-2.5">
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(activePreviewIdx)}
                          className="h-7 w-7 rounded-full bg-rose-600/90 hover:bg-rose-600 text-white backdrop-blur-md shadow-md flex items-center justify-center transition-colors cursor-pointer"
                          title="Supprimer cette photo"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Numéro de la photo */}
                      <div className="absolute bottom-2.5 right-2.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-900/80 text-white backdrop-blur-md">
                          {activePreviewIdx + 1} / {images.length}
                        </span>
                      </div>
                    </div>

                    {/* Ligne des miniatures avec bouton d'ajout */}
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {images.map((img, idx) => (
                        <div
                          key={idx}
                          onClick={() => setActivePreviewIdx(idx)}
                          className={`relative h-16 rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                            activePreviewIdx === idx
                              ? "border-emerald-500 scale-95 shadow-md ring-2 ring-emerald-500/20"
                              : "border-slate-200 dark:border-slate-700 opacity-70 hover:opacity-100"
                          }`}
                        >
                          <img src={img} alt={`Miniature ${idx + 1}`} className="w-full h-full object-cover" />
                          {idx === 0 && (
                            <div className="absolute top-1 left-1 h-4 w-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                              <Star className="h-2.5 w-2.5 fill-white" />
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Bouton miniature + Ajouter d'autres photos */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingImage}
                        className="h-16 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 flex flex-col items-center justify-center gap-0.5 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer bg-slate-50 dark:bg-slate-800/50"
                        title="Ajouter d'autres photos depuis l'appareil"
                      >
                        {isUploadingImage ? (
                          <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                        <span className="text-[9px] font-bold">+ Ajouter</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Description détaillée */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Description & Caractéristiques du bien
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex : 4 chambres climatisées avec salle d'eau, salon spacieux avec terrasse vue mer, cuisine équipée, piscine privative, groupe électrogène, gardiennage 24h..."
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none leading-relaxed"
                />
              </div>

              {/* Disponibilité */}
              <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={available}
                  onChange={(e) => setAvailable(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Bien disponible en stock / ouvert aux visites
                </span>
              </label>

              {/* Boutons Footer Modal */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={isUploadingImage}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{editingItem ? "Mettre à jour" : "Ajouter au Catalogue"}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL : Confirmation de Suppression */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div
            className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-12 w-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto border border-rose-500/20">
              <Trash2 className="h-6 w-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Supprimer cet article ?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Êtes-vous sûr de vouloir supprimer <strong>« {itemToDelete.title} »</strong> ? Votre assistant IA ne pourra plus proposer cette offre.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setItemToDelete(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-600/20 transition-colors cursor-pointer"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL : Partager sur WhatsApp avec les Photos */}
      {sharingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in">
          <div
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Partager l'offre sur WhatsApp
                  </h3>
                  <p className="text-xs text-slate-500 truncate max-w-xs">
                    {sharingItem.title} — {sharingItem.price}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSharingItem(null)}
                className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Corps du modal */}
            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              
              {/* Galerie des Photos Prêtes à l'envoi */}
              {(() => {
                const itemImgs = (sharingItem.images && sharingItem.images.length > 0)
                  ? sharingItem.images
                  : (sharingItem.image_url ? [sharingItem.image_url] : []);
                return (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Camera className="h-4 w-4 text-emerald-600" />
                        <span>Photos du bien ({itemImgs.length} photo{itemImgs.length > 1 ? "s" : ""})</span>
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        Prêtes à l'envoi
                      </span>
                    </div>

                    {itemImgs.length > 0 ? (
                      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                        {itemImgs.map((img, idx) => (
                          <div key={idx} className="relative h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 group">
                            <img src={img} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                            {idx === 0 && (
                              <div className="absolute top-1 left-1 px-1 py-0.5 rounded bg-emerald-600 text-[8px] font-black text-white">
                                Couverture
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">Aucune image enregistrée pour ce bien.</p>
                    )}
                  </div>
                );
              })()}

              {/* OPTIONS D'ENVOI DES PHOTOS */}
              <div className="space-y-3">
                <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Comment souhaitez-vous envoyer les photos ?
                </p>

                {/* Option 1 : Partage direct avec photos jointes (Recommandé sur Mobile / App) */}
                <button
                  type="button"
                  onClick={() => handleShareWithNativeFiles(sharingItem)}
                  className="w-full p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-between group cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                      <Share2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-black">
                        1. Envoyer sur WhatsApp avec photos jointes
                      </p>
                      <p className="text-[11px] text-emerald-100 mt-0.5">
                        Attache automatiquement les photos dans votre WhatsApp
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-emerald-200 group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Deux actions complémentaires pour WhatsApp Web sur PC */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  
                  {/* Option 2 : Copier la photo principale pour Ctrl+V */}
                  <button
                    type="button"
                    disabled={isCopyingImage}
                    onClick={() => handleCopyImageToClipboard(sharingItem)}
                    className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-all flex items-center gap-2.5 cursor-pointer text-left shadow-xs"
                    title="Permet de coller immédiatement la photo dans WhatsApp Web avec Ctrl+V"
                  >
                    <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                      {isCopyingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">Copier la photo</p>
                      <p className="text-[10px] text-slate-400">Pour Ctrl+V dans WhatsApp</p>
                    </div>
                  </button>

                  {/* Option 3 : Télécharger les photos */}
                  <button
                    type="button"
                    onClick={() => handleDownloadPhotos(sharingItem)}
                    className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-all flex items-center gap-2.5 cursor-pointer text-left shadow-xs"
                    title="Télécharge les photos pour les glisser-déposer dans WhatsApp Web"
                  >
                    <div className="h-8 w-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                      <Download className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">Télécharger photos</p>
                      <p className="text-[10px] text-slate-400">Pour glisser dans WhatsApp</p>
                    </div>
                  </button>
                </div>

                {/* Option 4 : Ouvrir simplement WhatsApp avec le message textuel et lien photos */}
                <button
                  type="button"
                  onClick={() => handleOpenDirectWhatsApp(sharingItem)}
                  className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageCircle className="h-4 w-4 text-emerald-600" />
                  <span>Ouvrir WhatsApp Web (message avec lien galerie)</span>
                </button>
              </div>

              {/* Aperçu du Texte WhatsApp (Nettoyé à 100%) */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    Aperçu du texte du message :
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(generateWhatsAppMessage(sharingItem));
                      setCopiedMessage(true);
                      setTimeout(() => setCopiedMessage(false), 2000);
                    }}
                    className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {copiedMessage ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedMessage ? "Copié !" : "Copier le texte"}</span>
                  </button>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto select-all">
                  {generateWhatsAppMessage(sharingItem)}
                </div>
              </div>

            </div>

            {/* Footer Modal */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSharingItem(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
