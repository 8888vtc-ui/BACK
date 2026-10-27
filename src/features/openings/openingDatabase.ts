/**
 * Bibliothèque Complète des 15 Ouvertures de Backgammon (Opening Book).
 *
 * Tous les jets d'ouverture possibles sont catalogués avec leur coup optimal certifié,
 * les alternatives avec leur perte d'équité (ΔEq) et l'analyse stratégique issue des rollouts.
 */

import type { OpeningEntry, OpeningScoreRegime } from './types';
import { applyMove, type MoveSequence, type Move } from '../../engine/backgammonEngine';
import {
    SCORE_VARIANTS_BY_OPENING_ID,
    applyScoreRegimeToOpening,
    detectOpeningScoreRegime,
    type DetectOpeningScoreRegimeParams,
} from './openingScoreVariants';

export { detectOpeningScoreRegime, type DetectOpeningScoreRegimeParams, type OpeningScoreRegime };

const RAW_OPENING_BOOK: OpeningEntry[] = [
    {
        id: 'opening_3_1',
        dice: [3, 1],
        name: 'Le Point d’Or (Golden Point)',
        category: 'Faire une porte',
        bestMoveNotation: '8/5 6/5',
        bestMoves: [{ from: 8, to: 5 }, { from: 6, to: 5 }],
        equity: 0.165,
        winPercentage: 58.2,
        gammonPercentage: 17.5,
        loseGammonPercentage: 8.8,
        explanation:
            'Le 3-1 est le meilleur jet d’ouverture du jeu. Construire le point 5 crée une porte maîtresse essentielle pour l’attaque (blocage du jan intérieur) et la défense (empêche l’adversaire d’y poser une ancre avancée).',
        keyRule: 'Ne jouez JAMAIS autre chose que 8/5 6/5 sur 3-1 d’ouverture.',
        masterQuote: {
            author: 'Viktor Orlov & Maître Kenji Sato',
            book: 'Traité des Ouvertures Monte-Carlo',
            proverb: '« Le Point 5 est la reine des portes : ne réfléchissez pas, construisez-le instantanément. »',
            buyUrl: '/academy/concepts/golden-point',
        },
        alternatives: [
            {
                notation: '24/21 13/12',
                equityLoss: -0.178,
                style: 'Agressif',
                description: 'Blunder majeur : néglige la porte 5 pour une dispersion inutile.',
            },
            {
                notation: '24/20',
                equityLoss: -0.164,
                style: 'Défensif',
                description: 'Créer un blot sur le point 20 sans faire la porte 5 est une erreur tactique flagrante.',
            },
        ],
    },
    {
        id: 'opening_4_2',
        dice: [4, 2],
        name: 'La Porte 4 (Inner Home Door)',
        category: 'Faire une porte',
        bestMoveNotation: '8/4 6/4',
        bestMoves: [{ from: 8, to: 4 }, { from: 6, to: 4 }],
        equity: 0.138,
        winPercentage: 56.9,
        gammonPercentage: 16.2,
        loseGammonPercentage: 9.3,
        explanation:
            'Deuxième meilleur jet d’ouverture. Faire le point 4 étend le jan intérieur et prépare un solide blitz ou prime contre les pions arrière de l’adversaire.',
        keyRule: 'Faites la porte 4 immédiatement avec 8/4 6/4.',
        masterQuote: {
            author: 'Viktor Orlov',
            book: 'Concepts Stratégiques Monte-Carlo',
            proverb: '« La porte 4 forme l’enclume de votre jan intérieur face au marteau de votre jan extérieur. »',
            buyUrl: '/academy/concepts/tardieu-strategic-concepts',
        },
        alternatives: [
            {
                notation: '24/20 13/11',
                equityLoss: -0.145,
                style: 'Agressif',
                description: 'Néglige la fabrication d’une porte intérieure pour disséminer des pions vulnérables.',
            },
        ],
    },
    {
        id: 'opening_6_1',
        dice: [6, 1],
        name: 'La Porte Bar (Point 7)',
        category: 'Faire une porte',
        bestMoveNotation: '13/7 8/7',
        bestMoves: [{ from: 13, to: 7 }, { from: 8, to: 7 }],
        equity: 0.125,
        winPercentage: 56.4,
        gammonPercentage: 14.8,
        loseGammonPercentage: 9.6,
        explanation:
            'Construire la porte bar (point 7) bloque les sorties 6 de l’adversaire depuis son fond de court (point 24). C’est le premier jalon pour bâtir une prime de 6 portes consécutives.',
        keyRule: 'Le point 7 verrouille le champ et paralyse l’échappée adverse.',
        masterQuote: {
            author: 'Paul Magriel & Viktor Orlov',
            book: 'Concepts Stratégiques Monte-Carlo',
            proverb: '« Le bar-point paralyse le dé 6 adverse et lance le compte à rebours de la prime. »',
            buyUrl: '/academy/concepts/bar-point',
        },
        alternatives: [
            {
                notation: '24/18 13/12',
                equityLoss: -0.118,
                style: 'Défensif',
                description: 'Avance un pion au point 18 sans construire de structure.',
            },
        ],
    },
    {
        id: 'opening_6_5',
        dice: [6, 5],
        name: 'Le Grand Saut de l’Amant (Lover’s Leap)',
        category: 'Échappée & Course',
        bestMoveNotation: '24/13',
        bestMoves: [{ from: 24, to: 13 }],
        equity: 0.112,
        winPercentage: 56.1,
        gammonPercentage: 10.5,
        loseGammonPercentage: 9.9,
        explanation:
            'Coup légendaire surnommé "Lover’s Leap". Échappe un pion arriéré depuis le point 24 jusqu’au point médian 13 en toute sécurité, prenant une nette avance à la course (+11 pips).',
        keyRule: 'Fuyez le fond du court en toute sécurité vers le point 13 (sauf en Gammon Go où 24/18 13/8 cherche le gammon).',
        masterQuote: {
            author: 'Maître Kenji Sato',
            book: 'Masterclass Monte-Carlo',
            proverb: '« Si un pion arrière peut s’envoler directement en sécurité, courez sans hésitation : la course gagne les matchs. »',
            buyUrl: '/academy/concepts/running-game',
        },
        alternatives: [
            {
                notation: '24/18 13/8',
                equityLoss: -0.098,
                style: 'Agressif',
                description: 'Laisse un blot sur le point 18 en jeu normal, mais devient l’arme offensive de référence en Gammon Go.',
            },
        ],
    },
    {
        id: 'opening_5_3',
        dice: [5, 3],
        name: 'La Porte 3 (3-Point Maker)',
        category: 'Faire une porte',
        bestMoveNotation: '8/3 6/3',
        bestMoves: [{ from: 8, to: 3 }, { from: 6, to: 3 }],
        equity: 0.095,
        winPercentage: 54.8,
        gammonPercentage: 14.2,
        loseGammonPercentage: 10.4,
        explanation:
            'Faire la porte 3 commence la fermeture du jan intérieur. Même si le point 5 est plus précieux, construire une porte intérieure propre reste le meilleur coup sur 5-3.',
        keyRule: 'Fabriquer la porte 3 avec 8/3 6/3 surclasse les variantes de split.',
        alternatives: [
            {
                notation: '24/21 13/8',
                equityLoss: -0.042,
                style: 'Défensif',
                description: 'Variante de split acceptable en style défensif, mais statistiquement inférieure.',
            },
        ],
    },
    {
        id: 'opening_6_3',
        dice: [6, 3],
        name: 'Le Grand Coureur (Runner & Builder)',
        category: 'Échappée & Course',
        bestMoveNotation: '24/18 13/10',
        bestMoves: [{ from: 24, to: 18 }, { from: 13, to: 10 }],
        equity: 0.052,
        winPercentage: 52.8,
        gammonPercentage: 13.5,
        loseGammonPercentage: 11.2,
        explanation:
            'Avance un coureur sur la porte bar adverse (point 18) tout en amenant un constructeur précieux sur le point 10 pour préparer l’attaque de la porte 5 ou 4 au tour suivant.',
        keyRule: '24/18 met la pression sur le jan adverse pendant que 13/10 développe le jeu.',
        alternatives: [
            {
                notation: '24/15',
                equityLoss: -0.024,
                style: 'Course',
                description: 'Course pure : pose un blot au point 15 sous le tir d’un 6 et 3 direct.',
            },
        ],
    },
    {
        id: 'opening_6_2',
        dice: [6, 2],
        name: 'Split & Constructeur 11',
        category: 'Échappée & Course',
        bestMoveNotation: '24/18 13/11',
        bestMoves: [{ from: 24, to: 18 }, { from: 13, to: 11 }],
        equity: 0.038,
        winPercentage: 52.2,
        gammonPercentage: 13.1,
        loseGammonPercentage: 11.8,
        explanation:
            'Avance un pion sur le point 18 adverse et descend un constructeur sur le point 11. Le pion sur le point 11 coopère idéalement avec les pions du point 8 et 6 pour construire les portes intérieures.',
        keyRule: 'Le split 24/18 prépare l’ancre pendant que 13/11 apporte du matériel offensif.',
        alternatives: [
            {
                notation: '24/16',
                equityLoss: -0.035,
                style: 'Course',
                description: 'Laisse un blot exposé sur la flèche 16 en plein champ.',
            },
            {
                notation: '13/7 13/11',
                equityLoss: -0.058,
                style: 'Agressif',
                description: 'Double blot en camp intérieur sans ancrage arrière.',
            },
        ],
    },
    {
        id: 'opening_6_4',
        dice: [6, 4],
        name: 'Course Longue 24/14',
        category: 'Échappée & Course',
        bestMoveNotation: '24/14',
        bestMoves: [{ from: 24, to: 14 }],
        equity: 0.032,
        winPercentage: 51.9,
        gammonPercentage: 12.8,
        loseGammonPercentage: 12.1,
        explanation:
            'Consensus moderne des rollouts Monte-Carlo 3T : 24/14 et 24/18 13/9 sont quasi ex-æquo en jeu normal, 24/14 domine en DMP et 8/2 6/2 domine en Gammon Go.',
        keyRule: '24/14 en Normal/DMP, 24/18 13/9 en Gammon Save, et 8/2 6/2 en Gammon Go.',
        alternatives: [
            {
                notation: '24/18 13/9',
                equityLoss: -0.003,
                style: 'Moderne',
                description: 'Variante quasi ex-æquo (ΔE = -0.003) qui splitte au 18 et descend sur le 9, idéale en Gammon Save.',
            },
            {
                notation: '8/2 6/2',
                equityLoss: -0.028,
                style: 'Classique',
                description: 'Fait la porte 2 : inférieur en jeu normal mais devient le coup n°1 en Gammon Go (+0.042 en valeur de gammon).',
            },
        ],
    },
    {
        id: 'opening_5_1',
        dice: [5, 1],
        name: 'Le Split & Rapatriement',
        category: 'Split & Slot',
        bestMoveNotation: '24/23 13/8',
        bestMoves: [{ from: 24, to: 23 }, { from: 13, to: 8 }],
        equity: 0.015,
        winPercentage: 51.1,
        gammonPercentage: 12.4,
        loseGammonPercentage: 12.5,
        explanation:
            'Le consensus moderne préfère le split 24/23 accompagné du rapatriement 13/8 en Normal et Gammon Save, tandis que le slot 13/8 6/5 redevient optimal en Gammon Go.',
        keyRule: 'Splittez au 23 en Normal/GS, mais slottez 13/8 6/5 en Gammon Go.',
        alternatives: [
            {
                notation: '13/8 6/5',
                equityLoss: -0.026,
                style: 'Agressif',
                description: 'Slot sur la porte 5 : trop risqué en Normal (-0.026), mais optimal en Gammon Go.',
            },
        ],
    },
    {
        id: 'opening_4_1',
        dice: [4, 1],
        name: 'Split & Constructeur 9',
        category: 'Split & Slot',
        bestMoveNotation: '24/23 13/9',
        bestMoves: [{ from: 24, to: 23 }, { from: 13, to: 9 }],
        equity: 0.018,
        winPercentage: 51.2,
        gammonPercentage: 12.5,
        loseGammonPercentage: 12.3,
        explanation:
            'Splitte au point 23 pour menacer l’ancre avancée adverse tout en posant un constructeur sur le point 9. En Gammon Go et DMP, le slot 13/9 6/5 prend la tête.',
        keyRule: '24/23 13/9 en Normal et Gammon Save ; 13/9 6/5 en Gammon Go et DMP.',
        alternatives: [
            {
                notation: '13/9 6/5',
                equityLoss: -0.007,
                style: 'Agressif',
                description: 'Slot sur la porte 5 avec constructeur au 9 : optimal en Gammon Go et DMP.',
            },
        ],
    },
    {
        id: 'opening_2_1',
        dice: [2, 1],
        name: 'Le Petit Split / Slot du Point 5',
        category: 'Split & Slot',
        bestMoveNotation: '24/23 13/11',
        bestMoves: [{ from: 24, to: 23 }, { from: 13, to: 11 }],
        equity: -0.022,
        winPercentage: 48.9,
        gammonPercentage: 11.8,
        loseGammonPercentage: 13.9,
        explanation:
            'Sur 2-1, le split 24/23 13/11 et le slot 13/11 6/5 se tiennent dans un mouchoir de poche (ΔE < 0.005). Le slot 13/11 6/5 domine en Gammon Go (et légèrement en Money), tandis que le split 24/23 13/11 domine en DMP et Gammon Save.',
        keyRule: '24/23 13/11 en DMP et Gammon Save ; 13/11 6/5 en Gammon Go.',
        alternatives: [
            {
                notation: '13/11 6/5',
                equityLoss: -0.004,
                style: 'Agressif',
                description: 'Slot du Point 5 quasi ex-æquo en Money/Normal (ΔE = -0.004) et optimal en Gammon Go.',
            },
        ],
    },
    {
        id: 'opening_3_2',
        dice: [3, 2],
        name: 'Double Développement 24/21 13/11',
        category: 'Développement',
        bestMoveNotation: '24/21 13/11',
        bestMoves: [{ from: 24, to: 21 }, { from: 13, to: 11 }],
        equity: 0.012,
        winPercentage: 50.8,
        gammonPercentage: 12.6,
        loseGammonPercentage: 12.8,
        explanation:
            'Splitte au point 21 pour disputer le point 4 adverse et descend un constructeur sur le point 11. En Gammon Go, la double descente 13/11 13/10 passe devant.',
        keyRule: 'Occupe le point 21 en Normal/DMP/GS, ou descend 13/11 13/10 en Gammon Go.',
        alternatives: [
            {
                notation: '13/10 13/11',
                equityLoss: -0.003,
                style: 'Agressif',
                description: 'Double descente de constructeurs : quasi ex-æquo en Normal et optimale en Gammon Go.',
            },
            {
                notation: '24/22 13/10',
                equityLoss: -0.024,
                style: 'Moderne',
                description: 'Splitte au 22 et descend au 10.',
            },
        ],
    },
    {
        id: 'opening_4_3',
        dice: [4, 3],
        name: 'Ancre Avancée & Constructeur',
        category: 'Développement',
        bestMoveNotation: '24/20 13/10',
        bestMoves: [{ from: 24, to: 20 }, { from: 13, to: 10 }],
        equity: 0.025,
        winPercentage: 51.5,
        gammonPercentage: 12.9,
        loseGammonPercentage: 12.4,
        explanation:
            'Le tirage quadri-modal par excellence : 24/20 13/10 en Normal, 24/21 13/9 en DMP, 13/10 13/9 en Gammon Go, et 24/21 24/20 en Gammon Save.',
        keyRule: 'Adaptez le 4-3 au score : 24/20 13/10 (Normal), 24/21 13/9 (DMP), 13/10 13/9 (GG), 24/21 24/20 (GS).',
        alternatives: [
            {
                notation: '24/21 13/9',
                equityLoss: -0.004,
                style: 'Moderne',
                description: 'Split au 21 et descente sur le 9 : quasi ex-æquo en Normal et optimal en DMP.',
            },
            {
                notation: '13/10 13/9',
                equityLoss: -0.005,
                style: 'Agressif',
                description: 'Double descente depuis le point 13 : optimal en Gammon Go.',
            },
        ],
    },
    {
        id: 'opening_5_2',
        dice: [5, 2],
        name: 'Split au 22 & Sécurité 13/8',
        category: 'Développement',
        bestMoveNotation: '24/22 13/8',
        bestMoves: [{ from: 24, to: 22 }, { from: 13, to: 8 }],
        equity: 0.008,
        winPercentage: 50.5,
        gammonPercentage: 12.1,
        loseGammonPercentage: 12.9,
        explanation:
            'Le 5 rapatrie un pion au point 8 tandis que le 2 splitte au point 22. En Gammon Go, les deux constructeurs 13/11 13/8 reprennent l’avantage.',
        keyRule: '24/22 13/8 en Normal/DMP/GS ; 13/11 13/8 en Gammon Go.',
        alternatives: [
            {
                notation: '13/8 13/11',
                equityLoss: -0.014,
                style: 'Agressif',
                description: 'Ne splitte pas et descend deux constructeurs : optimal en Gammon Go.',
            },
        ],
    },
    {
        id: 'opening_5_4',
        dice: [5, 4],
        name: 'Split au 20 & Descente au 8',
        category: 'Développement',
        bestMoveNotation: '24/20 13/8',
        bestMoves: [{ from: 24, to: 20 }, { from: 13, to: 8 }],
        equity: 0.019,
        winPercentage: 51.2,
        gammonPercentage: 12.7,
        loseGammonPercentage: 12.6,
        explanation:
            'Splitte directement au point 20 pour contester le point d’or adverse et sécurise un pion sur le point 8. En Gammon Go, 13/9 13/8 domine.',
        keyRule: '24/20 13/8 en Normal/DMP/GS ; 13/9 13/8 en Gammon Go.',
        alternatives: [
            {
                notation: '13/9 13/8',
                equityLoss: -0.022,
                style: 'Agressif',
                description: 'Descend deux constructeurs pour l’attaque : optimal en Gammon Go.',
            },
        ],
    },
];

