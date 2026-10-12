"use client";

import React, { useState } from "react";
import { useApp } from "@/lib/store";
import {
  X,
  Send,
  Sparkles,
  Bot,
  Phone,
  CheckCheck,
  RefreshCw,
  ChevronRight
} from "lucide-react";

interface SimulatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WhatsAppSimulatorModal({ isOpen, onClose }: WhatsAppSimulatorModalProps) {
  const { simulateIncomingMessage, business } = useApp();
  const [phoneNumber, setPhoneNumber] = useState("+221 77 842 19 88");
  const [customerName, setCustomerName] = useState("Aminata Diallo");
  const [inputText, setInputText] = useState("");
  const [simMessages, setSimMessages] = useState<Array<{ sender: "user" | "ai"; text: string; time: string }>>([
    {
      sender: "ai",
      text: business.welcome_message || `Salam Alaykoum ! Bienvenue chez ${business.name}. Comment puis-je vous aider aujourd'hui ?`,
      time: "10:00"
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const quickPrompts = [
    {
      label: "📅 Prise de RDV visite synchronisée Google Agenda",
      text: "Bonjour, je m'appelle Cheikh Ndiaye. J'aimerais bloquer un rendez-vous pour visiter la villa ce samedi à 15h. Mon budget est de 1.4 million."
    },
    {
      label: "🕒 Réponse à la relance J+3 (Prospect réactivé)",
      text: "Salam ! Merci pour votre relance, j'étais en déplacement hors de Dakar. Je suis toujours très intéressé par la villa, pouvons-nous organiser la visite ce samedi ?"
    },
    {
      label: "🏠 Demande d'appartement aux Almadies",
      text: "Bonjour, je cherche un appartement 3 chambres aux Almadies avec vue mer, budget 850 000 FCFA. Avez-vous ça ?"
    },
    {
      label: "❓ Question FAQ sur les frais d'agence",
      text: "Quels sont vos frais d'agence et les pièces à fournir pour le dossier ?"
    },
    {
      label: "👤 Demande de parler à un humain (Handoff)",
      text: "Je préfère parler directement à un agent humain ou au responsable s'il vous plaît."
    }
  ];

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isLoading) return;

    const timeNow = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

    // Ajouter le message utilisateur dans le mock WhatsApp
    setSimMessages((prev) => [...prev, { sender: "user", text, time: timeNow }]);
    setInputText("");
    setIsLoading(true);

    try {
      const result = await simulateIncomingMessage(phoneNumber, customerName, text);
      const replyTime = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

      if (result.success && result.replyText) {
        setSimMessages((prev) => [
          ...prev,
          { sender: "ai", text: result.replyText!, time: replyTime }
        ]);
      } else {
        setSimMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: "C'est bien noté, un membre de notre équipe prend le relais pour vous répondre sous peu.",
            time: replyTime
          }
        ]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col md:flex-row max-h-[92vh]">
        
        {/* Colonne de Gauche : Panneau de Contrôle du Test */}
        <div className="w-full md:w-5/12 p-6 bg-slate-50 dark:bg-slate-950/60 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <Sparkles className="h-4 w-4" />
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Simulateur WhatsApp IA</h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Testez le pipeline complet en temps réel : Claude Sonnet analyse le message, extrait le prospect (nom, budget, besoin) et répond selon votre FAQ & Catalogue.
            </p>

            {/* Identité du prospect de test */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Nom du prospect simulé
                </label>
                <input
                  type="text"
                  placeholder="Ex: Aminata Diallo"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Numéro WhatsApp (Sénégal/Afrique)
                </label>
                <input
                  type="text"
                  placeholder="+221 77 000 00 00"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium"
                />
              </div>
            </div>

            {/* Scénarios rapides prêts à cliquer */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Scénarios types à tester :
              </p>
              <div className="space-y-2">
                {quickPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(p.text)}
                    disabled={isLoading}
                    className="w-full text-left p-2.5 rounded-xl text-xs font-medium bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-slate-200 dark:border-slate-800 hover:border-emerald-300 transition-all flex items-center justify-between group"
                  >
                    <span className="text-slate-800 dark:text-slate-200">{p.label}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
              Claude 3.5 Sonnet Prêt
            </span>
            <button
              onClick={() => {
                setSimMessages([
                  {
                    sender: "ai",
                    text: business.welcome_message || `Salam Alaykoum ! Bienvenue chez ${business.name}. Comment puis-je vous aider aujourd'hui ?`,
                    time: "10:00"
                  }
                ]);
              }}
              className="hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" /> Réinitialiser
            </button>
          </div>
        </div>

        {/* Colonne de Droite : Mockup de Téléphone WhatsApp Immersif */}
        <div className="w-full md:w-7/12 flex flex-col bg-slate-900 p-3 sm:p-6 items-center justify-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Cadre smartphone */}
          <div className="w-full max-w-[360px] h-[580px] bg-[#0b141a] rounded-[38px] border-[6px] border-slate-700 shadow-2xl flex flex-col overflow-hidden relative">
            
            {/* Notch / Speaker */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-5 w-32 bg-slate-800 rounded-b-xl z-20 flex items-center justify-center">
              <div className="h-1.5 w-12 bg-slate-700 rounded-full"></div>
            </div>

            {/* Header WhatsApp Bar */}
            <div className="bg-[#1f2c34] text-white px-3 pt-6 pb-2.5 flex items-center gap-3 border-b border-[#2a3942] z-10">
              <div className="relative">
                <div className="h-9 w-9 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                  {business.name.slice(0, 2).toUpperCase()}
                </div>
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-emerald-400 rounded-full border-2 border-[#1f2c34]"></span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm truncate text-[#e9edef] leading-tight">
                  {business.name}
                </h4>
                <p className="text-[11px] text-emerald-400 font-medium leading-none mt-0.5">
                  Assistant IA Commercial • En ligne
                </p>
              </div>
              <Phone className="h-4 w-4 text-[#aebac1]" />
            </div>

            {/* Zone de discussion WhatsApp */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 wa-chat-bg dark">
              <div className="text-center my-1">
                <span className="text-[10px] bg-[#182229]/80 text-[#8696a0] px-2.5 py-1 rounded-md shadow-sm">
                  Aujourd'hui • Chiffrement de bout en bout
                </span>
              </div>

              {simMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed shadow-sm relative ${
                      msg.sender === "user"
                        ? "bg-[#005c4b] text-[#e9edef] rounded-tr-xs"
                        : "bg-[#202c33] text-[#e9edef] rounded-tl-xs"
                    }`}
                  >
                    {msg.sender === "ai" && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold mb-1 block">
                        <Bot className="h-3 w-3" /> IA IZI Market
                      </span>
                    )}
                    <p className="whitespace-pre-line">{msg.text}</p>
                    <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-[#8696a0]">
                      <span>{msg.time}</span>
                      {msg.sender === "user" && <CheckCheck className="h-3 w-3 text-sky-400" />}
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-[#202c33] text-[#e9edef] rounded-2xl rounded-tl-xs px-3 py-2 text-xs shadow-sm flex items-center gap-2">
                    <span className="text-[10px] text-emerald-400 font-medium">L'IA rédige</span>
                    <span className="flex gap-1">
                      <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-bounce"></span>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Input WhatsApp Bar */}
            <div className="bg-[#1f2c34] p-2 flex items-center gap-2 border-t border-[#2a3942]">
              <input
                type="text"
                placeholder="Écrire un message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSend();
                }}
                disabled={isLoading}
                className="flex-1 bg-[#2a3942] text-xs text-white placeholder-[#8696a0] rounded-full px-3.5 py-2 focus:outline-none"
              />
              <button
                onClick={() => handleSend()}
                disabled={isLoading || !inputText.trim()}
                className="h-8 w-8 rounded-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white flex items-center justify-center transition-colors shrink-0"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export type WhatsAppSimulatorModalProps = SimulatorProps;
