'use client';

/**
 * Hook de logique Coach IA — encapsule l'analyse temps réel des coups du joueur.
 *
 * Responsabilités :
 *   - Détection automatique des blunders (perte d'équité >= seuil).
 *   - Cumul des statistiques de session (PR en direct, streak, coup de maître).
 *   - Déclenchement manuel de l'analyse (`triggerCoach`).
 *   - Génération d'explication règle-basée en repli (si le moteur est indisponible).
 *
 * Ce hook délègue le calcul pur à `features/coach/` et `lib/engine/`, et ne fait
 * que l'orchestration (appels + mise à jour d'état).
 */

import { useCallback, useEffect, useState, useRef } from 'react';
import {
    BoardState,
    Move,
    applyMove,
    pipCount,
} from '../engine/backgammonEngine';
import {
    extractStrategicFeatures,
    analyzeBoardStructure,
    analyzeBlots,
    generateRuleBasedExplanation,
    buildMatchContext,
    type StrategicFeatures,
} from '../features/coach';
import { analyzeBoardMoves } from '../lib/engine/evaluator';
import { evaluatePosition } from '../lib/analysisService';
import {
    formatCoachMoveSequence,
    formatCoachMoveSequenceFromBoard,
    movesFromBoardDiff,
} from '../features/coach/coachMoveNotation';
import { soundEngine } from '../lib/sound/soundEngine';
import type { CoachHighlight } from '../components/board/boardThemes';
import { analyzeHumanMoveFromLogWithBgsage, classifyVerdict, type CoachVerdict } from '../features/coach/logAnalyzer';
import type { MatchLogEntry } from '../actions/types';
import { explainTacticalDifference } from '../features/coach/tacticalExplainer';
import { shouldNotify, type CoachNotificationLevel } from '../features/coach/coachNotificationSettings';

export interface CoachState {
    verdict: 'doubtful' | 'blunder';
    equityLoss: number;
    playedMove: string;
    optimalMove: string;
    explanation: string | null;
    whyFailed?: string;
    whyOptimal?: string;
    summary?: string;
    /** Diagnostic stratégique automatique en français (tacticalExplainer). */
    tacticalSummary?: string;
    features?: StrategicFeatures;
    positionKey?: string;
    candidateMoves?: { rank: number; notation: string; equity: number; equityLoss: number }[];
    boardBefore?: number[];
}

export interface EvaluatedMove {
    turnNumber: number;
    player: 'X' | 'O';
    verdict: CoachVerdict;
    equityLoss: number;
    playedMove: string;
    optimalMove: string;
}

export interface MatchStats {
    decisionsCount: number;
    totalEquityLoss: number;
    blundersCount: number;
    totalErrorRate?: number;
    evaluatedMoves?: EvaluatedMove[];
    /** Compteurs détaillés par palier de décision (Optimal / Bon / Imprécision / Blunder). */
    decisionCounters?: {
        optimal: number;
        good: number;
        inaccuracy: number;
        blunder: number;
    };
}

/** Feedback instantané d'un coup joué (pour le badge de qualité). */
export interface LastMoveFeedback {
    verdict: CoachVerdict;
    equityLoss: number;
    playedMove: string;
    /** Horodatage (epoch ms) pour l'auto-effacement du badge. */
    timestamp: number;
}

/** Dépendances injectées par le composant parent (`page.tsx`). */
export interface UseCoachDeps {
    /** État du jeu (hook `useBackgammonGame`). */
    game: {
        state: BoardState;
        dice: [number, number] | null;
        undoMove: () => void;
        difficulty?: any;
        lastOpponentDice?: [number, number] | null;
        lastOpponentMoves?: { from: number; to: number }[] | null;
        moveHistory?: any[];
        matchLog?: ReadonlyArray<MatchLogEntry>;
    };
    /** Refs du tour courant (pour l'analyse automatique). */
    currentTurnMovesRef: React.MutableRefObject<{ from: number; to: number }[]>;
    currentTurnDiceRef: React.MutableRefObject<[number, number] | null>;
    turnBoardBeforeRef: React.MutableRefObject<number[]>;
    /** Callback pour ouvrir le tiroir mobile quand le coach se déclenche. */
    onCoachTriggered?: () => void;
}

