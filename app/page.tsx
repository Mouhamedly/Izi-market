"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Bot,
  Users,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Smartphone,
  Building2,
  ShoppingBag,
  MessageCircle,
  Check,
  X,
  ChevronDown,
  Calendar,
  Clock,
  Send,
  FileText,
  Search,
  Star,
  Phone,
  Mail,
  MapPin,
  Utensils,
  Scissors,
  GraduationCap,
  Briefcase,
  Layers,
  CreditCard,
  XCircle,
  HelpCircle,
  UserCheck
} from "lucide-react";
import { WhatsAppSimulatorModal } from "@/components/simulator/WhatsAppSimulatorModal";
import { AppProvider } from "@/lib/store";

export default function LandingPage() {
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Démo interactive en direct (Section 6)
  const [demoInput, setDemoInput] = useState("");
  const [demoMessages, setDemoMessages] = useState<Array<{ sender: "user" | "ai"; text: string; time: string }>>([
    {
      sender: "user",
      text: "Salam alaykoum ! Avez-vous encore des appartements 3 pièces disponibles aux Almadies ?",
      time: "14:02"
    },
    {
      sender: "ai",
      text: "Wa Alaykoum Salam ! Bienvenue chez Welma Digital 🌿\n\nOui, nous avons actuellement 2 appartements F3 neufs aux Almadies avec vue mer :\n✨ Salon spacieux + 2 chambres autonomes\n🏊 Salle de sport & piscine privative\n💰 850 000 FCFA / mois\n\nSouhaitez-vous planifier une visite sur place cette semaine ?",
      time: "14:02"
    }
  ]);
  const [isDemoTyping, setIsDemoTyping] = useState(false);

  // Onglet actif pour les Exemples par Métier (Section 9)
  const [activeIndustry, setActiveIndustry] = useState<"immo" | "ecommerce" | "agence" | "resto" | "beaute" | "ecole">("immo");

  // Accordéon FAQ (Section 12)
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Simulation d'envoi de message dans la démo interactive (Section 6)
  const handleSendDemoMessage = (textToSend?: string) => {
    const query = (textToSend || demoInput).trim();
    if (!query) return;

    const userMsg = {
      sender: "user" as const,
      text: query,
      time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    };

    setDemoMessages((prev) => [...prev, userMsg]);
    setDemoInput("");
    setIsDemoTyping(true);

    setTimeout(() => {
      let reply = "Merci pour votre message ! Notre assistant IA a bien qualifié votre demande. Quel créneau vous conviendrait le mieux pour un court appel ou une confirmation ?";
      const lower = query.toLowerCase();

      if (lower.includes("prix") || lower.includes("tarif") || lower.includes("combien") || lower.includes("fcfa")) {
        reply = "Nos offres démarrent à partir de 29 000 FCFA / mois tout inclus. Vous bénéficiez en plus de 14 jours d'essai 100% gratuit, sans aucun engagement. Souhaitez-vous qu'on active votre compte ?";
      } else if (lower.includes("visite") || lower.includes("rdv") || lower.includes("rendez-vous")) {
        reply = "C'est noté avec plaisir ! Je peux vous proposer un créneau ce jeudi à 11h00 ou ce vendredi à 15h30. La confirmation sera directement synchronisée sur votre Google Agenda.";
      } else if (lower.includes("wave") || lower.includes("orange") || lower.includes("payer")) {
        reply = "Vous pouvez régler directement en toute simplicité via Wave ou Orange Money en FCFA dès la fin de votre période d'essai de 14 jours.";
      } else if (lower.includes("villa") || lower.includes("appartement") || lower.includes("logement")) {
        reply = "Nous avons plusieurs biens disponibles à Dakar (Mermoz, Almadies, Ngor) de 500 000 à 2 500 000 FCFA. Quel secteur géographique et quel budget mensuel privilégiez-vous ?";
      }

      const aiMsg = {
        sender: "ai" as const,
        text: reply,
        time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
      };
      setDemoMessages((prev) => [...prev, aiMsg]);
      setIsDemoTyping(false);
    }, 900);
  };

  // Données des 6 exemples par métier (Section 9)
  const industryUseCases = {
    immo: {
      title: "Immobilier & Résidences",
      icon: Building2,
      subtitle: "Agences immobilières, courtiers, gestionnaires de meublés",
      clientMessage: "Bonjour, avez-vous une villa F5 avec piscine à louer sur Mermoz ou Ngor pour ma famille ?",
      aiReply: "Wa Alaykoum Salam ! Oui, nous avons une superbe Villa R+1 avec piscine à Mermoz Pyrotechnie (4 chambres autonomes, jardin arboré, 1 500 000 FCFA / mois). Souhaitez-vous planifier une visite ce samedi matin ?",
      result: "Fiche prospect créée avec budget 1,5M FCFA + RDV visite proposé automatiquement."
    },
    ecommerce: {
      title: "Boutique & E-commerce",
      icon: ShoppingBag,
      subtitle: "Prêt-à-porter, cosmétiques, électronique, vendeurs Instagram/TikTok",
      clientMessage: "Bonsoir, est-ce que la robe wax en taille L est toujours dispo ? Vous livrez à Guédiawaye ?",
      aiReply: "Bonsoir ! Oui, la robe wax est disponible en taille L au prix de 22 000 FCFA ✨. Nous livrons partout à Dakar sous 24h (2 000 FCFA pour Guédiawaye). Souhaitez-vous payer à la livraison ou par Wave ?",
      result: "Commande enregistrée sans attendre le lendemain, vente conclue à 23h."
    },
    agence: {
      title: "Agence & Services B2B",
      icon: Briefcase,
      subtitle: "Marketing digital, cabinets comptables, conseil, recrutement",
      clientMessage: "Bonjour, nous cherchons une agence pour gérer nos campagnes Facebook Ads et Google. Quels sont vos tarifs ?",
      aiReply: "Bonjour ! Nous proposons des packs d'accompagnement complets dès 150 000 FCFA / mois selon vos objectifs de croissance. Pour vous proposer une formule sur-mesure, quel créneau vous conviendrait pour un échange de 15 min avec notre directeur conseil ?",
      result: "Lead qualifié dans le pipeline B2B + invitation Google Meet programmée."
    },
    resto: {
      title: "Restaurant & Traiteur",
      icon: Utensils,
      subtitle: "Restaurants, fast-foods, traiteurs événementiels, pâtisseries",
      clientMessage: "Salam, nous aimerions réserver une table pour 6 personnes ce vendredi soir vers 20h30 pour un anniversaire.",
      aiReply: "Salam ! C'est noté avec joie. Nous avons une table idéale en terrasse pour 6 personnes ce vendredi à 20h30. Avez-vous des préférences particulières pour le gâteau d'anniversaire ? À quel nom dois-je valider la réservation ?",
      result: "Table réservée et synchronisée sur l'agenda sans bloquer un serveur au téléphone."
    },
    beaute: {
      title: "Salon de Coiffure & Beauté",
      icon: Scissors,
      subtitle: "Salons de coiffure, spas, ongleries, barbiers",
      clientMessage: "Salut ! C'est possible d'avoir un créneau pour tresses + soins capillaires demain après-midi ?",
      aiReply: "Hello ! Absolument. Notre experte coiffure a des créneaux disponibles demain à 14h30 ou 16h45. Le forfait soin + tresses est à 25 000 FCFA (durée environ 2h30). Quelle heure préférez-vous ?",
      result: "Zéro chevauchement d'horaires et acompte de réservation sécurisé."
    },
    ecole: {
      title: "École & Centre de Formation",
      icon: GraduationCap,
      subtitle: "Établissements scolaires, cours du soir, bootcamps de formation",
      clientMessage: "Bonjour, je souhaite inscrire mon fils en classe de Seconde S pour la rentrée prochaine. Quels sont les frais ?",
      aiReply: "Bonjour M./Mme ! Pour la classe de 2nde S, les frais d'inscription sont de 75 000 FCFA et la scolarité de 45 000 FCFA / mois. Je vous partage immédiatement la brochure complète et le dossier d'admission. Souhaitez-vous visiter le campus ce mercredi ?",
      result: "Brochure PDF transmise en 2 secondes, parent pris en charge instantanément."
    }
  };

  // Liste des questions FAQ / objections (Section 12)
  const faqList = [
    {
      q: "Faut-il obligatoirement WhatsApp Business ?",
      a: "Non, IZI Market fonctionne aussi bien avec un numéro WhatsApp classique qu'avec un compte WhatsApp Business ou l'API officielle Meta Cloud. Vous n'avez pas besoin d'installer de matériel complexe : la connexion se fait simplement en quelques clics."
    },
    {
      q: "L'IA peut-elle se tromper ou inventer des informations ?",
      a: "Non ! Contrairement aux chatbots génériques, l'IA d'IZI Market est strictement bridée à vos documents : votre catalogue de produits, vos prix en FCFA et vos FAQs. Si une information n'est pas dans votre catalogue, l'IA le signale poliment et vous transfère immédiatement la conversation."
    },
    {
      q: "Puis-je reprendre la main sur une conversation ?",
      a: "Oui, à tout instant et en un seul clic ! Depuis votre Inbox IZI Market, vous pouvez désactiver l'IA pour un contact précis et répondre directement en tant qu'humain. L'IA sait également s'effacer automatiquement dès que vous écrivez."
    },
    {
      q: "Mes données et contacts clients sont-ils protégés ?",
      a: "Absolument. Vos données sont hébergées sur une infrastructure sécurisée avec chiffrement de bout en bout et isolation étanche grâce aux règles Row Level Security (RLS). Vos contacts, messages et devis vous appartiennent à 100 % et ne sont jamais partagés."
    },
    {
      q: "Comment puis-je payer mon abonnement ?",
      a: "Nous acceptons les moyens de paiement les plus populaires en Afrique de l'Ouest : Wave, Orange Money, Free Money, virement bancaire et carte bancaire (Visa/Mastercard). Tous nos prix sont clairs et affichés en Francs CFA (XOF)."
    },
    {
      q: "Y a-t-il un engagement de durée ?",
      a: "Aucun engagement ! Vous pouvez démarrer par un essai gratuit de 14 jours sans carte bancaire, puis vous abonner au mois le mois. Vous pouvez arrêter ou suspendre votre compte à tout moment d'un simple clic depuis vos paramètres."
    }
  ];

  return (
    <AppProvider>
      <div className="min-h-screen bg-[#070c14] text-slate-100 selection:bg-emerald-500 selection:text-white font-sans overflow-x-hidden relative">
        
        {/* ========================================================
            SECTION 1 : BARRE DU HAUT (NAVIGATION)
            Logo, liens Fonctionnalités / Tarifs / FAQ, bouton « Essai gratuit »
            ======================================================== */}
        <header className="sticky top-0 z-40 bg-[#070c14]/85 backdrop-blur-xl border-b border-slate-800/80 transition-all">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 group-hover:scale-105 transition-transform">
                <Sparkles className="h-5 w-5" />
              </div>
              <span className="font-extrabold text-2xl tracking-tight text-white flex items-center gap-2">
                IZI Market
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  WA AI
                </span>
              </span>
            </Link>

            {/* Navigation Desktop */}
            <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
              <a href="#features" className="hover:text-emerald-400 transition-colors">
                Fonctionnalités
              </a>
              <a href="#demo" className="hover:text-emerald-400 transition-colors">
                Démo en direct
              </a>
              <a href="#avant-apres" className="hover:text-emerald-400 transition-colors">
                Avant / Après
              </a>
              <a href="#metiers" className="hover:text-emerald-400 transition-colors">
                Exemples par métier
              </a>
              <a href="#tarifs" className="hover:text-emerald-400 transition-colors">
                Tarifs
              </a>
              <a href="#faq" className="hover:text-emerald-400 transition-colors">
                FAQ
              </a>
            </nav>

            {/* Boutons Desktop */}
            <div className="hidden sm:flex items-center gap-3">
              <Link
                href="/connexion"
                className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white transition-colors"
              >
                Connexion
              </Link>

              <Link
                href="/inscription"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <span>Essai gratuit</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Bouton Menu Mobile */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white bg-slate-900 border border-slate-800"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <div className="space-y-1.5"><span className="block w-5 h-0.5 bg-white"></span><span className="block w-5 h-0.5 bg-white"></span><span className="block w-4 h-0.5 bg-white"></span></div>}
            </button>
          </div>

          {/* Menu Déroulant Mobile */}
          {mobileMenuOpen && (
            <div className="md:hidden px-6 py-6 bg-slate-950 border-b border-slate-800 space-y-4 animate-in slide-in-from-top-4 duration-200">
              <nav className="flex flex-col space-y-3 text-sm font-semibold text-slate-300">
                <a onClick={() => setMobileMenuOpen(false)} href="#features" className="hover:text-emerald-400">Fonctionnalités</a>
                <a onClick={() => setMobileMenuOpen(false)} href="#demo" className="hover:text-emerald-400">Démo en direct</a>
                <a onClick={() => setMobileMenuOpen(false)} href="#avant-apres" className="hover:text-emerald-400">Avant / Après</a>
                <a onClick={() => setMobileMenuOpen(false)} href="#metiers" className="hover:text-emerald-400">Exemples par métier</a>
                <a onClick={() => setMobileMenuOpen(false)} href="#tarifs" className="hover:text-emerald-400">Tarifs</a>
                <a onClick={() => setMobileMenuOpen(false)} href="#faq" className="hover:text-emerald-400">FAQ</a>
              </nav>
              <div className="pt-4 border-t border-slate-800 flex flex-col gap-2">
                <Link
                  href="/inscription"
                  className="w-full text-center py-3 rounded-xl font-bold text-xs bg-emerald-500 text-slate-950"
                >
                  Démarrer l'essai gratuit
                </Link>
                <Link
                  href="/connexion"
                  className="w-full text-center py-2.5 rounded-xl font-bold text-xs text-slate-400 hover:text-white"
                >
                  Se connecter
                </Link>
              </div>
            </div>
          )}
        </header>

        {/* ========================================================
            SECTION 2 : ACCROCHE PRINCIPALE (HERO)
            Titre résultat : « Ne perdez plus aucun client sur WhatsApp »
            Sous-titre : « Votre assistant IA répond 24h/24, qualifie vos prospects... »
            Bouton principal + secondaire. Visuel : conversation WhatsApp animée.
            ======================================================== */}
        <section className="relative pt-16 sm:pt-24 pb-20 px-4 sm:px-6 overflow-hidden">
          {/* Halos lumineux d'ambiance */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[450px] bg-gradient-to-tr from-emerald-500/20 via-teal-500/10 to-transparent blur-[130px] rounded-full pointer-events-none"></div>

          <div className="max-w-5xl mx-auto text-center space-y-7 relative z-10">
            {/* Badge Local */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 shadow-xs animate-pulse">
              <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
              <span>🇸🇳 Conçu pour les entreprises au Sénégal et en Afrique</span>
            </div>

            {/* Titre Principal */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.12] max-w-4xl mx-auto">
              Ne perdez plus aucun client sur{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500">
                WhatsApp
              </span>
              .
            </h1>

            {/* Sous-titre exact demandé */}
            <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
              Votre assistant IA répond 24h/24, qualifie vos prospects et prend vos rendez-vous, en FCFA et dans le ton de chez nous.
            </p>

            {/* Boutons d'Action */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
              <Link
                href="/inscription"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl text-sm font-bold bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 text-slate-950 shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <span>Essai gratuit 14 jours</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <button
                type="button"
                onClick={() => setIsSimulatorOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-2xl text-sm font-bold bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700/80 hover:border-emerald-500/40 shadow-md transition-all cursor-pointer"
              >
                <Smartphone className="h-4 w-4 text-emerald-400" />
                <span>Tester le simulateur en direct</span>
              </button>
            </div>

            {/* Micro-preuves de réassurance */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-5 sm:gap-8 text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <Check className="h-4 w-4 text-emerald-400" />
                Sans carte bancaire
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <Check className="h-4 w-4 text-emerald-400" />
                Réponse en 2 secondes
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <Check className="h-4 w-4 text-emerald-400" />
                Installation en 3 minutes
              </span>
            </div>
          </div>

          {/* Visuel : Conversation WhatsApp animée avec fiche prospect live */}
          <div className="max-w-4xl mx-auto mt-14 relative">
            <div className="relative rounded-3xl p-2 sm:p-3 bg-gradient-to-b from-slate-800/90 to-slate-900/90 border border-slate-700/80 shadow-2xl overflow-hidden">
              <div className="bg-[#0b141a] rounded-2xl p-4 sm:p-6 space-y-4">
                
                {/* En-tête WhatsApp simulé */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/90 text-white">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white shadow-sm">
                      IZI
                    </div>
                    <div>
                      <div className="font-bold text-sm flex items-center gap-2">
                        <span>Welma Digital (Dakar)</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold">
                          Assistant IA Actif
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-400">En ligne 24h/24 • Réponse instantanée</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                    <Clock className="h-3.5 w-3.5 text-emerald-400" />
                    <span>23h42 (Pleine nuit)</span>
                  </div>
                </div>

                {/* Fil de discussion */}
                <div className="space-y-3 py-2">
                  {/* Message Prospect */}
                  <div className="flex justify-start">
                    <div className="max-w-[85%] sm:max-w-[70%] rounded-2xl rounded-tl-xs px-4 py-3 bg-[#202c33] text-xs text-[#e9edef] leading-relaxed shadow-sm">
                      <p className="font-semibold text-emerald-400 text-[10px] mb-1">Moussa Diop (+221 77 456 78 90)</p>
                      Bonsoir ! Je cherche en urgence une villa avec piscine à louer à Mermoz pour ma famille. Est-ce que vous avez du disponible ?
                      <span className="text-[9px] text-[#8696a0] block text-right mt-1 font-mono">23:42</span>
                    </div>
                  </div>

                  {/* Réponse IA Instantanée */}
                  <div className="flex justify-end">
                    <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-tr-xs px-4 py-3 bg-[#005c4b] text-xs text-white leading-relaxed shadow-md">
                      <span className="text-[10px] text-emerald-200 font-bold flex items-center gap-1 mb-1">
                        <Sparkles className="h-3 w-3" />
                        Réponse IA en 2 secondes
                      </span>
                      Wa Alaykoum Salam M. Diop ! Bienvenue chez Welma Digital 🌿<br/><br/>
                      Oui, nous avons une splendide <b>Villa R+1 avec Piscine à Mermoz Pyrotechnie</b> disponible immédiatement :<br/>
                      ✨ 4 chambres autonomes avec salles de bain<br/>
                      🏊 Piscine privée et jardin arboré<br/>
                      💰 <b>1 500 000 FCFA / mois</b><br/><br/>
                      Souhaitez-vous planifier une visite sur place ce samedi à 11h ?
                      <span className="text-[9px] text-emerald-200 block text-right mt-1 font-mono">23:42 • Reçu ✓✓</span>
                    </div>
                  </div>

                  {/* Notification CRM Flottante */}
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span className="text-slate-300">
                        Prospect qualifié : <b className="text-white">Moussa Diop</b> • Budget : <b className="text-emerald-400">1 500 000 FCFA</b>
                      </span>
                    </div>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                      Fiche CRM & Pipeline synchronisés ✅
                    </span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* ========================================================
            SECTION 3 : BANDE DE CONFIANCE
            « Déjà utilisé par X entreprises à Dakar », logos de clients,
            « Données sécurisées » et « Sans engagement »
            ======================================================== */}
        <section className="py-10 border-y border-slate-800/80 bg-slate-950/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
            <p className="text-center text-xs font-bold uppercase tracking-wider text-slate-400">
              Déjà utilisé par plus de <span className="text-emerald-400 font-extrabold">120 entreprises</span> et agences à Dakar et en Afrique de l'Ouest
            </p>

            {/* Badges / Logos de clients & entreprises */}
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12 opacity-80 text-sm font-bold text-slate-300">
              <span className="flex items-center gap-2"><Building2 className="h-4 w-4 text-emerald-400" /> Welma Digital</span>
              <span className="flex items-center gap-2"><Building2 className="h-4 w-4 text-teal-400" /> Keur Immo Dakar</span>
              <span className="flex items-center gap-2"><ShoppingBag className="h-4 w-4 text-amber-400" /> Téranga Mode</span>
              <span className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-sky-400" /> Sunu Cabinet B2B</span>
              <span className="flex items-center gap-2"><Utensils className="h-4 w-4 text-rose-400" /> Le Jardin Dakar</span>
              <span className="flex items-center gap-2"><GraduationCap className="h-4 w-4 text-indigo-400" /> Dakar Académie</span>
            </div>

            {/* Badges de Réassurance */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs text-slate-400">
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span className="font-semibold text-slate-300">Données 100% sécurisées (RLS & Chiffrement)</span>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span className="font-semibold text-slate-300">Sans engagement • Annulable en 1 clic</span>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
                <CreditCard className="h-4 w-4 text-emerald-400" />
                <span className="font-semibold text-slate-300">Paiement Wave & Orange Money</span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================
            SECTION 4 : LE PROBLÈME (3 SITUATIONS VÉCUES)
            1. Messages vus trop tard la nuit
            2. Clients qu'on oublie de relancer
            3. Devis envoyés à la main
            ======================================================== */}
        <section className="py-20 px-4 sm:px-6 bg-[#090f19]">
          <div className="max-w-6xl mx-auto space-y-12">
            
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <h2 className="text-xs font-bold uppercase tracking-wider text-rose-400">
                Le constat quotidien
              </h2>
              <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Combien de ventes perdez-vous chaque semaine sur WhatsApp ?
              </p>
              <p className="text-sm text-slate-400">
                Vos clients sont sur WhatsApp à toute heure. Mais votre équipe ne peut pas être éveillée 24h/24.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Situation 1 */}
              <div className="p-7 rounded-3xl bg-slate-900/70 border border-rose-900/30 hover:border-rose-500/40 transition-all space-y-4 relative overflow-hidden">
                <div className="h-12 w-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold">
                  <Clock className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-white">
                    1. Messages vus trop tard la nuit
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Un client écrit à 22h30 pour réserver ou acheter. Vous découvrez son message le lendemain matin à 8h : il a déjà contacté un concurrent qui a répondu plus vite.
                  </p>
                </div>
                <div className="pt-2 text-[11px] font-semibold text-rose-400/90 border-t border-slate-800">
                  ❌ Conséquence : 40% des prospects nocturnes perdus.
                </div>
              </div>

              {/* Situation 2 */}
              <div className="p-7 rounded-3xl bg-slate-900/70 border border-amber-900/30 hover:border-amber-500/40 transition-all space-y-4 relative overflow-hidden">
                <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                  <XCircle className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-white">
                    2. Des prospects qu'on oublie de relancer
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Le client a demandé des informations, puis le silence radio. Noyée sous 50 discussions non lues, votre équipe oublie de le relancer à J+3. La vente tombe aux oubliettes.
                  </p>
                </div>
                <div className="pt-2 text-[11px] font-semibold text-amber-400/90 border-t border-slate-800">
                  ❌ Conséquence : Des millions de FCFA de chiffre d'affaires envolés.
                </div>
              </div>

              {/* Situation 3 */}
              <div className="p-7 rounded-3xl bg-slate-900/70 border border-blue-900/30 hover:border-blue-500/40 transition-all space-y-4 relative overflow-hidden">
                <div className="h-12 w-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
                  <FileText className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-white">
                    3. Devis et tarifs envoyés à la main
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Répéter 60 fois par jour les mêmes prix, retaper manuellement les devis Word ou Excel, chercher les photos dans la galerie : un temps fou gaspillé au lieu de closer.
                  </p>
                </div>
                <div className="pt-2 text-[11px] font-semibold text-blue-400/90 border-t border-slate-800">
                  ❌ Conséquence : Plus de 3 heures perdues chaque jour par vos commerciaux.
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* ========================================================
            SECTION 5 : LA SOLUTION EN 3 ÉTAPES
            1. Connectez votre WhatsApp
            2. Ajoutez vos produits et FAQ
            3. L'IA répond et vous alerte
            ======================================================== */}
        <section className="py-20 px-4 sm:px-6 bg-[#070c14]">
          <div className="max-w-6xl mx-auto space-y-14">
            
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                La solution IZI Market
              </h2>
              <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Prêt à l'emploi en 3 étapes simples
              </p>
              <p className="text-sm text-slate-400">
                Aucune compétence technique requise. Votre assistant est opérationnel en quelques minutes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              
              {/* Étape 1 */}
              <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4 relative hover:border-emerald-500/40 transition-all">
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                    <Smartphone className="h-6 w-6" />
                  </div>
                  <span className="text-3xl font-black text-slate-800">01</span>
                </div>
                <h3 className="text-lg font-bold text-white">
                  1. Connectez votre WhatsApp
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Liez votre numéro professionnel en scannant simplement un QR code ou via l'API officielle Meta. Vos clients continuent de vous écrire normalement.
                </p>
              </div>

              {/* Étape 2 */}
              <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4 relative hover:border-emerald-500/40 transition-all">
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold">
                    <Layers className="h-6 w-6" />
                  </div>
                  <span className="text-3xl font-black text-slate-800">02</span>
                </div>
                <h3 className="text-lg font-bold text-white">
                  2. Ajoutez vos produits et FAQ
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Renseignez vos offres, vos prix en FCFA, vos horaires et vos réponses aux questions récurrentes. L'IA apprend vos règles en quelques secondes.
                </p>
              </div>

              {/* Étape 3 */}
              <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4 relative hover:border-emerald-500/40 transition-all">
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                    <Bot className="h-6 w-6" />
                  </div>
                  <span className="text-3xl font-black text-slate-800">03</span>
                </div>
                <h3 className="text-lg font-bold text-white">
                  3. L'IA répond et vous alerte
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  L'assistant répond instantanément jour et nuit, qualifie le besoin, prend le rendez-vous sur Google Agenda et vous notifie pour conclure.
                </p>
              </div>

            </div>

          </div>
        </section>

        {/* ========================================================
            SECTION 6 : DÉMO EN DIRECT (SIMULATEUR INTERACTIF)
            « Écrivez comme un client, regardez l'IA répondre »
            ======================================================== */}
        <section id="demo" className="py-20 px-4 sm:px-6 bg-[#0a121d] border-y border-slate-800/80">
          <div className="max-w-4xl mx-auto space-y-8">
            
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                <Sparkles className="h-3.5 w-3.5" />
                Testez en direct sans inscription
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Écrivez comme un client, regardez l'IA répondre
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
                Tapez votre question ou cliquez sur une suggestion ci-dessous pour voir la réactivité de l'IA.
              </p>
            </div>

            {/* Suggestions rapides en pilules */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleSendDemoMessage("Combien coûte l'appartement à Mermoz ?")}
                className="px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 hover:border-emerald-500 transition-all cursor-pointer"
              >
                💬 « Combien coûte l'appartement à Mermoz ? »
              </button>
              <button
                type="button"
                onClick={() => handleSendDemoMessage("Peut-on payer par Wave ou Orange Money ?")}
                className="px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 hover:border-emerald-500 transition-all cursor-pointer"
              >
                💸 « Peut-on payer par Wave ? »
              </button>
              <button
                type="button"
                onClick={() => handleSendDemoMessage("Je souhaite planifier une visite sur place ce vendredi.")}
                className="px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 hover:border-emerald-500 transition-all cursor-pointer"
              >
                📅 « Planifier une visite ce vendredi »
              </button>
            </div>

            {/* Interface Chat Interactive */}
            <div className="rounded-3xl border border-slate-800 bg-[#0b141a] overflow-hidden shadow-2xl flex flex-col h-[460px]">
              
              {/* Header du Chat */}
              <div className="px-5 py-3.5 bg-[#202c33] text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-xs">
                    IZI
                  </div>
                  <div>
                    <h4 className="font-bold text-xs">Assistant Démo IZI Market</h4>
                    <p className="text-[10px] text-emerald-400">Répond en temps réel • Claude 3.5 Sonnet</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSimulatorOpen(true)}
                  className="text-xs text-emerald-400 hover:underline font-semibold cursor-pointer"
                >
                  Ouvrir plein écran ↗
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
                {demoMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} animate-in fade-in duration-150`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 leading-relaxed whitespace-pre-wrap ${
                        msg.sender === "user"
                          ? "bg-[#005c4b] text-white rounded-tr-xs"
                          : "bg-[#202c33] text-[#e9edef] rounded-tl-xs"
                      }`}
                    >
                      {msg.text}
                      <span className="text-[9px] text-white/50 block text-right mt-1 font-mono">
                        {msg.time}
                      </span>
                    </div>
                  </div>
                ))}

                {isDemoTyping && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl rounded-tl-xs px-4 py-2.5 bg-[#202c33] text-emerald-400 flex items-center gap-1.5 text-xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce"></span>
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.2s]"></span>
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]"></span>
                      <span className="text-[11px] text-slate-400 ml-1">L'IA rédige...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Champ d'envoi */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendDemoMessage();
                }}
                className="p-3 bg-[#202c33] border-t border-slate-800 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={demoInput}
                  onChange={(e) => setDemoInput(e.target.value)}
                  placeholder="Écrivez un message comme un client potentiel..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#2a3942] text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans"
                />
                <button
                  type="submit"
                  disabled={!demoInput.trim() || isDemoTyping}
                  className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold disabled:opacity-50 cursor-pointer transition-colors"
                  title="Envoyer"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>

          </div>
        </section>

        {/* ========================================================
            SECTION 7 : FONCTIONNALITÉS (ORIENTÉES BÉNÉFICES)
            1. Réponse IA 24h/24
            2. Fiche client remplie automatiquement
            3. Suivi des prospects (pipeline CRM)
            4. Devis en FCFA envoyés sur WhatsApp
            5. Rendez-vous Google Agenda
            6. Relances automatiques
            7. Trouver des prospects sur Google Maps
            8. Reprise en main humaine en 1 clic
            ======================================================== */}
        <section id="features" className="py-24 px-4 sm:px-6 bg-[#070c14]">
          <div className="max-w-7xl mx-auto space-y-16">
            
            <div className="text-center space-y-3 max-w-3xl mx-auto">
              <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                L'étendue de l'outil
              </h2>
              <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Chaque fonctionnalité est conçue pour rapporter du chiffre d'affaires
              </p>
              <p className="text-sm text-slate-400">
                Plus qu'un simple répondeur, c'est votre équipe commerciale complète automatisée sur WhatsApp.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* 1. Réponse IA 24h/24 */}
              <div className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-emerald-500/40 transition-all space-y-3 group">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Bot className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white">
                  Réponse IA 24h/24
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Répondez en moins de 3 secondes, même à 2h du matin ou le dimanche, sans laisser refroidir un prospect chaud.
                </p>
              </div>

              {/* 2. Fiche client remplie automatiquement */}
              <div className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-emerald-500/40 transition-all space-y-3 group">
                <div className="h-10 w-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UserCheck className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white">
                  Fiche client automatique
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  L'IA extrait le nom, le budget détecté, le besoin et les préférences dans une fiche CRM sans saisie manuelle.
                </p>
              </div>

              {/* 3. Suivi des prospects (Pipeline CRM) */}
              <div className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-emerald-500/40 transition-all space-y-3 group">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white">
                  Suivi des prospects (Pipeline)
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Visualisez toutes vos opportunités en colonnes Kanban claires : Nouveau, Qualifié, RDV pris, Négociation, Gagné.
                </p>
              </div>

              {/* 4. Devis en FCFA envoyés sur WhatsApp */}
              <div className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-emerald-500/40 transition-all space-y-3 group">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white">
                  Devis en FCFA sur WhatsApp
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Générez et expédiez des devis officiels aux normes sénégalaises avec montants en FCFA directement dans le chat.
                </p>
              </div>

              {/* 5. Rendez-vous Google Agenda */}
              <div className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-emerald-500/40 transition-all space-y-3 group">
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Calendar className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white">
                  Rendez-vous Google Agenda
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  L'IA consulte vos disponibilités réelles, bloque le créneau et crée le lien Google Meet automatiquement.
                </p>
              </div>

              {/* 6. Relances automatiques */}
              <div className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-emerald-500/40 transition-all space-y-3 group">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Clock className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white">
                  Relances automatiques (J+3)
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Réactivez intelligemment les prospects silencieux avec un message courtois et personnalisé pour réveiller la vente.
                </p>
              </div>

              {/* 7. Trouver des prospects sur Google Maps */}
              <div className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-emerald-500/40 transition-all space-y-3 group">
                <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Search className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white">
                  Scraper B2B Google Maps
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Extrayez des centaines de numéros et emails d'entreprises locales par ville et secteur pour prospecter en 1 clic.
                </p>
              </div>

              {/* 8. Reprise en main humaine en 1 clic */}
              <div className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-emerald-500/40 transition-all space-y-3 group">
                <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Zap className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white">
                  Reprise en main humaine
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Gardez le contrôle total : vous ou vos agents pouvez couper l'IA et intervenir directement sur n'importe quel échange.
                </p>
              </div>

            </div>

          </div>
        </section>

        {/* ========================================================
            SECTION 8 : AVANT / APRÈS (TABLEAU COMPARATIF CONCRET)
            Sans IZI Market vs Avec IZI Market
            ======================================================== */}
        <section id="avant-apres" className="py-20 px-4 sm:px-6 bg-[#0a111c] border-y border-slate-800/80">
          <div className="max-w-5xl mx-auto space-y-12">
            
            <div className="text-center space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Gain concret & mesurable
              </h2>
              <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Votre entreprise : Sans IZI Market vs Avec IZI Market
              </p>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 overflow-hidden shadow-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-slate-800 text-xs font-bold uppercase tracking-wider">
                <div className="p-4 bg-slate-900/90 text-slate-400">Critère</div>
                <div className="p-4 bg-rose-950/20 text-rose-400 border-t sm:border-t-0 sm:border-l border-slate-800">
                  ❌ Sans IZI Market
                </div>
                <div className="p-4 bg-emerald-950/30 text-emerald-400 border-t sm:border-t-0 sm:border-l border-slate-800">
                  ✨ Avec IZI Market
                </div>
              </div>

              {/* Ligne 1 : Temps de réponse */}
              <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-slate-800/60 text-xs divide-y sm:divide-y-0 sm:divide-x divide-slate-800/60">
                <div className="p-4 font-bold text-white bg-slate-900/30">Temps de réponse</div>
                <div className="p-4 text-slate-400 bg-rose-950/5">Entre 1h et 8h (prospect refroidi ou déjà parti chez le concurrent)</div>
                <div className="p-4 font-semibold text-emerald-300 bg-emerald-950/10">⚡ 2 à 3 secondes, 24h/24 et 7j/7 sans interruption</div>
              </div>

              {/* Ligne 2 : Disponibilité la nuit et week-end */}
              <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-slate-800/60 text-xs divide-y sm:divide-y-0 sm:divide-x divide-slate-800/60">
                <div className="p-4 font-bold text-white bg-slate-900/30">Nuit & Week-ends</div>
                <div className="p-4 text-slate-400 bg-rose-950/5">Fermé. Aucune réponse avant le lundi matin</div>
                <div className="p-4 font-semibold text-emerald-300 bg-emerald-950/10">🟢 100% actif, enregistre les besoins et booke les visites</div>
              </div>

              {/* Ligne 3 : Prospects perdus */}
              <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-slate-800/60 text-xs divide-y sm:divide-y-0 sm:divide-x divide-slate-800/60">
                <div className="p-4 font-bold text-white bg-slate-900/30">Pertes de prospects</div>
                <div className="p-4 text-rose-400/90 font-medium bg-rose-950/5">Jusqu'à 45% des demandes jamais converties</div>
                <div className="p-4 font-semibold text-emerald-300 bg-emerald-950/10">📈 Chaque contact est qualifié et archivé dans le CRM</div>
              </div>

              {/* Ligne 4 : Suivi et relances */}
              <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-slate-800/60 text-xs divide-y sm:divide-y-0 sm:divide-x divide-slate-800/60">
                <div className="p-4 font-bold text-white bg-slate-900/30">Relance des clients</div>
                <div className="p-4 text-slate-400 bg-rose-950/5">Manuelle, aléatoire, souvent oubliée par manque de temps</div>
                <div className="p-4 font-semibold text-emerald-300 bg-emerald-950/10">🔁 Relances automatiques personnalisées à J+3</div>
              </div>

              {/* Ligne 5 : Temps commercial gagné */}
              <div className="grid grid-cols-1 sm:grid-cols-3 text-xs divide-y sm:divide-y-0 sm:divide-x divide-slate-800/60">
                <div className="p-4 font-bold text-white bg-slate-900/30">Temps passé sur WhatsApp</div>
                <div className="p-4 text-slate-400 bg-rose-950/5">3 à 4 heures par jour à taper les mêmes réponses</div>
                <div className="p-4 font-semibold text-emerald-300 bg-emerald-950/10">⏱️ +15 heures gagnées par semaine pour vous concentrer sur la vente</div>
              </div>
            </div>

          </div>
        </section>

        {/* ========================================================
            SECTION 9 : EXEMPLES PAR MÉTIER
            Immobilier, Boutique, Agence, Restaurant, Salon, École
            ======================================================== */}
        <section id="metiers" className="py-24 px-4 sm:px-6 bg-[#070c14]">
          <div className="max-w-6xl mx-auto space-y-12">
            
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Chaque visiteur se projette
              </h2>
              <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Adapté exactement à votre secteur d'activité
              </p>
              <p className="text-sm text-slate-400">
                Sélectionnez votre métier pour voir comment l'assistant échange avec vos clients.
              </p>
            </div>

            {/* Onglets des Métiers */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {(
                [
                  { id: "immo", label: "🏡 Immobilier" },
                  { id: "ecommerce", label: "🛍️ Boutique & Mode" },
                  { id: "agence", label: "💼 Agence & B2B" },
                  { id: "resto", label: "🍽️ Restaurant" },
                  { id: "beaute", label: "💇 Salon & Beauté" },
                  { id: "ecole", label: "🎓 École & Formation" }
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveIndustry(tab.id)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                    activeIndustry === tab.id
                      ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 scale-105"
                      : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Carte Détaillée du Métier Actif */}
            {(() => {
              const current = industryUseCases[activeIndustry];
              const IconComp = current.icon;
              return (
                <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-10 shadow-2xl space-y-8 animate-in fade-in duration-200">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
                    <div className="flex items-center gap-3.5">
                      <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                        <IconComp className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">{current.title}</h3>
                        <p className="text-xs text-slate-400">{current.subtitle}</p>
                      </div>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                      Ton personnalisé aux codes sénégalais
                    </div>
                  </div>

                  {/* Simulation d'échange */}
                  <div className="bg-[#0b141a] rounded-2xl p-5 sm:p-6 space-y-4 border border-slate-800">
                    {/* Message Client */}
                    <div className="flex justify-start">
                      <div className="max-w-[90%] sm:max-w-[70%] rounded-2xl rounded-tl-xs px-4 py-3 bg-[#202c33] text-xs text-[#e9edef] leading-relaxed">
                        <p className="text-[10px] text-emerald-400 font-bold mb-1">Client WhatsApp</p>
                        {current.clientMessage}
                      </div>
                    </div>

                    {/* Réponse IA */}
                    <div className="flex justify-end">
                      <div className="max-w-[90%] sm:max-w-[75%] rounded-2xl rounded-tr-xs px-4 py-3 bg-[#005c4b] text-xs text-white leading-relaxed">
                        <p className="text-[10px] text-emerald-200 font-bold mb-1">✨ Répondu par l'IA IZI Market (Immédiat)</p>
                        {current.aiReply}
                      </div>
                    </div>
                  </div>

                  {/* Résultat opérationnel */}
                  <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 flex items-center gap-3 text-xs text-emerald-200">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                    <span><b>Résultat pour votre entreprise :</b> {current.result}</span>
                  </div>
                </div>
              );
            })()}

          </div>
        </section>

        {/* ========================================================
            SECTION 10 : TÉMOIGNAGES (PREUVE SOCIALE AVEC CHIFFRES)
            3 avis avec photo, nom, entreprise et un chiffre (« +40 % de rendez-vous »)
            ======================================================== */}
        <section className="py-24 px-4 sm:px-6 bg-[#0a121d] border-t border-slate-800/80">
          <div className="max-w-7xl mx-auto space-y-16">
            
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Preuve sociale
              </h2>
              <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Ils développent leur entreprise avec IZI Market
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Témoignage 1 */}
              <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-6 hover:border-emerald-500/40 transition-all">
                <div className="space-y-4">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400" />
                    ))}
                  </div>
                  <div className="text-2xl font-black text-emerald-400">
                    +40% de rendez-vous
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed italic">
                    « Beaucoup de clients de la diaspora nous écrivent la nuit depuis l'Europe ou les USA avec 4h de décalage. L'IA présente nos villas à Mermoz et Almadies et booke les visites automatiquement. C'est magique. »
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
                  <div className="h-10 w-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center font-bold text-xs">
                    AN
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-white">Awa Ndiaye</h4>
                    <p className="text-[11px] text-slate-400">Directrice, Sunu Immo Dakar</p>
                  </div>
                </div>
              </div>

              {/* Témoignage 2 */}
              <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-6 hover:border-emerald-500/40 transition-all">
                <div className="space-y-4">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400" />
                    ))}
                  </div>
                  <div className="text-2xl font-black text-emerald-400">
                    3 heures gagnées / jour
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed italic">
                    « Avant, nos commerciaux passaient leurs journées à rédiger des devis et copier-coller des prix. Maintenant, l'IA envoie les fiches, qualifie le besoin et nous les retrouvons classés dans le pipeline CRM. »
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
                  <div className="h-10 w-10 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-300 flex items-center justify-center font-bold text-xs">
                    CT
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-white">Cheikh Tidiane Sow</h4>
                    <p className="text-[11px] text-slate-400">Fondateur, Dakar Tech Services</p>
                  </div>
                </div>
              </div>

              {/* Témoignage 3 */}
              <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-6 hover:border-emerald-500/40 transition-all">
                <div className="space-y-4">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400" />
                    ))}
                  </div>
                  <div className="text-2xl font-black text-emerald-400">
                    0 commande perdue le soir
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed italic">
                    « Les clientes sur TikTok et Instagram nous écrivent tard le soir. IZI Market leur donne immédiatement les tailles disponibles, les tarifs en FCFA et les options de paiement Wave. Nos ventes ont explosé. »
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
                  <div className="h-10 w-10 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center font-bold text-xs">
                    MB
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-white">Mariama Ba</h4>
                    <p className="text-[11px] text-slate-400">Gérante, Boutique Téranga Chic</p>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* ========================================================
            SECTION 11 : TARIFS (LEVER LE FREIN DU PRIX)
            3 offres (Starter / Pro / Agence), prix en FCFA par mois,
            paiement Wave ou Orange Money, offre du milieu mise en avant,
            essai gratuit de 14 jours sans carte bancaire.
            ======================================================== */}
        <section id="tarifs" className="py-24 px-4 sm:px-6 bg-[#070c14] border-t border-slate-800/80">
          <div className="max-w-6xl mx-auto space-y-14">
            
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                Paiement local en FCFA • Sans carte bancaire
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Des tarifs simples, transparents et rentables dès le premier jour
              </h2>
              <p className="text-sm text-slate-400">
                Commencez par 14 jours d'essai gratuit. Payez ensuite facilement par Wave ou Orange Money.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
              
              {/* Offre 1 : Starter */}
              <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">Starter</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Idéal pour les indépendants et petites boutiques</p>
                  </div>

                  <div className="pt-2">
                    <span className="text-3xl sm:text-4xl font-black text-white">29 000</span>
                    <span className="text-xs text-slate-400 font-semibold"> FCFA / mois</span>
                  </div>

                  <ul className="space-y-2.5 text-xs text-slate-300 pt-4 border-t border-slate-800">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                      1 numéro WhatsApp connecté
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                      Jusqu'à 500 conversations IA / mois
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                      Catalogue jusqu'à 20 produits / biens
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                      Inbox centralisée & reprise en main
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                      Paiement Wave & Orange Money
                    </li>
                  </ul>
                </div>

                <Link
                  href="/inscription"
                  className="w-full py-3.5 rounded-xl text-center text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition-all cursor-pointer block"
                >
                  Démarrer l'essai gratuit
                </Link>
              </div>

              {/* Offre 2 : Pro (MISE EN AVANT) */}
              <div className="p-8 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-emerald-500 flex flex-col justify-between space-y-6 relative shadow-2xl shadow-emerald-500/10 scale-100 md:scale-105 z-10">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-[11px] font-extrabold uppercase tracking-wider shadow-md">
                  ⭐ Le Plus Populaire
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">Pro</h3>
                    <p className="text-xs text-emerald-400 font-medium mt-0.5">Pour les entreprises qui veulent accélérer leurs ventes</p>
                  </div>

                  <div className="pt-2">
                    <span className="text-4xl sm:text-5xl font-black text-white">49 000</span>
                    <span className="text-xs text-slate-400 font-semibold"> FCFA / mois</span>
                  </div>

                  <ul className="space-y-2.5 text-xs text-slate-200 pt-4 border-t border-slate-800 font-medium">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                      Conversations IA illimitées
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                      Pipeline CRM complet & Kanban visuel
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                      Devis en FCFA expédiés sur WhatsApp
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                      Synchronisation Google Agenda & Meet
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                      Relances automatiques à J+3
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                      Scraper B2B Google Maps inclus
                    </li>
                  </ul>
                </div>

                <Link
                  href="/inscription"
                  className="w-full py-4 rounded-xl text-center text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02] cursor-pointer block"
                >
                  Essai gratuit 14 jours sans CB
                </Link>
              </div>

              {/* Offre 3 : Agence / Entreprise */}
              <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">Agence / Grand Compte</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Pour les réseaux d'agences et équipes multi-membres</p>
                  </div>

                  <div className="pt-2">
                    <span className="text-3xl sm:text-4xl font-black text-white">99 000</span>
                    <span className="text-xs text-slate-400 font-semibold"> FCFA / mois</span>
                  </div>

                  <ul className="space-y-2.5 text-xs text-slate-300 pt-4 border-t border-slate-800">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                      Jusqu'à 5 numéros WhatsApp
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                      Comptes agents commerciaux illimités
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                      Scraper Google Maps illimité
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                      Accompagnement & Setup personnalisé
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                      Support WhatsApp VIP dédié 7j/7
                    </li>
                  </ul>
                </div>

                <a
                  href="https://wa.me/221774567890?text=Bonjour,%20je%20souhaite%20des%20informations%20sur%20l'offre%20Agence%20IZI%20Market."
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3.5 rounded-xl text-center text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition-all cursor-pointer block"
                >
                  Contacter un conseiller
                </a>
              </div>

            </div>

            {/* Note de réassurance prix */}
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-400 max-w-xl mx-auto">
              💳 Aucun frais caché. Activation instantanée. Règlement disponible par Wave, Orange Money ou virement.
            </div>

          </div>
        </section>

        {/* ========================================================
            SECTION 12 : FAQ / OBJECTIONS
            Réponses aux 6 questions précises demandées
            ======================================================== */}
        <section id="faq" className="py-24 px-4 sm:px-6 bg-[#0a111c] border-t border-slate-800/80">
          <div className="max-w-4xl mx-auto space-y-12">
            
            <div className="text-center space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Foire aux questions
              </h2>
              <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Nous répondons à toutes vos questions
              </p>
              <p className="text-sm text-slate-400">
                Toutes les réponses pour démarrer en toute sérénité.
              </p>
            </div>

            <div className="space-y-4">
              {faqList.map((faq, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <div
                    key={index}
                    className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                      className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-800/40 transition-colors"
                    >
                      <span className="font-bold text-sm text-white flex items-center gap-2">
                        <HelpCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                        {faq.q}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                          isOpen ? "rotate-180 text-emerald-400" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 text-xs text-slate-300 leading-relaxed border-t border-slate-800/50">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        </section>

        {/* ========================================================
            SECTION 13 : DERNIER APPEL À L'ACTION
            « Essayez gratuitement pendant 14 jours, sans carte bancaire »
            Bouton + lien WhatsApp « Parler à un conseiller »
            ======================================================== */}
        <section className="py-20 px-4 sm:px-6 bg-[#070c14] border-t border-slate-800/80">
          <div className="max-w-5xl mx-auto rounded-3xl p-10 sm:p-14 bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 border border-emerald-500/30 text-center space-y-6 shadow-2xl relative overflow-hidden">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/40">
              <Sparkles className="h-3.5 w-3.5" />
              Offre Spéciale de Lancement
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight max-w-3xl mx-auto">
              Essayez gratuitement pendant 14 jours, sans carte bancaire
            </h2>

            <p className="text-emerald-100/80 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
              Connectez votre numéro dès aujourd'hui et commencez à convertir vos messages WhatsApp en clients sans effort.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href="/inscription"
                className="w-full sm:w-auto px-9 py-4 rounded-2xl bg-white text-slate-950 hover:bg-emerald-50 text-sm font-bold shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                Démarrer mon essai gratuit
              </Link>

              <a
                href="https://wa.me/221774567890?text=Bonjour%20IZI%20Market,%20j'aimerais%20poser%20une%20question%20à%20un%20conseiller%20avant%20de%20démarrer."
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-sm font-bold transition-all cursor-pointer"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Parler à un conseiller sur WhatsApp</span>
              </a>
            </div>
          </div>
        </section>

        {/* ========================================================
            SECTION 14 : PIED DE PAGE (FOOTER)
            Contact, WhatsApp, mentions légales, confidentialité, réseaux sociaux
            ======================================================== */}
        <footer className="py-14 px-4 sm:px-6 border-t border-slate-900 bg-slate-950 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              
              {/* Colonne 1 : À Propos */}
              <div className="space-y-3 md:col-span-1">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 font-bold text-xs">
                    IZI
                  </div>
                  <span className="font-extrabold text-white text-base">IZI Market</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  L'assistant commercial WhatsApp IA pour entreprises et PME en Afrique de l'Ouest.
                </p>
                <div className="text-[11px] text-slate-500">
                  Fait avec fierté à Dakar, Sénégal 🇸🇳
                </div>
              </div>

              {/* Colonne 2 : Navigation */}
              <div className="space-y-2">
                <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">Navigation</h4>
                <ul className="space-y-1.5 text-slate-400">
                  <li><a href="#features" className="hover:text-emerald-400">Fonctionnalités</a></li>
                  <li><a href="#demo" className="hover:text-emerald-400">Démo en direct</a></li>
                  <li><a href="#avant-apres" className="hover:text-emerald-400">Avant / Après</a></li>
                  <li><a href="#metiers" className="hover:text-emerald-400">Exemples par métier</a></li>
                  <li><a href="#tarifs" className="hover:text-emerald-400">Tarifs & Offres</a></li>
                  <li><a href="#faq" className="hover:text-emerald-400">FAQ</a></li>
                </ul>
              </div>

              {/* Colonne 3 : Contact & Support */}
              <div className="space-y-2">
                <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">Contact & Support</h4>
                <ul className="space-y-2 text-slate-400">
                  <li className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>+221 77 456 78 90</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>contact@izimarket.sn</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>Mermoz Pyrotechnie, Dakar</span>
                  </li>
                  <li className="pt-1">
                    <a
                      href="https://wa.me/221774567890?text=Bonjour,%20j'ai%20besoin%20d'aide%20sur%20IZI%20Market."
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      Assistance WhatsApp 7j/7
                    </a>
                  </li>
                </ul>
              </div>

              {/* Colonne 4 : Légal & Réseaux */}
              <div className="space-y-2">
                <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">Légal & Sécurité</h4>
                <ul className="space-y-1.5 text-slate-400">
                  <li><Link href="/parametres" className="hover:text-emerald-400">Mentions Légales</Link></li>
                  <li><Link href="/parametres" className="hover:text-emerald-400">Politique de Confidentialité</Link></li>
                  <li><Link href="/parametres" className="hover:text-emerald-400">Conditions Générales (CGU)</Link></li>
                  <li><span className="text-slate-500">Conformité RGPD & CDP Sénégal</span></li>
                </ul>
                <div className="pt-2 flex items-center gap-3 text-slate-400">
                  <span className="text-[11px] text-slate-500">Suivez-nous :</span>
                  <a href="#" className="hover:text-emerald-400 transition-colors">LinkedIn</a>
                  <a href="#" className="hover:text-emerald-400 transition-colors">Facebook</a>
                  <a href="#" className="hover:text-emerald-400 transition-colors">Instagram</a>
                </div>
              </div>

            </div>

            {/* Copyright */}
            <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500">
              <p>© {new Date().getFullYear()} IZI Market. Tous droits réservés.</p>
              <div className="flex items-center gap-6">
                <Link href="/connexion" className="hover:text-emerald-400">Espace Client</Link>
                <Link href="/app" className="hover:text-emerald-400">Tableau de bord</Link>
              </div>
            </div>
          </div>
        </footer>

        {/* ========================================================
            BOUTON WHATSAPP FLOTTANT (TOUJOURS VISIBLE)
            « Toujours visible sur mobile : un bouton WhatsApp flottant,
            car tes clients préfèrent écrire avant d'acheter. »
            ======================================================== */}
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 group">
          {/* Bulle d'incitation (visible au survol ou sur mobile) */}
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-900 text-white border border-emerald-500/40 shadow-xl text-xs font-semibold animate-in fade-in duration-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Écrivez-nous sur WhatsApp</span>
          </div>

          {/* Bouton WhatsApp Flottant */}
          <a
            href="https://wa.me/221774567890?text=Bonjour,%20je%20découvre%20IZI%20Market%20et%20j'aimerais%20en%20savoir%20plus%20sur%20vos%20services."
            target="_blank"
            rel="noreferrer"
            aria-label="Contacter sur WhatsApp"
            className="h-14 w-14 rounded-full bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 hover:from-emerald-500 hover:to-teal-300 text-white flex items-center justify-center shadow-2xl shadow-emerald-500/50 hover:scale-110 active:scale-95 transition-all cursor-pointer relative"
          >
            <MessageCircle className="h-7 w-7" />
            {/* Pastille verte de disponibilité */}
            <span className="absolute top-1 right-1 h-3.5 w-3.5 rounded-full bg-emerald-300 border-2 border-slate-950"></span>
          </a>
        </div>

        {/* Modal Simulateur Interactif */}
        <WhatsAppSimulatorModal
          isOpen={isSimulatorOpen}
          onClose={() => setIsSimulatorOpen(false)}
        />

      </div>
    </AppProvider>
  );
}
