/**
 * FC TOURNAMENT - Supabase Server Integration & Synchronization
 * Gestion de la connexion principale, vérification de connectivité,
 * persistance des inscriptions, synchronisation et migration des données.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Registration, Tournament } from '../types/index.ts';

let supabaseServerInstance: SupabaseClient | null = null;
let lastTestedUrl: string | null = null;

export function normalizeSupabaseUrl(rawUrl: string | undefined | null): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;
  return trimmed.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
}

/**
 * Récupère ou initialise l'instance Supabase côté serveur.
 * Priorise la clé SUPABASE_SERVICE_ROLE_KEY pour un accès administrateur complet et sécurisé côté backend,
 * avec repli automatique sur SUPABASE_ANON_KEY si la clé service_role n'est pas fournie.
 */
export function getSupabaseServerClient(): SupabaseClient | null {
  const rawUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const url = normalizeSupabaseUrl(rawUrl);
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  const cleanKey = key.trim();

  // Si l'URL a changé ou si l'instance n'existe pas encore
  if (!supabaseServerInstance || lastTestedUrl !== url) {
    try {
      supabaseServerInstance = createClient(url, cleanKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
      lastTestedUrl = url;
    } catch (err: any) {
      console.error('[SUPABASE SERVER] Échec initialisation client:', err?.message || err);
      return null;
    }
  }

  return supabaseServerInstance;
}

/**
 * Vérifie si les variables d'environnement Supabase sont renseignées.
 */
export function isSupabaseConfigured(): boolean {
  const url = normalizeSupabaseUrl(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY;
  return Boolean(url && key);
}

/**
 * Retourne la configuration publique sans JAMAIS exposer la clé SERVICE_ROLE.
 */
export function getPublicSupabaseConfig() {
  const url = normalizeSupabaseUrl(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);
  const anonKey = (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim() || null;

  return {
    configured: Boolean(url && anonKey),
    url,
    anonKey,
  };
}

export interface SupabaseConnectivityResult {
  configured: boolean;
  connected: boolean;
  tableExists: boolean;
  tournamentsTableExists: boolean;
  rowCount: number;
  tournamentsCount: number;
  url?: string;
  hasServiceRoleKey: boolean;
  error?: string;
  regError?: any;
  tournError?: any;
}

/**
 * Effectue un test réel de connectivité avec la base Supabase distante.
 * Vérifie l'accessibilité de l'instance et l'existence des tables nécessaires.
 */
export async function checkSupabaseConnectivity(): Promise<SupabaseConnectivityResult> {
  const url = normalizeSupabaseUrl(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);
  const hasServiceRoleKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!isSupabaseConfigured() || !url) {
    return {
      configured: false,
      connected: false,
      tableExists: false,
      tournamentsTableExists: false,
      rowCount: 0,
      tournamentsCount: 0,
      hasServiceRoleKey: false,
      error: 'Variables SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquantes dans l’environnement.',
    };
  }

  const client = getSupabaseServerClient();
  if (!client) {
    return {
      configured: true,
      connected: false,
      tableExists: false,
      tournamentsTableExists: false,
      rowCount: 0,
      tournamentsCount: 0,
      hasServiceRoleKey,
      error: 'Impossible d’instancier le client Supabase.',
    };
  }

  let tableExists = false;
  let tournamentsTableExists = false;
  let rowCount = 0;
  let tournamentsCount = 0;
  let finalError: string | undefined;

  let regErrorDetail: any = null;
  let tournErrorDetail: any = null;

  // 1. Vérification de la table registrations
  try {
    const { error: regError, count } = await client
      .from('registrations')
      .select('id', { count: 'exact' })
      .limit(1);

    regErrorDetail = regError ? { code: regError.code, message: regError.message, details: regError.details } : null;

    if (regError) {
      tableExists = false;
      finalError = regError.message;
      if (
        regError.message.includes('Could not find the table') ||
        regError.message.includes('schema cache') ||
        regError.code === '42P01' ||
        regError.code === 'PGRST205'
      ) {
        finalError = "La table 'registrations' n'existe pas encore dans Supabase. Veuillez exécuter 'supabase_schema.sql' dans l'Éditeur SQL Supabase.";
      }
    } else {
      tableExists = true;
      rowCount = count || 0;
    }
  } catch (err: any) {
    tableExists = false;
    finalError = err?.message || 'Erreur réseau vers Supabase';
  }

  // 2. Vérification de la table tournaments
  try {
    const { error: tournError, count: tCount } = await client
      .from('tournaments')
      .select('id', { count: 'exact' })
      .limit(1);

    tournErrorDetail = tournError ? { code: tournError.code, message: tournError.message, details: tournError.details } : null;

    if (tournError) {
      tournamentsTableExists = false;
      if (!finalError) finalError = tournError.message;
    } else {
      tournamentsTableExists = true;
      tournamentsCount = tCount || 0;
    }
  } catch {
    tournamentsTableExists = false;
  }

  const connected = tableExists || tournamentsTableExists || !finalError || Boolean(finalError.includes('schema cache'));

  return {
    configured: true,
    connected,
    tableExists,
    tournamentsTableExists,
    rowCount,
    tournamentsCount,
    url: url || undefined,
    hasServiceRoleKey,
    error: finalError,
    regError: regErrorDetail,
    tournError: tournErrorDetail,
  };
}

// Convert application Registration object to Supabase database column names
export function mapRegistrationToSupabaseRow(reg: Registration) {
  return {
    id: reg.id,
    registration_number: reg.registrationNumber || `REG-2026-${String(reg.seed || 1).padStart(4, '0')}`,
    tournament_id: reg.tournamentId,
    tournament_name: reg.tournamentName || null,
    user_id: reg.userId || null,
    gamertag: reg.gamertag,
    player_name: reg.playerName,
    user_email: reg.userEmail || null,
    phone: reg.phone || null,
    team_selected: reg.teamSelected || null,
    controller_preference: reg.controllerPreference || null,
    notes: reg.notes || null,
    payment_proof: reg.paymentProof || null,
    payment_proof_name: reg.paymentProofName || null,
    status: reg.status || 'pending',
    registered_at: reg.registeredAt || new Date().toISOString(),
    validated_at: reg.validatedAt || null,
    rejected_at: reg.rejectedAt || null,
    rejection_reason: reg.rejectionReason || null,
    reviewed_by: reg.reviewedBy || null,
    seed: reg.seed ?? null,
    whatsapp_invite_status: reg.whatsappInviteStatus || 'not_sent',
    whatsapp_invite_sent_at: reg.whatsappInviteSentAt || null,
    whatsapp_invite_error: reg.whatsappInviteError || null,
    whatsapp_invite_attempts: reg.whatsappInviteAttempts || 0,
  };
}

// Convert Supabase row back to application Registration object
export function mapSupabaseRowToRegistration(row: any): Registration {
  return {
    id: row.id,
    registrationNumber: row.registration_number,
    tournamentId: row.tournament_id,
    tournamentName: row.tournament_name || undefined,
    userId: row.user_id || 'guest',
    gamertag: row.gamertag,
    playerName: row.player_name,
    userEmail: row.user_email || undefined,
    phone: row.phone || undefined,
    teamSelected: row.team_selected || undefined,
    controllerPreference: row.controller_preference || undefined,
    notes: row.notes || undefined,
    paymentProof: row.payment_proof || undefined,
    paymentProofName: row.payment_proof_name || undefined,
    status: row.status,
    registeredAt: row.registered_at,
    validatedAt: row.validated_at || undefined,
    rejectedAt: row.rejected_at || undefined,
    rejectionReason: row.rejection_reason || undefined,
    reviewedBy: row.reviewed_by || undefined,
    seed: row.seed || undefined,
    whatsappInviteStatus: row.whatsapp_invite_status || 'not_sent',
    whatsappInviteSentAt: row.whatsapp_invite_sent_at || undefined,
    whatsappInviteError: row.whatsapp_invite_error || undefined,
    whatsappInviteAttempts: row.whatsapp_invite_attempts || 0,
  };
}

// Convert Tournament to Supabase row format
export function mapTournamentToSupabaseRow(t: Tournament) {
  return {
    id: t.id,
    name: t.name,
    slug: t.slug,
    description: t.description || null,
    game_version: t.gameVersion || 'EA SPORTS FC 26',
    platform: t.platform || 'PlayStation 5',
    format: t.format || 'bracket',
    location: t.location || null,
    city: t.city || null,
    start_date: t.startDate || null,
    time: t.time || null,
    registration_deadline: t.registrationDeadline || null,
    max_participants: t.maxParticipants || 32,
    entry_fee_mad: t.entryFeeMAD || 0,
    prize_pool: t.prizePool || null,
    status: t.status || 'open',
    rules: t.rules || null,
    banner_image: t.bannerImage || null,
    created_at: t.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Insertion directe d'une nouvelle inscription dans Supabase.
 * Échoue explicitement si Supabase n'est pas accessible ou rejette l'insertion.
 */
export async function insertRegistrationToSupabase(
  reg: Registration
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseServerClient();
  if (!client) {
    return {
      success: false,
      error: 'Supabase n’est pas configuré sur le serveur (SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY absent).',
    };
  }

  try {
    const row = mapRegistrationToSupabaseRow(reg);
    const { error } = await client.from('registrations').insert(row);

    if (error) {
      console.error('[SUPABASE SERVER] Erreur lors de l’insertion de l’inscription:', error.message);
      return { success: false, error: error.message };
    }

    console.log(`[SUPABASE SERVER] Inscription ${reg.registrationNumber || reg.id} enregistrée avec succès dans Supabase.`);
    return { success: true };
  } catch (err: any) {
    console.error('[SUPABASE SERVER] Exception lors de l’insertion:', err);
    return { success: false, error: err?.message || 'Erreur inattendue de connexion Supabase' };
  }
}

/**
 * Synchronisation (Upsert) d'une inscription dans Supabase (utilisée pour import/sync).
 */
export async function syncRegistrationToSupabase(
  reg: Registration
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseServerClient();
  if (!client) {
    return { success: false, error: 'Supabase n’est pas configuré sur le serveur.' };
  }

  try {
    const row = mapRegistrationToSupabaseRow(reg);
    const { error } = await client.from('registrations').upsert(row, { onConflict: 'id' });

    if (error) {
      console.warn('[SUPABASE SERVER] Erreur lors de l’upsert inscription:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Erreur inattendue' };
  }
}

/**
 * Met à jour le statut d'une inscription directement dans Supabase.
 */
export async function updateRegistrationStatusInSupabase(
  regId: string,
  updates: Partial<Registration>
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseServerClient();
  if (!client) {
    return { success: false, error: 'Supabase n’est pas configuré sur le serveur.' };
  }

  try {
    const patch: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.status) patch.status = updates.status;
    if (updates.validatedAt !== undefined) patch.validated_at = updates.validatedAt;
    if (updates.rejectedAt !== undefined) patch.rejected_at = updates.rejectedAt;
    if (updates.rejectionReason !== undefined) patch.rejection_reason = updates.rejectionReason;
    if (updates.reviewedBy !== undefined) patch.reviewed_by = updates.reviewedBy;
    if (updates.whatsappInviteStatus !== undefined) patch.whatsapp_invite_status = updates.whatsappInviteStatus;
    if (updates.whatsappInviteSentAt !== undefined) patch.whatsapp_invite_sent_at = updates.whatsappInviteSentAt;
    if (updates.whatsappInviteError !== undefined) patch.whatsapp_invite_error = updates.whatsappInviteError;
    if (updates.whatsappInviteAttempts !== undefined) patch.whatsapp_invite_attempts = updates.whatsappInviteAttempts;

    const { error } = await client.from('registrations').update(patch).eq('id', regId);

    if (error) {
      console.error(`[SUPABASE SERVER] Erreur mise à jour statut ${regId}:`, error.message);
      return { success: false, error: error.message };
    }

    console.log(`[SUPABASE SERVER] Statut inscription ${regId} mis à jour dans Supabase (${updates.status}).`);
    return { success: true };
  } catch (err: any) {
    console.error('[SUPABASE SERVER] Exception mise à jour statut:', err);
    return { success: false, error: err?.message || 'Erreur inattendue' };
  }
}

/**
 * Supprime une inscription dans Supabase.
 */
export async function deleteRegistrationFromSupabase(
  regId: string
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseServerClient();
  if (!client) {
    return { success: false, error: 'Supabase non configuré.' };
  }

  try {
    const { error } = await client.from('registrations').delete().eq('id', regId);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Erreur suppression' };
  }
}

/**
 * Récupère l'intégralité des inscriptions depuis Supabase.
 */
export async function fetchRegistrationsFromSupabase(): Promise<Registration[]> {
  const client = getSupabaseServerClient();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('registrations')
      .select('*')
      .order('registered_at', { ascending: false });

    if (error) {
      console.warn('[SUPABASE SERVER] Erreur lors de la lecture des inscriptions:', error.message);
      return [];
    }

    return (data || []).map(mapSupabaseRowToRegistration);
  } catch (err: any) {
    console.warn('[SUPABASE SERVER] Exception lecture inscriptions:', err?.message || err);
    return [];
  }
}

/**
 * Migre l'ensemble des tournois et inscriptions vers Supabase (batch upsert sécurisé).
 */
export async function migrateAllToSupabase(
  tournaments: Tournament[],
  registrations: Registration[]
): Promise<{
  success: boolean;
  tournamentsCount: number;
  registrationsCount: number;
  error?: string;
}> {
  const client = getSupabaseServerClient();
  if (!client) {
    return {
      success: false,
      tournamentsCount: 0,
      registrationsCount: 0,
      error: 'Supabase n’est pas configuré. Veuillez renseigner SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.',
    };
  }

  try {
    // 1. Upsert tournaments first (foreign key dependency)
    const tournRows = tournaments.map(mapTournamentToSupabaseRow);
    const { error: tournErr } = await client
      .from('tournaments')
      .upsert(tournRows, { onConflict: 'id' });

    if (tournErr) {
      return {
        success: false,
        tournamentsCount: 0,
        registrationsCount: 0,
        error: `Erreur migration tournois: ${tournErr.message}`,
      };
    }

    // 2. Upsert registrations in batches
    const regRows = registrations.map(mapRegistrationToSupabaseRow);
    const BATCH_SIZE = 50;
    for (let i = 0; i < regRows.length; i += BATCH_SIZE) {
      const chunk = regRows.slice(i, i + BATCH_SIZE);
      const { error: regErr } = await client
        .from('registrations')
        .upsert(chunk, { onConflict: 'id' });

      if (regErr) {
        return {
          success: false,
          tournamentsCount: tournRows.length,
          registrationsCount: i,
          error: `Erreur migration inscriptions (lot ${i}): ${regErr.message}`,
        };
      }
    }

    return {
      success: true,
      tournamentsCount: tournRows.length,
      registrationsCount: regRows.length,
    };
  } catch (err: any) {
    return {
      success: false,
      tournamentsCount: 0,
      registrationsCount: 0,
      error: err?.message || 'Erreur inattendue lors de la migration',
    };
  }
}
