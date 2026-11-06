/**
 * @file src/features/coach/ruleBasedTacticsEvaluator.ts
 * @description Évaluation heuristique des motifs tactiques (Shot Exposure, Golden Point, Bar Point, etc.) (< 200 lignes, 0 any).
 */

import { pickVariedCheckerErrorCopy, type VariedCheckerCategory } from './coachVariedMessagesBank';
import type { CoachPromptParams } from './prompts';

export interface TacticalEvaluationResult {
    summary: string;
    keyConcept: string;
    advice: string;
    whyFailed: string;
    whyOptimal: string;
    conceptId: string;
}

export function moveNotationCreatesGateOnPoint(moveNotation: string, targetPoints: number[]): boolean {
    if (!moveNotation || !moveNotation.includes('/')) return false;
    const arrivals = new Map<number, number>();
    const tokenRegex = /\b(?:\d+|bar)\/(\d+)\*?(?:\((\d+)\))?/gi;
    let match: RegExpExecArray | null;
    while ((match = tokenRegex.exec(moveNotation)) !== null) {
        const dest = Number(match[1]);
        const count = match[2] ? Number(match[2]) : 1;
        arrivals.set(dest, (arrivals.get(dest) ?? 0) + count);
    }
    return targetPoints.some((pt) => (arrivals.get(pt) ?? 0) >= 2);
}

