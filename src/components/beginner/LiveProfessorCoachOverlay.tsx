'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { RotateCcw, GraduationCap, Volume2, BookOpen, ShieldAlert, Award, Eye, EyeOff, X } from 'lucide-react';
import { useTranslation } from '../../i18n';
import type { LastMoveFeedback } from '../../hooks/useCoachHelpers';
import { pipCount, type BoardState } from '../../engine/backgammonEngine';
import { BeginnerInteractiveGuideModal } from './BeginnerInteractiveGuideModal';
import { getProactiveAdvice, getFeedbackAdvice, getBotMoveExplanation } from './professorAdviceHelper';

export interface LiveProfessorCoachOverlayProps {
  locale?: string;
  dice?: [number, number] | null;
  canUndo?: boolean;
  onUndoMove?: () => void;
  onAskProfessorHint?: () => void;
  lastMoveFeedback?: LastMoveFeedback | null;
  pipDifference?: number;
  antiFrustrationNotice?: 'BAR_PRIORITY' | 'CLOSED_POINT' | null;
  isMasterMove?: boolean;
  optimalMove?: string | null;
  whyOptimal?: string | null;
  lastBotNotation?: string | null;
  activeTurn?: 'X' | 'O';
  boardState?: BoardState;
  onToggleRecommendArrow?: () => void;
  onHoverNotation?: (notation: string | null) => void;
  isShowingRecommendArrow?: boolean;
  prematureDoubleWarning?: boolean;
}

