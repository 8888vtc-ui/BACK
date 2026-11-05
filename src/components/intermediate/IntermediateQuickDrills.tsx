'use client';

import React, { useState } from 'react';
import { Target, CheckCircle2, XCircle, ArrowRight, Flame, Brain, Award } from 'lucide-react';
import { useTranslation } from '../../i18n';

export interface IntermediateQuickDrillsProps {
  onOpenNPlus1Bank?: () => void;
  onOpenBlunders?: () => void;
}

interface DrillItem {
  id: number;
  titleFr: string;
  titleEn: string;
  contextFr: string;
  contextEn: string;
  questionFr: string;
  questionEn: string;
  optionsFr: string[];
  optionsEn: string[];
  correctIndex: number;
  explanationFr: string;
  explanationEn: string;
}

const DRILLS: DrillItem[] = [
  {
    id: 1,
    titleFr: 'Quiz #1 : Le Timing du Videau',
    titleEn: 'Quiz #1: Doubling Cube Timing',
    contextFr: 'Match en 5 points, score 1-1. Vous avez fermé la case 5 adverse et l’adversaire a un pion sur la barre.',
    contextEn: '5-point match, score 1-1. You made opponent 5-point and they have a checker on the bar.',
    questionFr: 'Quelle est la décision optimale avant de jeter vos dés ?',
    questionEn: 'What is the optimal cube decision before rolling your dice?',
    optionsFr: ['Lancer les dés sans doubler', 'Doubler maintenant (Envoyer le videau)', 'Attendre de sortir un pion'],
    optionsEn: ['Roll dice without doubling', 'Double now (Send the cube)', 'Wait to bear off a checker'],
    correctIndex: 1,
    explanationFr: 'Votre avantage est massif mais l’adversaire peut encore hésiter ou faire un mauvais calcul. Attendre un tour de plus donnerait un refus évident (Pass) et vous ferait perdre 1 point !',
    explanationEn: 'Your lead is dominant but opponent might still miscalculate. Waiting one more roll makes it an obvious drop (Pass), losing you 1 full point!',
  },
  {
    id: 2,
    titleFr: 'Quiz #2 : Pions Isolés & Calcul sur 36',
    titleEn: 'Quiz #2: Blots & Odds on 36 Rolls',
    contextFr: 'L’adversaire a un pion en case 20. Vous devez choisir votre coup après avoir lancé 5-2.',
    contextEn: 'Opponent has a checker on point 20. You must choose your play with 5-2.',
    questionFr: 'Quel coup garantit la meilleure sécurité statistique ?',
    questionEn: 'Which play ensures superior statistical safety?',
    optionsFr: ['Fermer une porte intérieure (3 tirs sur 36)', 'Laisser deux pions isolés en case 9 et 11 (17 tirs sur 36)', 'Courir en case 15 sans soutien'],
    optionsEn: ['Make an inner board gate (3 shots out of 36)', 'Leave two blots on 9 and 11 (17 shots out of 36)', 'Run out to point 15 with no support'],
    correctIndex: 0,
    explanationFr: 'Laisser 17 tirs sur 36 offre quasiment 50 % de chances de frappe à l’adversaire. Fermer la porte réduit le risque à 3/36 (8,3 %) tout en consolidant votre maison.',
    explanationEn: 'Leaving 17 shots gives opponent nearly a 50% hit chance. Making the gate shrinks danger to 3/36 (8.3%) while building your inner board.',
  },
  {
    id: 3,
    titleFr: 'Quiz #3 : Compter sans Pips & Choisir le Plan',
    titleEn: 'Quiz #3: Count Without Pips & Pick Game Plan',
    contextFr: 'En observant le plateau, vous avez 14 pips d’avance nette et une ancre adverse en case 20.',
    contextEn: 'Observing the board, you hold a 14-pip clear lead with an anchor on point 20.',
    questionFr: 'Quel plan de jeu devez-vous adopter immédiatement ?',
    questionEn: 'Which game plan should you adopt right away?',
    optionsFr: ['Rompre le contact et passer en Course pure (Race)', 'Chercher la bagarre et frapper à tout prix', 'Construire un Backgame lent'],
    optionsEn: ['Break contact and switch to Pure Race', 'Pick a fight and hit at all costs', 'Build a slow Backgame'],
    correctIndex: 0,
    explanationFr: 'Avec 14 pips d’avance, chaque pion frappé remet le hasard en jeu. La règle d’or en avance nette est : rompre le contact, sécuriser les dames et courir vers la victoire !',
    explanationEn: 'With a 14-pip lead, every hit injects variance. The golden club rule when ahead: break contact, bring checkers home and run to victory!',
  },
];

