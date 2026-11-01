'use client';

/**
 * @file src/components/drills/BlunderDrillFeedbackCard.tsx
 * @description Panneau droit modulaire du Quiz en Pleine Page Zéro-Scroll (Architecture Tesla 3-Secondes) :
 * - Compose `DrillContextStrip` (Thème masqué avant réponse, score away, videau, retard).
 * - Compose `DrillChoicesGrid` (dés à jouer, 4 boutons A/B/C/D + bouton `[✓ Valider mon coup sur le plateau]`).
 * - Compose `DrillCoachFeedback` (Indice socratique au 1er essai, nuance à -0.010 EMG, 2 blocs si optimal, 3 blocs si erreur, tiroir 3-ply repliable).
 * - Strictement < 150 lignes, 0 `any` (GOVERNANCE.md & SCALABILITY.md).
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
    attemptsLeft?: number;
    fsrsScheduled?: boolean;
    pendingBoardNotation?: string | null;
    canConfirmBoardMove?: boolean;
    onConfirmBoardMove?: () => void;
    onNextBlunder: () => void;
    onSelectQuizChoice?: (notation: string) => void;
    onHoverQuizChoice?: (notation: string | null) => void;
    hoveredChoiceNotation?: string | null;
    drillMode?: 'adaptive' | 'pr_math' | 'personal_blunders' | 'speed_60s';
    currentMetricScore?: number;
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
    attemptsLeft = 2,
    fsrsScheduled = false,
    pendingBoardNotation = null,
    canConfirmBoardMove = false,
    onConfirmBoardMove,
    onNextBlunder,
    onSelectQuizChoice,
    onHoverQuizChoice,
    hoveredChoiceNotation = null,
    drillMode = 'adaptive',
    currentMetricScore = 6.3,
    ratingDelta = 0,
}) => {
    const isErMode = drillMode === 'pr_math';
    const erhScenario = useMemo(
        () => (!isErMode ? buildErhOpponentScenario(currentBlunder) : null),
        [currentBlunder, isErMode],
    );
    const isThemeRevealed =
        validationResult !== null && (validationResult.isCorrect || attemptsLeft <= 0);

    return (
        <section
            data-testid="drill-position-card"
            className="w-full h-full flex flex-col justify-between rounded-xl border border-white/10 bg-[#12151C]/95 p-2 sm:p-2.5 shadow-xl overflow-hidden"
        >
            <div className="flex-1 min-h-0 flex flex-col gap-1.5 overflow-hidden">
                {/* 1. Bandeau stratégique compact (1 seule ligne) */}
                <DrillContextStrip
                    currentBlunder={currentBlunder}
                    currentIndex={currentIndex}
                    totalBlunders={totalBlunders}
                    isErMode={isErMode}
                    showHint={showHint}
                    isRevealed={isThemeRevealed}
                    onToggleHint={onToggleHint}
                    onResetAttempt={onResetAttempt}
                />

                {/* En mode ERH uniquement (avant réponse) : Profil psychologique adverse concis */}
                {!isErMode && erhScenario && !validationResult && (
                    <div
                        data-testid="erh-opponent-scenario-card"
                        className="rounded-xl border border-[#D4AF37]/35 bg-[#16110b] px-2.5 py-1 text-[11px] text-amber-100 flex items-center justify-between gap-2 shrink-0"
                    >
                        <span className="truncate font-semibold text-[#f3c65f]">
                            🧠 {erhScenario.badgeLabel} — {erhScenario.psychologicalPrompt}
                        </span>
                    </div>
                )}

                {/* 2. Grille 2x2 des 4 coups A, B, C, D + Bouton [✓ Valider mon coup sur le plateau] */}
                {currentBlunder.quizChoices && currentBlunder.quizChoices.length > 0 && onSelectQuizChoice && (
                    <DrillChoicesGrid
                        choices={currentBlunder.quizChoices}
                        optimalMove={currentBlunder.optimalMove}
                        dice={currentBlunder.dice}
                        isErMode={isErMode}
                        validationResult={validationResult}
                        attemptsLeft={attemptsLeft}
                        pendingBoardNotation={pendingBoardNotation}
                        canConfirmBoardMove={canConfirmBoardMove}
                        onConfirmBoardMove={onConfirmBoardMove}
                        hoveredChoiceNotation={hoveredChoiceNotation}
                        onSelectQuizChoice={onSelectQuizChoice}
                        onHoverQuizChoice={onHoverQuizChoice}
                    />
                )}

                {showHint && currentBlunder.hint && !validationResult && (
                    <div
                        className="rounded-xl border border-[#D4AF37]/40 bg-[#180c06]/90 p-2 text-xs text-[#fdf8eb] leading-snug shrink-0"
                        data-testid="drill-hint-box"
                    >
                        <span className="font-bold text-[#f3c65f]">💡 Indice : </span>
                        {currentBlunder.hint}
                    </div>
                )}

                {/* 3. Panneau de Coaching Interactif (Socratique Essai 1/2 | Nuancé 3-ply | FSRS v5) */}
                {validationResult && (
                    <DrillCoachFeedback
                        currentBlunder={currentBlunder}
                        validationResult={validationResult}
                        isErMode={isErMode}
                        attemptsLeft={attemptsLeft}
                        currentMetricScore={currentMetricScore}
                        fsrsScheduled={fsrsScheduled}
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
