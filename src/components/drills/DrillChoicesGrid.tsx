'use client';

/**
 * @file src/components/drills/DrillChoicesGrid.tsx
 * @description Grille des 4 coups candidats A, B, C, D + Validation du coup joué librement sur le plateau :
 * - Rappelle les dés à jouer (`🎲 Blanc joue 6-5`) et le sens de marche (`Sens : Case 24 ➔ Case 1`).
 * - Permet soit de cliquer en 1-Clic sur A/B/C/D, soit de déplacer librement ses pions sur le plateau
 *   (*Smart Point Click*) puis de cliquer sur `[✓ Valider mon coup]`.
 * - En cas de 1er essai raté (`attemptsLeft === 1`), ne dévoile PAS la solution optimale en vert.
 * - Strictement < 160 lignes, 0 `any`.
 */

import React from 'react';
import { Dices } from 'lucide-react';
import { useTranslation } from '../../i18n';
import type { DrillValidationResult } from '../../features/drills/types';
import {
    filterLegalCubeChoices,
    formatCubeChoiceButtonLabel,
    normalizeCubeActionKey,
} from '../../features/drills/drillCubeDecisionHelper';

export interface DrillChoicesGridProps {
    readonly choices: ReadonlyArray<string>;
    readonly optimalMove: string;
    readonly dice?: readonly [number, number];
    readonly isErMode: boolean;
    readonly validationResult: DrillValidationResult | null;
    readonly attemptsLeft?: number;
    readonly pendingBoardNotation?: string | null;
    readonly canConfirmBoardMove?: boolean;
    readonly onConfirmBoardMove?: () => void;
    readonly hoveredChoiceNotation: string | null;
    readonly onHoverChoice?: (notation: string | null) => void;
    readonly onHoverQuizChoice?: (notation: string | null) => void;
    readonly onSelectChoice?: (notation: string | null | string) => void;
    readonly onSelectQuizChoice?: (notation: string) => void;
    readonly matchLength?: number;
    readonly isCubeDecision?: boolean;
}

export const DrillChoicesGrid: React.FC<DrillChoicesGridProps> = ({
    choices,
    optimalMove,
    dice = [6, 5],
    isErMode,
    validationResult,
    attemptsLeft = 2,
    pendingBoardNotation = null,
    canConfirmBoardMove = false,
    onConfirmBoardMove,
    hoveredChoiceNotation,
    onHoverChoice,
    onHoverQuizChoice,
    onSelectChoice,
    onSelectQuizChoice,
    matchLength = 7,
    isCubeDecision,
}) => {
    const { locale } = useTranslation();
    const isEn = locale === 'en';
    if (!choices || choices.length === 0) return null;
    const handleHover = onHoverQuizChoice ?? onHoverChoice;
    const handleSelect = onSelectQuizChoice ?? onSelectChoice;

    const isCube = Boolean(
        isCubeDecision ||
            (dice[0] === 0 && dice[1] === 0) ||
            choices.some((c) => /double/i.test(c)),
    );

    const activeChoices = isCube ? filterLegalCubeChoices(choices, matchLength) : choices;

    const isQuizLocked =
        validationResult !== null && (validationResult.isCorrect || attemptsLeft <= 0);
    const showSolutionHighlight = isQuizLocked;

    return (
        <div
            data-testid="quiz-qcm-choices"
            className="rounded-xl border border-white/10 bg-[#050505]/90 p-2 space-y-1.5 shrink-0"
        >
            <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
                <span
                    title="ER / PR : Error Rate / Performance Rating officiel (0.0 = Perfection, 30.0 = Novice)"
                    className="font-bold text-emerald-300"
                >
                    {isEn ? 'Play on the board or select a move (ER / PR):' : 'Jouez sur le plateau ou cliquez un coup (ER / PR) :'}
                </span>
                <div
                    data-testid="drill-dice-direction-badge"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#D4AF37]/30 bg-[#12151C] px-2 py-0.5 font-mono text-[10px] font-bold text-[#fdf8eb]"
                >
                    <Dices className="w-3.5 h-3.5 text-[#D4AF37]" strokeWidth={1.5} />
                    {isCube ? (
                        <>
                            <span className="text-[#D4AF37]">{isEn ? '🎲 Doubling Cube Decision' : '🎲 Décision de Videau'}</span>
                            <span className="text-slate-400">•</span>
                            <span className="text-slate-300">{isEn ? 'Action before roll' : 'Action avant de lancer'}</span>
                        </>
                    ) : (
                        <>
                            <span className="text-[#D4AF37]">{isEn ? `White plays ${dice[0]}-${dice[1]}` : `Blanc joue ${dice[0]}-${dice[1]}`}</span>
                            <span className="text-slate-400">•</span>
                            <span className="text-slate-300">{isEn ? 'Direction: Pt 24 ➔ Pt 1' : 'Sens : Case 24 ➔ Case 1'}</span>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
                {activeChoices.map((choice, idx) => {
                    const letter = String.fromCharCode(65 + idx);
                    const isHovered = hoveredChoiceNotation === choice;
                    const displayLabel = isCube ? formatCubeChoiceButtonLabel(choice, isEn ? 'en' : 'fr') : choice;
                    const isMatchOptimal =
                        choice.trim() === optimalMove.trim() ||
                        (isCube && normalizeCubeActionKey(choice) === normalizeCubeActionKey(optimalMove));
                    const isValidatedOptimal = showSolutionHighlight && isMatchOptimal;
                    const isMatchPlayedWrong =
                        validationResult !== null &&
                        !validationResult.isCorrect &&
                        (choice.trim() === validationResult.playedNotation.trim() ||
                            (isCube &&
                                normalizeCubeActionKey(choice) ===
                                    normalizeCubeActionKey(validationResult.playedNotation)));
                    const isValidatedWrongUser = isMatchPlayedWrong;

                    return (
                        <button
                            key={choice}
                            type="button"
                            disabled={isQuizLocked}
                            data-testid={`quiz-choice-btn-${letter}`}
                            onMouseEnter={() => handleHover?.(choice)}
                            onMouseLeave={() => handleHover?.(null)}
                            onFocus={() => handleHover?.(choice)}
                            onBlur={() => handleHover?.(null)}
                            onClick={() => handleSelect?.(choice)}
                            className={`flex items-center justify-center gap-2 rounded-xl border px-2.5 py-1.5 font-mono text-xs sm:text-sm font-extrabold transition ${
                                isValidatedOptimal
                                    ? 'border-emerald-400 bg-emerald-950/80 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                                    : isValidatedWrongUser
                                        ? attemptsLeft > 0
                                            ? 'border-amber-400 bg-amber-950/80 text-amber-200'
                                            : 'border-rose-400 bg-rose-950/80 text-rose-200'
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
                            <span>{displayLabel}</span>
                        </button>
                    );
                })}
            </div>

            {canConfirmBoardMove && onConfirmBoardMove && !isQuizLocked && (
                <button
                    type="button"
                    onClick={onConfirmBoardMove}
                    data-testid="drill-confirm-board-move-btn"
                    className="w-full rounded-xl border border-emerald-400 bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-1.5 font-mono text-xs font-black uppercase tracking-wider text-white shadow-lg hover:brightness-110 transition"
                >
                    ✓ Valider mon coup sur le plateau {pendingBoardNotation ? `(${pendingBoardNotation})` : ''}
                </button>
            )}
        </div>
    );
};

export default React.memo(DrillChoicesGrid);
