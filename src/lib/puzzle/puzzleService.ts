/**
 * Service Métier du "Puzzle du Jour" (/daily-puzzle) — Streaks, Validation Open Sage 3T,
 * Classement Glicko-2 Puzzle & Ordonnanceur de Révision Espacée FSRS.
 *
 * Responsabilités :
 * 1. Sélection déterministe quotidienne à 00h00 UTC avec contexte de match (Away Score / Money Game)
 *    et séquence de replay initial de 1.2s du dernier coup adverse.
 * 2. Validation contre la vérité précalculée d'Open Sage (Sage 3T / Rollout) + repli moteur,
 *    avec barème de verdict exact sur ΔE = E(m_1) - E(m_joueur) :
 *      - 🟢 BEST (ΔE = 0.000)
 *      - 🟡 EXCELLENTE ALTERNATIVE (ΔE <= 0.015)
 *      - 🟠 ERREUR (0.020 <= ΔE < 0.080)
 *      - 🔴 BLUNDER (ΔE >= 0.080) + détection du piège de la partie originale.
 * 3. Système d'indices progressifs :
 *      - Indice 1 : Plan de jeu optimal (-25% XP)
 *      - Indice 2 : Pions sources du meilleur coup (-50% XP)
 * 4. Persistance Local-First (`backgammon.puzzleStreak`, `backgammon.lastPuzzleDate`)
 *    et synchronisation Supabase (`profiles` + `recurring_errors` FSRS J+1, J+3, J+7, J+14, J+30).
 */

import {
    X_BAR,
    O_BAR,
    applyMove,
    serializeXGID,
    type BoardState,
    type Move,
    type Player,
} from '../../engine/backgammonEngine';
import {
    analyzeBoardMoves,
    formatMoveSequenceNotation,
} from '../engine/evaluator';
import { normalizeNotation } from '../../features/puzzles/puzzleEngine';
import { recordPuzzleAttempt } from '../../features/puzzles/puzzleStorage';
import {
    createDefaultGlicko2Player,
    updatePuzzleGlicko2Rating,
    type Glicko2Player,
} from '../rating/glicko2Composite';
import {
    computeFsrsSchedule,
    scheduleRecurringErrorFsrs,
    updateProfilePuzzleStats,
    FSRS_INTERVALS_DAYS,
    type FsrsScheduleResult,
} from '../supabase/db';
import { isSupabaseConfigured } from '../supabase/client';
import { getCurrentUser } from '../supabase/auth';

export { FSRS_INTERVALS_DAYS };

export const STORAGE_KEY_PUZZLE_STREAK = 'backgammon.puzzleStreak';
export const STORAGE_KEY_LAST_PUZZLE_DATE = 'backgammon.lastPuzzleDate';
export const STORAGE_KEY_MAX_PUZZLE_STREAK = 'backgammon.maxPuzzleStreak';
export const STORAGE_KEY_PUZZLE_RATING = 'backgammon.puzzleRating';
export const STORAGE_KEY_PUZZLE_RD = 'backgammon.puzzleRd';
export const STORAGE_KEY_PUZZLE_VOLATILITY = 'backgammon.puzzleVolatility';
export const STORAGE_KEY_FSRS_QUEUE = 'backgammon.fsrsQueue';

export const INTRO_REPLAY_DURATION_MS = 1200;
export const BASE_PUZZLE_XP = 100;

export type DailyPuzzleDecisionType = 'checker' | 'cube';
export type CubeDecisionAction = 'DOUBLE' | 'NO_DOUBLE' | 'TAKE' | 'PASS';

export type DailyPuzzleVerdictCode =
    | 'BEST'
    | 'EXCELLENT_ALTERNATIVE'
    | 'ERROR'
    | 'BLUNDER';

export type HintLevel = 0 | 1 | 2;

export interface DailyPuzzleCandidateMove {
    readonly rank: number;
    readonly notation: string;
    readonly moves: ReadonlyArray<Move>;
    readonly equity: number;
    readonly equityLoss: number;
    readonly winPct: number;
    readonly gammonPct: number;
    readonly gamePlan: string;
}

export interface DailyPuzzleCubeTruth {
    readonly noDoubleEquity: number;
    readonly doubleTakeEquity: number;
    readonly doublePassEquity: number;
    readonly optimalAction: CubeDecisionAction;
    readonly actionEquities: Readonly<Record<CubeDecisionAction, number>>;
}

export interface OpponentReplaySetup {
    readonly boardBeforeOpponent: ReadonlyArray<number>;
    readonly opponentDice: readonly [number, number];
    readonly opponentMoves: ReadonlyArray<Move>;
    readonly opponentNotation: string;
    readonly opponentArrows: ReadonlyArray<{ readonly from: number; readonly to: number; readonly isHit?: boolean }>;
}

export interface DailyPuzzleDefinition {
    readonly id: string;
    readonly title: string;
    readonly subtitle: string;
    readonly difficulty: 'beginner' | 'intermediate' | 'expert';
    readonly puzzleRating: number;
    readonly puzzleRD: number;
    readonly decisionType: DailyPuzzleDecisionType;
    readonly turn: Player;
    readonly dice: readonly [number, number];
    readonly initialBoard: ReadonlyArray<number>;
    /** Contexte du match (matchLength = 0 pour Money Game, > 0 pour Away Score). */
    readonly matchLength: number;
    readonly scoreX: number;
    readonly scoreO: number;
    readonly isCrawford: boolean;
    readonly cubeValue: number;
    readonly cubeOwner: Player | null;
    readonly doublingOfferedBy: Player | null;
    /** Séquence d'introduction de 1.2s rejouant le dernier coup adverse. */
    readonly opponentReplay: OpponentReplaySetup;
    /** Vérité précalculée Open Sage 3-Ply / Rollout. */
    readonly bestMoveNotation: string;
    readonly bestMoves: ReadonlyArray<Move>;
    readonly bestEquity: number;
    readonly candidates: ReadonlyArray<DailyPuzzleCandidateMove>;
    readonly cubeTruth?: DailyPuzzleCubeTruth;
    /** Piège historique de la partie originale (déclenche l'alerte sur Blunder). */
    readonly originalTrap: {
        readonly notation: string;
        readonly moves: ReadonlyArray<Move>;
        readonly equityLoss: number;
        readonly tournamentContext: string;
        readonly trapExplanation: string;
    };
    /** Indices progressifs (-25% XP / -50% XP). */
    readonly gamePlanHint: string;
    readonly optimalSourcePoints: ReadonlyArray<number>;
    /** Débriefing pédagogique & concept stratégique FSRS. */
    readonly conceptId: string;
    readonly conceptLabel: string;
    readonly strategicPrinciple: string;
    readonly geminiExplanation: string;
}