export function IntermediateQuickDrills({ onOpenNPlus1Bank, onOpenBlunders }: IntermediateQuickDrillsProps) {
  const { locale } = useTranslation();
  const lang = locale === 'en' ? 'en' : 'fr';
  const [selectedDrillIndex, setSelectedDrillIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});

  const drill = DRILLS[selectedDrillIndex];
  const userAnswer = selectedAnswers[drill.id];
  const isAnswered = userAnswer !== undefined;
  const isCorrect = userAnswer === drill.correctIndex;

  const handleSelectAnswer = (idx: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [drill.id]: idx }));
  };

  return (
    <div
      data-testid="intermediate-quick-drills"
      className="w-full rounded-2xl border border-white/10 bg-[#0e121a]/90 p-4 sm:p-5 shadow-xl text-white"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300">
            <Target className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-sm sm:text-base font-black text-[#fdf8eb]">
              {lang === 'fr' ? '3 Quiz Flash Spécial Intermédiaire (Club)' : '3 Club Flash Quizzes (Intermediate)'}
            </h3>
            <p className="text-[11px] text-stone-300">
              {lang === 'fr'
                ? 'Testez en 30 secondes vos réflexes sur le Videau, les Pions Isolés et le Comptage sans Pips.'
                : 'Test your reflexes in 30s on Doubling Cube, Blots, and Pip-Free Counting.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-center">
          {onOpenNPlus1Bank && (
            <button
              type="button"
              data-testid="intermediate-nplus1-btn"
              onClick={onOpenNPlus1Bank}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/15 text-[#F3E5AB] text-xs font-bold hover:bg-[#D4AF37]/25 transition"
            >
              <Brain className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{lang === 'fr' ? 'Banque N+1' : 'N+1 Bank'}</span>
            </button>
          )}

          {onOpenBlunders && (
            <button
              type="button"
              data-testid="intermediate-blunders-btn"
              onClick={onOpenBlunders}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-red-500/40 bg-red-500/15 text-red-200 text-xs font-bold hover:bg-red-500/25 transition"
            >
              <Flame className="w-3.5 h-3.5 text-red-400" />
              <span>{lang === 'fr' ? 'Mes Blunders' : 'My Blunders'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Onglets des 3 quiz */}
      <div className="flex items-center gap-2 my-3">
        {DRILLS.map((d, idx) => (
          <button
            key={d.id}
            type="button"
            data-testid={`intermediate-quiz-${d.id}`}
            onClick={() => setSelectedDrillIndex(idx)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition ${
              idx === selectedDrillIndex
                ? 'bg-[#D4AF37] border-[#F3E5AB] text-slate-950 font-black shadow'
                : 'bg-white/[0.04] border-white/10 text-stone-300 hover:bg-white/10'
            }`}
          >
            {lang === 'fr' ? d.titleFr : d.titleEn}
          </button>
        ))}
      </div>

      {/* Corps du quiz actif */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5 space-y-3">
        <div className="text-xs text-amber-200/90 font-medium">
          {lang === 'fr' ? drill.contextFr : drill.contextEn}
        </div>

        <div className="text-xs sm:text-sm font-black text-white">
          {lang === 'fr' ? drill.questionFr : drill.questionEn}
        </div>

        {/* Options de réponse */}
        <div className="grid grid-cols-1 gap-2">
          {(lang === 'fr' ? drill.optionsFr : drill.optionsEn).map((opt, i) => {
            const isChosen = userAnswer === i;
            return (
              <button
                key={i}
                type="button"
                data-testid={`drill-option-${drill.id}-${i}`}
                onClick={() => handleSelectAnswer(i)}
                className={`flex items-center justify-between p-2.5 rounded-xl border text-left text-xs font-semibold transition active:scale-95 ${
                  isChosen
                    ? i === drill.correctIndex
                      ? 'bg-emerald-950/70 border-emerald-400 text-emerald-100'
                      : 'bg-red-950/70 border-red-400 text-red-100'
                    : 'bg-white/[0.03] border-white/10 text-stone-200 hover:bg-white/[0.07]'
                }`}
              >
                <span>{opt}</span>
                {isChosen && (
                  <span>
                    {i === drill.correctIndex ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                    )}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Feedback explicatif immédiat */}
        {isAnswered && (
          <div
            data-testid="drill-feedback-box"
            className={`p-3 rounded-xl border text-xs leading-relaxed animate-in fade-in ${
              isCorrect
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
            }`}
          >
            <div className="font-bold flex items-center gap-1.5 mb-1">
              {isCorrect ? (
                <>
                  <Award className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{lang === 'fr' ? '✅ Coup Optimal de Club !' : '✅ Optimal Club Play!'}</span>
                </>
              ) : (
                <>
                  <XCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>{lang === 'fr' ? '⚠️ Piège typique d’intermédiaire :' : '⚠️ Typical Intermediate Trap:'}</span>
                </>
              )}
            </div>
            <p>{lang === 'fr' ? drill.explanationFr : drill.explanationEn}</p>
          </div>
        )}
      </div>
    </div>
  );
}

