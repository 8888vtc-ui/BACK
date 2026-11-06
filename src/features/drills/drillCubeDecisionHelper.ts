/**
 * @file src/features/drills/drillCubeDecisionHelper.ts
 * @description Helpers pour l'affichage, la validation et la télémétrie des Quiz de Videau (Mission 33/50).
 *
 * Invariants stricts :
 *   1. Actions de Videau explicites en FR et EN (Pas de Double, Doubler ×2 / Accepter, Doubler ×2 / Refuser).
 *   2. Zéro option BEAVER en Match Play (matchLength > 0).
 *   3. Télémétrie mathématique complète après réponse : % de victoire, % de Gammon, Seuil de prise (Take Point).
 *
 * Strictement <= 180 lignes, 0 any.
 */

import { calculateTakePoint } from '../coach/matchContext';
import type { PlayerBlunderRecord } from './types';

export function isCubeDecisionQuiz(blunder: Partial<PlayerBlunderRecord>): boolean {
    if (!blunder) return false;
    if (blunder.quizType === 'CUBE_DECISION') return true;
    if (blunder.conceptId === 'cube_decision') return true;
    if (blunder.dice && blunder.dice[0] === 0 && blunder.dice[1] === 0) return true;
    const opt = blunder.optimalMove?.trim().toLowerCase() ?? '';
    return /^(double|no double|take|pass|redouble)/i.test(opt);
}

export function filterLegalCubeChoices(
    choices: ReadonlyArray<string>,
    matchLength: number = 7,
): string[] {
    return choices.filter((c) => {
        if (matchLength > 0 && /beaver/i.test(c)) {
            return false;
        }
        return true;
    });
}

export function formatCubeChoiceButtonLabel(choice: string, language: 'fr' | 'en' = 'fr'): string {
    const trimmed = choice.trim();
    const isEn = language === 'en';

    if (/^No Double(\s*\/\s*Take)?$/i.test(trimmed) || /^Pas de Double$/i.test(trimmed)) {
        return isEn ? 'No Double' : 'Pas de Double';
    }
    if (/^Double\s*\/\s*Take$/i.test(trimmed) || /Doubler.*Accepter/i.test(trimmed)) {
        return isEn ? 'Double ×2 / Take' : 'Doubler ×2 / Accepter (Take)';
    }
    if (
        /^Double\s*\/\s*Pass$/i.test(trimmed) ||
        /^Double\s*\/\s*Drop$/i.test(trimmed) ||
        /Doubler.*Refuser/i.test(trimmed)
    ) {
        return isEn ? 'Double ×2 / Pass' : 'Doubler ×2 / Refuser (Pass)';
    }
    if (/^Too Good/i.test(trimmed)) {
        return isEn ? 'Too Good to Double' : 'Trop Beau pour Doubler (Too Good)';
    }
    return choice;
}

export function normalizeCubeActionKey(action: string): string | null {
    if (!action) return null;
    const lower = action.trim().toLowerCase();
    if (/no double|pas de double/i.test(lower)) return 'no_double';
    if (/double.*take|doubler.*accepter/i.test(lower)) return 'double_take';
    if (/double.*pass|double.*drop|doubler.*refuser/i.test(lower)) return 'double_pass';
    if (/too good|trop beau/i.test(lower)) return 'too_good';
    if (/beaver/i.test(lower)) return 'beaver';
    return null;
}

export interface CubeTelemetryData {
    readonly winPct: string;
    readonly gammonPct: string;
    readonly takePointPct: string;
}

export function extractCubeTelemetry(blunder: PlayerBlunderRecord): CubeTelemetryData {
    const candidate = blunder.candidateMoves3Ply?.[0];
    const rawWin = candidate?.win ?? 0.75;
    const rawGammon = candidate?.winGammon ?? 0.12;

    const winPct = (rawWin * 100).toFixed(1);
    const gammonPct = (rawGammon * 100).toFixed(1);

    const matchCtx = blunder.matchContext;
    let takePointVal = 0.25;

    if (matchCtx) {
        const matchLength = matchCtx.matchLength ?? 7;
        const isMoneyPlay = matchLength === 0;
        if (isMoneyPlay) {
            takePointVal = 0.25;
        } else {
            const awayX = Math.max(1, matchLength - (matchCtx.scoreX ?? 0));
            const awayO = Math.max(1, matchLength - (matchCtx.scoreO ?? 0));
            // Pour le joueur X qui double, le preneur (taker) est O :
            takePointVal = calculateTakePoint(awayO, awayX, false);
        }
    }

    const takePointPct = (takePointVal * 100).toFixed(1);

    return {
        winPct,
        gammonPct,
        takePointPct,
    };
}
