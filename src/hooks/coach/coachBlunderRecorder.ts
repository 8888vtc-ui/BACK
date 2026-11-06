/**
 * @file src/hooks/coach/coachBlunderRecorder.ts
 * @description Enregistrement d'erreurs et décisions sur le profil adaptatif et dans le Carnet de Blunders Personnels (<= 175 lignes, 0 any).
 * Loi 1 & Loi 2 : Coupe tout enregistrement de blunder si `!checkIsPlayerRegistered()` (Invité),
 * et utilise le vrai contexte de match (Adversaire, Elo, Score, Tour, Date) pour un Compte Connecté.
 */
import { pipCount, serializeCanonicalXGID, type BoardState } from '../../engine/backgammonEngine';
import { recordBlunder } from '../../features/drills/blunderBank';
import { classifyLivePositionCategory, recordLiveMatchDecisionOnAdaptiveProfile } from '../../features/drills/adaptiveQuizEngine';
import { evaluateBrilliantMoveCriteria } from '../../features/coach/tacticalExplainer';
import { recordPersonalMatchBlunder, type PersonalBlunderCandidate } from '../../lib/blunders/personalBlunderStore';
import { checkIsPlayerRegistered } from '../useAuthenticPlayerStats';
import { readPlayerPassport } from '../../lib/supabase/auth';
import { getBotPersona } from '../../features/personas/botPersonas';
import type { AIDifficulty } from '../useBackgammonGame';
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
    gameState?: BoardState;
    difficulty?: AIDifficulty | string;
    opponentName?: string;
    opponentElo?: number | null;
    userId?: string;
    recordDecisionStats: (verdict: CoachVerdict, rawEquityLoss: number, playedMove: string, optimalMove: string) => void;
    setBrilliantMove: (brilliant: boolean) => void;
    isStale: () => boolean;
}): void {
    const {
        lastEntry, result, coachState, playedNotation, verdict, equityLoss,
        gameState, recordDecisionStats, setBrilliantMove, isStale,
    } = params;
    const rawDiff = params.difficulty ?? 'expert';
    const difficulty: AIDifficulty =
        rawDiff === 'beginner' || rawDiff === 'intermediate' || rawDiff === 'expert' || rawDiff === 'grandmaster'
            ? rawDiff
            : 'expert';
    recordDecisionStats(verdict, equityLoss, playedNotation, result.optimalNotation);

    const secondBest = result.candidateMoves[1];
    const uniquenessDelta = secondBest !== undefined ? Math.abs(secondBest.equityLoss) : 0;
    const isBrilliant = evaluateBrilliantMoveCriteria({
        equityLossEmg: Math.abs(equityLoss),
        secondBestGapEmg: uniquenessDelta,
        slottedKeyPointNaked: uniquenessDelta > 0.045 || playedNotation.includes('*'),
    });
    if (!isStale()) setBrilliantMove(isBrilliant);

    // LOI 1 : En navigateur, un Joueur Invité (`!checkIsPlayerRegistered()`) n'enregistre AUCUN blunder ni historique.
    if (typeof window !== 'undefined' && !checkIsPlayerRegistered() && !params.userId) return;

    const liveOutcome = recordLiveMatchDecisionOnAdaptiveProfile({
        board: lastEntry.boardBefore, turnIndex: lastEntry.turnIndex, equityLoss, isCube: false,
    });

    const absLoss = Math.abs(equityLoss);
    if (verdict === 'blunder' || absLoss >= 0.05) {
        try {
            const passport = typeof window !== 'undefined' ? readPlayerPassport() : null;
            const resolvedUserId = params.userId || passport?.pseudo || passport?.email || 'connected_member';
            const persona = getBotPersona(difficulty, 'fr');
            const resolvedOpponentName = params.opponentName || persona.name;
            const resolvedOpponentElo = params.opponentElo !== undefined ? params.opponentElo : 1500;

            const ctx = lastEntry.packet?.matchContext;
            const matchLength = gameState?.matchLength ?? ctx?.matchLength ?? 5;
            const scoreX = gameState?.scoreX ?? ctx?.scoreX ?? 0;
            const scoreO = gameState?.scoreO ?? ctx?.scoreO ?? 0;
            const cubeValue = gameState?.cubeValue ?? ctx?.cubeValue ?? 1;
            const cubeOwner = gameState?.cubeOwner !== undefined ? gameState.cubeOwner : (ctx?.cubeOwner ?? null);
            const isCrawford = gameState?.crawford ?? ctx?.crawford ?? false;

            const catMeta = classifyLivePositionCategory(lastEntry.boardBefore, lastEntry.turnIndex, false);
            const choiceSet = new Set<string>();
            if (result.optimalNotation) choiceSet.add(result.optimalNotation);
            if (playedNotation) choiceSet.add(playedNotation);
            for (const cand of result.candidateMoves) {
                if (cand.notation) choiceSet.add(cand.notation);
                if (choiceSet.size >= 4) break;
            }
            const quizChoices = Array.from(choiceSet).slice(0, 4);
            const whyFailedFr = coachState.whyFailed || `En jouant ${playedNotation}, vous cédez -${absLoss.toFixed(3)} EMG face à ${resolvedOpponentName}.`;
            const solutionFr = coachState.whyOptimal || coachState.explanation || `Le coup optimal 3-ply était ${result.optimalNotation} (gain de +${absLoss.toFixed(3)} EMG par rapport à ${playedNotation}).`;

            recordBlunder({
                id: `user_blunder_${lastEntry.turnIndex}_${Date.now()}`,
                board: [...lastEntry.boardBefore], dice: [lastEntry.dice[0], lastEntry.dice[1]], player: 'X',
                playedMove: playedNotation, optimalMove: result.optimalNotation,
                acceptableMoves: result.candidateMoves.filter((m) => Math.abs(m.equityLoss) < 0.02).map((m) => m.notation),
                equityLoss: absLoss, verdict: absLoss >= 0.20 ? 'howler' : absLoss >= 0.08 ? 'blunder' : 'doubtful',
                tier: liveOutcome.categoryState.level, conceptId: catMeta.id, conceptName: catMeta.fullName,
                whyFailed: whyFailedFr, explanation: solutionFr,
                hint: `Catégorie ciblée : ${catMeta.fullName} — cherchez comment ${result.optimalNotation} protège votre structure.`,
                quizChoices, matchContext: { matchLength, scoreX, scoreO, cubeValue, cubeOwner, crawford: isCrawford },
            });

            const pips = pipCount([...lastEntry.boardBefore]);
            const xgid = serializeCanonicalXGID({
                board: [...lastEntry.boardBefore], turn: lastEntry.player, cubeValue, cubeOwner,
                dice: [lastEntry.dice[0], lastEntry.dice[1]], matchLength, scoreX, scoreO, crawford: isCrawford, doubled: false, resigned: 0,
            });

            const bestCand = result.candidateMoves[0];
            const bestWinPct = Number(((bestCand?.winProbability ?? 0.568) * 100).toFixed(1));
            const winLossPct = Number(Math.max(1.5, Math.min(35.0, absLoss * 74.0)).toFixed(1));
            const playedWinPct = Number(Math.max(5.0, bestWinPct - winLossPct).toFixed(1));

            const candidatesTop4: PersonalBlunderCandidate[] = quizChoices.map((notation, idx) => {
                const matchCand = result.candidateMoves.find((c) => c.notation === notation);
                const cLoss = matchCand ? -Number(Math.abs(matchCand.equityLoss).toFixed(3)) : notation === result.optimalNotation ? 0 : -Number(absLoss.toFixed(3));
                const cWin = matchCand?.winProbability ? Number((matchCand.winProbability * 100).toFixed(1)) : notation === result.optimalNotation ? bestWinPct : playedWinPct;
                const cGammon = matchCand?.gammonProbability ? Number((matchCand.gammonProbability * 100).toFixed(1)) : 14.2;
                return {
                    rank: idx + 1, notation, winProbPct: cWin, gammonProbPct: cGammon,
                    equityEmg: Number((matchCand?.equity ?? result.bestEquity + cLoss).toFixed(3)), lossEmg: cLoss,
                    isPlayerPlayedMove: notation === playedNotation, isOptimalMove: notation === result.optimalNotation,
                };
            });

            recordPersonalMatchBlunder({
                userId: resolvedUserId, opponentName: resolvedOpponentName, opponentElo: resolvedOpponentElo,
                matchFormatLabel: matchLength > 0 ? `Match en ${matchLength} pts` : 'Money Game', matchLength,
                scoreBeforeMove: { player: scoreX, opponent: scoreO }, isCrawford, turnNumber: lastEntry.turnIndex,
                decisionType: 'CHECKER_PLAY', board: [...lastEntry.boardBefore], player: lastEntry.player, xgid,
                dice: [lastEntry.dice[0], lastEntry.dice[1]], cubeValue, cubeOwner,
                pipCount: { player: pips.X, opponent: pips.O }, conceptId: catMeta.id,
                conceptNameFr: catMeta.fullName, conceptNameEn: catMeta.shortLabel,
                playerPlayedMove: playedNotation, playerWinProbPct: playedWinPct,
                optimalMove: result.optimalNotation, optimalWinProbPct: bestWinPct, winProbLossPct: winLossPct,
                deltaEmg: -Number(absLoss.toFixed(3)), erPenaltyPoints: Number(Math.min(0.5, Math.max(0.2, absLoss * 4.2)).toFixed(1)),
                candidatesTop4, mistakeExplanationFr: whyFailedFr,
                mistakeExplanationEn: `Playing ${playedNotation} loses -${absLoss.toFixed(3)} EMG (-${winLossPct}% win chances) against ${resolvedOpponentName}.`,
                solutionExplanationFr: solutionFr,
                solutionExplanationEn: `The 3-ply optimal move ${result.optimalNotation} preserves ${bestWinPct}% winning chances and protects your structure.`,
            });
        } catch { /* ignore storage errors */ }
    }
}
