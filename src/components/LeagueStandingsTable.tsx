import React, { useState, useMemo } from 'react';
import type { Match, Registration } from '../types/index.ts';
import { Trophy, TrendingUp, Search, Award, Shield, ChevronRight, Check, Minus, X } from 'lucide-react';

interface LeagueStandingsTableProps {
  matches: Match[];
  registrations: Registration[];
  tournamentName?: string;
  onSelectPlayer?: (gamertag: string) => void;
}

export interface PlayerStanding {
  rank: number;
  userId: string;
  gamertag: string;
  playerName: string;
  teamSelected?: string;
  avatarUrl?: string;
  played: number; // MJ
  won: number;    // G
  drawn: number;  // N
  lost: number;   // P
  goalsFor: number;     // BP
  goalsAgainst: number; // BC
  goalDiff: number;     // DIFF
  points: number;       // PTS
  form: ('W' | 'D' | 'L')[]; // 5 derniers matchs
  formDetails: { opponent: string; score: string; result: 'W' | 'D' | 'L' }[];
}

export const LeagueStandingsTable: React.FC<LeagueStandingsTableProps> = ({
  matches,
  registrations,
  tournamentName = 'Championnat',
  onSelectPlayer,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Compute live standings from matches and confirmed registrations
  const standings = useMemo<PlayerStanding[]>(() => {
    // Collect all players (from registrations or matches)
    const playerMap = new Map<
      string,
      {
        userId: string;
        gamertag: string;
        playerName: string;
        teamSelected?: string;
      }
    >();

    registrations
      .filter((r) => r.status === 'confirmed')
      .forEach((r) => {
        playerMap.set(r.gamertag, {
          userId: r.userId,
          gamertag: r.gamertag,
          playerName: r.playerName,
          teamSelected: r.teamSelected,
        });
      });

    // Also scan matches for any participants
    matches.forEach((m) => {
      if (m.player1Gamertag && !playerMap.has(m.player1Gamertag) && !m.player1Gamertag.includes('Vainqueur') && !m.player1Gamertag.includes('En attente')) {
        playerMap.set(m.player1Gamertag, {
          userId: m.player1Id || m.player1Gamertag,
          gamertag: m.player1Gamertag,
          playerName: m.player1Gamertag,
        });
      }
      if (m.player2Gamertag && !playerMap.has(m.player2Gamertag) && !m.player2Gamertag.includes('Vainqueur') && !m.player2Gamertag.includes('En attente')) {
        playerMap.set(m.player2Gamertag, {
          userId: m.player2Id || m.player2Gamertag,
          gamertag: m.player2Gamertag,
          playerName: m.player2Gamertag,
        });
      }
    });

    const statsMap = new Map<
      string,
      {
        played: number;
        won: number;
        drawn: number;
        lost: number;
        goalsFor: number;
        goalsAgainst: number;
        points: number;
        matchHistory: { opponent: string; score: string; result: 'W' | 'D' | 'L'; date: string }[];
      }
    >();

    // Initialize stats
    playerMap.forEach((_, gamertag) => {
      statsMap.set(gamertag, {
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0,
        matchHistory: [],
      });
    });

    // Sort completed matches by date/round for accurate form guide
    const completedMatches = matches
      .filter((m) => m.status === 'completed' && m.player1Score !== null && m.player2Score !== null)
      .sort((a, b) => {
        const roundDiff = (a.round || 0) - (b.round || 0);
        if (roundDiff !== 0) return roundDiff;
        return (a.scheduledDate || '').localeCompare(b.scheduledDate || '');
      });

    completedMatches.forEach((m) => {
      const p1 = m.player1Gamertag;
      const p2 = m.player2Gamertag;
      const s1 = m.player1Score ?? 0;
      const s2 = m.player2Score ?? 0;

      const p1Stats = statsMap.get(p1);
      const p2Stats = statsMap.get(p2);

      if (p1Stats) {
        p1Stats.played += 1;
        p1Stats.goalsFor += s1;
        p1Stats.goalsAgainst += s2;

        if (s1 > s2) {
          p1Stats.won += 1;
          p1Stats.points += 3;
          p1Stats.matchHistory.push({ opponent: p2, score: `${s1}-${s2}`, result: 'W', date: m.scheduledDate });
        } else if (s1 === s2) {
          p1Stats.drawn += 1;
          p1Stats.points += 1;
          p1Stats.matchHistory.push({ opponent: p2, score: `${s1}-${s2}`, result: 'D', date: m.scheduledDate });
        } else {
          p1Stats.lost += 1;
          p1Stats.matchHistory.push({ opponent: p2, score: `${s1}-${s2}`, result: 'L', date: m.scheduledDate });
        }
      }

      if (p2Stats) {
        p2Stats.played += 1;
        p2Stats.goalsFor += s2;
        p2Stats.goalsAgainst += s1;

        if (s2 > s1) {
          p2Stats.won += 1;
          p2Stats.points += 3;
          p2Stats.matchHistory.push({ opponent: p1, score: `${s2}-${s1}`, result: 'W', date: m.scheduledDate });
        } else if (s1 === s2) {
          p2Stats.drawn += 1;
          p2Stats.points += 1;
          p2Stats.matchHistory.push({ opponent: p1, score: `${s2}-${s1}`, result: 'D', date: m.scheduledDate });
        } else {
          p2Stats.lost += 1;
          p2Stats.matchHistory.push({ opponent: p1, score: `${s2}-${s1}`, result: 'L', date: m.scheduledDate });
        }
      }
    });

    // Build raw list
    const list: PlayerStanding[] = [];
    playerMap.forEach((info, gamertag) => {
      const stats = statsMap.get(gamertag)!;
      const goalDiff = stats.goalsFor - stats.goalsAgainst;
      // Take last 5 matches for form
      const recent = stats.matchHistory.slice(-5);
      const form = recent.map((r) => r.result);
      list.push({
        rank: 0,
        userId: info.userId,
        gamertag: info.gamertag,
        playerName: info.playerName,
        teamSelected: info.teamSelected,
        played: stats.played,
        won: stats.won,
        drawn: stats.drawn,
        lost: stats.lost,
        goalsFor: stats.goalsFor,
        goalsAgainst: stats.goalsAgainst,
        goalDiff,
        points: stats.points,
        form,
        formDetails: recent,
      });
    });

    // Sort LaLiga style:
    // 1. Points DESC
    // 2. Goal Difference DESC
    // 3. Goals For DESC
    // 4. Matches won DESC
    // 5. Gamertag ASC
    list.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      if (b.won !== a.won) return b.won - a.won;
      return a.gamertag.localeCompare(b.gamertag);
    });

    // Assign rank
    return list.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
  }, [matches, registrations]);

  const filteredStandings = useMemo(() => {
    if (!searchTerm.trim()) return standings;
    const q = searchTerm.toLowerCase();
    return standings.filter(
      (s) =>
        s.gamertag.toLowerCase().includes(q) ||
        s.playerName.toLowerCase().includes(q) ||
        (s.teamSelected && s.teamSelected.toLowerCase().includes(q))
    );
  }, [standings, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header Banner - LaLiga Style */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#0d121c] via-[#101726] to-[#0d121c] border border-[#1e2738] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00ff66]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#00ff66] uppercase tracking-wider mb-1">
              <Shield className="w-4 h-4 text-[#00ff66]" />
              <span>CLASSEMENT OFFICIEL · FORMAT CHAMPIONNAT</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-black text-white uppercase tracking-wide flex items-center gap-3">
              <span>Classement</span>
              <span className="text-xs font-mono font-normal px-2.5 py-1 rounded-full bg-[#172030] text-[#00ff66] border border-[#22314a]">
                Saison 2026/2027
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Victoire = 3 pts · Nul = 1 pt · Défaite = 0 pt. Départage par différence de buts et meilleure attaque.
            </p>
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher un joueur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-[#090d14] border border-[#222e44] text-white placeholder-slate-500 focus:outline-none focus:border-[#00ff66]"
            />
          </div>
        </div>

        {/* Qualification Zones Legend */}
        <div className="mt-5 pt-4 border-t border-[#182233] flex flex-wrap items-center gap-4 text-[11px] font-mono text-slate-300">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-[#00ff66] shadow-[0_0_8px_rgba(0,255,102,0.8)] inline-block" />
            <span className="font-semibold text-white">1er : Champion FC TOURNAMENT</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-cyan-400 inline-block" />
            <span>2e - 3e : Podium d'Honneur</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-amber-400 inline-block" />
            <span>4e : Barrages Play-offs</span>
          </div>
          <div className="flex items-center gap-2 ml-auto text-slate-400">
            <span>{standings.length} Joueurs en lice</span>
          </div>
        </div>
      </div>

      {/* Standings Table Card */}
      <div className="rounded-3xl bg-[#0c1017] border border-[#1b2538] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#101622] border-b border-[#1b2538] text-[11px] font-mono uppercase tracking-wider text-slate-400">
                <th className="py-3.5 pl-4 sm:pl-6 pr-2 text-center w-14">POS</th>
                <th className="py-3.5 px-3">JOUEUR / CLUB</th>
                <th className="py-3.5 px-3 text-center font-bold text-white bg-[#151c2b] w-16">PTS</th>
                <th className="py-3.5 px-3 text-center w-12" title="Matchs Joués">MJ</th>
                <th className="py-3.5 px-3 text-center w-12 text-[#00ff66]" title="Gagnés">G</th>
                <th className="py-3.5 px-3 text-center w-12 text-slate-300" title="Nuls">N</th>
                <th className="py-3.5 px-3 text-center w-12 text-rose-400" title="Perdus">P</th>
                <th className="py-3.5 px-3 text-center w-12 hidden md:table-cell" title="Buts Pour">BP</th>
                <th className="py-3.5 px-3 text-center w-12 hidden md:table-cell" title="Buts Contre">BC</th>
                <th className="py-3.5 px-3 text-center w-14 font-semibold" title="Différence de buts">DIFF</th>
                <th className="py-3.5 px-4 text-center w-36 hidden sm:table-cell">5 DERNIERS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#151d2c] text-xs">
              {filteredStandings.map((s) => {
                const isChampion = s.rank === 1;
                const isPodium = s.rank === 2 || s.rank === 3;
                const isPlayoff = s.rank === 4;

                return (
                  <tr
                    key={s.gamertag}
                    onClick={() => onSelectPlayer && onSelectPlayer(s.gamertag)}
                    className={`transition-colors hover:bg-[#121927] group ${
                      isChampion ? 'bg-[#00ff66]/[0.03]' : ''
                    }`}
                  >
                    {/* Rank with Zone Indicator */}
                    <td className="py-3 pl-4 sm:pl-6 pr-2 text-center relative font-mono font-bold">
                      <div className="flex items-center justify-center gap-1.5">
                        <span
                          className={`w-1.5 h-6 rounded-full absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 ${
                            isChampion
                              ? 'bg-[#00ff66] shadow-[0_0_8px_rgba(0,255,102,0.8)]'
                              : isPodium
                              ? 'bg-cyan-400'
                              : isPlayoff
                              ? 'bg-amber-400'
                              : 'bg-transparent'
                          }`}
                        />
                        <span
                          className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs ${
                            isChampion
                              ? 'bg-[#00ff66] text-black font-black shadow-[0_0_12px_rgba(0,255,102,0.4)]'
                              : isPodium
                              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                              : isPlayoff
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              : 'text-slate-400 font-medium'
                          }`}
                        >
                          {s.rank}
                        </span>
                      </div>
                    </td>

                    {/* Player Info */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#151d2b] border border-[#232f45] flex items-center justify-center text-xs font-bold text-[#00ff66] shrink-0">
                          {s.gamertag.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="truncate">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white group-hover:text-[#00ff66] transition-colors truncate">
                              {s.gamertag}
                            </span>
                            {isChampion && (
                              <Trophy className="w-3.5 h-3.5 text-yellow-400 shrink-0 inline" />
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 block truncate">
                            {s.playerName} {s.teamSelected ? `· ${s.teamSelected}` : ''}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Points (Highlighted column) */}
                    <td className="py-3 px-3 text-center bg-[#151c2b]/70 font-mono font-black text-sm text-[#00ff66] tabular-nums">
                      {s.points}
                    </td>

                    {/* Played */}
                    <td className="py-3 px-3 text-center font-mono text-slate-300 tabular-nums">
                      {s.played}
                    </td>

                    {/* Won */}
                    <td className="py-3 px-3 text-center font-mono font-bold text-[#00ff66] tabular-nums">
                      {s.won}
                    </td>

                    {/* Drawn */}
                    <td className="py-3 px-3 text-center font-mono text-slate-400 tabular-nums">
                      {s.drawn}
                    </td>

                    {/* Lost */}
                    <td className="py-3 px-3 text-center font-mono text-rose-400 tabular-nums">
                      {s.lost}
                    </td>

                    {/* Goals For */}
                    <td className="py-3 px-3 text-center font-mono text-slate-300 tabular-nums hidden md:table-cell">
                      {s.goalsFor}
                    </td>

                    {/* Goals Against */}
                    <td className="py-3 px-3 text-center font-mono text-slate-400 tabular-nums hidden md:table-cell">
                      {s.goalsAgainst}
                    </td>

                    {/* Goal Difference */}
                    <td className="py-3 px-3 text-center font-mono font-bold tabular-nums">
                      <span
                        className={
                          s.goalDiff > 0
                            ? 'text-[#00ff66]'
                            : s.goalDiff < 0
                            ? 'text-rose-400'
                            : 'text-slate-400'
                        }
                      >
                        {s.goalDiff > 0 ? `+${s.goalDiff}` : s.goalDiff}
                      </span>
                    </td>

                    {/* Form Guide - Last 5 matches (LaLiga badge style) */}
                    <td className="py-3 px-4 text-center hidden sm:table-cell">
                      {s.form.length === 0 ? (
                        <span className="text-[10px] text-slate-500 font-mono">En attente</span>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          {s.form.map((res, idx) => {
                            const detail = s.formDetails[idx];
                            return (
                              <div
                                key={idx}
                                title={detail ? `${res === 'W' ? 'Victoire' : res === 'D' ? 'Match nul' : 'Défaite'} vs ${detail.opponent} (${detail.score})` : ''}
                                className={`w-5 h-5 rounded-md flex items-center justify-center font-mono font-bold text-[10px] shadow-sm cursor-help ${
                                  res === 'W'
                                    ? 'bg-[#00ff66] text-black font-black'
                                    : res === 'D'
                                    ? 'bg-amber-400 text-black'
                                    : 'bg-rose-500 text-white'
                                }`}
                              >
                                {res === 'W' ? 'V' : res === 'D' ? 'N' : 'D'}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
