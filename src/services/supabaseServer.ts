/**
 * FC TOURNAMENT - Supabase Server Integration & Synchronization
 * Gère l'écriture, la synchronisation et la persistance dans Supabase avec le rôle Service Role ou Anon.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Registration } from '../types/index.ts';

let supabaseInstance: SupabaseClient | null = null;
let hasCheckedEnv = false;

export function getSupabaseServerClient(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY;

  if (url && key) {
    try {
      supabaseInstance = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      if (!hasCheckedEnv) {
        console.log(`[SUPABASE] Client serveur initialisé avec succès vers ${url}`);
        hasCheckedEnv = true;
      }
      return supabaseInstance;
    } catch (err) {
      console.warn('[SUPABASE] Erreur lors de l’initialisation du client Supabase:', err);
    }
  }

  return null;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL) &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.SUPABASE_ANON_KEY ||
        process.env.VITE_SUPABASE_ANON_KEY)
  );
}

export function getPublicSupabaseConfig() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || null;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || null;

  return {
    configured: Boolean(url && anonKey),
    url,
    anonKey,
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
  };
}

// Synchronize new registration to Supabase
export async function syncRegistrationToSupabase(reg: Registration): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseServerClient();
  if (!client) {
    return { success: false, error: 'Supabase n’est pas encore configuré (URL ou clé absente).' };
  }

  try {
    const row = mapRegistrationToSupabaseRow(reg);
    const { error } = await client.from('registrations').upsert(row, { onConflict: 'id' });

    if (error) {
      console.warn('[SUPABASE] Erreur lors de l’insertion de l’inscription:', error.message);
      return { success: false, error: error.message };
    }

    console.log(`[SUPABASE] Inscription ${reg.registrationNumber || reg.id} synchronisée avec succès dans Supabase.`);
    return { success: true };
  } catch (err: any) {
    console.error('[SUPABASE] Exception lors de la synchronisation:', err);
    return { success: false, error: err?.message || 'Erreur inattendue' };
  }
}

// Synchronize status update (Accept/Reject) to Supabase
export async function updateRegistrationStatusInSupabase(
  regId: string,
  updates: Partial<Registration>
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseServerClient();
  if (!client) {
    return { success: false, error: 'Supabase n’est pas encore configuré.' };
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

    const { error } = await client.from('registrations').update(patch).eq('id', regId);

    if (error) {
      console.warn(`[SUPABASE] Erreur mise à jour statut ${regId}:`, error.message);
      return { success: false, error: error.message };
    }

    console.log(`[SUPABASE] Statut inscription ${regId} mis à jour dans Supabase (${updates.status}).`);
    return { success: true };
  } catch (err: any) {
    console.error('[SUPABASE] Exception mise à jour statut:', err);
    return { success: false, error: err?.message || 'Erreur inattendue' };
  }
}
