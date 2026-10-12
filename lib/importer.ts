import { Contact, CatalogItem, FAQ, PipelineStatus } from "@/types/database";

/**
 * Nettoie et standardise un numéro de téléphone WhatsApp (en particulier Afrique de l'Ouest / Sénégal)
 * Exemples traités :
 * '771234567' -> '+221771234567'
 * '77 123 45 67' -> '+221771234567'
 * '221771234567' -> '+221771234567'
 * '+221 78 555 44 33' -> '+221785554433'
 * '+33612345678' -> '+33612345678'
 */
export function normalizePhoneNumber(raw: string): string {
  if (!raw) return "";
  // Si plusieurs numéros sont séparés par ':::' ou '/' ou ',', on prend le premier numéro
  const firstPart = raw.split(/:::|\/|,/)[0].trim();
  // Conserver uniquement les chiffres et le '+'
  const cleaned = firstPart.replace(/[^\d+]/g, "").trim();
  
  if (cleaned.startsWith("+")) {
    return cleaned;
  }
  
  // Format sénégalais sans indicatif (9 chiffres commençant par 70, 75, 76, 77, 78, 33...)
  if (/^(7[05678]|33)\d{7}$/.test(cleaned)) {
    return `+221${cleaned}`;
  }
  
  // Format avec 221 sans le '+'
  if (/^221(7[05678]|33)\d{7}$/.test(cleaned)) {
    return `+${cleaned}`;
  }
  
  // Défaut : ajouter '+' si le numéro a une longueur internationale
  if (cleaned.length >= 8) {
    return `+${cleaned}`;
  }
  
  return cleaned;
}

/**
 * Découpeur CSV robuste qui prend en compte les guillemets et séparateurs (virgule, point-virgule, tabulation)
 */
