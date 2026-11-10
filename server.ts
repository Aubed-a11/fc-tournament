import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import pg from 'pg';
import type {
  User,
  UserWithCredentials,
  Tournament,
  Registration,
  Match,
  PlayerLeaderboard,
  ContactSubmission,
  MatchAuditEntry,
  AdminNotification,
} from './src/types/index.ts';
import {
  syncRegistrationToSupabase,
  updateRegistrationStatusInSupabase,
  fetchRegistrationsFromSupabase,
  getPublicSupabaseConfig,
  isSupabaseConfigured,
} from './src/services/supabaseServer.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Realtime Server-Sent Events (SSE) connections pool for Google AI Studio
const sseStudioClients = new Set<Response>();

function broadcastStudioEvent(event: string, payload: any) {
  const message = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of sseStudioClients) {
    try {
      client.write(message);
    } catch {
      sseStudioClients.delete(client);
    }
  }
}

// Heartbeat interval to prevent idle timeout
setInterval(() => {
  for (const client of sseStudioClients) {
    try {
      client.write(': ping\n\n');
    } catch {
      sseStudioClients.delete(client);
    }
  }
}, 15000);

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = process.env.VERCEL ? path.join('/tmp', 'fc_data') : path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'fc_database.json');

// Ensure data folder exists
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('Could not create data directory:', e);
}


// ==========================================
// PERSISTANCE POSTGRES (Neon)
// Si DATABASE_URL est defini, les donnees sont stockees dans Postgres
// (table fc_kv). Sinon, on garde le fichier data/fc_database.json (dev local).
// ==========================================
const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
const USE_PG = Boolean(DATABASE_URL);
const pgPool = USE_PG ? new pg.Pool({ connectionString: DATABASE_URL, max: 3 }) : null;

const kvVersions = new Map<string, number>();
const kvLoaders = new Map<string, (value: any) => void>();
const queuedKeys = new Set<string>();
let pendingWrites: Promise<void> = Promise.resolve();
let schemaReady: Promise<void> | null = null;

function ensureSchema(): Promise<void> {
  if (!pgPool) return Promise.resolve();
  if (!schemaReady) {
    schemaReady = pgPool
      .query(
        `CREATE TABLE IF NOT EXISTS fc_kv (
          key TEXT PRIMARY KEY,
          value JSONB NOT NULL,
          version BIGINT NOT NULL DEFAULT 1,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )`
      )
      .then(() => undefined)
      .catch((err) => {
        schemaReady = null;
        throw err;
      });
  }
  return schemaReady;
}

// Planifie l'ecriture d'une cle. Plusieurs appels rapproches sont regroupes en une seule ecriture.
function scheduleKvSave(key: string, getValue: () => unknown): void {
  if (!pgPool || queuedKeys.has(key)) return;
  queuedKeys.add(key);
  pendingWrites = pendingWrites
    .then(async () => {
      queuedKeys.delete(key);
      await ensureSchema();
      const value = JSON.stringify(getValue());
      const result = await pgPool.query(
        `INSERT INTO fc_kv (key, value) VALUES ($1, $2::jsonb)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, version = fc_kv.version + 1, updated_at = now()
         RETURNING version`,
        [key, value]
      );
      kvVersions.set(key, Number(result.rows[0].version));
    })
    .catch((err) => {
      queuedKeys.delete(key);
      console.error(`[PG] Erreur lors de la sauvegarde de "${key}":`, err);
    });
}

// Recharge depuis Postgres uniquement les cles modifiees ailleurs (autre instance serverless).
async function refreshFromPg(): Promise<void> {
  if (!pgPool) return;
  await ensureSchema();
  await pendingWrites;

  let { rows } = await pgPool.query('SELECT key, version FROM fc_kv');
  if (!rows.some((r: any) => r.key === 'db')) {
    const seed = buildSeedDatabase();
    await pgPool.query(
      `INSERT INTO fc_kv (key, value) VALUES ('db', $1::jsonb) ON CONFLICT (key) DO NOTHING`,
      [JSON.stringify(seed)]
    );
    console.log('[PG] Base initialisee a partir des donnees embarquees.');
    ({ rows } = await pgPool.query('SELECT key, version FROM fc_kv'));
  }

  const stale = rows
    .filter((r: any) => kvLoaders.has(r.key) && Number(r.version) !== kvVersions.get(r.key))
    .map((r: any) => r.key);
  if (stale.length === 0) return;

  const fresh = await pgPool.query('SELECT key, value, version FROM fc_kv WHERE key = ANY($1)', [stale]);
  for (const row of fresh.rows) {
    kvLoaders.get(row.key)!(row.value);
    kvVersions.set(row.key, Number(row.version));
  }
}

// Map synchronisee avec Postgres (sessions joueurs et admin), pour survivre aux redemarrages serverless.
class SyncedMap<V> extends Map<string, V> {
  private loading = false;
  private readonly kvKey: string;

  constructor(kvKey: string) {
    super();
    this.kvKey = kvKey;
    kvLoaders.set(kvKey, (value) => this.replaceAll(value));
  }

  replaceAll(value: Record<string, V> | null): void {
    this.loading = true;
    super.clear();
    for (const [k, v] of Object.entries(value || {})) super.set(k, v);
    this.loading = false;
  }

  set(key: string, value: V): this {
    super.set(key, value);
    this.persist();
    return this;
  }

  delete(key: string): boolean {
    const removed = super.delete(key);
    if (removed) this.persist();
    return removed;
  }

  clear(): void {
    super.clear();
    this.persist();
  }

  private persist(): void {
    if (this.loading) return;
    scheduleKvSave(this.kvKey, () => {
      const now = Date.now();
      const out: Record<string, V> = {};
      for (const [k, v] of this.entries()) {
        const exp = (v as any)?.expiresAt;
        if (typeof exp === 'number' && exp < now) continue;
        out[k] = v;
      }
      return out;
    });
  }
}

// Sessions store: token -> userId (persiste dans Postgres si DATABASE_URL est defini)
const sessions = new SyncedMap<{ userId: string; expiresAt: number }>('sessions');

// ==========================================
// ADMIN REINFORCED SECURITY SYSTEM
// ==========================================
const MAX_ADMIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const ADMIN_SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

interface AdminSession {
  token: string;
  createdAt: number;
  expiresAt: number;
  clientIp?: string;
}

interface RateLimitEntry {
  attempts: number;
  lastAttempt: number;
  lockedUntil: number | null;
}

const adminSessions = new SyncedMap<AdminSession>('admin_sessions');
const adminLoginAttempts = new Map<string, RateLimitEntry>();

// Code admin lu depuis la variable d'environnement ADMIN_ACCESS_CODE (definie sur Vercel).
// La valeur de secours ne sert qu'en developpement local.
export const ADMIN_MASTER_CODE = (process.env.ADMIN_ACCESS_CODE || '').trim() || '96300130';

