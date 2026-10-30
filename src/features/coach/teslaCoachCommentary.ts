/**
 * @file src/features/coach/teslaCoachCommentary.ts
 * @description Architecture Cognitive « Tesla 3-Secondes » (3 lignes orthogonales, zéro redondance),
 * Conversion exacte ΔEMG <-> ΔMWC% (Table Kazaross-XG2 + Janowski & Turner), et System Prompt JSON
 * ultra-contraint pour `gemini-3.8-flash` (« Cercle Monte-Carlo »).
 *
 * Strictement 0 `any`, < 400 lignes.
 */

import type { MotifDetectionResult, MotifId } from './detectPositionalMotif';
import type { Lookahead36Metrics } from './lookahead36';

export type CoachLanguage = 'fr' | 'en';
export type CoachPersonaMode = 'BEGINNER' | 'PRO';

export type GrandmasterPillarTag =
    | 'MICHY_MAKING_POINTS'
    | 'MICHY_SPLITTING_BACK_CHECKERS'
    | 'MICHY_HITTING_BLITZ'
    | 'MAGRIEL_HOLDING_TIMING'
    | 'MAGRIEL_BACKGAME_TIMING'
    | 'WOOLSEY_DICE_DUPLICATION'
    | 'TRICE_KEITH_RACE_EPC';

export interface Tesla3LineCommentary {
    readonly line1Verdict: string;
    readonly line2CausalError: string;
    readonly line3OptimalWhy36: string;
    readonly severityTier: 'OPTIMAL' | 'MICRO_LEAK' | 'DOUBTFUL' | 'BLUNDER' | 'CATASTROPHE';
    readonly badgeColorHex: '#81C995' | '#FCC934' | '#FA903E' | '#D93025' | '#F538A0';
    readonly grandmasterPillarTag: GrandmasterPillarTag;
    readonly actionCtas: readonly [string, string, string];
}

export interface MoveContextInput {
    readonly movePlayedNotation: string;
    readonly moveOptimalNotation: string;
    readonly deltaEmg: number;
    readonly playerAway: number;
    readonly oppAway: number;
    readonly cubeValue: number;
    readonly motifData: MotifDetectionResult;
    readonly lookahead: Lookahead36Metrics;
    readonly lang: CoachLanguage;
    readonly mode: CoachPersonaMode;
}

/** Table d'équité de match Kazaross-XG2 exacte de 1-away à 7-away (en %). */
export const KAZAROSS_XG2_7x7: ReadonlyArray<ReadonlyArray<number>> = [
    [50.0, 67.736, 75.076, 81.436, 84.17, 88.68, 90.68],
    [32.264, 50.0, 59.9, 66.87, 74.4, 79.9, 84.2],
    [24.924, 40.1, 50.0, 57.1, 64.795, 71.1, 76.2],
    [18.564, 33.13, 42.9, 50.0, 57.7, 64.3, 69.924],
    [15.83, 25.6, 35.205, 42.3, 50.0, 56.6, 62.638],
    [11.32, 20.1, 28.9, 35.7, 43.4, 50.0, 56.3],
    [9.32, 15.8, 23.8, 30.076, 37.362, 43.7, 50.0],
];

/** Formule analytique de Janowski au-delà de 7-away : MWC(%) ≈ 50 + 85*D / (T + 6). */
export function computeJanowskiMwcApprox(iAway: number, jAway: number): number {
    if (iAway <= 0) return 100.0;
    if (jAway <= 0) return 0.0;
    if (iAway === jAway) return 50.0;
    const trailer = Math.max(iAway, jAway);
    const diff = Math.abs(jAway - iAway);
    const leaderMwc = Math.min(99.5, 50 + (85 * diff) / (trailer + 6));
    return Number((iAway < jAway ? leaderMwc : 100 - leaderMwc).toFixed(2));
}

/** Formule mnémotechnique de Turner : MWC(%) ≈ 50 + (24/T + 3) * D. */
export function computeTurnerMwcApprox(iAway: number, jAway: number): number {
    if (iAway <= 0) return 100.0;
    if (jAway <= 0) return 0.0;
    if (iAway === jAway) return 50.0;
    const trailer = Math.max(iAway, jAway);
    const diff = Math.abs(jAway - iAway);
    const leaderMwc = Math.min(99.5, 50 + (24 / trailer + 3) * diff);
    return Number((iAway < jAway ? leaderMwc : 100 - leaderMwc).toFixed(2));
}

