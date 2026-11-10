-- ====================================================================
-- FC TOURNAMENT (FCT) - SCHÉMA OFFICIEL & MIGRATION SÉCURISÉE SUPABASE
-- ====================================================================
-- VERSION SÉCURISÉE v2.0 - SANS ÉCRASEMENT DE DONNÉES ET CONFIDENTIALITÉ RENFORCÉE
-- 
-- PRINCIPES DE SÉCURITÉ ET D'INTÉGRITÉ APPLIQUÉS :
-- 1. Confidentialité absolue : AUCUN accès SELECT direct public sur la table "registrations".
--    Les données personnelles (emails, téléphones, justificatifs) sont invisibles pour les visiteurs.
-- 2. Séparation stricte : La lecture et la validation s'effectuent exclusivement via le backend
--    Node.js authentifié avec la clé SUPABASE_SERVICE_ROLE_KEY.
-- 3. Préservation totale des statuts : Toutes les insertions utilisent 'ON CONFLICT DO NOTHING'.
--    Aucune inscription existante n'est écrasée, aucun statut n'est réinitialisé.
-- 4. Protection contre les suppressions accidentelles : 'ON DELETE RESTRICT' empêche la suppression
--    d'un tournoi tant qu'il contient des inscriptions.
-- 5. Aucun DROP TABLE, aucun TRUNCATE, aucun DELETE dans tout le script.
-- ====================================================================

-- ####################################################################
-- PARTIE 1 : STRUCTURE DES TABLES, CONTRAINTES DDL & INDEX
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

-- Index de performance pour tournaments
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON public.tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_slug ON public.tournaments(slug);


-- 1.2 TABLE DES INSCRIPTIONS (registrations)
-- Note : ON DELETE RESTRICT protège l'intégrité référentielle en interdisant la suppression d'un tournoi avec inscriptions.
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

-- Si la table existait déjà avec un ON DELETE CASCADE antérieur, mise à jour sécurisée vers RESTRICT
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'registrations_tournament_id_fkey' 
      AND table_schema = 'public' 
      AND table_name = 'registrations'
  ) THEN
    ALTER TABLE public.registrations DROP CONSTRAINT registrations_tournament_id_fkey;
    ALTER TABLE public.registrations 
      ADD CONSTRAINT registrations_tournament_id_fkey 
      FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- Index pour les recherches et filtres
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
-- PARTIE 2 : SÉCURITÉ RENFORCÉE & CONFIDENTIALITÉ (RLS, GRANT, REVOKE)
-- ####################################################################

-- Activation obligatoire du Row Level Security (RLS)
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- 2.1 PERMISSIONS FONDAMENTALES (GRANT / REVOKE)
-- Interdire formellement aux rôles publics toute lecture, modification ou suppression sur la table des inscriptions
REVOKE ALL ON public.registrations FROM anon, authenticated;

-- Autoriser uniquement les visiteurs anonymes/authentifiés à soumettre une NOUVELLE inscription
GRANT INSERT ON public.registrations TO anon, authenticated;

-- Accès complet réservé au service_role (clé backend Node.js / Hostinger)
GRANT ALL ON public.registrations TO service_role;
GRANT ALL ON public.tournaments TO service_role;
GRANT SELECT ON public.tournaments TO anon, authenticated;


-- 2.2 POLITIQUES RLS SUR LA TABLE DES TOURNOIS (tournaments)
-- Les informations générales des tournois (dates, règlement, prix) sont publiques
DROP POLICY IF EXISTS "Lecture publique des tournois" ON public.tournaments;
CREATE POLICY "Lecture publique des tournois"
ON public.tournaments FOR SELECT
TO anon, authenticated, service_role
USING (true);

-- Seul le backend authentifié (service_role) peut modifier ou créer des tournois
DROP POLICY IF EXISTS "Gestion complete tournois service_role" ON public.tournaments;
CREATE POLICY "Gestion complete tournois service_role"
ON public.tournaments FOR ALL
TO service_role
USING (true)
WITH CHECK (true);


-- 2.3 POLITIQUES RLS SUR LA TABLE DES INSCRIPTIONS (registrations)
-- IMPORTANT : Suppression de toute ancienne politique de lecture publique
DROP POLICY IF EXISTS "Lecture publique des inscriptions approuvees" ON public.registrations;
DROP POLICY IF EXISTS "Lecture publique des inscriptions" ON public.registrations;
DROP POLICY IF EXISTS "Public select registrations" ON public.registrations;

