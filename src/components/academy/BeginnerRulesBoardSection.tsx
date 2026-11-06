'use client';

/**
 * @file src/components/academy/BeginnerRulesBoardSection.tsx
 * @description Studio du Plateau Interactif pour le parcours Débutant (< 160 lignes, 0 any, 0 emoji).
 */

import React from 'react';
import { Lightbulb, RotateCcw, Play } from 'lucide-react';
import MiniBoardDiagram from '../board/MiniBoardDiagram';
import type { BeginnerRuleLesson } from '../../features/academy/beginnerRulesCourse';
import type { InteractiveBoardMission } from './BeginnerCourseVideoPlayer';

export interface BeginnerRulesBoardSectionProps {
    readonly activeLesson: BeginnerRuleLesson;
    readonly mission: InteractiveBoardMission;
    readonly displayedBoard: ReadonlyArray<number>;
    readonly isBoardSimulated: boolean;
    readonly boardFeedback: string | null;
    readonly onToggleSimulation: () => void;
    readonly onPointClick: (point: number) => void;
}

export const BeginnerRulesBoardSection: React.FC<BeginnerRulesBoardSectionProps> = React.memo(({
    activeLesson,
    mission,
    displayedBoard,
    isBoardSimulated,
    boardFeedback,
    onToggleSimulation,
    onPointClick,
}) => {
    return (
        <div className="rounded-2xl border border-amber-400/25 bg-[#080c15]/90 p-4 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-amber-200">
                <span>Plateau Interactif</span>
                <div className="flex items-center gap-1.5">
                    <span className="rounded bg-amber-500/20 px-2 py-0.5 font-mono text-[11px] text-amber-300">
                        Dés : {activeLesson.dice[0]}-{activeLesson.dice[1]}
                    </span>
                    <button
                        type="button"
                        data-testid="beginner-board-sim-toggle-btn"
                        onClick={onToggleSimulation}
                        className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-0.5 text-[11px] font-extrabold transition ${
                            isBoardSimulated
                                ? 'border-emerald-400/70 bg-emerald-950/80 text-emerald-200'
                                : 'border-amber-400/60 bg-amber-500/20 text-amber-200 hover:bg-amber-500/30'
                        }`}
                    >
                        {isBoardSimulated ? <RotateCcw className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                        <span>{isBoardSimulated ? 'Position avant' : 'Jouer sur le plateau'}</span>
                    </button>
                </div>
            </div>

            <MiniBoardDiagram
                board={displayedBoard}
                dice={[activeLesson.dice[0], activeLesson.dice[1]]}
                turn="X"
                optimalMove={mission.optimalMove}
                hideOptimalArrow={isBoardSimulated}
                highlightedPoints={mission.highlightedPoints}
                onPointClick={onPointClick}
            />

            <div
                data-testid="beginner-board-interactive-feedback"
                className={`rounded-xl border px-3 py-2 text-xs leading-relaxed transition ${
                    boardFeedback
                        ? 'border-emerald-400/50 bg-emerald-950/50 text-emerald-100 font-semibold'
                        : 'border-amber-400/30 bg-amber-950/30 text-amber-200'
                }`}
            >
                {boardFeedback ?? mission.prompt}
            </div>

            <div className="flex items-start gap-1.5 text-xs leading-relaxed text-slate-300 italic">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>{activeLesson.visualCaption}</span>
            </div>
        </div>
    );
});

BeginnerRulesBoardSection.displayName = 'BeginnerRulesBoardSection';

