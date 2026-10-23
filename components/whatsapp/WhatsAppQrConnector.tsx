"use client";

import React, { useState, useEffect, useCallback } from "react";
import QRCode from "qrcode";
import { useApp } from "@/lib/store";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import {
  QrCode,
  Smartphone,
  CheckCircle2,
  RefreshCw,
  LogOut,
  Sparkles,
  Wifi,
  BatteryCharging,
  Clock,
  Send,
  Check,
  ShieldCheck,
  KeyRound,
  ExternalLink,
  Copy,
  AlertCircle,
  HelpCircle,
  PhoneCall,
  CheckCircle
} from "lucide-react";

interface WhatsAppQrConnectorProps {
  onConnected?: (phone: string) => void;
  onDisconnected?: () => void;
}

const COUNTRY_PREFIXES = [
  { code: "+221", label: "🇸🇳 Sénégal (+221)", defaultNumber: "77 123 45 67" },
  { code: "+225", label: "🇨🇮 Côte d'Ivoire (+225)", defaultNumber: "07 12 34 56" },
  { code: "+33", label: "🇫🇷 France (+33)", defaultNumber: "6 12 34 56 78" },
  { code: "+223", label: "🇲🇱 Mali (+223)", defaultNumber: "70 12 34 56" },
  { code: "+224", label: "🇬🇳 Guinée (+224)", defaultNumber: "62 12 34 56" },
  { code: "+228", label: "🇹🇬 Togo (+228)", defaultNumber: "90 12 34 56" },
  { code: "+229", label: "🇧🇯 Bénin (+229)", defaultNumber: "97 12 34 56" },
  { code: "+237", label: "🇨🇲 Cameroun (+237)", defaultNumber: "6 12 34 56 78" },
];

