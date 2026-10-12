import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { INITIAL_APPOINTMENTS } from "@/lib/mock-data";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId");

    if (isSupabaseConfigured() && businessId) {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("appointments")
        .select("*, contact:contacts(*)")
        .eq("business_id", businessId)
        .order("start_time", { ascending: true });

      if (error) throw error;
      return NextResponse.json({ appointments: data || [] });
    }

    return NextResponse.json({ appointments: INITIAL_APPOINTMENTS });
  } catch (err: any) {
    console.error("[Calendar Events API] Erreur:", err);
    return NextResponse.json(
      { error: err.message || "Erreur interne" },
      { status: 500 }
    );
  }
}
