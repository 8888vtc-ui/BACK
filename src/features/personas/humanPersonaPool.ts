/**
 * @file src/features/personas/humanPersonaPool.ts
 * @description Calibration Humaine sur `bgsage`, Plafond strict Δ_max, Heuristiques de Videau
 * (Prudents vs Agressifs), Simulateur de Temps de Réflexion (`HumanThinkingDelay`) & Micro-Chat (≤ 30 %).
 * Utilise exclusivement `crypto.getRandomValues` (zéro `Math.random()`).
 */

import { HUMAN_PERSONA_POOL, type CubeTemperament, type HumanPersonaSeed } from './humanPersonaSeeds';
import { computePersonaBiasDelta } from './botPersonas';

export { HUMAN_PERSONA_POOL, type CubeTemperament, type HumanPersonaSeed };

/** Plafonds Δ_max stricts en EMG par niveau (Expert: 0.035, Intermédiaire: 0.075, Club/Débutant: 0.115). */
export const HUMAN_BLUNDER_CAP_EMG = {
    beginner: 0.115,
    intermediate: 0.075,
    expert: 0.035,
    grandmaster: 0.0,
} as const;

export const FORBIDDEN_PERSONA_USERNAME_REGEX = /\b(bot|ai|player\d*|guest)\b/i;

export type HumanContextType =
    | 'matchmaking'
    | 'dice_roll'
    | 'forced_move'
    | 'simple_race'
    | 'complex_contact'
    | 'cube_decision';

export interface HumanThinkingDelay {
    readonly context: HumanContextType;
    readonly minMs: number;
    readonly maxMs: number;
    readonly selectedMs: number;
}

/** Tirage uniforme [0, 1) via `crypto.getRandomValues` (zéro `Math.random()`). */
export function cryptoUniform01(): number {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0] / 0x100000000;
}

/**
 * Simulateur de Temps de Réflexion Humain (`HumanThinkingDelay`) :
 * - Attente matchmaking : 3,5s à 8,5s (3500..8500 ms)
 * - Lancer de dés : 0,6s à 1,5s (600..1500 ms)
 * - Coup forcé : 0,8s à 1,4s (800..1400 ms)
 * - Course simple : 1,4s à 2,6s (1400..2600 ms)
 * - Contact complexe (>8 coups avec ΔE < 0.030) : 3,2s à 6,8s (3200..6800 ms)
 * - Décision de Videau : 3,5s à 7,5s (3500..7500 ms)
 */
export function computeHumanThinkingDelay(
    context: HumanContextType,
    uniformFn: () => number = cryptoUniform01,
): HumanThinkingDelay {
    let minMs = 1400;
    let maxMs = 2600;

    switch (context) {
        case 'matchmaking':
            minMs = 3500;
            maxMs = 8500;
            break;
        case 'dice_roll':
            minMs = 600;
            maxMs = 1500;
            break;
        case 'forced_move':
            minMs = 800;
            maxMs = 1400;
            break;
        case 'simple_race':
            minMs = 1400;
            maxMs = 2600;
            break;
        case 'complex_contact':
            minMs = 3200;
            maxMs = 6800;
            break;
        case 'cube_decision':
            minMs = 3500;
            maxMs = 7500;
            break;
    }

    const u = Math.max(0, Math.min(1, uniformFn()));
    const selectedMs = Math.round(minMs + u * (maxMs - minMs));

    return {
        context,
        minMs,
        maxMs,
        selectedMs,
    };
}

/** Résout automatiquement le contexte de réflexion humain pour un coup de dames. */
export function resolveMoveThinkingContext(params: {
    readonly legalMoveCount: number;
    readonly isContact: boolean;
    readonly closeDecisionsCount: number;
}): HumanContextType {
    if (params.legalMoveCount <= 1) return 'forced_move';
    if (params.isContact && params.legalMoveCount > 8 && params.closeDecisionsCount >= 2) {
        return 'complex_contact';
    }
    return 'simple_race';
}

export interface EvaluatedMoveOption<T> {
    readonly move: T;
    readonly equity: number;
    readonly equityLoss: number;
    readonly boardBefore?: ReadonlyArray<number>;
    readonly boardAfter?: ReadonlyArray<number>;
}