export function lookupKazarossMWC(iAway: number, jAway: number): number {
    if (iAway <= 0) return 100.0;
    if (jAway <= 0) return 0.0;
    if (iAway <= 7 && jAway <= 7) {
        return KAZAROSS_XG2_7x7[iAway - 1]?.[jAway - 1] ?? 50.0;
    }
    return computeJanowskiMwcApprox(iAway, jAway);
}

export function convertDeltaEmgToMwcPercent(
    deltaEmg: number,
    iAway: number,
    jAway: number,
    cubeValue: number,
): number {
    if (iAway === 0 || jAway === 0) {
        return Number(((deltaEmg / 2) * 100).toFixed(2));
    }
    const mwcMin = lookupKazarossMWC(iAway, Math.max(0, jAway - cubeValue));
    const mwcMax = lookupKazarossMWC(Math.max(0, iAway - cubeValue), jAway);
    const span = mwcMax - mwcMin;
    return Number((deltaEmg * (span / 2)).toFixed(2));
}

function naturalOddsFraction(rolls36: number, lang: CoachLanguage): string {
    if (rolls36 <= 0) return lang === 'fr' ? 'aucun risque direct' : 'zero direct risk';
    if (rolls36 <= 4) return lang === 'fr' ? 'moins d’une chance sur 9' : 'less than a 1-in-9 chance';
    if (rolls36 <= 7) return lang === 'fr' ? 'environ 1 chance sur 6' : 'roughly a 1-in-6 chance';
    if (rolls36 <= 10) return lang === 'fr' ? '1 chance sur 4' : 'a 1-in-4 chance';
    if (rolls36 <= 14) return lang === 'fr' ? '1 chance sur 3' : 'a 1-in-3 chance';
    if (rolls36 <= 20) return lang === 'fr' ? '1 chance sur 2' : 'a 1-in-2 chance';
    return lang === 'fr' ? 'plus de 2 chances sur 3' : 'over a 2-in-3 chance';
}

export function resolveGrandmasterPillarTag(motif: MotifId): GrandmasterPillarTag {
    switch (motif) {
        case 'BEAROFF_WASTAGE_EPC':
            return 'TRICE_KEITH_RACE_EPC';
        case 'EXACT_DICE_DUPLICATION':
        case 'DIRECT_VS_INDIRECT_SHOT':
        case 'SAFE_BEAR_IN_CONTACT':
            return 'WOOLSEY_DICE_DUPLICATION';
        case 'BACKGAME_DOUBLE_ANCHOR':
        case 'KILL_A_NUMBER_DEFENSE':
            return 'MAGRIEL_BACKGAME_TIMING';
        case 'HOLDING_GAME_TIMING':
            return 'MAGRIEL_HOLDING_TIMING';
        case 'SPLIT_VS_STACK_BACK':
        case 'SECURE_ADVANCED_ANCHOR':
        case 'ESCAPE_LAST_RUNNER':
            return 'MICHY_SPLITTING_BACK_CHECKERS';
        case 'BLITZ_HIT_AND_COVER':
        case 'TEMPO_HIT_OUTFIELD':
            return 'MICHY_HITTING_BLITZ';
        default:
            return 'MICHY_MAKING_POINTS';
    }
}

