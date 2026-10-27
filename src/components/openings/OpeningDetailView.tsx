'use client';

import React from 'react';
import type { OpeningEntry } from '../../features/openings/types';
import type { Move } from '../../engine/backgammonEngine';

export interface OpeningDetailViewProps {
    opening: OpeningEntry;
    isOpeningTurnActive?: boolean;
    onApplyMove?: (moves: Move[]) => void;
    onClose: () => void;
}

export const OpeningDetailView: React.FC<OpeningDetailViewProps> = ({
    opening,
    isOpeningTurnActive = false,
    onApplyMove,
    onClose,
}) => {
    return (
        <div className="md:col-span-7 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#0b101b]/80">
            {/* En-tête de la fiche */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="rounded-lg bg-[#281c0b] px-2.5 py-0.5 font-mono text-xs sm:text-sm font-bold text-[#f3c65f] border border-white/10">
                            Jet [{opening.dice[0]}-{opening.dice[1]}]
                        </span>
                        <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs sm:text-sm font-semibold text-slate-300">
                            {opening.category}
                        </span>
                    </div>
                    <h3 className="font-serif mt-1.5 text-xl sm:text-2xl font-black text-[#fdf8eb]">
                        {opening.name}
                    </h3>
                </div>

                {isOpeningTurnActive && onApplyMove && (
                    <button
                        type="button"
                        onClick={() => {
                            onApplyMove(opening.bestMoves);
                            onClose();
                        }}
                        className="rounded-xl border border-[#fef08a]/80 bg-gradient-to-b from-[#fff5cf] via-[#f0c75e] to-[#b87e14] px-4 py-2 text-xs sm:text-sm font-black uppercase tracking-wider text-[#1c1004] shadow-md hover:brightness-105 transition"
                    >
                        ✦ Appliquer en partie
                    </button>
                )}
            </div>

            {/* Coup optimal recommandé */}
            <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-[#24190a]/90 to-[#0e131f]/90 p-4 shadow-inner flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                    <div className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#f3c65f]">
                        Coup Optimal Certifié (Rollout 4-Ply)
                    </div>
                    <div className="text-2xl sm:text-3xl font-black tracking-wide text-[#fdf8eb] mt-0.5 font-mono">
                        {opening.bestMoveNotation}
                    </div>
                    <div className="text-xs text-slate-300 mt-1.5 flex flex-wrap gap-2">
                        {opening.bestMoves.map((m, idx) => (
                            <span
                                key={idx}
                                className="rounded-md border border-white/10 bg-black/40 px-2.5 py-0.5 text-xs text-amber-100 font-mono"
                            >
                                Flèche {m.from} ➔ Flèche {m.to}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="text-right">
                    <div className="text-xs uppercase tracking-wider text-slate-300">Équité nette</div>
                    <div className="font-mono text-xl font-black text-emerald-400">
                        {opening.equity >= 0 ? `+${opening.equity.toFixed(3)}` : opening.equity.toFixed(3)}
                    </div>
                </div>
            </div>

            {/* Barres statistiques Rollout */}
            <div className="grid grid-cols-3 gap-2.5">
                <div className="rounded-xl border border-white/10 bg-slate-950/70 p-3.5 text-center">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                        Victoire Totale
                    </div>
                    <div className="text-lg sm:text-xl font-black text-amber-400 mt-0.5">
                        {opening.winPercentage}%
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full mt-2 overflow-hidden">
                        <div
                            className="h-full bg-amber-400 rounded-full"
                            style={{ width: `${opening.winPercentage}%` }}
                        />
                    </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-slate-950/70 p-3.5 text-center">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                        Gammon Gagné
                    </div>
                    <div className="text-lg sm:text-xl font-black text-emerald-400 mt-0.5">
                        {opening.gammonPercentage}%
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full mt-2 overflow-hidden">
                        <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${opening.gammonPercentage * 2.5}%` }}
                        />
                    </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-slate-950/70 p-3.5 text-center">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                        Gammon Concédé
                    </div>
                    <div className="text-lg sm:text-xl font-black text-rose-400 mt-0.5">
                        {opening.loseGammonPercentage}%
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full mt-2 overflow-hidden">
                        <div
                            className="h-full bg-rose-500 rounded-full"
                            style={{ width: `${opening.loseGammonPercentage * 2.5}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Explication & Règle Pédagogique */}
            <div className="space-y-2">
                <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#f3c65f] flex items-center gap-1.5">
                    <span className="[filter:sepia(0.95)_saturate(2.5)_hue-rotate(5deg)]">🧠</span>
                    <span>Explication Tactique</span>
                </h4>
                <p className="text-sm leading-relaxed text-[#e2d2b5] bg-[#090b10]/90 p-4 rounded-xl border border-white/10">
                    {opening.explanation}
                </p>
            </div>

            {/* Boîte Principe Clé */}
            <div className="rounded-xl border border-white/10 bg-gradient-to-r from-[#24160b]/90 to-[#0e131f]/80 p-4 flex items-start gap-3">
                <span className="text-xl [filter:sepia(0.95)_saturate(2.5)_hue-rotate(5deg)]">💡</span>
                <div>
                    <div className="text-xs sm:text-sm font-extrabold text-[#f3c65f] uppercase tracking-wide">
                        Principe Fondamental
                    </div>
                    <div className="text-sm font-medium text-[#fdf8eb] mt-0.5 leading-relaxed">
                        {opening.keyRule}
                    </div>
                </div>
            </div>

            {/* Encart Proverbe du Maître & Livre Recommandé */}
            {opening.masterQuote && (
                <div
                    className="rounded-xl border border-white/10 bg-gradient-to-r from-[#1c1008]/95 via-[#0e121b] to-[#180c06]/90 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner"
                    data-testid="opening-master-quote"
                >
                    <div className="space-y-1">
                        <div className="text-xs font-black uppercase tracking-wider text-[#f3c65f] flex items-center gap-1.5">
                            <span className="[filter:sepia(0.95)_saturate(2.5)_hue-rotate(5deg)]">📚</span>
                            <span>Enseignement du Maître — {opening.masterQuote.author}</span>
                        </div>
                        <div className="text-sm font-semibold text-[#fdf8eb] italic leading-relaxed">
                            {opening.masterQuote.proverb}
                        </div>
                        <div className="text-xs text-[#a5b0c4]">
                            Extrait de : <strong className="text-[#e2d2b5]">{opening.masterQuote.book}</strong>
                        </div>
                    </div>
                    <a
                        href={opening.masterQuote.buyUrl}
                        className="shrink-0 rounded-xl border border-[#fef08a]/70 bg-gradient-to-b from-[#fff5cf] via-[#f0c75e] to-[#b87e14] px-3.5 py-2 text-xs font-black uppercase tracking-wider text-[#1c1004] transition shadow hover:brightness-105 active:scale-95 flex items-center gap-1"
                    >
                        <span>Ouvrir la fiche Académie</span>
                        <span>↗</span>
                    </a>
                </div>
            )}

            {/* Tableau comparatif des alternatives & blunders */}
            <div className="space-y-2">
                <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                    <span>⚖️</span>
                    <span>Alternatives &amp; Pertes d’Équité (ΔEq)</span>
                </h4>

                <div className="rounded-xl border border-white/10 overflow-hidden bg-slate-950/50">
                    <table className="w-full text-left text-xs sm:text-sm">
                        <thead className="bg-slate-900/90 text-slate-300 border-b border-white/10">
                            <tr>
                                <th className="py-2.5 px-3.5">Coup</th>
                                <th className="py-2.5 px-3.5">Style</th>
                                <th className="py-2.5 px-3.5 text-right">Perte ΔEq</th>
                                <th className="py-2.5 px-3.5">Analyse</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            <tr className="bg-emerald-950/20">
                                <td className="py-2.5 px-3.5 font-mono font-bold text-emerald-300">
                                    {opening.bestMoveNotation} (Optimal)
                                </td>
                                <td className="py-2.5 px-3.5 text-emerald-400">Optimal</td>
                                <td className="py-2.5 px-3.5 text-right font-mono font-bold text-emerald-400">
                                    0.000
                                </td>
                                <td className="py-2.5 px-3.5 text-slate-300 text-xs sm:text-sm">
                                    Coup de référence standard
                                </td>
                            </tr>
                            {opening.alternatives.map((alt, index) => (
                                <tr key={index} className="hover:bg-slate-900/40">
                                    <td className="py-2.5 px-3.5 font-mono font-semibold text-white">
                                        {alt.notation}
                                    </td>
                                    <td className="py-2.5 px-3.5 text-slate-300 text-xs sm:text-sm">
                                        {alt.style}
                                    </td>
                                    <td className="py-2.5 px-3.5 text-right font-mono font-bold text-rose-400">
                                        {alt.equityLoss.toFixed(3)}
                                    </td>
                                    <td className="py-2.5 px-3.5 text-slate-300 text-xs sm:text-sm">
                                        {alt.description}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default React.memo(OpeningDetailView);
