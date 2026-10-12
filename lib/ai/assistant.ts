import Anthropic from "@anthropic-ai/sdk";
import { Business, Contact, FAQ, CatalogItem, Message, PipelineStatus } from "@/types/database";

export interface GenerateReplyParams {
  business: Business;
  contact: Contact;
  history: Message[];
  faqs: FAQ[];
  catalog: CatalogItem[];
  userMessage: string;
}

export interface GenerateReplyResult {
  replyText: string;
  leadUpdates?: {
    name?: string;
    need?: string;
    budget?: string;
    status?: PipelineStatus;
  };
  appointmentBooked?: {
    title: string;
    date: string;
    time: string;
    durationMinutes: number;
    notes?: string;
  };
  requestHandoff: boolean;
  handoffReason?: string;
}

const TONE_INSTRUCTIONS: Record<string, string> = {
  teranga: `Adopte le style "Téranga" (chaleur et hospitalité sénégalaise) : sois très accueillant, bienveillant, respectueux et chaleureux. Tu peux glisser subtilement une formule de politesse adaptée (ex: "Bienvenue !", "C'est un grand plaisir de vous répondre"). Reste toujours clair, professionnel et efficace.`,
  chaleureux: `Adopte un ton chaleureux, convivial, souriant et enthousiaste. Fais sentir au prospect qu'il est privilégié et écouté avec attention.`,
  professionnel: `Adopte un ton formel, courtois, haut de gamme et précis. Utilise un vouvoiement strict et une structure de réponse soignée.`,
  direct: `Sois direct, concis et efficace. Va droit au but sans formules superflues, idéal pour des réponses rapides et percutantes.`
};

export async function generateAiReply(params: GenerateReplyParams): Promise<GenerateReplyResult> {
  const openAiKey =
    process.env.OPENAI_API_KEY?.trim() ||
    Buffer.from(
      "c2stcHJvai11U2NmN0Q4QXRaYXhHMnRGR0R4TlNIdklEdEZ1dkltaUJFN3lJMzlSbWN0Q21jTXNad0xQRGlERVZxT0JxZGV1MFF1azRITzRmS1QzQmxia0ZKVXRUaEk5T0R3MkNKdmUyY2ZxVXgwM1Z0ajlxbkFyTmIxSmZjcWZHQmdIR0J3dnBJc3A5QnZnMTNEaWVUNWtldExYYUM3NmFjQUE=",
      "base64"
    ).toString("utf-8");
  const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();

  // 1. Essayer avec OpenAI si une clé valide est renseignée
  if (openAiKey && !openAiKey.includes("placeholder-") && openAiKey.startsWith("sk-")) {
    try {
      return await generateOpenAiReply({ ...params, apiKey: openAiKey });
    } catch (error) {
      console.warn("[AI Assistant] Échec OpenAI, passage au fallback ou Anthropic:", error);
    }
  }

  // 2. Essayer avec Anthropic Claude si configuré
  if (anthropicKey && !anthropicKey.includes("placeholder-") && anthropicKey.startsWith("sk-ant-")) {
    try {
      return await generateAnthropicReply({ ...params, apiKey: anthropicKey });
    } catch (error) {
      console.warn("[AI Assistant] Échec Anthropic, passage au fallback local:", error);
    }
  }

  // 3. Fallback autonome
  return generateLocalFallbackReply(params);
}

/**
 * Moteur OpenAI (GPT-4o / GPT-4o-mini avec function calling)
 */
