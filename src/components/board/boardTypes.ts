/**
 * Types partagés du plateau de Backgammon (`Board.tsx`).
 *
 * Rôle :
 *   Isole l'interface `BoardProps` hors de `Board.tsx` (LOI 5).
 */

import type { BoardState } from '../../engine/backgammonEngine';
import type { GamePhase } from '../../actions/types';
import type { GameSpeed } from '../../lib/gameFeel/speedPresets';
import type { AutoConfirmMode } from '../../lib/settings/gameplaySettings';

export interface BoardProps {
    state: BoardState;
    leftDieTargets: Map<number, number[]>;
    rightDieTargets: Map<number, number[]>;
    selectedPoint: number | null;
    selectedDie: 0 | 1 | null;
    usedDice: [boolean, boolean] | boolean[];
    /** Dés lancés par l'adversaire (affichés dans la rivière centrale). */
    opponentDice?: [number, number] | null;
    onCheckerClick: (point: number) => void;
    onCheckerRightClick: (point: number) => void;
    onDestinationClick: (point: number) => void;
    onSelectDie?: (die: 0 | 1) => void;
    /** Clic / tap sur la paire de dés : inverse l'ordre (swapDiceOrderAction). */
    onDiceClick?: () => void;
    onDeselect?: () => void;
    onPlayMove?: (from: number, to: number, die?: 0 | 1) => void;
    onUndo?: () => void;
    coachHighlight?: { played: { from: number; to: number }[]; optimal: { from: number; to: number }[] } | null;
    opponentHighlight?: { from: number; to: number; isHit?: boolean }[] | null;
    /** Le double est-il possible pour le joueur au trait ? (halo du videau). */
    canDouble?: boolean;
    /** Joueur ayant proposé le videau ('X' | 'O' | null). */
    doublingOfferedBy?: 'X' | 'O' | null;
    /** Proposer le videau. */
    onOfferDouble?: () => void;
    /** Accepter le videau proposé par l'adversaire. */
    onTakeDouble?: () => void;
    /** Refuser le videau proposé par l'adversaire. */
    onPassDouble?: () => void;
    theme?: string;
    isLoading?: boolean;
    /** Phase stricte du jeu (LOI 2) ou Replay — pilote les contrôles centraux. */
    gamePhase?: GamePhase | 'REPLAY_VIEW';
    /** Lancer les dés (contrôles centraux). */
    onRoll?: () => void;
    /** Valider le coup (contrôles centraux). */
    onConfirm?: () => void;
    /** Un coup peut-il être annulé ? */
    canUndo?: boolean;
    /** Le joueur peut-il valider ? */
    canConfirm?: boolean;
    /** État de l'option « Validation auto » (`autoConfirmTurn`). */
    autoConfirmEnabled?: boolean;
    /** Bascule l'option « Validation auto » (`autoConfirmTurn`). */
    onToggleAutoConfirm?: () => void;
    /** Mode étendu d'auto-validation (`never` | `forced_only` | `always_except_cube` | `always`). */
    autoConfirmMode?: AutoConfirmMode;
    /** Sélection directe d'un mode d'auto-validation. */
    onSelectAutoConfirmMode?: (mode: AutoConfirmMode) => void;
    /** Rotation rapide entre les 4 modes d'auto-validation. */
    onCycleAutoConfirmMode?: () => void;
    /** Cadence actuelle du Bot (Coach / Tournoi / Blitz). */
    gameSpeed?: GameSpeed;
    /** Passe à la cadence suivante. */
    onCycleGameSpeed?: () => void;
    /**
     * La partie a-t-elle officiellement démarré ? Tant que la modale de
     * configuration est ouverte, aucun contrôle central n'est affiché.
     */
    isMatchStarted?: boolean;
    /**
     * Inverse le rendu Blanc/Noir : le moteur fait toujours jouer l'humain
     * côté X, la couleur choisie dans le lobby est purement visuelle.
     */
    swapColors?: boolean;
    /**
     * Affiche ou masque le badge Pip Count en bas du cadre.
     * Faux par défaut pour éliminer tout doublon avec MatchHud et préserver 100 % de la hauteur du feutre.
     */
    showPipCount?: boolean;
}
