'use client';

import React, { useState } from 'react';
import { Swords, Share2, Sparkles, Trophy, Users } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { IntermediateClubSecretsCard } from '../intermediate/IntermediateClubSecretsCard';
import { IntermediateQuickDrills } from '../intermediate/IntermediateQuickDrills';

interface IntermediateHomePortalProps {
  readonly onFindOpponent: (matchLength?: number) => void;
  readonly onInviteFriend: () => void;
  readonly onOpenQuizzes: () => void;
}

export const IntermediateHomePortal: React.FC<IntermediateHomePortalProps> = React.memo(({
  onFindOpponent,
  onInviteFriend,
  onOpenQuizzes,
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
    <div data-testid="intermediate-home-portal" className="flex flex-col gap-4 w-full max-w-4xl mx-auto py-2">
      {/* En-tête Club */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0b0e14]/90 p-5 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-col gap-1 text-center sm:text-left">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#f3c65f]">
            {isEn ? '♟️ Club Mode · Playing First, Cube Mastery & Pips' : '♟️ Mode Intermédiaire / Club · Priorité au Jeu & Videau'}
          </span>
          <h2 className="text-lg sm:text-xl font-black text-white">
            {isEn ? 'Sharpen your club reflexes and crush blunders' : 'Affûtez vos réflexes de club et étouffez les erreurs'}
          </h2>
          <p className="text-xs sm:text-sm text-stone-300 max-w-2xl">
            {isEn
              ? 'Play immediately against calibrated club opponents, master the doubling cube, and count race mentally without pips.'
              : 'Jouez immédiatement contre des joueurs de club calibrés, maîtrisez le videau et comptez la course sans compteur de pips.'}
          </p>
        </div>
      </div>

      {/* BLOC 1 — LANCEMENT DE PARTIE IMMÉDIAT (PRIORITÉ N°1 DU JOUEUR DE CLUB) */}
      <div className="rounded-2xl border-2 border-[#D4AF37]/50 bg-gradient-to-b from-[#18130b] via-[#100d07] to-[#0a0d13] p-5 shadow-[0_8px_32px_rgba(212,175,55,0.14)] flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#D4AF37]/20 text-[#f3d27a]">
                <Swords size={18} />
              </span>
              <h3 className="text-sm sm:text-base font-black text-[#fdf8eb]">
                {isEn ? '⚡ Immediate Club Game (Priority #1)' : '⚡ Lancement de Partie Immédiat (Priorité N°1)'}
              </h3>
            </div>
            <p className="text-xs text-stone-300 mt-1">
              {isEn
                ? 'Select match format and launch instantly against a club adversary with realistic thinking delays.'
                : 'Choisissez votre format et lancez en 1 clic contre un joueur de club (délais humains calibrés).'}
            </p>
          </div>

          {/* Sélecteur direct 1-clic : 3, 5, 7 pts, Money Game */}
          <div className="flex items-center gap-1.5 self-end sm:self-center">
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
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition active:scale-95 ${
                    active
                      ? 'bg-[#D4AF37] border-[#F3E5AB] text-slate-950 font-black shadow-md'
                      : 'bg-white/[0.04] border-white/10 text-stone-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {fmt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Boutons d'action : JOUER MAINTENANT (Or) & INVITER UN AMI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            data-testid="intermediate-play-btn"
            onClick={handlePlayNow}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#f5d98b] to-[#b88924] px-4 py-3 text-xs sm:text-sm font-black uppercase tracking-wider text-slate-950 shadow-lg hover:brightness-105 active:scale-95 transition"
          >
            <Swords size={18} className="text-slate-950" />
            <span>{isEn ? 'PLAY NOW (CLUB OPPONENT) →' : 'JOUER MAINTENANT (ADVERSAIRE DE CLUB) →'}</span>
          </button>

          <button
            type="button"
            data-testid="intermediate-invite-btn"
            onClick={onInviteFriend}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[0.06] hover:bg-white/[0.1] px-4 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider text-white transition active:scale-95"
          >
            <Share2 size={16} />
            <span>{isEn ? 'INVITE A FRIEND — 1-CLICK LINK (< 3S)' : 'INVITER UN AMI — LIEN 1-CLIC (< 3S)'}</span>
          </button>
        </div>
      </div>

      {/* BLOC 2 — MINI-GUIDE COMPACT : LES 4 CLÉS POUR GAGNER EN CLUB & TOURNOI */}
      <IntermediateClubSecretsCard
        isPipsHidden={isPipsHidden}
        onToggleHidePips={() => setIsPipsHidden((prev) => !prev)}
      />

      {/* BLOC 3 — LES 3 PETITS QUIZ FLASH INTERMÉDIAIRES */}
      <IntermediateQuickDrills
        onOpenNPlus1Bank={onOpenQuizzes}
        onOpenBlunders={onOpenQuizzes}
      />
    </div>
  );
});

IntermediateHomePortal.displayName = 'IntermediateHomePortal';
