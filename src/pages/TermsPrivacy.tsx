import React from 'react';
import { Shield, ShieldAlert, FileText, Lock } from 'lucide-react';

interface TermsPrivacyProps {
  onNavigate: (page: string) => void;
}

export const TermsPrivacy: React.FC<TermsPrivacyProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-[#07090e] py-12 px-4 sm:px-6 lg:px-8 text-slate-200">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Header */}
        <div className="space-y-2 border-b border-[#182130] pb-6">
          <div className="text-xs font-mono text-[#00ff66] uppercase">JURIDIQUE & CONFORMITÉ</div>
          <h1 className="font-display text-4xl sm:text-5xl font-black text-white uppercase tracking-tight">
            Conditions d’Utilisation & Confidentialité
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm max-w-xl leading-relaxed">
            Règlement des compétitions FC Tournament et cadre légal conforme à la réglementation marocaine.
          </p>
        </div>

        {/* Disclaimer Highlight */}
        <div className="p-6 rounded-2xl bg-[#0e1420] border border-amber-500/30 space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <ShieldAlert className="w-5 h-5" />
            <span>Clause de Non-Affiliation avec Electronic Arts Inc.</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            FC Tournament est une initiative communautaire indépendante dédiée à l’organisation locale de tournois de football virtuel au Maroc. Cette plateforme n’est ni affiliée, ni sponsorisée, ni agréée, ni gérée par Electronic Arts Inc. ou EA SPORTS. Tous les titres, noms de jeux, marques et logos associés à EA SPORTS FC sont la propriété exclusive d’Electronic Arts Inc.
          </p>
        </div>

        {/* Section 1: Conditions d'utilisation */}
        <div className="p-8 rounded-3xl bg-[#0b0f16] border border-[#1c2435] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#18202e]">
            <div className="flex items-center gap-2.5">
              <FileText className="w-5 h-5 text-[#00ff66]" />
              <h2 className="font-display text-2xl font-bold text-white uppercase">
                1. Conditions Générales d’Utilisation & Règlement
              </h2>
            </div>
            <button
              onClick={() => onNavigate('rules')}
              className="px-3.5 py-1.5 rounded-xl bg-[#00ff66]/15 hover:bg-[#00ff66]/25 border border-[#00ff66]/40 text-[#00ff66] text-xs font-semibold transition-colors cursor-pointer self-start sm:self-center"
            >
              Voir le Règlement Officiel (8 Articles) →
            </button>
          </div>

          <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
            <div>
              <h3 className="font-bold text-white mb-1">1.1 Inscription et Compte Compétiteur</h3>
              <p>
                La création d’un compte est gratuite. Chaque joueur s’engage à fournir des informations véridiques et à choisir un pseudonyme (Gamertag) respectueux d’autrui. Tout pseudonyme injurieux, diffamatoire ou contraire aux bonnes mœurs sera immédiatement suspendu par l'administration.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-white mb-1">1.2 Fair-play et Éthique Sportive</h3>
              <p>
                Le fair-play est la règle d’or de FC Tournament. Sont formellement interdits : les comportements toxiques, le harcèlement, la déconnexion volontaire, l’usage de failles logicielles (glitches) et tout comportement antisportif. Les organisateurs se réservent le droit d’exclure tout participant manquant à ces obligations.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-white mb-1">1.3 Enregistrement et Validation des Résultats</h3>
              <p>
                La plateforme permet aux participants de soumettre leurs résultats et aux organisateurs de les enregistrer et de les valider. En cas de divergence sur un résultat, les joueurs transmettent les captures d’écran de fin de match aux organisateurs pour vérification.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-white mb-1">1.4 Dotations et Récompenses</h3>
              <p>
                Les récompenses annoncées pour chaque tournoi (en Dirhams marocains MAD ou en lots gaming) sont remises aux vainqueurs à la fin de la compétition, sous réserve du respect strict de l’ensemble des règles du tournoi.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Protection des données personnelles (Loi 09-08 Maroc) */}
        <div className="p-8 rounded-3xl bg-[#0b0f16] border border-[#1c2435] space-y-6">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#18202e]">
            <Lock className="w-5 h-5 text-[#00ff66]" />
            <h2 className="font-display text-2xl font-bold text-white uppercase">
              2. Protection des Données Personnelles (Loi marocaine n° 09-08)
            </h2>
          </div>

          <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
            <p>
              Conformément à la loi marocaine n° 09-08 relative à la protection des personnes physiques à l’égard du traitement des données à caractère personnel promulguée par le Dahir n° 1-09-15 du 22 safar 1430 (18 février 2009), vous bénéficiez d’un droit d’accès, de rectification et d’opposition sur les données vous concernant.
            </p>

            <div>
              <h3 className="font-bold text-white mb-1">2.1 Données collectées</h3>
              <p>
                Nous collectons uniquement les données strictement nécessaires au bon déroulement des compétitions : pseudonyme de joueur, adresse e-mail, prénom, nom, historique des matchs et scores. Les mots de passe sont chiffrés et salés de manière irréversible via des fonctions cryptographiques avancées côté serveur.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-white mb-1">2.2 Finalité du traitement</h3>
              <p>
                Les données sont utilisées exclusivement pour :
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 pt-1">
                <li>Gérer vos inscriptions aux tournois.</li>
                <li>Établir les tableaux de rencontres et le classement officiel des joueurs.</li>
                <li>Vous contacter en cas de modification de programme d'un match.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-white mb-1">2.3 Exercice de vos droits</h3>
              <p>
                Vous pouvez à tout moment modifier vos informations depuis l'onglet « Mon profil » de votre espace personnel ou demander la suppression définitive de votre compte en écrivant à notre délégué communautaire à l'adresse suivante : <a href="mailto:alio227ng@gmail.com" className="text-white hover:text-[#00ff66] underline font-semibold">alio227ng@gmail.com</a> ou par contact téléphonique au <a href="tel:+212681337566" className="text-white hover:text-[#00ff66] underline font-mono">+212681337566</a>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
