/**
 * Diagnostic stratégique automatique en français (PARTIE 3.2).
 *
 * Compare géométriquement le `boardAfter` du coup OPTIMAL avec celui du coup JOUÉ
 * pour générer un texte pédagogique ciblant la tactique du Backgammon :
 *   - Sécurité / Blots (pions exposés, tirs adverses)
 *   - Construction (points clés : Golden Point 5, point 4, Bar point 7, primes)
 *   - Attaque (frappe d'un pion adverse)
 *   - Course (optimisation du bear-off)
 *   - Perte d'équité absolue (`Math.abs(equityLoss)`) conforme aux normes BMAB / XG2
 *
 * Fonction PURE : aucun accès au DOM, aucun état React, 0ms (100% hors-ligne).
 */

import type { Player } from '../../engine/backgammonEngine';

export interface TacticalExplanationParams {
    /** Plateau avant le coup. */
    readonly boardBefore: ReadonlyArray<number>;
    /** Plateau après le coup optimal. */
    readonly boardOptimal: ReadonlyArray<number>;
    /** Plateau après le coup réellement joué. */
    readonly boardPlayed: ReadonlyArray<number>;
    /** Joueur au trait. */
    readonly player: Player;
    /** Perte d'équité optionnelle (signée ou absolue). */
    readonly equityLoss?: number;
}

export interface TacticalExplanation {
    /** Texte pédagogique principal en français. */
    readonly summary: string;
    /** Concepts tactiques détectés. */
    readonly concepts: ReadonlyArray<string>;
    /** Perte d'équité absolue mathématique (`Math.abs(equityLoss)`). */
    readonly absEquityLoss: number;
}

/** Compte les blots (pions isolés exposés) d'un joueur. */
function countBlots(board: ReadonlyArray<number>, player: Player): number {
    let blots = 0;
    for (let p = 1; p <= 24; p++) {
        const v = board[p];
        if (player === 'X' ? v === 1 : v === -1) blots++;
    }
    return blots;
}

/** Compte les points fermés (portes) d'un joueur dans son jan intérieur. */
function countHomePoints(board: ReadonlyArray<number>, player: Player): number {
    let points = 0;
    const range = player === 'X' ? [1, 2, 3, 4, 5, 6] : [19, 20, 21, 22, 23, 24];
    for (const p of range) {
        const v = board[p];
        const count = player === 'X' ? v : -v;
        if (count >= 2) points++;
    }
    return points;
}

/** Détecte si un point clé (5, 4, 7 pour X ; 20, 21, 18 pour O) a été construit. */
function hasKeyPoint(board: ReadonlyArray<number>, player: Player, point: number): boolean {
    const targetPoint = player === 'X' ? point : 25 - point;
    const v = board[targetPoint];
    const count = player === 'X' ? v : -v;
    return count >= 2;
}

/** Compte les pions sortis (bear-off). */
function countOff(board: ReadonlyArray<number>, player: Player): number {
    let onBoard = 0;
    const barIdx = player === 'X' ? 0 : 25;
    const barVal = board[barIdx] ?? 0;
    onBoard += player === 'X' ? Math.max(0, barVal) : Math.max(0, -barVal);
    for (let p = 1; p <= 24; p++) {
        const v = board[p];
        if (player === 'X' && v > 0) onBoard += v;
        if (player === 'O' && v < 0) onBoard += -v;
    }
    return Math.max(0, 15 - onBoard);
}

/**
 * Génère un diagnostic stratégique comparant le coup optimal au coup joué (0ms, déterministe).
 */
