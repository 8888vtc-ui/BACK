'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
    type MatchContext,
    type StrategicFeatures,
    generateRuleBasedExplanation,
    computeExplanationCacheKey,
    globalExplanationCache,
} from '../../features/coach';
import { extractVerifiedCoachFacts, verifyAndSanitizeCoachTextAgainstBoard } from '../../features/coach/turnSnapshot';
import { parseStreamedExplanation, type CoachDisplayVerdict, type ParsedExplanation } from './coachPanelHelpers';
import { persistExplanation, resolveL2CachedExplanation } from './coachExplanationPersistence';
import { buildKnowledgeVaultEntry } from '../../features/coach/knowledgeVaultHarvester';
import type { Locale } from '../../lib/i18n/types';

export const LLM_TIMEOUT_MS = 14000;
export type ExplanationSource = 'llm' | 'rule-based' | 'cache' | null;

export interface UseCoachExplanationParams {
    verdict: CoachDisplayVerdict | null;
    equityLoss: number | null;
    playedMove: string | null;
    optimalMove: string | null;
    features?: StrategicFeatures;
    matchCtx: MatchContext | null;
    playerLevel: 'beginner' | 'intermediate' | 'expert';
    playerTier?: 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT';
    apiUrl: string;
    locale: string;
    isOffline: boolean;
    positionKey?: string | null;
    xgid?: string | null;
    gameId?: string | null;
    board?: number[];
    dice?: [number, number] | null;
    onExplain?: () => void;
}

export interface UseCoachExplanationResult {
    streamedText: string;
    isStreaming: boolean;
    streamError: string | null;
    explanationSource: ExplanationSource;
    cachedExplanation: ParsedExplanation | null;
    executeExplain: (autoTriggered?: boolean, forceDeepAnalysis?: boolean) => Promise<void>;
    abort: () => void;
}

