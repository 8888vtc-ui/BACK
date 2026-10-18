'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Board from '../components/board/Board';
import type { CoachHighlight } from '../components/board/boardThemes';
import CoachPanel from '../components/coach/CoachPanel';
import ErrorBoundary from '../components/common/ErrorBoundary';
import MatchHud from '../components/hud/MatchHud';
import GameOverOverlay from '../components/board/GameOverOverlay';
import DoublingControls from '../components/board/DoublingControls';
import DifficultySelector from '../components/hud/DifficultySelector';
import MultiplayerLobbyModal from '../components/multiplayer/MultiplayerLobbyModal';
import MultiplayerBanner from '../components/multiplayer/MultiplayerBanner';
import MultiplayerResultModal from '../components/multiplayer/MultiplayerResultModal';
import { useBoardTheme } from '../hooks/useBoardTheme';
import { useBackgammonGame } from '../hooks/useBackgammonGame';
import { useCoach } from '../hooks/useCoach';
import { useMultiplayerGame } from '../hooks/useMultiplayerGame';
import type { RealtimeBroadcastAction } from '../features/multiplayer/types';
import { toast } from '../components/toast/ToastContext';
import {
    impactLight,
    impactMedium,
    impactHeavy,
    notificationSuccess,
    notificationError,
} from '../lib/capacitor/haptics';
import { soundEngine } from '../lib/sound/soundEngine';
import {
    persistNewGame,
    persistGameUpdate,
    persistMove,
} from '../lib/offline/persistenceService';
import GameReviewModal from '../components/rating/GameReviewModal';
import {
    analyzeCompleteGame,
    saveGameAnalysis,
    CompleteGameAnalysis,
    RawGameTurn,
} from '../features/rating';
import {
    applyMove,
    Move,
    pipCount,
    BoardState,
    evaluateMoveSafety,
    getSafestDestination,
    X_BAR,
    O_BAR,
} from '../engine/backgammonEngine';
import {
    extractStrategicFeatures,
    analyzeBoardStructure,
    analyzeBlots,
    generateRuleBasedExplanation,
    StrategicFeatures,
    buildMatchContext,
} from '../features/coach';
import { evaluatePosition } from '../lib/analysisService';
import { getOpening, isOpeningSituation } from '../features/openings';
import type { OpeningEntry } from '../features/openings';
import { OpeningAssistantBanner } from '../components/openings/OpeningAssistantBanner';
import { OpeningBookModal } from '../components/openings/OpeningBookModal';
import ExportImportModal from '../components/export/ExportImportModal';
import KnowledgeBaseModal from '../components/knowledge/KnowledgeBaseModal';
import { parseFromXGID } from '../features/export';
import { useGameAnnouncements } from '../components/common/LiveAnnouncer';
import { useI18n } from '../lib/i18n';
import {
    analyzeBoardMoves,
    formatMoveSequenceNotation,
    formatMoveSequenceNotationWithHits,
    formatMoveSequenceNotationAbsolute,
} from '../lib/engine/evaluator';
import { normalizeMoveNotation } from '../features/drills/blunderDrillEngine';

interface CoachState {
    verdict: 'doubtful' | 'blunder';
    equityLoss: number;
    playedMove: string;
    optimalMove: string;
    explanation: string | null;
    features?: StrategicFeatures;
    positionKey?: string;
    /** Top des coups évalués par le moteur (notation, équité, perte). */
    candidateMoves?: { rank: number; notation: string; equity: number; equityLoss: number }[];
    /** Plateau avant le coup (pour le bouton "Reprendre l'erreur"). */
    boardBefore?: number[];
}

/** Statistiques cumulées de la session pour le calcul du PR (Performance Rating). */
export interface MatchStats {
    /** Nombre de décisions (coups) prises par le joueur. */
    decisionsCount: number;
    /** Somme des pertes d'équité (valeur absolue cumulée). */
    totalEquityLoss: number;
    /** Nombre de blunders (perte d'équité >= 0.08). */
    blundersCount: number;
}

