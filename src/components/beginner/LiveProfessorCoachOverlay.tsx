'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { RotateCcw, Volume2, BookOpen, ShieldAlert, Award, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from '../../i18n';
import type { LastMoveFeedback } from '../../hooks/useCoachHelpers';
import type { MatchLogEntry } from '../../actions/types';
import { pipCount, type BoardState } from '../../engine/backgammonEngine';
import { BeginnerInteractiveGuideModal } from './BeginnerInteractiveGuideModal';
import {
  getProactiveAdvice,
  getFeedbackAdvice,
  getBotMoveExplanation,
  evaluateInstantHumanLogEntry,
} from './professorAdviceHelper';
import { soundEngine } from '../../lib/sound/soundEngine';

export interface LiveProfessorCoachOverlayProps {
  locale?: string; dice?: [number, number] | null; canUndo?: boolean; onUndoMove?: () => void;
  onAskProfessorHint?: () => void; lastMoveFeedback?: LastMoveFeedback | null; pipDifference?: number;
  antiFrustrationNotice?: 'BAR_PRIORITY' | 'CLOSED_POINT' | null; isMasterMove?: boolean;
  optimalMove?: string | null; whyOptimal?: string | null; lastBotNotation?: string | null;
  lastBotDice?: readonly [number, number] | null; matchLog?: ReadonlyArray<MatchLogEntry>;
  turnStartBoard?: readonly number[]; activeTurn?: 'X' | 'O'; boardState?: BoardState;
  onToggleRecommendArrow?: () => void; onHoverNotation?: (notation: string | null) => void;
  isShowingRecommendArrow?: boolean; prematureDoubleWarning?: boolean; onReplayMove?: () => void;
}

