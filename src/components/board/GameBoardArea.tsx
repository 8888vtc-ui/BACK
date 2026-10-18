'use client';

/**
 * Zone centrale de jeu (Plateau interactif + Panneau d'analyse latéral du Coach).
 *
 * Rôle :
 *   Conteneur flexible organisant l'affichage responsive du plateau de backgammon
 *   et de la barre latérale du coach d'analyse pour écrans larges.
 *
 * Dépendances :
 *   `Board`, `CoachSidebar`, `ErrorBoundary`.
 *
 * Retrait :
 *   Supprimer ce fichier et réintégrer le plateau dans `page.tsx`.
 */

import React from 'react';
import type { ThemeName, CoachHighlight } from './boardThemes';
import type { UseBackgammonGameReturn } from '../../hooks/useBackgammonGame';
import Board from './Board';
import CoachSidebar from '../coach/CoachSidebar';
import ErrorBoundary from '../common/ErrorBoundary';

export interface GameBoardAreaProps {
    theme: ThemeName;
    game: UseBackgammonGameReturn;
    activeDie: 0 | 1;
    isBoardLoading: boolean;
    activeCoachHighlight: CoachHighlight | null;
    onCheckerClick: (point: number) => void;
    onCheckerDoubleClick: (point: number) => void;
    onCheckerRightClick: (point: number) => void;
    onDestinationClick: (destination: number) => void;
    onPlayMove: (from: number, to: number, die?: 0 | 1) => void;
    onSelectDie: (die: 0 | 1) => void;
    onDieDoubleClick: (die: 0 | 1) => void;
    onDeselect: () => void;
    coach: any;
    isAnalyzing: boolean;
    onDismissCoach: () => void;
    onReplayMove?: () => void;
    onOpenKnowledgeConcept?: (conceptId: string) => void;
    onTriggerCoach: () => void;
    matchStats?: any;
    gameId: string;
}

const GameBoardAreaComponent: React.FC<GameBoardAreaProps> = ({
    theme,
    game,
    activeDie,
    isBoardLoading,
    activeCoachHighlight,
    onCheckerClick,
    onCheckerDoubleClick,
    onCheckerRightClick,
    onDestinationClick,
    onPlayMove,
    onSelectDie,
    onDieDoubleClick,
    onDeselect,
    coach,
    isAnalyzing,
    onDismissCoach,
    onReplayMove,
    onOpenKnowledgeConcept,
    onTriggerCoach,
    matchStats,
    gameId,
}) => {
    return (
        <div className="w-full h-full min-h-0 flex-1 overflow-hidden relative flex flex-col lg:flex-row items-center justify-center gap-2 sm:gap-3 max-w-[1920px] mx-auto px-1 sm:px-2 pb-1">
            {/* Zone Plateau : contrainte stricte par la hauteur disponible */}
            <div className="flex-1 h-full min-h-0 min-w-0 flex items-center justify-center overflow-hidden w-full">
                <div className="relative h-full max-h-full w-full max-w-full flex items-center justify-center">
                    <ErrorBoundary name="Plateau de jeu">
                        <Board
                            state={game.state}
                            leftDieTargets={game.leftDieTargets}
                            rightDieTargets={game.rightDieTargets}
                            selectedPoint={game.selected?.point ?? null}
                            selectedDie={game.selected ? game.selected.die : activeDie}
                            usedDice={game.usedDice}
                            opponentDice={game.lastOpponentDice}
                            onCheckerClick={onCheckerClick}
                            onCheckerDoubleClick={onCheckerDoubleClick}
                            onCheckerRightClick={onCheckerRightClick}
                            onDestinationClick={onDestinationClick}
                            onPlayMove={onPlayMove}
                            onSelectDie={onSelectDie}
                            onDieDoubleClick={onDieDoubleClick}
                            onDeselect={onDeselect}
                            onUndo={game.undoMove}
                            coachHighlight={activeCoachHighlight}
                            opponentHighlight={game.opponentHighlight}
                            canDouble={game.canDouble}
                            theme={theme}
                            isLoading={isBoardLoading}
                        />
                    </ErrorBoundary>
                </div>
            </div>

            {/* Panneau latéral du Coach (≥ lg) */}
            <CoachSidebar
                coach={coach}
                isAnalyzing={isAnalyzing}
                onDismiss={onDismissCoach}
                onReplayMove={onReplayMove}
                onOpenKnowledgeConcept={onOpenKnowledgeConcept}
                onTriggerCoach={onTriggerCoach}
                theme={theme}
                matchStats={matchStats}
                matchContext={{
                    scoreX: game.state.scoreX,
                    scoreO: game.state.scoreO,
                    matchLength: game.state.matchLength,
                    cubeValue: game.state.cubeValue,
                    cubeOwner: game.state.cubeOwner,
                    crawford: game.state.crawford,
                }}
                positionKey={game.state.board.join(',')}
                gameId={gameId}
                dice={game.dice}
                board={game.state.board}
            />
        </div>
    );
};

export const GameBoardArea = React.memo(GameBoardAreaComponent);
export default GameBoardArea;
