/**
 * Micro-programme d'analyse Coach Log-Driven (LOI 4)
 *
 * RÈGLES STRICTES :
 * 1. Ne lit jamais l'écran ni le DOM : prend en entrée exclusivement la dernière ligne immuable de `matchLog`.
 * 2. Condition stricte : if (logEntry.player !== localConnectedPlayer) return null;
 * 3. Évalue le coup joué sur `boardBefore` et compare avec le meilleur coup trouvé par le moteur.
 *
 * NOTE : ce micro-programme délègue désormais à `analyzeHumanMoveFromLog`
 * (source de vérité unique dans `logAnalyzer.ts`) pour éviter toute duplication
 * de la logique d'évaluation et de classification des verdicts.
 */

import type { Player } from '../../engine/backgammonEngine';
import type { MatchLogEntry } from '../../actions/types';
import { analyzeHumanMoveFromLog, type CoachVerdict } from './logAnalyzer';

export interface HumanLogAnalysisResult {
    readonly turnIndex: number;
    readonly player: Player;
    readonly verdict: CoachVerdict;
    readonly equityLoss: number;
    readonly playedNotation: string;
    readonly optimalNotation: string;
    readonly isUnforced: boolean;
    readonly isBlunder: boolean;
    readonly candidateMoves: ReadonlyArray<{
        readonly notation: string;
        readonly equityLoss: number;
    }>;
}

export interface AnalyzeHumanLogParams {
    readonly logEntry: MatchLogEntry;
    readonly localConnectedPlayer?: Player;
    readonly cubeValue?: number;
    readonly matchLength?: number;
    readonly scoreX?: number;
    readonly scoreO?: number;
    readonly ply?: number;
}

/**
 * Analyse de façon pure et isolée le dernier coup humain depuis sa trace immuable dans le log.
 *
 * Délègue à `analyzeHumanMoveFromLog` (source de vérité unique).
 */
export function analyzeHumanLogAction(
    params: AnalyzeHumanLogParams,
): HumanLogAnalysisResult | null {
    const result = analyzeHumanMoveFromLog({
        logEntry: params.logEntry,
        localPlayer: params.localConnectedPlayer,
        cubeValue: params.cubeValue,
        matchLength: params.matchLength,
        scoreX: params.scoreX,
        scoreO: params.scoreO,
        ply: params.ply,
    });

    if (!result) {
        return null;
    }

    return {
        turnIndex: result.turnIndex,
        player: result.player,
        verdict: result.verdict,
        equityLoss: result.equityLoss,
        playedNotation: result.playedNotation,
        optimalNotation: result.optimalNotation,
        isUnforced: result.isUnforced,
        isBlunder: result.isBlunder,
        candidateMoves: result.candidateMoves.map((m) => ({
            notation: m.notation,
            equityLoss: m.equityLoss,
        })),
    };
}