export function parseDelimitedText(text: string): { headers: string[]; rows: Record<string, string>[] } {
  // Supprimer le BOM éventuel
  const cleanText = text.replace(/^\uFEFF/, "").trim();
  if (!cleanText) return { headers: [], rows: [] };

  // Détection automatique du séparateur (virgule, point-virgule, tabulation)
  const firstLine = cleanText.split(/\r?\n/)[0];
  let separator = ",";
  if (firstLine.includes(";") && (firstLine.match(/;/g)?.length || 0) >= (firstLine.match(/,/g)?.length || 0)) {
    separator = ";";
  } else if (firstLine.includes("\t")) {
    separator = "\t";
  }

  // Découpage manuel des cellules avec prise en compte des guillemets
  const splitLine = (line: string): string[] => {
    const rowCells: string[] = [];
    let inQuotes = false;
    let currentCell = "";

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentCell += '"';
          i++; // Sauter le second guillemet échappé
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === separator && !inQuotes) {
        rowCells.push(currentCell.trim());
        currentCell = "";
      } else {
        currentCell += char;
      }
    }
    rowCells.push(currentCell.trim());
    return rowCells;
  };

  const lines = cleanText.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const rawHeaders = splitLine(lines[0]);
  const headers = rawHeaders.map(h => h.trim().toLowerCase().replace(/["']/g, ""));

  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const rawCells = splitLine(lines[i]);
    if (rawCells.length === 0 || rawCells.every(c => c === "")) continue;

    const rowObj: Record<string, string> = {};
    headers.forEach((header, idx) => {
      rowObj[header] = rawCells[idx] ? rawCells[idx].trim() : "";
    });
    rows.push(rowObj);
  }

  return { headers, rows };
}

/**
 * Nettoie une clé en supprimant accents, espaces et caractères spéciaux
 */
function cleanKey(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Supprime les accents é, è, ê, à, etc.
    .replace(/[^a-z0-9]/g, ""); // Ne conserve que l'alphanumérique
}

/**
 * Recherche une clé dans un objet de ligne en utilisant plusieurs alias possibles
 */
function findValue(row: Record<string, string>, aliases: string[]): string {
  const cleanAliases = aliases.map(cleanKey);

  // 1. Recherche par clé exacte nettoyée
  for (const rawKey of Object.keys(row)) {
    const ck = cleanKey(rawKey);
    if (cleanAliases.includes(ck) && row[rawKey] && row[rawKey].trim() !== "") {
      return row[rawKey].trim();
    }
  }

  // 2. Recherche par inclusion nettoyée
  for (const rawKey of Object.keys(row)) {
    const ck = cleanKey(rawKey);
    for (const alias of cleanAliases) {
      if ((ck.includes(alias) || alias.includes(ck)) && row[rawKey] && row[rawKey].trim() !== "") {
        return row[rawKey].trim();
      }
    }
  }

  return "";
}

/**
 * Extrait intelligemment le numéro de téléphone réel de la ligne (Google Contacts, Outlook, Apple, etc.)
 */
function extractPhoneFromRow(row: Record<string, string>): string {
  // 1. Priorité aux colonnes explicites de valeurs téléphoniques (Google Contacts, Outlook, vCard, etc.)
  const priorityPhoneHeaders = [
    "phone 1 - value", "phone 1 - val", "phone 1",
    "phone 2 - value", "phone 2",
    "phone value", "telephone 1", "tel 1", "mobile 1",
    "wa_phone", "whatsapp", "telephone", "phone", "tel", "mobile",
    "numero", "cellulaire", "portable", "contact"
  ];

  for (const pHeader of priorityPhoneHeaders) {
    const targetClean = cleanKey(pHeader);
    for (const rawKey of Object.keys(row)) {
      const ck = cleanKey(rawKey);
      // Éviter impérativement les colonnes de type label ("Phone 1 - Label", "Type", etc.)
      if (ck.includes("label") || ck.includes("type") || ck.includes("tag")) {
        continue;
      }
      if (ck === targetClean || ck.includes(targetClean)) {
        const val = (row[rawKey] || "").trim();
        const digits = val.replace(/\D/g, "");
        if (digits.length >= 7) {
          return val;
        }
      }
    }
  }

  // 2. Recherche générale par mot-clé (sans label/type) avec vérification qu'il y a des chiffres
  for (const rawKey of Object.keys(row)) {
    const ck = cleanKey(rawKey);
    if (ck.includes("label") || ck.includes("type") || ck.includes("tag")) {
      continue;
    }
    if (
      ck.includes("phone") ||
      ck.includes("tel") ||
      ck.includes("mobile") ||
      ck.includes("cell") ||
      ck.includes("numero") ||
      ck.includes("num") ||
      ck.includes("whatsapp")
    ) {
      const val = (row[rawKey] || "").trim();
      const digits = val.replace(/\D/g, "");
      if (digits.length >= 7) {
        return val;
      }
    }
  }

  // 3. Détection intelligente : balayer TOUTES les colonnes pour trouver une chaîne de 7 à 15 chiffres
  for (const rawKey of Object.keys(row)) {
    const val = (row[rawKey] || "").trim();
    const digits = val.replace(/\D/g, "");
    if (digits.length >= 8 && digits.length <= 15) {
      return val;
    }
  }

  return "";
}

/**
 * Extrait le nom complet d'un contact (Google Contacts, CSV classique, etc.)
 */
function extractNameFromRow(row: Record<string, string>, phoneFound: string): string {
  // 1. Google Contacts / Outlook : First Name + Last Name
  const firstName = findValue(row, ["first name", "firstname", "prenom", "first", "given name"]);
  const lastName = findValue(row, ["last name", "lastname", "nom de famille", "family name", "surname"]);
  if (firstName || lastName) {
    const full = [firstName, lastName].filter(Boolean).join(" ").trim();
    if (full.length > 0) return full;
  }

  // 2. Colonne Nom direct / Nom complet
  const directName = findValue(row, [
    "name", "nom", "nom complet", "fullname", "full name", "client", "prospect",
    "contact name", "contact", "display name", "file as"
  ]);
  if (directName && directName !== phoneFound && directName.toLowerCase() !== "mobile") {
    return directName;
  }

  // 3. Organisation / Société / Entreprise (très fréquent dans Google Contacts pour les pros)
  const orgName = findValue(row, ["organization name", "organization", "societe", "entreprise", "company"]);
  if (orgName && orgName.length > 1) {
    return orgName;
  }

  // 4. Fallback : première colonne texte non numérique qui ne soit pas un label
  for (const rawKey of Object.keys(row)) {
    const ck = cleanKey(rawKey);
    if (ck.includes("label") || ck.includes("photo") || ck.includes("birthday") || ck.includes("email") || ck.includes("url")) {
      continue;
    }
    const val = (row[rawKey] || "").trim();
    if (val && !/^\+?\d+$/.test(val.replace(/\s/g, "")) && val.length >= 2 && val !== phoneFound && val.toLowerCase() !== "mobile") {
      return val;
    }
  }

  return "Prospect";
}

/**
 * Mappe les lignes CSV vers des objets Contact IZI Market
 */
export function mapRowsToContacts(
  rows: Record<string, string>[]
): Array<Omit<Contact, "id" | "business_id" | "created_at" | "updated_at">> {
  const contacts: Array<Omit<Contact, "id" | "business_id" | "created_at" | "updated_at">> = [];
  const seenPhones = new Set<string>();

  for (const row of rows) {
    const rawPhone = extractPhoneFromRow(row);
    if (!rawPhone) continue; // Un numéro est indispensable pour WhatsApp

    const phone = normalizePhoneNumber(rawPhone);
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 7) continue; // Doit être un numéro valide

    // Éviter les doublons stricts au sein du même fichier d'import
    if (seenPhones.has(phone)) continue;
    seenPhones.add(phone);

    const name = extractNameFromRow(row, rawPhone);

    // Normalisation du statut
    const rawStatus = findValue(row, ["status", "statut", "etape", "pipeline"]).toLowerCase();
    let status: PipelineStatus = "nouveau";
    if (rawStatus.includes("inter") || rawStatus.includes("chaud")) status = "interesse";
    else if (rawStatus.includes("rdv") || rawStatus.includes("visit")) status = "rdv";
    else if (rawStatus.includes("negoc") || rawStatus.includes("devis")) status = "negociation";
    else if (rawStatus.includes("client") || rawStatus.includes("gagn") || rawStatus.includes("conclu")) status = "client";
    else if (rawStatus.includes("perd") || rawStatus.includes("annul")) status = "perdu";

    const need = findValue(row, ["need", "besoin", "interet", "recherche", "bien", "produit", "projet"]) || null;
    const budget = findValue(row, ["budget", "prix", "montant", "tarif"]) || null;
    const notes = findValue(row, ["notes", "commentaire", "details", "remarque", "note", "observation"]) || "Importé via fichier";

    contacts.push({
      wa_phone: phone,
      name,
      status,
      need,
      budget,
      notes,
      last_activity_at: new Date().toISOString(),
      followup_count: 0,
      followup_status: "pending"
    });
  }

  return contacts;
}

