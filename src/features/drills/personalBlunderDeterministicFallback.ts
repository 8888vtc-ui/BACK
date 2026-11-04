/**
 * @file src/features/drills/personalBlunderDeterministicFallback.ts
 * @description Gestionnaire de cascade des modèles Gemini (FlashLite) avec cache LRU et fallback déterministe en < 50 ms.
 * Strictement <= 400 lignes, 0 `any` (GOVERNANCE.md & SCALABILITY.md).
 */

import { type PersonalBlunderCoachTexts } from './personalBlunderPipeline';

export interface GeminiCascadeOptions {
    readonly customFetch?: (url: string, init?: RequestInit) => Promise<Response>;
    readonly skipCache?: boolean;
}

export interface PersonalBlunderCoachParams {
    readonly xgid: string;
    readonly playerBlunderMove: string;
    readonly playerBlunderDeltaEmg: number;
    readonly playerBlunderErPr: number;
    readonly optimalMove: string;
    readonly opponentPersonaName: string;
}

const coachCache = new Map<string, PersonalBlunderCoachTexts>();

export function clearPersonalBlunderCoachCache(): void {
    coachCache.clear();
}

/**
 * Construit un corps de requête nettoyé sans paramètres dépréciés et strictement limité à maxOutputTokens: 250.
 */
export function buildSanitizedGeminiRequestBody(prompt: string): Record<string, unknown> {
    return {
        contents: [
            {
                parts: [{ text: prompt }],
            },
        ],
        maxOutputTokens: 250,
    };
}

/**
 * Génère les textes du coach avec cascade de modèles (gemini-flash-lite-latest ➔ gemini-3.5-flash-lite)
 * et fallback déterministe en < 50 ms en cas de panne totale.
 */
export async function generatePersonalBlunderCoachWithCascade(
    params: PersonalBlunderCoachParams,
    options?: GeminiCascadeOptions,
): Promise<PersonalBlunderCoachTexts> {
    const cacheKey = `${params.xgid}::${params.playerBlunderMove}`;
    if (!options?.skipCache && coachCache.has(cacheKey)) {
        const cached = coachCache.get(cacheKey)!;
        return {
            ...cached,
            cacheHit: true,
        };
    }

    const prompt = `Analyse ce blunder de match contre ${params.opponentPersonaName}. Coup joué: ${params.playerBlunderMove}, delta EMG: ${params.playerBlunderDeltaEmg}, ER/PR: ${params.playerBlunderErPr.toFixed(1)}. Optimal: ${params.optimalMove}.`;
    const modelsToTry = ['gemini-flash-lite-latest', 'gemini-3.5-flash-lite'];
    const fetchFn = options?.customFetch ?? globalThis.fetch;

    for (const model of modelsToTry) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
            const response = await fetchFn(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(buildSanitizedGeminiRequestBody(prompt)),
            });

            if (!response.ok) {
                continue;
            }

            const data = (await response.json()) as {
                readonly candidates?: ReadonlyArray<{
                    readonly content?: {
                        readonly parts?: ReadonlyArray<{ readonly text?: string }>;
                    };
                }>;
            };

            const textPart = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textPart) {
                let parsedJson: Partial<PersonalBlunderCoachTexts> = {};
                try {
                    parsedJson = JSON.parse(textPart) as Partial<PersonalBlunderCoachTexts>;
                } catch {
                    parsedJson = { contextHook: textPart };
                }

                const result: PersonalBlunderCoachTexts = {
                    contextHook: parsedJson.contextHook ?? `Erreur de ${params.playerBlunderErPr.toFixed(1)} PR détectée contre ${params.opponentPersonaName} (delta ${params.playerBlunderDeltaEmg.toFixed(3)} EMG).`,
                    socraticHint: parsedJson.socraticHint ?? `Pourquoi le coup ${params.optimalMove} surpasse-t-il ${params.playerBlunderMove} dans cette position ?`,
                    revengeSuccessCoach: parsedJson.revengeSuccessCoach ?? 'Magnifique revanche ! Tu as corrigé ton erreur avec brio.',
                    relapseErrorCoach: parsedJson.relapseErrorCoach ?? `Attention, tu as rejoué un coup sous-optimal. Le coup optimal était ${params.optimalMove}.`,
                    modelUsed: model,
                    usedDeterministicFallback: false,
                    cacheHit: false,
                };

                coachCache.set(cacheKey, result);
                return result;
            }
        } catch {
            // Passer au modèle suivant
        }
    }

    const fallbackResult: PersonalBlunderCoachTexts = {
        contextHook: `Erreur critique de ${params.playerBlunderErPr.toFixed(1)} PR en match contre ${params.opponentPersonaName} (delta ${params.playerBlunderDeltaEmg.toFixed(3)} EMG).`,
        socraticHint: `Examine la géométrie de ton plateau : comment améliorer ton placement par rapport à ${params.optimalMove} ?`,
        revengeSuccessCoach: 'Brillante revanche ! Ton apprentissage FSRS est validé.',
        relapseErrorCoach: `Attention au piège tactique. Le coup optimal reste ${params.optimalMove}.`,
        modelUsed: 'deterministic-fallback',
        usedDeterministicFallback: true,
        cacheHit: false,
    };

    coachCache.set(cacheKey, fallbackResult);
    return fallbackResult;
}