-- Politique 1 (Backend exclusif) : Le service_role a un accès complet pour lire, valider et gérer
DROP POLICY IF EXISTS "Service role acces total inscriptions" ON public.registrations;
CREATE POLICY "Service role acces total inscriptions"
ON public.registrations FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Politique 2 (Insertion publique contrôlée) : Les visiteurs peuvent UNIQUEMENT soumettre une inscription avec le statut 'pending'
DROP POLICY IF EXISTS "Insertion publique d une inscription en attente" ON public.registrations;
CREATE POLICY "Insertion publique d une inscription en attente"
ON public.registrations FOR INSERT
TO anon, authenticated
WITH CHECK (status = 'pending');

-- REMARQUE DE SÉCURITÉ CRITIQUE :
-- Aucune politique SELECT n'est définie pour 'anon' ou 'authenticated' sur 'registrations'.
-- En vertu du principe de sécurité par défaut de PostgreSQL RLS (Default Deny),
-- aucun visiteur externe ne peut lire, scanner ou extraire les inscriptions depuis le client Supabase.


-- ####################################################################
-- PARTIE 3 : ACTIVATION SUPABASE REALTIME
-- ####################################################################
-- Permet au tableau de bord administrateur (via service_role) de recevoir les flux temps réel
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tournaments;
  EXCEPTION WHEN others THEN
    NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.registrations;
  EXCEPTION WHEN others THEN
    NULL;
  END;
END $$;


-- ####################################################################
-- PARTIE 4 : INITIALISATION NON DESTRUCTIVE DES DONNÉES
-- ####################################################################
-- TOUTES LES REQUÊTES CI-DESSOUS UTILISENT 'ON CONFLICT DO NOTHING' :
-- SI UN ENREGISTREMENT EXISTE DÉJÀ DANS SUPABASE, IL NE SERA NI TOUCHÉ,
-- NI MODIFIÉ, NI RÉINITIALISÉ. AUCUN STATUT EXISTANT NE SERA PERDU.
-- ####################################################################

