/**
 * @file src/hooks/coach/coachBlunderRecorder.ts
 * @description Enregistrement d'erreurs et décisions sur le profil adaptatif (< 90 lignes, 0 any).
 */
import { recordBlunder } from '../../features/drills/blunderBank';
import {
    classifyLivePositionCategory,
    recordLiveMatchDecisionOnAdaptiveProfile,
} from '../../features/drills/adaptiveQuizEngine';
import { evaluateBrilliantMoveCriteria } from '../../features/coach/tacticalExplainer';
import type { CoachVerdict, HumanMoveAnalysis } from '../../features/coach/logAnalyzer';
import type { MatchLogEntry } from '../../actions/types';
import type { CoachState } from '../useCoachHelpers';

export function handleBlunderAndDecisionRecording(params: {
    lastEntry: MatchLogEntry;
    result: HumanMoveAnalysis;
    coachState: CoachState;
    playedNotation: string;
    verdict: CoachVerdict;
    equityLoss: number;
    recordDecisionStats: (verdict: CoachVerdict, rawEquityLoss: number, playedMove: string, optimalMove: string) => void;
    setBrilliantMove: (brilliant: boolean) => void;
    isStale: () => boolean;
}): void {
    const {
        lastEntry, result, coachState, playedNotation, verdict, equityLoss,
        recordDecisionStats, setBrilliantMove, isStale,
    } = params;
    recordDecisionStats(verdict, equityLoss, playedNotation, result.optimalNotation);
    const liveOutcome = recordLiveMatchDecisionOnAdaptiveProfile({
        board: lastEntry.boardBefore,
        turnIndex: lastEntry.turnIndex,
        equityLoss,
        isCube: false,
    });
    const secondBest = result.candidateMoves[1];
    const uniquenessDelta = secondBest !== undefined ? Math.abs(secondBest.equityLoss) : 0;
    const isBrilliant = evaluateBrilliantMoveCriteria({
        equityLossEmg: Math.abs(equityLoss),
        secondBestGapEmg: uniquenessDelta,
        slottedKeyPointNaked: uniquenessDelta > 0.045 || playedNotation.includes('*'),
    });
    if (!isStale()) setBrilliantMove(isBrilliant);
    if (verdict === 'blunder' || Math.abs(equityLoss) >= 0.06) {
        try {
            const catMeta = classifyLivePositionCategory(lastEntry.boardBefore, lastEntry.turnIndex, false);
            const choiceSet = new Set<string>();
            if (result.optimalNotation) choiceSet.add(result.optimalNotation);
            if (playedNotation) choiceSet.add(playedNotation);
            for (const cand of result.candidateMoves) {
                if (cand.notation) choiceSet.add(cand.notation);
                if (choiceSet.size >= 4) break;
            }
            recordBlunder({
                id: `user_blunder_${lastEntry.turnIndex}_${Date.now()}`,
                board: [...lastEntry.boardBefore],
                dice: [lastEntry.dice[0], lastEntry.dice[1]],
                player: 'X',
                playedMove: playedNotation,
                optimalMove: result.optimalNotation,
                acceptableMoves: result.candidateMoves
                    .filter((m) => Math.abs(m.equityLoss) < 0.02)
                    .map((m) => m.notation),
                equityLoss: Math.abs(equityLoss),
                verdict: Math.abs(equityLoss) >= 0.20 ? 'howler' : Math.abs(equityLoss) >= 0.08 ? 'blunder' : 'doubtful',
                tier: liveOutcome.categoryState.level,
                conceptId: catMeta.id,
                conceptName: catMeta.fullName,
                whyFailed: coachState.whyFailed || `Votre coup ${playedNotation} cède ${Math.abs(equityLoss).toFixed(3)} EMG.`,
                explanation:
                    coachState.whyOptimal ||
                    coachState.explanation ||
                    `Le coup optimal était ${result.optimalNotation} (perte de ${Math.abs(equityLoss).toFixed(3)} EMG sur ${playedNotation}).`,
                hint: `Catégorie ciblée : ${catMeta.fullName} — cherchez comment ${result.optimalNotation} protège votre structure.`,
                quizChoices: Array.from(choiceSet).slice(0, 4),
            });
        } catch { /* ignore storage errors */ }
    }
}