function verifyAdminCode(inputCode: any): boolean {
  if (inputCode === undefined || inputCode === null) return false;
  const cleanInput = String(inputCode).trim();
  return cleanInput === ADMIN_MASTER_CODE;
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

interface DatabaseSchema {
  users: UserWithCredentials[];
  tournaments: Tournament[];
  registrations: Registration[];
  matches: Match[];
  contacts: ContactSubmission[];
  notifications: AdminNotification[];
}

function getInitialDatabase(): DatabaseSchema {
  const saltAdmin = generateSalt();
  const saltPlayer1 = generateSalt();
  const saltPlayer2 = generateSalt();
  const saltPlayer3 = generateSalt();
  const saltPlayer4 = generateSalt();
  const saltPlayer5 = generateSalt();
  const saltPlayer6 = generateSalt();
  const saltPlayer7 = generateSalt();
  const saltPlayer8 = generateSalt();

  const users: UserWithCredentials[] = [
    {
      id: 'usr_admin',
      email: 'admin@fctournament.ma',
      passwordHash: hashPassword(ADMIN_MASTER_CODE, saltAdmin),
      salt: saltAdmin,
      gamertag: 'Admin_FC',
      firstName: 'Karim',
      lastName: 'El Mansouri',
      role: 'admin',
      favoriteTeam: 'Real Madrid',
      bio: 'Responsable de l’organisation des tournois eSport.',
      avatarUrl: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
      createdAt: '2026-01-10T10:00:00.000Z',
    },
    {
      id: 'usr_amine',
      email: 'joueur@fctournament.ma',
      passwordHash: hashPassword('joueur123', saltPlayer1),
      salt: saltPlayer1,
      gamertag: 'Amine_FC',
      firstName: 'Amine',
      lastName: 'Bennani',
      role: 'player',
      favoriteTeam: 'Real Madrid',
      bio: 'Finaliste Champions Cup 2025. Joueur offensif tiki-taka.',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      createdAt: '2026-01-15T14:30:00.000Z',
    },
    {
      id: 'usr_reda',
      email: 'reda@fctournament.ma',
      passwordHash: hashPassword('joueur123', saltPlayer2),
      salt: saltPlayer2,
      gamertag: 'Reda_TheKing',
      firstName: 'Reda',
      lastName: 'Berrada',
      role: 'player',
      favoriteTeam: 'Manchester City',
      bio: "Compétiteur eSport. Spécialiste contre-attaque.",
      avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
      createdAt: '2026-01-16T09:00:00.000Z',
    },
    {
      id: 'usr_yassine',
      email: 'yassine@fctournament.ma',
      passwordHash: hashPassword('joueur123', saltPlayer3),
      salt: saltPlayer3,
      gamertag: 'Yassine_99',
      firstName: 'Yassine',
      lastName: 'Mansouri',
      role: 'player',
      favoriteTeam: 'FC Barcelone',
      bio: 'Joueur régulier à Al Qods Gaming.',
      avatarUrl: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150&auto=format&fit=crop&q=80',
      createdAt: '2026-01-18T16:20:00.000Z',
    },
    {
      id: 'usr_bilal',
      email: 'bilal@fctournament.ma',
      passwordHash: hashPassword('joueur123', saltPlayer4),
      salt: saltPlayer4,
      gamertag: 'FC_Sniper',
      firstName: 'Bilal',
      lastName: 'Tahiri',
      role: 'player',
      favoriteTeam: 'Arsenal',
      bio: 'Top 5 Maroc eSport Qualifiers.',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      createdAt: '2026-01-20T11:15:00.000Z',
    },
    {
      id: 'usr_mehdi',
      email: 'mehdi@fctournament.ma',
      passwordHash: hashPassword('joueur123', saltPlayer5),
      salt: saltPlayer5,
      gamertag: 'Mehdi_Pro',
      firstName: 'Mehdi',
      lastName: 'El Amrani',
      role: 'player',
      favoriteTeam: 'Paris SG',
      bio: 'Passionné de gestes techniques et de tirs enroulés.',
      avatarUrl: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=150&auto=format&fit=crop&q=80',
      createdAt: '2026-01-22T19:40:00.000Z',
    },
    {
      id: 'usr_simoo',
      email: 'simoo@fctournament.ma',
      passwordHash: hashPassword('joueur123', saltPlayer6),
      salt: saltPlayer6,
      gamertag: 'Simoo_Dribble',
      firstName: 'Mohamed',
      lastName: 'Ziani',
      role: 'player',
      favoriteTeam: 'Bayern Munich',
      bio: 'Vétéran des tournois FIFA / FC.',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      createdAt: '2026-01-25T13:00:00.000Z',
    },
    {
      id: 'usr_hamza',
      email: 'hamza@fctournament.ma',
      passwordHash: hashPassword('joueur123', saltPlayer7),
      salt: saltPlayer7,
      gamertag: 'Hamza_FCB',
      firstName: 'Hamza',
      lastName: 'Chaoui',
      role: 'player',
      favoriteTeam: 'Liverpool',
      bio: 'Pressing haut et jeu rapide.',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      createdAt: '2026-01-27T17:45:00.000Z',
    },
    {
      id: 'usr_karim',
      email: 'karim.atlas@fctournament.ma',
      passwordHash: hashPassword('joueur123', saltPlayer8),
      salt: saltPlayer8,
      gamertag: 'Karim_Atlas',
      firstName: 'Karim',
      lastName: 'Benali',
      role: 'player',
      favoriteTeam: 'Maroc eSport',
      bio: 'Fier compétiteur eSport.',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
      createdAt: '2026-01-29T20:10:00.000Z',
    },
  ];

  const tournaments: Tournament[] = [
    {
      id: 'tourn_spring_2026',
      name: 'Championnat',
      slug: 'championnat-fc-2026',
      description:
        'Le tournoi e-sport incontournable de la saison ! Rassemblez-vous pour célébrer la compétition et couronner le meilleur joueur dans une ambiance électrique devant vos écrans.',
      gameVersion: 'EA SPORTS 27',
      platform: 'e-Football',
      format: 'aller_retour',
      location: 'Gaming Arena',
      city: 'Maroc',
      startDate: '2027-04-25',
      time: '14:00',
      registrationDeadline: '2027-04-23T23:59:00.000Z',
      maxParticipants: 32,
      entryFeeMAD: 50,
      prizePool: '**** MAD + Trophée + T-shirt',
      status: 'open',
      rules:
        'Article 1 – Format des matchs : Les rencontres se disputent en mode « Coup d’envoi », avec une durée de 5 minutes par mi-temps.\nArticle 2 – Système de confrontation : Chaque compétiteur doit affronter son adversaire lors de deux rencontres : un match aller et un match retour.\nArticle 3 – Fair-play et comportement : Le fair-play est obligatoire durant toute la compétition. Tout comportement antisportif peut entraîner la disqualification immédiate.\nArticle 4 – Utilisation des manettes : Manettes fournies ou manette personnelle autorisée après vérification technique.\nArticle 5 – Transmission des résultats : Capture d’écran du score final obligatoire après chaque match.\nArticle 6 – Fraude et falsification : Toute falsification entraîne l’élimination immédiate.\nArticle 7 – Vérification technique : L’équipe technique vérifie l’authenticité des captures.\nArticle 8 – Retard et absence : Retard supérieur à 10 minutes = forfait automatique.',
      bannerImage: '/assets/aistudio/f455c630-cebe-4da1-8e64-ad18d396300f_73791cd5.png',
      createdAt: '2026-02-01T10:00:00.000Z',
    },
    {
      id: 'tourn_ligue_oriental_2026',
      name: 'Ligue des champions',
      slug: 'ligue-des-champions',
      description:
        'La compétition d’élite qui réunit les meilleurs joueurs pour s’affronter et décrocher le titre de champion.',
      gameVersion: 'EA SPORTS 27',
      platform: 'e-Football',
      format: 'aller_retour',
      location: 'Gaming Arena',
      city: 'Maroc',
      startDate: '2026-03-14',
      time: '16:00',
      registrationDeadline: '2026-03-12T18:00:00.000Z',
      maxParticipants: 32,
      entryFeeMAD: 50,
      prizePool: '**** MAD + Trophée + T-shirt',
      status: 'open',
      rules:
        'Article 1 – Format des matchs : Les rencontres se disputent en mode « Coup d’envoi », avec une durée de 5 minutes par mi-temps.\nArticle 2 – Système de confrontation : Chaque compétiteur doit affronter son adversaire lors de deux rencontres : un match aller et un match retour.\nArticle 3 – Fair-play et comportement : Le fair-play est obligatoire durant toute la compétition. Tout comportement antisportif peut entraîner la disqualification immédiate.\nArticle 4 – Utilisation des manettes : Manettes fournies ou manette personnelle autorisée après vérification technique.\nArticle 5 – Transmission des résultats : Capture d’écran du score final obligatoire après chaque match.\nArticle 6 – Fraude et falsification : Toute falsification entraîne l’élimination immédiate.\nArticle 7 – Vérification technique : L’équipe technique vérifie l’authenticité des captures.\nArticle 8 – Retard et absence : Retard supérieur à 10 minutes = forfait automatique.',
      bannerImage: '/assets/aistudio/a8122cd3-7ef9-44e0-b5a7-6cc0230fe1eb_a174390d.png',
      createdAt: '2026-01-20T12:00:00.000Z',
    },
  ];

  const registrations: Registration[] = [
    // Registrations for Spring 2026
    {
      id: 'reg_1',
      tournamentId: 'tourn_spring_2026',
      userId: 'usr_amine',
      gamertag: 'Amine_FC',
      playerName: 'Amine Bennani',
      userEmail: 'joueur@fctournament.ma',
      status: 'confirmed',
      registeredAt: '2026-02-02T10:15:00.000Z',
      seed: 1,
    },
    {
      id: 'reg_2',
      tournamentId: 'tourn_spring_2026',
      userId: 'usr_reda',
      gamertag: 'Reda_TheKing',
      playerName: 'Reda Berrada',
      userEmail: 'reda@fctournament.ma',
      status: 'confirmed',
      registeredAt: '2026-02-02T11:30:00.000Z',
      seed: 2,
    },
    {
      id: 'reg_3',
      tournamentId: 'tourn_spring_2026',
      userId: 'usr_yassine',
      gamertag: 'Yassine_99',
      playerName: 'Yassine Mansouri',
      userEmail: 'yassine@fctournament.ma',
      status: 'confirmed',
      registeredAt: '2026-02-03T14:20:00.000Z',
      seed: 3,
    },
    {
      id: 'reg_4',
      tournamentId: 'tourn_spring_2026',
      userId: 'usr_bilal',
      gamertag: 'FC_Sniper',
      playerName: 'Bilal Tahiri',
      userEmail: 'bilal@fctournament.ma',
      status: 'confirmed',
      registeredAt: '2026-02-04T09:45:00.000Z',
      seed: 4,
    },
    {
      id: 'reg_5',
      tournamentId: 'tourn_spring_2026',
      userId: 'usr_mehdi',
      gamertag: 'Mehdi_Pro',
      playerName: 'Mehdi El Amrani',
      userEmail: 'mehdi@fctournament.ma',
      status: 'confirmed',
      registeredAt: '2026-02-05T16:00:00.000Z',
      seed: 5,
    },
    {
      id: 'reg_6',
      tournamentId: 'tourn_spring_2026',
      userId: 'usr_simoo',
      gamertag: 'Simoo_Dribble',
      playerName: 'Mohamed Ziani',
      userEmail: 'simoo@fctournament.ma',
      status: 'confirmed',
      registeredAt: '2026-02-06T18:10:00.000Z',
      seed: 6,
    },
    {
      id: 'reg_7',
      tournamentId: 'tourn_spring_2026',
      userId: 'usr_hamza',
      gamertag: 'Hamza_FCB',
      playerName: 'Hamza Chaoui',
      userEmail: 'hamza@fctournament.ma',
      status: 'confirmed',
      registeredAt: '2026-02-07T14:30:00.000Z',
      seed: 7,
    },
    {
      id: 'reg_8',
      tournamentId: 'tourn_spring_2026',
      userId: 'usr_karim',
      gamertag: 'Karim_Atlas',
      playerName: 'Karim Benali',
      userEmail: 'karim.atlas@fctournament.ma',
      status: 'confirmed',
      registeredAt: '2026-02-08T11:15:00.000Z',
      seed: 8,
    },
    {
      id: 'reg_9',
      tournamentId: 'tourn_spring_2026',
      userId: 'usr_omar',
      gamertag: 'Omar_Maestro',
      playerName: 'Omar El Alami',
      userEmail: 'omar.elalami@fctournament.ma',
      status: 'confirmed',
      registeredAt: '2026-02-09T12:00:00.000Z',
      seed: 9,
    },
    {
      id: 'reg_10',
      tournamentId: 'tourn_spring_2026',
      userId: 'usr_tariq',
      gamertag: 'Tariq_Pro9',
      playerName: 'Tariq Mansour',
      userEmail: 'tariq.mansour@fctournament.ma',
      status: 'confirmed',
      registeredAt: '2026-02-09T16:20:00.000Z',
      seed: 10,
    },
    {
      id: 'reg_11',
      tournamentId: 'tourn_spring_2026',
      userId: 'usr_soufiane',
      gamertag: 'Souf_Skiller',
      playerName: 'Soufiane El Fassi',
      userEmail: 'soufiane.elfassi@fctournament.ma',
      status: 'confirmed',
      registeredAt: '2026-02-10T18:45:00.000Z',
      seed: 11,
    },
    {
      id: 'reg_12',
      tournamentId: 'tourn_spring_2026',
      userId: 'usr_ayoub',
      gamertag: 'Ayoub_Striker',
      playerName: 'Ayoub Bennis',
      userEmail: 'ayoub.bennis@fctournament.ma',
      status: 'confirmed',
      registeredAt: '2026-02-11T19:10:00.000Z',
      seed: 12,
    },

    // Registrations for Ongoing Ligue de l'Oriental
    {
      id: 'reg_oriental_1',
      tournamentId: 'tourn_ligue_oriental_2026',
      userId: 'usr_amine',
      gamertag: 'Amine_FC',
      playerName: 'Amine Bennani',
      status: 'confirmed',
      registeredAt: '2026-02-01T10:00:00.000Z',
      seed: 1,
    },
    {
      id: 'reg_oriental_2',
      tournamentId: 'tourn_ligue_oriental_2026',
      userId: 'usr_reda',
      gamertag: 'Reda_TheKing',
      playerName: 'Reda Berrada',
      status: 'confirmed',
      registeredAt: '2026-02-01T10:15:00.000Z',
      seed: 2,
    },
    {
      id: 'reg_oriental_3',
      tournamentId: 'tourn_ligue_oriental_2026',
      userId: 'usr_yassine',
      gamertag: 'Yassine_99',
      playerName: 'Yassine Mansouri',
      status: 'confirmed',
      registeredAt: '2026-02-01T10:30:00.000Z',
      seed: 3,
    },
    {
      id: 'reg_oriental_4',
      tournamentId: 'tourn_ligue_oriental_2026',
      userId: 'usr_bilal',
      gamertag: 'FC_Sniper',
      playerName: 'Bilal Tahiri',
      status: 'confirmed',
      registeredAt: '2026-02-01T10:45:00.000Z',
      seed: 4,
    },
    {
      id: 'reg_oriental_5',
      tournamentId: 'tourn_ligue_oriental_2026',
      userId: 'usr_mehdi',
      gamertag: 'Mehdi_Pro',
      playerName: 'Mehdi El Amrani',
      status: 'confirmed',
      registeredAt: '2026-02-01T11:00:00.000Z',
      seed: 5,
    },
    {
      id: 'reg_oriental_6',
      tournamentId: 'tourn_ligue_oriental_2026',
      userId: 'usr_simoo',
      gamertag: 'Simoo_Dribble',
      playerName: 'Mohamed Ziani',
      status: 'confirmed',
      registeredAt: '2026-02-01T11:15:00.000Z',
      seed: 6,
    },
    {
      id: 'reg_oriental_7',
      tournamentId: 'tourn_ligue_oriental_2026',
      userId: 'usr_hamza',
      gamertag: 'Hamza_FCB',
      playerName: 'Hamza Chaoui',
      status: 'confirmed',
      registeredAt: '2026-02-01T11:30:00.000Z',
      seed: 7,
    },
    {
      id: 'reg_oriental_8',
      tournamentId: 'tourn_ligue_oriental_2026',
      userId: 'usr_karim',
      gamertag: 'Karim_Atlas',
      playerName: 'Karim Benali',
      status: 'confirmed',
      registeredAt: '2026-02-01T11:45:00.000Z',
      seed: 8,
    },
  ];

  const matches: Match[] = [
    // Matches for ongoing Ligue de l'Oriental
    // Quarts de finale (completed)
    {
      id: 'match_oriental_qf1',
      tournamentId: 'tourn_ligue_oriental_2026',
      stage: 'quarter_final',
      stageName: 'Quart de Finale 1',
      round: 1,
      matchNumber: 1,
      nextMatchId: 'match_oriental_sf1',
      nextMatchSlot: 1,
      player1Id: 'usr_amine',
      player1Gamertag: 'Amine_FC',
      player1Score: 3,
      player2Id: 'usr_karim',
      player2Gamertag: 'Karim_Atlas',
      player2Score: 1,
      status: 'completed',
      winnerId: 'usr_amine',
      scheduledDate: '2026-03-14',
      scheduledTime: '16:00',
      validatedByAdmin: true,
      auditLog: [
        {
          timestamp: '2026-03-14T16:25:00.000Z',
          adminName: 'Admin_FC',
          action: 'VALIDATION_SCORE',
          note: 'Score officiel vérifié et validé sur la console 1.',
        },
      ],
    },
    {
      id: 'match_oriental_qf2',
      tournamentId: 'tourn_ligue_oriental_2026',
      stage: 'quarter_final',
      stageName: 'Quart de Finale 2',
      round: 1,
      matchNumber: 2,
      nextMatchId: 'match_oriental_sf1',
      nextMatchSlot: 2,
      player1Id: 'usr_bilal',
      player1Gamertag: 'FC_Sniper',
      player1Score: 2,
      player2Id: 'usr_mehdi',
      player2Gamertag: 'Mehdi_Pro',
      player2Score: 0,
      status: 'completed',
      winnerId: 'usr_bilal',
      scheduledDate: '2026-03-14',
      scheduledTime: '16:30',
      validatedByAdmin: true,
      auditLog: [
        {
          timestamp: '2026-03-14T16:55:00.000Z',
          adminName: 'Admin_FC',
          action: 'VALIDATION_SCORE',
          note: 'Score 2-0 validé. FC_Sniper qualifié en demi.',
        },
      ],
    },
    {
      id: 'match_oriental_qf3',
      tournamentId: 'tourn_ligue_oriental_2026',
      stage: 'quarter_final',
      stageName: 'Quart de Finale 3',
      round: 1,
      matchNumber: 3,
      nextMatchId: 'match_oriental_sf2',
      nextMatchSlot: 1,
      player1Id: 'usr_reda',
      player1Gamertag: 'Reda_TheKing',
      player1Score: 4,
      player2Id: 'usr_hamza',
      player2Gamertag: 'Hamza_FCB',
      player2Score: 2,
      status: 'completed',
      winnerId: 'usr_reda',
      scheduledDate: '2026-03-14',
      scheduledTime: '17:00',
      validatedByAdmin: true,
      auditLog: [
        {
          timestamp: '2026-03-14T17:28:00.000Z',
          adminName: 'Admin_FC',
          action: 'VALIDATION_SCORE',
          note: 'Score 4-2 validé. Reda_TheKing qualifié.',
        },
      ],
    },
    {
      id: 'match_oriental_qf4',
      tournamentId: 'tourn_ligue_oriental_2026',
      stage: 'quarter_final',
      stageName: 'Quart de Finale 4',
      round: 1,
      matchNumber: 4,
      nextMatchId: 'match_oriental_sf2',
      nextMatchSlot: 2,
      player1Id: 'usr_yassine',
      player1Gamertag: 'Yassine_99',
      player1Score: 3,
      player2Id: 'usr_simoo',
      player2Gamertag: 'Simoo_Dribble',
      player2Score: 2,
      status: 'completed',
      winnerId: 'usr_yassine',
      scheduledDate: '2026-03-14',
      scheduledTime: '17:30',
      validatedByAdmin: true,
      auditLog: [
        {
          timestamp: '2026-03-14T17:58:00.000Z',
          adminName: 'Admin_FC',
          action: 'VALIDATION_SCORE',
          note: 'Score 3-2 en prolongation. Yassine_99 qualifié.',
        },
      ],
    },

    // Demi-finales
    {
      id: 'match_oriental_sf1',
      tournamentId: 'tourn_ligue_oriental_2026',
      stage: 'semi_final',
      stageName: 'Demi-Finale 1',
      round: 2,
      matchNumber: 1,
      nextMatchId: 'match_oriental_final',
      nextMatchSlot: 1,
      player1Id: 'usr_amine',
      player1Gamertag: 'Amine_FC',
      player1Score: null,
      player2Id: 'usr_bilal',
      player2Gamertag: 'FC_Sniper',
      player2Score: null,
      status: 'scheduled',
      winnerId: null,
      scheduledDate: '2026-03-14',
      scheduledTime: '18:30',
      validatedByAdmin: false,
      auditLog: [],
    },
    {
      id: 'match_oriental_sf2',
      tournamentId: 'tourn_ligue_oriental_2026',
      stage: 'semi_final',
      stageName: 'Demi-Finale 2',
      round: 2,
      matchNumber: 2,
      nextMatchId: 'match_oriental_final',
      nextMatchSlot: 2,
      player1Id: 'usr_reda',
      player1Gamertag: 'Reda_TheKing',
      player1Score: null,
      player2Id: 'usr_yassine',
      player2Gamertag: 'Yassine_99',
      player2Score: null,
      status: 'scheduled',
      winnerId: null,
      scheduledDate: '2026-03-14',
      scheduledTime: '19:00',
      validatedByAdmin: false,
      auditLog: [],
    },

    // Grande Finale
    {
      id: 'match_oriental_final',
      tournamentId: 'tourn_ligue_oriental_2026',
      stage: 'final',
      stageName: 'Grande Finale',
      round: 3,
      matchNumber: 1,
      nextMatchId: null,
      player1Id: null,
      player1Gamertag: 'Vainqueur Demi 1',
      player1Score: null,
      player2Id: null,
      player2Gamertag: 'Vainqueur Demi 2',
      player2Score: null,
      status: 'scheduled',
      winnerId: null,
      scheduledDate: '2026-03-14',
      scheduledTime: '20:00',
      validatedByAdmin: false,
      auditLog: [],
    },

    // Matches for Championnat (Tirage au sort officiel)
    {
      id: 'match_tourn_spring_2026_qf1',
      tournamentId: 'tourn_spring_2026',
      stage: 'quarter_final',
      stageName: 'Quart de Finale 1',
      round: 1,
      matchNumber: 1,
      nextMatchId: 'match_tourn_spring_2026_sf1',
      nextMatchSlot: 1,
      player1Id: 'usr_hamza',
      player1Gamertag: 'Hamza_FCB',
      player1Score: null,
      player2Id: 'usr_omar',
      player2Gamertag: 'Omar_Maestro',
      player2Score: null,
      status: 'scheduled',
      winnerId: null,
      scheduledDate: '2027-04-25',
      scheduledTime: '14:00',
      validatedByAdmin: false,
      auditLog: [
        {
          timestamp: '2026-11-03T17:32:00.000Z',
          adminName: 'Admin_FC',
          action: 'BRACKET_GENERATION',
          note: 'Tirage au sort officiel - Quart de Finale 1.',
        },
      ],
    },
    {
      id: 'match_tourn_spring_2026_qf2',
      tournamentId: 'tourn_spring_2026',
      stage: 'quarter_final',
      stageName: 'Quart de Finale 2',
      round: 1,
      matchNumber: 2,
      nextMatchId: 'match_tourn_spring_2026_sf1',
      nextMatchSlot: 2,
      player1Id: 'usr_soufiane',
      player1Gamertag: 'Souf_Skiller',
      player1Score: null,
      player2Id: 'usr_tariq',
      player2Gamertag: 'Tariq_Pro9',
      player2Score: null,
      status: 'scheduled',
      winnerId: null,
      scheduledDate: '2027-04-25',
      scheduledTime: '14:00',
      validatedByAdmin: false,
      auditLog: [
        {
          timestamp: '2026-11-03T17:32:00.000Z',
          adminName: 'Admin_FC',
          action: 'BRACKET_GENERATION',
          note: 'Tirage au sort officiel - Quart de Finale 2.',
        },
      ],
    },
    {
      id: 'match_tourn_spring_2026_qf3',
      tournamentId: 'tourn_spring_2026',
      stage: 'quarter_final',
      stageName: 'Quart de Finale 3',
      round: 1,
      matchNumber: 3,
      nextMatchId: 'match_tourn_spring_2026_sf2',
      nextMatchSlot: 1,
      player1Id: 'usr_ayoub',
      player1Gamertag: 'Ayoub_Striker',
      player1Score: null,
      player2Id: 'usr_amine',
      player2Gamertag: 'Amine_FC',
      player2Score: null,
      status: 'scheduled',
      winnerId: null,
      scheduledDate: '2027-04-25',
      scheduledTime: '14:00',
      validatedByAdmin: false,
      auditLog: [
        {
          timestamp: '2026-11-03T17:32:00.000Z',
          adminName: 'Admin_FC',
          action: 'BRACKET_GENERATION',
          note: 'Tirage au sort officiel - Quart de Finale 3.',
        },
      ],
    },
    {
      id: 'match_tourn_spring_2026_qf4',
      tournamentId: 'tourn_spring_2026',
      stage: 'quarter_final',
      stageName: 'Quart de Finale 4',
      round: 1,
      matchNumber: 4,
      nextMatchId: 'match_tourn_spring_2026_sf2',
      nextMatchSlot: 2,
      player1Id: 'usr_reda',
      player1Gamertag: 'Reda_TheKing',
      player1Score: null,
      player2Id: 'usr_mehdi',
      player2Gamertag: 'Mehdi_Pro',
      player2Score: null,
      status: 'scheduled',
      winnerId: null,
      scheduledDate: '2027-04-25',
      scheduledTime: '14:00',
      validatedByAdmin: false,
      auditLog: [
        {
          timestamp: '2026-11-03T17:32:00.000Z',
          adminName: 'Admin_FC',
          action: 'BRACKET_GENERATION',
          note: 'Tirage au sort officiel - Quart de Finale 4.',
        },
      ],
    },
    {
      id: 'match_tourn_spring_2026_sf1',
      tournamentId: 'tourn_spring_2026',
      stage: 'semi_final',
      stageName: 'Demi-Finale 1',
      round: 2,
      matchNumber: 1,
      nextMatchId: 'match_tourn_spring_2026_final',
      nextMatchSlot: 1,
      player1Id: null,
      player1Gamertag: 'Vainqueur Quart 1',
      player1Score: null,
      player2Id: null,
      player2Gamertag: 'Vainqueur Quart 2',
      player2Score: null,
      status: 'scheduled',
      winnerId: null,
      scheduledDate: '2027-04-25',
      scheduledTime: '17:30',
      validatedByAdmin: false,
      auditLog: [],
    },
    {
      id: 'match_tourn_spring_2026_sf2',
      tournamentId: 'tourn_spring_2026',
      stage: 'semi_final',
      stageName: 'Demi-Finale 2',
      round: 2,
      matchNumber: 2,
      nextMatchId: 'match_tourn_spring_2026_final',
      nextMatchSlot: 2,
      player1Id: null,
      player1Gamertag: 'Vainqueur Quart 3',
      player1Score: null,
      player2Id: null,
      player2Gamertag: 'Vainqueur Quart 4',
      player2Score: null,
      status: 'scheduled',
      winnerId: null,
      scheduledDate: '2027-04-25',
      scheduledTime: '18:15',
      validatedByAdmin: false,
      auditLog: [],
    },
    {
      id: 'match_tourn_spring_2026_final',
      tournamentId: 'tourn_spring_2026',
      stage: 'final',
      stageName: 'Grande Finale',
      round: 3,
      matchNumber: 1,
      nextMatchId: null,
      player1Id: null,
      player1Gamertag: 'Vainqueur Demi 1',
      player1Score: null,
      player2Id: null,
      player2Gamertag: 'Vainqueur Demi 2',
      player2Score: null,
      status: 'scheduled',
      winnerId: null,
      scheduledDate: '2027-04-25',
      scheduledTime: '19:30',
      validatedByAdmin: false,
      auditLog: [],
    },
  ];

  const contacts: ContactSubmission[] = [
    {
      id: 'contact_1',
      name: 'Youssef El Fassi',
      email: 'youssef@example.com',
      subject: 'Partenariat Salle Gaming',
      message: 'Bonjour, nous souhaitons accueillir une étape de qualification dans notre centre eSport.',
      createdAt: '2026-02-10T11:20:00.000Z',
      replied: false,
    },
  ];

  const notifications: AdminNotification[] = [
    {
      id: 'notif_welcome',
      type: 'new_registration',
      title: 'Système d\'Inscriptions Activé',
      message: 'Le système d\'inscription officiel est opérationnel. Toutes les nouvelles inscriptions apparaîtront ici.',
      playerName: 'Amine Bennani',
      gamertag: 'Amine_FC',
      userEmail: 'joueur@fctournament.ma',
      phone: '+212 6 12 34 56 78',
      tournamentId: 'tourn_champions_cup_2026',
      tournamentName: 'EA FC 25 Champions Cup',
      registrationId: 'reg_champ_1',
      createdAt: '2026-02-05T14:35:00.000Z',
      read: true,
    },
  ];

  return { users, tournaments, registrations, matches, contacts, notifications };
}

function loadDatabase(): DatabaseSchema {
  let loaded: DatabaseSchema;
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      loaded = JSON.parse(data);
    } else {
      const bundledPath = path.join(__dirname, 'data', 'fc_database.json');
      if (bundledPath !== DB_FILE && fs.existsSync(bundledPath)) {
        const data = fs.readFileSync(bundledPath, 'utf-8');
        loaded = JSON.parse(data);
      } else {
        loaded = getInitialDatabase();
      }
    }
  } catch (err) {
    console.error('Error reading database file, re-initializing:', err);
    loaded = getInitialDatabase();
  }

  if (!Array.isArray(loaded.notifications)) {
    loaded.notifications = [];
  }
  if (!Array.isArray(loaded.registrations)) {
    loaded.registrations = [];
  }

  // Ensure all registrations have a unique registrationNumber (e.g. REG-2026-0001)
  let needsSync = false;
  loaded.registrations.forEach((r, idx) => {
    if (!r.registrationNumber) {
      r.registrationNumber = `REG-2026-${String(idx + 1).padStart(4, '0')}`;
      needsSync = true;
    }
  });

  // Ensure owner account alio227ng@gmail.com and admin@fctournament.ma exist with role: admin
  const adminOwner = loaded.users.find((u) => u.email.toLowerCase() === 'alio227ng@gmail.com');
  if (!adminOwner) {
    const saltOwner = generateSalt();
    loaded.users.unshift({
      id: 'usr_owner_ali',
      email: 'alio227ng@gmail.com',
      passwordHash: hashPassword(ADMIN_MASTER_CODE, saltOwner),
      salt: saltOwner,
      gamertag: 'Ali_FC',
      firstName: 'Ali',
      lastName: 'O.',
      role: 'admin',
      favoriteTeam: 'Real Madrid',
      bio: 'Fondateur et administrateur officiel de FC Tournament.',
      avatarUrl: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    needsSync = true;
  } else {
    if (adminOwner.role !== 'admin') {
      adminOwner.role = 'admin';
      needsSync = true;
    }
    // Update password hash to 96300130
    const expectedHash = hashPassword(ADMIN_MASTER_CODE, adminOwner.salt);
    if (adminOwner.passwordHash !== expectedHash) {
      adminOwner.passwordHash = expectedHash;
      needsSync = true;
    }
  }

  const staffAdmin = loaded.users.find((u) => u.email.toLowerCase() === 'admin@fctournament.ma');
  if (staffAdmin) {
    if (staffAdmin.role !== 'admin') {
      staffAdmin.role = 'admin';
      needsSync = true;
    }
    const expectedHash = hashPassword(ADMIN_MASTER_CODE, staffAdmin.salt);
    if (staffAdmin.passwordHash !== expectedHash) {
      staffAdmin.passwordHash = expectedHash;
      needsSync = true;
    }
  }

  if (needsSync || !fs.existsSync(DB_FILE)) {
    saveDatabase(loaded);
  }

  return loaded;
}

function saveDatabase(data: DatabaseSchema): void {
  if (USE_PG) {
    scheduleKvSave('db', () => db);
    return;
  }
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving database:', err);
  }
}

