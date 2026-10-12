-- Migration 0003 : Gestion des Devis & Offres Commerciales

-- 1. Création de la table quotes (Devis & Proformas)
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  quote_number TEXT NOT NULL,
  title TEXT NOT NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_email TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount_total NUMERIC NOT NULL DEFAULT 0,
  tax_rate NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'FCFA',
  status TEXT NOT NULL DEFAULT 'brouillon' CHECK (status IN ('brouillon', 'envoye', 'accepte', 'refuse', 'expire')),
  valid_until TIMESTAMPTZ NOT NULL,
  payment_terms TEXT,
  notes TEXT,
  sent_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_quotes_business_id ON quotes(business_id);
CREATE INDEX IF NOT EXISTS idx_quotes_contact_id ON quotes(contact_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at);

-- 2. Sécurité Row Level Security (RLS)
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view quotes of their business"
  ON quotes FOR SELECT
  USING (
    business_id IN (
      SELECT business_id FROM members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can insert quotes for their business"
  ON quotes FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can update quotes of their business"
  ON quotes FOR UPDATE
  USING (
    business_id IN (
      SELECT business_id FROM members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can delete quotes of their business"
  ON quotes FOR DELETE
  USING (
    business_id IN (
      SELECT business_id FROM members WHERE user_id = auth.uid()
    )
  );
