import { Business, Contact, Conversation, FAQ, CatalogItem, Message, Appointment, Quote } from "@/types/database";

export const INITIAL_BUSINESS: Business = {
  id: "00000000-0000-0000-0000-000000000001",
  name: "Welma Digital",
  sector: "Solutions Digitales & Services Commerciaux",
  ai_enabled: true,
  ai_tone: "teranga",
  welcome_message: "Salam Alaykoum ! Bienvenue chez Welma Digital. Comment pouvons-nous vous accompagner dans le développement de votre activité aujourd'hui ?",
  opening_hours: {
    monday: { open: "08:30", close: "18:30" },
    tuesday: { open: "08:30", close: "18:30" },
    wednesday: { open: "08:30", close: "18:30" },
    thursday: { open: "08:30", close: "18:30" },
    friday: { open: "08:30", close: "18:30" },
    saturday: { open: "09:00", close: "15:00" },
    sunday: { open: "closed", close: "closed" }
  },
  wa_phone_number_id: "",
  wa_access_token: "",
  wa_verify_status: "unverified",
  google_calendar_connected: true,
  google_calendar_id: "primary",
  google_calendar_email: "contact@welmadigital.com",
  google_meet_enabled: true,
  google_appointment_link: "https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ0...",
  default_meeting_duration: 45,
  followup_enabled: true,
  followup_delay_days: 3,
  followup_max_attempts: 2,
  followup_mode: "automatic",
  followup_template: "Salam {nom} ! J'espère que vous vous portez bien. ✨\n\nJe me permets de revenir vers vous concernant votre recherche de {besoin} chez {entreprise}. Êtes-vous toujours intéressé(e) ou souhaitez-vous qu'on planifie un appel ou une visite cette semaine ?",
  owner_name: "Responsable Commercial",
  owner_role: "Directeur Général",
  contact_email: "contact@izimarket.sn",
  contact_phone: "+221 77 000 00 00",
  tagline: "Solutions & Services Commerciaux au Sénégal",
  city: "Dakar",
  assistant_name: "Izimarket IA",
  brand_color: "emerald",
  currency: "FCFA",
  signature: "— L'équipe commerciale",
  created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
  updated_at: new Date().toISOString()
};

export const INITIAL_FAQS: FAQ[] = [
  {
    id: "faq_1",
    business_id: "00000000-0000-0000-0000-000000000001",
    question: "Quels sont les frais d'agence pour une location à Dakar ?",
    answer: "Nos frais d'agence s'élèvent à un mois de loyer hors charges, conformément aux usages légaux au Sénégal, payable à la signature du bail.",
    created_at: new Date().toISOString()
  },
  {
    id: "faq_2",
    business_id: "00000000-0000-0000-0000-000000000001",
    question: "Proposez-vous des visites le week-end ?",
    answer: "Oui, nos agents organisent des visites le samedi de 09h00 à 15h00 sur rendez-vous confirmé 24h à l'avance.",
    created_at: new Date().toISOString()
  },
  {
    id: "faq_3",
    business_id: "00000000-0000-0000-0000-000000000001",
    question: "Quelles sont les pièces à fournir pour constituer un dossier ?",
    answer: "Il vous faut : une copie de votre CNI/Passeport, vos 3 derniers bulletins de salaire ou justificatifs de revenus, ainsi que le versement de la caution (2 mois de loyer).",
    created_at: new Date().toISOString()
  },
  {
    id: "faq_4",
    business_id: "00000000-0000-0000-0000-000000000001",
    question: "Quels modes de paiement acceptez-vous ?",
    answer: "Nous acceptons les virements bancaires, chèques certifiés, ainsi que les paiements sécurisés via Wave et Orange Money.",
    created_at: new Date().toISOString()
  }
];

