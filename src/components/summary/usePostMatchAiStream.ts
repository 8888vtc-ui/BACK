'use client';

/**
 * Hook d'appel asynchrone non-bloquant à Gemini (/api/coach mode post-match-synthesis)
 * avec repli déterministe local immédiat (< 300 lignes, 0 any).
 */

import { useEffect, useMemo, useState } from 'react';
import {
    buildRuleBasedSynthesis,
    type AiSynthesis,
    type MatchSummaryPayload,
} from './postMatchReportHelpers';

export interface UsePostMatchAiStreamOptions {
    summaryPayload: MatchSummaryPayload;
    apiUrl: string;
    isOffline: boolean;
    effectiveIsQuotaReached: boolean;
    locale: string;
}

export function usePostMatchAiStream({
    summaryPayload,
    apiUrl,
    isOffline,
    effectiveIsQuotaReached,
    locale,
}: UsePostMatchAiStreamOptions): {
    aiSynthesis: AiSynthesis;
    synthesisSource: 'llm' | 'rule-based';
} {
    const isEn = locale === 'en';
    const fallbackSynthesis = useMemo(
        () => buildRuleBasedSynthesis(summaryPayload, locale),
        [summaryPayload, locale],
    );

    const [aiSynthesis, setAiSynthesis] = useState<AiSynthesis>(fallbackSynthesis);
    const [synthesisSource, setSynthesisSource] = useState<'llm' | 'rule-based'>('rule-based');

    useEffect(() => {
        setAiSynthesis(fallbackSynthesis);
    }, [fallbackSynthesis]);

    useEffect(() => {
        if (effectiveIsQuotaReached || isOffline || (typeof navigator !== 'undefined' && !navigator.onLine)) {
            return;
        }
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 5000);

        void (async () => {
            try {
                const res = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
                    body: JSON.stringify({
                        mode: 'post-match-synthesis',
                        summary: summaryPayload,
                        language: isEn ? 'en' : 'fr',
                    }),
                    signal: controller.signal,
                });
                if (!res.ok || !res.body) return;

                const reader = res.body.getReader();
                const decoder = new TextDecoder();
                let buf = '';
                let acc = '';
                let usedFallback = false;

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    buf += decoder.decode(value, { stream: true });
                    const lines = buf.split('\n');
                    buf = lines.pop() ?? '';
                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (!trimmed.startsWith('data:')) continue;
                        const dataStr = trimmed.replace(/^data:\s*/, '');
                        if (dataStr === '[DONE]') continue;
                        try {
                            const item = JSON.parse(dataStr) as {
                                token?: string;
                                content?: string;
                                source?: string;
                                full?: Partial<AiSynthesis>;
                            };
                            if (item.source === 'rule-based-fallback') usedFallback = true;
                            if (item.full && typeof item.full === 'object') {
                                acc = JSON.stringify(item.full);
                            } else {
                                acc += item.token ?? item.content ?? '';
                            }
                        } catch {
                            // Fragment partiel ignoré
                        }
                    }
                }

                if (acc.trim()) {
                    const parsed = JSON.parse(acc.trim()) as Partial<AiSynthesis>;
                    if (parsed && (parsed.diagnostic || parsed.strengths)) {
                        setAiSynthesis((prev) => ({
                            ...prev,
                            ...parsed,
                            diagnostic: parsed.diagnostic ?? prev.diagnostic,
                            keyConcept: parsed.keyConcept ?? prev.keyConcept,
                            trainingPlan:
                                Array.isArray(parsed.trainingPlan) && parsed.trainingPlan.length > 0
                                    ? parsed.trainingPlan
                                    : prev.trainingPlan,
                        }));
                        setSynthesisSource(usedFallback ? 'rule-based' : 'llm');
                    }
                }
            } catch {
                // Conserve le repli déterministe local
            } finally {
                clearTimeout(timer);
            }
        })();

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [apiUrl, effectiveIsQuotaReached, isEn, isOffline, summaryPayload]);

    return { aiSynthesis, synthesisSource };
}
