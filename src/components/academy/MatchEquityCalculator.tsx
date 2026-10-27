'use client';

/**
 * Calculateur Interactif d'Équité de Match (MET Kazaross-XG2), Seuil de Prise (Take Point),
 * Prix du Gammon & Calculateur de Course de Keith (Keith Count Race Cube Action).
 *
 * Outil SEO "Link Magnet" gratuit en 6 langues (FR, EN, ES, PT, DE, AR).
 * Conforme à SCALABILITY.md (< 300 lignes, 0 any, Dumb UI pure).
 */

import React, { useMemo, useState } from 'react';
import { buildMatchContext } from '../../features/coach/matchContext';
import type { PrimaryLocale } from '../../lib/i18n/types';
import { trackSaasLifecycleEvent } from '../../lib/subscription/retentionEngine';
import {
    CALC_LABELS,
    evaluateKeithRaceDecision,
    type CalcLabels,
    type KeithDecision,
} from './matchEquityCalculatorData';
import KeithRaceCalculatorCard from './KeithRaceCalculatorCard';

export { evaluateKeithRaceDecision };
export type { CalcLabels, KeithDecision };

export interface MatchEquityCalculatorProps {
    readonly locale: PrimaryLocale;
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
        const sampleUrl = `https://backgammontour.com/?xgid=-b----E-C---eE---c-e----B-:0:0:1:31:${scoreX}:${scoreO}:${crawford ? 1 : 0}:${matchLength}:10&utm_source=viral_watermark`;
        const referrer =
            typeof document !== 'undefined' && document.referrer ? document.referrer : 'direct';
        trackSaasLifecycleEvent('pseo_tool_interacted', {
            slug: 'academy-met-keith-calculator',
            tool_type: 'met_and_keith_calculator',
            referrer_source: referrer,
            mwc_pct: mwcPct,
            keith_action: keithResult.actionCode,
        });
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
            className="rounded-3xl border border-white/10 bg-gradient-to-b from-[#171e2e]/95 to-[#090d16]/95 p-5 sm:p-7 shadow-2xl space-y-6"
        >
            <div className="space-y-2">
                <span className="inline-block rounded-full border border-white/10 bg-amber-500/10 px-3 py-0.5 text-xs font-extrabold uppercase tracking-widest text-[#f3c65f]">
                    🧮 {labels.badge}
                </span>
                <h2 id="calc-heading" className="font-serif text-xl sm:text-2xl font-black tracking-wide text-[#f5cf70]">
                    {labels.title}
                </h2>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">{labels.subtitle}</p>
            </div>

            {/* Contrôles MET Kazaross-XG2 */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 rounded-2xl border border-white/10 bg-[#080c15]/90 p-4">
                <label htmlFor="calc-match-length" className="space-y-1 text-xs sm:text-sm">
                    <span className="font-bold text-amber-200">{labels.matchLengthLabel}</span>
                    <select
                        id="calc-match-length"
                        name="matchLength"
                        data-testid="calc-match-length"
                        value={matchLength}
                        onChange={(e) => setMatchLength(Number(e.target.value))}
                        className="w-full rounded-xl border border-white/10 bg-[#0e1422] px-3 py-2 font-mono text-xs sm:text-sm text-slate-100"
                    >
                        <option value={0}>{labels.moneyGameLabel}</option>
                        <option value={3}>3 pts</option>
                        <option value={5}>5 pts</option>
                        <option value={7}>7 pts (Tournoi)</option>
                        <option value={9}>9 pts</option>
                        <option value={11}>11 pts (Championship)</option>
                    </select>
                </label>

                <label htmlFor="calc-score-x" className="space-y-1 text-xs sm:text-sm">
                    <span className="font-bold text-amber-200">{labels.pointsToWinX}</span>
                    <input
                        id="calc-score-x"
                        name="scoreX"
                        type="number"
                        min={0}
                        max={Math.max(0, matchLength - 1)}
                        disabled={matchLength === 0}
                        value={matchLength === 0 ? 0 : scoreX}
                        onChange={(e) => setScoreX(Number(e.target.value))}
                        className="w-full rounded-xl border border-white/10 bg-[#0e1422] px-3 py-2 font-mono text-xs sm:text-sm text-slate-100 disabled:opacity-50"
                    />
                </label>

                <label htmlFor="calc-score-o" className="space-y-1 text-xs sm:text-sm">
                    <span className="font-bold text-amber-200">{labels.pointsToWinO}</span>
                    <input
                        id="calc-score-o"
                        name="scoreO"
                        type="number"
                        min={0}
                        max={Math.max(0, matchLength - 1)}
                        disabled={matchLength === 0}
                        value={matchLength === 0 ? 0 : scoreO}
                        onChange={(e) => setScoreO(Number(e.target.value))}
                        className="w-full rounded-xl border border-white/10 bg-[#0e1422] px-3 py-2 font-mono text-xs sm:text-sm text-slate-100 disabled:opacity-50"
                    />
                </label>

                <label htmlFor="calc-crawford" className="flex items-center gap-2 pt-5 text-xs sm:text-sm font-semibold text-slate-200 cursor-pointer">
                    <input
                        id="calc-crawford"
                        name="crawford"
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
                <div className="rounded-2xl border border-white/10 bg-black/50 p-3.5 text-center">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-300">{labels.mwcLabel}</div>
                    <div data-testid="calc-mwc-value" className="mt-1 font-mono text-xl font-black text-emerald-300">
                        {mwcPct}%
                    </div>
                    <div className="text-xs text-slate-300 font-mono">
                        {matchLength > 0 ? `${matchCtx.pointsToWin.X}-away / ${matchCtx.pointsToWin.O}-away` : 'Money Play'}
                    </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/50 p-3.5 text-center">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-300">{labels.takePointDeadLabel}</div>
                    <div className="mt-1 font-mono text-xl font-black text-amber-200">{deadTakePct}%</div>
                    <div className="text-xs text-slate-300 font-mono">Dead Cube (Sans Gammon)</div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/50 p-3.5 text-center">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-300">{labels.takePointLiveLabel}</div>
                    <div className="mt-1 font-mono text-xl font-black text-[#f5cf70]">{liveTakePct}%</div>
                    <div className="text-xs text-slate-300 font-mono">Cube Vigor Inclus</div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/50 p-3.5 text-center">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-300">{labels.gammonPriceLabel}</div>
                    <div className="mt-1 font-mono text-xl font-black text-sky-300">{matchCtx.gammonPrice.X.toFixed(2)}</div>
                    <div className="text-xs text-slate-300 font-mono">
                        {matchCtx.isDMP ? 'DMP (Gammon = 0)' : 'Valeur relative 2 pts'}
                    </div>
                </div>
            </div>

            {/* Calculateur de Course de Keith */}
            <KeithRaceCalculatorCard
                labels={labels}
                pipsX={pipsX}
                setPipsX={setPipsX}
                pipsO={pipsO}
                setPipsO={setPipsO}
                penX={penX}
                setPenX={setPenX}
                penO={penO}
                setPenO={setPenO}
                keithResult={keithResult}
                copied={copied}
                onCopyXgid={handleCopyXgid}
            />
        </section>
    );
};

export const MatchEquityCalculator = React.memo(MatchEquityCalculatorComponent);
export default MatchEquityCalculator;
