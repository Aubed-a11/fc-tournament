import React, { useState } from 'react';
import type { Match } from '../types/index.ts';
import { X, ShieldCheck } from 'lucide-react';

interface ScoreModalProps {
  match: Match | null;
  token: string | null;
  adminToken?: string | null;
  onClose: () => void;
  onSuccess: (updatedMatch: Match) => void;
}

export const ScoreModal: React.FC<ScoreModalProps> = ({ match, token, adminToken, onClose, onSuccess }) => {
  if (!match) return null;

  const [score1, setScore1] = useState<string>(match.player1Score !== null ? String(match.player1Score) : '0');
  const [score2, setScore2] = useState<string>(match.player2Score !== null ? String(match.player2Score) : '0');
  const [refereeNote, setRefereeNote] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/matches/${match.id}/score`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(adminToken ? { 'x-admin-token': adminToken } : {}),
        },
        body: JSON.stringify({
          score1,
          score2,
          note: refereeNote.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erreur lors de la validation du score.');
        return;
      }

      onSuccess(data.match);
      onClose();
    } catch {
      setError('Erreur de connexion au serveur.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#0e131c] border border-[#232e42] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-[#1c2433] flex items-center justify-between bg-[#121824]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#00ff66]" />
            <h3 className="font-display text-lg font-bold text-white tracking-wide">
              Validation & Enregistrement du Score
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a2333] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="text-center text-xs text-slate-400 font-mono">
            {match.stageName} · Official eSport Match
          </div>

          {error && (
            <div className="p-3 text-xs rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300">
              {error}
            </div>
          )}

          {/* Versus Card */}
          <div className="grid grid-cols-5 items-center gap-3 p-4 rounded-xl bg-[#141b27] border border-[#202b3d]">
            {/* Player 1 */}
            <div className="col-span-2 text-center">
              <span className="text-xs font-bold text-white block truncate mb-2">
                {match.player1Gamertag || 'Joueur 1'}
              </span>
              <input
                type="number"
                min="0"
                max="99"
                value={score1}
                onChange={(e) => setScore1(e.target.value)}
                className="w-16 h-12 text-center text-2xl font-black font-mono bg-[#0c1017] border border-[#2b374d] focus:border-[#00ff66] focus:outline-none rounded-xl text-[#00ff66]"
                required
              />
            </div>

            {/* VS separator */}
            <div className="col-span-1 text-center font-display font-black text-slate-500 text-lg">
              VS
            </div>

            {/* Player 2 */}
            <div className="col-span-2 text-center">
              <span className="text-xs font-bold text-white block truncate mb-2">
                {match.player2Gamertag || 'Joueur 2'}
              </span>
              <input
                type="number"
                min="0"
                max="99"
                value={score2}
                onChange={(e) => setScore2(e.target.value)}
                className="w-16 h-12 text-center text-2xl font-black font-mono bg-[#0c1017] border border-[#2b374d] focus:border-[#00ff66] focus:outline-none rounded-xl text-[#00ff66]"
                required
              />
            </div>
          </div>

          {/* Note de l'organisateur */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Commentaire / Détails du match (traçabilité)
            </label>
            <input
              type="text"
              placeholder="Ex : Victoire 3-2 aux tirs au but après prolongation"
              value={refereeNote}
              onChange={(e) => setRefereeNote(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#141b27] border border-[#202b3d] text-white placeholder-slate-500 focus:border-[#00ff66] focus:outline-none"
            />
          </div>

          <div className="text-[11px] text-slate-400 bg-[#0d121b] p-3 rounded-lg border border-[#1a2333] space-y-1">
            <p>• La validation met à jour automatiquement le statut à <strong>Terminé</strong>.</p>
            <p>• Le vainqueur sera automatiquement qualifié pour le tour suivant du tableau.</p>
            <p>• Les points du classement général (Leaderboard) seront immédiatement recalculés.</p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl hover:bg-[#151c28] transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold text-black bg-[#00ff66] hover:bg-[#00e65c] rounded-xl transition-all shadow-[0_0_15px_rgba(0,255,102,0.4)] disabled:opacity-50"
            >
              {loading ? 'Validation en cours...' : 'Valider officiellement le score'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