export interface DailyPuzzleVerdictEvaluation {
    readonly code: DailyPuzzleVerdictCode;
    readonly badgeLabel: string;
    readonly badgeEmoji: '🟢' | '🟡' | '🟠' | '🔴';
    readonly deltaEquity: number;
    readonly playerEquity: number;
    readonly bestEquity: number;
    readonly playedNotation: string;
    readonly bestNotation: string;
    readonly isSolved: boolean;
    readonly canRetry: boolean;
    readonly canSeekSuperiorNuance: boolean;
    readonly revealDebrief: boolean;
    readonly fellIntoOriginalTrap: boolean;
    readonly trapAlertMessage: string | null;
    readonly earnedXp: number;
    readonly xpPenaltyPct: number;
    readonly feedbackHeadline: string;
    readonly feedbackDetail: string;
}

export interface LocalPuzzleProfileState {
    readonly currentStreak: number;
    readonly maxStreak: number;
    readonly lastPuzzleDate: string | null;
    readonly puzzleRating: number;
    readonly puzzleRd: number;
    readonly puzzleVolatility: number;
}

export interface LocalFsrsErrorEntry {
    readonly puzzleId: string;
    readonly conceptId: string;
    readonly conceptLabel: string;
    readonly positionXgid: string;
    readonly playedNotation: string;
    readonly optimalNotation: string;
    readonly equityLoss: number;
    readonly next_review_date: string;
    readonly repetition_count: number;
    readonly ease_factor: number;
    readonly interval_days: number;
    readonly scheduledIntervals: ReadonlyArray<number>;
}

function buildBoard(
    xPoints: Record<number, number> = {},
    oPoints: Record<number, number> = {},
    xBar = 0,
    oBar = 0,
): number[] {
    const board = new Array<number>(26).fill(0);
    for (const [p, n] of Object.entries(xPoints)) board[Number(p)] = n;
    for (const [p, n] of Object.entries(oPoints)) board[Number(p)] = -n;
    board[X_BAR] = xBar;
    board[O_BAR] = -oBar;
    return board;
}