export function useCoachExplanation({
    verdict,
    equityLoss,
    playedMove,
    optimalMove,
    features,
    matchCtx,
    playerLevel,
    playerTier,
    apiUrl,
    locale,
    isOffline,
    positionKey,
    xgid,
    gameId,
    board,
    dice,
    onExplain,
}: UseCoachExplanationParams): UseCoachExplanationResult {
    const [streamedText, setStreamedText] = useState<string>('');
    const [isStreaming, setIsStreaming] = useState<boolean>(false);
    const [streamError, setStreamError] = useState<string | null>(null);
    const [explanationSource, setExplanationSource] = useState<ExplanationSource>(null);
    const [cachedExplanation, setCachedExplanation] = useState<ParsedExplanation | null>(null);

    const abortControllerRef = useRef<AbortController | null>(null);
    const explainSeqIdRef = useRef<number>(0);
    const isBlunder = verdict === 'blunder';
    const absLoss = Math.abs(equityLoss ?? 0.05);

    const effectiveTier = playerTier ?? (playerLevel === 'beginner' ? 'BEGINNER' : playerLevel === 'expert' ? 'EXPERT' : 'INTERMEDIATE');

    const cacheKey = (() => {
        if (!playedMove) return '';
        return computeExplanationCacheKey({
            positionKey, xgid, board, dice,
            cubeValue: matchCtx?.cubeValue, cubeOwner: matchCtx?.cubeOwner, crawford: matchCtx?.crawford,
            playedMove, optimalMove, verdict: isBlunder ? 'blunder' : 'doubtful',
            matchLength: matchCtx?.matchLength, scoreX: matchCtx?.scoreX, scoreO: matchCtx?.scoreO,
            tier: effectiveTier, locale,
        });
    })();

    const abort = useCallback(() => {
        explainSeqIdRef.current += 1;
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setIsStreaming(false);
    }, []);

    useEffect(() => () => { abortControllerRef.current?.abort(); }, []);

    useEffect(() => {
        explainSeqIdRef.current += 1;
        abortControllerRef.current?.abort();
        abortControllerRef.current = null;
        setStreamedText('');
        setIsStreaming(false);
        setStreamError(null);
        setCachedExplanation(null);
        setExplanationSource(null);
    }, [playedMove, optimalMove, verdict, positionKey, xgid]);

    const persist = useCallback(
        (parsed: ParsedExplanation, source: 'llm' | 'rule-based') => {
            persistExplanation({
                cacheKey, parsed, source, gameId, playedMove, optimalMove,
                verdict, equityLoss: -absLoss, positionKey: xgid || positionKey, board, dice,
            });
        },
        [cacheKey, gameId, playedMove, optimalMove, verdict, absLoss, xgid, positionKey, board, dice],
    );

    const buildRuleBased = useCallback((): ParsedExplanation => {
        const safeFeatures: StrategicFeatures = features ?? {
            player: 'X',
            pipCountDiff: { player: 0, opponent: 0, leader: 'tie', diff: 0 },
            blotsAndShots: { user: [], best: [] },
            boardStructure: { innerBoardPoints: 0, advancedAnchor: false, goldenPoint: false, barPoint: false, longestPrime: 0 },
            contactStatus: 'contact',
        };
        const resolvedVerdict =
            verdict === 'optimal' ? 'optimal' : verdict === 'good' ? 'good' : isBlunder ? 'blunder' : verdict === 'inaccuracy' ? 'inaccuracy' : 'doubtful';
        const promptParams = {
            verdict: resolvedVerdict as 'optimal' | 'good' | 'blunder' | 'inaccuracy' | 'doubtful',
            equityLoss: -absLoss,
            playedMove: playedMove ?? (locale === 'en' ? 'Played move' : 'Coup joué'),
            optimalMove: optimalMove ?? (locale === 'en' ? 'Optimal move' : 'Coup optimal'),
            features: safeFeatures,
            matchContext: matchCtx ?? undefined,
            playerLevel,
            language: locale as Locale,
        };
        const vaultBuilt = buildKnowledgeVaultEntry({ promptParams, board, xgid, dice });
        const ruleBased = vaultBuilt.selectedVariant ?? generateRuleBasedExplanation(promptParams);
        const explanation = board && board.length >= 25
            ? verifyAndSanitizeCoachTextAgainstBoard(ruleBased.explanation, board, locale === 'en' ? 'en' : 'fr').sanitizedText
            : ruleBased.explanation;
        const summary = board && board.length >= 25
            ? verifyAndSanitizeCoachTextAgainstBoard(ruleBased.summary, board, locale === 'en' ? 'en' : 'fr').sanitizedText
            : ruleBased.summary;
        return {
            ...ruleBased,
            explanation,
            summary,
            symbolicAudit: ruleBased.symbolic_audit,
            pedagogicalExplanation: ruleBased.pedagogical_explanation,
            rawText: explanation,
        };
    }, [verdict, isBlunder, absLoss, playedMove, optimalMove, features, matchCtx, playerLevel, locale, board, xgid, dice]);

    const executeExplain = useCallback(
        async (_autoTriggered = false, forceDeepAnalysis = false) => {
            onExplain?.();
            abortControllerRef.current?.abort();
            const seqId = ++explainSeqIdRef.current;
            const isStale = () => explainSeqIdRef.current !== seqId;

            setIsStreaming(true);
            setStreamError(null);
            setStreamedText('');
            setCachedExplanation(null);

            if (!forceDeepAnalysis && cacheKey && globalExplanationCache.has(cacheKey)) {
                const cached = globalExplanationCache.get(cacheKey);
                if (cached) {
                    setCachedExplanation({
                        summary: cached.summary, explanation: cached.explanation, keyConcept: cached.keyConcept,
                        advice: cached.advice, whyFailed: cached.whyFailed, whyOptimal: cached.whyOptimal,
                        conceptId: cached.conceptId, rawText: cached.rawText,
                    });
                    setExplanationSource('cache');
                    setIsStreaming(false);
                    return;
                }
            }

            const hasCanonicalPos = Boolean(xgid || positionKey || (board && board.length > 0));
            if (cacheKey && hasCanonicalPos) {
                const l2Cached = await resolveL2CachedExplanation(cacheKey, isOffline);
                if (isStale()) return;
                if (l2Cached) {
                    setCachedExplanation(l2Cached);
                    setExplanationSource('cache');
                    setIsStreaming(false);
                    return;
                }
            }

            if (isOffline || (typeof navigator !== 'undefined' && !navigator.onLine)) {
                const parsedResult = buildRuleBased();
                setCachedExplanation(parsedResult);
                setExplanationSource('rule-based');
                setIsStreaming(false);
                persist(parsedResult, 'rule-based');
                return;
            }

            const controller = new AbortController();
            abortControllerRef.current = controller;
            const timeoutId = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);

            try {
                const verifiedFacts = board && board.length >= 25
                    ? extractVerifiedCoachFacts(board, board, board)
                    : undefined;
                const payload = {
                    positionKey: positionKey ?? undefined,
                    xgid: xgid ?? undefined,
                    board: board ?? undefined,
                    dice: dice ? ([dice[0], dice[1]] as [number, number]) : undefined,
                    verdict: verdict === 'optimal' ? 'optimal' : verdict === 'good' ? 'good' : isBlunder ? 'blunder' : verdict === 'inaccuracy' ? 'inaccuracy' : 'doubtful',
                    equityLoss: -absLoss,
                    playedMove: playedMove ?? (locale === 'en' ? 'Played move' : 'Coup joué'),
                    optimalMove: optimalMove ?? (locale === 'en' ? 'Optimal move' : 'Coup optimal'),
                    features,
                    verifiedFacts,
                    matchContext: matchCtx,
                    playerLevel: forceDeepAnalysis ? 'grandmaster' : playerLevel,
                    playerTier: effectiveTier,
                    language: locale,
                };

                const res = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
                    body: JSON.stringify(payload),
                    signal: controller.signal,
                });
                if (!res.ok || !res.body) throw new Error(`Erreur réseau (${res.status} ${res.statusText})`);

                const reader = res.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';
                let accumulated = '';

                while (true) {
                    const { done, value } = await reader.read();
                    if (done || isStale()) break;
                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() ?? '';
                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (!trimmed || !trimmed.startsWith('data:')) continue;
                        const dataStr = trimmed.replace(/^data:\s*/, '');
                        if (dataStr === '[DONE]') continue;
                        try {
                            const parsedItem = JSON.parse(dataStr) as { token?: string; content?: string };
                            const token = parsedItem.token ?? parsedItem.content ?? '';
                            if (token && !isStale()) {
                                accumulated += token;
                                const safeText = board && board.length >= 25
                                    ? verifyAndSanitizeCoachTextAgainstBoard(accumulated, board, locale === 'en' ? 'en' : 'fr').sanitizedText
                                    : accumulated;
                                setStreamedText(safeText);
                            }
                        } catch {
                            // Fragment JSON partiel ignoré
                        }
                    }
                }
                if (isStale()) return;
                setExplanationSource('llm');
                if (accumulated) {
                    const parsed = parseStreamedExplanation(accumulated);
                    if (board && board.length >= 25) {
                        parsed.explanation = verifyAndSanitizeCoachTextAgainstBoard(parsed.explanation ?? '', board, locale === 'en' ? 'en' : 'fr').sanitizedText;
                        parsed.summary = verifyAndSanitizeCoachTextAgainstBoard(parsed.summary ?? '', board, locale === 'en' ? 'en' : 'fr').sanitizedText;
                    }
                    persist(parsed, 'llm');
                }
            } catch (err: unknown) {
                if (isStale()) return;
                console.warn('[CoachPanel] Échec API ou timeout, repli heuristique 0ms :', err);
                const parsedFallback = buildRuleBased();
                setCachedExplanation(parsedFallback);
                setExplanationSource('rule-based');
                setStreamError(null);
                persist(parsedFallback, 'rule-based');
            } finally {
                clearTimeout(timeoutId);
                if (!isStale()) setIsStreaming(false);
            }
        },
        [onExplain, cacheKey, isOffline, buildRuleBased, persist, verdict, isBlunder, absLoss, playedMove, optimalMove, features, matchCtx, playerLevel, effectiveTier, locale, apiUrl, board, dice, positionKey, xgid],
    );

    return { streamedText, isStreaming, streamError, explanationSource, cachedExplanation, executeExplain, abort };
}