export const INITIAL_CATALOG: CatalogItem[] = [
  {
    id: "cat_1",
    business_id: "00000000-0000-0000-0000-000000000001",
    title: "Appartement F4 Haut Standing - Almadies",
    price: "850 000 FCFA / mois",
    description: "3 chambres climatisées avec salle d'eau privative, grand salon lumineux avec terrasse vue mer, cuisine équipée, groupe électrogène et ascenseur.",
    available: true,
    category: "Location Résidentielle",
    offer_type: "location",
    address: "Almadies, Dakar (face à la mer)",
    google_maps_url: "https://maps.google.com/?q=Almadies+Dakar",
    image_url: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=600&q=80"
    ],
    created_at: new Date().toISOString()
  },
  {
    id: "cat_2",
    business_id: "00000000-0000-0000-0000-000000000001",
    title: "Villa R+1 avec Piscine - Mermoz Pyrotechnie",
    price: "1 500 000 FCFA / mois",
    description: "4 chambres autonomes, piscine privative, jardin arboré, quartier calme et sécurisé 24h/24, garage 2 voitures.",
    available: true,
    category: "Location Résidentielle",
    offer_type: "location",
    address: "Mermoz Pyrotechnie, Dakar",
    google_maps_url: "https://maps.google.com/?q=Mermoz+Dakar",
    image_url: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80"
    ],
    created_at: new Date().toISOString()
  },
  {
    id: "cat_3",
    business_id: "00000000-0000-0000-0000-000000000001",
    title: "Studio Meublé Moderne - Plateau (Centre-ville)",
    price: "450 000 FCFA / mois",
    description: "Studio tout confort, fibre internet haut débit incluse, gardiennage 24h, idéal pour cadres ou expatriés en mission.",
    available: false,
    category: "Meublé Court/Moyen Séjour",
    offer_type: "location",
    address: "Plateau, Dakar",
    google_maps_url: "https://maps.google.com/?q=Dakar+Plateau",
    image_url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80"
    ],
    created_at: new Date().toISOString()
  },
  {
    id: "cat_4",
    business_id: "00000000-0000-0000-0000-000000000001",
    title: "Plateau de Bureaux 180 m² - VDN",
    price: "1 200 000 FCFA / mois",
    description: "Grand espace ouvert modulable, 3 bureaux de direction, kitchenette, sanitaires H/F, groupe électrogène, accès direct VDN.",
    available: true,
    category: "Immobilier Professionnel",
    offer_type: "location",
    address: "Voie de Dégagement Nord (VDN), Dakar",
    google_maps_url: "https://maps.google.com/?q=VDN+Dakar",
    image_url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80"
    ],
    created_at: new Date().toISOString()
  },
  {
    id: "cat_5",
    business_id: "00000000-0000-0000-0000-000000000001",
    title: "Villa R+2 de Prestige en Vente - Ngor Almadies",
    price: "245 000 000 FCFA",
    description: "Titre Foncier individuel, 5 suites parentales, piscine à débordement, rooftop avec vue panoramique, matériaux de luxe importés d'Italie.",
    available: true,
    category: "Vente Résidentielle",
    offer_type: "vente",
    address: "Ngor / Almadies, Dakar",
    google_maps_url: "https://maps.google.com/?q=Ngor+Almadies+Dakar",
    image_url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=600&q=80"
    ],
    created_at: new Date().toISOString()
  },
  {
    id: "cat_6",
    business_id: "00000000-0000-0000-0000-000000000001",
    title: "Terrain Viabilisé 350 m² - Saly Joseph",
    price: "28 000 000 FCFA",
    description: "Parcelle clôturée avec compteur eau et électricité déjà installés. Accès goudronné, à 5 minutes de la plage et de l'autoroute à péage.",
    available: true,
    category: "Vente Terrain & Parcelles",
    offer_type: "vente",
    address: "Saly Joseph, Mbour",
    google_maps_url: "https://maps.google.com/?q=Saly+Portudal+Senegal",
    image_url: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80"
    ],
    created_at: new Date().toISOString()
  }
];

