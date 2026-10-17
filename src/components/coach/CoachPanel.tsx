'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import CoachPanelSkeleton from './CoachPanelSkeleton';
import DeepRolloutSection from './DeepRolloutSection';
import { useI18n } from '../../lib/i18n';
import {
    MatchContext,
    buildMatchContext,
    BuildMatchContextParams,
    generateRuleBasedExplanation,
    computeExplanationCacheKey,
    globalExplanationCache,
} from '../../features/coach';
import { persistCoachExplanation } from '../../lib/offline/persistenceService';
import { recordBlunder } from '../../features/drills/blunderBank';
import { STRATEGIC_CONCEPTS_CATALOG, categorizeExplanation } from '../../lib/stats/statsAggregator';

export interface CoachPanelProps {
    verdict: 'doubtful' | 'blunder' | null;
    equityLoss: number | null;
    playedMove: string | null;
    optimalMove: string | null;
    explanation?: string | null;
    onExplain?: () => void;
    onDismiss: () => void;
    onOpenKnowledgeConcept?: (conceptId: string) => void;
    isLoading?: boolean;
    features?: any;
    matchContext?: MatchContext | Partial<BuildMatchContextParams>;
    playerLevel?: 'beginner' | 'intermediate' | 'expert';
    apiUrl?: string;
    // Modes de déclenchement et préférences utilisateur
    triggerMode?: 'auto' | 'manual';
    onTriggerModeChange?: (mode: 'auto' | 'manual') => void;
    autoThreshold?: 'blunder' | 'doubtful';
    onAutoThresholdChange?: (threshold: 'blunder' | 'doubtful') => void;
    isOffline?: boolean;
    onOfflineToggle?: (offline: boolean) => void;
    positionKey?: string | null;
    gameId?: string | null;
    dice?: [number, number] | null;
    board?: number[];
    xgid?: string | null;
    candidateMoves?: string[];
    showRollout?: boolean;
    onRolloutCompleted?: (result: any) => void;
}

interface ParsedExplanation {
    summary?: string;
    explanation?: string;
    keyConcept?: string;
    advice?: string;
    whyFailed?: string;
    whyOptimal?: string;
    conceptId?: string;
    rawText: string;
}

function formatGammonPrice(val?: number): string {
    if (val === undefined || isNaN(val)) return '0.50';
    return val.toFixed(2);
}

function formatPercent(val?: number): string {
    if (val === undefined || isNaN(val)) return '25.0%';
    return `${(val * 100).toFixed(1)}%`;
}

/**
 * Extrait les champs structurés du flux JSON, y compris en cours de streaming partiel.
 */
function parseStreamedExplanation(text: string): ParsedExplanation {
    if (!text) return { rawText: '' };

    // 1. Parsing JSON direct si le flux complet est déjà valide
    try {
        const parsed = JSON.parse(text);
        if (typeof parsed === 'object' && parsed !== null) {
            return {
                summary: parsed.summary,
                explanation: parsed.explanation,
                keyConcept: parsed.keyConcept,
                advice: parsed.advice,
                whyFailed: parsed.whyFailed,
                whyOptimal: parsed.whyOptimal,
                conceptId: parsed.conceptId,
                rawText: parsed.explanation || text,
            };
        }
    } catch {
        // En cours de streaming : parsing progressif par expressions régulières
    }

    const unescapeJson = (str?: string) =>
        str ? str.replace(/\\n/g, '\n').replace(/\\"/g, '"') : undefined;

    const summaryMatch = text.match(/"summary":\s*"((?:[^"\\]|\\.)*)/);
    const explanationMatch = text.match(/"explanation":\s*"((?:[^"\\]|\\.)*)/);
    const conceptMatch = text.match(/"keyConcept":\s*"((?:[^"\\]|\\.)*)/);
    const adviceMatch = text.match(/"advice":\s*"((?:[^"\\]|\\.)*)/);
    const whyFailedMatch = text.match(/"whyFailed":\s*"((?:[^"\\]|\\.)*)/);
    const whyOptimalMatch = text.match(/"whyOptimal":\s*"((?:[^"\\]|\\.)*)/);
    const conceptIdMatch = text.match(/"conceptId":\s*"([a-z0-9-]+)"/);

    const extractedSummary = unescapeJson(summaryMatch?.[1]);
    const extractedExplanation = unescapeJson(explanationMatch?.[1]);
    const extractedConcept = unescapeJson(conceptMatch?.[1]);
    const extractedAdvice = unescapeJson(adviceMatch?.[1]);
    const extractedWhyFailed = unescapeJson(whyFailedMatch?.[1]);
    const extractedWhyOptimal = unescapeJson(whyOptimalMatch?.[1]);
    const extractedConceptId = conceptIdMatch?.[1];

    if (extractedExplanation || extractedSummary || extractedWhyFailed) {
        return {
            summary: extractedSummary,
            explanation: extractedExplanation,
            keyConcept: extractedConcept,
            advice: extractedAdvice,
            whyFailed: extractedWhyFailed,
            whyOptimal: extractedWhyOptimal,
            conceptId: extractedConceptId,
            rawText: extractedExplanation || text,
        };
    }

    return {
        rawText: text,
    };
}