export function generateDeterministicCommentary(ctx: MoveContextInput): Tesla3LineCommentary {
    const absEmg = Math.abs(ctx.deltaEmg);
    const deltaMwc = convertDeltaEmgToMwcPercent(
        ctx.deltaEmg,
        ctx.playerAway,
        ctx.oppAway,
        ctx.cubeValue,
    );
    const absMwc = Math.abs(deltaMwc).toFixed(1);
    const emgFormatted = ctx.deltaEmg.toFixed(3);

    let severityTier: Tesla3LineCommentary['severityTier'] = 'OPTIMAL';
    let badgeColorHex: Tesla3LineCommentary['badgeColorHex'] = '#81C995';
    let labelFR = 'Coup Optimal';
    let labelEN = 'Optimal Play';

    if (absEmg >= 0.2) {
        severityTier = 'CATASTROPHE';
        badgeColorHex = '#F538A0';
        labelFR = 'Inversion Critique';
        labelEN = 'Critical Match Swing';
    } else if (absEmg >= 0.1) {
        severityTier = 'BLUNDER';
        badgeColorHex = '#D93025';
        labelFR = 'Gaffe Majeure';
        labelEN = 'Major Blunder';
    } else if (absEmg >= 0.05) {
        severityTier = 'DOUBTFUL';
        badgeColorHex = '#FA903E';
        labelFR = 'Coup Douteux';
        labelEN = 'Doubtful Play';
    } else if (absEmg >= 0.02) {
        severityTier = 'MICRO_LEAK';
        badgeColorHex = '#FCC934';
        labelFR = 'Micro-fuite';
        labelEN = 'Micro-leak';
    }

    const line1Verdict =
        ctx.lang === 'fr'
            ? ctx.mode === 'BEGINNER'
                ? `${labelFR} • -${absMwc}% de chances de victoire (Mieux : ${ctx.moveOptimalNotation})`
                : `${labelFR} (${emgFormatted} EMG | -${absMwc}% MWC) • Optimal : ${ctx.moveOptimalNotation} vs ${ctx.movePlayedNotation}`
            : ctx.mode === 'BEGINNER'
              ? `${labelEN} • -${absMwc}% winning chances (Best: ${ctx.moveOptimalNotation})`
              : `${labelEN} (${emgFormatted} EMG | -${absMwc}% MWC) • Best: ${ctx.moveOptimalNotation} vs ${ctx.movePlayedNotation}`;

    const m = ctx.motifData;
    const lk = ctx.lookahead;
    const pt = m.primaryPoint ?? 5;
    const dupStr = m.duplicatedDice.length > 0 ? m.duplicatedDice.join(', ') : '4, 2';

    let line2CausalError = '';
    let line3OptimalWhy36 = '';

    switch (m.motif) {
        case 'UNSTACK_MIDPOINT':
            line2CausalError =
                ctx.lang === 'fr'
                    ? ctx.mode === 'BEGINNER'
                        ? `Vous laissez 5 pions figés sur votre grande pile du milieu (case 13), ce qui paralyse votre prochain tour.`
                        : `Jouer ${ctx.movePlayedNotation} conserve une pile rigide sur le Midpoint (13) et prive l'outfield de connectivité.`
                    : ctx.mode === 'BEGINNER'
                      ? `You leave 5 checkers frozen on your middle stack (point 13), paralyzing your next turn.`
                      : `Playing ${ctx.movePlayedNotation} leaves a heavy stack on the Midpoint (13) and starves the outfield of builders.`;
            line3OptimalWhy36 =
                ctx.lang === 'fr'
                    ? ctx.mode === 'BEGINNER'
                        ? `Descendre un pion du milieu débloque ${lk.constructiveCoversOpt} lancers sur 36 (contre ${lk.constructiveCoversPlay}) pour fermer une porte.`
                        : `${ctx.moveOptimalNotation} dégorge le 13 et porte vos lancers constructifs de ${lk.constructiveCoversPlay}/36 à ${lk.constructiveCoversOpt}/36.`
                    : ctx.mode === 'BEGINNER'
                      ? `Unstacking the middle unlocks ${lk.constructiveCoversOpt} rolls out of 36 (vs ${lk.constructiveCoversPlay}) to build a new point.`
                      : `${ctx.moveOptimalNotation} unstacks the 13-point and boosts constructive covers from ${lk.constructiveCoversPlay}/36 to ${lk.constructiveCoversOpt}/36.`;
            break;

        case 'BRING_DOWN_BUILDERS':
            line2CausalError =
                ctx.lang === 'fr'
                    ? ctx.mode === 'BEGINNER'
                        ? `Votre coup manque de renforts dans la zone d'approche (cases 8 à 11) pour préparer vos futures portes.`
                        : `${ctx.movePlayedNotation} sous-déploie vos bâtisseurs en zone 8–11 (${m.buildersPlay} actifs contre ${m.buildersOpt}).`
                    : ctx.mode === 'BEGINNER'
                      ? `Your play lacks reinforcements in the building zone (points 8–11) to prepare future blocks.`
                      : `${ctx.movePlayedNotation} under-deploys builders into the 8–11 zone (${m.buildersPlay} active vs ${m.buildersOpt}).`;
            line3OptimalWhy36 =
                ctx.lang === 'fr'
                    ? ctx.mode === 'BEGINNER'
                        ? `Amener des bâtisseurs vous offre ${lk.constructiveCoversOpt} combinaisons sur 36 au prochain tour pour verrouiller votre camp.`
                        : `${ctx.moveOptimalNotation} maximise la synergie des bâtisseurs : ${lk.constructiveCoversOpt}/36 lancers constructifs contre ${lk.constructiveCoversPlay}/36.`
                    : ctx.mode === 'BEGINNER'
                      ? `Bringing down builders gives you ${lk.constructiveCoversOpt} rolls out of 36 next turn to lock down your board.`
                      : `${ctx.moveOptimalNotation} maximizes builder synergy: ${lk.constructiveCoversOpt}/36 constructive rolls vs ${lk.constructiveCoversPlay}/36.`;
            break;

        case 'SPLIT_VS_STACK_BACK':
            line2CausalError =
                ctx.lang === 'fr'
                    ? ctx.mode === 'BEGINNER'
                        ? `En gardant vos deux éclaireurs collés au fond (case 24), vous restez facile à bloquer par l'adversaire.`
                        : `${ctx.movePlayedNotation} refuse de séparer les pions arrières et empile passivement au lieu de disputer une ancre.`
                    : ctx.mode === 'BEGINNER'
                      ? `Keeping both back scouts glued together on point 24 makes them easy for your opponent to trap.`
                      : `${ctx.movePlayedNotation} fails to split the back checkers and stacks passively instead of fighting for an advanced anchor.`;
            line3OptimalWhy36 =
                ctx.lang === 'fr'
                    ? ctx.mode === 'BEGINNER'
                        ? `Avancer un éclaireur en case ${pt} prépare un abri sûr et ouvre ${lk.constructiveCoversOpt} bons lancers sur 36.`
                        : `Selon le principe de split de Michy, séparer vers la case ${pt} diversifie vos dés d'ancrage (${lk.constructiveCoversOpt}/36 vs ${lk.constructiveCoversPlay}/36).`
                    : ctx.mode === 'BEGINNER'
                      ? `Stepping a scout up to point ${pt} prepares a safe anchor and opens ${lk.constructiveCoversOpt} good rolls out of 36.`
                      : `Per Michy's splitting principle, stepping to the ${pt}-point diversifies anchoring rolls (${lk.constructiveCoversOpt}/36 vs ${lk.constructiveCoversPlay}/36).`;
            break;

        case 'INTENTIONAL_SLOTTING':
            line2CausalError =
                ctx.lang === 'fr'
                    ? ctx.mode === 'BEGINNER'
                        ? `Jouer trop prudemment vous fait rater l'occasion de préparer la porte clé numéro ${pt}.`
                        : `${ctx.movePlayedNotation} joue passivement alors que l'adversaire n'a que ${lk.oppHitRollsOpt}/36 tirs de riposte.`
                    : ctx.mode === 'BEGINNER'
                      ? `Playing too timidly misses the chance to plant a flag on key point ${pt}.`
                      : `${ctx.movePlayedNotation} plays passively when the opponent only has ${lk.oppHitRollsOpt}/36 return shots.`;
            line3OptimalWhy36 =
                ctx.lang === 'fr'
                    ? ctx.mode === 'BEGINNER'
                        ? `Poser un pion sur la case ${pt} ne risque presque rien (${naturalOddsFraction(lk.oppHitRollsOpt, 'fr')}) et prépare ${lk.constructiveCoversOpt}/36 couvertures.`
                        : `Slotter la case ${pt} (${ctx.moveOptimalNotation}) exploite le tempo : ${lk.constructiveCoversOpt}/36 couvertures au tour suivant contre ${lk.oppHitRollsOpt}/36 tirs.`
                    : ctx.mode === 'BEGINNER'
                      ? `Slotting point ${pt} carries minimal risk (${naturalOddsFraction(lk.oppHitRollsOpt, 'en')}) and sets up ${lk.constructiveCoversOpt}/36 covers.`
                      : `Slotting the ${pt}-point (${ctx.moveOptimalNotation}) seizes the initiative: ${lk.constructiveCoversOpt}/36 covers next turn vs ${lk.oppHitRollsOpt}/36 shots.`;
            break;

        case 'EXACT_DICE_DUPLICATION':
            line2CausalError =
                ctx.lang === 'fr'
                    ? ctx.mode === 'BEGINNER'
                        ? `Votre placement donne à l'adversaire trop de numéros différents pour vous frapper (${naturalOddsFraction(lk.oppHitRollsPlay, 'fr')}).`
                        : `${ctx.movePlayedNotation} disperse les distances de tir et laisse ${lk.oppHitRollsPlay}/36 lancers frappants à l'adversaire.`
                    : ctx.mode === 'BEGINNER'
                      ? `Your placement gives the opponent too many different dice numbers to hit you (${naturalOddsFraction(lk.oppHitRollsPlay, 'en')}).`
                      : `${ctx.movePlayedNotation} diversifies opponent shot distances, leaving ${lk.oppHitRollsPlay}/36 hitting rolls.`;
            line3OptimalWhy36 =
                ctx.lang === 'fr'
                    ? ctx.mode === 'BEGINNER'
                        ? `Le coup optimal force l'adversaire à avoir besoin des mêmes dés (${dupStr}), réduisant le danger à ${lk.oppHitRollsOpt}/36.`
                        : `${ctx.moveOptimalNotation} duplique exactement les dés [${dupStr}], abaissant les tirs adverses de ${lk.oppHitRollsPlay}/36 à ${lk.oppHitRollsOpt}/36.`
                    : ctx.mode === 'BEGINNER'
                      ? `The optimal move forces your opponent to need the exact same dice (${dupStr}), cutting danger to ${lk.oppHitRollsOpt}/36.`
                      : `${ctx.moveOptimalNotation} duplicates opponent dice [${dupStr}], cutting hitting rolls from ${lk.oppHitRollsPlay}/36 down to ${lk.oppHitRollsOpt}/36.`;
            break;

        case 'BEAROFF_WASTAGE_EPC':
            line2CausalError =
                ctx.lang === 'fr'
                    ? ctx.mode === 'BEGINNER'
                        ? `Vous empilez vos pions sur les petites cases (1 et 2) ou créez un trou qui fera perdre des dés plus tard.`
                        : `${ctx.movePlayedNotation} dégrade la distribution de sortie : EPC = ${m.racePlay.epc} pips (Keith = ${m.racePlay.keithCount}, gaspillage = ${m.racePlay.wastage}).`
                    : ctx.mode === 'BEGINNER'
                      ? `You pile checkers onto low points (1 and 2) or leave a gap that will waste dice rolls later.`
                      : `${ctx.movePlayedNotation} degrades bear-off distribution: EPC = ${m.racePlay.epc} pips (Keith = ${m.racePlay.keithCount}, wastage = ${m.racePlay.wastage}).`;
            line3OptimalWhy36 =
                ctx.lang === 'fr'
                    ? ctx.mode === 'BEGINNER'
                        ? `${ctx.moveOptimalNotation} garde une ligne régulière sans trou et économise ${(m.racePlay.epc - m.raceOpt.epc).toFixed(1)} pips réels de course.`
                        : `${ctx.moveOptimalNotation} minimise le wastage de Trice : EPC abaissé à ${m.raceOpt.epc} pips (Keith = ${m.raceOpt.keithCount}, PLT = ${m.raceOpt.pointOfLastTake}).`
                    : ctx.mode === 'BEGINNER'
                      ? `${ctx.moveOptimalNotation} keeps a smooth line without gaps and saves ${(m.racePlay.epc - m.raceOpt.epc).toFixed(1)} effective pips.`
                      : `${ctx.moveOptimalNotation} minimizes Trice wastage: lowers EPC to ${m.raceOpt.epc} pips (Keith = ${m.raceOpt.keithCount}, PLT = ${m.raceOpt.pointOfLastTake}).`;
            break;

        case 'HOLDING_GAME_TIMING':
            line2CausalError =
                ctx.lang === 'fr'
                    ? ctx.mode === 'BEGINNER'
                        ? `En avançant trop vite vos pions du milieu alors que vous êtes en retard, votre camp risque de s'effondrer trop tôt.`
                        : `${ctx.movePlayedNotation} brûle votre timing en Holding Game (retard de ${m.raceOpt.rawPipCount - m.raceOpt.oppPipCount} pips) et menace de casser votre jan.`
                    : ctx.mode === 'BEGINNER'
                      ? `Rushing your middle checkers forward while behind in the race risks crashing your home board too early.`
                      : `${ctx.movePlayedNotation} burns Holding Game timing (down ${m.raceOpt.rawPipCount - m.raceOpt.oppPipCount} pips) and risks a premature board crash.`;
            line3OptimalWhy36 =
                ctx.lang === 'fr'
                    ? ctx.mode === 'BEGINNER'
                        ? `${ctx.moveOptimalNotation} économise vos mouvements pour garder votre ancre haute prête à frapper au bon moment.`
                        : `${ctx.moveOptimalNotation} préserve le timing extérieur tout en tenant l'ancre et maintient ${lk.constructiveCoversOpt}/36 lancers flexibles.`
                    : ctx.mode === 'BEGINNER'
                      ? `${ctx.moveOptimalNotation} saves spare moves so your high anchor stays intact until a shot appears.`
                      : `${ctx.moveOptimalNotation} preserves outfield timing while holding the anchor and keeps ${lk.constructiveCoversOpt}/36 flexible rolls.`;
            break;

        case 'BACKGAME_DOUBLE_ANCHOR':
            line2CausalError =
                ctx.lang === 'fr'
                    ? ctx.mode === 'BEGINNER'
                        ? `Abandonner une de vos deux bases chez l'adversaire alors que vous êtes très loin en course détruit votre plan de retour.`
                        : `${ctx.movePlayedNotation} abandonne la double ancre ou gaspille du timing en Backgame (déficit de ${m.raceOpt.rawPipCount - m.raceOpt.oppPipCount} pips).`
                    : ctx.mode === 'BEGINNER'
                      ? `Giving up one of your two deep bases while far behind in the race ruins your comeback plan.`
                      : `${ctx.movePlayedNotation} surrenders the double anchor or wastes Backgame timing (${m.raceOpt.rawPipCount - m.raceOpt.oppPipCount}-pip deficit).`;
            line3OptimalWhy36 =
                ctx.lang === 'fr'
                    ? ctx.mode === 'BEGINNER'
                        ? `${ctx.moveOptimalNotation} conserve vos deux bases arrières et ralentit le jeu pour attendre le tir décisif.`
                        : `${ctx.moveOptimalNotation} maintient les deux ancres profondes et préserve le timing nécessaire pour accueillir le futur tir.`
                    : ctx.mode === 'BEGINNER'
                      ? `${ctx.moveOptimalNotation} keeps both deep anchors intact and slows down play to wait for the winning shot.`
                      : `${ctx.moveOptimalNotation} maintains both deep anchors and preserves the timing required to contain the eventual shot.`;
            break;

        default:
            line2CausalError =
                ctx.lang === 'fr'
                    ? ctx.mode === 'BEGINNER'
                        ? `Ce coup laisse ${m.strippedPointsPlay > m.strippedPointsOpt ? 'des portes fragiles à 2 pions' : `${naturalOddsFraction(lk.oppHitRollsPlay, 'fr')} d'être frappé`} au lieu de renforcer vos cases clés.`
                        : `${ctx.movePlayedNotation} laisse ${lk.oppHitRollsPlay}/36 tirs (${lk.oppDirectShotsPlay}/36 directs) et ${m.strippedPointsPlay} portes strippées.`
                    : ctx.mode === 'BEGINNER'
                      ? `This play leaves ${m.strippedPointsPlay > m.strippedPointsOpt ? 'fragile 2-checker points' : `${naturalOddsFraction(lk.oppHitRollsPlay, 'en')} of being hit`} instead of reinforcing key points.`
                      : `${ctx.movePlayedNotation} leaves ${lk.oppHitRollsPlay}/36 shots (${lk.oppDirectShotsPlay}/36 direct) and ${m.strippedPointsPlay} stripped points.`;
            line3OptimalWhy36 = ctx.lang === 'fr' ? lk.causalHeadlineFR : lk.causalHeadlineEN;
            break;
    }

    const actionCtas: readonly [string, string, string] =
        ctx.lang === 'fr'
            ? ['Voir danger', 'Voir idée', 'Réessayer']
            : ['Show threat', 'Show idea', 'Retry'];

    return {
        line1Verdict,
        line2CausalError,
        line3OptimalWhy36,
        severityTier,
        badgeColorHex,
        grandmasterPillarTag: resolveGrandmasterPillarTag(m.motif),
        actionCtas,
    };
}