export const INITIAL_CONTACTS: Contact[] = [
  {
    id: "cnt_1",
    business_id: "00000000-0000-0000-0000-000000000001",
    wa_phone: "+221774567890",
    name: "Moussa Diop",
    status: "rdv",
    need: "Recherche Villa F4 aux Almadies ou Mermoz",
    budget: "1 500 000 FCFA",
    notes: "Visite programmée ce samedi à 11h. Très sérieux, dossier complet.",
    created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "cnt_2",
    business_id: "00000000-0000-0000-0000-000000000001",
    wa_phone: "+221781234567",
    name: "Fatou Bintou Ndiaye",
    status: "interesse",
    need: "Appartement F3 ou F4 vue mer",
    budget: "850 000 FCFA",
    notes: "A demandé des photos de l'appartement des Almadies.",
    created_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "cnt_3",
    business_id: "00000000-0000-0000-0000-000000000001",
    wa_phone: "+221765554321",
    name: "Dr. Ousmane Sow",
    status: "negociation",
    need: "Plateau de bureaux VDN pour clinique dentaire",
    budget: "1 100 000 FCFA",
    notes: "Négociation en cours sur les frais de bail et aménagement.",
    created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "cnt_4",
    business_id: "00000000-0000-0000-0000-000000000001",
    wa_phone: "+221709876543",
    name: "Aïssatou Ba",
    status: "client",
    need: "Studio meublé Plateau pour 6 mois",
    budget: "450 000 FCFA",
    notes: "Contrat signé, caution et premier mois réglés via virement.",
    created_at: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "cnt_5",
    business_id: "00000000-0000-0000-0000-000000000001",
    wa_phone: "+221773332211",
    name: "Cheikh Tidiane Sy",
    status: "nouveau",
    need: "Recherche terrain ou maison à Ngor",
    budget: "Non communiqué",
    notes: "Premier message reçu il y a 20 minutes.",
    last_activity_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    followup_count: 0,
    followup_status: "pending",
    created_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "cnt_6",
    business_id: "00000000-0000-0000-0000-000000000001",
    wa_phone: "+221776543210",
    name: "Ibrahima Fall",
    status: "interesse",
    need: "Villa F5 avec piscine à Ngor",
    budget: "1 800 000 FCFA",
    notes: "Très intéressé mais sans nouvelle depuis 4 jours après envoi de nos offres.",
    last_activity_at: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
    followup_count: 0,
    followup_status: "pending",
    created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: "cnt_7",
    business_id: "00000000-0000-0000-0000-000000000001",
    wa_phone: "+221782223344",
    name: "Mariama Sarr",
    status: "nouveau",
    need: "Appartement 2 chambres Ouakam / Mamelles",
    budget: "600 000 FCFA",
    notes: "A demandé le catalogue il y a 3 jours, silence complet depuis.",
    last_activity_at: new Date(Date.now() - 3 * 24 * 3600 * 1000 - 3 * 3600 * 1000).toISOString(),
    followup_count: 0,
    followup_status: "pending",
    created_at: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 24 * 3600 * 1000 - 3 * 3600 * 1000).toISOString()
  }
];

export const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: "conv_1",
    business_id: "00000000-0000-0000-0000-000000000001",
    contact_id: "cnt_1",
    mode: "human",
    last_message_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    unread_count: 0,
    created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    contact: INITIAL_CONTACTS[0]
  },
  {
    id: "conv_2",
    business_id: "00000000-0000-0000-0000-000000000001",
    contact_id: "cnt_2",
    mode: "ai",
    last_message_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    unread_count: 1,
    created_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    contact: INITIAL_CONTACTS[1]
  },
  {
    id: "conv_3",
    business_id: "00000000-0000-0000-0000-000000000001",
    contact_id: "cnt_3",
    mode: "human",
    last_message_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    unread_count: 0,
    created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    contact: INITIAL_CONTACTS[2]
  },
  {
    id: "conv_4",
    business_id: "00000000-0000-0000-0000-000000000001",
    contact_id: "cnt_5",
    mode: "ai",
    last_message_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    unread_count: 2,
    created_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    contact: INITIAL_CONTACTS[4]
  },
  {
    id: "conv_6",
    business_id: "00000000-0000-0000-0000-000000000001",
    contact_id: "cnt_6",
    mode: "ai",
    last_message_at: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
    unread_count: 0,
    created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: "conv_7",
    business_id: "00000000-0000-0000-0000-000000000001",
    contact_id: "cnt_7",
    mode: "ai",
    last_message_at: new Date(Date.now() - 3 * 24 * 3600 * 1000 - 3 * 3600 * 1000).toISOString(),
    unread_count: 0,
    created_at: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString()
  }
];

