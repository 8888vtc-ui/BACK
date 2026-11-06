'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { RotateCcw, Volume2, BookOpen, ShieldAlert, Award, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from '../../i18n';
import type { LastMoveFeedback } from '../../hooks/useCoachHelpers';
import { pipCount, type BoardState } from '../../engine/backgammonEngine';
import { BeginnerInteractiveGuideModal } from './BeginnerInteractiveGuideModal';
import { getProactiveAdvice, getFeedbackAdvice, getBotMoveExplanation } from './professorAdviceHelper';
import { soundEngine } from '../../lib/sound/soundEngine';

export interface LiveProfessorCoachOverlayProps {
  locale?: string; dice?: [number, number] | null; canUndo?: boolean; onUndoMove?: () => void;
  onAskProfessorHint?: () => void; lastMoveFeedback?: LastMoveFeedback | null; pipDifference?: number;
  antiFrustrationNotice?: 'BAR_PRIORITY' | 'CLOSED_POINT' | null; isMasterMove?: boolean;
  optimalMove?: string | null; whyOptimal?: string | null; lastBotNotation?: string | null;
  activeTurn?: 'X' | 'O'; boardState?: BoardState; onToggleRecommendArrow?: () => void;
  onHoverNotation?: (notation: string | null) => void; isShowingRecommendArrow?: boolean; prematureDoubleWarning?: boolean;
}

