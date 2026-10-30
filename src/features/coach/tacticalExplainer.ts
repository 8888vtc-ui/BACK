/**
 * Diagnostic stratégique automatique en français (PARTIE 3.2).
 *
 * Compare géométriquement le `boardAfter` du coup OPTIMAL avec celui du coup JOUÉ
 * pour générer un texte pédagogique ciblant la tactique du Backgammon :
 *   - Sécurité / Blots (pions exposés, tirs adverses)
 *   - Construction (points clés : Golden Point 5, point 4, Bar point 7, primes)
 *   - Attaque (frappe d'un pion adverse)
 *   - Course (optimisation du bear-off)
 *   - Perte d'équité absolue (`Math.abs(equityLoss)`) conforme aux normes BMAB / XG2
 *
 * Fonction PURE : aucun accès au DOM, aucun état React, 0ms (100% hors-ligne).
 */

import type { Player } from '../../engine/backgammonEngine';

export interface TacticalExplanationParams {
    /** Plateau avant le coup. */
    readonly boardBefore: ReadonlyArray<number>;
    /** Plateau après le coup optimal. */
    readonly boardOptimal: ReadonlyArray<number>;
    /** Plateau après le coup réellement joué. */
    readonly boardPlayed: ReadonlyArray<number>;
    /** Joueur au trait. */
    readonly player: Player;
    /** Perte d'équité optionnelle (signée ou absolue). */
    readonly equityLoss?: number;
}

export interface TacticalExplanation {
    /** Texte pédagogique principal en français. */
    readonly summary: string;
    /** Concepts tactiques détectés. */
    readonly concepts: ReadonlyArray<string>;
    /** Perte d'équité absolue mathématique (`Math.abs(equityLoss)`). */
    readonly absEquityLoss: number;
}

/** Compte les blots (pions isolés exposés) d'un joueur. */
function countBlots(board: ReadonlyArray<number>, player: Player): number {
    let blots = 0;
    for (let p = 1; p <= 24; p++) {
        const v = board[p];
        if (player === 'X' ? v === 1 : v === -1) blots++;
    }
    return blots;
}

/** Compte les points fermés (portes) d'un joueur dans son jan intérieur. */
function countHomePoints(board: ReadonlyArray<number>, player: Player): number {
    let points = 0;
    const range = player === 'X' ? [1, 2, 3, 4, 5, 6] : [19, 20, 21, 22, 23, 24];
    for (const p of range) {
        const v = board[p];
        const count = player === 'X' ? v : -v;
        if (count >= 2) points++;
    }
    return points;
}

/** Détecte si un point clé (5, 4, 7 pour X ; 20, 21, 18 pour O) a été construit. */
function hasKeyPoint(board: ReadonlyArray<number>, player: Player, point: number): boolean {
    const targetPoint = player === 'X' ? point : 25 - point;
    const v = board[targetPoint];
    const count = player === 'X' ? v : -v;
    return count >= 2;
}

/** Compte les pions sortis (bear-off). */
function countOff(board: ReadonlyArray<number>, player: Player): number {
    let onBoard = 0;
    const barIdx = player === 'X' ? 0 : 25;
    const barVal = board[barIdx] ?? 0;
    onBoard += player === 'X' ? Math.max(0, barVal) : Math.max(0, -barVal);
    for (let p = 1; p <= 24; p++) {
        const v = board[p];
        if (player === 'X' && v > 0) onBoard += v;
        if (player === 'O' && v < 0) onBoard += -v;
    }
    return Math.max(0, 15 - onBoard);
}

/** Retourne le nombre de pions du joueur sur sa flèche relative `relPoint` (1..24). */
function countPlayerAtRelativePoint(board: ReadonlyArray<number>, player: Player, relPoint: number): number {
    const idx = player === 'X' ? relPoint : 25 - relPoint;
    const v = board[idx] ?? 0;
    return player === 'X' ? Math.max(0, v) : Math.max(0, -v);
}

/**
 * Simule à 1 tour (les 36 lancers de dés) combien de tirages permettent au joueur
 * de fermer une nouvelle porte clé (flèches relatives 4, 5, 7, 3, 2) grâce à ses bâtisseurs.
 */