export const OPENING_BOOK: OpeningEntry[] = RAW_OPENING_BOOK.map((entry) => ({
    ...entry,
    scoreVariants: SCORE_VARIANTS_BY_OPENING_ID[entry.id],
}));

/** Recherche l'ouverture correspondant à un jet de dés (insensible à l'ordre). */
export function getOpening(d1: number, d2: number): OpeningEntry | null {
    if (d1 === d2) return null;
    const high = Math.max(d1, d2);
    const low = Math.min(d1, d2);
    return OPENING_BOOK.find((o) => o.dice[0] === high && o.dice[1] === low) || null;
}

/** Recherche l'ouverture adaptée au régime de score Match Play (`NORMAL`, `DMP`, `GAMMON_GO`, `GAMMON_SAVE`). */
export function getOpeningForScore(d1: number, d2: number, regime: OpeningScoreRegime = 'NORMAL'): OpeningEntry | null {
    const base = getOpening(d1, d2);
    return base ? applyScoreRegimeToOpening(base, regime) : null;
}

/** Retourne l'ensemble des 15 ouvertures cataloguées. */
export function getAllOpenings(): OpeningEntry[] {
    return OPENING_BOOK;
}

/** Vérifie si le plateau correspond exactement à la position initiale de début de partie. */
export function isInitialBoardPosition(board: number[]): boolean {
    if (!board || board.length < 26) return false;
    return (
        board[1] === -2 && board[6] === 5 && board[8] === 3 && board[12] === -5 &&
        board[13] === 5 && board[17] === -3 && board[19] === -5 && board[24] === 2 &&
        (board[0] || 0) === 0 && (board[25] || 0) === 0
    );
}

