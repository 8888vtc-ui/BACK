/**
 * @file src/features/coach/ruleBasedExplanation.ts
 * @description Générateur d'explication heuristique de repli sans appel LLM (mode offline / secours).
 * Intègre le Schéma d'Audit Symbolique en Deux Temps (`symbolic_audit` + `pedagogical_explanation`),
 * les Proverbes de Michy, la règle de Magriel, le compte EPC de Trice et la dissociation de Zare.
 */

import { buildMatchContext } from './matchContext';
import { buildCubeRuleBasedExplanation, localizeOfflineExplanation } from './coachMultiLangPrompts';
import { getTheoryConceptById } from '../knowledge/knowledgeBaseData';
import { buildNeuroSymbolicAudit } from '../../lib/coach/symbolicAudit';
import { buildMichyMagrielWoolseySynthesis } from '../../lib/coach/prompts';
import { evaluateTacticalMotif } from './ruleBasedTacticsEvaluator';
import type { CoachPromptParams, CoachStructuredResponse } from './prompts';

export function generateRuleBasedExplanation(params: CoachPromptParams): CoachStructuredResponse {
    const {
        verdict = 'doubtful',
        equityLoss: rawEquityLoss,
        playedMove = 'Coup joué',
        optimalMove = 'Coup optimal',
        features,
        matchContext,
        language = 'fr',
    } = params;

    const defaultLoss = verdict === 'optimal' || playedMove === optimalMove ? 0 : -0.05;
    const absLoss = Math.abs(rawEquityLoss ?? defaultLoss);
    const equityLoss = absLoss < 0.0005 ? 0 : -absLoss;

    const cubeExplanationResult = buildCubeRuleBasedExplanation({ ...params, equityLoss });
    if (cubeExplanationResult) return cubeExplanationResult;

    const isEn = language === 'en';
    const diff = features?.pipCountDiff ?? { player: 150, opponent: 150, leader: 'tie', diff: 0 };
    const player = features?.player ?? 'X';
    const userBlots = features?.blotsAndShots?.user ?? [];
    const bestBlots = features?.blotsAndShots?.best ?? [];

    const userShots =
        userBlots.length === 0
            ? 0
            : features?.shotExposure?.user.totalRolls ?? Math.min(36, userBlots.reduce((acc, b) => acc + b.totalShots, 0));
    const bestShots =
        bestBlots.length === 0
            ? 0
            : features?.shotExposure?.best.totalRolls ?? Math.min(36, bestBlots.reduce((acc, b) => acc + b.totalShots, 0));

    const board = features?.boardStructure ?? {
        innerBoardPoints: 2, advancedAnchor: false, goldenPoint: false, barPoint: false, longestPrime: 2,
    };
    const beforeBoard = features?.beforeBoardStructure;
    const bestBoard = features?.bestBoardStructure;
    const tacDiff = features?.tacticalDiff;
    const tacDelta = features?.tacticalDelta;
    const contactStatus = features?.contactStatus ?? 'contact';

    const tactical = evaluateTacticalMotif(params, equityLoss);
    let { summary, keyConcept, advice, whyFailed, whyOptimal, conceptId } = tactical;

    let explanation = `${whyFailed} ${whyOptimal}`;
    const isOptimalVerdict = verdict === 'optimal' || playedMove === optimalMove || absLoss < 0.001;

    if (!isOptimalVerdict && features) {
        const userBlotPts = userBlots.map((b) => b.point).slice(0, 4);
        const bestBlotPts = bestBlots.map((b) => b.point).slice(0, 4);
        const uInner = board.innerBoardPoints;
        const bInner = bestBoard?.innerBoardPoints ?? uInner;
        const uPrime = board.longestPrime;
        const bPrime = bestBoard?.longestPrime ?? uPrime;

        if (userBlotPts.length > 0 && !/flèche|point\s+\d/i.test(whyFailed)) {
            const ptsLabel = isEn
                ? `point${userBlotPts.length > 1 ? 's' : ''} ${userBlotPts.join(', ')}`
                : `flèche${userBlotPts.length > 1 ? 's' : ''} ${userBlotPts.join(', ')}`;
            whyFailed = `${whyFailed.replace(/\.$/, '')} (${isEn ? `exposed blot(s) on ${ptsLabel}` : `pion(s) isolé(s) sur ${ptsLabel}`}).`;
        }
        const optDetails: string[] = [];
        if (bInner > uInner) optDetails.push(isEn ? `${bInner} home-board gates closed vs ${uInner}` : `${bInner} portes intérieures fermées contre ${uInner}`);
        if (bPrime > uPrime && bPrime >= 3) optDetails.push(isEn ? `${bPrime}-point consecutive prime vs ${uPrime}` : `barrage de ${bPrime} portes consécutives contre ${uPrime}`);
        if (userBlots.length > bestBlots.length) {
            optDetails.push(
                isEn
                    ? `reduces loose blots from ${userBlots.length} to ${bestBlots.length}${bestBlotPts.length > 0 ? ` (pt ${bestBlotPts.join(', ')})` : ''}`
                    : `réduit vos pions isolés de ${userBlots.length} à ${bestBlots.length}`,
            );
        }
        if (optDetails.length > 0) whyOptimal = `${whyOptimal.replace(/\.$/, '')} [${optDetails.join(' · ')}].`;
        explanation = `${whyFailed} ${whyOptimal}`;
    }

    if (isOptimalVerdict) {
        whyFailed = '';
        summary = isEn
            ? `Optimal play ✅: ${optimalMove} is the #1 engine line (ΔEq ${equityLoss.toFixed(3)}, ${bestShots}/36 shots, race ${diff.player}/${diff.opponent} pips).`
            : `Coup optimal ✅ : ${optimalMove} est la ligne n°1 du moteur (ΔEq ${equityLoss.toFixed(3)}, ${bestShots}/36 tirs, course ${diff.player}/${diff.opponent} pips).`;
        explanation = whyOptimal;
    }

    if (features?.bgsage?.optimalMetrics && features?.bgsage?.playedMetrics) {
        const opt = features.bgsage.optimalMetrics;
        const pld = features.bgsage.playedMetrics;
        const winDrop = ((opt.winProb - pld.winProb) * 100).toFixed(1);
        const plan = features.bgsage.playerGamePlan;
        explanation += isOptimalVerdict
            ? isEn
                ? ` (Monte-Carlo ${features.bgsage.evalLevel}: Win ${(opt.winProb * 100).toFixed(1)}%, Gammon ${(opt.winGammonProb * 100).toFixed(1)}%, plan: ${plan}).`
                : ` (Monte-Carlo ${features.bgsage.evalLevel} : Gain ${(opt.winProb * 100).toFixed(1)}%, Gammon ${(opt.winGammonProb * 100).toFixed(1)}%, plan : ${plan}).`
            : isEn
              ? ` (Monte-Carlo ${features.bgsage.evalLevel}: Win probability drops by ${winDrop}% [${(opt.winProb * 100).toFixed(1)}% → ${(pld.winProb * 100).toFixed(1)}%], plan: ${plan}).`
              : ` (Monte-Carlo ${features.bgsage.evalLevel} : vos chances de gain chutent de ${winDrop}% [${(opt.winProb * 100).toFixed(1)}% → ${(pld.winProb * 100).toFixed(1)}%], plan : ${plan}).`;
    } else {
        explanation += isEn
            ? ` [Metrics: ΔEq ${equityLoss.toFixed(3)} | Shots: ${userShots}/36 vs ${bestShots}/36 | Pips: ${diff.player} vs ${diff.opponent}].`
            : ` [Métriques : ΔEq ${equityLoss.toFixed(3)} | Tirs : ${userShots}/36 vs ${bestShots}/36 | Pips : ${diff.player} vs ${diff.opponent}].`;
    }

    if (features?.marketWindow?.inMarketWindow && features.marketWindow.volatility === 'high') {
        const mw = features.marketWindow;
        explanation += isEn
            ? ` [Market Window: High volatility (~${mw.estimatedMarketLosers}/36 market losers, cash point ${(mw.cashPoint * 100).toFixed(1)}%)].`
            : ` [Fenêtre de marché : Volatilité élevée (~${mw.estimatedMarketLosers}/36 séquences de perte de marché, cash point ${(mw.cashPoint * 100).toFixed(1)}%)].`;
        if (conceptId === 'pure-play') conceptId = 'market-loss';
    }

    const theoryEntry = getTheoryConceptById(conceptId);
    if (theoryEntry) {
        const langKey: 'fr' | 'en' = isEn ? 'en' : 'fr';
        const formulaNote = theoryEntry.formulaOrRule?.formula ? ` [${theoryEntry.formulaOrRule.name}: ${theoryEntry.formulaOrRule.formula}]` : '';
        explanation += isEn
            ? `\n\n📚 Theory (${theoryEntry.title[langKey]} — ${theoryEntry.author}): ${theoryEntry.keyTakeaway[langKey]}${formulaNote}`
            : `\n\n📚 Théorie (${theoryEntry.title[langKey]} — ${theoryEntry.author}) : ${theoryEntry.keyTakeaway[langKey]}${formulaNote}`;
    }

    if (matchContext) {
        const ctx = buildMatchContext(matchContext);
        if (ctx.isDMP) explanation += isEn ? `\n\n🎯 DMP Context: 1 point to win, gammons do not count.` : `\n\n🎯 Contexte DMP : À 1 point de la victoire, les gammons ne comptent pas.`;
        else if (ctx.crawford) explanation += isEn ? `\n\n🛡️ Crawford Rule: Doubling cube is frozen.` : `\n\n🛡️ Règle de Crawford : Videau gelé pour cette manche.`;
        else if (ctx.gammonPrice && ctx.gammonPrice.X > 0.6) {
            explanation += isEn
                ? `\n\n⚠️ Match Context: High gammon price (${(ctx.gammonPrice.X * 100).toFixed(0)}%). Extreme safety required.`
                : `\n\n⚠️ Contexte de match : Prix du gammon très élevé (${(ctx.gammonPrice.X * 100).toFixed(0)}%). Prudence maximale.`;
        }
    }

    const grandmasterSynthesis = buildMichyMagrielWoolseySynthesis({
        optimalMove, playerPips: diff.player, opponentPips: diff.opponent, equityLoss: Math.abs(equityLoss),
        directShotsConceded: userShots, gamePhase: contactStatus === 'pureRace' ? 'race' : 'contact',
        primeLength: board.longestPrime, homeBoardPointsMade: board.innerBoardPoints, concepts: [conceptId], isEn,
    });
    explanation += `\n\n${grandmasterSynthesis}`;

    const neuroSymbolic = buildNeuroSymbolicAudit({
        playerPipCount: diff.player, opponentPipCount: diff.opponent, directShotsBefore: bestShots, directShotsAfter: userShots,
        equityLoss: Math.abs(equityLoss), bestMoveNotation: optimalMove, playedMoveNotation: playedMove, conceptId,
        archetype: features?.bgsage?.playerGamePlan, gamePhase: contactStatus === 'pureRace' ? 'race' : 'contact',
        primeLength: board.longestPrime, bestPrimeLength: bestBoard?.longestPrime ?? board.longestPrime,
        homeBoardPointsMade: board.innerBoardPoints, bestHomeBoardPoints: bestBoard?.innerBoardPoints ?? board.innerBoardPoints,
        blotsLeft: userBlots.length, bestBlotsLeft: bestBlots.length,
        userBlotPoints: userBlots.map((b) => b.point), bestBlotPoints: bestBlots.map((b) => b.point),
        locale: isEn ? 'en' : 'fr',
    });

    const baseResult: CoachStructuredResponse = {
        verdict, summary, explanation, keyConcept, advice, whyFailed, whyOptimal, conceptId,
        symbolic_audit: neuroSymbolic.symbolic_audit, pedagogical_explanation: neuroSymbolic.pedagogical_explanation,
    };

    return language !== 'fr' && language !== 'en' ? localizeOfflineExplanation(baseResult, params) : baseResult;
}

export function generateTenDistinctCommentariesForMove(params: CoachPromptParams): ReadonlyArray<CoachStructuredResponse> {
    return Array.from({ length: 10 }, (_, v) => generateRuleBasedExplanation({ ...params, variantIndex: v }));
}
