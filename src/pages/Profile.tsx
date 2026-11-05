import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { User, CheckCircle2, AlertCircle } from 'lucide-react';

interface ProfileProps {
  onNavigate: (page: string) => void;
}

export const Profile: React.FC<ProfileProps> = ({ onNavigate }) => {
  const { user, updateProfile } = useAuth();

  const [gamertag, setGamertag] = useState(user?.gamertag || '');
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [favoriteTeam, setFavoriteTeam] = useState(user?.favoriteTeam || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#07090e] p-8 text-center text-slate-400">
        <p>Veuillez vous connecter pour gérer votre profil.</p>
        <button
          onClick={() => onNavigate('login')}
          className="mt-3 px-4 py-2 rounded-xl bg-[#00ff66] text-black font-bold text-xs"
        >
          Connexion
        </button>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);

    const res = await updateProfile({
      gamertag,
      firstName,
      lastName,
      favoriteTeam,
      bio,
    });

    setLoading(false);
    if (res.success) {
      setStatusMessage({ type: 'success', text: 'Profil mis à jour avec succès !' });
    } else {
      setStatusMessage({ type: 'error', text: res.error || 'Erreur lors de la mise à jour.' });
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] py-10 px-4 sm:px-6 lg:px-8 text-slate-200">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="space-y-2 border-b border-[#182130] pb-6">
          <div className="text-xs font-mono text-[#00ff66] uppercase">ESPACE JOUEUR</div>
          <h1 className="font-display text-4xl font-black text-white uppercase tracking-tight">
            Mon Profil Compétiteur
          </h1>
          <p className="text-xs text-slate-400">
            Personnalisez vos informations de joueur visibles sur la plateforme FC Tournament.
          </p>
        </div>

        {statusMessage && (
          <div
            className={`p-3.5 rounded-xl text-xs flex items-center gap-2 border ${
              statusMessage.type === 'success'
                ? 'bg-[#00ff66]/10 border-[#00ff66]/30 text-[#00ff66]'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="p-8 rounded-3xl bg-[#0b0f16] border border-[#1b2333] space-y-6 shadow-xl">
          <div className="flex items-center gap-4 pb-4 border-b border-[#161f2c]">
            <div className="w-16 h-16 rounded-2xl bg-[#141b27] border border-[#00ff66]/40 flex items-center justify-center font-display font-black text-2xl text-[#00ff66]">
              {user.gamertag.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <span className="font-bold text-white text-base block">{user.gamertag}</span>
              <span className="text-xs text-slate-400 block font-mono">{user.email}</span>
              <span className="text-[10px] text-[#00ff66] uppercase font-mono mt-0.5 block">
                Rôle : {user.role === 'admin' ? 'Administrateur' : 'Joueur'}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Pseudonyme officiel (Gamertag)
              </label>
              <input
                type="text"
                value={gamertag}
                onChange={(e) => setGamertag(e.target.value)}
                required
                className="w-full px-4 py-2.5 text-xs rounded-xl bg-[#101520] border border-[#1e2738] text-white focus:outline-none focus:border-[#00ff66]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Prénom
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs rounded-xl bg-[#101520] border border-[#1e2738] text-white focus:outline-none focus:border-[#00ff66]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Nom
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs rounded-xl bg-[#101520] border border-[#1e2738] text-white focus:outline-none focus:border-[#00ff66]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Équipe préférée sur EA SPORTS FC
              </label>
              <input
                type="text"
                value={favoriteTeam}
                onChange={(e) => setFavoriteTeam(e.target.value)}
                className="w-full px-4 py-2.5 text-xs rounded-xl bg-[#101520] border border-[#1e2738] text-white focus:outline-none focus:border-[#00ff66]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Bio / Style de jeu
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Ex : Spécialiste contre-attaque rapide, finaliste tournoi Al Qods 2025..."
                className="w-full px-4 py-2.5 text-xs rounded-xl bg-[#101520] border border-[#1e2738] text-white focus:outline-none focus:border-[#00ff66]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#161f2c]">
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="px-4 py-2.5 text-xs font-medium text-slate-400 hover:text-white"
            >
              Retour à mon espace
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-[#00ff66] text-black font-bold text-xs uppercase hover:bg-[#00e65c] transition-all duration-200 shadow-[0_0_15px_rgba(0,255,102,0.3)] disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
