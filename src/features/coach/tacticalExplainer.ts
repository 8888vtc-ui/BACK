/**
 * Diagnostic stratégique automatique en français (PARTIE 3.2).
 * Conforme : verifyCheckersPhysicallyExistOnBoard & countOpponentHittingRolls36, <= 260 lignes, 0 any.
 */

import type { Player } from '../../engine/backgammonEngine';
import { countOpponentHittingRolls36 } from '../../lib/engine/shotCounter';
import { verifyCheckersPhysicallyExistOnBoard } from './turnSnapshot';

export { verifyCheckersPhysicallyExistOnBoard };

export interface TacticalExplanationParams {
    readonly boardBefore: ReadonlyArray<number>;
    readonly boardOptimal: ReadonlyArray<number>;
    readonly boardPlayed: ReadonlyArray<number>;
    readonly player: Player;
    readonly equityLoss?: number;
    readonly playedNotation?: string;
    readonly optimalNotation?: string;
    readonly dice?: [number, number];
}

export interface TacticalExplanation {
    readonly summary: string;
    readonly concepts: ReadonlyArray<string>;
    readonly absEquityLoss: number;
}

function countBlots(b: ReadonlyArray<number>, p: Player): number {
    let blots = 0;
    for (let i = 1; i <= 24; i++) if (p === 'X' ? b[i] === 1 : b[i] === -1) blots++;
    return blots;
}

function countHomePoints(b: ReadonlyArray<number>, p: Player): number {
    let pts = 0;
    const range = p === 'X' ? [1, 2, 3, 4, 5, 6] : [19, 20, 21, 22, 23, 24];
    for (const i of range) if ((p === 'X' ? b[i] : -b[i]) >= 2) pts++;
    return pts;
}

function hasKeyPoint(b: ReadonlyArray<number>, p: Player, pt: number): boolean {
    const v = b[p === 'X' ? pt : 25 - pt];
    return (p === 'X' ? v : -v) >= 2;
}

function countOff(b: ReadonlyArray<number>, p: Player): number {
    const bar = b[p === 'X' ? 0 : 25] ?? 0;
    let onBoard = p === 'X' ? Math.max(0, bar) : Math.max(0, -bar);
    for (let i = 1; i <= 24; i++) {
        const v = b[i];
        if (p === 'X' && v > 0) onBoard += v;
        if (p === 'O' && v < 0) onBoard += -v;
    }
    return Math.max(0, 15 - onBoard);
}

function countAtRel(b: ReadonlyArray<number>, p: Player, rel: number): number {
    const v = b[p === 'X' ? rel : 25 - rel] ?? 0;
    return p === 'X' ? Math.max(0, v) : Math.max(0, -v);
}

export function countConstructiveCoverRolls36(board: ReadonlyArray<number>, player: Player): number {
    const open = [5, 4, 7, 3, 2].filter((pt) => countAtRel(board, player, pt) < 2);
    if (open.length === 0) return 0;
    const hasSpare = (pt: number) => {
        if (pt < 1 || pt > 24) return false;
        const c = countAtRel(board, player, pt);
        return c === 1 || c >= 3;
    };
    let count = 0;
    for (let d1 = 1; d1 <= 6; d1++) {
        for (let d2 = 1; d2 <= 6; d2++) {
            let ok = false;
            for (const t of open) {
                const atT = countAtRel(board, player, t);
                if (atT === 1 && (hasSpare(t + d1) || hasSpare(t + d2) || hasSpare(t + d1 + d2))) {
                    ok = true; break;
                }
                if (atT === 0 && ((d1 !== d2 && hasSpare(t + d1) && hasSpare(t + d2)) || (d1 === d2 && countAtRel(board, player, t + d1) >= 4))) {
                    ok = true; break;
                }
            }
            if (ok) count++;
        }
    }
    return count;
}