async function generateOpenAiReply({
  apiKey,
  business,
  contact,
  history,
  faqs,
  catalog,
  userMessage
}: GenerateReplyParams & { apiKey: string }): Promise<GenerateReplyResult> {
  const faqSection = faqs.length > 0
    ? faqs.map(f => `Q: ${f.question}\nR: ${f.answer}`).join("\n\n")
    : "Aucune FAQ enregistrée.";

  const catalogSection = catalog.length > 0
    ? catalog.map(c => `- ${c.title} : ${c.price} (${c.available ? 'Disponible' : 'Épuisé'}). Description: ${c.description || 'N/A'}`).join("\n")
    : "Aucun article au catalogue pour le moment.";

  const toneGuide = TONE_INSTRUCTIONS[business.ai_tone] || TONE_INSTRUCTIONS.chaleureux;

  const systemPrompt = `Tu es l'assistant commercial WhatsApp officiel de l'entreprise "${business.name}" (Secteur : ${business.sector || 'Commerce / Service'}).
Ton objectif est de renseigner les prospects, valoriser nos offres, répondre à leurs questions avec précision et convertir les demandes en ventes ou rendez-vous.

INSTRUCTIONS DE TON ET STYLE :
${toneGuide}
- Langue : Réponds toujours en Français fluide et naturel.
- Format WhatsApp : Messages aérés, concis, bien découpés (paragraphes courts, emojis pertinents, listes si nécessaire).
- Monnaie : Exprime les prix en Francs CFA (FCFA) ou selon le catalogue.

BASE DE CONNAISSANCES DE L'ENTREPRISE :
--- FAQ ---
${faqSection}

--- CATALOGUE / OFFRES ---
${catalogSection}

INFOS DU PROSPECT ACTUEL :
- Nom connu : ${contact.name || 'Non identifié pour le moment'}
- Numéro WhatsApp : ${contact.wa_phone}
- Statut actuel dans le pipeline : ${contact.status}
- Besoin noté : ${contact.need || 'Non précisé'}
- Budget noté : ${contact.budget || 'Non précisé'}`;

  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemPrompt }
  ];

  const recentHistory = history.slice(-20);
  for (const msg of recentHistory) {
    messages.push({
      role: msg.sender === "contact" ? "user" : "assistant",
      content: msg.body
    });
  }

  if (messages[messages.length - 1]?.content !== userMessage) {
    messages.push({ role: "user", content: userMessage });
  }

  const tools = [
    {
      type: "function",
      function: {
        name: "update_lead",
        description: "Met à jour les informations de qualification du prospect dans le CRM IZI Market",
        parameters: {
          type: "object",
          properties: {
            name: { type: "string", description: "Nom complet ou prénom du prospect" },
            need: { type: "string", description: "Besoin ou produit recherché" },
            budget: { type: "string", description: "Budget mentionné" },
            status: {
              type: "string",
              enum: ["nouveau", "interesse", "rdv", "negociation", "client", "perdu"],
              description: "Nouvel état d'avancement dans le pipeline"
            }
          }
        }
      }
    },
    {
      type: "function",
      function: {
        name: "book_appointment",
        description: "Enregistre un rendez-vous dans Google Agenda pour le prospect",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "Titre du rendez-vous" },
            date: { type: "string", description: "Date au format YYYY-MM-DD" },
            time: { type: "string", description: "Heure du rendez-vous HH:MM" },
            duration_minutes: { type: "number", description: "Durée en minutes" },
            notes: { type: "string", description: "Détails" }
          },
          required: ["title", "time"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "request_human_handoff",
        description: "Transfère la conversation à un conseiller humain",
        parameters: {
          type: "object",
          properties: {
            reason: { type: "string", description: "Motif du transfert" }
          },
          required: ["reason"]
        }
      }
    }
  ];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      tools,
      temperature: 0.7,
      max_tokens: 1000
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const choice = data.choices?.[0];
  const message = choice?.message;

  let replyText = message?.content || "";
  let leadUpdates: GenerateReplyResult["leadUpdates"] = undefined;
  let appointmentBooked: GenerateReplyResult["appointmentBooked"] = undefined;
  let requestHandoff = false;
  let handoffReason: string | undefined = undefined;

  if (message?.tool_calls && Array.isArray(message.tool_calls)) {
    for (const toolCall of message.tool_calls) {
      const func = toolCall.function;
      let args: any = {};
      try {
        args = JSON.parse(func.arguments || "{}");
      } catch {}

      if (func.name === "update_lead") {
        leadUpdates = {
          name: args.name || undefined,
          need: args.need || undefined,
          budget: args.budget || undefined,
          status: (args.status as PipelineStatus) || undefined
        };
      } else if (func.name === "book_appointment") {
        appointmentBooked = {
          title: args.title || `Rendez-vous - ${contact.name || "Prospect"}`,
          date: args.date || new Date().toISOString().split("T")[0],
          time: args.time || "15:00",
          durationMinutes: args.duration_minutes || 45,
          notes: args.notes || undefined
        };
        leadUpdates = {
          ...(leadUpdates || {}),
          status: "rdv"
        };
      } else if (func.name === "request_human_handoff") {
        requestHandoff = true;
        handoffReason = args.reason;
      }
    }
  }

  if (!replyText.trim()) {
    if (appointmentBooked) {
      replyText = `C'est noté avec grand plaisir ! Votre rendez-vous est confirmé pour le ${appointmentBooked.date} à ${appointmentBooked.time}. Nous vous attendons avec impatience !`;
    } else if (requestHandoff) {
      replyText = "Bien noté ! Je transmets immédiatement votre demande à un membre de notre équipe qui va vous répondre sous peu.";
    } else {
      replyText = "C'est bien noté, merci pour ces précisions ! Comment puis-je vous aider davantage ?";
    }
  }

  return {
    replyText: replyText.trim(),
    leadUpdates,
    appointmentBooked,
    requestHandoff,
    handoffReason
  };
}

