import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Si Supabase n'est pas configuré, laisser passer sans bloquer
    if (!url || !anonKey || url.includes("placeholder-") || anonKey.includes("placeholder-")) {
      return supabaseResponse;
    }

    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const pathname = request.nextUrl.pathname;

    // Protection des routes de l'application /app
    if (pathname.startsWith("/app")) {
      const isDemoSession =
        request.cookies.get("izi_demo_session")?.value === "1" ||
        request.nextUrl.searchParams.get("demo") === "1";
      if (!user && !isDemoSession) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = "/connexion";
        redirectUrl.searchParams.set("next", pathname);
        return NextResponse.redirect(redirectUrl);
      }
    }

    // Redirection si déjà connecté
    if ((pathname === "/connexion" || pathname === "/inscription") && user) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/app";
      return NextResponse.redirect(redirectUrl);
    }
  } catch (error) {
    // Sécurité absolue : ne jamais planter le middleware avec une 500
    console.error("Middleware Supabase error:", error);
    return supabaseResponse;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/app/:path*",
    "/connexion",
    "/inscription",
    "/onboarding",
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
