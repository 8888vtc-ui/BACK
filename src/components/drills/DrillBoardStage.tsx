'use client';

/**
 * @file src/components/drills/DrillBoardStage.tsx
 * @description Conteneur du plateau pour la session d'entraînement aux quiz (< 75 lignes, 0 any).
 */

import React from 'react';
import type { BoardState } from '../../engine/backgammonEngine';
import type { ThemeName } from '../board/boardThemes';
import Board from '../board/Board';

export interface DrillBoardStageProps {
    readonly boardState: BoardState;
    readonly leftDieTargets: Map<number, number[]>;
    readonly rightDieTargets: Map<number, number[]>;
    readonly selectedPoint: number | null;
    readonly selectedDie: 0 | 1 | null;
    readonly usedDice: [boolean, boolean];
    readonly onCheckerClick: (point: number) => void;
    readonly onCheckerRightClick: (point: number) => void;
    readonly onDestinationClick: (destination: number) => void;
    readonly onPlayMove: (from: number, to: number, explicitDie?: 0 | 1) => void;
    readonly onSelectDie: (die: 0 | 1) => void;
    readonly onDiceClick: () => void;
    readonly onDeselect: () => void;
    readonly onConfirm: () => void;
    readonly onUndo: () => void;
    readonly canConfirm: boolean;
    readonly canUndo: boolean;
    readonly coachHighlight: { played: Array<{ from: number; to: number }>; optimal: Array<{ from: number; to: number }> } | null;
    readonly theme: ThemeName;
}

export const DrillBoardStage: React.FC<DrillBoardStageProps> = React.memo(({
    boardState,
    leftDieTargets,
    rightDieTargets,
    selectedPoint,
    selectedDie,
    usedDice,
    onCheckerClick,
    onCheckerRightClick,
    onDestinationClick,
    onPlayMove,
    onSelectDie,
    onDiceClick,
    onDeselect,
    onConfirm,
    onUndo,
    canConfirm,
    canUndo,
    coachHighlight,
    theme,
}) => {
    return (
        <div className="flex-1 min-h-0 min-w-0 flex items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[#050505] p-0.5 shadow-2xl [@media(orientation:landscape)]:col-span-8 [@media(orientation:landscape)]:col-start-1 [@media(orientation:landscape)]:row-start-1 [@media(orientation:landscape)]:row-span-2 lg:col-span-8 lg:col-start-1 lg:row-start-1 lg:row-span-2 [@media(orientation:landscape)]:h-full lg:h-full">
            <Board
                state={boardState}
                gamePhase="HUMAN_MOVING"
                leftDieTargets={leftDieTargets}
                rightDieTargets={rightDieTargets}
                selectedPoint={selectedPoint}
                selectedDie={selectedDie}
                usedDice={usedDice}
                onCheckerClick={onCheckerClick}
                onCheckerRightClick={onCheckerRightClick}
                onDestinationClick={onDestinationClick}
                onPlayMove={onPlayMove}
                onSelectDie={onSelectDie}
                onDiceClick={onDiceClick}
                onDeselect={onDeselect}
                onConfirm={onConfirm}
                onUndo={onUndo}
                canConfirm={canConfirm}
                canUndo={canUndo}
                coachHighlight={coachHighlight}
                theme={theme}
            />
        </div>
    );
});

DrillBoardStage.displayName = 'DrillBoardStage';
export default DrillBoardStage;

