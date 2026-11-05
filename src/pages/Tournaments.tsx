import React, { useState, useEffect } from 'react';
import type { Tournament } from '../types/index.ts';
import { formatDateFrench, formatMAD } from '../utils/format.ts';
import { Search, Calendar, Users, Trophy, ArrowRight, ShieldCheck, Gamepad2 } from 'lucide-react';

import { apiClient } from '../services/apiClient.ts';

interface TournamentsProps {
  onNavigate: (page: string, param?: string) => void;
}

export const Tournaments: React.FC<TournamentsProps> = ({ onNavigate }) => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [formatFilter, setFormatFilter] = useState<string>('all');

  useEffect(() => {
    async function fetchTournaments() {
      try {
        const data = await apiClient.getTournaments();
        setTournaments(data);
      } catch (err) {
        console.error('Error fetching tournaments:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchTournaments();
  }, []);

  const filteredTournaments = tournaments.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesFormat = formatFilter === 'all' || t.format === formatFilter;

    return matchesSearch && matchesStatus && matchesFormat;
  });

  return (
    <div className="min-h-screen bg-[#07090e] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2 border-b border-[#182130] pb-6">
          <div className="flex items-center gap-2 text-xs font-mono text-[#00ff66] uppercase">
            <span>E-SPORT OFFICIEL</span>
            <span aria-hidden="true">·</span>
            <span>COMPÉTITIONS ET CALENDRIER</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-black text-white uppercase tracking-tight">
            Tournois EA SPORTS FC
          </h1>
          <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
            Consultez les tournois programmés, découvrez les dotations, suivez les phases finales et engagez-vous avant la clôture des places.
          </p>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-4 rounded-2xl bg-[#0c1017] border border-[#1b2434]">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher un tournoi (nom, lieu)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-[#111722] border border-[#202b3d] text-white placeholder-slate-500 focus:outline-none focus:border-[#00ff66]"
            />
          </div>

          {/* Status buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-[#111722] rounded-xl border border-[#202b3d]">
            {[
              { id: 'all', label: 'Tous les statuts' },
              { id: 'open', label: 'À venir / Inscriptions ouvertes' },
              { id: 'ongoing', label: 'En cours' },
              { id: 'completed', label: 'Terminés' },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setStatusFilter(btn.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                  statusFilter === btn.id
                    ? 'bg-[#00ff66] text-black font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Format selector */}
          <select
            value={formatFilter}
            onChange={(e) => setFormatFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-[#111722] border border-[#202b3d] text-slate-300 focus:outline-none focus:border-[#00ff66] cursor-pointer"
          >
            <option value="all">Tous les formats</option>
            <option value="aller_retour">Aller-Retour</option>
            <option value="single_elimination">Élimination directe</option>
            <option value="groups_playoffs">Poules puis Finales</option>
          </select>
        </div>

        {/* Tournament Cards List */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[1, 2].map((n) => (
              <div key={n} className="h-[480px] rounded-3xl bg-[#0d121b] border border-[#1b2333] animate-pulse" />
            ))}
          </div>
        ) : filteredTournaments.length === 0 ? (
          <div className="py-16 text-center rounded-2xl bg-[#0c1017] border border-[#1b2333] space-y-3">
            <Trophy className="w-10 h-10 text-slate-500 mx-auto" />
            <h3 className="text-base font-semibold text-white">Aucun tournoi ne correspond aux filtres</h3>
            <p className="text-xs text-slate-400">Essayez de réinitialiser la recherche ou de modifier le statut sélectionné.</p>
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
                setFormatFilter('all');
              }}
              className="text-xs text-[#00ff66] hover:underline pt-2 font-medium cursor-pointer"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className={`grid gap-8 ${filteredTournaments.length <= 2 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'}`}>
            {filteredTournaments.map((tournament) => {
              const isOpen = tournament.status === 'open';
              const isOngoing = tournament.status === 'ongoing';
              const isCompleted = tournament.status === 'completed';
              const placesLeft = tournament.maxParticipants - (tournament.confirmedCount || 0);
              const progressPercent = Math.min(
                100,
                Math.round(((tournament.confirmedCount || 0) / tournament.maxParticipants) * 100)
              );

              return (
                <div
                  key={tournament.id}
                  className="bg-[#0b0f16] border border-[#1c2435] hover:border-[#00ff66]/60 rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 flex flex-col justify-between group hover:shadow-[0_0_35px_rgba(0,255,102,0.12)]"
                >
                  {/* Card Visual Header - Generous, impactful poster */}
                  <div className="relative h-72 sm:h-80 md:h-88 overflow-hidden bg-slate-900">
                    <img
                      src={tournament.bannerImage || '/assets/aistudio/f455c630-cebe-4da1-8e64-ad18d396300f_73791cd5.png'}
                      alt={tournament.name}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 filter brightness-95"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f16] via-[#0b0f16]/40 to-transparent" />

                    {/* Top Status & Game Badges */}
                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2">
                      <div className="bg-[#07090e]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#222e44] text-xs font-mono uppercase tracking-wider flex items-center gap-2">
                        {isOpen && (
                          <>
                            <span className="w-2 h-2 rounded-full bg-[#00ff66] animate-pulse" />
                            <span className="text-[#00ff66] font-bold">Inscriptions ouvertes</span>
                          </>
                        )}
                        {isOngoing && (
                          <>
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                            <span className="text-amber-400 font-bold">En cours</span>
                          </>
                        )}
                        {isCompleted && <span className="text-slate-400 font-semibold">Terminé & archivé</span>}
                      </div>

                      <div className="bg-[#07090e]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#222e44] text-xs font-mono text-slate-300">
                        {tournament.gameVersion}
                      </div>
                    </div>

                    {/* Bottom of poster overlay: Dotation & Frais */}
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3">
                      <div className="bg-[#00ff66]/15 border border-[#00ff66]/40 backdrop-blur-md px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold text-[#00ff66] flex items-center gap-1.5 shadow-lg">
                        <Trophy className="w-4 h-4 text-[#00ff66] shrink-0" />
                        <span className="truncate">{tournament.prizePool}</span>
                      </div>
                      <div className="bg-[#07090e]/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-[#222e44] text-xs font-mono font-bold text-white">
                        Frais : <span className="text-[#00ff66]">{formatMAD(tournament.entryFeeMAD)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Info */}
                  <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between gap-6">
                    <div className="space-y-2.5">
                      <h3 className="font-display text-2xl sm:text-3xl font-black text-white group-hover:text-[#00ff66] transition-colors uppercase tracking-tight leading-snug">
                        {tournament.name}
                      </h3>
                      <p className="text-sm text-slate-300 leading-relaxed line-clamp-2">
                        {tournament.description}
                      </p>
                    </div>

                    {/* Structured Info Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300 font-mono">
                      <div className="p-3 rounded-2xl bg-[#101622] border border-[#1b2638] flex items-center gap-2.5">
                        <Calendar className="w-4 h-4 text-[#00ff66] shrink-0" />
                        <div className="truncate">
                          <span className="text-[10px] text-slate-400 block uppercase">Date & Heure</span>
                          <span className="font-semibold text-white truncate">{formatDateFrench(tournament.startDate)} · {tournament.time}</span>
                        </div>
                      </div>

                      <div className="p-3 rounded-2xl bg-[#101622] border border-[#1b2638] flex items-center gap-2.5">
                        <Trophy className="w-4 h-4 text-yellow-400 shrink-0" />
                        <div className="truncate">
                          <span className="text-[10px] text-slate-400 block uppercase">Dotation</span>
                          <span className="font-semibold text-white truncate">{tournament.prizePool}</span>
                        </div>
                      </div>

                      <div className="p-3 rounded-2xl bg-[#101622] border border-[#1b2638] flex items-center gap-2.5">
                        <Gamepad2 className="w-4 h-4 text-[#00ff66] shrink-0" />
                        <div className="truncate">
                          <span className="text-[10px] text-slate-400 block uppercase">Format</span>
                          <span className="font-semibold text-white truncate">
                            {tournament.format === 'aller_retour'
                              ? 'Aller-Retour'
                              : tournament.format === 'groups_playoffs'
                              ? 'Poules + Finales'
                              : 'Élimination Directe'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                        <span>Remplissage du tableau</span>
                        {isOpen ? (
                          <span className="text-[#00ff66] font-semibold">
                            {placesLeft > 0 ? `${placesLeft} places restantes` : 'Complet'}
                          </span>
                        ) : isOngoing ? (
                          <span className="text-amber-400 font-semibold">Phase finale en cours</span>
                        ) : (
                          <span className="text-slate-500">Résultats homologués</span>
                        )}
                      </div>
                      <div className="w-full bg-[#121824] h-2 rounded-full overflow-hidden border border-[#1e273a]">
                        <div
                          className="bg-gradient-to-r from-[#00ff66] to-[#22c55e] h-full rounded-full transition-all duration-500"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Action */}
                    <button
                      onClick={() => onNavigate('tournament-detail', tournament.id)}
                      className="w-full py-3.5 rounded-xl bg-[#00ff66] hover:bg-[#00e65c] text-black font-display text-base font-bold uppercase tracking-wider transition-all duration-200 shadow-[0_0_20px_rgba(0,255,102,0.35)] hover:shadow-[0_0_30px_rgba(0,255,102,0.6)] flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>
                        {isOpen ? 'Participer / Voir le tournoi' : isOngoing ? 'Suivre les matchs en direct' : 'Voir les résultats du tournoi'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