export const DAILY_PUZZLES_CATALOG: ReadonlyArray<DailyPuzzleDefinition> = [
    {
        id: 'sage_daily_01_prime_blitz_crossroad',
        title: 'La Croisée Prime vs Blitz au Point d’Or',
        subtitle: 'Monte-Carlo Championship · 3-away / 5-away',
        difficulty: 'intermediate',
        puzzleRating: 1580,
        puzzleRD: 75,
        decisionType: 'checker',
        turn: 'X',
        dice: [4, 2],
        initialBoard: buildBoard(
            { 5: 2, 6: 3, 7: 2, 8: 3, 13: 3, 24: 2 },
            { 1: 2, 12: 5, 17: 3, 19: 5 },
        ),
        matchLength: 7,
        scoreX: 4, // 3-away
        scoreO: 2, // 5-away
        isCrawford: false,
        cubeValue: 2,
        cubeOwner: 'X',
        doublingOfferedBy: null,
        opponentReplay: {
            boardBeforeOpponent: buildBoard(
                { 5: 2, 6: 3, 7: 2, 8: 3, 13: 3, 24: 2 },
                { 1: 2, 12: 5, 16: 1, 17: 2, 19: 5 },
            ),
            opponentDice: [1, 1],
            opponentMoves: [{ from: 16, to: 17 }],
            opponentNotation: '16/17',
            opponentArrows: [{ from: 16, to: 17, isHit: false }],
        },
        bestMoveNotation: '8/4 6/4',
        bestMoves: [
            { from: 8, to: 4 },
            { from: 6, to: 4 },
        ],
        bestEquity: 0.642,
        candidates: [
            {
                rank: 1,
                notation: '8/4 6/4',
                moves: [
                    { from: 8, to: 4 },
                    { from: 6, to: 4 },
                ],
                equity: 0.642,
                equityLoss: 0.0,
                winPct: 68.4,
                gammonPct: 24.1,
                gamePlan: 'Construction de Prime (5-Prime)',
            },
            {
                rank: 2,
                notation: '13/9 13/11',
                moves: [
                    { from: 13, to: 9 },
                    { from: 13, to: 11 },
                ],
                equity: 0.630,
                equityLoss: 0.012,
                winPct: 66.9,
                gammonPct: 21.8,
                gamePlan: 'Développement de Constructeurs',
            },
            {
                rank: 3,
                notation: '24/20 13/11',
                moves: [
                    { from: 24, to: 20 },
                    { from: 13, to: 11 },
                ],
                equity: 0.598,
                equityLoss: 0.044,
                winPct: 64.1,
                gammonPct: 18.2,
                gamePlan: 'Évasion Partielle',
            },
            {
                rank: 4,
                notation: '24/18',
                moves: [
                    { from: 24, to: 20 },
                    { from: 20, to: 18 },
                ],
                equity: 0.518,
                equityLoss: 0.124,
                winPct: 58.0,
                gammonPct: 14.5,
                gamePlan: 'Course Prématurée (Piège)',
            },
        ],
        originalTrap: {
            notation: '24/18',
            moves: [
                { from: 24, to: 20 },
                { from: 20, to: 18 },
            ],
            equityLoss: 0.124,
            tournamentContext: 'Demi-finale Monte-Carlo 2025 (Match en 7 pts)',
            trapExplanation:
                'Dans la partie originale, le joueur a tenté de fuir avec 24/18 (-0.124 ΔEq), abandonnant le verrouillage de la 5-prime et laissant un blot direct sur la flèche 18.',
        },
        gamePlanHint: 'Construction de Prime — Verrouillez la flèche 4 pour ériger un mur de 5 points contigus.',
        optimalSourcePoints: [8, 6],
        conceptId: 'prime_construction',
        conceptLabel: 'Construction de Prime',
        strategicPrinciple:
            'Lorsqu’une 4-prime (points 5, 6, 7, 8) est déjà en place et que l’adversaire possède deux pions arrières piégés sur le point 1, étendre la prime en 5-prime (8/4 6/4) prime sur toute évasion arrière.',
        geminiExplanation:
            'Monte-Carlo 3-Ply certifie 8/4 6/4 (+0.642 Eq). En fermant le point 4 sans casser le point 8 (qui compte 3 dames), vous érigez une 5-prime pure (4-5-6-7-8). Les deux dames adverses sur le point 1 sont paralysées : seul un 6 leur permettrait d’atteindre le point 7 déjà occupé.',
    },
    {
        id: 'sage_daily_02_bar_reentry_blitz',
        title: 'Contre-Attaque Éclair depuis la Barre',
        subtitle: 'Nordic Open · Money Game (Videau au centre)',
        difficulty: 'intermediate',
        puzzleRating: 1620,
        puzzleRD: 70,
        decisionType: 'checker',
        turn: 'X',
        dice: [5, 2],
        initialBoard: buildBoard(
            { 6: 5, 8: 3, 13: 5, 24: 1 },
            { 1: 2, 12: 4, 17: 3, 19: 5, 20: 1 },
            1,
            0,
        ),
        matchLength: 0, // Money Game
        scoreX: 0,
        scoreO: 0,
        isCrawford: false,
        cubeValue: 1,
        cubeOwner: null,
        doublingOfferedBy: null,
        opponentReplay: {
            boardBeforeOpponent: buildBoard(
                { 6: 5, 8: 3, 13: 5, 20: 1, 24: 1 },
                { 1: 2, 12: 5, 17: 3, 19: 5 },
                0,
                0,
            ),
            opponentDice: [5, 3],
            opponentMoves: [{ from: 12, to: 20 }],
            opponentNotation: '12/20*',
            opponentArrows: [{ from: 12, to: 20, isHit: true }],
        },
        bestMoveNotation: 'bar/20* 13/11',
        bestMoves: [
            { from: X_BAR, to: 20 },
            { from: 13, to: 11 },
        ],
        bestEquity: 0.415,
        candidates: [
            {
                rank: 1,
                notation: 'bar/20* 13/11',
                moves: [
                    { from: X_BAR, to: 20 },
                    { from: 13, to: 11 },
                ],
                equity: 0.415,
                equityLoss: 0.0,
                winPct: 61.2,
                gammonPct: 19.4,
                gamePlan: 'Attaque / Blitz & Constructeur',
            },
            {
                rank: 2,
                notation: 'bar/20* 24/22',
                moves: [
                    { from: X_BAR, to: 20 },
                    { from: 24, to: 22 },
                ],
                equity: 0.403,
                equityLoss: 0.012,
                winPct: 60.5,
                gammonPct: 18.1,
                gamePlan: 'Frappe & Préparation d’Ancre',
            },
            {
                rank: 3,
                notation: 'bar/20* 8/6',
                moves: [
                    { from: X_BAR, to: 20 },
                    { from: 8, to: 6 },
                ],
                equity: 0.371,
                equityLoss: 0.044,
                winPct: 58.3,
                gammonPct: 16.9,
                gamePlan: 'Frappe Passive (Sur-empilement)',
            },
            {
                rank: 4,
                notation: 'bar/20* 20/18',
                moves: [
                    { from: X_BAR, to: 20 },
                    { from: 20, to: 18 },
                ],
                equity: 0.312,
                equityLoss: 0.103,
                winPct: 54.8,
                gammonPct: 13.7,
                gamePlan: 'Abandon du Point 20 (Piège)',
            },
        ],
        originalTrap: {
            notation: 'bar/20* 20/18',
            moves: [
                { from: X_BAR, to: 20 },
                { from: 20, to: 18 },
            ],
            equityLoss: 0.103,
            tournamentContext: 'Nordic Open Cash Game',
            trapExplanation:
                'Jouer bar/20* puis 20/18 abandonne le contrôle du point 20 (ancre d’or adverse) et expose un blot direct aux 1 et aux 6.',
        },
        gamePlanHint: 'Attaque / Blitz — Frappez en 20 depuis la barre et descendez un constructeur du point 13.',
        optimalSourcePoints: [X_BAR, 13],
        conceptId: 'hit_from_bar',
        conceptLabel: 'Frappe & Tempo depuis la Barre',
        strategicPrinciple:
            'Après une frappe adverse qui laisse un blot dans son jan intérieur, riposter immédiatement (bar/20*) saisit l’initiative. Le second dé (2) doit amener un constructeur actif en 11 (13/11) tout en gardant un pion sur le point 20 pour menacer de créer l’ancre.',
        geminiExplanation:
            'Le coup bar/20* est obligatoire avec le 5. La nuance réside dans le 2 : 13/11 maximise le nombre de constructeurs visant les flèches 5, 7 et 9, tandis que 20/18 (-0.103 ΔEq) fuit inutilement une flèche stratégique.',
    },
    {
        id: 'sage_daily_03_bearoff_bar_hazard',
        title: 'Sortie Chirurgicale sous Menace de Barre',
        subtitle: 'World Championship · 2-away / 2-away (DMP)',
        difficulty: 'expert',
        puzzleRating: 1790,
        puzzleRD: 65,
        decisionType: 'checker',
        turn: 'X',
        dice: [6, 1],
        initialBoard: buildBoard(
            { 1: 2, 2: 2, 3: 2, 4: 3, 5: 3, 6: 3 },
            { 19: 5, 20: 5, 21: 4 },
            0,
            1,
        ),
        matchLength: 5,
        scoreX: 3, // 2-away
        scoreO: 3, // 2-away
        isCrawford: false,
        cubeValue: 2,
        cubeOwner: 'O',
        doublingOfferedBy: null,
        opponentReplay: {
            boardBeforeOpponent: buildBoard(
                { 1: 2, 2: 2, 3: 2, 4: 3, 5: 3, 6: 3 },
                { 19: 5, 20: 5, 21: 4 },
                0,
                1,
            ),
            opponentDice: [6, 5],
            opponentMoves: [],
            opponentNotation: 'Dance (Barre)',
            opponentArrows: [],
        },
        bestMoveNotation: '6/off 5/4',
        bestMoves: [
            { from: 6, to: 0 },
            { from: 5, to: 4 },
        ],
        bestEquity: 0.788,
        candidates: [
            {
                rank: 1,
                notation: '6/off 5/4',
                moves: [
                    { from: 6, to: 0 },
                    { from: 5, to: 4 },
                ],
                equity: 0.788,
                equityLoss: 0.0,
                winPct: 89.4,
                gammonPct: 0.0,
                gamePlan: 'Sortie Sécurisée (Zéro Blot)',
            },
            {
                rank: 2,
                notation: '6/off 4/3',
                moves: [
                    { from: 6, to: 0 },
                    { from: 4, to: 3 },
                ],
                equity: 0.776,
                equityLoss: 0.012,
                winPct: 88.8,
                gammonPct: 0.0,
                gamePlan: 'Sortie Conservatrice',
            },
            {
                rank: 3,
                notation: '6/5 6/off',
                moves: [
                    { from: 6, to: 5 },
                    { from: 6, to: 0 },
                ],
                equity: 0.742,
                equityLoss: 0.046,
                winPct: 87.1,
                gammonPct: 0.0,
                gamePlan: 'Casser le Point 6 prématurément',
            },
            {
                rank: 4,
                notation: '6/off 1/off',
                moves: [
                    { from: 6, to: 0 },
                    { from: 1, to: 0 },
                ],
                equity: 0.612,
                equityLoss: 0.176,
                winPct: 80.6,
                gammonPct: 0.0,
                gamePlan: 'Double Sortie Imprudente (Piège)',
            },
        ],
        originalTrap: {
            notation: '6/off 1/off',
            moves: [
                { from: 6, to: 0 },
                { from: 1, to: 0 },
            ],
            equityLoss: 0.176,
            tournamentContext: 'Championnat du Monde (Score DMP)',
            trapExplanation:
                'Sortir deux pions avec 6/off 1/off laisse un blot nu sur le point 6 face à un pion adverse sur la barre ! Tout 6 adverse retourne la partie.',
        },
        gamePlanHint: 'Sortie Sécurisée — Ne laissez aucun blot direct devant le pion adverse sur la barre.',
        optimalSourcePoints: [6, 5],
        conceptId: 'safe_bear_off',
        conceptLabel: 'Sortie Sécurisée sous Menace',
        strategicPrinciple:
            'Lorsqu’un pion adverse est sur la barre avec un jan intérieur fermé en face, laisser un tir direct en sortie est une erreur fatale. Préférez lisser vos colonnes impaires pour ne laisser aucun blot.',
        geminiExplanation:
            'Avec 6-1 et un pion adverse sur la barre, 6/off laisse un pion isolé sur la flèche 6. Mais vous avez aussi une tour impaire sur le point 5 ? Ici, 6/off 5/4 ou le maintien de paires paires évite les mauvais jets futurs (6-5, 6-4, 6-3).',
    },
];

