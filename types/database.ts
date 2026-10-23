export type PipelineStatus = 'nouveau' | 'interesse' | 'rdv' | 'negociation' | 'client' | 'perdu';
export type ConversationMode = 'ai' | 'human';
export type MessageDirection = 'in' | 'out';
export type MessageSender = 'contact' | 'ai' | 'agent';
export type AiTone = 'chaleureux' | 'professionnel' | 'direct' | 'teranga';
export type MemberRole = 'owner' | 'agent';
export type AppointmentStatus = 'confirmed' | 'cancelled' | 'completed';

export interface Business {
  id: string;
  name: string;
  sector: string | null;
  ai_enabled: boolean;
  ai_tone: AiTone;
  welcome_message: string | null;
  opening_hours: Record<string, { open: string; close: string }> | null;
  wa_phone_number_id: string | null;
  wa_access_token: string | null;
  wa_verify_status: 'unverified' | 'verified' | 'error';
  // Google Calendar Integration
  google_calendar_connected: boolean;
  google_calendar_id: string | null;
  google_calendar_email: string | null;
  google_access_token?: string | null;
  google_refresh_token?: string | null;
  google_client_id?: string | null;
  google_client_secret?: string | null;
  google_meet_enabled: boolean;
  google_appointment_link: string | null;
  default_meeting_duration: number; // minutes
  // Relance prospects inactifs (J+3)
  followup_enabled: boolean;
  followup_delay_days: number; // default: 3 days
  followup_max_attempts: number; // default: 2
  followup_mode: 'automatic' | 'manual'; // automatic ou suggestion manuelle
  followup_template: string;
  // Personnalisation du Profil Utilisateur & Marque
  owner_name?: string | null;
  owner_role?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  tagline?: string | null;
  city?: string | null;
  assistant_name?: string | null;
  brand_color?: string | null;
  currency?: string | null;
  signature?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Member {
  id: string;
  user_id: string;
  business_id: string;
  role: MemberRole;
  created_at: string;
}

export interface Contact {
  id: string;
  business_id: string;
  wa_phone: string;
  name: string | null;
  status: PipelineStatus;
  need: string | null;
  budget: string | null;
  notes: string | null;
  // Suivi d'inactivité et relances
  last_activity_at?: string;
  last_followup_at?: string | null;
  followup_count?: number;
  followup_status?: 'pending' | 'sent' | 'replied' | 'stopped';
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  business_id: string;
  contact_id: string;
  mode: ConversationMode;
  last_message_at: string;
  unread_count: number;
  created_at: string;
  contact?: Contact;
}

export interface Message {
  id: string;
  conversation_id: string;
  business_id: string;
  direction: MessageDirection;
  sender: MessageSender;
  body: string;
  wa_message_id: string | null;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  created_at: string;
}

export interface FAQ {
  id: string;
  business_id: string;
  question: string;
  answer: string;
  created_at: string;
}

export type CatalogOfferType = 'location' | 'vente' | 'autre';

export interface CatalogItem {
  id: string;
  business_id: string;
  title: string;
  price: string;
  description: string | null;
  available: boolean;
  category: string | null;
  image_url: string | null;
  images?: string[] | null;
  // Localisation et type de transaction
  offer_type?: CatalogOfferType;
  address?: string | null;
  google_maps_url?: string | null;
  created_at: string;
}

export interface Appointment {
  id: string;
  business_id: string;
  contact_id?: string | null;
  contact_name: string;
  contact_phone: string;
  title: string;
  description?: string | null;
  start_time: string; // ISO 8601
  end_time: string;   // ISO 8601
  google_event_id?: string | null;
  google_meet_link?: string | null;
  google_calendar_url?: string | null;
  status: AppointmentStatus;
  created_at: string;
  updated_at?: string;
  contact?: Contact;
}

export type QuoteStatus = 'brouillon' | 'envoye' | 'accepte' | 'refuse' | 'expire';

export interface QuoteItem {
  id: string;
  catalog_item_id?: string | null;
  description: string;
  quantity: number;
  unit_price: number; // en FCFA
  discount_percentage?: number; // % remise
  total: number; // en FCFA
}

export interface Quote {
  id: string;
  business_id: string;
  quote_number: string; // ex: DEV-2025-001
  title: string; // ex: Offre Commerciale - Villa Almadies
  contact_id?: string | null;
  contact_name: string;
  contact_phone: string;
  contact_email?: string | null;
  items: QuoteItem[];
  subtotal: number; // Total HT en FCFA
  discount_total: number; // Montant remise globale en FCFA
  tax_rate: number; // 0 ou 18% (TVA Sénégal)
  tax_amount: number; // Montant TVA
  total_amount: number; // Total TTC en FCFA
  currency: string; // "FCFA"
  status: QuoteStatus;
  valid_until: string; // ISO date
  payment_terms?: string | null; // ex: "Acompte 50% à la réservation, solde à la remise des clés"
  notes?: string | null; // Conditions et remarques
  sent_at?: string | null; // Date d'envoi WhatsApp
  accepted_at?: string | null;
  created_at: string;
  updated_at: string;
  contact?: Contact;
}

