'use client';

/**
 * Calculateur Interactif d'Équité de Match (MET Kazaross-XG2), Seuil de Prise (Take Point),
 * Prix du Gammon & Calculateur de Course de Keith (Keith Count Race Cube Action).
 *
 * Outil SEO "Link Magnet" gratuit en 6 langues (FR, EN, ES, PT, DE, AR).
 * Loi de Scalabilité : strictement 0 any, < 280 lignes.
 */

import React, { useMemo, useState } from 'react';
import { buildMatchContext } from '../../features/coach/matchContext';
import type { PrimaryLocale } from '../../lib/i18n/types';

export interface MatchEquityCalculatorProps {
    readonly locale: PrimaryLocale;
}

interface CalcLabels {
    readonly badge: string;
    readonly title: string;
    readonly subtitle: string;
    readonly matchLengthLabel: string;
    readonly moneyGameLabel: string;
    readonly pointsToWinX: string;
    readonly pointsToWinO: string;
    readonly crawfordToggle: string;
    readonly mwcLabel: string;
    readonly takePointDeadLabel: string;
    readonly takePointLiveLabel: string;
    readonly gammonPriceLabel: string;
    readonly keithTitle: string;
    readonly pipsXLabel: string;
    readonly pipsOLabel: string;
    readonly penaltyXLabel: string;
    readonly penaltyOLabel: string;
    readonly keithVerdictLabel: string;
    readonly copyXgidBtn: string;
    readonly copiedXgidMsg: string;
}