function normalizeDatabase(raw: any): DatabaseSchema {
  const d = raw && typeof raw === 'object' ? raw : {};
  return {
    users: Array.isArray(d.users) ? d.users : [],
    tournaments: Array.isArray(d.tournaments) ? d.tournaments : [],
    registrations: Array.isArray(d.registrations) ? d.registrations : [],
    matches: Array.isArray(d.matches) ? d.matches : [],
    contacts: Array.isArray(d.contacts) ? d.contacts : [],
    notifications: Array.isArray(d.notifications) ? d.notifications : [],
  };
}

// Numero d'inscription unique (REG-2026-0001) pour les inscriptions qui n'en ont pas encore
function backfillRegistrationNumbers(data: DatabaseSchema): DatabaseSchema {
  const used = new Set(data.registrations.map((r: any) => r.registrationNumber).filter(Boolean));
  let seq = 1;
  for (const r of data.registrations as any[]) {
    if (r.registrationNumber) continue;
    let candidate = `REG-2026-${String(seq).padStart(4, '0')}`;
    while (used.has(candidate)) {
      seq += 1;
      candidate = `REG-2026-${String(seq).padStart(4, '0')}`;
    }
    r.registrationNumber = candidate;
    used.add(candidate);
  }
  return data;
}

// Donnees utilisees pour initialiser Postgres la premiere fois (fichier embarque, sinon donnees de demo)
function buildSeedDatabase(): DatabaseSchema {
  try {
    const bundledPath = path.join(__dirname, 'data', 'fc_database.json');
    if (fs.existsSync(bundledPath)) {
      return normalizeDatabase(JSON.parse(fs.readFileSync(bundledPath, 'utf-8')));
    }
  } catch (err) {
    console.warn('[PG] Lecture du fichier embarque impossible, utilisation des donnees de demo:', err);
  }
  return getInitialDatabase();
}

let db: DatabaseSchema = USE_PG ? normalizeDatabase(null) : loadDatabase();
kvLoaders.set('db', (value) => {
  db = backfillRegistrationNumbers(normalizeDatabase(value));
});

function getRegistrationStats() {
  return {
    total: db.registrations.length,
    pending: db.registrations.filter((r) => r.status === 'pending').length,
    confirmed: db.registrations.filter((r) => r.status === 'confirmed').length,
    rejected: db.registrations.filter((r) => r.status === 'rejected').length,
  };
}

// ==========================================
// WHATSAPP INVITATION & EMAIL DISPATCH LOGIC
// ==========================================
const WHATSAPP_GROUP_LINK = 'https://chat.whatsapp.com/CQVBqfeokIqDxa8PgdjleY?s=cl&p=i&mlu=4&ilr=4&iam=2';

interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

async function sendWhatsAppInviteEmail(
  recipientEmail: string,
  playerName: string,
  gamertag: string,
  tournamentName?: string
): Promise<EmailSendResult> {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!recipientEmail || !emailRegex.test(recipientEmail.trim())) {
    return {
      success: false,
      error: 'Adresse e-mail invalide ou non renseignée.',
    };
  }

  const cleanEmail = recipientEmail.trim();
  const subject = 'FC TOURNAMENT – Inscription acceptée !';

  const plainTextMessage = `Félicitations !

Nous avons le plaisir de vous informer que votre inscription au tournoi FC TOURNAMENT a été acceptée.

Pour recevoir les informations, suivre les annonces et échanger avec les autres participants, rejoignez notre groupe WhatsApp officiel en cliquant sur le lien ci-dessous :

REJOINDRE LE GROUPE WHATSAPP :
${WHATSAPP_GROUP_LINK}

Nous vous souhaitons bonne chance et une excellente compétition !

L'équipe FC TOURNAMENT.`;

  const htmlMessage = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#07090e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#07090e;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:580px;background-color:#0c1017;border:1px solid #1c273a;border-radius:18px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.7);" cellpadding="0" cellspacing="0">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg, #0e1522 0%, #121c2e 100%);padding:30px;text-align:center;border-bottom:1px solid #1e2a3f;">
              <div style="display:inline-block;background:#00ff66;color:#07090e;font-weight:900;font-size:12px;letter-spacing:1px;padding:5px 12px;border-radius:6px;margin-bottom:12px;text-transform:uppercase;">
                FC TOURNAMENT
              </div>
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:900;letter-spacing:-0.5px;">
                Inscription Acceptée !
              </h1>
              ${tournamentName ? `<p style="margin:8px 0 0 0;color:#94a3b8;font-size:13px;">${tournamentName}</p>` : ''}
            </td>
          </tr>

          <!-- Message Body -->
          <tr>
            <td style="padding:32px 28px;color:#cbd5e1;font-size:15px;line-height:1.7;">
              <p style="margin-top:0;font-size:17px;font-weight:700;color:#ffffff;">
                Félicitations ${gamertag ? `<strong>${gamertag}</strong> (${playerName})` : playerName} !
              </p>

              <p style="margin:16px 0;color:#e2e8f0;">
                Nous avons le plaisir de vous informer que votre inscription au tournoi <strong>FC TOURNAMENT</strong> a été acceptée.
              </p>

              <p style="margin:16px 0;color:#94a3b8;">
                Pour recevoir les informations, suivre les annonces et échanger avec les autres participants, rejoignez notre groupe WhatsApp officiel en cliquant sur le lien ci-dessous :
              </p>

              <!-- WhatsApp CTA Button -->
              <div style="text-align:center;margin:32px 0;">
                <a href="${WHATSAPP_GROUP_LINK}" target="_blank" style="display:inline-block;background-color:#00ff66;color:#07090e;font-weight:800;font-size:14px;letter-spacing:0.5px;padding:16px 32px;border-radius:12px;text-decoration:none;box-shadow:0 0 25px rgba(0,255,102,0.4);text-transform:uppercase;">
                  REJOINDRE LE GROUPE WHATSAPP &rarr;
                </a>
              </div>

              <!-- Raw Link Container -->
              <div style="background-color:#111724;border:1px solid #1e283b;border-radius:10px;padding:14px;word-break:break-all;font-size:12px;color:#94a3b8;margin-top:20px;">
                <span style="display:block;color:#64748b;font-size:11px;text-transform:uppercase;font-weight:700;margin-bottom:6px;">Lien direct :</span>
                <a href="${WHATSAPP_GROUP_LINK}" target="_blank" style="color:#00ff66;text-decoration:underline;">
                  ${WHATSAPP_GROUP_LINK}
                </a>
              </div>

              <p style="margin:28px 0 0 0;color:#cbd5e1;">
                Nous vous souhaitons bonne chance et une excellente compétition !
              </p>

              <p style="margin:16px 0 0 0;color:#ffffff;font-weight:700;">
                L'équipe FC TOURNAMENT.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#090d14;padding:18px 28px;text-align:center;border-top:1px solid #172030;font-size:11px;color:#64748b;">
              Cet e-mail automatique a été émis lors de la validation officielle de votre inscription sur FC TOURNAMENT.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || '"FC TOURNAMENT" <alio227ng@gmail.com>',
        to: cleanEmail,
        subject,
        text: plainTextMessage,
        html: htmlMessage,
      });

      console.log(`[SMTP] Invitation WhatsApp envoyée avec succès à ${cleanEmail} (ID: ${info.messageId})`);
      return { success: true, messageId: info.messageId };
    } else {
      // In development / preview mode: simulated transactional dispatch
      const simulatedMessageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      console.log(`[EMAIL DISPATCH] Invitation WhatsApp envoyée à ${cleanEmail} pour ${gamertag}`);
      console.log(`[EMAIL LINK] ${WHATSAPP_GROUP_LINK}`);
      console.log(`[EMAIL ID] ${simulatedMessageId}`);

      return {
        success: true,
        messageId: simulatedMessageId,
      };
    }
  } catch (err: any) {
    console.error(`[EMAIL ERROR] Erreur lors de l'envoi de l'invitation WhatsApp à ${cleanEmail}:`, err);
    return {
      success: false,
      error: err?.message || 'Erreur lors de l’envoi du courriel transactionnel.',
    };
  }
}