export interface UseCoachResult {
    coach: CoachState | null;
    coachHighlight: CoachHighlight | null;
    matchStats: MatchStats;
    matchStatsX: MatchStats;
    matchStatsO: MatchStats;
    optimalStreak: number;
    brilliantMove: boolean;
    isAnalyzing: boolean;
    /** Feedback instantané du dernier coup joué (verdict + perte + horodatage). */
    lastMoveFeedback: LastMoveFeedback | null;
    /** Niveau de notification du Coach (silent / blunder / error). */
    notificationLevel: CoachNotificationLevel;
    /** Modifie le niveau de notification. */
    setNotificationLevel: (level: CoachNotificationLevel) => void;
    dismissCoach: () => void;
    replayMove: () => void;
    triggerCoach: () => Promise<void>;
}

export function useCoach({
    game,
    currentTurnMovesRef,
    currentTurnDiceRef,
    turnBoardBeforeRef,
    onCoachTriggered,
}: UseCoachDeps): UseCoachResult {
    const [coach, setCoach] = useState<CoachState | null>(null);
    const [coachHighlight, setCoachHighlight] = useState<CoachHighlight | null>(null);
    const [matchStats, setMatchStats] = useState<MatchStats>({
        decisionsCount: 0,
        totalEquityLoss: 0,
        blundersCount: 0,
        totalErrorRate: 0,
    });
    const [matchStatsO, setMatchStatsO] = useState<MatchStats>({
        decisionsCount: 0,
        totalEquityLoss: 0,
        blundersCount: 0,
        totalErrorRate: 0,
    });
    const lastOpponentEvalRef = useRef<string | null>(null);
    const lastPlayerEvalRef = useRef<string | null>(null);
    /**
     * Garde anti-race-condition : identifiant de la dernière analyse lancée.
     * Incrémenté à chaque déclenchement ; une réponse asynchrone dont l'id ne
     * correspond plus à la valeur courante est silencieusement ignorée.
     */
    const analysisRequestIdRef = useRef(0);
    const [optimalStreak, setOptimalStreak] = useState(0);
    const [brilliantMove, setBrilliantMove] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [notificationLevel, setNotificationLevel] = useState<CoachNotificationLevel>('blunder');
    const [lastMoveFeedback, setLastMoveFeedback] = useState<LastMoveFeedback | null>(null);

    // 1. Réinitialise l'analyse du coach dès qu'une nouvelle manche/partie commence.
    //    Invalide aussi toute analyse en vol (analysisRequestIdRef) pour empêcher
    //    une réponse tardive de réafficher un panneau pourtant purgé.
    useEffect(() => {
        if (game.moveHistory && game.moveHistory.length === 0 && currentTurnMovesRef.current.length === 0) {
            analysisRequestIdRef.current += 1;
            setCoach(null);
            setCoachHighlight(null);
            lastOpponentEvalRef.current = null;
        }
    }, [game.moveHistory, currentTurnMovesRef]);

    // 2. Dès que le joueur X lance ses dés pour entamer un nouveau coup,
    // on ferme l'analyse du coup précédent pour ne pas encombrer le champ de jeu.
    //    Même invalidation : une analyse du tour précédent encore en vol ne doit
    //    pas réapparaître après cette purge (cause racine du « panneau fantôme »).
    useEffect(() => {
        if (game.state.turn === 'X' && game.dice !== null) {
            analysisRequestIdRef.current += 1;
            setCoach(null);
            setCoachHighlight(null);
        }
    }, [game.state.turn, game.dice]);

    // Analyse automatique LOG-DRIVEN (Règle d'or n°1 & n°2) :
    // - Lit exclusivement la dernière entrée immuable de `matchLog` (jamais les refs React).
    // - N'analyse QUE les coups du joueur connecté `X` (jamais l'IA `O`).
    useEffect(() => {
        const log = game.matchLog ?? [];
        if (log.length === 0) return;

        const lastEntry = log[log.length - 1];
        // Règle d'or n°2 : on n'analyse JAMAIS les coups de l'IA ou de l'adversaire.
        if (lastEntry.player !== 'X') return;

        // Évite la ré-analyse d'une même entrée (déduplication par turnIndex).
        if (lastPlayerEvalRef.current === String(lastEntry.turnIndex)) return;
        lastPlayerEvalRef.current = String(lastEntry.turnIndex);

        // GARDE ANTI-RACE-CONDITION : on capture un identifiant de requête unique.
        // Si une analyse plus récente démarre pendant l'`await`, cet id devient
        // périmé et la réponse tardive est ignorée (aucun `setCoach` fantôme).
        const requestId = ++analysisRequestIdRef.current;
        const isStale = () => analysisRequestIdRef.current !== requestId;

        // Analyse asynchrone hybride (bgsage-service puis repli local).
        void (async () => {
            try {
                const result = await analyzeHumanMoveFromLogWithBgsage({
                    logEntry: lastEntry,
                    localPlayer: 'X',
                    cubeValue: game.state.cubeValue,
                    matchLength: game.state.matchLength,
                    scoreX: game.state.scoreX,
                    scoreO: game.state.scoreO,
                    ply: 2,
                });

                // Réponse périmée : un tour plus récent a pris la main.
                if (isStale()) return;
                if (!result) return;

                const { verdict, equityLoss, isUnforced, isBlunder, candidateMoves } = result;

                // NOTATION AFFICHÉE : numérotation ABSOLUE du plateau, dérivée de
                // la séquence réelle de sous-mouvements enregistrée dans le log
                // (source de vérité). On n'utilise PAS la notation renvoyée par
                // l'analyseur si elle provient d'un moteur externe en perspective
                // joueur (bug « 13/9 » affiché alors que le pion était en 11).
                //
                // Si le log ne contient pas la séquence complète (coup partiel),
                // on reconstruit TOUS les sous-mouvements depuis le différentiel
                // boardBefore → boardAfter : la notation reflète alors la position
                // physique réelle du pion (ex. 13/11 et non 13/9).
                const loggedMoves = [...lastEntry.movePlayed];
                const playedMoves =
                    loggedMoves.length > 0
                        ? loggedMoves
                        : movesFromBoardDiff(lastEntry.boardBefore, lastEntry.boardAfter, 'X');
                const playedNotation = formatCoachMoveSequence(
                    playedMoves,
                    'X',
                    lastEntry.boardBefore,
                );
                const optimalNotation = result.optimalNotation;

                // Plafonne la perte comptabilisée à 0.500 pour éviter qu'un bug isolé
                // ne détruise la moyenne du PR.
                const cappedLoss = Math.min(Math.abs(equityLoss), 0.5);

                if (isUnforced) {
                    setMatchStats((prev) => {
                        const nextDecisions = prev.decisionsCount + 1;
                        const nextLoss = prev.totalEquityLoss + cappedLoss;
                        const newEval: EvaluatedMove = {
                            turnNumber: nextDecisions,
                            player: 'X',
                            verdict,
                            equityLoss,
                            playedMove: playedNotation,
                            optimalMove: optimalNotation,
                        };
                        // Incrément du palier correspondant au verdict (4 paliers).
                        const prevCounters = prev.decisionCounters ?? {
                            optimal: 0,
                            good: 0,
                            inaccuracy: 0,
                            blunder: 0,
                        };
                        const nextCounters = {
                            ...prevCounters,
                            [verdict]: prevCounters[verdict] + 1,
                        };
                        return {
                            decisionsCount: nextDecisions,
                            totalEquityLoss: nextLoss,
                            blundersCount: prev.blundersCount + (isBlunder ? 1 : 0),
                            totalErrorRate: nextDecisions > 0 ? (nextLoss / nextDecisions) * 500 : 0,
                            evaluatedMoves: [...(prev.evaluatedMoves ?? []), newEval],
                            decisionCounters: nextCounters,
                        };
                    });

                    if (verdict === 'optimal') {
                        setOptimalStreak((prev) => prev + 1);
                    } else if (isBlunder) {
                        setOptimalStreak(0);
                    }

                    const secondBest = candidateMoves[1];
                    const isBrilliant =
                        Math.abs(equityLoss) < 0.0001 &&
                        secondBest !== undefined &&
                        Math.abs(secondBest.equityLoss) > 0.060;
                    setBrilliantMove(isBrilliant);
                }

                // Seconde vérification : l'analyse locale (analyzeBoardMoves) est
                // synchrone mais coûteuse ; on s'assure qu'aucun tour plus récent
                // n'a été enregistré entre-temps avant de publier l'état.
                if (isStale()) return;

                // Feedback instantané du coup (badge de qualité), quel que soit le verdict.
                setLastMoveFeedback({
                    verdict,
                    equityLoss,
                    playedMove: playedNotation,
                    timestamp: Date.now(),
                });

                // Seul un coup non-optimal ET conforme au seuil de notification
                // déclenche l'affichage du panneau Coach (anti-fatigue).
                if (verdict !== 'optimal' && shouldNotify(verdict, notificationLevel)) {
                    if (isBlunder) {
                        soundEngine.playBlunderAlert();
                    }

                    const boardBefore = [...lastEntry.boardBefore];
                    const evalState: BoardState = {
                        ...game.state,
                        board: boardBefore,
                        turn: 'X' as const,
                        dice: [lastEntry.dice[0], lastEntry.dice[1]],
                    };

                    const playedEndState: BoardState = {
                        ...evalState,
                        board: [...lastEntry.boardAfter],
                    };

                    let bestEndState: BoardState = evalState;
                    // Reconstruit l'état final du meilleur coup via l'évaluateur.
                    const bestAnalysis = analyzeBoardMoves(evalState, [lastEntry.dice[0], lastEntry.dice[1]], { ply: 2 });
                    if (bestAnalysis.bestMove?.moves) {
                        let bBest = [...evalState.board];
                        for (const m of bestAnalysis.bestMove.moves) bBest = applyMove(bBest, m, 'X');
                        bestEndState = { ...evalState, board: bBest };
                    }

                    // Notation optimale en numérotation ABSOLUE, reconstruite
                    // depuis la séquence du meilleur coup (ou son plateau final).
                    const absoluteOptimalNotation =
                        bestAnalysis.bestMove?.moves && bestAnalysis.bestMove.moves.length > 0
                            ? formatCoachMoveSequence(bestAnalysis.bestMove.moves, 'X', boardBefore)
                            : bestAnalysis.bestMove?.board
                                ? formatCoachMoveSequenceFromBoard(boardBefore, bestAnalysis.bestMove.board, 'X')
                                : optimalNotation;

                    const features = extractStrategicFeatures(evalState, playedEndState, bestEndState);

                    // Diagnostic stratégique automatique en français (PARTIE 3.2).
                    const tactical = explainTacticalDifference({
                        boardBefore,
                        boardOptimal: bestEndState.board,
                        boardPlayed: playedEndState.board,
                        player: 'X',
                    });

                    setCoach({
                        verdict: verdict === 'blunder' ? 'blunder' : 'doubtful',
                        equityLoss,
                        playedMove: playedNotation,
                        optimalMove: absoluteOptimalNotation,
                        explanation: null,
                        tacticalSummary: tactical.summary,
                        features,
                        positionKey: boardBefore.join(','),
                        candidateMoves: candidateMoves.slice(0, 3).map((m, i) => ({
                            rank: i + 1,
                            // Le coup joué garde SA notation absolue exacte, même
                            // s'il n'est pas dans le top renvoyé par le moteur.
                            notation:
                                m.notation === result.playedNotation
                                    ? playedNotation
                                    : m.notation,
                            equity: m.equity,
                            equityLoss: m.equityLoss,
                        })),
                        boardBefore,
                    });
                    setCoachHighlight({
                        played: playedMoves,
                        optimal: bestAnalysis.bestMove?.moves ?? [],
                    });

                    onCoachTriggered?.();
                } else {
                    setCoach(null);
                    setCoachHighlight(null);
                }
            } catch (err) {
                console.warn('[Coach] Erreur évaluation log-driven tour X :', err);
            }
        })();
    }, [game.matchLog, game.state, onCoachTriggered, notificationLevel]);

    const dismissCoach = useCallback(() => {
        setCoach(null);
        setCoachHighlight(null);
        setIsAnalyzing(false);
    }, []);

    const replayMove = useCallback(() => {
        game.undoMove();
        setCoach(null);
        setCoachHighlight(null);
    }, [game]);

    const triggerCoach = useCallback(async () => {
        setIsAnalyzing(true);
        onCoachTriggered?.();

        const evalDice: [number, number] = game.dice ?? [3, 1];
        const stateToEval: BoardState = {
            ...game.state,
            dice: evalDice,
            turn: 'X' as const,
        };

        try {
            const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Timeout analyse coach (8s)')), 8000),
            );

            const analysisPromise = (async () => {
                const res = await evaluatePosition(stateToEval, { ply: 2, timeoutMs: 8000 });
                if (res && res.moves && res.moves.length > 0) {
                    const best = res.moves[0];
                    const alt = res.moves.length > 1 ? res.moves[1] : best;
                    return { best, alt, moves: res.moves };
                }
                const localRes = analyzeBoardMoves(stateToEval, evalDice, { ply: 2, maxMoves: 5 });
                if (localRes && localRes.bestMove) {
                    const best = localRes.bestMove;
                    const alt = localRes.moves.length > 1 ? localRes.moves[1] : best;
                    return { best, alt, moves: localRes.moves };
                }
                throw new Error('Aucun coup légal détecté');
            })();

            const analysis = await Promise.race([analysisPromise, timeoutPromise]);
            const best = analysis.best;
            const alt = analysis.alt;
            const loss = alt.equityLoss !== 0 ? alt.equityLoss : -0.08;
            const isBlunder = Math.abs(loss) >= 0.1;

            const bestMoves: Move[] =
                'moves' in best && Array.isArray((best as any).moves) ? (best as any).moves : [];
            const altMoves: Move[] =
                'moves' in alt && Array.isArray((alt as any).moves) ? (alt as any).moves : [];

            let bestEndState: BoardState = stateToEval;
            let altEndState: BoardState = stateToEval;
            if (bestMoves.length > 0) {
                let b = [...stateToEval.board];
                for (const m of bestMoves) b = applyMove(b, m, 'X');
                bestEndState = { ...stateToEval, board: b };
            }
            if (altMoves.length > 0) {
                let b = [...stateToEval.board];
                for (const m of altMoves) b = applyMove(b, m, 'X');
                altEndState = { ...stateToEval, board: b };
            }

            const matchCtx = buildMatchContext({
                matchLength: game.state.matchLength,
                scoreX: game.state.scoreX,
                scoreO: game.state.scoreO,
                cubeValue: game.state.cubeValue,
                cubeOwner: game.state.cubeOwner,
                crawford: game.state.crawford,
            });

            const features = extractStrategicFeatures(stateToEval, altEndState, bestEndState);

            // Notation ABSOLUE du plateau (cohérente avec les flèches visuelles).
            const absoluteBestNotation =
                bestMoves.length > 0
                    ? formatCoachMoveSequence(bestMoves, 'X', stateToEval.board)
                    : bestEndState.board
                        ? formatCoachMoveSequenceFromBoard(stateToEval.board, bestEndState.board, 'X')
                        : best.notation;
            const absoluteAltNotation =
                altMoves.length > 0
                    ? formatCoachMoveSequence(altMoves, 'X', stateToEval.board)
                    : altEndState.board
                        ? formatCoachMoveSequenceFromBoard(stateToEval.board, altEndState.board, 'X')
                        : alt.notation;

            const ruleBased = generateRuleBasedExplanation({
                verdict: isBlunder ? 'blunder' : 'douteux',
                equityLoss: loss,
                playedMove: absoluteAltNotation,
                optimalMove: absoluteBestNotation,
                features,
                matchContext: matchCtx,
                language: 'fr',
            });

            setCoach({
                verdict: isBlunder ? 'blunder' : 'doubtful',
                equityLoss: loss,
                playedMove: absoluteAltNotation,
                optimalMove: absoluteBestNotation,
                explanation: ruleBased.explanation,
                whyFailed: ruleBased.whyFailed,
                whyOptimal: ruleBased.whyOptimal,
                summary: ruleBased.summary,
                features,
                positionKey: game.state.board.join(','),
            });

            setCoachHighlight({
                played: altMoves,
                optimal: bestMoves,
            });
        } catch (err) {
            console.warn('[Coach] Moteur ou worker indisponible (timeout 8s), repli sur featureExtractor :', err);

            const pips = pipCount(game.state.board);
            const structure = analyzeBoardStructure(game.state.board, 'X');
            const userBlots = analyzeBlots(game.state.board, 'X');

            const fallbackFeatures: StrategicFeatures = {
                player: 'X',
                pipCountDiff: {
                    player: pips.X,
                    opponent: pips.O,
                    leader: pips.X < pips.O ? 'X' : pips.X > pips.O ? 'O' : 'tie',
                    diff: pips.X - pips.O,
                },
                blotsAndShots: {
                    user: userBlots,
                    best: userBlots.length > 0 ? userBlots.slice(0, 1) : [],
                },
                boardStructure: structure,
                contactStatus: pips.X > 0 && pips.O > 0 ? 'contact' : 'pureRace',
            };

            const fallbackMatchCtx = buildMatchContext({
                matchLength: game.state.matchLength,
                scoreX: game.state.scoreX,
                scoreO: game.state.scoreO,
                cubeValue: game.state.cubeValue,
                cubeOwner: game.state.cubeOwner,
                crawford: game.state.crawford,
            });

            const fallbackRuleBased = generateRuleBasedExplanation({
                verdict: 'douteux',
                equityLoss: -0.06,
                playedMove: 'Position actuelle',
                optimalMove: 'Consolidation structurelle',
                features: fallbackFeatures,
                matchContext: fallbackMatchCtx,
                language: 'fr',
            });

            setCoach({
                verdict: 'doubtful',
                equityLoss: -0.06,
                playedMove: 'Position actuelle',
                optimalMove: 'Consolidation structurelle',
                explanation: fallbackRuleBased.explanation,
                whyFailed: fallbackRuleBased.whyFailed,
                whyOptimal: fallbackRuleBased.whyOptimal,
                summary: fallbackRuleBased.summary,
                features: fallbackFeatures,
                positionKey: game.state.board.join(','),
            });
        } finally {
            setIsAnalyzing(false);
        }
    }, [game.dice, game.state, onCoachTriggered]);

    return {
        coach,
        coachHighlight,
        matchStats,
        matchStatsX: matchStats,
        matchStatsO,
        optimalStreak,
        brilliantMove,
        isAnalyzing,
        lastMoveFeedback,
        notificationLevel,
        setNotificationLevel,
        dismissCoach,
        replayMove,
        triggerCoach,
    };
}