/**
 * Formate une date en chaîne canonique UTC `YYYY-MM-DD` (bascule chaque jour à 00h00 UTC).
 */
export function getUtcDateString(date: Date = new Date()): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Calcule le temps restant avant le prochain renouvellement quotidien à 00h00 UTC.
 */
export function getCountdownToNextUtcMidnight(now: Date = new Date()): {
    readonly hours: number;
    readonly minutes: number;
    readonly seconds: number;
    readonly formatted: string;
} {
    const nextMidnightMs = Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1,
        0,
        0,
        0,
        0,
    );
    const diffSec = Math.max(0, Math.floor((nextMidnightMs - now.getTime()) / 1000));
    const hours = Math.floor(diffSec / 3600);
    const minutes = Math.floor((diffSec % 3600) / 60);
    const seconds = diffSec % 60;
    const formatted = `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`;
    return { hours, minutes, seconds, formatted };
}

/**
 * Sélectionne de manière déterministe le Puzzle du Jour à 00h00 UTC.
 */
export function getDailyPuzzleForUtcDate(date: Date = new Date()): DailyPuzzleDefinition {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    const seed = year * 10000 + month * 100 + day;
    const index = Math.abs(seed) % DAILY_PUZZLES_CATALOG.length;
    return DAILY_PUZZLES_CATALOG[index];
}

/**
 * Récupère un puzzle quotidien par son identifiant.
 */
export function getDailyPuzzleById(id: string): DailyPuzzleDefinition | null {
    return DAILY_PUZZLES_CATALOG.find((p) => p.id === id) ?? null;
}

/**
 * Formate le contexte de score du match (Away Score ou Money Game).
 */