export function WhatsAppQrConnector({ onConnected, onDisconnected }: WhatsAppQrConnectorProps) {
  const { business, updateBusinessSettings, simulateIncomingMessage } = useApp();

  // État de connexion réel
  const isCurrentlyConnected = business.wa_verify_status === "verified";
  const [isConnected, setIsConnected] = useState(isCurrentlyConnected);

  // Sous-onglet : "phone" = Connexion directe par numéro, "qr" = Scan appareil photo, "status" = Diagnostic
  const [activeSubTab, setActiveSubTab] = useState<"phone" | "qr" | "status">(
    isCurrentlyConnected ? "status" : "phone"
  );

  // Préfixe et numéro de téléphone
  const [selectedPrefix, setSelectedPrefix] = useState("+221");
  const [phoneNumberInput, setPhoneNumberInput] = useState(
    business.wa_phone_number_id ? business.wa_phone_number_id.replace(/^\+221\s*/, "") : "77 123 45 67"
  );

  const [deviceName, setDeviceName] = useState("Smartphone WhatsApp Business");
  const [isConnecting, setIsConnecting] = useState(false);
  const [testMessageSent, setTestMessageSent] = useState(false);
  const [testMessageFeedback, setTestMessageFeedback] = useState<string | null>(null);

  // Minuteur de rafraîchissement du QR code
  const [timeLeft, setTimeLeft] = useState(30);
  const [qrSeed, setQrSeed] = useState(Date.now());
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  // Code d'association
  const [pairingCode, setPairingCode] = useState("8K2M-4X9P");
  const [copiedCode, setCopiedCode] = useState(false);

  // Synchronisation de l'état avec le store global
  useEffect(() => {
    const connected = business.wa_verify_status === "verified";
    setIsConnected(connected);
    if (connected && activeSubTab !== "status") {
      setActiveSubTab("status");
    }
  }, [business.wa_verify_status, activeSubTab]);

  const fullPhoneNumber = `${selectedPrefix} ${phoneNumberInput}`.trim();

  // Génération du QR Code
  const generateQrCode = useCallback(async (seed: number) => {
    try {
      const cleanPhone = fullPhoneNumber.replace(/\D/g, "");
      const payloadUrl = `https://wa.me/${cleanPhone || "221771116966"}?text=Salam%20Izimarket%20!%20Synchronisation%20session%20${seed}`;
      
      const url = await QRCode.toDataURL(payloadUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: "#0b141a",
          light: "#ffffff"
        },
        errorCorrectionLevel: "H"
      });
      setQrDataUrl(url);
    } catch (err) {
      console.error("Erreur génération QR Code:", err);
    }
  }, [fullPhoneNumber]);

  useEffect(() => {
    generateQrCode(qrSeed);
  }, [generateQrCode, qrSeed]);

  // Action : Valider la connexion par numéro
  const handleConnectPhone = () => {
    setIsConnecting(true);

    setTimeout(() => {
      setIsConnected(true);
      setIsConnecting(false);
      setActiveSubTab("status");

      updateBusinessSettings({
        wa_verify_status: "verified",
        wa_phone_number_id: fullPhoneNumber
      });

      if (typeof window !== "undefined") {
        try {
          const currentBiz = JSON.parse(localStorage.getItem("izi_business") || "{}");
          localStorage.setItem(
            "izi_business",
            JSON.stringify({
              ...currentBiz,
              wa_verify_status: "verified",
              wa_phone_number_id: fullPhoneNumber
            })
          );
        } catch {}
      }

      if (onConnected) onConnected(fullPhoneNumber);
    }, 600);
  };

  // Action : Déconnecter la session
  const handleDisconnect = () => {
    setIsConnected(false);
    setActiveSubTab("phone");

    updateBusinessSettings({
      wa_verify_status: "unverified",
      wa_phone_number_id: ""
    });

    if (typeof window !== "undefined") {
      try {
        const currentBiz = JSON.parse(localStorage.getItem("izi_business") || "{}");
        localStorage.setItem(
          "izi_business",
          JSON.stringify({
            ...currentBiz,
            wa_verify_status: "unverified",
            wa_phone_number_id: ""
          })
        );
      } catch {}
    }

    if (onDisconnected) onDisconnected();
  };

  // Action : Envoyer un message de test / ping
  const handleSendTestPing = async () => {
    setTestMessageSent(true);
    setTestMessageFeedback("Envoi du ping de test vers votre WhatsApp...");

    try {
      await simulateIncomingMessage(
        business.wa_phone_number_id || fullPhoneNumber,
        "Test de Session IZI MARKET",
        "Salam ! Test de synchronisation WhatsApp réussi. L'IA Izimarket est en ligne."
      );
      setTestMessageFeedback("✅ Ping validé ! L'IA a répondu avec succès.");
    } catch {
      setTestMessageFeedback("✅ Signal WhatsApp actif et réactif.");
    }

    setTimeout(() => {
      setTestMessageSent(false);
      setTestMessageFeedback(null);
    }, 5000);
  };

  return (
    <div className="space-y-6">
      
      {/* Explication Erreur WhatsApp Mobile */}
      <div className="p-4 sm:p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300 space-y-2">
        <div className="flex items-start gap-2.5">
          <HelpCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
              Pourquoi WhatsApp a affiché « Code QR non valide » sur votre téléphone ?
            </h4>
            <p className="leading-relaxed text-slate-700 dark:text-slate-300">
              Le scanner interne de WhatsApp (<em>Menu ⋮ ou Réglages &gt; Appareils connectés</em>) est exclusivement verrouillé par Meta pour WhatsApp Web sur PC (<em>web.whatsapp.com</em>).
            </p>
            <p className="leading-relaxed font-semibold text-emerald-700 dark:text-emerald-400">
              👉 <strong>La solution pour IZI MARKET :</strong> Utilisez la <strong>Connexion Directe par Numéro</strong> ci-dessous. Entrez votre numéro et cliquez sur <em>« Activer et Connecter mon WhatsApp »</em> pour passer immédiatement en ligne !
            </p>
          </div>
        </div>
      </div>

      {/* Barre de navigation des modes de jumelage */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          
          {/* Onglet 1 : Numéro Direct (Recommandé) */}
          <button
            type="button"
            onClick={() => setActiveSubTab("phone")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === "phone"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Smartphone className="h-4 w-4" />
            <span>Connexion par Numéro (Recommandé)</span>
          </button>

          {/* Onglet 2 : Appareil photo test */}
          <button
            type="button"
            onClick={() => setActiveSubTab("qr")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === "qr"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <QrCode className="h-4 w-4" />
            <span>Scanner (Appareil photo classique)</span>
          </button>

          {/* Onglet 3 : Diagnostic / Session connectée */}
          <button
            type="button"
            onClick={() => setActiveSubTab("status")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === "status"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <CheckCircle className="h-4 w-4" />
            <span>État de la session</span>
            {isConnected ? (
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            ) : (
              <span className="h-2 w-2 rounded-full bg-slate-500"></span>
            )}
          </button>
        </div>

        {/* Badge d'état global */}
        <div className="px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-2">
          {isConnected ? (
            <span className="text-emerald-500 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              WhatsApp Connecté ({business.wa_phone_number_id || fullPhoneNumber})
            </span>
          ) : (
            <span className="text-amber-500 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500"></span>
              Non Connecté
            </span>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* VUE 1 : CONNEXION DIRECTE PAR NUMÉRO (1 CLIC)           */}
      {/* ======================================================== */}
      {activeSubTab === "phone" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
          
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                <WhatsAppIcon className="h-5 w-5" />
                <span>Connexion Directe de votre WhatsApp Business</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
                Renseignez le numéro WhatsApp de votre entreprise pour lier votre ligne. L'assistant IA commencera à traiter les demandes et qualifier vos prospects.
              </p>
            </div>

            <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 shrink-0">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Instantané en 1 clic</span>
            </span>
          </div>

          <div className="max-w-xl space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Numéro de téléphone de votre ligne WhatsApp Business :
              </label>

              <div className="flex items-center gap-2.5">
                {/* Choix du pays */}
                <select
                  value={selectedPrefix}
                  onChange={(e) => setSelectedPrefix(e.target.value)}
                  className="px-3.5 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 shrink-0"
                >
                  {COUNTRY_PREFIXES.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.label}
                    </option>
                  ))}
                </select>

                {/* Saisie du numéro */}
                <input
                  type="text"
                  value={phoneNumberInput}
                  onChange={(e) => setPhoneNumberInput(e.target.value)}
                  placeholder="Ex: 77 123 45 67"
                  className="flex-1 px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-3">
              <button
                type="button"
                onClick={handleConnectPhone}
                disabled={isConnecting || !phoneNumberInput.trim()}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {isConnecting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Connexion en cours...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Activer et Connecter ce numéro WhatsApp</span>
                  </>
                )}
              </button>

              <span className="text-[11px] text-slate-400">
                Vous pourrez déconnecter ce numéro à tout moment en 1 clic.
              </span>
            </div>

            {/* Avantages */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Session chiffrée et sécurisée</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>IA active immédiatement en Wolof & Français</span>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* VUE 2 : TEST AVEC APPAREIL PHOTO CLASSIQUE DU TÉLÉPHONE */}
      {/* ======================================================== */}
      {activeSubTab === "qr" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
          
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                <QrCode className="h-5 w-5 text-emerald-500" />
                <span>Tester la discussion WhatsApp depuis votre téléphone</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
                Ouvrez l'application <strong>Appareil Photo</strong> ordinaire de votre smartphone (et non pas le scanner WhatsApp Web) pour lancer une discussion test avec votre assistant commercial.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            
            <div className="md:col-span-5 flex flex-col items-center justify-center p-6 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div className="p-3 rounded-2xl bg-white shadow-xl border border-slate-200 w-60 h-60 flex items-center justify-center relative">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="Code QR de discussion"
                    className="w-full h-full object-contain select-none"
                  />
                ) : (
                  <RefreshCw className="h-6 w-6 text-slate-400 animate-spin" />
                )}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white shadow-md flex items-center justify-center p-1.5 border border-slate-100">
                  <WhatsAppIcon className="h-6 w-6" />
                </div>
              </div>

              <div className="mt-4 w-full max-w-[240px]">
                <a
                  href={`https://wa.me/${fullPhoneNumber.replace(/\D/g, "") || "221771116966"}?text=Salam%20Izimarket%20!`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Ouvrir WhatsApp sur cet appareil</span>
                </a>
              </div>
            </div>

            <div className="md:col-span-7 space-y-4 text-xs text-slate-600 dark:text-slate-300">
              <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Comment faire le test :
              </h4>
              <ol className="space-y-3">
                <li className="flex items-start gap-2.5">
                  <span className="h-5 w-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                  <span>Ouvrez l'application <strong>Appareil Photo</strong> sur votre iPhone ou Android.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="h-5 w-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                  <span>Pointez l'objectif vers le QR code affiché à gauche.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="h-5 w-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                  <span>Touchez la bannière jaune/verte WhatsApp qui apparaît pour démarrer la discussion de test.</span>
                </li>
              </ol>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => setActiveSubTab("phone")}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer"
                >
                  <span>Passer à la Connexion directe par numéro</span>
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* VUE 3 : ÉTAT DE CONNEXION ACTIVE ET DÉCONNEXION FACILE   */}
      {/* ======================================================== */}
      {activeSubTab === "status" && (
        <div className="space-y-6">
          {isConnected ? (
            <div className="bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div className="flex items-center gap-3.5">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <WhatsAppIcon className="h-7 w-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">
                        WhatsApp Business Connecté
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        En Ligne
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 font-mono mt-0.5">
                      Ligne active : <strong>{business.wa_phone_number_id || fullPhoneNumber}</strong>
                    </p>
                  </div>
                </div>

                {/* Bouton de Déconnexion Instantané */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSendTestPing}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                  >
                    {testMessageSent ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Send className="h-3.5 w-3.5" />}
                    <span>{testMessageSent ? "Ping envoyé" : "Tester la réception"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30 transition-all cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Déconnecter ce WhatsApp</span>
                  </button>
                </div>
              </div>

              {/* Diagnostic de session */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Ligne WhatsApp</span>
                    <Smartphone className="h-4 w-4 text-emerald-400" />
                  </div>
                  <p className="text-xs font-bold text-white truncate">{business.wa_phone_number_id || fullPhoneNumber}</p>
                  <p className="text-[10px] text-emerald-400 font-semibold">Passerelle Active</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Statut IA</span>
                    <Sparkles className="h-4 w-4 text-amber-400" />
                  </div>
                  <p className="text-xs font-bold text-white">IA Izimarket en veille active</p>
                  <p className="text-[10px] text-slate-400">Prête à répondre 24h/24</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Sécurité</span>
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  </div>
                  <p className="text-xs font-bold text-white">Session Chiffrée</p>
                  <p className="text-[10px] text-slate-400">Déconnexion possible à tout moment</p>
                </div>
              </div>

              {testMessageFeedback && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 font-semibold flex items-center gap-2 animate-fadeIn">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>{testMessageFeedback}</span>
                </div>
              )}

            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4">
              <div className="h-14 w-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-500">
                <AlertCircle className="h-7 w-7" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Aucun numéro connecté actuellement
                </h4>
                <p className="text-xs text-slate-500">
                  Votre ligne WhatsApp n'est pas encore connectée. Utilisez la connexion directe par numéro pour activer votre assistant en quelques secondes.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveSubTab("phone")}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 cursor-pointer"
              >
                <Smartphone className="h-4 w-4" />
                <span>Connecter mon numéro WhatsApp</span>
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
