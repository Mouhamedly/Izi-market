import { NextRequest, NextResponse } from "next/server";
import { processIncomingMessage } from "@/lib/ai/pipeline";

/**
 * POST /api/simulator
 * Permet de tester en direct le pipeline commercial et l'IA Claude
 * sans dépendre d'un compte Meta WhatsApp Cloud approuvé.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessId, fromPhone, senderName, messageText } = body;

    if (!messageText || !messageText.trim()) {
      return NextResponse.json({ error: "Message requis" }, { status: 400 });
    }

    const phone = fromPhone || "+221770001122";

    const result = await processIncomingMessage({
      businessId,
      fromPhone: phone,
      senderName: senderName || "Prospect Test",
      messageText: messageText.trim(),
      waMessageId: `sim_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      source: "simulator"
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[Simulator API] Erreur:", err);
    return NextResponse.json({ error: err.message || "Erreur interne" }, { status: 500 });
  }
}
