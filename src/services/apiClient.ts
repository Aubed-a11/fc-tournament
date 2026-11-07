import type { Tournament, Match, PlayerLeaderboard, Registration } from '../types/index.ts';
import { INITIAL_TOURNAMENTS, INITIAL_MATCHES, INITIAL_LEADERBOARD } from '../data/initialData.ts';
import { saveRegistrationToSupabase } from './supabaseClient.ts';

const LOCAL_REGS_KEY = 'fc_local_registrations';

export function getLocalRegistrations(): Registration[] {
  try {
    const raw = localStorage.getItem(LOCAL_REGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalRegistration(reg: Registration): void {
  try {
    const list = getLocalRegistrations();
    const existingIdx = list.findIndex((r) => r.id === reg.id || (r.tournamentId === reg.tournamentId && r.gamertag.toLowerCase() === reg.gamertag.toLowerCase()));
    if (existingIdx >= 0) {
      list[existingIdx] = reg;
    } else {
      list.push(reg);
    }
    localStorage.setItem(LOCAL_REGS_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('Error saving local registration:', err);
  }
}

export const apiClient = {
  // Fetch all tournaments
  async getTournaments(): Promise<Tournament[]> {
    try {
      const res = await fetch('/api/tournaments');
      if (res.ok) {
        const text = await res.text();
        if (text.startsWith('[') || text.startsWith('{')) {
          const data = JSON.parse(text);
          if (Array.isArray(data) && data.length > 0) {
            return data;
          }
        }
      }
    } catch {
      // Fallback
    }

    // Static fallback for Vercel/Netlify hosting
    const localRegs = getLocalRegistrations();
    return INITIAL_TOURNAMENTS.map((t) => {
      const addedCount = localRegs.filter((r) => r.tournamentId === t.id && r.status === 'confirmed').length;
      return {
        ...t,
        participantsCount: (t.participantsCount || 0) + addedCount,
        confirmedCount: (t.confirmedCount || 0) + addedCount,
      };
    });
  },

  // Fetch single tournament details
  async getTournament(id: string, token?: string | null): Promise<(Tournament & { registrations?: Registration[]; matches?: Match[]; userRegistration?: Registration | null }) | null> {
    try {
      const res = await fetch(`/api/tournaments/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const text = await res.text();
        if (text.startsWith('{')) {
          return JSON.parse(text);
        }
      }
    } catch {
      // Fallback
    }

    // Static fallback for Vercel/Netlify hosting
    const base = INITIAL_TOURNAMENTS.find((t) => t.id === id || t.slug === id);
    if (!base) return null;

    const tournMatches = INITIAL_MATCHES.filter((m) => m.tournamentId === base.id);
    const localRegs = getLocalRegistrations().filter((r) => r.tournamentId === base.id);
    const userReg = localRegs.length > 0 ? localRegs[localRegs.length - 1] : null;

    return {
      ...base,
      participantsCount: (base.participantsCount || 0) + localRegs.filter((r) => r.status === 'confirmed').length,
      confirmedCount: (base.confirmedCount || 0) + localRegs.filter((r) => r.status === 'confirmed').length,
      matches: tournMatches,
      registrations: [], // privacy protected
      userRegistration: userReg,
    };
  },

  // Fetch matches
  async getMatches(): Promise<Match[]> {
    try {
      const res = await fetch('/api/matches');
      if (res.ok) {
        const text = await res.text();
        if (text.startsWith('[') || text.startsWith('{')) {
          const data = JSON.parse(text);
          if (Array.isArray(data) && data.length > 0) {
            return data;
          }
        }
      }
    } catch {
      // Fallback
    }
    return INITIAL_MATCHES;
  },

  // Fetch leaderboard
  async getLeaderboard(): Promise<PlayerLeaderboard[]> {
    try {
      const res = await fetch('/api/leaderboard');
      if (res.ok) {
        const text = await res.text();
        if (text.startsWith('[') || text.startsWith('{')) {
          const data = JSON.parse(text);
          if (Array.isArray(data) && data.length > 0) {
            return data;
          }
        }
      }
    } catch {
      // Fallback
    }
    return INITIAL_LEADERBOARD;
  },

  // Submit tournament registration
  async registerForTournament(tournamentId: string, payload: any, token?: string | null): Promise<{ success: boolean; registration?: Registration; message: string; error?: string }> {
    // Notify FormBold in background
    const notifyFormBold = (regNumber?: string) => {
      try {
        const formParams = new URLSearchParams();
        formParams.append('Email', payload.userEmail || 'alio227ng@gmail.com');
        formParams.append('email', payload.userEmail || 'alio227ng@gmail.com');
        formParams.append('name', `${payload.playerName} (${payload.gamertag})`);
        formParams.append('gamertag', payload.gamertag || '');
        formParams.append('phone', payload.phone || '');
        formParams.append('tournament', payload.tournamentName || tournamentId);
        formParams.append('subject', `[FC TOURNAMENT] Inscription ${regNumber || ''} : ${payload.gamertag}`);
        formParams.append(
          'message',
          `NOUVELLE INSCRIPTION AU TOURNOI SUR FC TOURNAMENT :\n\n` +
          `Numéro : ${regNumber || 'En cours d’attribution'}\n` +
          `Tournoi : ${payload.tournamentName || tournamentId}\n` +
          `Joueur : ${payload.playerName}\n` +
          `Gamertag : ${payload.gamertag}\n` +
          `Email : ${payload.userEmail}\n` +
          `Téléphone : ${payload.phone || 'Non renseigné'}\n` +
          `Preuve de paiement : ${payload.paymentProofName || 'Capture jointe'}\n` +
          `Notes / Remarques : ${payload.notes || 'Aucune'}\n` +
          `Date : ${new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Casablanca' })}\n\n` +
          `Tableau de bord administrateur : ${typeof window !== 'undefined' ? `${window.location.origin}/#admin` : 'https://fc-tournament.com/#admin'}`
        );

        fetch('https://formbold.com/s/oWp4p', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
          body: formParams.toString(),
        }).catch(() => {});
      } catch {
        // Ignore background notification error
      }
    };

    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.registration) {
          saveLocalRegistration(data.registration);
          // Also persist directly into Supabase from client to guarantee cloud storage
          saveRegistrationToSupabase(data.registration).catch(() => {});
        }
        notifyFormBold(data.registration?.registrationNumber);
        return {
          success: true,
          registration: data.registration,
          message: data.message || 'Votre inscription a bien été enregistrée et transmise pour validation !',
        };
      } else {
        const errData = await res.json().catch(() => null);
        if (errData && errData.error && res.status !== 404 && res.status !== 502) {
          return { success: false, error: errData.error, message: errData.error };
        }
      }
    } catch {
      // Server offline or unavailable on static deployment
    }

    // Direct Cloud & Local Fallback (for static Netlify / Vercel hosting)
    const localCount = getLocalRegistrations().length + 1;
    const generatedNumber = `REG-2026-${String(localCount).padStart(4, '0')}`;
    const newReg: Registration = {
      id: `reg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      registrationNumber: generatedNumber,
      tournamentId,
      tournamentName: payload.tournamentName || 'Tournoi FC',
      userId: `user_${Date.now()}`,
      gamertag: payload.gamertag,
      playerName: payload.playerName,
      userEmail: payload.userEmail,
      phone: payload.phone,
      paymentProof: payload.paymentProof,
      paymentProofName: payload.paymentProofName || 'capture_paiement.png',
      status: 'pending',
      registeredAt: new Date().toISOString(),
      whatsappInviteStatus: 'not_sent',
    };

    saveLocalRegistration(newReg);
    // Write directly to Supabase
    saveRegistrationToSupabase(newReg).catch((err) => {
      console.warn('[SUPABASE FALLBACK] Erreur enregistrement cloud:', err);
    });
    notifyFormBold(generatedNumber);

    return {
      success: true,
      registration: newReg,
      message: 'Votre inscription a bien été enregistrée et transmise aux administrateurs pour validation !',
    };
  },
};
