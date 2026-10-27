/**
 * @file src/lib/coach/prompts.ts
 * @description Façade Neuro-Symbolique des Prompts Coach IA (`gemini-3.8-flash`) et constructeur
 * de synthèse finale structurée autour des critères de Michihito Kageyama (Michy), Paul Magriel
 * et Kit Woolsey (Connectivity, Timing/Race, Duplication/Purity).
 * Strictement 0 `any`, < 120 lignes.
 */

import { buildSocraticQuestion } from './socraticQuestionBuilder';

export {
    BACKGAMMON_COACH_SYSTEM_PROMPT,
    BACKGAMMON_COACH_SYSTEM_PROMPT_EN,
    getCoachSystemPrompt,
    buildCoachUserPrompt,
    generateRuleBasedExplanation,
    type CoachPromptParams,
    type CoachStructuredResponse,
    type MatchContext,
} from '../../features/coach/prompts';

export interface MichyMagrielWoolseySynthesisInput {
    readonly optimalMove: string;
    readonly playerPips: number;
    readonly opponentPips: number;
    readonly equityLoss: number;
    readonly directShotsConceded: number;
    readonly gamePhase?: string;
    readonly primeLength?: number;
    readonly homeBoardPointsMade?: number;
    readonly concepts?: ReadonlyArray<string>;
    readonly isEn?: boolean;
}

/**
 * Construit le bloc de synthèse finale structuré selon les 3 Piliers Grands-Maîtres
 * (Michy Connectivity, Magriel Timing/Race, Woolsey/Mochy Duplication/Purity).
 */
export function buildMichyMagrielWoolseySynthesis(input: MichyMagrielWoolseySynthesisInput): string {
    const socratic = buildSocraticQuestion({
        gamePhase: input.gamePhase,
        playerPips: input.playerPips,
        opponentPips: input.opponentPips,
        equityLoss: input.equityLoss,
        bestMoveNotation: input.optimalMove,
        directShotsConceded: input.directShotsConceded,
        primeLength: input.primeLength,
        homeBoardPointsMade: input.homeBoardPointsMade,
        concepts: input.concepts,
        locale: input.isEn ? 'en' : 'fr',
    });

    if (input.isEn) {
        return [
            `🏛️ Grandmaster Synthesis (Michy / Magriel / Woolsey — ${socratic.optimalChoice}):`,
            `• ${socratic.threePillars.connectivity}`,
            `• ${socratic.threePillars.timingAndRace}`,
            `• ${socratic.threePillars.duplicationAndPurity}`,
        ].join('\n');
    }

    return [
        `🏛️ Synthèse Grand-Maître (Michy / Magriel / Woolsey — ${socratic.optimalChoice}) :`,
        `• ${socratic.threePillars.connectivity}`,
        `• ${socratic.threePillars.timingAndRace}`,
        `• ${socratic.threePillars.duplicationAndPurity}`,
    ].join('\n');
}
