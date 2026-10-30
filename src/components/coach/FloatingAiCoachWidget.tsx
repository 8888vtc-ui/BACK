'use client';

/**
 * @file src/components/coach/FloatingAiCoachWidget.tsx
 * @description Coach IA Flottant "Tesla 3-Secondes" & Caméléon (L0 Débutant / L1 Club / L2 Pro).
 * Applique l'Algorithme d'Elon Musk :
 * - Zéro jargon EMG brut par défaut (traduit en % de chances de gain ΔMWC% et en lancers sur 36)
 * - Architecture cognitive en 3 lignes (< 3 secondes de lecture : Verdict, Cause, Plan 36 dés)
 * - Sélecteur Caméléon 1-clic (🌱 Simple | 🏆 Club | 🔬 Pro) + bouton [↺ Rejouer].
 * Strictement < 260 lignes, 0 `any`, zéro micro-texte < 11px.
 */

import React, { useState } from 'react';
import { isCubeDecisionNotation, type CoachState, type LastMoveFeedback } from '../../hooks/coach/coachTypes';

export type ChameleonCoachLayer = 'L0' | 'L1' | 'L2';

export interface FloatingAiCoachWidgetProps {
    readonly coach?: CoachState | null;
    readonly isAnalyzing?: boolean;
    readonly lastMoveFeedback?: LastMoveFeedback | null;
    readonly onTriggerCoach?: () => void;
    readonly onReplayMove?: () => void;
    readonly onOpenFullCoach?: () => void;
    readonly isInGame?: boolean;
}

interface ChatMessage {
    readonly id: string;
    readonly sender: 'ai' | 'user';
    readonly text: string;
}

const QUICK_PROMPTS: ReadonlyArray<{ id: string; label: string; prompt: string }> = [
    {
        id: 'best-move',
        label: '🎯 Meilleur coup ?',
        prompt: 'Quel est le meilleur coup dans cette position et pourquoi ?',
    },
    {
        id: 'cube-plan',
        label: '🎲 Doubler ?',
        prompt: 'Dois-je proposer le videau selon la règle de Woolsey ?',
    },
    {
        id: 'strategy',
        label: '📐 Plan 36 dés ?',
        prompt: 'Quel est mon plan sur les 36 prochains lancers (Course vs Barricade) ?',
    },
];

function formatMwcPercent(equityLoss: number): string {
    const pct = Math.min(49.9, Math.abs(equityLoss) * 28.5);
    return `-${pct.toFixed(1)} % de chances de gain`;
}

function buildTeslaThreeSecondLines(
    coach: CoachState | null | undefined,
    lastMoveFeedback: LastMoveFeedback | null | undefined,
    layer: ChameleonCoachLayer,
): { line1: string; line2: string; line3: string; isOptimal: boolean } {
    const loss = Math.abs(coach?.equityLoss ?? lastMoveFeedback?.equityLoss ?? 0);
    const verdict = coach?.verdict ?? lastMoveFeedback?.verdict ?? 'optimal';
    const isOptimal = verdict === 'optimal' || loss <= 0.005;
    const bestMove = coach?.optimalMove ?? lastMoveFeedback?.optimalMove ?? '24/20 13/8';
    const playedMove = coach?.playedMove ?? lastMoveFeedback?.playedMove ?? bestMove;
    const isCube =
        lastMoveFeedback?.decisionType === 'cube' ||
        isCubeDecisionNotation(playedMove) ||
        isCubeDecisionNotation(bestMove);

    if (isOptimal) {
        return {
            line1: isCube ? '✅ Décision de Videau Optimale' : '✅ Coup Optimal — Vous jouez comme un Grand-Maître',
            line2:
                coach?.summary ??
                (layer === 'L0'
                    ? 'Votre mur est solide et aucun pion isolé n’est laissé en danger direct.'
                    : `Exécution parfaite (${bestMove}) : maximale sur les 36 lancers adverses.`),
            line3:
                coach?.whyOptimal ??
                (layer === 'L2'
                    ? `Perte 0.000 EMG · ΔMWC 0.0 % · Priorité : maintenir les spares sur les points 5 et 7.`
                    : 'Plan suivant : verrouillez le point 5 (Point d’Or) dès le prochain jet.'),
            isOptimal: true,
        };
    }

    if (isCube) {
        return {
            line1:
                layer === 'L0'
                    ? '⚠️ Attention : mauvais timing sur le Videau (×2)'
                    : layer === 'L1'
                      ? `🎲 Erreur de Videau (${formatMwcPercent(loss)})`
                      : `🔬 Videau · ΔMWC ${formatMwcPercent(loss)} · ΔEMG -${loss.toFixed(3)}`,
            line2:
                coach?.whyFailed ??
                lastMoveFeedback?.errorAdvice ??
                `Décision jouée : ${playedMove} (hors fenêtre de marché Janowski).`,
            line3:
                coach?.whyOptimal ??
                `Action recommandée : ${bestMove} (vérifiez le Take Point à 21,5 %–25 %).`,
            isOptimal: false,
        };
    }

    if (layer === 'L0') {
        return {
            line1: `⚠️ Attention : ce choix (${playedMove}) perd du terrain`,
            line2:
                coach?.whyFailed ??
                lastMoveFeedback?.errorAdvice ??
                `Jouer ${playedMove} laisse une ouverture directe à votre adversaire.`,
            line3:
                coach?.whyOptimal ??
                `Idée gagnante : ${bestMove} consolide vos portes et prépare la suite.`,
            isOptimal: false,
        };
    }

    if (layer === 'L1') {
        return {
            line1: `🎯 ${verdict === 'blunder' ? 'Erreur coûteuse' : 'Imprécision'} (${formatMwcPercent(loss)})`,
            line2:
                coach?.whyFailed ??
                lastMoveFeedback?.errorAdvice ??
                `Avec ${playedMove}, vous cédez l’initiative tactique.`,
            line3:
                coach?.whyOptimal ??
                `Le coup recommandé ${bestMove} maximise vos bons dés au tour suivant.`,
            isOptimal: false,
        };
    }

    return {
        line1: `🔬 ΔMWC ${formatMwcPercent(loss)} · ΔEMG -${loss.toFixed(3)}`,
        line2: coach?.whyFailed ?? `Joué : ${playedMove} — Duplication sous-optimale face aux 21 paires adverses.`,
        line3: coach?.whyOptimal ?? `Optimal 3-Ply : ${bestMove} — Maximise la couverture C36 et réduit les tirs H36.`,
        isOptimal: false,
    };
}