export function countConstructiveCoverRolls36(board: ReadonlyArray<number>, player: Player): number {
    const targetRelPoints = [5, 4, 7, 3, 2];
    const openTargets = targetRelPoints.filter((pt) => countPlayerAtRelativePoint(board, player, pt) < 2);
    if (openTargets.length === 0) return 0;

    // Un pion est "disponible comme bâtisseur" sur relPt s'il est seul (1) ou en surnombre (>= 3)
    const hasSpareOrBlot = (relPt: number): boolean => {
        if (relPt < 1 || relPt > 24) return false;
        const c = countPlayerAtRelativePoint(board, player, relPt);
        return c === 1 || c >= 3;
    };

    let constructiveRolls = 0;
    for (let d1 = 1; d1 <= 6; d1++) {
        for (let d2 = 1; d2 <= 6; d2++) {
            let coversAny = false;
            for (const target of openTargets) {
                const countAtTarget = countPlayerAtRelativePoint(board, player, target);
                if (countAtTarget === 1) {
                    // Un blot déjà posé (slot) n'a besoin que d'un seul dé (d1, d2 ou d1+d2) pour être couvert
                    if (
                        hasSpareOrBlot(target + d1) ||
                        hasSpareOrBlot(target + d2) ||
                        hasSpareOrBlot(target + d1 + d2)
                    ) {
                        coversAny = true;
                        break;
                    }
                } else if (countAtTarget === 0) {
                    // Case vide : besoin de d1 ET d2 depuis deux bâtisseurs (ou un double depuis une pile >= 4)
                    if (d1 !== d2 && hasSpareOrBlot(target + d1) && hasSpareOrBlot(target + d2)) {
                        coversAny = true;
                        break;
                    }
                    if (d1 === d2 && countPlayerAtRelativePoint(board, player, target + d1) >= 4) {
                        coversAny = true;
                        break;
                    }
                }
            }
            if (coversAny) constructiveRolls++;
        }
    }
    return constructiveRolls;
}

/** Compte les empilements excessifs ("chandeliers" >= 5 pions hors flèche 6 et 13 initiale). */
function countCandlesticks(board: ReadonlyArray<number>, player: Player): number {
    let stacks = 0;
    for (let rel = 1; rel <= 24; rel++) {
        const c = countPlayerAtRelativePoint(board, player, rel);
        if (c >= 5) stacks += c - 4;
    }
    return stacks;
}

/**
 * Génère un diagnostic stratégique comparant le coup optimal au coup joué (0ms, déterministe).
 */
