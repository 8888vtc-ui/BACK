/**
 * Écosystème des Bots Personnifiés, Mode Sans Hasard « Gammon36 », Grille Nardex EMG
 * & Pipeline Conversationnel Hybride < 500 ms (`botEcosystemEngine.ts`).
 *
 * Rôle :
 *   Implémente les spécifications du Dossier #6 :
 *   1. Mode d'entraînement sans hasard « Gammon36 » (grille 6×6 des 36 combinaisons de deux dés
 *      choisies par le joueur jusqu'à épuisement de la grille).
 *   2. Indice de chance GNU Backgammon (`VERY_LUCKY` > +0.6, `LUCKY` +0.3..+0.6, `UNMARKED` -0.3..+0.3,
 *      `UNLUCKY` -0.6..-0.3, `VERY_UNLUCKY` < -0.6) pour déclencher les réactions au « Huge Joker ».
 *   3. Grille Nardex de perte d'équité EMG (`OPTIMAL_OR_OK` < 0.02, `DOUBTFUL` 0.02..0.08 ignoré
 *      pour préserver le rythme, `ERROR` 0.08..0.20, `BLUNDER` >= 0.20) et détection des 4 erreurs
 *      classiques (frappe exposée, rupture de 5-prime, mauvais calcul de barre, confusion course/contact).
 *   4. Constructeur de Contexte JSON compact (fenêtré aux 10 derniers échanges = 20 messages max,
 *      contrainte < 3 phrases) et Analyseur Regex de balises `[emotion:...]` / `[action:...]` avec
 *      garde-fous CMU (zéro insulte) et App Store Section 1.2.
 *
 * Strictement 0 `any`, ≤ 400 lignes.
 */

import type { AIDifficulty } from '../../engine/aiHeuristics';
import { getBotPersona } from './botPersonas';

export type LuckCategory = 'VERY_LUCKY' | 'LUCKY' | 'UNMARKED' | 'UNLUCKY' | 'VERY_UNLUCKY';
export type NardexMoveGrade = 'OPTIMAL_OR_OK' | 'DOUBTFUL' | 'ERROR' | 'BLUNDER';
export type ClassicalBlunderPattern =
    | 'PREMATURE_PRIME_BREAKUP'
    | 'RECKLESS_HIT_EXPOSURE'
    | 'BAR_REENTRY_MISCALCULATION'
    | 'RACE_VS_CONTACT_CONFUSION'
    | 'GENERAL_POSITIONAL_LOSS';
export type BotEmotionTag = 'neutral' | 'happy' | 'smug' | 'panic' | 'thinking' | 'shocked' | 'respect';
export type BotActionTag = 'none' | 'wave' | 'adjust_glasses' | 'rub_hands' | 'sweat' | 'slam_cube';

export interface Gammon36Cell {
    readonly die1: 1 | 2 | 3 | 4 | 5 | 6;
    readonly die2: 1 | 2 | 3 | 4 | 5 | 6;
    readonly used: boolean;
}

export interface ChatTurnExchange {
    readonly sender: 'player' | 'bot';
    readonly text: string;
}

export interface BotLlmContextPayload {
    readonly persona: {
        readonly id: AIDifficulty;
        readonly name: string;
        readonly styleBadge: string;
        readonly maxSentences: 3;
        readonly cmuZeroInsultRule: true;
        readonly appStoreSection1_2Compliant: true;
    };
    readonly turnMathSummary: {
        readonly grade: NardexMoveGrade;
        readonly loss_emg: number;
        readonly pattern: ClassicalBlunderPattern;
        readonly luck: LuckCategory;
    };
    readonly memoryHighlights: readonly string[];
    readonly recentHistory: readonly ChatTurnExchange[];
}

export interface ParsedBotResponse {
    readonly cleanText: string;
    readonly emotion: BotEmotionTag;
    readonly action: BotActionTag;
    readonly filteredByGuardrail: boolean;
}

/** Limite stricte de la fenêtre d'historique glissante (10 échanges = 20 messages max). */
export const MAX_SLIDING_WINDOW_EXCHANGES = 10;
export const MAX_SLIDING_WINDOW_MESSAGES = MAX_SLIDING_WINDOW_EXCHANGES * 2;