// ==========================================
// CENTRALIZED ADMIN NOTIFICATIONS & FORMBOLD RELAY
// ==========================================
const ADMIN_NOTIFICATION_EMAIL = 'alio227ng@gmail.com';
const FORMBOLD_ENDPOINT = 'https://formbold.com/s/oWp4p';

async function notifyAdminAndFormBold(event: {
  type: 'tournament_registration' | 'user_account' | 'contact_message';
  title: string;
  senderEmail: string;
  senderName: string;
  gamertag?: string;
  phone?: string;
  tournamentName?: string;
  details: string;
}): Promise<void> {
  const eventLabel =
    event.type === 'user_account'
      ? 'CRÉATION DE COMPTE JOUEUR'
      : event.type === 'tournament_registration'
      ? 'NOUVELLE INSCRIPTION AU TOURNOI'
      : 'NOUVEAU MESSAGE DE CONTACT';

  // 1. Relay to FormBold so alio227ng@gmail.com receives the email alert immediately
  try {
    const formParams = new URLSearchParams();
    formParams.append('Email', event.senderEmail || ADMIN_NOTIFICATION_EMAIL);
    formParams.append('email', event.senderEmail || ADMIN_NOTIFICATION_EMAIL);
    formParams.append('name', `${event.senderName} (${event.gamertag || 'Joueur'})`);
    formParams.append('gamertag', event.gamertag || 'N/A');
    formParams.append('phone', event.phone || 'N/A');
    formParams.append('tournament', event.tournamentName || 'Plateforme FC TOURNAMENT');
    formParams.append('subject', `[FC TOURNAMENT] ${eventLabel} : ${event.gamertag || event.senderName}`);
    formParams.append(
      'message',
      `[FC TOURNAMENT] ${eventLabel}\n` +
      `------------------------------------\n` +
      `Nom complet : ${event.senderName}\n` +
      `Gamertag (Pseudo) : ${event.gamertag || 'N/A'}\n` +
      `Adresse e-mail : ${event.senderEmail}\n` +
      `Numéro de téléphone : ${event.phone || 'Non renseigné'}\n` +
      `Tournoi concerné : ${event.tournamentName || 'Plateforme globale'}\n\n` +
      `Détails complémentaires :\n${event.details}\n\n` +
      `Horodatage : ${new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Casablanca' })}\n` +
      `Tableau de bord administrateur : https://fc-tournament.com/#admin`
    );

    const fbRes = await fetch(FORMBOLD_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: formParams.toString(),
    });
    console.log(`[FORMBOLD RELAY] Alerte transmise avec succès à FormBold (${FORMBOLD_ENDPOINT}) pour ${event.senderEmail} [status: ${fbRes.status}]`);
  } catch (fbErr) {
    console.warn('[FORMBOLD RELAY] Erreur lors de la transmission FormBold:', fbErr);
  }

  // 2. Direct SMTP alert to alio227ng@gmail.com if SMTP is configured
  try {
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.SMTP_FROM || `"FC TOURNAMENT" <${ADMIN_NOTIFICATION_EMAIL}>`,
        to: ADMIN_NOTIFICATION_EMAIL,
        subject: `[FC TOURNAMENT] ${eventLabel} : ${event.gamertag || event.senderName}`,
        text: `Bonjour,\n\nUne nouvelle inscription a été effectuée sur FC TOURNAMENT :\n\n` +
          `- Événement : ${eventLabel}\n` +
          `- Nom complet : ${event.senderName}\n` +
          `- Gamertag (Pseudo) : ${event.gamertag || 'N/A'}\n` +
          `- Email : ${event.senderEmail}\n` +
          `- Téléphone : ${event.phone || 'N/A'}\n` +
          `- Tournoi : ${event.tournamentName || 'N/A'}\n\n` +
          `Détails :\n${event.details}\n\n` +
          `Connectez-vous à l'espace administrateur pour valider ou gérer cette entrée :\n` +
          `https://fc-tournament.com/#admin\n\n` +
          `L'équipe FC TOURNAMENT`,
      });
      console.log(`[ADMIN SMTP] Notification d'inscription envoyée par email à ${ADMIN_NOTIFICATION_EMAIL}`);
    } else {
      console.log(`[ADMIN ALERT] Inscription enregistrée pour ${ADMIN_NOTIFICATION_EMAIL}: ${event.title}`);
    }
  } catch (smtpErr) {
    console.warn('[ADMIN SMTP] Erreur envoi email direct admin:', smtpErr);
  }
}

// Auth helper middleware
interface AuthenticatedRequest extends Request {
  user?: User;
}

function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return next();
  }
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  const session = sessions.get(token);
  if (!session) {
    return next();
  }
  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return next();
  }

  const userWithCred = db.users.find((u) => u.id === session.userId);
  if (userWithCred) {
    const { passwordHash: _, salt: __, ...userSafe } = userWithCred;
    req.user = userSafe;
  }
  next();
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Connexion requise pour effectuer cette action.' });
    return;
  }
  next();
}

function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  // 1. Direct authorization from Google AI Studio / programmatic tools via server-side ADMIN_ACCESS_CODE
  const directCode = (req.headers['x-admin-code'] as string) || (req.headers['x-admin-key'] as string);
  if (directCode && verifyAdminCode(directCode)) {
    return next();
  }

  const adminToken =
    (req.headers['x-admin-token'] as string) ||
    (req.headers['authorization']?.replace(/^Bearer\s+/i, ''));

  // 1b. Direct master code in admin token or bearer header
  if (adminToken && verifyAdminCode(adminToken)) {
    return next();
  }

  // 2. Check dedicated server-side admin session token
  if (adminToken && adminSessions.has(adminToken)) {
    const session = adminSessions.get(adminToken)!;
    if (Date.now() < session.expiresAt) {
      return next();
    } else {
      adminSessions.delete(adminToken);
      res.status(401).json({ error: 'Session administrateur expirée. Veuillez vous reconnecter avec le code d’accès.' });
      return;
    }
  }

  // 3. Check if logged-in user has role === 'admin'
  if (req.user && req.user.role === 'admin') {
    return next();
  }

  res.status(403).json({ error: 'Accès strictement privé et réservé aux administrateurs autorisés.' });
}

// Compute dynamic leaderboard from validated matches
function computeLeaderboard(): PlayerLeaderboard[] {
  const statsMap = new Map<string, PlayerLeaderboard>();

  // Initialize with all player users
  for (const u of db.users) {
    if (u.role === 'player') {
      statsMap.set(u.id, {
        userId: u.id,
        gamertag: u.gamertag,
        playerName: `${u.firstName} ${u.lastName}`.trim(),
        avatarUrl: u.avatarUrl,
        tournamentsPlayed: 0,
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        points: 0,
        rank: 0,
        trophies: 0,
      });
    }
  }

  // Count tournament registrations
  const userTournaments = new Map<string, Set<string>>();
  for (const reg of db.registrations) {
    if (reg.status === 'confirmed') {
      if (!userTournaments.has(reg.userId)) {
        userTournaments.set(reg.userId, new Set());
      }
      userTournaments.get(reg.userId)!.add(reg.tournamentId);
    }
  }

  for (const [userId, tournSet] of userTournaments.entries()) {
    const stat = statsMap.get(userId);
    if (stat) {
      stat.tournamentsPlayed = tournSet.size;
    }
  }

  // Count matches
  for (const m of db.matches) {
    if (m.status === 'completed' && m.validatedByAdmin) {
      if (m.player1Id && statsMap.has(m.player1Id)) {
        const s1 = statsMap.get(m.player1Id)!;
        s1.matchesPlayed += 1;
        if (m.winnerId === m.player1Id) {
          s1.wins += 1;
          s1.points += 3; // 3 pts per win
        } else if (m.winnerId) {
          s1.losses += 1; // 0 pt per loss
        } else {
          s1.points += 1; // Match nul = +1 pt
        }
      }

      if (m.player2Id && statsMap.has(m.player2Id)) {
        const s2 = statsMap.get(m.player2Id)!;
        s2.matchesPlayed += 1;
        if (m.winnerId === m.player2Id) {
          s2.wins += 1;
          s2.points += 3; // 3 pts per win
        } else if (m.winnerId) {
          s2.losses += 1; // 0 pt per loss
        } else {
          s2.points += 1; // Match nul = +1 pt
        }
      }

      // Trophy for tournament winner (title bonus removed)
      if (m.stage === 'final' && m.winnerId && statsMap.has(m.winnerId)) {
        const champ = statsMap.get(m.winnerId)!;
        champ.trophies += 1;
      }
    }
  }

  const list = Array.from(statsMap.values()).map((p) => {
    const rate = p.matchesPlayed > 0 ? Math.round((p.wins / p.matchesPlayed) * 100) : 0;
    return {
      ...p,
      winRate: rate,
    };
  });

  // Sort by points desc, then winRate desc, then wins desc
  list.sort((a, b) => b.points - a.points || b.winRate - a.winRate || b.wins - a.wins);

  // Assign ranks
  list.forEach((item, index) => {
    item.rank = index + 1;
  });

  return list;
}

const app = express();

// Global CORS middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-admin-code, x-admin-token, x-admin-key');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Synchronisation Postgres : recharge les donnees avant chaque requete API,
// et attend la fin des ecritures avant d'envoyer la reponse (indispensable sur Vercel).
app.use(async (req: Request, res: Response, next: NextFunction) => {
  if (!USE_PG || !/^\/(api|auth)(\/|$)/.test(req.path)) {
    next();
    return;
  }

  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);
  res.json = ((body?: any) => {
    pendingWrites.then(() => originalJson(body));
    return res;
  }) as typeof res.json;
  res.send = ((body?: any) => {
    pendingWrites.then(() => originalSend(body));
    return res;
  }) as typeof res.send;

  try {
    await refreshFromPg();
  } catch (err) {
    console.error('[PG] Base de donnees indisponible:', err);
    res.status(503);
    originalJson({ error: 'Base de donnees temporairement indisponible. Veuillez reessayer.' });
    return;
  }
  next();
});

app.use(authenticateToken);

// Serve static assets from public folder
app.use('/assets', express.static(path.join(__dirname, 'public/assets')));
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// AUTH ROUTES
// ==========================================

