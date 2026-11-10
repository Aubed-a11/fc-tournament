/**
 * FC TOURNAMENT - Supabase Client-Side Service
 * Permet la communication directe et en temps réel entre le navigateur des utilisateurs
 * et la base de données Supabase, garantissant la réception des inscriptions même sur
 * des hébergements statiques ou serverless (Vercel, Netlify, Hostinger).
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Registration } from '../types/index.ts';

let supabaseClientInstance: SupabaseClient | null = null;

// Configuration keys (Vite client env variables)
const VITE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const VITE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClientInstance) return supabaseClientInstance;

  // 1. Try Vite environment variables
  let url = VITE_URL;
  let anonKey = VITE_ANON;

  // 2. Try window global configuration if injected by server
  if (!url || !anonKey) {
    const winConfig = (typeof window !== 'undefined' && (window as any).__FC_SUPABASE_CONFIG__) || null;
    if (winConfig && winConfig.url && winConfig.anonKey) {
      url = winConfig.url;
      anonKey = winConfig.anonKey;
    }
  }

  // 3. Try localStorage cached config from /api/admin/studio/config
  if (!url || !anonKey) {
    try {
      const cached = localStorage.getItem('fc_supabase_public_config');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.url && parsed.anonKey) {
          url = parsed.url;
          anonKey = parsed.anonKey;
        }
      }
    } catch {
      // Ignore storage error
    }
  }

  if (url && anonKey) {
    try {
      supabaseClientInstance = createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
      return supabaseClientInstance;
    } catch (err) {
      console.warn('[SUPABASE CLIENT] Erreur d’initialisation du client Supabase:', err);
    }
  }

  return null;
}

export function isSupabaseClientConfigured(): boolean {
  return getSupabaseClient() !== null;
}

// Convert Application Registration to Supabase DB Row
export function mapRegistrationToRow(reg: Registration) {
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

// Convert Supabase DB Row to Application Registration
export function mapRowToRegistration(row: any): Registration {
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

/**
 * Enregistre directement l'inscription dans Supabase depuis le frontend
 */
export async function saveRegistrationToSupabase(reg: Registration): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Client Supabase non initialisé.' };
  }

  try {
    const row = mapRegistrationToRow(reg);
    const { error } = await client.from('registrations').upsert(row, { onConflict: 'id' });

    if (error) {
      console.warn('[SUPABASE CLIENT] Erreur upsert inscription:', error.message);
      return { success: false, error: error.message };
    }

    console.log(`[SUPABASE CLIENT] Inscription ${reg.registrationNumber || reg.id} sauvegardée avec succès.`);
    return { success: true };
  } catch (err: any) {
    console.error('[SUPABASE CLIENT] Exception sauvegarde inscription:', err);
    return { success: false, error: err?.message || 'Erreur inattendue Supabase' };
  }
}

/**
 * Récupère toutes les inscriptions depuis Supabase
 */
export async function fetchRegistrationsFromSupabase(): Promise<Registration[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('registrations')
      .select('*')
      .order('registered_at', { ascending: false });

    if (error) {
      console.warn('[SUPABASE CLIENT] Erreur lecture inscriptions:', error.message);
      return [];
    }

    return (data || []).map(mapRowToRegistration);
  } catch (err) {
    console.warn('[SUPABASE CLIENT] Exception lecture inscriptions:', err);
    return [];
  }
}

/**
 * Met à jour le statut d'une inscription dans Supabase (Accepter / Refuser)
 */
export async function updateRegistrationInSupabase(
  regId: string,
  updates: Partial<Registration>
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Client Supabase non initialisé.' };
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
      console.warn('[SUPABASE CLIENT] Erreur mise à jour statut:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Erreur mise à jour' };
  }
}

/**
 * Écoute en temps réel les nouvelles inscriptions et les mises à jour de statut
 */
export function subscribeToSupabaseRegistrations(
  onInsert: (reg: Registration) => void,
  onUpdate: (reg: Registration) => void
): (() => void) | null {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const channel = client
      .channel('fc-registrations-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'registrations' },
        (payload) => {
          if (payload.new) {
            const reg = mapRowToRegistration(payload.new);
            onInsert(reg);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'registrations' },
        (payload) => {
          if (payload.new) {
            const reg = mapRowToRegistration(payload.new);
            onUpdate(reg);
          }
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  } catch (err) {
    console.warn('[SUPABASE CLIENT] Impossible de s’abonner au canal Realtime:', err);
    return null;
  }
}