/**
 * Mappe les lignes CSV vers des objets CatalogItem (Biens / Produits)
 */
export function mapRowsToCatalog(
  rows: Record<string, string>[]
): Array<Omit<CatalogItem, "id" | "business_id" | "created_at">> {
  const items: Array<Omit<CatalogItem, "id" | "business_id" | "created_at">> = [];

  for (const row of rows) {
    const title = findValue(row, ["title", "titre", "nom", "produit", "bien", "designation", "label"]);
    if (!title) continue;

    const price = findValue(row, ["price", "prix", "loyer", "tarif", "montant"]) || "Sur demande";
    const category = findValue(row, ["category", "categorie", "type", "famille"]) || "Catalogue Général";
    const description = findValue(row, ["description", "details", "caracteristiques", "desc"]) || null;
    
    const rawAvail = findValue(row, ["available", "disponible", "dispo", "stock", "actif"]).toLowerCase();
    const available = rawAvail === "non" || rawAvail === "false" || rawAvail === "0" ? false : true;

    const imageUrl = findValue(row, ["image_url", "image", "photo", "visuel", "url"]) || null;

    items.push({
      title,
      price,
      category,
      description,
      available,
      image_url: imageUrl
    });
  }

  return items;
}

/**
 * Mappe les lignes CSV vers des FAQ IZI Market
 */
