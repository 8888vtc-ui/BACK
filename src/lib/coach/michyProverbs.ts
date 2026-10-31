/**
 * Référentiel Neuro-Symbolique des Proverbes de Michihito Kageyama (« Michy »),
 * des Règles de Paul Magriel et de l'EPC de Walter Trice.
 *
 * Strictement 0 `any`, < 275 lignes, 100 % pur et déterministe.
 */

import type { StrategicFeatures } from '../../features/coach/featureExtractor';
import { isBearOffPhase, isPureRace } from '../engine/effectivePipCount';

export type DominantTheme = 'RACE' | 'BLITZ' | 'PRIME' | 'HOLDING' | 'BEAROFF';

export interface MichyProverbEntry {
    readonly id: string;
    readonly name: string;
    readonly author: 'Michihito Kageyama (Michy)' | 'Paul Magriel' | 'Walter Trice' | 'Masayuki Mochizuki (Mochy)';
    readonly theme: DominantTheme;
    readonly proverbFr: string;
    readonly proverbEn: string;
    readonly tacticalRuleFr: string;
    readonly tacticalRuleEn: string;
    readonly socraticQuestionFr: string;
    readonly socraticQuestionEn: string;
}

export const MICHY_AND_MAGRIEL_PROVERBS: Record<string, MichyProverbEntry> = {
    GOLDEN_POINT_PRIORITY: {
        id: 'golden-point',
        name: 'Golden Point Priority',
        author: 'Michihito Kageyama (Michy)',
        theme: 'PRIME',
        proverbFr: 'Proverbe de Michy « Golden Point Priority » : La porte du 5 (et l’ancre 20) est le joyau de la couronne ; aucune alternative ne surpasse sa construction.',
        proverbEn: 'Michy’s Proverb "Golden Point Priority": The 5-point (and 20-point anchor) is the crown jewel; no alternative surpasses making it.',
        tacticalRuleFr: 'verrouiller la porte du 5 contrôle à la fois l’attaque intérieure et le confinement adverse.',
        tacticalRuleEn: 'locking the 5-point commands both inner-board attack and opponent containment.',
        socraticQuestionFr: 'Quelle porte maîtresse auriez-vous pu verrouiller immédiatement pour commander à la fois l’attaque et la défense ?',
        socraticQuestionEn: 'Which master point could you have locked down immediately to command both offense and defense?',
    },
    BREAK_THE_MOUNTAIN: {
        id: 'michy-proverbs-opening',
        name: 'Break the Mountain',
        author: 'Michihito Kageyama (Michy)',
        theme: 'PRIME',
        proverbFr: 'Proverbe de Michy « Break the Mountain » : Démontez la montagne des 5 pions sur la flèche 6 ou 13 pour distribuer des bâtisseurs actifs.',
        proverbEn: 'Michy’s Proverb "Break the Mountain": Unstack the 5-checker mountain on point 6 or 13 to distribute active builders.',
        tacticalRuleFr: 'un chandelier de 5 pions immobilise votre potentiel de construction de portes.',
        tacticalRuleEn: 'a 5-checker candlestick freezes your point-making potential.',
        socraticQuestionFr: 'Pourquoi conserver une tour rigide de 5 pions quand vos petits dés permettent d’alimenter vos points intérieurs ?',
        socraticQuestionEn: 'Why keep a rigid 5-checker tower when your small dice can feed your inner board points?',
    },
    PROVERB_17_THREE_PIPS: {
        id: 'running-game',
        name: 'Proverb 17 — Break Contact 3 Pips Away',
        author: 'Michihito Kageyama (Michy)',
        theme: 'HOLDING',
        proverbFr: 'Proverbe 17 de Michy (« Rompre le contact à 3 pips ») : Videz en priorité la flèche située 3 pips devant l’ancre adverse (8 contre 20, 7 contre 21).',
        proverbEn: 'Michy’s Proverb 17 ("Break off contact 3 pips away"): Clear the point 3 pips in front of the opponent anchor first (8 vs 20, 7 vs 21).',
        tacticalRuleFr: 'purger la flèche située 3 pips devant l’ancre adverse élimine les doubles frappes les plus dangereuses.',
        tacticalRuleEn: 'clearing the point 3 pips in front of the opponent anchor neutralizes dangerous hitting numbers.',
        socraticQuestionFr: 'Quelle flèche extérieure située à exactement 3 pips de l’ancre adverse pouviez-vous vider sans laisser de tir ?',
        socraticQuestionEn: 'Which outer point located 3 pips ahead of the opponent anchor could you clear safely?',
    },
    DOUBLE_TIGER: {
        id: 'blitz-attack',
        name: 'Double Tiger',
        author: 'Michihito Kageyama (Michy)',
        theme: 'BLITZ',
        proverbFr: 'Proverbe de Michy « Double Tiger » : Frapper deux blots dans le jan intérieur saisit l’initiative et écrase le tempo adverse.',
        proverbEn: 'Michy’s Proverb "Double Tiger": Hitting two blots inside the home board seizes the initiative and crushes opponent tempo.',
        tacticalRuleFr: 'mettre deux pions adverses sur la barre paralyse sa réentrée et accélère le Blitz vers le gammon.',
        tacticalRuleEn: 'putting two opponent checkers on the bar paralyzes reentry and accelerates the Blitz toward a gammon.',
        socraticQuestionFr: 'En laissant l’adversaire respirer dans votre jan intérieur, quelle pression de Blitz abandonnez-vous ?',
        socraticQuestionEn: 'By letting your opponent breathe inside your home board, what Blitz pressure are you giving up?',
    },
    LOVERS_LEAP: {
        id: 'running-game',
        name: "Lover's Leap",
        author: 'Michihito Kageyama (Michy)',
        theme: 'RACE',
        proverbFr: 'Proverbe de Michy « Lover’s Leap » : Évadez immédiatement un pion arrière jusqu’au point médian 13 avant que la prime adverse ne se referme.',
        proverbEn: 'Michy’s Proverb "Lover’s Leap": Immediately escape a back checker to the midpoint 13 before the opponent’s prime closes.',
        tacticalRuleFr: 'un pion arrière libéré vers le point 13 brise toute tentative d’étouffement par prime.',
        tacticalRuleEn: 'escaping a rear checker to the midpoint 13 breaks any opponent priming attempt.',
        socraticQuestionFr: 'Que deviendront vos pions arrières sur la case 24 si l’adversaire érige sa barricade au prochain tour ?',
        socraticQuestionEn: 'What will happen to your back checkers on the 24-point if the opponent builds their prime next turn?',
    },
    AMOEBA_PLAY: {
        id: 'michy-endgame-technique',
        name: 'Amoeba Play',
        author: 'Michihito Kageyama (Michy)',
        theme: 'BEAROFF',
        proverbFr: 'Proverbe de Michy « Amoeba Play » : Étalez vos pions en paires souples (6-5-4-3) comme une amibe pour absorber tout tirage sans laisser de blot.',
        proverbEn: 'Michy’s Proverb "Amoeba Play": Spread your checkers in flexible pairs (6-5-4-3) like an amoeba to absorb any roll without leaving a blot.',
        tacticalRuleFr: 'une distribution plate absorbe les gros dés sans jamais découvrir de pion sous le feu de l’ancre.',
        tacticalRuleEn: 'a smooth distribution absorbs big rolls without ever exposing a blot to the opponent anchor.',
        socraticQuestionFr: 'Votre empilement rigide ne risque-t-il pas de forcer un blot fatal au prochain gros lancer sous contact ?',
        socraticQuestionEn: 'Does your rigid stack risk forcing a fatal blot on the next high roll under contact?',
    },
    MAGRIEL_SAFE_VS_BOLD: {
        id: 'pure-play',
        name: 'Magriel Safe vs Bold Criterion',
        author: 'Paul Magriel',
        theme: 'RACE',
        proverbFr: 'Règle de Magriel (« Safe vs Bold Play ») : En avance à la course, jouez la sécurité absolue et rompez le contact ; en retard, maintenez le contact.',
        proverbEn: 'Magriel’s Rule ("Safe vs Bold Play"): When ahead in the race, play safe and break contact; when behind, maintain contact.',
        tacticalRuleFr: 'quand vous menez aux pips ou possédez un jan plus fort, la sécurité pure préserve votre avantage.',
        tacticalRuleEn: 'when leading in the race or holding a stronger home board, pure safety locks in your equity.',
        socraticQuestionFr: 'Avec votre avance aux pips, pourquoi offrir des tirs directs gratuits qui permettent à l’adversaire de renverser la partie ?',
        socraticQuestionEn: 'With your pip lead, why concede free direct shots that let your opponent flip the game?',
    },
    HOLDING_ANCHOR_LOCK: {
        id: 'advanced-anchor',
        name: 'Advanced Anchor & Butterfly Discipline',
        author: 'Paul Magriel',
        theme: 'HOLDING',
        proverbFr: 'Règle de Magriel & Michy (« Ancre Avancée vs Glued Checkers ») : Conservez votre ancre haute (20 ou 21) tant que le contact subsiste.',
        proverbEn: 'Magriel & Michy Rule ("Advanced Anchor vs Glued Checkers"): Hold your high anchor (20 or 21) as long as contact remains.',
        tacticalRuleFr: 'démonter son ancre avancée sans nécessité offre le contrôle total de l’outfield à l’adversaire.',
        tacticalRuleEn: 'abandoning an advanced anchor prematurely surrenders total outfield control to the opponent.',
        socraticQuestionFr: 'Sans votre ancre avancée, quel filet de sécurité vous reste-t-il si un blot est frappé en chemin ?',
        socraticQuestionEn: 'Without your advanced anchor, what safety net remains if a blot gets hit on the way home?',
    },
    TRICE_EPC_EFFICIENCY: {
        id: 'trice-epc',
        name: 'Trice EPC Wastage Minimization',
        author: 'Walter Trice',
        theme: 'BEAROFF',
        proverbFr: 'Loi EPC de Walter Trice (Théorème 7n+1) : En course pure et bear-off, minimisez le gaspillage (wastage) en évitant d’empiler les flèches 1 et 2.',
        proverbEn: 'Walter Trice’s EPC Law (7n+1 Theorem): In a pure race and bear-off, minimize pip wastage by avoiding stacks on the 1 and 2 points.',
        tacticalRuleFr: 'chaque pion enterré sur les flèches 1 et 2 alourdit votre gaspillage de pips effectifs (EPC).',
        tacticalRuleEn: 'every checker buried on the 1 and 2 points inflates your Effective Pip Count (EPC) wastage.',
        socraticQuestionFr: 'Combien de pips effectifs (EPC) gaspillez-vous en enterrant des pions sur les flèches basses 1 et 2 ?',
        socraticQuestionEn: 'How many Effective Pips (EPC) are you wasting by burying checkers on the low 1 and 2 points?',
    },
    MOCHY_DUPLICATION: {
        id: 'duplication',
        name: 'Mochy Duplication Shield',
        author: 'Masayuki Mochizuki (Mochy)',
        theme: 'HOLDING',
        proverbFr: 'Règle de Duplication de Mochy : Réduisez les tirs directs concédés et dupliquez les dés adverses pour diviser leur efficacité par deux.',
        proverbEn: 'Mochy’s Duplication Rule: Minimize direct shots conceded and duplicate opponent numbers to halve their effectiveness.',
        tacticalRuleFr: 'réduire les tirs directs sur 36 et dupliquer les bons dés adverses protège contre le gammon.',
        tacticalRuleEn: 'cutting direct shots out of 36 and duplicating opponent good numbers shields against gammons.',
        socraticQuestionFr: 'Quel déplacement permettait de réduire de moitié les tirs directs sur 36 offerts à votre adversaire ?',
        socraticQuestionEn: 'Which play would have cut in half the direct shots out of 36 conceded to your opponent?',
    },
};

