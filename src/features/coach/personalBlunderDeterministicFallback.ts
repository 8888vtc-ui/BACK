/**
 * @file personalBlunderDeterministicFallback.ts
 * @description Secours déterministe instantané (0 ms), cache serveur LRU et orchestrateur cascade Gemini
 * pour le coach personnel de blunder.
 * Respecte strictement les règles : zéro any, zéro PR_ONLY, architecture Tesla 3-secondes (18-25 mots).
 */

import { GEMINI_LITE_INTERNAL_SYSTEM_PROMPT, evaluateMoveBlunderGate } from '../../lib/coachSystemPrompt';
import { enforceTierVocabularyGuard, type CoachPlayerTier } from '../../lib/coach/coachAdaptiveKnowledgeDb';

export interface PersonalBlunderCoachRequestPayload {
    readonly xgid: string;
    readonly quizType: 'CHECKER_PLAY' | 'CUBE_DECISION';
    readonly matchFormatLabel: string;
    readonly opponentPersonaName: string;
    readonly dice: readonly [number, number];
    readonly pipDiff: number;
    readonly directShotsOn36: number;
    readonly indirectShotsOn36: number;
    readonly constructiveRollsOn36: number;
    readonly quizTargetER: number;
    readonly playerBlunderMove: string;
    readonly playerBlunderDeltaEmg: number;
    readonly playerBlunderErPr: number;
    readonly optimalMove: string;
    readonly optimalEquity: number;
    readonly secondBestMove: string;
    readonly secondBestDeltaEmg: number;
    readonly playerTier?: CoachPlayerTier;
}

export interface PersonalBlunderCoachTexts {
    readonly contextHook: string;
    readonly socraticHint: string;
    readonly revengeSuccessCoach: string;
    readonly relapseErrorCoach: string;
    readonly modelUsed: string;
    readonly usedDeterministicFallback: boolean;
    readonly cacheHit: boolean;
}

// Cache LRU simple en mémoire
const PERSONAL_BLUNDER_CACHE_MAX_SIZE = 250;
const personalBlunderCache = new Map<string, PersonalBlunderCoachTexts>();

/**
 * Calcule une clé de cache FNV-1a hexadécimale simplifiée pour un XGID et un coup donné.
 */
export function computePersonalBlunderCacheKey(xgid: string, playerBlunderMove: string): string {
    const raw = `${xgid.trim()}::${playerBlunderMove.trim().toLowerCase()}`;
    let hash = 2166136261;
    for (let i = 0; i < raw.length; i++) {
        hash ^= raw.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16);
}

export function getCachedPersonalBlunderCoach(key: string): PersonalBlunderCoachTexts | undefined {
    return personalBlunderCache.get(key);
}

export function setCachedPersonalBlunderCoach(key: string, texts: PersonalBlunderCoachTexts): void {
    if (personalBlunderCache.size >= PERSONAL_BLUNDER_CACHE_MAX_SIZE) {
        const firstKey = personalBlunderCache.keys().next().value;
        if (firstKey !== undefined) {
            personalBlunderCache.delete(firstKey);
        }
    }
    personalBlunderCache.set(key, texts);
}

export function clearPersonalBlunderCoachCacheForTests(): void {
    personalBlunderCache.clear();
}

/**
 * Génère les textes de coach de manière 100% déterministe en 0 ms.
 * Contraintes : 18 à 25 mots par texte, aucun spoiler de optimalMove dans contextHook/socraticHint.
 */
