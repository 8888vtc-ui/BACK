/**
 * Écosystème des 4 Bots Personnifiés & Mode Adaptatif (« UI Caméléon » : S'amuser vs Pro).
 * Conforme à SCALABILITY.md (≤ 400 lignes, 0 any, fonctions pures).
 */

import type { AIDifficulty } from '../../engine/aiHeuristics';
import type { Locale } from '../../lib/i18n/types';
import { PERSONA_TEXTS_BY_DIFFICULTY } from './botPersonaTranslations';
import {
    CHAT_GUARDRAIL_TEXTS,
    CHAT_DICE_AUDIT_TEXTS,
    CHAT_CUBE_TEXTS,
    formatAdviceReply,
    formatDefaultProReply,
    formatSwapDiceVerdict,
} from './botChatTranslations';

export type ExperienceMode = 'fun' | 'pro';

/** Plafond d'affichage temps réel de l'Error Rate (PR) des Bots (max 10.0). */
export const MAX_BOT_DISPLAY_PR = 10.0;

/** Plafond strict de perte d'équité par coup (Blunder Cap ΔE_max en EMG) par niveau. */
export const BLUNDER_CAP_EMG_BY_DIFFICULTY: Record<AIDifficulty, number> = {
    beginner: 0.16,
    intermediate: 0.085,
    expert: 0.035,
    grandmaster: 0.0,
};

export interface BotPersonaTurnLike {
    readonly player: 'X' | 'O';
    readonly dice: readonly [number, number] | ReadonlyArray<number>;
    readonly boardBefore: ReadonlyArray<number>;
    readonly boardAfter: ReadonlyArray<number>;
}

export interface BotPersonaSpec {
    readonly id: AIDifficulty;
    readonly name: string;
    readonly shortName: string;
    readonly archetypeTitle: string;
    readonly avatar: string;
    readonly lobbyHint: string;
    readonly styleBadge: string;
    readonly skillTaught: string;
    /** Error Rate (PR) nominal du Bot (plafonné à 10.0). */
    readonly targetErrorRate: number;
    readonly weights: {
        readonly hitBonus: number;
        readonly ownBlotPenalty: number;
        readonly primeBonus: number;
        readonly anchorBonus: number;
        readonly raceBonus: number;
    };
    readonly dialogues: {
        readonly opening: Record<ExperienceMode, string>;
        readonly playerDoubleRoll: Record<ExperienceMode, string>;
        readonly playerBlunder: Record<ExperienceMode, string>;
        readonly playerOptimal: Record<ExperienceMode, string>;
        readonly botHitPlayer: Record<ExperienceMode, string>;
    };
}

const BOT_PERSONA_BASE_CONFIG: Record<AIDifficulty, {
    readonly avatar: string;
    readonly targetErrorRate: number;
    readonly weights: {
        readonly hitBonus: number;
        readonly ownBlotPenalty: number;
        readonly primeBonus: number;
        readonly anchorBonus: number;
        readonly raceBonus: number;
    };
}> = {
    beginner: {
        avatar: '🤬',
        targetErrorRate: 7.8,
        weights: { hitBonus: 0.22, ownBlotPenalty: -0.01, primeBonus: 0.01, anchorBonus: 0.0, raceBonus: -0.02 },
    },
    intermediate: {
        avatar: '🕶️',
        targetErrorRate: 4.2,
        weights: { hitBonus: 0.06, ownBlotPenalty: -0.02, primeBonus: 0.04, anchorBonus: 0.16, raceBonus: 0.0 },
    },
    expert: {
        avatar: '💼',
        targetErrorRate: 1.8,
        weights: { hitBonus: 0.03, ownBlotPenalty: -0.12, primeBonus: 0.04, anchorBonus: 0.02, raceBonus: 0.18 },
    },
    grandmaster: {
        avatar: '🧐',
        targetErrorRate: 0.3,
        weights: { hitBonus: 0.07, ownBlotPenalty: -0.08, primeBonus: 0.20, anchorBonus: 0.06, raceBonus: 0.05 },
    },
};