export interface LightweightThemeInput {
    archetype?: string;
    gamePhase?: string;
    conceptId?: string;
    primeLength?: number;
    opponentBarCount?: number;
    homeBoardPointsMade?: number;
    playerPipCount?: number;
    opponentPipCount?: number;
}

export function computeMagrielSafeVsBoldScore(params: {
    homeBoardPointsPlayer: number;
    homeBoardPointsOpponent?: number;
    playerPipCount: number;
    opponentPipCount: number;
    opponentBarCount?: number;
    backCheckersCount?: number;
}): { score: number; posture: 'BOLD' | 'SAFE'; rationaleFr: string; rationaleEn: string } {
    const deltaHome = params.homeBoardPointsPlayer - (params.homeBoardPointsOpponent ?? 2);
    const raceLead = params.opponentPipCount - params.playerPipCount;
    const deltaRaceNorm = Math.max(-2, Math.min(2, Math.round(raceLead / 12)));
    const barOpp = params.opponentBarCount ?? 0;
    const backMen = params.backCheckersCount ?? 2;

    const score = 2 * deltaHome + deltaRaceNorm + barOpp - 2 * Math.max(0, backMen - 2);
    const posture = score >= 1 ? 'BOLD' : 'SAFE';

    return {
        score,
        posture,
        rationaleFr:
            posture === 'BOLD'
                ? `Critère de Magriel (+${score}) : votre jan intérieur (${params.homeBoardPointsPlayer} portes) autorise le jeu actif/pur.`
                : `Critère de Magriel (${score}) : privilégiez la sécurité maximale et la couverture des blots.`,
        rationaleEn:
            posture === 'BOLD'
                ? `Magriel Criterion (+${score}): your inner board (${params.homeBoardPointsPlayer} points) justifies bold/pure play.`
                : `Magriel Criterion (${score}): prioritize maximum safety and blot coverage.`,
    };
}

