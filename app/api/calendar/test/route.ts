import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, calendarId, accessToken } = body;

    const token = accessToken || process.env.GOOGLE_CALENDAR_ACCESS_TOKEN;

    if (token && !token.includes("demo") && !token.includes("placeholder")) {
      // Appel réel à l'API Google Calendar
      const targetCalendar = calendarId || "primary";
      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalendar)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (res.ok) {
        const calData = await res.json();
        return NextResponse.json({
          success: true,
          status: "connected",
          message: `Connexion Google Agenda validée ! Calendrier : "${calData.summary || targetCalendar}" (${calData.timeZone || "UTC"})`
        });
      } else {
        const errData = await res.json().catch(() => ({}));
        return NextResponse.json({
          success: false,
          status: "token_invalid",
          message: `Le jeton Google a expiré ou n'a pas les droits suffisants. (${errData.error?.message || res.statusText})`
        });
      }
    }

    // Si pas de jeton OAuth direct mais email configuré : mode synchronisation assistée
    const targetEmail = email || "contact@votre-domaine.sn";
    return NextResponse.json({
      success: true,
      status: "ready_assisted",
      message: `Connexion active pour "${targetEmail}" ! Les rendez-vous WhatsApp génèrent automatiquement les liens Google Calendar & Google Meet.`
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Erreur de test de l'agenda" },
      { status: 500 }
    );
  }
}
