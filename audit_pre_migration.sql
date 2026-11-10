-- ====================================================================
-- FC TOURNAMENT (FCT) - SCRIPT D'AUDIT PRÉALABLE (LECTURE SEULE)
-- ====================================================================
-- Ce script ne modifie AUCUNE donnée et n'altère AUCUNE table.
-- Il permet d'inspecter l'état réel actuel de votre base de données Supabase
-- avant toute migration : colonnes existantes, contraintes, doublons et orphelins.
-- ====================================================================

-- 1. VÉRIFICATION DE L'EXISTENCE DES TABLES DANS LE SCHÉMA PUBLIC
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name IN ('tournaments', 'registrations')
ORDER BY table_name;


-- 2. LISTE COMPLÈTE DES COLONNES EXISTANTES DANS 'tournaments'
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'tournaments'
ORDER BY ordinal_position;


-- 3. LISTE COMPLÈTE DES COLONNES EXISTANTES DANS 'registrations'
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'registrations'
ORDER BY ordinal_position;


-- 4. ANALYSE DES CONTRAINTES DE CLÉ ÉTRANGÈRE SUR 'registrations'
-- Permet de connaître le nom exact et l'action actuelle (CASCADE, RESTRICT, NO ACTION)
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule,
    rc.update_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public' 
  AND tc.table_name = 'registrations'
  AND tc.constraint_type = 'FOREIGN KEY';


-- 5. DÉTECTION DES INSCRIPTIONS ORPHELINES
-- Vérifie si des inscriptions référencent un tournament_id qui n'existe pas dans tournaments
-- (Si ce résultat renvoie des lignes, une contrainte RESTRICT échouerait tant que le tournoi n'est pas créé)
SELECT 
    r.id AS inscription_orpheline_id,
    r.tournament_id AS tournament_id_introuvable,
    r.gamertag,
    r.player_name,
    r.status
FROM public.registrations r
LEFT JOIN public.tournaments t ON r.tournament_id = t.id
WHERE t.id IS NULL;


-- 6. DÉTECTION DES DOUBLONS ÉVENTUELS DANS LES INSCRIPTIONS ACTUELLES
-- 6.1 Doublon de Gamertag dans un même tournoi
SELECT 
    tournament_id, 
    LOWER(gamertag) AS gamertag_normalise, 
    COUNT(*) AS nombre_occurrences,
    ARRAY_AGG(id) AS liste_ids,
    ARRAY_AGG(status) AS liste_statuts
FROM public.registrations
GROUP BY tournament_id, LOWER(gamertag)
HAVING COUNT(*) > 1;

-- 6.2 Doublon de numéro d'enregistrement (registration_number)
SELECT 
    registration_number, 
    COUNT(*) AS nombre_occurrences,
    ARRAY_AGG(id) AS liste_ids,
    ARRAY_AGG(gamertag) AS liste_gamertags
FROM public.registrations
WHERE registration_number IS NOT NULL
GROUP BY registration_number
HAVING COUNT(*) > 1;


-- 7. ÉTAT DES STATUTS EXISTANTS DANS SUPABASE
SELECT 
    status, 
    COUNT(*) AS total_inscriptions,
    COUNT(payment_proof) AS avec_justificatif_paiement,
    COUNT(CASE WHEN whatsapp_invite_status = 'sent' THEN 1 END) AS invitations_whatsapp_envoyees
FROM public.registrations
GROUP BY status
ORDER BY total_inscriptions DESC;


-- 8. AUDIT DES POLITIQUES RLS ACTUELLES SUR 'registrations'
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('tournaments', 'registrations')
ORDER BY tablename, policyname;
