import React from 'react';
import { OfficialRulesSection } from '../components/OfficialRulesSection.tsx';
import { Shield, ArrowLeft, Trophy, FileText, CheckCircle2 } from 'lucide-react';

interface RulesProps {
  onNavigate: (page: string, param?: string) => void;
}

export const Rules: React.FC<RulesProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-[#07090e] py-10 sm:py-12 px-4 sm:px-6 lg:px-8 text-slate-200">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Navigation Breadcrumb / Return */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour à l'accueil</span>
          </button>

          <button
            onClick={() => onNavigate('tournaments')}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#121824] border border-[#222e44] text-xs font-semibold text-slate-300 hover:text-[#00ff66] hover:border-[#00ff66]/40 transition-all cursor-pointer"
          >
            <Trophy className="w-3.5 h-3.5 text-[#00ff66]" />
            <span>Voir les tournois</span>
          </button>
        </div>

        {/* Main Section */}
        <OfficialRulesSection />
      </div>
    </div>
  );
};
