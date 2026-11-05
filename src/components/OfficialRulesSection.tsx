import React from 'react';
import {
  Shield,
  Gamepad2,
  ArrowLeftRight,
  HeartHandshake,
  Cpu,
  Camera,
  AlertOctagon,
  SearchCheck,
  ClockAlert,
  AlertTriangle,
  CheckCircle2,
  FileText,
} from 'lucide-react';

interface OfficialRulesSectionProps {
  compact?: boolean;
}

export const OfficialRulesSection: React.FC<OfficialRulesSectionProps> = ({ compact = false }) => {
  const articles = [
    {
      number: 'Article 1',
      title: 'Format des matchs',
      icon: Gamepad2,
      accent: 'emerald',
      content:
        'Les rencontres se disputent en mode « Coup d’envoi », avec une durée de 5 minutes par mi-temps.',
      details: [
        'Mode officiel : Coup d’envoi',
        'Durée : 5 minutes par mi-temps',
        'Effectifs en ligne compétitifs 95',
      ],
      sanction: null,
    },
    {
      number: 'Article 2',
      title: 'Système de confrontation',
      icon: ArrowLeftRight,
      accent: 'emerald',
      content:
        'Chaque compétiteur doit affronter son adversaire lors de deux rencontres : un match aller et un match retour.',
      details: [
        'Formule Aller-Retour systématique',
        'Calcul du score cumulé sur les deux rencontres',
        'Équité domicile et extérieur garantie',
      ],
      sanction: null,
    },
    {
      number: 'Article 3',
      title: 'Fair-play et comportement',
      icon: HeartHandshake,
      accent: 'amber',
      content:
        'Le fair-play est obligatoire durant toute la compétition. Tout comportement antisportif, toute provocation excessive ou tout acte contraire à l\'esprit sportif peut entraîner la disqualification immédiate du compétiteur, après décision de l\'organisation.',
      details: [
        'Respect strict de l’adversaire et des arbitres',
        'Interdiction des pauses abusives et de l’antijeu',
      ],
      sanction: {
        type: 'warning',
        text: 'Sanction : Disqualification immédiate prononcée par l\'organisation en cas de manquement.',
      },
    },
    {
      number: 'Article 4',
      title: 'Utilisation des manettes',
      icon: Cpu,
      accent: 'emerald',
      content:
        'Les manettes peuvent être fournies par l\'organisation. Les participants sont également autorisés à utiliser leur propre manette, sous réserve d\'une vérification technique préalable et de sa validation par l\'équipe organisatrice.',
      details: [
        'Manettes fournies par l’organisation disponibles',
        'Manette personnelle autorisée après contrôle technique',
        'Interdiction stricte des manettes modifiées (macros / turbo)',
      ],
      sanction: null,
    },
    {
      number: 'Article 5',
      title: 'Transmission des résultats',
      icon: Camera,
      accent: 'emerald',
      content:
        'À l\'issue de chaque rencontre, les joueurs doivent transmettre une capture d\'écran du score final. Le résultat ne sera considéré comme officiel qu\'après vérification et validation par l\'organisation.',
      details: [
        'Capture nette de l\'écran des statistiques finales',
        'Dépôt via l\'interface dédiée ou transmission aux arbitres',
        'Homologation certifiée avant validation du score',
      ],
      sanction: null,
    },
    {
      number: 'Article 6',
      title: 'Fraude et falsification des preuves',
      icon: AlertOctagon,
      accent: 'rose',
      content:
        'Toute tentative de falsification, de manipulation ou de modification frauduleuse d\'une capture d\'écran destinée à tromper l\'organisation entraîne l\'élimination immédiate du compétiteur concerné.',
      details: [
        'Tolérance zéro envers la tricherie et le trucage',
        'Audit numérique systématique des images soumises',
      ],
      sanction: {
        type: 'danger',
        text: 'Sanction : Élimination immédiate sans appel et exclusion des compétitions futures.',
      },
    },
    {
      number: 'Article 7',
      title: 'Vérification technique des images',
      icon: SearchCheck,
      accent: 'emerald',
      content:
        'La vérification de l\'authenticité et de la conformité des captures d\'écran transmises relève exclusivement de la responsabilité de l\'équipe technique de FC Tournament.',
      details: [
        'Contrôle indépendant par l’équipe technique officielle',
        'Analyse des métadonnées, scores et pseudos affichés',
        'Décisions arbitrales souveraines et définitives',
      ],
      sanction: null,
    },
    {
      number: 'Article 8',
      title: 'Retard et absence',
      icon: ClockAlert,
      accent: 'amber',
      content:
        'Tout compétiteur accusant un retard supérieur à 10 minutes par rapport à l\'heure officielle de sa rencontre sera déclaré forfait pour le match concerné, sauf décision contraire de l\'organisation en cas de circonstance exceptionnelle.',
      details: [
        'Présence requise à l’heure précise de convocation',
        'Délai de tolérance maximum : 10 minutes',
      ],
      sanction: {
        type: 'warning',
        text: 'Sanction : Déclaré forfait automatique (+10 min de retard) avec attribution de la victoire à l’adversaire.',
      },
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      {!compact && (
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#0d121c] via-[#101726] to-[#0d121c] border border-[#1e2738] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#00ff66]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono text-[#00ff66] uppercase tracking-wider">
              <Shield className="w-4 h-4 text-[#00ff66]" />
              <span>TEXTE OFFICIEL & CADRE COMPÉTITIF CERTIFIÉ</span>
            </div>

            <h2 className="font-display text-2xl sm:text-4xl font-black text-white uppercase tracking-tight">
              RÈGLEMENT OFFICIEL DES COMPÉTITIONS
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Le présent règlement s’applique à l’ensemble des tournois et rencontres organisés sur la plateforme
              <strong className="text-white"> FC TOURNAMENT</strong>. Chaque participant s’engage à le respecter scrupuleusement dès son inscription.
            </p>
          </div>

          {/* Quick-summary metric badges */}
          <div className="mt-6 pt-5 border-t border-[#182233] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-[#090d14] border border-[#1a2335]">
              <span className="text-[10px] text-slate-400 block uppercase">Mi-temps</span>
              <span className="font-bold text-white text-sm">5 minutes</span>
            </div>
            <div className="p-3 rounded-xl bg-[#090d14] border border-[#1a2335]">
              <span className="text-[10px] text-slate-400 block uppercase">Confrontation</span>
              <span className="font-bold text-[#00ff66] text-sm">Aller-Retour</span>
            </div>
            <div className="p-3 rounded-xl bg-[#090d14] border border-[#1a2335]">
              <span className="text-[10px] text-slate-400 block uppercase">Tolérance retard</span>
              <span className="font-bold text-amber-400 text-sm">10 min max</span>
            </div>
            <div className="p-3 rounded-xl bg-[#090d14] border border-[#1a2335]">
              <span className="text-[10px] text-slate-400 block uppercase">Preuve de score</span>
              <span className="font-bold text-white text-sm">Capture requise</span>
            </div>
          </div>
        </div>
      )}

      {/* Grid of Articles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        {articles.map((art) => {
          const Icon = art.icon;
          const isDanger = art.accent === 'rose';
          const isWarning = art.accent === 'amber';

          return (
            <div
              key={art.number}
              className={`p-6 sm:p-7 rounded-3xl bg-[#0c1017] border transition-all duration-200 flex flex-col justify-between shadow-xl ${
                isDanger
                  ? 'border-rose-500/30 hover:border-rose-500/50 hover:shadow-[0_0_25px_rgba(244,63,94,0.15)]'
                  : isWarning
                  ? 'border-amber-500/30 hover:border-amber-500/50 hover:shadow-[0_0_25px_rgba(245,158,11,0.12)]'
                  : 'border-[#1b2538] hover:border-[#2f3d57]'
              }`}
            >
              <div className="space-y-4">
                {/* Header: Article number & Title */}
                <div className="flex items-start justify-between gap-3 border-b border-[#161f2e] pb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                        isDanger
                          ? 'bg-rose-500/15 border-rose-500/30 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.2)]'
                          : isWarning
                          ? 'bg-amber-500/15 border-amber-500/30 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                          : 'bg-[#151d2b] border-[#222e44] text-[#00ff66]'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <div>
                      <span
                        className={`text-[11px] font-mono font-bold tracking-wider uppercase block ${
                          isDanger
                            ? 'text-rose-400'
                            : isWarning
                            ? 'text-amber-400'
                            : 'text-[#00ff66]'
                        }`}
                      >
                        {art.number}
                      </span>
                      <h3 className="font-display text-lg sm:text-xl font-bold text-white uppercase tracking-wide">
                        {art.title}
                      </h3>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-[#121824] border border-[#1e2738] text-slate-400 shrink-0 hidden sm:inline-block">
                    RÈGLEMENT FC
                  </span>
                </div>

                {/* Article Body */}
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
                  {art.content}
                </p>

                {/* Key Bullet Points */}
                {art.details && art.details.length > 0 && (
                  <ul className="space-y-1.5 pt-1">
                    {art.details.map((detail, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-xs text-slate-400">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#00ff66] shrink-0" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Sanctions Highlight (if applicable) */}
              {art.sanction && (
                <div
                  className={`mt-5 p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 ${
                    art.sanction.type === 'danger'
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                  }`}
                >
                  <AlertTriangle
                    className={`w-4 h-4 shrink-0 mt-0.5 ${
                      art.sanction.type === 'danger' ? 'text-rose-400' : 'text-amber-400'
                    }`}
                  />
                  <span className="font-semibold leading-relaxed">{art.sanction.text}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Fair-Play & Integrity Statement */}
      <div className="p-6 rounded-3xl bg-[#090d14] border border-[#1a2335] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#00ff66]/15 border border-[#00ff66]/30 flex items-center justify-center text-[#00ff66] shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-display text-base font-bold text-white uppercase">
              Acceptation et application immédiate
            </h4>
            <p className="text-xs text-slate-400">
              L'inscription à un tournoi vaut engagement solennel à respecter l'intégralité des règles ci-dessus.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-[#00ff66]">
          <CheckCircle2 className="w-4 h-4" />
          <span className="font-bold uppercase tracking-wider">Comité d'Organisation FC Tournament</span>
        </div>
      </div>
    </div>
  );
};
