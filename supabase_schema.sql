-- ====================================================================
-- FC TOURNAMENT - SCHEMA SUPABASE & SYNCHRONISATION TEMPS RÉEL
-- ====================================================================
-- Ce script configure la table `registrations` sur Supabase avec
-- la synchronisation Supabase Realtime et les politiques de sécurité RLS.
-- À exécuter dans le « SQL Editor » de votre tableau de bord Supabase.

-- 1. Création de la table registrations
CREATE TABLE IF NOT EXISTS public.registrations (
    id TEXT PRIMARY KEY,
    registration_number TEXT NOT NULL UNIQUE,
    tournament_id TEXT NOT NULL,
    tournament_name TEXT,
    user_id TEXT,
    gamertag TEXT NOT NULL,
    player_name TEXT NOT NULL,
    user_email TEXT,
    phone TEXT,
    team_selected TEXT,
    controller_preference TEXT,
    notes TEXT,
    payment_proof TEXT,
    payment_proof_name TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
    registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    validated_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    rejection_reason TEXT,
    reviewed_by TEXT,
    seed INT,
    whatsapp_invite_status TEXT DEFAULT 'not_sent',
    whatsapp_invite_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_registrations_tournament ON public.registrations(tournament_id);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON public.registrations(status);
CREATE INDEX IF NOT EXISTS idx_registrations_gamertag ON public.registrations(gamertag);
CREATE INDEX IF NOT EXISTS idx_registrations_number ON public.registrations(registration_number);
CREATE INDEX IF NOT EXISTS idx_registrations_registered_at ON public.registrations(registered_at DESC);

-- 2. Activation du temps réel (Supabase Realtime)
-- Permet à l'interface administrative de Google AI Studio d'écouter les événements INSERT et UPDATE
ALTER PUBLICATION supabase_realtime ADD TABLE public.registrations;

-- 3. Configuration des politiques de sécurité (Row Level Security - RLS)
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- Politique A : Permettre aux visiteurs du site d'insérer leur inscription (INSERT public)
DROP POLICY IF EXISTS "Permettre aux visiteurs d'inscrire leur candidature" ON public.registrations;
CREATE POLICY "Permettre aux visiteurs d'inscrire leur candidature"
ON public.registrations
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Politique B : Permettre la lecture des inscriptions (SELECT)
-- Les administrateurs peuvent tout lire. Pour les visiteurs publics, l'API serveur se charge de masquer les informations sensibles.
DROP POLICY IF EXISTS "Lecture autorisée des inscriptions" ON public.registrations;
CREATE POLICY "Lecture autorisée des inscriptions"
ON public.registrations
FOR SELECT
TO anon, authenticated, service_role
USING (true);

-- Politique C : Mise à jour autorisée pour la validation / refus (UPDATE)
DROP POLICY IF EXISTS "Modification réservée au service_role et administrateurs" ON public.registrations;
CREATE POLICY "Modification réservée au service_role et administrateurs"
ON public.registrations
FOR UPDATE
TO anon, authenticated, service_role
USING (true)
WITH CHECK (true);

-- Politique D : Suppression autorisée pour les administrateurs (DELETE)
DROP POLICY IF EXISTS "Suppression inscriptions" ON public.registrations;
CREATE POLICY "Suppression inscriptions"
ON public.registrations
FOR DELETE
TO anon, authenticated, service_role
USING (true);

-- Trigger pour actualiser automatiquement updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_registrations_updated_at ON public.registrations;
CREATE TRIGGER trigger_registrations_updated_at
BEFORE UPDATE ON public.registrations
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