const EXPERIENCE_MODE_STORAGE_KEY = 'bg_experience_mode_v1';

export function getBotPersona(difficulty: AIDifficulty = 'expert', locale: Locale = 'fr'): BotPersonaSpec {
    const diff = BOT_PERSONA_BASE_CONFIG[difficulty] ? difficulty : 'expert';
    const base = BOT_PERSONA_BASE_CONFIG[diff];
    const texts = PERSONA_TEXTS_BY_DIFFICULTY[diff]?.[locale]
        ?? PERSONA_TEXTS_BY_DIFFICULTY[diff]?.fr
        ?? PERSONA_TEXTS_BY_DIFFICULTY.expert.fr;

    return {
        id: diff,
        name: texts.name,
        shortName: texts.shortName,
        archetypeTitle: texts.archetypeTitle,
        avatar: base.avatar,
        lobbyHint: texts.lobbyHint,
        styleBadge: texts.styleBadge,
        skillTaught: texts.skillTaught,
        targetErrorRate: base.targetErrorRate,
        weights: base.weights,
        dialogues: texts.dialogues,
    };
}

export const BOT_PERSONAS_BY_DIFFICULTY: Record<AIDifficulty, BotPersonaSpec> = {
    beginner: getBotPersona('beginner', 'fr'),
    intermediate: getBotPersona('intermediate', 'fr'),
    expert: getBotPersona('expert', 'fr'),
    grandmaster: getBotPersona('grandmaster', 'fr'),
};

export function readStoredExperienceMode(): ExperienceMode {
    if (typeof window === 'undefined') return 'fun';
    try {
        return window.localStorage.getItem(EXPERIENCE_MODE_STORAGE_KEY) === 'pro' ? 'pro' : 'fun';
    } catch {
        return 'fun';
    }
}

export function storeExperienceMode(mode: ExperienceMode): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(EXPERIENCE_MODE_STORAGE_KEY, mode);
    } catch { /* ignore quota */ }
}

/**
 * Verrou d'évidence visuelle (« First-Principles Obvious Move Lock ») :
 * Impose le coup optimal (#1) même aux bots Débutant/Intermédiaire s'il ferme le Point d'Or (5/20)
 * ou le Point de Barre (7/18) sans créer de blot supplémentaire, ou frappe dans le jan intérieur en sécurité.
 */
export function isVisuallyObviousBestMove(
    boardBefore: ReadonlyArray<number>,
    bestBoardAfter: ReadonlyArray<number>,
    player: 'X' | 'O' = 'O',
): boolean {
    const goldenPt = player === 'X' ? 5 : 20;
    const barPt = player === 'X' ? 7 : 18;
    const isMade = (b: ReadonlyArray<number>, pt: number) => (player === 'X' ? (b[pt] ?? 0) >= 2 : (b[pt] ?? 0) <= -2);
    const countOwnBlots = (b: ReadonlyArray<number>) => {
        let blots = 0;
        for (let p = 1; p <= 24; p++) if (b[p] === (player === 'X' ? 1 : -1)) blots++;
        return blots;
    };
    const blotsDidNotIncrease = countOwnBlots(bestBoardAfter) <= countOwnBlots(boardBefore);
    if (blotsDidNotIncrease && ((!isMade(boardBefore, goldenPt) && isMade(bestBoardAfter, goldenPt)) || (!isMade(boardBefore, barPt) && isMade(bestBoardAfter, barPt)))) {
        return true;
    }
    const oppBarIdx = player === 'X' ? 25 : 0;
    const hitOpponent = Math.abs(bestBoardAfter[oppBarIdx] ?? 0) > Math.abs(boardBefore[oppBarIdx] ?? 0);
    return hitOpponent && blotsDidNotIncrease;
}

