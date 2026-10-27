'use client';

/**
 * Composant principal `DailyPuzzleScreen` — Puzzle du Jour, Streaks, Validation Open Sage 3T & FSRS.
 * Extrait hors de `app/daily-puzzle/page.tsx` pour respecter le contrat de typage Next.js 15 App Router.
 */

import React from 'react';
import DailyPuzzleHeader from './DailyPuzzleHeader';
import DailyPuzzleBoard from './DailyPuzzleBoard';
import DailyPuzzleVerdict from './DailyPuzzleVerdict';
import DailyPuzzleDebrief from './DailyPuzzleDebrief';
import { useDailyPuzzle, type UseDailyPuzzleOptions } from '../../hooks/useDailyPuzzle';

export interface DailyPuzzlePageProps extends UseDailyPuzzleOptions {}

export function DailyPuzzleScreen(props: DailyPuzzlePageProps) {
    const state = useDailyPuzzle(props);

    return (
        <div
            data-testid="daily-puzzle-screen"
            className="w-full max-w-6xl space-y-2 animate-fade-in"
        >
            <DailyPuzzleHeader
                puzzle={state.puzzle}
                catalog={state.catalog}
                utcDateString={state.utcDateString}
                utcCountdown={state.utcCountdown}
                matchScoreLabel={state.matchScoreLabel}
                profile={state.profile}
                ratingDelta={state.ratingDelta}
                hintLevel={state.hintLevel}
                xpPreview={state.xpPreview}
                isReplayingIntro={state.isReplayingIntro}
                onSelectPuzzle={state.selectPuzzleById}
                onReplayIntro={state.triggerIntroReplay}
            />

            <DailyPuzzleVerdict
                verdict={state.verdict}
                fsrsScheduledEntry={state.fsrsScheduledEntry}
                onRetry={state.handleResetAttempt}
                onOpenDebrief={state.openDebrief}
            />

            <DailyPuzzleBoard
                puzzle={state.puzzle}
                boardState={state.boardState}
                isReplayingIntro={state.isReplayingIntro}
                playedMoves={state.playedMoves}
                usedDice={state.usedDice}
                selectedPoint={state.selectedPoint}
                selectedDie={state.selectedDie}
                leftDieTargets={state.leftDieTargets}
                rightDieTargets={state.rightDieTargets}
                hintLevel={state.hintLevel}
                highlightedHintSources={state.highlightedHintSources}
                showDebrief={state.showDebrief}
                isSolved={Boolean(state.verdict?.isSolved)}
                onSkipIntro={state.skipIntroReplay}
                onCheckerClick={state.handleCheckerClick}
                onDestinationClick={state.handleDestinationClick}
                onPlayMove={state.handlePlayMove}
                onSelectDie={state.handleSelectDie}
                onDeselect={state.handleDeselect}
                onUndoLastMove={state.handleUndoLastMove}
                onResetAttempt={state.handleResetAttempt}
                onUnlockNextHint={state.unlockNextHint}
                onSubmitCheckerSolution={() => {
                    void state.submitCheckerSolution();
                }}
                onSubmitCubeDecision={(action) => {
                    void state.submitCubeDecision(action);
                }}
            />

            <DailyPuzzleDebrief
                puzzle={state.puzzle}
                verdict={state.verdict}
                showDebrief={state.showDebrief}
                fsrsScheduledEntry={state.fsrsScheduledEntry}
            />
        </div>
    );
}

export default DailyPuzzleScreen;