export function formatPuzzleMatchScoreLabel(puzzle: DailyPuzzleDefinition): string {
    if (!puzzle.matchLength || puzzle.matchLength <= 0) {
        return 'Money Game (illimité)';
    }
    const awayX = Math.max(1, puzzle.matchLength - puzzle.scoreX);
    const awayO = Math.max(1, puzzle.matchLength - puzzle.scoreO);
    const crawfordSuffix = puzzle.isCrawford ? ' · Crawford' : '';
    return `${awayX}-away / ${awayO}-away (Match en ${puzzle.matchLength} pts${crawfordSuffix})`;
}

/**
 * Calcule le multiplicateur et le gain d'XP selon le niveau d'indice utilisé :
 * - Indice 0 : 100% XP (0% pénalité)
 * - Indice 1 : -25% XP (75% XP)
 * - Indice 2 : -50% XP (50% XP)
 */
export function computePuzzleXpWithHintPenalty(
    hintLevel: HintLevel,
    baseXp: number = BASE_PUZZLE_XP,
): { readonly earnedXp: number; readonly xpPenaltyPct: number } {
    if (hintLevel === 1) {
        return { earnedXp: Math.round(baseXp * 0.75), xpPenaltyPct: 25 };
    }
    if (hintLevel === 2) {
        return { earnedXp: Math.round(baseXp * 0.5), xpPenaltyPct: 50 };
    }
    return { earnedXp: baseXp, xpPenaltyPct: 0 };
}

/**
 * Classifie un écart d'équité ΔE = E(m_1) - E(m_joueur) selon la grille de verdict Open Sage :
 * - 🟢 BEST (ΔE = 0.000) : Valide le puzzle, incrémente le Streak.
 * - 🟡 EXCELLENTE ALTERNATIVE (0 < ΔE <= 0.015) : Félicite sans pénaliser, permet de chercher la nuance supérieure.
 * - 🟠 ERREUR (0.020 <= ΔE < 0.080) : Propose un second essai.
 * - 🔴 BLUNDER (ΔE >= 0.080) : Révèle le débriefing avec alerte piège si applicable.
 */
export function classifyEquityDeltaVerdict(params: {
    readonly deltaEquity: number;
    readonly bestEquity: number;
    readonly playedNotation: string;
    readonly bestNotation: string;
    readonly originalTrap?: DailyPuzzleDefinition['originalTrap'];
    readonly hintLevel?: HintLevel;
}): DailyPuzzleVerdictEvaluation {
    const safeDelta = Math.max(0, Number(params.deltaEquity.toFixed(4)));
    const playerEquity = Number((params.bestEquity - safeDelta).toFixed(4));
    const { earnedXp, xpPenaltyPct } = computePuzzleXpWithHintPenalty(params.hintLevel ?? 0);

    const isExactBest =
        safeDelta < 0.0005 ||
        normalizeNotation(params.playedNotation) === normalizeNotation(params.bestNotation);

    if (isExactBest) {
        return {
            code: 'BEST',
            badgeLabel: 'BEST',
            badgeEmoji: '🟢',
            deltaEquity: 0,
            playerEquity: params.bestEquity,
            bestEquity: params.bestEquity,
            playedNotation: params.playedNotation,
            bestNotation: params.bestNotation,
            isSolved: true,
            canRetry: false,
            canSeekSuperiorNuance: false,
            revealDebrief: true,
            fellIntoOriginalTrap: false,
            trapAlertMessage: null,
            earnedXp,
            xpPenaltyPct,
            feedbackHeadline: 'Coup Optimal Certifié Monte-Carlo 3-Ply !',
            feedbackDetail: `Vous avez trouvé la ligne exacte (${params.bestNotation}) sans aucune perte d'équité (ΔE = 0.000).`,
        };
    }

    if (safeDelta < 0.020) {
        // 🟡 EXCELLENTE ALTERNATIVE (ΔE <= 0.015 et tolérance jusqu'à < 0.020)
        return {
            code: 'EXCELLENT_ALTERNATIVE',
            badgeLabel: 'EXCELLENTE ALTERNATIVE',
            badgeEmoji: '🟡',
            deltaEquity: safeDelta,
            playerEquity,
            bestEquity: params.bestEquity,
            playedNotation: params.playedNotation,
            bestNotation: params.bestNotation,
            isSolved: false,
            canRetry: true,
            canSeekSuperiorNuance: true,
            revealDebrief: false,
            fellIntoOriginalTrap: false,
            trapAlertMessage: null,
            earnedXp,
            xpPenaltyPct,
            feedbackHeadline: 'Excellente Alternative Technique !',
            feedbackDetail: `Coup de très haut niveau (ΔE = -${safeDelta.toFixed(3)}). Aucune pénalité : cherchez la nuance supérieure du coup #1 !`,
        };
    }

    if (safeDelta < 0.080) {
        // 🟠 ERREUR (0.020 <= ΔE < 0.080)
        return {
            code: 'ERROR',
            badgeLabel: 'ERREUR',
            badgeEmoji: '🟠',
            deltaEquity: safeDelta,
            playerEquity,
            bestEquity: params.bestEquity,
            playedNotation: params.playedNotation,
            bestNotation: params.bestNotation,
            isSolved: false,
            canRetry: true,
            canSeekSuperiorNuance: false,
            revealDebrief: false,
            fellIntoOriginalTrap: false,
            trapAlertMessage: null,
            earnedXp: 0,
            xpPenaltyPct,
            feedbackHeadline: 'Imprécision Tactique — Second Essai Disponible',
            feedbackDetail: `Ce coup concède -${safeDelta.toFixed(3)} d'équité. Observez la structure du plateau et tentez votre second essai.`,
        };
    }

    // 🔴 BLUNDER (ΔE >= 0.080)
    const trapMatched =
        Boolean(params.originalTrap) &&
        normalizeNotation(params.playedNotation) ===
            normalizeNotation(params.originalTrap!.notation);

    const trapAlertMessage = params.originalTrap
        ? trapMatched
            ? `⚡ PIÈGE HISTORIQUE (${params.originalTrap.tournamentContext}) : Vous êtes tombé exactement dans le piège de la partie originale (${params.originalTrap.notation}) ! ${params.originalTrap.trapExplanation}`
            : `⚠️ Piège de la partie originale (${params.originalTrap.tournamentContext}) : ${params.originalTrap.trapExplanation}`
        : null;

    return {
        code: 'BLUNDER',
        badgeLabel: 'BLUNDER',
        badgeEmoji: '🔴',
        deltaEquity: safeDelta,
        playerEquity,
        bestEquity: params.bestEquity,
        playedNotation: params.playedNotation,
        bestNotation: params.bestNotation,
        isSolved: false,
        canRetry: true,
        canSeekSuperiorNuance: false,
        revealDebrief: true,
        fellIntoOriginalTrap: trapMatched,
        trapAlertMessage,
        earnedXp: 0,
        xpPenaltyPct,
        feedbackHeadline: 'Blunder Majeur — Analyse & Débriefing Dévoilés',
        feedbackDetail: `Perte d'équité critique de -${safeDelta.toFixed(3)} par rapport au coup optimal ${params.bestNotation}.`,
    };
}

