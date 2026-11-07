'use client';

/**
 * @file src/components/board/GameBoardCenterStage.tsx
 * @description Scène centrale regroupant le plateau et les rails gauche/droite (< 130 lignes, 0 any).
 */

import React from 'react';
import type { ThemeName, CoachHighlight } from './boardThemes';
import type { BoardState } from '../../engine/backgammonEngine';
import type { UseBackgammonGameReturn } from '../../hooks/useBackgammonGame';
import type { PlayerEloProfile } from '../../features/multiplayer/types';
import type { CoachAnalysisHistoryEntry } from '../../hooks/useCoach';
import type { CoachSidebarProps } from '../coach/CoachSidebar';
import Board from './Board';
import BoardLivePersonaBubble from './BoardLivePersonaBubble';
import { BoardLeftPlayerRail, BoardRightActionRail } from './BoardSideRails';
import ErrorBoundary from '../common/ErrorBoundary';
import type { GameSpeed } from '../../lib/gameFeel/speedPresets';

const NEXT_SPEED: Record<GameSpeed, GameSpeed> = { coach: 'tournament', tournament: 'blitz', blitz: 'coach' };
const NOOP = () => {};

export interface GameBoardCenterStageProps {
    readonly isOnlinePvpMatch: boolean;
    readonly game: UseBackgammonGameReturn;
    readonly effectiveTurnsCount: number;
    readonly displayCoach: CoachSidebarProps['coach'];
    readonly displayState: BoardState;
    readonly onSyncedReplayMove: () => void;
    readonly onOpenCoach: () => void;
    readonly locale?: string;
    readonly isGuided: boolean;
    readonly isXTurn: boolean;
    readonly clock: { formattedX: string; formattedO: string };
    readonly activeDelaySeconds: number;
    readonly prX?: number | null;
    readonly prO?: number | null;
    readonly challengerProfile?: PlayerEloProfile | null;
    readonly onSendQuickChat?: (id: 'gg' | 'nice_move' | 'unlucky' | 'thanks' | 'thinking') => void;
    readonly isBrowserFullscreen: boolean;
    readonly isFocusFullBoard: boolean;
    readonly onToggleFullscreen: () => void;
    readonly onToggleTheme?: () => void;
    readonly onBackToLobby?: () => void;
    readonly replayIsLive: boolean;
    readonly autoRollEnabled: boolean;
    readonly onToggleAutoRoll: () => void;
    readonly activeDie: 0 | 1;
    readonly previewBoardMode: 'live' | 'before';
    readonly setPreviewBoardMode: (mode: 'live' | 'before') => void;
    readonly selectedCoachHistoryIndex: number | null;
    readonly onSelectCoachHistoryIndex?: (index: number | null) => void;
    readonly onCheckerClick: (point: number) => void;
    readonly onCheckerRightClick: (point: number) => void;
    readonly onDestinationClick: (destination: number) => void;
    readonly onPlayMove: (from: number, to: number, die?: 0 | 1) => void;
    readonly onSelectDie: (die: 0 | 1) => void;
    readonly onDiceClick?: () => void;
    readonly onDeselect: () => void;
    readonly displayCoachHighlight: CoachHighlight | null;
    readonly replaySelectedTurnPlayer?: 'X' | 'O';
    readonly replayViewPhase: 'before' | 'after';
    readonly replayMoves?: ReadonlyArray<{ from: number; to: number }>;
    readonly onOfferDouble?: () => void;
    readonly onTakeDouble?: () => void;
    readonly onPassDouble?: () => void;
    readonly isPrematureDouble: boolean;
    readonly theme: ThemeName;
    readonly isBoardLoading: boolean;
    readonly propIsOnlineMatch: boolean;
    readonly playerColor: 'X' | 'O';
    readonly isMatchStarted: boolean;
    readonly returnToLive: () => void;
    readonly onConfirmTurn?: () => void;
}