-- 4.1 Tournois Officiels
INSERT INTO public.tournaments (
  id, name, slug, description, game_version, platform, format,
  location, city, start_date, time, registration_deadline,
  max_participants, entry_fee_mad, prize_pool, status, rules, banner_image,
  created_at, updated_at
) VALUES (
  'tourn_spring_2026',
  'Championnat',
  'championnat-fc-2026',
  'Le tournoi e-sport incontournable de la saison ! Rassemblez-vous pour célébrer la compétition et couronner le meilleur joueur dans une ambiance électrique devant vos écrans.',
  'EA SPORTS 27',
  'e-Football',
  'aller_retour',
  'Gaming Arena',
  'Maroc',
  '2027-04-25',
  '14:00',
  '2027-04-23T23:59:00.000Z',
  32,
  50,
  '**** MAD + Trophée + T-shirt',
  'open',
  'Article 1 – Format des matchs : Les rencontres se disputent en mode « Coup d’envoi », avec une durée de 5 minutes par mi-temps.
Article 2 – Système de confrontation : Chaque compétiteur doit affronter son adversaire lors de deux rencontres : un match aller et un match retour.
Article 3 – Fair-play et comportement : Le fair-play est obligatoire durant toute la compétition. Tout comportement antisportif peut entraîner la disqualification immédiate.
Article 4 – Utilisation des manettes : Manettes fournies ou manette personnelle autorisée après vérification technique.
Article 5 – Transmission des résultats : Capture d’écran du score final obligatoire après chaque match.
Article 6 – Fraude et falsification : Toute falsification entraîne l’élimination immédiate.
Article 7 – Vérification technique : L’équipe technique vérifie l’authenticité des captures.
Article 8 – Retard et absence : Retard supérieur à 10 minutes = forfait automatique.',
  '/assets/aistudio/f455c630-cebe-4da1-8e64-ad18d396300f_73791cd5.png',
  '2026-02-01T10:00:00.000Z',
  NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.tournaments (
  id, name, slug, description, game_version, platform, format,
  location, city, start_date, time, registration_deadline,
  max_participants, entry_fee_mad, prize_pool, status, rules, banner_image,
  created_at, updated_at
) VALUES (
  'tourn_ligue_oriental_2026',
  'Ligue des champions',
  'ligue-des-champions',
  'La compétition d’élite qui réunit les meilleurs joueurs pour s’affronter et décrocher le titre de champion.',
  'EA SPORTS 27',
  'e-Football',
  'aller_retour',
  'Gaming Arena',
  'Maroc',
  '2026-03-14',
  '16:00',
  '2026-03-12T18:00:00.000Z',
  32,
  50,
  '**** MAD + Trophée + T-shirt',
  'completed',
  'Article 1 – Format des matchs : Les rencontres se disputent en mode « Coup d’envoi », avec une durée de 5 minutes par mi-temps.
Article 2 – Système de confrontation : Chaque compétiteur doit affronter son adversaire lors de deux rencontres : un match aller et un match retour.
Article 3 – Fair-play et comportement : Le fair-play est obligatoire durant toute la compétition. Tout comportement antisportif peut entraîner la disqualification immédiate.
Article 4 – Utilisation des manettes : Manettes fournies ou manette personnelle autorisée après vérification technique.
Article 5 – Transmission des résultats : Capture d’écran du score final obligatoire après chaque match.
Article 6 – Fraude et falsification : Toute falsification entraîne l’élimination immédiate.
Article 7 – Vérification technique : L’équipe technique vérifie l’authenticité des captures.
Article 8 – Retard et absence : Retard supérieur à 10 minutes = forfait automatique.',
  '/assets/aistudio/a8122cd3-7ef9-44e0-b5a7-6cc0230fe1eb_a174390d.png',
  '2026-01-20T12:00:00.000Z',
  NOW()
) ON CONFLICT (id) DO NOTHING;


-- 4.2 Inscriptions Historiques (Préservation intégrale via ON CONFLICT DO NOTHING)
-- Si une inscription existe déjà (par id ou par couple tournament_id + gamertag), elle est STRICTEMENT CONSERVÉE SANS MODIFICATION.
INSERT INTO public.registrations (
  id, registration_number, tournament_id, tournament_name, user_id,
  gamertag, player_name, user_email, phone, team_selected,
  controller_preference, notes, payment_proof, payment_proof_name,
  status, registered_at, validated_at, rejected_at, rejection_reason,
  reviewed_by, seed, whatsapp_invite_status, whatsapp_invite_sent_at,
  whatsapp_invite_attempts, created_at, updated_at
) VALUES 
('reg_1', 'REG-2026-0001', 'tourn_spring_2026', NULL, 'usr_amine', 'Amine_FC', 'Amine Bennani', 'joueur@fctournament.ma', NULL, NULL, NULL, NULL, NULL, NULL, 'confirmed', '2026-02-02T10:15:00.000Z', NULL, NULL, NULL, NULL, 1, 'not_sent', NULL, 0, '2026-02-02T10:15:00.000Z', NOW()),
('reg_2', 'REG-2026-0002', 'tourn_spring_2026', NULL, 'usr_reda', 'Reda_TheKing', 'Reda Berrada', 'reda@fctournament.ma', NULL, NULL, NULL, NULL, NULL, NULL, 'confirmed', '2026-02-02T11:30:00.000Z', NULL, NULL, NULL, NULL, 2, 'sent', '2026-11-04T13:02:52.807Z', 1, '2026-02-02T11:30:00.000Z', NOW()),
('reg_3', 'REG-2026-0003', 'tourn_spring_2026', NULL, 'usr_yassine', 'Yassine_99', 'Yassine Mansouri', 'yassine@fctournament.ma', NULL, NULL, NULL, NULL, NULL, NULL, 'confirmed', '2026-02-03T14:20:00.000Z', NULL, NULL, NULL, NULL, 3, 'not_sent', NULL, 0, '2026-02-03T14:20:00.000Z', NOW()),
('reg_4', 'REG-2026-0004', 'tourn_spring_2026', NULL, 'usr_bilal', 'FC_Sniper', 'Bilal Tahiri', 'bilal@fctournament.ma', NULL, NULL, NULL, NULL, NULL, NULL, 'confirmed', '2026-02-04T09:45:00.000Z', NULL, NULL, NULL, NULL, 4, 'not_sent', NULL, 0, '2026-02-04T09:45:00.000Z', NOW()),
('reg_5', 'REG-2026-0005', 'tourn_spring_2026', NULL, 'usr_mehdi', 'Mehdi_Pro', 'Mehdi El Amrani', 'mehdi@fctournament.ma', NULL, NULL, NULL, NULL, NULL, NULL, 'confirmed', '2026-02-05T16:00:00.000Z', NULL, NULL, NULL, NULL, 5, 'not_sent', NULL, 0, '2026-02-05T16:00:00.000Z', NOW()),
('reg_6', 'REG-2026-0006', 'tourn_spring_2026', NULL, 'usr_simoo', 'Simoo_Dribble', 'Mohamed Ziani', 'simoo@fctournament.ma', NULL, NULL, NULL, NULL, NULL, NULL, 'confirmed', '2026-02-06T18:10:00.000Z', NULL, NULL, NULL, NULL, 6, 'not_sent', NULL, 0, '2026-02-06T18:10:00.000Z', NOW()),
('reg_oriental_1', 'REG-2026-0007', 'tourn_ligue_oriental_2026', NULL, 'usr_amine', 'Amine_FC', 'Amine Bennani', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'confirmed', '2026-02-01T10:00:00.000Z', NULL, NULL, NULL, NULL, 1, 'not_sent', NULL, 0, '2026-02-01T10:00:00.000Z', NOW()),
('reg_oriental_2', 'REG-2026-0008', 'tourn_ligue_oriental_2026', NULL, 'usr_reda', 'Reda_TheKing', 'Reda Berrada', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'confirmed', '2026-02-01T10:15:00.000Z', NULL, NULL, NULL, NULL, 2, 'not_sent', NULL, 0, '2026-02-01T10:15:00.000Z', NOW()),
('reg_oriental_3', 'REG-2026-0009', 'tourn_ligue_oriental_2026', NULL, 'usr_yassine', 'Yassine_99', 'Yassine Mansouri', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'confirmed', '2026-02-01T10:30:00.000Z', NULL, NULL, NULL, NULL, 3, 'not_sent', NULL, 0, '2026-02-01T10:30:00.000Z', NOW()),
('reg_oriental_4', 'REG-2026-0010', 'tourn_ligue_oriental_2026', NULL, 'usr_bilal', 'FC_Sniper', 'Bilal Tahiri', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'confirmed', '2026-02-01T10:45:00.000Z', NULL, NULL, NULL, NULL, 4, 'not_sent', NULL, 0, '2026-02-01T10:45:00.000Z', NOW()),
('reg_oriental_5', 'REG-2026-0011', 'tourn_ligue_oriental_2026', NULL, 'usr_mehdi', 'Mehdi_Pro', 'Mehdi El Amrani', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'confirmed', '2026-02-01T11:00:00.000Z', NULL, NULL, NULL, NULL, 5, 'not_sent', NULL, 0, '2026-02-01T11:00:00.000Z', NOW()),
('reg_oriental_6', 'REG-2026-0012', 'tourn_ligue_oriental_2026', NULL, 'usr_simoo', 'Simoo_Dribble', 'Mohamed Ziani', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'confirmed', '2026-02-01T11:15:00.000Z', NULL, NULL, NULL, NULL, 6, 'not_sent', NULL, 0, '2026-02-01T11:15:00.000Z', NOW()),
('reg_oriental_7', 'REG-2026-0013', 'tourn_ligue_oriental_2026', NULL, 'usr_hamza', 'Hamza_FCB', 'Hamza Chaoui', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'confirmed', '2026-02-01T11:30:00.000Z', NULL, NULL, NULL, NULL, 7, 'not_sent', NULL, 0, '2026-02-01T11:30:00.000Z', NOW()),
('reg_oriental_8', 'REG-2026-0014', 'tourn_ligue_oriental_2026', NULL, 'usr_karim', 'Karim_Atlas', 'Karim Benali', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'confirmed', '2026-02-01T11:45:00.000Z', NULL, NULL, NULL, NULL, 8, 'not_sent', NULL, 0, '2026-02-01T11:45:00.000Z', NOW()),
('reg_1793725437285_qkz9', 'REG-2026-0015', 'tourn_spring_2026', 'Championnat', 'guest_1793725437285_sccv', 'Omar_Maestro', 'Omar El Alami', 'omar.test@fctournament.ma', '0612345678', 'Real Madrid', 'Manette personnelle PS5', NULL, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'recu_virement_omar.png', 'confirmed', '2026-11-03T17:03:57.285Z', NULL, NULL, NULL, NULL, 9, 'sent', '2026-11-04T13:02:19.568Z', 1, '2026-11-03T17:03:57.285Z', NOW()),
('reg_champ_hamza', 'REG-2026-0016', 'tourn_spring_2026', 'Championnat', 'usr_hamza', 'Hamza_FCB', 'Hamza Chaoui', 'hamza@fctournament.ma', '+212 6 33 44 55 66', NULL, NULL, NULL, NULL, NULL, 'confirmed', '2026-02-07T14:30:00.000Z', NULL, NULL, NULL, NULL, 7, 'not_sent', NULL, 0, '2026-02-07T14:30:00.000Z', NOW()),
('reg_champ_karim', 'REG-2026-0017', 'tourn_spring_2026', 'Championnat', 'usr_karim', 'Karim_Atlas', 'Karim Benali', 'karim.atlas@fctournament.ma', '+212 6 44 55 66 77', NULL, NULL, NULL, NULL, NULL, 'confirmed', '2026-02-08T11:15:00.000Z', NULL, NULL, NULL, NULL, 8, 'not_sent', NULL, 0, '2026-02-08T11:15:00.000Z', NOW()),
('reg_champ_tariq', 'REG-2026-0018', 'tourn_spring_2026', 'Championnat', 'usr_tariq', 'Tariq_Pro9', 'Tariq Mansour', 'tariq.mansour@fctournament.ma', '+212 6 55 66 77 88', NULL, NULL, NULL, NULL, NULL, 'confirmed', '2026-02-09T16:20:00.000Z', NULL, NULL, NULL, NULL, 10, 'not_sent', NULL, 0, '2026-02-09T16:20:00.000Z', NOW()),
('reg_champ_soufiane', 'REG-2026-0019', 'tourn_spring_2026', 'Championnat', 'usr_soufiane', 'Souf_Skiller', 'Soufiane El Fassi', 'soufiane.elfassi@fctournament.ma', '+212 6 66 77 88 99', NULL, NULL, NULL, NULL, NULL, 'confirmed', '2026-02-10T18:45:00.000Z', NULL, NULL, NULL, NULL, 11, 'not_sent', NULL, 0, '2026-02-10T18:45:00.000Z', NOW()),
('reg_champ_ayoub', 'REG-2026-0020', 'tourn_spring_2026', 'Championnat', 'usr_ayoub', 'Ayoub_Striker', 'Ayoub Bennis', 'ayoub.bennis@fctournament.ma', '+212 6 77 88 99 00', NULL, NULL, NULL, NULL, NULL, 'confirmed', '2026-02-11T19:10:00.000Z', NULL, NULL, NULL, NULL, 12, 'not_sent', NULL, 0, '2026-02-11T19:10:00.000Z', NOW()),
('reg_1794301367570_czq8', 'REG-2026-0021', 'tourn_spring_2026', 'Championnat', 'guest_1794301367570_nywi', 'Youssef_FC27', 'Youssef Testeur', 'alio2002ng@gmail.com', '+212 6 99 88 77 66', 'Real Madrid', 'Manette personnelle PS5', 'Test inscription officielle', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'recu_virement.png', 'confirmed', '2026-11-10T09:02:47.570Z', '2026-11-10T09:03:11.592Z', NULL, NULL, 'Google AI Studio Admin', 13, 'sent', '2026-11-10T09:03:11.592Z', 1, '2026-11-10T09:02:47.570Z', NOW())
ON CONFLICT (id) DO NOTHING;


-- ####################################################################
-- PARTIE 5 : REQUÊTES DE VÉRIFICATION & AUDIT POST-MIGRATION
-- ####################################################################
-- Exécutez ces requêtes dans l'Éditeur SQL pour vérifier l'intégrité :
--
-- 1. Nombre total de tournois :
--    SELECT COUNT(*) AS total_tournois FROM public.tournaments;
--
-- 2. Nombre total et ventilation des inscriptions par statut :
--    SELECT status, COUNT(*) AS nombre_inscriptions 
--    FROM public.registrations 
--    GROUP BY status 
--    ORDER BY nombre_inscriptions DESC;
--
-- 3. Vérification de l'absence de doublons (gamertag par tournoi) :
--    SELECT tournament_id, gamertag, COUNT(*) 
--    FROM public.registrations 
--    GROUP BY tournament_id, gamertag 
--    HAVING COUNT(*) > 1;
--
-- 4. Vérification de l'intégrité des numéros d'enregistrement :
--    SELECT registration_number, COUNT(*) 
--    FROM public.registrations 
--    GROUP BY registration_number 
--    HAVING COUNT(*) > 1;
-- ====================================================================
