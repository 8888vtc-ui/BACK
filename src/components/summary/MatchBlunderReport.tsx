'use client';

/**
 * MatchBlunderReport — Rapport Complet de Fin de Match ("Grandmaster Match Review & Blunder Report").
 *
 * Rôle :
 *   Fournit une rétrospective visuelle, chiffrée et pédagogique générée à la fin de la partie :
 *     1. Bannière récapitulative : Badge de Performance (PR, Niveau), Taux de précision (Accuracy %),
 *        et ventilation des 5 catégories Open Sage / bgsage :
 *          🟢 Best Move (< 0.020 Eq)
 *          🟡 Inaccuracy (0.020 – 0.050 Eq)
 *          🟠 Mistake (0.050 – 0.080 Eq)
 *          🔴 Blunder (> 0.080 Eq)
 *          ⚜ Cube Blunder (Erreur de videau)
 *     2. Carrousel interactif & Liste accordéon des "Moments Clés / Gaffes" :
 *          - `MiniBoardDiagram` vectoriel avec flèches comparatives (rouge pointillé vs vert/or plein)
 *          - Badge de sévérité (`-0.142 Eq` / Gaffe) et dés en grand format
 *          - Explication du Coach avec lecture audio (`useCoachVoice`)
 *          - Bouton « Rejouer ce coup » (mode puzzle interactif pour retrouver le coup optimal)
 *     3. Rapport Pédagogique du Coach IA (Gemini) en 3 volets :
 *          - 🎯 Le Diagnostic
 *          - 💡 Le Concept Clé
 *          - 🚀 Plan d'entraînement personnalisé
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import MiniBoardDiagram, { parseDiagramMoveNotation } from '../board/MiniBoardDiagram';
import { useCoachVoice } from '../../hooks/useCoachVoice';
import type { CompleteGameAnalysis } from '../../features/rating/types';
import SoftPaywallCard from '../subscription/SoftPaywallCard';
import {
    FREE_DAILY_ANALYSES_LIMIT,
    formatQuotaBadgeEn,
    formatQuotaBadgeFr,
    loadGuestQuota,
} from '../../lib/subscription/quotaService';
import {
    buildMatchSummaryPayload,
    buildRuleBasedSynthesis,
    classifyAllMatchMoves,
    classifyMoveByEquityLoss,
    computeMatchAccuracy,
    extractMajorBlunders,
    identifyRecurringThemes,
    PHASE_LABELS,
    PHASE_LABELS_EN,
    REPORT_CATEGORY_META,
    type AiSynthesis,
    type MajorBlunder,
    type ReportMoveCategory,
} from './postMatchReportHelpers';

export interface MatchBlunderReportProps {
    /** Analyse complète de la manche. */
    analysis: CompleteGameAnalysis | null;
    /** PR de l'adversaire (optionnel). */
    opponentPr?: number | null;
    /** Durée du match en secondes (optionnel). */
    matchDurationSeconds?: number;
    /** Mode hors-ligne forcé. */
    isOffline?: boolean;
    /** URL de l'API Coach. */
    apiUrl?: string;
    /** Langue d'affichage ('fr' | 'en'). */
    locale?: string;
    /** Callback optionnel lorsqu'on lance l'entraînement des blunders. */
    onTrainBlunders?: () => void;
    /** Force l'affichage du Soft Paywall (4e match et suivants). */
    isQuotaReached?: boolean;
    /** Compteur d'analyses utilisées aujourd'hui (1 à 3 sous quota). */
    quotaUsedCount?: number;
    /** Indique si le joueur dispose du statut VIP Coach Illimité. */
    isVip?: boolean;
    /** Identifiant utilisateur connecté (optionnel). */
    userId?: string | null;
}

