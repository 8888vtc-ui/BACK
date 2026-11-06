'use client';

/**
 * @file src/components/academy/AcademyBeginnerView.tsx
 * @description Vue 100 % visuelle et pratique de l'Académie pour les joueurs DÉBUTANT.
 * Zéro théorie abstraite, zéro formule mathématique, 2 studios interactifs sur vrai plateau.
 * Strictement <= 260 lignes, 0 `any`.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, Shield, Zap, Trophy, Volume2 } from 'lucide-react';
import { AcademyVisualBoardLesson } from '../beginner/AcademyVisualBoardLesson';
import { OpeningVisualBoard } from '../beginner/OpeningVisualBoard';
import {
  OPENING_MOVES,
  COACH_GATE_EXPLANATION_FR,
  COACH_GATE_EXPLANATION_EN,
  COACH_RUNNING_EXPLANATION_FR,
  COACH_RUNNING_EXPLANATION_EN,
  COACH_BUILDING_EXPLANATION_FR,
  COACH_BUILDING_EXPLANATION_EN,
} from '../../data/beginnerOpeningMovesData';

interface AcademyBeginnerViewProps {
  readonly isEn: boolean;
}

interface RuleItem {
  id: number;
  quizId: number;
  labelFr: string;
  labelEn: string;
  descFr: string;
  descEn: string;
}

const RULES: readonly RuleItem[] = [
  {
    id: 1, quizId: 1,
    labelFr: '1. Le Sens de Marche', labelEn: '1. Direction of Play',
    descFr: 'Vos 15 pions cheminent en fer à cheval jusqu\'à Votre Maison d\'arrivée.',
    descEn: 'All 15 checkers travel in a horseshoe path to reach Your Home.',
  },
  {
    id: 2, quizId: 3,
    labelFr: '2. Faire une Porte (Bouclier)', labelEn: '2. Make a Gate (Shield)',
    descFr: '2 pions ou plus ensemble forment une porte : un bouclier imprenable.',
    descEn: '2 or more checkers together make an impenetrable protective gate.',
  },
  {
    id: 3, quizId: 5,
    labelFr: '3. Frapper un Pion Seul', labelEn: '3. Hit a Lone Blot',
    descFr: 'Un pion adverse isolé est expulsé sur la Barre centrale.',
    descEn: 'An isolated opponent checker is hit and sent to the central Bar.',
  },
  {
    id: 4, quizId: 2,
    labelFr: '4. Sortir ses 15 Dames', labelEn: '4. Bear Off 15 Checkers',
    descFr: 'Quand les 15 pions sont à la Maison, le premier qui les sort gagne !',
    descEn: 'When all 15 checkers are home, the first to bear off wins the game!',
  },
  {
    id: 5, quizId: 10,
    labelFr: '5. Le Dé Multiplicateur (x2)', labelEn: '5. Doubling Cube (x2)',
    descFr: 'Doublez la mise de la manche quand votre stratégie prend l\'avantage.',
    descEn: 'Double match stakes before rolling when strategy gives you the edge.',
  },
];

export const AcademyBeginnerView: React.FC<AcademyBeginnerViewProps> = React.memo(({ isEn }) => {
  const [selectedRuleId, setSelectedRuleId] = useState<number>(1);
  const [selectedRollIndex, setSelectedRollIndex] = useState<number>(0);

  const activeRule = RULES.find(r => r.id === selectedRuleId) ?? RULES[0];
  const activeMove = OPENING_MOVES[selectedRollIndex] ?? OPENING_MOVES[0];

  const getExplanation = () => {
    if (activeMove.family === 'GATES') return isEn ? COACH_GATE_EXPLANATION_EN : COACH_GATE_EXPLANATION_FR;
    if (activeMove.family === 'RUNNING') return isEn ? COACH_RUNNING_EXPLANATION_EN : COACH_RUNNING_EXPLANATION_FR;
    return isEn ? COACH_BUILDING_EXPLANATION_EN : COACH_BUILDING_EXPLANATION_FR;
  };

  const speakExplanation = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(getExplanation());
    utt.lang = isEn ? 'en-US' : 'fr-FR';
    window.speechSynthesis.speak(utt);
  };

  return (
    <div data-testid="academy-beginner-view" className="space-y-6 w-full max-w-6xl mx-auto">
      {/* En-tête bienveillant Débutant */}
      <div className="text-center space-y-1.5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isEn ? 'Beginner Portal • Visual Board Practice' : 'Portail Débutant • Entraînement Visuel sur Plateau'}</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white font-sans tracking-tight">
          {isEn ? 'Learn Backgammon Directly on the Board' : 'Apprenez le Backgammon Directement sur le Plateau'}
        </h2>
        <p className="text-xs sm:text-sm text-neutral-300 max-w-2xl mx-auto">
          {isEn
            ? 'Zero abstract formulas or point numbers: click on the board to watch the golden checkers and rules in action.'
            : 'Zéro formule mathématique ni numéro abstrait : cliquez sur le plateau pour voir les déplacements et les boucliers dorés en action.'}
        </p>
      </div>

      {/* GRILLE 2 STUDIOS INTERACTIFS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* STUDIO 1 : LE PLATEAU INTERACTIF DES RÈGLES */}
        <section
          data-testid="beginner-rules-studio"
          className="rounded-2xl border border-white/10 bg-[#0B1015]/95 p-4 sm:p-5 shadow-2xl space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">
                {isEn ? 'Studio 1 • Visual Rules' : 'Studio 1 • Les Règles Essentielles'}
              </span>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#D4AF37]" />
                {isEn ? 'Interactive Board: 5 Golden Situations' : 'Plateau Interactif : Les 5 Situations Clés'}
              </h3>
            </div>
          </div>

          {/* Sélecteur des 5 règles en pilules */}
          <div className="flex flex-wrap gap-1.5">
            {RULES.map(r => (
              <button
                key={r.id}
                type="button"
                data-testid={`rule-pill-${r.id}`}
                onClick={() => setSelectedRuleId(r.id)}
                className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition ${
                  selectedRuleId === r.id
                    ? 'bg-white/10 text-[#D4AF37] border-[#D4AF37]/50 shadow-sm'
                    : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10'
                }`}
              >
                {isEn ? r.labelEn : r.labelFr}
              </button>
            ))}
          </div>

          {/* Plateau visuel dynamique SVG */}
          <AcademyVisualBoardLesson quizId={activeRule.quizId} isEn={isEn} />

          {/* Explication en langage naturel */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-xs sm:text-sm text-neutral-200">
            {isEn ? activeRule.descEn : activeRule.descFr}
          </div>

          {/* Bouton direct vers les 10 défis (Unique bouton plein Or) */}
          <Link
            href="/puzzles?mode=beginner-academy"
            data-testid="beginner-launch-challenges-btn"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-b from-[#E5C158] via-[#D4AF37] to-[#B5902B] text-black font-bold text-xs sm:text-sm uppercase tracking-wider shadow-lg hover:brightness-105 active:scale-95 transition"
          >
            <span>{isEn ? 'Play 10 Board Challenges (+2,000 PTS) →' : 'Jouer les 10 Défis sur le Plateau (+2 000 PTS) →'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>

        {/* STUDIO 2 : SIMULATEUR DES 15 COUPS D'OUVERTURE */}
        <section
          data-testid="beginner-openings-studio"
          className="rounded-2xl border border-white/10 bg-[#0B1015]/95 p-4 sm:p-5 shadow-2xl space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">
                {isEn ? 'Studio 2 • 15 Opening Rolls' : 'Studio 2 • 15 Coups d\'Ouverture'}
              </span>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#D4AF37]" />
                {isEn ? 'Visual Opening Simulator' : 'Simulateur Visuel d\'Ouverture'}
              </h3>
            </div>
            <button
              type="button"
              onClick={speakExplanation}
              title={isEn ? 'Listen to coach voice' : 'Écouter le conseil vocal'}
              className="p-2 rounded-xl bg-white/5 border border-white/15 text-[#D4AF37] hover:bg-white/10 transition"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>

          {/* Grille des 15 dés cliquables */}
          <div className="grid grid-cols-5 gap-1.5">
            {OPENING_MOVES.map((m, idx) => (
              <button
                key={m.id}
                type="button"
                data-testid={`opening-pill-${m.id}`}
                onClick={() => setSelectedRollIndex(idx)}
                className={`py-1.5 px-2 rounded-lg border text-xs font-mono font-bold transition ${
                  selectedRollIndex === idx
                    ? 'bg-white/10 text-[#D4AF37] border-[#D4AF37]/50 shadow-sm'
                    : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10'
                }`}
              >
                {m.id}
              </button>
            ))}
          </div>

          {/* Plateau visuel sans notation chiffrée */}
          <OpeningVisualBoard
            moveFromTo={activeMove.moveFromTo}
            isGate={activeMove.family === 'GATES'}
            isEn={isEn}
          />

          {/* Conseil du Professeur */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
            <span className="text-[11px] font-bold text-[#D4AF37] uppercase tracking-wide">
              {isEn ? activeMove.titleEn : activeMove.titleFr}
            </span>
            <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed">
              {getExplanation()}
            </p>
          </div>

          {/* Bouton direct vers la partie guidée */}
          <Link
            href="/play?gate=beginner&start=guided"
            data-testid="beginner-start-guided-game-btn"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 font-bold text-xs sm:text-sm uppercase tracking-wider transition active:scale-95"
          >
            <Trophy className="w-4 h-4" />
            <span>{isEn ? 'Practice Guided Match with Gentle Bot →' : 'Pratiquer en Partie Guidée contre le Bot Doux →'}</span>
          </Link>
        </section>
      </div>
    </div>
  );
});

AcademyBeginnerView.displayName = 'AcademyBeginnerView';
export default AcademyBeginnerView;
