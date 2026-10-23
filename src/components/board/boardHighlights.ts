/**
 * Fonctions pures de normalisation des surbrillances et Ghost Checkers stratifiés à 3 niveaux
 * (Chantier 3 — flèches Coach / adversaire / survol / sélection / coup forcé).
 * Extraites de `Board.tsx` (LOI 5 : composants ≤ 300 lignes, 0 `any`).
 */

import { X_BAR, O_BAR, X_OFF, O_OFF } from '../../engine/backgammonEngine';
import { detectForcedMove } from '../../engine/forcedMoveDetector';

export interface StratifiedHoverTargets {
    /** Niveau 1 (Dé actif / Dé haut) : flèche cible -> valeur du dé. */
    primary: Map<number, number>;
    /** Niveau 2 (Dé bas / secondaire) : flèche cible -> valeur du dé secondaire. */
    secondary: Map<number, number>;
    /** Niveau 3 (Somme d1 + d2) : flèche cible -> somme des deux dés. */
    combined: Map<number, number>;
}

/**
 * Normalise une flèche de surbrillance vers la numérotation ABSOLUE du plateau.
 *
 * Le moteur utilise `X_BAR === X_OFF === 0` et `O_BAR === O_OFF === 25` : le même
 * index désigne la barre en `from` et la sortie en `to`. Une destination de
 * sortie (`to === 0` ou `to === 25`) ne doit donc JAMAIS être comparée à une
 * flèche 1..24.
 */
export function normalizeHighlightPoint(point: number, isDestination: boolean): number | null {
    if (isDestination) {
        if (point === X_OFF || point === O_OFF) return null;
        return point;
    }
    if (point === X_BAR || point === O_BAR) return null;
    return point;
}

/** Vrai si `point` est une flèche réelle 1..24 (ni barre, ni sortie). */
export function isRealPoint(point: number): boolean {
    return point >= 1 && point <= 24;
}

/**
 * Flèches (1..24) dont un pion peut jouer avec les dés courants.
 * Vide hors des phases où le joueur humain déplace ses pions, ou tant qu'un pion
 * ami est sur la barre centrale (`hasCheckerOnBar === true`, Audit 3 / 20).
 */
export function collectMovableSources(
    left: Map<number, number[]>,
    right: Map<number, number[]>,
    gamePhase: string,
    hasCheckerOnBar = false,
): Set<number> {
    const result = new Set<number>();
    if (hasCheckerOnBar) return result;
    if (gamePhase !== 'HUMAN_MOVING' && gamePhase !== 'HUMAN_READY_TO_COMMIT' && gamePhase !== 'PLAYING_MOVES') {
        return result;
    }
    for (const [from, dests] of [...left, ...right]) {
        if (dests.length > 0 && isRealPoint(from)) result.add(from);
    }
    return result;
}

/**
 * Calcule l'ensemble des destinations fantômes illuminées sur le plateau :
 * - Priorité barre (Audit 3/20)
 * - Surbrillance automatique de la destination d'un coup forcé unique (Audit 13/20)
 * - Destinations du pion sélectionné
 */
export function computeGhostDestinations(params: {
    isOnBar: boolean;
    barPoint: number;
    legalEntryPoints: Set<number>;
    selectedPoint: number | null;
    selectedDie: 0 | 1 | null;
    leftDieTargets: Map<number, number[]>;
    rightDieTargets: Map<number, number[]>;
    dice: [number, number] | null;
    gamePhase: string;
}): Set<number> {
    const {
        isOnBar,
        barPoint,
        legalEntryPoints,
        selectedPoint,
        selectedDie,
        leftDieTargets,
        rightDieTargets,
        dice,
        gamePhase,
    } = params;

    if (isOnBar) {
        if (selectedDie !== null) {
            const targets = selectedDie === 0 ? leftDieTargets : rightDieTargets;
            const filtered = (targets.get(barPoint) ?? []).filter((pt) => legalEntryPoints.has(pt));
            if (filtered.length > 0) return new Set(filtered);
        }
        return legalEntryPoints;
    }

    if (selectedPoint === null) {
        if (gamePhase === 'HUMAN_MOVING' || gamePhase === 'PLAYING_MOVES') {
            const forced = detectForcedMove({ leftDieTargets, rightDieTargets, dice });
            if (forced.isForced && forced.highlightDestination !== null) {
                return new Set([forced.highlightDestination]);
            }
        }
        return new Set<number>();
    }

    if (selectedDie !== null) {
        const targets = selectedDie === 0 ? leftDieTargets : rightDieTargets;
        return new Set(targets.get(selectedPoint) ?? []);
    }
    return new Set([...(leftDieTargets.get(selectedPoint) ?? []), ...(rightDieTargets.get(selectedPoint) ?? [])]);
}

