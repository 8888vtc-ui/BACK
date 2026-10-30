'use client';

/**
 * Zone centrale de jeu (Plateau interactif + Éclairage Zénithal + Panneau Coach, < 275 lignes, 0 any).
 */

import React, { useMemo, useState } from 'react';
import type { ThemeName, CoachHighlight } from './boardThemes';
import type { BoardState } from '../../engine/backgammonEngine';
import type { UseBackgammonGameReturn } from '../../hooks/useBackgammonGame';
import type { BuildMatchContextParams } from '../../features/coach/matchContext';
import type { RawGameTurn } from '../../features/rating';
import type { CoachAnalysisHistoryEntry } from '../../hooks/useCoach';
import { useInteractiveReplay } from '../../hooks/useInteractiveReplay';
import Board from './Board';
import BoardHorologyBar from './BoardHorologyBar';
import CoachSidebar, { type CoachSidebarProps } from '../coach/CoachSidebar';
import MobilePortraitCoachBanner from '../coach/MobilePortraitCoachBanner';
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
    locale?: string;
    gameId: string;
    matchContext?: Partial<BuildMatchContextParams>;
    isMatchStarted?: boolean;
    playerColor?: 'X' | 'O';
}

const GameBoardAreaComponent: React.FC<GameBoardAreaProps> = ({
    theme, game, activeDie, isBoardLoading, activeCoachHighlight,
    onCheckerClick, onCheckerRightClick, onDestinationClick, onPlayMove,
    onSelectDie, onDiceClick, onDeselect, coach, isAnalyzing,
    onDismissCoach, onReplayMove, onOpenKnowledgeConcept, onBlunderClick,
    onCandidateHover, turnsHistory, coachHistory = [], selectedCoachHistoryIndex = null,
    onSelectCoachHistoryIndex, onTriggerCoach, matchStats, matchStatsO, locale,
    gameId, matchContext, isMatchStarted = true, playerColor = 'X',
}) => {
    const [replayViewPhase, setReplayViewPhase] = useState<'before' | 'after'>('before');
    const [previewBoardMode, setPreviewBoardMode] = useState<'live' | 'before'>('live');

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
        <div className="w-full h-full min-h-0 flex-1 overflow-hidden relative grid grid-cols-1 lg:grid-cols-12 gap-1 sm:gap-3 max-w-[1920px] mx-auto px-0.5 sm:px-2 pb-0.5 sm:pb-1">
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-0"
                style={{
                    background:
                        'radial-gradient(ellipse 72% 60% at 50% 45%, rgba(245, 196, 81, 0.10) 0%, rgba(16, 185, 129, 0.04) 42%, rgba(0, 0, 0, 0.55) 100%)',
                }}
            />

            <div
                className="col-span-1 lg:col-span-8 h-full min-h-0 min-w-0 flex flex-col items-center justify-center gap-0.5 sm:gap-1 overflow-hidden w-full relative z-10"
            >
                <div className="relative flex-1 min-h-0 max-h-full w-full max-w-full flex items-center justify-center">
                    <ErrorBoundary name="Plateau de jeu">
                        <Board
                            state={displayState}
                            leftDieTargets={replay.isLive ? game.leftDieTargets : new Map()}
                            rightDieTargets={replay.isLive ? game.rightDieTargets : new Map()}
                            selectedPoint={replay.isLive ? (game.selected?.point ?? null) : null}
                            selectedDie={game.selected ? game.selected.die : activeDie}
                            usedDice={replay.isLive ? game.usedDice : [false, false]}
                            opponentDice={!displayState.dice ? game.lastOpponentDice : null}
                            onCheckerClick={replay.isLive ? (pt) => {
                                if (previewBoardMode !== 'live') setPreviewBoardMode('live');
                                if (selectedCoachHistoryIndex !== null) onSelectCoachHistoryIndex?.(null);
                                onCheckerClick(pt);
                            } : NOOP}
                            onCheckerRightClick={replay.isLive ? onCheckerRightClick : NOOP}
                            onDestinationClick={replay.isLive ? onDestinationClick : NOOP}
                            onPlayMove={replay.isLive ? onPlayMove : NOOP}
                            onSelectDie={replay.isLive ? onSelectDie : NOOP}
                            onDiceClick={replay.isLive ? onDiceClick : NOOP}
                            onDeselect={replay.isLive ? onDeselect : NOOP}
                            onUndo={replay.isLive ? game.undoMove : NOOP}
                            coachHighlight={displayCoachHighlight}
                            opponentHighlight={!replay.isLive && replay.selectedTurn?.player === 'O' && replayViewPhase === 'before' ? [...replay.selectedTurn.moves] : game.opponentHighlight}
                            canDouble={replay.isLive && game.canDouble}
                            doublingOfferedBy={game.doublingOfferedBy}
                            onOfferDouble={replay.isLive ? game.offerDouble : NOOP}
                            onTakeDouble={replay.isLive ? game.takeDouble : NOOP}
                            onPassDouble={replay.isLive ? game.passDouble : NOOP}
                            theme={theme}
                            isLoading={isBoardLoading}
                            gamePhase={replay.isLive ? game.gamePhase : 'REPLAY_VIEW'}
                            onRoll={replay.isLive ? () => {
                                if (previewBoardMode !== 'live') setPreviewBoardMode('live');
                                if (selectedCoachHistoryIndex !== null) onSelectCoachHistoryIndex?.(null);
                                game.rollDice();
                            } : replay.returnToLive}
                            onConfirm={replay.isLive ? () => game.commitHumanMove() : replay.returnToLive}
                            canUndo={replay.isLive && game.canUndo}
                            canConfirm={replay.isLive && game.gamePhase === 'HUMAN_READY_TO_COMMIT' && game.canUndo}
                            autoConfirmEnabled={game.autoConfirmTurn}
                            onToggleAutoConfirm={game.toggleAutoConfirmTurn}
                            autoConfirmMode={game.autoConfirmMode}
                            onSelectAutoConfirmMode={game.setAutoConfirmMode}
                            onCycleAutoConfirmMode={game.cycleAutoConfirmMode}
                            gameSpeed={game.gameSpeed}
                            onCycleGameSpeed={game.setGameSpeed ? () => game.setGameSpeed(NEXT_SPEED[game.gameSpeed ?? 'tournament']) : undefined}
                            isMatchStarted={isMatchStarted}
                            swapColors={playerColor === 'O'}
                            showPipCount={false}
                        />
                    </ErrorBoundary>
                </div>

                {isMatchStarted && (
                    <>
                        <MobilePortraitCoachBanner
                            coach={displayCoach} isAnalyzing={isAnalyzing} difficulty={game.difficulty}
                            isShowingBestMoveArrows={previewBoardMode === 'before'}
                            onToggleBestMoveArrows={() => setPreviewBoardMode((m) => (m === 'before' ? 'live' : 'before'))}
                            onReplayMove={handleSyncedReplayMove} onOpenDrawer={onTriggerCoach}
                        />
                        <div className="hidden md:block w-full shrink-0 h-8">
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

            <div className="hidden lg:flex lg:col-span-4 h-full min-h-0 min-w-0 overflow-hidden relative z-10">
                <CoachSidebar
                    coach={displayCoach}
                    isAnalyzing={isAnalyzing}
                    onDismiss={onDismissCoach}
                    onReplayMove={handleSyncedReplayMove}
                    onOpenKnowledgeConcept={onOpenKnowledgeConcept}
                    onBlunderClick={onBlunderClick}
                    onCandidateHover={(notation) => {
                        if (notation) setPreviewBoardMode('before');
                        else if (selectedCoachHistoryIndex === null) setPreviewBoardMode('live');
                        onCandidateHover?.(notation);
                    }}
                    turnsHistory={turnsHistory}
                    onTriggerCoach={onTriggerCoach}
                    theme={theme}
                    matchStats={matchStats}
                    matchStatsO={matchStatsO}
                    locale={locale}
                    coachHistory={coachHistory}
                    selectedCoachHistoryIndex={selectedCoachHistoryIndex}
                    onSelectCoachHistoryIndex={onSelectCoachHistoryIndex}
                    matchContext={matchContext}
                    positionKey={displayState.board.join(',')}
                    gameId={gameId}
                    dice={displayState.dice}
                    board={displayState.board}
                    difficulty={game.difficulty}
                />
            </div>
        </div>
    );
};

export const GameBoardArea = React.memo(GameBoardAreaComponent);
export default GameBoardArea;
