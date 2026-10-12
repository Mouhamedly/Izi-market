import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { INITIAL_BUSINESS, INITIAL_FAQS, INITIAL_CATALOG } from "@/lib/mock-data";
import { generateAiReply } from "@/lib/ai/assistant";
import { sendWhatsAppText } from "@/lib/whatsapp";
import { Business, Contact, Conversation, Message, PipelineStatus, Appointment } from "@/types/database";
import { createGoogleCalendarAppointment } from "@/lib/calendar";

export interface ProcessMessageParams {
  businessId?: string;
  phoneNumberId?: string;
  fromPhone: string;
  senderName?: string | null;
  messageText: string;
  waMessageId?: string;
  source: "whatsapp" | "simulator";
}

export interface ProcessMessageResult {
  success: boolean;
  contact?: Contact | null;
  conversation?: Conversation | null;
  incomingMessage?: Message | null;
  replyMessage?: Message | null;
  appointment?: Appointment | null;
  handoffTriggered?: boolean;
  handoffReason?: string;
  error?: string;
}

export async function processIncomingMessage({
  businessId,
  phoneNumberId,
  fromPhone,
  senderName,
  messageText,
  waMessageId,
  source
}: ProcessMessageParams): Promise<ProcessMessageResult> {
  const isConfigured = isSupabaseConfigured();

  try {
    let business: Business = INITIAL_BUSINESS;
    let contact: Contact | null = null;
    let conversation: Conversation | null = null;
    let incomingMessage: Message | null = null;
    let replyMessage: Message | null = null;
    let bookedAppointment: Appointment | null = null;
    let handoffTriggered = false;
    let handoffReason: string | undefined = undefined;

    // Si Supabase est configuré, interroger la base de données
    if (isConfigured) {
      const supabase = createAdminClient();

      if (businessId) {
        const { data } = await supabase
          .from("businesses")
          .select("*")
          .eq("id", businessId)
          .maybeSingle();
        if (data) business = data as Business;
      } else if (phoneNumberId) {
        const { data } = await supabase
          .from("businesses")
          .select("*")
          .eq("wa_phone_number_id", phoneNumberId)
          .maybeSingle();
        if (data) business = data as Business;
      }

      // Anti-doublons
      if (waMessageId) {
        const { data: existingMsg } = await supabase
          .from("messages")
          .select("id")
          .eq("wa_message_id", waMessageId)
          .maybeSingle();
        if (existingMsg) return { success: true };
      }

      // Contact lookup
      const { data: existingContact } = await supabase
        .from("contacts")
        .select("*")
        .eq("business_id", business.id)
        .eq("wa_phone", fromPhone)
        .maybeSingle();

      if (existingContact) {
        contact = existingContact as Contact;
        if (!contact.name && senderName) {
          const { data: updated } = await supabase
            .from("contacts")
            .update({ name: senderName, updated_at: new Date().toISOString() })
            .eq("id", contact.id)
            .select("*")
            .single();
          if (updated) contact = updated as Contact;
        }
      } else {
        const newContactPayload = {
          business_id: business.id,
          wa_phone: fromPhone,
          name: senderName || `Prospect ${fromPhone.slice(-4)}`,
          status: "nouveau" as PipelineStatus,
          need: null,
          budget: null,
          notes: `Créé automatiquement via ${source === 'whatsapp' ? 'WhatsApp entrant' : 'Simulateur commercial'}`
        };
        const { data: createdContact } = await supabase
          .from("contacts")
          .insert(newContactPayload)
          .select("*")
          .maybeSingle();
        contact = (createdContact as Contact) || {
          id: "c_" + Date.now(),
          ...newContactPayload,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }

      // Conversation lookup
      const { data: existingConv } = await supabase
        .from("conversations")
        .select("*")
        .eq("business_id", business.id)
        .eq("contact_id", contact.id)
        .maybeSingle();

      if (existingConv) {
        conversation = existingConv as Conversation;
        await supabase
          .from("conversations")
          .update({
            last_message_at: new Date().toISOString(),
            unread_count: (conversation.unread_count || 0) + 1
          })
          .eq("id", conversation.id);
      } else {
        const newConvPayload = {
          business_id: business.id,
          contact_id: contact.id,
          mode: "ai" as const,
          last_message_at: new Date().toISOString(),
          unread_count: 1
        };
        const { data: createdConv } = await supabase
          .from("conversations")
          .insert(newConvPayload)
          .select("*")
          .maybeSingle();
        conversation = (createdConv as Conversation) || {
          id: "conv_" + Date.now(),
          ...newConvPayload,
          created_at: new Date().toISOString(),
        };
      }

      // Insert incoming message
      const inMsg = {
        conversation_id: conversation.id,
        business_id: business.id,
        direction: "in" as const,
        sender: "contact" as const,
        body: messageText,
        wa_message_id: waMessageId || `sim_in_${Date.now()}`,
        status: "delivered" as const,
      };
      const { data: createdIncoming } = await supabase
        .from("messages")
        .insert(inMsg)
        .select("*")
        .maybeSingle();
      incomingMessage = (createdIncoming as Message) || {
        id: "msg_in_" + Date.now(),
        ...inMsg,
        created_at: new Date().toISOString(),
      };
    } else {
      // Mode local / Démo ultra-rapide sans latence
      contact = {
        id: "cnt_sim_" + Date.now(),
        business_id: business.id,
        wa_phone: fromPhone,
        name: senderName || "Prospect Test",
        status: "nouveau",
        need: null,
        budget: null,
        notes: "Qualifié via simulateur en temps réel",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      conversation = {
        id: "conv_sim_" + Date.now(),
        business_id: business.id,
        contact_id: contact.id,
        mode: "ai",
        last_message_at: new Date().toISOString(),
        unread_count: 1,
        created_at: new Date().toISOString(),
      };

      incomingMessage = {
        id: "msg_in_" + Date.now(),
        conversation_id: conversation.id,
        business_id: business.id,
        direction: "in",
        sender: "contact",
        body: messageText,
        wa_message_id: waMessageId || `sim_in_${Date.now()}`,
        status: "delivered",
        created_at: new Date().toISOString(),
      };
    }

    // Génération de la réponse IA si conversation.mode = 'ai' et business.ai_enabled
    if (conversation.mode === "ai" && business.ai_enabled) {
      let faqs = INITIAL_FAQS;
      let catalog = INITIAL_CATALOG;
      const history = [incomingMessage];

      if (isConfigured) {
        const supabase = createAdminClient();
        const { data: faqsData } = await supabase
          .from("faqs")
          .select("*")
          .eq("business_id", business.id);
        if (faqsData && faqsData.length > 0) faqs = faqsData;

        const { data: catalogData } = await supabase
          .from("catalog_items")
          .select("*")
          .eq("business_id", business.id);
        if (catalogData && catalogData.length > 0) catalog = catalogData;
      }

      // Appel Claude Sonnet
      const aiResponse = await generateAiReply({
        business,
        contact,
        history,
        faqs,
        catalog,
        userMessage: messageText
      });

      // Mettre à jour le prospect si l'IA a extrait des informations
      if (aiResponse.leadUpdates) {
        contact = {
          ...contact,
          name: aiResponse.leadUpdates.name || contact.name,
          need: aiResponse.leadUpdates.need || contact.need,
          budget: aiResponse.leadUpdates.budget || contact.budget,
          status: aiResponse.leadUpdates.status || contact.status,
          updated_at: new Date().toISOString()
        };

        if (isConfigured) {
          const supabase = createAdminClient();
          await supabase
            .from("contacts")
            .update({
              name: contact.name,
              need: contact.need,
              budget: contact.budget,
              status: contact.status,
              updated_at: contact.updated_at
            })
            .eq("id", contact.id);
        }
      }

      // Si prise de rendez-vous détectée par Claude (Google Agenda)
      if (aiResponse.appointmentBooked) {
        const apptInfo = aiResponse.appointmentBooked;
        const startDateTime = new Date(`${apptInfo.date}T${apptInfo.time}:00`);
        const validStart = isNaN(startDateTime.getTime()) 
          ? new Date(Date.now() + 48 * 3600 * 1000) 
          : startDateTime;
        const validEnd = new Date(validStart.getTime() + (apptInfo.durationMinutes || 45) * 60 * 1000);

        bookedAppointment = await createGoogleCalendarAppointment({
          businessId: business.id,
          contactId: contact.id,
          contactName: contact.name || "Client WhatsApp",
          contactPhone: contact.wa_phone,
          title: apptInfo.title,
          description: apptInfo.notes,
          startTime: validStart.toISOString(),
          endTime: validEnd.toISOString(),
          generateMeet: business.google_meet_enabled !== false
        }, business);

        if (isConfigured) {
          const supabase = createAdminClient();
          await supabase.from("appointments").insert({
            id: bookedAppointment.id,
            business_id: bookedAppointment.business_id,
            contact_id: bookedAppointment.contact_id,
            contact_name: bookedAppointment.contact_name,
            contact_phone: bookedAppointment.contact_phone,
            title: bookedAppointment.title,
            description: bookedAppointment.description,
            start_time: bookedAppointment.start_time,
            end_time: bookedAppointment.end_time,
            google_event_id: bookedAppointment.google_event_id,
            google_meet_link: bookedAppointment.google_meet_link,
            google_calendar_url: bookedAppointment.google_calendar_url,
            status: bookedAppointment.status
          });
        }
      }

      // Si Handoff demandé
      if (aiResponse.requestHandoff) {
        handoffTriggered = true;
        handoffReason = aiResponse.handoffReason;
        conversation.mode = "human";

        if (isConfigured) {
          const supabase = createAdminClient();
          await supabase
            .from("conversations")
            .update({ mode: "human" })
            .eq("id", conversation.id);
        }
      }

      // Envoi WhatsApp Graph API si connecté
      let outWaId: string | undefined = undefined;
      if (source === "whatsapp" && business.wa_phone_number_id && business.wa_access_token) {
        const sendResult = await sendWhatsAppText(
          business.wa_phone_number_id,
          business.wa_access_token,
          fromPhone,
          aiResponse.replyText
        );
        outWaId = sendResult.messageId;
      }

      replyMessage = {
        id: "msg_out_" + Date.now(),
        conversation_id: conversation.id,
        business_id: business.id,
        direction: "out",
        sender: "ai",
        body: aiResponse.replyText,
        wa_message_id: outWaId || `sim_out_${Date.now()}`,
        status: "delivered",
        created_at: new Date().toISOString(),
      };

      if (isConfigured) {
        const supabase = createAdminClient();
        await supabase.from("messages").insert(replyMessage);
      }
    }

    return {
      success: true,
      contact,
      conversation,
      incomingMessage,
      replyMessage,
      appointment: bookedAppointment,
      handoffTriggered,
      handoffReason
    };
  } catch (err: any) {
    console.error("Erreur dans processIncomingMessage:", err);
    return {
      success: false,
      error: err.message || "Erreur interne de traitement"
    };
  }
}