export function explainTacticalDifference(
    params: TacticalExplanationParams,
): TacticalExplanation {
    const { boardOptimal, boardPlayed, player, equityLoss } = params;
    const absEquityLoss = Math.abs(equityLoss ?? 0);
    const concepts: string[] = [];
    const reasons: string[] = [];

    // 1. Sécurité / Blots
    const blotsOptimal = countBlots(boardOptimal, player);
    const blotsPlayed = countBlots(boardPlayed, player);
    if (blotsPlayed > blotsOptimal) {
        const diff = blotsPlayed - blotsOptimal;
        concepts.push('Sécurité');
        reasons.push(
            `votre coup laisse ${diff} blot${diff > 1 ? 's' : ''} de plus exposé${diff > 1 ? 's' : ''} aux tirs adverses`,
        );
    } else if (blotsPlayed < blotsOptimal) {
        concepts.push('Sécurité');
        reasons.push('votre coup sécurise davantage de pions que le coup optimal');
    }

    // 2. Construction (points clés)
    const homeOptimal = countHomePoints(boardOptimal, player);
    const homePlayed = countHomePoints(boardPlayed, player);
    if (homePlayed < homeOptimal) {
        concepts.push('Construction');
        reasons.push(
            `le coup optimal ferme ${homeOptimal - homePlayed} point${homeOptimal - homePlayed > 1 ? 's' : ''} de plus dans votre jan intérieur`,
        );
    }

    const keyPoints: Array<{ point: number; name: string }> = [
        { point: 5, name: 'Golden Point (case 5)' },
        { point: 4, name: 'point 4' },
        { point: 7, name: 'Bar point (case 7)' },
    ];
    for (const kp of keyPoints) {
        const optimalHas = hasKeyPoint(boardOptimal, player, kp.point);
        const playedHas = hasKeyPoint(boardPlayed, player, kp.point);
        if (optimalHas && !playedHas) {
            concepts.push('Point clé');
            reasons.push(`le coup optimal construit le ${kp.name}, essentiel pour la suite`);
        }
    }

    // 3. Attaque (frappe)
    const boardBefore: ReadonlyArray<number> = params.boardBefore;
    let hitsOptimal = 0;
    let hitsPlayed = 0;
    for (let p = 1; p <= 24; p++) {
        const before = boardBefore[p];
        const afterOpt = boardOptimal[p];
        const afterPlayed = boardPlayed[p];
        if (player === 'X') {
            if (before === -1 && afterOpt >= 0) hitsOptimal++;
            if (before === -1 && afterPlayed >= 0) hitsPlayed++;
        } else {
            if (before === 1 && afterOpt <= 0) hitsOptimal++;
            if (before === 1 && afterPlayed <= 0) hitsPlayed++;
        }
    }
    if (hitsOptimal > hitsPlayed) {
        concepts.push('Attaque');
        reasons.push('le coup optimal frappe un pion adverse (Tempo Hit / Blitz)');
    }

    // 4. Course / Bear-off
    const offOptimal = countOff(boardOptimal, player);
    const offPlayed = countOff(boardPlayed, player);
    if (offOptimal > offPlayed) {
        concepts.push('Course');
        reasons.push('le coup optimal sort davantage de pions (optimisation du bear-off)');
    }

    // 5. Évasion des pions arrières & préservation du Midpoint
    const optRear = countPlayerAtRelativePoint(boardOptimal, player, 24);
    const playedRear = countPlayerAtRelativePoint(boardPlayed, player, 24);
    if (optRear < playedRear) {
        concepts.push('Évasion');
        reasons.push('le coup optimal évade ou sépare un pion arrière du camp adverse avant d’être bloqué');
    }

    // 6. Dégorgement du Midpoint (Unstacking point 13) & descente de Bâtisseurs (zone 8..11)
    const beforeMid = countPlayerAtRelativePoint(boardBefore, player, 13);
    const optMid = countPlayerAtRelativePoint(boardOptimal, player, 13);
    const playedMid = countPlayerAtRelativePoint(boardPlayed, player, 13);
    if (beforeMid >= 4 && optMid < playedMid) {
        concepts.push('Bâtisseurs');
        reasons.push('le coup optimal dégorge la pile du Midpoint (point 13) pour descendre des bâtisseurs actifs');
    }

    // 7. Lookahead Constructif à 1 tour (nombre de lancers sur 36 qui ferment une porte au tour suivant)
    const optCovers36 = countConstructiveCoverRolls36(boardOptimal, player);
    const playedCovers36 = countConstructiveCoverRolls36(boardPlayed, player);
    if (optCovers36 > playedCovers36 + 2) {
        concepts.push('Couverture (/36)');
        reasons.push(
            `le coup optimal multiplie vos bons dés au prochain tour (${optCovers36}/36 lancers ferment une porte contre ${playedCovers36}/36)`,
        );
    }

    // 8. Réduction des empilements ("chandeliers" >= 5 pions) & flexibilité
    const optStacks = countCandlesticks(boardOptimal, player);
    const playedStacks = countCandlesticks(boardPlayed, player);
    if (optStacks < playedStacks && reasons.length === 0) {
        concepts.push('Flexibilité');
        reasons.push('le coup optimal évite d’empiler vos pions sur une seule flèche et maximise votre flexibilité');
    }

    let summary: string;
    if (reasons.length === 0) {
        summary =
            'Le coup optimal est légèrement supérieur, mais la différence est subtile (positionnement à long terme).';
    } else {
        summary = `Le coup optimal est meilleur car ${reasons.join(', et ')}.`;
    }

    return {
        summary,
        concepts: Object.freeze(concepts),
        absEquityLoss,
    };
}

export interface BrilliantMoveEvaluationParams {
    readonly equityLossEmg: number;
    readonly secondBestGapEmg?: number;
    readonly directShotsConceded?: number;
    readonly brokeHomePoint?: boolean;
    readonly slottedKeyPointNaked?: boolean;
    readonly hasDeepTacticalJustification?: boolean;
    readonly level?: 'fun' | 'pro';
}

/** Section 1.3 : Évalue les 4 portes mathématiques d'un « Coup Brillant (!!) ». */
export function evaluateBrilliantMoveCriteria(params: BrilliantMoveEvaluationParams): boolean {
    const {
        equityLossEmg, secondBestGapEmg = 0.030, directShotsConceded = 0,
        brokeHomePoint = false, slottedKeyPointNaked = false, hasDeepTacticalJustification = true, level = 'fun',
    } = params;
    const minGapRequired = level === 'fun' ? 0.015 : 0.025;
    if (Math.abs(equityLossEmg) > 0.005 || secondBestGapEmg < minGapRequired) return false;
    return (directShotsConceded > 0 || brokeHomePoint || slottedKeyPointNaked) && hasDeepTacticalJustification;
}

export interface BiLevelCoachMicroCopy {
    readonly headerBadge: string;
    readonly bulletDiagnostic: string;
    readonly bulletAction: string;
    readonly bulletHabitHook: string | null;
    readonly ctaPills: readonly [string, string, string];
    readonly proTelemetryLine: string;
    readonly wordCountLevel1: number;
}