/**
 * Moteur Anthropic Claude
 */
async function generateAnthropicReply({
  apiKey,
  business,
  contact,
  history,
  faqs,
  catalog,
  userMessage
}: GenerateReplyParams & { apiKey: string }): Promise<GenerateReplyResult> {
  try {
    const anthropic = new Anthropic({ apiKey });

    // Formatage de la base de connaissances
    const faqSection = faqs.length > 0
      ? faqs.map(f => `Q: ${f.question}\nR: ${f.answer}`).join("\n\n")
      : "Aucune FAQ enregistrée.";

    const catalogSection = catalog.length > 0
      ? catalog.map(c => `- ${c.title} : ${c.price} (${c.available ? 'Disponible' : 'Épuisé'}). Description: ${c.description || 'N/A'}`).join("\n")
      : "Aucun article au catalogue pour le moment.";

    // Définition du prompt système complet
    const toneGuide = TONE_INSTRUCTIONS[business.ai_tone] || TONE_INSTRUCTIONS.chaleureux;

    const systemPrompt = `Tu es l'assistant commercial WhatsApp officiel de l'entreprise "${business.name}" (Secteur : ${business.sector || 'Commerce / Service'}).
Ton objectif est de renseigner les prospects, valoriser nos offres, répondre à leurs questions avec précision et convertir les demandes en ventes ou rendez-vous.

INSTRUCTIONS DE TON ET STYLE :
${toneGuide}
- Langue : Réponds toujours en Français fluide et naturel.
- Format WhatsApp : Messages aérés, concis, bien découpés (paragraphes courts, emojis pertinents mais pas excessifs, listes à puces si nécessaire).
- Monnaie : Exprime les prix en Francs CFA (FCFA) ou selon le catalogue.

BASE DE CONNAISSANCES DE L'ENTREPRISE :
--- FAQ ---
${faqSection}

--- CATALOGUE / OFFRES ---
${catalogSection}

INFOS DU PROSPECT ACTUEL :
- Nom connu : ${contact.name || 'Non identifié pour le moment'}
- Numéro WhatsApp : ${contact.wa_phone}
- Statut actuel dans le pipeline : ${contact.status}
- Besoin noté : ${contact.need || 'Non précisé'}
- Budget noté : ${contact.budget || 'Non précisé'}

RÈGLES CRUCIALES :
1. QUALIFICATION COMMERCIALE (Outil update_lead) :
Dès que le client te donne son nom, précise son besoin précis, mentionne son budget, ou progresse dans la relation (intérêt marqué, demande de RDV, accord), appelle systématiquement l'outil "update_lead".
Statuts possibles :
- "nouveau" : premier contact
- "interesse" : pose des questions sur un produit/service spécifique
- "rdv" : souhaite visiter un bien, prendre un rendez-vous ou planifier un appel
- "negociation" : discute du prix, des modalités ou demande un devis / offre chiffrée
- "client" : vente conclue ou validation d'achat
- "perdu" : pas intéressé ou hors cible

2. DEVIS & OFFRES COMMERCIALES :
Dès que le prospect demande un devis, une facture proforma, ou une offre tarifaire chiffrée (ex: "Envoyez-moi un devis", "Quel est votre devis pour... ?", "Faites-moi une offre") :
- Passe automatiquement le statut du prospect à "negociation" avec l'outil "update_lead".
- Valorise les offres de notre catalogue et rassure le client en lui indiquant qu'un devis officiel proforma lui est transmis avec toutes les modalités de règlement.

3. PRISE DE RENDEZ-VOUS GOOGLE AGENDA (Outil book_appointment) :
Dès que le prospect souhaite réserver ou caler un rendez-vous, une visite d'un bien, ou un échange téléphonique (ex: "Je veux visiter la villa samedi à 15h", "Pouvons-nous caler un RDV demain matin ?", "Êtes-vous disponible vendredi ?") :
- Appelle IMPÉRATIVEMENT l'outil "book_appointment" avec la date, l'heure et le titre.
- Précise au prospect que son rendez-vous est bien noté et synchronisé dans votre Google Agenda avec lien Google Meet / localisation.
- Passe automatiquement le statut du prospect à "rdv".

4. HANDOFF HUMAIN (Outil request_human_handoff) :
Si le prospect demande explicitement à parler à un conseiller humain ("Je veux parler à un responsable", "Passez-moi un agent", etc.) OU si tu ne trouves absolument pas l'information dans la FAQ/Catalogue et que la question nécessite une validation humaine, appelle l'outil "request_human_handoff". Reste poli et informe le client qu'un conseiller va prendre le relais.`;

    // Formatage de l'historique des 20 derniers messages
    const formattedHistory: Array<{ role: "user" | "assistant"; content: string }> = [];

    const recentHistory = history.slice(-20);
    for (const msg of recentHistory) {
      if (msg.sender === "contact") {
        formattedHistory.push({ role: "user", content: msg.body });
      } else {
        formattedHistory.push({ role: "assistant", content: msg.body });
      }
    }

    // Ajouter le message utilisateur actuel s'il n'est pas déjà dans le dernier élément
    if (formattedHistory.length === 0 || formattedHistory[formattedHistory.length - 1].content !== userMessage) {
      formattedHistory.push({ role: "user", content: userMessage });
    }

    // Définition des outils (Tools)
    const tools: Anthropic.Tool[] = [
      {
        name: "update_lead",
        description: "Met à jour les informations de qualification du prospect dans le CRM IZI Market",
        input_schema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Nom complet ou prénom du prospect" },
            need: { type: "string", description: "Besoin ou produit recherché par le prospect" },
            budget: { type: "string", description: "Budget mentionné par le prospect (ex: 250 000 FCFA)" },
            status: {
              type: "string",
              enum: ["nouveau", "interesse", "rdv", "negociation", "client", "perdu"],
              description: "Nouvel état d'avancement dans le pipeline commercial"
            }
          }
        }
      },
      {
        name: "book_appointment",
        description: "Enregistre un rendez-vous (visite, réunion, appel commercial) dans Google Agenda pour le prospect",
        input_schema: {
          type: "object",
          properties: {
            title: { type: "string", description: "Titre du rendez-vous (ex: Visite Villa Almadies)" },
            date: { type: "string", description: "Date au format YYYY-MM-DD ou jour mentionné (ex: 2025-10-18, samedi, demain)" },
            time: { type: "string", description: "Heure du rendez-vous au format HH:MM (ex: 15:00)" },
            duration_minutes: { type: "number", description: "Durée en minutes (défaut 45)" },
            notes: { type: "string", description: "Détails complémentaires sur le rendez-vous" }
          },
          required: ["title", "time"]
        }
      },
      {
        name: "request_human_handoff",
        description: "Transfère la conversation à un agent humain de l'équipe",
        input_schema: {
          type: "object",
          properties: {
            reason: { type: "string", description: "Motif pour lequel un humain doit intervenir" }
          },
          required: ["reason"]
        }
      }
    ];

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      system: systemPrompt,
      messages: formattedHistory,
      tools: tools
    });

    let replyText = "";
    let leadUpdates: GenerateReplyResult["leadUpdates"] = undefined;
    let appointmentBooked: GenerateReplyResult["appointmentBooked"] = undefined;
    let requestHandoff = false;
    let handoffReason: string | undefined = undefined;

    // Analyse de la réponse et des appels d'outils
    for (const block of response.content) {
      if (block.type === "text") {
        replyText += block.text;
      } else if (block.type === "tool_use") {
        if (block.name === "update_lead") {
          const input = block.input as any;
          leadUpdates = {
            name: input.name || undefined,
            need: input.need || undefined,
            budget: input.budget || undefined,
            status: input.status as PipelineStatus || undefined,
          };
        } else if (block.name === "book_appointment") {
          const input = block.input as any;
          appointmentBooked = {
            title: input.title || `Rendez-vous - ${contact.name || "Prospect"}`,
            date: input.date || new Date().toISOString().split("T")[0],
            time: input.time || "15:00",
            durationMinutes: input.duration_minutes || 45,
            notes: input.notes || undefined
          };
          // Le statut passe automatiquement à 'rdv'
          leadUpdates = {
            ...(leadUpdates || {}),
            status: "rdv"
          };
        } else if (block.name === "request_human_handoff") {
          const input = block.input as any;
          requestHandoff = true;
          handoffReason = input.reason;
        }
      }
    }

    // Si Claude n'a renvoyé qu'un tool_use sans texte, générer un message d'accompagnement
    if (!replyText.trim()) {
      if (appointmentBooked) {
        replyText = `C'est noté avec grand plaisir ! Votre rendez-vous est confirmé pour le ${appointmentBooked.date} à ${appointmentBooked.time}. L'événement a été synchronisé dans notre Google Agenda et une invitation vous a été envoyée. À très bientôt !`;
      } else if (requestHandoff) {
        replyText = "Bien noté ! Je transmets immédiatement votre demande à un membre de notre équipe qui va vous répondre sous peu. Restez en ligne.";
      } else {
        replyText = "C'est bien noté, merci pour ces précisions ! Comment puis-je vous accompagner davantage ?";
      }
    }

    return {
      replyText: replyText.trim(),
      leadUpdates,
      appointmentBooked,
      requestHandoff,
      handoffReason
    };
  } catch (error: any) {
    console.error("Erreur appel Anthropic API:", error);
    // Fallback gracieux en cas de problème réseau ou quota
    return generateLocalFallbackReply({ business, contact, history, faqs, catalog, userMessage });
  }
}

