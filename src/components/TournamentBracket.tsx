import React, { useState } from 'react';
import type { Match } from '../types/index.ts';
import { Trophy, CheckCircle2, Clock, Calendar, Tv, Shield } from 'lucide-react';

interface TournamentBracketProps {
  matches: Match[];
  onSelectMatchForScore?: (match: Match) => void;
  isAdmin?: boolean;
}

export const TournamentBracket: React.FC<TournamentBracketProps> = ({
  matches,
  onSelectMatchForScore,
  isAdmin,
}) => {
  // Categorize matches by stage
  const qfMatches = matches.filter(
    (m) => m.stage === 'quarter_final' || m.stageName.toLowerCase().includes('quart')
  );
  const sfMatches = matches.filter(
    (m) => m.stage === 'semi_final' || m.stageName.toLowerCase().includes('demi')
  );
  const finalMatches = matches.filter(
    (m) => m.stage === 'final' || m.stageName.toLowerCase().includes('finale')
  );

  // Active round tab for mobile & tablet
  const [mobileRound, setMobileRound] = useState<'all' | 'qf' | 'sf' | 'final'>(
    finalMatches.length > 0 && finalMatches[0].status === 'completed' ? 'final' : 'all'
  );

  const renderMatchCard = (match: Match, highlighted = false) => {
    const isCompleted = match.status === 'completed';
    const isLive = match.status === 'live';
    const isP1Winner = isCompleted && match.winnerId && match.winnerId === match.player1Id;
    const isP2Winner = isCompleted && match.winnerId && match.winnerId === match.player2Id;

    return (
      <div
        key={match.id}
        className={`w-full sm:w-72 bg-[#0c1017] border rounded-2xl overflow-hidden shadow-lg transition-all duration-200 relative ${
          highlighted
            ? 'border-[#00ff66]/60 shadow-[0_0_20px_rgba(0,255,102,0.25)]'
            : 'border-[#1e2637] hover:border-[#2f3d57]'
        }`}
      >
        {/* Match Header */}
        <div className="bg-[#121722] px-3.5 py-2 border-b border-[#1b2333] flex items-center justify-between text-[11px] text-slate-400">
          <span className="font-semibold text-slate-300 truncate">{match.stageName}</span>
          <div className="flex items-center gap-1.5 font-mono">
            {isCompleted ? (
              <span className="text-[#00ff66] flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Homologué</span>
              </span>
            ) : isLive ? (
              <span className="text-amber-400 font-bold flex items-center gap-1 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                <span>EN DIRECT</span>
              </span>
            ) : (
              <span className="text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" />
                <span>{match.scheduledTime || 'À venir'}</span>
              </span>
            )}
          </div>
        </div>

        {/* Players & Scores */}
        <div className="p-3.5 space-y-2">
          {/* Player 1 */}
          <div
            className={`flex items-center justify-between px-3 py-2 rounded-xl border transition-colors ${
              isP1Winner
                ? 'bg-[#00ff66]/15 border-[#00ff66]/50 text-white shadow-sm'
                : 'bg-[#121620] border-[#18202d] text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2 truncate flex-1 mr-2">
              {isP1Winner && <Trophy className="w-3.5 h-3.5 text-[#00ff66] shrink-0" />}
              <span className={`text-xs truncate ${isP1Winner ? 'font-bold text-[#00ff66]' : 'font-medium'}`}>
                {match.player1Gamertag || 'En attente (TBD)'}
              </span>
            </div>
            <span
              className={`text-sm font-mono font-black tabular-nums px-2.5 py-0.5 rounded-lg ${
                isP1Winner
                  ? 'bg-[#00ff66] text-black shadow-sm'
                  : 'bg-[#1b2230] text-slate-200'
              }`}
            >
              {match.player1Score !== null ? match.player1Score : '-'}
            </span>
          </div>

          {/* Player 2 */}
          <div
            className={`flex items-center justify-between px-3 py-2 rounded-xl border transition-colors ${
              isP2Winner
                ? 'bg-[#00ff66]/15 border-[#00ff66]/50 text-white shadow-sm'
                : 'bg-[#121620] border-[#18202d] text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2 truncate flex-1 mr-2">
              {isP2Winner && <Trophy className="w-3.5 h-3.5 text-[#00ff66] shrink-0" />}
              <span className={`text-xs truncate ${isP2Winner ? 'font-bold text-[#00ff66]' : 'font-medium'}`}>
                {match.player2Gamertag || 'En attente (TBD)'}
              </span>
            </div>
            <span
              className={`text-sm font-mono font-black tabular-nums px-2.5 py-0.5 rounded-lg ${
                isP2Winner
                  ? 'bg-[#00ff66] text-black shadow-sm'
                  : 'bg-[#1b2230] text-slate-200'
              }`}
            >
              {match.player2Score !== null ? match.player2Score : '-'}
            </span>
          </div>
        </div>

        {/* Audit Note preview if present */}
        {match.auditLog && match.auditLog.length > 0 && (
          <div className="px-3.5 pb-2 text-[10px] text-slate-400 font-mono truncate">
            ✓ {match.auditLog[match.auditLog.length - 1].note}
          </div>
        )}

        {/* Admin Action for Score Entry */}
        {isAdmin && onSelectMatchForScore && (
          <div className="px-3.5 pb-3 pt-0">
            <button
              onClick={() => onSelectMatchForScore(match)}
              className="w-full py-1.5 text-xs rounded-xl bg-[#172030] hover:bg-[#00ff66] hover:text-black text-slate-200 transition-all font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{isCompleted ? 'Modifier le score (Audit)' : 'Valider le score'}</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  if (matches.length === 0) {
    return (
      <div className="py-14 px-6 text-center rounded-3xl bg-[#0c1017] border border-[#1b2333] space-y-3">
        <Trophy className="w-12 h-12 text-slate-500 mx-auto" />
        <h3 className="text-lg font-semibold text-white">Tableau des confrontations en cours de préparation</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          L'arbre des matchs sera automatiquement généré par l'organisation dès la clôture des inscriptions et la confirmation de tous les joueurs.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Responsive View Switcher for Mobile & Tablet */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-[#182130]">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <Trophy className="w-4 h-4 text-[#00ff66]" />
          <span>TABLEAU OFFICIEL À ÉLIMINATION DIRECTE</span>
        </div>

        <div className="flex items-center gap-1 bg-[#0e131d] p-1 rounded-xl border border-[#1e273a] text-xs">
          <button
            onClick={() => setMobileRound('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              mobileRound === 'all'
                ? 'bg-[#00ff66] text-black font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Vue d'ensemble
          </button>
          {qfMatches.length > 0 && (
            <button
              onClick={() => setMobileRound('qf')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                mobileRound === 'qf'
                  ? 'bg-[#00ff66] text-black font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Quarts ({qfMatches.length})
            </button>
          )}
          {sfMatches.length > 0 && (
            <button
              onClick={() => setMobileRound('sf')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                mobileRound === 'sf'
                  ? 'bg-[#00ff66] text-black font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Demis ({sfMatches.length})
            </button>
          )}
          {finalMatches.length > 0 && (
            <button
              onClick={() => setMobileRound('final')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                mobileRound === 'final'
                  ? 'bg-yellow-400 text-black font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Finale 🏆
            </button>
          )}
        </div>
      </div>

      {/* When specific round is selected on mobile/desktop: Grid View */}
      {mobileRound !== 'all' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {mobileRound === 'qf' && qfMatches.map((m) => renderMatchCard(m))}
          {mobileRound === 'sf' && sfMatches.map((m) => renderMatchCard(m))}
          {mobileRound === 'final' && finalMatches.map((m) => renderMatchCard(m, true))}
        </div>
      ) : (
        /* Full Tree View: Horizontal Bracket with smooth horizontal scrollbar */
        <div className="overflow-x-auto pb-6 pt-2">
          <div className="min-w-[880px] flex items-stretch justify-between gap-8 py-2">
            {/* Stage 1: Quarts de finale */}
            {qfMatches.length > 0 && (
              <div className="flex-1 flex flex-col space-y-6">
                <div className="text-center pb-2 border-b border-[#1b2333]">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                    Quarts de finale ({qfMatches.length})
                  </span>
                </div>
                <div className="space-y-6 flex flex-col items-center">
                  {qfMatches.map((m) => renderMatchCard(m))}
                </div>
              </div>
            )}

            {/* Stage 2: Demi-finales */}
            {sfMatches.length > 0 && (
              <div className="flex-1 flex flex-col space-y-6">
                <div className="text-center pb-2 border-b border-[#1b2333]">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#00ff66] font-mono">
                    Demi-finales ({sfMatches.length})
                  </span>
                </div>
                <div className="space-y-12 flex flex-col items-center justify-around flex-1">
                  {sfMatches.map((m) => renderMatchCard(m))}
                </div>
              </div>
            )}

            {/* Stage 3: Grande Finale */}
            {finalMatches.length > 0 && (
              <div className="flex-1 flex flex-col space-y-6">
                <div className="text-center pb-2 border-b border-[#00ff66]/30">
                  <span className="text-xs font-bold uppercase tracking-wider text-yellow-400 font-mono flex items-center justify-center gap-1.5">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    <span>Grande Finale</span>
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center flex-1">
                  <div className="p-1 rounded-3xl bg-gradient-to-b from-[#00ff66]/40 via-yellow-400/20 to-transparent">
                    {renderMatchCard(finalMatches[0], true)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