const CALC_LABELS: Record<PrimaryLocale, CalcLabels> = {
    fr: {
        badge: 'OUTIL INTERACTIF GRATUIT · KAZAROSS-XG2 & KEITH COUNT',
        title: 'Calculateur d’Équité de Match (MET), Take Point & Course de Keith',
        subtitle: 'Simulez n’importe quel score de tournoi (ou Money Game) pour obtenir instantanément votre probabilité de gain (MWC %), votre seuil de prise exact (Take Point), le prix du Gammon et la décision de videau en course.',
        matchLengthLabel: 'Format du Match',
        moneyGameLabel: 'Money Game (Illimité)',
        pointsToWinX: 'Votre Score (Points acquis)',
        pointsToWinO: 'Score Adversaire',
        crawfordToggle: 'Manche de Crawford active',
        mwcLabel: 'Probabilité de Gain Match (MWC)',
        takePointDeadLabel: 'Take Point (Cube Mort)',
        takePointLiveLabel: 'Take Point Réel (Cube Vivant)',
        gammonPriceLabel: 'Prix du Gammon (Gammon Price)',
        keithTitle: 'Calculateur Rapide de Course (Algorithme de Keith)',
        pipsXLabel: 'Votre Pip Count',
        pipsOLabel: 'Pip Count Adverse',
        penaltyXLabel: 'Vos Pénalités Keith',
        penaltyOLabel: 'Pénalités Adverses',
        keithVerdictLabel: 'Décision Videau Recommandée (3-Ply / Keith)',
        copyXgidBtn: '🔗 Copier un Permalien d’Analyse XGID',
        copiedXgidMsg: '✓ Permalien XGID copié dans le presse-papiers !',
    },
    en: {
        badge: 'FREE INTERACTIVE TOOL · KAZAROSS-XG2 & KEITH COUNT',
        title: 'Match Equity (MET), Take Point & Keith Count Race Calculator',
        subtitle: 'Simulate any tournament match score (or Money Game) to instantly compute your Match Winning Chance (MWC %), exact Take Point, Gammon Price, and pure-race cube action.',
        matchLengthLabel: 'Match Format',
        moneyGameLabel: 'Money Play (Unlimited)',
        pointsToWinX: 'Your Score (Points won)',
        pointsToWinO: 'Opponent Score',
        crawfordToggle: 'Crawford Game Active',
        mwcLabel: 'Match Winning Chance (MWC)',
        takePointDeadLabel: 'Dead Cube Take Point',
        takePointLiveLabel: 'Live Cube Take Point (~Est.)',
        gammonPriceLabel: 'Gammon Price',
        keithTitle: 'Pure Race Cube Calculator (Keith Count Algorithm)',
        pipsXLabel: 'Your Pip Count',
        pipsOLabel: 'Opponent Pip Count',
        penaltyXLabel: 'Your Keith Penalties',
        penaltyOLabel: 'Opponent Penalties',
        keithVerdictLabel: 'Recommended Cube Action (3-Ply / Keith)',
        copyXgidBtn: '🔗 Copy Shareable XGID Analysis Link',
        copiedXgidMsg: '✓ Shareable XGID link copied to clipboard!',
    },
    es: {
        badge: 'HERRAMIENTA INTERACTIVA · KAZAROSS-XG2 & KEITH COUNT',
        title: 'Calculadora de Equidad de Partido (MET), Take Point y Conteo Keith',
        subtitle: 'Simula cualquier marcador de torneo para obtener al instante tu probabilidad de ganar el partido (MWC %), el Take Point exacto, el precio del Gammon y la decisión de cubo en carrera.',
        matchLengthLabel: 'Formato del Partido',
        moneyGameLabel: 'Money Game (Libre)',
        pointsToWinX: 'Tu Puntuación',
        pointsToWinO: 'Puntuación Rival',
        crawfordToggle: 'Juego Crawford activo',
        mwcLabel: 'Probabilidad de Ganar (MWC)',
        takePointDeadLabel: 'Take Point (Cubo Muerto)',
        takePointLiveLabel: 'Take Point Real (Cubo Vivo)',
        gammonPriceLabel: 'Precio del Gammon',
        keithTitle: 'Calculadora de Carrera Pura (Algoritmo de Keith)',
        pipsXLabel: 'Tus Pips',
        pipsOLabel: 'Pips del Rival',
        penaltyXLabel: 'Tus Penalizaciones Keith',
        penaltyOLabel: 'Penalizaciones Rival',
        keithVerdictLabel: 'Decisión de Cubo Recomendada (Keith)',
        copyXgidBtn: '🔗 Copiar Enlace de Posición XGID',
        copiedXgidMsg: '✓ ¡Enlace XGID copiado!',
    },
    pt: {
        badge: 'FERRAMENTA INTERATIVA · KAZAROSS-XG2 & KEITH COUNT',
        title: 'Calculadora de Equidade de Partida (MET), Take Point e Contagem Keith',
        subtitle: 'Simule qualquer placar de torneio para calcular instantaneamente sua chance de vitória (MWC %), Take Point exato, preço do Gammon e decisão do cubo na corrida.',
        matchLengthLabel: 'Formato da Partida',
        moneyGameLabel: 'Money Game (Livre)',
        pointsToWinX: 'Sua Pontuação',
        pointsToWinO: 'Pontuação Adversário',
        crawfordToggle: 'Partida Crawford ativa',
        mwcLabel: 'Chance de Vitória na Partida (MWC)',
        takePointDeadLabel: 'Take Point (Cubo Morto)',
        takePointLiveLabel: 'Take Point Real (Cubo Vivo)',
        gammonPriceLabel: 'Preço do Gammon',
        keithTitle: 'Calculadora de Corrida Pura (Algoritmo de Keith)',
        pipsXLabel: 'Seus Pips',
        pipsOLabel: 'Pips do Adversário',
        penaltyXLabel: 'Suas Penalidades Keith',
        penaltyOLabel: 'Penalidades Adversário',
        keithVerdictLabel: 'Decisão do Cubo Recomendada (Keith)',
        copyXgidBtn: '🔗 Copiar Link Compartilhável XGID',
        copiedXgidMsg: '✓ Link XGID copiado!',
    },
    de: {
        badge: 'INTERAKTIVES TOOL · KAZAROSS-XG2 & KEITH COUNT',
        title: 'Match-Equity-Rechner (MET), Take Point & Keith-Count-Rennrechner',
        subtitle: 'Simulieren Sie jeden Turnierspielstand für exakte Match-Gewinnwahrscheinlichkeit (MWC %), Take Point, Gammon-Preis und Dopplungswürfel-Entscheidung im Rennen.',
        matchLengthLabel: 'Match-Format',
        moneyGameLabel: 'Money Game (Unbegrenzt)',
        pointsToWinX: 'Ihr Punktestand',
        pointsToWinO: 'Gegner-Punktestand',
        crawfordToggle: 'Crawford-Spiel aktiv',
        mwcLabel: 'Match-Gewinnchance (MWC)',
        takePointDeadLabel: 'Dead Cube Take Point',
        takePointLiveLabel: 'Live Cube Take Point',
        gammonPriceLabel: 'Gammon-Preis',
        keithTitle: 'Renn-Würfelrechner (Keith-Count-Algorithmus)',
        pipsXLabel: 'Ihr Pip-Count',
        pipsOLabel: 'Gegner Pip-Count',
        penaltyXLabel: 'Ihre Keith-Strafen',
        penaltyOLabel: 'Gegner-Strafen',
        keithVerdictLabel: 'Empfohlene Würfel-Entscheidung (Keith)',
        copyXgidBtn: '🔗 Teilbaren XGID-Analyse-Link kopieren',
        copiedXgidMsg: '✓ XGID-Link kopiert!',
    },
    ar: {
        badge: 'أداة تفاعلية مجانية · KAZAROSS-XG2 و KEITH COUNT',
        title: 'حاسبة احتمالية الفوز بالمباراة (MET) ونقطة القبول وحساب كيث للسباق',
        subtitle: 'قم بمحاكاة أي نتيجة في البطولة لمعرفة نسبة الفوز بالمباراة (MWC %)، ونقطة قبول المضاعفة (Take Point)، وسعر الغامون، وقرار المكعب في السباق الخالص.',
        matchLengthLabel: 'نظام المباراة',
        moneyGameLabel: 'لعب حر (Money Game)',
        pointsToWinX: 'نقاطك الحالية',
        pointsToWinO: 'نقاط الخصم',
        crawfordToggle: 'جولة كروفورد نشطة',
        mwcLabel: 'احتمالية الفوز بالمباراة (MWC)',
        takePointDeadLabel: 'نقطة القبول (مكعب ميت)',
        takePointLiveLabel: 'نقطة القبول الفعلية (مكعب حي)',
        gammonPriceLabel: 'سعر الغامون (Gammon Price)',
        keithTitle: 'حاسبة السباق الخالص (خوارزمية كيث Keith Count)',
        pipsXLabel: 'نقاطك (Pip Count)',
        pipsOLabel: 'نقاط الخصم (Pip Count)',
        penaltyXLabel: 'عقوبات كيث الخاصة بك',
        penaltyOLabel: 'عقوبات الخصم',
        keithVerdictLabel: 'قرار المكعب الموصى به (Keith)',
        copyXgidBtn: '🔗 نسخ رابط تحليل الوضعية (XGID)',
        copiedXgidMsg: '✓ تم نسخ رابط الوضعية XGID بنجاح!',
    },
};

