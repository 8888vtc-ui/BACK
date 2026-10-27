/**
 * @file src/lib/coach/symbolicAudit.ts
 * @description Schéma d'Audit Symbolique en Deux Temps (Anti-Hallucination) :
 * Étape 1 : `symbolic_audit` verrouillé sur les métriques déterministes du moteur.
 * Étape 2 : `pedagogical_explanation` (Sweller <= 15 mots, Triptyque DecodeChess Idée-Problème-Solution,
 *           Indices Socratiques en 3 temps, Proverbe de Michy / Règle de Magriel, EPC de Trice et Zare).
 */

import { calculateEffectivePipCount } from '../engine/effectivePipCount';
import type { Player } from '../../engine/backgammonEngine';
import {
    classifyDominantTheme,
    computeMagrielSafeVsBoldScore,
    selectMichyOrMagrielProverb,
    type DominantTheme,
} from './michyProverbs';
import { computeZareLuckVsSkill } from './zareTiltEngine';

export type PlayerColor = 'white' | 'black' | 'X' | 'O';

export interface DecodeChessTriptych {
    opponent_intention: string;
    structural_problem: string;
    canonical_solution: string;
}

export interface SymbolicAudit {
    player_pip: number;
    opponent_pip: number;
    direct_shots_conceded: number;
    blunder_delta_equity: number;
    dominant_theme: DominantTheme;
    player_epc?: number;
    magriel_score?: number;
    magriel_posture?: 'BOLD' | 'SAFE';
}

export interface PedagogicalExplanation {
    headline: string;
    tactical_rationale: string;
    correct_play_canonical: string;
    zare_luck_vs_skill: string;
    idea_problem_solution?: DecodeChessTriptych;
    socratic_hints?: [string, string, string];
    michy_proverb?: string;
}

export interface NeuroSymbolicCoachAudit {
    symbolic_audit: SymbolicAudit;
    pedagogical_explanation: PedagogicalExplanation;
}

export interface SymbolicAuditInput {
    playerPipCount?: number;
    opponentPipCount?: number;
    directShotsBefore?: number;
    directShotsAfter?: number;
    equityLoss: number;
    bestMoveNotation: string;
    playedMoveNotation: string;
    archetype?: string;
    gamePhase?: string;
    primeLength?: number;
    opponentBarCount?: number;
    homeBoardPointsMade?: number;
    blotsLeft?: number;
    dice?: [number, number] | null;
    luckDelta?: number;
    board?: ReadonlyArray<number>;
    player?: PlayerColor;
    locale?: 'fr' | 'en';
}

const VALID_DOMINANT_THEMES: ReadonlySet<DominantTheme> = new Set<DominantTheme>([
    'RACE',
    'BLITZ',
    'PRIME',
    'HOLDING',
    'BEAROFF',
]);

/**
 * Garantit la contrainte de charge cognitive de John Sweller (<= 15 mots).
 */
export function truncateToSwellerHeadline(headline: string, maxWords = 15): string {
    const normalized = headline.replace(/\s+/g, ' ').trim();
    if (!normalized) return '';
    const words = normalized.split(' ');
    if (words.length <= maxWords) return normalized;
    const sliced = words.slice(0, maxWords).join(' ').replace(/[,:;—-]+$/, '');
    return `${sliced}.`;
}

/**
 * Calcule le compte de pips effectifs de Walter Trice (EPC) si le plateau 26-cases est fourni.
 */
export function computeTriceEpcMetric(
    board: ReadonlyArray<number> | undefined,
    player: PlayerColor = 'X',
): number | null {
    if (!board || board.length < 26) return null;
    const enginePlayer: Player = player === 'black' || player === 'O' ? 'O' : 'X';
    return calculateEffectivePipCount([...board], enginePlayer).epc;
}

/**
 * Construit l'étape 1 (`symbolic_audit`) de manière 100 % déterministe à partir du moteur.
 */
export function buildDeterministicSymbolicAudit(input: SymbolicAuditInput): SymbolicAudit {
    const playerPip =
        typeof input.playerPipCount === 'number' && Number.isFinite(input.playerPipCount)
            ? Math.max(0, Math.round(input.playerPipCount))
            : 150;
    const opponentPip =
        typeof input.opponentPipCount === 'number' && Number.isFinite(input.opponentPipCount)
            ? Math.max(0, Math.round(input.opponentPipCount))
            : 150;

    const rawDirectShots =
        typeof input.directShotsAfter === 'number' && Number.isFinite(input.directShotsAfter)
            ? input.directShotsAfter
            : typeof input.blotsLeft === 'number' && Number.isFinite(input.blotsLeft)
              ? input.blotsLeft
              : 0;

    const directShotsConceded = Math.max(0, Math.round(rawDirectShots));
    const normalizedLoss = Math.max(0, Number.isFinite(input.equityLoss) ? input.equityLoss : 0);
    const blunderDeltaEquity = Number((-normalizedLoss).toFixed(3));

    const dominantTheme = classifyDominantTheme(
        {
            archetype: input.archetype,
            gamePhase: input.gamePhase,
            primeLength: input.primeLength,
            opponentBarCount: input.opponentBarCount,
            homeBoardPointsMade: input.homeBoardPointsMade,
            playerPipCount: playerPip,
            opponentPipCount: opponentPip,
        },
        input.board,
    );

    return {
        player_pip: playerPip,
        opponent_pip: opponentPip,
        direct_shots_conceded: directShotsConceded,
        blunder_delta_equity: blunderDeltaEquity,
        dominant_theme: dominantTheme,
    };
}