export function evaluateTacticalMotif(params: CoachPromptParams, equityLoss: number): TacticalEvaluationResult {
    const {
        verdict = 'doubtful',
        playedMove = 'Coup joué',
        optimalMove = 'Coup optimal',
        features,
        language = 'fr',
    } = params;

    const isEn = language === 'en';
    const diff = features?.pipCountDiff ?? { player: 150, opponent: 150, leader: 'tie', diff: 0 };
    const player = features?.player ?? 'X';
    const userBlots = features?.blotsAndShots?.user ?? [];
    const bestBlots = features?.blotsAndShots?.best ?? [];

    const userShots = userBlots.length === 0
        ? 0
        : features?.shotExposure?.user.totalRolls ?? Math.min(36, userBlots.reduce((acc, b) => acc + b.totalShots, 0));
    const bestShots = bestBlots.length === 0
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

    let summary = isEn
        ? `Your move ${playedMove} is a ${verdict} (-${Math.abs(equityLoss).toFixed(3)} equity) compared to ${optimalMove}.`
        : `Votre coup ${playedMove} est ${verdict} (-${Math.abs(equityLoss).toFixed(3)} d'équité) par rapport à ${optimalMove}.`;
    let keyConcept = isEn ? 'Safety & Structure' : 'Sécurité & Structure';
    let advice = isEn
        ? 'Always assess the number of opponent shots conceded before dispersing your checkers.'
        : 'Évaluez toujours le nombre de tirs concédés avant de disperser vos pions.';
    let whyFailed = '';
    let whyOptimal = '';
    let conceptId = 'pure-play';

    const goldenTargetPts = player === 'X' ? [5] : [20];
    const barTargetPts = player === 'X' ? [7] : [18];
    const homeGateTargetPts = player === 'X' ? [1, 2, 3, 4, 6] : [19, 21, 22, 23, 24];

    const goldenPointCreated = tacDiff
        ? tacDiff.goldenPointCreatedByBest
        : bestBoard
          ? bestBoard.goldenPoint && !board.goldenPoint && !beforeBoard?.goldenPoint
          : moveNotationCreatesGateOnPoint(optimalMove, goldenTargetPts);

    const barPointCreated = tacDiff
        ? tacDiff.barPointCreatedByBest
        : bestBoard
          ? bestBoard.barPoint && !board.barPoint && !beforeBoard?.barPoint
          : moveNotationCreatesGateOnPoint(optimalMove, barTargetPts);

    const homeGateCreated = tacDiff
        ? tacDiff.homeGateCreatedByBest
        : bestBoard
          ? bestBoard.innerBoardPoints > board.innerBoardPoints && bestBoard.innerBoardPoints > (beforeBoard?.innerBoardPoints ?? 0)
          : moveNotationCreatesGateOnPoint(optimalMove, homeGateTargetPts);

    const primeExtended = tacDiff
        ? tacDiff.primeExtendedByBest
        : bestBoard
          ? bestBoard.longestPrime >= 4 && bestBoard.longestPrime > board.longestPrime
          : board.longestPrime >= 4 && !beforeBoard;

    const hitMadeByBest = tacDiff
        ? tacDiff.hitMadeByBest
        : (tacDelta?.bestOpponentHitCount ?? 0) > (tacDelta?.userOpponentHitCount ?? 0);

    const anchorCreatedOrKept = tacDiff
        ? tacDiff.anchorCreatedOrKeptByBest
        : bestBoard
          ? bestBoard.advancedAnchor && !board.advancedAnchor
          : false;

    const rearCheckerEscaped = tacDiff
        ? tacDiff.rearCheckerEscapedByBest
        : /\b(?:24|23)\/(?:18|17|16|15|14|13)\b|\b(?:1|2)\/(?:7|8|9|10|11|12)\b/.test(optimalMove) &&
          !/\b(?:24|23)\/(?:18|17|16|15|14|13)\b|\b(?:1|2)\/(?:7|8|9|10|11|12)\b/.test(playedMove);

    const contactBrokenInEndgame = tacDiff ? tacDiff.contactBrokenByBest : false;
    const primeLen = bestBoard?.longestPrime ?? board.longestPrime;
    const copyCtx = {
        playedMove, optimalMove, equityLoss, userShots, bestShots,
        playerPips: diff.player, opponentPips: diff.opponent,
        primeLength: primeLen, blotsCount: userBlots.length, seedExtra: params.variantIndex,
    };

    const applyFrCopy = (cat: VariedCheckerCategory) => {
        const varied = pickVariedCheckerErrorCopy(cat, copyCtx);
        summary = varied.summary;
        whyFailed = varied.whyFailed;
        whyOptimal = varied.whyOptimal;
        advice = varied.advice;
    };

    if (userShots > bestShots && userBlots.length > 0) {
        if (isEn) {
            summary = `The move concedes ${userShots} direct shots compared to only ${bestShots} for the best move.`;
            whyFailed = `By playing ${playedMove}, you leave a vulnerable blot giving the opponent ${userShots} rolls out of 36 to hit.`;
            whyOptimal = `The optimal move ${optimalMove} reduces this exposure to ${bestShots} shots while securing structure.`;
            advice = 'When your opponent has a strong home board, every blot left is a major gammon risk.';
        } else applyFrCopy('SHOT_EXPOSURE');
        keyConcept = isEn ? 'Shot Minimization' : 'Minimisation des tirs';
        conceptId = 'duplication';
    } else if (goldenPointCreated) {
        if (isEn) {
            summary = `The 5-point (Golden Point) is the single most valuable strategic point on the entire backgammon board.`;
            whyFailed = `Playing ${playedMove} completely misses securing the master 5-point, leaving an uncoordinated structure.`;
            whyOptimal = `The optimal move ${optimalMove} constructs the 5-point, immediately blocking opponent escapes and establishing dominance.`;
            advice = 'The 5-point is the cornerstone of both offense and defense: secure it whenever the dice allow!';
        } else applyFrCopy('GOLDEN_POINT');
        keyConcept = isEn ? 'Golden Point Control' : 'Contrôle du Golden Point';
        conceptId = 'golden-point';
    } else if (barPointCreated) {
        if (isEn) {
            summary = `Securing the 7-point (Bar Point) establishes a dominant block against opponent rear checkers.`;
            whyFailed = `Playing ${playedMove} misses constructing the crucial 7-point barricade.`;
            whyOptimal = `The optimal move ${optimalMove} locks down the 7-point to restrict opponent escapes by 6s.`;
            advice = 'The bar point bridges your home board and outfield to contain opposing checkers.';
        } else applyFrCopy('BAR_POINT');
        keyConcept = isEn ? 'Bar Point Control' : 'Contrôle du Bar Point';
        conceptId = 'bar-point';
    } else if (primeExtended) {
        if (isEn) {
            summary = `A prime of ${primeLen} consecutive points offers a decisive strategic lock.`;
            whyFailed = `Playing ${playedMove} weakens or misses extending your ${primeLen}-point prime barricade.`;
            whyOptimal = `Playing ${optimalMove} preserves or extends the prime to completely paralyze opponent escape.`;
            advice = 'Against trapped opponent checkers, extending your prime always trumps racing.';
        } else applyFrCopy('PRIME_EXTEND');
        keyConcept = isEn ? 'Prime Construction' : 'Construction de Prime';
        conceptId = 'prime-vs-prime';
    } else if (hitMadeByBest) {
        if (isEn) {
            summary = `Hitting the opponent blot with ${optimalMove} gains crucial tempo and sets back their race.`;
            whyFailed = `Playing ${playedMove} plays too passively and lets the opponent consolidate their position unchallenged.`;
            whyOptimal = `The optimal move ${optimalMove} sends an opponent checker to the bar, seizing the initiative.`;
            advice = 'Hitting in the outfield or inner board steals tempo and forces the opponent to enter from the bar.';
        } else applyFrCopy('TEMPO_HIT');
        keyConcept = isEn ? 'Tempo Hit & Initiative' : 'Frappe de Tempo & Initiative';
        conceptId = 'tempo-hit';
    } else if (rearCheckerEscaped) {
        if (isEn) {
            summary = `Escaping a rear checker with ${optimalMove} is the urgent priority before the opponent builds a prime.`;
            whyFailed = `Playing ${playedMove} leaves ${userBlots.length} exposed blot(s) (${userShots}/36 shots) and leaves your rear checkers trapped.`;
            whyOptimal = `The optimal move ${optimalMove} immediately runs a back checker into the outfield to break containment.`;
            advice = 'With big rolls in the opening or early game, prioritize escaping your back checkers from point 24.';
        } else applyFrCopy('REAR_ESCAPE');
        keyConcept = isEn ? 'Back Checker Escape' : 'Évasion des pions arrières';
        conceptId = 'back-checker-escape';
    } else if (contactBrokenInEndgame) {
        if (isEn) {
            summary = `In the endgame (${diff.player} pips left), ${optimalMove} cleanly breaks contact to enter a pure race.`;
            whyFailed = `Playing ${playedMove} prolongs contact unnecessarily when a clean transition to the bear-off race was available.`;
            whyOptimal = `The move ${optimalMove} clears the last contact point to steer safely towards the bear-off.`;
            advice = 'When ahead in the endgame and able to clear the last opposing checker safely, break contact cleanly.';
        } else applyFrCopy('ENDGAME_CONTACT_BREAK');
        keyConcept = isEn ? 'Endgame Contact Break' : 'Rupture du contact en fin de partie';
        conceptId = 'running-game';
    } else if (contactStatus === 'pureRace') {
        if (isEn) {
            summary = `In a pure race (${diff.player} vs ${diff.opponent} pips), minimize wastage and optimize crossovers.`;
            whyFailed = `Playing ${playedMove} increases low-point wastage or leaves stragglers behind.`;
            whyOptimal = `The optimal move ${optimalMove} maximizes bear-off efficiency and improves your Keith Count.`;
            advice = 'In a pure race, bring rear checkers home smoothly and avoid stacking points 1 and 2.';
        } else applyFrCopy('PURE_RACE');
        keyConcept = isEn ? 'Keith Count & Pure Race' : 'Keith Count & Course Pure';
        conceptId = 'keith-count';
    } else if (homeGateCreated) {
        if (isEn) {
            summary = `Closing gates in the home board increases hitting threats and restricts opponent reentry.`;
            whyFailed = `Playing ${playedMove} fails to close a defensive home gate.`;
            whyOptimal = `The optimal move ${optimalMove} builds a solid home board gate.`;
            advice = 'Making home board gates protects against hits and sets up gammon pressure.';
        } else applyFrCopy('HOME_GATE');
        keyConcept = isEn ? 'Home Board Gate' : 'Porte Intérieure';
        conceptId = 'pure-play';
    } else if (anchorCreatedOrKept) {
        if (isEn) {
            summary = `The advanced anchor guarantees safety and restricts your opponent.`;
            whyFailed = `Playing ${playedMove} gives up or neglects the advanced anchor without overwhelming compensation.`;
            whyOptimal = `Playing ${optimalMove} maintains strong anchor connectivity and outfield control.`;
            advice = 'Never dismantle an advanced anchor without overwhelming immediate compensation.';
        } else applyFrCopy('ADVANCED_ANCHOR');
        keyConcept = isEn ? 'Advanced Anchor' : 'Ancre avancée';
        conceptId = 'advanced-anchor';
    } else if (/\b(?:24|1)\/(?:20|21|22|5|4|3)\b/.test(optimalMove) && !/\b(?:24|1)\/(?:20|21|22|5|4|3)\b/.test(playedMove)) {
        if (isEn) {
            summary = `Splitting your rear checkers with ${optimalMove} prepares an advanced anchor and duplicates opponent hitting numbers.`;
            whyFailed = `Playing ${playedMove} leaves your back checkers stacked and passive on point 24 without defensive counterplay.`;
            whyOptimal = `The optimal move ${optimalMove} splits a rear checker toward point 20/21 while bringing down an outfield builder.`;
            advice = 'Splitting back checkers early creates anchor threats and forces your opponent into awkward choices.';
        } else applyFrCopy('BACK_SPLIT');
        keyConcept = isEn ? 'Back Checker Split & Builders' : 'Split Arrière & Bâtisseurs';
        conceptId = 'opening-philosophy';
    } else if (/\b(?:13|12)\/(?:8|9|10|11|17|16|15|14)\b/.test(optimalMove) && !/\b(?:13|12)\/(?:8|9|10|11|17|16|15|14)\b/.test(playedMove)) {
        if (isEn) {
            summary = `Unstacking the Midpoint (13-point) with ${optimalMove} brings down active builders for the next roll.`;
            whyFailed = `Playing ${playedMove} leaves a rigid stack on the midpoint and starves your next roll of constructive numbers.`;
            whyOptimal = `The optimal move ${optimalMove} deploys an outfield builder (points 8–11) to maximize point-making rolls next turn.`;
            advice = 'Unstack the 5-checker midpoint pile to feed builders into your outer board.';
        } else applyFrCopy('MIDPOINT_UNSTACK');
        keyConcept = isEn ? 'Unstacking Midpoint & Builders' : 'Dégorgement du Midpoint & Bâtisseurs';
        conceptId = 'pure-play';
    } else {
        if (isEn) {
            whyFailed = `Playing ${playedMove} reduces your builder flexibility and weakens checker coordination for the next roll.`;
            whyOptimal = `The optimal move ${optimalMove} distributes your spare checkers smoothly and maximizes constructive rolls out of 36.`;
        } else applyFrCopy('POSITIONAL_FLEXIBILITY');
        conceptId = 'pure-play';
    }

    return { summary, keyConcept, advice, whyFailed, whyOptimal, conceptId };
}

