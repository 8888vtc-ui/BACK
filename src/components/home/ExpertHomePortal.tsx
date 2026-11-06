'use client';

/**
 * @file src/components/home/ExpertHomePortal.tsx
 * @description Portail d'Accueil Division Expert / Pro — Épuré (Mode Elon Musk).
 * Strictement <= 190 lignes, 0 any, 0 métrique inventée.
 */

import React, { useState } from 'react';
import { Trophy, EyeOff, Eye, Swords, Share2, Crown, Lock } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { useAuthenticPlayerStats } from '../../hooks/useAuthenticPlayerStats';

interface ExpertHomePortalProps {
  readonly onStartExpertMatch: (length: number) => void;
  readonly onInviteFriend?: () => void;
  readonly onOpen3PlyQuizzes: () => void;
  readonly onOpenPlayerCard?: () => void;
}

export const ExpertHomePortal: React.FC<ExpertHomePortalProps> = React.memo(({
  onStartExpertMatch, onInviteFriend, onOpenPlayerCard,
}) => {
  const { locale } = useTranslation();
  const isEn = locale === 'en';
  const stats = useAuthenticPlayerStats();
  const [matchLength, setMatchLength] = useState<number>(7);
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
    { len: 0, label: isEn ? 'Money Game' : 'Partie Libre', testId: 'expert-format-money' },
  ];

  return (
    <div data-testid="expert-home-portal" className="flex flex-col gap-3 w-full max-w-5xl mx-auto py-1">
      {/* COUPE 1 : En-tête sobre posé directement sur fond noir sans boîte fermée */}
      <div className="flex flex-col gap-0.5 px-1 text-center sm:text-left">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-[#D4AF37]">
          <Crown className="w-3.5 h-3.5 text-[#D4AF37]" strokeWidth={1.5} />
          <span>{isEn ? 'EXPERT / PRO MODE • OPEN SAGE 3-PLY' : 'MODE EXPERT / PRO • OPEN SAGE 3-PLY'}</span>
        </span>
        <h2 className="text-base sm:text-lg font-black text-[#f7f3e8]">
          {isEn ? '3-Ply Competition & Telemetry' : 'Compétition & Télémétrie 3-Ply'}
        </h2>
        <p className="text-xs text-stone-300">
          {isEn
            ? 'Official WBGF formats, Crawford rule, and equity analysis to the thousandth.'
            : "Formats officiels WBGF, règle de Crawford et analyse au millième d'équité."}
        </p>
      </div>

      {/* COUPE 2 : CARTE CENTRALE ÉPURÉE « JOUER UN MATCH OFFICIEL » */}
      <div className="bg-[#0B0E14]/90 border border-white/[0.08] rounded-2xl shadow-xl p-3.5 sm:p-4 flex flex-col gap-2.5">
        <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 whitespace-nowrap shrink-0">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#D4AF37]/20 text-[#f3d27a] shrink-0">
              <Trophy size={16} />
            </span>
            <h3 className="text-sm sm:text-base font-black text-[#fdf8eb] whitespace-nowrap">
              {isEn ? 'Play an Official Match' : 'Jouer un Match Officiel'}
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold whitespace-nowrap shrink-0">
              ● {isEn ? 'Tournament Matchmaking' : 'Matchmaking Tournoi'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
            {FORMATS.map((fmt) => (
              <button
                key={fmt.len} type="button" data-testid={fmt.testId} onClick={() => setMatchLength(fmt.len)}
                className={`px-2.5 py-1 rounded-xl border text-xs font-bold font-mono transition active:scale-95 whitespace-nowrap ${
                  matchLength === fmt.len
                    ? 'bg-white/10 text-[#D4AF37] border border-[#D4AF37]/50 font-bold shadow-sm'
                    : 'bg-white/[0.03] text-zinc-300 border-white/10 hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                {fmt.label}
              </button>
            ))}

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
        </div>

        {/* 2 Boutons d'action côte à côte même hauteur h-12 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
          <button
            type="button" data-testid="expert-play-btn" onClick={() => onStartExpertMatch(matchLength)}
            className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#E5C158] via-[#D4AF37] to-[#B5902B] px-4 text-xs sm:text-sm font-black uppercase tracking-wider text-black shadow-lg hover:brightness-105 active:scale-95 transition whitespace-nowrap"
          >
            <Swords className="w-4 h-4 text-black shrink-0" strokeWidth={1.75} />
            <span>{isEn ? 'FIND AN OPPONENT (OFFICIAL MATCH) →' : 'TROUVER UN ADVERSAIRE →'}</span>
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

      {/* COUPE 3 : CARTE INFÉRIEURE COMPACTE (3 COLONNES HORLOGÈRES SOBRES + 1 BANDEAU ACTIVER PASSEPORT) */}
      <div data-testid="decomposed-pr-panel" className="rounded-2xl border border-white/[0.08] bg-[#0B0E14]/90 p-3.5 sm:p-4 shadow-xl text-white flex flex-col gap-2.5">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-stone-300">
            {isEn ? '3-Ply Performance Breakdown' : 'Bilan de Performance 3-Ply'}
          </h3>
          <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono font-bold">
            {isEn ? 'TARGET PR < 6.0' : 'PR CIBLE < 6.0'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-center flex flex-col items-center">
            <span className="text-[11px] font-mono font-bold text-stone-400">{isEn ? 'OVERALL PR' : 'PR GLOBAL'}</span>
            <span data-testid="pr-global-val" className="font-mono font-black text-base sm:text-xl text-[#f3d27a] my-0.5">{globalVal}</span>
            {globalSub && <span className="text-[10px] text-stone-400">{globalSub}</span>}
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-center flex flex-col items-center">
            <span className="text-[11px] font-mono font-bold text-stone-400">{isEn ? 'CHECKER PR' : 'PR PIONS'}</span>
            <span data-testid="pr-checker-val" className="font-mono font-black text-base sm:text-xl text-emerald-400 my-0.5">{checkerVal}</span>
            {checkerSub && <span className="text-[10px] text-emerald-400/90 font-medium">{checkerSub}</span>}
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-center flex flex-col items-center">
            <span className="text-[11px] font-mono font-bold text-stone-400">{isEn ? 'CUBE PR' : 'PR VIDEAU'}</span>
            <span data-testid="pr-cube-val" className="font-mono font-black text-base sm:text-xl text-amber-300 my-0.5">{cubeVal}</span>
            {cubeSub && <span className="text-[10px] text-amber-400/90 font-medium">{cubeSub}</span>}
          </div>
        </div>

        {/* 1 seule barre épurée si Invité */}
        {isGuest && (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
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
            type="button" data-testid="expert-start-calibration-cta" onClick={() => onStartExpertMatch(matchLength)}
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
