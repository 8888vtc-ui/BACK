'use client';

import React, { useState } from 'react';
import { Swords, Share2, EyeOff, Eye, Award, Clock, Users } from 'lucide-react';
import { useTranslation } from '../../i18n';
import {
  readStoredClockPreset, storeClockPreset, type MatchClockPreset,
  readStoredOpponentTier, storeOpponentTier, type OpponentTierChoice,
  storeMatchFormat, syncMatchSetupUrl,
} from '../hud/MatchFormatSelector';
import { IntermediateClubSecretsCard } from '../intermediate/IntermediateClubSecretsCard';

interface IntermediateHomePortalProps {
  readonly onFindOpponent: (matchLength?: number, clockPreset?: MatchClockPreset) => void;
  readonly onInviteFriend: () => void;
  readonly onOpenQuizzes: () => void;
}

const MATCH_PILLS: ReadonlyArray<{ id: number; labelFr: string; labelEn: string; subFr: string; subEn: string; testId: string }> = [
  { id: 3, labelFr: '3 pts', labelEn: '3 pts', subFr: 'Rapide', subEn: 'Fast', testId: 'match-format-3' },
  { id: 5, labelFr: '5 pts', labelEn: '5 pts', subFr: 'Classique Club', subEn: 'Club Classic', testId: 'match-format-5' },
  { id: 7, labelFr: '7 pts', labelEn: '7 pts', subFr: 'Tournoi', subEn: 'Tournament', testId: 'match-format-7' },
  { id: 11, labelFr: '11 pts', labelEn: '11 pts', subFr: 'Championnat', subEn: 'Championship', testId: 'match-format-11' },
  { id: 0, labelFr: 'Money Game', labelEn: 'Money Game', subFr: 'Jacoby', subEn: 'Jacoby', testId: 'match-format-money' },
];

const CLOCK_PILLS: ReadonlyArray<{ id: MatchClockPreset; labelFr: string; labelEn: string; sub: string; testId: string }> = [
  { id: 'blitz', labelFr: '⚡ Blitz', labelEn: '⚡ Blitz', sub: '3m + 8s', testId: 'clock-preset-blitz' },
  { id: 'standard', labelFr: '⏱️ Standard / Club', labelEn: '⏱️ Standard / Club', sub: '10m + 8s', testId: 'clock-preset-standard' },
  { id: 'tournament', labelFr: '🏛️ Tournoi Master', labelEn: '🏛️ Master Tourney', sub: '14m + 12s', testId: 'clock-preset-tournament' },
  { id: 'unlimited', labelFr: '∞ Sans Horloge', labelEn: '∞ No Clock', sub: 'À votre rythme', testId: 'clock-preset-unlimited' },
];

const TIER_PILLS: ReadonlyArray<{ id: OpponentTierChoice; labelFr: string; labelEn: string; testId: string }> = [
  { id: 'auto', labelFr: '🎲 Mon niveau (Auto)', labelEn: '🎲 My level (Auto)', testId: 'tier-preset-auto' },
  { id: 'beginner', labelFr: '🌱 Club (~1450 Elo)', labelEn: '🌱 Club (~1450 Elo)', testId: 'tier-preset-beginner' },
  { id: 'intermediate', labelFr: '♟️ Confirmé (~1600 Elo)', labelEn: '♟️ Confirmed (~1600 Elo)', testId: 'tier-preset-intermediate' },
  { id: 'expert', labelFr: '👑 Expert (> 1750 Elo)', labelEn: '👑 Expert (> 1750 Elo)', testId: 'tier-preset-expert' },
];

