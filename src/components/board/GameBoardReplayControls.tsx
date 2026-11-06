'use client';

/**
 * @file src/components/board/GameBoardReplayControls.tsx
 * @description Sous-composant modulaire pour les contrôles de replay et la bannière coach portrait (< 90 lignes, 0 any).
 */

import React from 'react';
import type { AIDifficulty } from '../../hooks/useBackgammonGame';
import type { CoachAnalysisHistoryEntry } from '../../hooks/useCoach';
import type { CoachSidebarProps } from '../coach/CoachSidebar';
import type { UseInteractiveReplayReturn } from '../../hooks/useInteractiveReplay';
import BoardHorologyBar from './BoardHorologyBar';
import MobilePortraitCoachBanner from '../coach/MobilePortraitCoachBanner';

export interface GameBoardReplayControlsProps {
    readonly isMatchStarted: boolean;
    readonly isOnlinePvpMatch: boolean;
    readonly displayCoach: CoachSidebarProps['coach'];
    readonly isAnalyzing: boolean;
    readonly difficulty: AIDifficulty;
    readonly isShowingBestMoveArrows: boolean;
    readonly onToggleBestMoveArrows: () => void;
    readonly onReplayMove: () => void;
    readonly onTriggerCoach: () => void;
    readonly replay: UseInteractiveReplayReturn;
    readonly totalTurns: number;
    readonly replayViewPhase: 'before' | 'after';
    readonly onSetReplayViewPhase: (phase: 'before' | 'after') => void;
    readonly onToggleViewPhase: () => void;
    readonly playerColor: 'X' | 'O';
    readonly coachHistory: ReadonlyArray<CoachAnalysisHistoryEntry>;
    readonly cubeValue: number;
    readonly doublingOfferedBy: 'X' | 'O' | null;
    readonly onRewindHere: () => void;
    readonly onTriggerGhostChallenge: (turnIdx: number) => void;
    readonly onReturnToLive: () => void;
    readonly locale?: string;
}

export const GameBoardReplayControls: React.FC<GameBoardReplayControlsProps> = React.memo(({
    isMatchStarted,
    isOnlinePvpMatch,
    displayCoach,
    isAnalyzing,
    difficulty,
    isShowingBestMoveArrows,
    onToggleBestMoveArrows,
    onReplayMove,
    onTriggerCoach,
    replay,
    totalTurns,
    replayViewPhase,
    onSetReplayViewPhase,
    onToggleViewPhase,
    playerColor,
    coachHistory,
    cubeValue,
    doublingOfferedBy,
    onRewindHere,
    onTriggerGhostChallenge,
    onReturnToLive,
    locale,
}) => {
    if (!isMatchStarted) return null;

    return (
        <>
            {!isOnlinePvpMatch && (
                <MobilePortraitCoachBanner
                    coach={displayCoach}
                    isAnalyzing={isAnalyzing}
                    difficulty={difficulty}
                    isShowingBestMoveArrows={isShowingBestMoveArrows}
                    onToggleBestMoveArrows={onToggleBestMoveArrows}
                    onReplayMove={onReplayMove}
                    onOpenDrawer={onTriggerCoach}
                />
            )}
            <div className={`${replay.isLive ? 'hidden' : 'hidden md:block [@media(max-height:540px)]:!hidden'} shrink-0 h-8 w-full`}>
                <BoardHorologyBar
                    totalTurns={totalTurns}
                    replayIndex={replay.replayIndex}
                    isLive={replay.isLive}
                    selectedTurn={replay.selectedTurn}
                    officialNotation={replay.officialNotation}
                    viewPhase={replayViewPhase}
                    canStepPrev={replay.canStepPrev}
                    canStepNext={replay.canStepNext}
                    swapColors={playerColor === 'O'}
                    onStepFirst={() => { onSetReplayViewPhase('before'); replay.stepFirst(); }}
                    onStepPrev={() => { onSetReplayViewPhase('before'); replay.stepPrev(); }}
                    onStepNext={() => { onSetReplayViewPhase('before'); replay.stepNext(); }}
                    onReturnToLive={onReturnToLive}
                    onToggleViewPhase={onToggleViewPhase}
                    onRewindHere={onRewindHere}
                    difficulty={difficulty}
                    coachHistory={coachHistory}
                    cubeValue={cubeValue}
                    doublingOfferedBy={doublingOfferedBy}
                    onTriggerGhostChallenge={onTriggerGhostChallenge}
                    locale={locale}
                />
            </div>
        </>
    );
});

GameBoardReplayControls.displayName = 'GameBoardReplayControls';
export default GameBoardReplayControls;

