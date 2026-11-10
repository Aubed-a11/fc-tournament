import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import type { Tournament, Registration, Match, PlayerLeaderboard, ScoreSubmission } from '../types/index.ts';
import { ScoreSubmitModal } from '../components/ScoreSubmitModal.tsx';
import { buildMatchesIcs, downloadIcs, casablancaToday } from '../utils/calendar.ts';
import { formatDateFrench, formatMAD } from '../utils/format.ts';
import {
  Trophy,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  UserCheck,
  Shield,
  Gamepad2,
  Award,
  Camera,
  XCircle,
  CalendarPlus,
  Bell,
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (page: string, param?: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user, token } = useAuth();
  const [dashboardData, setDashboardData] = useState<{
    stats: PlayerLeaderboard;
    registrations: Registration[];
    tournaments: Tournament[];
    matches: Match[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [scoreSubmissions, setScoreSubmissions] = useState<ScoreSubmission[]>([]);
  const [scoreMatch, setScoreMatch] = useState<Match | null>(null);
  const [scoreMessage, setScoreMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    async function loadDashboard() {
      if (!token) return;
      try {
        const [res, subsRes] = await Promise.all([
          fetch('/api/player/dashboard', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/player/score-submissions', { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
        ]);
        if (res.ok) {
          const data = await res.json();
          setDashboardData(data);
        }
        if (subsRes && subsRes.ok) {
          const subs = await subsRes.json();
          setScoreSubmissions(subs.submissions || []);
        }
      } catch (err) {
        console.error('Error fetching dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [token, reloadKey]);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#07090e] p-8 text-center text-slate-400 space-y-4">
        <p>Veuillez vous connecter pour accéder à votre espace joueur.</p>
        <button
          onClick={() => onNavigate('login')}
          className="px-5 py-2.5 rounded-xl bg-[#00ff66] text-black font-bold text-xs uppercase cursor-pointer"
        >
          Se connecter
        </button>
      </div>
    );
  }

  const stats = dashboardData?.stats;
  const userTournaments = dashboardData?.tournaments || [];
  const userRegistrations = dashboardData?.registrations || [];
  const userMatches = dashboardData?.matches || [];

  const upcomingMatches = userMatches.filter((m) => m.status !== 'completed');
  const pastMatches = userMatches.filter((m) => m.status === 'completed');
  // Matchs a jouer d'abord, puis les derniers matchs termines
  const displayedMatches = [...upcomingMatches, ...pastMatches].slice(0, 6);
  // Calendrier personnel : tous les matchs a venir du joueur, tries par date
  const todayStr = casablancaToday(0);
  const tomorrowStr = casablancaToday(1);
  const myCalendar = [...upcomingMatches].sort((a, b) =>
    `${a.scheduledDate} ${a.scheduledTime}`.localeCompare(`${b.scheduledDate} ${b.scheduledTime}`)
  );
  const tournamentNames: Record<string, string> = Object.fromEntries(userTournaments.map((t) => [t.id, t.name]));
  const matchesToday = myCalendar.filter((m) => m.scheduledDate === todayStr);
  const opponentOf = (m: Match) => (m.player1Id === user.id ? m.player2Gamertag : m.player1Gamertag);
  const dayLabel = (date: string) =>
    date === todayStr ? "Aujourd'hui" : date === tomorrowStr ? 'Demain' : formatDateFrench(date);
  const exportCalendar = (list: Match[], filename: string) =>
    downloadIcs(buildMatchesIcs(list, user.id, tournamentNames), filename);

  const latestSubmissionFor = (matchId: string) =>
    scoreSubmissions
      .filter((s) => s.matchId === matchId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

  return (
    <div className="min-h-screen bg-[#07090e] py-10 px-4 sm:px-6 lg:px-8 text-slate-200">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Profile Hero Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#0c1017] border border-[#1c2435] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#141b27] border-2 border-[#00ff66]/40 flex items-center justify-center font-display font-black text-2xl text-[#00ff66] shadow-[0_0_20px_rgba(0,255,102,0.25)]">
              {user.gamertag.substring(0, 2).toUpperCase()}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="font-display text-3xl font-black text-white uppercase tracking-wide">
                  {user.gamertag}
                </h1>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#16202f] text-[#00ff66] border border-[#213047]">
                  {user.role === 'admin' ? 'Organisateur / Administrateur' : 'Joueur Compétiteur'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {user.firstName} {user.lastName} · Équipe de prédilection : <strong className="text-white">{user.favoriteTeam || 'EA FC'}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('profile')}
              className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-[#141b27] border border-[#222f44] hover:border-[#00ff66]/40 text-slate-200 transition-colors cursor-pointer"
            >
              Modifier mon profil
            </button>
            {user.role === 'admin' && (
              <button
                onClick={() => onNavigate('admin')}
                className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-[#00ff66] text-black hover:bg-[#00e65c] transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,255,102,0.3)] cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Panneau Administrateur</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-[#0b0f16] border border-[#1b2333] space-y-1 shadow-md">
            <span className="text-[11px] font-mono uppercase text-slate-400 block">Classement Général</span>
            <span className="text-2xl sm:text-3xl font-display font-black text-yellow-400 tabular-nums">
              #{stats ? stats.rank : '-'}
            </span>
            <span className="text-[10px] text-slate-500 block">Sur l'ensemble des compétiteurs</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#0b0f16] border border-[#1b2333] space-y-1 shadow-md">
            <span className="text-[11px] font-mono uppercase text-slate-400 block">Points Homologués</span>
            <span className="text-2xl sm:text-3xl font-mono font-bold text-[#00ff66] tabular-nums">
              {stats ? stats.points : 0} pts
            </span>
            <span className="text-[10px] text-slate-500 block">Saison active 2026</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#0b0f16] border border-[#1b2333] space-y-1 shadow-md">
            <span className="text-[11px] font-mono uppercase text-slate-400 block">Bilan V / D</span>
            <span className="text-2xl sm:text-3xl font-mono font-bold text-white tabular-nums">
              {stats ? `${stats.wins}V` : '0V'} <span className="text-slate-500 text-lg">/</span> {stats ? `${stats.losses}D` : '0D'}
            </span>
            <span className="text-[10px] text-slate-500 block">Matchs disputés : {stats ? stats.matchesPlayed : 0}</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#0b0f16] border border-[#1b2333] space-y-1 shadow-md">
            <span className="text-[11px] font-mono uppercase text-slate-400 block">Tournois Disputés</span>
            <span className="text-2xl sm:text-3xl font-display font-black text-[#00ff66] tabular-nums">
              {stats ? stats.tournamentsPlayed : 0}
            </span>
            <span className="text-[10px] text-slate-500 block">Compétitions officielles</span>
          </div>
        </div>

        {/* Rappel du jour */}
        {matchesToday.length > 0 && (
          <div className="p-4 rounded-2xl bg-[#00ff66]/10 border border-[#00ff66]/40 flex items-start gap-3">
            <Bell className="w-5 h-5 text-[#00ff66] shrink-0 mt-0.5" />
            <div className="text-sm text-white">
              <span className="font-bold">Vous jouez aujourd'hui : </span>
              {matchesToday.map((m, i) => (
                <span key={m.id}>
                  {i > 0 && ', '}
                  {m.scheduledTime} contre <strong>{opponentOf(m)}</strong>
                </span>
              ))}
              <span className="block text-xs text-slate-300 mt-1">Soyez à l'heure : plus de 10 minutes de retard entraîne un forfait.</span>
            </div>
          </div>
        )}

        {/* Mon calendrier personnel */}
        <div className="p-6 rounded-3xl bg-[#0b0f16] border border-[#1c2435] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-2xl font-bold text-white uppercase tracking-wide">Mon calendrier</h3>
              <p className="text-xs text-slate-400 mt-1">
                Vos matchs à venir (heure du Maroc). Vous recevez aussi un rappel par e-mail la veille et le jour de chaque match.
              </p>
            </div>
            {myCalendar.length > 0 && (
              <button
                onClick={() => exportCalendar(myCalendar, 'mes-matchs-fc-tournament.ics')}
                className="px-4 py-2.5 rounded-xl bg-[#00ff66] text-black font-bold text-xs flex items-center gap-2 hover:bg-[#00e65c] transition-colors cursor-pointer shrink-0"
                title="Ajouter tous vos matchs à l'agenda de votre téléphone, avec rappels"
              >
                <CalendarPlus className="w-4 h-4" />
                <span>Tout ajouter à mon agenda</span>
              </button>
            )}
          </div>

          {myCalendar.length === 0 ? (
            <div className="p-6 text-center rounded-2xl bg-[#0e131d] border border-[#1b2333] text-slate-400 text-xs">
              Aucun match programmé pour le moment. Votre calendrier se remplira dès le tirage au sort.
            </div>
          ) : (
            <div className="divide-y divide-[#161f2e] rounded-2xl border border-[#1b2333] overflow-hidden">
              {myCalendar.map((m) => (
                <div
                  key={m.id}
                  className={`p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-xs ${
                    m.scheduledDate === todayStr ? 'bg-[#00ff66]/5' : 'bg-[#0e131d]'
                  }`}
                >
                  <div className="sm:w-40 shrink-0">
                    <span className={`block font-bold ${m.scheduledDate === todayStr ? 'text-[#00ff66]' : 'text-white'}`}>
                      {dayLabel(m.scheduledDate)}
                    </span>
                    <span className="font-mono text-slate-400">{m.scheduledTime}</span>
                  </div>
                  <div className="flex-1">
                    <span className="text-white">
                      contre <strong>{opponentOf(m) || 'adversaire à définir'}</strong>
                    </span>
                    <span className="block text-[11px] text-slate-500">
                      {m.stageName}
                      {tournamentNames[m.tournamentId] ? ` · ${tournamentNames[m.tournamentId]}` : ''}
                    </span>
                  </div>
                  <button
                    onClick={() => exportCalendar([m], `match-${m.id}.ics`)}
                    className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-[#151f2d] text-slate-200 hover:text-white hover:bg-[#1d2b3f] font-semibold text-[11px] flex items-center gap-1.5 cursor-pointer"
                    title="Ajouter ce match à mon agenda avec rappels"
                  >
                    <CalendarPlus className="w-3.5 h-3.5 text-[#00ff66]" />
                    <span>Ajouter à mon agenda</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2-Columns Content: Inscriptions & Matchs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Mes Inscriptions aux Tournois */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1b2333]">
              <h3 className="font-display text-2xl font-bold text-white uppercase tracking-wide">
                Mes Inscriptions ({userRegistrations.length})
              </h3>
              <button
                onClick={() => onNavigate('tournaments')}
                className="text-xs text-[#00ff66] hover:underline cursor-pointer"
              >
                Parcourir les tournois
              </button>
            </div>

            {userTournaments.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-[#0b0f16] border border-[#1b2333] space-y-3">
                <Calendar className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-xs text-slate-400">Vous n'êtes actuellement inscrit à aucun tournoi.</p>
                <button
                  onClick={() => onNavigate('tournaments')}
                  className="px-4 py-2 rounded-xl bg-[#00ff66] text-black font-bold text-xs uppercase cursor-pointer"
                >
                  Découvrir les compétitions ouvertes
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {userTournaments.map((tourn) => {
                  const reg = userRegistrations.find((r) => r.tournamentId === tourn.id);
                  return (
                    <div
                      key={tourn.id}
                      className="p-4 rounded-2xl bg-[#0b0f16] border border-[#1c2538] hover:border-[#2b384f] transition-colors flex items-center justify-between gap-4 shadow-md"
                    >
                      <div className="space-y-1 flex-1 truncate">
                        <span className="font-bold text-white text-xs block truncate">
                          {tourn.name}
                        </span>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 font-mono">
                          <span>Heure convocation : {tourn.time}</span>
                          <span>·</span>
                          <span className={`px-2 py-0.2 rounded text-[10px] ${
                            reg?.status === 'confirmed'
                              ? 'text-[#00ff66] bg-[#00ff66]/10'
                              : 'text-amber-400 bg-amber-400/10'
                          }`}>
                            {reg?.status === 'confirmed' ? `Confirmé #${reg.seed || 1}` : 'En attente'}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => onNavigate('tournament-detail', tourn.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-[#141b27] hover:bg-[#00ff66] hover:text-black text-slate-300 text-xs font-semibold transition-colors shrink-0 cursor-pointer"
                      >
                        Consulter
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Mes Prochains Matchs & Historique */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1b2333]">
              <h3 className="font-display text-2xl font-bold text-white uppercase tracking-wide">
                Mes Matchs de Compétition
              </h3>
              <button
                onClick={() => onNavigate('results')}
                className="text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Tous les résultats
              </button>
            </div>

            {scoreMessage && (
              <div className="p-3 rounded-xl bg-[#00ff66]/10 border border-[#00ff66]/30 text-xs text-[#00ff66] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{scoreMessage}</span>
              </div>
            )}

            {userMatches.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-[#0b0f16] border border-[#1b2333] text-slate-400 text-xs">
                Aucun match n'est encore programmé pour votre compte. Dès le tirage au sort officiel, vos rencontres apparaîtront ici.
              </div>
            ) : (
              <div className="space-y-3">
                {displayedMatches.map((m) => {
                  const isCompleted = m.status === 'completed';
                  const isWon = isCompleted && m.winnerId === user.id;
                  const submission = latestSubmissionFor(m.id);
                  const canSubmit = !isCompleted && Boolean(m.player1Id && m.player2Id);

                  return (
                    <div key={m.id} className="p-4 rounded-2xl bg-[#0b0f16] border border-[#1c2538] text-xs shadow-md space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <span className="font-bold text-white block">{m.stageName}</span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {formatDateFrench(m.scheduledDate)} à {m.scheduledTime}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-white">
                          {m.player1Gamertag} {m.player1Score !== null ? `${m.player1Score} - ${m.player2Score}` : 'VS'} {m.player2Gamertag}
                        </span>
                        {isCompleted ? (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isWon ? 'bg-[#00ff66]/15 text-[#00ff66]' : 'bg-rose-500/15 text-rose-400'
                          }`}>
                            {isWon ? 'Victoire' : 'Défaite'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-amber-400/15 text-amber-400 font-bold">
                            À jouer
                          </span>
                        )}
                      </div>
                    </div>

                    {canSubmit && (
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#161f2e]">
                        {submission?.status === 'pending' ? (
                          <span className="flex items-center gap-1.5 text-[11px] text-amber-400">
                            <Clock className="w-3.5 h-3.5" />
                            Score envoyé ({submission.score1} - {submission.score2}), en cours de vérification
                          </span>
                        ) : submission?.status === 'rejected' ? (
                          <span className="flex items-center gap-1.5 text-[11px] text-rose-400" title={submission.rejectionReason}>
                            <XCircle className="w-3.5 h-3.5" />
                            Envoi refusé : {submission.rejectionReason}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500">Match joué ? Envoyez la capture du score final.</span>
                        )}
                        <button
                          onClick={() => {
                            setScoreMessage(null);
                            setScoreMatch(m);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#00ff66]/15 text-[#00ff66] hover:bg-[#00ff66] hover:text-black font-semibold text-[11px] transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>{submission?.status === 'pending' ? 'Renvoyer' : 'Envoyer le score'}</span>
                        </button>
                      </div>
                    )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {scoreMatch && token && (
        <ScoreSubmitModal
          match={scoreMatch}
          token={token}
          onClose={() => setScoreMatch(null)}
          onSubmitted={(msg) => {
            setScoreMatch(null);
            setScoreMessage(msg);
            setReloadKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
};
