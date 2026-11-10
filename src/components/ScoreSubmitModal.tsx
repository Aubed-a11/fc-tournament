import React, { useState } from 'react';
import { X, Upload, Send, ImageIcon, MessageCircle, AlertCircle } from 'lucide-react';
import type { Match } from '../types/index.ts';

interface ScoreSubmitModalProps {
  match: Match;
  token: string;
  onClose: () => void;
  onSubmitted: (message: string) => void;
}

// Reduit la capture (max 1600 px, JPEG) pour un envoi rapide meme en 3G/4G
async function compressImage(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Lecture du fichier impossible.'));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('Image illisible.'));
    el.src = dataUrl;
  });

  const maxSide = 1600;
  const ratio = Math.min(1, maxSide / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * ratio);
  canvas.height = Math.round(img.height * ratio);
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.85);
}

export const ScoreSubmitModal: React.FC<ScoreSubmitModalProps> = ({ match, token, onClose, onSubmitted }) => {
  const [score1, setScore1] = useState<string>('');
  const [score2, setScore2] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [proofData, setProofData] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Le fichier doit être une image (capture d’écran).');
      return;
    }
    setError(null);
    setPreparing(true);
    try {
      setProofData(await compressImage(file));
    } catch (err: any) {
      setError(err?.message || 'Impossible de lire cette image.');
    } finally {
      setPreparing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (score1 === '' || score2 === '') {
      setError('Indiquez le score des deux joueurs.');
      return;
    }
    if (!proofData) {
      setError('Ajoutez la capture d’écran du score final.');
      return;
    }
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/matches/${match.id}/score-submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ score1: Number(score1), score2: Number(score2), proofData, note }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Envoi impossible. Veuillez réessayer.');
        return;
      }
      onSubmitted(data.message || 'Score envoyé.');
    } catch {
      setError('Connexion impossible. Vérifiez votre réseau et réessayez.');
    } finally {
      setSending(false);
    }
  };

  const scoreInputClass =
    'w-full px-3 py-3 text-center text-2xl font-bold font-mono rounded-xl bg-[#111723] border border-[#202b3e] text-white focus:outline-none focus:border-[#00ff66]';

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-3xl bg-[#0b0f16] border border-[#1c2435] shadow-2xl p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-xl font-bold text-white uppercase">Envoyer mon score</h3>
            <p className="text-xs text-slate-400 mt-1">{match.stageName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#151f2d] cursor-pointer" title="Fermer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs text-slate-300 font-semibold truncate" title={match.player1Gamertag}>
                {match.player1Gamertag}
              </label>
              <input type="number" min={0} max={99} inputMode="numeric" required value={score1} onChange={(e) => setScore1(e.target.value)} className={scoreInputClass} />
            </div>
            <span className="pb-3 text-slate-500 font-bold">-</span>
            <div className="space-y-1.5">
              <label className="block text-xs text-slate-300 font-semibold truncate text-right" title={match.player2Gamertag}>
                {match.player2Gamertag}
              </label>
              <input type="number" min={0} max={99} inputMode="numeric" required value={score2} onChange={(e) => setScore2(e.target.value)} className={scoreInputClass} />
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="block text-xs text-slate-300 font-semibold">Capture d’écran du score final</span>
            <label className="block cursor-pointer">
              <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
              {proofData ? (
                <div className="relative rounded-xl overflow-hidden border border-[#00ff66]/40">
                  <img src={proofData} alt="Capture du score" className="w-full max-h-56 object-contain bg-black" />
                  <span className="absolute bottom-2 right-2 px-2 py-1 rounded-md bg-black/70 text-[10px] text-white">Changer l’image</span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 py-8 rounded-xl border border-dashed border-[#2a3a54] bg-[#0e131d] text-slate-400 hover:border-[#00ff66] transition-colors">
                  {preparing ? <ImageIcon className="w-6 h-6 animate-pulse" /> : <Upload className="w-6 h-6" />}
                  <span className="text-xs">{preparing ? 'Préparation de l’image...' : 'Choisir ou prendre une capture'}</span>
                </div>
              )}
            </label>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs text-slate-300 font-semibold">Commentaire (facultatif)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder="Ex : match retour, victoire aux tirs au but..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-[#111723] border border-[#202b3e] text-white placeholder-slate-600 focus:outline-none focus:border-[#00ff66]"
            />
          </div>

          {error && (
            <div className="p-3 text-xs rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={sending || preparing}
            className="w-full py-3 rounded-xl bg-[#00ff66] text-black font-display text-sm font-bold uppercase tracking-wider hover:bg-[#00e65c] transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>{sending ? 'Envoi en cours...' : 'Envoyer pour validation'}</span>
          </button>

          <p className="text-[11px] text-slate-500 leading-relaxed flex items-start gap-2">
            <MessageCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#00ff66]" />
            <span>
              Le score sera publié après vérification par l’organisation. Vous pouvez aussi envoyer votre capture sur WhatsApp au{' '}
              <a href="https://wa.me/212681337566" target="_blank" rel="noopener noreferrer" className="text-white underline font-mono">
                +212681337566
              </a>
              .
            </span>
          </p>
        </form>
      </div>
    </div>
  );
};
