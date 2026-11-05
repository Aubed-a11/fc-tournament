import React, { useState, useMemo } from 'react';
import type { Match, Registration } from '../types/index.ts';
import { Grid, Trophy, CheckCircle2, Clock, Shield, Sparkles, Filter } from 'lucide-react';

interface LeagueCrossMatrixProps {
  matches: Match[];
  registrations: Registration[];
  isAdmin?: boolean;
  onSelectMatchForScore?: (match: Match) => void;
}

export const LeagueCrossMatrix: React.FC<LeagueCrossMatrixProps> = ({
  matches,
  registrations,
  isAdmin,
  onSelectMatchForScore,
}) => {
  const [selectedCellMatch, setSelectedCellMatch] = useState<Match | null>(null);

  // Extract confirmed players list
  const players = useMemo(() => {
    const list = registrations
      .filter((r) => r.status === 'confirmed')
      .map((r) => ({
        id: r.userId,
        gamertag: r.gamertag,
        playerName: r.playerName,
        seed: r.seed,
      }));

    if (list.length === 0) {
      // fallback from matches
      const gamertagSet = new Set<string>();
      matches.forEach((m) => {
        if (m.player1Gamertag && !m.player1Gamertag.includes('Vainqueur') && !m.player1Gamertag.includes('En attente')) {
          gamertagSet.add(m.player1Gamertag);
        }
        if (m.player2Gamertag && !m.player2Gamertag.includes('Vainqueur') && !m.player2Gamertag.includes('En attente')) {
          gamertagSet.add(m.player2Gamertag);
        }
      });
      return Array.from(gamertagSet).map((gt) => ({
        id: gt,
        gamertag: gt,
        playerName: gt,
      }));
    }

    return list;
  }, [registrations, matches]);

  // Lookup match by home player and away player
  const matchMatrix = useMemo(() => {
    const map = new Map<string, Match>();
    matches.forEach((m) => {
      if (m.player1Gamertag && m.player2Gamertag) {
        // key format: "HOME_TAG::AWAY_TAG"
        map.set(`${m.player1Gamertag}::${m.player2Gamertag}`, m);
      }
    });
    return map;
  }, [matches]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#0d121c] via-[#101726] to-[#0d121c] border border-[#1e2738] shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#00ff66] uppercase tracking-wider mb-1">
              <Grid className="w-4 h-4 text-[#00ff66]" />
              <span>TABLEAU CROISÉ OFFICIEL · TÊTE-À-TÊTE DIRECT</span>
            </div>
            <h2 className="font-display text-2xl font-black text-white uppercase tracking-wide">
              Matrice des Confrontations Directes
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Lignes = Joueur recevant à domicile · Colonnes = Joueur visiteur à l'extérieur. Cliquez sur un score pour voir les détails.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-3 py-1.5 rounded-xl bg-[#141d2c] border border-[#232f45] text-slate-300">
              {players.length} Joueurs · {matches.length} Rencontres
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 pt-3 border-t border-[#182233] flex flex-wrap items-center gap-4 text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-[#00ff66] inline-block" />
            <span className="text-slate-300">Victoire Domicile</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-amber-400 inline-block" />
            <span className="text-slate-300">Match Nul</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block" />
            <span className="text-slate-300">Victoire Visiteur</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-slate-700 inline-block" />
            <span>Match programmé</span>
          </div>
        </div>
      </div>

      {/* Grid Container */}
      <div className="rounded-3xl bg-[#0c1017] border border-[#1b2538] overflow-hidden shadow-2xl p-4 sm:p-6">
        <div className="overflow-x-auto pb-4">
          <table className="border-collapse text-xs">
            <thead>
              <tr>
                {/* Top Left Header Cell */}
                <th className="p-2 sm:p-3 bg-[#111724] border border-[#1c2638] text-[10px] font-mono text-slate-400 min-w-[140px] text-left">
                  <div className="flex justify-between items-center text-[9px] uppercase">
                    <span>Domicile ↓</span>
                    <span>Extérieur →</span>
                  </div>
                </th>
                {players.map((colPlayer) => (
                  <th
                    key={colPlayer.gamertag}
                    className="p-2 sm:p-3 bg-[#111724] border border-[#1c2638] text-[11px] font-bold text-center text-slate-300 min-w-[70px] sm:min-w-[80px]"
                    title={`${colPlayer.gamertag} (${colPlayer.playerName})`}
                  >
                    <div className="truncate max-w-[75px] mx-auto">
                      {colPlayer.gamertag}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {players.map((rowPlayer) => (
                <tr key={rowPlayer.gamertag} className="hover:bg-[#111827]/50 transition-colors">
                  {/* Home Player Label (Row) */}
                  <td className="p-2.5 sm:p-3 bg-[#101622] border border-[#1c2638] font-bold text-white min-w-[140px]">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-[#182233] border border-[#25334c] flex items-center justify-center text-[10px] text-[#00ff66] font-mono shrink-0">
                        {rowPlayer.gamertag.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="truncate max-w-[100px] text-xs font-bold text-slate-200">
                        {rowPlayer.gamertag}
                      </span>
                    </div>
                  </td>

                  {/* Matrix Cells */}
                  {players.map((colPlayer) => {
                    const isSelf = rowPlayer.gamertag === colPlayer.gamertag;

                    if (isSelf) {
                      return (
                        <td
                          key={colPlayer.gamertag}
                          className="p-2 sm:p-2.5 border border-[#1c2638] bg-[#07090e] text-center"
                        >
                          <div className="w-full h-8 flex items-center justify-center text-slate-800 font-mono text-xs select-none">
                            ✕
                          </div>
                        </td>
                      );
                    }

                    const match = matchMatrix.get(`${rowPlayer.gamertag}::${colPlayer.gamertag}`);

                    if (!match) {
                      return (
                        <td
                          key={colPlayer.gamertag}
                          className="p-2 sm:p-2.5 border border-[#1c2638] text-center text-slate-700 font-mono text-xs"
                        >
                          -
                        </td>
                      );
                    }

                    const isCompleted = match.status === 'completed' && match.player1Score !== null && match.player2Score !== null;
                    const homeScore = match.player1Score;
                    const awayScore = match.player2Score;
                    const isHomeWin = isCompleted && homeScore! > awayScore!;
                    const isDraw = isCompleted && homeScore! === awayScore!;
                    const isAwayWin = isCompleted && awayScore! > homeScore!;

                    return (
                      <td
                        key={colPlayer.gamertag}
                        onClick={() => setSelectedCellMatch(match)}
                        className={`p-1.5 sm:p-2 border border-[#1c2638] text-center cursor-pointer transition-all hover:scale-105 hover:z-10 relative ${
                          isHomeWin
                            ? 'bg-[#00ff66]/10 hover:bg-[#00ff66]/20'
                            : isDraw
                            ? 'bg-amber-400/10 hover:bg-amber-400/20'
                            : isAwayWin
                            ? 'bg-rose-500/10 hover:bg-rose-500/20'
                            : 'bg-[#101622] hover:bg-[#172030]'
                        }`}
                      >
                        {isCompleted ? (
                          <div
                            className={`font-mono font-black text-xs py-1 rounded ${
                              isHomeWin
                                ? 'text-[#00ff66]'
                                : isDraw
                                ? 'text-amber-400'
                                : 'text-rose-400'
                            }`}
                          >
                            {homeScore} - {awayScore}
                          </div>
                        ) : (
                          <div className="text-[10px] font-mono text-slate-500 py-1">
                            {match.scheduledTime || 'À venir'}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Popover / Modal for Clicked Cell */}
      {selectedCellMatch && (
        <div className="p-5 rounded-2xl bg-[#0e1420] border border-[#24334a] flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-[10px] font-mono text-[#00ff66] uppercase block font-semibold">
              {selectedCellMatch.stageName} · {selectedCellMatch.scheduledDate} · {selectedCellMatch.scheduledTime}
            </span>
            <div className="flex items-center gap-3 text-sm font-bold text-white">
              <span className="text-[#00ff66]">{selectedCellMatch.player1Gamertag}</span>
              <span className="px-2.5 py-0.5 rounded-lg bg-[#151d2c] font-mono text-white text-base">
                {selectedCellMatch.player1Score !== null
                  ? `${selectedCellMatch.player1Score} - ${selectedCellMatch.player2Score}`
                  : 'VS'}
              </span>
              <span className="text-white">{selectedCellMatch.player2Gamertag}</span>
            </div>
            <p className="text-xs text-slate-400">
              Statut :{' '}
              <span className="text-white font-semibold">
                {selectedCellMatch.status === 'completed' ? 'Homologué' : 'À jouer'}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && onSelectMatchForScore && (
              <button
                onClick={() => {
                  onSelectMatchForScore(selectedCellMatch);
                  setSelectedCellMatch(null);
                }}
                className="px-4 py-2 rounded-xl bg-[#00ff66] text-black font-bold text-xs hover:bg-[#00e65c] transition-colors cursor-pointer"
              >
                {selectedCellMatch.status === 'completed' ? 'Modifier le score' : 'Homologuer le score'}
              </button>
            )}
            <button
              onClick={() => setSelectedCellMatch(null)}
              className="px-3 py-2 rounded-xl bg-[#151d2c] text-slate-300 text-xs hover:text-white cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
