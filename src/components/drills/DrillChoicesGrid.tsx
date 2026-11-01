'use client';

/**
 * @file src/components/drills/DrillChoicesGrid.tsx
 * @description Grille des 4 coups candidats A, B, C, D en validation 1-Clic immédiate (Architecture Tesla 3-Secondes) :
 * - ZÉRO bouton « ✓ VALIDER ».
 * - Au survol (`hover`), trace les flèches de prévisualisation du coup sur le plateau.
 * - Au clic sur A, B, C ou D, valide instantanément le coup et déclenche l'évolution du niveau (ER ou ERH).
 * - Strictement < 110 lignes, 0 `any`.
 */

import React from 'react';
import type { DrillValidationResult } from '../../features/drills/types';

export interface DrillChoicesGridProps {
    readonly choices: ReadonlyArray<string>;
    readonly optimalMove: string;
    readonly isErMode: boolean;
    readonly validationResult: DrillValidationResult | null;
    readonly hoveredChoiceNotation: string | null;
    readonly onHoverChoice?: (notation: string | null) => void;
    readonly onHoverQuizChoice?: (notation: string | null) => void;
    readonly onSelectChoice?: (notation: string) => void;
    readonly onSelectQuizChoice?: (notation: string) => void;
}

export const DrillChoicesGrid: React.FC<DrillChoicesGridProps> = ({
    choices,
    optimalMove,
    isErMode,
    validationResult,
    hoveredChoiceNotation,
    onHoverChoice,
    onHoverQuizChoice,
    onSelectChoice,
    onSelectQuizChoice,
}) => {
    if (!choices || choices.length === 0) return null;
    const handleHover = onHoverQuizChoice ?? onHoverChoice;
    const handleSelect = onSelectQuizChoice ?? onSelectChoice;

    return (
        <div
            data-testid="quiz-qcm-choices"
            className="rounded-xl border border-white/10 bg-[#050505]/90 p-2.5 space-y-2"
        >
            <div className="flex items-center justify-between text-[11px]">
                <span className={`font-bold ${isErMode ? 'text-emerald-300' : 'text-[#D4AF37]'}`}>
                    {isErMode
                        ? '📐 Survolez pour prévisualiser, cliquez pour valider votre coup ER :'
                        : '🧠 Survolez pour prévisualiser, cliquez pour valider votre coup ERH :'}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
                {choices.map((choice, idx) => {
                    const letter = String.fromCharCode(65 + idx);
                    const isHovered = hoveredChoiceNotation === choice;
                    const isValidatedOptimal =
                        validationResult !== null && choice.trim() === optimalMove.trim();
                    const isValidatedWrongUser =
                        validationResult !== null &&
                        !validationResult.isCorrect &&
                        choice.trim() === validationResult.playedNotation.trim();

                    return (
                        <button
                            key={choice}
                            type="button"
                            disabled={validationResult !== null}
                            data-testid={`quiz-choice-btn-${letter}`}
                            onMouseEnter={() => handleHover?.(choice)}
                            onMouseLeave={() => handleHover?.(null)}
                            onFocus={() => handleHover?.(choice)}
                            onBlur={() => handleHover?.(null)}
                            onClick={() => handleSelect?.(choice)}
                            className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 font-mono text-xs sm:text-sm font-extrabold transition ${
                                isValidatedOptimal
                                    ? 'border-emerald-400 bg-emerald-950/80 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                                    : isValidatedWrongUser
                                        ? 'border-rose-400 bg-rose-950/80 text-rose-200'
                                        : isHovered
                                            ? 'border-[#D4AF37] bg-[#12151C] text-[#D4AF37] shadow-md'
                                            : isErMode
                                                ? 'border-emerald-500/25 bg-[#12151C] text-[#fdf8eb] hover:border-emerald-400 hover:bg-emerald-950/40 hover:text-emerald-200'
                                                : 'border-[#D4AF37]/30 bg-[#12151C] text-[#fdf8eb] hover:border-[#D4AF37] hover:bg-[#1c160d] hover:text-[#D4AF37]'
                            }`}
                        >
                            <span
                                className={`rounded px-1.5 py-0.5 text-[11px] font-black ${
                                    isErMode ? 'bg-emerald-500/20 text-emerald-300' : 'bg-[#D4AF37]/20 text-[#D4AF37]'
                                }`}
                            >
                                {letter}
                            </span>
                            <span>{choice}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default React.memo(DrillChoicesGrid);
