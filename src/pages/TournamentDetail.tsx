import React, { useState, useEffect } from 'react';
import type { Tournament, Registration, Match } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { ScoreModal } from '../components/ScoreModal.tsx';
import { RegistrationModal } from '../components/RegistrationModal.tsx';
import { apiClient } from '../services/apiClient.ts';
import { LeagueStandingsTable } from '../components/LeagueStandingsTable.tsx';
import { LeagueSchedule } from '../components/LeagueSchedule.tsx';
import { OfficialRulesSection } from '../components/OfficialRulesSection.tsx';
import { formatDateFrench, formatMAD } from '../utils/format.ts';
import {
  Calendar,
  Trophy,
  Users,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowLeft,
  AlertCircle,
  FileText,
  Gamepad2,
  Shield,
  HelpCircle,
} from 'lucide-react';

interface TournamentDetailProps {
  tournamentId: string;
  onNavigate: (page: string, param?: string) => void;
}

export const TournamentDetail: React.FC<TournamentDetailProps> = ({
  tournamentId,
  onNavigate,
}) => {
  const { user, token } = useAuth();
  const [tournament, setTournament] = useState<
    (Tournament & { registrations?: Registration[]; matches?: Match[] }) | null
  >(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'standings' | 'matches'>('overview');
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Registration modal state
  const [showRegistrationModal, setShowRegistrationModal] = useState<boolean>(false);

  // Score modal for admin
  const [scoreModalMatch, setScoreModalMatch] = useState<Match | null>(null);

  const fetchDetail = async () => {
    try {
      const data = await apiClient.getTournament(tournamentId, token);
      if (data) {
        setTournament(data);
        const isLeague =
          data.format === 'aller_retour' ||
          data.format === 'championship' ||
          (data.name && data.name.toLowerCase().includes('championnat'));
        if (isLeague) {
          setActiveTab((prev) => (prev === 'overview' ? 'standings' : prev));
        }
      }
    } catch (err) {
      console.error('Error fetching tournament details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [tournamentId, token]);

  const handleStartRegistration = () => {
    setShowRegistrationModal(true);
  };

  const handleUnregister = async () => {
    if (!confirm('Êtes-vous sûr de vouloir annuler votre inscription à ce tournoi ?')) {
      return;
    }

    setActionLoading(true);
    setActionMessage(null);

    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/register`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();

      if (!res.ok) {
        setActionMessage({ type: 'error', text: data.error || 'Erreur lors de l’annulation.' });
      } else {
        setActionMessage({ type: 'success', text: data.message });
        await fetchDetail();
      }
    } catch {
      setActionMessage({ type: 'error', text: 'Impossible de joindre le serveur.' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090e] p-8 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#00ff66]/30 border-t-[#00ff66] rounded-full animate-spin" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-[#07090e] p-8 text-center text-slate-400 space-y-4">
        <p>Tournoi introuvable.</p>
        <button
          onClick={() => onNavigate('tournaments')}
          className="text-xs text-[#00ff66] underline cursor-pointer"
        >
          Retour aux tournois
        </button>
      </div>
    );
  }

  const isOpen = tournament.status === 'open';
  const isOngoing = tournament.status === 'ongoing';
  const isCompleted = tournament.status === 'completed';
  const placesRemaining = tournament.maxParticipants - (tournament.confirmedCount || 0);
  const isUserRegistered = !!tournament.userRegistration;
  const userRegistration = tournament.userRegistration;

  // Requirement: ONLY accepted/confirmed participants appear in public list
  const registrationsList = (tournament.registrations || []).filter(
    (r) => r.status === 'confirmed'
  );
  const matchesList = tournament.matches || [];

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-200 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Back Link */}
        <button
          onClick={() => onNavigate('tournaments')}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à la liste des tournois</span>
        </button>

        {/* Hero Card Banner */}
        <div className="relative rounded-3xl overflow-hidden bg-[#0c1017] border border-[#1d2638] shadow-2xl">
          <div className="h-64 sm:h-80 w-full relative">
            <img
              src={tournament.bannerImage || '/assets/aistudio/f455c630-cebe-4da1-8e64-ad18d396300f_73791cd5.png'}
              alt={tournament.name}
              className="w-full h-full object-cover object-center filter brightness-50"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c1017] via-[#0c1017]/60 to-transparent" />

            {/* Overlaid Badges */}
            <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-lg bg-[#07090e]/90 backdrop-blur-md text-xs font-mono border border-[#222e44]">
                {isOpen && <strong className="text-[#00ff66]">● Inscriptions ouvertes</strong>}
                {isOngoing && <strong className="text-amber-400">● Compétition en cours</strong>}
                {isCompleted && <span className="text-slate-400">✓ Tournoi clôturé & archivé</span>}
              </span>
              <span className="px-3 py-1 rounded-lg bg-[#07090e]/90 backdrop-blur-md text-xs font-mono text-slate-300 border border-[#222e44]">
                {tournament.gameVersion}
              </span>
              <span className="px-3 py-1 rounded-lg bg-[#07090e]/90 backdrop-blur-md text-xs font-mono text-slate-300 border border-[#222e44]">
                {tournament.platform}
              </span>
            </div>

            {/* Title & Key Info at Bottom of Banner */}
            <div className="absolute bottom-6 left-6 right-6 space-y-2">
              <h1 className="font-display text-3xl sm:text-5xl font-black text-white uppercase tracking-tight leading-tight">
                {tournament.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 font-mono">
                <span className="flex items-center gap-1.5 text-white">
                  <Calendar className="w-4 h-4 text-[#00ff66]" />
                  <span>{formatDateFrench(tournament.startDate)} à {tournament.time}</span>
                </span>
                <span className="flex items-center gap-1.5 text-yellow-400 font-semibold">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  <span>{tournament.prizePool}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Bar Under Banner */}
          <div className="p-6 bg-[#0e131d] border-t border-[#1a2333] flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-6 text-xs text-slate-300">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-mono">Frais d'inscription</span>
                <span className="font-bold text-white text-sm">
                  {formatMAD(tournament.entryFeeMAD)}
                </span>
              </div>
              <div className="h-8 w-px bg-[#1e2738] hidden sm:block" />
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-mono">Places restantes</span>
                <span className="font-bold text-white text-sm">
                  {isOpen ? (
                    placesRemaining > 0 ? (
                      <span className="text-[#00ff66]">{placesRemaining} places restantes</span>
                    ) : (
                      <span className="text-amber-400">Complet</span>
                    )
                  ) : (
                    <span>{placesRemaining > 0 ? `${placesRemaining} places restantes` : 'Complet'}</span>
                  )}
                </span>
              </div>
              <div className="h-8 w-px bg-[#1e2738] hidden sm:block" />
              <div className="hidden sm:block">
                <span className="text-slate-500 block text-[10px] uppercase font-mono">Format</span>
                <span className="font-semibold text-slate-300 text-xs">
                  {tournament.format === 'aller_retour'
                    ? 'Aller-Retour'
                    : tournament.format === 'groups_playoffs'
                    ? 'Poules + Finales'
                    : 'Élimination Directe'}
                </span>
              </div>
            </div>

            {/* Inscription Action */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              {isOpen ? (
                isUserRegistered ? (
                  <div className="flex items-center gap-3">
                    {userRegistration?.status === 'confirmed' ? (
                      <span className="text-xs text-[#00ff66] flex items-center gap-1.5 font-semibold bg-[#00ff66]/10 px-3 py-1.5 rounded-xl border border-[#00ff66]/30">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Inscrit #{userRegistration?.seed || 1} (Confirmé)</span>
                      </span>
                    ) : userRegistration?.status === 'pending' ? (
                      <span className="text-xs text-amber-300 flex items-center gap-1.5 font-semibold bg-amber-400/10 px-3 py-1.5 rounded-xl border border-amber-400/30">
                        <Clock className="w-4 h-4 text-amber-400" />
                        <span>Inscription en cours de validation</span>
                      </span>
                    ) : (
                      <span className="text-xs text-rose-300 flex items-center gap-1.5 font-semibold bg-rose-500/10 px-3 py-1.5 rounded-xl border border-rose-500/30">
                        <span>Inscription refusée</span>
                      </span>
                    )}
                    <button
                      onClick={handleUnregister}
                      disabled={actionLoading}
                      className="text-xs text-rose-400 hover:text-rose-300 hover:underline cursor-pointer"
                    >
                      Annuler
                    </button>
                  </div>
                ) : placesRemaining > 0 ? (
                  <button
                    onClick={handleStartRegistration}
                    className="px-6 py-2.5 rounded-xl bg-[#00ff66] text-black font-display text-base font-bold uppercase tracking-wider hover:bg-[#00e65c] transition-all duration-200 shadow-[0_0_20px_rgba(0,255,102,0.4)] cursor-pointer"
                  >
                    S’inscrire au tournoi
                  </button>
                ) : (
                  <span className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 text-xs font-semibold">
                    Tournoi complet
                  </span>
                )
              ) : isOngoing ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-amber-400 font-semibold flex items-center gap-1.5 bg-amber-400/10 px-3 py-2 rounded-xl border border-amber-400/30">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Compétition en cours</span>
                  </span>
                  {isUserRegistered && (
                    <span className="text-xs text-[#00ff66] bg-[#00ff66]/10 px-3 py-2 rounded-xl border border-[#00ff66]/30">
                      En lice #{userRegistration?.seed || 1}
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl">
                    Tournoi clôturé & archivé
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action feedback message */}
        {actionMessage && (
          <div
            className={`p-4 rounded-xl text-xs flex items-center gap-2 border ${
              actionMessage.type === 'success'
                ? 'bg-[#00ff66]/10 border-[#00ff66]/30 text-[#00ff66]'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
        )}

        {/* Tab Navigation Controls */}
        {(() => {
          const isLeagueFormat =
            tournament.format === 'aller_retour' ||
            tournament.format === 'championship' ||
            tournament.name.toLowerCase().includes('championnat');

          const tabs = isLeagueFormat
            ? [
                { id: 'standings', label: 'Classement', icon: Trophy },
                { id: 'matches', label: `Calendrier des Journées (${matchesList.length})`, icon: Calendar },
                { id: 'overview', label: 'Règlement & Modalités', icon: FileText },
              ]
            : [
                { id: 'overview', label: 'Vue d’ensemble & Règlement', icon: FileText },
                { id: 'matches', label: 'Calendrier des rencontres', icon: Calendar },
              ];

          return (
            <div className="flex items-center gap-2 border-b border-[#1b2333] pb-1 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-[#00ff66] text-black shadow-[0_0_15px_rgba(0,255,102,0.3)]'
                        : 'text-slate-400 hover:text-white hover:bg-[#121722]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          );
        })()}

        {/* TAB 0: LALIGA STANDINGS (For Championship format) */}
        {activeTab === 'standings' && (
          <LeagueStandingsTable
            matches={matchesList}
            registrations={registrationsList}
            tournamentName={tournament.name}
          />
        )}

        {/* TAB 1: OVERVIEW & RULES */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="p-6 rounded-2xl bg-[#0c1017] border border-[#1b2435] space-y-4">
                <h3 className="font-display text-2xl font-bold text-white uppercase tracking-wide">
                  Présentation de la compétition
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                  {tournament.description}
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#0c1017] border border-[#1b2435] space-y-6">
                <div className="flex items-center gap-2 pb-3 border-b border-[#182130]">
                  <ShieldCheck className="w-5 h-5 text-[#00ff66]" />
                  <h3 className="font-display text-2xl font-bold text-white uppercase tracking-wide">
                    Règlement officiel des compétitions
                  </h3>
                </div>
                <OfficialRulesSection compact />
              </div>
            </div>

            {/* Sidebar Details */}
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-[#0c1017] border border-[#1b2435] space-y-4 text-xs">
                <h4 className="font-display text-lg font-bold text-white uppercase tracking-wider">
                  Modalités d'organisation
                </h4>
                <div className="space-y-3 font-mono text-slate-400">
                  <div className="flex justify-between py-1 border-b border-[#182130]">
                    <span>Format</span>
                    <span className="text-white font-semibold">
                      {tournament.format === 'groups_playoffs'
                        ? 'Poules + Finales'
                        : tournament.format === 'championship'
                        ? 'Championnat'
                        : tournament.format === 'aller_retour'
                        ? 'Aller-Retour'
                        : 'Élimination Directe'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#182130]">
                    <span>Plateforme</span>
                    <span className="text-white">{tournament.platform}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#182130]">
                    <span>Heure convocation</span>
                    <span className="text-[#00ff66] font-bold">{tournament.time}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#182130]">
                    <span>Version du jeu</span>
                    <span className="text-white truncate">{tournament.gameVersion}</span>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#0c1017] border border-[#1b2435] space-y-3">
                <h4 className="font-display text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2 text-yellow-400">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  <span>Dotation & Récompenses</span>
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                  {tournament.prizePool}
                </p>
                <p className="text-[11px] text-slate-500">
                  Remise des prix et trophées en mains propres immédiatement après la finale.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CALENDRIER DES RENCONTRES / JOURNÉES */}
        {activeTab === 'matches' && (
          tournament.format === 'aller_retour' ||
          tournament.format === 'championship' ||
          tournament.name.toLowerCase().includes('championnat') ? (
            <LeagueSchedule
              matches={matchesList}
              registrations={registrationsList}
              isAdmin={user?.role === 'admin'}
              onSelectMatchForScore={(m) => setScoreModalMatch(m)}
            />
          ) : (
            <div className="space-y-4">
              <h3 className="font-display text-2xl font-bold text-white uppercase pb-2 border-b border-[#1b2333]">
                Calendrier des rencontres
              </h3>

              {matchesList.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-[#0c1017] border border-[#1b2333] text-slate-400 text-xs">
                  Les rencontres seront générées par l'arbitre une fois les inscriptions clôturées.
                </div>
              ) : (
                <div className="space-y-3">
                  {matchesList.map((m) => (
                    <div
                      key={m.id}
                      className="p-4 rounded-xl bg-[#0c1017] border border-[#1c2535] flex flex-col sm:flex-row items-center justify-between gap-4"
                    >
                      <div className="text-xs font-mono text-slate-400 sm:w-44 text-center sm:text-left">
                        <span className="block font-semibold text-white">{m.stageName}</span>
                        <span>{m.scheduledDate} · {m.scheduledTime}</span>
                      </div>

                      <div className="flex items-center gap-4 text-xs sm:text-sm">
                        <span className={`font-semibold text-right w-28 sm:w-36 truncate ${m.winnerId === m.player1Id ? 'text-[#00ff66]' : 'text-slate-200'}`}>
                          {m.player1Gamertag}
                        </span>
                        <div className="px-3.5 py-1 rounded-lg bg-[#141b27] border border-[#242f44] font-mono font-bold text-white tabular-nums text-xs">
                          {m.player1Score !== null ? `${m.player1Score} - ${m.player2Score}` : 'VS'}
                        </div>
                        <span className={`font-semibold text-left w-28 sm:w-36 truncate ${m.winnerId === m.player2Id ? 'text-[#00ff66]' : 'text-slate-200'}`}>
                          {m.player2Gamertag}
                        </span>
                      </div>

                      <div className="text-right sm:w-32">
                        {m.status === 'completed' ? (
                          <span className="text-xs font-mono text-[#00ff66] flex items-center justify-center sm:justify-end gap-1 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Homologué</span>
                          </span>
                        ) : (
                          <span className="text-xs font-mono text-slate-400 flex items-center justify-center sm:justify-end gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Programmé</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        )}
      </div>

      {/* Registration Modal */}
      {showRegistrationModal && (
        <RegistrationModal
          tournament={tournament}
          user={user}
          token={token}
          onClose={() => setShowRegistrationModal(false)}
          onSuccess={async () => {
            await fetchDetail();
          }}
          onNavigateToDashboard={() => onNavigate('dashboard')}
        />
      )}

      {/* Admin Score Modal */}
      {scoreModalMatch && (
        <ScoreModal
          match={scoreModalMatch}
          token={token}
          onClose={() => setScoreModalMatch(null)}
          onSuccess={() => {
            fetchDetail();
          }}
        />
      )}
    </div>
  );
};
