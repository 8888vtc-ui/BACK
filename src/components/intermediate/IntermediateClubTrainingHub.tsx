'use client';

import React, { useState } from 'react';
import { Timer, AlertTriangle, CheckCircle2, TrendingDown, Scale, Flame } from 'lucide-react';
import { useTranslation } from '../../i18n';

export function IntermediateClubTrainingHub() {
  const { locale } = useTranslation();
  const lang = locale === 'en' ? 'en' : 'fr';
  const isEn = lang === 'en';

  // État Mini-Entraîneur Flash Course 5s
  const [raceAnswer, setRaceAnswer] = useState<'AHEAD' | 'EQUAL' | 'BEHIND' | null>(null);

  // État Journal des Fautes de Videau
  const [activeMistakeFilter, setActiveMistakeFilter] = useState<'ALL' | 'CUBE' | 'CHECKER'>('ALL');

  return (
    <div className="w-full flex flex-col gap-4">
      {/* 1. MINI-ENTRAÎNEUR FLASH : CALCUL MENTAL DE COURSE EN 5S (SANS PIPS) */}
      <div
        data-testid="mental-race-trainer-box"
        className="w-full rounded-2xl border-2 border-[#D4AF37]/40 bg-gradient-to-b from-[#141009] to-[#0b0e14] p-4 sm:p-5 shadow-xl text-white flex flex-col gap-3"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300">
              <Timer className="w-4 h-4" />
            </span>
            <div>
              <h4 className="text-sm sm:text-base font-black text-[#fdf8eb]">
                {isEn
                  ? '⏱️ 5-Second Mental Race Challenge (No Pip Counter)'
                  : '⏱️ Défi Tournoi : Estime l’écart de Pips en 5s !'}
              </h4>
              <p className="text-xs text-stone-300">
                {isEn
                  ? 'Wooden tournament board condition: use symmetry to gauge your race lead in 5 seconds.'
                  : 'Condition réelle de tournoi : utilisez la symétrie pour évaluer la course en 5 secondes.'}
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-md bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#f3d27a] font-mono text-xs font-bold">
            5s TIMER
          </span>
        </div>

        <div className="bg-white/[0.02] border border-white/10 p-3 rounded-xl flex flex-col gap-2.5">
          <p className="text-xs sm:text-sm text-stone-200 font-medium">
            {isEn
              ? 'Board situation: You have two checkers on point 13 and a closed 6-point. Opponent has 3 checkers on point 20. Where do you stand?'
              : 'Situation : Vous avez 2 pions en case 13 et une porte en case 6. L’adversaire a 3 pions en case 20. Quelle est votre position ?'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { id: 'AHEAD', label: isEn ? 'Ahead (+12 pips)' : 'En avance (+12 pips)', isCorrect: true },
              { id: 'EQUAL', label: isEn ? 'Dead Even (0 pips)' : 'Course égale (0 pips)', isCorrect: false },
              { id: 'BEHIND', label: isEn ? 'Trailing (-12 pips)' : 'En retard (-12 pips)', isCorrect: false },
            ].map((btn) => (
              <button
                key={btn.id}
                type="button"
                data-testid={`mental-race-choice-${btn.id.toLowerCase()}`}
                onClick={() => setRaceAnswer(btn.id as typeof raceAnswer)}
                className={`py-2 px-3 rounded-xl border text-xs sm:text-sm font-bold transition active:scale-95 ${
                  raceAnswer === btn.id
                    ? btn.isCorrect
                      ? 'bg-emerald-950/70 border-emerald-400 text-emerald-200'
                      : 'bg-red-950/70 border-red-400 text-red-200'
                    : 'bg-white/[0.04] border-white/10 text-stone-200 hover:bg-white/10'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {raceAnswer && (
            <div
              data-testid="mental-race-feedback"
              className="p-3 rounded-xl bg-black/40 border border-emerald-500/30 text-xs sm:text-sm text-emerald-200 animate-in fade-in"
            >
              <span className="font-bold">
                {raceAnswer === 'AHEAD'
                  ? (isEn ? '✅ Excellent calculation! ' : '✅ Calcul parfait ! ')
                  : (isEn ? 'Révélation exacte : ' : 'Révélation exacte : ')}
              </span>
              <span>
                {isEn
                  ? 'Your pips: 26 + 12 = 38. Opponent pips: 3 × 20 = 60. You lead by 22 pips! Plan: Break contact and run safely.'
                  : 'Vos pips : 26 + 12 = 38. Pips adverses : 3 × 20 = 60. Vous menez de 22 pips ! Plan : Rompre le contact et courir.'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 2. JOURNAL FLASH DES FAUTES DE VIDEAU (CUBE VS PIONS) */}
      <div
        data-testid="cube-mistakes-journal"
        className="w-full rounded-2xl border border-white/10 bg-[#0e121a]/95 p-4 sm:p-5 shadow-xl text-white flex flex-col gap-3"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/20 text-red-300">
              <TrendingDown className="w-4 h-4" />
            </span>
            <div>
              <h4 className="text-sm sm:text-base font-black text-[#fdf8eb]">
                {isEn
                  ? 'Flash Journal: Cube Mistakes vs Checker Blunders'
                  : 'Journal Flash des Fautes de Videau (Cube vs Pions)'}
              </h4>
              <p className="text-xs text-stone-300">
                {isEn
                  ? '70% of lost club points stem from Doubling Cube timing, not checker moves.'
                  : '70 % des points perdus en club proviennent du Videau, pas des déplacements de pions.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-center">
            {[
              { id: 'ALL', label: isEn ? 'All' : 'Toutes' },
              { id: 'CUBE', label: 'Videau (72%)' },
              { id: 'CHECKER', label: isEn ? 'Checkers' : 'Pions' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveMistakeFilter(f.id as typeof activeMistakeFilter)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
                  activeMistakeFilter === f.id
                    ? 'bg-[#D4AF37] border-[#F3E5AB] text-slate-950 font-black'
                    : 'bg-white/[0.04] border-white/10 text-stone-300 hover:bg-white/10'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Liste des fautes typiques de club */}
        <div className="space-y-2">
          {(activeMistakeFilter === 'ALL' || activeMistakeFilter === 'CUBE') && (
            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-start justify-between gap-2">
              <div>
                <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {isEn ? 'Missed Double (Too Late) · Cost: -0.085 EMG' : 'Double Manqué (Trop Tard) · Coût : -0.085 EMG'}
                </span>
                <p className="text-xs text-stone-200 mt-0.5">
                  {isEn
                    ? 'Position was 82% winning. Waiting 1 turn allowed opponent to drop for 1 pt instead of 2.'
                    : 'La position était gagnée à 82 %. Attendre 1 coup a permis à l’adversaire de refuser pour 1 pt au lieu de 2.'}
                </p>
              </div>
              <span className="font-mono text-xs font-bold text-red-300 bg-red-950/60 px-2 py-0.5 rounded border border-red-500/30 shrink-0">
                -1 PT
              </span>
            </div>
          )}

          {(activeMistakeFilter === 'ALL' || activeMistakeFilter === 'CUBE') && (
            <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/30 flex items-start justify-between gap-2">
              <div>
                <span className="text-xs font-black text-red-300 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5" />
                  {isEn ? 'Rash Take (< 21% Win Chances) · Cost: -0.115 EMG' : 'Prise Imprudente (< 21% Chances) · Coût : -0.115 EMG'}
                </span>
                <p className="text-xs text-stone-200 mt-0.5">
                  {isEn
                    ? 'Pride take on dead cube. Passing costs 1 pt; taking cost 2 pts in 80% of rollouts.'
                    : 'Prise d’orgueil sur videau mort. Refuser coûtait 1 pt ; accepter a coûté 2 pts dans 80 % des cas.'}
                </p>
              </div>
              <span className="font-mono text-xs font-bold text-red-300 bg-red-950/60 px-2 py-0.5 rounded border border-red-500/30 shrink-0">
                -2 PTS
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

