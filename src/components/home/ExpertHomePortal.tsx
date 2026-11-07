'use client';

/**
 * @file src/components/home/ExpertHomePortal.tsx
 * @description Portail d'Accueil Division Expert / Pro — Épuré (Mode Elon Musk).
 * Inclut le sélecteur de Type de Match (3/5/7/9/11/21/Money) et d'Horloge WBGF (Blitz/Standard/Tournoi/Sans Horloge).
 * Strictement <= 230 lignes, 0 any, 0 métrique inventée.
 */

import React, { useState } from 'react';
import { Trophy, EyeOff, Eye, Swords, Share2, Crown, Lock, Clock } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { useAuthenticPlayerStats } from '../../hooks/useAuthenticPlayerStats';
import {
  readStoredClockPreset, storeClockPreset, type MatchClockPreset,
  storeMatchFormat, syncMatchSetupUrl,
} from '../hud/MatchFormatSelector';

interface ExpertHomePortalProps {
  readonly onStartExpertMatch: (length: number, clockPreset?: MatchClockPreset) => void;
  readonly onInviteFriend?: () => void;
  readonly onOpen3PlyQuizzes: () => void;
  readonly onOpenPlayerCard?: () => void;
}

const CLOCK_OPTIONS: ReadonlyArray<{ id: MatchClockPreset; labelFr: string; labelEn: string; sub: string; testId: string }> = [
  { id: 'blitz', labelFr: '⚡ Blitz', labelEn: '⚡ Blitz', sub: '3m + 8s', testId: 'expert-clock-blitz' },
  { id: 'standard', labelFr: '⏱️ Standard / Club', labelEn: '⏱️ Standard / Club', sub: '10m + 8s', testId: 'expert-clock-standard' },
  { id: 'tournament', labelFr: '🏛️ Tournoi Master', labelEn: '🏛️ Master Tourney', sub: '14m + 12s', testId: 'expert-clock-tournament' },
  { id: 'unlimited', labelFr: '∞ Sans Horloge', labelEn: '∞ No Clock', sub: 'Libre', testId: 'expert-clock-unlimited' },
];