export function explainTacticalDifference(params: TacticalExplanationParams): TacticalExplanation {
    const { boardBefore, boardOptimal, boardPlayed, player, equityLoss, playedNotation, optimalNotation, dice } = params;
    const absEquityLoss = Math.abs(equityLoss ?? 0);
    const concepts: string[] = [];
    const reasons: string[] = [];

    if (playedNotation && dice && !verifyCheckersPhysicallyExistOnBoard(playedNotation, boardBefore, player, dice)) {
        return { summary: 'Coup non vérifiable sur le plateau physique.', concepts: [], absEquityLoss };
    }
    if (optimalNotation && dice && !verifyCheckersPhysicallyExistOnBoard(optimalNotation, boardBefore, player, dice)) {
        return { summary: 'Coup optimal non vérifiable sur le plateau physique.', concepts: [], absEquityLoss };
    }

    const blotsOpt = countBlots(boardOptimal, player);
    const blotsPld = countBlots(boardPlayed, player);
    const shotsPld = blotsPld > 0 ? countOpponentHittingRolls36(boardPlayed, player) : 0;
    if (blotsPld > blotsOpt) {
        const diff = blotsPld - blotsOpt;
        concepts.push('Sécurité');
        reasons.push(`votre coup laisse ${diff} blot${diff > 1 ? 's' : ''} de plus exposé${diff > 1 ? 's' : ''} aux tirs adverses${shotsPld > 0 ? ` (${shotsPld}/36 lancers)` : ''}`);
    } else if (blotsPld < blotsOpt) {
        concepts.push('Sécurité');
        reasons.push('le coup optimal prend l’initiative (bâtisseur actif ou split dynamique) au lieu d’une sécurité trop passive');
    }

    const homeOpt = countHomePoints(boardOptimal, player);
    const homePld = countHomePoints(boardPlayed, player);
    if (homePld < homeOpt) {
        concepts.push('Construction');
        reasons.push(`le coup optimal ferme ${homeOpt - homePld} point${homeOpt - homePld > 1 ? 's' : ''} de plus dans votre jan intérieur`);
    }

    const keyPoints = [{ pt: 5, name: 'Golden Point (case 5)' }, { pt: 4, name: 'point 4' }, { pt: 7, name: 'Bar point (case 7)' }];
    for (const kp of keyPoints) {
        if (hasKeyPoint(boardOptimal, player, kp.pt) && !hasKeyPoint(boardPlayed, player, kp.pt)) {
            if (!concepts.includes('Point clé')) concepts.push('Point clé');
            reasons.push(`le coup optimal construit le ${kp.name}, essentiel pour la suite`);
        }
    }

    let hitsOpt = 0;
    let hitsPld = 0;
    for (let p = 1; p <= 24; p++) {
        const bef = boardBefore[p];
        if (player === 'X') {
            if (bef === -1 && boardOptimal[p] >= 0) hitsOpt++;
            if (bef === -1 && boardPlayed[p] >= 0) hitsPld++;
        } else {
            if (bef === 1 && boardOptimal[p] <= 0) hitsOpt++;
            if (bef === 1 && boardPlayed[p] <= 0) hitsPld++;
        }
    }
    if (hitsOpt > hitsPld) {
        concepts.push('Attaque');
        reasons.push('le coup optimal frappe un pion adverse (Tempo Hit / Blitz)');
    }

    if (countOff(boardOptimal, player) > countOff(boardPlayed, player)) {
        concepts.push('Course');
        reasons.push('le coup optimal sort davantage de pions (optimisation du bear-off)');
    }

    if (countAtRel(boardOptimal, player, 24) < countAtRel(boardPlayed, player, 24)) {
        concepts.push('Évasion');
        reasons.push('le coup optimal évade ou sépare un pion arrière du camp adverse avant d’être bloqué');
    }

    if (countAtRel(boardBefore, player, 13) >= 4 && countAtRel(boardOptimal, player, 13) < countAtRel(boardPlayed, player, 13)) {
        concepts.push('Bâtisseurs');
        reasons.push('le coup optimal dégorge la pile du Midpoint (point 13) pour descendre des bâtisseurs actifs');
    }

    const optCovers36 = countConstructiveCoverRolls36(boardOptimal, player);
    const pldCovers36 = countConstructiveCoverRolls36(boardPlayed, player);
    if (optCovers36 > pldCovers36 + 2) {
        concepts.push('Couverture (/36)');
        reasons.push(`le coup optimal multiplie vos bons dés au prochain tour (${optCovers36}/36 lancers ferment une porte contre ${pldCovers36}/36)`);
    }

    const summary = reasons.length === 0
        ? 'Le coup optimal est légèrement supérieur, mais la différence est subtile (positionnement à long terme).'
        : `Le coup optimal est meilleur car ${reasons.length === 1 ? reasons[0] : `${reasons.slice(0, -1).join(', ')} et ${reasons[reasons.length - 1]}`}.`;

    return { summary, concepts: Object.freeze(concepts), absEquityLoss };
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

export function evaluateBrilliantMoveCriteria(params: BrilliantMoveEvaluationParams): boolean {
    const { equityLossEmg, secondBestGapEmg = 0.030, directShotsConceded = 0, brokeHomePoint = false, slottedKeyPointNaked = false, hasDeepTacticalJustification = true, level = 'fun' } = params;
    const minGap = level === 'fun' ? 0.015 : 0.025;
    if (Math.abs(equityLossEmg) > 0.005 || secondBestGapEmg < minGap) return false;
    return (directShotsConceded > 0 || brokeHomePoint || slottedKeyPointNaked) && hasDeepTacticalJustification;
}

export interface BiLevelCoachMicroCopy {
    readonly headerBadge: string;
    readonly bulletDiagnostic: string;
    readonly bulletAction: string;
    readonly bulletHabitHook: string | null;
    readonly dangerDetail: string;
    readonly ideaDetail: string;
    readonly ctaPills: readonly [string, string, string];
    readonly proTelemetryLine: string;
    readonly wordCountLevel1: number;
}

export function buildBiLevelCoachMicroCopy(params: {
    readonly equityLossEmg: number;
    readonly directShotsConceded?: number;
    readonly dominantTheme?: string | null;
    readonly recurringErrorCount?: number;
    readonly isBrilliantMove?: boolean;
    readonly locale?: string;
    readonly playedMoveNotation?: string | null;
    readonly bestMoveNotation?: string | null;
    readonly keyConcept?: string | null;
}): BiLevelCoachMicroCopy {
    const { equityLossEmg, directShotsConceded = 0, dominantTheme = 'CONSTRUCTION', recurringErrorCount = 0, isBrilliantMove = false, locale = 'fr', playedMoveNotation, bestMoveNotation, keyConcept } = params;
    const isEn = locale === 'en';
    const absLoss = Math.abs(equityLossEmg);
    const mEmg = Math.round(absLoss * 1000);
    const winPctDelta = Math.min(45, Math.max(1, Math.round(absLoss * 85)));

    const headerBadge = isBrilliantMove
        ? isEn ? 'Brilliant Move (+11% win)' : 'Coup Brillant (+11 % de victoire)'
        : absLoss <= 0.020 ? (isEn ? 'Best Move (+1% win)' : 'Coup Optimal')
        : absLoss < 0.080 ? (isEn ? `Inaccuracy (-${winPctDelta}% win)` : `Imprécision (-${winPctDelta} % de victoire)`)
        : isEn ? `Blunder (-${winPctDelta}% win)` : `Gaffe (-${winPctDelta} % de victoire)`;

    const conceptLower = (keyConcept ?? '').toLowerCase();
    const pld = playedMoveNotation ?? (isEn ? 'this move' : 'ce coup');
    const bst = bestMoveNotation ?? (isEn ? 'the best move' : 'le meilleur coup');

    let bulletDiagnostic = directShotsConceded > 0
        ? isEn ? `This lone checker gives ${directShotsConceded} rolls out of 36 to hit you.` : `Ce pion isolé donne ${directShotsConceded} lancers sur 36 pour te frapper.`
        : isEn ? 'Your checkers are stacked too high: they sleep instead of helping.' : 'Tes pions sont empilés trop haut : ils dorment au lieu d’aider.';
    let bulletAction = (dominantTheme ?? '').toUpperCase().includes('RACE')
        ? isEn ? 'Run your back checkers quickly to win the race.' : 'Avance vite tes pions arrières pour gagner la course.'
        : isEn ? 'Take point 5 instead to build an unbreakable wall.' : 'Prends plutôt la case 5 pour bâtir un mur.';
    const dangerDetail = directShotsConceded > 0
        ? isEn ? `${directShotsConceded} dice rolls out of 36 hit your lone checker and send it back to the bar.` : `Sur les 36 combinaisons de deux dés, ${directShotsConceded} frappent ton pion isolé et le renvoient à zéro sur la barre.`
        : isEn ? 'Stacked checkers leave your key points open for the opponent.' : 'Empiler tes pions sur une seule case laisse les cases importantes grandes ouvertes.';
    const ideaDetail = isEn
        ? 'Two checkers on the same point form an unbreakable shield and block the opponent.'
        : 'Deux pions sur la même case forment un bouclier imprenable qui bloque le passage adverse.';

    if (playedMoveNotation || bestMoveNotation) {
        if (directShotsConceded > 0) {
            bulletDiagnostic = isEn ? `Playing ${pld} leaves a lone checker exposed to ${directShotsConceded} rolls out of 36.` : `Jouer ${pld} laisse un pion seul exposé à ${directShotsConceded} lancers sur 36.`;
            bulletAction = isEn ? `Play ${bst} to protect your checkers and lock your key points.` : `Joue plutôt ${bst} pour mettre tes pions à l’abri et fermer tes portes.`;
        } else if (conceptLower.includes('golden') || conceptLower.includes('or')) {
            bulletDiagnostic = isEn ? `Playing ${pld} leaves the crucial 5-point wide open.` : `Jouer ${pld} laisse la fameuse case 5 grande ouverte devant ta maison.`;
            bulletAction = isEn ? `Play ${bst} to lock point 5, the strongest shield on the board!` : `Joue ${bst} pour fermer la case 5 : c’est le meilleur bouclier du plateau !`;
        } else {
            bulletDiagnostic = isEn ? `Playing ${pld} stacks your checkers instead of preparing new gates.` : `Jouer ${pld} entasse tes pions au même endroit au lieu de préparer la suite.`;
            bulletAction = isEn ? `Play ${bst} to place active reserve checkers for your next roll.` : `Joue ${bst} pour mieux répartir tes pions et fermer une case au prochain tour.`;
        }
    }

    const bulletHabitHook = recurringErrorCount >= 2
        ? isEn ? `Your ${recurringErrorCount}th similar mistake this week.` : `C'est ta ${recurringErrorCount}e erreur similaire cette semaine.`
        : null;
    const ctaPills: readonly [string, string, string] = isEn ? ['See danger', 'See idea', 'Retry'] : ['Voir danger', 'Voir idée', 'Réessayer'];
    const proTelemetryLine = `-${absLoss.toFixed(3)} EMG (-${mEmg} mEMG) | Shots: ${directShotsConceded}/36 | 3-ply`;
    const wordCountLevel1 = `${bulletDiagnostic} ${bulletAction}`.trim().split(/\s+/).length;

    return { headerBadge, bulletDiagnostic, bulletAction, bulletHabitHook, dangerDetail, ideaDetail, ctaPills, proTelemetryLine, wordCountLevel1 };
}

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
