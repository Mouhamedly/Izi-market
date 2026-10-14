"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  Business,
  Contact,
  Conversation,
  Message,
  FAQ,
  CatalogItem,
  PipelineStatus,
  ConversationMode,
  Appointment,
  AppointmentStatus,
  Quote,
  QuoteStatus
} from "@/types/database";
import {
  INITIAL_BUSINESS,
  INITIAL_CONTACTS,
  INITIAL_CONVERSATIONS,
  INITIAL_FAQS,
  INITIAL_CATALOG,
  INITIAL_MESSAGES,
  INITIAL_APPOINTMENTS,
  INITIAL_QUOTES
} from "./mock-data";
import { createClient, isSupabaseConfigured } from "./supabase/client";
import { generateFollowUpMessage } from "./followup";
import { generateQuoteWhatsAppMessage } from "./quotes";
import { normalizePhoneNumber } from "./importer";

function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function isValidUUID(str?: string | null): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

interface AppContextType {
  business: Business;
  contacts: Contact[];
  conversations: Conversation[];
  messages: Message[];
  faqs: FAQ[];
  catalog: CatalogItem[];
  appointments: Appointment[];
  quotes: Quote[];
  isDemoMode: boolean;
  selectedConversationId: string | null;
  setSelectedConversationId: (id: string | null) => void;
  // Actions
  toggleConversationMode: (convId: string) => Promise<void>;
  sendManualMessage: (convId: string, text: string) => Promise<void>;
  addContact: (contact: Omit<Contact, "id" | "business_id" | "created_at" | "updated_at">) => Promise<Contact>;
  deleteContact: (contactId: string) => Promise<void>;
  updateContactStatus: (contactId: string, status: PipelineStatus) => Promise<void>;
  updateContact: (contactId: string, updates: Partial<Contact>) => Promise<void>;
  addFaq: (faq: Omit<FAQ, "id" | "business_id" | "created_at">) => Promise<void>;
  updateFaq: (id: string, updates: Partial<FAQ>) => Promise<void>;
  deleteFaq: (id: string) => Promise<void>;
  addCatalogItem: (item: Omit<CatalogItem, "id" | "business_id" | "created_at">) => Promise<void>;
  updateCatalogItem: (id: string, updates: Partial<CatalogItem>) => Promise<void>;
  deleteCatalogItem: (id: string) => Promise<void>;
  addAppointment: (appt: Omit<Appointment, "id" | "business_id" | "created_at">) => Promise<Appointment>;
  cancelAppointment: (id: string) => Promise<void>;
  updateAppointmentStatus: (id: string, status: AppointmentStatus) => Promise<void>;
  addQuote: (quote: Omit<Quote, "id" | "business_id" | "created_at" | "updated_at">) => Promise<Quote>;
  updateQuote: (id: string, updates: Partial<Quote>) => Promise<void>;
  deleteQuote: (id: string) => Promise<void>;
  updateQuoteStatus: (id: string, status: QuoteStatus) => Promise<void>;
  sendQuoteViaWhatsApp: (id: string) => Promise<{ success: boolean; whatsappUrl: string; messageText: string }>;
  updateBusinessSettings: (updates: Partial<Business>) => Promise<void>;
  simulateIncomingMessage: (phone: string, name: string, text: string) => Promise<{ success: boolean; replyText?: string }>;
  sendFollowUp: (contactId: string, customMessage?: string) => Promise<{ success: boolean; message?: Message }>;
  sendBatchFollowUps: (contactIds: string[]) => Promise<{ sentCount: number }>;
  importContacts: (newContacts: Omit<Contact, "id" | "business_id" | "created_at" | "updated_at">[], updateExisting?: boolean) => Promise<{ imported: number; updated: number; total: number }>;
  importCatalogItems: (newItems: Omit<CatalogItem, "id" | "business_id" | "created_at">[]) => Promise<{ imported: number }>;
  importFaqs: (newFaqs: Omit<FAQ, "id" | "business_id" | "created_at">[]) => Promise<{ imported: number }>;
  importFullDatabase: (backupData: any) => Promise<{ success: boolean; counts: { contacts: number; catalog: number; faqs: number } }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [business, setBusiness] = useState<Business>(INITIAL_BUSINESS);
  const [contacts, setContacts] = useState<Contact[]>(INITIAL_CONTACTS);
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [faqs, setFaqs] = useState<FAQ[]>(INITIAL_FAQS);
  const [catalog, setCatalog] = useState<CatalogItem[]>(INITIAL_CATALOG);
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [quotes, setQuotes] = useState<Quote[]>(INITIAL_QUOTES);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>("conv_1");
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);

  // Initialisation et chargement des données depuis Supabase ou LocalStorage
  useEffect(() => {
    const configured = isSupabaseConfigured();
    setIsDemoMode(!configured);

    if (!configured) {
      if (typeof window !== "undefined") {
        const savedBiz = localStorage.getItem("izi_business");
        if (savedBiz) {
          try {
            const parsed = JSON.parse(savedBiz);
            if (parsed.name?.includes("Teranga Immo")) {
              parsed.name = "Welma Digital";
              if (parsed.google_calendar_email?.includes("teranga-immo")) {
                parsed.google_calendar_email = "contact@welma-digital.sn";
              }
              localStorage.setItem("izi_business", JSON.stringify(parsed));
            }
            setBusiness(parsed);
          } catch {}
        }

        const savedContacts = localStorage.getItem("izi_contacts");
        if (savedContacts) try { setContacts(JSON.parse(savedContacts)); } catch {}

        const savedConvs = localStorage.getItem("izi_conversations");
        if (savedConvs) try { setConversations(JSON.parse(savedConvs)); } catch {}

        const savedMessages = localStorage.getItem("izi_messages");
        if (savedMessages) try { setMessages(JSON.parse(savedMessages)); } catch {}

        const savedFaqs = localStorage.getItem("izi_faqs");
        if (savedFaqs) try { setFaqs(JSON.parse(savedFaqs)); } catch {}

        const savedCatalog = localStorage.getItem("izi_catalog");
        if (savedCatalog) try { setCatalog(JSON.parse(savedCatalog)); } catch {}

        const savedAppts = localStorage.getItem("izi_appointments");
        if (savedAppts) try { setAppointments(JSON.parse(savedAppts)); } catch {}

        const savedQuotes = localStorage.getItem("izi_quotes");
        if (savedQuotes) try { setQuotes(JSON.parse(savedQuotes)); } catch {}
      }
      return;
    }

    // Charger directement depuis Supabase
    async function loadSupabaseData() {
      try {
        const supabase = createClient();
        
        // 1. Détecter l'utilisateur connecté
        const { data: { user } } = await supabase.auth.getUser();
        let targetBizId = business.id;

        if (user) {
          const { data: member } = await supabase
            .from("members")
            .select("business_id")
            .eq("user_id", user.id)
            .maybeSingle();

          if (member?.business_id) {
            targetBizId = member.business_id;
          }
        }

        // 2. Charger les infos de l'entreprise
        const { data: bizData } = await supabase
          .from("businesses")
          .select("*")
          .eq("id", targetBizId)
          .maybeSingle();

        if (bizData) {
          setBusiness(bizData);
          targetBizId = bizData.id;
        } else {
          // Fallback sur le business démo par défaut
          const { data: defaultBiz } = await supabase
            .from("businesses")
            .select("*")
            .limit(1)
            .maybeSingle();

          if (defaultBiz) {
            setBusiness(defaultBiz);
            targetBizId = defaultBiz.id;
          }
        }

        // 3. Charger les contacts
        const { data: dbContacts } = await supabase
          .from("contacts")
          .select("*")
          .eq("business_id", targetBizId)
          .order("created_at", { ascending: false });

        if (dbContacts && dbContacts.length > 0) {
          setContacts(dbContacts);
        }

        // 4. Charger les devis
        const { data: dbQuotes } = await supabase
          .from("quotes")
          .select("*")
          .eq("business_id", targetBizId)
          .order("created_at", { ascending: false });

        if (dbQuotes && dbQuotes.length > 0) {
          setQuotes(dbQuotes);
        }

        // 5. Charger conversations & messages
        const { data: dbConvs } = await supabase
          .from("conversations")
          .select("*, contact:contacts(*)")
          .eq("business_id", targetBizId)
          .order("last_message_at", { ascending: false });

        if (dbConvs && dbConvs.length > 0) {
          setConversations(dbConvs);
          setSelectedConversationId(dbConvs[0].id);
        }

        const { data: dbMessages } = await supabase
          .from("messages")
          .select("*")
          .eq("business_id", targetBizId)
          .order("created_at", { ascending: true });

        if (dbMessages && dbMessages.length > 0) {
          setMessages(dbMessages);
        }

        // 6. Charger FAQs & Catalogue
        const { data: dbFaqs } = await supabase
          .from("faqs")
          .select("*")
          .eq("business_id", targetBizId);

        if (dbFaqs && dbFaqs.length > 0) {
          setFaqs(dbFaqs);
        }

        const { data: dbCatalog } = await supabase
          .from("catalog_items")
          .select("*")
          .eq("business_id", targetBizId);

        if (dbCatalog && dbCatalog.length > 0) {
          setCatalog(dbCatalog);
        }

        // 7. Charger Rendez-vous
        const { data: dbAppts } = await supabase
          .from("appointments")
          .select("*")
          .eq("business_id", targetBizId);

        if (dbAppts && dbAppts.length > 0) {
          setAppointments(dbAppts);
        }
      } catch (err) {
        console.error("Erreur lors de la synchronisation Supabase:", err);
      }
    }

    loadSupabaseData();

    // 8. Écouteurs Supabase Realtime
    const supabase = createClient();
    const channel = supabase
      .channel("supabase-realtime-global")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contacts" },
        async () => {
          const { data } = await supabase
            .from("contacts")
            .select("*")
            .order("created_at", { ascending: false });
          if (data) setContacts(data);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "quotes" },
        async () => {
          const { data } = await supabase
            .from("quotes")
            .select("*")
            .order("created_at", { ascending: false });
          if (data) setQuotes(data);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "businesses" },
        async () => {
          const { data } = await supabase
            .from("businesses")
            .select("*")
            .eq("id", business.id)
            .maybeSingle();
          if (data) setBusiness(data);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Sauvegarde miroir locale
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("izi_business", JSON.stringify(business));
      localStorage.setItem("izi_contacts", JSON.stringify(contacts));
      localStorage.setItem("izi_conversations", JSON.stringify(conversations));
      localStorage.setItem("izi_messages", JSON.stringify(messages));
      localStorage.setItem("izi_faqs", JSON.stringify(faqs));
      localStorage.setItem("izi_catalog", JSON.stringify(catalog));
      localStorage.setItem("izi_appointments", JSON.stringify(appointments));
      localStorage.setItem("izi_quotes", JSON.stringify(quotes));
    }
  }, [business, contacts, conversations, messages, faqs, catalog, appointments, quotes]);

  // Action : Basculer le mode IA / Humain
  const toggleConversationMode = useCallback(async (convId: string) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === convId) {
          const nextMode: ConversationMode = c.mode === "ai" ? "human" : "ai";
          return { ...c, mode: nextMode };
        }
        return c;
      })
    );

    if (isSupabaseConfigured()) {
      const supabase = createClient();
      const current = conversations.find((c) => c.id === convId);
      if (current) {
        await supabase
          .from("conversations")
          .update({ mode: current.mode === "ai" ? "human" : "ai" })
          .eq("id", convId);
      }
    }
  }, [conversations]);

  // Action : Envoyer un message manuel (Agent)
  const sendManualMessage = useCallback(async (convId: string, text: string) => {
    if (!text.trim()) return;

    const newMsgId = generateUUID();
    const newMsg: Message = {
      id: newMsgId,
      conversation_id: convId,
      business_id: business.id,
      direction: "out",
      sender: "agent",
      body: text.trim(),
      wa_message_id: "agent_out_" + Date.now(),
      status: "delivered",
      created_at: new Date().toISOString()
    };

    setMessages((prev) => [...prev, newMsg]);

    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId
          ? { ...c, last_message_at: newMsg.created_at, mode: "human" }
          : c
      )
    );

    if (isSupabaseConfigured()) {
      const supabase = createClient();
      await supabase.from("messages").insert(newMsg);
      await supabase
        .from("conversations")
        .update({ last_message_at: newMsg.created_at, mode: "human" })
        .eq("id", convId);
    }
  }, [business.id]);

  // Action : Mise à jour statut prospect (Kanban / Table)
  const updateContactStatus = useCallback(async (contactId: string, status: PipelineStatus) => {
    const nowIso = new Date().toISOString();
    setContacts((prev) =>
      prev.map((c) => (c.id === contactId ? { ...c, status, updated_at: nowIso } : c))
    );

    if (isSupabaseConfigured()) {
      const supabase = createClient();
      await supabase
        .from("contacts")
        .update({ status, updated_at: nowIso })
        .eq("id", contactId);
    }
  }, []);

  // Action : Mise à jour infos prospect
  const updateContact = useCallback(async (contactId: string, updates: Partial<Contact>) => {
    const nowIso = new Date().toISOString();
    setContacts((prev) =>
      prev.map((c) =>
        c.id === contactId
          ? { ...c, ...updates, updated_at: nowIso }
          : c
      )
    );

    if (isSupabaseConfigured()) {
      const supabase = createClient();
      await supabase
        .from("contacts")
        .update({ ...updates, updated_at: nowIso })
        .eq("id", contactId);
    }
  }, []);

  // Action : Ajouter un nouveau contact manuellement
  const addContact = useCallback(async (
    newContactData: Omit<Contact, "id" | "business_id" | "created_at" | "updated_at">
  ): Promise<Contact> => {
    const nowIso = new Date().toISOString();
    const normalizedPhone = normalizePhoneNumber(newContactData.wa_phone);
    const newContactId = generateUUID();
    const convId = generateUUID();

    const newContact: Contact = {
      id: newContactId,
      business_id: business.id,
      wa_phone: normalizedPhone,
      name: newContactData.name?.trim() || "Prospect Sans Nom",
      status: newContactData.status || "nouveau",
      need: newContactData.need?.trim() || null,
      budget: newContactData.budget?.trim() || null,
      notes: newContactData.notes?.trim() || null,
      last_activity_at: nowIso,
      followup_count: 0,
      followup_status: "pending",
      created_at: nowIso,
      updated_at: nowIso
    };

    setContacts((prev) => [newContact, ...prev]);

    // Initialiser une conversation WhatsApp associée
    const newConv: Conversation = {
      id: convId,
      business_id: business.id,
      contact_id: newContact.id,
      mode: "ai",
      last_message_at: nowIso,
      unread_count: 0,
      created_at: nowIso,
      contact: newContact
    };
    setConversations((prev) => [newConv, ...prev]);

    if (isSupabaseConfigured()) {
      const supabase = createClient();
      await supabase.from("contacts").insert(newContact);
      await supabase.from("conversations").insert({
        id: convId,
        business_id: business.id,
        contact_id: newContact.id,
        mode: "ai",
        last_message_at: nowIso,
        unread_count: 0,
        created_at: nowIso
      });
    }

    return newContact;
  }, [business.id]);

  // Action : Supprimer un contact
  const deleteContact = useCallback(async (contactId: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== contactId));
    setConversations((prev) => prev.filter((c) => c.contact_id !== contactId));
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      await supabase.from("contacts").delete().eq("id", contactId);
    }
  }, []);

  // FAQ Actions
  const addFaq = useCallback(async (faqData: Omit<FAQ, "id" | "business_id" | "created_at">) => {
    const newFaqId = generateUUID();
    const newFaq: FAQ = {
      id: newFaqId,
      business_id: business.id,
      question: faqData.question,
      answer: faqData.answer,
      created_at: new Date().toISOString()
    };
    setFaqs((prev) => [newFaq, ...prev]);

    if (isSupabaseConfigured()) {
      const supabase = createClient();
      await supabase.from("faqs").insert(newFaq);
    }
  }, [business.id]);

  const updateFaq = useCallback(async (id: string, updates: Partial<FAQ>) => {
    setFaqs((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      await supabase.from("faqs").update(updates).eq("id", id);
    }
  }, []);

  const deleteFaq = useCallback(async (id: string) => {
    setFaqs((prev) => prev.filter((f) => f.id !== id));
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      await supabase.from("faqs").delete().eq("id", id);
    }
  }, []);

  // Catalog Actions
  const addCatalogItem = useCallback(async (itemData: Omit<CatalogItem, "id" | "business_id" | "created_at">) => {
    const newItemId = generateUUID();
    const newItem: CatalogItem = {
      id: newItemId,
      business_id: business.id,
      title: itemData.title,
      price: itemData.price,
      description: itemData.description,
      available: itemData.available ?? true,
      category: itemData.category || "Général",
      image_url: itemData.image_url || (itemData.images && itemData.images[0]) || null,
      images: itemData.images || (itemData.image_url ? [itemData.image_url] : []),
      offer_type: itemData.offer_type || "location",
      address: itemData.address || null,
      google_maps_url: itemData.google_maps_url || null,
      created_at: new Date().toISOString()
    };
    setCatalog((prev) => [newItem, ...prev]);

    if (isSupabaseConfigured()) {
      const supabase = createClient();
      await supabase.from("catalog_items").insert(newItem);
    }
  }, [business.id]);

  const updateCatalogItem = useCallback(async (id: string, updates: Partial<CatalogItem>) => {
    setCatalog((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      await supabase.from("catalog_items").update(updates).eq("id", id);
    }
  }, []);

  const deleteCatalogItem = useCallback(async (id: string) => {
    setCatalog((prev) => prev.filter((item) => item.id !== id));
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      await supabase.from("catalog_items").delete().eq("id", id);
    }
  }, []);

  // Paramètres Business
  const updateBusinessSettings = useCallback(async (updates: Partial<Business>) => {
    const nowIso = new Date().toISOString();
    setBusiness((prev) => ({ ...prev, ...updates, updated_at: nowIso }));
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      await supabase.from("businesses").update({ ...updates, updated_at: nowIso }).eq("id", business.id);
    }
  }, [business.id]);

  // Actions Rendez-vous Google Agenda
  const addAppointment = useCallback(async (apptData: Omit<Appointment, "id" | "business_id" | "created_at">) => {
    const newApptId = generateUUID();
    const newAppt: Appointment = {
      ...apptData,
      id: newApptId,
      business_id: business.id,
      contact_id: isValidUUID(apptData.contact_id) ? apptData.contact_id : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setAppointments((prev) => [newAppt, ...prev]);

    if (isSupabaseConfigured()) {
      const supabase = createClient();
      await supabase.from("appointments").insert(newAppt);
    }
    return newAppt;
  }, [business.id]);

  const cancelAppointment = useCallback(async (id: string) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "cancelled", updated_at: new Date().toISOString() } : a))
    );
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      await supabase.from("appointments").update({ status: "cancelled" }).eq("id", id);
    }
  }, []);

  const updateAppointmentStatus = useCallback(async (id: string, status: AppointmentStatus) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status, updated_at: new Date().toISOString() } : a))
    );
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      await supabase.from("appointments").update({ status }).eq("id", id);
    }
  }, []);

  // Actions Devis & Offres
  const addQuote = useCallback(async (quoteData: Omit<Quote, "id" | "business_id" | "created_at" | "updated_at">) => {
    const nowIso = new Date().toISOString();
    const quoteId = generateUUID();

    const newQuote: Quote = {
      ...quoteData,
      id: quoteId,
      business_id: business.id,
      contact_id: isValidUUID(quoteData.contact_id) ? quoteData.contact_id : null,
      created_at: nowIso,
      updated_at: nowIso
    };
    setQuotes((prev) => [newQuote, ...prev]);

    if (isSupabaseConfigured()) {
      const supabase = createClient();
      await supabase.from("quotes").insert(newQuote);
    }
    return newQuote;
  }, [business.id]);

  const updateQuote = useCallback(async (id: string, updates: Partial<Quote>) => {
    const nowIso = new Date().toISOString();
    setQuotes((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...updates, updated_at: nowIso } : q))
    );
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      const sanitizedUpdates = { ...updates, updated_at: nowIso };
      if ("contact_id" in sanitizedUpdates && !isValidUUID(sanitizedUpdates.contact_id)) {
        sanitizedUpdates.contact_id = null;
      }
      await supabase.from("quotes").update(sanitizedUpdates).eq("id", id);
    }
  }, []);

  const deleteQuote = useCallback(async (id: string) => {
    setQuotes((prev) => prev.filter((q) => q.id !== id));
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      await supabase.from("quotes").delete().eq("id", id);
    }
  }, []);

  const updateQuoteStatus = useCallback(async (id: string, status: QuoteStatus) => {
    const nowIso = new Date().toISOString();
    setQuotes((prev) =>
      prev.map((q) => {
        if (q.id === id) {
          const updates: Partial<Quote> = {
            status,
            updated_at: nowIso
          };
          if (status === "accepte" && !q.accepted_at) {
            updates.accepted_at = nowIso;
          }
          if (status === "envoye" && !q.sent_at) {
            updates.sent_at = nowIso;
          }
          return { ...q, ...updates };
        }
        return q;
      })
    );
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      const updates: any = { status, updated_at: nowIso };
      if (status === "accepte") updates.accepted_at = nowIso;
      if (status === "envoye") updates.sent_at = nowIso;
      await supabase.from("quotes").update(updates).eq("id", id);
    }
  }, []);

  const sendQuoteViaWhatsApp = useCallback(async (id: string) => {
    const quote = quotes.find((q) => q.id === id);
    if (!quote) return { success: false, whatsappUrl: "", messageText: "" };

    const messageText = generateQuoteWhatsAppMessage(quote, business);
    const cleanPhone = quote.contact_phone.replace(/\D/g, "");
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;

    // Marquer le devis comme envoyé
    await updateQuoteStatus(id, "envoye");

    // Ajouter le message dans la conversation active si trouvée
    const conv = conversations.find(
      (c) => c.contact_id === quote.contact_id || c.contact?.wa_phone === quote.contact_phone
    );
    if (conv) {
      const newMsgId = generateUUID();
      const newMsg: Message = {
        id: newMsgId,
        conversation_id: conv.id,
        business_id: business.id,
        direction: "out",
        sender: "agent",
        body: messageText,
        wa_message_id: "wam_quote_" + Date.now(),
        status: "sent",
        created_at: new Date().toISOString()
      };
      setMessages((prev) => [...prev, newMsg]);

      if (isSupabaseConfigured()) {
        const supabase = createClient();
        await supabase.from("messages").insert(newMsg);
      }
    }

    return {
      success: true,
      whatsappUrl,
      messageText
    };
  }, [quotes, business, conversations, updateQuoteStatus]);

  // Relances prospects inactifs (J+3)
  const sendFollowUp = useCallback(async (contactId: string, customMessage?: string) => {
    const contact = contacts.find((c) => c.id === contactId);
    if (!contact) return { success: false };

    const conv = conversations.find((cv) => cv.contact_id === contactId);
    let convId = conv?.id;

    if (!conv) {
      convId = generateUUID();
      const newConv: Conversation = {
        id: convId,
        business_id: business.id,
        contact_id: contactId,
        mode: "ai",
        last_message_at: new Date().toISOString(),
        unread_count: 0,
        created_at: new Date().toISOString()
      };
      setConversations((prev) => [newConv, ...prev]);

      if (isSupabaseConfigured()) {
        const supabase = createClient();
        await supabase.from("conversations").insert(newConv);
      }
    }

    const messageText = customMessage || generateFollowUpMessage(contact, business);
    const nowIso = new Date().toISOString();
    const newMsgId = generateUUID();

    const newMsg: Message = {
      id: newMsgId,
      conversation_id: convId!,
      business_id: business.id,
      direction: "out",
      sender: "ai",
      body: messageText,
      wa_message_id: "followup_wa_" + Date.now(),
      status: "delivered",
      created_at: nowIso
    };

    setMessages((prev) => [...prev, newMsg]);

    setContacts((prev) =>
      prev.map((c) =>
        c.id === contactId
          ? {
              ...c,
              last_activity_at: nowIso,
              last_followup_at: nowIso,
              followup_count: (c.followup_count || 0) + 1,
              followup_status: "sent",
              updated_at: nowIso
            }
          : c
      )
    );

    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId
          ? { ...c, last_message_at: nowIso }
          : c
      )
    );

    if (isSupabaseConfigured()) {
      const supabase = createClient();
      await supabase.from("messages").insert(newMsg);
      await supabase.from("contacts").update({
        last_activity_at: nowIso,
        last_followup_at: nowIso,
        followup_count: (contact.followup_count || 0) + 1,
        followup_status: "sent",
        updated_at: nowIso
      }).eq("id", contactId);
      await supabase.from("conversations").update({ last_message_at: nowIso }).eq("id", convId);
    }

    return { success: true, message: newMsg };
  }, [contacts, conversations, business]);

  const sendBatchFollowUps = useCallback(async (contactIds: string[]) => {
    let sentCount = 0;
    for (const cid of contactIds) {
      const res = await sendFollowUp(cid);
      if (res.success) sentCount++;
    }
    return { sentCount };
  }, [sendFollowUp]);

  // Importations de Données
  const importContacts = useCallback(async (
    newContacts: Omit<Contact, "id" | "business_id" | "created_at" | "updated_at">[],
    updateExisting: boolean = true
  ) => {
    let imported = 0;
    let updated = 0;
    const nowIso = new Date().toISOString();

    const validContacts = newContacts.filter((c) => {
      if (!c.wa_phone) return false;
      const digits = c.wa_phone.replace(/\D/g, "");
      return digits.length >= 7;
    });

    if (validContacts.length === 0) {
      return { imported: 0, updated: 0, total: 0 };
    }

    const cleanedPrev = contacts.filter((c) => c.wa_phone && c.wa_phone.replace(/\D/g, "").length >= 7);
    const phoneIndexMap = new Map<string, number>();
    cleanedPrev.forEach((c, idx) => {
      phoneIndexMap.set(c.wa_phone, idx);
    });

    const updatedList = [...cleanedPrev];
    const newlyAdded: Contact[] = [];

    for (const item of validContacts) {
      const existingIdx = phoneIndexMap.get(item.wa_phone);
      if (existingIdx !== undefined) {
        if (updateExisting) {
          updatedList[existingIdx] = {
            ...updatedList[existingIdx],
            name: item.name && item.name !== "Prospect" ? item.name : updatedList[existingIdx].name,
            status: item.status || updatedList[existingIdx].status,
            need: item.need || updatedList[existingIdx].need,
            budget: item.budget || updatedList[existingIdx].budget,
            notes: item.notes
              ? `${updatedList[existingIdx].notes || ""} | ${item.notes}`
              : updatedList[existingIdx].notes,
            updated_at: nowIso
          };
          updated++;
        }
      } else {
        const newContact: Contact = {
          id: generateUUID(),
          business_id: business.id,
          wa_phone: item.wa_phone,
          name: item.name || "Prospect",
          status: item.status || "nouveau",
          need: item.need || null,
          budget: item.budget || null,
          notes: item.notes || "Importé via fichier",
          last_activity_at: nowIso,
          followup_count: 0,
          followup_status: "pending",
          created_at: nowIso,
          updated_at: nowIso
        };
        phoneIndexMap.set(item.wa_phone, updatedList.length + newlyAdded.length);
        newlyAdded.push(newContact);
        imported++;
      }
    }

    const finalList = [...newlyAdded, ...updatedList];
    setContacts(finalList);

    if (isSupabaseConfigured() && newlyAdded.length > 0) {
      const supabase = createClient();
      await supabase.from("contacts").insert(newlyAdded);
    }

    return { imported, updated, total: imported + updated };
  }, [contacts, business.id]);

  const importCatalogItems = useCallback(async (
    newItems: Omit<CatalogItem, "id" | "business_id" | "created_at">[]
  ) => {
    const createdItems: CatalogItem[] = newItems.map((item) => ({
      id: generateUUID(),
      business_id: business.id,
      title: item.title,
      price: item.price,
      category: item.category || "Catalogue Général",
      description: item.description || null,
      available: item.available !== false,
      image_url: item.image_url || null,
      created_at: new Date().toISOString()
    }));

    setCatalog((prev) => [...createdItems, ...prev]);

    if (isSupabaseConfigured() && createdItems.length > 0) {
      const supabase = createClient();
      await supabase.from("catalog_items").insert(createdItems);
    }

    return { imported: createdItems.length };
  }, [business.id]);

  const importFaqs = useCallback(async (
    newFaqs: Omit<FAQ, "id" | "business_id" | "created_at">[]
  ) => {
    const createdFaqs: FAQ[] = newFaqs.map((faq) => ({
      id: generateUUID(),
      business_id: business.id,
      question: faq.question,
      answer: faq.answer,
      created_at: new Date().toISOString()
    }));

    setFaqs((prev) => [...createdFaqs, ...prev]);

    if (isSupabaseConfigured() && createdFaqs.length > 0) {
      const supabase = createClient();
      await supabase.from("faqs").insert(createdFaqs);
    }

    return { imported: createdFaqs.length };
  }, [business.id]);

  const importFullDatabase = useCallback(async (backupData: any) => {
    let contactsCount = 0;
    let catalogCount = 0;
    let faqsCount = 0;

    if (backupData.business) {
      setBusiness((prev) => ({ ...prev, ...backupData.business, id: prev.id }));
    }
    if (Array.isArray(backupData.contacts) && backupData.contacts.length > 0) {
      setContacts(backupData.contacts);
      contactsCount = backupData.contacts.length;
    }
    if (Array.isArray(backupData.catalog) && backupData.catalog.length > 0) {
      setCatalog(backupData.catalog);
      catalogCount = backupData.catalog.length;
    }
    if (Array.isArray(backupData.faqs) && backupData.faqs.length > 0) {
      setFaqs(backupData.faqs);
      faqsCount = backupData.faqs.length;
    }
    if (Array.isArray(backupData.appointments) && backupData.appointments.length > 0) {
      setAppointments(backupData.appointments);
    }

    return {
      success: true,
      counts: { contacts: contactsCount, catalog: catalogCount, faqs: faqsCount }
    };
  }, []);

  // Simulateur WhatsApp Complet (Pipeline IA)
  const simulateIncomingMessage = useCallback(async (phone: string, name: string, text: string) => {
    try {
      const res = await fetch("/api/simulator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business.id,
          fromPhone: phone,
          senderName: name,
          messageText: text
        })
      });

      const data = await res.json();

      if (data.success) {
        if (data.contact) {
          const nowIso = new Date().toISOString();
          setContacts((prev) => {
            const exists = prev.find((c) => c.id === data.contact.id || c.wa_phone === data.contact.wa_phone);
            if (exists) {
              const updated = {
                ...exists,
                ...data.contact,
                last_activity_at: nowIso,
                followup_status: "replied" as const
              };
              return prev.map((c) => (c.id === exists.id ? updated : c));
            }
            return [{ ...data.contact, last_activity_at: nowIso }, ...prev];
          });
        }

        if (data.conversation) {
          setConversations((prev) => {
            const exists = prev.find((cv) => cv.id === data.conversation.id);
            if (exists) {
              return prev.map((cv) => (cv.id === exists.id ? data.conversation : cv));
            }
            return [data.conversation, ...prev];
          });
          setSelectedConversationId(data.conversation.id);
        }

        if (data.incomingMessage) {
          setMessages((prev) => [...prev, data.incomingMessage]);
        }

        if (data.appointment) {
          setAppointments((prev) => [data.appointment, ...prev.filter(a => a.id !== data.appointment.id)]);
        }

        if (data.replyMessage) {
          setTimeout(() => {
            setMessages((prev) => [...prev, data.replyMessage]);
          }, 400);
        }

        return {
          success: true,
          replyText: data.replyMessage?.body
        };
      } else {
        return { success: false };
      }
    } catch (err) {
      console.error("Erreur simulateur:", err);
      return { success: false };
    }
  }, [business.id]);

  return (
    <AppContext.Provider
      value={{
        business,
        contacts,
        conversations,
        messages,
        faqs,
        catalog,
        appointments,
        quotes,
        isDemoMode,
        selectedConversationId,
        setSelectedConversationId,
        toggleConversationMode,
        sendManualMessage,
        addContact,
        deleteContact,
        updateContactStatus,
        updateContact,
        addFaq,
        updateFaq,
        deleteFaq,
        addCatalogItem,
        updateCatalogItem,
        deleteCatalogItem,
        addAppointment,
        cancelAppointment,
        updateAppointmentStatus,
        addQuote,
        updateQuote,
        deleteQuote,
        updateQuoteStatus,
        sendQuoteViaWhatsApp,
        updateBusinessSettings,
        simulateIncomingMessage,
        sendFollowUp,
        sendBatchFollowUps,
        importContacts,
        importCatalogItems,
        importFaqs,
        importFullDatabase
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp doit être utilisé au sein de AppProvider");
  }
  return context;
}