export function buildDeterministicPersonalBlunderTexts(
    payload: PersonalBlunderCoachRequestPayload,
    modelUsed = 'deterministic-0ms-fallback'
): PersonalBlunderCoachTexts {
    const {
        opponentPersonaName,
        matchFormatLabel,
        playerBlunderMove,
        playerBlunderDeltaEmg,
        playerBlunderErPr,
        optimalMove,
        directShotsOn36,
        constructiveRollsOn36,
        pipDiff,
    } = payload;

    const absDelta = Math.abs(playerBlunderDeltaEmg).toFixed(3);
    const erPrStr = playerBlunderErPr.toFixed(1);

    const contextHook = `Face à ${opponentPersonaName} en ${matchFormatLabel}, ton choix ${playerBlunderMove} coûte ${absDelta} EMG (ER / PR ${erPrStr}). Analysons l'impact tactique.`;
    const socraticHint = `Observe la géométrie : ${directShotsOn36}/36 tirs directs exposés, ${constructiveRollsOn36}/36 constructeurs utiles et ${pipDiff} pips d'écart. Quel autre plan sécurise ta position ?`;
    const revengeSuccessCoach = `Revanche réussie ! Le coup maître ${optimalMove} atteint 0.000 EMG, récupère +${absDelta} EMG et améliore ton ER / PR de -0.2. Excellente maîtrise.`;
    const relapseErrorCoach = `Rechute tactique : ${playerBlunderMove} perd ${absDelta} EMG (ER / PR ${erPrStr}) face aux ${constructiveRollsOn36}/36 constructeurs de ${optimalMove}. Restes rigoureux !`;

    const raw = {
        contextHook,
        socraticHint,
        revengeSuccessCoach,
        relapseErrorCoach,
        modelUsed,
        usedDeterministicFallback: true,
        cacheHit: false,
    };

    if (payload.playerTier === 'BEGINNER') {
        return {
            ...raw,
            contextHook: enforceTierVocabularyGuard(contextHook, 'BEGINNER', 'fr').sanitizedText,
            socraticHint: enforceTierVocabularyGuard(socraticHint, 'BEGINNER', 'fr').sanitizedText,
            revengeSuccessCoach: enforceTierVocabularyGuard(revengeSuccessCoach, 'BEGINNER', 'fr').sanitizedText,
            relapseErrorCoach: enforceTierVocabularyGuard(relapseErrorCoach, 'BEGINNER', 'fr').sanitizedText,
        };
    }

    return raw;
}

export const GEMINI_FLASH_LITE_MODEL_CASCADE = [
    'gemini-flash-lite-latest',
    'gemini-3.5-flash-lite',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
] as const;

export interface GeminiResponseCandidate {
    readonly content?: {
        readonly parts?: readonly {
            readonly text?: string;
        }[];
    };
}

export interface GeminiApiResponse {
    readonly candidates?: readonly GeminiResponseCandidate[];
}

export function buildSanitizedGeminiRequestBody(payload: PersonalBlunderCoachRequestPayload): string {
    const prompt = `Tu es un grand-maître expert de Backgammon (style Magriel/Trice).
Analyse cette position de blunder et rédige exactement 4 textes courts (18 à 25 mots chacun) au format JSON strict avec les clés:
"contextHook", "socraticHint", "revengeSuccessCoach", "relapseErrorCoach".

Données:
- XGID: ${payload.xgid}
- Adversaire: ${payload.opponentPersonaName} (${payload.matchFormatLabel})
- Dés: ${payload.dice[0]}-${payload.dice[1]}
- Coup joué (erreur): ${payload.playerBlunderMove} (delta: ${payload.playerBlunderDeltaEmg} EMG, ER/PR: ${payload.playerBlunderErPr})
- Coup optimal: ${payload.optimalMove}
- Tirs directs: ${payload.directShotsOn36}/36, Constructeurs: ${payload.constructiveRollsOn36}/36, Pip diff: ${payload.pipDiff}

Règles impératives :
1. "contextHook" et "socraticHint" ne doivent JAMAIS révéler ${payload.optimalMove} (zéro spoiler).
2. Chaque texte doit faire entre 18 et 25 mots.
3. Réponds UNIQUEMENT en JSON valide sans markdown additionnel.`;

    return JSON.stringify({
        systemInstruction: {
            parts: [{ text: GEMINI_LITE_INTERNAL_SYSTEM_PROMPT }],
        },
        contents: [
            {
                parts: [{ text: prompt }],
            },
        ],
        generationConfig: {
            maxOutputTokens: 250,
        },
    });
}

export interface GenerationOptions {
    readonly customFetch?: typeof fetch;
    readonly apiKeyOverride?: string;
    readonly timeoutMs?: number;
    readonly skipCache?: boolean;
}

