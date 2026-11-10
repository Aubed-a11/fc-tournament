-- ====================================================================
-- FC TOURNAMENT (FCT) - SCRIPT DE VÉRIFICATION POST-MIGRATION
-- ====================================================================
-- Exécutez ces requêtes dans l'Éditeur SQL Supabase après la migration
-- pour valider que la base est opérationnelle et sécurisée à 100%.
-- ====================================================================

-- 1. NOMBRE TOTAL DE TOURNOIS ET STATUTS
SELECT 
    status, 
    COUNT(*) AS total_tournois,
    STRING_AGG(name, ', ') AS noms_tournois
FROM public.tournaments
GROUP BY status;


-- 2. NOMBRE TOTAL D'INSCRIPTIONS ET VENTILATION EXACTE PAR STATUT
-- (Vérifie qu'aucun statut 'rejected' n'est devenu 'confirmed' ou inversement)
SELECT 
    status, 
    COUNT(*) AS nombre_inscriptions,
    COUNT(payment_proof) AS avec_justificatif_paiement,
    COUNT(CASE WHEN whatsapp_invite_status = 'sent' THEN 1 END) AS invites_whatsapp_envoyees
FROM public.registrations
GROUP BY status
ORDER BY nombre_inscriptions DESC;


-- 3. CONTRÔLE D'INTÉGRITÉ RELATIONNELLE : INSCRIPTIONS PAR TOURNOI
SELECT 
    t.name AS tournoi,
    t.status AS statut_tournoi,
    COUNT(r.id) AS total_inscrits,
    COUNT(CASE WHEN r.status = 'confirmed' THEN 1 END) AS confirmes,
    COUNT(CASE WHEN r.status = 'pending' THEN 1 END) AS en_attente,
    COUNT(CASE WHEN r.status = 'rejected' THEN 1 END) AS refuses
FROM public.tournaments t
LEFT JOIN public.registrations r ON t.id = r.tournament_id
GROUP BY t.id, t.name, t.status
ORDER BY total_inscrits DESC;


-- 4. CONTRÔLE STRICT ANTI-DOUBLONS (Doit renvoyer 0 ligne)
-- 4.1 Aucun joueur ne doit être inscrit 2 fois au même tournoi
SELECT 
    tournament_id, 
    LOWER(gamertag) AS gamertag_en_double, 
    COUNT(*) AS total_occurrences
FROM public.registrations
GROUP BY tournament_id, LOWER(gamertag)
HAVING COUNT(*) > 1;

-- 4.2 Aucun numéro d'enregistrement REG-2026-XXXX ne doit être dupliqué
SELECT 
    registration_number, 
    COUNT(*) AS total_occurrences
FROM public.registrations
GROUP BY registration_number
HAVING COUNT(*) > 1;


-- 5. VÉRIFICATION DE LA SÉCURITÉ ROW LEVEL SECURITY (RLS)
-- Confirme que RLS est bien ENABLE sur les 2 tables
SELECT 
    tablename, 
    rowsecurity AS rls_active
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename IN ('tournaments', 'registrations');


-- 6. VÉRIFICATION DES POLITIQUES APPLIQUÉES (Aucun SELECT anon sur registrations)
SELECT 
    tablename, 
    policyname, 
    roles, 
    cmd 
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('tournaments', 'registrations')
ORDER BY tablename, policyname;