export function mapRowsToFaqs(
  rows: Record<string, string>[]
): Array<Omit<FAQ, "id" | "business_id" | "created_at">> {
  const faqs: Array<Omit<FAQ, "id" | "business_id" | "created_at">> = [];

  for (const row of rows) {
    const question = findValue(row, ["question", "demande", "q", "titre", "interrogation"]);
    const answer = findValue(row, ["answer", "reponse", "r", "explication", "reponse_ia"]);

    if (question && answer) {
      faqs.push({
        question,
        answer
      });
    }
  }

  return faqs;
}

/**
 * Génère des modèles CSV d'exemple téléchargeables
 */
export function generateCsvTemplate(type: "contacts" | "catalog" | "faq"): string {
  if (type === "contacts") {
    return `Nom,Telephone WhatsApp,Statut,Besoin Qualifie,Budget,Notes
Aminata Diallo,+221771234567,interesse,Villa 4 chambres Almadies ou Mamelles,1 500 000 FCFA,Très réactive souhaite visiter samedi prochain
Cheikh Tidiane Ndiaye,+221789876543,nouveau,Appartement F3 vue mer VDN,600 000 FCFA,Premier contact via WhatsApp
Ousmane Ba,+221763332211,rdv,Plateau de bureaux Ngor,1 200 000 FCFA,Visite programmée ce vendredi à 15h
Mariama Sarr,+221774445566,client,Studio meublé Plateau 6 mois,450 000 FCFA,Bail signé et caution réglée via Wave`;
  }

  if (type === "catalog") {
    return `Titre,Prix,Categorie,Description,Disponible
Appartement F4 Standing Almadies,850 000 FCFA / mois,Location Résidentielle,3 chambres climatisées salon lumineux terrasse vue mer groupe électrogène,true
Villa R+1 avec Piscine Mermoz,1 500 000 FCFA / mois,Location Résidentielle,4 chambres autonomes jardin piscine quartier sécurisé 24h,true
Studio Meublé Moderne Plateau,450 000 FCFA / mois,Meublé Court Séjour,Tout confort wifi fibre gardiennage idéal mission professionnelle,true
Plateau Bureaux 180m2 VDN,1 200 000 FCFA / mois,Immobilier Professionnel,Espace ouvert modulable 3 bureaux kitchenette groupe électrogène,true`;
  }

  return `Question,Reponse
Quels sont les frais d'agence pour une location ?,Nos frais d'agence s'élèvent à un mois de loyer hors charges conformément aux usages au Sénégal payable à la signature du bail.
Proposez-vous des visites le week-end ?,Oui nous organisons des visites le samedi de 09h00 à 15h00 sur rendez-vous confirmé 24h à l'avance.
Quels modes de paiement acceptez-vous ?,Nous acceptons les paiements via Wave, Orange Money, virement bancaire et chèque certifié.
Quelles sont les pièces à fournir pour le dossier ?,Une copie de votre pièce d'identité (CNI ou passeport) et vos 3 derniers justificatifs de revenus avec la caution de 2 mois.`;
}

/**
 * Déclenche le téléchargement d'un fichier CSV modèle dans le navigateur
 */
export function downloadCsvTemplate(type: "contacts" | "catalog" | "faq"): void {
  const content = generateCsvTemplate(type);
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `modele_import_izi_market_${type}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exporte l'intégralité de la base de données en fichier JSON de sauvegarde
 */
export function exportDatabaseBackup(data: {
  business: any;
  contacts: any[];
  catalog: any[];
  faqs: any[];
  appointments: any[];
}): void {
  const backupObject = {
    app: "IZI Market",
    version: "1.0",
    exported_at: new Date().toISOString(),
    ...data
  };

  const jsonStr = JSON.stringify(backupObject, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const dateStr = new Date().toISOString().split("T")[0];
  link.setAttribute("href", url);
  link.setAttribute("download", `izi_market_sauvegarde_${dateStr}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
