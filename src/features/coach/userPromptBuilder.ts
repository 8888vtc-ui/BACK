/**
 * @file src/features/coach/userPromptBuilder.ts
 * @description Sérialiseur des métriques et concepts stratégiques en entrée du prompt Coach IA.
 */

import { Player } from '../../engine/backgammonEngine';
import { computeMarketWindowMetrics } from './featureExtractor';
import { buildMatchContext } from './matchContext';
import { getTheoryConceptById } from '../knowledge/knowledgeBaseData';
import type { CoachPromptParams } from './prompts';

/**
 * Construit le prompt utilisateur structuré contenant toutes les métriques extraites.
 */
export function buildCoachUserPrompt(params: CoachPromptParams): string {
    const {
        verdict,
        equityLoss,
        playedMove,
        optimalMove,
        features,
        matchContext,
        playerLevel = 'intermediate',
        language = 'fr',
    } = params;

    const diff = features.pipCountDiff;
    const isEn = language === 'en';
    const isCubeDecision =
        playedMove.trim().startsWith('Videau') ||
        /^(Double|No double|Take|Pass|Redouble|Beaver)\b/i.test(playedMove.trim()) ||
        /^(Double|No double|Take|Pass|Redouble|Beaver)\b/i.test(optimalMove.trim());

    const raceLeaderStr = isEn
        ? diff.leader === 'tie'
            ? 'Race is tied'
            : `${diff.leader} leads the race with a ${Math.abs(diff.diff)} pip lead (Player: ${diff.player}, Opponent: ${diff.opponent})`
        : diff.leader === 'tie'
            ? 'Course à égalité parfaite'
            : `${diff.leader} mène la course avec un avantage de ${Math.abs(diff.diff)} pips (Joueur: ${diff.player}, Adversaire: ${diff.opponent})`;

    const userShots = features.blotsAndShots.user;
    const bestShots = features.blotsAndShots.best;
    const exposure = features.shotExposure;

    // Union exacte des lancers frappants si disponible. Sinon, la somme par blot
    // n'est exacte qu'avec un seul blot : au-delà, c'est un majorant (préfixe « ≤ »).
    const sumShots = (blots: typeof userShots, key: 'totalShots' | 'directShots' | 'indirectShots') =>
        Math.min(36, blots.reduce((acc, b) => acc + b[key], 0));
    const approxPrefix = (blots: typeof userShots) => (!exposure && blots.length > 1 ? '≤ ' : '');

    const totalUserShots = `${approxPrefix(userShots)}${exposure?.user.totalRolls ?? sumShots(userShots, 'totalShots')}`;
    const totalBestShots = `${approxPrefix(bestShots)}${exposure?.best.totalRolls ?? sumShots(bestShots, 'totalShots')}`;
    const userDirectShots = exposure?.user.directRolls ?? sumShots(userShots, 'directShots');
    const userIndirectShots = exposure?.user.indirectRolls ?? sumShots(userShots, 'indirectShots');
    const bestDirectShots = exposure?.best.directRolls ?? sumShots(bestShots, 'directShots');
    const bestIndirectShots = exposure?.best.indirectRolls ?? sumShots(bestShots, 'indirectShots');

    const fmtDup = (side: 'user' | 'best', en: boolean): string => {
        const dups = exposure?.[side].duplicatedNumbers ?? [];
        if (dups.length === 0) return en ? 'None' : 'Aucune';
        return dups
            .map((d) => (en ? `${d.die} hits points ${d.blots.join(' & ')}` : `le ${d.die} frappe les flèches ${d.blots.join(' et ')}`))
            .join('; ');
    };
    const duplicationEn = exposure
        ? `\n- Duplication of opponent's hitting numbers: played move = ${fmtDup('user', true)} | optimal move = ${fmtDup('best', true)}`
        : '';
    const duplicationFr = exposure
        ? `\n- Duplication des numéros de frappe adverses : coup joué = ${fmtDup('user', false)} | coup optimal = ${fmtDup('best', false)}`
        : '';

    const keith = features.keithCount;
    const showKeith = keith && features.contactStatus === 'pureRace';
    const keithEn = showKeith
        ? `\n- Keith Count (after played move): Player ${keith.player}, Opponent ${keith.opponent} (difference ${keith.diff > 0 ? '+' : ''}${keith.diff})`
        : '';
    const keithFr = showKeith
        ? `\n- Compte de Keith (après le coup joué) : Joueur ${keith.player}, Adversaire ${keith.opponent} (écart ${keith.diff > 0 ? '+' : ''}${keith.diff})`
        : '';

    const kbConceptId =
        features.contactStatus !== 'contact'
            ? 'trice-epc'
            : features.boardStructure.goldenPoint
              ? 'golden-point'
              : features.boardStructure.barPoint
                ? 'bar-point'
                : features.boardStructure.longestPrime >= 4
                  ? 'prime-vs-prime'
                  : features.boardStructure.advancedAnchor
                    ? 'advanced-anchor'
                    : userShots.length > bestShots.length
                      ? 'duplication'
                      : 'pure-play';
    const kbConcept = getTheoryConceptById(kbConceptId);
    const kbLang: 'fr' | 'en' = isEn ? 'en' : 'fr';
    const kbSectionEn = kbConcept
        ? `\n## ENCYCLOPEDIA THEORY & BOARD GEOMETRY (${kbConcept.id}):\n- Principle: ${kbConcept.title[kbLang]} (${kbConcept.author}) — ${kbConcept.summary[kbLang]}\n- Golden Rule: ${kbConcept.goldenRule[kbLang]}\n- Key References: Golden Point (20/5), Bar Point (18/7), 6-Prime, Advanced Anchor, Blitz, Duplication, Keith Count / EPC for Bear-off.`
        : '';
    const kbSectionFr = kbConcept
        ? `\n## THÉORIE ENCYCLOPÉDIQUE & GÉOMÉTRIE DU PLATEAU (${kbConcept.id}) :\n- Principe : ${kbConcept.title[kbLang]} (${kbConcept.author}) — ${kbConcept.summary[kbLang]}\n- Règle d'or : ${kbConcept.goldenRule[kbLang]}\n- Repères clés : Point d'Or (20/5), Bar Point (18/7), Prime 6, Ancre avancée, Blitz, Duplication, Compte de Keith / EPC pour le Bear-off.`
        : '';

    let matchInfo = isEn ? 'Casual game without specified match context.' : 'Partie amicale sans contexte de match renseigné.';
    if (matchContext) {
        const ctx = buildMatchContext(matchContext);
        if (ctx.matchLength === 0 || ctx.isMoneyPlay) {
            matchInfo = isEn
                ? `Money play — Cube: ${ctx.cubeValue} (${ctx.cubeOwner ? 'owned by ' + ctx.cubeOwner : 'centered'}). Gammon price: 0.50. Take point: 25.0%.`
                : `Partie d'argent (Money play) — Videau: ${ctx.cubeValue} (${ctx.cubeOwner ? 'détenu par ' + ctx.cubeOwner : 'centré'}). Prix du gammon: 0.50. Take point: 25.0%.`;
        } else {
            const regime = isEn
                ? ctx.isDMP
                    ? 'DMP (Double Match Point) — Gammons do not count, single win is decisive.'
                    : ctx.crawford
                        ? 'Crawford rule active — Cube is frozen.'
                        : ctx.postCrawford
                            ? 'Post-Crawford — Trailing player doubles immediately.'
                            : 'Regular match play.'
                : ctx.isDMP
                    ? 'DMP (Double Match Point) — Aucun gammon ne compte, gain simple décisif.'
                    : ctx.crawford
                        ? 'Règle de Crawford active — Videau gelé.'
                        : ctx.postCrawford
                            ? 'Post-Crawford — Le retardataire double immédiatement.'
                            : 'Match play régulier.';

            const ptsX = ctx.pointsToWin.X;
            const ptsO = ctx.pointsToWin.O;
            const gpX = (ctx.gammonPrice.X * 100).toFixed(0) + '%';
            const gpO = (ctx.gammonPrice.O * 100).toFixed(0) + '%';
            const tpX = (ctx.takePoint.X * 100).toFixed(1) + '%';
            const tpO = (ctx.takePoint.O * 100).toFixed(1) + '%';

            matchInfo = isEn
                ? [
                    `Match to ${ctx.matchLength} points. Score X: ${ctx.scoreX}, O: ${ctx.scoreO} (${ptsX}-away, ${ptsO}-away).`,
                    `Regime: ${regime}`,
                    `Doubling Cube: ${ctx.cubeValue} (${ctx.cubeOwner ? 'owned by ' + ctx.cubeOwner : 'centered'}).`,
                    `Gammon Price (MET Kazaross): Player X = ${gpX}, Player O = ${gpO}.`,
                    `Take Point: Player X = ${tpX}, Player O = ${tpO}.`,
                ].join('\n')
                : [
                    `Match en ${ctx.matchLength} points. Score X: ${ctx.scoreX}, O: ${ctx.scoreO} (${ptsX}-away, ${ptsO}-away).`,
                    `Régime : ${regime}`,
                    `Videau: ${ctx.cubeValue} (${ctx.cubeOwner ? 'détenu par ' + ctx.cubeOwner : 'centré'}).`,
                    `Prix du gammon (MET Kazaross) : Joueur X = ${gpX}, Joueur O = ${gpO}.`,
                    `Take point (Seuil de prise du videau) : Joueur X = ${tpX}, Joueur O = ${tpO}.`,
                ].join('\n');
        }
    }

    const resolvedMatchCtx = matchContext ? buildMatchContext(matchContext) : undefined;
    const oppPlayer: Player = features.player === 'X' ? 'O' : 'X';
    const mw =
        features.marketWindow ??
        computeMarketWindowMetrics({
            contactStatus: features.contactStatus,
            boardStructure: features.boardStructure,
            blotsAndShots: features.blotsAndShots,
            pipCountDiff: features.pipCountDiff,
            opponentTakePoint: resolvedMatchCtx ? resolvedMatchCtx.takePoint[oppPlayer] : 0.25,
            gammonPrice: resolvedMatchCtx ? resolvedMatchCtx.gammonPrice[features.player] : 0.5,
            bgsage: features.bgsage,
            shotExposure: features.shotExposure,
        });

    const volLabelFr = mw.volatility === 'high' ? 'Élevée' : mw.volatility === 'medium' ? 'Modérée' : 'Faible';
    const sigmaSuffixEn =
        mw.equityVolatilitySigma !== undefined
            ? ` | Sigma_Eq=${mw.equityVolatilitySigma.toFixed(3)}, Overshoot=${(mw.expectedOvershootLoss ?? 0).toFixed(3)}`
            : '';
    const sigmaSuffixFr =
        mw.equityVolatilitySigma !== undefined
            ? ` | Sigma_Eq=${mw.equityVolatilitySigma.toFixed(3)}, Overshoot=${(mw.expectedOvershootLoss ?? 0).toFixed(3)}`
            : '';
    const marketSectionEn = [
        '',
        '## CUBE & MARKET WINDOW VOLATILITY:',
        `- Market Window: Double Point ${(mw.doublePoint * 100).toFixed(1)}% → Cash Point ${(mw.cashPoint * 100).toFixed(1)}% (In window: ${mw.inMarketWindow ? 'Yes' : 'No'})`,
        `- Position Volatility: ${mw.volatility.toUpperCase()} (~${mw.estimatedMarketLosers}/36 market-losing sequences${sigmaSuffixEn})`,
    ].join('\n');

    const marketSectionFr = [
        '',
        '## ANALYSE DU VIDEAU & VOLATILITÉ (MARKET WINDOW) :',
        `- Fenêtre de marché (Market Window) : Seuil de double ${(mw.doublePoint * 100).toFixed(1)}% → Cash Point ${(mw.cashPoint * 100).toFixed(1)}% (Dans la fenêtre : ${mw.inMarketWindow ? 'Oui' : 'Non'})`,
        `- Volatilité de la position : ${volLabelFr} (~${mw.estimatedMarketLosers}/36 séquences de perte de marché / Market Loss${sigmaSuffixFr})`,
    ].join('\n');

    const bgsage = features.bgsage;
    let bgsageSectionEn = '';
    let bgsageSectionFr = '';
    if (bgsage) {
        const optM = bgsage.optimalMetrics;
        const pldM = bgsage.playedMetrics;
        // Écarts pré-calculés (coup optimal − coup joué), en points de pourcentage.
        const pp = (v: number) => `${v > 0 ? '+' : ''}${(v * 100).toFixed(1)}`;
        const deltas =
            optM && pldM
                ? {
                      win: pp(optM.winProb - pldM.winProb),
                      gammon: pp(optM.winGammonProb - pldM.winGammonProb),
                      loseGammon: pp(optM.loseGammonProb - pldM.loseGammonProb),
                  }
                : null;
        bgsageSectionEn = [
            '',
            `## OPEN SAGE NEURAL ENGINE DATA (${bgsage.evalLevel}):`,
            `- Position Game Plan: Player = ${bgsage.playerGamePlan}, Opponent = ${bgsage.opponentGamePlan} (Pure race: ${bgsage.isRace ? 'Yes' : 'No'})`,
            bgsage.topCandidates && bgsage.topCandidates.length > 0
                ? `- Top ${bgsage.topCandidates.length} Open Sage Max Candidates: ${bgsage.topCandidates.map((c) => `#${c.rank} ${c.notation} [Eq ${c.equity.toFixed(3)}, dEq ${c.equityLoss.toFixed(3)}, W ${(c.winProb * 100).toFixed(1)}%, G ${(c.winGammonProb * 100).toFixed(1)}%, OppG ${(c.loseGammonProb * 100).toFixed(1)}%]`).join(' | ')}`
                : '',
            bgsage.cubeDecision && typeof bgsage.cubeDecision.noDouble === 'number' && typeof bgsage.cubeDecision.doubleTake === 'number'
                ? `- Open Sage Cube Equities: No Double=${bgsage.cubeDecision.noDouble.toFixed(3)}, Double/Take=${bgsage.cubeDecision.doubleTake.toFixed(3)}, Double/Pass=${(bgsage.cubeDecision.doublePass ?? 1).toFixed(3)} -> Optimal Cube Action: ${bgsage.cubeDecision.optimalAction ?? 'No Double'}`
                : '',
            optM
                ? `- Optimal Move (${optimalMove}) Neural Probabilities: Win ${(optM.winProb * 100).toFixed(1)}% (Gammon ${(optM.winGammonProb * 100).toFixed(1)}%, BG ${(optM.winBackgammonProb * 100).toFixed(2)}%), Opponent Gammon Risk ${(optM.loseGammonProb * 100).toFixed(1)}%, Eq Cubeful ${optM.equity.toFixed(4)} (Cubeless ${optM.cubelessEquity.toFixed(4)}), Resulting Plan = ${optM.playerGamePlan}`
                : '',
            pldM
                ? `- Played Move (${playedMove}) Neural Probabilities: Win ${(pldM.winProb * 100).toFixed(1)}% (Gammon ${(pldM.winGammonProb * 100).toFixed(1)}%, BG ${(pldM.winBackgammonProb * 100).toFixed(2)}%), Opponent Gammon Risk ${(pldM.loseGammonProb * 100).toFixed(1)}%, Eq Cubeful ${pldM.equity.toFixed(4)} (Cubeless ${pldM.cubelessEquity.toFixed(4)}), Resulting Plan = ${pldM.playerGamePlan}`
                : '',
            deltas
                ? `- Pre-computed deltas (optimal − played, percentage points): Win ${deltas.win}, Gammon ${deltas.gammon}, Opponent Gammon Risk ${deltas.loseGammon}`
                : '',
        ]
            .filter(Boolean)
            .join('\n');

        bgsageSectionFr = [
            '',
            `## DONNÉES NEURALES OPEN SAGE (${bgsage.evalLevel}) :`,
            `- Plan de jeu identifié : Joueur = ${bgsage.playerGamePlan}, Adversaire = ${bgsage.opponentGamePlan} (Course pure : ${bgsage.isRace ? 'Oui' : 'Non'})`,
            bgsage.topCandidates && bgsage.topCandidates.length > 0
                ? `- Top ${bgsage.topCandidates.length} Candidats Open Sage Max : ${bgsage.topCandidates.map((c) => `#${c.rank} ${c.notation} [Eq ${c.equity.toFixed(3)}, dEq ${c.equityLoss.toFixed(3)}, Gain ${(c.winProb * 100).toFixed(1)}%, Gammon ${(c.winGammonProb * 100).toFixed(1)}%, GammonAdv ${(c.loseGammonProb * 100).toFixed(1)}%]`).join(' | ')}`
                : '',
            bgsage.cubeDecision && typeof bgsage.cubeDecision.noDouble === 'number' && typeof bgsage.cubeDecision.doubleTake === 'number'
                ? `- Équités Videau Open Sage : Pas de Double=${bgsage.cubeDecision.noDouble.toFixed(3)}, Double/Pris=${bgsage.cubeDecision.doubleTake.toFixed(3)}, Double/Passé=${(bgsage.cubeDecision.doublePass ?? 1).toFixed(3)} -> Action Videau Optimale : ${bgsage.cubeDecision.optimalAction ?? 'No Double'}`
                : '',
            optM
                ? `- Probabilités neurales du coup optimal (${optimalMove}) : Gain ${(optM.winProb * 100).toFixed(1)}% (Gammon ${(optM.winGammonProb * 100).toFixed(1)}%, BG ${(optM.winBackgammonProb * 100).toFixed(2)}%), Risque de gammon adverse ${(optM.loseGammonProb * 100).toFixed(1)}%, Eq Cubeful ${optM.equity.toFixed(4)} (Cubeless ${optM.cubelessEquity.toFixed(4)}), Plan résultant = ${optM.playerGamePlan}`
                : '',
            pldM
                ? `- Probabilités neurales du coup joué (${playedMove}) : Gain ${(pldM.winProb * 100).toFixed(1)}% (Gammon ${(pldM.winGammonProb * 100).toFixed(1)}%, BG ${(pldM.winBackgammonProb * 100).toFixed(2)}%), Risque de gammon adverse ${(pldM.loseGammonProb * 100).toFixed(1)}%, Eq Cubeful ${pldM.equity.toFixed(4)} (Cubeless ${pldM.cubelessEquity.toFixed(4)}), Plan résultant = ${pldM.playerGamePlan}`
                : '',
            deltas
                ? `- Écarts pré-calculés (optimal − joué, en points de %) : Gain ${deltas.win}, Gammon ${deltas.gammon}, Risque de gammon adverse ${deltas.loseGammon}`
                : '',
        ]
            .filter(Boolean)
            .join('\n');
    }

    const tac = features.tacticalDelta;
    const bestStruct = features.bestBoardStructure;
    const tacticalDiffEn = tac || bestStruct
        ? `\n- Tactical comparison (Optimal vs Played): ${
            bestStruct ? `Optimal has ${bestStruct.innerBoardPoints} home points (played: ${features.boardStructure.innerBoardPoints}), prime ${bestStruct.longestPrime} (played: ${features.boardStructure.longestPrime}). ` : ''
        }${
            tac
                ? tac.bestOpponentHitCount > tac.userOpponentHitCount
                    ? `Optimal puts ${tac.bestOpponentHitCount - tac.userOpponentHitCount} more checker(s) on the bar.`
                    : tac.userOpponentHitCount > tac.bestOpponentHitCount
                      ? `Played puts ${tac.userOpponentHitCount - tac.bestOpponentHitCount} more checker(s) on the bar.`
                      : tac.bestOpponentHitCount > 0
                        ? `Both moves hit ${tac.bestOpponentHitCount} checker(s).`
                        : 'No checkers hit to the bar.'
                : ''
        }`
        : '';

    const tacticalDiffFr = tac || bestStruct
        ? `\n- Comparaison tactique (Optimal vs Joué) : ${
            bestStruct ? `Optimal a ${bestStruct.innerBoardPoints} portes au jan (joué : ${features.boardStructure.innerBoardPoints}), prime de ${bestStruct.longestPrime} (joué : ${features.boardStructure.longestPrime}). ` : ''
        }${
            tac
                ? tac.bestOpponentHitCount > tac.userOpponentHitCount
                    ? `L'optimal envoie ${tac.bestOpponentHitCount - tac.userOpponentHitCount} pion(s) de plus à la barre.`
                    : tac.userOpponentHitCount > tac.bestOpponentHitCount
                      ? `Le coup joué envoie ${tac.userOpponentHitCount - tac.bestOpponentHitCount} pion(s) de plus à la barre.`
                      : tac.bestOpponentHitCount > 0
                        ? `Les deux coups frappent ${tac.bestOpponentHitCount} pion(s).`
                        : 'Aucun pion frappé à la barre.'
                : ''
        }`
        : '';

    if (isCubeDecision) {
        if (isEn) {
            return `Here is the verified data for the DOUBLING CUBE decision (STRICT RULE: analyze ONLY the Doubling Cube decision, Market Window, Take Point, Gammon Price, Woolsey's Law, and Janowski's Model — NEVER mention checker moves or point numbers):

