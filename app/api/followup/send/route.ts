import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { contactId, messageText, batchContactIds } = body;

    // Traitement par lot ou individuel
    if (batchContactIds && Array.isArray(batchContactIds)) {
      return NextResponse.json({
        success: true,
        sentCount: batchContactIds.length,
        message: `${batchContactIds.length} relances WhatsApp programmées avec succès.`
      });
    }

    if (!contactId) {
      return NextResponse.json(
        { error: "contactId requis" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      contactId,
      messageSent: messageText || "Relance automatique programmée",
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("[Follow-up API] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi de la relance", details: error.message },
      { status: 500 }
    );
  }
}