/**
 * Calcule la hiérarchie à 3 niveaux des cibles au survol / sélection d'un pion (Chantier 3) :
 * - Niveau 1 (`primary`)   : Dé actif / Dé haut avec sa valeur de dé.
 * - Niveau 2 (`secondary`) : Dé bas / secondaire avec sa valeur de dé.
 * - Niveau 3 (`combined`)  : Somme (d1 + d2) atteignable en combinant les deux dés.
 */
export function computeHoverTargets(
    activeSource: number | null,
    dice: [number, number] | null,
    selectedDie: 0 | 1 | null,
    leftDieTargets: Map<number, number[]>,
    rightDieTargets: Map<number, number[]>,
    legalSequences?: ReadonlyArray<ReadonlyArray<{ readonly from: number; readonly to: number }>>,
    board?: ReadonlyArray<number>,
): StratifiedHoverTargets {
    const primary = new Map<number, number>();
    const secondary = new Map<number, number>();
    const combined = new Map<number, number>();
    const resolvedSource =
        activeSource ?? detectForcedMove({ leftDieTargets, rightDieTargets, dice }).highlightOrigin;
    if (resolvedSource === null || !dice) return { primary, secondary, combined };

    const defaultHighDie: 0 | 1 = dice[1] > dice[0] ? 1 : 0;
    const prefDie: 0 | 1 = selectedDie ?? defaultHighDie;
    const secDie: 0 | 1 = (1 - prefDie) as 0 | 1;
    const prefVal = dice[prefDie];
    const secVal = dice[secDie];
    const prefDests = (prefDie === 0 ? leftDieTargets : rightDieTargets).get(resolvedSource) ?? [];
    const secDests = (secDie === 0 ? leftDieTargets : rightDieTargets).get(resolvedSource) ?? [];

    if (prefDests.length > 0) {
        prefDests.forEach((d) => primary.set(d, prefVal));
        secDests.forEach((d) => {
            if (!primary.has(d)) secondary.set(d, secVal);
        });
    } else if (secDests.length > 0) {
        secDests.forEach((d) => primary.set(d, secVal));
    }

    const sumVal = prefVal + secVal;
    if (legalSequences && legalSequences.length > 0) {
        for (const seq of legalSequences) {
            if (seq.length >= 2 && seq[0].from === resolvedSource && seq[1].from === seq[0].to) {
                const dest2 = seq[1].to;
                if (isRealPoint(dest2) && !primary.has(dest2) && !secondary.has(dest2)) {
                    combined.set(dest2, sumVal);
                }
            }
        }
    } else if (leftDieTargets.size > 0 && rightDieTargets.size > 0) {
        const startPip = resolvedSource === X_BAR ? 25 : resolvedSource === O_BAR ? 0 : resolvedSource;
        const firstHops: Array<[number, number]> = [...primary.entries(), ...secondary.entries()];
        for (const [mid, usedVal] of firstHops) {
            if (!isRealPoint(mid)) continue;
            const remVal = usedVal === prefVal ? secVal : prefVal;
            const dir = mid < startPip ? -1 : 1;
            const sumDest = mid + dir * remVal;
            if (!isRealPoint(sumDest) || primary.has(sumDest) || secondary.has(sumDest)) continue;
            if (board) {
                const occupant = board[sumDest] ?? 0;
                const isBlocked = dir === -1 ? occupant < -1 : occupant > 1;
                if (isBlocked) continue;
            }
            combined.set(sumDest, sumVal);
        }
    }

    return { primary, secondary, combined };
}
