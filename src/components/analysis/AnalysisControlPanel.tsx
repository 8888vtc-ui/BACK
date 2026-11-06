'use client';

/**
 * @file src/components/analysis/AnalysisControlPanel.tsx
 * @description Panneau de Contrôle & Analyse 3-Ply du Studio d'Analyse :
 * - Sélecteur visuel des 2 dés [⚀ ⚁ ⚂ ⚃ ⚄ ⚅] en 1 clic + format de match,
 * - Top 5 des vrais coups légaux évalués (generateLegalMoves + bgsage 3-ply),
 * - Explication pédagogique du Coach,
 * - Bouton [🎮 Jouer cette position contre le Coach IA à partir d'ici →],
 * - Accordéon avancé pour import/export de code XGID.
 * Strictement <= 280 lignes, 0 any.
 */

import React, { useState } from 'react';
import { Zap, GraduationCap, Play } from 'lucide-react';
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

const DIE_FACES: ReadonlyArray<string> = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

export const AnalysisControlPanel: React.FC<AnalysisControlPanelProps> = ({
    dice,
    onChangeDice,
    matchLength,
    onChangeMatchLength,
    isCrawford,
    onChangeCrawford,
    onRunAnalysis,
    loading,
    errorMessage,
    candidates,
    selectedNotation,
    onSelectMoveNotation,
    xgidString,
    onImportXgid,
    onPlayPositionFromHere,
    cubeRecommendation = 'No Double',
    coachExplanation,
}) => {
    const { locale } = useTranslation();
    const isEn = locale === 'en';
    const [xgidExpanded, setXgidExpanded] = useState<boolean>(false);
    const [localXgidInput, setLocalXgidInput] = useState<string>(xgidString);

    const handleDie1Click = (val: number) => onChangeDice([val, dice[1]]);
    const handleDie2Click = (val: number) => onChangeDice([dice[0], val]);

    return (
        <div className="flex flex-col gap-2.5 h-full overflow-y-auto pr-1" data-testid="analysis-control-panel">
            {/* 1. Sélecteur Visuel des Dés & Format de Match */}
            <div className="rounded-xl border border-white/10 bg-[#0B1015] p-2.5 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#D4AF37] uppercase tracking-wider">
                    <span>{isEn ? 'Dice Selector:' : 'Sélecteur des Dés :'}</span>
                    <span className="font-mono text-white text-sm">
                        {DIE_FACES[dice[0] - 1]} {dice[0]} — {DIE_FACES[dice[1] - 1]} {dice[1]}
                    </span>
                </div>

                {/* Dé 1 */}
                <div className="flex items-center gap-1.5 text-xs">
                    <span className="w-12 text-stone-400 font-semibold text-[11px]">{isEn ? 'Die 1:' : 'Dé 1 :'}</span>
                    <div className="flex flex-1 gap-1">
                        {[1, 2, 3, 4, 5, 6].map((val) => (
                            <button
                                key={`d1-${val}`}
                                type="button"
                                data-testid={`die-1-btn-${val}`}
                                onClick={() => handleDie1Click(val)}
                                className={`flex-1 rounded-lg border py-1 text-xs font-mono font-black transition ${
                                    dice[0] === val
                                        ? 'border-[#D4AF37] bg-[#D4AF37]/25 text-[#D4AF37] shadow'
                                        : 'border-white/10 bg-white/5 text-stone-300 hover:border-white/30'
                                }`}
                            >
                                {val}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Dé 2 */}
                <div className="flex items-center gap-1.5 text-xs">
                    <span className="w-12 text-stone-400 font-semibold text-[11px]">{isEn ? 'Die 2:' : 'Dé 2 :'}</span>
                    <div className="flex flex-1 gap-1">
                        {[1, 2, 3, 4, 5, 6].map((val) => (
                            <button
                                key={`d2-${val}`}
                                type="button"
                                data-testid={`die-2-btn-${val}`}
                                onClick={() => handleDie2Click(val)}
                                className={`flex-1 rounded-lg border py-1 text-xs font-mono font-black transition ${
                                    dice[1] === val
                                        ? 'border-[#D4AF37] bg-[#D4AF37]/25 text-[#D4AF37] shadow'
                                        : 'border-white/10 bg-white/5 text-stone-300 hover:border-white/30'
                                }`}
                            >
                                {val}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Format de match */}
                <div className="flex items-center gap-2 pt-1 border-t border-white/5 text-xs">
                    <span className="text-stone-400 text-[11px]">{isEn ? 'Format:' : 'Format :'}</span>
                    <select
                        value={matchLength}
                        onChange={(e) => onChangeMatchLength(Number(e.target.value))}
                        className="rounded-lg border border-white/15 bg-black/60 px-2 py-0.5 text-xs text-stone-200 focus:outline-none"
                    >
                        <option value="0">{isEn ? 'Money Game' : 'Partie Libre (Money)'}</option>
                        <option value="3">Match 3 pts</option>
                        <option value="5">Match 5 pts</option>
                        <option value="7">Match 7 pts</option>
                        <option value="11">Match 11 pts</option>
                        <option value="1">DMP (1 pt)</option>
                    </select>

                    <label className="flex items-center gap-1 text-[11px] text-stone-300 cursor-pointer ml-auto">
                        <input
                            type="checkbox"
                            checked={isCrawford}
                            onChange={(e) => onChangeCrawford(e.target.checked)}
                            className="rounded border-white/20 bg-black/60 accent-[#D4AF37]"
                        />
                        <span>Crawford</span>
                    </label>
                </div>
            </div>

            {/* 2. Bouton Lancer l'Analyse 3-Ply (Unique bouton plein Or) */}
            <button
                type="button"
                data-testid="run-analysis-btn"
                disabled={loading}
                onClick={onRunAnalysis}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#E5C158] via-[#D4AF37] to-[#B5902B] py-2 text-xs font-bold uppercase tracking-wider text-black shadow-md hover:brightness-105 disabled:opacity-50 transition"
            >
                <Zap className="w-3.5 h-3.5 text-black" strokeWidth={1.75} />
                <span>{loading ? (isEn ? 'Running 3-ply analysis...' : 'Calcul 3-ply en cours...') : (isEn ? 'ANALYZE POSITION IN 3-PLY' : 'ANALYSER CETTE POSITION EN 3-PLY')}</span>
            </button>

            {errorMessage && (
                <div data-testid="analysis-error-box" className="p-2 rounded-xl border border-rose-500/40 bg-rose-950/60 text-xs text-rose-200">
                    {errorMessage}
                </div>
            )}

            {/* 3. Top 5 des Coups Légaux Réels */}
            {candidates.length > 0 && (
                <div data-testid="analysis-results-section" className="flex flex-col gap-1.5">
                    <h2 className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 border-b border-emerald-500/30 pb-1">
                        {isEn ? 'Top 5 Legal Moves (3-Ply Equity):' : 'Top 5 des Coups Légaux (Équité 3-Ply) :'}
                    </h2>
                    <div className="flex flex-col gap-1">
                        {candidates.map((cand, idx) => {
                            const isSelected = selectedNotation === cand.notation;
                            return (
                                <button
                                    key={cand.notation}
                                    type="button"
                                    data-testid={`analysis-move-row-${idx}`}
                                    onClick={() => onSelectMoveNotation(cand.notation)}
                                    className={`flex flex-col p-2 rounded-xl border text-left transition ${
                                        isSelected
                                            ? 'border-[#D4AF37] bg-white/10 shadow-md ring-1 ring-[#D4AF37]/50'
                                            : 'border-white/10 bg-black/40 hover:border-white/30'
                                    }`}
                                >
                                    <div className="flex items-center justify-between font-mono text-xs">
                                        <span className="font-extrabold text-[#fdf8eb]">
                                            #{cand.rank} {cand.notation}
                                        </span>
                                        <span className={`font-black ${cand.isOptimal ? 'text-emerald-400' : 'text-rose-300'}`}>
                                            {cand.isOptimal ? 'Optimal 0.000 EMG' : `${cand.deltaEmg.toFixed(3)} EMG`}
                                        </span>
                                    </div>
                                    <div className="mt-1 flex items-center gap-2 font-mono text-[10px] text-stone-400">
                                        <span>{isEn ? 'Win:' : 'Gagne :'} {cand.winPct}%</span>
                                        <span>·</span>
                                        <span>Gammon : {cand.winGammonPct}%</span>
                                        <span>·</span>
                                        <span>{isEn ? 'Lose:' : 'Perd :'} {cand.losePct}%</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Conseil Videau 3-Ply */}
                    <div data-testid="cube-decision-box" className="p-2 rounded-xl border border-sky-400/30 bg-sky-950/40 text-xs flex items-center justify-between">
                        <span className="font-bold text-sky-300 uppercase">{isEn ? '3-Ply Cube Advice:' : 'Conseil Videau 3-Ply :'}</span>
                        <span className="font-mono font-bold text-white">{formatCubeAdvice(cubeRecommendation, isEn)}</span>
                    </div>

                    {/* 4. Explication du Coach */}
                    <div data-testid="coach-explanation-card" className="p-2.5 rounded-xl border border-[#D4AF37]/30 bg-[#070a10] text-xs flex flex-col gap-1">
                        <div className="font-bold text-[#D4AF37] flex items-center gap-1.5">
                            <GraduationCap className="w-3.5 h-3.5 text-[#D4AF37]" strokeWidth={1.5} />
                            <span>{isEn ? 'Coach Explanation:' : 'Explication du Coach :'}</span>
                        </div>
                        <p className="text-stone-300 leading-snug">
                            {coachExplanation ||
                                (isEn
                                    ? `Optimal move #${candidates[0]?.notation} maximizes winning chances (${candidates[0]?.winPct}%) while keeping checkers safe.`
                                    : `Le coup optimal #${candidates[0]?.notation} maximise vos chances de victoire (${candidates[0]?.winPct} %) en sécurisant vos pions sans concéder de tirs directs à l'adversaire.`)}
                        </p>
                    </div>

                    {/* Bouton Jouer cette position */}
                    <button
                        type="button"
                        data-testid="play-position-from-here-btn"
                        onClick={onPlayPositionFromHere}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-400 bg-emerald-500/20 py-2 text-xs font-black uppercase text-emerald-300 hover:bg-emerald-500/30 transition shadow"
                    >
                        <Play className="w-3.5 h-3.5 text-emerald-300" strokeWidth={1.75} />
                        <span>{isEn ? 'Play this position against AI Coach from here →' : 'Jouer cette position contre le Coach IA à partir d\'ici →'}</span>
                    </button>
                </div>
            )}

            {/* 5. Accordéon Avancé XGID (Replié par défaut) */}
            <div className="mt-auto pt-2 border-t border-white/10">
                <button
                    type="button"
                    onClick={() => setXgidExpanded((prev) => !prev)}
                    className="flex items-center justify-between w-full text-[11px] font-semibold text-stone-400 hover:text-stone-200 transition"
                >
                    <span>{isEn ? '▸ Advanced options: Import / Copy XGID code' : '▸ Options avancées : Importer / Copier un code XGID'}</span>
                    <span>{xgidExpanded ? '▲' : '▼'}</span>
                </button>
                {xgidExpanded && (
                    <div className="mt-2 flex flex-col gap-1.5 rounded-xl border border-white/10 bg-black/40 p-2">
                        <input
                            type="text"
                            data-testid="xgid-input"
                            value={localXgidInput}
                            onChange={(e) => setLocalXgidInput(e.target.value)}
                            placeholder={isEn ? 'Paste XGID string...' : 'Collez une chaîne XGID...'}
                            className="w-full rounded-lg border border-white/20 bg-black/70 px-2 py-1 font-mono text-xs text-amber-200 focus:outline-none"
                        />
                        <button
                            type="button"
                            onClick={() => onImportXgid(localXgidInput)}
                            className="rounded-lg border border-white/20 bg-white/5 py-1 text-[11px] font-bold text-stone-200 hover:bg-white/10"
                        >
                            {isEn ? 'Load XGID' : 'Charger ce XGID'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default React.memo(AnalysisControlPanel);