function buildContextualAnswer(
    prompt: string,
    coach: CoachState | null | undefined,
    lastMoveFeedback: LastMoveFeedback | null | undefined,
    layer: ChameleonCoachLayer,
): string {
    const tesla = buildTeslaThreeSecondLines(coach, lastMoveFeedback, layer);
    const lower = prompt.toLowerCase();
    if (lower.includes('videau') || lower.includes('doubler') || lower.includes('woolsey')) {
        return layer === 'L0'
            ? 'Loi de Woolsey : si tu as un net avantage et que tu hésites, double ! L’adversaire peut accepter dès 1 chance sur 4 de gagner.'
            : 'Seuil de Videau (Janowski / Kazaross-XG2) : doublez dès 66 % d’équité (ou 50 % avec menaces de gammon). Le Take Point adverse est à 21,5 % en Money Game.';
    }
    if (lower.includes('plan') || lower.includes('36')) {
        return layer === 'L0'
            ? 'Règle simple : en avance à la course, cours sans prendre de risque. En retard, garde deux pions en embuscade chez l’adversaire.'
            : 'Critères de Magriel sur 36 lancers : 1) Descendez des constructeurs depuis le point 13 (Unstack Midpoint). 2) Visez le Point 5 (Golden Point) et le Point 7 (Bar Point).';
    }
    return `${tesla.line1} — ${tesla.line2} ${tesla.line3}`;
}