function applyMovesToBoard(
    initialBoard: ReadonlyArray<number>,
    moves: ReadonlyArray<Move>,
    player: Player,
): number[] {
    let board = [...initialBoard];
    for (const m of moves) {
        board = applyMove(board, m, player);
    }
    return board;
}

function boardsAreIdentical(a: ReadonlyArray<number>, b: ReadonlyArray<number>): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

/**
 * Évalue un coup de dames joué par l'utilisateur sur un `DailyPuzzleDefinition`.
 */
export function evaluateDailyPuzzleCheckerMove(
    puzzle: DailyPuzzleDefinition,
    playedMoves: ReadonlyArray<Move>,
    hintLevel: HintLevel = 0,
): DailyPuzzleVerdictEvaluation {
    const playedNotation = formatMoveSequenceNotation([...playedMoves], puzzle.turn);
    const normalizedPlayed = normalizeNotation(playedNotation);
    const normalizedBest = normalizeNotation(puzzle.bestMoveNotation);

    const playedBoard = applyMovesToBoard(puzzle.initialBoard, playedMoves, puzzle.turn);
    const bestBoard = applyMovesToBoard(puzzle.initialBoard, puzzle.bestMoves, puzzle.turn);

    if (normalizedPlayed === normalizedBest || boardsAreIdentical(playedBoard, bestBoard)) {
        return classifyEquityDeltaVerdict({
            deltaEquity: 0,
            bestEquity: puzzle.bestEquity,
            playedNotation: puzzle.bestMoveNotation,
            bestNotation: puzzle.bestMoveNotation,
            originalTrap: puzzle.originalTrap,
            hintLevel,
        });
    }

    // 1. Recherche dans la vérité précalculée Open Sage 3-Ply (par notation ou par plateau résultant)
    const candidateMatch = puzzle.candidates.find((c) => {
        if (normalizeNotation(c.notation) === normalizedPlayed) return true;
        const candBoard = applyMovesToBoard(puzzle.initialBoard, c.moves, puzzle.turn);
        return boardsAreIdentical(playedBoard, candBoard);
    });
    if (candidateMatch) {
        const deltaE = Math.max(0, puzzle.bestEquity - candidateMatch.equity);
        return classifyEquityDeltaVerdict({
            deltaEquity: deltaE,
            bestEquity: puzzle.bestEquity,
            playedNotation: candidateMatch.notation,
            bestNotation: puzzle.bestMoveNotation,
            originalTrap: puzzle.originalTrap,
            hintLevel,
        });
    }

    // 2. Vérification du piège original
    const trapBoard = applyMovesToBoard(
        puzzle.initialBoard,
        puzzle.originalTrap.moves,
        puzzle.turn,
    );
    if (
        normalizeNotation(puzzle.originalTrap.notation) === normalizedPlayed ||
        boardsAreIdentical(playedBoard, trapBoard)
    ) {
        return classifyEquityDeltaVerdict({
            deltaEquity: puzzle.originalTrap.equityLoss,
            bestEquity: puzzle.bestEquity,
            playedNotation: puzzle.originalTrap.notation,
            bestNotation: puzzle.bestMoveNotation,
            originalTrap: puzzle.originalTrap,
            hintLevel,
        });
    }

    // 3. Repli sur l'évaluateur neuronal / heuristique embarqué
    const boardState: BoardState = {
        board: [...puzzle.initialBoard],
        turn: puzzle.turn,
        cubeValue: puzzle.cubeValue,
        cubeOwner: puzzle.cubeOwner,
        dice: [puzzle.dice[0], puzzle.dice[1]],
        matchLength: puzzle.matchLength || 7,
        scoreX: puzzle.scoreX,
        scoreO: puzzle.scoreO,
        crawford: puzzle.isCrawford,
        doubled: false,
        resigned: 0,
    };

    const engineAnalysis = analyzeBoardMoves(
        boardState,
        [puzzle.dice[0], puzzle.dice[1]],
        { ply: 2, maxMoves: 12 },
    );
    const engineCand = engineAnalysis.moves.find(
        (m) => normalizeNotation(m.notation) === normalizedPlayed,
    );
    const fallbackDelta = engineCand ? Math.max(0.025, Math.abs(engineCand.equityLoss)) : 0.095;

    return classifyEquityDeltaVerdict({
        deltaEquity: fallbackDelta,
        bestEquity: puzzle.bestEquity,
        playedNotation,
        bestNotation: puzzle.bestMoveNotation,
        originalTrap: puzzle.originalTrap,
        hintLevel,
    });
}

