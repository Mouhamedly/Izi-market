import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const origin = url.origin;
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(
      `${origin}/app/parametres?google_error=${encodeURIComponent(error || "access_denied")}`
    );
  }

  const clientId =
    process.env.GOOGLE_CLIENT_ID ||
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
  const redirectUri = `${origin}/api/calendar/auth/callback`;

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code"
      })
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      return NextResponse.redirect(
        `${origin}/app/parametres?google_error=token_exchange_failed`
      );
    }

    // Récupérer l'adresse email de l'utilisateur Google
    let userEmail = "contact@votre-domaine.sn";
    try {
      const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      });
      if (userInfoRes.ok) {
        const userInfo = await userInfoRes.json();
        if (userInfo.email) userEmail = userInfo.email;
      }
    } catch {
      // Ignorer si la requête d'info échoue
    }

    // Sauvegarde en base de données si Supabase est configuré
    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      await supabase
        .from("businesses")
        .update({
          google_calendar_connected: true,
          google_calendar_email: userEmail,
          google_access_token: tokenData.access_token,
          google_refresh_token: tokenData.refresh_token || null
        })
        .neq("id", "");
    }

    const response = NextResponse.redirect(
      `${origin}/app/parametres?google_connected=true&email=${encodeURIComponent(userEmail)}`
    );

    // Cookie de session temporaire pour le store frontend
    response.cookies.set("izi_google_calendar_connected", "true", { path: "/" });
    response.cookies.set("izi_google_calendar_email", userEmail, { path: "/" });

    return response;
  } catch (err: any) {
    return NextResponse.redirect(
      `${origin}/app/parametres?google_error=${encodeURIComponent(err.message || "internal_error")}`
    );
  }
}
