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
        reasons.push(
            'le coup optimal prend l’initiative (bâtisseur actif ou split dynamique) au lieu d’une sécurité trop passive',
        );
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
            if (!concepts.includes('Point clé')) concepts.push('Point clé');
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
        const joinedReasons =
            reasons.length === 1
                ? reasons[0]
                : `${reasons.slice(0, -1).join(', ')} et ${reasons[reasons.length - 1]}`;
        summary = `Le coup optimal est meilleur car ${joinedReasons}.`;
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
    readonly dangerDetail: string;
    readonly ideaDetail: string;
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
    readonly playedMoveNotation?: string | null;
    readonly bestMoveNotation?: string | null;
    readonly keyConcept?: string | null;
}): BiLevelCoachMicroCopy {
    const {
        equityLossEmg, directShotsConceded = 0, dominantTheme = 'CONSTRUCTION',
        recurringErrorCount = 0, isBrilliantMove = false, locale = 'fr',
        playedMoveNotation, bestMoveNotation, keyConcept,
    } = params;
    const isEn = locale === 'en';
    const absLoss = Math.abs(equityLossEmg);
    const mEmg = Math.round(absLoss * 1000);
    const winPctDelta = Math.min(45, Math.max(1, Math.round(absLoss * 85)));

    const isCube =
        Boolean(playedMoveNotation && /^(Videau|Double|No double|Take|Pass)/i.test(playedMoveNotation.trim())) ||
        Boolean(bestMoveNotation && /^(Videau|Double|No double|Take|Pass)/i.test(bestMoveNotation.trim()));

    const headerBadge = isBrilliantMove
        ? isEn ? '😱 Brilliant Move (+11% win)' : '😱 Coup Brillant (+11 % de victoire)'
        : absLoss <= 0.015
          ? isEn ? '⭐ Best Move (+1% win)' : '⭐ Meilleur Coup (Optimal)'
          : absLoss < 0.045
            ? isEn ? `🤔 Inaccuracy (-${winPctDelta}% win)` : `🤔 Imprécision (-${winPctDelta} % de victoire)`
            : absLoss < 0.080
              ? isEn ? `❓ Mistake (-${winPctDelta}% win)` : `❓ Erreur (-${winPctDelta} % de victoire)`
              : isEn ? `😵 Blunder (-${winPctDelta}% win)` : `😵 Gaffe (-${winPctDelta} % de victoire)`;

    let bulletDiagnostic: string;
    let bulletAction: string;
    let dangerDetail: string;
    let ideaDetail: string;

    const conceptLower = (keyConcept ?? '').toLowerCase();
    const pld = playedMoveNotation ?? (isEn ? 'this move' : 'ce coup');
    const bst = bestMoveNotation ?? (isEn ? 'the best move' : 'le meilleur coup');

    if (isCube) {
        const pldLower = pld.toLowerCase();
        if (pldLower.includes('prendre') || pldLower.includes('take')) {
            bulletDiagnostic = isEn ? 'Accepting this double is a trap: you are too far behind.' : 'Accepter de doubler ici est un piège : ton retard est trop grand.';
            bulletAction = isEn ? 'Refuse the double (Pass) to save your points for next game.' : 'Refuse le double (Pass) pour ne perdre qu’un seul point.';
            dangerDetail = isEn ? 'Staying in this game risks losing 2 or 4 points with less than 1 chance in 5 to win.' : 'En acceptant, tu risques de perdre 2 ou 4 points avec moins d’une chance sur 5 de gagner.';
            ideaDetail = isEn ? 'Folding now costs only 1 point and keeps you alive in the match.' : 'Abandonner cette manche te coûte 1 seul point et protège la suite de ton match.';
        } else if (pldLower.includes('pass')) {
            bulletDiagnostic = isEn ? 'You gave up too early while you still had real winning chances!' : 'Tu abandonnes trop tôt alors que tu as encore toutes tes chances !';
            bulletAction = isEn ? 'Accept the double (Take): one good roll puts you back ahead.' : 'Accepte le double (Take) : un bon lancer relance toute la partie.';
            dangerDetail = isEn ? 'Passing gives your opponent a free point without making them earn it.' : 'Passer offre un point gratuit à l’adversaire sans le forcer à gagner sur le plateau.';
            ideaDetail = isEn ? 'By taking the cube, only you can redouble to 4 if the dice turn in your favor.' : 'En acceptant le dé ×2, tu deviens le seul à pouvoir doubler à ×4 si la chance tourne.';
        } else if (pldLower.includes('missed') || pldLower.includes('non doublé')) {
            bulletDiagnostic = isEn ? 'You had a big lead: you should have doubled the stakes before rolling!' : 'Tu avais une belle avance : il fallait doubler la mise avant de lancer !';
            bulletAction = isEn ? 'Offer the ×2 cube as soon as your position clearly dominates.' : 'Propose le dé ×2 dès que ta position domine clairement le plateau.';
            dangerDetail = isEn ? 'If you roll a huge number now, your opponent will quit for just 1 point.' : 'Si tu fais un très bon lancer maintenant, l’adversaire abandonnera pour 1 seul point.';
            ideaDetail = isEn ? 'Doubling before your big roll forces the opponent to pay double to keep playing.' : 'Doubler avant ton lancer force l’adversaire à jouer pour 2 points ou à te donner le point tout de suite.';
        } else {
            bulletDiagnostic = isEn ? 'You doubled too early: the game is still too close.' : 'Tu doubles trop tôt : la partie est encore trop serrée.';
            bulletAction = isEn ? 'Keep the doubling cube and play one more turn first.' : 'Garde le dé multiplicateur en réserve et joue un tour de plus.';
            dangerDetail = isEn ? 'Giving the cube away lets your opponent redouble you to 4 if they roll well.' : 'Donner le dé ×2 à l’adversaire lui permet de te punir à ×4 s’il fait un bon lancer.';
            ideaDetail = isEn ? 'Wait until your wall or race lead is stronger before raising the stakes.' : 'Attends d’avoir un mur plus solide ou une vraie avance avant de monter les enchères.';
        }
    } else if (playedMoveNotation || bestMoveNotation) {
        if (directShotsConceded > 0) {
            bulletDiagnostic = isEn
                ? `Playing ${pld} leaves a lone checker exposed to ${directShotsConceded} rolls out of 36.`
                : `Jouer ${pld} laisse un pion seul exposé à ${directShotsConceded} lancers sur 36.`;
            bulletAction = isEn
                ? `Play ${bst} to protect your checkers and lock your key points.`
                : `Joue plutôt ${bst} pour mettre tes pions à l’abri et fermer tes portes.`;
            dangerDetail = isEn
                ? `${directShotsConceded} dice combinations out of 36 send your lone checker to the bar and cost you a full turn.`
                : `L’adversaire a ${directShotsConceded} combinaisons de dés sur 36 pour frapper ton pion isolé et te faire perdre un tour complet.`;
            ideaDetail = isEn
                ? `The move ${bst} stacks two checkers together so the opponent cannot hit you.`
                : `Le coup ${bst} rassemble tes pions par deux : une case avec 2 pions devient un bouclier imprenable.`;
        } else if (conceptLower.includes('golden') || conceptLower.includes('or')) {
            bulletDiagnostic = isEn ? `Playing ${pld} leaves the crucial 5-point wide open.` : `Jouer ${pld} laisse la fameuse case 5 grande ouverte devant ta maison.`;
            bulletAction = isEn ? `Play ${bst} to lock point 5, the strongest shield on the board!` : `Joue ${bst} pour fermer la case 5 : c’est le meilleur bouclier du plateau !`;
            dangerDetail = isEn ? 'Leaving point 5 open gives the opponent an easy landing spot in your home board.' : 'Laisser la case 5 ouverte offre un refuge idéal aux pions adverses dans ton camp.';
            ideaDetail = isEn ? `Closing point 5 with ${bst} blocks opponent escapes and builds your attack.` : `Fermer la case 5 avec ${bst} bloque la sortie adverse et prépare ton mur intérieur.`;
        } else if (conceptLower.includes('bar')) {
            bulletDiagnostic = isEn ? `With ${pld}, opponent rear checkers can escape with a 6.` : `Avec ${pld}, les pions arrières adverses peuvent s’échapper avec un 6.`;
            bulletAction = isEn ? `Play ${bst} to lock point 7 and trap their back checkers.` : `Joue ${bst} pour fermer la case 7 et couper leur route d’évasion.`;
            dangerDetail = isEn ? 'If point 7 stays open, any 6 lets the opponent jump out of danger.' : 'Tant que la case 7 est libre, le moindre 6 permet à l’adversaire de s’enfuir.';
            ideaDetail = isEn ? `Securing point 7 with ${bst} builds a wall right at the exit of your home board.` : `Bloquer la case 7 avec ${bst} dresse une barrière juste à la sortie de ta maison.`;
        } else if (conceptLower.includes('prime')) {
            bulletDiagnostic = isEn ? `Playing ${pld} leaves a gap in your wall of consecutive points.` : `Jouer ${pld} laisse un trou dans ton mur de portes consécutives.`;
            bulletAction = isEn ? `Play ${bst} to extend your wall and trap the opponent behind it.` : `Joue ${bst} pour allonger ton mur continu et enfermer l’adversaire.`;
            dangerDetail = isEn ? 'A wall with a gap lets the opponent jump through on a single fortunate roll.' : 'Un mur avec un trou permet aux pions adverses de sauter par-dessus au prochain dé.';
            ideaDetail = isEn ? `By chaining consecutive closed points with ${bst}, no die from 1 to 6 can pass.` : `En alignant plusieurs cases fermées d’affilée avec ${bst}, l’adversaire est pris au piège.`;
        } else if (conceptLower.includes('tempo') || conceptLower.includes('frappe') || conceptLower.includes('hit')) {
            bulletDiagnostic = isEn ? `Playing ${pld} is too passive and lets the opponent blot survive.` : `Jouer ${pld} est trop doux et laisse un pion adverse tranquille.`;
            bulletAction = isEn ? `Hit with ${bst} to send their checker to the bar and gain a turn!` : `Frappe avec ${bst} pour envoyer son pion sur la barre et gagner un tour !`;
            dangerDetail = isEn ? 'Leaving an enemy checker untouched lets them close a point on their next roll.' : 'Si tu ne frappes pas ce pion isolé, l’adversaire s’en servira au prochain tour pour fermer une porte.';
            ideaDetail = isEn ? `Hitting with ${bst} forces your opponent to waste their next dice re-entering from the bar.` : `Frapper avec ${bst} oblige l’adversaire à dépenser ses prochains dés pour rentrer depuis la barre.`;
        } else if (conceptLower.includes('évasion') || conceptLower.includes('escape')) {
            bulletDiagnostic = isEn ? `With ${pld}, your back checkers stay trapped in the enemy home board.` : `Avec ${pld}, tes pions du fond restent coincés dans le camp adverse.`;
            bulletAction = isEn ? `Run with ${bst} to free your back checker before the trap closes.` : `Avance vite avec ${bst} pour libérer ton pion arrière avant d’être bloqué.`;
            dangerDetail = isEn ? 'Staying behind too long lets the opponent build a wall and lock you in for a gammon.' : 'Rester coincé au fond permet à l’adversaire de construire un mur et de te gagner double (Gammon).';
            ideaDetail = isEn ? `Running early with ${bst} brings your rear checker to safety in the open field.` : `Fuir dès maintenant avec ${bst} met ton pion arrière hors de portée du barrage adverse.`;
        } else if (conceptLower.includes('course') || conceptLower.includes('race') || conceptLower.includes('keith')) {
            bulletDiagnostic = isEn ? `In a pure race, ${pld} wastes distance and slows your bear-off.` : `Dans la course vers la sortie, ${pld} fait perdre du temps à tes pions.`;
            bulletAction = isEn ? `Play ${bst} to bring and bear off your checkers as fast as possible.` : `Joue ${bst} pour ramener et sortir tes pions de façon plus fluide.`;
            dangerDetail = isEn ? 'Piling checkers on points 1 and 2 wastes big dice later during bear-off.' : 'Empiler trop de pions sur les cases 1 et 2 te fera gaspiller tes gros dés au moment de sortir.';
            ideaDetail = isEn ? `The move ${bst} spreads your checkers evenly across points 4, 5, and 6.` : `Le coup ${bst} répartit mieux tes pions pour en sortir deux à chaque lancer.`;
        } else {
            bulletDiagnostic = isEn ? `Playing ${pld} stacks your checkers instead of preparing new gates.` : `Jouer ${pld} entasse tes pions au même endroit au lieu de préparer la suite.`;
            bulletAction = isEn ? `Play ${bst} to place active reserve checkers for your next roll.` : `Joue ${bst} pour mieux répartir tes pions et fermer une case au prochain tour.`;
            dangerDetail = isEn ? 'Checkers piled 5-high on a single point sleep and cannot cover new points.' : 'Quand 4 ou 5 pions dorment sur la même flèche, tu manques de pions libres au tour suivant.';
            ideaDetail = isEn ? `Spreading your reserve checkers with ${bst} gives you many more good dice next turn.` : `Bien placer tes pions de réserve avec ${bst} te donne beaucoup plus de bons dés au tour suivant.`;
        }
    } else {
        bulletDiagnostic = directShotsConceded > 0
            ? isEn ? `This lone checker gives ${directShotsConceded} rolls out of 36 to hit you.` : `Ce pion isolé donne ${directShotsConceded} lancers sur 36 pour te frapper.`
            : isEn ? 'Your checkers are stacked too high: they sleep instead of helping.' : 'Tes pions sont empilés trop haut : ils dorment au lieu d’aider.';

        const themeUpper = (dominantTheme ?? '').toUpperCase();
        bulletAction = themeUpper.includes('RACE') || themeUpper.includes('COURSE')
            ? isEn ? 'Run your back checkers quickly to win the race.' : 'Avance vite tes pions arrières pour gagner la course.'
            : themeUpper.includes('HOLD') || themeUpper.includes('ANCR')
              ? isEn ? 'Keep your back base to set an ambush.' : 'Garde ta base arrière pour tendre une embuscade.'
              : isEn ? 'Take point 5 instead to build an unbreakable wall.' : 'Prends plutôt la case 5 pour bâtir un mur.';

        dangerDetail = directShotsConceded > 0
            ? isEn
                ? `${directShotsConceded} dice rolls out of 36 hit your lone checker and send it back to the bar.`
                : `Sur les 36 combinaisons de deux dés, ${directShotsConceded} frappent ton pion isolé et le renvoient à zéro sur la barre.`
            : isEn
              ? 'Stacked checkers leave your key points open for the opponent.'
              : 'Empiler tes pions sur une seule case laisse les cases importantes grandes ouvertes.';
        ideaDetail = isEn
            ? 'Two checkers on the same point form an unbreakable shield and block the opponent.'
            : 'Deux pions sur la même case forment un bouclier imprenable qui bloque le passage adverse.';
    }

    const bulletHabitHook = recurringErrorCount >= 2
        ? isEn ? `⚠️ Your ${recurringErrorCount}th similar mistake this week.` : `⚠️ C'est ta ${recurringErrorCount}e erreur similaire cette semaine.`
        : null;
    const ctaPills: readonly [string, string, string] = isEn ? ['See danger', 'See idea', 'Retry'] : ['Voir danger', 'Voir idée', 'Réessayer'];
    const proTelemetryLine = `-${absLoss.toFixed(3)} EMG (-${mEmg} mEMG) | Shots: ${directShotsConceded}/36 | 3-ply`;
    const wordCountLevel1 = `${bulletDiagnostic} ${bulletAction}`.trim().split(/\s+/).length;

    return { headerBadge, bulletDiagnostic, bulletAction, bulletHabitHook, dangerDetail, ideaDetail, ctaPills, proTelemetryLine, wordCountLevel1 };
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
