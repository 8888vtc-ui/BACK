'use client';

import React from 'react';
import type { CalcLabels, KeithDecision } from './matchEquityCalculatorData';

export interface KeithRaceCalculatorCardProps {
    labels: CalcLabels;
    pipsX: number;
    setPipsX: (val: number) => void;
    pipsO: number;
    setPipsO: (val: number) => void;
    penX: number;
    setPenX: (val: number) => void;
    penO: number;
    setPenO: (val: number) => void;
    keithResult: KeithDecision;
    copied: boolean;
    onCopyXgid: () => void;
}

export const KeithRaceCalculatorCard: React.FC<KeithRaceCalculatorCardProps> = ({
    labels,
    pipsX,
    setPipsX,
    pipsO,
    setPipsO,
    penX,
    setPenX,
    penO,
    setPenO,
    keithResult,
    copied,
    onCopyXgid,
}) => {
    return (
        <div className="rounded-2xl border border-white/10 bg-[#080c15]/90 p-4 space-y-3">
            <h3 className="font-serif text-sm sm:text-base font-bold text-[#fdf8eb]">{labels.keithTitle}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs sm:text-sm">
                <label htmlFor="calc-pips-x" className="space-y-1">
                    <span className="text-slate-300">{labels.pipsXLabel}</span>
                    <input
                        id="calc-pips-x"
                        name="pipsX"
                        type="number"
                        min={1}
                        max={250}
                        value={pipsX}
                        onChange={(e) => setPipsX(Number(e.target.value))}
                        className="w-full rounded-xl border border-white/10 bg-[#0e1422] px-3 py-1.5 font-mono text-xs sm:text-sm text-slate-100"
                    />
                </label>
                <label htmlFor="calc-pen-x" className="space-y-1">
                    <span className="text-slate-300">{labels.penaltyXLabel}</span>
                    <input
                        id="calc-pen-x"
                        name="penX"
                        type="number"
                        min={0}
                        max={30}
                        value={penX}
                        onChange={(e) => setPenX(Number(e.target.value))}
                        className="w-full rounded-xl border border-white/10 bg-[#0e1422] px-3 py-1.5 font-mono text-xs sm:text-sm text-slate-100"
                    />
                </label>
                <label htmlFor="calc-pips-o" className="space-y-1">
                    <span className="text-slate-300">{labels.pipsOLabel}</span>
                    <input
                        id="calc-pips-o"
                        name="pipsO"
                        type="number"
                        min={1}
                        max={250}
                        value={pipsO}
                        onChange={(e) => setPipsO(Number(e.target.value))}
                        className="w-full rounded-xl border border-white/10 bg-[#0e1422] px-3 py-1.5 font-mono text-xs sm:text-sm text-slate-100"
                    />
                </label>
                <label htmlFor="calc-pen-o" className="space-y-1">
                    <span className="text-slate-300">{labels.penaltyOLabel}</span>
                    <input
                        id="calc-pen-o"
                        name="penO"
                        type="number"
                        min={0}
                        max={30}
                        value={penO}
                        onChange={(e) => setPenO(Number(e.target.value))}
                        className="w-full rounded-xl border border-white/10 bg-[#0e1422] px-3 py-1.5 font-mono text-xs sm:text-sm text-slate-100"
                    />
                </label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/10 text-[11px] font-mono">
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/25 p-2">
                    <div className="text-slate-400 font-sans font-bold">1. Keith (1993)</div>
                    <div className="font-extrabold text-emerald-300">{keithResult.keithX} vs {keithResult.keithO} (Max Take {keithResult.thresholdTake})</div>
                </div>
                <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-2">
                    <div className="text-slate-400 font-sans font-bold">2. Timmes (Oct. 2026)</div>
                    <div className="font-extrabold text-amber-200">
                        Adj {pipsX + penX} vs {pipsO + penO} (Pt Double {Math.round((pipsO + penO) * 0.88)})
                    </div>
                </div>
                <div className="rounded-xl border border-sky-500/30 bg-sky-950/20 p-2">
                    <div className="text-slate-400 font-sans font-bold">3. Isight (Reichert)</div>
                    <div className="font-extrabold text-sky-300">
                        CPW {Math.min(99, Math.max(1, Math.round(50 + ((pipsO + penO) - (pipsX + penX)) * 2.5)))}%
                    </div>
                </div>
                <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-2">
                    <div className="text-slate-400 font-sans font-bold">4. Trice (10% &amp; Règle 9)</div>
                    <div className="font-extrabold text-purple-200">
                        Seuil Prise ≤ {Math.floor(pipsX * 1.1) - ([69, 79, 89, 99].includes(pipsX) ? 1 : 2)} pips
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
                <div className="text-xs sm:text-sm font-mono text-slate-200">
                    <span className="text-amber-200 font-bold">{labels.keithVerdictLabel} : </span>
                    <span data-testid="keith-verdict-badge" className="rounded-lg border border-white/10 bg-emerald-500/15 px-2.5 py-1 font-extrabold text-emerald-300">
                        {keithResult.actionCode.replace('_', ' / ')} (Keith: {keithResult.keithX} vs {keithResult.keithO}, Max Take: {keithResult.thresholdTake})
                    </span>
                </div>

                <button
                    type="button"
                    onClick={onCopyXgid}
                    className="rounded-xl border border-white/10 bg-[#121929] px-3.5 py-1.5 text-xs sm:text-sm font-bold text-[#f3c65f] hover:border-[#f3c65f] transition"
                >
                    {copied ? labels.copiedXgidMsg : labels.copyXgidBtn}
                </button>
            </div>
        </div>
    );
};

export default React.memo(KeithRaceCalculatorCard);