export const ExpertHomePortal: React.FC<ExpertHomePortalProps> = React.memo(({
  onStartExpertMatch, onInviteFriend, onOpenPlayerCard,
}) => {
  const { locale } = useTranslation();
  const isEn = locale === 'en';
  const stats = useAuthenticPlayerStats();
  const [matchLength, setMatchLength] = useState<number>(7);
  const [clockPreset, setClockPreset] = useState<MatchClockPreset>(() => readStoredClockPreset());
  const [isPipsHidden, setIsPipsHidden] = useState<boolean>(false);

  const isGuest = !stats.canHavePR;
  const isCalibrating = stats.canHavePR && stats.gamesPlayed === 0;

  const globalVal = isGuest ? '—' : isCalibrating ? (isEn ? 'Calibrating' : 'En calibrage') : (stats.globalPR?.toFixed(1) ?? '—');
  const checkerVal = isGuest ? '—' : isCalibrating ? (isEn ? 'Calibrating' : 'En calibrage') : (stats.checkerPR?.toFixed(1) ?? '—');
  const cubeVal = isGuest ? '—' : isCalibrating ? (isEn ? 'Calibrating' : 'En calibrage') : (stats.cubePR?.toFixed(1) ?? '—');

  const globalSub = isGuest ? '' : isCalibrating ? (isEn ? '1st match required' : '1re partie requise') : `${stats.gamesPlayed} ${stats.gamesPlayed > 1 ? (isEn ? 'matches' : 'parties') : (isEn ? 'match' : 'partie')}`;
  const checkerSub = isGuest ? '' : isCalibrating ? (isEn ? '0 decision' : '0 décision') : (stats.checkerPR !== null && stats.checkerPR < 5.0 ? (isEn ? 'Master (< 5.0)' : 'Master (< 5.0)') : (isEn ? 'Checkers' : 'Pions'));
  const cubeSub = isGuest ? '' : isCalibrating ? (isEn ? '0 decision' : '0 décision') : (stats.cubePR !== null && stats.cubePR > 7.0 ? (isEn ? 'Priority' : 'Priorité') : (isEn ? 'Cube' : 'Videau'));

  const FORMATS = [
    { len: 3, label: '3 pts', testId: 'expert-format-3' },
    { len: 5, label: '5 pts', testId: 'expert-format-5' },
    { len: 7, label: '7 pts', testId: 'expert-format-7' },
    { len: 9, label: '9 pts', testId: 'expert-format-9' },
    { len: 11, label: '11 pts', testId: 'expert-format-11' },
    { len: 21, label: '21 pts', testId: 'expert-format-21' },
    { len: 0, label: isEn ? 'Money Game' : 'Money Game', testId: 'expert-format-money' },
  ];

  const handleSelectLength = (len: number) => {
    setMatchLength(len);
    storeMatchFormat(len);
  };
  const handleSelectClock = (clk: MatchClockPreset) => {
    setClockPreset(clk);
    storeClockPreset(clk);
  };
  const handleLaunchMatch = () => {
    storeMatchFormat(matchLength);
    storeClockPreset(clockPreset);
    syncMatchSetupUrl(matchLength, clockPreset);
    onStartExpertMatch(matchLength, clockPreset);
  };

  return (
    <div data-testid="expert-home-portal" className="flex flex-col gap-2.5 w-full max-w-5xl mx-auto py-0.5">
      {/* COUPE 1 : En-tête sobre */}
      <div className="flex flex-col gap-0.5 px-1 text-center sm:text-left">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-[#D4AF37]">
          <Crown className="w-3.5 h-3.5 text-[#D4AF37]" strokeWidth={1.5} />
          <span>{isEn ? 'EXPERT / PRO MODE • OPEN SAGE 3-PLY' : 'MODE EXPERT / PRO • OPEN SAGE 3-PLY'}</span>
        </span>
        <h2 className="text-base sm:text-lg font-black text-[#f7f3e8] leading-tight">
          {isEn ? '3-Ply Competition & Telemetry' : 'Compétition & Télémétrie 3-Ply'}
        </h2>
      </div>

      {/* COUPE 2 : CARTE CENTRALE ÉPURÉE « JOUER UN MATCH OFFICIEL » */}
      <div className="bg-[#0B0E14]/90 border border-white/[0.08] rounded-2xl shadow-xl p-3.5 sm:p-4 flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 whitespace-nowrap shrink-0">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#D4AF37]/20 text-[#f3d27a] shrink-0">
              <Trophy size={15} />
            </span>
            <h3 className="text-sm sm:text-base font-black text-[#fdf8eb] whitespace-nowrap">
              {isEn ? 'Play an Official Match' : 'Jouer un Match Officiel'}
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold whitespace-nowrap shrink-0">
              ● {isEn ? 'Tournament Matchmaking' : 'Matchmaking Tournoi'}
            </span>
          </div>

          <button
            type="button" data-testid="expert-hide-pips-btn" onClick={() => setIsPipsHidden((prev) => !prev)}
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
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
            {FORMATS.map((fmt) => (
              <button
                key={fmt.len} type="button" data-testid={fmt.testId} onClick={() => handleSelectLength(fmt.len)}
                className={`px-2.5 py-1 rounded-xl border text-xs font-bold font-mono transition active:scale-95 whitespace-nowrap ${
                  matchLength === fmt.len
                    ? 'bg-[#D4AF37]/15 text-[#f3d27a] border-[#D4AF37] font-bold shadow-sm'
                    : 'bg-white/[0.03] text-zinc-300 border-white/10 hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                {fmt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Ligne 2 : Cadence / Horloge WBGF */}
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-stone-400 shrink-0">
            <Clock size={12} className="text-[#D4AF37]" />
            <span>{isEn ? '2. Clock / Cadence WBGF:' : '2. Horloge / Cadence WBGF :'}</span>
          </span>
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
            {CLOCK_OPTIONS.map((clk) => {
              const active = clockPreset === clk.id;
              return (
                <button
                  key={clk.id} type="button" data-testid={clk.testId} onClick={() => handleSelectClock(clk.id)}
                  className={`px-2.5 py-1 rounded-xl border text-xs font-bold transition active:scale-95 whitespace-nowrap ${
                    active
                      ? 'bg-[#D4AF37]/15 text-[#f3d27a] border-[#D4AF37] shadow-sm'
                      : 'bg-white/[0.03] text-zinc-300 border-white/10 hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  <span>{isEn ? clk.labelEn : clk.labelFr}</span>
                  <span className="ml-1 text-[11px] font-mono text-stone-400">({clk.sub})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2 Boutons d'action côte à côte même hauteur h-12 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
          <button
            type="button" data-testid="expert-play-btn" onClick={handleLaunchMatch}
            className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#E5C158] via-[#D4AF37] to-[#B5902B] px-4 text-xs sm:text-sm font-black uppercase tracking-wider text-black shadow-lg hover:brightness-105 active:scale-95 transition whitespace-nowrap"
          >
            <Swords className="w-4 h-4 text-black shrink-0" strokeWidth={1.75} />
            <span>{isEn ? 'FIND AN OPPONENT (OFFICIAL MATCH) →' : '⚔️ TROUVER UN ADVERSAIRE →'}</span>
          </button>
          <button
            type="button" data-testid="expert-invite-btn" onClick={onInviteFriend ?? (() => {})}
            className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-xs sm:text-sm font-bold text-zinc-200 hover:bg-white/[0.08] hover:text-white active:scale-95 transition whitespace-nowrap"
          >
            <Share2 className="w-4 h-4 text-[#D4AF37] shrink-0" strokeWidth={1.5} />
            <span>{isEn ? 'Invite a Friend (1-Click)' : 'Inviter un Ami (Lien 1-Clic)'}</span>
          </button>
        </div>
      </div>

      {/* COUPE 3 : CARTE INFÉRIEURE COMPACTE (3 COLONNES HORLOGÈRES SOBRES) */}
      <div data-testid="decomposed-pr-panel" className="rounded-2xl border border-white/[0.08] bg-[#0B0E14]/90 p-3 sm:p-3.5 shadow-xl text-white flex flex-col gap-2">
        <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
          <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-stone-300">
            {isEn ? '3-Ply Performance Breakdown' : 'Bilan de Performance 3-Ply'}
          </h3>
          <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono font-bold">
            {isEn ? 'TARGET PR < 6.0' : 'PR CIBLE < 6.0'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 text-center flex flex-col items-center">
            <span className="text-[11px] font-mono font-bold text-stone-400">{isEn ? 'OVERALL PR' : 'PR GLOBAL'}</span>
            <span data-testid="pr-global-val" className="font-mono font-black text-base sm:text-lg text-[#f3d27a] my-0.5">{globalVal}</span>
            {globalSub && <span className="text-[11px] text-stone-400">{globalSub}</span>}
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 text-center flex flex-col items-center">
            <span className="text-[11px] font-mono font-bold text-stone-400">{isEn ? 'CHECKER PR' : 'PR PIONS'}</span>
            <span data-testid="pr-checker-val" className="font-mono font-black text-base sm:text-lg text-emerald-400 my-0.5">{checkerVal}</span>
            {checkerSub && <span className="text-[11px] text-emerald-400/90 font-medium">{checkerSub}</span>}
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 text-center flex flex-col items-center">
            <span className="text-[11px] font-mono font-bold text-stone-400">{isEn ? 'CUBE PR' : 'PR VIDEAU'}</span>
            <span data-testid="pr-cube-val" className="font-mono font-black text-base sm:text-lg text-amber-300 my-0.5">{cubeVal}</span>
            {cubeSub && <span className="text-[11px] text-amber-400/90 font-medium">{cubeSub}</span>}
          </div>
        </div>

        {isGuest && (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <span className="text-stone-300 text-center sm:text-left">
              {isEn
                ? 'Activate your Player Passport (free, 5s) to unlock your 3-Ply PR and Elo rating.'
                : 'Activez votre Passeport Joueur (gratuit, 5s) pour débloquer votre PR 3-Ply et votre Elo.'}
            </span>
            <button
              type="button" data-testid="expert-create-card-cta" onClick={onOpenPlayerCard}
              className="inline-flex items-center gap-1.5 font-bold text-[#D4AF37] hover:text-[#F3E5AB] hover:underline whitespace-nowrap shrink-0 transition"
            >
              <Lock className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>{isEn ? 'Activate my Passport →' : 'Activer mon Passeport →'}</span>
            </button>
          </div>
        )}

        {isCalibrating && (
          <button
            type="button" data-testid="expert-start-calibration-cta" onClick={handleLaunchMatch}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 px-4 py-2 text-xs sm:text-sm font-bold text-amber-200 transition active:scale-95"
          >
            <span>{isEn ? 'Play my 1st calibration match →' : 'Lancer ma 1re partie de calibrage →'}</span>
          </button>
        )}
      </div>
    </div>
  );
});

ExpertHomePortal.displayName = 'ExpertHomePortal';
