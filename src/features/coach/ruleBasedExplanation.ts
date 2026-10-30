/**
 * @file src/features/coach/ruleBasedExplanation.ts
 * @description Générateur d'explication heuristique de repli sans appel LLM (mode offline / secours).
 * Intègre le Schéma d'Audit Symbolique en Deux Temps (`symbolic_audit` + `pedagogical_explanation`),
 * les Proverbes de Michy, la règle de Magriel, le compte EPC de Trice et la dissociation de Zare.
 */

import { buildMatchContext } from './matchContext';
import { localizeOfflineExplanation } from './coachMultiLangPrompts';
import { getTheoryConceptById } from '../knowledge/knowledgeBaseData';
import { buildNeuroSymbolicAudit } from '../../lib/coach/symbolicAudit';
import { buildMichyMagrielWoolseySynthesis } from '../../lib/coach/prompts';
import type { CoachPromptParams, CoachStructuredResponse } from './prompts';

/**
 * Vérifie dans une notation de coup (en repli uniquement si les plateaux ne sont pas fournis)
 * qu'une porte est réellement créée avec >= 2 pions arrivant sur la même flèche cible
 * (ex: "8/5 6/5", "13/5(2)", "17/20 19/20"), et non un simple pion isolé ("24/20", "13/5").
 */