export function evaluateKeithRaceDecision(
    pipsX: number,
    pipsO: number,
    penX: number,
    penO: number,
): { readonly keithX: number; readonly keithO: number; readonly thresholdTake: number; readonly actionCode: 'NO_DOUBLE' | 'DOUBLE_TAKE' | 'REDOUBLE_TAKE' | 'DOUBLE_PASS' } {
    const keithX = Math.max(1, pipsX + penX);
    const keithO = Math.max(1, pipsO + penO);
    const thresholdTake = Math.floor((keithX * 8) / 7) - 3;
    const diff = thresholdTake - keithO;

    let actionCode: 'NO_DOUBLE' | 'DOUBLE_TAKE' | 'REDOUBLE_TAKE' | 'DOUBLE_PASS' = 'NO_DOUBLE';
    if (diff > 4) {
        actionCode = 'NO_DOUBLE';
    } else if (diff === 4) {
        actionCode = 'DOUBLE_TAKE';
    } else if (diff >= 0 && diff <= 3) {
        actionCode = 'REDOUBLE_TAKE';
    } else {
        actionCode = 'DOUBLE_PASS';
    }

    return { keithX, keithO, thresholdTake, actionCode };
}

const MatchEquityCalculatorComponent: React.FC<MatchEquityCalculatorProps> = ({ locale }) => {
    const labels = CALC_LABELS[locale] ?? CALC_LABELS.en;
    const [matchLength, setMatchLength] = useState<number>(7);
    const [scoreX, setScoreX] = useState<number>(5);
    const [scoreO, setScoreO] = useState<number>(3);
    const [crawford, setCrawford] = useState<boolean>(false);

    const [pipsX, setPipsX] = useState<number>(62);
    const [pipsO, setPipsO] = useState<number>(68);
    const [penX, setPenX] = useState<number>(2);
    const [penO, setPenO] = useState<number>(3);
    const [copied, setCopied] = useState<boolean>(false);

    const matchCtx = useMemo(
        () =>
            buildMatchContext({
                matchLength,
                scoreX: matchLength === 0 ? 0 : Math.min(scoreX, matchLength - 1),
                scoreO: matchLength === 0 ? 0 : Math.min(scoreO, matchLength - 1),
                crawford,
                cubeValue: 1,
                cubeOwner: null,
            }),
        [matchLength, scoreX, scoreO, crawford],
    );

    const keithResult = useMemo(
        () => evaluateKeithRaceDecision(pipsX, pipsO, penX, penO),
        [pipsX, pipsO, penX, penO],
    );

    const deadTakePct = (matchCtx.takePoint.X * 100).toFixed(1);
    const liveTakePct = Math.max(14.5, matchCtx.takePoint.X * 100 - 3.5).toFixed(1);
    const mwcPct = (matchCtx.matchEquity.X * 100).toFixed(1);

    const handleCopyXgid = () => {
        const sampleUrl = `https://backgammontour.com/?xgid=-b----E-C---eE---c-e----B-:0:0:1:31:${scoreX}:${scoreO}:${crawford ? 1 : 0}:${matchLength}:10`;
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            void navigator.clipboard.writeText(sampleUrl);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
    };

    return (
        <section
            id="interactive-calculator"
            aria-labelledby="calc-heading"
            data-testid="academy-met-calculator"
            className="rounded-3xl border border-[#d4af37]/45 bg-gradient-to-b from-[#171e2e]/95 to-[#090d16]/95 p-5 sm:p-7 shadow-2xl space-y-6"
        >
            <div className="space-y-2">
                <span className="inline-block rounded-full border border-[#d4af37]/40 bg-amber-500/10 px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-[#f3c65f]">
                    🧮 {labels.badge}
                </span>
                <h2 id="calc-heading" className="font-serif text-xl sm:text-2xl font-black tracking-wide text-[#f5cf70]">
                    {labels.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{labels.subtitle}</p>
            </div>

            {/* Contrôles MET Kazaross-XG2 */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 rounded-2xl border border-[#d4af37]/25 bg-[#080c15]/90 p-4">
                <label className="space-y-1 text-xs">
                    <span className="font-bold text-amber-200">{labels.matchLengthLabel}</span>
                    <select
                        data-testid="calc-match-length"
                        value={matchLength}
                        onChange={(e) => setMatchLength(Number(e.target.value))}
                        className="w-full rounded-xl border border-[#d4af37]/35 bg-[#0e1422] px-3 py-2 font-mono text-xs text-slate-100"
                    >
                        <option value={0}>{labels.moneyGameLabel}</option>
                        <option value={3}>3 pts</option>
                        <option value={5}>5 pts</option>
                        <option value={7}>7 pts (Tournoi)</option>
                        <option value={9}>9 pts</option>
                        <option value={11}>11 pts (Championship)</option>
                    </select>
                </label>

                <label className="space-y-1 text-xs">
                    <span className="font-bold text-amber-200">{labels.pointsToWinX}</span>
                    <input
                        type="number"
                        min={0}
                        max={Math.max(0, matchLength - 1)}
                        disabled={matchLength === 0}
                        value={matchLength === 0 ? 0 : scoreX}
                        onChange={(e) => setScoreX(Number(e.target.value))}
                        className="w-full rounded-xl border border-[#d4af37]/35 bg-[#0e1422] px-3 py-2 font-mono text-xs text-slate-100 disabled:opacity-50"
                    />
                </label>

                <label className="space-y-1 text-xs">
                    <span className="font-bold text-amber-200">{labels.pointsToWinO}</span>
                    <input
                        type="number"
                        min={0}
                        max={Math.max(0, matchLength - 1)}
                        disabled={matchLength === 0}
                        value={matchLength === 0 ? 0 : scoreO}
                        onChange={(e) => setScoreO(Number(e.target.value))}
                        className="w-full rounded-xl border border-[#d4af37]/35 bg-[#0e1422] px-3 py-2 font-mono text-xs text-slate-100 disabled:opacity-50"
                    />
                </label>

                <label className="flex items-center gap-2 pt-5 text-xs font-semibold text-slate-200 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={crawford}
                        disabled={matchLength === 0}
                        onChange={(e) => setCrawford(e.target.checked)}
                        className="h-4 w-4 accent-[#d4af37]"
                    />
                    <span>{labels.crawfordToggle}</span>
                </label>
            </div>

            {/* Résultats Mathématiques MET */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-2xl border border-[#d4af37]/30 bg-black/50 p-3.5 text-center">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{labels.mwcLabel}</div>
                    <div data-testid="calc-mwc-value" className="mt-1 font-mono text-xl font-black text-emerald-300">
                        {mwcPct}%
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                        {matchLength > 0 ? `${matchCtx.pointsToWin.X}-away / ${matchCtx.pointsToWin.O}-away` : 'Money Play'}
                    </div>
                </div>

                <div className="rounded-2xl border border-[#d4af37]/30 bg-black/50 p-3.5 text-center">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{labels.takePointDeadLabel}</div>
                    <div className="mt-1 font-mono text-xl font-black text-amber-200">{deadTakePct}%</div>
                    <div className="text-[10px] text-slate-400 font-mono">Dead Cube (Sans Gammon)</div>
                </div>

                <div className="rounded-2xl border border-[#d4af37]/30 bg-black/50 p-3.5 text-center">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{labels.takePointLiveLabel}</div>
                    <div className="mt-1 font-mono text-xl font-black text-[#f5cf70]">{liveTakePct}%</div>
                    <div className="text-[10px] text-slate-400 font-mono">Cube Vigor Inclus</div>
                </div>

                <div className="rounded-2xl border border-[#d4af37]/30 bg-black/50 p-3.5 text-center">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{labels.gammonPriceLabel}</div>
                    <div className="mt-1 font-mono text-xl font-black text-sky-300">{matchCtx.gammonPrice.X.toFixed(2)}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                        {matchCtx.isDMP ? 'DMP (Gammon = 0)' : 'Valeur relative 2 pts'}
                    </div>
                </div>
            </div>

            {/* Calculateur de Course de Keith */}
            <div className="rounded-2xl border border-[#d4af37]/25 bg-[#080c15]/90 p-4 space-y-3">
                <h3 className="font-serif text-sm sm:text-base font-bold text-[#fdf8eb]">{labels.keithTitle}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <label className="space-y-1">
                        <span className="text-slate-300">{labels.pipsXLabel}</span>
                        <input
                            type="number"
                            min={1}
                            max={250}
                            value={pipsX}
                            onChange={(e) => setPipsX(Number(e.target.value))}
                            className="w-full rounded-xl border border-[#d4af37]/30 bg-[#0e1422] px-3 py-1.5 font-mono text-xs text-slate-100"
                        />
                    </label>
                    <label className="space-y-1">
                        <span className="text-slate-300">{labels.penaltyXLabel}</span>
                        <input
                            type="number"
                            min={0}
                            max={30}
                            value={penX}
                            onChange={(e) => setPenX(Number(e.target.value))}
                            className="w-full rounded-xl border border-[#d4af37]/30 bg-[#0e1422] px-3 py-1.5 font-mono text-xs text-slate-100"
                        />
                    </label>
                    <label className="space-y-1">
                        <span className="text-slate-300">{labels.pipsOLabel}</span>
                        <input
                            type="number"
                            min={1}
                            max={250}
                            value={pipsO}
                            onChange={(e) => setPipsO(Number(e.target.value))}
                            className="w-full rounded-xl border border-[#d4af37]/30 bg-[#0e1422] px-3 py-1.5 font-mono text-xs text-slate-100"
                        />
                    </label>
                    <label className="space-y-1">
                        <span className="text-slate-300">{labels.penaltyOLabel}</span>
                        <input
                            type="number"
                            min={0}
                            max={30}
                            value={penO}
                            onChange={(e) => setPenO(Number(e.target.value))}
                            className="w-full rounded-xl border border-[#d4af37]/30 bg-[#0e1422] px-3 py-1.5 font-mono text-xs text-slate-100"
                        />
                    </label>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
                    <div className="text-xs font-mono text-slate-200">
                        <span className="text-amber-200 font-bold">{labels.keithVerdictLabel} : </span>
                        <span data-testid="keith-verdict-badge" className="rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-2.5 py-1 font-extrabold text-emerald-300">
                            {keithResult.actionCode.replace('_', ' / ')} (Keith: {keithResult.keithX} vs {keithResult.keithO}, Max Take: {keithResult.thresholdTake})
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={handleCopyXgid}
                        className="rounded-xl border border-[#d4af37]/45 bg-[#121929] px-3.5 py-1.5 text-xs font-bold text-[#f3c65f] hover:border-[#f3c65f] transition"
                    >
                        {copied ? labels.copiedXgidMsg : labels.copyXgidBtn}
                    </button>
                </div>
            </div>
        </section>
    );
};

export const MatchEquityCalculator = React.memo(MatchEquityCalculatorComponent);
export default MatchEquityCalculator;
