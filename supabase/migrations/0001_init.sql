-- =========================================================
-- IZI Market — Migration Initiale Supabase (0001_init.sql)
-- Assistant commercial WhatsApp SaaS pour PME africaines
-- =========================================================

-- Extension pgcrypto pour UUIDs si non activée
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Table: businesses
CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    sector TEXT,
    ai_enabled BOOLEAN DEFAULT true NOT NULL,
    ai_tone TEXT DEFAULT 'chaleureux' NOT NULL, -- 'chaleureux', 'professionnel', 'direct', 'teranga'
    welcome_message TEXT DEFAULT 'Bonjour ! Bienvenue chez nous. Comment puis-je vous aider aujourd''hui ?',
    opening_hours JSONB DEFAULT '{"monday":{"open":"08:30","close":"18:30"},"tuesday":{"open":"08:30","close":"18:30"},"wednesday":{"open":"08:30","close":"18:30"},"thursday":{"open":"08:30","close":"18:30"},"friday":{"open":"08:30","close":"18:30"},"saturday":{"open":"09:00","close":"15:00"},"sunday":{"open":"closed","close":"closed"}}'::jsonb,
    wa_phone_number_id TEXT,
    wa_access_token TEXT, -- Token Meta WhatsApp (accès serveur sécurisé)
    wa_verify_status TEXT DEFAULT 'unverified' NOT NULL, -- 'unverified', 'verified', 'error'
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Table: members
CREATE TABLE IF NOT EXISTS public.members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'owner' NOT NULL, -- 'owner', 'agent'
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(user_id, business_id)
);

-- Index pour accélérer les jointures RLS
CREATE INDEX IF NOT EXISTS idx_members_user_id ON public.members(user_id);
CREATE INDEX IF NOT EXISTS idx_members_business_id ON public.members(business_id);

-- 3. Table: contacts (Prospects / Clients)
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    wa_phone TEXT NOT NULL,
    name TEXT,
    status TEXT DEFAULT 'nouveau' NOT NULL, -- 'nouveau', 'interesse', 'rdv', 'negociation', 'client', 'perdu'
    need TEXT,
    budget TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(business_id, wa_phone)
);

CREATE INDEX IF NOT EXISTS idx_contacts_business_id ON public.contacts(business_id);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON public.contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_wa_phone ON public.contacts(wa_phone);

-- 4. Table: conversations
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    mode TEXT DEFAULT 'ai' NOT NULL, -- 'ai', 'human'
    last_message_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    unread_count INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(business_id, contact_id)
);

CREATE INDEX IF NOT EXISTS idx_conversations_business_id ON public.conversations(business_id);
CREATE INDEX IF NOT EXISTS idx_conversations_contact_id ON public.conversations(contact_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON public.conversations(last_message_at DESC);

-- 5. Table: messages
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    direction TEXT NOT NULL, -- 'in', 'out'
    sender TEXT NOT NULL,    -- 'contact', 'ai', 'agent'
    body TEXT NOT NULL,
    wa_message_id TEXT UNIQUE, -- Anti-doublons Meta WhatsApp
    status TEXT DEFAULT 'delivered' NOT NULL, -- 'sent', 'delivered', 'read', 'failed'
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_business_id ON public.messages(business_id);
CREATE INDEX IF NOT EXISTS idx_messages_wa_id ON public.messages(wa_message_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- 6. Table: faqs (Base de connaissances - FAQ)
CREATE TABLE IF NOT EXISTS public.faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_faqs_business_id ON public.faqs(business_id);

-- 7. Table: catalog_items (Catalogue de biens ou produits)
CREATE TABLE IF NOT EXISTS public.catalog_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    price TEXT NOT NULL,
    description TEXT,
    available BOOLEAN DEFAULT true NOT NULL,
    category TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_catalog_business_id ON public.catalog_items(business_id);

-- =========================================================
-- SÉCURITÉ ROW LEVEL SECURITY (RLS)
-- =========================================================

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;

-- Helper fonction pour vérifier l'appartenance à un business
CREATE OR REPLACE FUNCTION public.is_business_member(p_business_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.members
    WHERE business_id = p_business_id
      AND user_id = auth.uid()
  );
$$;

-- RLS: businesses
CREATE POLICY "Users can view businesses they belong to"
    ON public.businesses FOR SELECT
    USING (id IN (SELECT business_id FROM public.members WHERE user_id = auth.uid()));

CREATE POLICY "Owners can update their businesses"
    ON public.businesses FOR UPDATE
    USING (id IN (SELECT business_id FROM public.members WHERE user_id = auth.uid() AND role = 'owner'));

CREATE POLICY "Users can insert business during onboarding"
    ON public.businesses FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- RLS: members
CREATE POLICY "Members can view other members of same business"
    ON public.members FOR SELECT
    USING (business_id IN (SELECT b.business_id FROM public.members b WHERE b.user_id = auth.uid()));

CREATE POLICY "Users can add themselves to a business"
    ON public.members FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owners can manage members"
    ON public.members FOR ALL
    USING (business_id IN (SELECT b.business_id FROM public.members b WHERE b.user_id = auth.uid() AND b.role = 'owner'));

-- RLS: contacts
CREATE POLICY "Business members can manage contacts"
    ON public.contacts FOR ALL
    USING (public.is_business_member(business_id))
    WITH CHECK (public.is_business_member(business_id));

-- RLS: conversations
CREATE POLICY "Business members can manage conversations"
    ON public.conversations FOR ALL
    USING (public.is_business_member(business_id))
    WITH CHECK (public.is_business_member(business_id));

-- RLS: messages
CREATE POLICY "Business members can manage messages"
    ON public.messages FOR ALL
    USING (public.is_business_member(business_id))
    WITH CHECK (public.is_business_member(business_id));

-- RLS: faqs
CREATE POLICY "Business members can manage faqs"
    ON public.faqs FOR ALL
    USING (public.is_business_member(business_id))
    WITH CHECK (public.is_business_member(business_id));

-- RLS: catalog_items
CREATE POLICY "Business members can manage catalog"
    ON public.catalog_items FOR ALL
    USING (public.is_business_member(business_id))
    WITH CHECK (public.is_business_member(business_id));

-- Publication pour Supabase Realtime (messages & conversations)
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contacts;
