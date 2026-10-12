"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store";
import {
  Search,
  Bot,
  User,
  Send,
  Sparkles,
  CheckCheck,
  ExternalLink,
  Smartphone
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { WhatsAppSimulatorModal } from "@/components/simulator/WhatsAppSimulatorModal";

export default function InboxPage() {
  const {
    conversations,
    selectedConversationId,
    setSelectedConversationId,
    messages,
    contacts,
    toggleConversationMode,
    sendManualMessage
  } = useApp();

  const [filterMode, setFilterMode] = useState<"all" | "ai" | "human" | "unread">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [inputText, setInputText] = useState("");
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  // Filtrage des conversations
  const filteredConversations = conversations.filter((c) => {
    const contact = contacts.find((cnt) => cnt.id === c.contact_id);
    const nameMatch = contact?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    const phoneMatch = contact?.wa_phone?.includes(searchQuery) || false;
    const matchesSearch = searchQuery.trim() === "" || nameMatch || phoneMatch;

    if (!matchesSearch) return false;

    if (filterMode === "ai") return c.mode === "ai";
    if (filterMode === "human") return c.mode === "human";
    if (filterMode === "unread") return (c.unread_count || 0) > 0;
    return true;
  });

  const activeConversation = conversations.find((c) => c.id === selectedConversationId) || filteredConversations[0];
  const activeContact = activeConversation ? contacts.find((cnt) => cnt.id === activeConversation.contact_id) : null;
  const activeMessages = activeConversation
    ? messages.filter((m) => m.conversation_id === activeConversation.id)
    : [];

  const handleSend = () => {
    if (!inputText.trim() || !activeConversation) return;
    sendManualMessage(activeConversation.id, inputText.trim());
    setInputText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex overflow-hidden">
      
      {/* Colonne Gauche : Liste des Conversations */}
      <div className="w-80 md:w-96 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0">
        
        {/* Header Inbox */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Messages WhatsApp
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 font-bold">
                {conversations.length}
              </span>
            </h1>

            <button
              onClick={() => setIsSimulatorOpen(true)}
              className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1 transition-colors"
              title="Tester un message entrant"
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>Simulateur</span>
            </button>
          </div>

          {/* Champ de recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Chercher nom ou numéro..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>

          {/* Filtres rapides */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setFilterMode("all")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                filterMode === "all"
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setFilterMode("ai")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1 ${
                filterMode === "ai"
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
              }`}
            >
              <Bot className="h-3 w-3" /> Mode IA
            </button>
            <button
              onClick={() => setFilterMode("human")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1 ${
                filterMode === "human"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
              }`}
            >
              <User className="h-3 w-3" /> Humain
            </button>
            <button
              onClick={() => setFilterMode("unread")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                filterMode === "unread"
                  ? "bg-amber-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
              }`}
            >
              Non lus
            </button>
          </div>
        </div>

        {/* Liste défilante des conversations */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Aucune conversation trouvée.
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const contact = contacts.find((cnt) => cnt.id === conv.contact_id);
              const isSelected = conv.id === (activeConversation?.id);
              const lastMsg = messages
                .filter((m) => m.conversation_id === conv.id)
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

              return (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConversationId(conv.id)}
                  className={`p-3.5 cursor-pointer transition-all ${
                    isSelected
                      ? "bg-emerald-50/80 dark:bg-emerald-950/20 border-l-4 border-emerald-600"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative">
                        <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center text-xs shrink-0">
                          {contact?.name ? contact.name.slice(0, 2).toUpperCase() : "WA"}
                        </div>
                        {conv.mode === "ai" ? (
                          <span
                            className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-white"
                            title="IA Active"
                          >
                            <Bot className="h-2 w-2" />
                          </span>
                        ) : (
                          <span
                            className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 bg-blue-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-white"
                            title="Contrôle Humain"
                          >
                            <User className="h-2 w-2" />
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {contact?.name || "Prospect inconnu"}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {contact?.wa_phone}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400" suppressHydrationWarning>
                        {formatDate(conv.last_message_at)}
                      </span>
                      {conv.unread_count > 0 && (
                        <div className="mt-1">
                          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-emerald-600 text-white">
                            {conv.unread_count}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {lastMsg && (
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 truncate pl-12">
                      {lastMsg.sender === "contact" ? "" : lastMsg.sender === "ai" ? "🤖 " : "👤 "}
                      {lastMsg.body}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Colonne Droite : Fil de Conversation WhatsApp & Contrôles */}
      {activeConversation && activeContact ? (
        <div className="flex-1 flex flex-col bg-[#efeae2] dark:bg-[#0b141a] overflow-hidden">
          
          {/* Header de la conversation active */}
          <div className="h-16 bg-white dark:bg-[#1f2c34] border-b border-slate-200 dark:border-[#2a3942] px-6 flex items-center justify-between shrink-0 shadow-sm z-10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                {activeContact.name ? activeContact.name.slice(0, 2).toUpperCase() : "WA"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-[#e9edef]">
                    {activeContact.name || "Prospect WhatsApp"}
                  </h2>
                  <Link
                    href={`/app/prospects/${activeContact.id}`}
                    className="text-[11px] font-semibold text-emerald-600 hover:underline flex items-center gap-0.5"
                  >
                    Fiche CRM <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
                <p className="text-xs text-slate-500 dark:text-[#8696a0]">
                  {activeContact.wa_phone} • Statut : <span className="font-semibold text-emerald-600 uppercase text-[10px]">{activeContact.status}</span>
                </p>
              </div>
            </div>

            {/* Boutons d'Action : Handoff / Mode IA */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleConversationMode(activeConversation.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  activeConversation.mode === "ai"
                    ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-100"
                    : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
                }`}
              >
                {activeConversation.mode === "ai" ? (
                  <>
                    <User className="h-3.5 w-3.5" />
                    <span>Reprendre la main (Humain)</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Rendre à l'IA</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Zone Défilante des Messages (WhatsApp Theme) */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 wa-chat-bg">
            <div className="text-center my-2">
              <span className="text-[11px] bg-white/80 dark:bg-[#182229]/80 text-slate-500 dark:text-[#8696a0] px-3 py-1 rounded-full shadow-xs">
                Début de la conversation WhatsApp
              </span>
            </div>

            {activeMessages.map((msg) => {
              const isOut = msg.direction === "out";

              return (
                <div
                  key={msg.id}
                  className={`flex ${isOut ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-xs shadow-sm relative leading-relaxed ${
                      isOut
                        ? msg.sender === "ai"
                          ? "bg-[#005c4b] text-white rounded-tr-xs"
                          : "bg-[#0b5143] text-white rounded-tr-xs border border-emerald-500/30"
                        : "bg-white dark:bg-[#202c33] text-slate-800 dark:text-[#e9edef] rounded-tl-xs"
                    }`}
                  >
                    {/* Badge d'identification de l'expéditeur */}
                    {isOut && (
                      <div className="flex items-center gap-1 text-[10px] text-emerald-200 mb-1 font-semibold">
                        {msg.sender === "ai" ? (
                          <>
                            <Bot className="h-3 w-3" /> Répondu par Claude IA
                          </>
                        ) : (
                          <>
                            <User className="h-3 w-3" /> Réponse manuelle (Agent)
                          </>
                        )}
                      </div>
                    )}

                    <p className="whitespace-pre-line">{msg.body}</p>

                    <div
                      className={`flex items-center justify-end gap-1 mt-1 text-[9px] ${
                        isOut ? "text-emerald-200" : "text-slate-400 dark:text-[#8696a0]"
                      }`}
                    >
                      <span suppressHydrationWarning>{formatDate(msg.created_at)}</span>
                      {isOut && <CheckCheck className="h-3 w-3 text-sky-300" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Input d'envoi de message */}
          <div className="bg-white dark:bg-[#1f2c34] p-3 md:p-4 border-t border-slate-200 dark:border-[#2a3942] flex items-center gap-3">
            <input
              type="text"
              placeholder={
                activeConversation.mode === "ai"
                  ? "L'IA répond automatiquement. Tapez ici pour envoyer un message manuel et reprendre la main..."
                  : "Tapez votre message à envoyer sur WhatsApp..."
              }
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-slate-100 dark:bg-[#2a3942] text-xs text-slate-900 dark:text-[#e9edef] placeholder-slate-400 dark:placeholder-[#8696a0] rounded-full px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              onClick={handleSend}
              disabled={!inputText.trim()}
              className="h-9 w-9 rounded-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white flex items-center justify-center transition-colors shrink-0 shadow-sm"
              title="Envoyer via WhatsApp"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>

        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
          <Bot className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
          <p className="text-sm font-semibold">Sélectionnez une conversation</p>
          <p className="text-xs mt-1">ou lancez une simulation pour tester l'IA en temps réel.</p>
        </div>
      )}

      {/* Modal Simulateur */}
      <WhatsAppSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
      />
    </div>
  );
}
