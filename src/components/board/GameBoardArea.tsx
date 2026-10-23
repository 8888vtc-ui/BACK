'use client';

/**
 * Zone centrale de jeu (Plateau interactif + Éclairage Zénithal de Salon + Panneau Coach).
 *
 * Rôle :
 *   Conteneur flexible organisant l'affichage responsive de la malle de backgammon
 *   sous un éclairage zénithal chaleureux (spotlight feutré) et de la barre latérale du coach.
 *
 * Dépendances :
 *   `Board`, `CoachSidebar`, `ErrorBoundary`.
 */

import React from 'react';
import type { ThemeName, CoachHighlight } from './boardThemes';
import type { UseBackgammonGameReturn } from '../../hooks/useBackgammonGame';
import type { BuildMatchContextParams } from '../../features/coach/matchContext';
import Board from './Board';
import CoachSidebar, { type CoachSidebarProps } from '../coach/CoachSidebar';
import ErrorBoundary from '../common/ErrorBoundary';
import LandscapeHint from './LandscapeHint';
import type { GameSpeed } from '../../lib/gameFeel/speedPresets';

/** Ordre de rotation du sélecteur de cadence du HUD. */
const NEXT_SPEED: Record<GameSpeed, GameSpeed> = { coach: 'tournament', tournament: 'blitz', blitz: 'coach' };

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
    /** Clic / tap sur la paire de dés : inverse l'ordre (swapDiceOrderAction). */
    onDiceClick?: () => void;
    onDeselect: () => void;
    coach: CoachSidebarProps['coach'];
    isAnalyzing: boolean;
    onDismissCoach: () => void;
    onReplayMove?: () => void;
    onOpenKnowledgeConcept?: (conceptId: string) => void;
    /** Clic sur le compteur « Blunders » du tableau de bord PR (revue des erreurs). */
    onBlunderClick?: () => void;
    /** Survol d'une ligne du tableau des candidats (dessine les flèches sur le plateau). */
    onCandidateHover?: (notation: string | null) => void;
    /** Historique des tours (onglet Feuille de Match du Coach). */
    turnsHistory?: unknown[];
    onTriggerCoach: () => void;
    matchStats?: CoachSidebarProps['matchStats'];
    matchStatsO?: CoachSidebarProps['matchStatsO'];
    gameId: string;
    /** Contexte de match transmis au Coach */
    matchContext?: Partial<BuildMatchContextParams>;
    /** La partie a-t-elle officiellement démarré ? (masque les contrôles sinon) */
    isMatchStarted?: boolean;
    /** Couleur visuelle choisie par l'humain (le moteur le fait jouer côté X). */
    playerColor?: 'X' | 'O';
}

