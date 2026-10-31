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
import type { useMultiplayerGame } from '../../hooks/useMultiplayerGame';
import type { OpeningEntry } from '../../features/openings';
import PostMatchTrainingReport from '../summary/PostMatchTrainingReport';
import GameReviewModal from '../rating/GameReviewModal';
import MultiplayerLobbyModal from '../multiplayer/MultiplayerLobbyModal';
import PrivateRoomModal from '../multiplayer/PrivateRoomModal';
import MultiplayerResultModal from '../multiplayer/MultiplayerResultModal';
import { OpeningBookModal } from '../openings/OpeningBookModal';
import MatchImportExportModal from './MatchImportExportModal';
import KnowledgeBaseModal from '../knowledge/KnowledgeBaseModal';
import DiceAuditModal from '../dice/DiceAuditModal';
import SubscriptionModal from '../subscription/SubscriptionModal';
import { toast } from '../toast/ToastContext';

export interface GameModalsContainerProps {
    theme: ThemeName;
    modals: ReturnType<typeof useGameModals>;
    game: UseBackgammonGameReturn;
    multiplayer: ReturnType<typeof useMultiplayerGame>;
    isMultiplayerActive: boolean;
    latestGameAnalysis: CompleteGameAnalysis | null;
    turnsHistory: RawGameTurn[];
    openingEntry: OpeningEntry | null;
    onApplyOpeningMove?: () => void;
    onResetGameHistory: () => void;
    onBackToLobby?: () => void;
    prO?: number | null;
    locale?: string;
}

const BOT_DIFFICULTY_PR_MAP: Record<string, { pr: number; fr: string; en: string }> = {
    beginner: { pr: 12.5, fr: 'Débutant', en: 'Beginner' },
    easy: { pr: 10.5, fr: 'Amateur', en: 'Casual' },
    intermediate: { pr: 7.5, fr: 'Intermédiaire', en: 'Intermediate' },
    medium: { pr: 7.5, fr: 'Intermédiaire', en: 'Intermediate' },
    hard: { pr: 3.5, fr: 'Expert', en: 'Expert' },
    expert: { pr: 2.5, fr: 'Maître', en: 'Master' },
    grandmaster: { pr: 0.6, fr: 'Grand-Maître', en: 'Grandmaster' },
};

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
    prO = null,
    locale = 'fr',
}) => {
    const isEn = Boolean(locale && locale !== 'fr');
    const botDiffKey = (latestGameAnalysis?.opponentDifficulty ?? game.difficulty ?? 'intermediate').toLowerCase();
    const botMeta = BOT_DIFFICULTY_PR_MAP[botDiffKey] ?? BOT_DIFFICULTY_PR_MAP.intermediate;
    const isAnySecondaryModalOpen =
        modals.isGameReviewModalOpen ||
        modals.isExportImportModalOpen ||
        modals.isDiceAuditModalOpen ||
        modals.isKnowledgeModalOpen ||
        modals.isOpeningBookModalOpen ||
        modals.isSubscriptionModalOpen;

    return (
        <>
            {/* 1. Rapport de Formation Post-Match (masqué si une sous-modale d'inspection est ouverte pour éviter tout empilement) */}
            {!isMultiplayerActive && game.phase === 'GAME_OVER' && game.gameResult && !isAnySecondaryModalOpen && (
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
                    botPr={Math.min(10.0, prO ?? botMeta.pr)}
                    botCategory={isEn ? botMeta.en : botMeta.fr}
                    onNextGame={() => {
                        onResetGameHistory();
                        if (game.isMatchOver) game.resetMatch();
                        else game.startNewGame();
                    }}
                    onOpenReview={modals.openGameReview}
                    onBackToLobby={onBackToLobby ?? onResetGameHistory}
                    onTrainBlunders={modals.openGameCourse}
                    onOpenDiceAudit={modals.openDiceAudit}
                    onOpenExportImport={modals.openExportImport}
                    locale={locale}
                />
            )}

            {/* 2. Modal Bilan Complet & Inspection */}
            <GameReviewModal
                analysis={latestGameAnalysis}
                isOpen={modals.isGameReviewModalOpen}
                onClose={modals.closeGameReview}
                theme={theme}
                initialTab={modals.reviewInitialTab}
                locale={locale === 'en' ? 'en' : 'fr'}
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
                onClose={() => {
                    if (multiplayer.status === 'searching') {
                        multiplayer.cancelMatchmaking();
                    }
                    modals.closeMatchmaking();
                }}
                theme={theme}
            />

            {/* 3b. Modale Salon Privé dédiée (Lien d'invitation 1-clic & Partage WhatsApp/Club) */}
            <PrivateRoomModal
                isOpen={modals.isPrivateRoomModalOpen}
                onClose={modals.closePrivateRoomModal}
                privateRoomCode={multiplayer.privateRoomCode}
                onCreatePrivateRoom={(len) => multiplayer.createPrivateRoom(len)}
                onJoinPrivateRoom={async (code) => {
                    await multiplayer.joinPrivateRoom(code);
                    modals.closePrivateRoomModal();
                }}
                onCancelSearch={() => {
                    multiplayer.cancelMatchmaking();
                    modals.closePrivateRoomModal();
                }}
                initialRoomCode={modals.privateRoomInitialCode}
                autoConnect={Boolean(modals.privateRoomInitialCode)}
            />

            {multiplayer.status === 'game_over' && multiplayer.matchInfo && multiplayer.opponentProfile && multiplayer.eloResult && (
                <MultiplayerResultModal
                    isOpen={true}
                    matchInfo={multiplayer.matchInfo}
                    localProfile={multiplayer.localProfile}
                    opponentProfile={multiplayer.opponentProfile}
                    eloResult={multiplayer.eloResult}
                    onRematch={() => multiplayer.startMatchmaking(multiplayer.matchInfo?.matchLength || 7, { isRematch: true })}
                    onOpenReview={modals.openGameReview}
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
            <MatchImportExportModal
                isOpen={modals.isExportImportModalOpen}
                onClose={modals.closeExportImport}
                currentState={game.state}
                turnsHistory={turnsHistory}
                playerX="Joueur X"
                playerO={latestGameAnalysis?.opponentDifficulty ? `Bot (${latestGameAnalysis.opponentDifficulty})` : 'Joueur O'}
                matchLength={game.state.matchLength}
                scoreX={game.state.scoreX}
                scoreO={game.state.scoreO}
                winner={game.gameResult?.winner}
                pointsWon={game.gameResult?.pointsWon}
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
                    toast.success('Position importée avec succès !', 'Import réussi');
                }}
                onImportMatch={(importedMatch) => {
                    if (importedMatch.finalBoard) {
                        game.applyRemoteState({
                            board: importedMatch.finalBoard.slice(),
                            dice: null,
                            turn: 'X',
                            cubeValue: 1,
                            cubeOwner: null,
                            phase: 'WAITING_FOR_ROLL',
                            usedDice: [false, false],
                        });
                    }
                    toast.success(`Match ${importedMatch.playerX} vs ${importedMatch.playerO} importé !`, 'Import réussi');
                }}
                locale={locale}
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
                locale={locale}
            />
        </>
    );
};

export const GameModalsContainer = React.memo(GameModalsContainerComponent);
export default GameModalsContainer;
