/**
 * Calculateur de Pip Count & Différentiel Dynamique de Course (Audit 10 / 20 — pipCalculator).
 *
 * Exigences :
 *   1. Rafraîchissement instantané après chaque sous-dé joué (y compris pions sur la barre = 25 pips).
 *   2. Calcul du différentiel signé (`+X / -Y`) et du ton chromatique (vert émeraude si en avance,
 *      ambre/rose si en retard).
 *   3. Persistance de l'option de masquage pour le mode tournoi strict (« Live Board »).
 *
 * Strictement 0 `any`, module pur < 300 lignes.
 */

import { X_BAR, O_BAR, type Player } from './backgammonEngine';

/** Clé de stockage local du mode Live Board (masquage du Pip Count en tournoi). */
export const PIP_COUNT_STORAGE_KEY = 'backgammon_show_pipcount';

export type PipRaceStatus = 'ahead' | 'behind' | 'tied';
export type PipColorTone = 'emerald' | 'rose' | 'amber';

export interface DynamicPipSnapshot {
    readonly pipX: number;
    readonly pipO: number;
    /** Différentiel brut `pipX - pipO` (négatif = X a moins de pips = X est en avance). */
    readonly rawDiff: number;
    /** Avance en pips du joueur évalué (`> 0` = en avance, `< 0` = en retard, `0` = égalité). */
    readonly leadPips: number;
    /** Valeur absolue de l'écart de pips. */
    readonly absDiff: number;
    /** Statut de course du joueur évalué (`'ahead' | 'behind' | 'tied'`). */
    readonly status: PipRaceStatus;
    /** Texte formaté du différentiel (`"+12"`, `"-7"`, `"±0"`). */
    readonly formattedDifferential: string;
    /** Ton de couleur discret : `'emerald'` (en avance), `'rose'` (en retard), `'amber'` (égalité). */
    readonly colorTone: PipColorTone;
}

/**
 * Calcule instantanément le nombre exact de pips restants pour `player` sur un plateau `board` (26 cases).
 * Chaque pion frappé sur la barre centrale compte pour 25 pips.
 */
export function calculatePlayerPips(board: readonly number[], player: Player): number {
    let total = 0;
    if (player === 'X') {
        const barCount = Math.max(0, board[X_BAR] ?? 0);
        total += barCount * 25;
        for (let pt = 1; pt <= 24; pt++) {
            const count = board[pt] ?? 0;
            if (count > 0) {
                total += count * pt;
            }
        }
        return total;
    }

    const barCount = Math.max(0, -(board[O_BAR] ?? 0));
    total += barCount * 25;
    for (let pt = 1; pt <= 24; pt++) {
        const count = board[pt] ?? 0;
        if (count < 0) {
            total += Math.abs(count) * (25 - pt);
        }
    }
    return total;
}

/**
 * Calcule le différentiel brut `pipX - pipO` (positif = X a plus de pips restants = X en retard).
 */
export function computePipDiff(pipX: number, pipO: number): number {
    return pipX - pipO;
}

/**
 * Détermine si `perspectivePlayer` est en avance à la course (c.-à-d. possède moins de pips restants).
 */
export function isLeading(diff: number, perspectivePlayer: Player): boolean {
    return perspectivePlayer === 'X' ? diff < 0 : diff > 0;
}

/**
 * Construit un snapshot complet du Pip Count et de son différentiel formaté (`+X / -Y`)
 * à partir des totaux `pipX` et `pipO` (ou directement du plateau via `calculateBoardPipSnapshot`).
 */
export function buildPipDifferentialSnapshot(
    pipX: number,
    pipO: number,
    perspectivePlayer: Player = 'X',
): DynamicPipSnapshot {
    const safeX = Math.max(0, Math.trunc(pipX));
    const safeO = Math.max(0, Math.trunc(pipO));
    const rawDiff = computePipDiff(safeX, safeO);
    const leadPips = perspectivePlayer === 'X' ? safeO - safeX : safeX - safeO;
    const absDiff = Math.abs(rawDiff);

    if (absDiff === 0) {
        return {
            pipX: safeX,
            pipO: safeO,
            rawDiff: 0,
            leadPips: 0,
            absDiff: 0,
            status: 'tied',
            formattedDifferential: '±0',
            colorTone: 'amber',
        };
    }

    const ahead = leadPips > 0;
    return {
        pipX: safeX,
        pipO: safeO,
        rawDiff,
        leadPips,
        absDiff,
        status: ahead ? 'ahead' : 'behind',
        formattedDifferential: `${ahead ? '+' : '-'}${absDiff}`,
        colorTone: ahead ? 'emerald' : 'rose',
    };
}

/**
 * Calcule en 1 appel les pips des deux joueurs et le différentiel dynamique après un sous-dé.
 */
export function calculateBoardPipSnapshot(
    board: readonly number[],
    perspectivePlayer: Player = 'X',
): DynamicPipSnapshot {
    const pipX = calculatePlayerPips(board, 'X');
    const pipO = calculatePlayerPips(board, 'O');
    return buildPipDifferentialSnapshot(pipX, pipO, perspectivePlayer);
}