const MatchBlunderReportComponent: React.FC<MatchBlunderReportProps> = ({
    analysis,
    opponentPr = null,
    matchDurationSeconds,
    isOffline = false,
    apiUrl = '/api/coach',
    locale = 'fr',
    onTrainBlunders,
    isQuotaReached,
    quotaUsedCount,
    isVip = false,
    userId = null,
}) => {
    const isEn = locale === 'en';
    const player = analysis?.player ?? 'X';

    const guestQuota = loadGuestQuota();
    const resolvedUsedCount =
        quotaUsedCount !== undefined
            ? quotaUsedCount
            : guestQuota.dailyAnalysesCount > 0
              ? guestQuota.dailyAnalysesCount
              : 1;
    const isGameAlreadyUnlocked = Boolean(
        analysis?.gameId && (guestQuota.consumedGameIds ?? []).includes(analysis.gameId),
    );
    const effectiveIsQuotaReached =
        !isVip &&
        (isQuotaReached !== undefined
            ? isQuotaReached
            : quotaUsedCount !== undefined
              ? quotaUsedCount > FREE_DAILY_ANALYSES_LIMIT
              : guestQuota.dailyAnalysesCount >= FREE_DAILY_ANALYSES_LIMIT && !isGameAlreadyUnlocked);

    const quotaBadgeLabel = isEn
        ? formatQuotaBadgeEn(resolvedUsedCount, FREE_DAILY_ANALYSES_LIMIT, isVip)
        : formatQuotaBadgeFr(resolvedUsedCount, FREE_DAILY_ANALYSES_LIMIT, isVip);

    const { isVoiceActive, toggleVoiceCoach, speakExplanation, stopVoice } = useCoachVoice();

    // Mode d'affichage des moments clés : 'carousel' ou 'accordion'
    const [viewLayout, setViewLayout] = useState<'carousel' | 'accordion'>('carousel');
    const [activeBlunderIdx, setActiveBlunderIdx] = useState<number>(0);

    // État du mode interactif "Rejouer ce coup" (index du blunder en cours de puzzle)
    const [replayIndex, setReplayIndex] = useState<number | null>(null);
    const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
    const [clickedPoints, setClickedPoints] = useState<number[]>([]);

    // Synthèse IA (3 volets Gemini avec repli local instantané)
    const blunders = useMemo(
        () => extractMajorBlunders(analysis?.evaluatedMoves, player, 8),
        [analysis?.evaluatedMoves, player],
    );

    const reportBreakdown = useMemo(
        () => classifyAllMatchMoves(analysis?.evaluatedMoves, player),
        [analysis?.evaluatedMoves, player],
    );

    const accuracyPct = useMemo(
        () => computeMatchAccuracy(analysis, player),
        [analysis, player],
    );

    const recurringThemes = useMemo(
        () => identifyRecurringThemes(blunders, analysis, locale),
        [blunders, analysis, locale],
    );

    const summaryPayload = useMemo(
        () =>
            buildMatchSummaryPayload({
                analysis,
                blunders: blunders.slice(0, 3),
                opponentPerformanceRating: opponentPr,
                matchDurationSeconds,
            }),
        [analysis, blunders, opponentPr, matchDurationSeconds],
    );

    const fallbackSynthesis = useMemo(
        () => buildRuleBasedSynthesis(summaryPayload, locale),
        [summaryPayload, locale],
    );

    const [aiSynthesis, setAiSynthesis] = useState<AiSynthesis>(fallbackSynthesis);
    const [synthesisSource, setSynthesisSource] = useState<'llm' | 'rule-based'>('rule-based');

    useEffect(() => {
        setAiSynthesis(fallbackSynthesis);
    }, [fallbackSynthesis]);

    // Appel asynchrone non-bloquant à Gemini (/api/coach mode post-match-synthesis)
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

    // Lecture vocale automatique lors du changement de gaffe si `useCoachVoice` est actif
    useEffect(() => {
        if (!isVoiceActive) return;
        const current = blunders[activeBlunderIdx];
        if (current && current.diagnostic) {
            speakExplanation(`${current.diagnostic} ${current.keyConcept ?? ''}`, locale, false);
        }
    }, [activeBlunderIdx, blunders, isVoiceActive, locale, speakExplanation]);

    const handleStartReplay = useCallback((idx: number) => {
        setReplayIndex((prev) => (prev === idx ? null : idx));
        setSelectedCandidate(null);
        setClickedPoints([]);
    }, []);

    const handlePointClickInPuzzle = useCallback(
        (point: number, blunder: MajorBlunder) => {
            setClickedPoints((prev) => {
                const next = prev.includes(point) ? prev : [...prev, point];
                const optimalArrows = parseDiagramMoveNotation(blunder.optimalNotation, blunder.player ?? 'X');
                const expectedPoints = new Set<number>();
                optimalArrows.forEach((a) => {
                    expectedPoints.add(a.from);
                    expectedPoints.add(a.to);
                });
                // Si le joueur a cliqué sur le point de départ ou d'arrivée du meilleur coup, valide l'essai
                if (optimalArrows.some((a) => next.includes(a.from) && next.includes(a.to))) {
                    setSelectedCandidate(blunder.optimalNotation);
                }
                return next;
            });
        },
        [],
    );

    const playerPr = analysis?.performanceRating ?? 0;
    const playerCategory = analysis?.prCategory ?? (isEn ? 'Intermediate' : 'Intermédiaire');

    const categoryBadges: Array<{ key: keyof typeof reportBreakdown; cat: ReportMoveCategory; count: number }> = [
        { key: 'best', cat: 'best', count: reportBreakdown.best },
        { key: 'inaccuracy', cat: 'inaccuracy', count: reportBreakdown.inaccuracy },
        { key: 'mistake', cat: 'mistake', count: reportBreakdown.mistake },
        { key: 'blunder', cat: 'blunder', count: reportBreakdown.blunder },
        { key: 'cubeBlunder', cat: 'cube_blunder', count: reportBreakdown.cubeBlunder },
    ];

    const renderBlunderCard = (blunder: MajorBlunder, idx: number) => {
        const cat = blunder.category ?? classifyMoveByEquityLoss(blunder.equityLoss, blunder.cubeEquityLoss);
        const meta = REPORT_CATEGORY_META[cat];
        const phaseLabel = isEn ? PHASE_LABELS_EN[blunder.phase] : PHASE_LABELS[blunder.phase];
        const isReplaying = replayIndex === idx;
        const isSolved = selectedCandidate === blunder.optimalNotation;
        const hideOptimal = isReplaying && !isSolved;

        const candidateChoices =
            idx % 2 === 0
                ? [blunder.optimalNotation, blunder.playedNotation]
                : [blunder.playedNotation, blunder.optimalNotation];

        const coachText = `${blunder.diagnostic ?? ''} ${blunder.keyConcept ?? ''}`.trim();

        return (
            <article
                key={`blunder-card-${blunder.turnNumber}-${idx}`}
                data-testid={`match-blunder-card-${idx}`}
                className="rounded-2xl border border-[#d4af37]/40 bg-gradient-to-b from-[#1e120a]/95 to-[#120a05]/95 p-3.5 shadow-[0_16px_40px_rgba(0,0,0,0.65)] space-y-3"
            >
                {/* En-tête de la carte : Tour, Grands Dés, Phase, Badge de Sévérité */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#d4af37]/20 pb-2.5">
                    <div className="flex items-center gap-2.5">
                        {/* Dés affichés en grand */}
                        <div
                            data-testid={`blunder-dice-badge-${idx}`}
                            className="flex items-center gap-1 rounded-xl border border-[#d4af37]/60 bg-[#2a180c] px-2.5 py-1.5 shadow-inner"
                            title={isEn ? `Dice roll ${blunder.dice[0]}-${blunder.dice[1]}` : `Jet de dés ${blunder.dice[0]}-${blunder.dice[1]}`}
                        >
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#d4af37] bg-[#fdf8eb] font-mono text-base font-black text-[#1a0f07] shadow">
                                {blunder.dice[0]}
                            </span>
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#d4af37] bg-[#fdf8eb] font-mono text-base font-black text-[#1a0f07] shadow">
                                {blunder.dice[1]}
                            </span>
                        </div>

                        <div>
                            <div className="flex items-center gap-1.5">
                                <span className="font-serif text-xs font-black uppercase tracking-wider text-[#fdf8eb]">
                                    {isEn ? 'Turn' : 'Tour'} #{blunder.turnNumber}
                                </span>
                                <span className="rounded-md border border-[#d4af37]/30 bg-[#140b06] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#f3c65f]">
                                    {phaseLabel}
                                </span>
                            </div>
                            {blunder.xgid && (
                                <p
                                    data-testid={`blunder-xgid-${idx}`}
                                    className="mt-0.5 max-w-[220px] truncate font-mono text-[9px] text-[#e8dcc6]/55 sm:max-w-xs"
                                    title={blunder.xgid}
                                >
                                    {blunder.xgid}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Badge de sévérité (-0.142 Eq / Gaffe) */}
                    <div className="flex items-center gap-1.5">
                        <span
                            data-testid={`blunder-severity-badge-${idx}`}
                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-mono text-xs font-black ${meta.badgeClass}`}
                        >
                            <span aria-hidden="true">{meta.icon}</span>
                            <span>-{blunder.equityLoss.toFixed(3)} Eq</span>
                            <span className="font-sans text-[10px] font-bold opacity-90">
                                • {isEn ? meta.shortEn : meta.shortFr}
                            </span>
                        </span>
                    </div>
                </div>

                {/* Snapshot visuel Mini-Board Diagram avec flèches comparatives */}
                <MiniBoardDiagram
                    board={blunder.boardBefore}
                    dice={blunder.dice}
                    turn={blunder.player ?? player}
                    playedMove={blunder.playedNotation}
                    optimalMove={blunder.optimalNotation}
                    hideOptimalArrow={hideOptimal}
                    highlightedPoints={isReplaying ? clickedPoints : undefined}
                    onPointClick={
                        isReplaying ? (pt) => handlePointClickInPuzzle(pt, blunder) : undefined
                    }
                    locale={locale}
                />

                {/* Comparaison Coup Joué vs Coup Optimal */}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div className="rounded-xl border border-rose-700/50 bg-rose-950/30 px-3 py-2">
                        <span className="block text-[9px] font-bold uppercase tracking-wider text-rose-300">
                            🔴 {isEn ? 'Your move (dashed red)' : 'Coup joué (rouge pointillé)'}
                        </span>
                        <span className="mt-0.5 block font-mono text-xs font-black text-rose-100">
                            {blunder.playedNotation}
                        </span>
                    </div>
                    <div className="rounded-xl border border-emerald-700/50 bg-emerald-950/30 px-3 py-2">
                        <span className="block text-[9px] font-bold uppercase tracking-wider text-emerald-300">
                            🟢 {isEn ? 'Engine optimal (solid green/gold)' : 'Optimal moteur (vert/or plein)'}
                        </span>
                        <span className="mt-0.5 block font-mono text-xs font-black text-emerald-100">
                            {hideOptimal
                                ? isEn
                                    ? '??? (Find the optimal move!)'
                                    : '??? (Trouvez le meilleur coup !)'
                                : blunder.optimalNotation}
                        </span>
                    </div>
                </div>

                {/* Mode interactif / Puzzle : "Rejouer ce coup" */}
                {isReplaying && (
                    <div
                        data-testid={`blunder-replay-puzzle-${idx}`}
                        className="rounded-xl border border-[#f3c65f]/60 bg-[#26160c]/90 p-3 space-y-2"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs font-bold text-[#f3c65f]">
                                🎯{' '}
                                {isEn
                                    ? `Interactive Replay — Choose or click the best move with [${blunder.dice[0]}-${blunder.dice[1]}]:`
                                    : `Mode Puzzle Interactif — Choisissez ou cliquez le coup optimal avec [${blunder.dice[0]}-${blunder.dice[1]}] :`}
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                                {candidateChoices.map((choice) => (
                                    <button
                                        key={choice}
                                        type="button"
                                        onClick={() => setSelectedCandidate(choice)}
                                        data-testid={`replay-choice-${idx}-${choice}`}
                                        className={`rounded-xl border px-3 py-1.5 font-mono text-xs font-black transition ${
                                            selectedCandidate === choice
                                                ? choice === blunder.optimalNotation
                                                    ? 'border-emerald-400 bg-emerald-600 text-white'
                                                    : 'border-rose-400 bg-rose-600 text-white'
                                                : 'border-[#d4af37]/50 bg-[#140b06] text-[#fdf8eb] hover:border-[#f3c65f]'
                                        }`}
                                    >
                                        {choice}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {selectedCandidate && (
                            <p
                                data-testid={`replay-feedback-${idx}`}
                                className={`text-xs font-bold ${
                                    isSolved ? 'text-emerald-300' : 'text-rose-300'
                                }`}
                            >
                                {isSolved
                                    ? isEn
                                        ? `✅ Brilliant! ${blunder.optimalNotation} is the Grandmaster move (saves +${blunder.equityLoss.toFixed(3)} Eq).`
                                        : `✅ Exact ! ${blunder.optimalNotation} est le coup optimal du moteur (économise +${blunder.equityLoss.toFixed(3)} Eq).`
                                    : isEn
                                      ? `❌ ${selectedCandidate} loses -${blunder.equityLoss.toFixed(3)} Eq. Try again or inspect the green arrow!`
                                      : `❌ ${selectedCandidate} perd -${blunder.equityLoss.toFixed(3)} Eq. Sélectionnez l'autre candidat pour révéler la flèche optimale !`}
                            </p>
                        )}
                    </div>
                )}

                {/* Explication pédagogique du Coach + Actions (Voix & Rejouer ce coup) */}
                <div className="rounded-xl border border-[#d4af37]/25 bg-[#140b06]/85 p-2.5 space-y-1.5">
                    {blunder.diagnostic && (
                        <p className="text-[11px] leading-relaxed text-[#fdf8eb]">
                            <strong className="text-[#f3c65f]">
                                🎯 {isEn ? 'Diagnostic:' : 'Diagnostic :'}
                            </strong>{' '}
                            {blunder.diagnostic}
                        </p>
                    )}
                    {blunder.keyConcept && (
                        <p className="text-[11px] leading-relaxed text-[#e8dcc6]/85">
                            <strong className="text-emerald-300">
                                💡 {isEn ? 'Key Concept:' : 'Concept Clé :'}
                            </strong>{' '}
                            {blunder.keyConcept}
                        </p>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5">
                        <button
                            type="button"
                            onClick={() => handleStartReplay(idx)}
                            data-testid={`replay-blunder-move-btn-${idx}`}
                            className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-black uppercase tracking-wider transition active:scale-95 ${
                                isReplaying
                                    ? 'border-[#f3c65f] bg-[#f3c65f] text-[#1a0f07]'
                                    : 'border-[#d4af37]/60 bg-[#2a180c] text-[#fce8b2] hover:border-[#f3c65f] hover:bg-[#382010]'
                            }`}
                        >
                            <span aria-hidden="true">🎯</span>
                            <span>
                                {isReplaying
                                    ? isEn
                                        ? 'Exit Replay'
                                        : 'Quitter le puzzle'
                                    : isEn
                                      ? 'Replay this move'
                                      : 'Rejouer ce coup'}
                            </span>
                        </button>

                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => speakExplanation(coachText, locale, true)}
                                data-testid={`speak-blunder-btn-${idx}`}
                                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-[#d4af37]/40 bg-[#1c1008] px-2.5 py-1 text-[11px] font-bold text-[#e8dcc6] transition hover:border-[#f3c65f] hover:text-white"
                                title={isEn ? 'Listen to Coach explanation' : 'Écouter l’explication du Coach'}
                            >
                                <span aria-hidden="true">🔊</span>
                                <span>{isEn ? 'Listen' : 'Écouter'}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const next = toggleVoiceCoach();
                                    if (!next) stopVoice();
                                }}
                                data-testid={`toggle-voice-coach-btn-${idx}`}
                                className={`rounded-xl border px-2 py-1 text-[10px] font-bold transition ${
                                    isVoiceActive
                                        ? 'border-emerald-500/50 bg-emerald-950/50 text-emerald-300'
                                        : 'border-[#d4af37]/25 bg-[#120904] text-[#e8dcc6]/60'
                                }`}
                            >
                                {isVoiceActive
                                    ? isEn
                                        ? '🎙️ Auto-Voice ON'
                                        : '🎙️ Voix Auto ON'
                                    : isEn
                                      ? '🔇 Auto-Voice OFF'
                                      : '🔇 Voix Auto OFF'}
                            </button>
                        </div>
                    </div>
                </div>
            </article>
        );
    };

    return (
        <div
            data-testid="match-blunder-report"
            className="space-y-4 text-[#fdf8eb]"
        >
            {/* 1. BANNIÈRE RÉCAPITULATIVE : Badge PR, Accuracy %, & Classification des 5 seuils */}
            <section
                data-testid="match-blunder-banner"
                aria-label={isEn ? 'Performance & Accuracy Summary' : 'Bannière de Performance et Précision'}
                className="rounded-2xl border border-[#d4af37]/45 bg-gradient-to-br from-[#221309] via-[#150c06] to-[#0d0704] p-4 shadow-[inset_0_1px_0_rgba(255,245,205,0.12)] space-y-3"
            >
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d4af37]/65 bg-gradient-to-b from-[#3b2310] to-[#1a0e06] text-2xl text-[#f3c65f] shadow-md">
                            ⚜
                        </div>
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <span
                                    data-testid="match-report-level-badge"
                                    className="rounded-full border border-[#f3c65f]/60 bg-[#2f1b0c] px-3 py-0.5 text-xs font-black uppercase tracking-wider text-[#fce8b2]"
                                >
                                    {isEn ? `Level: ${playerCategory}` : `Niveau ${playerCategory}`}
                                </span>
                                <span
                                    data-testid="match-report-pr-badge"
                                    className="font-mono text-sm font-black text-[#f3c65f]"
                                >
                                    PR: {playerPr.toFixed(2)}
                                </span>
                                <span
                                    data-testid="daily-quota-badge"
                                    className="rounded-full border border-[#d4af37]/40 bg-[#140b06] px-2.5 py-0.5 text-[11px] font-semibold text-[#f3c65f]"
                                >
                                    {quotaBadgeLabel}
                                </span>
                                {opponentPr !== null && opponentPr !== undefined && (
                                    <span className="font-mono text-xs text-[#e8dcc6]/65">
                                        vs {isEn ? 'Opponent PR' : 'PR Adv.'}: {opponentPr.toFixed(2)}
                                    </span>
                                )}
                            </div>
                            <p className="mt-0.5 text-[11px] text-[#e8dcc6]/75">
                                {isEn
                                    ? 'Grandmaster Match Review & Blunder Report (Open Sage / XG2 scale)'
                                    : 'Revue de Match Grand-Maître & Analyse des Gaffes (Échelle Open Sage / XG2)'}
                            </p>
                        </div>
                    </div>

                    {/* Jauge Taux de Précision (Accuracy %) */}
                    <div
                        data-testid="match-report-accuracy"
                        className="flex items-center gap-3 rounded-2xl border border-[#d4af37]/40 bg-[#120a05]/90 px-4 py-2"
                    >
                        <div className="text-right">
                            <span className="block text-[9px] font-bold uppercase tracking-wider text-[#e8dcc6]/70">
                                {isEn ? 'Accuracy' : 'Taux de précision'}
                            </span>
                            <span className="font-mono text-xl font-black text-emerald-300">
                                {accuracyPct.toFixed(1)}%
                            </span>
                        </div>
                    </div>
                </div>

                {/* Compteurs des 5 catégories de coups (Best, Inaccuracy, Mistake, Blunder, Cube Blunder) */}
                <div
                    data-testid="match-report-classification-grid"
                    className="grid grid-cols-2 gap-1.5 sm:grid-cols-5"
                >
                    {categoryBadges.map(({ key, cat, count }) => {
                        const meta = REPORT_CATEGORY_META[cat];
                        return (
                            <div
                                key={key}
                                data-testid={`report-cat-${cat}`}
                                className={`flex items-center justify-between rounded-xl border px-2.5 py-1.5 ${meta.badgeClass}`}
                            >
                                <span className="flex items-center gap-1.5 text-[10px] font-bold">
                                    <span aria-hidden="true">{meta.icon}</span>
                                    <span>{isEn ? meta.shortEn : meta.shortFr}</span>
                                </span>
                                <span className="font-mono text-sm font-black">{count}</span>
                            </div>
                        );
                    })}
                </div>
            </section>

            {effectiveIsQuotaReached ? (
                <SoftPaywallCard analysis={analysis} userId={userId} locale={locale} />
            ) : (
                <>
            {/* 2. CARROUSEL INTERACTIF OU LISTE ACCORDÉON DES MOMENTS CLÉS / GAFFES */}
            <section
                data-testid="match-blunders-key-moments"
                aria-label={isEn ? 'Key Moments and Blunders' : 'Moments Clés et Gaffes'}
                className="rounded-2xl border border-[#d4af37]/35 bg-[#140b06]/90 p-4 space-y-3"
            >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#d4af37]/20 pb-2">
                    <div className="flex items-center gap-2">
                        <span aria-hidden="true" className="text-base">
                            🔍
                        </span>
                        <h3 className="font-serif text-xs font-black uppercase tracking-wider text-[#fce8b2] sm:text-sm">
                            {isEn
                                ? `Key Moments & Blunders (${blunders.length})`
                                : `Moments Clés & Gaffes (${blunders.length})`}
                        </h3>
                    </div>

                    {blunders.length > 0 && (
                        <div className="flex items-center gap-1 rounded-xl border border-[#d4af37]/30 bg-[#0d0704] p-0.5 text-[10px] font-bold">
                            <button
                                type="button"
                                onClick={() => setViewLayout('carousel')}
                                data-testid="layout-carousel-btn"
                                className={`rounded-lg px-2.5 py-1 transition ${
                                    viewLayout === 'carousel'
                                        ? 'bg-[#d4af37] text-[#1a0f07]'
                                        : 'text-[#e8dcc6]/75 hover:text-white'
                                }`}
                            >
                                {isEn ? 'Carousel' : 'Carrousel'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewLayout('accordion')}
                                data-testid="layout-accordion-btn"
                                className={`rounded-lg px-2.5 py-1 transition ${
                                    viewLayout === 'accordion'
                                        ? 'bg-[#d4af37] text-[#1a0f07]'
                                        : 'text-[#e8dcc6]/75 hover:text-white'
                                }`}
                            >
                                {isEn ? 'Accordion List' : 'Liste Accordéon'}
                            </button>
                        </div>
                    )}
                </div>

                {blunders.length === 0 ? (
                    <div
                        data-testid="match-report-zero-blunders"
                        className="rounded-xl border border-emerald-600/40 bg-emerald-950/30 p-4 text-center text-xs text-emerald-200"
                    >
                        🟢{' '}
                        {isEn
                            ? 'Zero inaccuracies or blunders (ΔEq < 0.020 on every turn). Grandmaster precision!'
                            : 'Aucune imprécision ni gaffe majeure (ΔEq < 0.020 sur chaque tour). Précision de Grand-Maître !'}
                    </div>
                ) : viewLayout === 'carousel' ? (
                    <div className="space-y-3">
                        {/* Contrôles du carrousel */}
                        <div className="flex items-center justify-between gap-2">
                            <button
                                type="button"
                                disabled={activeBlunderIdx === 0}
                                onClick={() => {
                                    setActiveBlunderIdx((i) => Math.max(0, i - 1));
                                    setReplayIndex(null);
                                }}
                                data-testid="blunder-carousel-prev"
                                className="rounded-xl border border-[#d4af37]/40 bg-[#1e120a] px-3 py-1.5 text-xs font-bold text-[#fce8b2] transition hover:border-[#f3c65f] disabled:opacity-35"
                            >
                                ← {isEn ? 'Prev' : 'Préc.'}
                            </button>

                            <div className="flex flex-wrap items-center justify-center gap-1.5">
                                {blunders.map((b, idx) => (
                                    <button
                                        key={`dot-${b.turnNumber}-${idx}`}
                                        type="button"
                                        onClick={() => {
                                            setActiveBlunderIdx(idx);
                                            setReplayIndex(null);
                                        }}
                                        data-testid={`blunder-carousel-dot-${idx}`}
                                        className={`rounded-lg border px-2 py-0.5 font-mono text-[10px] font-bold transition ${
                                            idx === activeBlunderIdx
                                                ? 'border-[#f3c65f] bg-[#d4af37] text-[#1a0f07]'
                                                : 'border-[#d4af37]/30 bg-[#1c1008] text-[#e8dcc6]/75 hover:border-[#d4af37]'
                                        }`}
                                    >
                                        #{b.turnNumber} (-{b.equityLoss.toFixed(2)})
                                    </button>
                                ))}
                            </div>

                            <button
                                type="button"
                                disabled={activeBlunderIdx >= blunders.length - 1}
                                onClick={() => {
                                    setActiveBlunderIdx((i) => Math.min(blunders.length - 1, i + 1));
                                    setReplayIndex(null);
                                }}
                                data-testid="blunder-carousel-next"
                                className="rounded-xl border border-[#d4af37]/40 bg-[#1e120a] px-3 py-1.5 text-xs font-bold text-[#fce8b2] transition hover:border-[#f3c65f] disabled:opacity-35"
                            >
                                {isEn ? 'Next' : 'Suiv.'} →
                            </button>
                        </div>

                        {renderBlunderCard(blunders[activeBlunderIdx] ?? blunders[0], activeBlunderIdx)}
                    </div>
                ) : (
                    <div className="space-y-2.5" data-testid="blunder-accordion-list">
                        {blunders.map((b, idx) => {
                            const isOpen = activeBlunderIdx === idx;
                            const cat = b.category ?? classifyMoveByEquityLoss(b.equityLoss, b.cubeEquityLoss);
                            const meta = REPORT_CATEGORY_META[cat];
                            return (
                                <div
                                    key={`acc-${b.turnNumber}-${idx}`}
                                    className="rounded-2xl border border-[#d4af37]/30 bg-[#180e08] overflow-hidden"
                                >
                                    <button
                                        type="button"
                                        onClick={() => setActiveBlunderIdx(idx)}
                                        data-testid={`blunder-accordion-header-${idx}`}
                                        aria-expanded={isOpen}
                                        className="flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left text-xs font-bold hover:bg-[#22140b] transition"
                                    >
                                        <span className="flex items-center gap-2">
                                            <span>{meta.icon}</span>
                                            <span className="font-mono text-[#f3c65f]">
                                                {isEn ? 'Turn' : 'Tour'} #{b.turnNumber} [{b.dice[0]}-{b.dice[1]}]
                                            </span>
                                            <span className="font-mono text-rose-300">
                                                {b.playedNotation}
                                            </span>
                                            <span className="text-[#e8dcc6]/50">➔</span>
                                            <span className="font-mono text-emerald-300">
                                                {b.optimalNotation}
                                            </span>
                                        </span>
                                        <span className="font-mono text-xs font-black text-rose-300">
                                            -{b.equityLoss.toFixed(3)} Eq {isOpen ? '▲' : '▼'}
                                        </span>
                                    </button>
                                    {isOpen && <div className="p-2.5 pt-0">{renderBlunderCard(b, idx)}</div>}
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* 3. RAPPORT PÉDAGOGIQUE DU COACH IA (GEMINI) EN 3 VOLETS */}
            <section
                data-testid="gemini-coach-three-pillars"
                aria-label={isEn ? 'Gemini Coach 3-Part Report' : 'Rapport Pédagogique du Coach IA en 3 volets'}
                className="rounded-2xl border border-[#d4af37]/45 bg-gradient-to-b from-[#1d1109] to-[#110904] p-4 space-y-3 shadow-lg"
            >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#d4af37]/25 pb-2">
                    <div className="flex items-center gap-2">
                        <span aria-hidden="true" className="text-base">
                            🧠
                        </span>
                        <h3 className="font-serif text-xs font-black uppercase tracking-wider text-[#f3c65f] sm:text-sm">
                            {isEn
                                ? 'Grandmaster AI Synthesis (3 Pillars)'
                                : 'Synthèse Pédagogique du Coach IA (Gemini)'}
                        </h3>
                    </div>

                    <div className="flex items-center gap-2">
                        {recurringThemes.map((theme, i) => (
                            <span
                                key={i}
                                data-testid={`recurring-theme-badge-${i}`}
                                className="rounded-full border border-[#d4af37]/40 bg-[#28170b] px-2.5 py-0.5 text-[10px] font-semibold text-[#fce8b2]"
                            >
                                {theme}
                            </span>
                        ))}
                        <span
                            data-testid="gemini-coach-source-badge"
                            className="rounded-full border border-[#d4af37]/40 bg-[#140b06] px-2 py-0.5 text-[9px] font-bold text-[#f3c65f]"
                        >
                            {synthesisSource === 'llm' ? '✨ Gemini IA' : '⚜ Coach Sage'}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
                    {/* Volet 1 : 🎯 Le Diagnostic */}
                    <div
                        data-testid="coach-pillar-diagnostic"
                        className="rounded-xl border border-rose-500/40 bg-rose-950/20 p-3 space-y-1"
                    >
                        <h4 className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-rose-300">
                            <span aria-hidden="true">🎯</span>
                            <span>{isEn ? '1. The Diagnostic' : '1. Le Diagnostic'}</span>
                        </h4>
                        <p className="text-xs leading-relaxed text-[#fdf8eb]/90">
                            {aiSynthesis.diagnostic}
                        </p>
                    </div>

                    {/* Volet 2 : 💡 Le Concept Clé */}
                    <div
                        data-testid="coach-pillar-key-concept"
                        className="rounded-xl border border-[#d4af37]/50 bg-[#26160c]/60 p-3 space-y-1"
                    >
                        <h4 className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-[#f3c65f]">
                            <span aria-hidden="true">💡</span>
                            <span>
                                {isEn ? '2. Key Concept: ' : '2. Le Concept Clé : '}
                                {aiSynthesis.keyConcept?.title}
                            </span>
                        </h4>
                        <p className="text-xs leading-relaxed text-[#e8dcc6]">
                            {aiSynthesis.keyConcept?.explanation}
                        </p>
                    </div>

                    {/* Volet 3 : 🚀 Plan d'entraînement personnalisé */}
                    <div
                        data-testid="coach-pillar-training-plan"
                        className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-3 space-y-1.5"
                    >
                        <h4 className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-emerald-300">
                            <span aria-hidden="true">🚀</span>
                            <span>
                                {isEn ? '3. Personalized Training Plan' : '3. Plan d’entraînement personnalisé'}
                            </span>
                        </h4>
                        <ul className="space-y-1 text-xs leading-relaxed text-emerald-100">
                            {aiSynthesis.trainingPlan.slice(0, 2).map((item, idx) => (
                                <li key={idx} className="flex items-start gap-1.5">
                                    <span aria-hidden="true" className="text-[#f3c65f]">
                                        ▸
                                    </span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                        {onTrainBlunders && (
                            <button
                                type="button"
                                onClick={onTrainBlunders}
                                data-testid="coach-pillar-start-drills-btn"
                                className="mt-1 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-emerald-400/50 bg-emerald-600/30 px-2.5 py-1 text-[11px] font-bold text-emerald-200 transition hover:bg-emerald-600/50"
                            >
                                <span>🎯</span>
                                <span>{isEn ? 'Launch Personalized Drills' : 'Lancer cet entraînement'}</span>
                            </button>
                        )}
                    </div>
                </div>
            </section>
                </>
            )}
        </div>
    );
};

export const MatchBlunderReport = React.memo(MatchBlunderReportComponent);
export default MatchBlunderReport;
