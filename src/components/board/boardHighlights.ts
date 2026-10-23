/**
 * Fonctions pures de normalisation des surbrillances (flèches Coach / adversaire / survol / coup forcé).
 * Extraites de `Board.tsx` (LOI 5 : composants ≤ 300 lignes).
 */

import { X_BAR, O_BAR, X_OFF, O_OFF } from '../../engine/backgammonEngine';
import { detectForcedMove } from '../../engine/forcedMoveDetector';

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
 * Calcule les cibles de prévisualisation au survol Desktop (ou pour un coup forcé unique) :
 * - `primary`   : destinations du dé actif (clic gauche) avec leur valeur de dé.
 * - `secondary` : destinations du second dé (clic droit) avec leur valeur de dé.
 */
export function computeHoverTargets(
    activeSource: number | null,
    dice: [number, number] | null,
    selectedDie: 0 | 1 | null,
    leftDieTargets: Map<number, number[]>,
    rightDieTargets: Map<number, number[]>,
): { primary: Map<number, number>; secondary: Map<number, number> } {
    const primary = new Map<number, number>();
    const secondary = new Map<number, number>();
    const resolvedSource =
        activeSource ?? detectForcedMove({ leftDieTargets, rightDieTargets, dice }).highlightOrigin;
    if (resolvedSource === null || !dice) return { primary, secondary };

    const prefDie: 0 | 1 = selectedDie ?? 0;
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
    return { primary, secondary };
}