function isStrategicFeatures(input: StrategicFeatures | LightweightThemeInput): input is StrategicFeatures {
    return 'pipCountDiff' in input && 'boardStructure' in input;
}

export function classifyDominantTheme(
    input: StrategicFeatures | LightweightThemeInput,
    board?: ReadonlyArray<number>,
): DominantTheme {
    if (isStrategicFeatures(input)) {
        const player = input.player ?? 'X';
        if (board && board.length >= 26) {
            const mutableBoard = [...board];
            if (isBearOffPhase(mutableBoard, player)) return 'BEAROFF';
            if (isPureRace(mutableBoard)) return 'RACE';
        }
        if (input.contactStatus === 'pureRace') {
            return input.pipCountDiff.player <= 70 ? 'BEAROFF' : 'RACE';
        }
        const plan = (input.bgsage?.playerGamePlan ?? '').toLowerCase();
        if (plan.includes('bear') || plan.includes('sortie')) return 'BEAROFF';
        if (plan.includes('blitz') || plan.includes('attack')) return 'BLITZ';
        if (plan.includes('prime') || plan.includes('barrage')) return 'PRIME';
        if (plan.includes('hold') || plan.includes('anchor')) return 'HOLDING';
        if (plan.includes('race') || plan.includes('course')) return 'RACE';

        const structure = input.boardStructure;
        if (structure.longestPrime >= 4 || (structure.goldenPoint && structure.barPoint)) return 'PRIME';
        if (structure.innerBoardPoints >= 4 && !structure.advancedAnchor) return 'BLITZ';
        if (structure.advancedAnchor && input.pipCountDiff.diff > 4) return 'HOLDING';
        if (Math.abs(input.pipCountDiff.diff) >= 12 && input.pipCountDiff.leader === player) return 'RACE';
        if (structure.advancedAnchor) return 'HOLDING';
        return 'PRIME';
    }

    const phase = (input.gamePhase ?? '').toLowerCase();
    const arch = (input.archetype ?? '').toLowerCase();
    const cid = (input.conceptId ?? '').toLowerCase();
    if (phase.includes('bear') || arch.includes('bear') || (input.playerPipCount ?? 150) <= 65) return 'BEAROFF';
    if (cid === 'keith-count' || cid === 'running-game' || phase === 'race' || arch.includes('race') || arch.includes('course')) return 'RACE';
    if (cid === 'tempo-hit' || arch.includes('blitz') || ((input.opponentBarCount ?? 0) >= 1 && (input.homeBoardPointsMade ?? 0) >= 4)) return 'BLITZ';
    if (cid === 'golden-point' || cid === 'bar-point' || cid === 'prime-vs-prime' || arch.includes('prime') || (input.primeLength ?? 0) >= 4) return 'PRIME';
    if (cid === 'advanced-anchor' || cid === 'back-checker-escape' || arch.includes('hold') || arch.includes('anchor')) return 'HOLDING';
    if (((input.opponentPipCount ?? 150) - (input.playerPipCount ?? 150)) >= 15) return 'RACE';
    return 'PRIME';
}