/**
 * 1. Crée la grille complète 6×6 des 36 combinaisons possibles de deux dés pour le mode « Gammon36 ».
 */
export function createGammon36Grid(): readonly Gammon36Cell[] {
    const cells: Gammon36Cell[] = [];
    const faces = [1, 2, 3, 4, 5, 6] as const;
    for (const d1 of faces) {
        for (const d2 of faces) {
            cells.push({ die1: d1, die2: d2, used: false });
        }
    }
    return Object.freeze(cells);
}

/**
 * Consomme une combinaison `(die1, die2)` dans la grille Gammon36.
 * Si les 36 combinaisons ont toutes été jouées, réinitialise automatiquement une grille neuve.
 */
export function consumeGammon36Roll(
    grid: readonly Gammon36Cell[],
    die1: number,
    die2: number,
): { readonly updatedGrid: readonly Gammon36Cell[]; readonly wasReset: boolean } {
    const idx = grid.findIndex((c) => !c.used && c.die1 === die1 && c.die2 === die2);
    if (idx === -1) {
        throw new Error(`La combinaison ${die1}-${die2} a déjà été utilisée ou est invalide dans Gammon36.`);
    }
    const next = grid.map((c, i) => (i === idx ? { ...c, used: true } : c));
    if (next.every((c) => c.used)) {
        return { updatedGrid: createGammon36Grid(), wasReset: true };
    }
    return { updatedGrid: Object.freeze(next), wasReset: false };
}

/**
 * 2. Qualifie mathématiquement l'indice de chance d'un lancer de dés selon l'échelle GNU Backgammon :
 * - `> +0.6`       : `VERY_LUCKY` (Huge Joker)
 * - `+0.3 à +0.6`  : `LUCKY`
 * - `-0.3 à +0.3`  : `UNMARKED`
 * - `-0.6 à -0.3`  : `UNLUCKY`
 * - `< -0.6`       : `VERY_UNLUCKY`
 */
export function classifyRollLuckRating(luckDeltaEquity: number): LuckCategory {
    if (!Number.isFinite(luckDeltaEquity)) return 'UNMARKED';
    if (luckDeltaEquity > 0.6) return 'VERY_LUCKY';
    if (luckDeltaEquity >= 0.3) return 'LUCKY';
    if (luckDeltaEquity < -0.6) return 'VERY_UNLUCKY';
    if (luckDeltaEquity <= -0.3) return 'UNLUCKY';
    return 'UNMARKED';
}

/**
 * 3. Classifie la perte d'équité EMG d'un coup selon la grille Nardex :
 * - `< 0.02 EMG`     : `OPTIMAL_OR_OK`
 * - `0.02..0.08 EMG` : `DOUBTFUL` (ignoré par le Mode Tuteur en direct pour ne pas hacher le rythme)
 * - `0.08..0.20 EMG` : `ERROR`
 * - `>= 0.20 EMG`    : `BLUNDER` (déclenche l'intervention incarnée du Mode Tuteur)
 */
export function classifyMoveGradeNardex(equityLossEmg: number): NardexMoveGrade {
    const absLoss = Math.abs(Number.isFinite(equityLossEmg) ? equityLossEmg : 0);
    if (absLoss < 0.02) return 'OPTIMAL_OR_OK';
    if (absLoss < 0.08) return 'DOUBTFUL';
    if (absLoss < 0.20) return 'ERROR';
    return 'BLUNDER';
}

function maxConsecutivePlayerDoors(board: readonly number[]): number {
    let best = 0;
    let cur = 0;
    for (let pt = 1; pt <= 24; pt++) {
        if ((board[pt] ?? 0) >= 2) {
            cur++;
            if (cur > best) best = cur;
        } else {
            cur = 0;
        }
    }
    return best;
}

/**
 * Détecte laquelle des 4 erreurs classiques répertoriées par Nardex a été commise par le joueur `X`.
 */