export const GEMINI_COACH_SYSTEM_PROMPT = `
You are the Grandmaster Backgammon XAI Coach of "Cercle Monte-Carlo".
Your sole mission is to transform the exact deterministic telemetry provided in the user JSON payload into a razor-sharp, 3-line pedagogical explanation ("Tesla 3-Second Glance Architecture").

### 1. ABSOLUTE NEGATIVE CONSTRAINTS (ZERO GENERIC FILLER)
- NEVER output vague filler phrases in French or English such as:
  "consolide votre structure", "améliore votre position", "solidifie votre jeu", "offre un meilleur équilibre", "consolidates your structure", "improves your position", "gives a better balance", "plays it safe".
- NEVER invent dice rolls, pip counts, shot counts, or board coordinates not explicitly present in the telemetry JSON.
- NEVER repeat in Line 3 what was already stated in Line 2. Each line has a strict, non-overlapping cognitive role.

### 2. STRICT 3-LINE ARCHITECTURE & CHARACTER BUDGETS
You MUST return a valid JSON object matching the exact schema:
- "line1Verdict" (Max 65 chars): Severity label + exact Match Winning Chance loss (-X.X% MWC) + Optimal move vs Played move.
- "line2CausalError" (Max 115 chars): The specific geometric flaw of "movePlayed" based on "motif".
- "line3OptimalWhy36" (Max 125 chars): The concrete mathematical proof of why "moveOptimal" is superior, citing the exact 1-Roll Lookahead ratio out of 36, exact duplicated dice, or in pure races the exact Trice EPC and Keith Count differential.
`.trim();

