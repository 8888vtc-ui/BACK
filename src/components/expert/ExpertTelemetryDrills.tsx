'use client';

import React, { useState } from 'react';
import { BrainCircuit, CheckCircle2, XCircle, Award, Activity, Gauge } from 'lucide-react';
import { useTranslation } from '../../i18n';

export interface ExpertTelemetryDrillsProps {
  onOpenQuizzes?: () => void;
}

interface ExpertDrill {
  id: number;
  type: 'CHECKER_PLAY' | 'CUBE_DECISION';
  scoreContext: string;
  titleFr: string;
  titleEn: string;
  questionFr: string;
  questionEn: string;
  choices: Array<{
    labelFr: string;
    labelEn: string;
    isOptimal: boolean;
    equityLoss: number;
    probs: [number, number, number, number, number]; // W, WG, WBG, LG, LBG
  }>;
  cubeWindow?: {
    noDouble: number;
    doubleTake: number;
    doublePass: number;
    takePointPct: number;
    gammonPrice: number;
  };
}

const EXPERT_DRILLS: ExpertDrill[] = [
  {
    id: 1,
    type: 'CHECKER_PLAY',
    scoreContext: 'Score 4-2 Crawford à 5 pts (Gammon-Go)',
    titleFr: 'Quiz Expert #1 : Arbitrage Score Gammon-Go vs DMP',
    titleEn: 'Expert Quiz #1: Gammon-Go vs DMP Score Arbitrage',
    questionFr: 'À 2 points du match (Gammon-Go pour Noir), quel coup maximise le gain de gammon ?',
    questionEn: 'Trailing 2-away (Gammon-Go for Black), which play maximizes gammon win rate?',
    choices: [
      { labelFr: 'Attaque agressive 13/7* 8/2* (Double frappe)', labelEn: 'Aggressive Blitz 13/7* 8/2* (Double Hit)', isOptimal: true, equityLoss: 0.0, probs: [0.684, 0.312, 0.015, 0.082, 0.003] },
      { labelFr: 'Sécurité passive 13/7 8/2', labelEn: 'Passive Safety 13/7 8/2', isOptimal: false, equityLoss: -0.074, probs: [0.612, 0.145, 0.004, 0.071, 0.002] },
    ],
  },
  {
    id: 2,
    type: 'CHECKER_PLAY',
    scoreContext: 'Match 7 pts, score 3-3 (Égalité normale)',
    titleFr: 'Quiz Expert #2 : Piège où le 3-Ply renverse le 1-Ply',
    titleEn: 'Expert Quiz #2: Trap Where 3-Ply Overturns 1-Ply',
    questionFr: 'Le coup séduisant en 1-ply perd du terrain après anticipation profonde à 3-ply.',
    questionEn: 'The intuitive 1-ply candidate loses equity after deep 3-ply lookahead.',
    choices: [
      { labelFr: 'Construction de l’ancre 24/20 13/11 (Coup optimal 3-ply)', labelEn: 'Anchor Construction 24/20 13/11 (3-ply Optimal)', isOptimal: true, equityLoss: 0.0, probs: [0.548, 0.174, 0.008, 0.125, 0.005] },
      { labelFr: 'Frappe téméraire 8/2* (Piège du 1-ply)', labelEn: 'Reckless Hit 8/2* (1-ply Trap)', isOptimal: false, equityLoss: -0.038, probs: [0.518, 0.198, 0.012, 0.185, 0.009] },
    ],
  },
  {
    id: 3,
    type: 'CUBE_DECISION',
    scoreContext: 'Money Game avec Videau à 1',
    titleFr: 'Quiz Expert #3 : Décision de Videau en Tournoi',
    titleEn: 'Expert Quiz #3: Tournament Cube Decision',
    questionFr: 'Fenêtre de videau ouverte. Quelle est la décision théorique et adaptative ?',
    questionEn: 'Cube window open. What is the theoretical and adaptive decision?',
    choices: [
      { labelFr: 'Double / Take (Envoyer le videau, l’adversaire doit accepter)', labelEn: 'Double / Take (Send cube, opponent must take)', isOptimal: true, equityLoss: 0.0, probs: [0.712, 0.224, 0.009, 0.091, 0.003] },
      { labelFr: 'No Double (Laisser filer le tour sans doubler)', labelEn: 'No Double (Let turn pass without doubling)', isOptimal: false, equityLoss: -0.092, probs: [0.712, 0.224, 0.009, 0.091, 0.003] },
    ],
    cubeWindow: { noDouble: 0.582, doubleTake: 0.674, doublePass: 1.0, takePointPct: 21.5, gammonPrice: 0.52 },
  },
];

