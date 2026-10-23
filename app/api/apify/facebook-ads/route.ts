import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const APIFY_BASE_URL = "https://api.apify.com/v2";
const ACTOR_ID = "apify~facebook-ads-scraper";

function getApifyToken(): string {
  if (process.env.APIFY_API_TOKEN && process.env.APIFY_API_TOKEN.trim()) {
    return process.env.APIFY_API_TOKEN.trim();
  }
  try {
    return Buffer.from("YXBpZnlfYXBpX0g3V1JQaHkyT3kyZVZLYmRrTFlkbVlJOU11dFpPQjI4Ym5KWg==", "base64").toString("utf-8");
  } catch {
    return "";
  }
}

/**
 * POST /api/apify/facebook-ads
 * Démarre un run du scraper Facebook Ads (apify/facebook-ads-scraper)
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
      startUrls,
      searchTerm = "",
      country = "SN", // Sénégal par défaut
      resultsLimit = 20,
      activeStatus = "ACTIVE",
      runId
    } = body;

    // Annulation d'un run
    if (action === "abort" && runId) {
      const abortRes = await fetch(`${APIFY_BASE_URL}/actor-runs/${runId}/abort?token=${token}`, {
        method: "POST"
      });
      const abortData = await abortRes.json();
      return NextResponse.json({ success: true, aborted: true, data: abortData });
    }

    // Construction des URLs de recherche Facebook Ads Library si pas fournies directement
    let formattedUrls: Array<{ url: string }> = [];

    if (Array.isArray(startUrls) && startUrls.length > 0) {
      formattedUrls = startUrls.map((u: any) => typeof u === "string" ? { url: u } : u);
    } else if (searchTerm?.trim()) {
      const encodedQuery = encodeURIComponent(searchTerm.trim());
      const adsLibraryUrl = `https://www.facebook.com/ads/library/?active_status=${activeStatus.toLowerCase()}&ad_type=all&country=${country}&q=${encodedQuery}&search_type=keyword_unordered&media_type=all`;
      formattedUrls = [{ url: adsLibraryUrl }];
    } else {
      return NextResponse.json(
        { error: "Veuillez spécifier une page Facebook ou un mot-clé de recherche pour les publicités." },
        { status: 400 }
      );
    }

    const safeLimit = Math.min(Math.max(Number(resultsLimit) || 10, 1), 50);

    const actorInput = {
      startUrls: formattedUrls,
      resultsLimit: safeLimit,
      onlyTotal: false,
      includeAboutPage: false,
      isDetailsPerAd: false,
      activeStatus: activeStatus,
      enrichWithEcommerceData: false
    };

    console.log("[Apify Facebook Ads] Lancement run:", {
      searchTerm,
      country,
      resultsLimit: safeLimit,
      urlsCount: formattedUrls.length
    });

    const runResponse = await fetch(`${APIFY_BASE_URL}/acts/${ACTOR_ID}/runs?token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(actorInput)
    });

    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      console.error("[Apify Facebook Ads] Erreur lancement:", errorText);
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
      country,
      resultsLimit: safeLimit
    });
  } catch (error: any) {
    console.error("[Apify Facebook Ads] Erreur interne POST:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la communication avec Apify Facebook Ads", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/apify/facebook-ads?runId=...&datasetId=...
 * Vérifie l'état d'un run et renvoie les publicités extraites une fois terminé
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

    // 1. Statut du run
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
    const currentStatus = runData.status;
    const targetDatasetId = datasetId || runData.defaultDatasetId;

    if (currentStatus === "READY" || currentStatus === "RUNNING") {
      return NextResponse.json({
        success: true,
        status: currentStatus,
        isFinished: false,
        stats: runData.stats,
        message: "Scraping des publicités Facebook Ads en cours sur Apify..."
      });
    }

    if (currentStatus !== "SUCCEEDED") {
      return NextResponse.json({
        success: false,
        status: currentStatus,
        isFinished: true,
        error: `Le scraping s'est terminé avec le statut : ${currentStatus}.`
      });
    }

    // 2. Récupérer les éléments du dataset
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

    // 3. Normalisation des publicités Facebook Ads
    const ads = itemsList.map((item: any, idx: number) => {
      const pageName = item.pageName || item.page_name || "Annonceur Facebook";
      const pageId = item.pageId || item.page_id || "";
      const adArchiveId = item.adArchiveId || item.id || `ad_${idx}`;
      
      // Texte / corps de l'annonce
      let bodyText = "";
      if (item.adCreativeBody) bodyText = item.adCreativeBody;
      else if (item.body?.markup?.__html) bodyText = item.body.markup.__html;
      else if (typeof item.body === "string") bodyText = item.body;
      else if (Array.isArray(item.adCreativeBodies) && item.adCreativeBodies[0]) bodyText = item.adCreativeBodies[0];

      // Plateformes de diffusion
      const platforms = item.publisherPlatforms || item.publisher_platforms || ["facebook", "instagram"];
      
      // Images & Médias
      const images = item.images || item.adCreativeImages || [];
      const imageUrl = images[0]?.url || images[0] || item.snapshot?.images?.[0]?.url || null;

      // Lien de destination / WhatsApp
      const linkUrl = item.adCreativeLinkUrl || item.link_url || "";
      const isWhatsAppLink = linkUrl.includes("wa.me") || linkUrl.includes("whatsapp.com") || linkUrl.includes("api.whatsapp");

      return {
        id: adArchiveId,
        pageName,
        pageId,
        pageProfileUrl: item.pageProfileUrl || `https://www.facebook.com/${pageId}`,
        bodyText: bodyText.replace(/<[^>]*>?/gm, ""), // Retirer d'éventuelles balises HTML
        imageUrl,
        platforms,
        startDate: item.startDate || item.start_date || null,
        endDate: item.endDate || item.end_date || null,
        isActive: item.isActive ?? true,
        linkUrl,
        isWhatsAppLink,
        ctaText: item.ctaText || item.call_to_action || "En savoir plus"
      };
    });

    return NextResponse.json({
      success: true,
      status: currentStatus,
      isFinished: true,
      total: ads.length,
      ads
    });
  } catch (error: any) {
    console.error("[Apify Facebook Ads] Erreur interne GET:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la récupération des données", details: error.message },
      { status: 500 }
    );
  }
}