/**
 * Construit l'étape 2 (`pedagogical_explanation`) ancrée sur DecodeChess, Michy, Magriel, Trice EPC et Zare.
 */
export function buildDeterministicPedagogicalExplanation(
    input: SymbolicAuditInput,
    symbolicAudit: SymbolicAudit,
): PedagogicalExplanation {
    const isEn = (input.locale ?? 'fr') === 'en';
    const loss = Math.abs(symbolicAudit.blunder_delta_equity);
    const isOptimal = loss < 0.005 || input.playedMoveNotation === input.bestMoveNotation;

    const proverb = selectMichyOrMagrielProverb({
        theme: symbolicAudit.dominant_theme,
        directShotsBefore: input.directShotsBefore,
        directShotsAfter: symbolicAudit.direct_shots_conceded,
        primeLength: input.primeLength,
        blotsLeft: input.blotsLeft,
        bestMoveNotation: input.bestMoveNotation,
        playerPipCount: symbolicAudit.player_pip,
        opponentPipCount: symbolicAudit.opponent_pip,
    });

    const zare = computeZareLuckVsSkill({
        equityLoss: loss,
        dice: input.dice,
        luckDelta: input.luckDelta,
        bestMoveNotation: input.bestMoveNotation,
    });

    const triceEpc = symbolicAudit.player_epc ?? computeTriceEpcMetric(input.board, input.player ?? 'X');
    const epcClause = triceEpc !== null ? ` (Trice EPC ${triceEpc.toFixed(1)} pips)` : '';

    const rawHeadline = isOptimal
        ? isEn
            ? `Grandmaster precision: ${input.bestMoveNotation} masters the ${symbolicAudit.dominant_theme} plan.`
            : `Précision Grand-Maître : ${input.bestMoveNotation} verrouille le plan ${symbolicAudit.dominant_theme}.`
        : isEn
          ? `Play ${input.bestMoveNotation} over ${input.playedMoveNotation} to save ${loss.toFixed(3)} equity.`
          : `Jouez ${input.bestMoveNotation} plutôt que ${input.playedMoveNotation} (+${loss.toFixed(3)} Eq).`;

    const headline = truncateToSwellerHeadline(rawHeadline, 15);
    const shotsBefore = input.directShotsBefore ?? 0;
    const shotsAfter = symbolicAudit.direct_shots_conceded;

    const ideaProblemSolution: DecodeChessTriptych = isEn
        ? {
              opponent_intention:
                  symbolicAudit.dominant_theme === 'BLITZ'
                      ? 'The AI wants to counter-hit any loose blot and escape its back checkers.'
                      : symbolicAudit.dominant_theme === 'PRIME'
                        ? 'The AI seeks to anchor high or leap over your blockade before you close a 5-prime.'
                        : symbolicAudit.dominant_theme === 'HOLDING'
                          ? 'The AI waits on its anchor for a direct shot while you bring checkers home.'
                          : 'The AI aims to maximize racing crossovers and punish any contact exposure.',
              structural_problem: isOptimal
                  ? `Your move ${input.playedMoveNotation} leaves no structural weakness (${shotsAfter}/36 shots).`
                  : `Playing ${input.playedMoveNotation} concedes ${shotsAfter}/36 shots (vs ${shotsBefore}/36) and costs ${loss.toFixed(3)} equity.`,
              canonical_solution: `Canonical play ${input.bestMoveNotation} (${proverb.name}) ${proverb.tacticalRuleEn}`,
          }
        : {
              opponent_intention:
                  symbolicAudit.dominant_theme === 'BLITZ'
                      ? "L'IA attend le moindre blot pour contre-frapper et libérer ses pions arrières."
                      : symbolicAudit.dominant_theme === 'PRIME'
                        ? "L'IA cherche à s'ancrer haut ou sauter votre barrage avant la fermeture d'une prime."
                        : symbolicAudit.dominant_theme === 'HOLDING'
                          ? "L'IA guette depuis son ancre le moindre tir direct pendant votre retour."
                          : "L'IA cherche à accélérer la course et punir tout contact résiduel.",
              structural_problem: isOptimal
                  ? `Votre coup ${input.playedMoveNotation} ne laisse aucune faille (${shotsAfter}/36 tirs).`
                  : `Jouer ${input.playedMoveNotation} concède ${shotsAfter}/36 tirs (contre ${shotsBefore}/36) et coûte ${loss.toFixed(3)} Eq.`,
              canonical_solution: `Le coup canonique ${input.bestMoveNotation} (${proverb.name}) ${proverb.tacticalRuleFr}`,
          };

    const socraticHints: [string, string, string] = isEn
        ? [
              `Step 1 (Plan): In this ${symbolicAudit.dominant_theme} position (${symbolicAudit.player_pip} vs ${symbolicAudit.opponent_pip} pips), ${proverb.socraticQuestionEn}`,
              `Step 2 (Target): Compare ${shotsAfter}/36 shots conceded by ${input.playedMoveNotation} with ${shotsBefore}/36 on the optimal line.`,
              `Step 3 (Solution): Play ${input.bestMoveNotation} — ${proverb.proverbEn}`,
          ]
        : [
              `Indice 1 (Plan) : Dans ce schéma ${symbolicAudit.dominant_theme} (${symbolicAudit.player_pip} vs ${symbolicAudit.opponent_pip} pips), ${proverb.socraticQuestionFr}`,
              `Indice 2 (Zone) : Comparez les ${shotsAfter}/36 tirs concédés par ${input.playedMoveNotation} aux ${shotsBefore}/36 de la ligne optimale.`,
              `Indice 3 (Solution) : Jouez ${input.bestMoveNotation} — ${proverb.proverbFr}`,
          ];

    const tacticalRationale = isEn
        ? `At ${symbolicAudit.player_pip} vs ${symbolicAudit.opponent_pip} pips${epcClause}, ${proverb.proverbEn} ${ideaProblemSolution.structural_problem} ${ideaProblemSolution.canonical_solution}`
        : `À ${symbolicAudit.player_pip} contre ${symbolicAudit.opponent_pip} pips${epcClause}, ${proverb.proverbFr} ${ideaProblemSolution.structural_problem} ${ideaProblemSolution.canonical_solution}`;

    return {
        headline,
        tactical_rationale: tacticalRationale,
        correct_play_canonical: input.bestMoveNotation,
        zare_luck_vs_skill: isEn ? zare.summaryEn : zare.summaryFr,
        idea_problem_solution: ideaProblemSolution,
        socratic_hints: socraticHints,
        michy_proverb: isEn ? proverb.proverbEn : proverb.proverbFr,
    };
}

