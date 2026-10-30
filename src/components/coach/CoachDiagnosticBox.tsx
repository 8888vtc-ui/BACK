'use client';

/**
 * Diagnostic pédagogique Neuro-Symbolique Bi-Niveau du Grand-Maître (< 300 lignes, 0 `any`).
 * - Niveau 1 (Débutant / `fun`) : Plateau interactif cliquable (`MiniBoardDiagram`) + simulation
 *   visuelle directe sur le plateau (`[Voir danger]`, `[Voir idée]`, clic direct sur une flèche du plateau).
 * - Niveau 2 (Pro / `pro`) : télémétrie chirurgicale 3-ply (ΔEMG / mEMG, tirs /36, équation de Douglas Zare).
 */

import React, { useMemo, useState } from 'react';
import type { PedagogicalExplanation, SymbolicAudit } from '../../lib/coach/symbolicAudit';
import { buildSocraticQuestion } from '../../lib/coach/socraticQuestionBuilder';
import { CoachSocraticQuizCard } from './CoachSocraticQuizCard';
import { readStoredExperienceMode, storeExperienceMode, type ExperienceMode } from '../../features/personas/botPersonas';
import { buildBiLevelCoachMicroCopy, evaluateBrilliantMoveCriteria } from '../../features/coach/tacticalExplainer';
import MiniBoardDiagram, { parseDiagramMoveNotation } from '../board/MiniBoardDiagram';

const DEFAULT_BEGINNER_BOARD: ReadonlyArray<number> = Object.freeze([
    0, -2, 0, 0, 0, 0, 5, 0, 3, 0, 0, 0, -5, 5, 0, 0, 0, -3, 0, -5, 0, 0, 0, 0, 2, 0,
]);

export interface CoachDiagnosticBoxProps {
    tacticalSummary?: string | null; explanation?: string | null; summary?: string | null;
    whyFailed?: string | null; whyOptimal?: string | null; advice?: string | null;
    keyConcept?: string | null; conceptId?: string | null;
    symbolicAudit?: SymbolicAudit | null; pedagogicalExplanation?: PedagogicalExplanation | null;
    equityLoss?: number | null; bestMoveNotation?: string | null; playedMoveNotation?: string | null;
    gamePhase?: string | null; playerPips?: number | null; opponentPips?: number | null;
    pipDiff?: number | null; concepts?: ReadonlyArray<string> | null;
    recurringErrorCount?: number; onRetryMove?: () => void;
    onOpenKnowledgeConcept?: (conceptId: string) => void; isStreaming?: boolean; locale?: string;
    board?: ReadonlyArray<number>; dice?: [number, number] | null;
}

type DiagnosticViewMode = 'flash' | 'socratic' | 'zare';

function applyNotationToBoard(baseBoard: ReadonlyArray<number>, notation: string | null | undefined): number[] {
    const next = [...baseBoard];
    for (const a of parseDiagramMoveNotation(notation, 'X')) {
        if (a.from >= 1 && a.from <= 24 && (next[a.from] ?? 0) > 0) next[a.from] -= 1;
        if (a.to >= 1 && a.to <= 24) {
            if (next[a.to] === -1) { next[a.to] = 1; next[25] = (next[25] ?? 0) - 1; }
            else if ((next[a.to] ?? 0) >= 0) next[a.to] = (next[a.to] ?? 0) + 1;
        }
    }
    return next;
}