/**
 * Calcule le bonus/malus tactique déterministe propre à la personnalité du Bot (`O` = négatif dans `board[1..24]`).
 */
export function computePersonaBiasDelta(
    boardBefore: ReadonlyArray<number>,
    boardAfter: ReadonlyArray<number>,
    difficulty: AIDifficulty,
): number {
    const w = getBotPersona(difficulty).weights;
    const hitsMade = Math.max(0, (boardAfter[0] ?? 0) - (boardBefore[0] ?? 0));
    let botBlots = 0;
    let botAnchorsInPlayerHome = 0;
    let maxBotPrime = 0;
    let currentPrime = 0;
    let candlesticks = 0;

    for (let pt = 1; pt <= 24; pt++) {
        const val = boardAfter[pt] ?? 0;
        if (val === -1) botBlots++;
        if (val <= -6) candlesticks++;
        if (val <= -2) {
            currentPrime++;
            if (currentPrime > maxBotPrime) maxBotPrime = currentPrime;
            if (pt <= 6) botAnchorsInPlayerHome++;
        } else {
            currentPrime = 0;
        }
    }

    const candlestickBias = difficulty === 'beginner' ? candlesticks * 0.015 : candlesticks * -0.02;
    return (
        hitsMade * w.hitBonus +
        botBlots * w.ownBlotPenalty +
        Math.max(0, maxBotPrime - 2) * w.primeBonus +
        botAnchorsInPlayerHome * w.anchorBonus +
        candlestickBias
    );
}

/**
 * Calcule en temps réel l'Error Rate (PR) du Bot à partir des coups joués dans `matchLog`,
 * reflétant le caractère tactique de chaque persona tout en plafonnant strictement à `MAX_BOT_DISPLAY_PR` (10.0).
 */
export function computeRealtimeBotErrorRate(
    matchLog: ReadonlyArray<BotPersonaTurnLike> | undefined | null,
    difficulty: AIDifficulty = 'expert',
): number {
    const persona = getBotPersona(difficulty);
    const basePr = Math.min(MAX_BOT_DISPLAY_PR, persona.targetErrorRate);
    const botTurns = (matchLog ?? []).filter((t) => t.player === 'O');
    if (botTurns.length === 0) return basePr;

    let cumulativePr = 0;
    for (let i = 0; i < botTurns.length; i++) {
        const turn = botTurns[i];
        const biasDelta = computePersonaBiasDelta(turn.boardBefore, turn.boardAfter, difficulty);
        const blotsLeft = turn.boardAfter.slice(1, 25).filter((v) => v === -1).length;
        const turnPr = basePr + (blotsLeft - 1.5) * 0.25 - biasDelta * 1.8;
        cumulativePr += Math.max(0.1, Math.min(MAX_BOT_DISPLAY_PR, turnPr));
    }
    const livePr = (basePr + cumulativePr) / (botTurns.length + 1);
    return Number(Math.max(0.1, Math.min(MAX_BOT_DISPLAY_PR, livePr)).toFixed(1));
}

const APPSTORE_GUARDRAIL_REGEX = /\b(sex|nude|nsfw|idiot|stupide|con|merde|insulte|téléphone|rendez-vous)\b/i;

