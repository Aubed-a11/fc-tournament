-- ====================================================================
-- FC TOURNAMENT (FCT) - INSERTION SÉCURISÉE DES DONNÉES INITIALES (OPTIONNEL)
-- ====================================================================
-- Ce script est STRICTEMENT INDÉPENDANT du schéma principal.
--
-- GARANTIES DE SÉCURITÉ :
-- 1. Triple vérification anti-conflit (WHERE NOT EXISTS) sur :
--    - id (clé primaire)
--    - registration_number (numéro unique REG-2026-XXXX)
--    - (tournament_id, gamertag) (unicité du joueur par tournoi)
-- 2. Zéro écrasement : Si une inscription existe DÉJÀ dans Supabase,
--    la ligne est purement et simplement IGNORÉE.
--    Aucun statut (rejected, confirmed, pending) n'est jamais écrasé.
--    Aucune date de validation ou justificatif existant n'est altéré.
-- 3. Signalement des données de test : Les lignes reg_15 et reg_21 comportent
--    des images base64 de test (1x1 pixel) créées lors des essais initiaux.
-- ====================================================================

-- 1. INSERTION SÉCURISÉE DES 2 TOURNOIS OFFICIELS
INSERT INTO public.tournaments (
  id, name, slug, description, game_version, platform, format,
  location, city, start_date, time, registration_deadline,
  max_participants, entry_fee_mad, prize_pool, status, rules, banner_image,
  created_at, updated_at
)
SELECT 
  'tourn_spring_2026', 'Championnat', 'championnat-fc-2026',
  'Le tournoi e-sport incontournable de la saison ! Rassemblez-vous pour célébrer la compétition et couronner le meilleur joueur dans une ambiance électrique devant vos écrans.',
  'EA SPORTS 27', 'e-Football', 'aller_retour', 'Gaming Arena', 'Maroc',
  '2027-04-25', '14:00', '2027-04-23T23:59:00.000Z', 32, 50,
  '**** MAD + Trophée + T-shirt', 'open',
  'Article 1 – Format des matchs : Les rencontres se disputent en mode « Coup d’envoi », avec une durée de 5 minutes par mi-temps.
Article 2 – Système de confrontation : Chaque compétiteur doit affronter son adversaire lors de deux rencontres : un match aller et un match retour.
Article 3 – Fair-play et comportement : Le fair-play est obligatoire durant toute la compétition. Tout comportement antisportif peut entraîner la disqualification immédiate.
Article 4 – Utilisation des manettes : Manettes fournies ou manette personnelle autorisée après vérification technique.
Article 5 – Transmission des résultats : Capture d’écran du score final obligatoire après chaque match.
Article 6 – Fraude et falsification : Toute falsification entraîne l’élimination immédiate.
Article 7 – Vérification technique : L’équipe technique vérifie l’authenticité des captures.
Article 8 – Retard et absence : Retard supérieur à 10 minutes = forfait automatique.',
  '/assets/aistudio/f455c630-cebe-4da1-8e64-ad18d396300f_73791cd5.png',
  '2026-02-01T10:00:00.000Z', NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.tournaments WHERE id = 'tourn_spring_2026');

INSERT INTO public.tournaments (
  id, name, slug, description, game_version, platform, format,
  location, city, start_date, time, registration_deadline,
  max_participants, entry_fee_mad, prize_pool, status, rules, banner_image,
  created_at, updated_at
)
SELECT 
  'tourn_ligue_oriental_2026', 'Ligue des champions', 'ligue-des-champions',
  'La compétition d’élite qui réunit les meilleurs joueurs pour s’affronter et décrocher le titre de champion.',
  'EA SPORTS 27', 'e-Football', 'aller_retour', 'Gaming Arena', 'Maroc',
  '2026-03-14', '16:00', '2026-03-12T18:00:00.000Z', 32, 50,
  '**** MAD + Trophée + T-shirt', 'completed',
  'Article 1 – Format des matchs : Les rencontres se disputent en mode « Coup d’envoi », avec une durée de 5 minutes par mi-temps.
Article 2 – Système de confrontation : Chaque compétiteur doit affronter son adversaire lors de deux rencontres : un match aller et un match retour.
Article 3 – Fair-play et comportement : Le fair-play est obligatoire durant toute la compétition. Tout comportement antisportif peut entraîner la disqualification immédiate.
Article 4 – Utilisation des manettes : Manettes fournies ou manette personnelle autorisée après vérification technique.
Article 5 – Transmission des résultats : Capture d’écran du score final obligatoire après chaque match.
Article 6 – Fraude et falsification : Toute falsification entraîne l’élimination immédiate.
Article 7 – Vérification technique : L’équipe technique vérifie l’authenticité des captures.
Article 8 – Retard et absence : Retard supérieur à 10 minutes = forfait automatique.',
  '/assets/aistudio/a8122cd3-7ef9-44e0-b5a7-6cc0230fe1eb_a174390d.png',
  '2026-01-20T12:00:00.000Z', NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.tournaments WHERE id = 'tourn_ligue_oriental_2026');