export function LiveProfessorCoachOverlay({
  locale: propLocale, dice, canUndo = true, onUndoMove, lastMoveFeedback,
  antiFrustrationNotice, isMasterMove = false, optimalMove, lastBotNotation, lastBotDice,
  matchLog, turnStartBoard, activeTurn = 'X', boardState, onToggleRecommendArrow,
  onHoverNotation, isShowingRecommendArrow = true, prematureDoubleWarning = false, onReplayMove,
}: LiveProfessorCoachOverlayProps) {
  const { locale: contextLocale } = useTranslation();
  const lang = (propLocale || contextLocale || 'fr') === 'en' ? 'en' : 'fr';
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeNotice, setActiveNotice] = useState<'BAR_PRIORITY' | 'CLOSED_POINT' | null>(antiFrustrationNotice ?? null);
  const [showMasterBadge, setShowMasterBadge] = useState(false);
  const [showOptimalBadge, setShowOptimalBadge] = useState(false);
  const lastCelebratedTurnRef = useRef<number>(-1);

  useEffect(() => () => { if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel(); }, []);

  const lastLogEntry = matchLog && matchLog.length > 0 ? matchLog[matchLog.length - 1] : null;
  const hasRolledDice = Boolean(dice && (dice[0] > 0 || dice[1] > 0));

  // Isolation stricte des 3 moments :
  // MOMENT C : Le joueur humain (X) a lancé ses dés
  const isMomentC = activeTurn === 'X' && hasRolledDice;
  // MOMENT A : Le joueur humain (X) vient de valider son coup (dernier coup du log = X)
  const isMomentA = !isMomentC && (lastLogEntry ? lastLogEntry.player === 'X' : Boolean(lastMoveFeedback));
  // MOMENT B : Le Bot (O) vient de jouer son coup et c'est à X de lancer les dés
  const isMomentB = !isMomentC && !isMomentA && (lastLogEntry?.player === 'O' || Boolean(lastBotNotation));

  const humanFeedback = useMemo<LastMoveFeedback | null>(() => {
    if (lastLogEntry && lastLogEntry.player === 'X') {
      if (lastMoveFeedback && lastMoveFeedback.turnIndex === lastLogEntry.turnIndex) {
        return lastMoveFeedback;
      }
      return evaluateInstantHumanLogEntry(lastLogEntry, boardState);
    }
    if (!matchLog || matchLog.length === 0) return lastMoveFeedback ?? null;
    return null;
  }, [lastLogEntry, lastMoveFeedback, boardState, matchLog]);

  const isOptimalHumanMove = useMemo(() => {
    if (!humanFeedback) return false;
    return humanFeedback.verdict === 'optimal' || Math.abs(humanFeedback.equityLoss) <= 0.020;
  }, [humanFeedback]);

  // En cas d'erreur au coup précédent de X même après que O ait joué, permettre de cliquer Rejouer
  const prevHumanEntry = useMemo(() => {
    if (!matchLog || matchLog.length === 0) return null;
    for (let i = matchLog.length - 1; i >= 0; i--) {
      if (matchLog[i].player === 'X') return matchLog[i];
    }
    return null;
  }, [matchLog]);

  const evalBoardState = useMemo<BoardState | undefined>(() => {
    if (!boardState) return undefined;
    if (turnStartBoard && turnStartBoard.length === 26) {
      return { ...boardState, board: [...turnStartBoard], turn: 'X' };
    }
    return boardState;
  }, [boardState, turnStartBoard]);

  const proactive = useMemo(
    () => (evalBoardState && isMomentC && dice ? getProactiveAdvice(evalBoardState, dice, lang) : null),
    [evalBoardState, isMomentC, dice, lang],
  );

  const safeOptimalMove = optimalMove && /\d/.test(optimalMove) ? optimalMove : '';
  const activeBestNotation = proactive?.bestNotation || safeOptimalMove;

  useEffect(() => {
    if (isShowingRecommendArrow && isMomentC && activeBestNotation) {
      onHoverNotation?.(activeBestNotation);
    } else {
      onHoverNotation?.(null);
    }
  }, [isShowingRecommendArrow, isMomentC, dice?.[0], dice?.[1], activeBestNotation, onHoverNotation]);

  useEffect(() => {
    if (isMasterMove && isMomentA) {
      setShowMasterBadge(true);
      const timer = setTimeout(() => setShowMasterBadge(false), 3000);
      return () => clearTimeout(timer);
    }
    setShowMasterBadge(false);
  }, [isMasterMove, isMomentA]);

  useEffect(() => {
    // INTERDICTION ABSOLUE d'afficher Bravo en Moment B (quand le Bot O vient de jouer) ou Moment C
    if (!isMomentA || !isOptimalHumanMove || !humanFeedback) {
      setShowOptimalBadge(false);
      return;
    }
    setShowOptimalBadge(true);
    const turnIdx = humanFeedback.turnIndex ?? 0;
    if (lastCelebratedTurnRef.current !== turnIdx) {
      lastCelebratedTurnRef.current = turnIdx;
      try { soundEngine.playBrilliantMove(); } catch { /* ignore */ }
    }
    const timer = setTimeout(() => setShowOptimalBadge(false), 3500);
    return () => clearTimeout(timer);
  }, [isMomentA, isOptimalHumanMove, humanFeedback]);

  const getProfessorPrompt = (): string => {
    if (prematureDoubleWarning) {
      return lang === 'fr'
        ? "Pas encore ! On ne double que lorsqu'on a un net avantage. Continue en lançant les dés !"
        : 'Not yet! Only double points when you have a clear lead. Continue by rolling dice!';
    }
    // MOMENT C : Le joueur humain (X) vient de lancer ses dés
    if (isMomentC) {
      if (proactive) return proactive.text;
      if (activeBestNotation && dice) {
        return lang === 'fr'
          ? `🎯 Dé ${dice[0]}-${dice[1]} : joue ${activeBestNotation} (suis les flèches dorées sur le plateau) pour avancer en sécurité !`
          : `🎯 Dice ${dice[0]}-${dice[1]}: Play ${activeBestNotation} (follow the golden arrows on the board) to advance safely!`;
      }
    }
    // MOMENT A : Le joueur humain (X) vient de valider son coup (et O n'a pas encore fini)
    if (isMomentA && humanFeedback) {
      return getFeedbackAdvice(humanFeedback, lang);
    }
    // MOMENT B : Le Bot (O) vient de jouer son coup -> jamais de Bravo, explication du coup de O + invitation à lancer les dés
    const botNotation = (lastLogEntry?.player === 'O' ? lastLogEntry.notation : null) ?? lastBotNotation;
    const botRoll = (lastLogEntry?.player === 'O' ? lastLogEntry.dice : null) ?? lastBotDice;
    if (isMomentB && botNotation) {
      return getBotMoveExplanation(botNotation, lang, botRoll);
    }
    if (activeTurn === 'X' && !hasRolledDice) {
      const hasCheckerOnBar = Boolean(boardState && boardState.board[0] > 0);
      if (hasCheckerOnBar) {
        return lang === 'fr'
          ? 'Dame sur la barre ! Clique sur « Lancer les dés » : ta priorité absolue est de rentrer en Cases 24 à 19.'
          : 'Checker on the bar! Click "Roll Dice": your priority is re-entering on Points 24 to 19.';
      }
      return lang === 'fr'
        ? "C'est à ton tour ! Clique sur « Lancer les dés » au centre du plateau pour commencer."
        : "It's your turn! Click \"Roll Dice\" in the center of the board to start.";
    }
    return lang === 'fr' ? "J'observe ton coup et je prépare mes dés..." : 'I am watching your move and preparing my dice...';
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
    const utt = new SpeechSynthesisUtterance(getProfessorPrompt().replace(/^[^\w\sÀ-ÿ]+/u, '').trim());
    utt.lang = lang === 'fr' ? 'fr-FR' : 'en-US';
    utt.onend = () => setIsSpeaking(false);
    utt.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utt);
  };

  const isErrorMomentA = isMomentA && Boolean(humanFeedback && !isOptimalHumanMove);
  const canShowReplayBtn = canUndo || Boolean(onReplayMove && (isErrorMomentA || prevHumanEntry));
  const currentNotice = activeNotice ?? antiFrustrationNotice;

  const bubbleAppearance = showOptimalBadge
    ? 'bg-gradient-to-r from-emerald-950/95 via-[#0B261C]/95 to-emerald-950/95 border-2 border-emerald-400 shadow-[0_0_28px_rgba(52,211,153,0.45)] ring-1 ring-[#D4AF37]/70'
    : isErrorMomentA
      ? 'bg-gradient-to-r from-[#26120B]/95 via-[#1F110B]/95 to-[#170C08]/95 border-2 border-amber-400/90 shadow-[0_0_24px_rgba(251,191,36,0.32)]'
      : 'bg-gradient-to-r from-[#17130A]/95 via-[#1E180D]/95 to-[#141008]/95 border-2 border-[#D4AF37]/85 shadow-[0_8px_28px_rgba(212,175,55,0.28)]';

  return (
    <>
      <div data-testid="live-professor-coach-overlay" className="w-full max-w-4xl mx-auto px-2 py-1 mb-1 shrink-0 z-40 select-none animate-in fade-in slide-in-from-top-2 duration-300">
        <div className="flex items-start sm:items-center gap-3">
          {/* Médaillon expressif du Vieux Professeur */}
          <div className={`relative w-13 h-13 sm:w-14 sm:h-14 rounded-full border-2 ${showOptimalBadge ? 'border-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.6)]' : 'border-[#D4AF37] shadow-[0_0_16px_rgba(212,175,55,0.45)]'} overflow-hidden shrink-0 bg-stone-900 mt-0.5 sm:mt-0`}>
            <img src="/avatars/einstein-quiz-coach.jpg" alt="Le Professeur" className="w-full h-full object-cover" />
            <span className="absolute inset-0 rounded-full border border-amber-300/40 animate-ping pointer-events-none opacity-40" />
          </div>

          {/* Vraie fenêtre Bulle BD parlante avec queue triangulaire */}
          <div className={`relative flex-1 backdrop-blur-md rounded-2xl px-4 py-2 text-zinc-100 transition-colors duration-300 ${bubbleAppearance}`}>
            <div className={`absolute top-4 -left-2.5 w-0 h-0 border-y-[7px] border-y-transparent border-r-[10px] ${showOptimalBadge ? 'border-r-emerald-400' : isErrorMomentA ? 'border-r-amber-400/90' : 'border-r-[#D4AF37]/85'}`} />
            <div className="absolute top-4 -left-[7px] w-0 h-0 border-y-[7px] border-y-transparent border-r-[10px] border-r-[#17130A]" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap pb-0.5">
                  <span className="font-extrabold uppercase tracking-wider text-[11px] text-[#F3E5AB]">
                    🎓 {lang === 'fr' ? 'Le Professeur — Bulle Directe' : 'The Professor — Live Coach'}
                  </span>
                  {showOptimalBadge && (
                    <span data-testid="optimal-celebration-badge" className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/30 border border-emerald-300 text-emerald-200 font-extrabold text-[11px] animate-bounce">
                      <Award className="w-3.5 h-3.5 text-emerald-300" />
                      <span>{lang === 'fr' ? '✨ BRAVO ! COUP OPTIMAL' : '✨ BRAVO! OPTIMAL MOVE'}</span>
                    </span>
                  )}
                  {showMasterBadge && (
                    <span data-testid="master-move-badge" className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-[#D4AF37]/60 text-[#f3d27a] font-bold text-[10px] animate-pulse">
                      <Award className="w-3 h-3 text-[#D4AF37]" />
                      <span>{lang === 'fr' ? 'Coup de Maître !' : 'Master Move!'}</span>
                    </span>
                  )}
                </div>
                <p data-testid="professor-dialogue-text" className="text-xs sm:text-[13.5px] font-bold text-white leading-snug break-words drop-shadow-sm">
                  {getProfessorPrompt()}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                {activeBestNotation && isMomentC && (
                  <button
                    type="button" data-testid="professor-show-arrow-btn" onClick={onToggleRecommendArrow}
                    aria-label={isShowingRecommendArrow ? (lang === 'fr' ? 'Masquer flèches' : 'Hide arrows') : (lang === 'fr' ? 'Flèches' : 'Arrows')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-extrabold transition border ${isShowingRecommendArrow ? 'bg-[#D4AF37] text-slate-950 border-[#D4AF37] shadow-md' : 'bg-[#D4AF37]/20 text-[#f3d27a] border-[#D4AF37]/50'}`}
                  >
                    {isShowingRecommendArrow ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{isShowingRecommendArrow ? (lang === 'fr' ? 'Masquer' : 'Hide') : (lang === 'fr' ? 'Flèches' : 'Arrows')}</span>
                  </button>
                )}
                <button type="button" data-testid="professor-voice-btn" onClick={handleSpeakPrompt} aria-label={lang === 'fr' ? 'Écouter' : 'Listen'} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[#F3E5AB] border border-[#D4AF37]/40 text-xs font-bold transition">
                  <Volume2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span className="hidden md:inline">{lang === 'fr' ? 'Écouter' : 'Listen'}</span>
                </button>
                <button type="button" data-testid="professor-open-guide-btn" onClick={() => setIsGuideOpen(true)} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-stone-100 border border-white/15 text-xs font-semibold transition">
                  <BookOpen className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>{lang === 'fr' ? 'Guide' : 'Guide'}</span>
                </button>
                {canShowReplayBtn && (
                  <button
                    type="button" data-testid="professor-undo-move-btn"
                    onClick={() => { if (canUndo && onUndoMove) onUndoMove(); else if (onReplayMove) onReplayMove(); }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/60 text-amber-200 font-extrabold text-xs transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-300" />
                    <span>↺ {lang === 'fr' ? 'Rejouer mon coup' : 'Replay move'}</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-stone-300 pt-1 mt-1 border-t border-white/10">
              <span className="font-semibold text-[#f3d27a] truncate max-w-[85%]">{getRaceCompassText()}</span>
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
