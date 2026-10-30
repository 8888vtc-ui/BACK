/**
 * Analyseur log-driven déterministe du Coach IA (Règle d'or n°1 & n°3)
 *
 * Ce module est la SEULE source d'analyse mathématique des coups du joueur connecté.
 * Il ne lit JAMAIS le DOM ni l'état visuel React : il prend en entrée exclusivement
 * une entrée immuable de `matchLog` et retourne un verdict déterministe.
 *
 * RÈGLES STRICTES :
 * 1. `if (logEntry.player !== localPlayer) return null;` — on n'analyse JAMAIS l'IA ni l'adversaire.
 * 2. L'évaluation part de `logEntry.boardBefore` + `logEntry.dice` (jamais l'écran).
 * 3. Verdict en 4 paliers : Optimal ✅ / Bon 👍 / Imprécision ⚠️ / Blunder ❌.
 */

import type { Player, BoardState, Move } from '../../engine/backgammonEngine';
import {
    createInitialState,
    applyMove,
    serializeXGID,
    serializeCanonicalXGID,
    generateLegalMoves,
} from '../../engine/backgammonEngine';
import type { MatchLogEntry } from '../../actions/types';
import { analyzeBoardMoves, evaluateBoard } from '../../lib/engine/evaluator';
import { evaluatePositionExpectiminimax2Ply } from '../../lib/engine/expectiminimax';
import {
    evaluateWithBgsage,
    boardsMatchOnPoints,
    boardsMatchOnPointsAndBar,
    bgsageMoveBoardToProjectBoard,
    type BgsageEvaluateResponse,
    type BgsageMove,
} from '../../lib/engine/bgsageClient';
import { bgsageCacheKey, getCachedBgsageEvaluation } from '../../lib/engine/bgsageCache';
import {
    formatCoachMoveSequence,
    formatCoachMoveSequenceFromBoard,
    movesFromBoardDiff,
    normalizeCoachNotation,
    relativeNotationToAbsolute,
    parseCoachNotationMoves,
} from './coachMoveNotation';
import type { BgsageMoveMetrics, BgsageStrategicInsights } from './featureExtractor';
import {
    detectOpeningScoreRegime,
    getOpeningForScore,
    isInitialBoardPosition,
} from '../openings/openingDatabase';
import { estimateOffListEquityLoss } from './offListEquity';

/**
 * Séquence de sous-mouvements fiable pour l'affichage : celle du log si elle
 * est complète, sinon reconstruite depuis le différentiel boardBefore →
 * boardAfter (évite toute notation tronquée du type « 13/9 » au lieu de
 * « 13/11 »).
 */
function resolvePlayedMoves(logEntry: MatchLogEntry): ReadonlyArray<{ from: number; to: number }> {
    if (logEntry.movePlayed && logEntry.movePlayed.length > 0) {
        return logEntry.movePlayed;
    }
    return movesFromBoardDiff(logEntry.boardBefore, logEntry.boardAfter, logEntry.player);
}

/**
 * Verdicts en 4 paliers (Règle d'or n°3).
 */
export type CoachVerdict = 'optimal' | 'good' | 'inaccuracy' | 'blunder';

/**
 * Seuils d'équité perdus (en valeur absolue) pour la classification.
 */
export const VERDICT_THRESHOLDS = {
    /** ≤ 0.010 → Optimal ✅ */
    OPTIMAL: 0.01,
    /** ≤ 0.020 → Bon 👍 */
    GOOD: 0.02,
    /** > 0.080 → Blunder ❌ */
    BLUNDER: 0.08,
} as const;

/**
 * Seuils stricts Grand Maître (PR 1–3) pour les joueurs d'élite.
 */
export const STRICT_VERDICT_THRESHOLDS = {
    /** ≤ 0.005 → Optimal ✅ */
    OPTIMAL: 0.005,
    /** ≤ 0.015 → Bon 👍 */
    GOOD: 0.015,
    /** > 0.060 → Blunder ❌ */
    BLUNDER: 0.06,
} as const;

/**
 * Classifie une perte d'équité en verdict à 4 paliers.
 * Centralise la logique pour éviter les seuils incohérents dispersés.
 */
export function classifyVerdict(equityLoss: number, strictPr1 = false): CoachVerdict {
    const loss = Math.abs(equityLoss);
    const thresholds = strictPr1 ? STRICT_VERDICT_THRESHOLDS : VERDICT_THRESHOLDS;
    if (loss <= thresholds.OPTIMAL) return 'optimal';
    if (loss <= thresholds.GOOD) return 'good';
    if (loss > thresholds.BLUNDER) return 'blunder';
    return 'inaccuracy';
}