export function buildNeuroSymbolicAudit(input: SymbolicAuditInput): NeuroSymbolicCoachAudit {
    const symbolicAudit = buildDeterministicSymbolicAudit(input);
    const pedagogicalExplanation = buildDeterministicPedagogicalExplanation(input, symbolicAudit);
    return { symbolic_audit: symbolicAudit, pedagogical_explanation: pedagogicalExplanation };
}

export function enforceSymbolicAuditAntiHallucination(
    rawCandidate: Partial<NeuroSymbolicCoachAudit> | null | undefined,
    groundTruth: NeuroSymbolicCoachAudit,
): NeuroSymbolicCoachAudit {
    const rawTheme = rawCandidate?.symbolic_audit?.dominant_theme;
    const verifiedTheme: DominantTheme =
        typeof rawTheme === 'string' && VALID_DOMINANT_THEMES.has(rawTheme as DominantTheme)
            ? (rawTheme as DominantTheme)
            : groundTruth.symbolic_audit.dominant_theme;

    const rawPed = rawCandidate?.pedagogical_explanation;
    const headline =
        typeof rawPed?.headline === 'string' && rawPed.headline.trim().length > 0
            ? truncateToSwellerHeadline(rawPed.headline, 15)
            : groundTruth.pedagogical_explanation.headline;

    const tacticalRationale =
        typeof rawPed?.tactical_rationale === 'string' && rawPed.tactical_rationale.trim().length > 0
            ? rawPed.tactical_rationale.trim()
            : groundTruth.pedagogical_explanation.tactical_rationale;

    const zareLuckVsSkill =
        typeof rawPed?.zare_luck_vs_skill === 'string' && rawPed.zare_luck_vs_skill.trim().length > 0
            ? rawPed.zare_luck_vs_skill.trim()
            : groundTruth.pedagogical_explanation.zare_luck_vs_skill;

    return {
        symbolic_audit: {
            ...groundTruth.symbolic_audit,
            dominant_theme: verifiedTheme,
        },
        pedagogical_explanation: {
            ...groundTruth.pedagogical_explanation,
            headline,
            tactical_rationale: tacticalRationale,
            correct_play_canonical: groundTruth.pedagogical_explanation.correct_play_canonical,
            zare_luck_vs_skill: zareLuckVsSkill,
        },
    };
}
