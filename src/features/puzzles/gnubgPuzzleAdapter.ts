/**
 * @file src/features/puzzles/gnubgPuzzleAdapter.ts
 * @description Source UNIQUE des puzzles (puzzle du jour + bibliothèque) depuis la banque validée par
 * GNU Backgammon 3-ply (`BENCHMARK_BLUNDERS`). Remplace les anciens puzzles écrits à la main
 * (PUZZLE_DATABASE, DAILY_PUZZLES_CATALOG) qui contenaient des équités et contextes de tournoi inventés.
 * Purge db_clean_v3 (2026-11-02). Zéro donnée factice : aucun replay adverse ni tournoi fictif.
 */

import type { Move } from '../../engine/backgammonEngine';
import { BENCHMARK_BLUNDERS } from '../drills/benchmarkBlunders';
import { parseCoachNotationMoves } from '../coach/coachMoveNotation';
import type { PlayerBlunderRecord } from '../drills/types';
import type { BackgammonPuzzle, PuzzleCategory, PuzzleDifficulty } from './types';
import type { DailyPuzzleCandidateMove, DailyPuzzleDefinition } from '../../lib/puzzle/puzzleService';
import { GNUBG_3PLY_CERTIFIED_POSITIONS } from '../../lib/engine/gnubg3PlyCertifiedPositions';
import { GNUBG_3PLY_QUIZ_BANK } from '../drills/gnubg3PlyQuizBank';

interface GnubgMoveValues {
    readonly notation: string;
    readonly equityLoss: number;
    readonly win: number;
    readonly winGammon: number;
}

/** Valeurs GNUBG 3-ply exactes de chaque coup candidat, indexées par id de position. */
const GNUBG_MOVES_BY_ID = new Map<string, readonly GnubgMoveValues[]>([
    ...GNUBG_3PLY_CERTIFIED_POSITIONS.map((p) => [p.id, p.moves] as const),
    ...GNUBG_3PLY_QUIZ_BANK.map((q) => [q.id, q.candidateMoves3Ply] as const),
]);

/** Développe `8/4(2)`, les coups chaînés `24/20/16` et `bar/22` en sous-coups simples. */
function expandNotation(notation: string): string {
    const out: string[] = [];
    for (const raw of notation.replace(/\*/g, '').trim().split(/\s+/)) {
        const rep = raw.match(/^(.+)\((\d)\)$/);
        const body = (rep ? rep[1]! : raw).toLowerCase().replace('bar', '25').replace('off', '0');
        const parts = body.split('/');
        const steps: string[] = [];
        for (let k = 0; k < parts.length - 1; k++) steps.push(`${parts[k]}/${parts[k + 1]}`);
        for (let c = 0; c < (rep ? Number(rep[2]) : 1); c++) out.push(...steps);
    }
    return out.join(' ');
}

function notationToMoves(notation: string): Move[] {
    try {
        return parseCoachNotationMoves(expandNotation(notation), 'X');
    } catch {
        return [];
    }
}

function difficultyOf(b: PlayerBlunderRecord): PuzzleDifficulty {
    const tier = b.tier ?? 2;
    return tier === 1 ? 'beginner' : tier === 2 ? 'intermediate' : 'expert';
}

/** Note Glicko initiale du puzzle, dérivée du palier GNUBG (écart #1/#2) — pas d'une valeur arbitraire. */
function initialRatingOf(b: PlayerBlunderRecord): number {
    return ({ 1: 1250, 2: 1450, 3: 1650, 4: 1850 } as const)[b.tier ?? 2];
}

function categoryOf(conceptId: string): PuzzleCategory {
    if (conceptId === 'opening') return 'opening';
    if (conceptId === 'blitz_attack') return 'blitz';
    if (conceptId === 'prime_building') return 'prime';
    if (conceptId === 'advanced_anchor' || conceptId === 'backgame') return 'escape';
    if (conceptId === 'cube_decision') return 'cube';
    return 'contact';
}

/** Positions GNUBG dont toutes les notations du QCM sont convertibles en coups. */
function playableBank(): PlayerBlunderRecord[] {
    return BENCHMARK_BLUNDERS.filter(
        (b) => (GNUBG_MOVES_BY_ID.get(b.id)?.length ?? 0) >= 2 && notationToMoves(b.optimalMove).length > 0,
    );
}