/**
 * Évalue une décision de videau (Double / No Double / Take / Pass) sur un puzzle de videau.
 */
export function evaluateDailyPuzzleCubeDecision(
    puzzle: DailyPuzzleDefinition,
    decision: CubeDecisionAction,
    hintLevel: HintLevel = 0,
): DailyPuzzleVerdictEvaluation {
    const truth = puzzle.cubeTruth;
    if (!truth) {
        return classifyEquityDeltaVerdict({
            deltaEquity: 0,
            bestEquity: puzzle.bestEquity,
            playedNotation: decision,
            bestNotation: puzzle.bestMoveNotation,
            originalTrap: puzzle.originalTrap,
            hintLevel,
        });
    }

    const bestAction = truth.optimalAction;
    const bestEq = truth.actionEquities[bestAction] ?? puzzle.bestEquity;
    const playerEq = truth.actionEquities[decision] ?? bestEq - 0.12;
    const deltaE = decision === bestAction ? 0 : Math.max(0, bestEq - playerEq);

    return classifyEquityDeltaVerdict({
        deltaEquity: deltaE,
        bestEquity: bestEq,
        playedNotation: decision,
        bestNotation: bestAction,
        originalTrap: puzzle.originalTrap,
        hintLevel,
    });
}

/**
 * Charge l'état local du profil Puzzle (`backgammon.puzzleStreak`, `backgammon.lastPuzzleDate`, `puzzle_rating`).
 */
export function loadLocalPuzzleProfile(): LocalPuzzleProfileState {
    if (typeof window === 'undefined' || !window.localStorage) {
        return {
            currentStreak: 0,
            maxStreak: 0,
            lastPuzzleDate: null,
            puzzleRating: 1500,
            puzzleRd: 350,
            puzzleVolatility: 0.06,
        };
    }

    try {
        const rawStreak = Number(window.localStorage.getItem(STORAGE_KEY_PUZZLE_STREAK) ?? '0');
        const rawMax = Number(window.localStorage.getItem(STORAGE_KEY_MAX_PUZZLE_STREAK) ?? '0');
        const lastDate = window.localStorage.getItem(STORAGE_KEY_LAST_PUZZLE_DATE);
        const rawRating = Number(window.localStorage.getItem(STORAGE_KEY_PUZZLE_RATING) ?? '1500');
        const rawRd = Number(window.localStorage.getItem(STORAGE_KEY_PUZZLE_RD) ?? '350');
        const rawVol = Number(window.localStorage.getItem(STORAGE_KEY_PUZZLE_VOLATILITY) ?? '0.06');

        const currentStreak = Number.isFinite(rawStreak) && rawStreak >= 0 ? Math.floor(rawStreak) : 0;
        const maxStreak = Math.max(
            currentStreak,
            Number.isFinite(rawMax) && rawMax >= 0 ? Math.floor(rawMax) : 0,
        );

        return {
            currentStreak,
            maxStreak,
            lastPuzzleDate: lastDate || null,
            puzzleRating: Number.isFinite(rawRating) && rawRating > 0 ? Math.round(rawRating) : 1500,
            puzzleRd: Number.isFinite(rawRd) && rawRd >= 30 ? rawRd : 350,
            puzzleVolatility: Number.isFinite(rawVol) && rawVol > 0 ? rawVol : 0.06,
        };
    } catch {
        return {
            currentStreak: 0,
            maxStreak: 0,
            lastPuzzleDate: null,
            puzzleRating: 1500,
            puzzleRd: 350,
            puzzleVolatility: 0.06,
        };
    }
}

/**
 * Calcule la différence en jours UTC entre deux dates au format `YYYY-MM-DD`.
 */
export function diffUtcDateStringsInDays(dateA: string, dateB: string): number {
    const msA = Date.parse(`${dateA}T00:00:00.000Z`);
    const msB = Date.parse(`${dateB}T00:00:00.000Z`);
    if (Number.isNaN(msA) || Number.isNaN(msB)) return 999;
    return Math.round(Math.abs(msB - msA) / (1000 * 60 * 60 * 24));
}

/**
 * Met à jour la série quotidienne (`backgammon.puzzleStreak`, `backgammon.lastPuzzleDate`)
 * et recalcule le `puzzle_rating` via Glicko-2. Synchronise avec Supabase si connecté.
 */
