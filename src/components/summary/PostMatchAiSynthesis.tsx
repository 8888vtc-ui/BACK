'use client';

/**
 * Section 3 du Rapport de Formation — Synthèse pédagogique finale par l'IA.
 *
 * Rôle :
 *   Envoie le résumé structuré du match à `/api/coach` (streaming SSE) et affiche
 *   le Diagnostic du Grand-Maître en 3 blocs :
 *     🌟 Points forts observés
 *     ⚠️ Faiblesses récurrentes détectées
 *     🎯 Plan d'entraînement recommandé
 *
 *   Repli instantané règle-basé si hors-ligne, si l'API échoue ou après 8 s.
 *
 * Composant 100 % muet côté calcul (LOI 5) : la génération de repli est déléguée
 * à `buildRuleBasedSynthesis`.
 *
 * Dépendances :
 *   `postMatchReportHelpers`.
 *
 * Retrait :
 *   Supprimer ce fichier et son usage dans `PostMatchTrainingReport.tsx`.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    buildRuleBasedSynthesis,
    type AiSynthesis,
    type MatchSummaryPayload,
} from './postMatchReportHelpers';

export interface PostMatchAiSynthesisProps {
    /** Résumé structuré du match. */
    payload: MatchSummaryPayload;
    /** Endpoint de l'API Coach. */
    apiUrl?: string;
    /** Mode hors-ligne forcé. */
    isOffline?: boolean;
    /** Langue d'affichage. */
    locale?: string;
}

/** Extrait un tableau de chaînes depuis un JSON partiel ou complet. */
function readStringArray(source: any, key: string): string[] {
    const value = source?.[key];
    if (!Array.isArray(value)) return [];
    return value.filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
}

/** Parse la réponse JSON (complète ou partielle) du LLM. */
function parseSynthesis(raw: string): AiSynthesis | null {
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
            return {
                title: typeof parsed.title === 'string' ? parsed.title : undefined,
                summary: typeof parsed.summary === 'string' ? parsed.summary : undefined,
                strengths: readStringArray(parsed, 'strengths'),
                weaknesses: readStringArray(parsed, 'weaknesses'),
                trainingPlan: readStringArray(parsed, 'trainingPlan'),
            };
        }
    } catch {
        // Flux partiel : on retombe sur le repli local.
    }
    return null;
}