function describeClickedPointForBeginner(pt: number, board: ReadonlyArray<number>, isGoalPt: boolean, bestMove: string, isEn: boolean): string {
    if (isGoalPt) {
        return isEn
            ? `🎉 Great eye! Point ${pt} is the key target of the Master move (${bestMove}): your checkers form a solid shield here!`
            : `🎉 Bien vu ! La case ${pt} est la cible clé du coup de Maître (${bestMove}) : tes dames y forment un bouclier solide !`;
    }
    const count = board[pt] ?? 0;
    if (pt === 5) return isEn ? '⭐ Point 5 (Golden Point): the most valuable shield in your home board!' : '⭐ Case 5 (Point d’Or) : la case la plus précieuse devant ta Maison ! 2 dames ici bloquent tout.';
    if (pt === 7) return isEn ? '🏰 Point 7 (Bar Point): blocks the opponent from escaping with a 6.' : '🏰 Case 7 (Point de Barre) : ferme la porte aux 6 adverses qui tentent de s’enfuir.';
    if (count === 1) return isEn ? `⚠️ Point ${pt}: you have 1 lone checker here (vulnerable to a hit!).` : `⚠️ Case ${pt} : tu as 1 pion tout seul ici (en danger s’il est frappé !).`;
    if (count >= 2) return isEn ? `🛡️ Point ${pt}: protected gate with ${count} of your checkers.` : `🛡️ Case ${pt} : Porte protégée par ${count} de tes dames (interdite à l’adversaire).`;
    if (count <= -2) return isEn ? `🚧 Point ${pt}: blocked by ${Math.abs(count)} opponent checkers.` : `🚧 Case ${pt} : bloquée par ${Math.abs(count)} dames adverses.`;
    return isEn ? `📍 Point ${pt}: empty point (${pt <= 6 ? 'inside your Home Board' : 'open field'}).` : `📍 Case ${pt} : case libre (${pt <= 6 ? 'dans ta Maison' : 'sur le parcours'}).`;
}

function formatEmotionalVerdict(loss: number, shots: number, level: ExperienceMode, isEn: boolean): { badge: string; toneCls: string } {
    const winPct = Math.min(45, Math.max(1, Math.round(loss * 85)));
    const isBrilliant = evaluateBrilliantMoveCriteria({ equityLossEmg: loss, directShotsConceded: shots, level });
    if (loss <= 0.015) {
        return isBrilliant || shots > 0
            ? { badge: isEn ? '✨ Brilliant Move (!!) · Bold play validated by 3-ply' : '✨ Coup Brillant (!!) · Audace validée par le 3-ply', toneCls: 'border-cyan-400/50 bg-cyan-950/40 text-cyan-200' }
            : { badge: isEn ? '🎯 Master Move (!) · Best play on the board' : '🎯 Coup de Maître (!) · Meilleur coup du plateau', toneCls: 'border-emerald-400/50 bg-emerald-950/40 text-emerald-200' };
    }
    if (loss <= 0.045) {
        return { badge: level === 'fun' ? (isEn ? `⚡ Stronger Option (?!) · -${winPct}% win chance` : `⚡ Option plus forte (?!) · -${winPct}% de chances de gain`) : `🤔 Imprécision mineure (?!) · ΔEMG -${loss.toFixed(3)}`, toneCls: 'border-amber-400/40 bg-amber-950/30 text-amber-200' };
    }
    if (loss <= 0.085) {
        return { badge: level === 'fun' ? (isEn ? `⚠️ Risky Line (?) · -${winPct}% win chance` : `⚠️ Ligne risquée (?) · -${winPct}% de chances de gain`) : `⚠️ Erreur (?) · ΔEMG -${loss.toFixed(3)} (~-${winPct}% MWC)`, toneCls: 'border-orange-500/50 bg-orange-950/40 text-orange-200' };
    }
    return { badge: level === 'fun' ? (isEn ? `🎯 Key Turning Point (??) · -${winPct}% win chance` : `🎯 Tournant décisif (??) · -${winPct}% de chances de gain`) : `🚨 Blunder (??) · ΔEMG -${loss.toFixed(3)} (~-${winPct}% MWC)`, toneCls: 'border-rose-500/60 bg-rose-950/50 text-rose-200' };
}