/**
 * Libellé lisible du verdict (pour l'affichage du panneau Coach).
 */
export function verdictLabel(verdict: CoachVerdict): string {
    switch (verdict) {
        case 'optimal':
            return 'Optimal ✅';
        case 'good':
            return 'Bon 👍';
        case 'inaccuracy':
            return 'Imprécision ⚠️';
        case 'blunder':
            return 'Blunder ❌';
    }
}

/**
 * Résultat déterministe de l'analyse d'un coup humain depuis la log.
 */
export interface HumanMoveAnalysis {
    readonly turnIndex: number;
    readonly player: Player;
    readonly verdict: CoachVerdict;
    readonly equityLoss: number;
    readonly playedNotation: string;
    readonly optimalNotation: string;
    readonly playedEquity: number;
    readonly bestEquity: number;
    readonly isUnforced: boolean;
    readonly isBlunder: boolean;
    readonly candidateMoves: ReadonlyArray<{
        readonly notation: string;
        readonly equity: number;
        readonly equityLoss: number;
        readonly winProbability?: number;
        readonly gammonProbability?: number;
        readonly backgammonProbability?: number;
    }>;
    /** Séquence légale exacte du meilleur coup (pour les flèches et l'état final). */
    readonly optimalMoves?: ReadonlyArray<Move>;
    /** Métriques neurales enrichies Open Sage (plans de jeu + probabilités de gain/gammon). */
    readonly bgsageInsights?: BgsageStrategicInsights;
}

export interface AnalyzeHumanMoveFromLogParams {
    readonly logEntry: MatchLogEntry;
    readonly localPlayer?: Player;
    readonly cubeValue?: number;
    readonly cubeOwner?: Player | null;
    readonly crawford?: boolean;
    readonly matchLength?: number;
    readonly scoreX?: number;
    readonly scoreO?: number;
    readonly ply?: number;
    readonly signal?: AbortSignal;
}

/**
 * Calcule le plateau d'arrivée effectif : si `boardAfter` est identique à `boardBefore`
 * alors que `movePlayed` contient des coups (cas de certains harnais de tests), rejoue
 * `movePlayed` sur `boardBefore` pour obtenir l'état d'arrivée réel.
 */
function resolveEffectiveBoardAfter(logEntry: MatchLogEntry): number[] {
    if (
        logEntry.movePlayed &&
        logEntry.movePlayed.length > 0 &&
        boardsMatchOnPointsAndBar(logEntry.boardBefore, logEntry.boardAfter)
    ) {
        let b = [...logEntry.boardBefore];
        for (const m of logEntry.movePlayed) {
            b = applyMove(b, m, logEntry.player);
        }
        return b;
    }
    return [...logEntry.boardAfter];
}

/**
 * Fusionne les sous-mouvements chaînés d'un même pion (ex. 24/18 + 18/13 -> 24/13)
 * et développe les multiplicateurs (ex. 8/5(2) -> 8/5 8/5) pour une comparaison canonique.
 */
function collapseParsedMovesKey(notation: string, player: Player = 'X'): string {
    const moves = parseCoachNotationMoves(notation, player);
    if (moves.length === 0) return '';
    const list = moves.map((m) => ({ ...m }));
    let merged = true;
    while (merged) {
        merged = false;
        for (let i = 0; i < list.length && !merged; i++) {
            for (let j = 0; j < list.length; j++) {
                if (i === j) continue;
                if (list[i].to !== 0 && list[i].to !== 25 && list[i].to === list[j].from) {
                    list[i] = { from: list[i].from, to: list[j].to };
                    list.splice(j, 1);
                    merged = true;
                    break;
                }
            }
        }
    }
    return list
        .map((m) => {
            const fromKey = m.from === 0 || m.from === 25 ? 'bar' : String(m.from);
            const toKey = m.to === 0 || m.to === 25 ? 'off' : String(m.to);
            return `${fromKey}>${toKey}`;
        })
        .sort()
        .join('|');
}

/**
 * Vérifie si deux notations sont équivalentes même lorsque les sous-mouvements
 * ont été joués dans l'ordre inverse (ex: "8/7 13/7" vs "13/7 8/7") ou chaînés ("24/18 18/13" vs "24/13").
 */
function notationsAreEquivalent(a: string, b: string, player: Player = 'X'): boolean {
    const normA = normalizeCoachNotation(a);
    const normB = normalizeCoachNotation(b);
    if (!normA || !normB) return false;
    if (normA === normB) return true;
    const tokensA = normA.split(' ').filter(Boolean).sort().join(' ');
    const tokensB = normB.split(' ').filter(Boolean).sort().join(' ');
    if (tokensA === tokensB) return true;
    const collapsedA = collapseParsedMovesKey(a, player);
    const collapsedB = collapseParsedMovesKey(b, player);
    return Boolean(collapsedA && collapsedA === collapsedB);
}

