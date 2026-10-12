"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, Lock, Mail } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { GoogleIcon } from "@/components/icons/GoogleIcon";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);

    if (!isSupabaseConfigured()) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("izi_auth_provider", "google");
        sessionStorage.setItem("izi_auth_email", "amadou.diallo.pro@gmail.com");
      }
      setTimeout(() => {
        router.push("/app");
      }, 400);
      return;
    }

    try {
      const supabase = createClient();
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/api/auth/callback?next=/app`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (oauthError) {
        setError(oauthError.message);
        setGoogleLoading(false);
      }
    } catch (err: any) {
      setError(err.message || "Erreur lors de la connexion avec Google");
      setGoogleLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured()) {
      // Mode Démo immédiat sans bloquer
      router.push("/app");
      return;
    }

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
      } else {
        router.push("/app");
      }
    } catch (err: any) {
      setError(err.message || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAccess = () => {
    if (typeof document !== "undefined") {
      document.cookie = "izi_demo_session=1; path=/; max-age=86400";
    }
    router.push("/app");
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-6 bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 text-white relative overflow-hidden">
      
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10 space-y-8">
        
        {/* Brand */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-white">
              IZI Market
            </span>
          </Link>
          <h1 className="text-xl font-bold text-slate-100">
            Connexion à votre espace
          </h1>
          <p className="text-xs text-slate-400">
            Gérez vos conversations et prospects WhatsApp qualifiés par l'IA
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {error}
            </div>
          )}

          {/* Connexion 1-clic avec Google / Gmail */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs shadow-md shadow-white/5 transition-all flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer"
          >
            <GoogleIcon className="h-4 w-4 shrink-0" />
            <span>{googleLoading ? "Redirection vers Google..." : "Continuer avec Google (Gmail)"}</span>
          </button>

          <div className="relative flex items-center justify-center py-1">
            <div className="border-t border-slate-800 w-full"></div>
            <span className="bg-slate-900 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider relative shrink-0">
              ou avec email et mot de passe
            </span>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Adresse email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="contact@votre-entreprise.sn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? "Connexion..." : "Se connecter"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Accès Démo Rapide */}
          <div className="pt-4 border-t border-slate-800/80 space-y-3">
            <button
              onClick={handleDemoAccess}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              <span>Tester immédiatement en mode Démo</span>
            </button>
          </div>

          <div className="text-center text-xs text-slate-400 pt-2">
            Pas encore de compte ?{" "}
            <Link href="/inscription" className="text-emerald-400 hover:underline font-semibold">
              Créer une entreprise
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
