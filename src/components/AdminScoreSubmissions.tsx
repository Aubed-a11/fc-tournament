import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Clock, ImageIcon, RefreshCw, AlertCircle, X } from 'lucide-react';
import type { ScoreSubmission } from '../types/index.ts';

type AdminScoreSubmission = ScoreSubmission & { matchStatus?: string };

interface AdminScoreSubmissionsProps {
  getAdminHeaders: (extra?: Record<string, string>) => Record<string, string>;
  onScoreValidated: () => void;
  onPendingCountChange: (count: number) => void;
}

const statusLabel: Record<ScoreSubmission['status'], string> = {
  pending: 'En attente',
  approved: 'Validé',
  rejected: 'Refusé',
};

export const AdminScoreSubmissions: React.FC<AdminScoreSubmissionsProps> = ({
  getAdminHeaders,
  onScoreValidated,
  onPendingCountChange,
}) => {
  const [submissions, setSubmissions] = useState<AdminScoreSubmission[]>([]);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [edits, setEdits] = useState<Record<string, { score1: string; score2: string }>>({});
  const [rejectFor, setRejectFor] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [proofView, setProofView] = useState<{ id: string; data: string | null; error?: string } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/score-submissions', { headers: getAdminHeaders() });
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data.submissions || []);
        onPendingCountChange(data.pendingCount || 0);
      }
    } catch {
      setFeedback({ type: 'error', text: 'Impossible de charger les scores envoyés.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openProof = async (id: string) => {
    setProofView({ id, data: null });
    try {
      const res = await fetch(`/api/admin/score-submissions/${id}/proof`, { headers: getAdminHeaders() });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setProofView({ id, data: null, error: data.error || 'Capture introuvable.' });
        return;
      }
      setProofView({ id, data: data.proofData });
    } catch {
      setProofView({ id, data: null, error: 'Impossible de charger la capture.' });
    }
  };

  const approve = async (sub: AdminScoreSubmission) => {
    const edit = edits[sub.id];
    const score1 = edit ? Number(edit.score1) : sub.score1;
    const score2 = edit ? Number(edit.score2) : sub.score2;
    setBusyId(sub.id);
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/score-submissions/${sub.id}/approve`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({ score1, score2 }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFeedback({ type: 'error', text: data.error || 'Validation impossible.' });
        return;
      }
      setFeedback({ type: 'success', text: data.message || 'Score validé et publié.' });
      onScoreValidated();
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (sub: AdminScoreSubmission) => {
    setBusyId(sub.id);
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/score-submissions/${sub.id}/reject`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({ reason: rejectReason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFeedback({ type: 'error', text: data.error || 'Refus impossible.' });
        return;
      }
      setFeedback({ type: 'success', text: data.message || 'Envoi refusé.' });
      setRejectFor(null);
      setRejectReason('');
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const visible = filter === 'pending' ? submissions.filter((s) => s.status === 'pending') : submissions;
  const scoreInput =
    'w-14 px-2 py-1.5 text-center font-mono font-bold text-sm rounded-lg bg-[#111723] border border-[#202b3e] text-white focus:outline-none focus:border-[#00ff66]';

  return (
    <div className="space-y-5">
      <div className="p-4 rounded-2xl bg-[#0c1017] border border-[#1b2538] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-bold text-white uppercase">Scores envoyés par les joueurs</h3>
          <p className="text-[11px] text-slate-400">
            Vérifiez la capture, corrigez le score si besoin, puis validez : le résultat est publié et le vainqueur avance dans le tableau.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'pending' | 'all')}
            className="px-3 py-2 text-xs rounded-xl bg-[#121824] border border-[#222e44] text-white focus:outline-none focus:border-[#00ff66] cursor-pointer"
          >
            <option value="pending">En attente</option>
            <option value="all">Tous les envois</option>
          </select>
          <button
            onClick={load}
            className="p-2 rounded-xl bg-[#121824] border border-[#222e44] text-slate-300 hover:text-white cursor-pointer"
            title="Actualiser"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
            feedback.type === 'success'
              ? 'bg-[#00ff66]/10 border-[#00ff66]/30 text-[#00ff66]'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{feedback.text}</span>
        </div>
      )}

      {!loading && visible.length === 0 && (
        <div className="p-10 text-center rounded-2xl bg-[#0b0f16] border border-[#1b2333] text-slate-400 text-xs">
          {filter === 'pending' ? 'Aucun score en attente de vérification.' : 'Aucun score envoyé pour le moment.'}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {visible.map((sub) => {
          const edit = edits[sub.id] || { score1: String(sub.score1), score2: String(sub.score2) };
          const isPending = sub.status === 'pending';
          return (
            <div key={sub.id} className="p-5 rounded-2xl bg-[#0b0f16] border border-[#1c2538] space-y-4 text-xs">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="font-bold text-white block">{sub.tournamentName}</span>
                  <span className="text-[11px] text-slate-400">{sub.stageName}</span>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase border flex items-center gap-1 ${
                    sub.status === 'approved'
                      ? 'bg-[#00ff66]/15 text-[#00ff66] border-[#00ff66]/30'
                      : sub.status === 'rejected'
                      ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                      : 'bg-amber-400/15 text-amber-400 border-amber-400/30'
                  }`}
                >
                  {isPending && <Clock className="w-3 h-3" />}
                  {statusLabel[sub.status]}
                </span>
              </div>

              <div className="flex items-center justify-center gap-3 py-2">
                <span className="font-bold text-white text-right flex-1 truncate">{sub.player1Gamertag}</span>
                {isPending ? (
                  <>
                    <input
                      type="number"
                      min={0}
                      value={edit.score1}
                      onChange={(e) => setEdits({ ...edits, [sub.id]: { ...edit, score1: e.target.value } })}
                      className={scoreInput}
                    />
                    <span className="text-slate-500">-</span>
                    <input
                      type="number"
                      min={0}
                      value={edit.score2}
                      onChange={(e) => setEdits({ ...edits, [sub.id]: { ...edit, score2: e.target.value } })}
                      className={scoreInput}
                    />
                  </>
                ) : (
                  <span className="font-mono font-bold text-lg text-white">
                    {sub.score1} - {sub.score2}
                  </span>
                )}
                <span className="font-bold text-white flex-1 truncate">{sub.player2Gamertag}</span>
              </div>

              <div className="text-[11px] text-slate-400 space-y-1">
                <div>
                  Envoyé par <span className="text-white font-semibold">{sub.submittedByGamertag}</span> le{' '}
                  {new Date(sub.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
                {sub.note && <div className="italic text-slate-300">« {sub.note} »</div>}
                {sub.status === 'rejected' && sub.rejectionReason && (
                  <div className="text-rose-400">Motif du refus : {sub.rejectionReason}</div>
                )}
                {isPending && sub.matchStatus === 'completed' && (
                  <div className="text-amber-400">Attention : ce match a déjà un score validé.</div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#161f2e]">
                <button
                  onClick={() => openProof(sub.id)}
                  className="px-3 py-1.5 rounded-lg bg-[#151f2d] text-slate-200 hover:text-white hover:bg-[#1d2b3f] font-semibold text-[11px] flex items-center gap-1.5 cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-[#00ff66]" />
                  Voir la capture
                </button>
                {isPending && (
                  <>
                    <button
                      onClick={() => approve(sub)}
                      disabled={busyId === sub.id}
                      className="px-3 py-1.5 rounded-lg bg-[#00ff66]/15 text-[#00ff66] hover:bg-[#00ff66] hover:text-black font-semibold text-[11px] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Valider et publier
                    </button>
                    <button
                      onClick={() => {
                        setRejectFor(rejectFor === sub.id ? null : sub.id);
                        setRejectReason('');
                      }}
                      disabled={busyId === sub.id}
                      className="px-3 py-1.5 rounded-lg bg-rose-500/15 text-rose-400 hover:bg-rose-500 hover:text-white font-semibold text-[11px] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Refuser
                    </button>
                  </>
                )}
              </div>

              {rejectFor === sub.id && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Motif (ex : capture illisible, score différent)"
                    className="flex-1 px-3 py-2 text-xs rounded-lg bg-[#111723] border border-[#202b3e] text-white placeholder-slate-600 focus:outline-none focus:border-rose-400"
                  />
                  <button
                    onClick={() => reject(sub)}
                    disabled={busyId === sub.id}
                    className="px-3 py-2 rounded-lg bg-rose-500 text-white font-semibold text-[11px] cursor-pointer disabled:opacity-50"
                  >
                    Confirmer le refus
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {proofView && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4" onClick={() => setProofView(null)}>
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setProofView(null)}
              className="absolute -top-10 right-0 p-2 rounded-lg text-white hover:bg-white/10 cursor-pointer"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
            {proofView.data ? (
              <img src={proofView.data} alt="Capture du score" className="w-full max-h-[85vh] object-contain rounded-xl bg-black" />
            ) : (
              <div className="p-10 text-center text-sm text-slate-300 bg-[#0b0f16] rounded-xl">
                {proofView.error || 'Chargement de la capture...'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
