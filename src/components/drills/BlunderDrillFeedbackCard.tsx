'use client';

/**
 * @file src/components/drills/BlunderDrillFeedbackCard.tsx
 * @description Panneau droit modulaire du Quiz (Architecture Tesla 3-Secondes / Monte-Carlo) :
 * - Compose `DrillContextStrip` (Thème Mystère 🔒 avant réponse, score away, videau, retard et structure).
 * - Compose `DrillChoicesGrid` (dés à jouer `🎲 Blanc joue 6-5`, sens `Case 24 ➔ Case 1`, 4 boutons A/B/C/D en 1-Clic).
 * - Compose `DrillCoachFeedback` (Panneau de Coaching Interactif propulsé par `FlashLite-Tactical-Extractor` & `Flash-Pedagogical-Coach`).
 * - Strictement < 130 lignes, 0 `any` (GOVERNANCE.md & SCALABILITY.md).
 */

import React, { useMemo } from 'react';
import type { PlayerBlunderRecord, DrillValidationResult } from '../../features/drills/types';
import { buildErhOpponentScenario } from '../../features/drills/adaptiveQuizEngine';
import DrillContextStrip from './DrillContextStrip';
import DrillChoicesGrid from './DrillChoicesGrid';
import DrillCoachFeedback from './DrillCoachFeedback';

export interface BlunderDrillFeedbackCardProps {
    currentBlunder: PlayerBlunderRecord;
    currentIndex: number;
    totalBlunders: number;
    showHint: boolean;
    onToggleHint: () => void;
    onResetAttempt: () => void;
    validationResult: DrillValidationResult | null;
    onNextBlunder: () => void;
    onSelectQuizChoice?: (notation: string) => void;
    onHoverQuizChoice?: (notation: string | null) => void;
    hoveredChoiceNotation?: string | null;
    drillMode?: 'adaptive' | 'pr_math' | 'personal_blunders' | 'speed_60s';
    ratingDelta?: number;
}

export const BlunderDrillFeedbackCard: React.FC<BlunderDrillFeedbackCardProps> = ({
    currentBlunder,
    currentIndex,
    totalBlunders,
    showHint,
    onToggleHint,
    onResetAttempt,
    validationResult,
    onNextBlunder,
    onSelectQuizChoice,
    onHoverQuizChoice,
    hoveredChoiceNotation = null,
    drillMode = 'adaptive',
    ratingDelta = 0,
}) => {
    const isErMode = drillMode === 'pr_math';
    const erhScenario = useMemo(
        () => (!isErMode ? buildErhOpponentScenario(currentBlunder) : null),
        [currentBlunder, isErMode],
    );

    return (
        <section
            data-testid="drill-position-card"
            className="w-full h-full flex flex-col justify-between rounded-xl border border-white/10 bg-[#12151C]/95 p-2.5 sm:p-3 shadow-xl overflow-hidden"
        >
            <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-0.5">
                {/* 1. Bandeau stratégique : Quiz ER / PR #N, Thème Mystère 🔒 avant réponse, Match (away), Videau (Centre), Retard, Portes & Pions arrières */}
                <DrillContextStrip
                    currentBlunder={currentBlunder}
                    currentIndex={currentIndex}
                    totalBlunders={totalBlunders}
                    isErMode={isErMode}
                    showHint={showHint}
                    isRevealed={validationResult !== null}
                    onToggleHint={onToggleHint}
                    onResetAttempt={onResetAttempt}
                />

                {/* En mode ERH uniquement (avant réponse) : Profil psychologique adverse concis */}
                {!isErMode && erhScenario && !validationResult && (
                    <div
                        data-testid="erh-opponent-scenario-card"
                        className="rounded-xl border border-[#D4AF37]/35 bg-[#16110b] px-2.5 py-1.5 text-[11px] text-amber-100 flex items-center justify-between gap-2"
                    >
                        <span className="truncate font-semibold text-[#f3c65f]">
                            🧠 {erhScenario.badgeLabel} — {erhScenario.psychologicalPrompt}
                        </span>
                    </div>
                )}

                {/* 2. Grille 2x2 des 4 coups A, B, C, D + Rappel des dés & Sens de marche */}
                {currentBlunder.quizChoices && currentBlunder.quizChoices.length > 0 && onSelectQuizChoice && (
                    <DrillChoicesGrid
                        choices={currentBlunder.quizChoices}
                        optimalMove={currentBlunder.optimalMove}
                        dice={currentBlunder.dice}
                        isErMode={isErMode}
                        validationResult={validationResult}
                        hoveredChoiceNotation={hoveredChoiceNotation}
                        onSelectQuizChoice={onSelectQuizChoice}
                        onHoverQuizChoice={onHoverQuizChoice}
                    />
                )}

                {showHint && currentBlunder.hint && !validationResult && (
                    <div
                        className="rounded-xl border border-[#D4AF37]/40 bg-[#180c06]/90 p-2.5 text-xs text-[#fdf8eb] leading-snug"
                        data-testid="drill-hint-box"
                    >
                        <span className="font-bold text-[#f3c65f]">💡 Indice : </span>
                        {currentBlunder.hint}
                    </div>
                )}

                {/* 3. Panneau de Coaching Interactif (FlashLite-Tactical-Extractor + Flash-Pedagogical-Coach) */}
                {validationResult && (
                    <DrillCoachFeedback
                        currentBlunder={currentBlunder}
                        validationResult={validationResult}
                        isErMode={isErMode}
                        ratingDelta={ratingDelta}
                        onResetAttempt={onResetAttempt}
                        onToggleThreatPreview={onHoverQuizChoice}
                        onNextBlunder={onNextBlunder}
                    />
                )}
            </div>
        </section>
    );
};

export default React.memo(BlunderDrillFeedbackCard);
