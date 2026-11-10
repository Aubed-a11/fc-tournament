import type { Tournament, Match, Registration, PlayerLeaderboard, User, PaymentSubmission } from '../types/index.ts';
import {
  INITIAL_TOURNAMENTS,
  INITIAL_MATCHES,
  INITIAL_REGISTRATIONS,
  INITIAL_LEADERBOARD,
} from '../data/initialData.ts';

// Increment this version whenever code source defaults change to purge/refresh stale browser cache
export const CURRENT_DATA_VERSION = '2026-11-10-v5';

const KEY_DATA_VERSION = 'fc_data_version';
const KEY_TOURNAMENTS = 'fc_store_tournaments';
const KEY_MATCHES = 'fc_store_matches';
const KEY_REGISTRATIONS = 'fc_store_registrations';
const KEY_PAYMENTS = 'fc_store_payments';

/**
 * Ensures that the client's localStorage cache does not block new source code data.
 * When the site is redeployed with a new version, this function automatically
 * updates the stored tournaments, matches, and registrations to reflect the latest code.
 */
export function ensureDataVersionSynced(): void {
  try {
    if (typeof window === 'undefined') return;

    const savedVersion = localStorage.getItem(KEY_DATA_VERSION);
    if (savedVersion !== CURRENT_DATA_VERSION) {
      console.log(`[FC DataStore] Synchronisation nouvelle version du code (${savedVersion} -> ${CURRENT_DATA_VERSION})`);
      localStorage.setItem(KEY_DATA_VERSION, CURRENT_DATA_VERSION);

      // Initialize / Update tournaments with new official names & entryFeeMAD 50
      const freshTournaments = INITIAL_TOURNAMENTS.map(t => ({
        ...t,
        entryFeeMAD: 50
      }));
      localStorage.setItem(KEY_TOURNAMENTS, JSON.stringify(freshTournaments));

      // Initialize / Update matches
      localStorage.setItem(KEY_MATCHES, JSON.stringify(INITIAL_MATCHES));

      // Preserve any locally added registrations while ensuring all official registrations exist
      const existingRaw = localStorage.getItem(KEY_REGISTRATIONS) || localStorage.getItem('fc_local_registrations');
      let localRegs: Registration[] = [];
      if (existingRaw) {
        try {
          localRegs = JSON.parse(existingRaw);
        } catch {}
      }

      const mergedRegsMap = new Map<string, Registration>();
      for (const r of INITIAL_REGISTRATIONS) {
        mergedRegsMap.set(r.id, r);
      }
      for (const r of localRegs) {
        // Also update tournament names if present
        if (r.tournamentName === 'Championnat' || r.tournamentId === 'tourn_spring_2026') {
          r.tournamentName = 'Championnat sur téléphone';
        } else if (
          r.tournamentName === 'Ligue des champions' ||
          r.tournamentName === 'Ligue des championnat' ||
          r.tournamentId === 'tourn_ligue_oriental_2026'
        ) {
          r.tournamentName = 'Championnat sur PC';
        }
        if (!mergedRegsMap.has(r.id)) {
          mergedRegsMap.set(r.id, r);
        }
      }
      const mergedList = Array.from(mergedRegsMap.values());
      localStorage.setItem(KEY_REGISTRATIONS, JSON.stringify(mergedList));
      localStorage.setItem('fc_local_registrations', JSON.stringify(mergedList));
    }
  } catch (err) {
    console.warn('[FC DataStore] Erreur synchronisation cache:', err);
  }
}

export function getStoredTournaments(): Tournament[] {
  try {
    if (typeof window === 'undefined') return INITIAL_TOURNAMENTS;
    ensureDataVersionSynced();
    const raw = localStorage.getItem(KEY_TOURNAMENTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return INITIAL_TOURNAMENTS;
}

export function saveStoredTournaments(tournaments: Tournament[]): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(KEY_TOURNAMENTS, JSON.stringify(tournaments));
    }
  } catch (err) {
    console.error('Error saving tournaments:', err);
  }
}