export function explainTacticalDifference(
    params: TacticalExplanationParams,
): TacticalExplanation {
    const { boardOptimal, boardPlayed, player, equityLoss } = params;
    const absEquityLoss = Math.abs(equityLoss ?? 0);
    const concepts: string[] = [];
    const reasons: string[] = [];

    // 1. Sécurité / Blots
    const blotsOptimal = countBlots(boardOptimal, player);
    const blotsPlayed = countBlots(boardPlayed, player);
    if (blotsPlayed > blotsOptimal) {
        const diff = blotsPlayed - blotsOptimal;
        concepts.push('Sécurité');
        reasons.push(
            `votre coup laisse ${diff} blot${diff > 1 ? 's' : ''} de plus exposé${diff > 1 ? 's' : ''} aux tirs adverses`,
        );
    } else if (blotsPlayed < blotsOptimal) {
        concepts.push('Sécurité');
        reasons.push('votre coup sécurise davantage de pions que le coup optimal');
    }

    // 2. Construction (points clés)
    const homeOptimal = countHomePoints(boardOptimal, player);
    const homePlayed = countHomePoints(boardPlayed, player);
    if (homePlayed < homeOptimal) {
        concepts.push('Construction');
        reasons.push(
            `le coup optimal ferme ${homeOptimal - homePlayed} point${homeOptimal - homePlayed > 1 ? 's' : ''} de plus dans votre jan intérieur`,
        );
    }

    const keyPoints: Array<{ point: number; name: string }> = [
        { point: 5, name: 'Golden Point (case 5)' },
        { point: 4, name: 'point 4' },
        { point: 7, name: 'Bar point (case 7)' },
    ];
    for (const kp of keyPoints) {
        const optimalHas = hasKeyPoint(boardOptimal, player, kp.point);
        const playedHas = hasKeyPoint(boardPlayed, player, kp.point);
        if (optimalHas && !playedHas) {
            concepts.push('Point clé');
            reasons.push(`le coup optimal construit le ${kp.name}, essentiel pour la suite`);
        }
    }

    // 3. Attaque (frappe)
    const boardBefore: ReadonlyArray<number> = params.boardBefore;
    let hitsOptimal = 0;
    let hitsPlayed = 0;
    for (let p = 1; p <= 24; p++) {
        const before = boardBefore[p];
        const afterOpt = boardOptimal[p];
        const afterPlayed = boardPlayed[p];
        if (player === 'X') {
            if (before === -1 && afterOpt >= 0) hitsOptimal++;
            if (before === -1 && afterPlayed >= 0) hitsPlayed++;
        } else {
            if (before === 1 && afterOpt <= 0) hitsOptimal++;
            if (before === 1 && afterPlayed <= 0) hitsPlayed++;
        }
    }
    if (hitsOptimal > hitsPlayed) {
        concepts.push('Attaque');
        reasons.push('le coup optimal frappe un pion adverse (Tempo Hit / Blitz)');
    }

    // 4. Course / Bear-off
    const offOptimal = countOff(boardOptimal, player);
    const offPlayed = countOff(boardPlayed, player);
    if (offOptimal > offPlayed) {
        concepts.push('Course');
        reasons.push('le coup optimal sort davantage de pions (optimisation du bear-off)');
    }

    // 5. Évasion des pions arrières & préservation du Midpoint
    const rearIdx = player === 'X' ? 24 : 1;
    const optRear = player === 'X' ? Math.max(0, boardOptimal[rearIdx] ?? 0) : Math.max(0, -(boardOptimal[rearIdx] ?? 0));
    const playedRear = player === 'X' ? Math.max(0, boardPlayed[rearIdx] ?? 0) : Math.max(0, -(boardPlayed[rearIdx] ?? 0));
    if (optRear < playedRear) {
        concepts.push('Évasion');
        reasons.push('le coup optimal évade un pion arrière du camp adverse avant d’être bloqué');
    }

    let summary: string;
    if (reasons.length === 0) {
        summary =
            'Le coup optimal est légèrement supérieur, mais la différence est subtile (positionnement à long terme).';
    } else {
        summary = `Le coup optimal est meilleur car ${reasons.join(', et ')}.`;
    }

    return {
        summary,
        concepts: Object.freeze(concepts),
        absEquityLoss,
    };
}