export default function Home() {
    const { t, locale } = useI18n();
    const { theme, toggleTheme } = useBoardTheme();
    const [isBoardLoading, setIsBoardLoading] = useState(false);
    const [isMatchmakingModalOpen, setIsMatchmakingModalOpen] = useState(false);
    const [latestGameAnalysis, setLatestGameAnalysis] = useState<CompleteGameAnalysis | null>(null);
    const [isGameReviewModalOpen, setIsGameReviewModalOpen] = useState(false);
    const [isOpeningBookModalOpen, setIsOpeningBookModalOpen] = useState(false);
    const [selectedOpeningIdForModal, setSelectedOpeningIdForModal] = useState<string | undefined>(undefined);
    const [isOpeningDismissed, setIsOpeningDismissed] = useState(false);
    const [isOpeningHighlightActive, setIsOpeningHighlightActive] = useState(true);
    const [isExportImportModalOpen, setIsExportImportModalOpen] = useState(false);
    const [isKnowledgeModalOpen, setIsKnowledgeModalOpen] = useState(false);
    const [selectedKnowledgeConceptId, setSelectedKnowledgeConceptId] = useState<string | undefined>(undefined);
    const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

    const handleOpenKnowledgeConcept = useCallback((conceptId: string) => {
        setSelectedKnowledgeConceptId(conceptId);
        setIsKnowledgeModalOpen(true);
    }, []);

    const gameIdRef = useRef<string>('');
    const moveCountRef = useRef<number>(0);
    const turnsHistoryRef = useRef<RawGameTurn[]>([]);
    const currentTurnMovesRef = useRef<{ from: number; to: number }[]>([]);
    const turnBoardBeforeRef = useRef<number[]>([]);
    const currentTurnDiceRef = useRef<[number, number] | null>(null);

    // Initialisation du jeu avec la machine à états
    const game = useBackgammonGame({
        matchLength: 7,
        autoOpponent: true,
        opponentDelayMs: 600,
        stepDelayMs: 900,
        locale,
        onGameOver: (result) => {
            const title =
                result.winType === 'backgammon'
                    ? '👑 BACKGAMMON (3x) !'
                    : result.winType === 'gammon'
                        ? '🎉 GAMMON (2x) !'
                        : result.winType === 'pass'
                            ? '🏳️ Abandon de videau'
                            : '⚡ Victoire simple (1x) !';
            toast.success(
                `Le Joueur ${result.winner} remporte la manche (+${result.pointsWon} pts) contre ${result.loser}.`,
                title,
            );
            notificationSuccess();
            soundEngine.playVictory();

            if (isMultiplayerActive) {
                multiplayer.handleMatchOver(result.winner, result.winType, result.pointsWon);
            }

            if (gameIdRef.current) {
                persistGameUpdate(gameIdRef.current, {
                    status: 'completed',
                    winner: result.winner,
                    win_type: result.winType,
                    points_won: result.pointsWon,
                    score_x: game.state.scoreX,
                    score_o: game.state.scoreO,
                    ended_at: new Date().toISOString(),
                }).catch(() => { });
            }

            // Clôture et analyse de la partie complète
            if (currentTurnMovesRef.current.length > 0 && currentTurnDiceRef.current) {
                turnsHistoryRef.current.push({
                    turnNumber: turnsHistoryRef.current.length + 1,
                    player: 'X',
                    dice: currentTurnDiceRef.current,
                    boardBefore: turnBoardBeforeRef.current.length > 0 ? turnBoardBeforeRef.current : game.state.board,
                    boardAfter: [...game.state.board],
                    moves: [...currentTurnMovesRef.current],
                });
                currentTurnMovesRef.current = [];
            }

            try {
                const analysis = analyzeCompleteGame(turnsHistoryRef.current, {
                    targetPlayer: 'X',
                    gameId: gameIdRef.current || `game_${Date.now()}`,
                    opponentType: isMultiplayerActive ? 'human' : 'ai',
                    winner: result.winner,
                    winType: result.winType,
                    pointsWon: result.pointsWon,
                    scoreX: game.state.scoreX,
                    scoreO: game.state.scoreO,
                    matchLength: game.state.matchLength,
                });
                saveGameAnalysis(analysis);
                setLatestGameAnalysis(analysis);
            } catch (e) {
                console.warn('[Page] Échec analyse fin de partie :', e);
            }
        },
    });

    // Logique Coach IA (analyse temps réel, statistiques, streak) — extraite dans useCoach.
    const {
        coach,
        coachHighlight,
        matchStats,
        optimalStreak,
        brilliantMove,
        isAnalyzing,
        dismissCoach,
        replayMove: handleReplayMove,
        triggerCoach: handleTriggerCoach,
    } = useCoach({
        game,
        currentTurnMovesRef,
        currentTurnDiceRef,
        turnBoardBeforeRef,
        onCoachTriggered: () => setIsMobileDrawerOpen(true),
    });

    // Écouteur des actions distantes de l'adversaire en multijoueur
    const handleRemoteAction = useCallback(
        (action: RealtimeBroadcastAction) => {
            switch (action.type) {
                case 'DICE_ROLLED':
                    game.rollDice(action.dice);
                    toast.info(`L'adversaire a lancé [${action.dice[0]}, ${action.dice[1]}].`, 'Dés adverses');
                    break;
                case 'CHECKER_MOVED':
                    game.applyRemoteState({
                        board: action.board,
                        usedDice: action.usedDice,
                    });
                    break;
                case 'TURN_FINISHED':
                    game.applyRemoteState({
                        board: game.state.board,
                        turn: action.nextTurn,
                        dice: null,
                        usedDice: [false, false],
                        phase: 'WAITING_FOR_ROLL',
                    });
                    break;
                case 'DOUBLE_OFFERED':
                    game.offerDouble();
                    toast.info(`L'adversaire propose de doubler à ${action.cubeValue} !`, 'Proposition de double');
                    break;
                case 'DOUBLE_ACCEPTED':
                    game.takeDouble();
                    toast.success(`L'adversaire a accepté le videau à ${action.cubeValue}.`, 'Double accepté');
                    break;
                case 'DOUBLE_PASSED':
                    game.passDouble();
                    toast.warning(`L'adversaire abandonne le videau. Vous gagnez la manche !`, 'Videau passé');
                    break;
                default:
                    break;
            }
        },
        [game],
    );

    const multiplayer = useMultiplayerGame(handleRemoteAction);
    const isMultiplayerActive =
        multiplayer.status === 'connected' || multiplayer.status === 'opponent_disconnected';

    // Synchronisation du match multijoueur dès qu'un adversaire est trouvé
    useEffect(() => {
        if (multiplayer.status === 'matched' && multiplayer.matchInfo) {
            game.resetMatch();
            setIsMatchmakingModalOpen(false);
            toast.success(
                `Match contre ${multiplayer.opponentProfile?.displayName} (${multiplayer.opponentProfile?.rating} Elo) en ${multiplayer.matchInfo.matchLength} pts.`,
                'Partie Multijoueur lancée !',
            );
        }
    }, [multiplayer.status, multiplayer.matchInfo, multiplayer.opponentProfile]);

    // Enregistrement offline-first de la partie à son démarrage
    useEffect(() => {
        const id = `game_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        gameIdRef.current = id;
        moveCountRef.current = 0;

        persistNewGame({
            id,
            opponent_type: isMultiplayerActive ? 'human' : 'ai',
            opponent_difficulty: isMultiplayerActive ? null : game.difficulty,
            match_length: game.state.matchLength,
            score_x: game.state.scoreX,
            score_o: game.state.scoreO,
            cube_value: game.state.cubeValue,
            cube_owner: game.state.cubeOwner,
            is_crawford: game.state.crawford,
            status: 'in_progress',
            started_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        }).catch(() => { });
    }, [isMultiplayerActive]);

    // Notifie le joueur humain des dés et coups joués par l'ordinateur en solo
    useEffect(() => {
        if (!isMultiplayerActive && game.lastOpponentDice) {
            const notation =
                game.lastOpponentMoves && game.lastOpponentMoves.length > 0
                    ? formatMoveSequenceNotationAbsolute(game.lastOpponentMoves, 'O')
                    : t('game.noMovePossible');
            toast.info(
                `L’ordinateur (O) a joué les dés [${game.lastOpponentDice[0]}, ${game.lastOpponentDice[1]}] : ${notation}`,
                'Tour de l’adversaire',
            );
            if (game.lastOpponentMoves && game.lastOpponentMoves.length > 0) {
                moveCountRef.current += 1;
                turnsHistoryRef.current.push({
                    turnNumber: turnsHistoryRef.current.length + 1,
                    player: 'O',
                    dice: [game.lastOpponentDice[0], game.lastOpponentDice[1]],
                    boardBefore: game.state.board,
                    boardAfter: game.state.board,
                    moves: game.lastOpponentMoves,
                });
                persistMove({
                    id: `mv_${Date.now()}_${moveCountRef.current}`,
                    game_id: gameIdRef.current || 'game_default',
                    move_number: moveCountRef.current,
                    player: 'O',
                    dice: [game.lastOpponentDice[0], game.lastOpponentDice[1]],
                    move_notation: formatMoveSequenceNotationAbsolute(game.lastOpponentMoves, 'O'),
                    board_before: game.state.board,
                    board_after: game.state.board,
                    played_at: new Date().toISOString(),
                }).catch(() => { });
            }
        }
    }, [game.lastOpponentDice, game.lastOpponentMoves, isMultiplayerActive]);

    const [preferredDie, setPreferredDie] = useState<0 | 1>(0);

    // Synchronisation automatique quand un dé est joué
    useEffect(() => {
        if (game.dice && game.dice[0] === game.dice[1]) {
            setPreferredDie(0);
        } else if (game.usedDice[0] && !game.usedDice[1]) {
            setPreferredDie(1);
        } else if (game.usedDice[1] && !game.usedDice[0]) {
            setPreferredDie(0);
        }
    }, [game.usedDice, game.dice]);

    // Importation automatique d'une position partagée via URL (?xgid=...)
    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            const params = new URLSearchParams(window.location.search);
            const sharedXgid = params.get('xgid');
            if (sharedXgid) {
                const parsed = parseFromXGID(sharedXgid);
                game.applyRemoteState({
                    board: parsed.board,
                    dice: parsed.dice,
                    turn: parsed.turn,
                    cubeValue: parsed.cubeValue,
                    cubeOwner: parsed.cubeOwner,
                    phase: parsed.dice ? 'PLAYING_MOVES' : 'WAITING_FOR_ROLL',
                    usedDice: [false, false],
                });
                toast.success('Position XGID partagée chargée avec succès !', 'Lien de partage');
                const cleanUrl = window.location.pathname;
                window.history.replaceState({}, '', cleanUrl);
            }
        } catch (err) {
            console.warn('[Page] Erreur analyse paramètre XGID partagé :', err);
        }
    }, [game.applyRemoteState]);

    // Raccourcis clavier de compétition (Speed-Play) : Espace, Tab, D.
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore si le focus est dans un champ de saisie.
            const target = e.target as HTMLElement | null;
            if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
                return;
            }

            switch (e.key) {
                case ' ': {
                    // Espace : lance les dés si en attente de lancer.
                    if (game.phase === 'WAITING_FOR_ROLL' && game.state.turn === 'X') {
                        e.preventDefault();
                        impactMedium();
                        soundEngine.playDiceRoll();
                        game.rollDice();
                    }
                    break;
                }
                case 'Tab': {
                    // Tab : inverse l'ordre des deux dés (feedback visuel de rotation).
                    if (game.dice && game.state.turn === 'X') {
                        e.preventDefault();
                        impactLight();
                        setPreferredDie((prev) => ((1 - prev) as 0 | 1));
                    }
                    break;
                }
                case 'd':
                case 'D': {
                    // D : propose le videau (double) si disponible avant le lancer.
                    if (game.canDouble) {
                        e.preventDefault();
                        impactHeavy();
                        soundEngine.playCubeOffer();
                        game.offerDouble();
                    }
                    break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [game.phase, game.state.turn, game.dice, game.canDouble, game.rollDice, game.offerDouble]);

    const activeDie: 0 | 1 =
        game.selected?.die ??
        (game.usedDice[preferredDie] ? ((1 - preferredDie) as 0 | 1) : preferredDie);

    const handlePlayMove = useCallback((from: number, to: number, die?: 0 | 1) => {
        impactMedium();
        currentTurnMovesRef.current.push({ from, to });
        game.playMove(from, to, die);
    }, [game.playMove]);

    const handleSelectDie = useCallback((die: 0 | 1) => {
        impactLight();
        setPreferredDie(die);

        const targets = die === 0 ? game.leftDieTargets : game.rightDieTargets;
        if (targets.size === 0) return;

        // Cas 1 : Un pion est déjà sélectionné
        if (game.selected) {
            if (targets.has(game.selected.point)) {
                game.setSelectedDie(die);
            }
            return;
        }

        // Cas 2 : Aucun pion n'est sélectionné
        const movablePoints = Array.from(targets.keys());
        if (movablePoints.length === 1) {
            const from = movablePoints[0];
            const dests = targets.get(from) ?? [];
            if (dests.length === 1) {
                // Auto-move unique pour ce dé
                handlePlayMove(from, dests[0], die);
                return;
            }
            // Plusieurs destinations pour cette flèche avec ce dé :
            // sélectionne le pion et n'affiche QUE ses destinations
            game.selectChecker(from, die);
            return;
        }

        // Plusieurs flèches peuvent jouer ce dé :
        // "si le dé cliqué offre plusieurs destinations, sélectionne le pion et n'affiche QUE ses destinations"
        const isX = game.state.turn === 'X';
        const barPoint = isX ? X_BAR : O_BAR;
        const bestFrom = movablePoints.includes(barPoint)
            ? barPoint
            : movablePoints.reduce((best, p) => {
                const dests = targets.get(p) ?? [];
                const safestDest = getSafestDestination(p, dests, game.state.board, game.state.turn);
                const safety = evaluateMoveSafety(game.state.board, { from: p, to: safestDest }, game.state.turn);
                const bestDests = targets.get(best) ?? [];
                const bestSafestDest = getSafestDestination(best, bestDests, game.state.board, game.state.turn);
                const bestSafety = evaluateMoveSafety(game.state.board, { from: best, to: bestSafestDest }, game.state.turn);
                return safety > bestSafety ? p : best;
            }, movablePoints[0]);

        game.selectChecker(bestFrom, die);
    }, [game.selected, game.leftDieTargets, game.rightDieTargets, game.state.board, game.state.turn, game.selectChecker, game.setSelectedDie, handlePlayMove]);

    const handleDieDoubleClick = useCallback((die: 0 | 1) => {
        impactMedium();
        const targets = die === 0 ? game.leftDieTargets : game.rightDieTargets;
        if (targets.size === 0) return;

        // Si un pion est sélectionné et a des destinations avec ce dé
        if (game.selected && targets.has(game.selected.point)) {
            const dests = targets.get(game.selected.point) ?? [];
            if (dests.length > 0) {
                const safestDest = getSafestDestination(game.selected.point, dests, game.state.board, game.state.turn);
                handlePlayMove(game.selected.point, safestDest, die);
                return;
            }
        }

        // Trouve le coup le plus sûr pour ce dé parmi toutes les flèches possibles
        const movablePoints = Array.from(targets.keys());
        const isX = game.state.turn === 'X';
        const barPoint = isX ? X_BAR : O_BAR;
        const candidates = movablePoints.includes(barPoint) ? [barPoint] : movablePoints;

        let bestFrom = candidates[0];
        let bestDest = (targets.get(bestFrom) ?? [])[0];
        let bestSafety = -Infinity;

        for (const from of candidates) {
            const dests = targets.get(from) ?? [];
            for (const dest of dests) {
                const safety = evaluateMoveSafety(game.state.board, { from, to: dest }, game.state.turn);
                if (safety > bestSafety) {
                    bestSafety = safety;
                    bestFrom = from;
                    bestDest = dest;
                }
            }
        }

        if (bestDest !== undefined) {
            handlePlayMove(bestFrom, bestDest, die);
        }
    }, [game.selected, game.leftDieTargets, game.rightDieTargets, game.state.board, game.state.turn, handlePlayMove]);

    const handleCheckerClick = useCallback((point: number) => {
        impactLight();
        // Désélection si on reclique sur le pion déjà sélectionné
        if (game.selected?.point === point) {
            game.deselect();
            return;
        }

        const leftDests = game.leftDieTargets.get(point) ?? [];
        const rightDests = game.rightDieTargets.get(point) ?? [];
        const allDests = Array.from(new Set([...leftDests, ...rightDests]));

        // Aucun coup légal pour ce pion
        if (allDests.length === 0) {
            return;
        }

        // Acceptance : un clic sur un pion à destination unique le déplace sans second clic
        if (allDests.length === 1) {
            const dest = allDests[0];
            const die: 0 | 1 = leftDests.includes(dest) ? 0 : 1;
            handlePlayMove(point, dest, die);
            return;
        }

        // Modèle Snowie/TMG : si un seul des deux dés est jouable pour ce pion (destination unique pour ce dé)
        if (leftDests.length === 1 && rightDests.length === 0) {
            handlePlayMove(point, leftDests[0], 0);
            return;
        }
        if (rightDests.length === 1 && leftDests.length === 0) {
            handlePlayMove(point, rightDests[0], 1);
            return;
        }

        // Smart Click : clic gauche = premier dé disponible (dé gauche en priorité).
        // Applique immédiatement le déplacement vers la destination la plus sûre.
        if (leftDests.length > 0) {
            const safest = getSafestDestination(point, leftDests, game.state.board, game.state.turn);
            handlePlayMove(point, safest, 0);
            return;
        }
        if (rightDests.length > 0) {
            const safest = getSafestDestination(point, rightDests, game.state.board, game.state.turn);
            handlePlayMove(point, safest, 1);
            return;
        }
    }, [game.selected?.point, game.deselect, game.leftDieTargets, game.rightDieTargets, game.state.board, game.state.turn, handlePlayMove]);

    const handleCheckerDoubleClick = useCallback((point: number) => {
        impactMedium();
        const leftDests = game.leftDieTargets.get(point) ?? [];
        const rightDests = game.rightDieTargets.get(point) ?? [];
        const allDests = Array.from(new Set([...leftDests, ...rightDests]));

        if (allDests.length === 0) return;

        // Double-clic : tente le coup "somme des deux dés" en une action (si le point intermédiaire est libre)
        const dice = game.dice;
        if (dice && dice[0] !== dice[1]) {
            const isX = game.state.turn === 'X';
            const sum = dice[0] + dice[1];
            const sumDest = isX ? point - sum : point + sum;
            const midDest = isX ? point - dice[0] : point + dice[0];

            // Vérifie que la destination somme est légale et que le point intermédiaire est libre
            const sumIsLegal = allDests.includes(sumDest) || leftDests.includes(sumDest) || rightDests.includes(sumDest);
            const midVal = game.state.board[midDest] ?? 0;
            const midIsFree =
                midDest >= 1 &&
                midDest <= 24 &&
                (isX ? midVal >= -1 : midVal <= 1); // pas bloqué par 2+ pions adverses

            if (sumIsLegal && midIsFree) {
                // Joue la somme en deux sous-mouvements, avec un délai de 200ms
                // entre les deux pour visualiser un éventuel Hit intermédiaire.
                handlePlayMove(point, midDest, 0);
                window.setTimeout(() => {
                    handlePlayMove(midDest, sumDest, 1);
                }, 200);
                return;
            }
        }

        // Repli : joue immédiatement vers la destination par défaut (la plus sûre)
        const safestDest = getSafestDestination(point, allDests, game.state.board, game.state.turn);
        const die: 0 | 1 = leftDests.includes(safestDest) ? 0 : 1;
        handlePlayMove(point, safestDest, die);
    }, [game.leftDieTargets, game.rightDieTargets, game.state.board, game.state.turn, game.dice, handlePlayMove]);

    const handleCheckerRightClick = useCallback((point: number) => {
        impactLight();
        const rightDests = game.rightDieTargets.get(point) ?? [];
        const leftDests = game.leftDieTargets.get(point) ?? [];

        // Smart Click : clic droit = second dé disponible (dé droit en priorité).
        // Applique immédiatement le déplacement vers la destination la plus sûre.
        if (rightDests.length > 0) {
            const safest = getSafestDestination(point, rightDests, game.state.board, game.state.turn);
            handlePlayMove(point, safest, 1);
            return;
        }

        // Repli : si le dé droit n'est pas jouable, joue le dé gauche.
        if (leftDests.length > 0) {
            const safest = getSafestDestination(point, leftDests, game.state.board, game.state.turn);
            handlePlayMove(point, safest, 0);
            return;
        }
    }, [game.rightDieTargets, game.leftDieTargets, game.state.board, game.state.turn, handlePlayMove]);

    // Enregistrement du début de tour pour X
    useEffect(() => {
        if (game.dice && game.state.turn === 'X') {
            turnBoardBeforeRef.current = [...game.state.board];
            currentTurnDiceRef.current = game.dice;
            currentTurnMovesRef.current = [];
        }
    }, [game.dice, game.state.turn]);

    // Auto-play du coup forcé unique : si le joueur n'a qu'un seul coup légal
    // sur tout le plateau, il est joué automatiquement après 600ms.
    useEffect(() => {
        if (game.phase !== 'PLAYING_MOVES' || game.state.turn !== 'X') return;
        if (!game.dice) return;

        // Compte le nombre total de coups légaux (source -> destinations).
        let totalMoves = 0;
        let singleFrom: number | null = null;
        let singleTo: number | null = null;
        let singleDie: 0 | 1 | null = null;

        for (const [from, dests] of game.leftDieTargets) {
            for (const to of dests) {
                totalMoves++;
                singleFrom = from;
                singleTo = to;
                singleDie = 0;
            }
        }
        for (const [from, dests] of game.rightDieTargets) {
            for (const to of dests) {
                totalMoves++;
                singleFrom = from;
                singleTo = to;
                singleDie = 1;
            }
        }

        if (totalMoves === 1 && singleFrom !== null && singleTo !== null && singleDie !== null) {
            const timer = window.setTimeout(() => {
                handlePlayMove(singleFrom!, singleTo!, singleDie!);
            }, 600);
            return () => window.clearTimeout(timer);
        }
    }, [game.phase, game.state.turn, game.dice, game.leftDieTargets, game.rightDieTargets, handlePlayMove]);

    // Enregistrement du tour de X dans l'historique (pour l'analyse post-partie).
    // L'analyse coach temps réel est gérée par le hook `useCoach`.
    useEffect(() => {
        if (game.state.turn === 'O' && currentTurnMovesRef.current.length > 0 && currentTurnDiceRef.current) {
            turnsHistoryRef.current.push({
                turnNumber: turnsHistoryRef.current.length + 1,
                player: 'X',
                dice: currentTurnDiceRef.current,
                boardBefore: turnBoardBeforeRef.current.length > 0 ? turnBoardBeforeRef.current : game.state.board,
                boardAfter: [...game.state.board],
                moves: [...currentTurnMovesRef.current],
            });
            currentTurnMovesRef.current = [];
        }
    }, [game.state.turn, game.state]);

    const handleDestinationClick = useCallback((destination: number) => {
        impactLight();
        const isHit =
            game.state.turn === 'X'
                ? destination >= 1 && destination <= 24 && game.state.board[destination] === -1
                : destination >= 1 && destination <= 24 && game.state.board[destination] === 1;
        if (isHit) {
            soundEngine.playCheckerHit();
        } else {
            soundEngine.playCheckerSlide();
        }
        const selected = game.selected;
        if (selected) {
            const move = { from: selected.point, to: destination };
            currentTurnMovesRef.current.push(move);
            if (isMultiplayerActive) {
                setTimeout(() => {
                    multiplayer.broadcastMovePlayed(move, game.state.board, game.usedDice);
                    if (game.state.turn !== multiplayer.matchInfo?.localRole) {
                        multiplayer.broadcastTurnFinished(game.state.turn);
                    }
                }, 50);
            }
        }
        game.moveChecker(destination);
    }, [game.state.turn, game.state.board, game.selected, game.usedDice, game.moveChecker, isMultiplayerActive, multiplayer]);

    const handleDeselect = useCallback(() => {
        if (game.selected) {
            game.deselect();
        }
    }, [game.selected, game.deselect]);

    // Les fonctions coach (dismissCoach, handleReplayMove, handleTriggerCoach) sont
    // désormais fournies par le hook `useCoach`.

    function simulateNetworkError() {
        toast.networkError(
            'Échec de communication avec le cluster de calcul GNU Backgammon (HTTP 503).',
            () => toast.info('Nouvelle tentative de connexion au moteur...', 'Reconnexion en cours...'),
        );
    }

    // Détection automatique du coup d'ouverture selon l'Opening Book certifié
    const openingEntry = useMemo<OpeningEntry | null>(() => {
        if (isOpeningDismissed) return null;
        if (!game.dice || game.state.turn !== 'X' || game.phase !== 'PLAYING_MOVES') return null;
        if (game.usedDice[0] || game.usedDice[1]) return null;
        if (isOpeningSituation(game.state.board, game.dice, turnsHistoryRef.current.length)) {
            return getOpening(game.dice[0], game.dice[1]);
        }
        return null;
    }, [game.dice, game.state.turn, game.phase, game.usedDice, game.state.board, isOpeningDismissed]);

    // Réinitialise l'état masqué de l'ouverture quand un nouveau tour commence
    useEffect(() => {
        if (game.phase === 'WAITING_FOR_ROLL' && !game.dice) {
            setIsOpeningDismissed(false);
        }
    }, [game.phase, game.dice]);

    // Application automatique en un clic du coup Book certifié
    const handleApplyOpeningMove = useCallback(
        (moves: Move[]) => {
            if (!game.dice) return;
            impactHeavy();
            let currentBoard = [...game.state.board];
            for (const m of moves) {
                currentBoard = applyMove(currentBoard, m, 'X');
                currentTurnMovesRef.current.push(m);
            }

            if (isMultiplayerActive) {
                for (const m of moves) {
                    multiplayer.broadcastMovePlayed(m, currentBoard, [true, true]);
                }
                multiplayer.broadcastTurnFinished('O');
            }

            const isVsAi = !isMultiplayerActive && game.state.turn === 'X';

            game.applyRemoteState({
                board: currentBoard,
                usedDice: [true, true],
                turn: 'O',
                phase: isVsAi ? 'OPPONENT_THINKING' : 'WAITING_FOR_ROLL',
            });

            toast.success(
                `Coup Book « ${openingEntry?.bestMoveNotation ?? 'Optimal'} » appliqué sur le plateau !`,
                'Opening Book',
            );
        },
        [game, openingEntry, isMultiplayerActive, multiplayer],
    );

    // Surbrillance du coup book ou de l'analyse du coach (réservé au coach quand le panneau est ouvert)
    const activeCoachHighlight = useMemo(() => {
        if (openingEntry && isOpeningHighlightActive) {
            return { optimal: openingEntry.bestMoves, played: [] };
        }
        if (coach) {
            return coachHighlight;
        }
        return null;
    }, [openingEntry, isOpeningHighlightActive, coach, coachHighlight]);

    // Annonces sonores et textuelles pour lecteurs d'écran (WCAG 2.1 AA)
    useGameAnnouncements({
        state: game.state,
        phase: game.phase,
        selectedPoint: game.selected?.point ?? null,
        activeDie,
        leftTargetsCount: game.leftDieTargets.size,
        rightTargetsCount: game.rightDieTargets.size,
        canDouble: game.canDouble,
        doublingOfferedBy: game.doublingOfferedBy,
        opponentStatusMessage: game.opponentStatusMessage,
    });

    const isCrawfordNext = game.isCrawfordNext;

    const mainAmbianceClass =
        theme === 'snowie_classic'
            ? 'bg-[#120703] bg-[radial-gradient(ellipse_95%_70%_at_50%_15%,#3a1d10_0%,#1a0c06_45%,#080302_100%)] text-amber-50 selection:bg-amber-600 selection:text-white'
            : theme === 'tournament'
                ? 'bg-[#0a180f] bg-[radial-gradient(ellipse_95%_70%_at_50%_15%,#183a24_0%,#0c1f14_50%,#040a06_100%)] text-slate-100 selection:bg-emerald-600'
                : 'bg-slate-950 text-slate-100 selection:bg-amber-500';

    return (
        <main className={`h-dvh max-h-dvh w-full grid grid-rows-[minmax(0,auto)_minmax(0,1fr)] overflow-hidden p-1 sm:p-2 select-none transition-colors duration-500 ${mainAmbianceClass}`}>
            {/* Liens d'évitement (Skip links) pour lecteurs d'écran & navigation clavier */}
            <nav aria-label={t('board.skipToBoard')} className="fixed top-0 left-0 z-50 pointer-events-none">
                <a
                    href="#backgammon-board"
                    className="sr-only focus:not-sr-only focus:pointer-events-auto focus:inline-block focus:m-4 rounded-lg bg-sky-600 px-4 py-2 font-bold text-white shadow-xl outline-none ring-2 ring-white hover:bg-sky-500"
                >
                    {t('board.skipToBoard')}
                </a>
                <a
                    href="#match-hud"
                    className="sr-only focus:not-sr-auto focus:pointer-events-auto focus:inline-block focus:m-4 rounded-lg bg-sky-600 px-4 py-2 font-bold text-white shadow-xl outline-none ring-2 ring-white hover:bg-sky-500"
                >
                    {t('board.skipToHud')}
                </a>
                <a
                    href="#coach-panel"
                    className="sr-only focus:not-sr-only focus:pointer-events-auto focus:inline-block focus:m-4 rounded-lg bg-sky-600 px-4 py-2 font-bold text-white shadow-xl outline-none ring-2 ring-white hover:bg-sky-500"
                >
                    {t('board.skipToCoach')}
                </a>
            </nav>

            {/* 1. HUD FIXE EN HAUT */}
            <header className="w-full max-w-7xl mx-auto shrink-0 z-30 flex flex-col gap-1.5 px-1 pt-0.5 pb-1">
                {/* Bandeau Dopamine : Streak & Coup de Maître */}
                {(optimalStreak > 0 || brilliantMove) && (
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                        {optimalStreak > 0 && (
                            <span
                                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold transition-all ${optimalStreak >= 15
                                    ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-lg shadow-amber-500/40 animate-pulse'
                                    : optimalStreak >= 10
                                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/30'
                                        : optimalStreak >= 5
                                            ? 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40'
                                            : 'bg-slate-800/60 text-slate-300 ring-1 ring-slate-700/50'
                                    }`}
                                data-testid="optimal-streak-badge"
                            >
                                🔥 {optimalStreak} coup{optimalStreak > 1 ? 's' : ''} parfait{optimalStreak > 1 ? 's' : ''} d'affilée
                            </span>
                        )}
                        {brilliantMove && (
                            <span
                                className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-cyan-400 to-amber-400 px-3 py-1 text-xs font-black text-slate-950 shadow-lg shadow-cyan-500/40 animate-pulse"
                                data-testid="brilliant-move-badge"
                            >
                                ✨ COUP DE MAÎTRE !
                            </span>
                        )}
                    </div>
                )}
                <div id="match-hud" className="w-full">
                    <MatchHud
                        matchLength={game.state.matchLength}
                        scoreX={game.state.scoreX}
                        scoreO={game.state.scoreO}
                        turn={game.state.turn}
                        crawford={game.state.crawford}
                        dice={game.dice}
                        usedDice={game.usedDice}
                        cubeValue={game.state.cubeValue}
                        cubeOwner={game.state.cubeOwner}
                        theme={theme}
                        onThemeToggle={toggleTheme}
                        onDoubleCube={() => {
                            if (!game.canDouble) {
                                if (game.state.crawford) {
                                    toast.warning('Le videau est interdit pendant la manche de Crawford.');
                                } else {
                                    toast.warning('Vous ne possédez pas le videau ou ce n’est pas le moment de doubler.');
                                }
                                return;
                            }
                            impactHeavy();
                            soundEngine.playCubeOffer();
                            game.offerDouble();
                            if (isMultiplayerActive) {
                                multiplayer.broadcastDoubleOffered(game.state.cubeValue * 2);
                            }
                        }}
                        onRollDice={() => {
                            impactMedium();
                            soundEngine.playDiceRoll();
                            if (isMultiplayerActive) {
                                const d1 = Math.floor(Math.random() * 6) + 1;
                                const d2 = Math.floor(Math.random() * 6) + 1;
                                const d: [number, number] = [d1, d2];
                                game.rollDice(d);
                                multiplayer.broadcastDiceRolled(d);
                            } else {
                                game.rollDice();
                            }
                        }}
                        onResetGame={game.resetMatch}
                        isLoadingBoard={isBoardLoading}
                        onOpenMultiplayer={() => setIsMatchmakingModalOpen(true)}
                        isMultiplayerActive={isMultiplayerActive}
                        onOpenOpeningBook={() => {
                            setSelectedOpeningIdForModal(openingEntry?.id);
                            setIsOpeningBookModalOpen(true);
                        }}
                        onOpenExportImport={() => setIsExportImportModalOpen(true)}
                        onOpenKnowledgeBase={() => {
                            setSelectedKnowledgeConceptId(undefined);
                            setIsKnowledgeModalOpen(true);
                        }}
                        onTriggerCoach={handleTriggerCoach}
                        onUndo={game.undoMove}
                        canUndo={game.canUndo}
                    />
                </div>

                {/* Bannière de reprise de session suite à coupure */}
                {!isMultiplayerActive && multiplayer.recoverableSession && (
                    <div
                        className="w-full rounded-xl border border-amber-500/60 bg-gradient-to-r from-amber-500/15 via-slate-900 to-amber-950/20 px-3 py-2 shadow-lg backdrop-blur-md flex items-center justify-between gap-3 animate-fade-in"
                        data-testid="session-recovery-banner"
                    >
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-lg text-amber-400">
                                🔄
                            </span>
                            <div>
                                <div className="text-xs font-extrabold text-white">
                                    Partie interrompue détectée ({multiplayer.recoverableSession.code})
                                </div>
                                <div className="text-[11px] text-slate-300">
                                    {multiplayer.recoverableSession.matchLength} pts vs{' '}
                                    <span className="font-bold text-amber-400">
                                        {multiplayer.recoverableSession.opponentProfile.displayName}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => multiplayer.reconnectActiveSession()}
                                className="rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 px-3 py-1.5 text-xs font-bold text-slate-950 shadow hover:scale-[1.02] transition-transform"
                            >
                                ⚡ Reprendre
                            </button>
                            <button
                                type="button"
                                onClick={() => multiplayer.dismissRecoverableSession()}
                                className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs text-slate-400 hover:text-white"
                            >
                                Ignorer
                            </button>
                        </div>
                    </div>
                )}

                {/* Bannière Multijoueur en ligne (si match en direct) */}
                {isMultiplayerActive && multiplayer.matchInfo && multiplayer.opponentProfile && (
                    <div className="w-full">
                        <MultiplayerBanner
                            status={multiplayer.status}
                            matchInfo={multiplayer.matchInfo}
                            opponentProfile={multiplayer.opponentProfile}
                            localProfile={multiplayer.localProfile}
                            turn={game.state.turn}
                            turnTimeRemaining={multiplayer.turnTimeRemaining}
                            disconnectCountdown={multiplayer.disconnectCountdown}
                            quickChatMessage={multiplayer.quickChatMessage}
                            clockState={multiplayer.clockState}
                            isReconnecting={multiplayer.isReconnecting}
                            onSendQuickChat={multiplayer.sendQuickChat}
                            onResign={() => multiplayer.broadcastResign('surrender')}
                        />
                    </div>
                )}

                {/* Contrôles du videau interactif (Prendre / Passer lors d'une proposition) */}
                <div className="w-full">
                    <DoublingControls
                        standalone={false}
                        phase={game.phase}
                        cubeValue={game.state.cubeValue}
                        cubeOwner={game.state.cubeOwner}
                        canDouble={game.canDouble}
                        crawford={game.state.crawford}
                        doublingOfferedBy={game.doublingOfferedBy}
                        currentTurn={game.state.turn}
                        onOfferDouble={() => {
                            soundEngine.playCubeOffer();
                            game.offerDouble();
                            if (isMultiplayerActive) {
                                multiplayer.broadcastDoubleOffered(game.state.cubeValue * 2);
                            }
                        }}
                        onTakeDouble={() => {
                            soundEngine.playCubeOffer();
                            game.takeDouble();
                            if (isMultiplayerActive) {
                                multiplayer.broadcastDoubleAccepted(game.state.cubeValue);
                            }
                        }}
                        onPassDouble={() => {
                            soundEngine.playCubeOffer();
                            game.passDouble();
                            if (isMultiplayerActive && multiplayer.matchInfo) {
                                const winner = multiplayer.matchInfo.localRole === 'X' ? 'O' : 'X';
                                multiplayer.broadcastDoublePassed(winner);
                            }
                        }}
                    />
                </div>

                {/* Barre d'action contextuelle de tour & Difficulté IA */}
                <div className="flex w-full flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                    <div className="flex-1 w-full sm:w-auto">
                        {game.phase === 'WAITING_FOR_ROLL' &&
                            (!isMultiplayerActive ? game.isHumanTurn : multiplayer.isMyTurn) &&
                            !game.dice && (
                                <div className="flex items-center justify-between rounded-xl border border-blue-500/40 bg-blue-950/60 px-3.5 py-1.5 shadow-md backdrop-blur-sm animate-in fade-in">
                                    <div className="flex items-center gap-2">
                                        <span className="flex h-2.5 w-2.5 rounded-full bg-blue-400 animate-ping" />
                                        <span className="text-xs font-semibold text-blue-200">
                                            À vous de jouer — Lancez les dés pour jouer votre tour
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        data-testid="roll-dice-btn"
                                        onClick={() => {
                                            impactMedium();
                                            soundEngine.playDiceRoll();
                                            if (isMultiplayerActive) {
                                                const d1 = Math.floor(Math.random() * 6) + 1;
                                                const d2 = Math.floor(Math.random() * 6) + 1;
                                                const d: [number, number] = [d1, d2];
                                                game.rollDice(d);
                                                multiplayer.broadcastDiceRolled(d);
                                            } else {
                                                game.rollDice();
                                            }
                                        }}
                                        className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow hover:from-blue-500 hover:to-indigo-500 transition active:scale-95"
                                    >
                                        <span>🎲</span>
                                        <span>Lancer les dés</span>
                                    </button>
                                </div>
                            )}

                        {!isMultiplayerActive && game.phase === 'OPPONENT_THINKING' && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 rounded-xl border border-amber-600/70 bg-stone-900/90 px-3 py-1.5 shadow-md backdrop-blur-sm ring-1 ring-amber-500/30">
                                <div className="flex items-center gap-2.5">
                                    <span className="flex h-2.5 w-2.5 rounded-full bg-amber-400 animate-ping" />
                                    <span className="text-xs font-bold text-amber-200">
                                        {game.opponentStatusMessage || "Tour de l’ordinateur (Noir) · Analyse en cours..."}
                                    </span>
                                </div>
                                {game.lastOpponentDice && (
                                    <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-black/60 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold">
                                        <span>🎲🎲</span>
                                        <span>Dés IA : {game.lastOpponentDice[0]} - {game.lastOpponentDice[1]}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {!isMultiplayerActive && game.lastOpponentMoves && game.lastOpponentMoves.length > 0 && game.phase !== 'OPPONENT_THINKING' && (
                            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-stone-900/80 border border-amber-800/40 text-xs text-stone-300">
                                <span className="text-amber-400 font-semibold flex items-center gap-1">
                                    <span>📜</span>
                                    <span>Dernier coup Noir :</span>
                                </span>
                                <span className="font-mono text-amber-200 font-bold">
                                    {game.lastOpponentDice ? `[${game.lastOpponentDice[0]}-${game.lastOpponentDice[1]}] ` : ''}
                                    {formatMoveSequenceNotationAbsolute(game.lastOpponentMoves, 'O')}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-end shrink-0">
                        {!isMultiplayerActive ? (
                            <DifficultySelector
                                difficulty={game.difficulty}
                                onChange={(diff) => {
                                    game.setDifficulty(diff);
                                    const names = {
                                        beginner: 'Débutant (0-ply bruité)',
                                        intermediate: 'Intermédiaire (1-ply)',
                                        expert: 'Expert (2-ply expectimax)',
                                    };
                                    toast.info(`Niveau de l’adversaire : ${names[diff]}`, 'Difficulté IA');
                                }}
                            />
                        ) : (
                            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">
                                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span>Match Multijoueur Classé</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bannière Opening Book (recommandation d'ouverture certifiée) */}
                {openingEntry && (
                    <OpeningAssistantBanner
                        opening={openingEntry}
                        onApplyMove={handleApplyOpeningMove}
                        onExploreBook={(id) => {
                            setSelectedOpeningIdForModal(id ?? openingEntry.id);
                            setIsOpeningBookModalOpen(true);
                        }}
                        onDismiss={() => setIsOpeningDismissed(true)}
                        isHighlighted={isOpeningHighlightActive}
                        onToggleHighlight={() => setIsOpeningHighlightActive((prev) => !prev)}
                    />
                )}
            </header>

            {/* 2. ZONE CENTRALE FLEXIBLE (PLATEAU À HAUTEUR CONTRAINTE + COACH LATÉRAL OU TIROIR) */}
            <div className="w-full h-full min-h-0 flex-1 overflow-hidden relative flex flex-col lg:flex-row items-center justify-center gap-2 sm:gap-3 max-w-[1920px] mx-auto px-1 sm:px-2 pb-1">
                {/* Zone Plateau : contrainte stricte par la hauteur disponible */}
                <div className="flex-1 h-full min-h-0 min-w-0 flex items-center justify-center overflow-hidden w-full">
                    <div
                        className="relative h-full max-h-full w-full max-w-full flex items-center justify-center"
                    >
                        <ErrorBoundary name="Plateau de jeu">
                            <Board
                                state={game.state}
                                leftDieTargets={game.leftDieTargets}
                                rightDieTargets={game.rightDieTargets}
                                selectedPoint={game.selected?.point ?? null}
                                selectedDie={game.selected ? game.selected.die : activeDie}
                                usedDice={game.usedDice}
                                onCheckerClick={handleCheckerClick}
                                onCheckerDoubleClick={handleCheckerDoubleClick}
                                onCheckerRightClick={handleCheckerRightClick}
                                onDestinationClick={handleDestinationClick}
                                onPlayMove={handlePlayMove}
                                onSelectDie={handleSelectDie}
                                onDieDoubleClick={handleDieDoubleClick}
                                onDeselect={handleDeselect}
                                onUndo={game.undoMove}
                                coachHighlight={activeCoachHighlight}
                                opponentHighlight={game.opponentHighlight}
                                theme={theme}
                                isLoading={isBoardLoading}
                            />
                        </ErrorBoundary>
                    </div>
                </div>

                {/* Panneau latéral du Coach (≥ lg) */}
                <aside
                    id="coach-panel"
                    className="hidden lg:flex flex-col w-[350px] xl:w-[400px] h-full max-h-full shrink-0 overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/85 backdrop-blur-xl shadow-2xl transition-all"
                >
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800/80 bg-slate-900/60 shrink-0">
                        <div className="flex items-center gap-2">
                            <span className="flex h-2.5 w-2.5 rounded-full bg-indigo-400 animate-pulse" />
                            <h2 className="text-sm font-bold text-white tracking-wide">Coach IA & Analyse</h2>
                        </div>
                        {coach && (
                            <button
                                onClick={dismissCoach}
                                className="rounded-lg px-2 py-0.5 text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition"
                                title="Fermer l'analyse"
                            >
                                Fermer ✕
                            </button>
                        )}
                    </div>

                    <div className="p-2 overflow-y-auto flex-1 space-y-2">
                        <ErrorBoundary name="Analyse du Coach">
                            <CoachPanel
                                verdict={coach?.verdict ?? null}
                                equityLoss={coach?.equityLoss ?? null}
                                playedMove={coach?.playedMove ?? null}
                                optimalMove={coach?.optimalMove ?? null}
                                explanation={coach?.explanation ?? null}
                                features={coach?.features}
                                matchStats={matchStats}
                                topMoves={coach?.candidateMoves}
                                boardBefore={coach?.boardBefore}
                                onReplayMove={handleReplayMove}
                                onDismiss={dismissCoach}
                                onOpenKnowledgeConcept={handleOpenKnowledgeConcept}
                                isLoading={isAnalyzing}
                                matchContext={{
                                    scoreX: game.state.scoreX,
                                    scoreO: game.state.scoreO,
                                    matchLength: game.state.matchLength,
                                    cubeValue: game.state.cubeValue,
                                    cubeOwner: game.state.cubeOwner,
                                    crawford: game.state.crawford,
                                }}
                                positionKey={game.state.board.join(',')}
                                gameId={gameIdRef.current}
                                dice={game.dice}
                                board={game.state.board}
                            />
                        </ErrorBoundary>

                        {!coach && !isAnalyzing && (
                            <div className="flex flex-col gap-3 py-1 text-xs text-slate-300">
                                <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3.5 space-y-2">
                                    <div className="flex items-center justify-between text-slate-400">
                                        <span className="font-semibold text-indigo-300">Veille Stratégique Active</span>
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950 border border-indigo-700/60 text-indigo-300 font-mono">
                                            Expectimax 2-ply
                                        </span>
                                    </div>
                                    <p className="text-slate-400 leading-relaxed text-[11px]">
                                        Le Coach analyse chacun de vos coups en continu. En cas d’imprécision ou d’erreur tactique, l’évaluation et l’explication détaillée apparaîtront ici.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={handleTriggerCoach}
                                        className="w-full mt-1.5 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-3 py-2 text-xs font-bold text-white shadow-md hover:from-indigo-500 hover:to-blue-500 transition active:scale-95"
                                    >
                                        <span>🎓</span>
                                        <span>Demander conseil au Coach</span>
                                    </button>
                                </div>

                                {theme === 'snowie_classic' && (
                                    <div
                                        data-testid="snowie-vintage-banner"
                                        className="rounded-xl border border-amber-600/60 bg-gradient-to-b from-[#241208] via-[#3a1a0c] to-[#241208] p-3 shadow-lg ring-1 ring-amber-500/20 text-amber-100 space-y-1"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-amber-400 font-serif text-sm">✦</span>
                                            <span className="font-serif font-black uppercase tracking-wider text-[11px] text-amber-200">
                                                MOTEUR D'ANALYSE PRO • ÉDITION PRESTIGE
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-amber-300/80 leading-snug">
                                            Ambiance Casino Privé • Feutrine Émeraude & Acajou Massif
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </aside>
            </div>

            {/* Version Tiroir Bas du Coach (< lg) */}
            <div
                id="coach-drawer-mobile"
                className={`lg:hidden fixed inset-x-0 bottom-0 z-50 transition-transform duration-300 ease-out transform ${isMobileDrawerOpen && (coach || isAnalyzing) ? 'translate-y-0' : 'translate-y-full pointer-events-none'
                    }`}
            >
                <div className="relative max-h-[72vh] flex flex-col rounded-t-2xl border-t-2 border-indigo-500/60 bg-slate-950/95 backdrop-blur-2xl shadow-2xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800/80 bg-slate-900/80 shrink-0">
                        <div className="flex items-center gap-2">
                            <span className="h-1 w-8 rounded-full bg-slate-600" />
                            <span className="text-xs font-bold text-indigo-300">🎓 Coach IA & Analyse</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsMobileDrawerOpen(false)}
                            className="rounded-lg p-1 text-slate-400 hover:text-white"
                            aria-label="Fermer le tiroir du coach"
                        >
                            ✕
                        </button>
                    </div>
                    <div className="p-3 overflow-y-auto flex-1">
                        <ErrorBoundary name="Analyse du Coach Mobile">
                            <CoachPanel
                                verdict={coach?.verdict ?? null}
                                equityLoss={coach?.equityLoss ?? null}
                                playedMove={coach?.playedMove ?? null}
                                optimalMove={coach?.optimalMove ?? null}
                                explanation={coach?.explanation ?? null}
                                features={coach?.features}
                                matchStats={matchStats}
                                topMoves={coach?.candidateMoves}
                                boardBefore={coach?.boardBefore}
                                onReplayMove={handleReplayMove}
                                onDismiss={() => {
                                    dismissCoach();
                                    setIsMobileDrawerOpen(false);
                                }}
                                onOpenKnowledgeConcept={handleOpenKnowledgeConcept}
                                isLoading={isAnalyzing}
                                matchContext={{
                                    scoreX: game.state.scoreX,
                                    scoreO: game.state.scoreO,
                                    matchLength: game.state.matchLength,
                                    cubeValue: game.state.cubeValue,
                                    cubeOwner: game.state.cubeOwner,
                                    crawford: game.state.crawford,
                                }}
                                positionKey={game.state.board.join(',')}
                                gameId={gameIdRef.current}
                                dice={game.dice}
                                board={game.state.board}
                            />
                        </ErrorBoundary>
                    </div>
                </div>
            </div>

            {/* Bouton flottant mobile pour rouvrir l'analyse si minimisée */}
            {coach && !isMobileDrawerOpen && (
                <button
                    type="button"
                    onClick={() => setIsMobileDrawerOpen(true)}
                    className="lg:hidden fixed bottom-3 right-3 z-40 flex items-center gap-2 rounded-full border border-indigo-500 bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-2xl animate-bounce"
                >
                    <span>🎓</span>
                    <span>Analyse ({coach.verdict === 'blunder' ? 'Blunder' : 'Douteux'})</span>
                </button>
            )}

            {/* 7. Overlay de fin de partie avec score et actions (Mode Solo) */}
            {!isMultiplayerActive && game.phase === 'GAME_OVER' && game.gameResult && (
                <GameOverOverlay
                    result={game.gameResult}
                    scoreX={game.state.scoreX}
                    scoreO={game.state.scoreO}
                    matchLength={game.state.matchLength}
                    isMatchOver={game.isMatchOver}
                    matchWinner={game.matchWinner}
                    isCrawfordNext={isCrawfordNext}
                    analysis={latestGameAnalysis}
                    onOpenReview={() => setIsGameReviewModalOpen(true)}
                    onNextGame={() => {
                        turnsHistoryRef.current = [];
                        setLatestGameAnalysis(null);
                        game.startNewGame();
                    }}
                    onResetMatch={() => {
                        turnsHistoryRef.current = [];
                        setLatestGameAnalysis(null);
                        game.resetMatch();
                    }}
                    theme={theme}
                />
            )}

            {/* Modal de Bilan Complet & Inspection Coup par Coup */}
            <GameReviewModal
                analysis={latestGameAnalysis}
                isOpen={isGameReviewModalOpen}
                onClose={() => setIsGameReviewModalOpen(false)}
                theme={theme}
            />

            {/* 8. Modals Multijoueur */}
            <MultiplayerLobbyModal
                isOpen={isMatchmakingModalOpen || multiplayer.status === 'searching' || multiplayer.status === 'matched' || multiplayer.status === 'connecting'}
                status={multiplayer.status}
                localProfile={multiplayer.localProfile}
                opponentProfile={multiplayer.opponentProfile}
                matchInfo={multiplayer.matchInfo}
                privateRoomCode={multiplayer.privateRoomCode}
                onStartSearch={(length) => multiplayer.startMatchmaking(length)}
                onCreatePrivateRoom={(length) => multiplayer.createPrivateRoom(length)}
                onJoinPrivateRoom={(code) => multiplayer.joinPrivateRoom(code)}
                onCancelSearch={() => {
                    multiplayer.cancelMatchmaking();
                    setIsMatchmakingModalOpen(false);
                }}
                onClose={() => setIsMatchmakingModalOpen(false)}
                theme={theme}
            />

            {multiplayer.status === 'game_over' &&
                multiplayer.matchInfo &&
                multiplayer.opponentProfile &&
                multiplayer.eloResult && (
                    <MultiplayerResultModal
                        isOpen={true}
                        matchInfo={multiplayer.matchInfo}
                        localProfile={multiplayer.localProfile}
                        opponentProfile={multiplayer.opponentProfile}
                        eloResult={multiplayer.eloResult}
                        onRematch={() => {
                            multiplayer.startMatchmaking(multiplayer.matchInfo?.matchLength || 7);
                        }}
                        onClose={() => {
                            multiplayer.leaveMatch();
                            game.resetMatch();
                        }}
                        theme={theme}
                    />
                )}

            {/* 9. Modal Bibliothèque d'Ouvertures (Opening Book) */}
            <OpeningBookModal
                isOpen={isOpeningBookModalOpen}
                onClose={() => setIsOpeningBookModalOpen(false)}
                initialOpeningId={selectedOpeningIdForModal}
                onApplyMove={openingEntry ? handleApplyOpeningMove : undefined}
                isOpeningTurnActive={Boolean(openingEntry)}
                theme={theme}
            />

            {/* 10. Modal Export / Import & Lien de Partage (XGID & SGF) */}
            <ExportImportModal
                isOpen={isExportImportModalOpen}
                onClose={() => setIsExportImportModalOpen(false)}
                currentState={game.state}
                turnsHistory={turnsHistoryRef.current}
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

            {/* 11. Modal Base de Connaissances & Encyclopédie Théorique */}
            <KnowledgeBaseModal
                isOpen={isKnowledgeModalOpen}
                onClose={() => setIsKnowledgeModalOpen(false)}
                initialConceptId={selectedKnowledgeConceptId}
                theme={theme}
            />
        </main>
    );
}