export function getStoredMatches(): Match[] {
  try {
    if (typeof window === 'undefined') return INITIAL_MATCHES;
    ensureDataVersionSynced();
    const raw = localStorage.getItem(KEY_MATCHES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return INITIAL_MATCHES;
}

export function saveStoredMatches(matches: Match[]): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(KEY_MATCHES, JSON.stringify(matches));
    }
  } catch (err) {
    console.error('Error saving matches:', err);
  }
}

export function getStoredRegistrations(): Registration[] {
  try {
    if (typeof window === 'undefined') return INITIAL_REGISTRATIONS;
    ensureDataVersionSynced();
    const raw = localStorage.getItem(KEY_REGISTRATIONS) || localStorage.getItem('fc_local_registrations');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return INITIAL_REGISTRATIONS;
}

export function saveStoredRegistrations(registrations: Registration[]): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(KEY_REGISTRATIONS, JSON.stringify(registrations));
      localStorage.setItem('fc_local_registrations', JSON.stringify(registrations));
    }
  } catch (err) {
    console.error('Error saving registrations:', err);
  }
}

/**
 * Computes dynamic leaderboard from stored or provided matches & registrations
 */
export function computeLocalLeaderboard(
  matchesList?: Match[],
  regsList?: Registration[]
): PlayerLeaderboard[] {
  const matches = matchesList || getStoredMatches();
  const regs = regsList || getStoredRegistrations();

  const playerStats = new Map<string, PlayerLeaderboard>();

  function getOrCreate(userId: string, gamertag: string, playerName: string): PlayerLeaderboard {
    if (!playerStats.has(userId)) {
      playerStats.set(userId, {
        userId,
        gamertag: gamertag || 'Joueur',
        playerName: playerName || gamertag || 'Joueur',
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(gamertag || 'player')}`,
        tournamentsPlayed: 0,
        matchesPlayed: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
        winRate: 0,
        trophies: 0,
        rank: 0,
      });
    }
    return playerStats.get(userId)!;
  }

  // Prepopulate from confirmed registrations
  for (const reg of regs) {
    if (reg.status === 'confirmed') {
      getOrCreate(reg.userId, reg.gamertag, reg.playerName);
    }
  }

  // Calculate from completed matches
  for (const match of matches) {
    if (
      match.status === 'completed' &&
      match.player1Score !== null &&
      match.player2Score !== null &&
      match.player1Id &&
      match.player2Id
    ) {
      const p1 = getOrCreate(match.player1Id, match.player1Gamertag, match.player1Gamertag);
      const p2 = getOrCreate(match.player2Id, match.player2Gamertag, match.player2Gamertag);

      p1.matchesPlayed++;
      p2.matchesPlayed++;
      p1.goalsFor += match.player1Score;
      p1.goalsAgainst += match.player2Score;
      p2.goalsFor += match.player2Score;
      p2.goalsAgainst += match.player1Score;

      if (match.player1Score > match.player2Score) {
        p1.wins++;
        p1.points += 3;
        p2.losses++;
      } else if (match.player2Score > match.player1Score) {
        p2.wins++;
        p2.points += 3;
        p1.losses++;
      } else {
        p1.draws++;
        p2.draws++;
        p1.points += 1;
        p2.points += 1;
      }
    }
  }

  const list = Array.from(playerStats.values()).map((p) => {
    p.goalDifference = p.goalsFor - p.goalsAgainst;
    p.winRate = p.matchesPlayed > 0 ? Math.round((p.wins / p.matchesPlayed) * 100) : 0;
    return p;
  });

  list.sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor);
  list.forEach((p, idx) => {
    p.rank = idx + 1;
  });

  return list.length > 0 ? list : INITIAL_LEADERBOARD;
}

export interface CompleteDatabaseExport {
  version: string;
  exportedAt: string;
  tournaments: Tournament[];
  matches: Match[];
  registrations: Registration[];
  leaderboard: PlayerLeaderboard[];
}

/**
 * Exports complete database object for backup / migration
 */
export function exportCompleteDatabase(): CompleteDatabaseExport {
  const tournaments = getStoredTournaments();
  const matches = getStoredMatches();
  const registrations = getStoredRegistrations();
  const leaderboard = computeLocalLeaderboard(matches, registrations);

  return {
    version: CURRENT_DATA_VERSION,
    exportedAt: new Date().toISOString(),
    tournaments,
    matches,
    registrations,
    leaderboard,
  };
}

/**
 * Imports a database object, validates fields, and saves to localStorage
 */
export function importCompleteDatabase(
  data: any
): { success: boolean; message: string; counts?: { tournaments: number; matches: number; registrations: number } } {
  try {
    if (!data || typeof data !== 'object') {
      return { success: false, message: 'Fichier JSON invalide ou vide.' };
    }

    const tournaments: Tournament[] = Array.isArray(data.tournaments) ? data.tournaments : [];
    const matches: Match[] = Array.isArray(data.matches) ? data.matches : [];
    const registrations: Registration[] = Array.isArray(data.registrations) ? data.registrations : [];

    if (tournaments.length === 0 && matches.length === 0 && registrations.length === 0) {
      return {
        success: false,
        message: 'Le fichier ne contient aucun tournoi, match ou inscription valide.',
      };
    }

    if (tournaments.length > 0) saveStoredTournaments(tournaments);
    if (matches.length > 0) saveStoredMatches(matches);
    if (registrations.length > 0) saveStoredRegistrations(registrations);

    localStorage.setItem(KEY_DATA_VERSION, CURRENT_DATA_VERSION);

    return {
      success: true,
      message: `Importation réussie avec succès ! ${tournaments.length} tournois, ${matches.length} matchs et ${registrations.length} inscriptions chargés.`,
      counts: {
        tournaments: tournaments.length,
        matches: matches.length,
        registrations: registrations.length,
      },
    };
  } catch (err: any) {
    return { success: false, message: `Erreur d’importation : ${err?.message || 'Format invalide'}` };
  }
}

/**
 * Resets local data to initial code source defaults
 */
export function resetToOfficialDefaults(): void {
  try {
    localStorage.setItem(KEY_DATA_VERSION, CURRENT_DATA_VERSION);
    localStorage.setItem(KEY_TOURNAMENTS, JSON.stringify(INITIAL_TOURNAMENTS));
    localStorage.setItem(KEY_MATCHES, JSON.stringify(INITIAL_MATCHES));
    localStorage.setItem(KEY_REGISTRATIONS, JSON.stringify(INITIAL_REGISTRATIONS));
    localStorage.setItem('fc_local_registrations', JSON.stringify(INITIAL_REGISTRATIONS));
  } catch (err) {
    console.error('Error resetting to official defaults:', err);
  }
}

export function getStoredPayments(): PaymentSubmission[] {
  try {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(KEY_PAYMENTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredPayment(payment: PaymentSubmission): void {
  try {
    if (typeof window === 'undefined') return;
    const list = getStoredPayments();
    const idx = list.findIndex((p) => p.id === payment.id);
    if (idx >= 0) {
      list[idx] = payment;
    } else {
      list.unshift(payment);
    }
    localStorage.setItem(KEY_PAYMENTS, JSON.stringify(list));
  } catch (err) {
    console.error('Error saving stored payment:', err);
  }
}

export function updateStoredPaymentStatus(
  id: string,
  status: 'pending' | 'accepted' | 'rejected',
  rejectionReason?: string
): void {
  try {
    if (typeof window === 'undefined') return;
    const list = getStoredPayments();
    const item = list.find((p) => p.id === id);
    if (item) {
      item.status = status;
      item.reviewedAt = new Date().toISOString();
      if (rejectionReason) item.rejectionReason = rejectionReason;
      localStorage.setItem(KEY_PAYMENTS, JSON.stringify(list));
    }
  } catch (err) {
    console.error('Error updating payment status:', err);
  }
}