/** Vérifie si les 15 pions du joueur X sont encore dans leur configuration initiale d'ouverture. */
export function isPlayerXInitialSetup(board: number[]): boolean {
    if (!board || board.length < 26) return false;
    return board[6] === 5 && board[8] === 3 && board[13] === 5 && board[24] === 2 && (board[0] || 0) === 0;
}

/** Détermine si le contexte actuel correspond à un coup d'ouverture pour le joueur X. */
export function isOpeningSituation(board: number[], dice: [number, number] | null, turnCount: number): boolean {
    if (!dice || dice[0] === dice[1] || !isPlayerXInitialSetup(board)) return false;
    return turnCount <= 1 || isInitialBoardPosition(board);
}

/** Trouve la séquence légale correspondant au coup d'ouverture optimal pour l'adversaire (O). */
export function findOpeningBookSequenceForOpponent(
    board: number[],
    dice: [number, number],
    legalSeqs: MoveSequence[],
    regime: OpeningScoreRegime = 'NORMAL',
): MoveSequence | null {
    if (!isInitialBoardPosition(board) || legalSeqs.length === 0) return null;
    const opening = getOpeningForScore(dice[0], dice[1], regime);
    if (!opening || opening.bestMoves.length === 0) return null;

    let targetBoard = board.slice();
    for (const m of opening.bestMoves) {
        const oMove: Move = { from: 25 - m.from, to: 25 - m.to };
        targetBoard = applyMove(targetBoard, oMove, 'O');
    }
    return legalSeqs.find((seq) => seq.board.every((val, idx) => val === targetBoard[idx])) ?? null;
}


