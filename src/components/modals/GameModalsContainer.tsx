'use client';

/**
 * Conteneur des modales et overlays du jeu (Fin de partie, Bilan, Multijoueur, Ouvertures, Export, Théorie).
 *
 * Rôle :
 *   Regroupe et isole toutes les fenêtres modales et calques de fin de partie hors de `page.tsx`.
 *
 * Dépendances :
 *   `GameOverOverlay`, `GameReviewModal`, `MultiplayerLobbyModal`, `MultiplayerResultModal`,
 *   `OpeningBookModal`, `ExportImportModal`, `KnowledgeBaseModal`.
 *
 * Retrait :
 *   Supprimer ce fichier et son appel dans `page.tsx`.
 */

import React from 'react';
import type { ThemeName } from '../board/boardThemes';
import type { CompleteGameAnalysis, RawGameTurn } from '../../features/rating';
import type { UseBackgammonGameReturn } from '../../hooks/useBackgammonGame';
import type { useGameModals } from '../../hooks/useGameModals';
import type { OpeningEntry } from '../../features/openings';
import PostMatchTrainingReport from '../summary/PostMatchTrainingReport';
import GameReviewModal from '../rating/GameReviewModal';
import MultiplayerLobbyModal from '../multiplayer/MultiplayerLobbyModal';
import MultiplayerResultModal from '../multiplayer/MultiplayerResultModal';
import { OpeningBookModal } from '../openings/OpeningBookModal';
import ExportImportModal from '../export/ExportImportModal';
import KnowledgeBaseModal from '../knowledge/KnowledgeBaseModal';
import DiceAuditModal from '../dice/DiceAuditModal';
import SubscriptionModal from '../subscription/SubscriptionModal';
import { toast } from '../toast/ToastContext';

export interface GameModalsContainerProps {
    theme: ThemeName;
    modals: ReturnType<typeof useGameModals>;
    game: UseBackgammonGameReturn;
    multiplayer: any;
    isMultiplayerActive: boolean;
    latestGameAnalysis: CompleteGameAnalysis | null;
    turnsHistory: RawGameTurn[];
    openingEntry: OpeningEntry | null;
    onApplyOpeningMove?: () => void;
    onResetGameHistory: () => void;
    onBackToLobby?: () => void;
}

