import { Contact, Business, Conversation, Message } from "@/types/database";

/**
 * Calcule le nombre de jours d'inactivité pour un prospect.
 * Prend en compte l'heure du dernier message de la conversation ou la date de dernière activité.
 */
export function calculateDaysInactive(
  contact: Contact,
  conversation?: Conversation,
  messages?: Message[]
): number {
  let lastTimestamp = contact.last_activity_at 
    ? new Date(contact.last_activity_at).getTime()
    : new Date(contact.updated_at || contact.created_at).getTime();

  if (conversation?.last_message_at) {
    const convTime = new Date(conversation.last_message_at).getTime();
    if (convTime > lastTimestamp) {
      lastTimestamp = convTime;
    }
  }

  if (messages && messages.length > 0) {
    const lastMsgTime = new Date(messages[messages.length - 1].created_at).getTime();
    if (lastMsgTime > lastTimestamp) {
      lastTimestamp = lastMsgTime;
    }
  }

  const now = Date.now();
  const diffMs = now - lastTimestamp;
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
}

export interface FollowupEligibility {
  eligible: boolean;
  daysInactive: number;
  reason?: string;
}

/**
 * Vérifie si un prospect est éligible à une relance automatique ou manuelle
 */
export function isContactEligibleForFollowup(
  contact: Contact,
  business: Business,
  conversation?: Conversation,
  messages?: Message[]
): FollowupEligibility {
  // 1. Le système de relance doit être actif
  if (!business.followup_enabled) {
    return { eligible: false, daysInactive: 0, reason: "Relances désactivées dans les paramètres" };
  }

  // 2. Le prospect ne doit pas être déjà conclu ou abandonné
  if (contact.status === "client") {
    return { eligible: false, daysInactive: 0, reason: "Vente déjà conclue" };
  }
  if (contact.status === "perdu") {
    return { eligible: false, daysInactive: 0, reason: "Prospect marqué comme perdu" };
  }

  // 3. Vérifier le nombre max de relances autorisées
  const maxAttempts = business.followup_max_attempts || 2;
  const currentAttempts = contact.followup_count || 0;
  if (currentAttempts >= maxAttempts) {
    return {
      eligible: false,
      daysInactive: 0,
      reason: `Nombre maximum de relances atteint (${maxAttempts}/${maxAttempts})`
    };
  }

  // 4. Calculer le délai d'inactivité
  const delayDays = business.followup_delay_days || 3;
  const daysInactive = calculateDaysInactive(contact, conversation, messages);

  if (daysInactive < delayDays) {
    return {
      eligible: false,
      daysInactive,
      reason: `Inactivité insuffisante (${daysInactive}/${delayDays} jours)`
    };
  }

  // 5. Vérifier si une relance a déjà été envoyée très récemment (< 48h)
  if (contact.last_followup_at) {
    const lastFollowupTime = new Date(contact.last_followup_at).getTime();
    const hoursSinceLastFollowup = (Date.now() - lastFollowupTime) / (1000 * 3600);
    if (hoursSinceLastFollowup < 48) {
      return {
        eligible: false,
        daysInactive,
        reason: "Dernière relance envoyée il y a moins de 48 heures"
      };
    }
  }

  // 6. Vérifier qui a envoyé le dernier message dans la conversation
  if (messages && messages.length > 0) {
    const lastMessage = messages[messages.length - 1];
    // Si le dernier message vient du prospect et n'a pas été répondu, c'est à nous de répondre
    if (lastMessage.sender === "contact") {
      return {
        eligible: false,
        daysInactive,
        reason: "Le prospect attend une réponse de votre part dans l'Inbox"
      };
    }
  }

  return {
    eligible: true,
    daysInactive,
    reason: `Inactif depuis ${daysInactive} jours (seuil: ${delayDays} jours)`
  };
}

/**
 * Génère le texte de relance personnalisé selon le profil du prospect et les réglages de l'entreprise
 */
export function generateFollowUpMessage(
  contact: Contact,
  business: Business
): string {
  const contactName = contact.name ? contact.name.trim() : "cher client";
  const businessName = business.name || "notre agence";
  const need = contact.need || "votre projet";

  // Si un template personnalisé est défini
  if (business.followup_template && business.followup_template.trim().length > 10) {
    return business.followup_template
      .replace(/{nom}/gi, contactName)
      .replace(/{entreprise}/gi, businessName)
      .replace(/{besoin}/gi, need)
      .replace(/{budget}/gi, contact.budget || "votre budget");
  }

  // Modèle Téranga par défaut
  return `Salam ${contact.name ? `M./Mme ${contact.name}` : ""} ! J'espère que vous vous portez bien. ✨\n\nJe reviens vers vous concernant votre recherche de ${need} chez ${businessName}.\n\nÊtes-vous toujours intéressé(e) ? Si vous le souhaitez, nous pouvons organiser une visite ou un échange téléphonique cette semaine à votre convenance.\n\nDites-moi quel créneau vous conviendrait le mieux ! 😊`;
}

/**
 * Retourne la liste des prospects éligibles à la relance J+3, triés par urgence
 */
export function getFollowUpEligibleContacts(
  contacts: Contact[],
  business: Business,
  conversations: Conversation[],
  messages: Message[]
): Array<{ contact: Contact; daysInactive: number; conversation?: Conversation }> {
  const results: Array<{ contact: Contact; daysInactive: number; conversation?: Conversation }> = [];

  for (const contact of contacts) {
    const conversation = conversations.find((c) => c.contact_id === contact.id);
    const convMessages = conversation
      ? messages.filter((m) => m.conversation_id === conversation.id)
      : [];

    const eligibility = isContactEligibleForFollowup(contact, business, conversation, convMessages);
    if (eligibility.eligible) {
      results.push({
        contact,
        daysInactive: eligibility.daysInactive,
        conversation
      });
    }
  }

  // Tri par jours d'inactivité décroissant (les plus silencieux d'abord)
  return results.sort((a, b) => b.daysInactive - a.daysInactive);
}
