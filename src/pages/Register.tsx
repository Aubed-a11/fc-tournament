import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

interface RegisterProps {
  onNavigate: (page: string) => void;
}

export const Register: React.FC<RegisterProps> = ({ onNavigate }) => {
  const { register } = useAuth();
  const [gamertag, setGamertag] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [favoriteTeam, setFavoriteTeam] = useState('Real Madrid');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedGamertag = gamertag.trim();
    const trimmedEmail = email.trim();

    if (!trimmedGamertag || trimmedGamertag.length < 2) {
      setError('Veuillez renseigner un pseudonyme de joueur (Gamertag) valide (au moins 2 caractères).');
      return;
    }

    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Veuillez renseigner une adresse e-mail valide (ex: joueur@domaine.com).');
      return;
    }

    if (!password || password.length < 6) {
      setError('Le mot de passe doit comporter au moins 6 caractères.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les deux mots de passe ne correspondent pas. Veuillez vérifier votre saisie.');
      return;
    }

    if (!acceptTerms) {
      setError('Veuillez accepter le règlement officiel de la compétition et les conditions d’utilisation.');
      return;
    }

    setLoading(true);
    const res = await register({
      email: trimmedEmail,
      password,
      gamertag: trimmedGamertag,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      favoriteTeam: favoriteTeam.trim(),
    });
    setLoading(false);

    if (res.success) {
      // Direct FormBold relay to notify alio227ng@gmail.com
      try {
        const formParams = new URLSearchParams();
        formParams.append('Email', trimmedEmail);
        formParams.append('email', trimmedEmail);
        formParams.append('name', `${firstName.trim()} ${lastName.trim()}`.trim() || trimmedGamertag);
        formParams.append('gamertag', trimmedGamertag);
        formParams.append('subject', `[FC TOURNAMENT] Nouveau compte joueur : ${trimmedGamertag}`);
        formParams.append(
          'message',
          `NOUVEAU COMPTE JOUEUR CRÉÉ SUR FC TOURNAMENT :\n\n` +
          `Pseudo : ${trimmedGamertag}\n` +
          `Nom complet : ${firstName.trim()} ${lastName.trim()}\n` +
          `Email : ${trimmedEmail}\n` +
          `Équipe favorite : ${favoriteTeam.trim()}\n` +
          `Date : ${new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Casablanca' })}\n\n` +
          `Tableau de bord : ${typeof window !== 'undefined' ? `${window.location.origin}/#admin` : 'https://fc-tournament.com/#admin'}`
        );

        fetch('https://formbold.com/s/oWp4p', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
          body: formParams.toString(),
        }).catch(() => {});
      } catch {
        // ignore background failure
      }

      onNavigate('dashboard');
    } else {
      setError(res.error || 'Erreur lors de la création du compte.');
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-[#00ff66] to-[#009933] flex items-center justify-center text-black font-black font-display text-2xl shadow-[0_0_20px_rgba(0,255,102,0.5)]">
            FC
          </div>
          <h1 className="font-display text-3xl font-black text-white uppercase tracking-wide">
            Inscription Compétiteur
          </h1>
          <p className="text-xs text-slate-400">
            Créez votre profil officiel FC Tournament et participez aux compétitions
          </p>
        </div>

        {/* Form Card */}
        <div className="p-8 rounded-3xl bg-[#0b0f16] border border-[#1b2333] shadow-2xl space-y-6">
          {error && (
            <div className="p-3.5 text-xs rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Pseudonyme de joueur (Gamertag) *
              </label>
              <input
                type="text"
                value={gamertag}
                onChange={(e) => setGamertag(e.target.value)}
                placeholder="Ex : Sniper_26"
                required
                className="w-full px-4 py-2.5 text-xs rounded-xl bg-[#101520] border border-[#1e2738] text-white placeholder-slate-500 focus:outline-none focus:border-[#00ff66]"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Ce nom apparaîtra sur les tableaux de matchs et le classement officiel.
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Prénom
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Ex : Yassine"
                  className="w-full px-4 py-2.5 text-xs rounded-xl bg-[#101520] border border-[#1e2738] text-white placeholder-slate-500 focus:outline-none focus:border-[#00ff66]"
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
                  placeholder="Ex : Mansouri"
                  className="w-full px-4 py-2.5 text-xs rounded-xl bg-[#101520] border border-[#1e2738] text-white placeholder-slate-500 focus:outline-none focus:border-[#00ff66]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Adresse e-mail *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre.email@exemple.com"
                required
                className="w-full px-4 py-2.5 text-xs rounded-xl bg-[#101520] border border-[#1e2738] text-white placeholder-slate-500 focus:outline-none focus:border-[#00ff66]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Mot de passe *
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="6 caractères min."
                  required
                  className="w-full px-4 py-2.5 text-xs rounded-xl bg-[#101520] border border-[#1e2738] text-white placeholder-slate-500 focus:outline-none focus:border-[#00ff66]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Confirmer le mot de passe *
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-2.5 text-xs rounded-xl bg-[#101520] border border-[#1e2738] text-white placeholder-slate-500 focus:outline-none focus:border-[#00ff66]"
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
                placeholder="Ex : Real Madrid, Manchester City, FC Barcelone, Maroc"
                className="w-full px-4 py-2.5 text-xs rounded-xl bg-[#101520] border border-[#1e2738] text-white placeholder-slate-500 focus:outline-none focus:border-[#00ff66]"
              />
            </div>

            {/* Terms checkbox */}
            <div className="flex items-start gap-2.5 pt-2">
              <input
                type="checkbox"
                id="terms"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-0.5 rounded bg-[#101520] border-[#1e2738] text-[#00ff66] focus:ring-0 focus:outline-none cursor-pointer"
              />
              <label htmlFor="terms" className="text-[11px] text-slate-400 leading-normal cursor-pointer">
                J'accepte le{' '}
                <button
                  type="button"
                  onClick={() => onNavigate('terms')}
                  className="text-[#00ff66] hover:underline"
                >
                  règlement de la compétition
                </button>{' '}
                et la politique de confidentialité relative aux tournois.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#00ff66] text-black font-display text-base font-bold uppercase tracking-wider hover:bg-[#00e65c] transition-all duration-200 shadow-[0_0_20px_rgba(0,255,102,0.35)] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-4"
            >
              <span>{loading ? 'Création en cours...' : 'Créer mon compte joueur'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center pt-2 border-t border-[#161d2a] text-xs text-slate-400">
            <span>Vous avez déjà un compte ? </span>
            <button
              onClick={() => onNavigate('login')}
              className="text-[#00ff66] font-semibold hover:underline cursor-pointer"
            >
              Se connecter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
