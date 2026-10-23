'use client';

/**
 * Vue 2 — GAME : HUD + plateau + tiroir Coach + modales.
 *
 * Rôle :
 *   Isole le JSX de l'écran de jeu hors de `page.tsx` (LOI 5 : page.tsx reste mince).
 *   Composant 100 % muet : toutes les données et handlers proviennent du parent.
 *
 * Dépendances :
 *   `MatchHeader`, `GameBoardArea`, `CoachMobileDrawer`, `GameModalsContainer`.
 *
 * Retrait :
 *   Supprimer ce fichier et réintégrer le JSX dans `page.tsx`.
 */

import React from 'react';
import MatchHeader from '../hud/MatchHeader';
import GameBoardArea from './GameBoardArea';
import CoachMobileDrawer from '../coach/CoachMobileDrawer';
import GameModalsContainer from '../modals/GameModalsContainer';
import type { ThemeName, CoachHighlight } from './boardThemes';
import type { UseBackgammonGameReturn } from '../../hooks/useBackgammonGame';
import type { useGameModals } from '../../hooks/useGameModals';
import type { useMultiplayerGame } from '../../hooks/useMultiplayerGame';
import type { useCoach } from '../../hooks/useCoach';
import type { CompleteGameAnalysis, RawGameTurn } from '../../features/rating';
import type { OpeningEntry } from '../../features/openings';
import type { CoachSidebarProps } from '../coach/CoachSidebar';

export interface GameScreenViewProps {
    /** Classe d'ambiance du thème actif. */
    ambianceClass: string;
    /** Traducteur i18n. */
    t: (key: string) => string;
    /** Locale active. */
    locale: string;
    /** Thème actif. */
    theme: ThemeName;
    onToggleTheme: () => void;
    /** État et actions du jeu. */
    game: UseBackgammonGameReturn;
    isMultiplayerActive: boolean;
    multiplayer: ReturnType<typeof useMultiplayerGame>;
    modals: ReturnType<typeof useGameModals>;
    /** Coach. */
    coach: CoachSidebarProps['coach'];
    coachHighlight: CoachHighlight | null;
    isAnalyzing: boolean;
    matchStats: CoachSidebarProps['matchStats'];
    matchStatsO: CoachSidebarProps['matchStatsO'];
    prX: number | null;
    prO: number | null;
    hoveredCandidate: string | null;
    onCandidateHover: (notation: string | null) => void;
    onDismissCoach: () => void;
    onReplayMove: () => void;
    onTriggerCoach: () => void;
    /** Interactions plateau. */
    activeDie: 0 | 1;
    isBoardLoading: boolean;
    onCheckerClick: (point: number) => void;
    onCheckerRightClick: (point: number) => void;
    onDestinationClick: (point: number) => void;
    onPlayMove: (from: number, to: number, die?: 0 | 1) => void;
    onSelectDie: (die: 0 | 1) => void;
    onDiceClick: () => void;
    onDeselect: () => void;
    /** HUD. */
    turnsCount: number;
    onBackToLobby: () => void;
    /** Modales. */
    latestGameAnalysis: CompleteGameAnalysis | null;
    turnsHistory: RawGameTurn[];
    openingEntry: OpeningEntry | null;
    onApplyOpeningMove: () => void;
    onResetGameHistory: () => void;
    gameId: string;
    /** Couleur du joueur humain */
    playerColor?: 'X' | 'O';
}

