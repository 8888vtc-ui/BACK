'use client';

/**
 * Section 3 du Rapport de Formation — Synthèse pédagogique finale par l'IA (Gemini).
 *
 * Rôle :
 *   Envoie le résumé structuré du match à `/api/coach` (streaming SSE) et affiche :
 *     - Les 3 volets pédagogiques du Coach IA (Gemini) :
 *         🎯 Le Diagnostic
 *         💡 Le Concept Clé
 *         🚀 Plan d'entraînement personnalisé
 *     - Les blocs Points forts / Faiblesses récurrentes / Plan d'entraînement.
 *
 *   Repli instantané règle-basé si hors-ligne, si l'API échoue ou après 8 s.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    buildRuleBasedSynthesis,
    type AiSynthesis,
    type MatchSummaryPayload,
} from './postMatchReportHelpers';
import { useCoachQuota } from '../../hooks/useCoachQuota';
import SubscriptionModal from '../subscription/SubscriptionModal';

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
function readStringArray(source: Record<string, unknown>, key: string): string[] {
    const value = source[key];
    if (!Array.isArray(value)) return [];
    return value.filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
}

/** Parse la réponse JSON (complète ou partielle) du LLM. */
function parseSynthesis(raw: string): AiSynthesis | null {
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        if (parsed && typeof parsed === 'object') {
            const rawKeyConcept = parsed.keyConcept as Record<string, unknown> | undefined;
            const keyConcept =
                rawKeyConcept && typeof rawKeyConcept.title === 'string'
                    ? {
                          title: rawKeyConcept.title,
                          explanation:
                              typeof rawKeyConcept.explanation === 'string'
                                  ? rawKeyConcept.explanation
                                  : '',
                      }
                    : undefined;

            return {
                title: typeof parsed.title === 'string' ? parsed.title : undefined,
                summary: typeof parsed.summary === 'string' ? parsed.summary : undefined,
                diagnostic: typeof parsed.diagnostic === 'string' ? parsed.diagnostic : undefined,
                keyConcept,
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
    const quotaState = useCoachQuota({ locale });
    const [synthesis, setSynthesis] = useState<AiSynthesis | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [source, setSource] = useState<'llm' | 'rule-based' | null>(null);
    const [isQuotaBlocked, setIsQuotaBlocked] = useState<boolean>(false);
    const [isPaywallOpen, setIsPaywallOpen] = useState<boolean>(false);
    const abortRef = useRef<AbortController | null>(null);

    const runFallback = useCallback(() => {
        setSynthesis(buildRuleBasedSynthesis(payload, locale));
        setSource('rule-based');
        setIsLoading(false);
    }, [payload, locale]);

    const generate = useCallback(async () => {
        if (isOffline || (typeof navigator !== 'undefined' && !navigator.onLine)) {
            runFallback();
            return;
        }

        if (quotaState.isQuotaReached && !quotaState.isVip) {
            setIsQuotaBlocked(true);
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

            if (res.status === 402) {
                setIsQuotaBlocked(true);
                runFallback();
                return;
            }

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
                        const item = JSON.parse(dataStr) as { token?: string; content?: string };
                        const token = item.token ?? item.content ?? '';
                        if (token) accumulated += token;
                    } catch {
                        // Fragment JSON incomplet : ignoré.
                    }
                }
            }

            const parsed = parseSynthesis(accumulated);
            if (parsed && (parsed.strengths.length > 0 || parsed.weaknesses.length > 0 || parsed.diagnostic)) {
                const fallback = buildRuleBasedSynthesis(payload, locale);
                setSynthesis({
                    ...fallback,
                    ...parsed,
                    diagnostic: parsed.diagnostic ?? fallback.diagnostic,
                    keyConcept: parsed.keyConcept ?? fallback.keyConcept,
                    strengths: parsed.strengths.length > 0 ? parsed.strengths : fallback.strengths,
                    weaknesses: parsed.weaknesses.length > 0 ? parsed.weaknesses : fallback.weaknesses,
                    trainingPlan: parsed.trainingPlan.length > 0 ? parsed.trainingPlan : fallback.trainingPlan,
                });
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
    }, [apiUrl, isEn, isOffline, locale, payload, quotaState.isQuotaReached, quotaState.isVip, runFallback]);

    useEffect(() => {
        void generate();
        return () => {
            abortRef.current?.abort();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const blocks: Array<{
        key: 'strengths' | 'weaknesses' | 'trainingPlan';
        icon: string;
        title: string;
        className: string;
    }> = [
        {
            key: 'strengths',
            icon: '🌟',
            title: isEn ? 'Observed strengths' : 'Points forts observés',
            className: 'border-emerald-700/50 bg-emerald-950/25 text-emerald-200',
        },
        {
            key: 'weaknesses',
            icon: '⚠️',
            title: isEn ? 'Recurring weaknesses' : 'Faiblesses récurrentes détectées',
            className: 'border-amber-700/50 bg-amber-950/25 text-amber-200',
        },
        {
            key: 'trainingPlan',
            icon: '🚀',
            title: isEn ? 'Personalized training plan' : 'Plan d’entraînement personnalisé',
            className: 'border-[#d4af37]/50 bg-[#26160c]/60 text-[#fce8b2]',
        },
    ];

    return (
        <section
            data-testid="post-match-ai-synthesis"
            aria-label={isEn ? 'AI pedagogical synthesis' : 'Synthèse pédagogique IA'}
            className="rounded-2xl border border-[#d4af37]/40 bg-gradient-to-b from-[#1e120a]/90 to-[#110904]/95 p-4 space-y-2.5"
        >
            <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[#d4af37]/25 pb-2">
                <h3 className="flex items-center gap-1.5 font-serif text-xs font-black uppercase tracking-wider text-[#f3c65f]">
                    <span aria-hidden="true">🧠</span>
                    <span>
                        {isEn ? 'Grandmaster AI Diagnostic (Gemini)' : 'Diagnostic du Grand-Maître IA (Gemini)'}
                    </span>
                </h3>
                <div className="flex items-center gap-1.5">
                    <span
                        data-testid="post-match-quota-badge"
                        className="rounded-full border border-[#d4af37]/40 bg-[#1a0f07] px-2 py-0.5 text-[9px] font-bold text-[#fce8b2]"
                    >
                        {quotaState.badgeLabel}
                    </span>
                    {!quotaState.isVip && (
                        <button
                            type="button"
                            onClick={() => setIsPaywallOpen(true)}
                            data-testid="post-match-open-paywall-btn"
                            className="rounded-full border border-[#f3c65f]/65 bg-gradient-to-r from-[#3b191d] to-[#261209] px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#f3c65f] transition hover:brightness-110"
                        >
                            ⚜ {isEn ? 'Unlimited VIP' : 'Coach VIP'}
                        </button>
                    )}
                    {source && (
                        <span
                            data-testid="post-match-ai-source"
                            className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${
                                source === 'llm'
                                    ? 'border-[#f3c65f]/60 bg-[#2d1a0b] text-[#f3c65f]'
                                    : 'border-amber-700/60 bg-amber-950/60 text-amber-300'
                            }`}
                        >
                            {source === 'llm' ? '🤖 Gemini IA' : '📴 Local'}
                        </span>
                    )}
                </div>
            </header>

            {(isQuotaBlocked || quotaState.isQuotaReached) && !quotaState.isVip && (
                <div
                    data-testid="post-match-quota-paywall-banner"
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 rounded-xl border border-[#f3c65f]/55 bg-gradient-to-r from-[#2e1318]/90 via-[#1f0e08]/95 to-[#160b06]/95 p-3 text-xs text-[#fdf8eb]"
                >
                    <div className="space-y-0.5">
                        <p className="font-serif text-[11px] font-black uppercase tracking-wider text-[#f3c65f]">
                            ⚜ {isEn ? 'Daily free AI Coach limit reached (3/3)' : 'Quota quotidien de 3 analyses IA atteint (3/3)'}
                        </p>
                        <p className="text-[11px] text-[#e8dcc6]/85">
                            {isEn
                                ? 'Your Open Sage PR and match stats remain 100% free. Unlock unlimited Gemini Grandmaster reviews.'
                                : 'Votre PR Open Sage et vos scores restent 100 % gratuits. Débloquez les explications Gemini illimitées.'}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsPaywallOpen(true)}
                        data-testid="post-match-paywall-cta"
                        className="shrink-0 rounded-xl border border-[#f3c65f] bg-gradient-to-r from-[#8b6914] via-[#d4af37] to-[#f3c65f] px-3.5 py-1.5 text-[11px] font-black uppercase tracking-wider text-[#1a0f07] shadow-md transition hover:brightness-105"
                    >
                        {isEn ? 'Unlock Unlimited Coach' : 'Débloquer le Coach Illimité'}
                    </button>
                </div>
            )}

            <SubscriptionModal
                isOpen={isPaywallOpen}
                onClose={() => setIsPaywallOpen(false)}
                locale={locale}
            />

            {isLoading && !synthesis && (
                <div
                    data-testid="post-match-ai-loading"
                    className="flex items-center gap-2 rounded-lg border border-[#d4af37]/40 bg-[#1a0f08] p-3 text-[11px] text-[#fce8b2]"
                >
                    <span className="h-2 w-2 animate-pulse rounded-full bg-[#f3c65f]" />
                    {isEn ? 'Analyzing your game…' : 'Analyse de votre partie en cours…'}
                </div>
            )}

            {synthesis?.summary && (
                <p className="text-[11px] font-semibold leading-snug text-[#fdf8eb]">
                    {synthesis.summary}
                </p>
            )}

            {/* Volets 1 & 2 du Coach IA : 🎯 Le Diagnostic & 💡 Le Concept Clé */}
            {synthesis && (synthesis.diagnostic || synthesis.keyConcept) && (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {synthesis.diagnostic && (
                        <div
                            data-testid="post-match-ai-diagnostic"
                            className="rounded-xl border border-rose-500/40 bg-rose-950/20 p-2.5 text-[11px] text-rose-100"
                        >
                            <span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-rose-300">
                                🎯 {isEn ? 'The Diagnostic' : 'Le Diagnostic'}
                            </span>
                            <p className="leading-relaxed">{synthesis.diagnostic}</p>
                        </div>
                    )}
                    {synthesis.keyConcept && (
                        <div
                            data-testid="post-match-ai-key-concept"
                            className="rounded-xl border border-[#d4af37]/50 bg-[#26160c]/55 p-2.5 text-[11px] text-[#fdf8eb]"
                        >
                            <span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-[#f3c65f]">
                                💡 {isEn ? 'Key Concept: ' : 'Le Concept Clé : '}
                                {synthesis.keyConcept.title}
                            </span>
                            <p className="leading-relaxed text-[#e8dcc6]">
                                {synthesis.keyConcept.explanation}
                            </p>
                        </div>
                    )}
                </div>
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