export const FloatingAiCoachWidget: React.FC<FloatingAiCoachWidgetProps> = ({
    coach = null,
    isAnalyzing = false,
    lastMoveFeedback = null,
    onTriggerCoach,
    onReplayMove,
    onOpenFullCoach,
    isInGame = false,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [layer, setLayer] = useState<ChameleonCoachLayer>('L1');
    const [inputValue, setInputValue] = useState('');
    const [messages, setMessages] = useState<ReadonlyArray<ChatMessage>>([]);

    const tesla = buildTeslaThreeSecondLines(coach, lastMoveFeedback, layer);

    const handleAskQuestion = (questionText: string) => {
        const trimmed = questionText.trim();
        if (!trimmed) return;
        onTriggerCoach?.();
        const answer = buildContextualAnswer(trimmed, coach, lastMoveFeedback, layer);
        setMessages((prev) => [
            ...prev.slice(-4),
            { id: `u-${Date.now()}`, sender: 'user', text: trimmed },
            { id: `a-${Date.now() + 1}`, sender: 'ai', text: answer },
        ]);
        setInputValue('');
    };

    return (
        <div
            data-testid="floating-ai-coach-container"
            className={`fixed right-4 z-50 flex flex-col items-end ${
                isInGame
                    ? `${isOpen ? ' flex' : ' hidden xl:flex [@media(max-height:600px)]:!hidden'} bottom-20 md:bottom-4`
                    : 'bottom-4'
            }`}
        >
            {isOpen && (
                <section
                    role="dialog"
                    aria-label="Fenêtre de discussion Coach IA"
                    data-testid="floating-ai-coach-popover"
                    className="mb-3 w-80 sm:w-96 rounded-2xl border border-emerald-400/35 bg-[#0d1222]/98 text-slate-100 shadow-[0_24px_60px_rgba(0,0,0,0.92)] backdrop-blur-xl overflow-hidden flex flex-col"
                >
                    {/* En-tête + Sélecteur Caméléon 3 Couches (Elon Musk UX) */}
                    <header className="flex flex-col gap-2 border-b border-white/10 bg-[#141b33] px-3.5 py-2.5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 text-[11px] font-black text-slate-950 shadow">
                                    AI
                                </span>
                                <div>
                                    <h3 className="text-xs font-black uppercase tracking-wider text-white">
                                        Coach Tesla 3-Secondes
                                    </h3>
                                    <p className="text-[11px] font-medium text-emerald-300">
                                        {isAnalyzing ? 'Calcul sur 36 lancers…' : 'Zéro jargon · Lookahead 36 dés'}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                data-testid="floating-ai-coach-close"
                                aria-label="Fermer le chat Coach IA"
                                onClick={() => setIsOpen(false)}
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Sélecteur Caméléon L0 / L1 / L2 */}
                        <div className="grid grid-cols-3 gap-1 rounded-xl bg-black/40 p-1 border border-white/5">
                            {(
                                [
                                    { id: 'L0', label: '🌱 Simple' },
                                    { id: 'L1', label: '🏆 Club' },
                                    { id: 'L2', label: '🔬 Pro' },
                                ] as const
                            ).map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    data-testid={`coach-layer-${item.id}`}
                                    onClick={() => setLayer(item.id)}
                                    className={`rounded-lg py-1 text-[11px] font-extrabold transition ${
                                        layer === item.id
                                            ? 'bg-emerald-400 text-slate-950 shadow'
                                            : 'text-slate-300 hover:text-white'
                                    }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </header>

                    {/* Bloc Tesla 3-Secondes (Toujours lisible en < 3s) */}
                    <div className="border-b border-white/10 bg-[#11172b] px-3.5 py-3 space-y-1.5">
                        <div className="text-xs font-black text-white">{tesla.line1}</div>
                        <p className="text-[11px] leading-snug text-slate-300">{tesla.line2}</p>
                        <p className="text-[11px] leading-snug font-semibold text-emerald-300">{tesla.line3}</p>
                        <div className="flex items-center gap-2 pt-1">
                            {onReplayMove && !tesla.isOptimal && (
                                <button
                                    type="button"
                                    onClick={onReplayMove}
                                    className="rounded-lg bg-amber-400 px-2.5 py-1 text-[11px] font-black text-slate-950 hover:bg-amber-300 transition"
                                >
                                    ↺ Rejouer ce coup
                                </button>
                            )}
                            {onOpenFullCoach && (
                                <button
                                    type="button"
                                    onClick={onOpenFullCoach}
                                    className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-200 hover:bg-white/10 transition"
                                >
                                    📊 Voir les 36 dés
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Réponses aux questions */}
                    {messages.length > 0 && (
                        <div className="max-h-40 overflow-y-auto px-3.5 py-2.5 space-y-2">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[88%] rounded-2xl px-3 py-1.5 text-[11px] leading-relaxed ${
                                            msg.sender === 'user'
                                                ? 'bg-emerald-500 text-slate-950 font-bold rounded-br-sm'
                                                : 'bg-[#1a223d] border border-white/10 text-slate-100 rounded-bl-sm'
                                        }`}
                                    >
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Questions 1-clic */}
                    <div className="flex flex-wrap items-center gap-1.5 bg-[#0d1222] px-3 py-2">
                        {QUICK_PROMPTS.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                data-testid={`coach-quick-prompt-${item.id}`}
                                onClick={() => handleAskQuestion(item.prompt)}
                                className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-200 hover:bg-emerald-500/25 hover:text-white transition"
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>

                    {/* Zone de saisie */}
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleAskQuestion(inputValue);
                        }}
                        className="flex items-center gap-2 border-t border-white/10 bg-[#090d18] px-3 py-2"
                    >
                        <input
                            type="text"
                            data-testid="floating-ai-coach-input"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Question au Coach (ex: pourquoi 13/8 ?)…"
                            className="flex-1 rounded-xl border border-white/10 bg-[#141b33] px-3 py-1.5 text-xs text-white placeholder-slate-400 focus:border-emerald-400 focus:outline-none"
                        />
                        <button
                            type="submit"
                            data-testid="floating-ai-coach-send"
                            aria-label="Envoyer au Coach IA"
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-400 text-xs font-black text-slate-950 shadow hover:bg-emerald-300 transition"
                        >
                            ➤
                        </button>
                    </form>
                </section>
            )}

            {/* Bouton Flottant Signature (Émeraude & Or Monte-Carlo + Badge AI) */}
            <button
                type="button"
                data-testid="floating-ai-coach-btn"
                aria-label="Demander au Coach IA"
                aria-expanded={isOpen}
                onClick={() => setIsOpen((prev) => !prev)}
                className="group relative flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-300/60 bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-[0_10px_28px_rgba(16,185,129,0.45)] transition-transform duration-150 hover:scale-105 active:scale-95"
            >
                <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 9h-2V9h2v2zm4 0h-2V9h2v2zm-8 0H7V9h2v2z" />
                </svg>
                <span className="absolute -top-1.5 -right-1.5 rounded-md border border-amber-200/80 bg-amber-400 px-1 py-0.2 font-mono text-[11px] font-black uppercase leading-tight text-slate-950 shadow">
                    AI
                </span>
            </button>
        </div>
    );
};

export default FloatingAiCoachWidget;
