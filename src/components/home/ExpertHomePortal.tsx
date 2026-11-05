'use client';

import React, { useState } from 'react';
import { Trophy, BrainCircuit, Sparkles, EyeOff, Eye, Swords, Shield, Activity } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { Cap6ErrorRateLegendCard } from '../common/Cap6ErrorRateLegendCard';
import { ExpertTelemetryDrills } from '../expert/ExpertTelemetryDrills';

interface ExpertHomePortalProps {
  readonly onStartExpertMatch: (length: number) => void;
  readonly onOpen3PlyQuizzes: () => void;
}

export const ExpertHomePortal: React.FC<ExpertHomePortalProps> = React.memo(({
  onStartExpertMatch,
  onOpen3PlyQuizzes,
}) => {
  const { locale } = useTranslation();
  const isEn = locale === 'en';

  const [matchLength, setMatchLength] = useState<number>(7);
  const [isPipsHidden, setIsPipsHidden] = useState<boolean>(false);

  const handleLaunchMatch = () => {
    onStartExpertMatch(matchLength);
  };

  return (
    <div data-testid="expert-home-portal" className="flex flex-col gap-4 w-full max-w-4xl mx-auto py-2">
      {/* En-tête Cockpit Pro avec Télémétrie */}
      <div className="rounded-2xl border border-[#d4af37]/40 bg-gradient-to-r from-[#140e08] via-[#1a120a] to-[#110d07] p-5 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-[#f3d27a]">
              {isEn ? '🏆 Expert / Pro Cockpit · Open Sage 3-Ply (PR 0.23)' : '🏆 Cockpit Expert / Pro · Moteur Open Sage 3-Ply (PR 0.23)'}
            </span>
            <span className="rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.2 text-[10px] font-mono font-bold">
              XG ROLLER++
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-[#f7f3e8]">
            {isEn ? 'World Championship Telemetry & Tournament Conditions' : 'Télémétrie de Championnat du Monde & Conditions Tournoi'}
          </h2>
          <p className="text-xs text-stone-300">
            {isEn
              ? 'Rigorous 3-ply neural lookahead, Crawford & DMP score rules, and instantaneous ΔEMG equity tracking.'
              : 'Évaluation neuronale 3-ply, règles Crawford & DMP, et télémétrie ΔEMG chirurgicale au millième.'}
          </p>
        </div>

        {/* Télémétrie Joueur Dépliée */}
        <div className="flex items-center gap-2 sm:gap-3 bg-black/50 border border-white/10 p-2.5 rounded-xl shrink-0 self-stretch sm:self-auto justify-between sm:justify-start">
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-mono text-stone-400">ER / PR</span>
            <span data-testid="expert-er-pr" className="text-sm font-black font-mono text-[#f3d27a]">
              6.3
            </span>
          </div>
          <div className="h-6 w-px bg-white/10" />
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-mono text-stone-400">ERA</span>
            <span data-testid="expert-era" className="text-sm font-black font-mono text-emerald-400">
              5.8
            </span>
          </div>
          <div className="h-6 w-px bg-white/10" />
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-mono text-stone-400">RATING</span>
            <span data-testid="expert-rating" className="text-sm font-black font-mono text-amber-300">
              1500
            </span>
          </div>
        </div>
      </div>

      {/* COCKPIT DE MATCH DE TOURNOI OFFICIEL */}
      <div className="rounded-2xl border-2 border-[#D4AF37]/50 bg-gradient-to-b from-[#18120a] via-[#100d07] to-[#0a0d13] p-5 shadow-2xl flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#D4AF37]/20 text-[#f3d27a]">
                <Trophy size={18} />
              </span>
              <h3 className="text-sm sm:text-base font-black text-[#fdf8eb]">
                {isEn ? 'Official Tournament Match Cockpit' : 'Cockpit de Match de Tournoi Officiel'}
              </h3>
            </div>
            <p className="text-xs text-stone-300 mt-0.5">
              {isEn
                ? 'Official WBGF formats with Bronstein clocks, Crawford rule, and Jacoby Money Game.'
                : 'Formats officiels WBGF avec pendules Bronstein, règle Crawford et Money Game Jacoby.'}
            </p>
          </div>

          {/* Bouton Masquer Pips */}
          <button
            type="button"
            data-testid="expert-hide-pips-btn"
            onClick={() => setIsPipsHidden((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition ${
              isPipsHidden
                ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                : 'bg-white/5 border-white/10 text-stone-300 hover:bg-white/10'
            }`}
          >
            {isPipsHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>
              {isEn
                ? isPipsHidden
                  ? 'Pip Count Hidden (Pro Tourney)'
                  : 'Hide Pip Count (Tournament)'
                : isPipsHidden
                ? 'Pip Count Masqué (Pro Tournoi)'
                : 'Conditions Tournoi (Masquer Pip Count)'}
            </span>
          </button>
        </div>

        {/* Formats de match complets : 3, 5, 7, 9, 11, 21 pts et Money */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { len: 3, label: '3 pts', testId: 'expert-format-3' },
            { len: 5, label: '5 pts', testId: 'expert-format-5' },
            { len: 7, label: '7 pts', testId: 'expert-format-7' },
            { len: 9, label: '9 pts', testId: 'expert-format-9' },
            { len: 11, label: '11 pts', testId: 'expert-format-11' },
            { len: 21, label: '21 pts', testId: 'expert-format-21' },
            { len: 0, label: isEn ? 'Money (Jacoby)' : 'Money Game', testId: 'expert-format-money' },
          ].map((fmt) => {
            const isSelected = matchLength === fmt.len;
            return (
              <button
                key={fmt.len}
                type="button"
                data-testid={fmt.testId}
                onClick={() => setMatchLength(fmt.len)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold font-mono transition active:scale-95 ${
                  isSelected
                    ? 'bg-[#D4AF37] border-[#F3E5AB] text-slate-950 font-black shadow-md'
                    : 'bg-white/[0.04] border-white/10 text-stone-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {fmt.label}
              </button>
            );
          })}
        </div>

        {/* Bouton de Lancement Match Expert */}
        <button
          type="button"
          data-testid="expert-play-btn"
          onClick={handleLaunchMatch}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#f5d98b] to-[#b88924] px-4 py-3 text-xs sm:text-sm font-black uppercase tracking-wider text-slate-950 shadow-lg hover:brightness-105 active:scale-95 transition"
        >
          <Swords size={18} className="text-slate-950" />
          <span>
            {isEn
              ? `LAUNCH ${matchLength === 0 ? 'MONEY GAME' : `${matchLength}-PT MATCH`} (OPEN SAGE 3-PLY) →`
              : `LANCER LE MATCH ${matchLength === 0 ? 'MONEY GAME' : `${matchLength} PTS`} (OPEN SAGE 3-PLY) →`}
          </span>
        </button>
      </div>

      {/* ENCART HISTORIQUE : LA FRONTIÈRE MYTHIQUE DU 6.0 ER (SNOWIE / XG) & ERA */}
      <Cap6ErrorRateLegendCard />

      {/* ENTRAÎNEMENT TÉLÉMÉTRIQUE & QUIZ EXPERT */}
      <ExpertTelemetryDrills onOpenQuizzes={onOpen3PlyQuizzes} />
    </div>
  );
});

ExpertHomePortal.displayName = 'ExpertHomePortal';
