import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-950 text-white text-center">
      <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/30">
        <Sparkles className="h-6 w-6" />
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight mb-2">Page non trouvée</h1>
      <p className="text-sm text-slate-400 mb-6 max-w-sm">
        La page que vous recherchez n'existe pas ou a été déplacée.
      </p>
      <Link
        href="/app"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all"
      >
        <ArrowLeft className="h-4 w-4" /> Retourner à l'application
      </Link>
    </div>
  );
}
