'use client';

import React from 'react';
import MobileThumbDock from './MobileThumbDock';
import CubeBottomSheet from '../modals/CubeBottomSheet';
import type { UseBackgammonGameReturn } from '../../hooks/useBackgammonGame';
import type { useMultiplayerGame } from '../../hooks/useMultiplayerGame';
import type { useTiltDetector } from '../../hooks/useTiltDetector';

export interface GameScreenMobileControlsProps {
    readonly game: UseBackgammonGameReturn;
    readonly isMultiplayerActive: boolean;
    readonly multiplayer: ReturnType<typeof useMultiplayerGame>;
    readonly tilt: ReturnType<typeof useTiltDetector>;
    readonly quotaBadge: string;
    readonly isVip: boolean;
    readonly isAnalyzingCoach: boolean;
    readonly isBlockedTurn: boolean;
    readonly isCubeSheetOpen: boolean;
    readonly onSetCubeSheetOpen: (open: boolean) => void;
    readonly onOpenCoachDrawer: () => void;
}

export const GameScreenMobileControls: React.FC<GameScreenMobileControlsProps> = ({
    game,
    isMultiplayerActive,
    multiplayer,
    tilt,
    quotaBadge,
    isVip,
    isAnalyzingCoach,
    isBlockedTurn,
    isCubeSheetOpen,
    onSetCubeSheetOpen,
    onOpenCoachDrawer,
}) => {
    const localRole = multiplayer.matchInfo?.localRole ?? 'X';
    const isPvpActiveTurn = isMultiplayerActive ? game.state.turn === localRole : game.isHumanTurn;

    return (
        <>
            <MobileThumbDock
                gamePhase={game.gamePhase}
                isHumanTurn={isPvpActiveTurn}
                hasDice={Boolean(game.dice)}
                canUndo={game.canUndo}
                canConfirm={game.gamePhase === 'HUMAN_READY_TO_COMMIT' && game.canUndo}
                isBlockedTurn={isBlockedTurn}
                canDouble={game.canDouble}
                cubeValue={game.state.cubeValue}
                doublingOfferedBy={game.doublingOfferedBy}
                coachQuotaBadge={quotaBadge}
                isVip={isVip}
                isAnalyzingCoach={isAnalyzingCoach}
                isTilted={tilt.isTilted}
                onRoll={() => {
                    if (isMultiplayerActive && game.state.turn !== localRole) return;
                    tilt.markRollTimestamp();
                    game.rollDice();
                }}
                onConfirm={() => game.commitHumanMove()}
                onUndo={game.undoMove}
                onOpenCubeSheet={() => onSetCubeSheetOpen(true)}
                onTakeDouble={() => {
                    if (isMultiplayerActive) {
                        void multiplayer.broadcastDoubleAccepted(game.state.cubeValue * 2);
                    }
                    game.takeDouble();
                }}
                onPassDouble={() => {
                    if (isMultiplayerActive) {
                        const offerer = game.doublingOfferedBy ?? (game.state.turn === 'X' ? 'O' : 'X');
                        void multiplayer.broadcastDoublePassed(offerer);
                    }
                    game.passDouble();
                }}
                onOpenCoachDrawer={onOpenCoachDrawer}
            />

            <CubeBottomSheet
                isOpen={isCubeSheetOpen}
                cubeValue={game.state.cubeValue}
                canDouble={game.canDouble}
                doublingOfferedBy={game.doublingOfferedBy}
                scoreX={game.state.scoreX}
                scoreO={game.state.scoreO}
                matchLength={game.state.matchLength}
                crawford={game.state.crawford}
                onClose={() => onSetCubeSheetOpen(false)}
                onOfferDouble={() => {
                    if (isMultiplayerActive) {
                        void multiplayer.broadcastDoubleOffered(game.state.cubeValue * 2);
                    }
                    game.offerDouble();
                }}
                onTakeDouble={() => {
                    if (isMultiplayerActive) {
                        void multiplayer.broadcastDoubleAccepted(game.state.cubeValue * 2);
                    }
                    game.takeDouble();
                }}
                onPassDouble={() => {
                    if (isMultiplayerActive) {
                        const offerer = game.doublingOfferedBy ?? (game.state.turn === 'X' ? 'O' : 'X');
                        void multiplayer.broadcastDoublePassed(offerer);
                    }
                    game.passDouble();
                }}
            />
        </>
    );
};

