'use client';

/**
 * Zone centrale de jeu (Plateau interactif + Éclairage Zénithal + Panneau Coach, < 270 lignes, 0 any).
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { ThemeName, CoachHighlight } from './boardThemes';
import type { BoardState } from '../../engine/backgammonEngine';
import type { UseBackgammonGameReturn } from '../../hooks/useBackgammonGame';
import type { BuildMatchContextParams } from '../../features/coach/matchContext';
import type { RawGameTurn } from '../../features/rating';
import type { CoachAnalysisHistoryEntry } from '../../hooks/useCoach';
import type { LastMoveFeedback } from '../../hooks/coach/coachTypes';
import type { PlayerEloProfile } from '../../features/multiplayer/types';
import { useInteractiveReplay } from '../../hooks/useInteractiveReplay';
import { useFischerClock } from '../../hooks/useFischerClock';
import { getRecommendedClockConfig } from '../../features/multiplayer/clockManager';
import { BoardPortraitTopHud, BoardPortraitBottomHud } from './BoardSideRails';
import CoachSidebar, { type CoachSidebarProps } from '../coach/CoachSidebar';
import GameBoardReplayControls from './GameBoardReplayControls';
import GameBoardCenterStage from './GameBoardCenterStage';
import MoveErrorPopToast from '../coach/MoveErrorPopToast';
import { usePlayerTierGate } from '../../hooks/usePlayerTierGate';
const NOOP = () => {};

export interface GameBoardAreaProps {
    theme: ThemeName; game: UseBackgammonGameReturn; activeDie: 0 | 1; isBoardLoading: boolean;
    activeCoachHighlight: CoachHighlight | null; onCheckerClick: (point: number) => void;
    onCheckerRightClick: (point: number) => void; onDestinationClick: (destination: number) => void;
    onPlayMove: (from: number, to: number, die?: 0 | 1) => void; onSelectDie: (die: 0 | 1) => void;
    onDiceClick?: () => void; onDeselect: () => void; coach: CoachSidebarProps['coach'];
    isAnalyzing: boolean; onDismissCoach: () => void; onReplayMove?: () => void;
    onOpenKnowledgeConcept?: (conceptId: string) => void; onBlunderClick?: () => void;
    onCandidateHover?: (notation: string | null) => void; turnsHistory?: unknown[];
    coachHistory?: ReadonlyArray<CoachAnalysisHistoryEntry>; selectedCoachHistoryIndex?: number | null;
    onSelectCoachHistoryIndex?: (index: number | null) => void; onTriggerCoach: () => void;
    matchStats?: CoachSidebarProps['matchStats']; matchStatsO?: CoachSidebarProps['matchStatsO'];
    prX?: number | null; prO?: number | null; lastMoveFeedback?: LastMoveFeedback | null;
    locale?: string; gameId: string; matchContext?: Partial<BuildMatchContextParams>;
    isMatchStarted?: boolean; playerColor?: 'X' | 'O'; onBackToLobby?: () => void;
    onToggleTheme?: () => void; challengerProfile?: PlayerEloProfile | null;
    onSendQuickChat?: (id: 'gg' | 'nice_move' | 'unlucky' | 'thanks' | 'thinking') => void;
    onOfferDouble?: () => void; onTakeDouble?: () => void; onPassDouble?: () => void; isPrematureDouble?: boolean;
    isOnlinePvpMatch?: boolean;
    isFullFocusMode?: boolean;
}

const GameBoardAreaComponent: React.FC<GameBoardAreaProps> = ({
    theme, game, activeDie, isBoardLoading, activeCoachHighlight,
    onCheckerClick, onCheckerRightClick, onDestinationClick, onPlayMove,
    onSelectDie, onDiceClick, onDeselect, coach, isAnalyzing,
    onDismissCoach, onReplayMove, onOpenKnowledgeConcept, onBlunderClick,
    onCandidateHover, turnsHistory, coachHistory = [], selectedCoachHistoryIndex = null,
    onSelectCoachHistoryIndex, onTriggerCoach, matchStats, matchStatsO, prX, prO, lastMoveFeedback, locale,
    gameId, matchContext, isMatchStarted = true, playerColor = 'X', onBackToLobby, onToggleTheme,
    challengerProfile = null, onSendQuickChat, onOfferDouble, onTakeDouble, onPassDouble, isPrematureDouble = false,
    isOnlinePvpMatch: propIsOnlineMatch = false,
    isFullFocusMode,
}) => {
    const { tierGate } = usePlayerTierGate();
    const isXTurn = game.state.turn === 'X';
    const [replayViewPhase, setReplayViewPhase] = useState<'before' | 'after'>('before');
    const [previewBoardMode, setPreviewBoardMode] = useState<'live' | 'before'>('live');
    const [internalFocusFullBoard, setInternalFocusFullBoard] = useState<boolean>(true);
    const isFocusFullBoard = typeof isFullFocusMode === 'boolean' ? isFullFocusMode : internalFocusFullBoard;
    const setIsFocusFullBoard = setInternalFocusFullBoard;
    const [isBrowserFullscreen, setIsBrowserFullscreen] = useState<boolean>(false);
    const [autoRollEnabled, setAutoRollEnabled] = useState<boolean>(() => {
        if (typeof localStorage === 'undefined') return false;
        try { return localStorage.getItem('bg_auto_roll_enabled') === 'true'; } catch { return false; }
    });
    const handleToggleAutoRoll = useCallback(() => {
        setAutoRollEnabled((prev) => {
            const next = !prev;
            try { localStorage.setItem('bg_auto_roll_enabled', String(next)); } catch {}
            return next;
        });
    }, []);

    const clockConfig = useMemo(() => getRecommendedClockConfig(game.state.matchLength || 7, 'bronstein', 'normal'), [game.state.matchLength]);
    const clock = useFischerClock({ config: clockConfig, activePlayer: game.state.turn, isPaused: !isMatchStarted || game.phase === 'GAME_OVER' });
    const activeDelaySeconds = clock.delayRemainingMs > 0 ? Math.ceil(clock.delayRemainingMs / 1000) : 0;

    useEffect(() => {
        if (typeof document === 'undefined') return;
        const onFsChange = () => setIsBrowserFullscreen(Boolean(document.fullscreenElement));
        document.addEventListener('fullscreenchange', onFsChange);
        return () => document.removeEventListener('fullscreenchange', onFsChange);
    }, []);

    const handleToggleBrowserFullscreen = useCallback(() => {
        if (typeof document === 'undefined') return;
        if (!document.fullscreenElement) {
            setIsFocusFullBoard(true);
            document.documentElement.requestFullscreen?.().catch(() => {});
        } else {
            document.exitFullscreen?.().catch(() => {});
        }
    }, []);

    const effectiveTurns = useMemo<RawGameTurn[]>(() => {
        const log = game.matchLog ?? [];
        if (log.length > 0) {
            return log.map((e) => ({
                turnNumber: e.turnIndex, player: e.player, dice: [e.dice[0], e.dice[1]],
                boardBefore: [...e.boardBefore], boardAfter: [...e.boardAfter], moves: [...e.movePlayed],
            }));
        }
        return Array.isArray(turnsHistory) && turnsHistory.length > 0 ? (turnsHistory as RawGameTurn[]) : [];
    }, [turnsHistory, game.matchLog]);

    const replay = useInteractiveReplay({ turnsHistory: effectiveTurns, liveBoard: game.state.board });

    useEffect(() => {
        if (!autoRollEnabled || !replay.isLive || !isMatchStarted) return;
        const isWaiting = game.gamePhase === 'HUMAN_WAITING_ROLL' || game.phase === 'WAITING_FOR_ROLL';
        if (isWaiting && game.state.turn === 'X' && !game.state.dice && game.doublingOfferedBy === null) {
            const timer = setTimeout(() => { game.rollDice(); }, 220);
            return () => clearTimeout(timer);
        }
    }, [autoRollEnabled, replay.isLive, isMatchStarted, game]);

    const replayCoachEntry = useMemo<CoachAnalysisHistoryEntry | null>(() => {
        if (replay.isLive || !replay.selectedTurn || replay.selectedTurn.player !== 'X') return null;
        const targetTurnNum = replay.selectedTurn.turnNumber;
        return (
            coachHistory.find((h) => h.turnIndex === targetTurnNum) ??
            coachHistory.find((h) => h.boardBefore.join(',') === replay.selectedTurn?.boardBefore.join(',')) ??
            null
        );
    }, [replay.isLive, replay.selectedTurn, coachHistory]);

    const displayCoach = !replay.isLive && replayCoachEntry ? replayCoachEntry.coachState : coach;

    const displayState = useMemo<BoardState>(() => {
        if (!replay.isLive && replay.selectedTurn) {
            const targetBoard = replayViewPhase === 'before' ? replay.selectedTurn.boardBefore : replay.selectedTurn.boardAfter;
            return { ...game.state, board: [...targetBoard], turn: replay.selectedTurn.player, dice: [...replay.selectedTurn.dice] as [number, number] };
        }
        if ((previewBoardMode === 'before' || selectedCoachHistoryIndex !== null) && displayCoach?.boardBefore && displayCoach.boardBefore.length === 26) {
            return { ...game.state, board: [...displayCoach.boardBefore] };
        }
        return game.state;
    }, [replay.isLive, replay.selectedTurn, replayViewPhase, previewBoardMode, selectedCoachHistoryIndex, displayCoach, game.state]);

    const displayCoachHighlight = useMemo<CoachHighlight | null>(() => {
        if (replay.isLive) {
            if (!game.dice || (game.dice[0] === 0 && game.dice[1] === 0) || game.gamePhase !== 'HUMAN_MOVING' || game.state.turn !== 'X') return null;
            if (previewBoardMode === 'before' || selectedCoachHistoryIndex !== null) return activeCoachHighlight;
            if (displayCoach?.boardBefore && displayCoach.boardBefore.length === 26 && displayCoach.boardBefore.join(',') !== game.state.board.join(',')) return null;
            return activeCoachHighlight;
        }
        if (!replay.selectedTurn || replayViewPhase === 'after') return null;
        if (replayCoachEntry?.highlight) return replayCoachEntry.highlight;
        return replay.selectedTurn.player === 'X' ? { optimal: [...replay.selectedTurn.moves], played: [] } : null;
    }, [replay.isLive, previewBoardMode, selectedCoachHistoryIndex, displayCoach, game.state.board, replay.selectedTurn, replayViewPhase, replayCoachEntry, activeCoachHighlight, game.dice, game.gamePhase, game.state.turn]);

    const handleSyncedReplayMove = () => {
        if (!replay.isLive && replay.selectedTurn && game.rewindToLogTurn) {
            game.rewindToLogTurn(replay.selectedTurn.turnNumber);
            replay.returnToLive(); setPreviewBoardMode('live'); onSelectCoachHistoryIndex?.(null); onDismissCoach();
            return;
        }
        setPreviewBoardMode('live'); replay.returnToLive(); onReplayMove?.();
    };

    const isOnlinePvpMatch = Boolean(propIsOnlineMatch || challengerProfile || onSendQuickChat);
    const isGuided = !isOnlinePvpMatch && Boolean(tierGate === 'BEGINNER' || game.difficulty === 'beginner');

    return (
        <div className="w-full max-w-full h-full min-h-0 min-w-0 flex-1 overflow-hidden relative grid grid-cols-[minmax(0,1fr)] lg:grid-cols-12 gap-1 sm:gap-3 [@media(max-height:500px)]:!gap-0 max-w-[1920px] mx-auto px-0 sm:px-2 pb-0.5 sm:pb-1 [@media(max-height:500px)]:!p-0">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-0" style={{ background: 'radial-gradient(ellipse 72% 60% at 50% 45%, rgba(245, 196, 81, 0.10) 0%, rgba(16, 185, 129, 0.04) 42%, rgba(0, 0, 0, 0.55) 100%)' }} />

            <div data-testid="board-main-column" className={`col-span-1 ${isFocusFullBoard ? 'lg:col-span-12' : 'lg:col-span-8'} h-full min-h-0 min-w-0 max-w-full flex flex-col items-center justify-center gap-0 overflow-hidden w-full relative z-10 transition-all duration-200`}>
                {!isOnlinePvpMatch && (
                    <MoveErrorPopToast
                        feedback={lastMoveFeedback} boardBefore={lastMoveFeedback?.boardBefore ?? displayCoach?.boardBefore}
                        boardAfter={lastMoveFeedback?.boardAfter ?? game.state.board} onReplayMove={handleSyncedReplayMove}
                        onOpenCoach={() => { setIsFocusFullBoard(false); onTriggerCoach(); }} isBeginner={isGuided}
                    />
                )}

                <BoardPortraitTopHud
                    difficulty={game.difficulty} locale={locale} isXTurn={isXTurn} scoreX={game.state.scoreX} scoreO={game.state.scoreO}
                    cubeValue={game.state.cubeValue} matchLength={game.state.matchLength} turn={game.state.turn}
                    playerClock={clock.formattedX} opponentClock={clock.formattedO} delaySeconds={activeDelaySeconds}
                    prX={prX} prO={prO} challengerProfile={challengerProfile} isGuidedMode={isGuided} isOnlinePvpMatch={isOnlinePvpMatch}
                />

                <GameBoardCenterStage
                    isOnlinePvpMatch={isOnlinePvpMatch} game={game} effectiveTurnsCount={effectiveTurns.length}
                    displayCoach={displayCoach} displayState={displayState} onSyncedReplayMove={handleSyncedReplayMove}
                    onOpenCoach={() => { setIsFocusFullBoard(false); onTriggerCoach(); }} locale={locale}
                    isGuided={isGuided} isXTurn={isXTurn} clock={clock} activeDelaySeconds={activeDelaySeconds}
                    prX={prX} prO={prO} challengerProfile={challengerProfile} onSendQuickChat={onSendQuickChat}
                    isBrowserFullscreen={isBrowserFullscreen} isFocusFullBoard={isFocusFullBoard}
                    onToggleFullscreen={handleToggleBrowserFullscreen} onToggleTheme={onToggleTheme}
                    onBackToLobby={onBackToLobby} replayIsLive={replay.isLive} autoRollEnabled={autoRollEnabled}
                    onToggleAutoRoll={handleToggleAutoRoll} activeDie={activeDie} previewBoardMode={previewBoardMode}
                    setPreviewBoardMode={setPreviewBoardMode} selectedCoachHistoryIndex={selectedCoachHistoryIndex}
                    onSelectCoachHistoryIndex={onSelectCoachHistoryIndex} onCheckerClick={onCheckerClick}
                    onCheckerRightClick={onCheckerRightClick} onDestinationClick={onDestinationClick}
                    onPlayMove={onPlayMove} onSelectDie={onSelectDie} onDiceClick={onDiceClick} onDeselect={onDeselect}
                    displayCoachHighlight={displayCoachHighlight} replaySelectedTurnPlayer={replay.selectedTurn?.player}
                    replayViewPhase={replayViewPhase} replayMoves={replay.selectedTurn?.moves}
                    onOfferDouble={onOfferDouble} onTakeDouble={onTakeDouble} onPassDouble={onPassDouble}
                    isPrematureDouble={isPrematureDouble} theme={theme} isBoardLoading={isBoardLoading}
                    propIsOnlineMatch={propIsOnlineMatch} playerColor={playerColor} isMatchStarted={isMatchStarted}
                    returnToLive={replay.returnToLive}
                />

                <BoardPortraitBottomHud scoreX={game.state.scoreX} turn={game.state.turn} playerClock={clock.formattedX} delaySeconds={activeDelaySeconds} isGuidedMode={isGuided} locale={locale} />

                <GameBoardReplayControls
                    isMatchStarted={isMatchStarted} isOnlinePvpMatch={isOnlinePvpMatch}
                    displayCoach={displayCoach} isAnalyzing={isAnalyzing} difficulty={game.difficulty}
                    isShowingBestMoveArrows={previewBoardMode === 'before'}
                    onToggleBestMoveArrows={() => setPreviewBoardMode((m) => (m === 'before' ? 'live' : 'before'))}
                    onReplayMove={handleSyncedReplayMove} onTriggerCoach={onTriggerCoach}
                    replay={replay} totalTurns={effectiveTurns.length} replayViewPhase={replayViewPhase}
                    onSetReplayViewPhase={setReplayViewPhase}
                    onToggleViewPhase={() => setReplayViewPhase((prev) => (prev === 'before' ? 'after' : 'before'))}
                    playerColor={playerColor} coachHistory={coachHistory} cubeValue={game.state.cubeValue}
                    doublingOfferedBy={game.doublingOfferedBy} onRewindHere={handleSyncedReplayMove}
                    onTriggerGhostChallenge={(turnIdx) => { game.rewindToLogTurn?.(turnIdx); replay.returnToLive(); setPreviewBoardMode('live'); onSelectCoachHistoryIndex?.(null); onDismissCoach(); }}
                    onReturnToLive={() => { setPreviewBoardMode('live'); replay.returnToLive(); }}
                    locale={locale}
                />
            </div>

            <div data-testid="board-coach-column" className={`${isFocusFullBoard ? 'hidden' : 'hidden lg:flex lg:col-span-4'} h-full min-h-0 min-w-0 overflow-hidden relative z-10`}>
                <CoachSidebar
                    coach={displayCoach} isAnalyzing={isAnalyzing}
                    onDismiss={() => { onDismissCoach(); setIsFocusFullBoard(true); }}
                    onReplayMove={handleSyncedReplayMove} onOpenKnowledgeConcept={onOpenKnowledgeConcept} onBlunderClick={onBlunderClick}
                    onCandidateHover={(notation) => {
                        if (notation) setPreviewBoardMode('before');
                        else if (selectedCoachHistoryIndex === null) setPreviewBoardMode('live');
                        onCandidateHover?.(notation);
                    }}
                    turnsHistory={turnsHistory} onTriggerCoach={onTriggerCoach} theme={theme}
                    matchStats={matchStats} matchStatsO={matchStatsO} locale={locale}
                    coachHistory={coachHistory} selectedCoachHistoryIndex={selectedCoachHistoryIndex} onSelectCoachHistoryIndex={onSelectCoachHistoryIndex}
                    matchContext={matchContext} positionKey={displayState.board.join(',')} gameId={gameId}
                    dice={displayState.dice} board={displayState.board} difficulty={game.difficulty}
                    isOnlinePvpMatch={isOnlinePvpMatch} challengerProfile={challengerProfile}
                    onSendQuickChat={onSendQuickChat} scoreX={game.state.scoreX} scoreO={game.state.scoreO}
                    matchLength={game.state.matchLength} prX={prX} prO={prO}
                />
            </div>
        </div>
    );
};

export const GameBoardArea = React.memo(GameBoardAreaComponent);
export default GameBoardArea;