function toBgsageMoveMetrics(m: BgsageMove): BgsageMoveMetrics {
    return {
        equity: m.equity,
        cubelessEquity: m.cubelessEquity ?? m.equity,
        winProb: m.probabilities?.win ?? 0.5,
        winGammonProb: m.probabilities?.winGammon ?? 0,
        winBackgammonProb: m.probabilities?.winBackgammon ?? 0,
        loseGammonProb: m.probabilities?.loseGammon ?? 0,
        loseBackgammonProb: m.probabilities?.loseBackgammon ?? 0,
        playerGamePlan: m.playerGamePlan ?? 'contact',
        opponentGamePlan: m.opponentGamePlan ?? 'contact',
        evalLevel: m.evalLevel ?? undefined,
    };
}

/**
 * Reconstruction déterministe de la position avant le coup n° K (Règle d'or n°1).
 *
 * Rejoue séquentiellement les K-1 coups enregistrés dans la log depuis l'état initial
 * pour obtenir la position mathématique EXACTE avant le coup, sans jamais lire l'écran.
 *
 * @param log       Journal immuable du match (ordonné par `turnIndex`).
 * @param turnIndex Index du coup à analyser (1-based).
 * @returns Le plateau reconstruit avant le coup `turnIndex`, ou `null` si introuvable.
 */
export function reconstructBoardFromLog(
    log: ReadonlyArray<MatchLogEntry>,
    turnIndex: number,
): number[] | null {
    // État initial du match (position de départ standard).
    let board = [...createInitialState().board];

    for (const entry of log) {
        if (entry.turnIndex >= turnIndex) {
            break;
        }
        // Rejoue chaque coup de l'entrée précédente pour avancer la position.
        for (const move of entry.movePlayed) {
            board = applyMove(board, move, entry.player);
        }
    }

    return board;
}

/**
 * Pipeline d'analyse déterministe du joueur connecté (Règle d'or n°3).
 *
 * 1. Prend `boardBefore` et `dice` depuis l'entrée de log.
 * 2. Génère tous les coups légaux via `backgammonEngine` (même référentiel `board[0..25]`).
 * 3. Évalue chaque candidat avec l'évaluateur synchrone (`evaluator.ts`, `maxMoves: 64`).
 * 4. Trie par équité décroissante, identifie `bestMove`/`bestEquity` et `playedEquity`.
 * 5. Calcule `equityLoss = max(0, bestEquity - playedEquity)`.
 */