const PostMatchAiSynthesisComponent: React.FC<PostMatchAiSynthesisProps> = ({
    payload,
    apiUrl = '/api/coach',
    isOffline = false,
    locale = 'fr',
}) => {
    const isEn = locale === 'en';
    const [synthesis, setSynthesis] = useState<AiSynthesis | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [source, setSource] = useState<'llm' | 'rule-based' | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    const runFallback = useCallback(() => {
        setSynthesis(buildRuleBasedSynthesis(payload));
        setSource('rule-based');
        setIsLoading(false);
    }, [payload]);

    const generate = useCallback(async () => {
        // Hors-ligne : repli immédiat, aucun appel réseau.
        if (isOffline || (typeof navigator !== 'undefined' && !navigator.onLine)) {
            runFallback();
            return;
        }

        setIsLoading(true);
        const controller = new AbortController();
        abortRef.current = controller;
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        try {
            const res = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'text/event-stream',
                },
                body: JSON.stringify({
                    mode: 'post-match-synthesis',
                    summary: payload,
                    language: isEn ? 'en' : 'fr',
                }),
                signal: controller.signal,
            });

            if (!res.ok || !res.body) {
                throw new Error(`Erreur réseau (${res.status})`);
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let accumulated = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() ?? '';

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed.startsWith('data:')) continue;
                    const dataStr = trimmed.replace(/^data:\s*/, '');
                    if (dataStr === '[DONE]') continue;
                    try {
                        const item = JSON.parse(dataStr);
                        const token = item.token ?? item.content ?? '';
                        if (token) accumulated += token;
                    } catch {
                        // Fragment JSON incomplet : ignoré.
                    }
                }
            }

            const parsed = parseSynthesis(accumulated);
            if (parsed && (parsed.strengths.length > 0 || parsed.weaknesses.length > 0)) {
                setSynthesis(parsed);
                setSource('llm');
                setIsLoading(false);
                return;
            }
            runFallback();
        } catch {
            runFallback();
        } finally {
            clearTimeout(timeoutId);
        }
    }, [apiUrl, isEn, isOffline, payload, runFallback]);

    // Génération automatique au montage.
    useEffect(() => {
        void generate();
        return () => {
            abortRef.current?.abort();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const blocks: Array<{ key: 'strengths' | 'weaknesses' | 'trainingPlan'; icon: string; title: string; className: string }> = [
        {
            key: 'strengths',
            icon: '🌟',
            title: isEn ? 'Observed strengths' : 'Points forts observés',
            className: 'border-emerald-800/60 bg-emerald-950/25 text-emerald-200',
        },
        {
            key: 'weaknesses',
            icon: '⚠️',
            title: isEn ? 'Recurring weaknesses' : 'Faiblesses récurrentes détectées',
            className: 'border-amber-800/60 bg-amber-950/25 text-amber-200',
        },
        {
            key: 'trainingPlan',
            icon: '🎯',
            title: isEn ? 'Recommended training plan' : 'Plan d’entraînement recommandé',
            className: 'border-indigo-800/60 bg-indigo-950/25 text-indigo-200',
        },
    ];

    return (
        <section
            data-testid="post-match-ai-synthesis"
            aria-label={isEn ? 'AI pedagogical synthesis' : 'Synthèse pédagogique IA'}
            className="rounded-2xl border border-indigo-800/60 bg-gradient-to-b from-indigo-950/40 to-slate-950/80 p-4 space-y-2.5"
        >
            <header className="flex items-center justify-between border-b border-indigo-900/50 pb-2">
                <h3 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-indigo-300">
                    <span aria-hidden="true">🧠</span>
                    <span>{isEn ? 'Grandmaster diagnostic' : 'Diagnostic du Grand-Maître IA'}</span>
                </h3>
                {source && (
                    <span
                        data-testid="post-match-ai-source"
                        className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${source === 'llm'
                            ? 'border-blue-700/60 bg-blue-950/60 text-blue-300'
                            : 'border-amber-700/60 bg-amber-950/60 text-amber-300'
                            }`}
                    >
                        {source === 'llm' ? '🤖 IA' : isEn ? '📴 Local' : '📴 Local'}
                    </span>
                )}
            </header>

            {isLoading && !synthesis && (
                <div
                    data-testid="post-match-ai-loading"
                    className="flex items-center gap-2 rounded-lg border border-indigo-800/50 bg-indigo-950/30 p-3 text-[11px] text-indigo-200"
                >
                    <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-400" />
                    {isEn ? 'Analyzing your game…' : 'Analyse de votre partie en cours…'}
                </div>
            )}

            {synthesis?.summary && (
                <p className="text-[11px] font-semibold leading-snug text-white">
                    {synthesis.summary}
                </p>
            )}

            {synthesis &&
                blocks.map((block) => {
                    const items = synthesis[block.key] ?? [];
                    if (items.length === 0) return null;
                    return (
                        <div
                            key={block.key}
                            data-testid={`post-match-ai-${block.key}`}
                            className={`rounded-xl border p-2.5 ${block.className}`}
                        >
                            <span className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
                                <span aria-hidden="true">{block.icon}</span>
                                <span>{block.title}</span>
                            </span>
                            <ul className="space-y-0.5">
                                {items.map((item, i) => (
                                    <li key={i} className="flex gap-1.5 text-[11px] leading-relaxed">
                                        <span aria-hidden="true" className="opacity-60">
                                            •
                                        </span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    );
                })}
        </section>
    );
};

/** Composant mémoïsé : ne re-rend que si ses props changent. */
export const PostMatchAiSynthesis = React.memo(PostMatchAiSynthesisComponent);
export default PostMatchAiSynthesis;
