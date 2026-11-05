import React from 'react';
import { Mail, Phone, ShieldCheck } from 'lucide-react';

interface FooterProps {
  onNavigate: (page: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-[#05070a] border-t border-[#151c27] text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Col 1: Brand & Mission */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-[#00ff66] flex items-center justify-center text-black font-black font-display text-base">
                FC
              </div>
              <span className="font-display text-xl font-black tracking-wider text-white">
                FC <span className="text-[#00ff66]">TOURNAMENT</span>
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-md">
              Plateforme indépendante dédiée à l’organisation et au suivi des compétitions EA SPORTS FC. Un espace rassembleur pour une communauté passionnée, des affrontements de haut niveau et une expérience compétitive fondée sur le fair-play.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-slate-400 text-xs pt-1">
              <a href="mailto:alio227ng@gmail.com" className="flex items-center gap-1.5 hover:text-[#00ff66] transition-colors">
                <Mail className="w-3.5 h-3.5 text-[#00ff66]" />
                <span>alio227ng@gmail.com</span>
              </a>
              <a href="tel:+212681337566" className="flex items-center gap-1.5 hover:text-[#00ff66] transition-colors font-mono">
                <Phone className="w-3.5 h-3.5 text-[#00ff66]" />
                <span>+212681337566</span>
              </a>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold uppercase tracking-wider text-[11px] font-mono">
              Compétitions
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onNavigate('tournaments')}
                  className="hover:text-[#00ff66] transition-colors cursor-pointer"
                >
                  Tous les tournois
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('leaderboard')}
                  className="hover:text-[#00ff66] transition-colors cursor-pointer"
                >
                  Classement général
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('results')}
                  className="hover:text-[#00ff66] transition-colors cursor-pointer"
                >
                  Résultats des matchs
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="hover:text-[#00ff66] transition-colors cursor-pointer"
                >
                  Espace joueur
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Informations & Légal */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold uppercase tracking-wider text-[11px] font-mono">
              Informations
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onNavigate('about')}
                  className="hover:text-[#00ff66] transition-colors cursor-pointer"
                >
                  À propos du projet
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('rules')}
                  className="hover:text-[#00ff66] transition-colors cursor-pointer text-slate-300 font-medium"
                >
                  Règlement officiel
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('contact')}
                  className="hover:text-[#00ff66] transition-colors cursor-pointer"
                >
                  Nous contacter
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('terms')}
                  className="hover:text-[#00ff66] transition-colors cursor-pointer"
                >
                  Conditions & Confidentialité
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer banner required by brief */}
        <div className="p-3.5 rounded-xl bg-[#090d14] border border-[#172030] flex items-start gap-3 text-[11px] text-slate-400 mb-8 leading-relaxed">
          <ShieldCheck className="w-4 h-4 text-[#00ff66] shrink-0 mt-0.5" />
          <p>
            <strong className="text-slate-200">Avertissement légal :</strong> FC Tournament est une initiative communautaire indépendante au Maroc. Cette plateforme n’est ni affiliée, ni sponsorisée, ni approuvée par Electronic Arts Inc. ou EA SPORTS. Tous les logos et marques commerciales cités appartiennent à leurs propriétaires respectifs. Protection des données personnelles conforme à la loi marocaine n° 09-08 (CNDP).
          </p>
        </div>

        {/* Bottom copyright */}
        <div className="border-t border-[#131a26] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} FC Tournament. Tous droits réservés.</p>
          <div className="flex items-center gap-4">
            <button onClick={() => onNavigate('terms')} className="hover:text-slate-300">
              Conditions d’utilisation
            </button>
            <span>·</span>
            <button onClick={() => onNavigate('terms')} className="hover:text-slate-300">
              Politique de confidentialité
            </button>
            <span>·</span>
            <span>Fuseau horaire : Africa/Casablanca</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
