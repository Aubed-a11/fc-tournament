-- ====================================================================
-- FC TOURNAMENT (FCT) - MIGRATION SÉCURISÉE DES COLONNES & CONTRAINTES
-- ====================================================================
-- Ce script est destiné aux bases existantes où les tables 'tournaments'
-- ou 'registrations' ont été créées dans une version antérieure.
--
-- GARANTIES :
-- - Ne supprime AUCUNE table.
-- - Ne supprime AUCUNE ligne.
-- - N'écrase AUCUN statut existant.
-- - Ajoute uniquement les colonnes manquantes (ADD COLUMN IF NOT EXISTS).
-- - Vérifie l'absence d'orphelins avant toute modification de contrainte.
-- ====================================================================

-- ####################################################################
-- ÉTAPE 1 : AJOUT NON DESTRUCTIF DES COLONNES MANQUANTES
-- ####################################################################

-- Table tournaments
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

-- Table registrations
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


-- ####################################################################
-- ÉTAPE 2 : MIGRATION SÉCURISÉE DE LA CLÉ ÉTRANGÈRE VERS ON DELETE RESTRICT
-- ####################################################################
-- Cette procédure :
-- 1. Vérifie d'abord qu'aucune inscription orpheline n'existe.
-- 2. Détecte le nom exact de la contrainte existante sur tournament_id.
-- 3. Ne la modifie vers RESTRICT que si nécessaire et sans bloquer la base.
DO $$
DECLARE
    v_orphans_count INT := 0;
    v_fk_name TEXT := NULL;
    v_current_delete_rule TEXT := NULL;
BEGIN
    -- 1. Contrôle des orphelins
    SELECT COUNT(*) INTO v_orphans_count
    FROM public.registrations r
    LEFT JOIN public.tournaments t ON r.tournament_id = t.id
    WHERE t.id IS NULL;

    IF v_orphans_count > 0 THEN
        RAISE EXCEPTION 'MIGRATION ABORTÉE : % inscription(s) orpheline(s) détectée(s). Veuillez d''abord associer ces inscriptions à des tournois valides.', v_orphans_count;
    END IF;

    -- 2. Détection du nom réel de la contrainte de clé étrangère
    SELECT 
        tc.constraint_name, 
        rc.delete_rule 
    INTO 
        v_fk_name, 
        v_current_delete_rule
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    JOIN information_schema.referential_constraints AS rc
      ON rc.constraint_name = tc.constraint_name
    WHERE tc.table_schema = 'public' 
      AND tc.table_name = 'registrations'
      AND kcu.column_name = 'tournament_id'
      AND tc.constraint_type = 'FOREIGN KEY'
    LIMIT 1;

    -- 3. Mise à jour de la contrainte si elle n'est pas déjà RESTRICT ou NO ACTION
    IF v_fk_name IS NOT NULL THEN
        IF v_current_delete_rule NOT IN ('RESTRICT', 'NO ACTION') THEN
            RAISE NOTICE 'Contrainte existante trouvée : % (Action actuelle: %). Mise à niveau vers RESTRICT...', v_fk_name, v_current_delete_rule;
            EXECUTE format('ALTER TABLE public.registrations DROP CONSTRAINT %I;', v_fk_name);
            ALTER TABLE public.registrations 
              ADD CONSTRAINT registrations_tournament_id_fkey 
              FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id) ON DELETE RESTRICT;
            RAISE NOTICE 'Contrainte mise à niveau avec succès vers ON DELETE RESTRICT.';
        ELSE
            RAISE NOTICE 'La contrainte % est déjà sécurisée avec l''action %.', v_fk_name, v_current_delete_rule;
        END IF;
    ELSE
        -- Si aucune contrainte FK n'existait encore
        RAISE NOTICE 'Aucune contrainte FK trouvée. Création de registrations_tournament_id_fkey avec ON DELETE RESTRICT...';
        ALTER TABLE public.registrations 
          ADD CONSTRAINT registrations_tournament_id_fkey 
          FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id) ON DELETE RESTRICT;
    END IF;
END $$;


-- ####################################################################
-- ÉTAPE 3 : CONTRAINTES D'UNICITÉ SANS CONFLIT
-- ####################################################################
-- Ajout de la contrainte d'unicité (tournament_id, gamertag) si absente
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_schema = 'public' 
          AND table_name = 'registrations' 
          AND constraint_name = 'uq_registrations_tournament_gamertag'
    ) THEN
        -- Vérifier d'abord s'il existe des doublons actuels avant d'appliquer
        IF NOT EXISTS (
            SELECT 1 FROM (
                SELECT tournament_id, LOWER(gamertag) 
                FROM public.registrations 
                GROUP BY tournament_id, LOWER(gamertag) 
                HAVING COUNT(*) > 1
            ) d
        ) THEN
            ALTER TABLE public.registrations ADD CONSTRAINT uq_registrations_tournament_gamertag UNIQUE (tournament_id, gamertag);
            RAISE NOTICE 'Contrainte d''unicité uq_registrations_tournament_gamertag créée avec succès.';
        ELSE
            RAISE WARNING 'Des doublons de gamertag existent déjà dans la table. La contrainte UNIQUE (tournament_id, gamertag) n''a pas été forcée pour éviter une interruption.';
        END IF;
    END IF;
END $$;