export const INITIAL_MESSAGES: Message[] = [
  // Conversation 1 (Moussa Diop - Handoff humain)
  {
    id: "m_1",
    conversation_id: "conv_1",
    business_id: "00000000-0000-0000-0000-000000000001",
    direction: "in",
    sender: "contact",
    body: "Salam alaykoum, je cherche une villa avec piscine à louer à Mermoz pour ma famille. Est-ce que vous en avez de disponible ?",
    wa_message_id: "wa_msg_001",
    status: "read",
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
  },
  {
    id: "m_2",
    conversation_id: "conv_1",
    business_id: "00000000-0000-0000-0000-000000000001",
    direction: "out",
    sender: "ai",
    body: "Wa Alaykoum Salam M. Diop ! Bienvenue chez Welma Digital 🌿\n\nOui, nous avons une splendide *Villa R+1 avec Piscine à Mermoz Pyrotechnie* :\n✨ 4 chambres avec salles de bain privatives\n🏊 Piscine et jardin arboré\n💰 1 500 000 FCFA / mois\n\nSouhaitez-vous planifier une visite sur place ?",
    wa_message_id: "wa_msg_002",
    status: "read",
    created_at: new Date(Date.now() - 2 * 3600 * 1000 + 30000).toISOString()
  },
  {
    id: "m_3",
    conversation_id: "conv_1",
    business_id: "00000000-0000-0000-0000-000000000001",
    direction: "in",
    sender: "contact",
    body: "Parfait ! Est-il possible de visiter ce samedi matin à 11h avec mon épouse ? J'aimerais aussi négocier un peu le montant de la caution.",
    wa_message_id: "wa_msg_003",
    status: "read",
    created_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString()
  },
  {
    id: "m_4",
    conversation_id: "conv_1",
    business_id: "00000000-0000-0000-0000-000000000001",
    direction: "out",
    sender: "agent",
    body: "Bonjour M. Diop, ici Mamadou de chez Welma Digital. C'est noté pour ce samedi à 11h00 précises ! Je vous envoie la géolocalisation exacte. Concernant la caution, nous pourrons en échanger ensemble lors de la visite.",
    wa_message_id: "wa_msg_004",
    status: "delivered",
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString()
  },

  // Conversation 2 (Fatou Bintou Ndiaye - Mode IA actif)
  {
    id: "m_5",
    conversation_id: "conv_2",
    business_id: "00000000-0000-0000-0000-000000000001",
    direction: "in",
    sender: "contact",
    body: "Bonjour, avez-vous des appartements vers les Almadies avec vue mer et 3 chambres ?",
    wa_message_id: "wa_msg_005",
    status: "read",
    created_at: new Date(Date.now() - 50 * 60 * 1000).toISOString()
  },
  {
    id: "m_6",
    conversation_id: "conv_2",
    business_id: "00000000-0000-0000-0000-000000000001",
    direction: "out",
    sender: "ai",
    body: "Bonjour Madame ! C'est un réel plaisir de vous renseigner ✨\n\nNous avons précisément l'*Appartement F4 Haut Standing aux Almadies* :\n🌊 Grand balcon avec magnifique vue mer\n🛏️ 3 chambres climatisées autonomes\n⚡ Groupe électrogène et ascenseur 24h/24\n💰 Prix : 850 000 FCFA / mois\n\nQuel est votre délai pour emménager ?",
    wa_message_id: "wa_msg_006",
    status: "read",
    created_at: new Date(Date.now() - 48 * 60 * 1000).toISOString()
  },
  {
    id: "m_7",
    conversation_id: "conv_2",
    business_id: "00000000-0000-0000-0000-000000000001",
    direction: "in",
    sender: "contact",
    body: "Mon budget est d'environ 800 000 à 850 000 FCFA. Pouvez-vous me dire quels sont les frais d'agence ?",
    wa_message_id: "wa_msg_007",
    status: "delivered",
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString()
  },

  // Conversation 6 (Ibrahima Fall - Inactif depuis 4 jours après proposition)
  {
    id: "m_60",
    conversation_id: "conv_6",
    business_id: "00000000-0000-0000-0000-000000000001",
    direction: "in",
    sender: "contact",
    body: "Salam, je cherche une villa avec piscine à Ngor pour un budget de 1.8M max.",
    wa_message_id: "wa_msg_060",
    status: "read",
    created_at: new Date(Date.now() - 4 * 24 * 3600 * 1000 - 3600 * 1000).toISOString()
  },
  {
    id: "m_61",
    conversation_id: "conv_6",
    business_id: "00000000-0000-0000-0000-000000000001",
    direction: "out",
    sender: "ai",
    body: "Wa Alaykoum Salam M. Fall ! Nous avons deux très belles villas à Ngor correspondant parfaitement à votre recherche de 1.8M FCFA avec piscine. Souhaitez-vous recevoir les fiches complètes ou convenir d'une visite ?",
    wa_message_id: "wa_msg_061",
    status: "delivered",
    created_at: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString()
  },

  // Conversation 7 (Mariama Sarr - Inactive depuis 3 jours)
  {
    id: "m_70",
    conversation_id: "conv_7",
    business_id: "00000000-0000-0000-0000-000000000001",
    direction: "in",
    sender: "contact",
    body: "Bonjour, avez-vous des F3 vers Ouakam ou Mamelles à 600 000 FCFA ?",
    wa_message_id: "wa_msg_070",
    status: "read",
    created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000 - 4 * 3600 * 1000).toISOString()
  },
  {
    id: "m_71",
    conversation_id: "conv_7",
    business_id: "00000000-0000-0000-0000-000000000001",
    direction: "out",
    sender: "ai",
    body: "Bonjour Mme Sarr ! Oui, nous avons un très joli F3 refait à neuf aux Mamelles à 600 000 FCFA / mois. Seriez-vous disponible pour une visite cette semaine ?",
    wa_message_id: "wa_msg_071",
    status: "delivered",
    created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000 - 3 * 3600 * 1000).toISOString()
  }
];

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: "appt_1",
    business_id: "00000000-0000-0000-0000-000000000001",
    contact_id: "cnt_1",
    contact_name: "Ibrahima Diop",
    contact_phone: "+221 77 123 45 67",
    title: "Visite Villa R+1 avec Piscine aux Almadies",
    description: "Visite présentielle du bien avec le responsable des ventes. Prospect très intéressé (Budget 1 800 000 FCFA/mois).",
    start_time: new Date(Date.now() + 4 * 3600 * 1000).toISOString(), // Aujourd'hui dans 4h
    end_time: new Date(Date.now() + 4.75 * 3600 * 1000).toISOString(),
    google_event_id: "g_evt_001",
    google_meet_link: "https://meet.google.com/izi-almd-vis",
    google_calendar_url: "https://calendar.google.com/calendar/event?eid=aXppX2FsbWRfdmlzXzAwMQ",
    status: "confirmed",
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
  },
  {
    id: "appt_2",
    business_id: "00000000-0000-0000-0000-000000000001",
    contact_id: "cnt_2",
    contact_name: "Fatou Bintou Ndiaye",
    contact_phone: "+221 78 987 65 43",
    title: "Visite & Échange Dossier - F4 Almadies Vue Mer",
    description: "Présentation des finitions et des modalités de bail pour le F4 à 850 000 FCFA/mois. Rendez-vous Google Meet + confirmation WhatsApp.",
    start_time: new Date(Date.now() + 26 * 3600 * 1000).toISOString(), // Demain
    end_time: new Date(Date.now() + 26.75 * 3600 * 1000).toISOString(),
    google_event_id: "g_evt_002",
    google_meet_link: "https://meet.google.com/izi-fatou-ndiaye",
    google_calendar_url: "https://calendar.google.com/calendar/event?eid=aXppX2ZhdG91X25kaWF5ZQ",
    status: "confirmed",
    created_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString()
  },
  {
    id: "appt_3",
    business_id: "00000000-0000-0000-0000-000000000001",
    contact_id: "cnt_3",
    contact_name: "Cheikh Tidiane Fall",
    contact_phone: "+221 70 555 44 33",
    title: "Visite Terrain 500m² - Ngor Virage",
    description: "Visite sur site avec géomètre et conseiller commercial. Budget 95 000 000 FCFA.",
    start_time: new Date(Date.now() + 72 * 3600 * 1000).toISOString(), // Dans 3 jours
    end_time: new Date(Date.now() + 73 * 3600 * 1000).toISOString(),
    google_event_id: "g_evt_003",
    google_meet_link: "https://meet.google.com/izi-terrain-ngor",
    google_calendar_url: "https://calendar.google.com/calendar/event?eid=aXppX3RlcnJhaW5fbmdvcg",
    status: "confirmed",
    created_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString()
  }
];

