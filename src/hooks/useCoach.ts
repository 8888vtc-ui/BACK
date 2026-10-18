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
import { analyzeBoardMoves, formatMoveSequenceNotationWithHits } from '../lib/engine/evaluator';
import { evaluatePosition } from '../lib/analysisService';
import { normalizeMoveNotation } from '../features/drills/blunderDrillEngine';
import { soundEngine } from '../lib/sound/soundEngine';
import type { CoachHighlight } from '../components/board/boardThemes';

export interface CoachState {
    verdict: 'doubtful' | 'blunder';
    equityLoss: number;
    playedMove: string;
    optimalMove: string;
    explanation: string | null;
    whyFailed?: string;
    whyOptimal?: string;
    summary?: string;
    features?: StrategicFeatures;
    positionKey?: string;
    candidateMoves?: { rank: number; notation: string; equity: number; equityLoss: number }[];
    boardBefore?: number[];
}

export interface MatchStats {
    decisionsCount: number;
    totalEquityLoss: number;
    blundersCount: number;
    totalErrorRate?: number;
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
    const [optimalStreak, setOptimalStreak] = useState(0);
    const [brilliantMove, setBrilliantMove] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // 1. Réinitialise l'analyse du coach dès qu'une nouvelle manche/partie commence
    useEffect(() => {
        if (game.moveHistory && game.moveHistory.length === 0 && currentTurnMovesRef.current.length === 0) {
            setCoach(null);
            setCoachHighlight(null);
            lastOpponentEvalRef.current = null;
        }
    }, [game.moveHistory, currentTurnMovesRef]);

    // 2. Dès que le joueur X lance ses dés pour entamer un nouveau coup,
    // on ferme l'analyse du coup précédent pour ne pas encombrer le champ de jeu.
    useEffect(() => {
        if (game.state.turn === 'X' && game.dice !== null) {
            setCoach(null);
            setCoachHighlight(null);
        }
    }, [game.state.turn, game.dice]);

    // Analyse automatique quand le tour de X bascule vers O.
    useEffect(() => {
        if (game.state.turn === 'O' && currentTurnMovesRef.current.length > 0 && currentTurnDiceRef.current) {
            const dice = currentTurnDiceRef.current;
            const playedMoves = [...currentTurnMovesRef.current];
            const boardBefore = turnBoardBeforeRef.current.length > 0 ? turnBoardBeforeRef.current : game.state.board;

            try {
                const evalState: BoardState = {
                    ...game.state,
                    board: boardBefore,
                    turn: 'X' as const,
                    dice,
                };
                const analysis = analyzeBoardMoves(evalState, dice, { ply: 2 });
                if (analysis.bestMove) {
                    const playedNotation = formatMoveSequenceNotationWithHits(playedMoves, 'X', boardBefore);
                    const normalizedPlayed = normalizeMoveNotation(playedNotation);
                    const matchedAnalysis = analysis.moves.find(
                        (m) => normalizeMoveNotation(m.notation) === normalizedPlayed,
                    );
                    const equityLoss = matchedAnalysis ? matchedAnalysis.equityLoss : -0.15;

                    const isUnforced = analysis.moves.length > 1;
                    if (isUnforced) {
                        // Plafonne la perte comptabilisée à 0.500 pour éviter qu'un bug isolé
                        // ne détruise la moyenne du PR.
                        const cappedLoss = Math.min(Math.abs(equityLoss), 0.5);
                        // Seuils de verdict alignés :
                        //   < 0.020  => OPTIMAL (n'incrémente pas BLUNDERS)
                        //   0.020-0.080 => DOUTEUX (n'incrémente pas BLUNDERS)
                        //   >= 0.080 => BLUNDER (incrémente BLUNDERS de +1)
                        const isBlunder = Math.abs(equityLoss) >= 0.08;
                        setMatchStats((prev) => {
                            const nextDecisions = prev.decisionsCount + 1;
                            const nextLoss = prev.totalEquityLoss + cappedLoss;
                            return {
                                decisionsCount: nextDecisions,
                                totalEquityLoss: nextLoss,
                                blundersCount: prev.blundersCount + (isBlunder ? 1 : 0),
                                totalErrorRate: nextDecisions > 0 ? (nextLoss / nextDecisions) * 500 : 0,
                            };
                        });

                        if (Math.abs(equityLoss) < 0.02) {
                            setOptimalStreak((prev) => prev + 1);
                        } else if (isBlunder) {
                            setOptimalStreak(0);
                        }

                        const secondBest = analysis.moves[1];
                        const isBrilliant =
                            Math.abs(equityLoss) < 0.0001 &&
                            secondBest !== undefined &&
                            Math.abs(secondBest.equityLoss) > 0.060;
                        setBrilliantMove(isBrilliant);
                    }

                    if (Math.abs(equityLoss) >= 0.02) {
                        // Seuil de blunder aligné : >= 0.080 de perte => BLUNDER.
                        const isBlunder = Math.abs(equityLoss) >= 0.08;
                        if (isBlunder) {
                            soundEngine.playBlunderAlert();
                        }

                        const playedEndState: BoardState = {
                            ...evalState,
                            board: [...game.state.board],
                        };

                        let bestEndState: BoardState = evalState;
                        if (analysis.bestMove.moves) {
                            let bBest = [...evalState.board];
                            for (const m of analysis.bestMove.moves) bBest = applyMove(bBest, m, 'X');
                            bestEndState = { ...evalState, board: bBest };
                        }

                        const features = extractStrategicFeatures(evalState, playedEndState, bestEndState);

                        setCoach({
                            verdict: isBlunder ? 'blunder' : 'doubtful',
                            equityLoss,
                            playedMove: playedNotation,
                            optimalMove: analysis.bestMove.notation,
                            explanation: null,
                            features,
                            positionKey: boardBefore.join(','),
                            candidateMoves: analysis.moves.slice(0, 3).map((m) => ({
                                rank: m.rank,
                                notation: m.notation,
                                equity: m.equity,
                                equityLoss: m.equityLoss,
                            })),
                            boardBefore: [...boardBefore],
                        });
                        setCoachHighlight({
                            played: playedMoves,
                            optimal: analysis.bestMove.moves ?? [],
                        });

                        onCoachTriggered?.();
                    } else {
                        setCoach(null);
                        setCoachHighlight(null);
                    }
                }
            } catch (err) {
                console.warn('[Coach] Erreur évaluation tour X :', err);
            }

            currentTurnMovesRef.current = [];
        }
    }, [game.state.turn, game.state, currentTurnMovesRef, currentTurnDiceRef, turnBoardBeforeRef, onCoachTriggered]);

