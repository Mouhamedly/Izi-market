import { Quote, QuoteItem, Business } from "@/types/database";

/**
 * Formate un montant en Francs CFA (ex: 1 500 000 FCFA)
 */
export function formatFCFA(amount: number): string {
  if (isNaN(amount)) return "0 FCFA";
  const formatted = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${formatted} FCFA`;
}

/**
 * Calcule les totaux d'un devis (Sous-total HT, TVA, Total TTC)
 */
export function calculateQuoteTotals(
  items: QuoteItem[],
  taxRatePercent: number = 0,
  globalDiscount: number = 0
) {
  const subtotal = items.reduce((acc, item) => acc + (item.total || 0), 0);
  const discountedSubtotal = Math.max(0, subtotal - (globalDiscount || 0));
  const taxAmount = Math.round((discountedSubtotal * (taxRatePercent || 0)) / 100);
  const totalAmount = discountedSubtotal + taxAmount;

  return {
    subtotal,
    taxAmount,
    totalAmount
  };
}

/**
 * Génère le prochain numéro de devis séquentiel (ex: DEV-2025-005)
 */
export function generateNextQuoteNumber(existingQuotes: Quote[]): string {
  const year = new Date().getFullYear();
  const prefix = `DEV-${year}-`;
  
  const numbers = existingQuotes
    .filter(q => q.quote_number && q.quote_number.startsWith(prefix))
    .map(q => {
      const part = q.quote_number.replace(prefix, "");
      const num = parseInt(part, 10);
      return isNaN(num) ? 0 : num;
    });

  const maxNum = numbers.length > 0 ? Math.max(...numbers) : 0;
  const nextNum = (maxNum + 1).toString().padStart(3, "0");
  return `${prefix}${nextNum}`;
}

/**
 * Génère le message WhatsApp officiel formaté pour envoyer le devis au prospect
 */
export function generateQuoteWhatsAppMessage(quote: Quote, business: Business): string {
  const contactGreeting = quote.contact_name ? `M./Mme ${quote.contact_name}` : "Cher client";
  const validDateFormatted = new Date(quote.valid_until).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  const itemsList = quote.items
    .map(item => `• *${item.quantity}x* ${item.description} : *${formatFCFA(item.total)}*`)
    .join("\n");

  const taxNotice = quote.tax_rate > 0 
    ? `\n📊 *TVA (${quote.tax_rate}%)* : ${formatFCFA(quote.tax_amount)}`
    : "";

  const discountNotice = quote.discount_total > 0
    ? `\n🏷️ *Remise commerciale* : -${formatFCFA(quote.discount_total)}`
    : "";

  const paymentTerms = quote.payment_terms || "Wave, Orange Money ou Virement bancaire";

  return `Salam Alaykoum ${contactGreeting} ! ✨

Voici votre proposition commerciale personnalisée établie par *${business.name}* :

📄 *DEVIS N° ${quote.quote_number}*
📌 *Objet :* ${quote.title}
━━━━━━━━━━━━━━━━━━━━━━━━

📦 *Détail des prestations :*
${itemsList}

━━━━━━━━━━━━━━━━━━━━━━━━
💵 *Sous-total HT :* ${formatFCFA(quote.subtotal)}${discountNotice}${taxNotice}
💰 *TOTAL À PAYER :* *${formatFCFA(quote.total_amount)}*

⏳ *Offre valable jusqu'au :* ${validDateFormatted}
💳 *Modalités de règlement :* ${paymentTerms}
${quote.notes ? `\n📝 *Notes :* ${quote.notes}\n` : ""}
Êtes-vous d'accord pour que nous validions cette proposition ensemble ? Répondez simplement à ce message pour confirmer votre commande ou poser vos questions.

*L'équipe ${business.name}*
📱 Service Commercial WhatsApp`.trim();
}
