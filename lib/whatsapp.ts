import crypto from "crypto";

export interface ParsedWhatsAppMessage {
  phoneNumberId: string;
  fromPhone: string;
  senderName: string | null;
  messageId: string;
  text: string;
  timestamp: string;
}

/**
 * Vérifie la signature cryptographique X-Hub-Signature-256 envoyée par Meta
 */
export function verifySignature(
  rawBody: string,
  signatureHeader: string | null,
  appSecret: string
): boolean {
  if (!signatureHeader || !appSecret || appSecret.includes("placeholder")) {
    // Si pas de secret configuré en mode démo ou pas d'en-tête, on autorise si en dev/demo
    if (process.env.NODE_ENV !== "production") {
      return true;
    }
    return false;
  }

  const parts = signatureHeader.split("=");
  if (parts.length !== 2 || parts[0] !== "sha256") {
    return false;
  }

  const expectedSignature = parts[1];
  const hmac = crypto.createHmac("sha256", appSecret);
  const calculatedSignature = hmac.update(rawBody, "utf8").digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(calculatedSignature, "utf8"),
      Buffer.from(expectedSignature, "utf8")
    );
  } catch {
    return false;
  }
}

/**
 * Analyse la structure du payload entrant envoyé par le webhook Meta WhatsApp Cloud
 */
export function parseWebhookPayload(body: any): ParsedWhatsAppMessage | null {
  try {
    const entry = body?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    if (!value || !value.messages || value.messages.length === 0) {
      return null;
    }

    const message = value.messages[0];
    const metadata = value.metadata;
    const contact = value.contacts?.[0];

    // On ne traite pour l'instant que les messages texte
    const textBody = message.text?.body || "";
    if (!textBody) {
      return null;
    }

    return {
      phoneNumberId: metadata?.phone_number_id || "",
      fromPhone: message.from,
      senderName: contact?.profile?.name || null,
      messageId: message.id,
      text: textBody,
      timestamp: message.timestamp,
    };
  } catch (error) {
    console.error("Erreur lors du parsing du message WhatsApp:", error);
    return null;
  }
}

/**
 * Envoie un message texte via Meta WhatsApp Cloud Graph API
 */
export async function sendWhatsAppText(
  phoneNumberId: string,
  accessToken: string,
  toPhone: string,
  text: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // Mode démo/simulation si pas de credentials valides
  if (!phoneNumberId || !accessToken || accessToken.includes("placeholder")) {
    console.log(`[WhatsApp Mock] Message envoyé au ${toPhone}: "${text}"`);
    return {
      success: true,
      messageId: "mock_wa_" + Date.now(),
    };
  }

  try {
    // Formater le numéro de téléphone sans '+' pour Meta
    const cleanPhone = toPhone.replace(/\D/g, "");

    const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: cleanPhone,
        type: "text",
        text: {
          preview_url: false,
          body: text,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data?.error?.message || "Erreur Meta Graph API";
      console.error("Meta Graph API error:", data);
      return { success: false, error: errorMessage };
    }

    const messageId = data?.messages?.[0]?.id;
    return { success: true, messageId };
  } catch (err: any) {
    console.error("Erreur d'envoi WhatsApp:", err);
    return { success: false, error: err.message || "Erreur réseau inconnue" };
  }
}
