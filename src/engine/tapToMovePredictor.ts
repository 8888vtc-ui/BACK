/**
 * Moteur de prédiction intelligente et scoring tactique pour le Tap-to-Move
 * (normes Backgammon Galaxy / eXtreme Gammon / Chess.com).
 *
 * Fonction PURE : 0 accès DOM, 0 état React, 0 any.
 */

import {
    type Player,
    X_BAR,
    O_BAR,
    X_OFF,
    O_OFF,
    getSafestDestination,
} from './backgammonEngine';

export interface ScoredDestination {
    to: number;
    die: 0 | 1;
    score: number;
    isHit: boolean;
    isBarReentry: boolean;
    isMakePoint: boolean;
    isBearOff: boolean;
    reason: string;
}

export interface TapPredictionParams {
    fromPoint: number;
    board: ReadonlyArray<number>;
    player: Player;
    leftTargets: ReadonlyArray<number>;
    rightTargets: ReadonlyArray<number>;
    dice: [number, number] | null;
    activeDie: 0 | 1;
    isSelected: boolean;
}

export interface TapPredictionResult {
    /** Action recommandée : jouer directement ('MOVE'), sélectionner ('SELECT'), ou rien ('NONE'). */
    action: 'MOVE' | 'SELECT' | 'NONE';
    /** Destination tactique sélectionnée (si action === 'MOVE'). */
    selectedTarget?: ScoredDestination;
    /** Toutes les destinations candidates scorées. */
    destinations: ScoredDestination[];
}

/**
 * Évalue et attribue un score tactique à une destination possible.
 */
export function scoreDestination(
    from: number,
    to: number,
    die: 0 | 1,
    board: ReadonlyArray<number>,
    player: Player,
    dice: [number, number] | null,
    activeDie: 0 | 1,
): ScoredDestination {
    const isX = player === 'X';
    const isBearOff = isX ? to === X_OFF : to === O_OFF;
    const isBarReentry = isX ? from === X_BAR : from === O_BAR;

    let isHit = false;
    let isMakePoint = false;
    let score = 0;
    let reason = 'Déplacement standard';

    if (isBarReentry) {
        score += 90;
        reason = 'Sortie prioritaire de la barre';
    }

    if (isBearOff) {
        score += 80;
        reason = 'Sortie de pion (Bear-off)';
    } else {
        const destCount = board[to];
        const isOpponentBlot = isX ? destCount === -1 : destCount === 1;
        const isFriendlyBlot = isX ? destCount === 1 : destCount === -1;
        const isFriendlyAnchor = isX ? destCount >= 2 : destCount <= -2;

        if (isOpponentBlot) {
            isHit = true;
            score += 100;
            reason = isBarReentry
                ? 'Sortie de barre avec frappe de blot adverse'
                : 'Frappe de blot adverse';
        } else if (isFriendlyBlot) {
            isMakePoint = true;
            score += 65;
            reason = 'Création d’une porte (Make Point)';
        } else if (isFriendlyAnchor) {
            score += 40;
            reason = 'Consolidation sur point existant';
        } else if (!isBarReentry) {
            score += 20;
            reason = 'Avancée en terrain libre';
        }
    }

    // Bonus pour le dé actif
    if (die === activeDie) {
        score += 8;
    }

    // Bonus pour la valeur du dé (règle XG : préférence pour le plus grand dé en cas d'égalité tactique)
    if (dice) {
        const dieVal = dice[die];
        score += dieVal * 0.5;
    }

    return {
        to,
        die,
        score,
        isHit,
        isBarReentry,
        isMakePoint,
        isBearOff,
        reason,
    };
}

/**
 * Prédit le meilleur comportement d'un tap sur un pion.
 */
export function predictBestTapMove(params: TapPredictionParams): TapPredictionResult {
    const {
        fromPoint,
        board,
        player,
        leftTargets,
        rightTargets,
        dice,
        activeDie,
        isSelected,
    } = params;

    const candidates: ScoredDestination[] = [];

    // Cibles dé 0 (gauche)
    for (const to of leftTargets) {
        candidates.push(scoreDestination(fromPoint, to, 0, board, player, dice, activeDie));
    }

    // Cibles dé 1 (droite)
    for (const to of rightTargets) {
        candidates.push(scoreDestination(fromPoint, to, 1, board, player, dice, activeDie));
    }

    if (candidates.length === 0) {
        return { action: 'NONE', destinations: [] };
    }

    // Déduplication si les 2 dés mènent au même point (ex: doublet ou flèches identiques)
    const uniqueDestsMap = new Map<number, ScoredDestination>();
    for (const c of candidates) {
        const existing = uniqueDestsMap.get(c.to);
        if (!existing || c.score > existing.score) {
            uniqueDestsMap.set(c.to, c);
        }
    }
    const distinctCandidates = Array.from(uniqueDestsMap.values());

    // Tri par score tactique décroissant
    distinctCandidates.sort((a, b) => b.score - a.score);

    // CAS 1 : Une seule destination distincte possible -> Déplacement immédiat 1-tap
    if (distinctCandidates.length === 1) {
        return {
            action: 'MOVE',
            selectedTarget: distinctCandidates[0],
            destinations: distinctCandidates,
        };
    }

    // CAS 2 : Le pion est DÉJÀ sélectionné (2e tap / confirmation) -> Joue la meilleure destination tactique
    if (isSelected) {
        return {
            action: 'MOVE',
            selectedTarget: distinctCandidates[0],
            destinations: distinctCandidates,
        };
    }

    // CAS 3 : Deux destinations distinctes non ambiguës sur le plan tactique (ex: frappe évidente de blot vs rien)
    const best = distinctCandidates[0];
    const second = distinctCandidates[1];
    if (best.isHit && !second.isHit) {
        // Frappe de blot écrasante : joue directement sans friction
        return {
            action: 'MOVE',
            selectedTarget: best,
            destinations: distinctCandidates,
        };
    }

    // CAS 4 : Deux destinations réelles à choix stratégique -> Sélectionne pour afficher les fantômes avec leurs dés
    return {
        action: 'SELECT',
        selectedTarget: best,
        destinations: distinctCandidates,
    };
}