export function detectClassicalBlunderPattern(params: {
    readonly boardBefore: readonly number[];
    readonly boardAfter: readonly number[];
    readonly isPureRace?: boolean;
}): ClassicalBlunderPattern {
    const { boardBefore, boardAfter, isPureRace = false } = params;

    // 1. Rupture prématurée d'une barricade de 5 portes (5-prime)
    const primeBefore = maxConsecutivePlayerDoors(boardBefore);
    const primeAfter = maxConsecutivePlayerDoors(boardAfter);
    if (primeBefore >= 5 && primeAfter < 5) {
        return 'PREMATURE_PRIME_BREAKUP';
    }

    // 2. Mauvais calcul des probabilités de retour de la barre adverse (board[25] = O_BAR < 0)
    const botOnBarAfter = Math.abs(boardAfter[25] ?? 0);
    const homeBlotsAfter = boardAfter.slice(1, 7).filter((v) => v === 1).length;
    if (botOnBarAfter > 0 && homeBlotsAfter >= 2) {
        return 'BAR_REENTRY_MISCALCULATION';
    }

    // 3. Frapper à tort en s'exposant (augmentation des blots du joueur après une frappe)
    const botHitCount = Math.abs(boardAfter[25] ?? 0) - Math.abs(boardBefore[25] ?? 0);
    const playerBlotsBefore = boardBefore.slice(1, 25).filter((v) => v === 1).length;
    const playerBlotsAfter = boardAfter.slice(1, 25).filter((v) => v === 1).length;
    if (botHitCount > 0 && playerBlotsAfter > playerBlotsBefore) {
        return 'RECKLESS_HIT_EXPOSURE';
    }

    // 4. Confusion entre course pure et phase de contact
    if (isPureRace) {
        return 'RACE_VS_CONTACT_CONFUSION';
    }

    return 'GENERAL_POSITIONAL_LOSS';
}

/**
 * Génère l'intervention en temps réel du Mode Tuteur incarnée par l'archétype actif.
 * Retourne `null` pour `OPTIMAL_OR_OK` et `DOUBTFUL` (0.02–0.08 EMG) afin de ne pas hacher le rythme.
 */
export function buildTutorModeInterjection(params: {
    readonly difficulty: AIDifficulty;
    readonly equityLossEmg: number;
    readonly pattern: ClassicalBlunderPattern;
}): { readonly shouldInterrupt: boolean; readonly taggedLine: string | null; readonly parsed: ParsedBotResponse | null } {
    const grade = classifyMoveGradeNardex(params.equityLossEmg);
    if (grade === 'OPTIMAL_OR_OK' || grade === 'DOUBTFUL') {
        return { shouldInterrupt: false, taggedLine: null, parsed: null };
    }

    let rawTagged = '';
    if (params.difficulty === 'beginner') {
        rawTagged =
            '[emotion:smug][action:rub_hands] Oh oui, valide ce coup ! Laisse ce pion tout seul devant mes portes, je vais me régaler !';
    } else if (params.difficulty === 'intermediate') {
        rawTagged =
            '[emotion:happy][action:wave] Un conseil d’amie au salon de Monte-Carlo : ce coup découvre ta maison face à mon ancre. Tu veux le rejouer ?';
    } else if (params.difficulty === 'expert') {
        rawTagged =
            '[emotion:thinking][action:slam_cube] Mauvaise couverture de risque sur ton capital de pips, mon ami. Ce placement dégrade ton espérance de gain !';
    } else {
        rawTagged =
            params.pattern === 'PREMATURE_PRIME_BREAKUP'
                ? '[emotion:thinking][action:adjust_glasses] Un instant. Si tu brises ta barricade de cinq portes maintenant, tu m’offres une autoroute pour m’échapper au prochain jet. Veux-tu vraiment ouvrir cette porte ?'
                : '[emotion:thinking][action:adjust_glasses] Un instant. Ce déplacement expose ta structure sur trop de combinaisons parmi les 36. Veux-tu reconsidérer ce coup ?';
    }

    return {
        shouldInterrupt: true,
        taggedLine: rawTagged,
        parsed: parseBotTaggedResponse(rawTagged),
    };
}

