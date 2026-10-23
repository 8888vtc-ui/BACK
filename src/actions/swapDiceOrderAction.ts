/**
 * Micro-programme atomique : Inversion de l'ordre des dés (LOI 1).
 *
 * Standard Backgammon Galaxy / XG : un clic sur la zone des dés (ou clic droit
 * sur le plateau) inverse instantanément l'ordre des deux dés ([6, 3] → [3, 6]),
 * permettant de choisir quel dé jouer au clic gauche.
 *
 * Fonction PURE : retourne le nouvel ordre sans muter l'entrée.
 */

export interface SwapDiceOrderParams {
    /** Dés actuels (ou null si non lancés). */
    readonly dice: readonly [number, number] | null;
    /** Dé actuellement préféré (0 ou 1). */
    readonly preferredDie: 0 | 1;
}

export interface SwapDiceOrderResult {
    /** Nouvel ordre des dés (copie gelée), ou null si aucun dé. */
    readonly dice: readonly [number, number] | null;
    /** Nouveau dé préféré. */
    readonly preferredDie: 0 | 1;
}

/**
 * Inverse l'ordre des dés et bascule le dé préféré.
 * Un double ([3, 3]) reste inchangé (inversion sans effet).
 */
export function swapDiceOrderAction(params: SwapDiceOrderParams): SwapDiceOrderResult {
    const { dice, preferredDie } = params;

    if (!dice) {
        return { dice: null, preferredDie };
    }

    // Un double ne peut pas être inversé utilement.
    if (dice[0] === dice[1]) {
        return { dice: Object.freeze([dice[0], dice[1]]) as readonly [number, number], preferredDie };
    }

    const swapped = Object.freeze([dice[1], dice[0]]) as readonly [number, number];
    return {
        dice: swapped,
        preferredDie: (1 - preferredDie) as 0 | 1,
    };
}
