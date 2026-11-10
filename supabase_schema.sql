-- ====================================================================
-- FC TOURNAMENT (FCT) - SCHÉMA OFFICIEL & SÉCURISÉ SUPABASE (v3.0)
-- ====================================================================
-- Ce script configure l'infrastructure DDL et les règles de sécurité RLS
-- pour FC TOURNAMENT dans l'Éditeur SQL de Supabase.
--
-- GARANTIES DU SCRIPT v3.0 :
-- 1. Zéro écrasement : Ce script ne contient AUCUNE insertion de données brutes.
--    Vos données de production (statuts, preuves, dates) restent 100% intactes.
-- 2. Confidentialité totale : AUCUN accès (SELECT, INSERT, UPDATE, DELETE) n'est
--    accordé aux rôles publics 'anon' ou 'authenticated' sur 'registrations'.
--    Toutes les inscriptions sont gérées exclusivement par le backend Hostinger
--    avec la clé SUPABASE_SERVICE_ROLE_KEY.
-- 3. Idempotence absolue : Le script peut être réexécuté sans risque d'erreur ni
--    d'interruption de service (IF NOT EXISTS + ADD COLUMN IF NOT EXISTS).
-- 4. Protection relationnelle : Clé étrangère configurée avec ON DELETE RESTRICT
--    pour empêcher la suppression accidentelle d'un tournoi ayant des inscrits.
-- 5. Intégrité : Aucun DROP TABLE, aucun TRUNCATE, aucun DELETE.
-- ====================================================================

-- ####################################################################
-- SECTION 1 : STRUCTURE DES TABLES & MIGRATION DES COLONNES
-- ####################################################################

-- 1.1 TABLE DES TOURNOIS (tournaments)
CREATE TABLE IF NOT EXISTS public.tournaments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    game_version TEXT DEFAULT 'EA SPORTS 27',
    platform TEXT DEFAULT 'e-Football',
    format TEXT DEFAULT 'aller_retour',
    location TEXT,
    city TEXT,
    start_date DATE,
    time TEXT,
    registration_deadline TIMESTAMPTZ,
    max_participants INT NOT NULL DEFAULT 32,
    entry_fee_mad INT NOT NULL DEFAULT 50,
    prize_pool TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('upcoming', 'open', 'ongoing', 'completed', 'cancelled')),
    rules TEXT,
    banner_image TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Si la table tournaments existait déjà, vérification et ajout sans risque des colonnes manquantes
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS game_version TEXT DEFAULT 'EA SPORTS 27';
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'e-Football';
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS format TEXT DEFAULT 'aller_retour';
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS time TEXT;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS registration_deadline TIMESTAMPTZ;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS max_participants INT DEFAULT 32;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS entry_fee_mad INT DEFAULT 50;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS prize_pool TEXT;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open';
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS rules TEXT;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS banner_image TEXT;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Index pour la table tournaments
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON public.tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_slug ON public.tournaments(slug);


-- 1.2 TABLE DES INSCRIPTIONS (registrations)
CREATE TABLE IF NOT EXISTS public.registrations (
    id TEXT PRIMARY KEY,
    registration_number TEXT NOT NULL UNIQUE,
    tournament_id TEXT NOT NULL REFERENCES public.tournaments(id) ON DELETE RESTRICT,
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
    whatsapp_invite_status TEXT DEFAULT 'not_sent' CHECK (whatsapp_invite_status IN ('not_sent', 'sent', 'failed')),
    whatsapp_invite_sent_at TIMESTAMPTZ,
    whatsapp_invite_error TEXT,
    whatsapp_invite_attempts INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_registrations_tournament_gamertag UNIQUE (tournament_id, gamertag)
);