export function LiveProfessorCoachOverlay({
  locale: propLocale, dice, canUndo = true, onUndoMove, lastMoveFeedback,
  antiFrustrationNotice, isMasterMove = false, optimalMove, lastBotNotation, activeTurn = 'X',
  boardState, onToggleRecommendArrow, onHoverNotation, isShowingRecommendArrow = true, prematureDoubleWarning = false,
}: LiveProfessorCoachOverlayProps) {
  const { locale: contextLocale } = useTranslation();
  const lang = (propLocale || contextLocale || 'fr') === 'en' ? 'en' : 'fr';
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeNotice, setActiveNotice] = useState<'BAR_PRIORITY' | 'CLOSED_POINT' | null>(antiFrustrationNotice ?? null);
  const [showMasterBadge, setShowMasterBadge] = useState(false);
  const [showOptimalBadge, setShowOptimalBadge] = useState(false);

  useEffect(() => () => { if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel(); }, []);

  const isOptimalFeedback = useMemo(() => {
    if (!lastMoveFeedback) return false;
    return lastMoveFeedback.verdict === 'optimal' || Math.abs(lastMoveFeedback.equityLoss) <= 0.020;
  }, [lastMoveFeedback]);

  const proactive = useMemo(
    () => (boardState && dice && (dice[0] > 0 || dice[1] > 0) && activeTurn === 'X' ? getProactiveAdvice(boardState, dice, lang) : null),
    [boardState, dice, activeTurn, lang],
  );

  const activeBestNotation = proactive?.bestNotation ?? optimalMove ?? '';

  useEffect(() => {
    if (activeTurn === 'X' && dice && (dice[0] > 0 || dice[1] > 0) && activeBestNotation) {
      onHoverNotation?.(activeBestNotation);
    } else {
      onHoverNotation?.(null);
    }
  }, [activeTurn, dice?.[0], dice?.[1], activeBestNotation, onHoverNotation]);

  useEffect(() => {
    if (isMasterMove && (!dice || (dice[0] === 0 && dice[1] === 0))) {
      setShowMasterBadge(true);
      const timer = setTimeout(() => setShowMasterBadge(false), 3000);
      return () => clearTimeout(timer);
    }
    setShowMasterBadge(false);
  }, [isMasterMove, dice]);

  useEffect(() => {
    if (isOptimalFeedback && (!dice || (dice[0] === 0 && dice[1] === 0))) {
      setShowOptimalBadge(true);
      try { soundEngine.playBrilliantMove(); } catch { /* ignore */ }
      const timer = setTimeout(() => setShowOptimalBadge(false), 3500);
      return () => clearTimeout(timer);
    }
    setShowOptimalBadge(false);
  }, [isOptimalFeedback, dice]);

  const getProfessorPrompt = (): string => {
    if (showOptimalBadge) {
      return lang === 'fr'
        ? '✨ Bravo ! Excellent coup : ta nouvelle porte protège parfaitement tes pions.'
        : '✨ Bravo! Excellent move: your new gate secures your checkers perfectly.';
    }
    if (prematureDoubleWarning) {
      return lang === 'fr'
        ? "Pas encore ! On ne double que lorsqu'on a un net avantage. Continue en lançant les dés !"
        : "Not yet! Only double points when you have a clear lead. Continue by rolling dice!";
    }
    if (lastMoveFeedback && (!dice || (dice[0] === 0 && dice[1] === 0))) {
      if (!isOptimalFeedback) {
        return lang === 'fr'
          ? `Hmm, attention ! Ce coup laisse un pion tout seul en danger. Tu aurais pu jouer ${lastMoveFeedback.optimalMove || 'le coup conseillé'}.`
          : `Hmm, careful! That move leaves a checker isolated in danger. You could have played ${lastMoveFeedback.optimalMove || 'the suggested move'}.`;
      }
      return getFeedbackAdvice(lastMoveFeedback, lang);
    }
    if (activeTurn === 'X' && (!dice || (dice[0] === 0 && dice[1] === 0))) {
      const hasCheckerOnBar = Boolean(boardState && boardState.board[0] > 0);
      if (hasCheckerOnBar) {
        return lang === 'fr'
          ? 'Dame sur la barre ! Clique sur Lancer les dés : ta priorité absolue est de rentrer en Cases 24 à 19.'
          : 'Checker on the bar! Click Roll Dice: your priority is re-entering on Points 24 to 19.';
      }
      return lang === 'fr'
        ? "C'est à ton tour ! Clique sur Lancer les dés au centre pour avancer."
        : "It's your turn! Click Roll Dice in the center to move your checkers.";
    }
    if (proactive) return proactive.text;
    if (lastBotNotation && activeTurn === 'X' && !dice) return getBotMoveExplanation(lastBotNotation, lang);
    if (activeTurn === 'O') return lang === 'fr' ? "L'adversaire analyse la position..." : 'Opponent is thinking...';
    if (activeBestNotation) {
      return lang === 'fr'
        ? 'Je te conseille de suivre les flèches dorées sur le plateau pour mettre tes deux pions ensemble !'
        : 'Follow the golden arrows on the board to unite your two checkers safely!';
    }
    return lang === 'fr' ? "C'est à ton tour ! Clique sur Lancer les dés au centre." : "It's your turn! Click Roll Dice in the center.";
  };

  const getRaceCompassText = (): string => {
    if (!boardState?.board) return '';
    const { X: playerPips, O: opponentPips } = pipCount(boardState.board);
    if (playerPips > opponentPips) {
      return lang === 'fr' ? `🛡️ Retard de ${playerPips - opponentPips} pips : garde une défense solide !` : `🛡️ ${playerPips - opponentPips} pips behind: stay solid!`;
    }
    if (playerPips < opponentPips) {
      return lang === 'fr' ? `🏃 Avance de ${opponentPips - playerPips} pips : ramène tes dames sans risque.` : `🏃 Leading by ${opponentPips - playerPips} pips: bring checkers home!`;
    }
    return lang === 'fr' ? `⚖️ Course égale (${playerPips} pips) : construis tes portes.` : `⚖️ Tied race (${playerPips} pips): build your gates.`;
  };

  const handleSpeakPrompt = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || soundEngine.isMute()) return;
    if (isSpeaking) { window.speechSynthesis.cancel(); setIsSpeaking(false); return; }
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(getProfessorPrompt().replace(/^[^\w\s]+/u, '').trim());
    utt.lang = lang === 'fr' ? 'fr-FR' : 'en-US';
    utt.onend = () => setIsSpeaking(false);
    utt.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utt);
  };

  const currentNotice = activeNotice ?? antiFrustrationNotice;

  return (
    <>
      <div data-testid="live-professor-coach-overlay" className="w-full max-w-4xl mx-auto px-2 py-1 mb-1 shrink-0 z-40 select-none animate-in fade-in slide-in-from-top-2 duration-300">
        <div className="flex items-start sm:items-center gap-3">
          {/* Médaillon du Vieux Professeur */}
          <div className="relative w-12 h-12 rounded-full border-2 border-[#D4AF37] shadow-lg overflow-hidden shrink-0 bg-stone-900 mt-0.5 sm:mt-0">
            <img src="/avatars/einstein-quiz-coach.jpg" alt="Le Professeur" className="w-full h-full object-cover" />
            <span className="absolute inset-0 rounded-full border border-amber-300/40 animate-ping pointer-events-none opacity-40" />
          </div>

          {/* Bulle BD avec queue triangulaire */}
          <div className={`relative flex-1 bg-[#0B0E14]/95 backdrop-blur-md border ${showOptimalBadge ? 'border-emerald-400/70 shadow-[0_0_20px_rgba(52,211,153,0.35)]' : 'border-[#D4AF37]/45 shadow-xl'} rounded-2xl px-3.5 py-2 text-zinc-100`}>
            {/* Pointe triangulaire pointant vers la bouche du Professeur */}
            <div className={`absolute top-4 -left-2 w-0 h-0 border-y-[6px] border-y-transparent border-r-[8px] ${showOptimalBadge ? 'border-r-emerald-400/70' : 'border-r-[#D4AF37]/50'}`} />
            <div className="absolute top-4 -left-[6px] w-0 h-0 border-y-[6px] border-y-transparent border-r-[8px] border-r-[#0B0E14]" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5">
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap pb-0.5">
                  <span className="font-extrabold uppercase tracking-wider text-[11px] text-[#D4AF37]">
                    {lang === 'fr' ? 'Le Professeur' : 'The Professor'}
                  </span>
                  {showOptimalBadge && (
                    <span data-testid="optimal-celebration-badge" className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full bg-emerald-500/25 border border-emerald-400 text-emerald-300 font-bold text-[10px] animate-bounce">
                      <Award className="w-3 h-3 text-emerald-400" />
                      <span>{lang === 'fr' ? '✨ BRAVO !' : '✨ BRAVO!'}</span>
                    </span>
                  )}
                  {showMasterBadge && (
                    <span data-testid="master-move-badge" className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full bg-amber-500/20 border border-[#D4AF37]/60 text-[#f3d27a] font-bold text-[10px] animate-pulse">
                      <Award className="w-3 h-3 text-[#D4AF37]" />
                      <span>{lang === 'fr' ? 'Coup de Maître !' : 'Master Move!'}</span>
                    </span>
                  )}
                </div>
                <p data-testid="professor-dialogue-text" className="text-xs sm:text-sm font-medium text-white leading-snug break-words">
                  {getProfessorPrompt()}
                </p>
              </div>

              {/* Actions de la bulle BD */}
              <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                {activeBestNotation && dice && (dice[0] > 0 || dice[1] > 0) && (
                  <button
                    type="button" data-testid="professor-show-arrow-btn" onClick={onToggleRecommendArrow}
                    aria-label={isShowingRecommendArrow ? (lang === 'fr' ? 'Masquer flèches' : 'Hide arrows') : (lang === 'fr' ? 'Flèches' : 'Arrows')}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition border ${isShowingRecommendArrow ? 'bg-[#D4AF37] text-slate-950 border-[#D4AF37] shadow' : 'bg-[#D4AF37]/20 text-[#f3d27a] border-[#D4AF37]/50'}`}
                  >
                    {isShowingRecommendArrow ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{isShowingRecommendArrow ? (lang === 'fr' ? 'Masquer' : 'Hide') : (lang === 'fr' ? 'Flèches' : 'Arrows')}</span>
                  </button>
                )}
                <button type="button" data-testid="professor-voice-btn" onClick={handleSpeakPrompt} aria-label={lang === 'fr' ? 'Écouter' : 'Listen'} className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-amber-300 border border-white/10 transition">
                  <Volume2 className="w-3 h-3" />
                </button>
                <button type="button" data-testid="professor-open-guide-btn" onClick={() => setIsGuideOpen(true)} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-stone-200 border border-white/10 text-xs transition">
                  <BookOpen className="w-3 h-3 text-[#D4AF37]" />
                  <span>{lang === 'fr' ? 'Guide' : 'Guide'}</span>
                </button>
                {canUndo && (
                  <button type="button" data-testid="professor-undo-move-btn" onClick={onUndoMove} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition">
                    <RotateCcw className="w-3 h-3 text-amber-300" />
                    <span>↺ {lang === 'fr' ? 'Rejouer' : 'Retry'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Micro-barre de course / alerte intégrée au bas de la bulle */}
            <div className="flex items-center justify-between text-[11px] text-stone-300 pt-1 mt-1 border-t border-white/10">
              <span className="font-medium text-[#f3d27a] truncate max-w-[85%]">{getRaceCompassText()}</span>
              {currentNotice && (
                <div data-testid="professor-anti-frustration-alert" className="flex items-center gap-1 text-amber-200 text-[10px]">
                  <ShieldAlert className="w-3 h-3 text-amber-400 shrink-0" />
                  <span>{currentNotice === 'BAR_PRIORITY' ? 'Dame sur la barre !' : 'Case bloquée'}</span>
                  <button type="button" onClick={() => setActiveNotice(null)} className="text-stone-400 hover:text-white px-0.5">✕</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isGuideOpen && (
        <BeginnerInteractiveGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} onStartGuidedMatch={() => setIsGuideOpen(false)} />
      )}
    </>
  );
}

export default LiveProfessorCoachOverlay;
