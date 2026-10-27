/**
 * @file src/lib/coach/positionClassifier.ts
 * @description Classificateur déterministe de position et extracteur de concepts stratégiques
 * selon la taxonomie de Michihito Kageyama (Michy), Paul Magriel et Kit Woolsey.
 * Strictement 0 `any`, < 150 lignes, 100 % pur.
 */

import { classifyDominantTheme, type DominantTheme } from './michyProverbs';

export type PositionGamePhase = 'opening' | 'contact' | 'race' | 'bearoff';

export type PositionConcept =
    | 'golden-point'
    | 'bar-point'
    | 'advanced-anchor'
    | 'blitz-attack'
    | 'tempo-hit'
    | 'prime-vs-prime'
    | 'running-game'
    | 'holding-game'
    | 'duplication'
    | 'pure-play'
    | 'trice-epc'
    | 'woolsey-law'
    | 'back-checker-escape';

export interface PositionClassifierInput {
    readonly gamePhase?: string;
    readonly playerPips?: number;
    readonly opponentPips?: number;
    readonly pipDiff?: number;
    readonly bestMoveNotation?: string;
    readonly playedMoveNotation?: string;
    readonly directShotsConceded?: number;
    readonly primeLength?: number;
    readonly homeBoardPointsMade?: number;
    readonly opponentBarCount?: number;
    readonly concepts?: ReadonlyArray<string>;
}

export interface PositionClassification {
    readonly normalizedPhase: PositionGamePhase;
    readonly dominantTheme: DominantTheme;
    readonly pipLead: number;
    readonly concepts: ReadonlyArray<string>;
}

/**
 * Calcule l'avance aux pips du joueur (positif = le joueur est en avance avec moins de pips à parcourir).
 */
export function resolvePlayerPipLead(input: {
    readonly playerPips?: number;
    readonly opponentPips?: number;
    readonly pipDiff?: number;
}): number {
    if (
        typeof input.playerPips === 'number' &&
        Number.isFinite(input.playerPips) &&
        typeof input.opponentPips === 'number' &&
        Number.isFinite(input.opponentPips)
    ) {
        return Math.round(input.opponentPips - input.playerPips);
    }
    if (typeof input.pipDiff === 'number' && Number.isFinite(input.pipDiff)) {
        return Math.round(input.pipDiff);
    }
    return 0;
}

/**
 * Extrait de manière 100 % déterministe la phase normalisée, le thème dominant et les concepts clés.
 */
export function classifyPosition(input: PositionClassifierInput): PositionClassification {
    const playerPips = input.playerPips ?? 150;
    const opponentPips = input.opponentPips ?? 150;
    const pipLead = resolvePlayerPipLead(input);
    const bestMove = (input.bestMoveNotation ?? '').trim();
    const rawPhase = (input.gamePhase ?? 'contact').toLowerCase();

    const detected = new Set<string>(input.concepts ?? []);

    if (/\b(?:\d+|bar)\/(?:5|20)(?!\d)\*?/i.test(bestMove)) {
        detected.add('golden-point');
    }
    if (/\b(?:\d+|bar)\/(?:7|18)(?!\d)\*?/i.test(bestMove)) {
        detected.add('bar-point');
    }
    if (bestMove.includes('*')) {
        detected.add('blitz-attack');
        detected.add('tempo-hit');
    }
    if (/\b(?:24|23|22)\/1[345678]\b/.test(bestMove)) {
        detected.add('back-checker-escape');
        detected.add('running-game');
    }
    if (/\boff\b/i.test(bestMove) || rawPhase.includes('bear') || playerPips <= 65) {
        detected.add('trice-epc');
    }
    if ((input.primeLength ?? 0) >= 4) {
        detected.add('prime-vs-prime');
    }
    if ((input.directShotsConceded ?? 0) >= 4) {
        detected.add('duplication');
    }
    if (pipLead >= 12 && !bestMove.includes('*')) {
        detected.add('running-game');
    }

    const normalizedPhase: PositionGamePhase =
        rawPhase.includes('bear') || playerPips <= 65
            ? 'bearoff'
            : rawPhase.includes('race') || rawPhase.includes('course')
              ? 'race'
              : rawPhase.includes('open')
                ? 'opening'
                : 'contact';

    const dominantTheme = classifyDominantTheme({
        gamePhase: normalizedPhase,
        primeLength: input.primeLength,
        opponentBarCount: input.opponentBarCount,
        homeBoardPointsMade: input.homeBoardPointsMade,
        playerPipCount: playerPips,
        opponentPipCount: opponentPips,
    });

    if (detected.size === 0) {
        detected.add(dominantTheme === 'RACE' ? 'running-game' : 'pure-play');
    }

    return {
        normalizedPhase,
        dominantTheme,
        pipLead,
        concepts: Object.freeze(Array.from(detected)),
    };
}