    // Évaluation automatique du coup de l'IA adverse (pour affichage de son PR et Error Rate)
    useEffect(() => {
        if (
            game.state.turn === 'X' &&
            game.lastOpponentMoves &&
            game.lastOpponentMoves.length > 0 &&
            game.lastOpponentDice
        ) {
            const moveKey = `${game.lastOpponentDice.join('-')}:${game.lastOpponentMoves.map((m) => `${m.from}/${m.to}`).join(' ')}`;
            if (lastOpponentEvalRef.current === moveKey) return;
            lastOpponentEvalRef.current = moveKey;

            // Estimation du niveau d'équité perdu selon le niveau IA
            let oppLoss = 0.005; // 3-ply Grandmaster
            if (game.difficulty === 'beginner') {
                oppLoss = 0.055; // 0-ply Novice
            } else if (game.difficulty === 'expert') {
                oppLoss = 0.015; // 2-ply Maître
            }
            const isBlunder = oppLoss >= 0.08;
            setMatchStatsO((prev) => {
                const nextDecisions = prev.decisionsCount + 1;
                const nextLoss = prev.totalEquityLoss + oppLoss;
                return {
                    decisionsCount: nextDecisions,
                    totalEquityLoss: nextLoss,
                    blundersCount: prev.blundersCount + (isBlunder ? 1 : 0),
                    totalErrorRate: nextDecisions > 0 ? (nextLoss / nextDecisions) * 500 : 0,
                };
            });
        }
    }, [game.state.turn, game.lastOpponentMoves, game.lastOpponentDice, game.difficulty]);

    const dismissCoach = useCallback(() => {
        setCoach(null);
        setCoachHighlight(null);
        setIsAnalyzing(false);
    }, []);

    const replayMove = useCallback(() => {
        game.undoMove();
        setCoach(null);
        setCoachHighlight(null);
    }, [game.undoMove]);

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
            const ruleBased = generateRuleBasedExplanation({
                verdict: isBlunder ? 'blunder' : 'douteux',
                equityLoss: loss,
                playedMove: alt.notation,
                optimalMove: best.notation,
                features,
                matchContext: matchCtx,
                language: 'fr',
            });

            setCoach({
                verdict: isBlunder ? 'blunder' : 'doubtful',
                equityLoss: loss,
                playedMove: alt.notation,
                optimalMove: best.notation,
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
        dismissCoach,
        replayMove,
        triggerCoach,
    };
}