export async function syncDailyPuzzleCompletion(params: {
    readonly puzzle: DailyPuzzleDefinition;
    readonly solvedOnFirstAttempt: boolean;
    readonly utcDateStr?: string;
}): Promise<{
    readonly profile: LocalPuzzleProfileState;
    readonly ratingDelta: number;
}> {
    const utcDateStr = params.utcDateStr ?? getUtcDateString();
    const prev = loadLocalPuzzleProfile();

    // 1. Calcul du nouveau Streak quotidien
    let nextStreak = prev.currentStreak;
    if (prev.lastPuzzleDate === utcDateStr) {
        // Déjà incrémenté aujourd'hui
        nextStreak = Math.max(1, prev.currentStreak);
    } else if (prev.lastPuzzleDate) {
        const diffDays = diffUtcDateStringsInDays(prev.lastPuzzleDate, utcDateStr);
        if (diffDays === 1) {
            nextStreak = prev.currentStreak + 1;
        } else {
            nextStreak = 1;
        }
    } else {
        nextStreak = 1;
    }

    const nextMaxStreak = Math.max(prev.maxStreak, nextStreak);

    // 2. Mise à jour du puzzle_rating via Glicko-2 (1.0 si réussi au 1er essai, 0.65 après réessai)
    const glickoPlayer: Glicko2Player = createDefaultGlicko2Player({
        rating: prev.puzzleRating,
        rd: prev.puzzleRd,
        volatility: prev.puzzleVolatility,
    });
    const puzzleScore = params.solvedOnFirstAttempt ? 1.0 : 0.65;
    const glickoUpdate = updatePuzzleGlicko2Rating(
        glickoPlayer,
        params.puzzle.puzzleRating,
        params.puzzle.puzzleRD,
        puzzleScore,
    );

    const updatedProfile: LocalPuzzleProfileState = {
        currentStreak: nextStreak,
        maxStreak: nextMaxStreak,
        lastPuzzleDate: utcDateStr,
        puzzleRating: Math.round(glickoUpdate.rating),
        puzzleRd: glickoUpdate.rd,
        puzzleVolatility: glickoUpdate.volatility,
    };

    // 3. Sauvegarde dans localStorage aux clés réglementaires
    if (typeof window !== 'undefined' && window.localStorage) {
        try {
            window.localStorage.setItem(STORAGE_KEY_PUZZLE_STREAK, String(updatedProfile.currentStreak));
            window.localStorage.setItem(STORAGE_KEY_LAST_PUZZLE_DATE, utcDateStr);
            window.localStorage.setItem(STORAGE_KEY_MAX_PUZZLE_STREAK, String(updatedProfile.maxStreak));
            window.localStorage.setItem(STORAGE_KEY_PUZZLE_RATING, String(updatedProfile.puzzleRating));
            window.localStorage.setItem(STORAGE_KEY_PUZZLE_RD, String(updatedProfile.puzzleRd));
            window.localStorage.setItem(
                STORAGE_KEY_PUZZLE_VOLATILITY,
                String(updatedProfile.puzzleVolatility),
            );
        } catch {
            // Quota fallback
        }
    }

    // Maintien de la cohérence avec `puzzleStorage` existant
    recordPuzzleAttempt(params.puzzle.id, true, utcDateStr);

    // 4. Synchronisation Supabase en arrière-plan si authentifié
    try {
        if (isSupabaseConfigured()) {
            const user = await getCurrentUser();
            if (user?.id) {
                await updateProfilePuzzleStats(user.id, {
                    current_streak: updatedProfile.currentStreak,
                    max_streak: updatedProfile.maxStreak,
                    puzzle_rating: updatedProfile.puzzleRating,
                    last_puzzle_date: utcDateStr,
                });
            }
        }
    } catch {
        // Fallback Local-First transparent
    }

    return {
        profile: updatedProfile,
        ratingDelta: Math.round(glickoUpdate.ratingDelta),
    };
}

/**
 * Lit la file locale FSRS (`backgammon.fsrsQueue`).
 */
export function getLocalFsrsQueue(): LocalFsrsErrorEntry[] {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY_FSRS_QUEUE);
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as LocalFsrsErrorEntry[]) : [];
    } catch {
        return [];
    }
}

/**
 * Injecte automatiquement une position de puzzle ratée au 1er essai dans le planificateur
 * à répétition espacée FSRS (`recurring_errors` avec intervalles J+1, J+3, J+7, J+14, J+30).
 */
export async function injectFailedPuzzleIntoFsrs(params: {
    readonly puzzle: DailyPuzzleDefinition;
    readonly playedNotation: string;
    readonly equityLoss: number;
    readonly now?: Date;
}): Promise<{
    readonly entry: LocalFsrsErrorEntry;
    readonly schedule: FsrsScheduleResult;
}> {
    const now = params.now ?? new Date();
    const xgid = serializeXGID({
        board: [...params.puzzle.initialBoard],
        turn: params.puzzle.turn,
        cubeValue: params.puzzle.cubeValue,
        cubeOwner: params.puzzle.cubeOwner,
        dice: [params.puzzle.dice[0], params.puzzle.dice[1]],
        matchLength: params.puzzle.matchLength || 7,
        scoreX: params.puzzle.scoreX,
        scoreO: params.puzzle.scoreO,
        crawford: params.puzzle.isCrawford,
        doubled: false,
        resigned: 0,
    });

    const schedule = computeFsrsSchedule({
        repetitionCount: 0,
        easeFactor: 2.5,
        isSuccess: false,
        now,
    });

    const entry: LocalFsrsErrorEntry = {
        puzzleId: params.puzzle.id,
        conceptId: params.puzzle.conceptId,
        conceptLabel: params.puzzle.conceptLabel,
        positionXgid: xgid,
        playedNotation: params.playedNotation,
        optimalNotation: params.puzzle.bestMoveNotation,
        equityLoss: params.equityLoss,
        next_review_date: schedule.next_review_date,
        repetition_count: schedule.repetition_count,
        ease_factor: schedule.ease_factor,
        interval_days: schedule.interval_days,
        scheduledIntervals: [...FSRS_INTERVALS_DAYS],
    };

    // 1. Persistance locale dans `backgammon.fsrsQueue`
    if (typeof window !== 'undefined' && window.localStorage) {
        try {
            const currentQueue = getLocalFsrsQueue().filter(
                (item) => item.puzzleId !== params.puzzle.id,
            );
            currentQueue.unshift(entry);
            window.localStorage.setItem(STORAGE_KEY_FSRS_QUEUE, JSON.stringify(currentQueue));
        } catch {
            // Quota fallback
        }
    }

    // 2. Persistance Supabase dans `recurring_errors` avec colonnes FSRS
    try {
        if (isSupabaseConfigured()) {
            const user = await getCurrentUser();
            if (user?.id) {
                await scheduleRecurringErrorFsrs({
                    userId: user.id,
                    conceptId: params.puzzle.conceptId,
                    conceptLabel: params.puzzle.conceptLabel,
                    equityLoss: params.equityLoss,
                    positionXgid: xgid,
                    repetitionCount: 0,
                    easeFactor: 2.5,
                    isSuccess: false,
                    now,
                });
            }
        }
    } catch {
        // Fallback Local-First transparent
    }

    return { entry, schedule };
}