/**
 * 4. Assemble l'objet JSON compact pour l'inférence SLM/LLM (< 500 ms) en tronquant
 * strictement l'historique glissant aux 10 derniers échanges (20 messages maximum).
 */
export function buildBotLlmContextPayload(params: {
    readonly difficulty: AIDifficulty;
    readonly equityLossEmg: number;
    readonly pattern: ClassicalBlunderPattern;
    readonly luckDeltaEquity: number;
    readonly memoryHighlights?: readonly string[];
    readonly chatHistory: readonly ChatTurnExchange[];
}): BotLlmContextPayload {
    const persona = getBotPersona(params.difficulty);
    const loss = -Math.abs(Number((params.equityLossEmg || 0).toFixed(3)));
    const recentHistory = params.chatHistory.slice(-MAX_SLIDING_WINDOW_MESSAGES);

    return {
        persona: {
            id: persona.id,
            name: persona.name,
            styleBadge: persona.styleBadge,
            maxSentences: 3,
            cmuZeroInsultRule: true,
            appStoreSection1_2Compliant: true,
        },
        turnMathSummary: {
            grade: classifyMoveGradeNardex(params.equityLossEmg),
            loss_emg: loss,
            pattern: params.pattern,
            luck: classifyRollLuckRating(params.luckDeltaEquity),
        },
        memoryHighlights: (params.memoryHighlights ?? []).slice(-5),
        recentHistory,
    };
}

const VALID_EMOTIONS: ReadonlySet<BotEmotionTag> = new Set([
    'neutral', 'happy', 'smug', 'panic', 'thinking', 'shocked', 'respect',
]);
const VALID_ACTIONS: ReadonlySet<BotActionTag> = new Set([
    'none', 'wave', 'adjust_glasses', 'rub_hands', 'sweat', 'slam_cube',
]);
const GUARDRAIL_VIOLATION_REGEX = /\b(idiot|stupide|imbécile|nul|con|merde|sex|nude|nsfw)\b/i;

/**
 * 5. Extrait les balises `[emotion:...]` et `[action:...]`, nettoie le balisage parasite
 * et applique le filtre de sécurité CMU (zéro insulte) et App Store Section 1.2.
 */
export function parseBotTaggedResponse(rawResponse: string): ParsedBotResponse {
    const emotionMatch = rawResponse.match(/\[emotion:([a-z_]+)\]/i);
    const actionMatch = rawResponse.match(/\[action:([a-z_]+)\]/i);

    const rawEmotion = (emotionMatch?.[1]?.toLowerCase() ?? 'neutral') as BotEmotionTag;
    const rawAction = (actionMatch?.[1]?.toLowerCase() ?? 'none') as BotActionTag;

    const emotion: BotEmotionTag = VALID_EMOTIONS.has(rawEmotion) ? rawEmotion : 'neutral';
    const action: BotActionTag = VALID_ACTIONS.has(rawAction) ? rawAction : 'none';

    const stripped = rawResponse
        .replace(/\[emotion:[^\]]*\]/gi, '')
        .replace(/\[action:[^\]]*\]/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

    if (GUARDRAIL_VIOLATION_REGEX.test(stripped)) {
        return {
            cleanText: 'Quels dés capricieux ce soir ! Voyons comment évolue notre position sur le prochain lancer.',
            emotion: 'neutral',
            action: 'none',
            filteredByGuardrail: true,
        };
    }

    return {
        cleanText: stripped,
        emotion,
        action,
        filteredByGuardrail: false,
    };
}

export interface MuskBotOrchestrationDecision {
    readonly shouldSpeak: boolean;
    readonly activeSpeaker: 'NONE' | 'BOT_OPPONENT' | 'BOT_AS_TUTOR';
    readonly showKarmaSwapCta: boolean;
    readonly shouldPrewarmKarmaClip: boolean;
    readonly showOneTapReplayCta: boolean;
    readonly quickReplyPills: readonly ('⚡ Karma Swap !' | '🎲 Dés truqués ?' | '🤫 Regarde ce coup')[];
    readonly parsedMessage: ParsedBotResponse | null;
}

