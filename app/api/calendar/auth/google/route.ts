import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const origin = url.origin;

  const clientId =
    url.searchParams.get("client_id") ||
    process.env.GOOGLE_CLIENT_ID ||
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const redirectUri = `${origin}/api/calendar/auth/callback`;

  if (!clientId || clientId.includes("placeholder")) {
    // Si aucun Client ID Google Cloud n'est encore configuré dans .env.local
    return NextResponse.redirect(
      `${origin}/app/parametres?google_error=missing_client_id`
    );
  }

  const scopes = [
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/userinfo.email"
  ].join(" ");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: scopes,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true"
  });

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  return NextResponse.redirect(googleAuthUrl);
}
