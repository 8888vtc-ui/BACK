/**
 * Accessibilité ARIA & navigation clavier du plateau — module 100 % pur.
 *
 * Centralise la génération des labels ARIA descriptifs (flèches, barre, sabots)
 * et les constantes de navigation clavier (roving tabindex).
 *
 * Ce module ne dépend d'aucun composant React : il est testable isolément.
 */

import { Player, borneOffCount } from '../../engine/backgammonEngine';

/** Ordre de navigation clavier de la rangée du haut. */
export const TOP_ROW_NAV = [13, 14, 15, 16, 17, 18, 25, 19, 20, 21, 22, 23, 24, 101];

/** Ordre de navigation clavier de la rangée du bas. */
export const BOT_ROW_NAV = [12, 11, 10, 9, 8, 7, 0, 6, 5, 4, 3, 2, 1, 100];

export function getPointAriaLabel(
    point: number,
    board: number[],
    player: Player,
    selectedPoint: number | null,
    ghostDestinations: number[],
    activeDieVal?: number,
): string {
    const isX = player === 'X';
    const count = board[point];
    let label = `Flèche ${point} : `;

    if (count === 0) {
        label += 'vide.';
    } else {
        const owner = count > 0 ? 'X (Blanc)' : 'O (Noir)';
        const abs = Math.abs(count);
        label += `${abs} pion${abs > 1 ? 's' : ''} ${owner}.`;
        if (abs >= 2) {
            label += ' Porte fermée.';
        } else {
            label += ' Blot vulnérable.';
        }
    }

    if (selectedPoint === point) {
        label += ' Flèche sélectionnée.';
    } else if (ghostDestinations.includes(point)) {
        const hit = isX ? count === -1 : count === 1;
        label += ` Destination légale${activeDieVal ? ` avec le dé ${activeDieVal}` : ''}.${hit ? ' Frappe le pion adverse !' : ''} Appuyez sur Entrée pour jouer.`;
    } else if ((isX && count > 0) || (!isX && count < 0)) {
        label += ' Appuyez sur Entrée pour sélectionner ce pion.';
    }

    return label;
}

export function getTrayAriaLabel(board: number[], player: Player, canBearOff: boolean): string {
    const isX = player === 'X';
    const count = borneOffCount(board, player);
    let label = `Sabots de sortie : ${count} pion${count > 1 ? 's' : ''} ${isX ? 'X (Blanc)' : 'O (Noir)'} sorti${count > 1 ? 's' : ''}.`;
    if (canBearOff) {
        label += ' Destination légale de sortie (Bear-off). Appuyez sur Entrée pour sortir un pion.';
    }
    return label;
}