function recordBlunderToBankIfApplicable(params: {
    isBlunder: boolean;
    equityLoss: number | null;
    playedMove: string | null;
    optimalMove: string | null;
    parsed: ParsedExplanation;
    positionKey?: string | null;
    board?: number[];
    dice?: [number, number] | null;
    gameId?: string | null;
}) {
    const { isBlunder, equityLoss, playedMove, optimalMove, parsed, positionKey, board, dice, gameId } = params;
    const loss = Math.abs(equityLoss ?? (isBlunder ? 0.08 : 0.02));
    if (!isBlunder && loss < 0.08) return;

    let boardArr = board;
    if (!boardArr && positionKey) {
        const parts = positionKey.split(',').map(Number);
        if (parts.length === 28) {
            boardArr = parts;
        }
    }

    if (!boardArr || boardArr.length !== 28) return;

    const conceptId = categorizeExplanation(
        parsed.keyConcept,
        `${parsed.summary || ''} ${parsed.explanation || ''}`,
    );
    const conceptDef = STRATEGIC_CONCEPTS_CATALOG.find((c) => c.id === conceptId);

    try {
        recordBlunder({
            board: boardArr,
            dice: dice || [3, 1],
            player: 'X',
            playedMove: playedMove || 'Coup joué',
            optimalMove: optimalMove || 'Coup optimal',
            equityLoss: Number(loss.toFixed(3)),
            verdict: 'blunder',
            conceptId,
            conceptName: conceptDef?.name || 'Sécurité & Tactique',
            explanation: parsed.explanation || parsed.summary || 'Erreur tactique détectée par le coach.',
            hint: parsed.advice || conceptDef?.recommendation || undefined,
            gameId: gameId || undefined,
        });
    } catch (e) {
        console.warn('[CoachPanel] Échec enregistrement automatique blunder bank :', e);
    }
}

