import React, { useState, useMemo } from 'react';
import type { Match, Registration } from '../types/index.ts';
import { Calendar, Clock, CheckCircle2, Trophy, Search, Shield } from 'lucide-react';

interface LeagueScheduleProps {
  matches: Match[];
  registrations?: Registration[];
  tournamentName?: string;
  isAdmin?: boolean;
  onSelectMatchForScore?: (match: Match) => void;
}

export const LeagueSchedule: React.FC<LeagueScheduleProps> = ({
  matches,
  registrations = [],
  tournamentName,
  isAdmin,
  onSelectMatchForScore,
}) => {
  // Extract all distinct stages / Journées
  const stages = useMemo(() => {
    const stageMap = new Map<number, { round: number; name: string; shortLabel: string }>();
    matches.forEach((m) => {
      const roundNum = m.round || 1;
      if (!stageMap.has(roundNum)) {
        let name = m.stageName || `Journée ${roundNum}`;
        let shortLabel = `J${roundNum}`;

        const lowerStage = `${m.stage || ''} ${m.stageName || ''}`.toLowerCase();
        if (lowerStage.includes('quart')) {
          name = 'Quarts de Finale';
          shortLabel = 'Quarts';
        } else if (lowerStage.includes('demi')) {
          name = 'Demi-Finales';
          shortLabel = 'Demis';
        } else if (lowerStage.includes('finale') || lowerStage.includes('final')) {
          name = 'Grande Finale';
          shortLabel = 'Finale';
        }

        stageMap.set(roundNum, { round: roundNum, name, shortLabel });
      }
    });

    const list = Array.from(stageMap.values());
    list.sort((a, b) => a.round - b.round);
    return list;
  }, [matches]);

  const [activeRound, setActiveRound] = useState<number | 'all'>(() => {
    // Default to the first round with pending matches, or round 1, or 'all'
    const uncompleted = matches.find((m) => m.status !== 'completed');
    return uncompleted?.round || (matches.length > 0 ? (matches[0].round || 1) : 'all');
  });

  const [playerFilter, setPlayerFilter] = useState('');

  // Filtered matches
  const filteredMatches = useMemo(() => {
    let list = [...matches];

    if (activeRound !== 'all') {
      list = list.filter((m) => (m.round || 1) === activeRound);
    }

    if (playerFilter.trim()) {
      const q = playerFilter.toLowerCase();
      list = list.filter(
        (m) =>
          m.player1Gamertag.toLowerCase().includes(q) ||
          m.player2Gamertag.toLowerCase().includes(q)
      );
    }

    // Sort by round, then matchNumber
    list.sort((a, b) => {
      if ((a.round || 0) !== (b.round || 0)) return (a.round || 0) - (b.round || 0);
      return (a.matchNumber || 0) - (b.matchNumber || 0);
    });

    return list;
  }, [matches, activeRound, playerFilter]);

  // Stats for the active filter
  const currentStats = useMemo(() => {
    const current = activeRound === 'all' ? matches : matches.filter((m) => (m.round || 1) === activeRound);
    const total = current.length;
    const completed = current.filter((m) => m.status === 'completed').length;
    const scheduled = total - completed;
    return { total, completed, scheduled };
  }, [matches, activeRound]);

  const activeStage = stages.find((s) => s.round === activeRound);

  return (
    <div className="space-y-6">
      {/* Header Banner - FCT Matchdays */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#0d121c] via-[#101726] to-[#0d121c] border border-[#1e2738] shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#00ff66] uppercase tracking-wider mb-1">
              <Calendar className="w-4 h-4 text-[#00ff66]" />
              <span>FCT · CALENDRIER OFFICIEL DES RENCONTRES</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-black text-white uppercase tracking-wide flex items-center gap-3">
              <span>{tournamentName ? `Calendrier · ${tournamentName}` : 'Calendrier des Matchs'}</span>
              <span className="text-xs font-mono font-normal px-2.5 py-1 rounded-full bg-[#172030] text-slate-300 border border-[#22314a]">
                {matches.length} Matchs
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Suivez l'intégralité des duels face à face avec scores certifiés et homologations en direct.
            </p>
          </div>

          {/* Search by player */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filtrer par joueur..."
              value={playerFilter}
              onChange={(e) => setPlayerFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-[#090d14] border border-[#222e44] text-white placeholder-slate-500 focus:outline-none focus:border-[#00ff66]"
            />
          </div>
        </div>

        {/* Stage / Journée Selector Bar */}
        <div className="mt-6 pt-4 border-t border-[#182233] flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          <button
            onClick={() => setActiveRound('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeRound === 'all'
                ? 'bg-[#00ff66] text-black shadow-[0_0_12px_rgba(0,255,102,0.3)]'
                : 'bg-[#121824] text-slate-400 hover:text-white hover:bg-[#1a2333] border border-[#1f293b]'
            }`}
          >
            Tous les Matchs
          </button>

          {stages.map((st) => {
            const stMatches = matches.filter((m) => (m.round || 1) === st.round);
            const isCompleted = stMatches.length > 0 && stMatches.every((m) => m.status === 'completed');
            const isActive = activeRound === st.round;

            return (
              <button
                key={st.round}
                onClick={() => setActiveRound(st.round)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#00ff66] text-black shadow-[0_0_12px_rgba(0,255,102,0.3)]'
                    : 'bg-[#121824] text-slate-300 hover:text-white hover:bg-[#1a2333] border border-[#1f293b]'
                }`}
              >
                <span>{st.shortLabel}</span>
                {isCompleted && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isActive ? 'bg-black' : 'bg-[#00ff66]'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Journée Summary Banner */}
      <div className="flex items-center justify-between px-2 text-xs font-mono text-slate-400">
        <div>
          Affichage :{' '}
          <strong className="text-white">
            {activeRound === 'all' ? 'Toutes les rencontres' : activeStage?.name || `Étape ${activeRound}`}
          </strong>{' '}
          ({filteredMatches.length} match{filteredMatches.length > 1 ? 's' : ''})
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[#00ff66]">
            ● {currentStats.completed} terminé{currentStats.completed > 1 ? 's' : ''}
          </span>
          <span className="text-slate-400">
            ○ {currentStats.scheduled} à venir
          </span>
        </div>
      </div>

      {/* Match Cards List */}
      {filteredMatches.length === 0 ? (
        <div className="p-16 text-center rounded-3xl bg-[#0c1017] border border-[#1b2538] text-slate-400 text-xs space-y-2">
          <Calendar className="w-8 h-8 mx-auto text-slate-600" />
          <p className="text-white font-semibold">Aucun match trouvé pour ce filtre</p>
          <p className="text-slate-500">
            Modifiez l'étape sélectionnée ou réinitialisez le filtre de recherche de joueur.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredMatches.map((m) => {
            const isCompleted = m.status === 'completed' && m.player1Score !== null && m.player2Score !== null;
            const isLive = m.status === 'live';
            const s1 = m.player1Score;
            const s2 = m.player2Score;
            const p1Won = isCompleted && s1! > s2!;
            const p2Won = isCompleted && s2! > s1!;
            const isDraw = isCompleted && s1! === s2!;

            return (
              <div
                key={m.id}
                className="p-5 rounded-2xl bg-[#0c1017] border border-[#1b2538] hover:border-[#2a374d] transition-all duration-200 shadow-xl flex flex-col justify-between gap-4"
              >
                {/* Card Top: Stage name & Date */}
                <div className="flex items-center justify-between text-xs border-b border-[#161f2e] pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white bg-[#151c2b] px-2.5 py-0.5 rounded-lg border border-[#222e42]">
                      {m.stageName}
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      Match #{m.matchNumber || 1}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-300">
                      {m.scheduledDate} · {m.scheduledTime || '15:00'}
                    </span>
                  </div>
                </div>

                {/* Card Middle: Head to Head Display (Face to Face Style) */}
                <div className="flex items-center justify-between gap-3 py-1">
                  {/* Player 1 */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[#151c2b] border border-[#232f45] flex items-center justify-center font-bold text-xs text-[#00ff66] shrink-0">
                      {m.player1Gamertag.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-bold text-sm truncate ${
                            p1Won ? 'text-[#00ff66]' : 'text-white'
                          }`}
                        >
                          {m.player1Gamertag}
                        </span>
                        {p1Won && <Trophy className="w-3.5 h-3.5 text-[#00ff66] shrink-0" />}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        Joueur 1
                      </span>
                    </div>
                  </div>

                  {/* Score or VS Badge */}
                  <div className="shrink-0 px-3 text-center">
                    {isCompleted ? (
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono text-xl sm:text-2xl font-black tabular-nums px-3 py-1 rounded-xl border ${
                            p1Won
                              ? 'bg-[#00ff66]/15 border-[#00ff66]/40 text-[#00ff66]'
                              : isDraw
                              ? 'bg-amber-400/10 border-amber-400/30 text-amber-300'
                              : 'bg-[#151c2b] border-[#222e42] text-slate-300'
                          }`}
                        >
                          {s1}
                        </span>
                        <span className="font-mono text-slate-500 font-bold">:</span>
                        <span
                          className={`font-mono text-xl sm:text-2xl font-black tabular-nums px-3 py-1 rounded-xl border ${
                            p2Won
                              ? 'bg-[#00ff66]/15 border-[#00ff66]/40 text-[#00ff66]'
                              : isDraw
                              ? 'bg-amber-400/10 border-amber-400/30 text-amber-300'
                              : 'bg-[#151c2b] border-[#222e42] text-slate-300'
                          }`}
                        >
                          {s2}
                        </span>
                      </div>
                    ) : isLive ? (
                      <span className="px-3 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 font-mono font-bold text-xs flex items-center gap-1.5 animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                        EN DIRECT
                      </span>
                    ) : (
                      <div className="px-3.5 py-1.5 rounded-xl bg-[#121824] border border-[#222e42] font-mono text-xs font-bold text-slate-400">
                        VS
                      </div>
                    )}
                  </div>

                  {/* Player 2 */}
                  <div className="flex items-center justify-end gap-3 flex-1 min-w-0 text-right">
                    <div className="truncate">
                      <div className="flex items-center justify-end gap-1.5">
                        {p2Won && <Trophy className="w-3.5 h-3.5 text-[#00ff66] shrink-0" />}
                        <span
                          className={`font-bold text-sm truncate ${
                            p2Won ? 'text-[#00ff66]' : 'text-white'
                          }`}
                        >
                          {m.player2Gamertag}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        Joueur 2
                      </span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-[#151c2b] border border-[#232f45] flex items-center justify-center font-bold text-xs text-cyan-400 shrink-0">
                      {m.player2Gamertag.substring(0, 2).toUpperCase()}
                    </div>
                  </div>
                </div>

                {/* Card Bottom: Status & Admin Action */}
                <div className="flex items-center justify-between text-xs pt-2.5 border-t border-[#161f2e]">
                  <div>
                    {isCompleted ? (
                      <span className="text-[11px] font-mono text-[#00ff66] flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Score officiel homologué</span>
                      </span>
                    ) : isLive ? (
                      <span className="text-[11px] font-mono text-rose-400 flex items-center gap-1 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping inline-block" />
                        <span>Rencontre en cours</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>À venir · En attente</span>
                      </span>
                    )}
                  </div>

                  {isAdmin && onSelectMatchForScore && (
                    <button
                      onClick={() => onSelectMatchForScore(m)}
                      className="px-3 py-1.5 rounded-xl bg-[#141d2c] hover:bg-[#00ff66] hover:text-black border border-[#222e42] text-xs font-semibold text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      <Shield className="w-3 h-3" />
                      <span>{isCompleted ? 'Modifier le score' : 'Homologuer le score'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