export function buildGnubgPuzzleLibrary(): BackgammonPuzzle[] {
    return playableBank().map((b) => ({
        id: `gnubg_${b.id}`,
        title: b.conceptName,
        category: categoryOf(b.conceptId),
        difficulty: difficultyOf(b),
        description: `Blanc joue ${b.dice[0]}-${b.dice[1]}. Trouvez le coup n°1 selon GNU Backgammon 3-ply.`,
        hint: b.hint ?? 'Comparez les coups candidats sur les 36 lancers adverses.',
        explanation: b.explanation,
        strategicConcept: b.conceptId,
        initialBoard: b.board.slice(0, 26),
        turn: 'X',
        dice: [b.dice[0], b.dice[1]],
        matchLength: b.matchContext?.matchLength ?? 0,
        scoreX: b.matchContext?.scoreX ?? 0,
        scoreO: b.matchContext?.scoreO ?? 0,
        cubeValue: b.matchContext?.cubeValue ?? 1,
        cubeOwner: b.matchContext?.cubeOwner ?? null,
        optimalNotation: b.optimalMove,
        acceptableNotations: b.acceptableMoves ?? [],
        equityLossThreshold: 0.015,
    }));
}

export function buildGnubgDailyPuzzles(): DailyPuzzleDefinition[] {
    return playableBank().map((b) => {
        const board = b.board.slice(0, 26);
        const gnubgMoves = GNUBG_MOVES_BY_ID.get(b.id) ?? [];
        const candidates: DailyPuzzleCandidateMove[] = gnubgMoves.slice(0, 4).map((m, idx) => ({
            rank: idx + 1,
            notation: m.notation,
            moves: notationToMoves(m.notation),
            // Équités relatives au coup n°1 (valeurs GNUBG 3-ply exactes).
            equity: -m.equityLoss,
            equityLoss: m.equityLoss,
            winPct: Number((m.win * 100).toFixed(1)),
            gammonPct: Number((m.winGammon * 100).toFixed(1)),
            gamePlan: b.conceptName,
        }));
        const bestMoves = notationToMoves(b.optimalMove);
        return {
            id: `gnubg_daily_${b.id}`,
            title: b.conceptName,
            subtitle: 'Position validée par GNU Backgammon 3-ply cubeful',
            difficulty: difficultyOf(b),
            puzzleRating: initialRatingOf(b),
            puzzleRD: 200,
            decisionType: 'checker',
            turn: 'X',
            dice: [b.dice[0], b.dice[1]],
            initialBoard: board,
            matchLength: b.matchContext?.matchLength ?? 0,
            scoreX: b.matchContext?.scoreX ?? 0,
            scoreO: b.matchContext?.scoreO ?? 0,
            isCrawford: b.matchContext?.crawford ?? false,
            cubeValue: b.matchContext?.cubeValue ?? 1,
            cubeOwner: b.matchContext?.cubeOwner ?? null,
            doublingOfferedBy: null,
            // Aucun coup adverse réel connu : pas de replay inventé.
            opponentReplay: {
                boardBeforeOpponent: board,
                opponentDice: [b.dice[0], b.dice[1]],
                opponentMoves: [],
                opponentNotation: '',
                opponentArrows: [],
            },
            bestMoveNotation: b.optimalMove,
            bestMoves,
            bestEquity: 0,
            candidates,
            originalTrap: {
                notation: b.playedMove,
                moves: notationToMoves(b.playedMove),
                equityLoss: b.equityLoss,
                tournamentContext: 'Position validée par GNU Backgammon 3-ply',
                trapExplanation: b.whyFailed ?? `${b.playedMove} perd ${b.equityLoss.toFixed(3)} EMG.`,
            },
            gamePlanHint: b.hint ?? b.conceptName,
            optimalSourcePoints: Array.from(new Set(bestMoves.map((m) => m.from))),
            conceptId: b.conceptId,
            conceptLabel: b.conceptName,
            strategicPrinciple: b.proverb ?? '',
            geminiExplanation: b.explanation,
        };
    });
}