const GameModalsContainerComponent: React.FC<GameModalsContainerProps> = ({
    theme,
    modals,
    game,
    multiplayer,
    isMultiplayerActive,
    latestGameAnalysis,
    turnsHistory,
    openingEntry,
    onApplyOpeningMove,
    onResetGameHistory,
    onBackToLobby,
}) => {
    return (
        <>
            {/* 1. Rapport de Formation Post-Match (si manche terminée en mode Solo et que le modal Bilan détaillé n'est pas ouvert) */}
            {!isMultiplayerActive && game.phase === 'GAME_OVER' && game.gameResult && !modals.isGameReviewModalOpen && (
                <PostMatchTrainingReport
                    analysis={latestGameAnalysis}
                    winner={game.gameResult.winner}
                    winType={game.gameResult.winType}
                    pointsWon={game.gameResult.pointsWon}
                    scoreX={game.state.scoreX}
                    scoreO={game.state.scoreO}
                    matchLength={game.state.matchLength}
                    isMatchOver={game.isMatchOver}
                    gameId={latestGameAnalysis?.gameId ?? `game_${game.state.scoreX}_${game.state.scoreO}`}
                    onNextGame={() => {
                        onResetGameHistory();
                        if (game.isMatchOver) game.resetMatch();
                        else game.startNewGame();
                    }}
                    onOpenReview={modals.openGameReview}
                    onBackToLobby={onBackToLobby ?? modals.openGameReview}
                    onTrainBlunders={modals.openGameCourse}
                    onOpenDiceAudit={modals.openDiceAudit}
                    locale="fr"
                />
            )}

            {/* 2. Modal Bilan Complet & Inspection */}
            <GameReviewModal
                analysis={latestGameAnalysis}
                isOpen={modals.isGameReviewModalOpen}
                onClose={modals.closeGameReview}
                theme={theme}
                initialTab={modals.reviewInitialTab}
            />

            {/* 3. Modals Multijoueur */}
            <MultiplayerLobbyModal
                isOpen={modals.isMatchmakingModalOpen || multiplayer.status === 'searching' || multiplayer.status === 'matched' || multiplayer.status === 'connecting'}
                status={multiplayer.status}
                localProfile={multiplayer.localProfile}
                opponentProfile={multiplayer.opponentProfile}
                matchInfo={multiplayer.matchInfo}
                privateRoomCode={multiplayer.privateRoomCode}
                onStartSearch={(len) => multiplayer.startMatchmaking(len)}
                onCreatePrivateRoom={(len) => multiplayer.createPrivateRoom(len)}
                onJoinPrivateRoom={(code) => multiplayer.joinPrivateRoom(code)}
                onCancelSearch={() => {
                    multiplayer.cancelMatchmaking();
                    modals.closeMatchmaking();
                }}
                onClose={modals.closeMatchmaking}
                theme={theme}
            />

            {multiplayer.status === 'game_over' && multiplayer.matchInfo && multiplayer.opponentProfile && multiplayer.eloResult && (
                <MultiplayerResultModal
                    isOpen={true}
                    matchInfo={multiplayer.matchInfo}
                    localProfile={multiplayer.localProfile}
                    opponentProfile={multiplayer.opponentProfile}
                    eloResult={multiplayer.eloResult}
                    onRematch={() => multiplayer.startMatchmaking(multiplayer.matchInfo?.matchLength || 7)}
                    onClose={() => {
                        multiplayer.leaveMatch();
                        game.resetMatch();
                    }}
                    theme={theme}
                />
            )}

            {/* 4. Modal Bibliothèque d'Ouvertures */}
            <OpeningBookModal
                isOpen={modals.isOpeningBookModalOpen}
                onClose={modals.closeOpeningBook}
                initialOpeningId={modals.selectedOpeningIdForModal}
                onApplyMove={openingEntry && onApplyOpeningMove ? onApplyOpeningMove : undefined}
                isOpeningTurnActive={Boolean(openingEntry)}
                theme={theme}
            />

            {/* 5. Modal Export / Import & Lien de Partage */}
            <ExportImportModal
                isOpen={modals.isExportImportModalOpen}
                onClose={modals.closeExportImport}
                currentState={game.state}
                turnsHistory={turnsHistory}
                onImportState={(importedState) => {
                    game.applyRemoteState({
                        board: importedState.board,
                        dice: importedState.dice,
                        turn: importedState.turn,
                        cubeValue: importedState.cubeValue,
                        cubeOwner: importedState.cubeOwner,
                        phase: importedState.dice ? 'PLAYING_MOVES' : 'WAITING_FOR_ROLL',
                        usedDice: [false, false],
                    });
                    toast.success('Position ou match importé avec succès !', 'Import réussi');
                }}
                theme={theme}
            />

            {/* 6. Modal Base de Connaissances & Encyclopédie */}
            <KnowledgeBaseModal
                isOpen={modals.isKnowledgeModalOpen}
                onClose={modals.closeKnowledgeBase}
                initialConceptId={modals.selectedKnowledgeConceptId}
                theme={theme}
            />

            {/* 7. Modal d'Audit Cryptographique Provably Fair (SHA-256) */}
            <DiceAuditModal
                isOpen={modals.isDiceAuditModalOpen}
                onClose={modals.closeDiceAudit}
                session={game.provablyFair}
                onUpdateClientSeeds={game.updateClientSeeds}
            />

            {/* 8. Modal d'Abonnement Prestige (Soft Paywall) */}
            <SubscriptionModal
                isOpen={modals.isSubscriptionModalOpen}
                onClose={modals.closeSubscriptionModal}
                locale="fr"
            />
        </>
    );
};

export const GameModalsContainer = React.memo(GameModalsContainerComponent);
export default GameModalsContainer;
