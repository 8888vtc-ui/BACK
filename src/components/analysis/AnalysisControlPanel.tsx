'use client';

/**
 * @file src/components/analysis/AnalysisControlPanel.tsx
 * @description Panneau de Contrôle Pédagogique en Étapes 2 & 3 du Studio d'Analyse :
 * - ÉTAPE 2 : Sélecteur compact des Dés & du Format sur 1 ligne + SEUL bouton plein Or (#D4AF37) [ANALYSER LA POSITION →]
 * - ÉTAPE 3 : Meilleurs Coups avec % de victoire en grand ("58.2 % de victoire", "-4.6 %") & Explication du Coach.
 * Strictement <= 260 lignes, 0 any, 0 emoji.
 */

import React, { useState, useEffect } from 'react';
import { Zap, Sparkles, Play, Star, Dices, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { useTranslation } from '../../i18n';
import type { CandidateMoveAnalysisRow } from '../../lib/analysis/analysisStudioEngine';

export interface AnalysisControlPanelProps {
    readonly dice: [number, number];
    readonly onChangeDice: (dice: [number, number]) => void;
    readonly matchLength: number;
    readonly onChangeMatchLength: (length: number) => void;
    readonly isCrawford: boolean;
    readonly onChangeCrawford: (crawford: boolean) => void;
    readonly onRunAnalysis: () => void;
    readonly loading: boolean;
    readonly errorMessage: string | null;
    readonly candidates: ReadonlyArray<CandidateMoveAnalysisRow>;
    readonly selectedNotation: string | null;
    readonly onSelectMoveNotation: (notation: string) => void;
    readonly xgidString: string;
    readonly onImportXgid: (xgid: string) => void;
    readonly onPlayPositionFromHere: () => void;
    readonly cubeRecommendation?: string;
    readonly coachExplanation?: string;
}

export function formatCubeAdvice(rec?: string, isEn = false): string {
    if (!rec) return isEn ? 'No Double (Keep Cube at 1)' : 'Pas de Double (Garder le Videau à 1)';
    const upper = rec.toUpperCase();
    if (upper.includes('NO DOUBLE') || upper.includes('NO_DOUBLE')) {
        return isEn ? 'No Double (Keep Cube at 1)' : 'Pas de Double (Garder le Videau à 1)';
    }
    if (upper.includes('DOUBLE') && upper.includes('TAKE')) {
        return isEn ? 'Double Now (×2) / Take' : 'Doubler maintenant (×2) / Prendre';
    }
    if (upper.includes('DOUBLE') && upper.includes('PASS')) {
        return isEn ? 'Double Now (×2) / Pass' : 'Doubler maintenant (×2) / Passer';
    }
    if (upper.includes('TOO GOOD')) {
        return isEn ? 'Too Good to Double (Play for Gammon)' : 'Trop beau pour doubler (Jouer le gammon)';
    }
    return rec;
}

export const AnalysisControlPanel: React.FC<AnalysisControlPanelProps> = ({
    dice, onChangeDice, matchLength, onChangeMatchLength, isCrawford, onChangeCrawford,
    onRunAnalysis, loading, errorMessage, candidates, selectedNotation, onSelectMoveNotation,
    xgidString, onImportXgid, onPlayPositionFromHere, cubeRecommendation = 'No Double', coachExplanation,
}) => {
    const { locale } = useTranslation();
    const isEn = locale === 'en';
    const [xgidExpanded, setXgidExpanded] = useState<boolean>(false);
    const [localXgidInput, setLocalXgidInput] = useState<string>(xgidString);
    const [copied, setCopied] = useState<boolean>(false);
    const bestWinPct = candidates[0]?.winPct ?? 50;

    useEffect(() => {
        setLocalXgidInput(xgidString);
    }, [xgidString]);

    const handleCopyXgid = async () => {
        try {
            if (typeof navigator !== 'undefined' && navigator.clipboard) {
                await navigator.clipboard.writeText(xgidString);
            }
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // ignore
        }
    };

    return (
        <div className="flex flex-col gap-2 h-full min-h-0 justify-between select-none" data-testid="analysis-control-panel">
            {/* ÉTAPE 2 : 2. Choisissez les Dés & le Format */}
            <div className="rounded-xl border border-white/[0.08] bg-[#0B1015] p-2.5 flex flex-col gap-2 shrink-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center justify-center rounded-md border border-[#D4AF37]/40 bg-[#D4AF37]/15 px-1.5 py-0.5 text-xs font-mono font-bold uppercase tracking-wider text-[#D4AF37]">
                            {isEn ? 'STEP 2' : 'ÉTAPE 2'}
                        </span>
                        <h2 className="text-xs sm:text-sm font-extrabold text-white">
                            {isEn ? '2. Choose Dice & Format' : '2. Choisissez les Dés & le Format'}
                        </h2>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                        <select
                            data-testid="analysis-match-format-select" value={matchLength}
                            onChange={(e) => onChangeMatchLength(Number(e.target.value))}
                            className="rounded-lg border border-white/15 bg-black/60 px-2 py-0.5 text-xs font-semibold text-stone-200 focus:outline-none"
                        >
                            <option value="0">{isEn ? 'Format: Money Game' : 'Format : Partie Libre'}</option>
                            <option value="3">{isEn ? 'Format: Match 3 pts' : 'Format : Match 3 pts'}</option>
                            <option value="5">{isEn ? 'Format: Match 5 pts' : 'Format : Match 5 pts'}</option>
                            <option value="7">{isEn ? 'Format: Match 7 pts' : 'Format : Match 7 pts'}</option>
                            <option value="11">{isEn ? 'Format: Match 11 pts' : 'Format : Match 11 pts'}</option>
                            <option value="1">DMP (1 pt)</option>
                        </select>

                        <label className="flex items-center gap-1 text-xs font-medium text-stone-300 cursor-pointer">
                            <input type="checkbox" checked={isCrawford} onChange={(e) => onChangeCrawford(e.target.checked)} className="rounded border-white/20 bg-black/60 accent-[#D4AF37]" />
                            <span>Crawford</span>
                        </label>
                    </div>
                </div>

                {/* Ligne horizontale unique compacte des 2 dés côte à côte */}
                <div className="flex items-center justify-between gap-2 bg-black/40 border border-white/[0.06] rounded-lg px-2 py-1.5">
                    <div className="flex items-center gap-1.5 shrink-0">
                        <Dices className="w-4 h-4 text-[#D4AF37]" strokeWidth={1.5} />
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-white text-slate-950 font-mono text-xs font-black shadow-sm">{dice[0]}</span>
                        <span className="text-zinc-500 font-bold">-</span>
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-white text-slate-950 font-mono text-xs font-black shadow-sm">{dice[1]}</span>
                    </div>

                    <div className="flex items-center gap-1 flex-1 justify-end">
                        <span className="text-xs text-zinc-400 font-semibold mr-0.5">D1</span>
                        {[1, 2, 3, 4, 5, 6].map((val) => (
                            <button
                                key={`d1-${val}`} type="button" data-testid={`die-1-btn-${val}`}
                                onClick={() => onChangeDice([val, dice[1]])}
                                className={`w-6 h-6 rounded border text-xs font-mono font-bold transition ${dice[0] === val ? 'border-[#D4AF37] bg-[#D4AF37]/25 text-[#D4AF37]' : 'border-white/10 bg-white/5 text-stone-300 hover:border-white/30'}`}
                            >
                                {val}
                            </button>
                        ))}
                        <span className="text-zinc-400 mx-0.5">|</span>
                        <span className="text-xs text-zinc-400 font-semibold mr-0.5">D2</span>
                        {[1, 2, 3, 4, 5, 6].map((val) => (
                            <button
                                key={`d2-${val}`} type="button" data-testid={`die-2-btn-${val}`}
                                onClick={() => onChangeDice([dice[0], val])}
                                className={`w-6 h-6 rounded border text-xs font-mono font-bold transition ${dice[1] === val ? 'border-[#D4AF37] bg-[#D4AF37]/25 text-[#D4AF37]' : 'border-white/10 bg-white/5 text-stone-300 hover:border-white/30'}`}
                            >
                                {val}
                            </button>
                        ))}
                    </div>
                </div>

                {/* LE SEUL bouton plein Or (#D4AF37) de la page */}
                <button
                    type="button" data-testid="run-analysis-btn" disabled={loading} onClick={onRunAnalysis}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#E5C158] via-[#D4AF37] to-[#B5902B] py-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-black shadow-md hover:brightness-105 disabled:opacity-50 transition"
                >
                    <Zap className="w-4 h-4 text-black" strokeWidth={1.75} />
                    <span>{loading ? (isEn ? 'Analyzing 3-Ply...' : 'Analyse 3-Ply en cours...') : (isEn ? 'ANALYZE POSITION →' : 'ANALYSER LA POSITION →')}</span>
                </button>
            </div>

            {errorMessage && (
                <div data-testid="analysis-error-box" className="p-2 rounded-xl border border-rose-500/40 bg-rose-950/60 text-xs text-rose-200 shrink-0">
                    {errorMessage}
                </div>
            )}

            {/* ÉTAPE 3 : 3. Meilleurs Coups & Explication du Coach */}
            {candidates.length > 0 && (
                <div data-testid="analysis-results-section" className="flex flex-col gap-1.5 flex-1 min-h-0 justify-between">
                    <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1 shrink-0">
                        <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center justify-center rounded-md border border-[#D4AF37]/40 bg-[#D4AF37]/15 px-1.5 py-0.5 text-xs font-mono font-bold uppercase tracking-wider text-[#D4AF37]">
                                {isEn ? 'STEP 3' : 'ÉTAPE 3'}
                            </span>
                            <h2 className="text-xs sm:text-sm font-extrabold text-white">
                                {isEn ? '3. Best Moves & Coach Explanation' : '3. Meilleurs Coups & Explication du Coach'}
                            </h2>
                        </div>
                        <span className="text-xs text-zinc-400 hidden sm:inline">
                            {isEn ? 'Click any move to preview its arrows' : 'Cliquez sur un coup pour voir ses flèches'}
                        </span>
                    </div>

                    <div className="flex flex-col gap-1">
                        {candidates.map((cand, idx) => {
                            const isSelected = selectedNotation === cand.notation;
                            const winDiffPct = Number((cand.winPct - bestWinPct).toFixed(1));
                            const diffSign = winDiffPct > 0 ? `+${winDiffPct}%` : `${winDiffPct}%`;
                            return (
                                <button
                                    key={cand.notation} type="button" data-testid={`analysis-move-row-${idx}`}
                                    onClick={() => onSelectMoveNotation(cand.notation)}
                                    className={`flex flex-col px-2.5 py-1.5 rounded-xl border text-left transition ${isSelected ? 'border-[#D4AF37] bg-white/[0.08] shadow-sm ring-1 ring-[#D4AF37]/40' : 'border-white/[0.08] bg-black/40 hover:border-white/25'}`}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="font-mono text-xs font-extrabold text-[#fdf8eb]">#{cand.rank} {cand.notation}</span>
                                            {cand.isOptimal && (
                                                <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/15 px-1.5 py-0.5 text-xs font-bold text-emerald-300 whitespace-nowrap">
                                                    <Star className="w-2.5 h-2.5 text-emerald-300 fill-emerald-300" />
                                                    <span>{isEn ? 'Best Move' : 'Meilleur coup'}</span>
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <span className={`text-sm sm:text-base font-black ${cand.isOptimal ? 'text-emerald-400' : 'text-white'}`}>
                                                {isEn ? `${cand.winPct.toFixed(1)}% win` : `${cand.winPct.toFixed(1)} % de victoire`}
                                            </span>
                                            {cand.isOptimal ? (
                                                <span className="text-xs font-semibold text-emerald-300">(Optimal)</span>
                                            ) : (
                                                <span className="text-xs font-bold text-amber-300">
                                                    ({diffSign}) <span className="text-xs font-mono font-normal text-zinc-400">{cand.deltaEmg.toFixed(3)} EMG</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="mt-0.5 flex items-center justify-between text-xs text-zinc-300 font-sans">
                                        <span>{isEn ? `Win: ${cand.winPct}% • Gammon (×2): ${cand.winGammonPct}% • Loss: ${cand.losePct}%` : `Victoire : ${cand.winPct}% • Gammon (×2) : ${cand.winGammonPct}% • Défaite : ${cand.losePct}%`}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    <div data-testid="coach-explanation-card" className="p-2.5 rounded-xl border border-[#D4AF37]/30 bg-[#070a10] flex flex-col gap-1 shrink-0">
                        <div className="flex items-center justify-between gap-2">
                            <div className="font-bold text-xs text-[#D4AF37] flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" strokeWidth={1.5} />
                                <span>{isEn ? 'Coach Explanation' : 'Explication du Coach'}</span>
                            </div>
                            <span data-testid="cube-decision-box" className="text-xs font-semibold text-sky-300">
                                {isEn ? 'Cube:' : 'Videau :'} <strong className="text-white">{formatCubeAdvice(cubeRecommendation, isEn)}</strong>
                            </span>
                        </div>
                        <p className="text-xs text-zinc-100 leading-snug">
                            {coachExplanation || (isEn
                                ? `Optimal move #${candidates[0]?.notation} maximizes winning chances (${candidates[0]?.winPct}%) while keeping checkers safe.`
                                : `Le coup optimal #${candidates[0]?.notation} maximise vos chances de victoire (${candidates[0]?.winPct} %) en sécurisant vos pions sans concéder de tirs directs à l'adversaire.`)}
                        </p>
                    </div>

                    <div className="flex items-center justify-between gap-2 shrink-0">
                        <button type="button" data-testid="play-position-from-here-btn" onClick={onPlayPositionFromHere} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-[#D4AF37]/40 py-2 px-3 text-xs font-semibold transition">
                            <Play className="w-3.5 h-3.5 text-[#D4AF37]" strokeWidth={1.5} />
                            <span>{isEn ? 'Play this position against AI Coach from here →' : "Jouer cette position contre le Coach IA à partir d'ici →"}</span>
                        </button>

                        <button
                            type="button"
                            data-testid="copy-xgid-btn"
                            onClick={handleCopyXgid}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.06] hover:bg-white/[0.12] hover:border-[#D4AF37]/60 px-2.5 py-2 text-xs font-bold text-[#D4AF37] transition shrink-0"
                            title={isEn ? 'Copy XGID code to clipboard' : 'Copier le code XGID dans le presse-papier'}
                        >
                            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copied ? (isEn ? 'Copied !' : 'Copié !') : (isEn ? 'Copy XGID' : 'Copier XGID')}</span>
                        </button>

                        <button type="button" data-testid="toggle-xgid-drawer-btn" onClick={() => setXgidExpanded((prev) => !prev)} className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-2 text-xs font-semibold text-zinc-300 hover:text-white transition shrink-0">
                            <span>XGID</span>
                            {xgidExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                    </div>

                    {xgidExpanded && (
                        <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-black/60 p-1.5 shrink-0">
                            <input
                                type="text"
                                data-testid="xgid-input"
                                value={localXgidInput}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    setLocalXgidInput(v);
                                    if (v.trim().startsWith('XGID=') || v.includes(':')) {
                                        onImportXgid(v);
                                    }
                                }}
                                placeholder={isEn ? 'Paste XGID string...' : 'Collez une chaîne XGID...'}
                                className="flex-1 rounded-lg border border-white/20 bg-black/70 px-2 py-1 font-mono text-xs text-amber-200 focus:outline-none"
                            />
                            <button
                                type="button"
                                data-testid="load-xgid-btn"
                                onClick={() => onImportXgid(localXgidInput)}
                                className="rounded-lg border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-bold text-stone-200 hover:bg-white/15"
                            >
                                {isEn ? 'Load' : 'Charger'}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default React.memo(AnalysisControlPanel);
