-- Migration 0002 : Intégration Google Agenda & Rendez-vous

-- 1. Ajout des colonnes Google Calendar à la table businesses
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS google_calendar_connected BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS google_calendar_id TEXT DEFAULT 'primary',
ADD COLUMN IF NOT EXISTS google_calendar_email TEXT,
ADD COLUMN IF NOT EXISTS google_access_token TEXT,
ADD COLUMN IF NOT EXISTS google_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS google_meet_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS google_appointment_link TEXT,
ADD COLUMN IF NOT EXISTS default_meeting_duration INTEGER DEFAULT 45;

-- 2. Création de la table appointments (Rendez-vous)
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  google_event_id TEXT,
  google_meet_link TEXT,
  google_calendar_url TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index pour performances de recherche et tri
CREATE INDEX IF NOT EXISTS idx_appointments_business_id ON appointments(business_id);
CREATE INDEX IF NOT EXISTS idx_appointments_contact_id ON appointments(contact_id);
CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- 3. Sécurité Row Level Security (RLS)
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view appointments of their business"
  ON appointments FOR SELECT
  USING (
    business_id IN (
      SELECT business_id FROM members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can insert appointments for their business"
  ON appointments FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can update appointments of their business"
  ON appointments FOR UPDATE
  USING (
    business_id IN (
      SELECT business_id FROM members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can delete appointments of their business"
  ON appointments FOR DELETE
  USING (
    business_id IN (
      SELECT business_id FROM members WHERE user_id = auth.uid()
    )
  );

-- 4. Publication Realtime pour synchronisation en direct
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'appointments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
  END IF;
END $$;