export function LiveProfessorCoachOverlay({
  locale: propLocale,
  dice,
  canUndo = true,
  onUndoMove,
  onAskProfessorHint,
  lastMoveFeedback,
  antiFrustrationNotice,
  isMasterMove = false,
  optimalMove,
  lastBotNotation,
  activeTurn = 'X',
  boardState,
  onToggleRecommendArrow,
  onHoverNotation,
  isShowingRecommendArrow = true,
  prematureDoubleWarning = false,
}: LiveProfessorCoachOverlayProps) {
  const { locale: contextLocale } = useTranslation();
  const activeLocale = propLocale || contextLocale || 'fr';
  const lang = activeLocale === 'en' ? 'en' : 'fr';
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [activeNotice, setActiveNotice] = useState<'BAR_PRIORITY' | 'CLOSED_POINT' | null>(antiFrustrationNotice ?? null);
  const [showMasterBadge, setShowMasterBadge] = useState<boolean>(false);

  // Temps A : Calcul proactif du meilleur coup au jet de dés
  const proactive = useMemo(
    () => (boardState && dice && (dice[0] > 0 || dice[1] > 0) && activeTurn === 'X' ? getProactiveAdvice(boardState, dice, lang) : null),
    [boardState, dice, activeTurn, lang],
  );

  const activeBestNotation = proactive?.bestNotation ?? optimalMove ?? '';

  // Transmission automatique de la notation optimale au composant parent
  useEffect(() => {
    if (activeTurn === 'X' && dice && (dice[0] > 0 || dice[1] > 0) && activeBestNotation) {
      onHoverNotation?.(activeBestNotation);
    } else {
      onHoverNotation?.(null);
    }
  }, [activeTurn, dice?.[0], dice?.[1], activeBestNotation, onHoverNotation]);

  // Badge Coup de Maître : affiché 3 secondes max, disparaît dès le lancer de dés
  useEffect(() => {
    if (isMasterMove && (!dice || (dice[0] === 0 && dice[1] === 0))) {
      setShowMasterBadge(true);
      const timer = setTimeout(() => setShowMasterBadge(false), 3000);
      return () => clearTimeout(timer);
    }
    setShowMasterBadge(false);
  }, [isMasterMove, dice]);

  const getProfessorPrompt = (): string => {
    if (prematureDoubleWarning) {
      return lang === 'fr'
        ? "🎓 Pas encore ! On ne propose de doubler les points (×2) que lorsqu'on a pris un net avantage dans la partie. Continue d'abord en cliquant sur Lancer les dés !"
        : "🎓 Not yet! You should only offer to double points (×2) when you have built a clear advantage in the game. Continue by clicking Roll Dice first!";
    }

    if (activeTurn === 'X' && (!dice || (dice[0] === 0 && dice[1] === 0))) {
      const hasCheckerOnBar = Boolean(boardState && boardState.board[0] > 0);
      if (hasCheckerOnBar) {
        return lang === 'fr'
          ? "🎓 Le Professeur : Tu as un pion sur la barre centrale ! Clique sur Lancer les dés : ta priorité absolue sera de le faire rentrer dans le camp adverse (Cases 24 à 19)."
          : "🎓 The Professor: You have a checker on the central bar! Click Roll Dice: your absolute priority will be to enter it into the opponent's home board (Points 24 to 19).";
      }
      return lang === 'fr'
        ? "🎓 Le Professeur : C'est à ton tour ! Clique sur Lancer les dés au centre du plateau pour découvrir tes options de déplacement."
        : "🎓 The Professor: It's your turn! Click Roll Dice in the center of the board to see your movement options.";
    }

    if (lastMoveFeedback && activeTurn === 'X' && !dice) return getFeedbackAdvice(lastMoveFeedback, lang);
    if (proactive) return proactive.text;
    if (lastBotNotation && activeTurn === 'X' && !dice) return getBotMoveExplanation(lastBotNotation, lang);
    if (activeTurn === 'O') return lang === 'fr' ? "L'adversaire analyse la position..." : 'Opponent is thinking...';

    if (activeBestNotation) {
      return lang === 'fr'
        ? `💡 Conseil du Professeur : Joue ${activeBestNotation} pour faire avancer tes pions vers ta maison.`
        : `💡 Professor Tip: Play ${activeBestNotation} to advance your checkers toward your home board.`;
    }
    return lang === 'fr'
      ? "🎓 Le Professeur : C'est à ton tour ! Clique sur Lancer les dés au centre du plateau."
      : "🎓 The Professor: It's your turn! Click Roll Dice in the center of the board.";
  };

  const getRaceCompassText = (): string => {
    if (!boardState?.board) return '';
    const pips = pipCount(boardState.board);
    const playerPips = pips.X;
    const opponentPips = pips.O;

    if (playerPips > opponentPips) {
      const retard = playerPips - opponentPips;
      return lang === 'fr'
        ? `🛡️ Course : Tu as ${retard} cases de retard (${playerPips} contre ${opponentPips}). Garde une défense solide et guette un pion adverse isolé à frapper !`
        : `🛡️ Race: You are ${retard} steps behind (${playerPips} vs ${opponentPips}). Stay solid and look for an exposed blot to hit!`;
    }
    if (playerPips < opponentPips) {
      const avance = opponentPips - playerPips;
      return lang === 'fr'
        ? `🏃 Course : Tu es en avance de ${avance} cases (${playerPips} contre ${opponentPips}) ! Ramène tes dames vers la sortie sans prendre de risque.`
        : `🏃 Race: You lead by ${avance} steps (${playerPips} vs ${opponentPips})! Bring your checkers home safely without taking risks.`;
    }
    return lang === 'fr'
      ? `⚖️ Course serrée (${playerPips} cases partout) : Construis tes portes et protège tes pions isolés.`
      : `⚖️ Tight race (${playerPips} steps each): Build gates and protect your single blots.`;
  };

  const handleSpeakPrompt = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(getProfessorPrompt().replace(/^[^\w\s]+/u, '').trim());
    utt.lang = lang === 'fr' ? 'fr-FR' : 'en-US';
    window.speechSynthesis.speak(utt);
  };

  const currentNotice = activeNotice ?? antiFrustrationNotice;

  return (
    <>
      <div
        data-testid="live-professor-coach-overlay"
        className="w-full max-w-5xl mx-auto px-3.5 py-2.5 flex flex-col gap-2 rounded-xl border backdrop-blur-md text-xs mb-1.5 shrink-0 transition-colors bg-[#0c141d]/90 border-[#D4AF37]/35 text-stone-100"
      >
        {/* Ligne 1 : Question bienveillante & Boutons */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#f3d27a]">
              <GraduationCap className="w-4 h-4" />
            </span>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-black uppercase tracking-wider text-xs text-[#D4AF37]">
                  {lang === 'fr' ? 'PROFESSEUR INTERACTIF' : 'INTERACTIVE PROFESSOR'}
                </span>
                {showMasterBadge && (
                  <span
                    data-testid="master-move-badge"
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/30 to-amber-600/30 border border-[#D4AF37]/60 text-[#f3d27a] font-bold text-xs shadow-sm animate-pulse"
                  >
                    <Award className="w-3 h-3 text-[#D4AF37]" />
                    <span>{lang === 'fr' ? '✨ Coup de Maître ! (+50 PTS)' : '✨ Master Move! (+50 PTS)'}</span>
                  </span>
                )}
              </div>
              <p data-testid="professor-dialogue-text" className="text-sm sm:text-base font-medium text-white leading-relaxed break-words">
                {getProfessorPrompt()}
              </p>
            </div>
          </div>

          {/* Boutons d'interaction épurés */}
          <div className="flex flex-wrap items-center gap-1.5 shrink-0 self-end sm:self-center">
            {/* Bouton d'Aide Visuelle : Toggle flèches dorées sur le plateau */}
            {activeBestNotation && dice && (dice[0] > 0 || dice[1] > 0) && (
              <button
                type="button"
                data-testid="professor-show-arrow-btn"
                onClick={onToggleRecommendArrow}
                aria-label={isShowingRecommendArrow ? (lang === 'fr' ? 'Masquer les flèches' : 'Hide arrows') : (lang === 'fr' ? 'Afficher les flèches' : 'Show arrows')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition border ${
                  isShowingRecommendArrow
                    ? 'bg-[#D4AF37] text-slate-950 border-[#D4AF37] shadow-lg'
                    : 'bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 text-[#f3d27a] border-[#D4AF37]/50'
                }`}
              >
                {isShowingRecommendArrow ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>
                  {isShowingRecommendArrow
                    ? (lang === 'fr' ? 'Masquer les flèches' : 'Hide arrows')
                    : (lang === 'fr' ? 'Afficher les flèches' : 'Show arrows')}
                </span>
              </button>
            )}

            <button
              type="button"
              data-testid="professor-voice-btn"
              onClick={handleSpeakPrompt}
              aria-label={lang === 'fr' ? 'Écouter le Professeur' : 'Listen to Professor'}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-amber-300 border border-white/10 transition"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              data-testid="professor-open-guide-btn"
              onClick={() => setIsGuideOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-stone-200 border border-white/10 transition"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{lang === 'fr' ? 'Guide 6 Chapitres' : '6-Chapter Guide'}</span>
            </button>

            <button
              type="button"
              data-testid="professor-undo-move-btn"
              onClick={() => {
                onUndoMove?.();
              }}
              disabled={!canUndo}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition disabled:opacity-40"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-300" />
              <span>↺ {lang === 'fr' ? 'Rejouer le coup' : 'Undo / Retry move'}</span>
            </button>
          </div>
        </div>

        {/* Ligne 2 : Indicateur de Course dynamique épuré */}
        <div className="flex flex-col gap-1.5 pt-1.5 border-t border-[#D4AF37]/20">
          <div className="flex items-center justify-between text-xs text-stone-300 bg-black/30 px-2 py-1 rounded-md border border-white/5">
            <span className="font-medium text-[#f3d27a]">
              {getRaceCompassText()}
            </span>
            <button
              type="button"
              onClick={() => setIsGuideOpen(true)}
              className="text-[#D4AF37] hover:underline text-xs shrink-0 ml-2"
            >
              {lang === 'fr' ? 'Aide déplacements ?' : 'Movement help?'}
            </button>
          </div>

          {currentNotice && (
            <div
              data-testid="professor-anti-frustration-alert"
              className="flex items-center justify-between gap-2 p-2 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs animate-in fade-in"
            >
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  {currentNotice === 'BAR_PRIORITY'
                    ? (lang === 'fr'
                        ? '🚨 Règle d’or : Vous avez une dame sur la barre ! Elle doit impérativement rentrer (cases 24 à 19) avant de bouger tout autre pion.'
                        : '🚨 Golden Rule: You have a checker on the bar! It must re-enter (points 24 to 19) before any other move.')
                    : (lang === 'fr'
                        ? '🛡️ Case bloquée : Cette flèche est protégée par 2 dames adverses ou plus (porte faite). Vous ne pouvez pas vous y arrêter.'
                        : '🛡️ Blocked point: This point is secured by 2+ opponent checkers. You cannot land here.')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveNotice(null)}
                className="text-stone-400 hover:text-white text-xs px-1"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>

      {isGuideOpen && (
        <BeginnerInteractiveGuideModal
          isOpen={isGuideOpen}
          onClose={() => setIsGuideOpen(false)}
          onStartGuidedMatch={() => setIsGuideOpen(false)}
        />
      )}
    </>
  );
}

export default LiveProfessorCoachOverlay;
