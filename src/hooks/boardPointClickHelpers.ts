/**
 * Helpers purs de navigation clavier et de résolution de clic des flèches du plateau.
 *
 * Rôle :
 *   Isole hors de `useBoardPointInteractions.ts` (LOI 5 / SCALABILITY.md <= 200 lignes)
 *   les calculs déterministes sans dépendance React :
 *   - `executeBoardPointClick` : résout l'action de clic sur une flèche (barre, direct, port, combiné).
 *   - `executeBarRightClick` : résout le clic droit sur la barre centrale.
 *   - `computeKeyboardNavTarget` & `keyboardNavSelector` : navigation clavier.
 *
 * Module 100 % pur, 0 `any`, testable isolément.
 */

import { getSafestDestination, type Player } from '../engine/backgammonEngine';
import { TOP_ROW_NAV, BOT_ROW_NAV } from '../components/board/boardAria';
import { findPortMove, findDirectMoveToDestination } from '../engine/checkerMoveHelpers';
import { resolveDestinationClick, type SubMove } from '../engine/smartClickResolver';

export interface ExecuteBoardPointClickParams {
    pointNumber: number;
    board: number[];
    isX: boolean;
    player: Player;
    bar: { X: number; O: number };
    xBarPoint: number;
    oBarPoint: number;
    ghostDestinations: Set<number>;
    selectedPoint: number | null;
    leftDieTargets?: Map<number, number[]>;
    rightDieTargets?: Map<number, number[]>;
    dice: [number, number] | null;
    preferredDie: 0 | 1;
    legalSequences?: ReadonlyArray<ReadonlyArray<SubMove>>;
    onCheckerClick: (point: number) => void;
    onDestinationClick: (point: number) => void;
    onPlayMove?: (from: number, to: number, die?: 0 | 1) => void;
    onDeselect?: () => void;
}

export function executeBoardPointClick(params: ExecuteBoardPointClickParams): void {
    const {
        pointNumber, board, isX, player, bar, xBarPoint, oBarPoint,
        ghostDestinations, selectedPoint, leftDieTargets, rightDieTargets,
        dice, preferredDie, legalSequences,
        onCheckerClick, onDestinationClick, onPlayMove, onDeselect,
    } = params;

    const count = board[pointNumber];
    const hasPlayerChecker = isX ? count > 0 : count < 0;
    const ownBarCount = isX ? bar.X : bar.O;
    const ownBarPoint = isX ? xBarPoint : oBarPoint;

    if (ownBarCount > 0) {
        if (leftDieTargets && rightDieTargets && onPlayMove) {
            const barEntry = findDirectMoveToDestination(pointNumber, player, leftDieTargets, rightDieTargets, preferredDie);
            if (barEntry && barEntry.from === ownBarPoint) {
                onPlayMove(ownBarPoint, pointNumber, barEntry.die);
                return;
            }
        }
        if (ghostDestinations.has(pointNumber)) {
            onDestinationClick(pointNumber);
            return;
        }
        if (hasPlayerChecker) {
            onCheckerClick(ownBarPoint);
        }
        return;
    }

    if (ghostDestinations.has(pointNumber)) {
        if (selectedPoint === null && leftDieTargets && rightDieTargets && onPlayMove) {
            const direct = findDirectMoveToDestination(pointNumber, player, leftDieTargets, rightDieTargets, preferredDie);
            if (direct) {
                onPlayMove(direct.from, pointNumber, direct.die);
                return;
            }
        }
        onDestinationClick(pointNumber);
        return;
    }

    const playCombined = (selectedSource: number | null): boolean => {
        if (!legalSequences || legalSequences.length === 0 || !onPlayMove) return false;
        const res = resolveDestinationClick(
            { legalSequences, board, player, selectedSource, higherDieFirst: true },
            pointNumber,
        );
        if (res.kind !== 'combined') return false;
        res.moves.forEach((m) => onPlayMove(m.from, m.to));
        return true;
    };

    if (selectedPoint !== null && selectedPoint !== pointNumber && playCombined(selectedPoint)) {
        return;
    }

    const isMovableSource = (leftDieTargets?.has(pointNumber) ?? false) || (rightDieTargets?.has(pointNumber) ?? false);
    if (hasPlayerChecker && (isMovableSource || !onPlayMove || !leftDieTargets || !rightDieTargets)) {
        onCheckerClick(pointNumber);
        return;
    }

    if (!hasPlayerChecker && leftDieTargets && rightDieTargets && onPlayMove && dice) {
        const port = findPortMove(pointNumber, dice, board, player, leftDieTargets, rightDieTargets);
        if (port) {
            onPlayMove(port.from1, pointNumber, port.die1);
            onPlayMove(port.from2, pointNumber, port.die2);
            return;
        }
    }

    if (leftDieTargets && rightDieTargets && onPlayMove) {
        const direct = findDirectMoveToDestination(pointNumber, player, leftDieTargets, rightDieTargets, preferredDie);
        if (direct) {
            onPlayMove(direct.from, pointNumber, direct.die);
            return;
        }
    }

    if (playCombined(null)) {
        return;
    }

    if (hasPlayerChecker) {
        onCheckerClick(pointNumber);
        return;
    }

    if (ghostDestinations.size > 0 && (ghostDestinations.has(pointNumber - 1) || ghostDestinations.has(pointNumber + 1))) {
        return;
    }
    onDeselect?.();
}