export function analyzeHumanMoveFromLog(
    params: AnalyzeHumanMoveFromLogParams,
): HumanMoveAnalysis | null {
    const { logEntry, localPlayer = 'X' } = params;

    // Règle d'or n°2 : on n'analyse JAMAIS l'IA ni l'adversaire.
    if (logEntry.player !== localPlayer) {
        return null;
    }

    const dice: [number, number] = [logEntry.dice[0], logEntry.dice[1]];
    const boardBefore = [...logEntry.boardBefore];
    const effectiveBoardAfter = resolveEffectiveBoardAfter(logEntry);

    const evalState: BoardState = {
        board: boardBefore,
        turn: logEntry.player,
        dice,
        cubeValue: params.cubeValue ?? 1,
        cubeOwner: params.cubeOwner ?? null,
        matchLength: params.matchLength ?? 7,
        scoreX: params.scoreX ?? 0,
        scoreO: params.scoreO ?? 0,
        crawford: params.crawford ?? false,
        doubled: false,
        resigned: 0,
    };

    // Évalue TOUS les coups légaux (maxMoves: 64) pour ne jamais tronquer un bon coup hors Top-5.
    const analysis = analyzeBoardMoves(evalState, dice, { ply: params.ply ?? 2, maxMoves: 64 });
    if (!analysis.bestMove) {
        return null;
    }

    const playedMoves = resolvePlayedMoves(logEntry);
    const playedNotation = formatCoachMoveSequence(
        [...playedMoves],
        logEntry.player,
        boardBefore,
    );
    const canonicalMoves = movesFromBoardDiff(boardBefore, effectiveBoardAfter, logEntry.player);
    const canonicalNotation = formatCoachMoveSequence(canonicalMoves, logEntry.player, boardBefore);

    // Vérification prioritaire : livre d'ouvertures de grand maître pour la position initiale (adapté au score)
    const isOpening = isInitialBoardPosition(boardBefore) && dice[0] !== dice[1] && logEntry.player === 'X';
    const openingRegime = isOpening
        ? detectOpeningScoreRegime({
            matchLength: params.matchLength,
            scoreX: params.scoreX,
            scoreO: params.scoreO,
            player: logEntry.player,
            cubeValue: params.cubeValue,
            crawford: params.crawford,
        })
        : 'NORMAL';
    const opening = isOpening ? getOpeningForScore(dice[0], dice[1], openingRegime) : null;
    if (opening) {
        let openingBestBoard = [...boardBefore];
        for (const m of opening.bestMoves) {
            openingBestBoard = applyMove(openingBestBoard, m, logEntry.player);
        }

        if (
            boardsMatchOnPointsAndBar(openingBestBoard, effectiveBoardAfter) ||
            notationsAreEquivalent(playedNotation, opening.bestMoveNotation) ||
            notationsAreEquivalent(canonicalNotation, opening.bestMoveNotation)
        ) {
            return {
                turnIndex: logEntry.turnIndex,
                player: logEntry.player,
                verdict: 'optimal',
                equityLoss: 0,
                playedNotation,
                optimalNotation: opening.bestMoveNotation,
                playedEquity: opening.equity,
                bestEquity: opening.equity,
                isUnforced: true,
                isBlunder: false,
                optimalMoves: opening.bestMoves,
                candidateMoves: [
                    { notation: opening.bestMoveNotation, equity: opening.equity, equityLoss: 0 },
                    ...opening.alternatives.map((alt) => ({
                        notation: alt.notation,
                        equity: opening.equity + alt.equityLoss,
                        equityLoss: Math.abs(alt.equityLoss),
                    })),
                ],
            };
        }
        const matchedAlt = opening.alternatives.find((alt) => {
            if (
                notationsAreEquivalent(alt.notation, playedNotation) ||
                notationsAreEquivalent(alt.notation, canonicalNotation)
            ) {
                return true;
            }
            const altMoves = parseCoachNotationMoves(alt.notation, logEntry.player);
            if (altMoves.length > 0) {
                let altBoard = [...boardBefore];
                for (const m of altMoves) altBoard = applyMove(altBoard, m, logEntry.player);
                return boardsMatchOnPointsAndBar(altBoard, effectiveBoardAfter);
            }
            return false;
        });
        if (matchedAlt) {
            const loss = Math.abs(matchedAlt.equityLoss);
            return {
                turnIndex: logEntry.turnIndex,
                player: logEntry.player,
                verdict: classifyVerdict(loss),
                equityLoss: loss,
                playedNotation,
                optimalNotation: opening.bestMoveNotation,
                playedEquity: opening.equity + matchedAlt.equityLoss,
                bestEquity: opening.equity,
                isUnforced: true,
                isBlunder: classifyVerdict(loss) === 'blunder',
                optimalMoves: opening.bestMoves,
                candidateMoves: [
                    { notation: opening.bestMoveNotation, equity: opening.equity, equityLoss: 0 },
                    ...opening.alternatives.map((alt) => ({
                        notation: alt.notation,
                        equity: opening.equity + alt.equityLoss,
                        equityLoss: Math.abs(alt.equityLoss),
                    })),
                ],
            };
        }

        // Coup d'ouverture hors-livre : le coup optimal reste impérativement celui du Livre d'Ouvertures
        const opponent: Player = logEntry.player === 'X' ? 'O' : 'X';
        const bestAfterEval = evaluateBoard(
            { ...evalState, board: openingBestBoard, turn: opponent, dice: null },
            Math.max(0, (params.ply ?? 2) - 1),
        );
        const playedAfterEval = evaluateBoard(
            { ...evalState, board: effectiveBoardAfter, turn: opponent, dice: null },
            Math.max(0, (params.ply ?? 2) - 1),
        );
        const minAltLoss =
            opening.alternatives.length > 0
                ? Math.max(...opening.alternatives.map((a) => Math.abs(a.equityLoss)))
                : 0.04;
        const rawDiff = Math.max(
            0,
            (-bestAfterEval.cubelessEquity - -playedAfterEval.cubelessEquity) * 0.45,
        );
        const offBookLoss = Number(Math.max(minAltLoss, rawDiff).toFixed(4));
        const offBookVerdict = classifyVerdict(offBookLoss);
        return {
            turnIndex: logEntry.turnIndex,
            player: logEntry.player,
            verdict: offBookVerdict,
            equityLoss: offBookLoss,
            playedNotation,
            optimalNotation: opening.bestMoveNotation,
            playedEquity: Number((opening.equity - offBookLoss).toFixed(4)),
            bestEquity: opening.equity,
            isUnforced: true,
            isBlunder: offBookVerdict === 'blunder',
            optimalMoves: opening.bestMoves,
            candidateMoves: [
                { notation: opening.bestMoveNotation, equity: opening.equity, equityLoss: 0 },
                ...opening.alternatives.map((alt) => ({
                    notation: alt.notation,
                    equity: opening.equity + alt.equityLoss,
                    equityLoss: Math.abs(alt.equityLoss),
                })),
                {
                    notation: playedNotation,
                    equity: Number((opening.equity - offBookLoss).toFixed(4)),
                    equityLoss: offBookLoss,
                },
            ],
        };
    }

    // Appariement du coup joué avec un candidat évalué :
    // 0. Priorité absolue : si le cache LRU Open Sage (`bgsage`) contient déjà l'évaluation
    //    neuronale 3-ply/2-ply/1-ply de cette position (calculée en direct par le Coach),
    //    on l'utilise directement pour garantir 100 % de parité entre le Coach en direct et le Bilan PR !
    const xgidForCache = serializeCanonicalXGID(evalState);
    const cachedBgsage =
        getCachedBgsageEvaluation(bgsageCacheKey(xgidForCache, 3)) ??
        getCachedBgsageEvaluation(bgsageCacheKey(xgidForCache, 2)) ??
        getCachedBgsageEvaluation(bgsageCacheKey(xgidForCache, 1));
    if (
        cachedBgsage &&
        cachedBgsage.chequerPlay.length > 0 &&
        cachedBgsage.source !== 'typescript-tri-phase' &&
        cachedBgsage.source !== 'local'
    ) {
        const legalSeqs = generateLegalMoves(evalState, dice);
        const fromCache = buildHumanMoveAnalysisFromBgsageResult({
            bgsageResult: cachedBgsage,
            logEntry,
            evalState,
            legalSeqs,
            boardBefore,
            effectiveBoardAfter,
            targetPly: 3,
        });
        if (fromCache) {
            return fromCache;
        }
    }

    // 1. Sur le plateau résultant exact (flèches + barres, puis flèches seules)
    // 2. Sur la clé de séquence canonique insensible à l'ordre
    // 3. Sur la notation équivalente insensible à l'ordre
    const playedKey = moveSequenceKey(playedMoves);
    const canonicalKey = moveSequenceKey(canonicalMoves);
    const matchedAnalysis =
        analysis.moves.find((m) => m.board && boardsMatchOnPointsAndBar(m.board, effectiveBoardAfter)) ??
        analysis.moves.find((m) => m.board && boardsMatchOnPoints(m.board, effectiveBoardAfter)) ??
        analysis.moves.find((m) => m.moves && (moveSequenceKey(m.moves) === playedKey || moveSequenceKey(m.moves) === canonicalKey)) ??
        analysis.moves.find((m) => notationsAreEquivalent(m.notation, playedNotation) || notationsAreEquivalent(m.notation, canonicalNotation));

    const bestEquity = analysis.bestMove.equity;
    const isBestMovePlayed =
        (analysis.bestMove.board && boardsMatchOnPointsAndBar(analysis.bestMove.board, effectiveBoardAfter)) ||
        notationsAreEquivalent(analysis.bestMove.notation, playedNotation, logEntry.player) ||
        notationsAreEquivalent(analysis.bestMove.notation, canonicalNotation, logEntry.player);

    const opponent: Player = logEntry.player === 'X' ? 'O' : 'X';
    let playedEquity: number;
    if (isBestMovePlayed) {
        playedEquity = bestEquity;
    } else if (matchedAnalysis && analysis.moves.indexOf(matchedAnalysis) < 6) {
        playedEquity = matchedAnalysis.equity;
    } else {
        // Évaluation directe de la position finale jouée sur la même échelle (2-ply Expectiminimax ou 0-ply)
        // que `bestEquity`, sans pénalité artificielle de queue (`minEvaluated2Ply`).
        const resultingState: BoardState = {
            ...evalState,
            board: effectiveBoardAfter,
            turn: opponent,
            dice: null,
        };
        if ((params.ply ?? 2) >= 2) {
            playedEquity = evaluatePositionExpectiminimax2Ply(
                resultingState,
                (st) => evaluateBoard(st, 0),
            ).equity;
        } else {
            playedEquity = -evaluateBoard(resultingState, 0).cubefulEquity;
        }
    }

    // Garde-fou d'échelle 0-ply vs 2-ply : évalue toujours `bestMove.board` et `effectiveBoardAfter`
    // sur le même évaluateur statique cubeless 0-ply et calibre l'amplitude sur l'échelle EMG d'eXtreme Gammon
    // (évite l'amplification x3.5 de `liveCubeEquity` et la double pénalité de blot en feuille 2-ply).
    let rawLoss = Math.max(0, bestEquity - playedEquity);
    if (!isBestMovePlayed && analysis.bestMove.board) {
        const bestStatic = -evaluateBoard(
            { ...evalState, board: analysis.bestMove.board, turn: opponent, dice: null },
            0,
        ).cubelessEquity;
        const playedStatic = -evaluateBoard(
            { ...evalState, board: effectiveBoardAfter, turn: opponent, dice: null },
            0,
        ).cubelessEquity;
        const staticDiff = Math.max(0, bestStatic - playedStatic);
        const calibratedCap = Number((staticDiff * 0.28 + 0.015).toFixed(4));
        if (rawLoss > calibratedCap) {
            rawLoss = calibratedCap;
            playedEquity = Number((bestEquity - rawLoss).toFixed(4));
        }
    }

    // Règle d'or n°3 : perte d'équité bornée à zéro (jamais négative).
    const equityLoss = Math.max(0, rawLoss);

    const verdict = classifyVerdict(equityLoss);

    const optimalNotation = analysis.bestMove.moves && analysis.bestMove.moves.length > 0
        ? formatCoachMoveSequence(analysis.bestMove.moves, logEntry.player, boardBefore)
        : analysis.bestMove.board
            ? formatCoachMoveSequenceFromBoard(boardBefore, analysis.bestMove.board, logEntry.player)
            : analysis.bestMove.notation;

    return {
        turnIndex: logEntry.turnIndex,
        player: logEntry.player,
        verdict,
        equityLoss,
        playedNotation,
        optimalNotation,
        playedEquity,
        bestEquity,
        isUnforced: analysis.moves.length > 1,
        isBlunder: verdict === 'blunder',
        optimalMoves: analysis.bestMove.moves,
        candidateMoves: analysis.moves.map((m) => ({
            notation:
                m.moves && m.moves.length > 0
                    ? formatCoachMoveSequence(m.moves, logEntry.player, boardBefore)
                    : m.board
                        ? formatCoachMoveSequenceFromBoard(boardBefore, m.board, logEntry.player)
                        : m.notation,
            equity: m.equity,
            equityLoss: m.equityLoss,
            winProbability: m.probabilities?.win,
            gammonProbability: m.probabilities?.winGammon,
            backgammonProbability: m.probabilities?.winBackgammon,
        })),
    };
}