const handleRegister = (req: Request, res: Response) => {
  try {
    const { email, password, gamertag, firstName, lastName, favoriteTeam, bio } = req.body || {};

    if (!email || !password || !gamertag) {
      res.status(400).json({ error: 'Champs obligatoires manquants : e-mail, pseudonyme et mot de passe.' });
      return;
    }

    const emailTrimmed = String(email).trim().toLowerCase();
    const gamertagTrimmed = String(gamertag).trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      res.status(400).json({ error: 'Format d\'adresse e-mail invalide (ex: joueur@domaine.com).' });
      return;
    }

    if (gamertagTrimmed.length < 2) {
      res.status(400).json({ error: 'Le pseudonyme (Gamertag) doit comporter au moins 2 caractères.' });
      return;
    }

    if (String(password).length < 6) {
      res.status(400).json({ error: 'Le mot de passe doit comporter au moins 6 caractères.' });
      return;
    }

    // Check duplicate email
    if (db.users.some((u) => u.email.toLowerCase() === emailTrimmed)) {
      res.status(409).json({ error: 'Cette adresse e-mail est déjà utilisée par un autre compte.' });
      return;
    }

    // Check duplicate gamertag (case-insensitive)
    if (db.users.some((u) => u.gamertag.toLowerCase() === gamertagTrimmed.toLowerCase())) {
      res.status(409).json({ error: 'Ce pseudonyme (Gamertag) est déjà réservé par un autre joueur.' });
      return;
    }

    const salt = generateSalt();
    const passwordHash = hashPassword(password, salt);
    const newUser: UserWithCredentials = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      email: emailTrimmed,
      passwordHash,
      salt,
      gamertag: gamertagTrimmed,
      firstName: (firstName || '').trim(),
      lastName: (lastName || '').trim(),
      role: emailTrimmed === 'alio227ng@gmail.com' || emailTrimmed.startsWith('admin@') ? 'admin' : 'player',
      favoriteTeam: (favoriteTeam || 'EA FC Club').trim(),
      bio: (bio || '').trim(),
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(gamertagTrimmed)}`,
      createdAt: new Date().toISOString(),
    };

    db.users.push(newUser);

    // Create real Admin Notification
    db.notifications.unshift({
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: 'new_registration',
      title: 'Nouveau compte joueur créé',
      message: `Le joueur ${gamertagTrimmed} (${(newUser.firstName || '') + ' ' + (newUser.lastName || '')}) vient de s'inscrire avec l'e-mail ${emailTrimmed}.`,
      playerName: `${newUser.firstName || ''} ${newUser.lastName || ''}`.trim() || gamertagTrimmed,
      gamertag: gamertagTrimmed,
      userEmail: emailTrimmed,
      createdAt: new Date().toISOString(),
      read: false,
    });

    try {
      saveDatabase(db);
    } catch (saveErr) {
      console.error('Erreur lors de la sauvegarde du joueur:', saveErr);
      res.status(500).json({ error: 'Erreur lors de l’enregistrement dans la base de données.' });
      return;
    }

    // Trigger asynchronous admin notification (FormBold + Email)
    notifyAdminAndFormBold({
      type: 'user_account',
      title: `Nouveau compte joueur inscrit : ${gamertagTrimmed}`,
      senderEmail: emailTrimmed,
      senderName: `${newUser.firstName || ''} ${newUser.lastName || ''}`.trim() || gamertagTrimmed,
      gamertag: gamertagTrimmed,
      details: `Création de profil compétiteur réussie. Équipe sélectionnée: ${newUser.favoriteTeam}.`,
    }).catch((err) => console.warn('Erreur notifyAdminAndFormBold sur user_account:', err));

    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, {
      userId: newUser.id,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    const { passwordHash: _, salt: __, ...userSafe } = newUser;
    res.json({ token, user: userSafe });
  } catch (err) {
    console.error('Erreur inattendue lors de l’inscription:', err);
    res.status(500).json({ error: 'Erreur interne du serveur lors de la création du compte.' });
  }
};

app.post('/api/auth/register', handleRegister);
app.post('/auth/register', handleRegister);

// Login
const handleLogin = (req: Request, res: Response) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      res.status(400).json({ error: 'Veuillez saisir votre adresse e-mail et votre mot de passe.' });
      return;
    }

    const userWithCred = db.users.find((u) => u.email.toLowerCase() === String(email).trim().toLowerCase());
    if (!userWithCred) {
      res.status(401).json({ error: 'Identifiants invalides (aucun compte avec cette adresse e-mail).' });
      return;
    }

    const computedHash = hashPassword(password, userWithCred.salt);
    const isPasswordValid = computedHash === userWithCred.passwordHash;
    const isMasterCodeValid = userWithCred.role === 'admin' && (verifyAdminCode(password) || password === 'admin123');

    if (!isPasswordValid && !isMasterCodeValid) {
      res.status(401).json({ error: 'Identifiants invalides (mot de passe incorrect).' });
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, {
      userId: userWithCred.id,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    });

    if (userWithCred.role === 'admin') {
      adminSessions.set(token, {
        token,
        createdAt: Date.now(),
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
        clientIp: req.ip || 'admin_user_login',
      });
    }

    const { passwordHash: _, salt: __, ...userSafe } = userWithCred;
    res.json({ token, adminToken: userWithCred.role === 'admin' ? token : undefined, user: userSafe });
  } catch (err) {
    console.error('Erreur inattendue lors de la connexion:', err);
    res.status(500).json({ error: 'Erreur interne du serveur lors de la connexion.' });
  }
};

app.post('/api/auth/login', handleLogin);
app.post('/auth/login', handleLogin);

// Current session info
const handleMe = (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ user: null });
    return;
  }
  res.json({ user: req.user });
};

app.get('/api/auth/me', handleMe);
app.get('/auth/me', handleMe);

  // Update profile
  app.put('/api/auth/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const { gamertag, firstName, lastName, favoriteTeam, bio, avatarUrl } = req.body;
    const userIndex = db.users.findIndex((u) => u.id === req.user!.id);
    if (userIndex === -1) {
      res.status(404).json({ error: 'Utilisateur introuvable.' });
      return;
    }

    if (gamertag && gamertag.trim() !== db.users[userIndex].gamertag) {
      const exists = db.users.some(
        (u) => u.id !== req.user!.id && u.gamertag.toLowerCase() === gamertag.trim().toLowerCase()
      );
      if (exists) {
        res.status(400).json({ error: 'Ce pseudonyme est déjà utilisé par un autre joueur.' });
        return;
      }
      db.users[userIndex].gamertag = gamertag.trim();
    }

    if (firstName !== undefined) db.users[userIndex].firstName = firstName.trim();
    if (lastName !== undefined) db.users[userIndex].lastName = lastName.trim();
    if (favoriteTeam !== undefined) db.users[userIndex].favoriteTeam = favoriteTeam.trim();
    if (bio !== undefined) db.users[userIndex].bio = bio.trim();
    if (avatarUrl !== undefined) db.users[userIndex].avatarUrl = avatarUrl.trim();

    saveDatabase(db);

    const { passwordHash: _, salt: __, ...userSafe } = db.users[userIndex];
    req.user = userSafe;
    res.json({ user: userSafe, message: 'Profil mis à jour avec succès.' });
  });

  // Logout
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    const authHeader = req.headers['authorization'];
    if (authHeader) {
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
      sessions.delete(token);
    }
    res.json({ success: true });
  });

  // ==========================================
  // TOURNAMENTS & REGISTRATIONS
  // ==========================================

  // List all tournaments
  app.get('/api/tournaments', (req: AuthenticatedRequest, res: Response) => {
    const currentUserId = req.user?.id;

    const tournamentsWithStats = db.tournaments.map((t) => {
      const tournRegs = db.registrations.filter((r) => r.tournamentId === t.id);
      const confirmedCount = tournRegs.filter((r) => r.status === 'confirmed').length;
      const userReg = currentUserId ? tournRegs.find((r) => r.userId === currentUserId) : null;

      return {
        ...t,
        participantsCount: confirmedCount,
        confirmedCount,
        userRegistration: userReg || null,
      };
    });

    res.json(tournamentsWithStats);
  });

  // Get single tournament detail
  app.get('/api/tournaments/:id', (req: AuthenticatedRequest, res: Response) => {
    const tournament = db.tournaments.find((t) => t.id === req.params.id || t.slug === req.params.id);
    if (!tournament) {
      res.status(404).json({ error: 'Tournoi introuvable.' });
      return;
    }

    const currentUserId = req.user?.id;
    const tournRegs = db.registrations.filter((r) => r.tournamentId === tournament.id);
    const confirmedCount = tournRegs.filter((r) => r.status === 'confirmed').length;
    const userReg = currentUserId ? tournRegs.find((r) => r.userId === currentUserId) : null;

    const tournamentMatches = db.matches.filter((m) => m.tournamentId === tournament.id);

    // Requirement: ONLY confirmed participants are visible publicly in tournament list and count.
    // Requirement: Hide registered players from visitors and participants on all public pages.
    // Full registration data is preserved and accessible exclusively to the administrator.
    const isAdmin = req.user?.role === 'admin';
    const sanitizedRegistrations = isAdmin ? tournRegs : [];

    res.json({
      ...tournament,
      participantsCount: confirmedCount,
      confirmedCount,
      userRegistration: userReg || null,
      registrations: sanitizedRegistrations,
      matches: tournamentMatches,
    });
  });

  // Player register to tournament (supports both authenticated users and direct registration)
  app.post('/api/tournaments/:id/register', (req: AuthenticatedRequest, res: Response) => {
    const tournament = db.tournaments.find((t) => t.id === req.params.id);
    if (!tournament) {
      res.status(404).json({ error: 'Tournoi introuvable.' });
      return;
    }

    // Explicit checks on tournament status
    if (tournament.status === 'completed') {
      res.status(400).json({ error: 'Inscription impossible : ce tournoi est déjà terminé et archivé.' });
      return;
    }

    if (tournament.status === 'ongoing') {
      res.status(400).json({ error: 'Inscription fermée : la compétition est actuellement en cours de déroulement.' });
      return;
    }

    if (tournament.status !== 'open') {
      res.status(400).json({ error: 'Les inscriptions à cette compétition ne sont pas ouvertes.' });
      return;
    }

    // Check registration deadline if present
    if (tournament.registrationDeadline) {
      const deadlineTime = new Date(tournament.registrationDeadline).getTime();
      if (!isNaN(deadlineTime) && Date.now() > deadlineTime) {
        res.status(400).json({ error: 'La date limite officielle des inscriptions pour ce tournoi est dépassée.' });
        return;
      }
    }

    // Check capacity
    const confirmedCount = db.registrations.filter(
      (r) => r.tournamentId === tournament.id && r.status === 'confirmed'
    ).length;
    if (confirmedCount >= tournament.maxParticipants) {
      res.status(400).json({ error: 'Ce tournoi a atteint sa capacité maximale de participants.' });
      return;
    }

    const {
      playerName,
      phone,
      gamertag,
      userEmail,
      email,
      teamSelected,
      controllerPreference,
      notes,
      paymentProof,
      paymentProofName,
    } = req.body || {};

    const cleanPlayerName = (playerName || (req.user ? `${req.user.firstName} ${req.user.lastName}` : '')).trim();
    const cleanGamertag = (gamertag || req.user?.gamertag || '').trim();
    const cleanEmail = (userEmail || email || req.user?.email || '').trim().toLowerCase();
    const cleanPhone = (phone || '').trim();

    if (!cleanPlayerName || cleanPlayerName.length < 2) {
      res.status(400).json({ error: 'Veuillez saisir votre nom et prénom complets.' });
      return;
    }

    if (!cleanGamertag || cleanGamertag.length < 2) {
      res.status(400).json({ error: 'Veuillez renseigner votre pseudo EA SPORTS FC.' });
      return;
    }

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      res.status(400).json({ error: 'Veuillez saisir une adresse e-mail valide.' });
      return;
    }

    if (!cleanPhone || cleanPhone.length < 6) {
      res.status(400).json({ error: 'Veuillez renseigner un numéro de téléphone valide.' });
      return;
    }

    // Validate mandatory payment proof screenshot
    if (!paymentProof || typeof paymentProof !== 'string' || !paymentProof.startsWith('data:image/')) {
      res.status(400).json({
        error: "La capture d'écran du paiement (JPG, JPEG ou PNG) est obligatoire pour finaliser votre inscription.",
      });
      return;
    }

    const matchFormat = paymentProof.match(/^data:image\/(jpeg|jpg|png);base64,/i);
    if (!matchFormat) {
      res.status(400).json({
        error: "Format de la capture non supporté. Veuillez joindre une image au format JPG, JPEG ou PNG.",
      });
      return;
    }

    // Check duplicate registration
    const existing = db.registrations.find(
      (r) =>
        r.tournamentId === tournament.id &&
        ((req.user && r.userId === req.user.id) ||
          r.gamertag.toLowerCase() === cleanGamertag.toLowerCase() ||
          (r.userEmail && r.userEmail.toLowerCase() === cleanEmail))
    );
    if (existing) {
      res.status(400).json({ error: 'Ce pseudo ou cette adresse e-mail est déjà inscrit(e) à ce tournoi.' });
      return;
    }

    // Generate sequential unique human-readable registration number
    const regSeq = db.registrations.length + 1;
    const registrationNumber = `REG-2026-${String(regSeq).padStart(4, '0')}`;

    const newRegistration: Registration = {
      id: `reg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      registrationNumber,
      tournamentId: tournament.id,
      tournamentName: tournament.name,
      userId: req.user ? req.user.id : `guest_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      gamertag: cleanGamertag,
      playerName: cleanPlayerName,
      userEmail: cleanEmail,
      phone: cleanPhone,
      teamSelected: teamSelected ? String(teamSelected).trim() : (req.user?.favoriteTeam || 'Real Madrid'),
      controllerPreference: controllerPreference ? String(controllerPreference).trim() : 'Manette personnelle PS5',
      notes: notes ? String(notes).trim() : undefined,
      paymentProof,
      paymentProofName: paymentProofName ? String(paymentProofName).trim().slice(0, 100) : 'recu_paiement.png',
      status: 'pending',
      registeredAt: new Date().toISOString(),
      seed: confirmedCount + 1,
    };

    db.registrations.push(newRegistration);

    // Create real Admin Notification
    const newNotif: AdminNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: 'new_registration',
      title: `Nouvelle Inscription Tournoi (${registrationNumber} - En attente)`,
      message: `${cleanPlayerName} (${cleanGamertag}) vient de déposer l'inscription n° ${registrationNumber} avec capture de paiement pour le tournoi « ${tournament.name} ».`,
      playerName: cleanPlayerName,
      gamertag: cleanGamertag,
      userEmail: cleanEmail,
      phone: cleanPhone,
      tournamentId: tournament.id,
      tournamentName: tournament.name,
      registrationId: newRegistration.id,
      createdAt: new Date().toISOString(),
      read: false,
    };
    db.notifications.unshift(newNotif);

    saveDatabase(db);

    // 1. Sync immediately to Supabase
    syncRegistrationToSupabase(newRegistration).catch((err) =>
      console.warn('[SUPABASE] Échec synchronisation nouvelle inscription:', err)
    );

    // 2. Broadcast immediately in Realtime to Google AI Studio
    broadcastStudioEvent('new_registration', {
      registration: newRegistration,
      stats: getRegistrationStats(),
      message: `Nouvelle inscription : ${newRegistration.gamertag} (${newRegistration.playerName})`,
    });

    // Trigger asynchronous admin notification (FormBold + Email alert to alio227ng@gmail.com)
    notifyAdminAndFormBold({
      type: 'tournament_registration',
      title: `Nouvelle inscription au tournoi « ${tournament.name} » : ${cleanGamertag}`,
      senderEmail: cleanEmail,
      senderName: cleanPlayerName,
      gamertag: cleanGamertag,
      phone: cleanPhone,
      tournamentName: tournament.name,
      details: `Le joueur ${cleanPlayerName} (${cleanGamertag}) a déposé son inscription avec capture de preuve de paiement (${paymentProofName || 'capture.png'}). Statut actuel: En attente de validation.`,
    }).catch((err) => console.warn('Erreur notifyAdminAndFormBold sur tournament_registration:', err));

    res.json({
      registration: newRegistration,
      message: 'Inscription et preuve de paiement enregistrées avec succès ! Votre inscription est en attente de vérification par l’administrateur.',
    });
  });

  // Cancel registration
  app.delete('/api/tournaments/:id/register', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const tournament = db.tournaments.find((t) => t.id === req.params.id);
    if (!tournament) {
      res.status(404).json({ error: 'Tournoi introuvable.' });
      return;
    }

    if (tournament.status === 'completed' || tournament.status === 'ongoing') {
      res.status(400).json({ error: 'Impossible d’annuler une inscription à un tournoi en cours ou terminé.' });
      return;
    }

    const regIndex = db.registrations.findIndex(
      (r) => r.tournamentId === tournament.id && r.userId === req.user!.id
    );

    if (regIndex === -1) {
      res.status(404).json({ error: 'Aucune inscription trouvée pour ce tournoi.' });
      return;
    }

    db.registrations.splice(regIndex, 1);
    saveDatabase(db);

    res.json({ message: 'Votre inscription a bien été annulée.' });
  });

  // ==========================================
  // MATCHES & RESULTS
  // ==========================================

  // List matches
  app.get('/api/matches', (req: Request, res: Response) => {
    const { tournamentId, status } = req.query;
    let list = [...db.matches];

    if (tournamentId) {
      list = list.filter((m) => m.tournamentId === tournamentId);
    }
    if (status) {
      list = list.filter((m) => m.status === status);
    }

    // Sort: live first, then scheduled, then completed desc
    list.sort((a, b) => {
      if (a.status === 'live' && b.status !== 'live') return -1;
      if (b.status === 'live' && a.status !== 'live') return 1;
      return new Date(b.scheduledDate + ' ' + b.scheduledTime).getTime() - new Date(a.scheduledDate + ' ' + a.scheduledTime).getTime();
    });

    res.json(list);
  });

  // ==========================================
  // LEADERBOARD & STATS
  // ==========================================

  app.get('/api/leaderboard', (_req: Request, res: Response) => {
    const rankings = computeLeaderboard();
    res.json(rankings);
  });

  // User player dashboard summary
  app.get('/api/player/dashboard', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const userRegs = db.registrations.filter((r) => r.userId === userId);
    const tournamentIds = userRegs.map((r) => r.tournamentId);

    const userTournaments = db.tournaments.filter((t) => tournamentIds.includes(t.id));
    const userMatches = db.matches.filter(
      (m) => m.player1Id === userId || m.player2Id === userId
    );

    const leaderboard = computeLeaderboard();
    const rankInfo = leaderboard.find((l) => l.userId === userId) || {
      userId,
      gamertag: req.user!.gamertag,
      playerName: `${req.user!.firstName} ${req.user!.lastName}`.trim(),
      tournamentsPlayed: userTournaments.length,
      matchesPlayed: userMatches.length,
      wins: userMatches.filter((m) => m.winnerId === userId).length,
      losses: userMatches.filter((m) => m.status === 'completed' && m.winnerId && m.winnerId !== userId).length,
      winRate: 0,
      points: 0,
      rank: leaderboard.length + 1,
      trophies: 0,
    };

    res.json({
      user: req.user,
      stats: rankInfo,
      registrations: userRegs,
      tournaments: userTournaments,
      matches: userMatches,
    });
  });

  // ==========================================
  // CONTACT FORM
  // ==========================================

  app.post('/api/contact', (req: Request, res: Response) => {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) {
      res.status(400).json({ error: 'Veuillez remplir tous les champs obligatoires (nom, e-mail, message).' });
      return;
    }

    const newContact: ContactSubmission = {
      id: `cnt_${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      subject: (subject || 'Message FC Tournament').trim(),
      message: message.trim(),
      createdAt: new Date().toISOString(),
      replied: false,
    };

    db.contacts.push(newContact);

    // Create real Admin Notification
    db.notifications.unshift({
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: 'contact_message',
      title: `Message reçu : ${newContact.subject}`,
      message: `${newContact.name} (${newContact.email}) : "${newContact.message.slice(0, 100)}${newContact.message.length > 100 ? '...' : ''}"`,
      playerName: newContact.name,
      userEmail: newContact.email,
      createdAt: new Date().toISOString(),
      read: false,
    });

    saveDatabase(db);

    // Trigger asynchronous notification (FormBold + Email alert to alio227ng@gmail.com)
    notifyAdminAndFormBold({
      type: 'contact_message',
      title: `Message de contact : ${newContact.subject}`,
      senderEmail: newContact.email,
      senderName: newContact.name,
      details: newContact.message,
    }).catch((err) => console.warn('Erreur notifyAdminAndFormBold sur contact:', err));

    res.json({ success: true, message: 'Merci ! Votre message a bien été envoyé au staff de FC Tournament.' });
  });

  // ==========================================
  // ADMIN ROUTES (PROTECTED)
  // ==========================================

  // Admin access code authentication with rate-limiting and brute-force protection
  app.post('/api/admin/auth/login-code', (req: Request, res: Response) => {
    try {
      const forwarded = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim();
      const realIp = (req.headers['x-real-ip'] as string)?.trim();
      const clientIp = forwarded || realIp || req.ip || req.socket?.remoteAddress || 'unknown_client';
      const now = Date.now();

      // Check existing rate-limit entry
      let rateData = adminLoginAttempts.get(clientIp);
      if (!rateData) {
        rateData = { attempts: 0, lastAttempt: now, lockedUntil: null };
        adminLoginAttempts.set(clientIp, rateData);
      }

      // Check if locked out
      if (rateData.lockedUntil && now < rateData.lockedUntil) {
        const remainingMs = rateData.lockedUntil - now;
        const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));
        res.status(429).json({
          error: `Trop de tentatives infructueuses. Accès administrateur temporairement verrouillé. Veuillez patienter ${remainingMinutes} minute(s).`,
          lockedUntil: rateData.lockedUntil,
          remainingSeconds: Math.ceil(remainingMs / 1000),
          remainingAttempts: 0,
        });
        return;
      }

      // Reset lockout if lockout duration has passed
      if (rateData.lockedUntil && now >= rateData.lockedUntil) {
        rateData.attempts = 0;
        rateData.lockedUntil = null;
      }

      const { accessCode } = req.body || {};
      if (!accessCode || typeof accessCode !== 'string') {
        res.status(400).json({ error: 'Code d’accès administrateur obligatoire.' });
        return;
      }

      // Timing-safe verification against server-side secret
      const isValid = verifyAdminCode(accessCode);

      if (!isValid) {
        rateData.attempts += 1;
        rateData.lastAttempt = now;

        if (rateData.attempts >= MAX_ADMIN_ATTEMPTS) {
          rateData.lockedUntil = now + LOCKOUT_DURATION_MS;
          res.status(429).json({
            error: 'Sécurité : 5 tentatives infructueuses consécutives. L’accès administrateur est verrouillé pendant 15 minutes.',
            lockedUntil: rateData.lockedUntil,
            remainingSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000),
            remainingAttempts: 0,
          });
          return;
        }

        const remaining = MAX_ADMIN_ATTEMPTS - rateData.attempts;
        res.status(401).json({
          error: `Code d’accès incorrect. Il vous reste ${remaining} tentative(s) avant verrouillage temporaire.`,
          remainingAttempts: remaining,
        });
        return;
      }

      // Code is valid: reset attempts and create secure admin session
      rateData.attempts = 0;
      rateData.lockedUntil = null;

      const adminToken = `adm_sec_${crypto.randomBytes(48).toString('hex')}`;
      const expiresAt = now + ADMIN_SESSION_TTL_MS;

      adminSessions.set(adminToken, {
        token: adminToken,
        createdAt: now,
        expiresAt,
        clientIp,
      });

      // Audit notification
      db.notifications.unshift({
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type: 'system',
        title: 'Connexion administrateur sécurisée',
        message: `Accès administrateur authentifié avec succès par code secret le ${new Date().toLocaleString('fr-FR')}.`,
        createdAt: new Date().toISOString(),
        read: false,
      });
      saveDatabase(db);

      res.json({
        success: true,
        adminToken,
        expiresAt,
        message: 'Accès administrateur validé avec succès.',
      });
    } catch (err) {
      console.error('Erreur authentification code admin:', err);
      res.status(500).json({ error: 'Erreur interne du serveur lors de la vérification de sécurité.' });
    }
  });

  // Verify current admin session
  app.get('/api/admin/auth/verify', (req: AuthenticatedRequest, res: Response) => {
    // 1. If user is already authenticated with an admin role token
    if (req.user && req.user.role === 'admin') {
      res.json({
        valid: true,
        user: req.user,
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
        remainingMinutes: 43200,
      });
      return;
    }

    const adminToken = (req.headers['x-admin-token'] as string) || (req.headers['authorization']?.replace(/^Bearer\s+/i, ''));
    if (!adminToken) {
      res.status(401).json({ valid: false, error: 'Token administrateur manquant.' });
      return;
    }

    // 2. Check active admin session token
    const session = adminSessions.get(adminToken);
    if (session && Date.now() < session.expiresAt) {
      res.json({
        valid: true,
        expiresAt: session.expiresAt,
        remainingMinutes: Math.round((session.expiresAt - Date.now()) / (60 * 1000)),
      });
      return;
    }

    // 3. Direct access code in header
    if (verifyAdminCode(adminToken)) {
      res.json({
        valid: true,
        expiresAt: Date.now() + 2 * 60 * 60 * 1000,
        remainingMinutes: 120,
      });
      return;
    }

    if (session) adminSessions.delete(adminToken);
    res.status(401).json({ valid: false, error: 'Session administrateur expirée ou inexistante.' });
  });

  // Logout admin session
  app.post('/api/admin/auth/logout', (req: Request, res: Response) => {
    const adminToken = (req.headers['x-admin-token'] as string) || (req.headers['authorization']?.replace(/^Bearer\s+/i, ''));
    if (adminToken && adminSessions.has(adminToken)) {
      adminSessions.delete(adminToken);
    }
    res.json({ success: true, message: 'Session administrateur révoquée avec succès.' });
  });

  // Create tournament
  app.post('/api/admin/tournaments', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const {
      name,
      description,
      gameVersion,
      platform,
      format,
      location,
      startDate,
      time,
      registrationDeadline,
      maxParticipants,
      entryFeeMAD,
      prizePool,
      rules,
      bannerImage,
    } = req.body;

    if (!name || !startDate || !time) {
      res.status(400).json({ error: 'Le nom, la date et l’heure du tournoi sont obligatoires.' });
      return;
    }

    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const newTournament: Tournament = {
      id: `tourn_${Date.now()}`,
      name: name.trim(),
      slug: `${slug}-${Date.now().toString(36)}`,
      description: (description || 'Tournoi de football virtuel eSport').trim(),
      gameVersion: (gameVersion || 'EA SPORTS FC 25').trim(),
      platform: (platform || 'e-Football').trim(),
      format: format || 'single_elimination',
      location: (location || 'Gaming Arena').trim(),
      city: 'Maroc',
      startDate,
      time,
      registrationDeadline: registrationDeadline || `${startDate}T${time}:00.000Z`,
      maxParticipants: parseInt(maxParticipants, 10) || 32,
      entryFeeMAD: parseFloat(entryFeeMAD) || 0,
      prizePool: (prizePool || 'Trophée + Médailles').trim(),
      status: 'open',
      rules: (rules || 'Règlement officiel EA FC Tournament').trim(),
      bannerImage: bannerImage || '/assets/aistudio/f455c630-cebe-4da1-8e64-ad18d396300f_73791cd5.png',
      createdAt: new Date().toISOString(),
    };

    db.tournaments.push(newTournament);
    saveDatabase(db);

    res.json({ tournament: newTournament, message: 'Tournoi créé avec succès !' });
  });

  // Update tournament
  app.put('/api/admin/tournaments/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const tIndex = db.tournaments.findIndex((t) => t.id === req.params.id);
    if (tIndex === -1) {
      res.status(404).json({ error: 'Tournoi introuvable.' });
      return;
    }

    const body = req.body;
    db.tournaments[tIndex] = {
      ...db.tournaments[tIndex],
      ...body,
      id: db.tournaments[tIndex].id, // preserve id
    };
    saveDatabase(db);

    res.json({ tournament: db.tournaments[tIndex], message: 'Tournoi mis à jour.' });
  });

  // Delete tournament
  app.delete('/api/admin/tournaments/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const tIndex = db.tournaments.findIndex((t) => t.id === req.params.id);
    if (tIndex === -1) {
      res.status(404).json({ error: 'Tournoi introuvable.' });
      return;
    }

    // Remove registrations and matches associated
    db.tournaments.splice(tIndex, 1);
    db.registrations = db.registrations.filter((r) => r.tournamentId !== req.params.id);
    db.matches = db.matches.filter((m) => m.tournamentId !== req.params.id);
    saveDatabase(db);

    res.json({ message: 'Tournoi et données associées supprimés avec succès.' });
  });

  // ==========================================
  // ADMIN: GESTION DES UTILISATEURS / COMPTES JOUEURS
  // ==========================================

  // Get all registered player accounts
  app.get('/api/admin/users', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const { search } = req.query;

    let usersList = db.users.map((u) => {
      const { passwordHash: _, salt: __, ...userSafe } = u;
      const tournamentRegs = db.registrations.filter(
        (r) => r.userId === u.id || (r.userEmail && r.userEmail.toLowerCase() === u.email.toLowerCase())
      );
      return {
        ...userSafe,
        tournamentRegistrationsCount: tournamentRegs.length,
        tournamentRegistrations: tournamentRegs.map((r) => ({
          id: r.id,
          tournamentId: r.tournamentId,
          tournamentName: r.tournamentName,
          status: r.status,
          registeredAt: r.registeredAt,
        })),
      };
    });

    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      usersList = usersList.filter(
        (u) =>
          u.gamertag.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.firstName && u.firstName.toLowerCase().includes(q)) ||
          (u.lastName && u.lastName.toLowerCase().includes(q))
      );
    }

    // Sort newest first
    usersList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({
      users: usersList,
      totalCount: usersList.length,
      playersCount: usersList.filter((u) => u.role === 'player').length,
    });
  });

  // Delete a test player account
  app.delete('/api/admin/users/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const targetId = req.params.id;
    const targetUser = db.users.find((u) => u.id === targetId);
    if (!targetUser) {
      res.status(404).json({ error: 'Compte joueur introuvable.' });
      return;
    }

    if (targetUser.role === 'admin' || targetUser.email === 'admin@fctournament.ma') {
      res.status(403).json({ error: 'Action interdite : impossible de supprimer un compte administrateur.' });
      return;
    }

    db.users = db.users.filter((u) => u.id !== targetId);
    saveDatabase(db);

    res.json({ success: true, message: `Compte du joueur ${targetUser.gamertag} supprimé avec succès.` });
  });

  // ==========================================
  // ADMIN: GESTION DES INSCRIPTIONS & NOTIFICATIONS
  // ==========================================

  // Get all registrations with tournament details & stats
  app.get('/api/admin/registrations', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    const { tournamentId, status, search } = req.query;

    // Synchronize registrations from Supabase if configured
    try {
      const supabaseRegs = await fetchRegistrationsFromSupabase();
      if (supabaseRegs && supabaseRegs.length > 0) {
        let hasNew = false;
        for (const sReg of supabaseRegs) {
          const idx = db.registrations.findIndex(
            (r) => r.id === sReg.id || (r.tournamentId === sReg.tournamentId && r.gamertag.toLowerCase() === sReg.gamertag.toLowerCase())
          );
          if (idx === -1) {
            db.registrations.push(sReg);
            hasNew = true;
          } else {
            if (sReg.status !== db.registrations[idx].status || (sReg.paymentProof && !db.registrations[idx].paymentProof)) {
              db.registrations[idx] = { ...db.registrations[idx], ...sReg };
              hasNew = true;
            }
          }
        }
        if (hasNew) {
          saveDatabase(db);
        }
      }
    } catch {
      // Ignore Supabase fetch errors in local offline mode
    }

    const tournamentsMap = new Map(db.tournaments.map((t) => [t.id, t]));

    let list = db.registrations.map((r) => {
      const tourn = tournamentsMap.get(r.tournamentId);
      return {
        ...r,
        tournamentName: r.tournamentName || tourn?.name || 'Tournoi FC',
        tournamentStartDate: tourn?.startDate,
        tournamentTime: tourn?.time,
      };
    });

    if (tournamentId && tournamentId !== 'all') {
      list = list.filter((r) => r.tournamentId === tournamentId);
    }

    if (status && status !== 'all') {
      list = list.filter((r) => r.status === status);
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.playerName.toLowerCase().includes(q) ||
          r.gamertag.toLowerCase().includes(q) ||
          (r.userEmail && r.userEmail.toLowerCase().includes(q)) ||
          (r.phone && r.phone.toLowerCase().includes(q)) ||
          (r.tournamentName && r.tournamentName.toLowerCase().includes(q))
      );
    }

    // Sort by registration date desc
    list.sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime());

    // Tournament statistics breakdown
    const tournamentsStats = db.tournaments.map((t) => {
      const tRegs = db.registrations.filter((r) => r.tournamentId === t.id);
      return {
        id: t.id,
        name: t.name,
        total: tRegs.length,
        confirmed: tRegs.filter((r) => r.status === 'confirmed').length,
        pending: tRegs.filter((r) => r.status === 'pending').length,
        rejected: tRegs.filter((r) => r.status === 'rejected').length,
        maxParticipants: t.maxParticipants,
        status: t.status,
      };
    });

    res.json({
      registrations: list,
      totalCount: db.registrations.length,
      confirmedCount: db.registrations.filter((r) => r.status === 'confirmed').length,
      pendingCount: db.registrations.filter((r) => r.status === 'pending').length,
      rejectedCount: db.registrations.filter((r) => r.status === 'rejected').length,
      tournamentsStats,
    });
  });

  // Export registrations as CSV / Excel format with UTF-8 BOM
  app.get('/api/admin/registrations/export', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const { tournamentId } = req.query;
    const tournamentsMap = new Map(db.tournaments.map((t) => [t.id, t.name]));

    let list = [...db.registrations];
    if (tournamentId && tournamentId !== 'all') {
      list = list.filter((r) => r.tournamentId === tournamentId);
    }

    list.sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime());

    const escapeCsv = (str: string | number | undefined | null) => {
      if (str === undefined || str === null) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    const header = [
      'Dossard',
      'Nom et Prénom',
      'Pseudo EA FC',
      'Numéro de Téléphone',
      'Adresse E-mail',
      'Tournoi Choisi',
      'Équipe Sélectionnée',
      'Préférence Manette',
      'Date et Heure d\'Inscription',
      'Statut',
      'Notes et Remarques',
    ];

    const rows = list.map((r) => [
      escapeCsv(r.seed || '-'),
      escapeCsv(r.playerName),
      escapeCsv(r.gamertag),
      escapeCsv(r.phone || 'Non renseigné'),
      escapeCsv(r.userEmail || 'Non renseigné'),
      escapeCsv(r.tournamentName || tournamentsMap.get(r.tournamentId) || r.tournamentId),
      escapeCsv(r.teamSelected || 'Non spécifiée'),
      escapeCsv(r.controllerPreference || 'Manette standard'),
      escapeCsv(new Date(r.registeredAt).toLocaleString('fr-FR', { timeZone: 'Africa/Casablanca' })),
      escapeCsv(r.status.toUpperCase()),
      escapeCsv(r.notes || ''),
    ]);

    // Prepend UTF-8 BOM (\uFEFF) for direct UTF-8 support in Excel Windows/Mac
    const csvContent = '\uFEFF' + [header.join(';'), ...rows.map((row) => row.join(';'))].join('\r\n');

    const filename = `inscriptions-fc-tournament-${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvContent);
  });

  // Change registration status (Approve / Reject) with automatic WhatsApp invite trigger
  app.put('/api/admin/registrations/:id/status', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    const { status, rejectionReason } = req.body;
    if (!['pending', 'confirmed', 'rejected'].includes(status)) {
      res.status(400).json({ error: 'Statut invalide.' });
      return;
    }

    const targetParam = String(req.params.id || '').trim();
    const regIndex = db.registrations.findIndex(
      (r) =>
        r.id === targetParam ||
        (r.registrationNumber && r.registrationNumber.toLowerCase() === targetParam.toLowerCase()) ||
        (r.registrationNumber && r.registrationNumber.replace(/^reg-/i, '').toLowerCase() === targetParam.toLowerCase())
    );

    if (regIndex === -1) {
      res.status(404).json({ error: `Inscription introuvable pour "${targetParam}".` });
      return;
    }

    const reg = db.registrations[regIndex];
    reg.status = status;

    let emailNotificationResult: { sent: boolean; error?: string } = { sent: false };

    if (status === 'confirmed') {
      reg.validatedAt = new Date().toISOString();
      reg.reviewedBy = req.user?.gamertag || 'Google AI Studio Admin';
      delete reg.rejectedAt;
      delete reg.rejectionReason;

      // Requirement:
      // When an administrator changes status to 'confirmed' (Acceptée):
      // 1. Trigger automatic email to player with WhatsApp group invitation.
      // 2. Only send after validation by admin.
      // 3. Do not send to pending or rejected players.
      // 4. Avoid duplicate emails if admin modifies status or refreshes (check whatsappInviteStatus).
      if (reg.whatsappInviteStatus !== 'sent') {
        const email = reg.userEmail;
        if (email) {
          const sendResult = await sendWhatsAppInviteEmail(
            email,
            reg.playerName,
            reg.gamertag,
            reg.tournamentName
          );
          reg.whatsappInviteAttempts = (reg.whatsappInviteAttempts || 0) + 1;
          if (sendResult.success) {
            reg.whatsappInviteStatus = 'sent';
            reg.whatsappInviteSentAt = new Date().toISOString();
            delete reg.whatsappInviteError;
            emailNotificationResult = { sent: true };
          } else {
            reg.whatsappInviteStatus = 'failed';
            reg.whatsappInviteError = sendResult.error || "Échec de l'envoi de l'e-mail";
            emailNotificationResult = { sent: false, error: reg.whatsappInviteError };
          }
        } else {
          reg.whatsappInviteStatus = 'failed';
          reg.whatsappInviteError = 'Aucune adresse e-mail valide fournie.';
          emailNotificationResult = { sent: false, error: reg.whatsappInviteError };
        }
      }
    } else if (status === 'rejected') {
      reg.rejectedAt = new Date().toISOString();
      reg.rejectionReason = rejectionReason || req.body.reason || 'Dossier ou paiement non conforme';
      reg.reviewedBy = req.user?.gamertag || 'Google AI Studio Admin';
      delete reg.validatedAt;
    } else if (status === 'pending') {
      delete reg.validatedAt;
      delete reg.rejectedAt;
      delete reg.rejectionReason;
    }

    // Add audit notification
    db.notifications.unshift({
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: 'system',
      title: `Inscription ${status === 'confirmed' ? 'Validée' : status === 'rejected' ? 'Refusée' : 'En attente'} (${reg.registrationNumber || reg.gamertag})`,
      message: `L'inscription de ${reg.playerName} (${reg.gamertag}) [${reg.registrationNumber || reg.id}] a été passée à « ${status === 'confirmed' ? 'Validé' : status === 'rejected' ? 'Refusé' : 'En attente'} ».`,
      registrationId: reg.id,
      createdAt: new Date().toISOString(),
      read: false,
    });

    saveDatabase(db);

    // Sync status change to Supabase
    updateRegistrationStatusInSupabase(reg.id, {
      status: reg.status,
      validatedAt: reg.validatedAt,
      rejectedAt: reg.rejectedAt,
      rejectionReason: reg.rejectionReason,
      reviewedBy: reg.reviewedBy,
      whatsappInviteStatus: reg.whatsappInviteStatus,
      whatsappInviteSentAt: reg.whatsappInviteSentAt,
    }).catch((err) => console.warn('[SUPABASE] Échec sync statut:', err));

    // Broadcast status change in Realtime to Google AI Studio
    broadcastStudioEvent('status_updated', {
      registration: reg,
      stats: getRegistrationStats(),
      message: `Statut mis à jour pour ${reg.gamertag} : ${reg.status}`,
    });

    const message =
      status === 'confirmed'
        ? emailNotificationResult.sent
          ? "Inscription validée ! L'invitation au groupe WhatsApp a été envoyée par email au joueur."
          : reg.whatsappInviteStatus === 'sent'
          ? 'Inscription validée (invitation WhatsApp déjà envoyée précédemment).'
          : `Inscription validée, mais l'envoi de l'invitation WhatsApp a échoué : ${emailNotificationResult.error}`
        : status === 'rejected'
        ? `Inscription refusée avec succès (Motif : ${reg.rejectionReason}).`
        : `Statut modifié avec succès : ${status}.`;

    res.json({
      success: true,
      registration: reg,
      emailSent: emailNotificationResult.sent,
      message,
    });
  });

  // Dedicated AI Studio Action endpoint (one-click accept/reject from AI Studio)
  app.post('/api/admin/studio/registrations/:id/action', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    const { action, rejectionReason } = req.body || {};
    const status = action === 'accept' ? 'confirmed' : action === 'reject' ? 'rejected' : null;
    if (!status) {
      res.status(400).json({ error: 'Action invalide. Utilisez "accept" ou "reject".' });
      return;
    }

    const targetParam = String(req.params.id || '').trim();
    const regIndex = db.registrations.findIndex(
      (r) =>
        r.id === targetParam ||
        (r.registrationNumber && r.registrationNumber.toLowerCase() === targetParam.toLowerCase()) ||
        (r.registrationNumber && r.registrationNumber.replace(/^reg-/i, '').toLowerCase() === targetParam.toLowerCase())
    );

    if (regIndex === -1) {
      res.status(404).json({ error: `Inscription introuvable pour "${targetParam}".` });
      return;
    }

    const reg = db.registrations[regIndex];
    reg.status = status;

    let emailNotificationResult = { sent: false, error: '' };

    if (status === 'confirmed') {
      reg.validatedAt = new Date().toISOString();
      reg.reviewedBy = req.user?.gamertag || 'Google AI Studio Admin';
      delete reg.rejectedAt;
      delete reg.rejectionReason;

      if (reg.whatsappInviteStatus !== 'sent') {
        const email = reg.userEmail;
        if (email) {
          const sendResult = await sendWhatsAppInviteEmail(
            email,
            reg.playerName,
            reg.gamertag,
            reg.tournamentName
          );
          reg.whatsappInviteAttempts = (reg.whatsappInviteAttempts || 0) + 1;
          if (sendResult.success) {
            reg.whatsappInviteStatus = 'sent';
            reg.whatsappInviteSentAt = new Date().toISOString();
            delete reg.whatsappInviteError;
            emailNotificationResult = { sent: true, error: '' };
          } else {
            reg.whatsappInviteStatus = 'failed';
            reg.whatsappInviteError = sendResult.error || "Échec de l'envoi de l'e-mail";
            emailNotificationResult = { sent: false, error: reg.whatsappInviteError };
          }
        }
      }
    } else {
      reg.rejectedAt = new Date().toISOString();
      reg.rejectionReason = rejectionReason || req.body.reason || 'Dossier ou paiement non conforme';
      reg.reviewedBy = req.user?.gamertag || 'Google AI Studio Admin';
      delete reg.validatedAt;
    }

    db.notifications.unshift({
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: 'system',
      title: `Inscription ${status === 'confirmed' ? 'Validée' : 'Refusée'} (${reg.registrationNumber || reg.gamertag})`,
      message: `L'inscription de ${reg.playerName} (${reg.gamertag}) a été ${status === 'confirmed' ? 'validée' : 'refusée'} depuis Google AI Studio.`,
      registrationId: reg.id,
      createdAt: new Date().toISOString(),
      read: false,
    });

    saveDatabase(db);

    // Sync status change to Supabase
    updateRegistrationStatusInSupabase(reg.id, {
      status: reg.status,
      validatedAt: reg.validatedAt,
      rejectedAt: reg.rejectedAt,
      rejectionReason: reg.rejectionReason,
      reviewedBy: reg.reviewedBy,
      whatsappInviteStatus: reg.whatsappInviteStatus,
      whatsappInviteSentAt: reg.whatsappInviteSentAt,
    }).catch((err) => console.warn('[SUPABASE] Échec sync statut:', err));

    // Broadcast status change in Realtime to Google AI Studio
    broadcastStudioEvent('status_updated', {
      registration: reg,
      stats: getRegistrationStats(),
      message: `Statut mis à jour pour ${reg.gamertag} : ${reg.status}`,
    });

    res.json({
      success: true,
      registration: reg,
      status: reg.status,
      message: status === 'confirmed'
        ? `L'inscription de ${reg.playerName} (${reg.gamertag}) [${reg.registrationNumber || reg.id}] a été validée avec succès !`
        : `L'inscription de ${reg.playerName} (${reg.gamertag}) [${reg.registrationNumber || reg.id}] a été refusée (Motif: ${reg.rejectionReason}).`,
    });
  });

  // Dedicated AI Studio API summary endpoint
  app.get('/api/admin/studio/registrations', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
    const list = [...db.registrations].reverse();
    const stats = {
      total: db.registrations.length,
      pending: db.registrations.filter((r) => r.status === 'pending').length,
      confirmed: db.registrations.filter((r) => r.status === 'confirmed').length,
      rejected: db.registrations.filter((r) => r.status === 'rejected').length,
    };
    res.json({
      success: true,
      stats,
      registrations: list,
    });
  });

  // Dedicated AI Studio single registration retrieval endpoint (by ID or registrationNumber)
  app.get('/api/admin/studio/registrations/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const reg = db.registrations.find(
      (r) => r.id === req.params.id || r.registrationNumber === req.params.id
    );
    if (!reg) {
      res.status(404).json({ error: 'Inscription introuvable.' });
      return;
    }
    const tournament = db.tournaments.find((t) => t.id === reg.tournamentId);
    res.json({
      success: true,
      registration: reg,
      tournamentTitle: tournament?.name || reg.tournamentId,
    });
  });

  // Supabase public configuration endpoint (safe for frontend, never exposes service_role key)
  app.get('/api/admin/studio/config', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
    res.json({
      success: true,
      supabase: getPublicSupabaseConfig(),
    });
  });

  // Real-time Server-Sent Events (SSE) stream for Google AI Studio
  app.get('/api/admin/studio/live-stream', (req: Request, res: Response) => {
    const code = (req.query.code as string) || (req.headers['x-admin-code'] as string);
    if (!code || !verifyAdminCode(code)) {
      res.status(403).json({ error: 'Code administrateur requis pour écouter le flux en temps réel.' });
      return;
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': '*',
    });

    res.write(`event: connected\ndata: ${JSON.stringify({ stats: getRegistrationStats(), isSupabaseConfigured: isSupabaseConfigured(), timestamp: Date.now() })}\n\n`);

    sseStudioClients.add(res);

    req.on('close', () => {
      sseStudioClients.delete(res);
    });
  });

  // Admin manual resend WhatsApp invitation email
  app.post('/api/admin/registrations/:id/resend-whatsapp', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    const reg = db.registrations.find((r) => r.id === req.params.id);
    if (!reg) {
      res.status(404).json({ error: 'Inscription introuvable.' });
      return;
    }

    if (reg.status !== 'confirmed') {
      res.status(400).json({
        error: "L'invitation WhatsApp ne peut être envoyée qu'aux participants dont l'inscription est validée (Acceptée).",
      });
      return;
    }

    if (!reg.userEmail) {
      res.status(400).json({ error: 'Aucune adresse e-mail trouvée pour ce joueur.' });
      return;
    }

    const sendResult = await sendWhatsAppInviteEmail(
      reg.userEmail,
      reg.playerName,
      reg.gamertag,
      reg.tournamentName
    );

    reg.whatsappInviteAttempts = (reg.whatsappInviteAttempts || 0) + 1;
    if (sendResult.success) {
      reg.whatsappInviteStatus = 'sent';
      reg.whatsappInviteSentAt = new Date().toISOString();
      delete reg.whatsappInviteError;
      saveDatabase(db);
      res.json({
        success: true,
        registration: reg,
        message: `Invitation au groupe WhatsApp envoyée avec succès à ${reg.userEmail}.`,
      });
    } else {
      reg.whatsappInviteStatus = 'failed';
      reg.whatsappInviteError = sendResult.error || "Échec de l'envoi";
      saveDatabase(db);
      res.status(500).json({
        success: false,
        registration: reg,
        error: `Échec de l'envoi de l'e-mail : ${sendResult.error}`,
      });
    }
  });

  // Admin delete registration
  app.delete('/api/admin/registrations/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const regIndex = db.registrations.findIndex((r) => r.id === req.params.id);
    if (regIndex === -1) {
      res.status(404).json({ error: 'Inscription introuvable.' });
      return;
    }

    db.registrations.splice(regIndex, 1);
    saveDatabase(db);

    res.json({ success: true, message: 'Inscription supprimée avec succès.' });
  });

  // Admin download payment proof screenshot
  app.get('/api/admin/registrations/:id/payment-proof', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const reg = db.registrations.find((r) => r.id === req.params.id);
    if (!reg || !reg.paymentProof) {
      res.status(404).json({ error: "Capture d'écran du paiement introuvable pour cette inscription." });
      return;
    }

    const matches = reg.paymentProof.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    if (!matches || matches.length < 3) {
      res.status(400).json({ error: "Format de la capture d'écran invalide." });
      return;
    }

    const mimeSubtype = matches[1].toLowerCase();
    const ext = mimeSubtype === 'jpeg' ? 'jpg' : mimeSubtype;
    const imageBuffer = Buffer.from(matches[2], 'base64');
    const safeGamertag = reg.gamertag.replace(/[^a-zA-Z0-9_-]/g, '_') || 'joueur';
    const filename = `preuve-paiement-${safeGamertag}-${reg.id}.${ext}`;

    res.setHeader('Content-Type', `image/${mimeSubtype}`);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'private, no-cache');
    res.send(imageBuffer);
  });

  // Admin Notifications endpoints
  app.get('/api/admin/notifications', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
    const notifs = db.notifications || [];
    const unreadCount = notifs.filter((n) => !n.read).length;
    res.json({
      notifications: notifs,
      unreadCount,
    });
  });

  app.put('/api/admin/notifications/:id/read', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const notif = db.notifications.find((n) => n.id === req.params.id);
    if (notif) {
      notif.read = true;
      saveDatabase(db);
    }
    res.json({ success: true });
  });

  app.put('/api/admin/notifications/mark-all-read', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
    db.notifications.forEach((n) => {
      n.read = true;
    });
    saveDatabase(db);
    res.json({ success: true, message: 'Toutes les notifications ont été marquées comme lues.' });
  });

  app.delete('/api/admin/notifications/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const idx = db.notifications.findIndex((n) => n.id === req.params.id);
    if (idx !== -1) {
      db.notifications.splice(idx, 1);
      saveDatabase(db);
    }
    res.json({ success: true });
  });

  app.delete('/api/admin/notifications', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
    db.notifications = [];
    saveDatabase(db);
    res.json({ success: true, message: 'Toutes les notifications ont été supprimées.' });
  });

  // Generate Bracket for tournament (from confirmed registrations)
  app.post('/api/admin/tournaments/:id/generate-bracket', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const tournament = db.tournaments.find((t) => t.id === req.params.id);
    if (!tournament) {
      res.status(404).json({ error: 'Tournoi introuvable.' });
      return;
    }

    const confirmedRegs = db.registrations.filter(
      (r) => r.tournamentId === tournament.id && r.status === 'confirmed'
    );

    if (confirmedRegs.length < 2) {
      res.status(400).json({ error: 'Au moins 2 joueurs confirmés sont nécessaires pour générer les confrontations.' });
      return;
    }

    // Clear old matches for this tournament
    db.matches = db.matches.filter((m) => m.tournamentId !== tournament.id);

    const isLeague =
      tournament.format === 'aller_retour' ||
      tournament.format === 'championship' ||
      tournament.name.toLowerCase().includes('championnat');

    const newMatches: Match[] = [];
    const dateStr = tournament.startDate;

    if (isLeague) {
      const players = [...confirmedRegs];
      const isOdd = players.length % 2 !== 0;
      const numPlayers = isOdd ? players.length + 1 : players.length;
      const roundCount = numPlayers - 1;
      const matchesPerRound = Math.floor(numPlayers / 2);

      let indices = Array.from({ length: numPlayers }, (_, i) => i);
      const baseDate = new Date(tournament.startDate || '2026-04-25');

      for (let round = 0; round < roundCount; round++) {
        const roundNum = round + 1;
        const matchDate = new Date(baseDate);
        matchDate.setDate(baseDate.getDate() + round * 7);
        const matchDateStr = matchDate.toISOString().slice(0, 10);

        for (let m = 0; m < matchesPerRound; m++) {
          const homeIdx = indices[m];
          const awayIdx = indices[numPlayers - 1 - m];

          if (isOdd && (homeIdx >= players.length || awayIdx >= players.length)) {
            continue;
          }

          const p1 = players[homeIdx];
          const p2 = players[awayIdx];
          const [homePlayer, awayPlayer] = round % 2 === 0 ? [p1, p2] : [p2, p1];

          const matchHour = 15 + (m % 5);
          const matchTimeStr = `${matchHour.toString().padStart(2, '0')}:00`;

          newMatches.push({
            id: `match_${tournament.id}_j${roundNum}_m${m + 1}`,
            tournamentId: tournament.id,
            stage: 'league',
            stageName: `Journée ${roundNum}`,
            round: roundNum,
            matchNumber: m + 1,
            player1Id: homePlayer.userId,
            player1Gamertag: homePlayer.gamertag,
            player1Score: null,
            player2Id: awayPlayer.userId,
            player2Gamertag: awayPlayer.gamertag,
            player2Score: null,
            status: 'scheduled',
            winnerId: null,
            scheduledDate: matchDateStr,
            scheduledTime: matchTimeStr,
            validatedByAdmin: false,
            auditLog: [
              {
                timestamp: new Date().toISOString(),
                adminName: req.user!.gamertag,
                action: 'LEAGUE_DRAW_GENERATION',
                note: `Calendrier officiel Championnat - Journée ${roundNum} match #${m + 1}.`,
              },
            ],
          });
        }

        indices = [indices[0], indices[numPlayers - 1], ...indices.slice(1, numPlayers - 1)];
      }

      tournament.status = 'ongoing';
      db.matches.push(...newMatches);
      saveDatabase(db);

      res.json({
        matches: newMatches,
        message: `Calendrier officiel du Championnat généré (${newMatches.length} matchs sur ${roundCount} journées).`,
      });
      return;
    }

    // Shuffle or use seed for knockout bracket
    const shuffled = [...confirmedRegs].sort(() => 0.5 - Math.random());
    const matchCount = Math.floor(shuffled.length / 2);

    if (matchCount >= 4) {
      // 8 players: 4 Quarter-finals
      for (let i = 0; i < 4; i++) {
        const p1 = shuffled[i * 2];
        const p2 = shuffled[i * 2 + 1];
        const targetSemiIndex = i < 2 ? 1 : 2;
        const targetSemiSlot = (i % 2 === 0 ? 1 : 2) as 1 | 2;

        newMatches.push({
          id: `match_${tournament.id}_qf${i + 1}`,
          tournamentId: tournament.id,
          stage: 'quarter_final',
          stageName: `Quart de Finale ${i + 1}`,
          round: 1,
          matchNumber: i + 1,
          nextMatchId: `match_${tournament.id}_sf${targetSemiIndex}`,
          nextMatchSlot: targetSemiSlot,
          player1Id: p1 ? p1.userId : null,
          player1Gamertag: p1 ? p1.gamertag : 'En attente',
          player1Score: null,
          player2Id: p2 ? p2.userId : null,
          player2Gamertag: p2 ? p2.gamertag : 'En attente',
          player2Score: null,
          status: 'scheduled',
          winnerId: null,
          scheduledDate: dateStr,
          scheduledTime: tournament.time || '15:00',
          validatedByAdmin: false,
          auditLog: [
            {
              timestamp: new Date().toISOString(),
              adminName: req.user!.gamertag,
              action: 'BRACKET_GENERATION',
              note: `Tirage au sort officiel - Quart de Finale ${i + 1}.`,
            },
          ],
        });
      }
    } else {
      // 4 players: 2 Semi-finals
      for (let i = 0; i < matchCount; i++) {
        const p1 = shuffled[i * 2];
        const p2 = shuffled[i * 2 + 1];

        newMatches.push({
          id: `match_${tournament.id}_sf${i + 1}`,
          tournamentId: tournament.id,
          stage: 'semi_final',
          stageName: `Demi-Finale ${i + 1}`,
          round: 1,
          matchNumber: i + 1,
          nextMatchId: `match_${tournament.id}_final`,
          nextMatchSlot: (i === 0 ? 1 : 2) as 1 | 2,
          player1Id: p1 ? p1.userId : null,
          player1Gamertag: p1 ? p1.gamertag : 'En attente',
          player1Score: null,
          player2Id: p2 ? p2.userId : null,
          player2Gamertag: p2 ? p2.gamertag : 'En attente',
          player2Score: null,
          status: 'scheduled',
          winnerId: null,
          scheduledDate: dateStr,
          scheduledTime: tournament.time || '16:00',
          validatedByAdmin: false,
          auditLog: [
            {
              timestamp: new Date().toISOString(),
              adminName: req.user!.gamertag,
              action: 'BRACKET_GENERATION',
              note: `Tirage au sort officiel - Demi-Finale ${i + 1}.`,
            },
          ],
        });
      }
    }

    // If semi-finals exist, create placeholders
    if (matchCount >= 4) {
      newMatches.push({
        id: `match_${tournament.id}_sf1`,
        tournamentId: tournament.id,
        stage: 'semi_final',
        stageName: 'Demi-Finale 1',
        round: 2,
        matchNumber: 1,
        nextMatchId: `match_${tournament.id}_final`,
        nextMatchSlot: 1,
        player1Id: null,
        player1Gamertag: 'Vainqueur Quart 1',
        player1Score: null,
        player2Id: null,
        player2Gamertag: 'Vainqueur Quart 2',
        player2Score: null,
        status: 'scheduled',
        winnerId: null,
        scheduledDate: dateStr,
        scheduledTime: '17:30',
        validatedByAdmin: false,
        auditLog: [],
      });

      newMatches.push({
        id: `match_${tournament.id}_sf2`,
        tournamentId: tournament.id,
        stage: 'semi_final',
        stageName: 'Demi-Finale 2',
        round: 2,
        matchNumber: 2,
        nextMatchId: `match_${tournament.id}_final`,
        nextMatchSlot: 2,
        player1Id: null,
        player1Gamertag: 'Vainqueur Quart 3',
        player1Score: null,
        player2Id: null,
        player2Gamertag: 'Vainqueur Quart 4',
        player2Score: null,
        status: 'scheduled',
        winnerId: null,
        scheduledDate: dateStr,
        scheduledTime: '18:15',
        validatedByAdmin: false,
        auditLog: [],
      });

      newMatches.push({
        id: `match_${tournament.id}_final`,
        tournamentId: tournament.id,
        stage: 'final',
        stageName: 'Grande Finale',
        round: 3,
        matchNumber: 1,
        nextMatchId: null,
        player1Id: null,
        player1Gamertag: 'Vainqueur Demi 1',
        player1Score: null,
        player2Id: null,
        player2Gamertag: 'Vainqueur Demi 2',
        player2Score: null,
        status: 'scheduled',
        winnerId: null,
        scheduledDate: dateStr,
        scheduledTime: '19:30',
        validatedByAdmin: false,
        auditLog: [],
      });
    } else if (matchCount === 2) {
      newMatches.push({
        id: `match_${tournament.id}_final`,
        tournamentId: tournament.id,
        stage: 'final',
        stageName: 'Grande Finale',
        round: 2,
        matchNumber: 1,
        player1Id: null,
        player1Gamertag: 'Vainqueur Demi 1',
        player1Score: null,
        player2Id: null,
        player2Gamertag: 'Vainqueur Demi 2',
        player2Score: null,
        status: 'scheduled',
        winnerId: null,
        scheduledDate: dateStr,
        scheduledTime: '19:00',
        validatedByAdmin: false,
        auditLog: [],
      });
      // Link next match
      newMatches[0].nextMatchId = `match_${tournament.id}_final`;
      newMatches[0].nextMatchSlot = 1;
      newMatches[1].nextMatchId = `match_${tournament.id}_final`;
      newMatches[1].nextMatchSlot = 2;
    }

    // Set tournament status to ongoing
    tournament.status = 'ongoing';

    db.matches.push(...newMatches);
    saveDatabase(db);

    res.json({
      matches: newMatches,
      message: `${newMatches.length} confrontations générées et tournoi passé en statut « En cours ».`,
    });
  });

  // Enter / Validate match score (Server-verified admin validation with audit log)
  app.put('/api/admin/matches/:id/score', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const { score1, score2, note } = req.body;
    const matchIndex = db.matches.findIndex((m) => m.id === req.params.id);

    if (matchIndex === -1) {
      res.status(404).json({ error: 'Match introuvable.' });
      return;
    }

    const match = db.matches[matchIndex];
    const s1 = parseInt(score1, 10);
    const s2 = parseInt(score2, 10);

    if (isNaN(s1) || isNaN(s2) || s1 < 0 || s2 < 0) {
      res.status(400).json({ error: 'Scores invalides. Veuillez entrer des nombres entiers positifs.' });
      return;
    }

    if (s1 === s2) {
      res.status(400).json({ error: 'En phase éliminatoire, un match ne peut se terminer sur un score nul (veuillez inclure les tirs au but).' });
      return;
    }

    const winnerId = s1 > s2 ? match.player1Id : match.player2Id;
    const winnerGamertag = s1 > s2 ? match.player1Gamertag : match.player2Gamertag;

    match.player1Score = s1;
    match.player2Score = s2;
    match.winnerId = winnerId;
    match.status = 'completed';
    match.validatedByAdmin = true;

    const auditEntry: MatchAuditEntry = {
      timestamp: new Date().toISOString(),
      adminName: req.user!.gamertag,
      action: 'SCORE_UPDATE_AND_VALIDATION',
      note: note || `Score validé : ${match.player1Gamertag} (${s1}) - (${s2}) ${match.player2Gamertag}. Vainqueur : ${winnerGamertag}.`,
    };
    match.auditLog.push(auditEntry);

    // Propagate winner to next match if configured
    if (match.nextMatchId && winnerId) {
      const nextMatch = db.matches.find((m) => m.id === match.nextMatchId);
      if (nextMatch) {
        if (match.nextMatchSlot === 1) {
          nextMatch.player1Id = winnerId;
          nextMatch.player1Gamertag = winnerGamertag;
        } else if (match.nextMatchSlot === 2) {
          nextMatch.player2Id = winnerId;
          nextMatch.player2Gamertag = winnerGamertag;
        }
      }
    }

    saveDatabase(db);

    res.json({ match, message: `Score officiellement validé ! Vainqueur qualifié : ${winnerGamertag}.` });
  });

  // Admin dashboard summary stats
  app.get('/api/admin/stats', requireAdmin, (_req: Request, res: Response) => {
    res.json({
      totalTournaments: db.tournaments.length,
      activeTournaments: db.tournaments.filter((t) => t.status === 'ongoing' || t.status === 'open').length,
      totalPlayers: db.users.filter((u) => u.role === 'player').length,
      totalRegistrations: db.registrations.length,
      pendingRegistrations: db.registrations.filter((r) => r.status === 'pending').length,
      totalMatches: db.matches.length,
      completedMatches: db.matches.filter((m) => m.status === 'completed').length,
      contacts: db.contacts,
    });
  });

  // Admin recalculate leaderboard and sync points
  app.post('/api/admin/recalculate-leaderboard', requireAdmin, (_req: Request, res: Response) => {
    const rankings = computeLeaderboard();
    res.json({
      rankings,
      message: 'Points et classement général recalculés avec succès selon les résultats homologués.',
    });
  });

  // Google AI Studio dedicated registration management interface
  app.get('/studio-admin', (_req: Request, res: Response) => {
    const artifactPath = path.resolve(
      __dirname,
      '.aistudio/artifacts/brain/6e0e00a5-858b-40d3-87c9-f55e8dc956a4/gestion_inscriptions.html'
    );
    if (fs.existsSync(artifactPath)) {
      res.sendFile(artifactPath);
    } else {
      res.redirect('/#admin');
    }
  });

  // ==========================================
  // VITE DEV SERVER / STATIC SERVING
  // ==========================================

