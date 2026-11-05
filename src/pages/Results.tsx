import React, { useState, useEffect } from 'react';
import type { Match, Tournament } from '../types/index.ts';
import { formatDateFrench } from '../utils/format.ts';
import { Trophy, CheckCircle2, Search, Calendar, ShieldCheck, Clock, ArrowRight } from 'lucide-react';

import { apiClient } from '../services/apiClient.ts';

interface ResultsProps {
  onNavigate: (page: string, param?: string) => void;
}

export const Results: React.FC<ResultsProps> = ({ onNavigate }) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTournament, setSelectedTournament] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'completed' | 'scheduled'>('completed');
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    async function loadResults() {
      try {
        const [matchData, tournData] = await Promise.all([
          apiClient.getMatches(),
          apiClient.getTournaments(),
        ]);

        setMatches(matchData);
        setTournaments(tournData);
      } catch (err) {
        console.error('Error fetching results:', err);
      } finally {
        setLoading(false);
      }
    }
    loadResults();
  }, []);

  const filteredMatches = matches.filter((m) => {
    const matchTourn = selectedTournament === 'all' || m.tournamentId === selectedTournament;
    const matchStatus = m.status === selectedStatus;
    const matchSearch =
      m.player1Gamertag.toLowerCase().includes(search.toLowerCase()) ||
      m.player2Gamertag.toLowerCase().includes(search.toLowerCase()) ||
      m.stageName.toLowerCase().includes(search.toLowerCase());
    return matchTourn && matchStatus && matchSearch;
  });

  return (
    <div className="min-h-screen bg-[#07090e] py-10 px-4 sm:px-6 lg:px-8 text-slate-200">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2 border-b border-[#182130] pb-6">
          <div className="flex items-center gap-2 text-xs font-mono text-[#00ff66] uppercase">
            <span>HISTORIQUE & CALENDRIER OFFICIEL</span>
            <span aria-hidden="true">·</span>
            <span>SCORES ET RÉSULTATS HOMOLOGUÉS</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-black text-white uppercase tracking-tight">
            Matchs & Résultats
          </h1>
          <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
            Consultez en direct les scores validés, les prochains rendez-vous compétitifs et l’historique certifié des rencontres EA SPORTS FC.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl bg-[#0c1017] border border-[#1b2538]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par gamertag ou étape..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-[#111722] border border-[#202b3d] text-white placeholder-slate-500 focus:outline-none focus:border-[#00ff66]"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-[#111722] rounded-xl border border-[#202b3d]">
            {[
              { id: 'completed', label: 'Résultats validés' },
              { id: 'scheduled', label: 'Prochains matchs' },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setSelectedStatus(btn.id as any)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                  selectedStatus === btn.id
                    ? 'bg-[#00ff66] text-black font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <select
            value={selectedTournament}
            onChange={(e) => setSelectedTournament(e.target.value)}
            className="px-3.5 py-2 text-xs rounded-xl bg-[#111722] border border-[#202b3d] text-slate-300 focus:outline-none focus:border-[#00ff66] cursor-pointer"
          >
            <option value="all">Tous les tournois</option>
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Matches list */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-32 rounded-2xl bg-[#0d121b] border border-[#1b2333] animate-pulse" />
            ))}
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="p-16 text-center rounded-2xl bg-[#0c1017] border border-[#1b2333] text-slate-400 text-xs space-y-3">
            <Trophy className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="font-semibold text-slate-300">Aucun match ne correspond aux filtres actuels.</p>
            <button
              onClick={() => {
                setSearch('');
                setSelectedTournament('all');
                setSelectedStatus('completed');
              }}
              className="text-xs text-[#00ff66] hover:underline font-medium cursor-pointer"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMatches.map((m) => {
              const tourn = tournaments.find((t) => t.id === m.tournamentId);
              const isCompleted = m.status === 'completed';
              const isP1Winner = isCompleted && m.winnerId === m.player1Id;
              const isP2Winner = isCompleted && m.winnerId === m.player2Id;
              const lastAudit = m.auditLog && m.auditLog.length > 0 ? m.auditLog[m.auditLog.length - 1] : null;

              return (
                <div
                  key={m.id}
                  className="p-5 rounded-3xl bg-[#0c1017] border border-[#1c2538] hover:border-[#2b3952] transition-colors space-y-4 shadow-xl"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs border-b border-[#161f2e] pb-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => m.tournamentId && onNavigate('tournament-detail', m.tournamentId)}
                        className="font-bold text-white font-display text-sm uppercase hover:text-[#00ff66] transition-colors cursor-pointer text-left"
                      >
                        {tourn ? tourn.name : 'Tournoi FC'}
                      </button>
                      <span className="text-slate-600">·</span>
                      <span className="font-mono text-[#00ff66]">{m.stageName}</span>
                    </div>

                    <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{formatDateFrench(m.scheduledDate)} à {m.scheduledTime}</span>
                      </span>
                      {isCompleted ? (
                        <span className="text-[#00ff66] flex items-center gap-1 bg-[#00ff66]/10 px-2 py-0.5 rounded font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Homologué</span>
                        </span>
                      ) : (
                        <span className="text-amber-400 flex items-center gap-1 bg-amber-400/10 px-2 py-0.5 rounded font-bold">
                          <Clock className="w-3 h-3" />
                          <span>Programmé</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Versus Score Card */}
                  <div className="grid grid-cols-1 md:grid-cols-5 items-center gap-4 py-1">
                    {/* Player 1 */}
                    <div
                      className={`md:col-span-2 p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                        isP1Winner
                          ? 'bg-[#00ff66]/10 border-[#00ff66]/40 text-white shadow-sm'
                          : 'bg-[#10151f] border-[#18212e] text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        {isP1Winner && <Trophy className="w-4 h-4 text-[#00ff66] shrink-0" />}
                        <span className={`text-sm truncate ${isP1Winner ? 'font-bold text-[#00ff66]' : 'font-medium'}`}>
                          {m.player1Gamertag || 'En attente'}
                        </span>
                      </div>
                      <span className={`text-xl font-mono font-black tabular-nums px-3 py-1 rounded-xl ${
                        isP1Winner ? 'bg-[#00ff66] text-black shadow-md' : 'bg-[#18202d] text-white'
                      }`}>
                        {m.player1Score !== null ? m.player1Score : '-'}
                      </span>
                    </div>

                    {/* Middle Status */}
                    <div className="md:col-span-1 text-center font-display font-black text-slate-500 text-sm">
                      {isCompleted ? 'TERMINÉ' : 'VS'}
                    </div>

                    {/* Player 2 */}
                    <div
                      className={`md:col-span-2 p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                        isP2Winner
                          ? 'bg-[#00ff66]/10 border-[#00ff66]/40 text-white shadow-sm'
                          : 'bg-[#10151f] border-[#18212e] text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        {isP2Winner && <Trophy className="w-4 h-4 text-[#00ff66] shrink-0" />}
                        <span className={`text-sm truncate ${isP2Winner ? 'font-bold text-[#00ff66]' : 'font-medium'}`}>
                          {m.player2Gamertag || 'En attente'}
                        </span>
                      </div>
                      <span className={`text-xl font-mono font-black tabular-nums px-3 py-1 rounded-xl ${
                        isP2Winner ? 'bg-[#00ff66] text-black shadow-md' : 'bg-[#18202d] text-white'
                      }`}>
                        {m.player2Score !== null ? m.player2Score : '-'}
                      </span>
                    </div>
                  </div>

                  {/* Audit Trail Note */}
                  {lastAudit && (
                    <div className="pt-2 text-[11px] text-slate-400 flex items-center gap-2 border-t border-[#141c28]">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#00ff66] shrink-0" />
                      <span>
                        <strong className="text-slate-200">{lastAudit.note}</strong>
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