const CoachDiagnosticBoxComponent: React.FC<CoachDiagnosticBoxProps> = ({
    tacticalSummary, explanation, summary, whyFailed, whyOptimal, advice, keyConcept, conceptId,
    symbolicAudit, pedagogicalExplanation, equityLoss, bestMoveNotation, playedMoveNotation,
    gamePhase, playerPips, opponentPips, pipDiff, concepts, recurringErrorCount = 0, onRetryMove,
    onOpenKnowledgeConcept, isStreaming = false, locale = 'fr', board, dice,
}) => {
    const isEn = locale === 'en';
    const [mode, setMode] = useState<DiagnosticViewMode>('flash');
    const [socraticStep, setSocraticStep] = useState<number>(1);
    const [levelMode, setLevelMode] = useState<ExperienceMode>(() => readStoredExperienceMode());
    const [activeVisualCta, setActiveVisualCta] = useState<'danger' | 'idea' | null>(null);
    const [clickedPointFeedback, setClickedPointFeedback] = useState<string | null>(null);
    const [boardSimState, setBoardSimState] = useState<'before' | 'optimal'>('before');
    const handleLevelChange = (next: ExperienceMode) => { setLevelMode(next); storeExperienceMode(next); };

    const effectiveEquityLoss = Math.abs(equityLoss ?? symbolicAudit?.blunder_delta_equity ?? 0);
    const directShots = symbolicAudit?.direct_shots_conceded ?? 0;
    const effectiveBestMove = bestMoveNotation ?? pedagogicalExplanation?.correct_play_canonical ?? '8/5 6/5';
    const effectivePlayedMove = playedMoveNotation ?? '24/20 13/11';

    const biLevelMicroCopy = useMemo(() => buildBiLevelCoachMicroCopy({
        equityLossEmg: effectiveEquityLoss, directShotsConceded: directShots, dominantTheme: symbolicAudit?.dominant_theme ?? gamePhase,
        recurringErrorCount, isBrilliantMove: evaluateBrilliantMoveCriteria({ equityLossEmg: effectiveEquityLoss, directShotsConceded: directShots, level: levelMode }),
        locale, playedMoveNotation, bestMoveNotation: bestMoveNotation ?? pedagogicalExplanation?.correct_play_canonical, keyConcept,
    }), [effectiveEquityLoss, directShots, symbolicAudit?.dominant_theme, gamePhase, recurringErrorCount, levelMode, locale, playedMoveNotation, bestMoveNotation, pedagogicalExplanation?.correct_play_canonical, keyConcept]);

    const socraticChallenge = useMemo(() => buildSocraticQuestion({
        gamePhase: gamePhase ?? symbolicAudit?.dominant_theme ?? undefined, playerPips: playerPips ?? symbolicAudit?.player_pip ?? undefined,
        opponentPips: opponentPips ?? symbolicAudit?.opponent_pip ?? undefined, pipDiff: pipDiff ?? undefined, equityLoss: effectiveEquityLoss,
        bestMoveNotation: bestMoveNotation ?? pedagogicalExplanation?.correct_play_canonical ?? undefined, playedMoveNotation: playedMoveNotation ?? undefined,
        directShotsConceded: symbolicAudit?.direct_shots_conceded, concepts: concepts ?? (conceptId ? [conceptId] : keyConcept ? [keyConcept] : undefined), locale,
    }), [gamePhase, symbolicAudit, playerPips, opponentPips, pipDiff, effectiveEquityLoss, bestMoveNotation, pedagogicalExplanation?.correct_play_canonical, playedMoveNotation, concepts, conceptId, keyConcept, locale]);

    const baseBoard = board && board.length >= 26 ? board : DEFAULT_BEGINNER_BOARD;
    const optimalTargets = useMemo(() => {
        const parsed = parseDiagramMoveNotation(effectiveBestMove, 'X').map((a) => a.to).filter((p) => p >= 1 && p <= 24);
        return parsed.length > 0 ? Array.from(new Set(parsed)) : [5, 7];
    }, [effectiveBestMove]);
    const dangerTargets = useMemo(() => {
        const parsed = parseDiagramMoveNotation(effectivePlayedMove, 'X').map((a) => a.to).filter((p) => p >= 1 && p <= 24);
        const blots: number[] = [];
        for (let p = 1; p <= 24; p++) if (baseBoard[p] === 1) blots.push(p);
        return Array.from(new Set([...parsed, ...blots])).slice(0, 4);
    }, [effectivePlayedMove, baseBoard]);

    const displayedBoard = useMemo(
        () => (boardSimState === 'optimal' || activeVisualCta === 'idea' ? applyNotationToBoard(baseBoard, effectiveBestMove) : [...baseBoard]),
        [baseBoard, boardSimState, activeVisualCta, effectiveBestMove],
    );

    const hasTextContent = Boolean(tacticalSummary || explanation || summary || whyFailed || whyOptimal || advice || pedagogicalExplanation);
    const hasSocraticTrigger = Boolean((equityLoss !== undefined && equityLoss !== null && socraticChallenge.shouldTrigger) || (symbolicAudit && socraticChallenge.shouldTrigger));
    if (!hasTextContent && !hasSocraticTrigger && !isStreaming) return null;

    const triptych = pedagogicalExplanation?.idea_problem_solution;
    const socraticHints = pedagogicalExplanation?.socratic_hints ?? [
        isEn ? `Step 1 (Plan): Identify the priority in this ${symbolicAudit?.dominant_theme ?? 'tactical'} structure.` : `Indice 1 (Plan) : Identifiez la priorité dans ce schéma ${symbolicAudit?.dominant_theme ?? 'tactique'}.`,
        whyFailed || (isEn ? 'Step 2 (Weakness): Look at the direct shots conceded to the AI.' : "Indice 2 (Zone) : Observez les tirs directs concédés à l'IA."),
        whyOptimal || summary || (isEn ? 'Step 3 (Solution): Consolidate your key points.' : 'Indice 3 (Solution) : Verrouillez vos portes maîtresses.'),
    ];

    const zareSummary = pedagogicalExplanation?.zare_luck_vs_skill || advice;
    const michyProverb = pedagogicalExplanation?.michy_proverb;
    const modeTabs: Array<{ id: DiagnosticViewMode; label: string; activeCls: string; testId: string }> = [
        { id: 'flash', label: isEn ? '⚡ Coach AI' : '⚡ Coach IA', activeCls: 'bg-indigo-600 text-white shadow-sm', testId: 'coach-mode-flash-btn' },
        { id: 'socratic', label: isEn ? '❓ 3 Hints' : '❓ 3 Indices', activeCls: 'bg-amber-600 text-white shadow-sm', testId: 'coach-mode-socratic-btn' },
        { id: 'zare', label: isEn ? '⚖️ Skill vs Luck' : '⚖️ Niveau vs Dés', activeCls: 'bg-emerald-600 text-white shadow-sm', testId: 'coach-mode-zare-btn' },
    ];

    const handleBeginnerPointClick = (pt: number) => {
        const isGoal = optimalTargets.includes(pt);
        if (isGoal) { setBoardSimState('optimal'); setActiveVisualCta('idea'); }
        setClickedPointFeedback(describeClickedPointForBeginner(pt, displayedBoard, isGoal, effectiveBestMove, isEn));
    };

    return (
        <section data-testid="coach-diagnostic-box" aria-label={isEn ? 'Grandmaster diagnostic' : 'Diagnostic du Grand-Maître'} className="rounded-xl border border-indigo-800/60 bg-gradient-to-b from-indigo-950/40 to-slate-950/80 p-3 space-y-2.5">
            <header className="flex flex-wrap items-center gap-2 border-b border-indigo-900/50 pb-2">
                <span aria-hidden="true" className="text-sm">🧠</span>
                <h3 className="text-[11px] font-black uppercase tracking-wider text-indigo-300">{isEn ? 'Grandmaster diagnostic' : 'Diagnostic du Grand-Maître'}</h3>
                <div className="inline-flex rounded-lg border border-amber-500/40 bg-slate-900/90 p-0.5">
                    {(['fun', 'pro'] as const).map((lvl) => (
                        <button key={lvl} type="button" data-testid={`coach-level-${lvl}-btn`} aria-pressed={levelMode === lvl} onClick={() => handleLevelChange(lvl)} className={`rounded-md px-2 py-0.5 text-[10px] font-bold transition ${levelMode === lvl ? 'bg-[#f3c65f] text-slate-950' : 'text-slate-400 hover:text-white'}`}>
                            {lvl === 'fun' ? (isEn ? '⚡ Intuitive' : '⚡ Intuitif') : '🏆 Pro'}
                        </button>
                    ))}
                </div>
                <div role="tablist" aria-label={isEn ? 'Coaching mode' : 'Mode de coaching'} className="ml-auto flex items-center gap-1 rounded-lg bg-slate-900/90 p-0.5 border border-indigo-800/50">
                    {modeTabs.map((tab) => (
                        <button key={tab.id} type="button" role="tab" aria-selected={mode === tab.id} data-testid={tab.testId} onClick={() => setMode(tab.id)} className={`rounded-md px-2 py-0.5 text-[10px] font-bold transition ${mode === tab.id ? tab.activeCls : 'text-slate-400 hover:text-slate-200'}`}>
                            {tab.label}
                        </button>
                    ))}
                </div>
                {keyConcept && (onOpenKnowledgeConcept ? (
                    <button type="button" onClick={() => onOpenKnowledgeConcept(conceptId || keyConcept)} data-testid="coach-concept-badge-btn" title={isEn ? `Open theory guide: ${keyConcept}` : `Ouvrir la fiche théorique : ${keyConcept}`} className="flex items-center gap-1 rounded-full border border-indigo-500/70 bg-indigo-900/70 px-2 py-0.5 text-[11px] font-bold text-indigo-200 hover:bg-indigo-700/80 hover:text-white transition active:scale-95 cursor-pointer shadow-sm">
                        <span aria-hidden="true">📖</span><span>{keyConcept}</span>
                    </button>
                ) : (
                    <span className="rounded-full border border-indigo-700/60 bg-indigo-900/60 px-2 py-0.5 text-[11px] font-bold text-indigo-200">{keyConcept}</span>
                ))}
            </header>

            {socraticChallenge.shouldTrigger && <CoachSocraticQuizCard challenge={socraticChallenge} locale={locale} />}

            {mode === 'flash' && (equityLoss !== undefined || symbolicAudit) && (() => {
                const verdictInfo = formatEmotionalVerdict(effectiveEquityLoss, directShots, levelMode, isEn);
                return (
                    <div data-testid="coach-emotional-verdict" className={`flex items-center justify-between rounded-lg border px-2.5 py-1 text-[11px] font-extrabold ${verdictInfo.toneCls}`}>
                        <span>{verdictInfo.badge}</span>
                        {bestMoveNotation && playedMoveNotation && effectiveEquityLoss > 0.015 && <span className="font-mono text-[10px] opacity-90">{playedMoveNotation} → {bestMoveNotation}</span>}
                    </div>
                );
            })()}

            {mode === 'flash' && symbolicAudit && (
                <div data-testid="coach-symbolic-telemetry" className="flex flex-wrap items-center justify-between gap-1.5 rounded-lg border border-indigo-700/40 bg-slate-900/75 px-2.5 py-1.5 font-mono text-[10px]">
                    <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 font-black text-indigo-300 border border-indigo-400/40">{symbolicAudit.dominant_theme}</span>
                    {levelMode === 'fun' ? (
                        <>
                            <span className="text-rose-300 font-sans font-semibold">{symbolicAudit.direct_shots_conceded === 0 ? (isEn ? '🛡️ 0 direct shots left' : '🛡️ 0 tir direct laissé') : (isEn ? `⚠️ ${symbolicAudit.direct_shots_conceded} rolls/36 can hit you` : `⚠️ ${symbolicAudit.direct_shots_conceded} dés sur 36 vous frappent`)}</span>
                            <span className="text-amber-300 font-sans font-bold">{effectiveEquityLoss < 0.015 ? '✅ Optimal' : isEn ? `📉 ~${Math.min(45, Math.max(1, Math.round(effectiveEquityLoss * 85)))}% win chance lost` : `📉 ~${Math.min(45, Math.max(1, Math.round(effectiveEquityLoss * 85)))}% de victoire perdus`}</span>
                        </>
                    ) : (
                        <>
                            <span className="text-slate-300">Pips <strong className="text-white">{symbolicAudit.player_pip}</strong>/{symbolicAudit.opponent_pip}</span>
                            <span className="text-rose-300">{isEn ? 'Shots' : 'Tirs'} <strong>{symbolicAudit.direct_shots_conceded}/36</strong></span>
                            <span className="text-amber-300 font-bold">ΔEq -{Math.abs(symbolicAudit.blunder_delta_equity).toFixed(3)} ({-Math.round(Math.abs(symbolicAudit.blunder_delta_equity) * 1000)} mEMG)</span>
                        </>
                    )}
                </div>
            )}

            {mode === 'flash' && levelMode === 'fun' && (symbolicAudit || effectiveEquityLoss > 0.015) && (
                <div data-testid="coach-bilevel-bullets" className="rounded-xl border border-amber-500/35 bg-slate-900/80 p-3 space-y-2.5 text-[11px] text-slate-100 shadow-inner">
                    <div className="space-y-1">
                        <p>• <strong className="text-rose-300">{isEn ? 'What happened:' : 'Le piège :'}</strong> {biLevelMicroCopy.bulletDiagnostic}</p>
                        <p className="text-emerald-300 font-semibold">• <strong className="text-emerald-200">{isEn ? 'Better idea:' : 'La bonne idée :'}</strong> {biLevelMicroCopy.bulletAction}</p>
                        {biLevelMicroCopy.bulletHabitHook && <p className="text-amber-300 font-bold">• {biLevelMicroCopy.bulletHabitHook}</p>}
                    </div>

                    <div data-testid="coach-beginner-interactive-board" className="rounded-xl border border-[#d4af37]/40 bg-[#0d0805] p-2 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-1.5 text-[10px]">
                            <span className="font-bold text-[#f3c65f]">👆 {isEn ? `Tap point ${optimalTargets[0]} on the board to try the Master move!` : `Touche la case ${optimalTargets[0]} sur le plateau pour jouer le coup du Maître !`}</span>
                            <button type="button" data-testid="coach-board-sim-toggle-btn" onClick={() => setBoardSimState((s) => (s === 'before' ? 'optimal' : 'before'))} className="rounded-lg border border-emerald-400/50 bg-emerald-950/60 px-2 py-0.5 font-extrabold text-emerald-200 hover:bg-emerald-900/70 transition">
                                {boardSimState === 'optimal' ? (isEn ? '⏮ See before move' : '⏮ Revoir avant le coup') : (isEn ? '▶ Animate Master move on board' : '▶ Simuler le coup sur le plateau')}
                            </button>
                        </div>
                        <MiniBoardDiagram
                            board={displayedBoard} dice={dice ?? [3, 1]} turn="X"
                            playedMove={effectivePlayedMove} optimalMove={effectiveBestMove}
                            hideOptimalArrow={activeVisualCta === 'danger'} hidePlayedArrow={activeVisualCta === 'idea' || boardSimState === 'optimal'}
                            highlightedPoints={activeVisualCta === 'danger' ? dangerTargets : optimalTargets}
                            onPointClick={handleBeginnerPointClick} locale={isEn ? 'en' : 'fr'}
                        />
                        {clickedPointFeedback && (
                            <div data-testid="coach-board-point-feedback" className="rounded-lg border border-amber-400/50 bg-amber-950/50 px-2.5 py-1.5 text-[11px] font-semibold text-amber-100">{clickedPointFeedback}</div>
                        )}
                    </div>

                    <div data-testid="coach-bilevel-cta-row" className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <button type="button" data-testid="coach-cta-danger-btn" onClick={() => { setBoardSimState('before'); setActiveVisualCta((v) => (v === 'danger' ? null : 'danger')); }} className={`rounded-full border px-2.5 py-1 text-[10px] font-bold transition ${activeVisualCta === 'danger' ? 'border-rose-400 bg-rose-500/25 text-rose-100' : 'border-rose-500/40 bg-slate-950/70 text-rose-300 hover:bg-rose-950/50'}`}>{biLevelMicroCopy.ctaPills[0]}</button>
                        <button type="button" data-testid="coach-cta-idea-btn" onClick={() => { setBoardSimState('optimal'); setActiveVisualCta((v) => (v === 'idea' ? null : 'idea')); }} className={`rounded-full border px-2.5 py-1 text-[10px] font-bold transition ${activeVisualCta === 'idea' ? 'border-emerald-400 bg-emerald-500/25 text-emerald-100' : 'border-emerald-500/40 bg-slate-950/70 text-emerald-300 hover:bg-emerald-950/50'}`}>{biLevelMicroCopy.ctaPills[1]}</button>
                        <button type="button" data-testid="coach-cta-retry-btn" onClick={() => onRetryMove?.()} className="rounded-full border border-amber-500/40 bg-slate-950/70 px-2.5 py-1 text-[10px] font-bold text-amber-300 hover:bg-amber-950/50 transition">{biLevelMicroCopy.ctaPills[2]}</button>
                    </div>
                    {activeVisualCta === 'danger' && (
                        <div data-testid="coach-cta-danger-detail" className="rounded-lg border border-rose-500/40 bg-rose-950/40 p-2 text-[11px] leading-relaxed text-rose-100">
                            ⚠️ <strong>{isEn ? 'Danger on the board:' : 'Danger sur le plateau :'}</strong> {whyFailed || biLevelMicroCopy.dangerDetail}
                        </div>
                    )}
                    {activeVisualCta === 'idea' && (
                        <div data-testid="coach-cta-idea-detail" className="rounded-lg border border-emerald-500/40 bg-emerald-950/40 p-2 text-[11px] leading-relaxed text-emerald-100">
                            💡 <strong>{isEn ? 'Master move applied on board:' : 'Coup du Maître joué sur le plateau :'}</strong> {whyOptimal || biLevelMicroCopy.ideaDetail}
                        </div>
                    )}
                </div>
            )}

            {mode === 'flash' && levelMode === 'pro' && pedagogicalExplanation?.headline && (
                <p data-testid="coach-sweller-headline" className="text-xs font-extrabold tracking-wide text-amber-100">⚡ {pedagogicalExplanation.headline}</p>
            )}

            {mode === 'socratic' && (
                <div data-testid="coach-socratic-panel" className="space-y-2 rounded-lg border border-amber-500/30 bg-amber-950/20 p-2.5">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">{isEn ? `Socratic Training — Step ${socraticStep}/3` : `Entraînement Socratique — Étape ${socraticStep}/3`}</span>
                        <div className="flex gap-1">{[1, 2, 3].map((step) => (<button key={step} type="button" onClick={() => setSocraticStep(step)} className={`h-5 w-5 rounded-full text-[10px] font-black transition ${socraticStep >= step ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>{step}</button>))}</div>
                    </div>
                    <div className="space-y-1.5 text-[11px] leading-relaxed text-amber-100">
                        <p className="rounded bg-slate-900/70 p-2 border border-amber-500/20">{socraticHints[0]}</p>
                        {socraticStep >= 2 && <p className="rounded bg-slate-900/70 p-2 border border-amber-500/30">{socraticHints[1]}</p>}
                        {socraticStep >= 3 && <p className="rounded bg-emerald-950/50 p-2 border border-emerald-500/40 text-emerald-200 font-semibold">{socraticHints[2]}</p>}
                    </div>
                    {socraticStep < 3 && (
                        <button type="button" data-testid="coach-socratic-next-btn" onClick={() => setSocraticStep((prev) => Math.min(3, prev + 1))} className="w-full rounded-lg border border-amber-400/50 bg-amber-500/20 py-1 text-[11px] font-bold text-amber-200 hover:bg-amber-500/30 transition">{isEn ? 'Reveal next hint →' : "Dévoiler l'indice suivant →"}</button>
                    )}
                </div>
            )}

            {mode === 'zare' && (
                <div data-testid="coach-zare-panel" className="space-y-2 rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-2.5">
                    {symbolicAudit && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-center">
                            <div className="rounded bg-slate-900/80 p-1.5 border border-slate-800"><div className="text-[11px] uppercase text-slate-400">{isEn ? 'Pip Race' : 'Course Pips'}</div><div className="text-xs font-bold text-white">{symbolicAudit.player_pip} vs {symbolicAudit.opponent_pip}</div></div>
                            <div className="rounded bg-slate-900/80 p-1.5 border border-slate-800"><div className="text-[11px] uppercase text-slate-400">{isEn ? 'Direct Shots' : 'Tirs concédés'}</div><div className="text-xs font-bold text-rose-300">{symbolicAudit.direct_shots_conceded}/36</div></div>
                            <div className="rounded bg-slate-900/80 p-1.5 border border-slate-800"><div className="text-[11px] uppercase text-slate-400">{isEn ? 'Theme' : 'Plan IA / Jeu'}</div><div className="text-xs font-bold text-indigo-300">{symbolicAudit.dominant_theme}</div></div>
                            <div className="rounded bg-slate-900/80 p-1.5 border border-slate-800"><div className="text-[11px] uppercase text-slate-400">Magriel</div><div className="text-xs font-bold text-amber-300">{symbolicAudit.magriel_posture ?? 'SAFE'}</div></div>
                        </div>
                    )}
                    {zareSummary && <p className="text-[11px] leading-relaxed text-emerald-200">⚖️ <span className="font-bold">{isEn ? 'Douglas Zare Equation:' : 'Équation de Douglas Zare :'}</span> {zareSummary}</p>}
                </div>
            )}

            {(mode === 'flash' || (mode === 'socratic' && socraticStep >= 3)) && (
                <>
                    {tacticalSummary && <p data-testid="coach-tactical-summary" className="text-xs leading-relaxed text-slate-200">{tacticalSummary}</p>}
                    {summary && summary !== tacticalSummary && <p className="text-xs font-semibold leading-snug text-white">{summary}</p>}
                    {levelMode === 'pro' && triptych?.opponent_intention && (
                        <div className="flex items-start gap-1.5 rounded-lg border border-cyan-900/40 bg-cyan-950/25 p-2"><span aria-hidden="true" className="mt-0.5 shrink-0 text-[10px]">🤖</span><span className="text-[11px] leading-relaxed text-cyan-200"><strong className="text-cyan-100">{isEn ? 'AI Plan:' : "Plan de l'IA :"}</strong> {triptych.opponent_intention}</span></div>
                    )}
                    {(whyFailed || whyOptimal) && (
                        <div className="space-y-1.5">
                            {whyFailed && <div className="flex items-start gap-1.5 rounded-lg border border-rose-900/40 bg-rose-950/30 p-2"><span aria-hidden="true" className="mt-0.5 shrink-0 text-[10px] text-rose-400">❌</span><span className="text-[11px] leading-relaxed text-rose-200">{whyFailed}</span></div>}
                            {whyOptimal && <div className="flex items-start gap-1.5 rounded-lg border border-emerald-900/40 bg-emerald-950/30 p-2"><span aria-hidden="true" className="mt-0.5 shrink-0 text-[10px] text-emerald-400">✅</span><span className="text-[11px] leading-relaxed text-emerald-200">{whyOptimal}</span></div>}
                        </div>
                    )}
                    {levelMode === 'pro' && michyProverb && <div className="rounded-md border border-indigo-500/30 bg-indigo-950/30 px-2.5 py-1.5 text-[11px] italic text-indigo-200">📜 {michyProverb}</div>}
                    {explanation && (
                        <details open={levelMode === 'pro' || isStreaming} className="group rounded-lg border border-indigo-800/40 bg-slate-900/50 p-2">
                            <summary className="cursor-pointer select-none text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                                {levelMode === 'fun' ? (isEn ? '🔬 Show technical Grandmaster analysis (Pro)' : "🔬 Voir l'analyse technique complète (Termes Pro)") : (isEn ? '🔬 Grandmaster Technical Breakdown (3-ply)' : '🔬 Analyse Technique Grand-Maître (3-ply)')}
                            </summary>
                            <div className="mt-1.5 whitespace-pre-line text-[11px] leading-relaxed text-slate-300">{explanation}{isStreaming && <span className="ml-1 inline-block animate-pulse font-mono font-bold text-indigo-400">▋</span>}</div>
                        </details>
                    )}
                    {advice && <div className="rounded-md border border-amber-500/30 bg-amber-950/20 p-2 text-[11px] leading-relaxed text-amber-200">💡 <span className="font-semibold text-amber-100">{isEn ? 'Advice' : 'Conseil'} :</span> {advice}</div>}
                </>
            )}
        </section>
    );
};

export const CoachDiagnosticBox = React.memo(CoachDiagnosticBoxComponent);
export default CoachDiagnosticBox;
