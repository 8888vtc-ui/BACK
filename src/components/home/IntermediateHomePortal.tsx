'use client';

import React, { useState } from 'react';
import { Swords, Share2, EyeOff, Eye } from 'lucide-react';
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
    <div data-testid="intermediate-home-portal" className="flex flex-col gap-3.5 w-full max-w-5xl mx-auto py-2 px-1">
      {/* En-tête Club Compact */}
      <div className="flex flex-col gap-1 text-center sm:text-left px-1">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#f3c65f]">
          {isEn ? '♟️ CLUB MODE · PRIORITY TO PLAY & DOUBLING CUBE' : '♟️ MODE INTERMÉDIAIRE / CLUB · PRIORITÉ AU JEU & VIDEAU'}
        </span>
        <h2 className="text-lg sm:text-xl font-black text-white">
          {isEn ? 'Sharpen your club reflexes and crush blunders' : 'Affûtez vos réflexes de club et étouffez les erreurs'}
        </h2>
        <p className="text-xs sm:text-sm text-stone-300 max-w-2xl leading-relaxed">
          {isEn
            ? 'Play immediately against calibrated club opponents, master the doubling cube, and count race mentally without pips.'
            : 'Jouez immédiatement contre des joueurs de club calibrés, maîtrisez le videau et comptez la course sans compteur de pips.'}
        </p>
      </div>

      {/* BLOC 1 — LANCEMENT DE PARTIE IMMÉDIAT (PRIORITÉ N°1 DU JOUEUR DE CLUB) */}
      <div className="rounded-2xl border-2 border-[#D4AF37]/50 bg-gradient-to-b from-[#18130b] via-[#100d07] to-[#0a0d13] p-4 sm:p-5 shadow-[0_8px_32px_rgba(212,175,55,0.14)] flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#D4AF37]/20 text-[#f3d27a]">
                <Swords size={18} />
              </span>
              <h3 className="text-sm sm:text-base font-black text-[#fdf8eb]">
                {isEn ? '⚡ Immediate Club Game (Priority #1)' : '⚡ Lancement de Partie Immédiat (Priorité N°1)'}
              </h3>
            </div>
            <p className="text-xs text-stone-300 mt-0.5">
              {isEn
                ? 'Select match format and launch instantly against a club adversary with realistic thinking delays.'
                : 'Choisissez votre format et lancez en 1 clic contre un joueur de club (délais humains calibrés).'}
            </p>
          </div>

          {/* Sélecteur direct 1-clic : 3, 5, 7 pts, Money Game + Switch Masquer les Pips */}
          <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
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
                  className={`px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-bold transition active:scale-95 ${
                    active
                      ? 'bg-[#D4AF37] border-[#F3E5AB] text-slate-950 font-black shadow-md'
                      : 'bg-white/[0.04] border-white/10 text-stone-200 hover:bg-white/10 hover:text-white'
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
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-bold transition active:scale-95 shrink-0 ${
                isPipsHidden
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                  : 'bg-white/[0.04] border-white/10 text-stone-300 hover:bg-white/10'
              }`}
            >
              {isPipsHidden ? <EyeOff size={14} /> : <Eye size={14} />}
              <span>
                {isEn
                  ? (isPipsHidden ? 'Pips: Hidden' : 'Hide Pips (Tournament)')
                  : (isPipsHidden ? 'Pips : Masqués' : 'Masquer les Pips (Tournoi)')}
              </span>
            </button>
          </div>
        </div>

        {/* Boutons d'action : JOUER MAINTENANT (Or) & INVITER UN AMI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
          <button
            type="button"
            data-testid="intermediate-play-btn"
            onClick={handlePlayNow}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#f5d98b] to-[#b88924] px-4 py-2.5 text-xs sm:text-sm font-black uppercase tracking-wider text-slate-950 shadow-lg hover:brightness-105 active:scale-95 transition"
          >
            <Swords size={17} className="text-slate-950" />
            <span>{isEn ? 'PLAY NOW (CLUB OPPONENT) →' : 'JOUER MAINTENANT (ADVERSAIRE DE CLUB) →'}</span>
          </button>

          <button
            type="button"
            data-testid="intermediate-invite-btn"
            onClick={onInviteFriend}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[0.06] hover:bg-white/[0.1] px-4 py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-white transition active:scale-95"
          >
            <Share2 size={15} />
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
