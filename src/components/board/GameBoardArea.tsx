'use client';

/**
 * Zone centrale de jeu (Plateau interactif + Éclairage Zénithal + Panneau Coach, < 275 lignes, 0 any).
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
import Board from './Board';
import BoardHorologyBar from './BoardHorologyBar';
import BoardLivePersonaBubble from './BoardLivePersonaBubble';
import {
    BoardLeftPlayerRail,
    BoardRightActionRail,
    BoardPortraitTopHud,
    BoardPortraitBottomHud,
} from './BoardSideRails';
import CoachSidebar, { type CoachSidebarProps } from '../coach/CoachSidebar';
import MobilePortraitCoachBanner from '../coach/MobilePortraitCoachBanner';
import MoveErrorPopToast from '../coach/MoveErrorPopToast';
import ErrorBoundary from '../common/ErrorBoundary';
import type { GameSpeed } from '../../lib/gameFeel/speedPresets';

const NEXT_SPEED: Record<GameSpeed, GameSpeed> = { coach: 'tournament', tournament: 'blitz', blitz: 'coach' };
const NOOP = () => {};

export interface GameBoardAreaProps {
    theme: ThemeName;
    game: UseBackgammonGameReturn;
    activeDie: 0 | 1;
    isBoardLoading: boolean;
    activeCoachHighlight: CoachHighlight | null;
    onCheckerClick: (point: number) => void;
    onCheckerRightClick: (point: number) => void;
    onDestinationClick: (destination: number) => void;
    onPlayMove: (from: number, to: number, die?: 0 | 1) => void;
    onSelectDie: (die: 0 | 1) => void;
    onDiceClick?: () => void;
    onDeselect: () => void;
    coach: CoachSidebarProps['coach'];
    isAnalyzing: boolean;
    onDismissCoach: () => void;
    onReplayMove?: () => void;
    onOpenKnowledgeConcept?: (conceptId: string) => void;
    onBlunderClick?: () => void;
    onCandidateHover?: (notation: string | null) => void;
    turnsHistory?: unknown[];
    coachHistory?: ReadonlyArray<CoachAnalysisHistoryEntry>;
    selectedCoachHistoryIndex?: number | null;
    onSelectCoachHistoryIndex?: (index: number | null) => void;
    onTriggerCoach: () => void;
    matchStats?: CoachSidebarProps['matchStats'];
    matchStatsO?: CoachSidebarProps['matchStatsO'];
    prX?: number | null;
    prO?: number | null;
    lastMoveFeedback?: LastMoveFeedback | null;
    locale?: string;
    gameId: string;
    matchContext?: Partial<BuildMatchContextParams>;
    isMatchStarted?: boolean;
    playerColor?: 'X' | 'O';
    onBackToLobby?: () => void;
    onToggleTheme?: () => void;
    challengerProfile?: PlayerEloProfile | null;
}

const GameBoardAreaComponent: React.FC<GameBoardAreaProps> = ({
    theme, game, activeDie, isBoardLoading, activeCoachHighlight,
    onCheckerClick, onCheckerRightClick, onDestinationClick, onPlayMove,
    onSelectDie, onDiceClick, onDeselect, coach, isAnalyzing,
    onDismissCoach, onReplayMove, onOpenKnowledgeConcept, onBlunderClick,
    onCandidateHover, turnsHistory, coachHistory = [], selectedCoachHistoryIndex = null,
    onSelectCoachHistoryIndex, onTriggerCoach, matchStats, matchStatsO, prX, prO, lastMoveFeedback, locale,
    gameId, matchContext, isMatchStarted = true, playerColor = 'X', onBackToLobby, onToggleTheme,
    challengerProfile = null,
}) => {
    const isXTurn = game.state.turn === 'X';
    const [replayViewPhase, setReplayViewPhase] = useState<'before' | 'after'>('before');
    const [previewBoardMode, setPreviewBoardMode] = useState<'live' | 'before'>('live');
    const [isFocusFullBoard, setIsFocusFullBoard] = useState<boolean>(true);
    const [isBrowserFullscreen, setIsBrowserFullscreen] = useState<boolean>(false);

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
                turnNumber: e.turnIndex,
                player: e.player,
                dice: [e.dice[0], e.dice[1]],
                boardBefore: [...e.boardBefore],
                boardAfter: [...e.boardAfter],
                moves: [...e.movePlayed],
            }));
        }
        return Array.isArray(turnsHistory) && turnsHistory.length > 0 ? (turnsHistory as RawGameTurn[]) : [];
    }, [turnsHistory, game.matchLog]);

    const replay = useInteractiveReplay({ turnsHistory: effectiveTurns, liveBoard: game.state.board });

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
            const targetBoard =
                replayViewPhase === 'before' ? replay.selectedTurn.boardBefore : replay.selectedTurn.boardAfter;
            return {
                ...game.state,
                board: [...targetBoard],
                turn: replay.selectedTurn.player,
                dice: [...replay.selectedTurn.dice] as [number, number],
            };
        }
        if (
            (previewBoardMode === 'before' || selectedCoachHistoryIndex !== null) &&
            displayCoach?.boardBefore &&
            displayCoach.boardBefore.length === 26
        ) {
            return { ...game.state, board: [...displayCoach.boardBefore] };
        }
        return game.state;
    }, [replay.isLive, replay.selectedTurn, replayViewPhase, previewBoardMode, selectedCoachHistoryIndex, displayCoach, game.state]);

    const displayCoachHighlight = useMemo<CoachHighlight | null>(() => {
        if (replay.isLive) {
            if (previewBoardMode === 'before' || selectedCoachHistoryIndex !== null) {
                return activeCoachHighlight;
            }
            if (
                displayCoach?.boardBefore &&
                displayCoach.boardBefore.length === 26 &&
                displayCoach.boardBefore.join(',') !== game.state.board.join(',')
            ) {
                return null;
            }
            return activeCoachHighlight;
        }
        if (!replay.selectedTurn || replayViewPhase === 'after') return null;
        if (replayCoachEntry?.highlight) return replayCoachEntry.highlight;
        return replay.selectedTurn.player === 'X' ? { optimal: [...replay.selectedTurn.moves], played: [] } : null;
    }, [replay.isLive, previewBoardMode, selectedCoachHistoryIndex, displayCoach, game.state.board, replay.selectedTurn, replayViewPhase, replayCoachEntry, activeCoachHighlight]);

    const handleSyncedReplayMove = () => {
        if (!replay.isLive && replay.selectedTurn && game.rewindToLogTurn) {
            game.rewindToLogTurn(replay.selectedTurn.turnNumber);
            replay.returnToLive();
            setPreviewBoardMode('live');
            onSelectCoachHistoryIndex?.(null);
            onDismissCoach();
            return;
        }
        setPreviewBoardMode('live');
        replay.returnToLive();
        onReplayMove?.();
    };

    return (
        <div className="w-full max-w-full h-full min-h-0 min-w-0 flex-1 overflow-hidden relative grid grid-cols-[minmax(0,1fr)] lg:grid-cols-12 gap-1 sm:gap-3 [@media(max-height:500px)]:!gap-0 max-w-[1920px] mx-auto px-0 sm:px-2 pb-0.5 sm:pb-1 [@media(max-height:500px)]:!p-0">
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-0"
                style={{
                    background:
                        'radial-gradient(ellipse 72% 60% at 50% 45%, rgba(245, 196, 81, 0.10) 0%, rgba(16, 185, 129, 0.04) 42%, rgba(0, 0, 0, 0.55) 100%)',
                }}
            />

            <div
                data-testid="board-main-column"
                className={`col-span-1 ${isFocusFullBoard ? 'lg:col-span-12' : 'lg:col-span-8'} h-full min-h-0 min-w-0 max-w-full flex flex-col items-center justify-between sm:justify-center gap-0 overflow-hidden w-full relative z-10 transition-all duration-200`}
            >
                <MoveErrorPopToast
                    feedback={lastMoveFeedback}
                    boardBefore={displayCoach?.boardBefore}
                    boardAfter={game.state.board}
                    onReplayMove={handleSyncedReplayMove}
                    onOpenCoach={() => { setIsFocusFullBoard(false); onTriggerCoach(); }}
                />

                <BoardPortraitTopHud
                    difficulty={game.difficulty}
                    locale={locale}
                    isXTurn={isXTurn}
                    scoreX={game.state.scoreX}
                    scoreO={game.state.scoreO}
                    cubeValue={game.state.cubeValue}
                    matchLength={game.state.matchLength}
                    turn={game.state.turn}
                    prX={prX}
                    prO={prO}
                    challengerProfile={challengerProfile}
                />

                <div className="relative flex-1 min-h-0 max-h-full w-full max-w-full min-w-0 flex items-center sm:items-stretch justify-center gap-1.5 sm:gap-4 [@media(max-height:500px)]:!gap-1 px-0 sm:px-3 py-0 sm:py-1.5 [@media(max-height:500px)]:!p-0 overflow-hidden">
                    {!challengerProfile && (
                        <BoardLivePersonaBubble
                            difficulty={game.difficulty}
                            isPlayerThinking={Boolean(game.state.turn === 'X' && game.state.dice)}
                            turnsCount={effectiveTurns.length}
                            verdict={displayCoach?.verdict ?? null}
                            equityLoss={displayCoach?.equityLoss ?? null}
                            boardBefore={displayCoach?.boardBefore}
                            boardAfter={game.state.board}
                            opponentDice={!displayState.dice ? game.lastOpponentDice : null}
                            onReplayMove={handleSyncedReplayMove}
                            onOpenCoach={() => { setIsFocusFullBoard(false); onTriggerCoach(); }}
                        />
                    )}

                    <BoardLeftPlayerRail
                        difficulty={game.difficulty}
                        locale={locale}
                        isXTurn={isXTurn}
                        scoreX={game.state.scoreX}
                        scoreO={game.state.scoreO}
                        cubeValue={game.state.cubeValue}
                        matchLength={game.state.matchLength}
                        turn={game.state.turn}
                        prX={prX}
                        prO={prO}
                        challengerProfile={challengerProfile}
                        isBrowserFullscreen={isBrowserFullscreen}
                        isFocusFullBoard={isFocusFullBoard}
                        onToggleFullscreen={handleToggleBrowserFullscreen}
                        onToggleCoach={() => { setIsFocusFullBoard((v) => !v); onTriggerCoach(); }}
                        onToggleTheme={onToggleTheme}
                        onBackToLobby={onBackToLobby}
                        canUndo={replay.isLive && game.canUndo}
                        onUndo={replay.isLive ? game.undoMove : NOOP}
                        autoConfirmEnabled={game.autoConfirmTurn}
                        onToggleAutoConfirm={game.toggleAutoConfirmTurn}
                    />

                    {/* COLONNE CENTRALE : Plateau 100 % Hauteur */}
                    <div className="flex-1 min-w-0 min-h-0 h-full flex items-center justify-center">
                        <ErrorBoundary name="Plateau de jeu">
                            <Board
                                state={displayState}
                                leftDieTargets={replay.isLive ? game.leftDieTargets : new Map()} rightDieTargets={replay.isLive ? game.rightDieTargets : new Map()}
                                selectedPoint={replay.isLive ? (game.selected?.point ?? null) : null} selectedDie={game.selected ? game.selected.die : activeDie}
                                usedDice={replay.isLive ? game.usedDice : [false, false]} opponentDice={!displayState.dice ? game.lastOpponentDice : null}
                                onCheckerClick={replay.isLive ? (pt) => { if (previewBoardMode !== 'live') setPreviewBoardMode('live'); if (selectedCoachHistoryIndex !== null) onSelectCoachHistoryIndex?.(null); onCheckerClick(pt); } : NOOP}
                                onCheckerRightClick={replay.isLive ? onCheckerRightClick : NOOP} onDestinationClick={replay.isLive ? onDestinationClick : NOOP}
                                onPlayMove={replay.isLive ? onPlayMove : NOOP} onSelectDie={replay.isLive ? onSelectDie : NOOP}
                                onDiceClick={replay.isLive ? onDiceClick : NOOP} onDeselect={replay.isLive ? onDeselect : NOOP} onUndo={replay.isLive ? game.undoMove : NOOP}
                                coachHighlight={displayCoachHighlight}
                                opponentHighlight={!replay.isLive && replay.selectedTurn?.player === 'O' && replayViewPhase === 'before' ? [...replay.selectedTurn.moves] : game.opponentHighlight}
                                canDouble={replay.isLive && game.canDouble} doublingOfferedBy={game.doublingOfferedBy}
                                onOfferDouble={replay.isLive ? game.offerDouble : NOOP} onTakeDouble={replay.isLive ? game.takeDouble : NOOP} onPassDouble={replay.isLive ? game.passDouble : NOOP}
                                theme={theme} isLoading={isBoardLoading} gamePhase={replay.isLive ? game.gamePhase : 'REPLAY_VIEW'}
                                onRoll={replay.isLive ? () => { if (previewBoardMode !== 'live') setPreviewBoardMode('live'); if (selectedCoachHistoryIndex !== null) onSelectCoachHistoryIndex?.(null); game.rollDice(); } : replay.returnToLive}
                                onConfirm={replay.isLive ? () => game.commitHumanMove() : replay.returnToLive}
                                canUndo={replay.isLive && game.canUndo} canConfirm={replay.isLive && game.gamePhase === 'HUMAN_READY_TO_COMMIT' && game.canUndo}
                                autoConfirmEnabled={game.autoConfirmTurn} onToggleAutoConfirm={game.toggleAutoConfirmTurn}
                                autoConfirmMode={game.autoConfirmMode} onSelectAutoConfirmMode={game.setAutoConfirmMode} onCycleAutoConfirmMode={game.cycleAutoConfirmMode}
                                gameSpeed={game.gameSpeed} onCycleGameSpeed={game.setGameSpeed ? () => game.setGameSpeed(NEXT_SPEED[game.gameSpeed ?? 'tournament']) : undefined}
                                isMatchStarted={isMatchStarted} swapColors={playerColor === 'O'} showPipCount={false}
                            />
                        </ErrorBoundary>
                    </div>

                    <BoardRightActionRail
                        isBrowserFullscreen={isBrowserFullscreen}
                        isFocusFullBoard={isFocusFullBoard}
                        onToggleFullscreen={handleToggleBrowserFullscreen}
                        onToggleCoach={() => { setIsFocusFullBoard((v) => !v); onTriggerCoach(); }}
                        onToggleTheme={onToggleTheme}
                        onBackToLobby={onBackToLobby}
                        canUndo={replay.isLive && game.canUndo}
                        onUndo={replay.isLive ? game.undoMove : NOOP}
                        autoConfirmEnabled={game.autoConfirmTurn}
                        onToggleAutoConfirm={game.toggleAutoConfirmTurn}
                    />
                </div>

                <BoardPortraitBottomHud
                    scoreX={game.state.scoreX}
                    turn={game.state.turn}
                />

                {isMatchStarted && (
                    <>
                        <MobilePortraitCoachBanner
                            coach={displayCoach} isAnalyzing={isAnalyzing} difficulty={game.difficulty}
                            isShowingBestMoveArrows={previewBoardMode === 'before'}
                            onToggleBestMoveArrows={() => setPreviewBoardMode((m) => (m === 'before' ? 'live' : 'before'))}
                            onReplayMove={handleSyncedReplayMove} onOpenDrawer={onTriggerCoach}
                        />
                        <div className={`${replay.isLive ? 'sr-only' : 'hidden md:block'} shrink-0 h-8 w-full`}>
                            <BoardHorologyBar
                                totalTurns={effectiveTurns.length} replayIndex={replay.replayIndex} isLive={replay.isLive}
                                selectedTurn={replay.selectedTurn} officialNotation={replay.officialNotation} viewPhase={replayViewPhase}
                                canStepPrev={replay.canStepPrev} canStepNext={replay.canStepNext} swapColors={playerColor === 'O'}
                                onStepFirst={() => { setReplayViewPhase('before'); replay.stepFirst(); }}
                                onStepPrev={() => { setReplayViewPhase('before'); replay.stepPrev(); }}
                                onStepNext={() => { setReplayViewPhase('before'); replay.stepNext(); }}
                                onReturnToLive={() => { setPreviewBoardMode('live'); replay.returnToLive(); }}
                                onToggleViewPhase={() => setReplayViewPhase((prev) => (prev === 'before' ? 'after' : 'before'))}
                                onRewindHere={handleSyncedReplayMove} difficulty={game.difficulty}
                                coachHistory={coachHistory} cubeValue={game.state.cubeValue} doublingOfferedBy={game.doublingOfferedBy}
                                onTriggerGhostChallenge={(turnIdx) => {
                                    game.rewindToLogTurn?.(turnIdx);
                                    replay.returnToLive();
                                    setPreviewBoardMode('live');
                                    onSelectCoachHistoryIndex?.(null);
                                    onDismissCoach();
                                }}
                                locale={locale}
                            />
                        </div>
                    </>
                )}
            </div>

            <div
                data-testid="board-coach-column"
                className={`${isFocusFullBoard ? 'hidden' : 'hidden lg:flex lg:col-span-4'} h-full min-h-0 min-w-0 overflow-hidden relative z-10`}
            >
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
                />
            </div>
        </div>
    );
};

export const GameBoardArea = React.memo(GameBoardAreaComponent);
export default GameBoardArea;