## ENGINE CUBE DIAGNOSIS:
- Decision Type: DOUBLING CUBE (VIDEAU)
- Verdict: ${verdict.toUpperCase()} (Equity loss: ${equityLoss.toFixed(3)})
- Cube action played by player: "${playedMove}"
- Optimal cube action recommended by engine: "${optimalMove}"
- Pip count race: ${raceLeaderStr}${keithEn}

## MATCH CONTEXT & MARKET WINDOW:
${matchInfo}${marketSectionEn}${bgsageSectionEn}

Write your Cube-specialized explanation in the requested strict JSON format (conceptId must be "woolsey-law", "take-point", "market-loss", or "crawford-rule").`;
        }

        return `Voici les données vérifiées pour cette DÉCISION DE VIDEAU / CUBE (RÈGLE STRICTE : analyse EXCLUSIVEMENT la décision de Videau, la Fenêtre de Marché / Market Window, le Take Point, le Prix du Gammon, la Loi de Kit Woolsey et le Modèle de Janowski — INTERDICTION ABSOLUE de parler de déplacements de pions ou de portes 5/7) :

## DIAGNOSTIC DU MOTEUR SUR LE VIDEAU :
- Type de décision : VIDEAU (DOUBLING CUBE)
- Verdict : ${verdict.toUpperCase()} (Perte d'équité : ${equityLoss.toFixed(3)})
- Action de videau jouée par le joueur : "${playedMove}"
- Action de videau optimale recommandée par le moteur : "${optimalMove}"
- Course aux pips : ${raceLeaderStr}${keithFr}

## CONTEXTE DE MATCH & FENÊTRE DE MARCHÉ :
${matchInfo}${marketSectionFr}${bgsageSectionFr}

Rédige ton explication spécialisée Videau au format JSON strict demandé (conceptId doit être "woolsey-law", "take-point", "market-loss" ou "crawford-rule").`;
    }

    const diffFlags = features.tacticalDiff;
    const activeFlagsFr: string[] = [];
    const activeFlagsEn: string[] = [];
    if (diffFlags) {
        if (diffFlags.goldenPointCreatedByBest) {
            activeFlagsFr.push('Le coup optimal crée réellement le Golden Point (porte 5/20 avec >= 2 pions)');
            activeFlagsEn.push('Optimal move creates the Golden Point (point 5/20 with >= 2 checkers)');
        }
        if (diffFlags.barPointCreatedByBest) {
            activeFlagsFr.push('Le coup optimal crée réellement le Bar Point (porte 7/18 avec >= 2 pions)');
            activeFlagsEn.push('Optimal move creates the Bar Point (point 7/18 with >= 2 checkers)');
        }
        if (diffFlags.homeGateCreatedByBest) {
            activeFlagsFr.push('Le coup optimal ferme une nouvelle porte dans le jan intérieur');
            activeFlagsEn.push('Optimal move closes a new inner-board gate');
        }
        if (diffFlags.primeExtendedByBest) {
            activeFlagsFr.push('Le coup optimal étend la barricade de prime');
            activeFlagsEn.push('Optimal move extends the prime barricade');
        }
        if (diffFlags.hitMadeByBest) {
            activeFlagsFr.push("Le coup optimal frappe un blot adverse et prend l'initiative");
            activeFlagsEn.push('Optimal move hits an opponent blot and seizes tempo');
        }
        if (diffFlags.rearCheckerEscapedByBest) {
            activeFlagsFr.push('Le coup optimal évade un pion arrière hors du camp adverse');
            activeFlagsEn.push('Optimal move escapes a rear checker from the opponent home board');
        }
        if (diffFlags.anchorCreatedOrKeptByBest) {
            activeFlagsFr.push("Le coup optimal sécurise ou conserve une ancre avancée");
            activeFlagsEn.push('Optimal move secures or preserves an advanced anchor');
        }
        if (diffFlags.contactBrokenByBest) {
            activeFlagsFr.push('Le coup optimal rompt le contact vers une course pure');
            activeFlagsEn.push('Optimal move cleanly breaks contact into a pure race');
        }
    }
    const exactDiffDirectiveFr =
        activeFlagsFr.length > 0
            ? `\n- FAIT GÉOMÉTRIQUE DÉCISIF VÉRIFIÉ : ${activeFlagsFr.join(' ; ')}.`
            : `\n- RÈGLE STRICTE : Aucune création du Golden Point (case 5) ni du Bar Point (case 7) sur ce coup — ne mentionne PAS la création du point 5 si le coup optimal (${optimalMove}) n'y forme pas une porte.`;
    const exactDiffDirectiveEn =
        activeFlagsEn.length > 0
            ? `\n- VERIFIED DECISIVE GEOMETRIC FACT: ${activeFlagsEn.join('; ')}.`
            : `\n- STRICT RULE: Neither the Golden Point (5-point) nor the Bar Point (7-point) is newly created on this turn — do NOT claim the optimal move (${optimalMove}) makes the 5-point.`;

    if (isEn) {
        return `Here is the verified data for the position and analyzed move:

## ENGINE DIAGNOSIS:
- Verdict: ${verdict.toUpperCase()} (Equity loss: ${equityLoss.toFixed(3)})
- Move played by player: "${playedMove}"
- Optimal move recommended by engine: "${optimalMove}"
- Declared player level: ${playerLevel}${exactDiffDirectiveEn}

## MATCH CONTEXT:
${matchInfo}${marketSectionEn}

## STRATEGIC CONCEPTS EXTRACTED:
- Game situation: ${features.contactStatus === 'contact' ? 'Contact play' : 'Pure race without contact'}
- Pip count race: ${raceLeaderStr}${keithEn}
- Blot exposure after played move: ${userShots.length} blot(s) exposed, ${totalUserShots} shots/36 distinct rolls hit at least one blot (${userDirectShots} direct, ${userIndirectShots} indirect only).
  Played blots detail: ${userShots.length > 0 ? userShots.map((b) => `Point ${b.point} (${b.totalShots} shots: ${b.directShots} direct, ${b.indirectShots} indirect)`).join(', ') : 'None'}
- Blot exposure after optimal move: ${bestShots.length} blot(s), ${totalBestShots} shots/36 distinct rolls (${bestDirectShots} direct, ${bestIndirectShots} indirect only).
  Optimal blots detail: ${bestShots.length > 0 ? bestShots.map((b) => `Point ${b.point} (${b.totalShots} shots: ${b.directShots} direct, ${b.indirectShots} indirect)`).join(', ') : 'None'}${duplicationEn}
- Home board structure: ${features.boardStructure.innerBoardPoints} closed home board point(s).
- Key points control:
  - Golden Point (Point 5): ${features.boardStructure.goldenPoint ? 'Controlled' : 'Not controlled'}
  - Bar Point (Point 7): ${features.boardStructure.barPoint ? 'Controlled' : 'Not controlled'}
  - Advanced anchor: ${features.boardStructure.advancedAnchor ? 'Yes' : 'No'}
  - Longest consecutive prime: ${features.boardStructure.longestPrime} points${tacticalDiffEn}${bgsageSectionEn}${kbSectionEn}

Write your explanation in the requested strict JSON format.`;
    }

    return `Voici les données vérifiées de la position et du coup analysé :

## DIAGNOSTIC DU MOTEUR :
- Verdict : ${verdict.toUpperCase()} (Perte d'équité : ${equityLoss.toFixed(3)})
- Coup joué par le joueur : "${playedMove}"
- Coup optimal recommandé par le moteur : "${optimalMove}"
- Niveau déclaré du joueur : ${playerLevel}${exactDiffDirectiveFr}

## CONTEXTE DE MATCH :
${matchInfo}${marketSectionFr}

## CONCEPTS STRATÉGIQUES EXTRAITS :
- Situation de jeu : ${features.contactStatus === 'contact' ? 'Jeu avec contact' : 'Course pure sans contact'}
- Course aux pips : ${raceLeaderStr}${keithFr}
- Exposition des blots après le coup joué : ${userShots.length} blot(s) exposé(s), ${totalUserShots} tirs/36 distincts frappent au moins un blot (${userDirectShots} directs, ${userIndirectShots} uniquement indirects).
  Détail des blots joués : ${userShots.length > 0 ? userShots.map((b) => `Flèche ${b.point} (${b.totalShots} tirs : ${b.directShots} directs, ${b.indirectShots} indirects)`).join(', ') : 'Aucun'}
- Exposition des blots après le coup optimal : ${bestShots.length} blot(s), ${totalBestShots} tirs/36 distincts (${bestDirectShots} directs, ${bestIndirectShots} uniquement indirects).
  Détail des blots optimaux : ${bestShots.length > 0 ? bestShots.map((b) => `Flèche ${b.point} (${b.totalShots} tirs : ${b.directShots} directs, ${b.indirectShots} indirects)`).join(', ') : 'Aucun'}${duplicationFr}
- Structure du jan intérieur : ${features.boardStructure.innerBoardPoints} porte(s) fermée(s) dans le jan intérieur.
- Contrôle des points clés :
  - Golden Point (Point 5) : ${features.boardStructure.goldenPoint ? 'Contrôlé' : 'Non contrôlé'}
  - Bar Point (Point 7) : ${features.boardStructure.barPoint ? 'Contrôlé' : 'Non contrôlé'}
  - Ancre avancée : ${features.boardStructure.advancedAnchor ? 'Oui' : 'Non'}
  - Plus longue prime consécutive : ${features.boardStructure.longestPrime} portes consécutives${tacticalDiffFr}${bgsageSectionFr}${kbSectionFr}

Rédige ton explication au format JSON strict demandé.`;
}