export const GameBoardCenterStage: React.FC<GameBoardCenterStageProps> = React.memo(({
    isOnlinePvpMatch,
    game,
    effectiveTurnsCount,
    displayCoach,
    displayState,
    onSyncedReplayMove,
    onOpenCoach,
    locale,
    isGuided,
    isXTurn,
    clock,
    activeDelaySeconds,
    prX,
    prO,
    challengerProfile,
    onSendQuickChat,
    isBrowserFullscreen,
    isFocusFullBoard,
    onToggleFullscreen,
    onToggleTheme,
    onBackToLobby,
    replayIsLive,
    autoRollEnabled,
    onToggleAutoRoll,
    activeDie,
    previewBoardMode,
    setPreviewBoardMode,
    selectedCoachHistoryIndex,
    onSelectCoachHistoryIndex,
    onCheckerClick,
    onCheckerRightClick,
    onDestinationClick,
    onPlayMove,
    onSelectDie,
    onDiceClick,
    onDeselect,
    displayCoachHighlight,
    replaySelectedTurnPlayer,
    replayViewPhase,
    replayMoves = [],
    onOfferDouble,
    onTakeDouble,
    onPassDouble,
    isPrematureDouble,
    theme,
    isBoardLoading,
    propIsOnlineMatch,
    playerColor,
    isMatchStarted,
    returnToLive,
    onConfirmTurn,
}) => {
    return (
        <div className="relative flex-1 min-h-0 max-h-full w-full max-w-full min-w-0 flex items-center sm:items-stretch justify-center gap-1.5 sm:gap-4 [@media(max-height:500px)]:!gap-1 px-0 sm:px-3 py-0 sm:py-1.5 [@media(max-height:500px)]:!p-0 overflow-hidden">
            {!isOnlinePvpMatch && (
                <BoardLivePersonaBubble
                    difficulty={game.difficulty}
                    isPlayerThinking={Boolean(game.state.turn === 'X' && game.state.dice)}
                    turnsCount={effectiveTurnsCount}
                    verdict={displayCoach?.verdict ?? null}
                    equityLoss={displayCoach?.equityLoss ?? null}
                    boardBefore={displayCoach?.boardBefore}
                    boardAfter={game.state.board}
                    opponentDice={!displayState.dice ? game.lastOpponentDice : null}
                    onReplayMove={onSyncedReplayMove}
                    onOpenCoach={onOpenCoach}
                />
            )}

            <BoardLeftPlayerRail
                difficulty={game.difficulty}
                locale={locale}
                isGuidedMode={isGuided}
                isXTurn={isXTurn}
                scoreX={game.state.scoreX}
                scoreO={game.state.scoreO}
                cubeValue={game.state.cubeValue}
                matchLength={game.state.matchLength}
                crawford={game.state.crawford}
                isDMP={game.isDMP}
                turn={game.state.turn}
                playerClock={clock.formattedX}
                opponentClock={clock.formattedO}
                delaySeconds={activeDelaySeconds}
                prX={prX}
                prO={prO}
                challengerProfile={challengerProfile}
                opponentDice={!displayState.dice ? game.lastOpponentDice : null}
                onSendQuickChat={onSendQuickChat}
                isBrowserFullscreen={isBrowserFullscreen}
                isFocusFullBoard={isFocusFullBoard}
                onToggleFullscreen={onToggleFullscreen}
                onToggleCoach={onOpenCoach}
                onToggleTheme={onToggleTheme}
                onBackToLobby={onBackToLobby}
                canUndo={replayIsLive && game.canUndo}
                onUndo={replayIsLive ? game.undoMove : NOOP}
                autoConfirmEnabled={game.autoConfirmTurn}
                onToggleAutoConfirm={game.toggleAutoConfirmTurn}
                autoRollEnabled={autoRollEnabled}
                onToggleAutoRoll={onToggleAutoRoll}
                isOnlinePvpMatch={isOnlinePvpMatch}
            />

            <div className="flex-1 min-w-0 min-h-0 h-full flex items-center justify-center">
                <ErrorBoundary name="Plateau de jeu">
                    <Board
                        state={displayState}
                        leftDieTargets={replayIsLive ? game.leftDieTargets : new Map()}
                        rightDieTargets={replayIsLive ? game.rightDieTargets : new Map()}
                        selectedPoint={replayIsLive ? (game.selected?.point ?? null) : null}
                        selectedDie={game.selected ? game.selected.die : activeDie}
                        usedDice={replayIsLive ? game.usedDice : [false, false]}
                        opponentDice={!displayState.dice ? game.lastOpponentDice : null}
                        onCheckerClick={replayIsLive ? (pt) => {
                            if (previewBoardMode !== 'live') setPreviewBoardMode('live');
                            if (selectedCoachHistoryIndex !== null) onSelectCoachHistoryIndex?.(null);
                            onCheckerClick(pt);
                        } : NOOP}
                        onCheckerRightClick={replayIsLive ? onCheckerRightClick : NOOP}
                        onDestinationClick={replayIsLive ? onDestinationClick : NOOP}
                        onPlayMove={replayIsLive ? onPlayMove : NOOP}
                        onSelectDie={replayIsLive ? onSelectDie : NOOP}
                        onDiceClick={replayIsLive ? onDiceClick : NOOP}
                        onDeselect={replayIsLive ? onDeselect : NOOP}
                        onUndo={replayIsLive ? game.undoMove : NOOP}
                        coachHighlight={displayCoachHighlight}
                        opponentHighlight={!replayIsLive && replaySelectedTurnPlayer === 'O' && replayViewPhase === 'before' ? [...replayMoves] : game.opponentHighlight}
                        canDouble={replayIsLive && game.canDouble}
                        doublingOfferedBy={game.doublingOfferedBy}
                        onOfferDouble={replayIsLive ? (onOfferDouble ?? game.offerDouble) : NOOP}
                        onTakeDouble={replayIsLive ? (onTakeDouble ?? game.takeDouble) : NOOP}
                        onPassDouble={replayIsLive ? (onPassDouble ?? game.passDouble) : NOOP}
                        isPrematureDouble={isPrematureDouble}
                        theme={theme}
                        isLoading={isBoardLoading}
                        gamePhase={replayIsLive ? (game.gamePhase ?? 'AI_TURN_SHOWING_ARROWS') : 'REPLAY_VIEW'}
                        onRoll={replayIsLive ? () => {
                            if (propIsOnlineMatch && game.state.turn !== playerColor) return;
                            if (previewBoardMode !== 'live') setPreviewBoardMode('live');
                            if (selectedCoachHistoryIndex !== null) onSelectCoachHistoryIndex?.(null);
                            game.rollDice();
                        } : returnToLive}
                        onConfirm={replayIsLive ? () => (onConfirmTurn ? onConfirmTurn() : game.commitHumanMove()) : returnToLive}
                        canUndo={replayIsLive && game.canUndo}
                        canConfirm={replayIsLive && game.gamePhase === 'HUMAN_READY_TO_COMMIT' && game.canUndo}
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

            <BoardRightActionRail
                isBrowserFullscreen={isBrowserFullscreen}
                isFocusFullBoard={isFocusFullBoard}
                onToggleFullscreen={onToggleFullscreen}
                onToggleCoach={onOpenCoach}
                onToggleTheme={onToggleTheme}
                onBackToLobby={onBackToLobby}
                canUndo={replayIsLive && game.canUndo}
                onUndo={replayIsLive ? game.undoMove : NOOP}
                autoConfirmEnabled={game.autoConfirmTurn}
                onToggleAutoConfirm={game.toggleAutoConfirmTurn}
                autoRollEnabled={autoRollEnabled}
                onToggleAutoRoll={onToggleAutoRoll}
                locale={locale}
            />
        </div>
    );
});

GameBoardCenterStage.displayName = 'GameBoardCenterStage';
export default GameBoardCenterStage;

