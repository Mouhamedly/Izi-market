import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFCFA(amount: number | string | null | undefined): string {
  if (!amount) return "Non précisé";
  const num = typeof amount === "string" ? parseFloat(amount.replace(/[^0-9.-]+/g, "")) : amount;
  if (isNaN(num)) return String(amount);
  return new Intl.NumberFormat("fr-FR").format(num) + " FCFA";
}

export function formatDate(dateString: string | Date | null | undefined): string {
  if (!dateString) return "";
  const d = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  } else if (diffDays === 1) {
    return "Hier " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  } else {
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  }
}