-- 2. PROCÉDURE D'INSERTION SÉCURISÉE DES INSCRIPTIONS HISTORIQUES
-- Chaque ligne vérifie :
-- - id existant ? -> IGNORÉ
-- - registration_number existant ? -> IGNORÉ
-- - couple (tournament_id, gamertag) existant ? -> IGNORÉ
DO $$
DECLARE
    rec RECORD;
    v_skipped INT := 0;
    v_inserted INT := 0;
BEGIN
    FOR rec IN 
        SELECT * FROM (VALUES
          ('reg_1', 'REG-2026-0001', 'tourn_spring_2026', 'usr_amine', 'Amine_FC', 'Amine Bennani', 'joueur@fctournament.ma', NULL::TEXT, 'confirmed', '2026-02-02T10:15:00.000Z'::TIMESTAMPTZ, 1, 'not_sent', NULL::TEXT),
          ('reg_2', 'REG-2026-0002', 'tourn_spring_2026', 'usr_reda', 'Reda_TheKing', 'Reda Berrada', 'reda@fctournament.ma', NULL::TEXT, 'confirmed', '2026-02-02T11:30:00.000Z'::TIMESTAMPTZ, 2, 'sent', NULL::TEXT),
          ('reg_3', 'REG-2026-0003', 'tourn_spring_2026', 'usr_yassine', 'Yassine_99', 'Yassine Mansouri', 'yassine@fctournament.ma', NULL::TEXT, 'confirmed', '2026-02-03T14:20:00.000Z'::TIMESTAMPTZ, 3, 'not_sent', NULL::TEXT),
          ('reg_4', 'REG-2026-0004', 'tourn_spring_2026', 'usr_bilal', 'FC_Sniper', 'Bilal Tahiri', 'bilal@fctournament.ma', NULL::TEXT, 'confirmed', '2026-02-04T09:45:00.000Z'::TIMESTAMPTZ, 4, 'not_sent', NULL::TEXT),
          ('reg_5', 'REG-2026-0005', 'tourn_spring_2026', 'usr_mehdi', 'Mehdi_Pro', 'Mehdi El Amrani', 'mehdi@fctournament.ma', NULL::TEXT, 'confirmed', '2026-02-05T16:00:00.000Z'::TIMESTAMPTZ, 5, 'not_sent', NULL::TEXT),
          ('reg_6', 'REG-2026-0006', 'tourn_spring_2026', 'usr_simoo', 'Simoo_Dribble', 'Mohamed Ziani', 'simoo@fctournament.ma', NULL::TEXT, 'confirmed', '2026-02-06T18:10:00.000Z'::TIMESTAMPTZ, 6, 'not_sent', NULL::TEXT),
          ('reg_oriental_1', 'REG-2026-0007', 'tourn_ligue_oriental_2026', 'usr_amine', 'Amine_FC', 'Amine Bennani', NULL::TEXT, NULL::TEXT, 'confirmed', '2026-02-01T10:00:00.000Z'::TIMESTAMPTZ, 1, 'not_sent', NULL::TEXT),
          ('reg_oriental_2', 'REG-2026-0008', 'tourn_ligue_oriental_2026', 'usr_reda', 'Reda_TheKing', 'Reda Berrada', NULL::TEXT, NULL::TEXT, 'confirmed', '2026-02-01T10:15:00.000Z'::TIMESTAMPTZ, 2, 'not_sent', NULL::TEXT),
          ('reg_oriental_3', 'REG-2026-0009', 'tourn_ligue_oriental_2026', 'usr_yassine', 'Yassine_99', 'Yassine Mansouri', NULL::TEXT, NULL::TEXT, 'confirmed', '2026-02-01T10:30:00.000Z'::TIMESTAMPTZ, 3, 'not_sent', NULL::TEXT),
          ('reg_oriental_4', 'REG-2026-0010', 'tourn_ligue_oriental_2026', 'usr_bilal', 'FC_Sniper', 'Bilal Tahiri', NULL::TEXT, NULL::TEXT, 'confirmed', '2026-02-01T10:45:00.000Z'::TIMESTAMPTZ, 4, 'not_sent', NULL::TEXT),
          ('reg_oriental_5', 'REG-2026-0011', 'tourn_ligue_oriental_2026', 'usr_mehdi', 'Mehdi_Pro', 'Mehdi El Amrani', NULL::TEXT, NULL::TEXT, 'confirmed', '2026-02-01T11:00:00.000Z'::TIMESTAMPTZ, 5, 'not_sent', NULL::TEXT),
          ('reg_oriental_6', 'REG-2026-0012', 'tourn_ligue_oriental_2026', 'usr_simoo', 'Simoo_Dribble', 'Mohamed Ziani', NULL::TEXT, NULL::TEXT, 'confirmed', '2026-02-01T11:15:00.000Z'::TIMESTAMPTZ, 6, 'not_sent', NULL::TEXT),
          ('reg_oriental_7', 'REG-2026-0013', 'tourn_ligue_oriental_2026', 'usr_hamza', 'Hamza_FCB', 'Hamza Chaoui', NULL::TEXT, NULL::TEXT, 'confirmed', '2026-02-01T11:30:00.000Z'::TIMESTAMPTZ, 7, 'not_sent', NULL::TEXT),
          ('reg_oriental_8', 'REG-2026-0014', 'tourn_ligue_oriental_2026', 'usr_karim', 'Karim_Atlas', 'Karim Benali', NULL::TEXT, NULL::TEXT, 'confirmed', '2026-02-01T11:45:00.000Z'::TIMESTAMPTZ, 8, 'not_sent', NULL::TEXT),
          -- Note : Ligne 15 ci-dessous possède une image base64 de test de développement
          ('reg_1793725437285_qkz9', 'REG-2026-0015', 'tourn_spring_2026', 'guest_1793725437285_sccv', 'Omar_Maestro', 'Omar El Alami', 'omar.test@fctournament.ma', '0612345678', 'confirmed', '2026-11-03T17:03:57.285Z'::TIMESTAMPTZ, 9, 'sent', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='),
          ('reg_champ_hamza', 'REG-2026-0016', 'tourn_spring_2026', 'usr_hamza', 'Hamza_FCB', 'Hamza Chaoui', 'hamza@fctournament.ma', '+212 6 33 44 55 66', 'confirmed', '2026-02-07T14:30:00.000Z'::TIMESTAMPTZ, 7, 'not_sent', NULL::TEXT),
          ('reg_champ_karim', 'REG-2026-0017', 'tourn_spring_2026', 'usr_karim', 'Karim_Atlas', 'Karim Benali', 'karim.atlas@fctournament.ma', '+212 6 44 55 66 77', 'confirmed', '2026-02-08T11:15:00.000Z'::TIMESTAMPTZ, 8, 'not_sent', NULL::TEXT),
          ('reg_champ_tariq', 'REG-2026-0018', 'tourn_spring_2026', 'usr_tariq', 'Tariq_Pro9', 'Tariq Mansour', 'tariq.mansour@fctournament.ma', '+212 6 55 66 77 88', 'confirmed', '2026-02-09T16:20:00.000Z'::TIMESTAMPTZ, 10, 'not_sent', NULL::TEXT),
          ('reg_champ_soufiane', 'REG-2026-0019', 'tourn_spring_2026', 'usr_soufiane', 'Souf_Skiller', 'Soufiane El Fassi', 'soufiane.elfassi@fctournament.ma', '+212 6 66 77 88 99', 'confirmed', '2026-02-10T18:45:00.000Z'::TIMESTAMPTZ, 11, 'not_sent', NULL::TEXT),
          ('reg_champ_ayoub', 'REG-2026-0020', 'tourn_spring_2026', 'usr_ayoub', 'Ayoub_Striker', 'Ayoub Bennis', 'ayoub.bennis@fctournament.ma', '+212 6 77 88 99 00', 'confirmed', '2026-02-11T19:10:00.000Z'::TIMESTAMPTZ, 12, 'not_sent', NULL::TEXT),
          -- Note : Ligne 21 ci-dessous possède une image base64 de test de développement
          ('reg_1794301367570_czq8', 'REG-2026-0021', 'tourn_spring_2026', 'guest_1794301367570_nywi', 'Youssef_FC27', 'Youssef Testeur', 'alio2002ng@gmail.com', '+212 6 99 88 77 66', 'confirmed', '2026-11-10T09:02:47.570Z'::TIMESTAMPTZ, 13, 'sent', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==')
        ) AS t(id, reg_num, tourn_id, u_id, gamer, p_name, u_email, u_phone, stat, reg_at, s_seed, wa_stat, p_proof)
    LOOP
        -- Vérification 3 points avant insertion :
        IF EXISTS (
            SELECT 1 FROM public.registrations r 
            WHERE r.id = rec.id 
               OR r.registration_number = rec.reg_num
               OR (r.tournament_id = rec.tourn_id AND LOWER(r.gamertag) = LOWER(rec.gamer))
        ) THEN
            v_skipped := v_skipped + 1;
        ELSE
            INSERT INTO public.registrations (
                id, registration_number, tournament_id, user_id, gamertag, player_name,
                user_email, phone, status, registered_at, seed, whatsapp_invite_status, payment_proof
            ) VALUES (
                rec.id, rec.reg_num, rec.tourn_id, rec.u_id, rec.gamer, rec.p_name,
                rec.u_email, rec.u_phone, rec.stat, rec.reg_at, rec.s_seed, rec.wa_stat, rec.p_proof
            );
            v_inserted := v_inserted + 1;
        END IF;
    END LOOP;

    RAISE NOTICE 'RAPPORT PEUPLEMENT SÉCURISÉ : % inscription(s) insérée(s), % inscription(s) ignorée(s) car déjà existante(s).', v_inserted, v_skipped;
END $$;