export const GEMINI_COACH_RESPONSE_SCHEMA = {
    type: 'OBJECT',
    properties: {
        line1Verdict: {
            type: 'STRING',
            description: 'Line 1 (<=65 chars): Severity badge + ΔMWC% (and ΔEMG in PRO mode) + Optimal vs Played.',
        },
        line2CausalError: {
            type: 'STRING',
            description: 'Line 2 (<=115 chars): Concrete geometric flaw of the played move without any generic filler.',
        },
        line3OptimalWhy36: {
            type: 'STRING',
            description: 'Line 3 (<=125 chars): Quantified proof of the optimal move using /36 lookahead rolls, duplicated dice, or EPC/Keith count.',
        },
        grandmasterPillarTag: {
            type: 'STRING',
            enum: [
                'MICHY_MAKING_POINTS',
                'MICHY_SPLITTING_BACK_CHECKERS',
                'MICHY_HITTING_BLITZ',
                'MAGRIEL_HOLDING_TIMING',
                'MAGRIEL_BACKGAME_TIMING',
                'WOOLSEY_DICE_DUPLICATION',
                'TRICE_KEITH_RACE_EPC',
            ],
            description: 'Theoretical Grandmaster classification tag for UI badge rendering.',
        },
    },
    required: ['line1Verdict', 'line2CausalError', 'line3OptimalWhy36', 'grandmasterPillarTag'],
} as const;