export interface ProverbSelectorParams {
    dominantTheme?: DominantTheme;
    theme?: DominantTheme;
    conceptId?: string;
    playedMove?: string;
    optimalMove?: string;
    bestMoveNotation?: string;
    features?: StrategicFeatures;
    directShotsBefore?: number;
    directShotsAfter?: number;
    primeLength?: number;
    blotsLeft?: number;
    playerPipCount?: number;
    opponentPipCount?: number;
}

export function selectMichyOrMagrielProverb(params: ProverbSelectorParams): MichyProverbEntry {
    const theme = params.dominantTheme ?? params.theme ?? 'PRIME';
    const optimalMove = params.optimalMove ?? params.bestMoveNotation ?? '';
    const features = params.features;
    const conceptId = params.conceptId ?? '';

    const userDirect = features
        ? features.blotsAndShots.user.reduce((s, b) => s + b.directShots, 0)
        : (params.directShotsAfter ?? 0);
    const bestDirect = features
        ? features.blotsAndShots.best.reduce((s, b) => s + b.directShots, 0)
        : (params.directShotsBefore ?? 0);
    const isLeadingRace = features
        ? features.pipCountDiff.leader === features.player
        : (params.playerPipCount ?? 150) < (params.opponentPipCount ?? 150);

    if (conceptId === 'golden-point' || features?.tacticalDiff?.goldenPointCreatedByBest) {
        return MICHY_AND_MAGRIEL_PROVERBS.GOLDEN_POINT_PRIORITY;
    }
    if (conceptId === 'back-checker-escape' || features?.tacticalDiff?.rearCheckerEscapedByBest || /\b(?:24|23)\/13\b/.test(optimalMove)) {
        return MICHY_AND_MAGRIEL_PROVERBS.LOVERS_LEAP;
    }
    if (conceptId === 'advanced-anchor' || features?.tacticalDiff?.anchorCreatedOrKeptByBest) {
        return MICHY_AND_MAGRIEL_PROVERBS.HOLDING_ANCHOR_LOCK;
    }
    if (conceptId === 'tempo-hit' || (optimalMove.match(/\*/g) ?? []).length >= 2) {
        return MICHY_AND_MAGRIEL_PROVERBS.DOUBLE_TIGER;
    }
    if (conceptId === 'keith-count' || (theme === 'RACE' && features?.contactStatus === 'pureRace')) {
        return MICHY_AND_MAGRIEL_PROVERBS.TRICE_EPC_EFFICIENCY;
    }
    if (conceptId === 'bar-point' || conceptId === 'prime-vs-prime') {
        return MICHY_AND_MAGRIEL_PROVERBS.BREAK_THE_MOUNTAIN;
    }
    if (theme === 'BEAROFF') {
        const hasContact = features ? features.contactStatus === 'contact' : false;
        return hasContact ? MICHY_AND_MAGRIEL_PROVERBS.AMOEBA_PLAY : MICHY_AND_MAGRIEL_PROVERBS.TRICE_EPC_EFFICIENCY;
    }
    if (/\b(?:\d+|bar)\/(5|20)\*?(?:\(2\)|\s+\b(?:\d+|bar)\/\1\b)/i.test(optimalMove)) {
        return MICHY_AND_MAGRIEL_PROVERBS.GOLDEN_POINT_PRIORITY;
    }
    if (/\b(?:8\/[23456]|7\/[12345])\b/.test(optimalMove) && theme === 'HOLDING') {
        return MICHY_AND_MAGRIEL_PROVERBS.PROVERB_17_THREE_PIPS;
    }
    if (theme === 'BLITZ') {
        return MICHY_AND_MAGRIEL_PROVERBS.DOUBLE_TIGER;
    }
    if (userDirect > bestDirect) {
        return isLeadingRace ? MICHY_AND_MAGRIEL_PROVERBS.MAGRIEL_SAFE_VS_BOLD : MICHY_AND_MAGRIEL_PROVERBS.MOCHY_DUPLICATION;
    }
    if (theme === 'HOLDING' || features?.boardStructure.advancedAnchor) {
        return MICHY_AND_MAGRIEL_PROVERBS.HOLDING_ANCHOR_LOCK;
    }
    if (theme === 'RACE' && isLeadingRace) {
        return MICHY_AND_MAGRIEL_PROVERBS.MAGRIEL_SAFE_VS_BOLD;
    }
    return MICHY_AND_MAGRIEL_PROVERBS.BREAK_THE_MOUNTAIN;
}