export const IntermediateHomePortal: React.FC<IntermediateHomePortalProps> = React.memo(({
  onFindOpponent,
  onInviteFriend,
}) => {
  const { locale } = useTranslation();
  const isEn = locale === 'en';

  const [selectedFormat, setSelectedFormat] = useState<number>(5);
  const [selectedClock, setSelectedClock] = useState<MatchClockPreset>(() => readStoredClockPreset());
  const [selectedTier, setSelectedTier] = useState<OpponentTierChoice>(() => readStoredOpponentTier());
  const [isPipsHidden, setIsPipsHidden] = useState<boolean>(false);

  const handleSelectFormat = (fmt: number) => {
    setSelectedFormat(fmt);
    storeMatchFormat(fmt);
  };
  const handleSelectClock = (clk: MatchClockPreset) => {
    setSelectedClock(clk);
    storeClockPreset(clk);
  };
  const handleSelectTier = (tier: OpponentTierChoice) => {
    setSelectedTier(tier);
    storeOpponentTier(tier);
  };

  const handlePlayNow = () => {
    storeMatchFormat(selectedFormat);
    storeClockPreset(selectedClock);
    storeOpponentTier(selectedTier);
    syncMatchSetupUrl(selectedFormat, selectedClock);
    onFindOpponent(selectedFormat, selectedClock);
  };

  const activeClockObj = CLOCK_PILLS.find((c) => c.id === selectedClock) ?? CLOCK_PILLS[1];

  return (
    <div data-testid="intermediate-home-portal" className="flex flex-col gap-2 w-full max-w-5xl mx-auto py-0.5 px-1">
      {/* En-tête Club Compact */}
      <div className="flex flex-col gap-0.5 text-center sm:text-left px-1">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
          <Award className="w-4 h-4 text-[#D4AF37]" strokeWidth={1.5} />
          <span>{isEn ? 'CLUB MODE · PRIORITY TO PLAY & DOUBLING CUBE' : 'MODE INTERMÉDIAIRE / CLUB · PRIORITÉ AU JEU & VIDEAU'}</span>
        </span>
        <h2 className="text-base sm:text-lg font-black text-white leading-tight">
          {isEn ? 'Sharpen your club reflexes and crush blunders' : 'Affûtez vos réflexes de club et étouffez les erreurs'}
        </h2>
      </div>

      {/* BLOC 1 — CONFIGURATION DE PARTIE (TYPE DE MATCH + HORLOGE + CALIBRE) */}
      <div className="bg-[#0B0E14]/90 border border-white/[0.08] rounded-2xl shadow-xl p-3 sm:p-3.5 flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 whitespace-nowrap shrink-0">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#D4AF37]/20 text-[#f3d27a] shrink-0">
              <Swords size={14} />
            </span>
            <h3 className="text-sm font-black text-[#fdf8eb] whitespace-nowrap">
              {isEn ? 'Play Online — Club Match Setup' : 'Jouer en Ligne — Configuration du Match'}
            </h3>
            <span
              data-testid="intermediate-matchmaking-badge"
              className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold whitespace-nowrap shrink-0"
            >
              {isEn ? '● Live Matchmaking' : '● Matchmaking Direct'}
            </span>
          </div>

          <button
            type="button" data-testid="hide-pips-toggle-btn" onClick={() => setIsPipsHidden((prev) => !prev)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border text-xs font-bold transition active:scale-95 shrink-0 whitespace-nowrap ${
              isPipsHidden ? 'bg-amber-500/20 border-amber-400 text-amber-300' : 'bg-white/[0.04] border-white/10 text-stone-300 hover:bg-white/10'
            }`}
          >
            {isPipsHidden ? <EyeOff size={13} /> : <Eye size={13} />}
            <span>{isEn ? (isPipsHidden ? 'Pips: Hidden' : 'Hide Pips') : (isPipsHidden ? 'Pips : Masqués' : 'Masquer les Pips')}</span>
          </button>
        </div>

        {/* Ligne 1 : Type de Match */}
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 shrink-0">
            {isEn ? '1. Match Format:' : '1. Type de Match :'}
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {MATCH_PILLS.map((fmt) => {
              const active = selectedFormat === fmt.id;
              return (
                <button
                  key={fmt.id} type="button" data-testid={fmt.testId} onClick={() => handleSelectFormat(fmt.id)}
                  className={`px-2.5 py-1 rounded-xl border text-xs font-bold transition active:scale-95 whitespace-nowrap ${
                    active ? 'bg-[#D4AF37]/15 text-[#f3d27a] border-[#D4AF37] shadow-sm' : 'bg-white/[0.04] border-white/10 text-stone-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span>{isEn ? fmt.labelEn : fmt.labelFr}</span>
                  <span className="ml-1 text-[11px] font-normal text-stone-400">({isEn ? fmt.subEn : fmt.subFr})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Ligne 2 : Type d'Horloge WBGF */}
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-stone-400 shrink-0">
            <Clock size={12} className="text-[#D4AF37]" />
            <span>{isEn ? '2. Clock / Cadence:' : '2. Horloge WBGF :'}</span>
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {CLOCK_PILLS.map((clk) => {
              const active = selectedClock === clk.id;
              return (
                <button
                  key={clk.id} type="button" data-testid={clk.testId} onClick={() => handleSelectClock(clk.id)}
                  className={`px-2.5 py-1 rounded-xl border text-xs font-bold transition active:scale-95 whitespace-nowrap ${
                    active ? 'bg-[#D4AF37]/15 text-[#f3d27a] border-[#D4AF37] shadow-sm' : 'bg-white/[0.04] border-white/10 text-stone-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span>{isEn ? clk.labelEn : clk.labelFr}</span>
                  <span className="ml-1 text-[11px] font-mono text-stone-400">({clk.sub})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Ligne 3 : Calibre de l'adversaire */}
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-stone-400 shrink-0">
            <Users size={12} className="text-[#D4AF37]" />
            <span>{isEn ? '3. Opponent:' : '3. Adversaire :'}</span>
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {TIER_PILLS.map((tier) => {
              const active = selectedTier === tier.id;
              return (
                <button
                  key={tier.id} type="button" data-testid={tier.testId} onClick={() => handleSelectTier(tier.id)}
                  className={`px-2.5 py-1 rounded-xl border text-xs font-bold transition active:scale-95 whitespace-nowrap ${
                    active ? 'bg-[#D4AF37]/15 text-[#f3d27a] border-[#D4AF37] shadow-sm' : 'bg-white/[0.04] border-white/10 text-stone-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {isEn ? tier.labelEn : tier.labelFr}
                </button>
              );
            })}
          </div>
        </div>

        {/* Boutons d'action : JOUER MAINTENANT (Or) & INVITER UN AMI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <button
            type="button" data-testid="intermediate-play-btn" onClick={handlePlayNow}
            className="w-full h-12 inline-flex flex-col items-center justify-center rounded-xl bg-gradient-to-r from-[#E5C158] via-[#D4AF37] to-[#B5902B] px-4 py-1.5 text-black shadow-lg hover:brightness-105 active:scale-95 transition"
          >
            <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-black uppercase tracking-wider whitespace-nowrap">
              <Swords size={15} className="text-black shrink-0" />
              <span>{isEn ? 'FIND AN ONLINE OPPONENT (PLAY NOW) →' : '⚔️ TROUVER UN ADVERSAIRE EN LIGNE →'}</span>
            </span>
            <span className="text-[11px] font-semibold opacity-85 whitespace-nowrap">
              {selectedFormat === 0 ? 'Money Game' : `Match ${selectedFormat} pts`} • {isEn ? activeClockObj.labelEn : activeClockObj.labelFr} ({activeClockObj.sub})
            </span>
          </button>

          <button
            type="button" data-testid="intermediate-invite-btn" onClick={onInviteFriend}
            className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[0.06] hover:bg-white/[0.1] px-4 py-1.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-white transition active:scale-95 whitespace-nowrap"
          >
            <Share2 size={15} className="shrink-0" />
            <span>{isEn ? 'INVITE A FRIEND — 1-CLICK LINK (< 3S)' : 'INVITER UN AMI — LIEN 1-CLIC (< 3S)'}</span>
          </button>
        </div>
      </div>

      {/* BLOC 2 — MINI-GUIDE COMPACT : LES 4 CLÉS POUR GAGNER EN CLUB & TOURNOI */}
      <IntermediateClubSecretsCard
        isPipsHidden={isPipsHidden}
        onToggleHidePips={() => setIsPipsHidden((prev) => !prev)}
      />
    </div>
  );
});

IntermediateHomePortal.displayName = 'IntermediateHomePortal';