/**
 * Clé canonique d'une séquence de sous-mouvements, insensible à l'ordre.
 * Permet de comparer le coup joué aux candidats évalués sans dépendre du
 * référentiel de notation.
 */
function moveSequenceKey(moves: ReadonlyArray<{ from: number; to: number }>): string {
    return moves
        .map((m) => `${m.from}>${m.to}`)
        .sort()
        .join('|');
}

/**
 * Analyse hybride d'un coup humain : tente d'abord le bgsage-service (réseau de
 * neurones Open Sage, précision professionnelle), puis bascule sur l'évaluateur
 * local déterministe en cas d'indisponibilité ou de latence excessive.
 *
 * @returns Le même `HumanMoveAnalysis`, avec un champ `source` indiquant le moteur.
 */
export async function analyzeHumanMoveFromLogWithBgsage(
    params: AnalyzeHumanMoveFromLogParams,
): Promise<(HumanMoveAnalysis & { source: 'bgsage' | 'local' }) | null> {
    const { logEntry, localPlayer = 'X' } = params;

    // Règle d'or n°2 : on n'analyse JAMAIS l'IA ni l'adversaire.
    if (logEntry.player !== localPlayer) {
        return null;
    }

    const dice: [number, number] = [logEntry.dice[0], logEntry.dice[1]];
    const boardBefore = [...logEntry.boardBefore];
    const effectiveBoardAfter = resolveEffectiveBoardAfter(logEntry);

    // Construction du XGID canonique 10 champs de la position avant le coup.
    const evalState: BoardState = {
        board: boardBefore,
        turn: logEntry.player,
        dice,
        cubeValue: params.cubeValue ?? 1,
        cubeOwner: params.cubeOwner ?? null,
        matchLength: params.matchLength ?? 7,
        scoreX: params.scoreX ?? 0,
        scoreO: params.scoreO ?? 0,
        crawford: params.crawford ?? false,
        doubled: false,
        resigned: 0,
    };
    const xgid = serializeCanonicalXGID(evalState);
    const legalSeqs = generateLegalMoves(evalState, dice);

    // 0. Vérification prioritaire du Livre d'Ouvertures au tour 1 (position initiale)
    const isOpeningTurn =
        (logEntry.turnIndex <= 1 || isInitialBoardPosition(boardBefore)) &&
        isInitialBoardPosition(boardBefore) &&
        dice[0] !== dice[1] &&
        logEntry.player === 'X';
    const openingBookEntry = isOpeningTurn
        ? getOpeningForScore(
            dice[0],
            dice[1],
            detectOpeningScoreRegime({
                matchLength: params.matchLength,
                scoreX: params.scoreX,
                scoreO: params.scoreO,
                player: logEntry.player,
                cubeValue: params.cubeValue,
                crawford: params.crawford,
            }),
        )
        : null;
    if (openingBookEntry) {
        const openingResult = analyzeHumanMoveFromLog(params);
        if (openingResult) {
            return { ...openingResult, source: 'local' };
        }
    }

    // 1. Tentative via le bgsage-service (réseau de neurones Open Sage, 3-ply niveau ultime par défaut).
    if (params.signal?.aborted) {
        return null;
    }
    const targetPly = params.ply ?? 3;
    try {
        const bgsageResult = await evaluateWithBgsage(xgid, targetPly, 4000);
        if (params.signal?.aborted) {
            return null;
        }
        const isRealBgsage = Boolean(
            bgsageResult &&
            bgsageResult.chequerPlay.length > 0 &&
            bgsageResult.source !== 'typescript-tri-phase' &&
            bgsageResult.source !== 'local',
        );

        if (isRealBgsage && bgsageResult) {
            const built = buildHumanMoveAnalysisFromBgsageResult({
                bgsageResult,
                logEntry,
                evalState,
                legalSeqs,
                boardBefore,
                effectiveBoardAfter,
                targetPly,
            });
            if (built) {
                return built;
            }
        }
    } catch (err) {
        console.warn('[Coach] bgsage-service indisponible, bascule sur l\'évaluateur local :', err);
    }

    // 2. Repli sur l'évaluateur local déterministe.
    const localResult = analyzeHumanMoveFromLog(params);
    if (!localResult) {
        return null;
    }
    return { ...localResult, source: 'local' };
}

