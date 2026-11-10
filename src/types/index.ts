export type UserRole = 'player' | 'admin';

export interface User {
  id: string;
  email: string;
  gamertag: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  favoriteTeam?: string;
  bio?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface UserWithCredentials extends User {
  passwordHash: string;
  salt: string;
}

export type TournamentStatus = 'open' | 'ongoing' | 'completed' | 'cancelled';
export type TournamentFormat = 'single_elimination' | 'groups_playoffs' | 'championship' | 'aller_retour';

export interface Tournament {
  id: string;
  name: string;
  slug: string;
  description: string;
  gameVersion: string;
  platform: string;
  format: TournamentFormat;
  location?: string;
  city?: string;
  startDate: string;
  time: string;
  registrationDeadline: string;
  maxParticipants: number;
  entryFeeMAD: number;
  prizePool: string;
  status: TournamentStatus;
  rules: string;
  bannerImage: string;
  createdAt: string;
  participantsCount?: number;
  confirmedCount?: number;
  userRegistration?: Registration | null;
}

export type RegistrationStatus = 'pending' | 'confirmed' | 'rejected';

export interface Registration {
  id: string;
  tournamentId: string;
  tournamentName?: string;
  userId: string;
  gamertag: string;
  playerName: string;
  userEmail?: string;
  phone?: string;
  teamSelected?: string;
  controllerPreference?: string;
  notes?: string;
  paymentProof?: string;
  paymentProofName?: string;
  status: RegistrationStatus;
  registeredAt: string;
  registrationNumber?: string;
  validatedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  reviewedBy?: string;
  seed?: number;
  whatsappInviteStatus?: 'sent' | 'failed' | 'not_sent';
  whatsappInviteSentAt?: string;
  whatsappInviteError?: string;
  whatsappInviteAttempts?: number;
}

export type MatchStage = 'group' | 'league' | 'round_16' | 'quarter_final' | 'semi_final' | 'final' | 'third_place';
export type MatchStatus = 'scheduled' | 'live' | 'completed';

export interface MatchAuditEntry {
  timestamp: string;
  adminName: string;
  action: string;
  note: string;
}

export interface Match {
  id: string;
  tournamentId: string;
  stage: MatchStage;
  stageName: string;
  round: number;
  matchNumber: number;
  nextMatchId?: string | null;
  nextMatchSlot?: 1 | 2;
  player1Id: string | null;
  player1Gamertag: string;
  player1Score: number | null;
  player2Id: string | null;
  player2Gamertag: string;
  player2Score: number | null;
  status: MatchStatus;
  winnerId: string | null;
  scheduledDate: string;
  scheduledTime: string;
  validatedByAdmin: boolean;
  auditLog: MatchAuditEntry[];
}

export interface PlayerLeaderboard {
  userId: string;
  gamertag: string;
  playerName: string;
  avatarUrl?: string;
  tournamentsPlayed: number;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  winRate: number;
  points: number;
  rank: number;
  trophies: number;
}

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  replied?: boolean;
}

export interface AdminNotification {
  id: string;
  type: 'new_registration' | 'registration_cancelled' | 'contact_message' | 'system' | 'security';
  title: string;
  message: string;
  playerName?: string;
  gamertag?: string;
  userEmail?: string;
  phone?: string;
  tournamentId?: string;
  tournamentName?: string;
  registrationId?: string;
  createdAt: string;
  read: boolean;
}

export type PaymentMethodId = 'cih' | 'bmce' | 'mtn_momo';
export type PaymentProofStatus = 'pending' | 'accepted' | 'rejected';

export interface PaymentSubmission {
  id: string;
  userId: string;
  gamertag: string;
  playerName: string;
  userEmail: string;
  phone?: string;
  tournamentId?: string;
  tournamentName?: string;
  paymentMethod: PaymentMethodId;
  paymentMethodName: string;
  amountMAD?: number;
  proofData: string; // Base64 data URL (image or PDF)
  proofName: string;
  proofType: string;
  proofSize?: string;
  notes?: string;
  status: PaymentProofStatus;
  rejectionReason?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}
