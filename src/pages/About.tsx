import React from 'react';
import {
  Trophy,
  Users,
  CheckCircle2,
  Calendar,
  BarChart3,
  Award,
  Swords,
  Flame,
  ArrowRight,
  ShieldCheck,
  Clock,
  Wallet,
  Mail,
} from 'lucide-react';

interface AboutProps {
  onNavigate: (page: string) => void;
}

export const About: React.FC<AboutProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-[#07090e] py-14 px-4 sm:px-6 lg:px-8 text-slate-200">
      <div className="max-w-5xl mx-auto space-y-16">
        {/* ============================================================ */}
        {/* EN-TÊTE PRINCIPAL                                            */}
        {/* ============================================================ */}
        <div className="space-y-4 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#00ff66]/10 border border-[#00ff66]/30 text-xs font-mono text-[#00ff66] uppercase tracking-wider">
            <span>Plateforme Compétitive Officieuse</span>
            <span aria-hidden="true">·</span>
            <span>EA SPORTS FC</span>
          </div>

          <h1 className="font-display text-4xl sm:text-6xl font-black text-white uppercase tracking-tight">
            À propos
          </h1>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed pt-2">
            Nous sommes une plateforme indépendante spécialisée dans l’organisation, la coordination et le suivi des compétitions EA SPORTS FC. Notre objectif est de structurer et de dynamiser l’environnement compétitif en proposant un cadre organisé, transparent et accessible à l’ensemble des joueurs.
          </p>
        </div>

        {/* ============================================================ */}
        {/* SECTION : CENTRALISATION DES COMPÉTITIONS                    */}
        {/* ============================================================ */}
        <div className="p-8 sm:p-10 rounded-3xl bg-[#0b0f16] border border-[#1c2435] shadow-2xl space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#00ff66]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-3 relative z-10 max-w-3xl">
            <div className="text-xs font-mono text-[#00ff66] uppercase tracking-wider">
              Gestion & Traçabilité
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
              Centralisation des Compétitions
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              La plateforme centralise les principales informations relatives aux compétitions : inscriptions, programmation des rencontres, publication des résultats et classement des participants. Elle vise à garantir une gestion rigoureuse des activités ainsi qu'une expérience compétitive fondée sur l'équité et le respect des règles.
            </p>
          </div>

          {/* 5 modules clés de la centralisation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2 relative z-10">
            <div className="p-4 rounded-2xl bg-[#0f1420] border border-[#1a2538] space-y-2 hover:border-[#00ff66]/40 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-[#00ff66]/10 flex items-center justify-center text-[#00ff66]">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Inscriptions Simples</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Inscription fluide, validation automatique des places restantes et gestion des listes d'attente.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#0f1420] border border-[#1a2538] space-y-2 hover:border-[#00ff66]/40 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-[#00ff66]/10 flex items-center justify-center text-[#00ff66]">
                <Calendar className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Programmation des Rencontres</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Planning précis des matchs, horaires planifiés et calendriers mis à jour en temps réel.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#0f1420] border border-[#1a2538] space-y-2 hover:border-[#00ff66]/40 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-[#00ff66]/10 flex items-center justify-center text-[#00ff66]">
                <Swords className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Suivi des Matchs & Scores</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Visibilité immédiate des scores en direct, des résultats homologués et du calendrier des journées.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#0f1420] border border-[#1a2538] space-y-2 hover:border-[#00ff66]/40 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-[#00ff66]/10 flex items-center justify-center text-[#00ff66]">
                <Award className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Publication des Résultats</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Validation transparente des scores finaux avec conformité stricte au règlement officiel.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#0f1420] border border-[#1a2538] space-y-2 hover:border-[#00ff66]/40 transition-colors sm:col-span-2 lg:col-span-2">
              <div className="w-8 h-8 rounded-lg bg-[#00ff66]/10 flex items-center justify-center text-[#00ff66]">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Classement des Compétiteurs</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Calcul transparent des points, bilan victoires/défaites et classement permanent pour honorer les performances régulières.
              </p>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECTION : MISSION & VALEURS ESSENTIELLES                     */}
        {/* ============================================================ */}
        <div className="space-y-8">
          <div className="space-y-3 text-center max-w-3xl mx-auto">
            <div className="text-xs font-mono text-[#00ff66] uppercase tracking-wider">
              Engagement & Communauté
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
              Promouvoir les Talents & Fédérer la Communauté
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              À travers cette initiative, nous souhaitons contribuer au développement de l’e-sport, promouvoir les talents et fédérer une communauté de joueurs autour de valeurs essentielles : professionnalisme, fair-play et esprit compétitif.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Valeur 1 : Professionnalisme */}
            <div className="p-6 rounded-2xl bg-[#0b0f16] border border-[#1c2435] space-y-3 hover:border-[#00ff66]/50 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#0f1826] border border-[#202b3e] flex items-center justify-center text-[#00ff66]">
                  <Trophy className="w-5 h-5" />
                </div>
                <h3 className="font-display text-lg font-bold text-white uppercase">
                  Professionnalisme
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Rigueur dans la gestion des plannings, respect des horaires et encadrement structuré pour chaque tournoi.
                </p>
              </div>
              <div className="pt-2 border-t border-[#161f2e] text-[11px] font-mono text-slate-400">
                01 · Organisation
              </div>
            </div>

            {/* Valeur 2 : Fair-play */}
            <div className="p-6 rounded-2xl bg-[#0b0f16] border border-[#1c2435] space-y-3 hover:border-[#00ff66]/50 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#0f1826] border border-[#202b3e] flex items-center justify-center text-[#00ff66]">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="font-display text-lg font-bold text-white uppercase">
                  Fair-play
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Respect mutuel absolu entre compétiteurs, saine camaraderie et courtoisie dans la victoire comme dans la défaite.
                </p>
              </div>
              <div className="pt-2 border-t border-[#161f2e] text-[11px] font-mono text-slate-400">
                02 · Respect
              </div>
            </div>

            {/* Valeur 3 : Esprit Compétitif */}
            <div className="p-6 rounded-2xl bg-[#0b0f16] border border-[#1c2435] space-y-3 hover:border-[#00ff66]/50 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#0f1826] border border-[#202b3e] flex items-center justify-center text-[#00ff66]">
                  <Flame className="w-5 h-5" />
                </div>
                <h3 className="font-display text-lg font-bold text-white uppercase">
                  Esprit Compétitif
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Goût du dépassement, intensité sportive, passion du jeu et recherche constante de l'excellence sur le terrain virtuel.
                </p>
              </div>
              <div className="pt-2 border-t border-[#161f2e] text-[11px] font-mono text-slate-400">
                03 · Dépassement
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECTION : GARANTIE DE VERSEMENT DES GAINS                    */}
        {/* ============================================================ */}
        <div className="p-8 sm:p-10 rounded-3xl bg-[#0b0f16] border border-[#00ff66]/30 shadow-2xl space-y-8 relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-80 h-80 bg-[#00ff66]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center gap-6 relative z-10">
            <div className="shrink-0 w-20 h-20 rounded-2xl bg-[#00ff66]/10 border border-[#00ff66]/40 flex flex-col items-center justify-center text-[#00ff66]">
              <span className="font-display text-3xl font-black leading-none">72h</span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-300 mt-1">maximum</span>
            </div>
            <div className="space-y-2 max-w-3xl">
              <h2 className="font-display text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                Vos gains, versés sous 72 heures
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Chaque prix remporté est versé au gagnant dans un délai maximum de 72 heures après la fin officielle du tournoi. C'est un engagement ferme de FC Tournament envers tous les compétiteurs.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
            <div className="p-5 rounded-2xl bg-[#0f1420] border border-[#1a2538] space-y-2">
              <div className="w-9 h-9 rounded-lg bg-[#00ff66]/10 flex items-center justify-center text-[#00ff66]">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">1. Résultats validés</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                À la fin du tournoi, l'équipe d'organisation valide le score final et le classement à partir des captures transmises par les joueurs.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#0f1420] border border-[#1a2538] space-y-2">
              <div className="w-9 h-9 rounded-lg bg-[#00ff66]/10 flex items-center justify-center text-[#00ff66]">
                <Mail className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">2. Gagnant contacté</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Le gagnant est contacté par e-mail ou WhatsApp pour confirmer son identité et le moyen de réception de son gain.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#0f1420] border border-[#1a2538] space-y-2">
              <div className="w-9 h-9 rounded-lg bg-[#00ff66]/10 flex items-center justify-center text-[#00ff66]">
                <Wallet className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">3. Versement du prix</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Le prix est versé par virement bancaire ou mobile money dans les 72 heures suivant la fin du tournoi, et les lots physiques sont remis au gagnant.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#0e131d] border border-[#1b2537] relative z-10">
            <Clock className="w-4 h-4 shrink-0 text-[#00ff66] mt-0.5" />
            <p className="text-xs text-slate-400 leading-relaxed">
              Un retard ou une question sur votre gain ? Écrivez-nous depuis la page Contact en indiquant votre pseudo et le nom du tournoi : votre demande est traitée en priorité.
            </p>
          </div>
        </div>

        {/* ============================================================ */}
        {/* CTA : REJOINDRE LES COMPÉTITIONS                             */}
        {/* ============================================================ */}
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-[#0c121d] via-[#101928] to-[#0c121d] border border-[#1d273a] text-center space-y-6">
          <div className="max-w-2xl mx-auto space-y-3">
            <h3 className="font-display text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
              Prêt à participer à nos tournois ?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Rejoignez une communauté compétitive et structurée. Consultez la programmation des prochaines rencontres et réservez votre place dès maintenant.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => onNavigate('tournaments')}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#00ff66] text-black font-display text-sm font-bold uppercase tracking-wider hover:bg-[#00e65c] transition-all shadow-[0_0_20px_rgba(0,255,102,0.35)] cursor-pointer"
            >
              <span>Voir les compétitions</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('leaderboard')}
              className="px-6 py-3.5 rounded-xl bg-[#131b27] border border-[#222e43] text-white font-display text-sm font-bold uppercase tracking-wider hover:border-[#00ff66] transition-colors cursor-pointer"
            >
              Consulter le classement
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