export function executeBarRightClick(params: {
    barPoint: number;
    xBarPoint: number;
    bar: { X: number; O: number };
    preferredDie: 0 | 1;
    leftDieTargets?: Map<number, number[]>;
    rightDieTargets?: Map<number, number[]>;
    board: number[];
    player: Player;
    onPlayMove?: (from: number, to: number, die?: 0 | 1) => void;
    onCheckerRightClick: (point: number) => void;
    onDeselect?: () => void;
}): void {
    const { barPoint, xBarPoint, bar, preferredDie, leftDieTargets, rightDieTargets, board, player, onPlayMove, onCheckerRightClick, onDeselect } = params;
    const hasBarChecker = barPoint === xBarPoint ? bar.X > 0 : bar.O > 0;
    if (!hasBarChecker) {
        onDeselect?.();
        return;
    }

    if (leftDieTargets && rightDieTargets && onPlayMove) {
        const secondaryDie: 0 | 1 = (1 - preferredDie) as 0 | 1;
        const secondaryTargets = secondaryDie === 0 ? leftDieTargets : rightDieTargets;
        const primaryTargets = preferredDie === 0 ? leftDieTargets : rightDieTargets;
        const secondaryDests = secondaryTargets.get(barPoint) ?? [];
        const primaryDests = primaryTargets.get(barPoint) ?? [];

        if (secondaryDests.length > 0) {
            const dest = getSafestDestination(barPoint, secondaryDests, board, player);
            onPlayMove(barPoint, dest, secondaryDie);
            return;
        }
        if (primaryDests.length > 0) {
            const dest = getSafestDestination(barPoint, primaryDests, board, player);
            onPlayMove(barPoint, dest, preferredDie);
            return;
        }
    }

    onCheckerRightClick(barPoint);
}

/**
 * Calcule le prochain point à focus lors d'une navigation clavier (flèches, Home, End).
 */
export function computeKeyboardNavTarget(pointNumber: number, key: string): number | null {
    const navRow = pointNumber >= 13 ? TOP_ROW_NAV : BOT_ROW_NAV;
    const idx = navRow.indexOf(pointNumber);
    if (idx === -1) return null;

    if (key === 'ArrowLeft') return navRow[Math.max(0, idx - 1)];
    if (key === 'ArrowRight') return navRow[Math.min(navRow.length - 1, idx + 1)];
    if (key === 'Home') return navRow[0];
    if (key === 'End') return navRow[navRow.length - 1];
    return null;
}

/**
 * Construit le sélecteur DOM (`data-testid`) du point cible pour le focus clavier.
 */
export function keyboardNavSelector(point: number): string {
    if (point === 101) return '[data-testid="tray-zone-o"]';
    if (point === 100) return '[data-testid="tray-zone-x"]';
    return `[data-testid="point-triangle-${point}"]`;
}
