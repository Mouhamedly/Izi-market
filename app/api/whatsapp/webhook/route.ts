import { NextRequest, NextResponse } from "next/server";
import { verifySignature, parseWebhookPayload } from "@/lib/whatsapp";
import { processIncomingMessage } from "@/lib/ai/pipeline";

/**
 * GET /api/whatsapp/webhook
 * Vérification du webhook par Meta WhatsApp Cloud API
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && token === expectedToken) {
    console.log("[WhatsApp Webhook] Challenge vérifié avec succès par Meta");
    return new NextResponse(challenge, { status: 200 });
  }

  console.warn("[WhatsApp Webhook] Échec de la vérification du token");
  return new NextResponse("Token de vérification invalide", { status: 403 });
}

/**
 * POST /api/whatsapp/webhook
 * Réception des messages et statuts envoyés par Meta WhatsApp Cloud API
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-hub-signature-256");
    const appSecret = process.env.WHATSAPP_APP_SECRET || "";

    // 1. Vérification de sécurité HMAC SHA256
    const isAuthentic = verifySignature(rawBody, signature, appSecret);
    if (!isAuthentic) {
      console.warn("[WhatsApp Webhook] Signature invalide");
      return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
    }

    const json = JSON.parse(rawBody);

    // 2. Parser le payload
    const parsed = parseWebhookPayload(json);
    if (!parsed) {
      // Peut être un accusé de réception ou un statut Meta, répondre 200 OK rapidement
      return NextResponse.json({ status: "ignored_or_status" }, { status: 200 });
    }

    // 3. Traiter le message entrant via le pipeline IZI Market
    // Exécution dans le cycle de requête
    await processIncomingMessage({
      phoneNumberId: parsed.phoneNumberId,
      fromPhone: parsed.fromPhone,
      senderName: parsed.senderName,
      messageText: parsed.text,
      waMessageId: parsed.messageId,
      source: "whatsapp"
    });

    return NextResponse.json({ status: "success" }, { status: 200 });
  } catch (error: any) {
    console.error("[WhatsApp Webhook] Erreur lors du traitement:", error);
    // Renvoyer 200 pour éviter que Meta ne réessaye en boucle en cas de crash applicatif
    return NextResponse.json({ status: "error", message: error.message }, { status: 200 });
  }
}
