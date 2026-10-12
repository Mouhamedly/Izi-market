import { NextResponse } from "next/server";
import { normalizePhoneNumber } from "@/lib/importer";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Support Vercel extended timeout

const APIFY_BASE_URL = "https://api.apify.com/v2";
const ACTOR_ID = "compass~crawler-google-places";

function getApifyToken(): string {
  const token = process.env.APIFY_API_TOKEN || "";
  return token.trim();
}

/**
 * POST /api/apify/google-maps
 * Démarre un run du scraper Google Maps (compass/crawler-google-places) sur Apify
 */
export async function POST(req: Request) {
  try {
    const token = getApifyToken();
    if (!token) {
      return NextResponse.json(
        { error: "Clé API Apify non configurée (APIFY_API_TOKEN)." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const {
      action = "start",
      searchTerm = "restaurant",
      location = "Dakar, Sénégal",
      maxPlaces = 20,
      language = "fr",
      skipClosedPlaces = true,
      runId
    } = body;

    // Action d'annulation
    if (action === "abort" && runId) {
      const abortRes = await fetch(`${APIFY_BASE_URL}/actor-runs/${runId}/abort?token=${token}`, {
        method: "POST"
      });
      const abortData = await abortRes.json();
      return NextResponse.json({ success: true, aborted: true, data: abortData });
    }

    if (!searchTerm?.trim()) {
      return NextResponse.json(
        { error: "Veuillez spécifier au moins un terme de recherche (ex: restaurant, pharmacie)." },
        { status: 400 }
      );
    }

    // Préparation de la charge utile pour l'acteur Apify compass/crawler-google-places
    const safeMaxPlaces = Math.min(Math.max(Number(maxPlaces) || 10, 1), 100);
    const searchTerms = Array.isArray(searchTerm)
      ? searchTerm.map((s: string) => s.trim()).filter(Boolean)
      : [searchTerm.trim()];

    const actorInput = {
      searchStringsArray: searchTerms,
      locationQuery: location?.trim() || "Dakar, Sénégal",
      maxCrawledPlacesPerSearch: safeMaxPlaces,
      language: language || "fr",
      skipClosedPlaces: Boolean(skipClosedPlaces),
      // Options optimisées pour le scraping de contacts
      allPlacesNoSearch: false
    };

    console.log("[Apify API] Démarrage run Google Maps:", {
      searchTerms,
      location: actorInput.locationQuery,
      maxPlaces: safeMaxPlaces,
      language
    });

    // Lancement asynchrone du run sur Apify
    const runResponse = await fetch(`${APIFY_BASE_URL}/acts/${ACTOR_ID}/runs?token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(actorInput)
    });

    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      console.error("[Apify API] Erreur lancement run:", errorText);
      return NextResponse.json(
        { error: `Erreur Apify (${runResponse.status}) : ${errorText}` },
        { status: runResponse.status }
      );
    }

    const runResult = await runResponse.json();
    const runData = runResult.data;

    return NextResponse.json({
      success: true,
      runId: runData.id,
      datasetId: runData.defaultDatasetId,
      status: runData.status,
      startedAt: runData.startedAt,
      searchTerm,
      location: actorInput.locationQuery,
      maxPlaces: safeMaxPlaces
    });
  } catch (error: any) {
    console.error("[Apify API] Erreur interne POST:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la communication avec Apify", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/apify/google-maps?runId=...&datasetId=...
 * Vérifie l'état d'un run et renvoie les leads extraits une fois terminé
 */
export async function GET(req: Request) {
  try {
    const token = getApifyToken();
    if (!token) {
      return NextResponse.json(
        { error: "Clé API Apify non configurée." },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const runId = searchParams.get("runId");
    const datasetId = searchParams.get("datasetId");

    if (!runId) {
      return NextResponse.json({ error: "Paramètre runId manquant." }, { status: 400 });
    }

    // 1. Interroger le statut du run
    const statusRes = await fetch(`${APIFY_BASE_URL}/actor-runs/${runId}?token=${token}`);
    if (!statusRes.ok) {
      const err = await statusRes.text();
      return NextResponse.json(
        { error: `Impossible de récupérer le statut du run (${statusRes.status}): ${err}` },
        { status: statusRes.status }
      );
    }

    const statusJson = await statusRes.json();
    const runData = statusJson.data;
    const currentStatus = runData.status; // 'READY', 'RUNNING', 'SUCCEEDED', 'FAILED', 'TIMED-OUT', 'ABORTED'
    const targetDatasetId = datasetId || runData.defaultDatasetId;

    // Si le run n'est pas encore terminé
    if (currentStatus === "READY" || currentStatus === "RUNNING") {
      return NextResponse.json({
        success: true,
        status: currentStatus,
        isFinished: false,
        stats: runData.stats,
        message: "Scraping en cours sur Google Maps via Apify..."
      });
    }

    // Si le run a échoué ou a été annulé
    if (currentStatus !== "SUCCEEDED") {
      return NextResponse.json({
        success: false,
        status: currentStatus,
        isFinished: true,
        error: `Le scraping s'est terminé avec le statut : ${currentStatus}.`
      });
    }

    // 2. Si le run a réussi, récupérer les données du dataset
    const datasetRes = await fetch(
      `${APIFY_BASE_URL}/datasets/${targetDatasetId}/items?token=${token}&clean=true`
    );

    if (!datasetRes.ok) {
      const err = await datasetRes.text();
      return NextResponse.json(
        { error: `Impossible de récupérer les résultats du dataset : ${err}` },
        { status: datasetRes.status }
      );
    }

    const rawItems = await datasetRes.json();
    const itemsList = Array.isArray(rawItems) ? rawItems : [];

    // 3. Transformation & Normalisation en prospects CRM exploitables
    const leads = itemsList.map((item: any, idx: number) => {
      const rawPhone = item.phone || item.phoneUnformatted || "";
      const normalizedPhone = normalizePhoneNumber(rawPhone);
      const category = item.categoryName || (Array.isArray(item.categories) && item.categories[0]) || "Commerce";
      
      return {
        id: item.placeId || item.cid || `lead_${idx}_${Date.now()}`,
        name: item.title || "Commerce",
        category,
        phone: rawPhone,
        normalizedPhone,
        hasPhone: Boolean(rawPhone && rawPhone.trim().length >= 6),
        address: item.address || "",
        city: item.city || "",
        countryCode: item.countryCode || "",
        website: item.website || "",
        url: item.url || "",
        totalScore: typeof item.totalScore === "number" ? item.totalScore : null,
        reviewsCount: typeof item.reviewsCount === "number" ? item.reviewsCount : 0,
        openingHours: item.openingHours || null,
        scrapedAt: new Date().toISOString()
      };
    });

    const withPhoneCount = leads.filter((l) => l.hasPhone).length;

    return NextResponse.json({
      success: true,
      status: "SUCCEEDED",
      isFinished: true,
      leads,
      total: leads.length,
      withPhoneCount
    });
  } catch (error: any) {
    console.error("[Apify API] Erreur interne GET:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la récupération des données", details: error.message },
      { status: 500 }
    );
  }
}
