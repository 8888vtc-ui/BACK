'use client';

import React, { useState } from 'react';
import { Swords, Share2, EyeOff, Eye, Award } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { IntermediateClubSecretsCard } from '../intermediate/IntermediateClubSecretsCard';

interface IntermediateHomePortalProps {
  readonly onFindOpponent: (matchLength?: number) => void;
  readonly onInviteFriend: () => void;
  readonly onOpenQuizzes: () => void;
}

export const IntermediateHomePortal: React.FC<IntermediateHomePortalProps> = React.memo(({
  onFindOpponent,
  onInviteFriend,
}) => {
  const { locale } = useTranslation();
  const lang = locale === 'en' ? 'en' : 'fr';
  const isEn = lang === 'en';

  const [selectedFormat, setSelectedFormat] = useState<number>(5);
  const [isPipsHidden, setIsPipsHidden] = useState<boolean>(false);

  const handlePlayNow = () => {
    onFindOpponent(selectedFormat);
  };

  return (
    <div data-testid="intermediate-home-portal" className="flex flex-col gap-2.5 w-full max-w-5xl mx-auto py-1 px-1">
      {/* En-tête Club Compact */}
      <div className="flex flex-col gap-0.5 text-center sm:text-left px-1">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
          <Award className="w-4 h-4 text-[#D4AF37]" strokeWidth={1.5} />
          <span>{isEn ? 'CLUB MODE · PRIORITY TO PLAY & DOUBLING CUBE' : 'MODE INTERMÉDIAIRE / CLUB · PRIORITÉ AU JEU & VIDEAU'}</span>
        </span>
        <h2 className="text-base sm:text-lg font-black text-white">
          {isEn ? 'Sharpen your club reflexes and crush blunders' : 'Affûtez vos réflexes de club et étouffez les erreurs'}
        </h2>
        <p className="text-xs text-stone-300 max-w-2xl leading-relaxed">
          {isEn
            ? 'Play immediately against calibrated club opponents, master the doubling cube, and count race mentally without pips.'
            : 'Jouez immédiatement contre des joueurs de club calibrés, maîtrisez le videau et comptez la course sans compteur de pips.'}
        </p>
      </div>

      {/* BLOC 1 — LANCEMENT DE PARTIE IMMÉDIAT (PRIORITÉ N°1 DU JOUEUR DE CLUB) */}
      <div className="bg-[#0B0E14]/90 border border-white/[0.08] rounded-2xl shadow-xl p-3.5 sm:p-4 flex flex-col gap-2.5">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 whitespace-nowrap shrink-0">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#D4AF37]/20 text-[#f3d27a] shrink-0">
                <Swords size={15} />
              </span>
              <h3 className="text-sm sm:text-base font-black text-[#fdf8eb] whitespace-nowrap">
                {isEn ? 'Play Online — Club Match' : 'Jouer en Ligne — Match de Club'}
              </h3>
              <span
                data-testid="intermediate-matchmaking-badge"
                className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold whitespace-nowrap shrink-0"
              >
                {isEn ? '● Live Matchmaking' : '● Matchmaking Direct'}
              </span>
            </div>

            {/* Sélecteur direct 1-clic : 3, 5, 7 pts, Money Game + Switch Masquer les Pips */}
            <div className="flex items-center gap-1.5 shrink-0">
              {[
                { id: 3, label: '3 pts', testId: 'match-format-3' },
                { id: 5, label: '5 pts', testId: 'match-format-5' },
                { id: 7, label: '7 pts', testId: 'match-format-7' },
                { id: 0, label: isEn ? 'Money Game' : 'Partie Libre', testId: 'match-format-money' },
              ].map((fmt) => {
                const active = selectedFormat === fmt.id;
                return (
                  <button
                    key={fmt.id}
                    type="button"
                    data-testid={fmt.testId}
                    onClick={() => setSelectedFormat(fmt.id)}
                    className={`px-2.5 py-1 rounded-xl border text-xs font-bold transition active:scale-95 whitespace-nowrap ${
                      active
                        ? 'bg-white/10 text-[#D4AF37] border border-[#D4AF37]/50 font-bold shadow-sm'
                        : 'bg-white/[0.04] border-white/10 text-stone-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {fmt.label}
                  </button>
                );
              })}

              {/* Switch Mode Tournoi : Masquer les Pips */}
              <button
                type="button"
                data-testid="hide-pips-toggle-btn"
                onClick={() => setIsPipsHidden((prev) => !prev)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border text-xs font-bold transition active:scale-95 shrink-0 whitespace-nowrap ${
                  isPipsHidden
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                    : 'bg-white/[0.04] border-white/10 text-stone-300 hover:bg-white/10'
                }`}
              >
                {isPipsHidden ? <EyeOff size={13} /> : <Eye size={13} />}
                <span>
                  {isEn
                    ? (isPipsHidden ? 'Pips: Hidden' : 'Hide Pips')
                    : (isPipsHidden ? 'Pips : Masqués' : 'Masquer les Pips')}
                </span>
              </button>
            </div>
          </div>

          <p className="text-xs text-stone-300">
            {isEn
              ? 'Select match format and launch instantly against a club adversary with realistic thinking delays.'
              : 'Choisissez votre format et lancez en 1 clic contre un joueur de club (délais humains calibrés).'}
          </p>
        </div>

        {/* Boutons d'action : JOUER MAINTENANT (Or) & INVITER UN AMI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
          <button
            type="button"
            data-testid="intermediate-play-btn"
            onClick={handlePlayNow}
            className="w-full h-14 inline-flex flex-col items-center justify-center rounded-xl bg-gradient-to-r from-[#E5C158] via-[#D4AF37] to-[#B5902B] px-4 py-2 text-black shadow-lg hover:brightness-105 active:scale-95 transition"
          >
            <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-black uppercase tracking-wider whitespace-nowrap">
              <Swords size={16} className="text-black shrink-0" />
              <span>{isEn ? 'FIND AN ONLINE OPPONENT (PLAY NOW) →' : 'TROUVER UN ADVERSAIRE EN LIGNE →'}</span>
            </span>
            <span className="text-[11px] font-medium opacity-80 whitespace-nowrap">
              {isEn
                ? `${selectedFormat === 0 ? 'Money Game' : `${selectedFormat}-pt Match`} • Calibrated Club Opponent`
                : `${selectedFormat === 0 ? 'Partie Libre' : `Match ${selectedFormat} pts`} • Adversaire de Club calibré`}
            </span>
          </button>

          <button
            type="button"
            data-testid="intermediate-invite-btn"
            onClick={onInviteFriend}
            className="w-full h-14 inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[0.06] hover:bg-white/[0.1] px-4 py-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-white transition active:scale-95 whitespace-nowrap"
          >
            <Share2 size={16} className="shrink-0" />
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