export const INITIAL_QUOTES: Quote[] = [
  {
    id: "quote_1",
    business_id: "00000000-0000-0000-0000-000000000001",
    quote_number: "DEV-2025-001",
    title: "Location F4 Haut Standing Almadies (Bail 1 an)",
    contact_id: "cnt_1",
    contact_name: "Moussa Diop",
    contact_phone: "+221 77 456 78 90",
    contact_email: "moussa.diop@orange-sonatel.sn",
    items: [
      {
        id: "qi_1",
        catalog_item_id: "cat_1",
        description: "Loyer mensuel F4 Haut Standing Almadies (1er mois)",
        quantity: 1,
        unit_price: 850000,
        discount_percentage: 0,
        total: 850000
      },
      {
        id: "qi_2",
        description: "Caution de garantie locative (2 mois de loyer)",
        quantity: 1,
        unit_price: 1700000,
        discount_percentage: 0,
        total: 1700000
      },
      {
        id: "qi_3",
        description: "Honoraires d'agence et rédaction de bail",
        quantity: 1,
        unit_price: 850000,
        discount_percentage: 0,
        total: 850000
      }
    ],
    subtotal: 3400000,
    discount_total: 100000,
    tax_rate: 0,
    tax_amount: 0,
    total_amount: 3300000,
    currency: "FCFA",
    status: "accepte",
    valid_until: new Date(Date.now() + 15 * 24 * 3600 * 1000).toISOString(),
    payment_terms: "Acompte 50% par virement bancaire ou Wave à la signature, solde à la remise des clés.",
    notes: "Dossier locataire validé. Remise exceptionnelle de 100 000 FCFA accordée sur les frais d'agence.",
    sent_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    accepted_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: "quote_2",
    business_id: "00000000-0000-0000-0000-000000000001",
    quote_number: "DEV-2025-002",
    title: "Offre Locative - Villa R+1 avec Piscine Mermoz",
    contact_id: "cnt_2",
    contact_name: "Fatou Bintou Ndiaye",
    contact_phone: "+221 78 987 65 43",
    contact_email: "fatou.bintou@ecobank.sn",
    items: [
      {
        id: "qi_4",
        catalog_item_id: "cat_2",
        description: "Loyer mensuel Villa R+1 avec Piscine (1er mois)",
        quantity: 1,
        unit_price: 1500000,
        discount_percentage: 0,
        total: 1500000
      },
      {
        id: "qi_5",
        description: "Dépôt de garantie (2 mois de loyer)",
        quantity: 1,
        unit_price: 3000000,
        discount_percentage: 0,
        total: 3000000
      },
      {
        id: "qi_6",
        description: "Forfait pisciniste et entretien jardinier (1er mois inclus)",
        quantity: 1,
        unit_price: 150000,
        discount_percentage: 0,
        total: 150000
      }
    ],
    subtotal: 4650000,
    discount_total: 0,
    tax_rate: 0,
    tax_amount: 0,
    total_amount: 4650000,
    currency: "FCFA",
    status: "envoye",
    valid_until: new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString(),
    payment_terms: "Paiement par virement bancaire ou chèque certifié.",
    notes: "Visite effectuée le 10/10. En attente de signature définitive du garant.",
    sent_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString()
  },
  {
    id: "quote_3",
    business_id: "00000000-0000-0000-0000-000000000001",
    quote_number: "DEV-2025-003",
    title: "Bail Commercial - Plateau de Bureaux 180 m² VDN",
    contact_id: "cnt_3",
    contact_name: "Cheikh Tidiane Fall",
    contact_phone: "+221 70 555 44 33",
    contact_email: "contact@tech-dakar.com",
    items: [
      {
        id: "qi_7",
        catalog_item_id: "cat_4",
        description: "Loyer mensuel Bureaux 180 m² VDN",
        quantity: 1,
        unit_price: 1200000,
        discount_percentage: 0,
        total: 1200000
      },
      {
        id: "qi_8",
        description: "Provisions sur charges (gardiennage, ascenseur, groupe électrogène)",
        quantity: 1,
        unit_price: 180000,
        discount_percentage: 0,
        total: 180000
      },
      {
        id: "qi_9",
        description: "Caution de garantie commerciale (2 mois)",
        quantity: 1,
        unit_price: 2400000,
        discount_percentage: 0,
        total: 2400000
      }
    ],
    subtotal: 3780000,
    discount_total: 0,
    tax_rate: 18,
    tax_amount: 680400,
    total_amount: 4460400,
    currency: "FCFA",
    status: "brouillon",
    valid_until: new Date(Date.now() + 20 * 24 * 3600 * 1000).toISOString(),
    payment_terms: "Virement bancaire d'entreprise. Facture avec TVA 18% déductible.",
    notes: "Bail commercial 3/6/9 avec possibilité d'aménagement personnalisé avant entrée.",
    created_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString()
  },
  {
    id: "quote_4",
    business_id: "00000000-0000-0000-0000-000000000001",
    quote_number: "DEV-2025-004",
    title: "Location Meublée 3 mois - Studio Plateau",
    contact_id: "cnt_4",
    contact_name: "Aminata Sow",
    contact_phone: "+221 77 333 22 11",
    contact_email: "a.sow@ngo-westafrica.org",
    items: [
      {
        id: "qi_10",
        catalog_item_id: "cat_3",
        description: "Forfait hébergement studio meublé Plateau (3 mois)",
        quantity: 3,
        unit_price: 450000,
        discount_percentage: 0,
        total: 1350000
      },
      {
        id: "qi_11",
        description: "Dépôt de garantie meublé (restituable)",
        quantity: 1,
        unit_price: 450000,
        discount_percentage: 0,
        total: 450000
      },
      {
        id: "qi_12",
        description: "Pack services tout compris (Ménage bi-hebdomadaire, Wi-Fi Fibre, Eau/Élec)",
        quantity: 1,
        unit_price: 75000,
        discount_percentage: 0,
        total: 75000
      }
    ],
    subtotal: 1875000,
    discount_total: 75000,
    tax_rate: 0,
    tax_amount: 0,
    total_amount: 1800000,
    currency: "FCFA",
    status: "envoye",
    valid_until: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    payment_terms: "Paiement en ligne sécurisé via Wave, Orange Money ou carte bancaire.",
    notes: "Remise spéciale de 75 000 FCFA offerte sur le pack services.",
    sent_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString()
  }
];