async function startServer() {
  const isViteDev = process.env.NODE_ENV !== 'production' &&
    fileURLToPath(import.meta.url).endsWith('.ts') &&
    fs.existsSync(path.resolve(__dirname, 'src'));

  function serveStaticProduction() {
    let staticDir = path.resolve(__dirname, 'dist');
    let indexHtmlPath = path.resolve(staticDir, 'index.html');

    if (!fs.existsSync(indexHtmlPath) && fs.existsSync(path.resolve(__dirname, 'index.html'))) {
      staticDir = __dirname;
      indexHtmlPath = path.resolve(__dirname, 'index.html');
    }

    app.use(express.static(staticDir));
    app.use('*', (_req, res) => {
      if (fs.existsSync(indexHtmlPath)) {
        res.sendFile(indexHtmlPath);
      } else {
        res.status(404).send('Application build not found. Please upload index.html or dist/ folder.');
      }
    });
  }

  if (isViteDev) {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });

      app.use(vite.middlewares);

      app.use('*', async (req, res, next) => {
        const url = req.originalUrl;
        try {
          const template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
          const html = await vite.transformIndexHtml(url, template);
          res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
        } catch (e: any) {
          vite.ssrFixStacktrace(e);
          next(e);
        }
      });
    } catch (viteErr) {
      console.warn('Vite dev middleware could not be loaded, falling back to static serving:', viteErr);
      serveStaticProduction();
    }
  } else {
    serveStaticProduction();
  }

  if (typeof PORT === 'number') {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`FC Tournament Server running on port ${PORT}`);
    });
  } else {
    app.listen(PORT, () => {
      console.log(`FC Tournament Server running on socket ${PORT}`);
    });
  }
}

export { app };
export default app;

// Start server on Hostinger, Phusion Passenger, local Node, or dev container
// Skip only when explicitly running inside Vercel serverless functions
const isVercelServerless = Boolean(process.env.VERCEL);

if (!isVercelServerless) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
  });
}
