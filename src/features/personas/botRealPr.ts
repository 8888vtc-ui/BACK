/**
 * @file src/features/personas/botRealPr.ts
 * @description PR RÉEL du bot pendant la partie.
 *
 * Chaque coup du bot est choisi par Open Sage, qui fournit l'équité exacte de tous les coups candidats.
 * On enregistre la perte d'équité du coup effectivement joué, puis :
 *     PR = (perte moyenne par décision non forcée) × 500   (norme eXtreme Gammon, cf. AGENTS.md)
 *
 * Remplace l'ancien `computeRealtimeBotErrorRate`, qui affichait un PR inventé
 * (valeur cible codée en dur ajustée par le nombre de blots).
 * Tant qu'aucune décision non forcée n'a été mesurée, le PR vaut `null` (« — » à l'écran) : jamais de valeur factice.
 */

export interface BotRealPrSnapshot {
    /** PR mesuré, ou null si aucune décision non forcée n'a encore été jouée. */
    readonly pr: number | null;
    readonly decisions: number;
    readonly totalEquityLoss: number;
}

let totalEquityLoss = 0;
let decisions = 0;
const listeners = new Set<() => void>();

function notify(): void {
    for (const l of listeners) l();
}

/** Enregistre un coup du bot évalué par Open Sage. Les coups forcés sont ignorés (norme XG). */
export function recordBotMoveEquityLoss(equityLoss: number, isForced: boolean): void {
    if (isForced || !Number.isFinite(equityLoss)) return;
    totalEquityLoss += Math.max(0, equityLoss);
    decisions += 1;
    notify();
}

/** Remet le compteur à zéro (nouvelle partie / nouveau match). */
export function resetBotRealPr(): void {
    totalEquityLoss = 0;
    decisions = 0;
    notify();
}

export function getBotRealPr(): BotRealPrSnapshot {
    return {
        pr: decisions > 0 ? Math.min(30.0, Number(((totalEquityLoss / decisions) * 500).toFixed(1))) : null,
        decisions,
        totalEquityLoss: Number(totalEquityLoss.toFixed(4)),
    };
}

export function subscribeBotRealPr(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

