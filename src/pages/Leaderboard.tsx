import React, { useState, useEffect } from 'react';
import type { PlayerLeaderboard } from '../types/index.ts';
import { Trophy, Search, ShieldCheck, Award, X, User, Flame, ArrowRight } from 'lucide-react';

import { apiClient } from '../services/apiClient.ts';

interface LeaderboardProps {
  onNavigate: (page: string, param?: string) => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ onNavigate }) => {
  const [players, setPlayers] = useState<PlayerLeaderboard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerLeaderboard | null>(null);

  useEffect(() => {
    async function fetchRankings() {
      try {
        const data = await apiClient.getLeaderboard();
        setPlayers(data);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchRankings();
  }, []);

  const filteredPlayers = players.filter(
    (p) =>
      p.gamertag.toLowerCase().includes(search.toLowerCase()) ||
      p.playerName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#07090e] py-10 px-4 sm:px-6 lg:px-8 text-slate-200">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2 border-b border-[#182130] pb-6">
          <div className="flex items-center gap-2 text-xs font-mono text-[#00ff66] uppercase">
            <span>CLASSEMENT OFFICIEL DES JOUEURS</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-black text-white uppercase tracking-tight">
            Classement Général des Joueurs
          </h1>
          <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
            Consultez les statistiques certifiées, victoires et points de classement des compétiteurs engagés dans les tournois EA SPORTS FC.
          </p>
        </div>

        {/* Transparent Points System Banner */}
        <div className="p-4 rounded-2xl bg-[#0d121c] border border-[#1b2538] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-300">
            <ShieldCheck className="w-4 h-4 text-[#00ff66]" />
            <span className="font-bold text-white">Barème transparent des points :</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-slate-400 text-[11px]">
            <span>Victoire en match = <strong className="text-[#00ff66]">+3 pts</strong></span>
            <span>·</span>
            <span>Match nul = <strong className="text-slate-200">+1 pt</strong></span>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher un joueur par son pseudonyme..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-[#0d121c] border border-[#1e283b] text-white placeholder-slate-500 focus:outline-none focus:border-[#00ff66]"
          />
        </div>

        {/* Leaderboard Table */}
        {loading ? (
          <div className="h-64 rounded-2xl bg-[#0c1017] border border-[#1b2333] animate-pulse" />
        ) : filteredPlayers.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[#0c1017] border border-[#1b2333] text-slate-400 text-xs">
            Aucun joueur trouvé.
          </div>
        ) : (
          <div className="rounded-3xl bg-[#0b0f16] border border-[#1c2435] overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#101622] text-slate-400 uppercase font-mono text-[11px] border-b border-[#1b2333]">
                  <tr>
                    <th scope="col" className="px-5 py-3.5 text-center w-16">Rang</th>
                    <th scope="col" className="px-5 py-3.5">Joueur</th>
                    <th scope="col" className="px-5 py-3.5 text-center">Tournois</th>
                    <th scope="col" className="px-5 py-3.5 text-center">Matchs</th>
                    <th scope="col" className="px-5 py-3.5 text-center">V - D</th>
                    <th scope="col" className="px-5 py-3.5 text-right font-bold text-white">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#161f2c]">
                  {filteredPlayers.map((player) => {
                    const isTop1 = player.rank === 1;
                    const isTop2 = player.rank === 2;
                    const isTop3 = player.rank === 3;

                    return (
                      <tr
                        key={player.userId}
                        onClick={() => setSelectedPlayer(player)}
                        className={`hover:bg-[#111723] transition-colors cursor-pointer ${
                          isTop1 ? 'bg-yellow-500/5' : ''
                        }`}
                      >
                        {/* Rank */}
                        <td className="px-5 py-4 text-center">
                          <span
                            className={`font-display font-black text-sm tabular-nums ${
                              isTop1
                                ? 'text-yellow-400 text-lg'
                                : isTop2
                                ? 'text-slate-300'
                                : isTop3
                                ? 'text-amber-600'
                                : 'text-slate-500'
                            }`}
                          >
                            #{player.rank}
                          </span>
                        </td>

                        {/* Player */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#141b27] border border-[#222e42] flex items-center justify-center font-bold text-xs text-[#00ff66]">
                              {player.gamertag.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-bold text-white block text-xs hover:text-[#00ff66] transition-colors">
                                {player.gamertag}
                              </span>
                              <span className="text-[10px] text-slate-400 block">
                                {player.playerName}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Tournaments Played */}
                        <td className="px-5 py-4 text-center font-mono tabular-nums text-slate-300">
                          {player.tournamentsPlayed}
                        </td>

                        {/* Matches Played */}
                        <td className="px-5 py-4 text-center font-mono tabular-nums text-slate-300">
                          {player.matchesPlayed}
                        </td>

                        {/* W - L */}
                        <td className="px-5 py-4 text-center font-mono tabular-nums text-slate-300">
                          <span className="text-[#00ff66] font-semibold">{player.wins}V</span> - <span className="text-slate-500">{player.losses}D</span>
                        </td>

                        {/* Points */}
                        <td className="px-5 py-4 text-right font-mono font-bold text-[#00ff66] text-sm tabular-nums">
                          {player.points} pts
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Player Detail Modal */}
        {selectedPlayer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <div className="w-full max-w-md bg-[#0c1017] border border-[#222e40] rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b border-[#1b2434] bg-[#111724] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#00ff66]" />
                  <h3 className="font-display text-lg font-bold text-white uppercase">
                    Fiche Carrière Compétiteur
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedPlayer(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6 text-xs text-slate-300">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-[#141b27] border-2 border-[#00ff66]/40 flex items-center justify-center font-display font-black text-2xl text-[#00ff66] shadow-[0_0_20px_rgba(0,255,102,0.25)]">
                    {selectedPlayer.gamertag.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-display text-2xl font-black text-white uppercase">
                      {selectedPlayer.gamertag}
                    </h4>
                    <p className="text-slate-400 text-xs">{selectedPlayer.playerName}</p>
                    <span className="text-[10px] font-mono text-[#00ff66] mt-1 inline-block">
                      Rang #{selectedPlayer.rank}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 font-mono">
                  <div className="p-3 rounded-xl bg-[#101520] border border-[#1b2333] space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase block">Points au barème</span>
                    <span className="text-xl font-bold text-[#00ff66] block">{selectedPlayer.points} pts</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#101520] border border-[#1b2333] space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase block">Matchs V / D</span>
                    <span className="text-xl font-bold text-white block">{selectedPlayer.wins}V / {selectedPlayer.losses}D</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#101520] border border-[#1b2333] space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase block">Tournois disputés</span>
                    <span className="text-xl font-bold text-white block">{selectedPlayer.tournamentsPlayed}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#101520] border border-[#1b2333] space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase block">Matchs joués</span>
                    <span className="text-xl font-bold text-white block">{selectedPlayer.matchesPlayed}</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 bg-[#080b10] p-3.5 rounded-xl border border-[#161f2c]">
                  Compétiteur certifié FC Tournament. Les points sont homologués à chaque résultat vérifié.
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setSelectedPlayer(null)}
                    className="px-5 py-2 rounded-xl bg-[#141b27] hover:bg-[#1a2333] text-white font-semibold cursor-pointer"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