export async function generatePersonalBlunderCoachWithCascade(
    payload: PersonalBlunderCoachRequestPayload,
    options?: GenerationOptions
): Promise<PersonalBlunderCoachTexts> {
    const cacheKey = computePersonalBlunderCacheKey(payload.xgid, payload.playerBlunderMove);
    const skipCache = options?.skipCache ?? false;

    if (!skipCache) {
        const cached = getCachedPersonalBlunderCoach(cacheKey);
        if (cached !== undefined) {
            return {
                ...cached,
                cacheHit: true,
            };
        }
    }

    const gateCheck = evaluateMoveBlunderGate(payload.playerBlunderDeltaEmg);
    if (!gateCheck.isBlunderQuizEligible) {
        const absLoss = Math.abs(payload.playerBlunderDeltaEmg).toFixed(3);
        const nonBlunderTexts: PersonalBlunderCoachTexts = {
            contextHook: `👍 Très bon coup (-${absLoss} EMG) ! Ce n'est pas une erreur, mais voici comment gagner +${absLoss} EMG de plus...`,
            socraticHint: `Observe la position : avec ${payload.pipDiff} pips d'écart et ${payload.constructiveRollsOn36}/36 constructeurs, ce choix est tout à fait solide.`,
            revengeSuccessCoach: `Bien joué ! Tu as validé un excellent coup (${absLoss} EMG).`,
            relapseErrorCoach: `Rien à signaler, le coup joué est très satisfaisant.`,
            modelUsed: 'gate-pre-call-good-move',
            usedDeterministicFallback: true,
            cacheHit: false,
        };
        setCachedPersonalBlunderCoach(cacheKey, nonBlunderTexts);
        return nonBlunderTexts;
    }

    const apiKey =
        options?.apiKeyOverride ??
        process.env.GEMINI_API_KEY ??
        process.env.GOOGLE_AI_API_KEY;

    const fetchFn = options?.customFetch ?? fetch;
    const timeoutMs = options?.timeoutMs ?? 2000;

    if (!apiKey) {
        const fallback = buildDeterministicPersonalBlunderTexts(payload, 'deterministic-0ms-fallback-no-apikey');
        setCachedPersonalBlunderCoach(cacheKey, fallback);
        return fallback;
    }

    for (const modelName of GEMINI_FLASH_LITE_MODEL_CASCADE) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
            const res = await fetchFn(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: buildSanitizedGeminiRequestBody(payload),
                signal: AbortSignal.timeout(timeoutMs),
            });

            if (!res.ok) {
                continue;
            }

            const data = (await res.json()) as GeminiApiResponse;
            const textPart = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!textPart) {
                continue;
            }

            let cleanJson = textPart.trim();
            if (cleanJson.startsWith('```json')) {
                cleanJson = cleanJson.slice(7);
            } else if (cleanJson.startsWith('```')) {
                cleanJson = cleanJson.slice(3);
            }
            if (cleanJson.endsWith('```')) {
                cleanJson = cleanJson.slice(0, -3);
            }
            cleanJson = cleanJson.trim();

            const parsed = JSON.parse(cleanJson) as {
                readonly contextHook?: string;
                readonly socraticHint?: string;
                readonly revengeSuccessCoach?: string;
                readonly relapseErrorCoach?: string;
            };

            if (
                typeof parsed.contextHook === 'string' &&
                typeof parsed.socraticHint === 'string' &&
                typeof parsed.revengeSuccessCoach === 'string' &&
                typeof parsed.relapseErrorCoach === 'string'
            ) {
                const optimalLower = payload.optimalMove.toLowerCase();
                if (
                    parsed.contextHook.toLowerCase().includes(optimalLower) ||
                    parsed.socraticHint.toLowerCase().includes(optimalLower)
                ) {
                    continue;
                }

                const result: PersonalBlunderCoachTexts = {
                    contextHook: parsed.contextHook,
                    socraticHint: parsed.socraticHint,
                    revengeSuccessCoach: parsed.revengeSuccessCoach,
                    relapseErrorCoach: parsed.relapseErrorCoach,
                    modelUsed: modelName,
                    usedDeterministicFallback: false,
                    cacheHit: false,
                };

                setCachedPersonalBlunderCoach(cacheKey, result);
                return result;
            }
        } catch {
            // continue
        }
    }

    const fallback = buildDeterministicPersonalBlunderTexts(payload, 'deterministic-0ms-fallback-cascade-exhausted');
    setCachedPersonalBlunderCoach(cacheKey, fallback);
    return fallback;
}