const GameBoardAreaComponent: React.FC<GameBoardAreaProps> = ({
    theme,
    game,
    activeDie,
    isBoardLoading,
    activeCoachHighlight,
    onCheckerClick,
    onCheckerRightClick,
    onDestinationClick,
    onPlayMove,
    onSelectDie,
    onDiceClick,
    onDeselect,
    coach,
    isAnalyzing,
    onDismissCoach,
    onReplayMove,
    onOpenKnowledgeConcept,
    onBlunderClick,
    onCandidateHover,
    turnsHistory,
    onTriggerCoach,
    matchStats,
    matchStatsO,
    gameId,
    matchContext,
    isMatchStarted = true,
    playerColor = 'X',
}) => {
    const isSidebarVisible = Boolean(coach) || isAnalyzing;

    return (
        <div className="w-full h-full min-h-0 flex-1 overflow-hidden relative grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-3 max-w-[1920px] mx-auto px-1 sm:px-2 pb-1">
            {/* Spotlight zénithal d'ambiance (lustre de salon de jeu au-dessus de la malle) */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-0"
                style={{
                    background:
                        'radial-gradient(ellipse 72% 60% at 50% 45%, rgba(245, 196, 81, 0.10) 0%, rgba(16, 185, 129, 0.04) 42%, rgba(0, 0, 0, 0.55) 100%)',
                }}
            />

            {/* Zone Plateau : 100 % mobile ; 8/12 si le Coach est affiché, 12/12 sinon. */}
            <div
                className={`col-span-1 ${isSidebarVisible ? 'lg:col-span-8' : 'lg:col-span-12'} h-full min-h-0 min-w-0 flex items-center justify-center overflow-hidden w-full relative z-10`}
            >
                <LandscapeHint />
                <div className="relative h-full max-h-full w-full max-w-full flex items-center justify-center">
                    <ErrorBoundary name="Plateau de jeu">
                        <Board
                            state={game.state}
                            leftDieTargets={game.leftDieTargets}
                            rightDieTargets={game.rightDieTargets}
                            selectedPoint={game.selected?.point ?? null}
                            selectedDie={game.selected ? game.selected.die : activeDie}
                            usedDice={game.usedDice}
                            opponentDice={!game.state.dice ? game.lastOpponentDice : null}
                            onCheckerClick={onCheckerClick}
                            onCheckerRightClick={onCheckerRightClick}
                            onDestinationClick={onDestinationClick}
                            onPlayMove={onPlayMove}
                            onSelectDie={onSelectDie}
                            onDiceClick={onDiceClick}
                            onDeselect={onDeselect}
                            onUndo={game.undoMove}
                            coachHighlight={activeCoachHighlight}
                            opponentHighlight={game.opponentHighlight}
                            canDouble={game.canDouble}
                            doublingOfferedBy={game.doublingOfferedBy}
                            onOfferDouble={game.offerDouble}
                            onTakeDouble={game.takeDouble}
                            onPassDouble={game.passDouble}
                            theme={theme}
                            isLoading={isBoardLoading}
                            gamePhase={game.gamePhase}
                            onRoll={game.rollDice}
                            onConfirm={() => game.commitHumanMove()}
                            canUndo={game.canUndo}
                            canConfirm={game.gamePhase === 'HUMAN_READY_TO_COMMIT' && game.canUndo}
                            autoConfirmEnabled={game.autoConfirmTurn}
                            onToggleAutoConfirm={game.toggleAutoConfirmTurn}
                            autoConfirmMode={game.autoConfirmMode}
                            onSelectAutoConfirmMode={game.setAutoConfirmMode}
                            onCycleAutoConfirmMode={game.cycleAutoConfirmMode}
                            gameSpeed={game.gameSpeed}
                            onCycleGameSpeed={
                                game.setGameSpeed
                                    ? () => game.setGameSpeed(NEXT_SPEED[game.gameSpeed ?? 'tournament'])
                                    : undefined
                            }
                            isMatchStarted={isMatchStarted}
                            swapColors={playerColor === 'O'}
                        />
                    </ErrorBoundary>
                </div>
            </div>

            {/* Panneau latéral du Coach (≥ lg) */}
            {isSidebarVisible && (
                <div className="hidden lg:flex lg:col-span-4 h-full min-h-0 min-w-0 overflow-hidden relative z-10">
                    <CoachSidebar
                        coach={coach}
                        isAnalyzing={isAnalyzing}
                        onDismiss={onDismissCoach}
                        onReplayMove={onReplayMove}
                        onOpenKnowledgeConcept={onOpenKnowledgeConcept}
                        onBlunderClick={onBlunderClick}
                        onCandidateHover={onCandidateHover}
                        turnsHistory={turnsHistory}
                        onTriggerCoach={onTriggerCoach}
                        theme={theme}
                        matchStats={matchStats}
                        matchStatsO={matchStatsO}
                        matchContext={matchContext as unknown as CoachSidebarProps['matchContext']}
                        positionKey={game.state.board.join(',')}
                        gameId={gameId}
                        dice={game.dice}
                        board={game.state.board}
                    />
                </div>
            )}
        </div>
    );
};

export const GameBoardArea = React.memo(GameBoardAreaComponent);
export default GameBoardArea;