export default function CoachPanel({
    verdict,
    equityLoss,
    playedMove,
    optimalMove,
    explanation,
    onExplain,
    onDismiss,
    onOpenKnowledgeConcept,
    isLoading = false,
    features,
    matchContext: rawMatchContext,
    playerLevel = 'intermediate',
    apiUrl = '/api/coach',
    triggerMode: propTriggerMode,
    onTriggerModeChange,
    autoThreshold: propAutoThreshold,
    onAutoThresholdChange,
    isOffline: propIsOffline,
    onOfflineToggle,
    positionKey,
    gameId,
    dice,
    board,
    xgid,
    candidateMoves,
    showRollout = true,
    onRolloutCompleted,
}: CoachPanelProps) {
    const { t, locale } = useI18n();
    const [streamedText, setStreamedText] = useState<string>('');
    const [isStreaming, setIsStreaming] = useState<boolean>(false);
    const [streamError, setStreamError] = useState<string | null>(null);
    const [explanationSource, setExplanationSource] = useState<'llm' | 'rule-based' | 'cache' | null>(null);
    const [cachedExplanation, setCachedExplanation] = useState<ParsedExplanation | null>(null);

    // Modes et préférences utilisateur (avec persistance localStorage)
    const [localTriggerMode, setLocalTriggerMode] = useState<'auto' | 'manual'>(() => {
        if (propTriggerMode) return propTriggerMode;
        if (typeof window !== 'undefined' && window.localStorage) {
            const saved = window.localStorage.getItem('bg_coach_trigger_mode');
            if (saved === 'auto' || saved === 'manual') return saved;
        }
        return 'manual';
    });

    const [localAutoThreshold, setLocalAutoThreshold] = useState<'blunder' | 'doubtful'>(() => {
        if (propAutoThreshold) return propAutoThreshold;
        if (typeof window !== 'undefined' && window.localStorage) {
            const saved = window.localStorage.getItem('bg_coach_auto_threshold');
            if (saved === 'blunder' || saved === 'doubtful') return saved;
        }
        return 'blunder';
    });

    const [localIsOffline, setLocalIsOffline] = useState<boolean>(() => {
        if (propIsOffline !== undefined) return propIsOffline;
        if (typeof window !== 'undefined') {
            if (!window.navigator.onLine) return true;
            const saved = window.localStorage.getItem('bg_coach_offline_mode');
            if (saved === 'true') return true;
        }
        return false;
    });

    const effectiveTriggerMode = propTriggerMode ?? localTriggerMode;
    const effectiveAutoThreshold = propAutoThreshold ?? localAutoThreshold;
    const effectiveIsOffline = propIsOffline ?? localIsOffline;

    const abortControllerRef = useRef<AbortController | null>(null);
    const lastAutoTriggeredMoveRef = useRef<string | null>(null);

    // Normalisation et calcul MET complet du contexte de match
    const matchCtx: MatchContext | null = useMemo(() => {
        if (!rawMatchContext) return null;
        if (
            'gammonPrice' in rawMatchContext &&
            'takePoint' in rawMatchContext &&
            'pointsToWin' in rawMatchContext
        ) {
            return rawMatchContext as MatchContext;
        }
        return buildMatchContext({
            matchLength: rawMatchContext.matchLength ?? 7,
            scoreX: rawMatchContext.scoreX ?? 0,
            scoreO: rawMatchContext.scoreO ?? 0,
            crawford: rawMatchContext.crawford,
            cubeValue: rawMatchContext.cubeValue ?? 1,
            cubeOwner: rawMatchContext.cubeOwner ?? null,
        });
    }, [rawMatchContext]);

    // Clé déterministe pour le cache d'explication (hash position + coup + langue)
    const cacheKey = useMemo(() => {
        if (!playedMove) return '';
        const baseKey = computeExplanationCacheKey({
            positionKey,
            playedMove,
            optimalMove,
            verdict: verdict ?? undefined,
            matchLength: matchCtx?.matchLength,
            scoreX: matchCtx?.scoreX,
            scoreO: matchCtx?.scoreO,
        });
        return `${baseKey}::lang[${locale}]`;
    }, [positionKey, playedMove, optimalMove, verdict, matchCtx, locale]);

    // Écoute des changements de connectivité réseau native
    useEffect(() => {
        function handleOnline() {
            if (propIsOffline === undefined) setLocalIsOffline(false);
        }
        function handleOffline() {
            if (propIsOffline === undefined) setLocalIsOffline(true);
        }
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [propIsOffline]);

    // Annule la requête en cours au démontage
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    // Réinitialise les états si un nouveau coup ou une nouvelle position est affichée
    useEffect(() => {
        setStreamedText('');
        setIsStreaming(false);
        setStreamError(null);
        setCachedExplanation(null);
        setExplanationSource(null);
    }, [playedMove, optimalMove, verdict, positionKey]);

    function updateTriggerMode(mode: 'auto' | 'manual') {
        setLocalTriggerMode(mode);
        if (typeof window !== 'undefined' && window.localStorage) {
            try {
                window.localStorage.setItem('bg_coach_trigger_mode', mode);
            } catch {}
        }
        if (onTriggerModeChange) {
            onTriggerModeChange(mode);
        }
    }

    function updateAutoThreshold(threshold: 'blunder' | 'doubtful') {
        setLocalAutoThreshold(threshold);
        if (typeof window !== 'undefined' && window.localStorage) {
            try {
                window.localStorage.setItem('bg_coach_auto_threshold', threshold);
            } catch {}
        }
        if (onAutoThresholdChange) {
            onAutoThresholdChange(threshold);
        }
    }

    function updateIsOffline(offline: boolean) {
        setLocalIsOffline(offline);
        if (typeof window !== 'undefined' && window.localStorage) {
            try {
                window.localStorage.setItem('bg_coach_offline_mode', offline ? 'true' : 'false');
            } catch {}
        }
        if (onOfflineToggle) {
            onOfflineToggle(offline);
        }
    }

    const isBlunder = verdict === 'blunder';
    const label = isBlunder ? t('coach.blunder') : t('coach.doubtful');
    const accent = isBlunder
        ? 'border-red-500/80 bg-slate-900/90 text-red-400 shadow-lg shadow-red-950/20'
        : 'border-amber-500/80 bg-slate-900/90 text-amber-400 shadow-lg shadow-amber-950/20';

    async function executeExplain(autoTriggered = false) {
        if (onExplain) {
            onExplain();
        }

        setIsStreaming(true);
        setStreamError(null);
        setStreamedText('');
        setCachedExplanation(null);

        // 1. Vérification dans le cache d'explications (hash position + coup)
        if (cacheKey && globalExplanationCache.has(cacheKey)) {
            const cached = globalExplanationCache.get(cacheKey);
            if (cached) {
                setCachedExplanation({
                    summary: cached.summary,
                    explanation: cached.explanation,
                    keyConcept: cached.keyConcept,
                    advice: cached.advice,
                    rawText: cached.rawText,
                });
                setExplanationSource('cache');
                setIsStreaming(false);
                return;
            }
        }

        // 2. Mode dégradé hors-ligne : génération locale règle-basée depuis les concepts
        if (effectiveIsOffline || (typeof navigator !== 'undefined' && !navigator.onLine)) {
            const ruleBased = generateRuleBasedExplanation({
                verdict: isBlunder ? 'blunder' : 'douteux',
                equityLoss: equityLoss ?? -0.05,
                playedMove: playedMove ?? (locale === 'en' ? 'Played move' : 'Coup joué'),
                optimalMove: optimalMove ?? (locale === 'en' ? 'Optimal move' : 'Coup optimal'),
                features,
                matchContext: matchCtx ?? undefined,
                playerLevel,
                language: locale,
            });

            const parsedResult: ParsedExplanation = {
                summary: ruleBased.summary,
                explanation: ruleBased.explanation,
                keyConcept: ruleBased.keyConcept,
                advice: ruleBased.advice,
                rawText: ruleBased.explanation,
            };

            setCachedExplanation(parsedResult);
            setExplanationSource('rule-based');
            setIsStreaming(false);

            if (cacheKey) {
                globalExplanationCache.set(cacheKey, {
                    ...parsedResult,
                    source: 'rule-based',
                });
                persistCoachExplanation({
                    id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                    game_id: gameId,
                    position_key: cacheKey,
                    played_move: playedMove || '',
                    optimal_move: optimalMove || '',
                    verdict: isBlunder ? 'blunder' : 'douteux',
                    equity_loss: equityLoss ?? -0.05,
                    summary: parsedResult.summary || '',
                    explanation: parsedResult.explanation || '',
                    key_concept: parsedResult.keyConcept || null,
                    advice: parsedResult.advice || null,
                    source: 'rule-based',
                    created_at: new Date().toISOString(),
                }).catch(() => {});

                recordBlunderToBankIfApplicable({
                    isBlunder,
                    equityLoss,
                    playedMove,
                    optimalMove,
                    parsed: parsedResult,
                    positionKey,
                    board,
                    dice,
                    gameId,
                });
            }
            return;
        }

        // 3. Appel de l'API streaming SSE OpenAI-compatible avec timeout strict de 8s
        const controller = new AbortController();
        abortControllerRef.current = controller;
        const timeoutId = setTimeout(() => {
            controller.abort();
        }, 8000);

        try {
            const payload = {
                verdict: isBlunder ? 'blunder' : 'douteux',
                equityLoss: equityLoss ?? -0.05,
                playedMove: playedMove ?? (locale === 'en' ? 'Played move' : 'Coup joué'),
                optimalMove: optimalMove ?? (locale === 'en' ? 'Optimal move' : 'Coup optimal'),
                features,
                matchContext: matchCtx,
                playerLevel,
                language: locale,
            };

            const res = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'text/event-stream',
                },
                body: JSON.stringify(payload),
                signal: controller.signal,
            });

            if (!res.ok || !res.body) {
                throw new Error(`Erreur réseau (${res.status} ${res.statusText})`);
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
                    if (!trimmed || !trimmed.startsWith('data:')) continue;

                    const dataStr = trimmed.replace(/^data:\s*/, '');
                    if (dataStr === '[DONE]') continue;

                    try {
                        const parsedItem = JSON.parse(dataStr);
                        const token = parsedItem.token ?? parsedItem.content ?? '';
                        if (token) {
                            accumulated += token;
                            setStreamedText(accumulated);
                        }
                    } catch {
                        // Ignore les fragments de ligne JSON incomplets
                    }
                }
            }

            setExplanationSource('llm');

            // Mise en cache de l'explication finale générée
            if (cacheKey && accumulated) {
                const parsedFinal = parseStreamedExplanation(accumulated);
                globalExplanationCache.set(cacheKey, {
                    summary: parsedFinal.summary,
                    explanation: parsedFinal.explanation,
                    keyConcept: parsedFinal.keyConcept,
                    advice: parsedFinal.advice,
                    rawText: accumulated,
                    source: 'llm',
                });
                persistCoachExplanation({
                    id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                    game_id: gameId,
                    position_key: cacheKey,
                    played_move: playedMove || '',
                    optimal_move: optimalMove || '',
                    verdict: isBlunder ? 'blunder' : 'douteux',
                    equity_loss: equityLoss ?? -0.05,
                    summary: parsedFinal.summary || '',
                    explanation: parsedFinal.explanation || '',
                    key_concept: parsedFinal.keyConcept || null,
                    advice: parsedFinal.advice || null,
                    source: 'llm',
                    created_at: new Date().toISOString(),
                }).catch(() => {});

                recordBlunderToBankIfApplicable({
                    isBlunder,
                    equityLoss,
                    playedMove,
                    optimalMove,
                    parsed: parsedFinal,
                    positionKey,
                    board,
                    dice,
                    gameId,
                });
            }
        } catch (err: any) {
            console.warn('[CoachPanel] Échec API ou timeout (8s), repli sur le mode dégradé règle-basé :', err);

            // Secours dégradé instantané sans interrompre l'expérience utilisateur
            const ruleBased = generateRuleBasedExplanation({
                verdict: isBlunder ? 'blunder' : 'douteux',
                equityLoss: equityLoss ?? -0.05,
                playedMove: playedMove ?? (locale === 'en' ? 'Played move' : 'Coup joué'),
                optimalMove: optimalMove ?? (locale === 'en' ? 'Optimal move' : 'Coup optimal'),
                features,
                matchContext: matchCtx ?? undefined,
                playerLevel,
                language: locale,
            });

            const parsedFallback: ParsedExplanation = {
                summary: ruleBased.summary,
                explanation: ruleBased.explanation,
                keyConcept: ruleBased.keyConcept,
                advice: ruleBased.advice,
                whyFailed: ruleBased.whyFailed,
                whyOptimal: ruleBased.whyOptimal,
                conceptId: ruleBased.conceptId,
                rawText: ruleBased.explanation,
            };

            setCachedExplanation(parsedFallback);
            setExplanationSource('rule-based');
            setStreamError(null);

            if (cacheKey) {
                globalExplanationCache.set(cacheKey, {
                    ...parsedFallback,
                    source: 'rule-based',
                });
                persistCoachExplanation({
                    id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                    game_id: gameId,
                    position_key: cacheKey,
                    played_move: playedMove || '',
                    optimal_move: optimalMove || '',
                    verdict: isBlunder ? 'blunder' : 'douteux',
                    equity_loss: equityLoss ?? -0.05,
                    summary: parsedFallback.summary || '',
                    explanation: parsedFallback.explanation || '',
                    key_concept: parsedFallback.keyConcept || null,
                    advice: parsedFallback.advice || null,
                    source: 'rule-based',
                    created_at: new Date().toISOString(),
                }).catch(() => {});

                recordBlunderToBankIfApplicable({
                    isBlunder,
                    equityLoss,
                    playedMove,
                    optimalMove,
                    parsed: parsedFallback,
                    positionKey,
                    board,
                    dice,
                    gameId,
                });
            }
        } finally {
            clearTimeout(timeoutId);
            setIsStreaming(false);
        }
    }

    // Déclencheur automatique selon les préférences et seuils
    useEffect(() => {
        if (!verdict || !playedMove) return;

        if (effectiveTriggerMode !== 'auto') return;

        const meetsThreshold =
            verdict === 'blunder' ||
            (effectiveAutoThreshold === 'doubtful' && verdict === 'doubtful');

        if (!meetsThreshold) return;

        const currentMoveKey = `${playedMove}::${optimalMove}::${verdict}`;
        if (lastAutoTriggeredMoveRef.current === currentMoveKey) return;
        lastAutoTriggeredMoveRef.current = currentMoveKey;

        executeExplain(true);
    }, [
        verdict,
        playedMove,
        optimalMove,
        effectiveTriggerMode,
        effectiveAutoThreshold,
        effectiveIsOffline,
    ]);

    function handleExplainClick() {
        executeExplain(false);
    }

    function handleDismissClick() {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        onDismiss();
    }

    if (isLoading) {
        return <CoachPanelSkeleton />;
    }

    if (!verdict) return null;

    const currentRawExplanation =
        cachedExplanation?.rawText ||
        streamedText ||
        explanation;

    const parsed: ParsedExplanation = cachedExplanation || parseStreamedExplanation(currentRawExplanation || '');
    const hasContent = Boolean(currentRawExplanation || isStreaming || cachedExplanation);

    return (
        <aside
            role="region"
            aria-live="polite"
            className={`w-full max-w-5xl rounded-xl border-2 p-5 backdrop-blur-md transition-all ${accent}`}
        >
            {/* Barre de titre et bouton fermeture */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="flex h-3 w-3 relative">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isBlunder ? 'bg-red-400' : 'bg-amber-400'}`}></span>
                        <span className={`relative inline-flex rounded-full h-3 w-3 ${isBlunder ? 'bg-red-500' : 'bg-amber-500'}`}></span>
                    </span>
                    <h2 className="text-lg font-bold tracking-tight text-white">{t('coach.title')}</h2>
                </div>
                <button
                    onClick={handleDismissClick}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
                    aria-label={t('common.close')}
                >
                    ✕
                </button>
            </div>

            {/* 1. Diagnostic Verdict & Perte d'équité EN GRAND */}
            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-slate-950/80 border border-slate-800 p-3.5 shadow-inner">
                <div>
                    <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block">Verdict</span>
                    <span className={`font-black uppercase tracking-wider text-2xl ${isBlunder ? 'text-red-400' : 'text-amber-400'}`}>
                        {label}
                    </span>
                </div>
                {equityLoss !== null && (
                    <div className="text-right">
                        <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block">{t('coach.equityLoss')}</span>
                        <strong className="font-mono text-2xl font-black text-white">{equityLoss.toFixed(3)}</strong>
                    </div>
                )}
            </div>

            {/* 2. Comparatif Coup Joué vs Coup Optimal */}
            <div className="mt-3 grid grid-cols-2 gap-3 rounded-xl bg-slate-950/60 border border-slate-800/80 p-3 text-sm">
                <div>
                    <p className="text-xs font-semibold text-red-400/80 uppercase tracking-wider">{t('coach.playedMove')}</p>
                    <p className="mt-1 font-mono text-lg font-bold text-red-400">{playedMove}</p>
                </div>
                <div>
                    <p className="text-xs font-semibold text-emerald-400/80 uppercase tracking-wider">{t('coach.optimalMove')}</p>
                    <p className="mt-1 font-mono text-lg font-bold text-emerald-400">{optimalMove}</p>
                </div>
            </div>

            {/* 3. Zone d'explication pédagogique ou bouton d'action */}
            <div className="mt-3">
                {hasContent ? (
                    <div className="space-y-3 rounded-xl bg-slate-950/60 border border-slate-800/70 p-4 text-slate-200">
                        {/* Indicateur de source de l'explication */}
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <span className="text-xs font-semibold">
                                {explanationSource === 'cache' && (
                                    <span className="inline-flex items-center gap-1 text-emerald-400" data-testid="coach-source-cache">
                                        <span>⚡</span> {t('coach.sourceCache')}
                                    </span>
                                )}
                                {explanationSource === 'rule-based' && (
                                    <span className="inline-flex items-center gap-1 text-amber-400" data-testid="coach-source-rule-based">
                                        <span>📴</span> {t('coach.sourceRuleBased')}
                                    </span>
                                )}
                                {explanationSource === 'llm' && (
                                    <span className="inline-flex items-center gap-1 text-blue-400" data-testid="coach-source-llm">
                                        <span>🤖</span> {t('coach.sourceLlm')}
                                    </span>
                                )}
                            </span>
                        </div>

                        {/* Résumé d'accroche */}
                        {parsed.summary && (
                            <p className="font-semibold text-white leading-snug">
                                {parsed.summary}
                            </p>
                        )}

                        {/* Format synthétique concis & percutant (Pourquoi l'erreur vs Pourquoi l'optimal) */}
                        {parsed.whyFailed || parsed.whyOptimal ? (
                            <div className="space-y-2 text-sm">
                                {parsed.whyFailed && (
                                    <div className="flex items-start gap-2 rounded-lg bg-red-950/30 border border-red-900/40 p-2.5 text-red-200">
                                        <span className="text-red-400 font-bold shrink-0 text-xs mt-0.5">❌</span>
                                        <div>
                                            <strong className="text-red-300 block text-[11px] uppercase tracking-wide">
                                                {locale === 'en' ? 'What went wrong' : 'Ce qui ne va pas'}
                                            </strong>
                                            <span className="text-xs text-red-200 leading-relaxed">{parsed.whyFailed}</span>
                                        </div>
                                    </div>
                                )}
                                {parsed.whyOptimal && (
                                    <div className="flex items-start gap-2 rounded-lg bg-emerald-950/30 border border-emerald-900/40 p-2.5 text-emerald-200">
                                        <span className="text-emerald-400 font-bold shrink-0 text-xs mt-0.5">✅</span>
                                        <div>
                                            <strong className="text-emerald-300 block text-[11px] uppercase tracking-wide">
                                                {locale === 'en' ? 'Optimal alternative' : 'Meilleure option'}
                                            </strong>
                                            <span className="text-xs text-emerald-200 leading-relaxed">{parsed.whyOptimal}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Corps de l'explication classique */
                            <div className="text-sm leading-relaxed whitespace-pre-line text-slate-300">
                                {parsed.explanation || parsed.rawText}
                                {isStreaming && (
                                    <span className="inline-block ml-1 animate-pulse font-mono text-blue-400 font-bold">
                                        ▋
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Badge concept clé & Lien direct vers la Base de Connaissances */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                            {parsed.keyConcept && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-900/60 px-3 py-1 text-xs font-semibold text-blue-300 border border-blue-700/50">
                                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400"></span>
                                    {t('coach.keyConcept')} : {parsed.keyConcept}
                                </span>
                            )}
                            {onOpenKnowledgeConcept && (
                                <button
                                    type="button"
                                    onClick={() => onOpenKnowledgeConcept(parsed.conceptId || 'fundamentals')}
                                    data-testid="coach-open-kb-btn"
                                    className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600/30 hover:bg-indigo-600/60 px-3 py-1 text-xs font-bold text-indigo-300 hover:text-white border border-indigo-500/50 transition active:scale-95 shadow-sm"
                                >
                                    <span>📖</span>
                                    <span>{locale === 'en' ? 'Read Theory Sheet' : 'Consulter la Fiche Théorique'}</span>
                                    <span>↗</span>
                                </button>
                            )}
                        </div>

                        {/* Conseil pédagogique */}
                        {parsed.advice && (
                            <div className="rounded-md border border-amber-500/30 bg-amber-950/20 p-2.5 text-xs text-amber-200 leading-relaxed">
                                💡 <span className="font-semibold text-amber-100">{t('coach.advice')} :</span> {parsed.advice}
                            </div>
                        )}
                    </div>
                ) : (
                    <div>
                        {streamError ? (
                            <div className="flex items-center justify-between rounded-lg bg-red-950/40 border border-red-800/40 p-3 text-sm text-red-300">
                                <span>⚠️ {streamError}</span>
                                <button
                                    onClick={handleExplainClick}
                                    className="rounded bg-red-800/80 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700 transition"
                                >
                                    {t('common.retry')}
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={handleExplainClick}
                                disabled={isStreaming}
                                data-testid="coach-explain-btn"
                                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-900/30 transition hover:bg-blue-500 active:scale-95 disabled:opacity-50"
                            >
                                <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M13 10V3L4 14h7v7l9-11h-7z"
                                    />
                                </svg>
                                {t('coach.explainError')}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* 4. Barre des préférences du coach : Mode Auto vs À la demande & Mode Dégradé Offline */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-950/70 border border-slate-800 p-2 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-slate-400 font-medium">{t('coach.modeLabel')}</span>
                    <div className="inline-flex rounded-lg bg-slate-900 p-0.5 border border-slate-700/60" role="group" aria-label={t('coach.modeLabel')}>
                        <button
                            type="button"
                            onClick={() => updateTriggerMode('auto')}
                            data-testid="coach-mode-auto-btn"
                            className={`rounded-md px-2.5 py-1 font-semibold transition ${
                                effectiveTriggerMode === 'auto'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            {t('coach.modeAuto')}
                        </button>
                        <button
                            type="button"
                            onClick={() => updateTriggerMode('manual')}
                            data-testid="coach-mode-manual-btn"
                            className={`rounded-md px-2.5 py-1 font-semibold transition ${
                                effectiveTriggerMode === 'manual'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            {t('coach.modeManual')}
                        </button>
                    </div>

                    {/* Sélecteur de seuil pour le mode automatique */}
                    {effectiveTriggerMode === 'auto' && (
                        <div className="flex items-center gap-1.5 ml-1">
                            <span className="text-slate-500">{t('coach.thresholdLabel')}</span>
                            <select
                                value={effectiveAutoThreshold}
                                onChange={(e) => updateAutoThreshold(e.target.value as 'blunder' | 'doubtful')}
                                data-testid="coach-auto-threshold-select"
                                className="rounded bg-slate-900 border border-slate-700 px-2 py-0.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                            >
                                <option value="blunder">{t('coach.blundersOnly')}</option>
                                <option value="doubtful">{t('coach.doubtfulsAndBlunders')}</option>
                            </select>
                        </div>
                    )}
                </div>

                {/* Bascule En ligne vs Mode Dégradé Hors-ligne */}
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => updateIsOffline(!effectiveIsOffline)}
                        data-testid="coach-offline-toggle"
                        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium border transition ${
                            effectiveIsOffline
                                ? 'bg-amber-950/80 text-amber-300 border-amber-700/80 shadow-sm shadow-amber-950/40'
                                : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
                        }`}
                        title="Bascule entre l'analyse approfondie IA en ligne et le mode dégradé règle-basé instantané"
                    >
                        <span>{effectiveIsOffline ? '📴' : '🌐'}</span>
                        <span>{effectiveIsOffline ? t('common.offlineMode') : t('common.onlineMode')}</span>
                    </button>
                </div>
            </div>

            {/* 5. Contexte de match enrichi & Table MET (Kazaross) en section repliable */}
            {matchCtx && (
                <details data-testid="coach-match-context" className="mt-3 group rounded-xl border border-slate-700/60 bg-slate-950/70 p-3 text-xs text-slate-300 transition-all">
                    <summary className="cursor-pointer flex items-center justify-between font-bold text-slate-200 select-none">
                        <span className="flex items-center gap-2">
                            <span>📊</span>
                            <span>Table MET & Take-point (Kazaross)</span>
                        </span>
                        <span className="text-[10px] text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    <div className="mt-2.5 pt-2.5 border-t border-slate-800 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-white">
                                    {matchCtx.matchLength === 0 || matchCtx.isMoneyPlay
                                        ? t('hud.moneyPlay')
                                        : t('hud.matchTo', { length: matchCtx.matchLength })}
                                </span>
                                <span className="text-slate-500">·</span>
                                <span>
                                    {t('hud.score')} : <strong className="text-white">X {matchCtx.scoreX}</strong>
                                    {matchCtx.pointsToWin?.X > 0 ? (
                                        <span className="text-slate-400 font-mono"> ({matchCtx.pointsToWin.X} to win)</span>
                                    ) : ''}
                                    {' — '}
                                    <strong className="text-white">O {matchCtx.scoreO}</strong>
                                    {matchCtx.pointsToWin?.O > 0 ? (
                                        <span className="text-slate-400 font-mono"> ({matchCtx.pointsToWin.O} to win)</span>
                                    ) : ''}
                                </span>
                            </div>

                            {/* Badges de régime de match */}
                            <div className="flex items-center gap-1.5">
                                {matchCtx.isDMP && (
                                    <span className="rounded bg-rose-950/80 border border-rose-600 px-2 py-0.5 font-bold text-rose-300">
                                        {t('coach.dmpBadge')}
                                    </span>
                                )}
                                {matchCtx.crawford && (
                                    <span className="rounded bg-amber-950/80 border border-amber-600 px-2 py-0.5 font-bold text-amber-300">
                                        {t('coach.crawfordBadge')}
                                    </span>
                                )}
                                {matchCtx.postCrawford && (
                                    <span className="rounded bg-purple-950/80 border border-purple-600 px-2 py-0.5 font-bold text-purple-300">
                                        {t('coach.postCrawfordBadge')}
                                    </span>
                                )}
                                {matchCtx.cubeValue > 1 && (
                                    <span className="rounded bg-blue-950/80 border border-blue-600 px-2 py-0.5 font-bold text-blue-300">
                                        {t('coach.cubeBadge', { value: matchCtx.cubeValue })}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Métriques MET : Prix du gammon et Take point */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-400">
                            <div className="flex items-center gap-1.5">
                                <span className="text-slate-400">{t('coach.gammonPrice')} :</span>
                                <span className="font-mono font-medium text-emerald-400">
                                    X: {formatGammonPrice(matchCtx.gammonPrice?.X)}
                                </span>
                                <span className="text-slate-600">·</span>
                                <span className="font-mono font-medium text-emerald-400">
                                    O: {formatGammonPrice(matchCtx.gammonPrice?.O)}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-slate-400">{t('coach.takePoint')} :</span>
                                <span className="font-mono font-medium text-cyan-400">
                                    X: {formatPercent(matchCtx.takePoint?.X)}
                                </span>
                                <span className="text-slate-600">·</span>
                                <span className="font-mono font-medium text-cyan-400">
                                    O: {formatPercent(matchCtx.takePoint?.O)}
                                </span>
                            </div>
                        </div>
                    </div>
                </details>
            )}



            {/* Module Rollout Profond Asynchrone GNUBG */}
            {showRollout && (
                <div className="mt-4 pt-3 border-t border-slate-800">
                    <DeepRolloutSection
                        xgid={xgid || positionKey}
                        playedMove={playedMove}
                        optimalMove={optimalMove}
                        candidateMoves={candidateMoves}
                        onRolloutCompleted={onRolloutCompleted}
                    />
                </div>
            )}
        </aside>
    );
}