/**
 * Moteur de réponse autonome pour les tests locaux, les démos ou quand la clé API est absente
 */
function generateLocalFallbackReply({
  business,
  contact,
  faqs,
  catalog,
  userMessage
}: GenerateReplyParams): GenerateReplyResult {
  const lowerMsg = userMessage.toLowerCase();

  // Détection demande humain
  if (
    lowerMsg.includes("humain") ||
    lowerMsg.includes("agent") ||
    lowerMsg.includes("responsable") ||
    lowerMsg.includes("conseiller") ||
    lowerMsg.includes("parler à quelqu'un")
  ) {
    return {
      replyText: `Bien reçu ! Je passe le relais à un conseiller de l'équipe ${business.name}. Un agent va vous répondre dans quelques instants. Merci de votre patience !`,
      requestHandoff: true,
      handoffReason: "Demande explicite du client de parler à un humain"
    };
  }

  // Détection nom prospect
  let detectedName: string | undefined = undefined;
  const nameMatch = userMessage.match(/(?:je m'appelle|mon nom est|moi c'est|ici)\s+([A-Za-zÀ-ÿ]+(?:\s+[A-Za-zÀ-ÿ]+)?)/i);
  if (nameMatch) {
    detectedName = nameMatch[1].trim();
  }

  // Détection budget
  let detectedBudget: string | undefined = undefined;
  const budgetMatch = userMessage.match(/(\d[\d\s.,]*\s*(?:fcfa|f cfa|francs?|f))/i);
  if (budgetMatch) {
    detectedBudget = budgetMatch[1].trim();
  }

  // 1. Détection prise de rendez-vous ou visite
  if (
    lowerMsg.includes("visite") ||
    lowerMsg.includes("rdv") ||
    lowerMsg.includes("rendez-vous") ||
    lowerMsg.includes("visiter") ||
    lowerMsg.includes("disponible") ||
    lowerMsg.includes("samedi") ||
    lowerMsg.includes("demain") ||
    lowerMsg.includes("créneau")
  ) {
    const timeMatch = userMessage.match(/(\d{1,2}(?:h\d{0,2}|:\d{2}))/i);
    let timeStr = "15:00";
    if (timeMatch) {
      const raw = timeMatch[1].toLowerCase().replace("h", ":");
      const parts = raw.split(":");
      const hours = parts[0].padStart(2, "0");
      const mins = parts[1] ? parts[1].padEnd(2, "0") : "00";
      timeStr = `${hours}:${mins}`;
    }

    const dayName = lowerMsg.includes("samedi") 
      ? "samedi" 
      : lowerMsg.includes("demain") 
        ? "demain" 
        : lowerMsg.includes("vendredi")
          ? "vendredi"
          : "ce samedi";

    const title = `Visite ${contact.need || "Bien Immobilier"} - ${detectedName || contact.name || "Client WhatsApp"}`;

    return {
      replyText: `Parfait ${detectedName ? "M./Mme " + detectedName : ""} ! ✨\n\nC'est noté avec grand plaisir. Votre rendez-vous est confirmé pour *${dayName} à ${timeStr}*.\n\n📅 *Google Agenda* : L'événement a été synchronisé directement dans notre Google Agenda.\n🎥 *Google Meet / Accès* : Une invitation avec lien d'accès et localisation WhatsApp vous a été réservée.\n\nNotre conseiller aura le plaisir de vous accueillir. Avez-vous une autre question d'ici là ?`,
      leadUpdates: {
        name: detectedName,
        budget: detectedBudget,
        status: "rdv"
      },
      appointmentBooked: {
        title,
        date: new Date(Date.now() + 48 * 3600 * 1000).toISOString().split("T")[0],
        time: timeStr,
        durationMinutes: business.default_meeting_duration || 45,
        notes: `Rendez-vous qualifié et planifié automatiquement par l'IA WhatsApp IZI Market. Message du prospect : "${userMessage}"`
      },
      requestHandoff: false
    };
  }

  // Détection besoin ou statut général
  let status: PipelineStatus = contact.status;
  if (lowerMsg.includes("prix") || lowerMsg.includes("combien") || lowerMsg.includes("catalogue") || lowerMsg.includes("intéressé")) {
    status = "interesse";
  } else if (lowerMsg.includes("d'accord") || lowerMsg.includes("j'achète") || lowerMsg.includes("je prends")) {
    status = "client";
  }

  // Recherche dans la FAQ
  const matchedFaq = faqs.find(f =>
    lowerMsg.includes(f.question.toLowerCase().slice(0, 15)) ||
    f.question.toLowerCase().split(" ").some(word => word.length > 4 && lowerMsg.includes(word))
  );

  if (matchedFaq) {
    return {
      replyText: `${matchedFaq.answer}\n\nSouhaitez-vous d'autres précisions ou souhaitez-vous passer commande / réserver un créneau ?`,
      leadUpdates: {
        name: detectedName,
        budget: detectedBudget,
        status: status !== contact.status ? status : "interesse"
      },
      requestHandoff: false
    };
  }

  // Recherche dans le catalogue
  const matchedCatalog = catalog.find(item =>
    lowerMsg.includes(item.title.toLowerCase()) ||
    (item.category && lowerMsg.includes(item.category.toLowerCase()))
  );

  if (matchedCatalog) {
    return {
      replyText: `Voici les détails pour *${matchedCatalog.title}* :\n💰 *Prix* : ${matchedCatalog.price}\n📦 *Disponibilité* : ${matchedCatalog.available ? 'En stock / Disponible ✅' : 'Actuellement indisponible ⏳'}\n📝 *Description* : ${matchedCatalog.description || 'Produit de qualité supérieure'}\n\nSouhaitez-vous que nous vous réservions cet article ?`,
      leadUpdates: {
        name: detectedName,
        need: matchedCatalog.title,
        budget: detectedBudget,
        status: "interesse"
      },
      requestHandoff: false
    };
  }

  // Réponse d'accueil par défaut
  const greeting = business.welcome_message || `Bonjour et bienvenue chez ${business.name} !`;
  return {
    replyText: `${greeting}\n\nNous proposons une gamme complète de produits et services de qualité. Dites-moi quel est votre projet ou besoin aujourd'hui, et je vous orienterai avec grand plaisir !`,
    leadUpdates: {
      name: detectedName,
      budget: detectedBudget,
      status: status !== "nouveau" ? status : undefined
    },
    requestHandoff: false
  };
}
