import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Shield, Trophy, ArrowRight, AlertCircle } from 'lucide-react';

interface LoginProps {
  onNavigate: (page: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onNavigate }) => {
  const { login, quickLoginAdmin, quickLoginPlayer } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      if (res.user?.role === 'admin' || email.toLowerCase().trim() === 'alio227ng@gmail.com' || email.toLowerCase().includes('admin')) {
        onNavigate('admin');
      } else {
        onNavigate('dashboard');
      }
    } else {
      setError(res.error || 'Erreur lors de la connexion.');
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-[#00ff66] to-[#009933] flex items-center justify-center text-black font-black font-display text-2xl shadow-[0_0_20px_rgba(0,255,102,0.5)]">
            FC
          </div>
          <h1 className="font-display text-3xl font-black text-white uppercase tracking-wide">
            Connexion Compétiteur
          </h1>
          <p className="text-xs text-slate-400">
            Accédez à votre espace joueur FC Tournament
          </p>
        </div>

        {/* Form Card */}
        <div className="p-8 rounded-3xl bg-[#0b0f16] border border-[#1b2333] shadow-2xl space-y-6">
          {error && (
            <div className="p-3 text-xs rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Adresse e-mail
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

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Mot de passe
                </label>
                <button
                  type="button"
                  onClick={() => setError("Mot de passe oublié ? Contactez l'organisation via la page Contact pour le réinitialiser.")}
                  className="text-[11px] text-slate-400 hover:text-[#00ff66]"
                >
                  Mot de passe oublié ?
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-2.5 text-xs rounded-xl bg-[#101520] border border-[#1e2738] text-white placeholder-slate-500 focus:outline-none focus:border-[#00ff66]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#00ff66] text-black font-display text-base font-bold uppercase tracking-wider hover:bg-[#00e65c] transition-all duration-200 shadow-[0_0_20px_rgba(0,255,102,0.35)] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Connexion en cours...' : 'Se connecter'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center pt-2 border-t border-[#161d2a] text-xs text-slate-400">
            <span>Vous n'avez pas encore de compte ? </span>
            <button
              onClick={() => onNavigate('register')}
              className="text-[#00ff66] font-semibold hover:underline cursor-pointer"
            >
              Créer un compte joueur
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