/** Sections 1.3 & 1.4 : Micro-copie bi-niveau (< 3 s, 18–28 mots max sans jargon au Niveau 1, mEMG au Niveau 2). */
export function buildBiLevelCoachMicroCopy(params: {
    readonly equityLossEmg: number;
    readonly directShotsConceded?: number;
    readonly dominantTheme?: string | null;
    readonly recurringErrorCount?: number;
    readonly isBrilliantMove?: boolean;
    readonly locale?: string;
}): BiLevelCoachMicroCopy {
    const {
        equityLossEmg, directShotsConceded = 0, dominantTheme = 'CONSTRUCTION',
        recurringErrorCount = 0, isBrilliantMove = false, locale = 'fr',
    } = params;
    const isEn = locale === 'en';
    const absLoss = Math.abs(equityLossEmg);
    const mEmg = Math.round(absLoss * 1000);
    const winPctDelta = Math.min(45, Math.max(1, Math.round(absLoss * 85)));

    const headerBadge = isBrilliantMove
        ? isEn ? '😱 Brilliant Move (+11% win)' : '😱 Coup Brillant (+11 % de victoire)'
        : absLoss <= 0.015
          ? isEn ? '⭐ Best Move (+1% win)' : '⭐ Meilleur Coup (Optimal)'
          : absLoss < 0.045
            ? isEn ? `🤔 Inaccuracy (-${winPctDelta}% win)` : `🤔 Imprécision (-${winPctDelta} % de victoire)`
            : absLoss < 0.080
              ? isEn ? `❓ Mistake (-${winPctDelta}% win)` : `❓ Erreur (-${winPctDelta} % de victoire)`
              : isEn ? `😵 Blunder (-${winPctDelta}% win)` : `😵 Gaffe (-${winPctDelta} % de victoire)`;

    const bulletDiagnostic = directShotsConceded > 0
        ? isEn ? `This lone checker gives ${directShotsConceded} rolls out of 36 to hit you.` : `Ce pion isolé donne ${directShotsConceded} lancers sur 36 pour te frapper.`
        : isEn ? 'Your checkers are stacked too high: they sleep instead of helping.' : 'Tes pions sont empilés trop haut : ils dorment au lieu d’aider.';

    const themeUpper = (dominantTheme ?? '').toUpperCase();
    const bulletAction = themeUpper.includes('RACE') || themeUpper.includes('COURSE')
        ? isEn ? 'Run your back checkers quickly to win the race.' : 'Avance vite tes pions arrières pour gagner la course.'
        : themeUpper.includes('HOLD') || themeUpper.includes('ANCR')
          ? isEn ? 'Keep your back base to set an ambush.' : 'Garde ta base arrière pour tendre une embuscade.'
          : isEn ? 'Take point 5 instead to build an unbreakable wall.' : 'Prends plutôt la case 5 pour bâtir un mur.';

    const bulletHabitHook = recurringErrorCount >= 2
        ? isEn ? `⚠️ Your ${recurringErrorCount}th similar mistake this week.` : `⚠️ C'est ta ${recurringErrorCount}e erreur similaire cette semaine.`
        : null;
    const ctaPills: readonly [string, string, string] = isEn ? ['See danger', 'See idea', 'Retry'] : ['Voir danger', 'Voir idée', 'Réessayer'];
    const proTelemetryLine = `-${absLoss.toFixed(3)} EMG (-${mEmg} mEMG) | Shots: ${directShotsConceded}/36 | 3-ply`;
    const wordCountLevel1 = `${bulletDiagnostic} ${bulletAction}`.trim().split(/\s+/).length;

    return { headerBadge, bulletDiagnostic, bulletAction, bulletHabitHook, ctaPills, proTelemetryLine, wordCountLevel1 };
}

/** Section 2.4 (Garde-Fou #2 Anti-Paranoïa) : Tuteur Silencieux expliquant la « Chance Préparée » du Bot (/36). */
export function buildSilentTutorBotLuckExplanation(params: {
    readonly boardBeforeBotRoll: ReadonlyArray<number>;
    readonly boardAfterBotMove: ReadonlyArray<number>;
    readonly botPlayer?: Player;
    readonly locale?: string;
}): string | null {
    const { boardBeforeBotRoll, boardAfterBotMove, botPlayer = 'O', locale = 'fr' } = params;
    if (countHomePoints(boardAfterBotMove, botPlayer) <= countHomePoints(boardBeforeBotRoll, botPlayer)) return null;
    const preparedCoverRolls = countConstructiveCoverRolls36(boardBeforeBotRoll, botPlayer);
    if (preparedCoverRolls < 10) return null;
    return locale === 'en'
        ? `Well prepared: thanks to its reserve checkers, the bot had ${preparedCoverRolls} rolls out of 36 to cover this point!`
        : `Bien préparé : grâce à la position de ses pions de réserve, le bot avait ${preparedCoverRolls} lancers sur 36 pour couvrir cette case !`;
}
