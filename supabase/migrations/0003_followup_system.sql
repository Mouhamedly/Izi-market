-- Migration 0003: Système de relance automatique des prospects inactifs (J+3)
-- Permet de relancer les prospects qui n'ont pas donné de retour après 3 jours sur WhatsApp

-- 1. Ajout des colonnes de relance dans la table businesses
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS followup_enabled BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS followup_delay_days INTEGER NOT NULL DEFAULT 3,
ADD COLUMN IF NOT EXISTS followup_max_attempts INTEGER NOT NULL DEFAULT 2,
ADD COLUMN IF NOT EXISTS followup_mode TEXT NOT NULL DEFAULT 'automatic',
ADD COLUMN IF NOT EXISTS followup_template TEXT NOT NULL DEFAULT 'Salam {nom} ! J''espère que vous allez bien. Je me permets de revenir vers vous concernant votre recherche de {besoin} chez {entreprise}. Êtes-vous toujours intéressé(e) ou souhaitez-vous qu''on planifie un appel/visite cette semaine ?';

-- 2. Ajout des colonnes de suivi de relance dans la table contacts
ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS last_followup_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS followup_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS followup_status TEXT NOT NULL DEFAULT 'pending';

-- 3. Index pour optimiser les requêtes des prospects inactifs à relancer
CREATE INDEX IF NOT EXISTS idx_contacts_followup_filter 
ON contacts(business_id, status, last_activity_at, followup_count)
WHERE status NOT IN ('client', 'perdu');