function moveNotationCreatesGateOnPoint(moveNotation: string, targetPoints: number[]): boolean {
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

/**
 * Produit une explication pédagogique règle-basée directement depuis les concepts stratégiques extraits.
 */
export function generateRuleBasedExplanation(params: CoachPromptParams): CoachStructuredResponse {
    const {
        verdict = 'doubtful',
        equityLoss = -0.05,
        playedMove = 'Coup joué',
        optimalMove = 'Coup optimal',
        features,
        matchContext,
        language = 'fr',
    } = params;

    const isEn = language === 'en';
    const diff = features?.pipCountDiff ?? { player: 150, opponent: 150, leader: 'tie', diff: 0 };
    const player = features?.player ?? 'X';
    const userBlots = features?.blotsAndShots?.user ?? [];
    const bestBlots = features?.blotsAndShots?.best ?? [];

    const userShots =
        features?.shotExposure?.user.totalRolls ??
        Math.min(36, userBlots.reduce((acc, b) => acc + b.totalShots, 0));
    const bestShots =
        features?.shotExposure?.best.totalRolls ??
        Math.min(36, bestBlots.reduce((acc, b) => acc + b.totalShots, 0));

    const board = features?.boardStructure ?? {
        innerBoardPoints: 2,
        advancedAnchor: false,
        goldenPoint: false,
        barPoint: false,
        longestPrime: 2,
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

    // Comparaison stricte entre boardBefore, userEndState et bestEndState :
    // Une porte (Golden Point, Bar Point, Porte intérieure) n'est signalée que si elle est
    // réellement créée avec >= 2 pions par le coup optimal (et absente avant le coup).
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
          ? bestBoard.innerBoardPoints > board.innerBoardPoints &&
            bestBoard.innerBoardPoints > (beforeBoard?.innerBoardPoints ?? 0)
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

    // Le conseil de rompre le contact n'est pertinent que si le coup optimal rompt réellement
    // le contact vers une course pure en fin de partie (<= 100 pips), jamais en début/milieu de partie.
    const contactBrokenInEndgame = tacDiff ? tacDiff.contactBrokenByBest : false;

    if (userShots > bestShots && userBlots.length > 0) {
        summary = isEn
            ? `The move concedes ${userShots} direct shots compared to only ${bestShots} for the best move.`
            : `Le coup concède ${userShots} tirs directs contre seulement ${bestShots} pour le meilleur coup.`;
        whyFailed = isEn
            ? `By playing ${playedMove}, you leave a vulnerable blot giving the opponent ${userShots} rolls out of 36 to hit.`
            : `En jouant ${playedMove}, vous laissez un blot vulnérable offrant à l'adversaire ${userShots} chances sur 36 de frapper.`;
        whyOptimal = isEn
            ? `The optimal move ${optimalMove} reduces this exposure to ${bestShots} shots while securing structure.`
            : `Le coup optimal ${optimalMove} réduit cette exposition à ${bestShots} tirs tout en consolidant votre structure.`;
        keyConcept = isEn ? 'Shot Minimization' : 'Minimisation des tirs';
        advice = isEn
            ? 'When your opponent has a strong home board, every blot left is a major gammon risk.'
            : 'Quand votre adversaire a un jan intérieur solide, chaque blot concédé est un risque majeur de gammon.';
        conceptId = 'duplication';
    } else if (goldenPointCreated) {
        summary = isEn
            ? `The 5-point (Golden Point) is the single most valuable strategic point on the entire backgammon board.`
            : `Faire la porte du 5 (Golden Point) est le coup le plus précieux et fondamental du Backgammon.`;
        whyFailed = isEn
            ? `Playing ${playedMove} completely misses securing the master 5-point, leaving an uncoordinated structure.`
            : `Jouer ${playedMove} passe à côté de la création du Golden Point et disperse vos pions sans rien construire.`;
        whyOptimal = isEn
            ? `The optimal move ${optimalMove} constructs the 5-point, immediately blocking opponent escapes and establishing dominance.`
            : `Le coup optimal ${optimalMove} verrouille la porte du 5 : il bloque la sortie adverse et installe une forteresse imprenable.`;
        keyConcept = isEn ? 'Golden Point Control' : 'Contrôle du Golden Point';
        advice = isEn ? 'The 5-point is the cornerstone of both offense and defense: secure it whenever the dice allow!' : 'Le Point 5 est la clé de voûte de toute attaque et défense : sécurisez-le dès que les dés le permettent !';
        conceptId = 'golden-point';
    } else if (barPointCreated) {
        summary = isEn
            ? `Securing the 7-point (Bar Point) establishes a dominant block against opponent rear checkers.`
            : `Faire la porte du 7 (Bar Point) bloque la fuite des pions adverses et amorce une prime.`;
        whyFailed = isEn ? `Playing ${playedMove} misses constructing the crucial 7-point barricade.` : `Jouer ${playedMove} néglige de verrouiller la barricade du 7.`;
        whyOptimal = isEn ? `The optimal move ${optimalMove} locks down the 7-point to restrict opponent escapes by 6s.` : `Le coup optimal ${optimalMove} verrouille le point 7 pour interdire les fuites par un 6.`;
        keyConcept = isEn ? 'Bar Point Control' : 'Contrôle du Bar Point';
        advice = isEn ? 'The bar point bridges your home board and outfield to contain opposing checkers.' : 'La porte du Bar (7) fait le pont et piège les pions adverses à 6 cases.';
        conceptId = 'bar-point';
    } else if (primeExtended) {
        const primeLen = bestBoard?.longestPrime ?? board.longestPrime;
        summary = isEn
            ? `A prime of ${primeLen} consecutive points offers a decisive strategic lock.`
            : `Une prime de ${primeLen} portes consécutives offre un verrouillage stratégique décisif.`;
        whyFailed = isEn
            ? `Playing ${playedMove} weakens or misses extending your ${primeLen}-point prime barricade.`
            : `Jouer ${playedMove} affaiblit ou manque d'étendre votre mur de prime de ${primeLen} portes.`;
        whyOptimal = isEn
            ? `Playing ${optimalMove} preserves or extends the prime to completely paralyze opponent escape.`
            : `Le coup ${optimalMove} consolide ou prolonge la prime pour paralyser totalement l'évasion adverse.`;
        keyConcept = isEn ? 'Prime Construction' : 'Construction de Prime';
        advice = isEn ? 'Against trapped opponent checkers, extending your prime always trumps racing.' : 'Face à des pions adverses piégés, étendre votre prime prime toujours sur la course.';
        conceptId = 'prime-vs-prime';
    } else if (hitMadeByBest) {
        summary = isEn
            ? `Hitting the opponent blot with ${optimalMove} gains crucial tempo and sets back their race.`
            : `Frapper le blot adverse avec ${optimalMove} gagne un tempo décisif et brise la course adverse.`;
        whyFailed = isEn
            ? `Playing ${playedMove} plays too passively and lets the opponent consolidate their position unchallenged.`
            : `Jouer ${playedMove} est trop passif et laisse l'adversaire consolider sa position sans être inquiété.`;
        whyOptimal = isEn
            ? `The optimal move ${optimalMove} sends an opponent checker to the bar, seizing the initiative.`
            : `Le coup optimal ${optimalMove} envoie un pion adverse à la barre et reprend l'initiative tactique.`;
        keyConcept = isEn ? 'Tempo Hit & Initiative' : 'Frappe de Tempo & Initiative';
        advice = isEn ? 'Hitting in the outfield or inner board steals tempo and forces the opponent to enter from the bar.' : 'Frapper un pion exposé vole un demi-tour à l’adversaire et l’oblige à réentrer depuis la barre.';
        conceptId = 'tempo-hit';
    } else if (rearCheckerEscaped) {
        summary = isEn
            ? `Escaping a rear checker with ${optimalMove} is the urgent priority before the opponent builds a prime.`
            : `Évader un pion arrière avec ${optimalMove} est la priorité absolue avant que l'adversaire ne ferme sa prime.`;
        whyFailed = isEn
            ? `Playing ${playedMove} leaves ${userBlots.length} exposed blot(s) (${userShots}/36 shots) and leaves your rear checkers trapped.`
            : `Jouer ${playedMove} disperse vos pions au milieu (${userBlots.length} blot(s), ${userShots}/36 tirs) en laissant vos pions arrières piégés sur la case 24.`;
        whyOptimal = isEn
            ? `The optimal move ${optimalMove} immediately runs a back checker into the outfield to break containment.`
            : `Le coup optimal ${optimalMove} fait courir immédiatement un pion arrière hors du camp adverse vers un relais sécurisé.`;
        keyConcept = isEn ? 'Back Checker Escape' : 'Évasion des pions arrières';
        advice = isEn ? 'With big rolls in the opening or early game, prioritize escaping your back checkers from point 24.' : 'Sur les gros lancers en début de partie, donnez la priorité à l’évasion de vos pions arrières (case 24).';
        conceptId = 'back-checker-escape';
    } else if (contactBrokenInEndgame) {
        summary = isEn
            ? `In the endgame (${diff.player} pips left), ${optimalMove} cleanly breaks contact to enter a pure race.`
            : `En fin de partie (${diff.player} pips restants), ${optimalMove} rompt réellement le contact pour entrer en course pure.`;
        whyFailed = isEn
            ? `Playing ${playedMove} prolongs contact unnecessarily when a clean transition to the bear-off race was available.`
            : `Jouer ${playedMove} maintient le contact alors qu'une transition nette vers la course pure était disponible.`;
        whyOptimal = isEn
            ? `The move ${optimalMove} clears the last contact point to steer safely towards the bear-off.`
            : `Le coup ${optimalMove} dépasse le dernier pion adverse et sécurise la course de sortie.`;
        keyConcept = isEn ? 'Endgame Contact Break' : 'Rupture du contact en fin de partie';
        advice = isEn ? 'When ahead in the endgame and able to clear the last opposing checker safely, break contact cleanly.' : 'En fin de partie avec l’avantage à la course, dépassez le dernier blocus adverse dès que possible.';
        conceptId = 'running-game';
    } else if (contactStatus === 'pureRace') {
        summary = isEn
            ? `In a pure race (${diff.player} vs ${diff.opponent} pips), minimize wastage and optimize crossovers.`
            : `En course pure (${diff.player} contre ${diff.opponent} pips), minimisez le gaspillage (EPC) et optimisez vos sorties.`;
        whyFailed = isEn ? `Playing ${playedMove} increases low-point wastage or leaves stragglers behind.` : `Jouer ${playedMove} augmente le gaspillage sur les points bas ou retarde le regroupement de vos pions.`;
        whyOptimal = isEn ? `The optimal move ${optimalMove} maximizes bear-off efficiency and improves your Keith Count.` : `Le coup optimal ${optimalMove} maximise l'efficacité de sortie (EPC) et améliore votre Keith Count.`;
        keyConcept = isEn ? 'Keith Count & Pure Race' : 'Keith Count & Course Pure';
        advice = isEn ? 'In a pure race, bring rear checkers home smoothly and avoid stacking points 1 and 2.' : 'En course pure, ramenez vos pions arrières sans empiler les flèches 1 et 2.';
        conceptId = 'keith-count';
    } else if (homeGateCreated) {
        summary = isEn ? `Closing gates in the home board increases hitting threats and restricts opponent reentry.` : `Fermer une porte intérieure renforce votre jan et complique la réentrée adverse.`;
        whyFailed = isEn ? `Playing ${playedMove} fails to close a defensive home gate.` : `Jouer ${playedMove} disperse vos pions au lieu de fermer une porte protectrice.`;
        whyOptimal = isEn ? `The optimal move ${optimalMove} builds a solid home board gate.` : `Le coup optimal ${optimalMove} construit une solide porte dans votre jan intérieur.`;
        keyConcept = isEn ? 'Home Board Gate' : 'Porte Intérieure';
        advice = isEn ? 'Making home board gates protects against hits and sets up gammon pressure.' : 'Fermer des portes dans son jan intérieur protège vos pions et prépare le verrouillage.';
        conceptId = 'pure-play';
    } else if (anchorCreatedOrKept) {
        summary = isEn ? `The advanced anchor guarantees safety and restricts your opponent.` : `L'ancre avancée assure votre sécurité et bride l'adversaire.`;
        whyFailed = isEn ? `Playing ${playedMove} gives up or neglects the advanced anchor without overwhelming compensation.` : `Jouer ${playedMove} délaisse l'ancre avancée sans compensation majeure immédiate.`;
        whyOptimal = isEn ? `Playing ${optimalMove} maintains strong anchor connectivity and outfield control.` : `Jouer ${optimalMove} maintient l'ancre avancée et le contrôle du jan adverse.`;
        keyConcept = isEn ? 'Advanced Anchor' : 'Ancre avancée';
        advice = isEn ? 'Never dismantle an advanced anchor without overwhelming immediate compensation.' : 'Ne démontez jamais une ancre avancée sans une compensation immédiate écrasante.';
        conceptId = 'advanced-anchor';
    } else if (
        /\b(?:24|1)\/(?:20|21|22|5|4|3)\b/.test(optimalMove) &&
        !/\b(?:24|1)\/(?:20|21|22|5|4|3)\b/.test(playedMove)
    ) {
        summary = isEn
            ? `Splitting your rear checkers with ${optimalMove} prepares an advanced anchor and duplicates opponent hitting numbers.`
            : `Séparer vos pions arrières avec ${optimalMove} prépare une ancre avancée et duplique les dés d'attaque adverses.`;
        whyFailed = isEn
            ? `Playing ${playedMove} leaves your back checkers stacked and passive on point 24 without defensive counterplay.`
            : `Jouer ${playedMove} laisse vos deux pions arrières passifs sur la case 24 sans préparer d'ancre défensive.`;
        whyOptimal = isEn
            ? `The optimal move ${optimalMove} splits a rear checker toward point 20/21 while bringing down an outfield builder.`
            : `Le coup optimal ${optimalMove} avance un pion arrière vers la case 20/21 tout en descendant un bâtisseur actif.`;
        keyConcept = isEn ? 'Back Checker Split & Builders' : 'Split Arrière & Bâtisseurs';
        advice = isEn
            ? 'Splitting back checkers early creates anchor threats and forces your opponent into awkward choices.'
            : 'Séparer ses pions arrières tôt multiplie les lancers d’ancrage et gêne le développement adverse.';
        conceptId = 'opening-philosophy';
    } else if (
        /\b(?:13|12)\/(?:8|9|10|11|17|16|15|14)\b/.test(optimalMove) &&
        !/\b(?:13|12)\/(?:8|9|10|11|17|16|15|14)\b/.test(playedMove)
    ) {
        summary = isEn
            ? `Unstacking the Midpoint (13-point) with ${optimalMove} brings down active builders for the next roll.`
            : `Dégorger le Midpoint (point 13) avec ${optimalMove} active vos bâtisseurs pour couvrir une porte au prochain tour.`;
        whyFailed = isEn
            ? `Playing ${playedMove} leaves a rigid stack on the midpoint and starves your next roll of constructive numbers.`
            : `Jouer ${playedMove} conserve une pile rigide sur le point 13 et réduit vos bons lancers constructeurs sur 36.`;
        whyOptimal = isEn
            ? `The optimal move ${optimalMove} deploys an outfield builder (points 8–11) to maximize point-making rolls next turn.`
            : `Le coup optimal ${optimalMove} place un bâtisseur actif (cases 8 à 11) qui multiplie vos dés de fermeture au tour suivant.`;
        keyConcept = isEn ? 'Unstacking Midpoint & Builders' : 'Dégorgement du Midpoint & Bâtisseurs';
        advice = isEn
            ? 'Unstack the 5-checker midpoint pile to feed builders into your outer board.'
            : 'Dégorgez la pile de 5 pions du point 13 pour alimenter vos bâtisseurs d’attaque.';
        conceptId = 'pure-play';
    } else {
        whyFailed = isEn
            ? `Playing ${playedMove} reduces your builder flexibility and weakens checker coordination for the next roll.`
            : `Le coup joué ${playedMove} réduit la flexibilité de vos bâtisseurs et diminue vos bons dés au tour suivant.`;
        whyOptimal = isEn
            ? `The optimal move ${optimalMove} distributes your spare checkers smoothly and maximizes constructive rolls out of 36.`
            : `Le coup optimal ${optimalMove} répartit mieux vos pions de réserve (spares) et maximise vos lancers constructifs sur 36.`;
        conceptId = 'pure-play';
    }

    let explanation = `${whyFailed} ${whyOptimal}`;
    const isOptimalVerdict = verdict === 'optimal' || playedMove === optimalMove || Math.abs(equityLoss) <= 0.01;
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
        if (ctx.isDMP) {
            explanation += isEn ? `\n\n🎯 DMP Context: 1 point to win, gammons do not count.` : `\n\n🎯 Contexte DMP : À 1 point de la victoire, les gammons ne comptent pas.`;
        } else if (ctx.crawford) {
            explanation += isEn ? `\n\n🛡️ Crawford Rule: Doubling cube is frozen.` : `\n\n🛡️ Règle de Crawford : Videau gelé pour cette manche.`;
        } else if (ctx.gammonPrice && ctx.gammonPrice.X > 0.6) {
            explanation += isEn
                ? `\n\n⚠️ Match Context: High gammon price (${(ctx.gammonPrice.X * 100).toFixed(0)}%). Extreme safety required.`
                : `\n\n⚠️ Contexte de match : Prix du gammon très élevé (${(ctx.gammonPrice.X * 100).toFixed(0)}%). Prudence maximale.`;
        }
    }

    const grandmasterSynthesis = buildMichyMagrielWoolseySynthesis({
        optimalMove,
        playerPips: diff.player,
        opponentPips: diff.opponent,
        equityLoss: Math.abs(equityLoss),
        directShotsConceded: userShots,
        gamePhase: contactStatus === 'pureRace' ? 'race' : 'contact',
        primeLength: board.longestPrime,
        homeBoardPointsMade: board.innerBoardPoints,
        concepts: [conceptId],
        isEn,
    });
    explanation += `\n\n${grandmasterSynthesis}`;

    const neuroSymbolic = buildNeuroSymbolicAudit({
        playerPipCount: diff.player,
        opponentPipCount: diff.opponent,
        directShotsBefore: bestShots,
        directShotsAfter: userShots,
        equityLoss: Math.abs(equityLoss),
        bestMoveNotation: optimalMove,
        playedMoveNotation: playedMove,
        archetype: features?.bgsage?.playerGamePlan,
        gamePhase: contactStatus === 'pureRace' ? 'race' : 'contact',
        primeLength: board.longestPrime,
        homeBoardPointsMade: board.innerBoardPoints,
        blotsLeft: userBlots.length,
        locale: isEn ? 'en' : 'fr',
    });

    const baseResult: CoachStructuredResponse = {
        verdict,
        summary,
        explanation,
        keyConcept,
        advice,
        whyFailed,
        whyOptimal,
        conceptId,
        symbolic_audit: neuroSymbolic.symbolic_audit,
        pedagogical_explanation: neuroSymbolic.pedagogical_explanation,
    };

    return language !== 'fr' && language !== 'en'
        ? localizeOfflineExplanation(baseResult, params)
        : baseResult;
}