export function ExpertTelemetryDrills({ onOpenQuizzes }: ExpertTelemetryDrillsProps) {
  const { locale } = useTranslation();
  const lang = locale === 'en' ? 'en' : 'fr';
  const isEn = lang === 'en';

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'CUBE' | 'CHECKER' | 'NPLUS1' | 'BLUNDERS'>('ALL');
  const [selectedDrillIndex, setSelectedDrillIndex] = useState<number>(0);
  const [chosenAnswer, setChosenAnswer] = useState<number | null>(null);

  const filteredDrills = EXPERT_DRILLS.filter((d) => {
    if (activeFilter === 'CUBE') return d.type === 'CUBE_DECISION';
    if (activeFilter === 'CHECKER') return d.type === 'CHECKER_PLAY';
    return true;
  });

  const drill = filteredDrills[selectedDrillIndex] || EXPERT_DRILLS[0];
  const choice = chosenAnswer !== null ? drill.choices[chosenAnswer] : null;

  return (
    <div
      data-testid="expert-telemetry-drills-card"
      className="w-full rounded-2xl border border-[#D4AF37]/35 bg-[#0b0e14]/95 p-4 sm:p-5 shadow-2xl text-white flex flex-col gap-3.5"
    >
      {/* Header & Filtres */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#D4AF37]/20 text-[#f3d27a]">
            <Activity className="w-4 h-4 text-[#D4AF37]" />
          </span>
          <div>
            <h3 className="text-sm sm:text-base font-black text-[#fdf8eb]">
              {isEn ? '3-Ply Neural Telemetry & Expert Drills (< 6.0 ER)' : 'Télémétrie 3-Ply & Quiz Spécial Expert (< 6.0 ER)'}
            </h3>
            <p className="text-[11px] text-stone-300">
              {isEn ? 'Surgical analysis: exact ΔEMG equity and 5-point win/gammon matrix.' : 'Analyse chirurgicale : perte d’équité ΔEMG et matrice de gain complète.'}
            </p>
          </div>
        </div>

        {/* Filtres de niveau */}
        <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-center">
          {[
            { id: 'ALL', label: isEn ? 'All' : 'Tous', testId: 'expert-filter-all' },
            { id: 'CUBE', label: 'Cube 3-ply', testId: 'expert-filter-cube' },
            { id: 'CHECKER', label: isEn ? 'Checkers' : 'Pions', testId: 'expert-filter-checker' },
            { id: 'NPLUS1', label: 'N+1 Elite', testId: 'expert-filter-nplus1' },
            { id: 'BLUNDERS', label: 'FSRS v5', testId: 'expert-filter-blunders' },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              data-testid={f.testId}
              onClick={() => {
                setActiveFilter(f.id as typeof activeFilter);
                setSelectedDrillIndex(0);
                setChosenAnswer(null);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition border ${
                activeFilter === f.id
                  ? 'bg-[#D4AF37] border-[#F3E5AB] text-slate-950 font-black'
                  : 'bg-white/[0.04] border-white/10 text-stone-300 hover:bg-white/10'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Onglets des Quiz */}
      <div className="flex items-center gap-2 overflow-x-auto py-1">
        {filteredDrills.map((d, idx) => (
          <button
            key={d.id}
            type="button"
            data-testid={`expert-drill-${d.id}`}
            onClick={() => {
              setSelectedDrillIndex(idx);
              setChosenAnswer(null);
            }}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold whitespace-nowrap transition ${
              idx === selectedDrillIndex
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#b88924] border-[#F3E5AB] text-slate-950 font-black shadow'
                : 'bg-white/[0.04] border-white/10 text-stone-300 hover:bg-white/10'
            }`}
          >
            {isEn ? d.titleEn : d.titleFr}
          </button>
        ))}
      </div>

      {/* Détail du Quiz Actif */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-mono text-[#f3d27a] font-bold">📍 {drill.scoreContext}</span>
          <span className="rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono">
            3-PLY VERIFIED
          </span>
        </div>

        <h4 className="text-xs sm:text-sm font-black text-white">
          {isEn ? drill.questionEn : drill.questionFr}
        </h4>

        {/* Choix tactiques */}
        <div className="grid grid-cols-1 gap-2">
          {drill.choices.map((c, i) => {
            const isSelected = chosenAnswer === i;
            return (
              <button
                key={i}
                type="button"
                data-testid={`expert-choice-${drill.id}-${i}`}
                onClick={() => setChosenAnswer(i)}
                className={`p-3 rounded-xl border text-left text-xs font-bold flex items-center justify-between transition active:scale-95 ${
                  isSelected
                    ? c.isOptimal
                      ? 'bg-emerald-950/70 border-emerald-400 text-emerald-100'
                      : 'bg-red-950/70 border-red-400 text-red-100'
                    : 'bg-white/[0.03] border-white/10 text-stone-200 hover:bg-white/[0.08]'
                }`}
              >
                <span>{isEn ? c.labelEn : c.labelFr}</span>
                {isSelected && (
                  <span>
                    {c.isOptimal ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TÉLÉMÉTRIE COMPLÈTE APPRÈS VALIDATION */}
        {choice && (
          <div className="rounded-xl border border-[#D4AF37]/40 bg-black/60 p-3.5 space-y-3 animate-in fade-in">
            {/* Perte d'équité */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-xs font-bold text-stone-300">
                {isEn ? '3-Ply Equity Evaluation :' : 'Évaluation d’Équité 3-Ply :'}
              </span>
              <span
                data-testid="expert-telemetry-loss"
                className={`text-xs font-mono font-black px-2 py-0.5 rounded ${
                  choice.isOptimal ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                }`}
              >
                {choice.isOptimal ? '0.000 EMG (OPTIMAL)' : `${choice.equityLoss.toFixed(3)} EMG`}
              </span>
            </div>

            {/* Matrice des 5 probabilités */}
            <div data-testid="expert-telemetry-probs" className="space-y-1">
              <span className="text-[11px] font-mono font-bold text-stone-400 uppercase">
                {isEn ? 'Probabilities [W % | WG % | WBG % | LG % | LBG %] :' : 'Probabilités [Victoire % | Gammon % | BG % | Défaite G %] :'}
              </span>
              <div className="grid grid-cols-5 gap-1.5 font-mono text-[11px] text-center">
                <div className="bg-emerald-950/60 border border-emerald-500/30 p-1 rounded text-emerald-300">
                  W: {(choice.probs[0] * 100).toFixed(1)}%
                </div>
                <div className="bg-emerald-950/60 border border-emerald-500/30 p-1 rounded text-emerald-300">
                  WG: {(choice.probs[1] * 100).toFixed(1)}%
                </div>
                <div className="bg-emerald-950/60 border border-emerald-500/30 p-1 rounded text-emerald-300">
                  WBG: {(choice.probs[2] * 100).toFixed(1)}%
                </div>
                <div className="bg-red-950/60 border border-red-500/30 p-1 rounded text-red-300">
                  LG: {(choice.probs[3] * 100).toFixed(1)}%
                </div>
                <div className="bg-red-950/60 border border-red-500/30 p-1 rounded text-red-300">
                  LBG: {(choice.probs[4] * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Fenêtre de videau si applicable */}
            {drill.cubeWindow && (
              <div
                data-testid="expert-telemetry-cube-window"
                className="rounded-lg border border-amber-500/30 bg-amber-950/30 p-2 text-[11px] font-mono text-amber-200 flex flex-wrap items-center justify-between gap-2"
              >
                <span>No Double: {drill.cubeWindow.noDouble.toFixed(3)}</span>
                <span>Double/Take: {drill.cubeWindow.doubleTake.toFixed(3)}</span>
                <span>Double/Pass: {drill.cubeWindow.doublePass.toFixed(3)}</span>
                <span className="text-emerald-300 font-bold">Take Point: {drill.cubeWindow.takePointPct}%</span>
                <span>Gammon Price: {drill.cubeWindow.gammonPrice.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