/**
 * Sélectionne un coup humain calibré parmi les coups évalués par `bgsage` :
 * 1. Élimine strictement tout coup dont `equityLoss > seed.maxDeltaEmg` (`0.035` / `0.075` / `0.115`).
 * 2. Applique les biais psychologiques humains (peur des blots isolés, frappe réflexe, chandeliers, points profonds)
 *    et le budget d'erreur cible `Δ_voulu = seed.targetErPr / 500`.
 * 3. Sélectionne de manière variée parmi le Top 3 humain pour éviter tout jeu robotique.
 */
export function selectNaturalHumanMoveFromBgsage<T>(
    evaluatedMoves: ReadonlyArray<EvaluatedMoveOption<T>>,
    seed: HumanPersonaSeed,
    uniformFn: () => number = cryptoUniform01,
): T {
    if (evaluatedMoves.length === 0) {
        throw new Error('selectNaturalHumanMoveFromBgsage: aucun coup évalué fourni.');
    }
    if (evaluatedMoves.length === 1) {
        return evaluatedMoves[0].move;
    }

    const cap = HUMAN_BLUNDER_CAP_EMG[seed.difficulty] ?? seed.maxDeltaEmg;
    const hardCap = Math.min(cap, seed.maxDeltaEmg);
    const desiredLoss = seed.targetErPr / 500;

    const withinCap = evaluatedMoves.filter((m, idx) => idx === 0 || Math.abs(m.equityLoss) <= hardCap);
    const pool = withinCap.length > 0 ? withinCap : [evaluatedMoves[0]];

    const scored = pool.map((cand) => {
        const loss = Math.abs(cand.equityLoss);
        const budgetProximity = -Math.abs(loss - desiredLoss) * 0.5;
        const psychBias =
            cand.boardBefore && cand.boardAfter
                ? computePersonaBiasDelta(cand.boardBefore, cand.boardAfter, seed.difficulty) * 0.25
                : 0;
        return {
            cand,
            humanScore: cand.equity + budgetProximity + psychBias,
        };
    });

    scored.sort((a, b) => b.humanScore - a.humanScore);
    const topHuman3 = scored.slice(0, Math.min(3, scored.length));
    const idx = Math.min(topHuman3.length - 1, Math.floor(Math.max(0, uniformFn()) * topHuman3.length));
    return topHuman3[idx].cand.move;
}

export interface CubeHeuristicInput {
    readonly winProb: number;
    readonly cubeTemperament: CubeTemperament;
    readonly isAhead?: boolean;
    readonly isOnARush?: boolean;
}

/**
 * Heuristiques humaines de Videau sur les probabilités `bgsage` :
 * - Prudents (`cautious`) : Doubling Too Late (> 75 %) / Drop (< 24 %).
 * - Agressifs (`aggressive`) : Doubling on a rush (≥ 62 %) / Pride Take (17 %–19 % accepté).
 * - Équilibrés (`balanced`) : Double (> 70 %) / Drop (< 21 %).
 */
export function evaluateHumanPersonaCubeHeuristic(
    input: CubeHeuristicInput,
): 'double' | 'take' | 'drop' {
    const { winProb, cubeTemperament } = input;

    if (cubeTemperament === 'cautious') {
        if (winProb > 0.75) return 'double';
        if (winProb < 0.24) return 'drop';
        return 'take';
    }

    if (cubeTemperament === 'aggressive') {
        const doubleThreshold = input.isOnARush ? 0.60 : 0.62;
        if (winProb >= doubleThreshold) return 'double';
        if (winProb >= 0.17 && winProb <= 0.19) return 'take'; // Pride Take (17-19%)
        if (winProb < 0.17) return 'drop';
        return 'take';
    }

    if (winProb > 0.70) return 'double';
    if (winProb < 0.21) return 'drop';
    return 'take';
}

export const DISCREET_HUMAN_GREETINGS = ['hi gl', 'Salut, bonne partie', 'gg'] as const;
export const MAX_MICRO_CHAT_PROBABILITY = 0.30;

/**
 * Déclenche une micro-salutation discrète dans 30 % des parties maximum (`roll < 0.30`).
 */
export function maybePickHumanMicroChatGreeting(
    uniformFn: () => number = cryptoUniform01,
): (typeof DISCREET_HUMAN_GREETINGS)[number] | null {
    const roll = uniformFn();
    if (roll >= MAX_MICRO_CHAT_PROBABILITY) {
        return null;
    }
    const idx = Math.min(
        DISCREET_HUMAN_GREETINGS.length - 1,
        Math.floor(Math.max(0, uniformFn()) * DISCREET_HUMAN_GREETINGS.length),
    );
    return DISCREET_HUMAN_GREETINGS[idx];
}
