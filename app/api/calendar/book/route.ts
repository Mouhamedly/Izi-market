import { NextRequest, NextResponse } from "next/server";
import { createGoogleCalendarAppointment } from "@/lib/calendar";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { INITIAL_BUSINESS } from "@/lib/mock-data";
import { Business } from "@/types/database";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      businessId,
      contactId,
      contactName,
      contactPhone,
      title,
      description,
      startTime,
      endTime,
      generateMeet
    } = body;

    if (!title || !startTime || !endTime || !contactName) {
      return NextResponse.json(
        { error: "Titre, contactName, startTime et endTime sont requis" },
        { status: 400 }
      );
    }

    let business: Business = INITIAL_BUSINESS;
    if (isSupabaseConfigured() && businessId) {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", businessId)
        .maybeSingle();
      if (data) business = data as Business;
    }

    const appointment = await createGoogleCalendarAppointment(
      {
        businessId: businessId || business.id,
        contactId,
        contactName,
        contactPhone: contactPhone || "+221 77 000 00 00",
        title,
        description,
        startTime,
        endTime,
        generateMeet: generateMeet !== false
      },
      business
    );

    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      await supabase.from("appointments").insert(appointment);
      if (contactId) {
        await supabase
          .from("contacts")
          .update({ status: "rdv", updated_at: new Date().toISOString() })
          .eq("id", contactId);
      }
    }

    return NextResponse.json({
      success: true,
      appointment
    });
  } catch (err: any) {
    console.error("[Calendar API] Erreur:", err);
    return NextResponse.json(
      { error: err.message || "Erreur lors de la réservation" },
      { status: 500 }
    );
  }
}