const SILENT_MUSK_DECISION: MuskBotOrchestrationDecision = Object.freeze({
    shouldSpeak: false,
    activeSpeaker: 'NONE',
    showKarmaSwapCta: false,
    shouldPrewarmKarmaClip: false,
    showOneTapReplayCta: false,
    quickReplyPills: [],
    parsedMessage: null,
});

/**
 * 6. Orchestrateur Organisationnel « Façon Elon Musk » (`resolveMuskBotOrchestration`) :
 * - Règle 1 (Silence pendant la réflexion) : Si `isPlayerThinking === true`, ZÉRO parole (`shouldSpeak: false`).
 * - Règle 2 (Suppression du bruit) : Les coups `OPTIMAL_OR_OK` ordinaires et `DOUBTFUL` (0.02..0.08 EMG)
 *   sans événement de chance majeur (`VERY_LUCKY` / `VERY_UNLUCKY`) restent silencieux.
 * - Règle 3 (Fusion Adversaire-Tuteur en mode `fun`, Sparring Pur en mode `pro`) :
 *   En mode `fun`, un Blunder (>= 0.08 EMG) déclenche l'alerte incarnée du Bot + bouton 1-Tap `Reprendre`.
 *   En mode `pro`, le Bot ne donne aucun conseil pendant le match (zéro indice gratuit).
 * - Règle 4 (Boucle Virale Automatique) : Si le Bot tire un `VERY_LUCKY` (Huge Joker > +0.60 Eq),
 *   il provoque le joueur, affiche le CTA `⚡ Karma Swap !` et préchauffe le Clip 9:16 en RAM.
 */
export function resolveMuskBotOrchestration(params: {
    readonly isPlayerThinking: boolean;
    readonly difficulty: AIDifficulty;
    readonly mode: 'fun' | 'pro';
    readonly actor: 'player' | 'bot';
    readonly equityLossEmg: number;
    readonly pattern: ClassicalBlunderPattern;
    readonly luckDeltaEquity: number;
}): MuskBotOrchestrationDecision {
    if (params.isPlayerThinking) return SILENT_MUSK_DECISION;

    const luck = classifyRollLuckRating(params.luckDeltaEquity);

    // Cas A : Le Bot vient de réaliser un « Huge Joker » (> +0.60 d'équité) -> Provocation + Karma Swap CTA !
    if (params.actor === 'bot' && luck === 'VERY_LUCKY') {
        const persona = getBotPersona(params.difficulty);
        const raw = `[emotion:smug][action:rub_hands] ${persona.dialogues.botHitPlayer[params.mode]}`;
        return {
            shouldSpeak: true,
            activeSpeaker: 'BOT_OPPONENT',
            showKarmaSwapCta: true,
            shouldPrewarmKarmaClip: true,
            showOneTapReplayCta: false,
            quickReplyPills: ['⚡ Karma Swap !', '🎲 Dés truqués ?', '🤫 Regarde ce coup'],
            parsedMessage: parseBotTaggedResponse(raw),
        };
    }

    // Cas B : Le joueur commet une Erreur/Gaffe (>= 0.08 EMG) en mode Fun -> L'Adversaire agit en Tuteur incarné
    if (params.actor === 'player' && params.mode === 'fun') {
        const tutor = buildTutorModeInterjection({
            difficulty: params.difficulty,
            equityLossEmg: params.equityLossEmg,
            pattern: params.pattern,
        });
        if (tutor.shouldInterrupt && tutor.parsed) {
            return {
                shouldSpeak: true,
                activeSpeaker: 'BOT_AS_TUTOR',
                showKarmaSwapCta: false,
                shouldPrewarmKarmaClip: false,
                showOneTapReplayCta: true,
                quickReplyPills: ['🤫 Regarde ce coup', '🎲 Dés truqués ?'],
                parsedMessage: tutor.parsed,
            };
        }
    }

    // Cas C : Tous les autres tours ordinaires ou mode Pro sans événement extrême -> Silence horloger
    return SILENT_MUSK_DECISION;
}