function buildHumanMoveAnalysisFromBgsageResult(params: {
    bgsageResult: BgsageEvaluateResponse;
    logEntry: MatchLogEntry;
    evalState: BoardState;
    legalSeqs: ReturnType<typeof generateLegalMoves>;
    boardBefore: number[];
    effectiveBoardAfter: number[];
    targetPly: number;
}): (HumanMoveAnalysis & { source: 'bgsage' }) | null {
    const { bgsageResult, logEntry, evalState, legalSeqs, boardBefore, effectiveBoardAfter, targetPly } = params;
    if (!bgsageResult || bgsageResult.chequerPlay.length === 0) return null;

    const resolveBgsageCandidateSeq = (m: BgsageMove, source?: string | null) => {
        if (m.board && m.board.length === 26) {
            const engineBoard = bgsageMoveBoardToProjectBoard(m.board, logEntry.player, source);
            const matchedSeq =
                legalSeqs.find((s) => boardsMatchOnPointsAndBar(s.board, engineBoard)) ??
                legalSeqs.find((s) => boardsMatchOnPoints(s.board, engineBoard));
            if (matchedSeq) {
                return {
                    moves: matchedSeq.moves,
                    board: matchedSeq.board,
                    notation: formatCoachMoveSequence(matchedSeq.moves, logEntry.player, boardBefore),
                };
            }
        }
        if (m.moves && m.moves.length > 0) {
            let simBoard = [...boardBefore];
            for (const mv of m.moves) simBoard = applyMove(simBoard, mv, logEntry.player);
            return {
                moves: m.moves,
                board: simBoard,
                notation: formatCoachMoveSequence(m.moves, logEntry.player, boardBefore),
            };
        }
        const absNotation = relativeNotationToAbsolute(m.notation, logEntry.player);
        const matchedByNotation = legalSeqs.find((s) => {
            const seqNotation = formatCoachMoveSequence(s.moves, logEntry.player, boardBefore);
            return (
                notationsAreEquivalent(seqNotation, absNotation, logEntry.player) ||
                notationsAreEquivalent(seqNotation, m.notation, logEntry.player)
            );
        });
        if (matchedByNotation) {
            return {
                moves: matchedByNotation.moves,
                board: matchedByNotation.board,
                notation: formatCoachMoveSequence(matchedByNotation.moves, logEntry.player, boardBefore),
            };
        }
        return {
            moves: [] as Move[],
            board: null as number[] | null,
            notation: absNotation,
        };
    };

    const playedMoves = resolvePlayedMoves(logEntry);
    const playedNotation = formatCoachMoveSequence(
        [...playedMoves],
        logEntry.player,
        boardBefore,
    );
    const canonicalMoves = movesFromBoardDiff(boardBefore, effectiveBoardAfter, logEntry.player);
    const canonicalNotation = formatCoachMoveSequence(canonicalMoves, logEntry.player, boardBefore);

    const bestMove = bgsageResult.chequerPlay[0];
    const resolvedBest = resolveBgsageCandidateSeq(bestMove, bgsageResult.source);

    const matched = bgsageResult.chequerPlay.find((m) => {
        if (m.board && m.board.length === 26) {
            const engineBoard = bgsageMoveBoardToProjectBoard(
                m.board,
                logEntry.player,
                bgsageResult.source,
            );
            if (
                boardsMatchOnPointsAndBar(engineBoard, effectiveBoardAfter) ||
                boardsMatchOnPoints(engineBoard, effectiveBoardAfter)
            ) {
                return true;
            }
        }
        const resolvedCand = resolveBgsageCandidateSeq(m, bgsageResult.source);
        const absMoveNotation = relativeNotationToAbsolute(m.notation, logEntry.player);
        if (
            notationsAreEquivalent(resolvedCand.notation, playedNotation, logEntry.player) ||
            notationsAreEquivalent(resolvedCand.notation, canonicalNotation, logEntry.player) ||
            notationsAreEquivalent(absMoveNotation, playedNotation, logEntry.player) ||
            notationsAreEquivalent(absMoveNotation, canonicalNotation, logEntry.player) ||
            notationsAreEquivalent(m.notation, playedNotation, logEntry.player) ||
            notationsAreEquivalent(m.notation, canonicalNotation, logEntry.player)
        ) {
            return true;
        }
        const parsed = parseCoachNotationMoves(absMoveNotation, logEntry.player);
        if (parsed.length > 0) {
            let sim = [...boardBefore];
            for (const mv of parsed) sim = applyMove(sim, mv, logEntry.player);
            if (
                boardsMatchOnPointsAndBar(sim, effectiveBoardAfter) ||
                boardsMatchOnPoints(sim, effectiveBoardAfter)
            ) {
                return true;
            }
        }
        return false;
    });

    const optimalNotation = resolvedBest.notation;
    const bestEquity = bestMove.equity;

    let playedEquity: number;
    if (matched) {
        playedEquity = matched.equity;
    } else {
        const offList = estimateOffListEquityLoss({
            evalState,
            playedBoard: effectiveBoardAfter,
            legalSeqs,
            candidates: bgsageResult.chequerPlay,
            bestEquity,
            ply: 2,
        });
        playedEquity = bestEquity - offList.equityLoss;
    }

    const equityLoss = Math.max(0, bestEquity - playedEquity);
    const verdict = classifyVerdict(equityLoss);

    const candidateMoves = bgsageResult.chequerPlay.map((m) => {
        const resolvedCand = resolveBgsageCandidateSeq(m, bgsageResult.source);
        const isMatch = m === matched;
        return {
            notation: isMatch ? playedNotation : resolvedCand.notation,
            equity: m.equity,
            equityLoss: m.equityLoss,
            winProbability: m.probabilities?.win,
            gammonProbability: m.probabilities?.winGammon,
            backgammonProbability: m.probabilities?.winBackgammon,
        };
    });

    if (!matched && !candidateMoves.some((m) => notationsAreEquivalent(m.notation, playedNotation, logEntry.player))) {
        candidateMoves.push({
            notation: playedNotation,
            equity: playedEquity,
            equityLoss: Number((playedEquity - bestEquity).toFixed(4)),
            winProbability: undefined,
            gammonProbability: undefined,
            backgammonProbability: undefined,
        });
    }

    const bgsageInsights: BgsageStrategicInsights = {
        isRace: Boolean(bgsageResult.isRace),
        playerGamePlan: bgsageResult.gamePlans?.player ?? bestMove.playerGamePlan ?? 'contact',
        opponentGamePlan: bgsageResult.gamePlans?.opponent ?? bestMove.opponentGamePlan ?? 'contact',
        evalLevel: bestMove.evalLevel ?? `${targetPly}-ply`,
        optimalMetrics: toBgsageMoveMetrics(bestMove),
        playedMetrics: matched ? toBgsageMoveMetrics(matched) : undefined,
    };

    return {
        turnIndex: logEntry.turnIndex,
        player: logEntry.player,
        verdict,
        equityLoss,
        playedNotation,
        optimalNotation,
        playedEquity,
        bestEquity,
        isUnforced: Math.max(bgsageResult.chequerPlay.length, legalSeqs.length) > 1,
        isBlunder: verdict === 'blunder',
        optimalMoves: resolvedBest.moves.length > 0 ? resolvedBest.moves : undefined,
        bgsageInsights,
        candidateMoves,
        source: 'bgsage',
    };
}