const GameScreenViewComponent: React.FC<GameScreenViewProps> = ({
    ambianceClass,
    t,
    locale,
    theme,
    onToggleTheme,
    game,
    isMultiplayerActive,
    multiplayer,
    modals,
    coach,
    coachHighlight,
    isAnalyzing,
    matchStats,
    matchStatsO,
    prX,
    prO,
    hoveredCandidate,
    onCandidateHover,
    onDismissCoach,
    onReplayMove,
    onTriggerCoach,
    activeDie,
    isBoardLoading,
    onCheckerClick,
    onCheckerRightClick,
    onDestinationClick,
    onPlayMove,
    onSelectDie,
    onDiceClick,
    onDeselect,
    turnsCount,
    onBackToLobby,
    latestGameAnalysis,
    turnsHistory,
    openingEntry,
    onApplyOpeningMove,
    onResetGameHistory,
    gameId,
    playerColor,
}) => {
    const matchContext = {
        scoreX: game.state.scoreX,
        scoreO: game.state.scoreO,
        matchLength: game.state.matchLength,
        cubeValue: game.state.cubeValue,
        cubeOwner: game.state.cubeOwner,
        crawford: game.state.crawford,
    };

    return (
        <main
            data-testid="app-game-view"
            className={`h-dvh max-h-dvh w-full grid grid-rows-[minmax(0,auto)_minmax(0,1fr)] overflow-hidden p-1 sm:p-2 select-none transition-colors duration-500 ${ambianceClass}`}
        >
            {/* 1. HUD & Actions de jeu */}
            <MatchHeader
                t={t}
                theme={theme}
                onToggleTheme={onToggleTheme}
                game={game}
                isMultiplayerActive={isMultiplayerActive}
                multiplayer={multiplayer}
                onOpenExportImport={modals.openExportImport}
                onTriggerCoach={onTriggerCoach}
                turnsCount={turnsCount}
                prX={prX}
                prO={prO}
                onBackToLobby={onBackToLobby}
                playerColor={playerColor}
                onOpenDiceAudit={modals.openDiceAudit}
            />

            {/* 2. Plateau et Panneau Coach latéral */}
            <GameBoardArea
                theme={theme}
                game={game}
                activeDie={activeDie}
                isBoardLoading={isBoardLoading}
                activeCoachHighlight={coachHighlight}
                onCheckerClick={onCheckerClick}
                onCheckerRightClick={onCheckerRightClick}
                onDestinationClick={onDestinationClick}
                onPlayMove={onPlayMove}
                onSelectDie={onSelectDie}
                onDiceClick={onDiceClick}
                onDeselect={onDeselect}
                coach={coach}
                isAnalyzing={isAnalyzing}
                onDismissCoach={onDismissCoach}
                onReplayMove={onReplayMove}
                onOpenKnowledgeConcept={modals.openKnowledgeBase}
                onBlunderClick={modals.openGameCourse}
                onCandidateHover={onCandidateHover}
                turnsHistory={turnsHistory}
                onTriggerCoach={onTriggerCoach}
                matchStats={matchStats}
                gameId={gameId}
                matchContext={matchContext}
                isMatchStarted
                playerColor={playerColor}
            />

            {/* 3. Tiroir mobile du Coach */}
            <CoachMobileDrawer
                isOpen={modals.isMobileDrawerOpen}
                onOpen={modals.openMobileDrawer}
                onClose={modals.closeMobileDrawer}
                coach={coach}
                isAnalyzing={isAnalyzing}
                matchStats={matchStats}
                matchStatsO={matchStatsO}
                onReplayMove={onReplayMove}
                onDismiss={onDismissCoach}
                onOpenKnowledgeConcept={modals.openKnowledgeBase}
                onBlunderClick={modals.openGameCourse}
                onCandidateHover={onCandidateHover}
                turnsHistory={turnsHistory}
                pr={prX}
                locale={locale}
                matchContext={matchContext}
                positionKey={game.state.board.join(',')}
                gameId={gameId}
                dice={game.dice}
                board={game.state.board}
            />

            {/* 4. Modales secondaires et overlay du jeu */}
            <GameModalsContainer
                theme={theme}
                modals={modals}
                game={game}
                multiplayer={multiplayer}
                isMultiplayerActive={isMultiplayerActive}
                latestGameAnalysis={latestGameAnalysis}
                turnsHistory={turnsHistory}
                openingEntry={openingEntry}
                onApplyOpeningMove={onApplyOpeningMove}
                onResetGameHistory={onResetGameHistory}
                onBackToLobby={onBackToLobby}
            />
        </main>
    );
};

/** Composant mémoïsé : ne re-rend que si ses props changent. */
export const GameScreenView = React.memo(GameScreenViewComponent);
export default GameScreenView;