/** Génère une réponse interactive du Bot dans le chat avec filtrage strict App Store Section 1.2 */
export function generateBotChatReply(
    userMessage: string,
    difficulty: AIDifficulty,
    mode: ExperienceMode,
    prX?: number | null,
    locale: Locale = 'fr',
): { readonly text: string; readonly filteredByGuardrail: boolean } {
    const persona = getBotPersona(difficulty, locale);
    const loc = CHAT_GUARDRAIL_TEXTS[locale] ? locale : 'fr';
    const clean = userMessage.trim();

    if (APPSTORE_GUARDRAIL_REGEX.test(clean)) {
        const guardrail = CHAT_GUARDRAIL_TEXTS[loc];
        return {
            filteredByGuardrail: true,
            text: difficulty === 'intermediate' ? guardrail.intermediate : guardrail.default,
        };
    }

    const lower = clean.toLowerCase();
    if (
        lower.includes('dé') || lower.includes('dice') || lower.includes('dado') ||
        lower.includes('würfel') || lower.includes('نرد') || lower.includes('サイコロ') ||
        lower.includes('triche') || lower.includes('cheat') || lower.includes('trampa') ||
        lower.includes('truqué') || lower.includes('rigged') || lower.includes('chance') ||
        lower.includes('luck') || lower.includes('イカサマ')
    ) {
        const diceTexts = CHAT_DICE_AUDIT_TEXTS[loc];
        return {
            filteredByGuardrail: false,
            text: difficulty === 'beginner' ? diceTexts.beginner : diceTexts.default,
        };
    }

    if (
        lower.includes('videau') || lower.includes('double') || lower.includes('cube') ||
        lower.includes('doblador') || lower.includes('verdopplung') || lower.includes('مكعب') ||
        lower.includes('ダブリング')
    ) {
        const cubeTexts = CHAT_CUBE_TEXTS[loc];
        return {
            filteredByGuardrail: false,
            text: mode === 'pro' ? cubeTexts.pro : cubeTexts.fun,
        };
    }

    if (
        lower.includes('conseil') || lower.includes('aide') || lower.includes('jouer') ||
        lower.includes('avis') || lower.includes('advice') || lower.includes('help') ||
        lower.includes('tip') || lower.includes('consejo') || lower.includes('ayuda') ||
        lower.includes('dica') || lower.includes('tipp') || lower.includes('نصيحة') ||
        lower.includes('مساعدة') || lower.includes('アドバイス') || lower.includes('ヒント')
    ) {
        return {
            filteredByGuardrail: false,
            text: formatAdviceReply(loc, persona.shortName, persona.styleBadge, mode, prX),
        };
    }

    return {
        filteredByGuardrail: false,
        text: mode === 'pro'
            ? formatDefaultProReply(loc, persona.shortName, persona.styleBadge)
            : `${persona.shortName} : ${persona.dialogues.opening.fun}`,
    };
}

export interface SwapDiceComparisonSummary {
    readonly playerRollsCount: number;
    readonly botRollsCount: number;
    readonly playerTotalPips: number;
    readonly botTotalPips: number;
    readonly playerDoubles: number;
    readonly botDoubles: number;
    readonly verdictText: string;
}

/** Calcule le bilan comparatif et l'effet d'inversion des dés (Swap Dice) entre le Joueur et le Bot */
export function computeSwapDiceComparison(
    rolls: ReadonlyArray<{ readonly die1: number; readonly die2: number }>,
    locale: Locale = 'fr',
): SwapDiceComparisonSummary {
    let playerRollsCount = 0;
    let botRollsCount = 0;
    let playerTotalPips = 0;
    let botTotalPips = 0;
    let playerDoubles = 0;
    let botDoubles = 0;

    rolls.forEach((r, idx) => {
        const isDouble = r.die1 === r.die2;
        const pips = isDouble ? (r.die1 + r.die2) * 2 : r.die1 + r.die2;
        if (idx % 2 === 0) {
            playerRollsCount++;
            playerTotalPips += pips;
            if (isDouble) playerDoubles++;
        } else {
            botRollsCount++;
            botTotalPips += pips;
            if (isDouble) botDoubles++;
        }
    });

    const diff = playerTotalPips - botTotalPips;
    const verdictText = formatSwapDiceVerdict(
        locale,
        botTotalPips,
        botDoubles,
        playerTotalPips,
        playerDoubles,
        diff,
    );

    return { playerRollsCount, botRollsCount, playerTotalPips, botTotalPips, playerDoubles, botDoubles, verdictText };
}
