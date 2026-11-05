'use client';

import React from 'react';
import { Volume2, Trophy, Sparkles, Scale, ShieldCheck } from 'lucide-react';
import { useTranslation } from '../../i18n';

export const CAP_6_TEXT_FR =
  "Selon la norme historique de Snowie et XG, dès qu'un joueur descend à 6 ou 7 d'Error Rate, il joue déjà à un très haut niveau. Sur un match, l'écart technique pur entre un joueur à 6.0 et un Champion du Monde devient si fin que le résultat dépend énormément du hasard des dés ! Comment reprendre alors l'avantage sur le hasard ? Grâce à l'Error Rate Adaptatif (ERA) : en s'adaptant au profil réel de l'adversaire en face de soi ! Face à un joueur plus faible, on refuse de laisser le hasard décider dans une simple course : on solidifie son jeu ou on joue le Backgame pour provoquer ses erreurs. Et sur le Videau, on s'adapte à sa psychologie (doubler un peu plus tôt s'il refuse trop vite, ou attendre le moment idéal s'il prend trop tard).";

export const CAP_6_TEXT_EN =
  "According to the historical Snowie and XG standard, once a player reaches an Error Rate of 6 or 7, they are already playing at a very high level. In a match, the pure technical gap between a 6.0 player and a World Champion becomes so narrow that dice luck plays a massive role in the outcome! So how do you tilt the odds back in your favor? Through Adaptive Error Rate (ERA): by adapting to the real opponent across from you! Against a weaker player, you refuse to let pure dice luck decide a simple race: you solidify your structure or steer into a Backgame to induce their mistakes. And on the Doubling Cube, you exploit their tendencies (doubling slightly earlier if they drop too easily, or waiting if they take too late).";

export function Cap6ErrorRateLegendCard() {
  const { locale } = useTranslation();
  const lang = locale === 'en' ? 'en' : 'fr';
  const isEn = lang === 'en';

  const handleSpeak = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(isEn ? CAP_6_TEXT_EN : CAP_6_TEXT_FR);
    utt.lang = isEn ? 'en-US' : 'fr-FR';
    window.speechSynthesis.speak(utt);
  };

  return (
    <div
      data-testid="cap-6-er-era-card"
      className="w-full rounded-2xl border-2 border-[#D4AF37]/50 bg-gradient-to-b from-[#18120a] via-[#0f0c08] to-[#07090e] p-4 sm:p-5 shadow-2xl text-white"
    >
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#f3d27a]">
            <Trophy className="w-5 h-5 text-[#D4AF37]" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-[#D4AF37]/25 border border-[#D4AF37]/40 text-[#f3d27a] px-2 py-0.5 text-[10px] font-mono font-black">
                NORME SNOWIE & XG
              </span>
              <span className="text-xs text-emerald-400 font-bold">Cap Mythique & ERA</span>
            </div>
            <h3 className="text-sm sm:text-base font-black text-[#fdf8eb] mt-0.5">
              {isEn
                ? 'The Mythic 6.0 Error Rate Threshold (Snowie / XG) & Adaptive Error Rate (ERA)'
                : 'La Frontière Mythique du 6.0 d’Error Rate (Norme Snowie / XG) & L’Error Rate Adaptatif (ERA)'}
            </h3>
          </div>
        </div>

        <button
          type="button"
          data-testid="cap-6-er-voice-btn"
          onClick={handleSpeak}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold hover:bg-amber-500/30 transition shrink-0 self-end sm:self-center"
        >
          <Volume2 className="w-4 h-4" />
          <span>{isEn ? 'Listen to Rule' : 'Écouter la règle'}</span>
        </button>
      </div>

      {/* L'Échelle Historique 3 Paliers */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 my-3.5">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 flex flex-col gap-1">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400">
            {isEn ? 'Level > 12.0 ER' : 'Niveau > 12.0 ER'}
          </span>
          <span className="text-xs font-black text-amber-300">
            {isEn ? 'Beginner / Initiation' : 'Débutant / Initiation'}
          </span>
          <p className="text-[11px] text-stone-300 leading-snug">
            {isEn
              ? 'Learning to protect blots, build points and understand doubling fundamentals.'
              : 'Apprendre à ne plus laisser de pions isolés, bâtir ses portes et doubler.'}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 flex flex-col gap-1">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
            {isEn ? 'Level 6.0 – 12.0 ER' : 'Niveau 6.0 – 12.0 ER'}
          </span>
          <span className="text-xs font-black text-white">
            {isEn ? 'Intermediate / Club' : 'Intermédiaire / Club'}
          </span>
          <p className="text-[11px] text-stone-300 leading-snug">
            {isEn
              ? 'Mastering doubling cube windows and calculating tournament races mentally without pips.'
              : 'Maîtrise des fenêtres de videau et comptage de course sans pips en tournoi.'}
          </p>
        </div>

        <div className="rounded-xl border border-[#D4AF37]/50 bg-[#D4AF37]/10 p-3 flex flex-col gap-1 shadow-md">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#F3E5AB]">
            {isEn ? 'Level < 6.0 ER (ELITE)' : 'Niveau < 6.0 ER (ÉLITE)'}
          </span>
          <span className="text-xs font-black text-[#fdf8eb]">
            {isEn ? 'Expert, Master & World Champion' : 'Expert, Master & Champion du Monde'}
          </span>
          <p className="text-[11px] text-stone-200 leading-snug">
            {isEn
              ? 'Technical gap shrinks, dice luck dominates: victory is decided by ERA adaptive play.'
              : 'L’écart technique devient minime, les dés dominent : l’ERA fait la décision.'}
          </p>
        </div>
      </div>

      {/* Explication Fondamentale Bilingue */}
      <div className="rounded-xl border border-[#D4AF37]/35 bg-black/40 p-3.5 space-y-2">
        <div className="flex items-center gap-2 text-xs font-black text-[#F3E5AB]">
          <Sparkles className="w-4 h-4 text-[#D4AF37]" />
          <span>
            {isEn
              ? 'Why Everything Changes at 6.0 / 7.0 Error Rate (Luck & ERA):'
              : 'Pourquoi tout change dès qu’on atteint 6.0 ou 7.0 d’Error Rate (Le Hasard & L’ERA) :'}
          </span>
        </div>
        <p className="text-xs text-stone-200 leading-relaxed font-medium">
          {isEn ? CAP_6_TEXT_EN : CAP_6_TEXT_FR}
        </p>
      </div>
    </div>
  );
}