-- Si la table registrations existait déjà, vérification et ajout sans risque des colonnes manquantes
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS registration_number TEXT;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS tournament_name TEXT;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS user_email TEXT;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS team_selected TEXT;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS controller_preference TEXT;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS payment_proof TEXT;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS payment_proof_name TEXT;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS registered_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS validated_at TIMESTAMPTZ;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS reviewed_by TEXT;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS seed INT;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS whatsapp_invite_status TEXT DEFAULT 'not_sent';
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS whatsapp_invite_sent_at TIMESTAMPTZ;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS whatsapp_invite_error TEXT;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS whatsapp_invite_attempts INT DEFAULT 0;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Index pour la recherche rapide et l'intégrité
CREATE INDEX IF NOT EXISTS idx_registrations_tournament_id ON public.registrations(tournament_id);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON public.registrations(status);
CREATE INDEX IF NOT EXISTS idx_registrations_gamertag ON public.registrations(gamertag);
CREATE INDEX IF NOT EXISTS idx_registrations_email ON public.registrations(user_email);
CREATE INDEX IF NOT EXISTS idx_registrations_number ON public.registrations(registration_number);
CREATE INDEX IF NOT EXISTS idx_registrations_registered_at ON public.registrations(registered_at DESC);


-- 1.3 FONCTION ET TRIGGERS AUTOMATIQUES POUR UPDATED_AT
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_tournaments_updated_at ON public.tournaments;
CREATE TRIGGER trigger_tournaments_updated_at
BEFORE UPDATE ON public.tournaments
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_registrations_updated_at ON public.registrations;
CREATE TRIGGER trigger_registrations_updated_at
BEFORE UPDATE ON public.registrations
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();


-- ####################################################################
-- SECTION 2 : CONTRÔLE D'ACCÈS POSTGRESQL & POLITIQUES RLS (SÉCURITÉ MAXIMALE)
-- ####################################################################

-- Activation obligatoire du Row Level Security (RLS)
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- 2.1 PERMISSIONS FONDAMENTALES (GRANT / REVOKE)
-- Révocation totale de tous les accès sur la table 'registrations' pour les rôles publics
REVOKE ALL ON public.registrations FROM anon, authenticated;

-- Seul le rôle d'administration 'service_role' (utilisé par le backend Hostinger) possède l'accès complet
GRANT ALL ON public.registrations TO service_role;

-- La table des tournois est accessible en lecture pour tous, et en modification pour le backend
GRANT SELECT ON public.tournaments TO anon, authenticated, service_role;
GRANT ALL ON public.tournaments TO service_role;


-- 2.2 POLITIQUES RLS SUR LA TABLE DES TOURNOIS (tournaments)
DROP POLICY IF EXISTS "Lecture publique des tournois" ON public.tournaments;
CREATE POLICY "Lecture publique des tournois"
ON public.tournaments FOR SELECT
TO anon, authenticated, service_role
USING (true);

DROP POLICY IF EXISTS "Gestion complete tournois service_role" ON public.tournaments;
CREATE POLICY "Gestion complete tournois service_role"
ON public.tournaments FOR ALL
TO service_role
USING (true)
WITH CHECK (true);


-- 2.3 POLITIQUES RLS SUR LA TABLE DES INSCRIPTIONS (registrations)
-- Nettoyage de toute ancienne politique potentiellement laxiste
DROP POLICY IF EXISTS "Lecture publique des inscriptions approuvees" ON public.registrations;
DROP POLICY IF EXISTS "Lecture publique des inscriptions" ON public.registrations;
DROP POLICY IF EXISTS "Public select registrations" ON public.registrations;
DROP POLICY IF EXISTS "Insertion publique d une inscription en attente" ON public.registrations;
DROP POLICY IF EXISTS "Service role acces total inscriptions" ON public.registrations;

-- Politique unique pour registrations : Accès total exclusif au service_role
CREATE POLICY "Service role acces total inscriptions"
ON public.registrations FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- REMARQUE DE SÉCURITÉ MAJEURE :
-- Aucune politique n'est accordée à 'anon' ou 'authenticated' sur 'registrations'.
-- Par défaut (Default Deny de PostgreSQL RLS), toute tentative de lecture,
-- d'insertion ou de modification directe depuis le client Supabase est immédiatement bloquée.
-- Le backend Express Node.js est le SEUL garant de l'entrée et de la gestion des données.


-- ####################################################################
-- SECTION 3 : PUBLICATION SUPABASE REALTIME SÉCURISÉE
-- ####################################################################
-- Seule la table publique des tournois est publiée sur le canal Realtime global.
-- Les inscriptions ne sont jamais exposées publiquement en Realtime.
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tournaments;
  EXCEPTION WHEN others THEN
    NULL;
  END;
END $$;

-- ====================================================================
-- FIN DU SCHÉMA v3.0 - DDL & SÉCURITÉ VALIDÉS
-- ====================================================================
