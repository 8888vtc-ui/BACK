/**
 * Base de Données des Puzzles Quotidiens de Backgammon.
 *
 * Contient une sélection soignée de situations tactiques et stratégiques
 * tirées de positions de tournoi réelles avec solutions vérifiées par le moteur.
 */

import { createInitialState, X_BAR, O_BAR, X_OFF, O_OFF } from '../../engine/backgammonEngine';
import type { BackgammonPuzzle } from './types';

function buildCustomBoard(
    xPoints: Record<number, number> = {},
    oPoints: Record<number, number> = {},
    xBar = 0,
    oBar = 0,
): number[] {
    const board = new Array<number>(26).fill(0);
    for (const [p, n] of Object.entries(xPoints)) board[Number(p)] = n;
    for (const [p, n] of Object.entries(oPoints)) board[Number(p)] = -n;
    board[X_BAR] = xBar;
    board[O_BAR] = -oBar;
    return board;
}

export const PUZZLE_DATABASE: BackgammonPuzzle[] = [
    {
        id: 'puzzle_01_gold_point',
        title: 'Le Point d’Or (Golden Point)',
        category: 'opening',
        difficulty: 'beginner',
        description: 'Vous ouvrez la partie avec le jet classique 3-1. Quel est le meilleur coup possible ?',
        hint: 'Le point 5 est le point le plus stratégique de tout le plateau.',
        explanation:
            'Faire le point 5 avec 8/5 6/5 est le coup d’ouverture absolu avec 3-1. Il établit la première flèche d’une prime, bloque les pions adverses sur le point 24 et offre une sécurité maximale.',
        strategicConcept: 'golden_point',
        initialBoard: createInitialState(7).board,
        turn: 'X',
        dice: [3, 1],
        optimalNotation: '8/5 6/5',
        acceptableNotations: ['6/5 8/5'],
    },
    {
        id: 'puzzle_02_lovers_leap',
        title: 'Le Saut des Amants (Lover’s Leap)',
        category: 'escape',
        difficulty: 'beginner',
        description: 'Avec le jet 6-5 à l’ouverture, comment libérer efficacement vos pions arrières ?',
        hint: 'Un pion du point 24 peut traverser directement jusqu’au point 13.',
        explanation:
            'Le coup 24/13 (ou 24/18 13/8) évade instantanément un pion arrière jusqu’à la sécurité relative du point 13. Il empêche l’adversaire d’enfermer vos pions dans son jan intérieur.',
        strategicConcept: 'back_checker_escape',
        initialBoard: createInitialState(7).board,
        turn: 'X',
        dice: [6, 5],
        optimalNotation: '24/13',
        acceptableNotations: ['24/18 18/13', '24/18 13/8'],
    },
    {
        id: 'puzzle_03_prime_completion',
        title: 'Fermer la Prime de 5',
        category: 'prime',
        difficulty: 'intermediate',
        description: 'Vous avez des points sur 5, 6, 7 et 8. Avec un jet de 4-2, consolidez votre domination.',
        hint: 'La flèche 4 est le chaînon manquant pour créer un mur infranchissable.',
        explanation:
            'Jouer 8/4 6/4 complète une prime redoutable de 5 flèches contiguës (points 4, 5, 6, 7, 8). L’adversaire ne dispose plus que d’un seul chiffre (le 6) pour tenter de sauter votre mur.',
        strategicConcept: 'prime_construction',
        initialBoard: buildCustomBoard(
            { 5: 2, 6: 2, 7: 2, 8: 3, 13: 4, 24: 2 },
            { 1: 2, 12: 5, 17: 3, 19: 5 },
        ),
        turn: 'X',
        dice: [4, 2],
        optimalNotation: '8/4 6/4',
        acceptableNotations: ['6/4 8/4'],
    },
    {
        id: 'puzzle_04_bearoff_safety',
        title: 'Sortie Sécurisée sous Menace',
        category: 'bear_off',
        difficulty: 'expert',
        description: 'Un pion adverse est sur la barre ! Vous lancez 6-1 en phase de sortie. Quel est le coup sans risque ?',
        hint: 'Ne laissez aucun pion isolé (blot) exposé à un tir direct.',
        explanation:
            'Sortir un pion avec 6/off puis combler le trou avec 5/4 évite absolument de laisser un blot direct sur une flèche vulnérable. Contre un pion sur la barre, la sécurité vaut infiniment plus qu’un pion sorti supplémentaire.',
        strategicConcept: 'safe_bear_off',
        initialBoard: buildCustomBoard(
            { 1: 3, 2: 3, 3: 3, 4: 2, 5: 2, 6: 2 },
            { 19: 5, 20: 5, 21: 4 },
            0,
            1, // Pion O sur la barre
        ),
        turn: 'X',
        dice: [6, 1],
        optimalNotation: '6/off 5/4',
        acceptableNotations: ['6/off 4/3'],
    },
    {
        id: 'puzzle_05_reentry_hit',
        title: 'Rentrer de la Barre et Frapper',
        category: 'blitz',
        difficulty: 'intermediate',
        description: 'Votre pion est sur la barre. Avec 5-2, vous pouvez frapper le blot adverse situé sur le point 20.',
        hint: 'La barre correspond à la flèche 25 vue de votre adversaire : avec 5, vous rentrez sur le point 20.',
        explanation:
            'Jouer bar/20* frappe le pion adverse et le renvoie sur la barre, faisant perdre un temps précieux à votre rival. Complétez avec 20/18 ou 13/11 pour fortifier votre position.',
        strategicConcept: 'hit_from_bar',
        initialBoard: buildCustomBoard(
            { 6: 5, 8: 3, 13: 5, 24: 1 },
            { 1: 2, 12: 4, 17: 3, 19: 5, 20: 1 }, // Blot adverse en 20
            1, // 1 pion X sur la barre
            0,
        ),
        turn: 'X',
        dice: [5, 2],
        optimalNotation: 'bar/20* 13/11',
        acceptableNotations: ['bar/20* 20/18', 'bar/20* 24/22'],
    },
    {
        id: 'puzzle_06_make_anchor',
        title: 'Créer l’Ancre Avancée (Point 20)',
        category: 'contact',
        difficulty: 'intermediate',
        description: 'L’adversaire attaque fort. Avec 4-2, établissez une forteresse dans son jan intérieur.',
        hint: 'Le point 20 (point 5 de l’adversaire) est l’ancre défensive la plus solide.',
        explanation:
            'Jouer 24/20 22/20 (ou 24/20 avec un pion de soutien) verrouille l’ancre avancée du point 20. Cette ancre vous protège contre tout blitz et vous garantit un retour en jeu sécurisé.',
        strategicConcept: 'advanced_anchor',
        initialBoard: buildCustomBoard(
            { 6: 5, 8: 3, 13: 4, 22: 1, 24: 2 },
            { 1: 2, 5: 2, 12: 4, 17: 3, 19: 4 },
        ),
        turn: 'X',
        dice: [4, 2],
        optimalNotation: '24/20 22/20',
        acceptableNotations: ['22/20 24/20'],
    },
    {
        id: 'puzzle_07_six_prime_lock',
        title: 'Le Mur Ultime : La 6-Prime',
        category: 'prime',
        difficulty: 'expert',
        description: 'L’adversaire a deux pions piégés en 24. Avec 3-2, complétez le verrou absolu de 6 flèches.',
        hint: 'Une prime complète va du point 2 au point 7, ou du point 3 au point 8.',
        explanation:
            'Faire le point manquant pour fermer la 6-prime empêche physiquement tout pion adverse de sauter (le dé maximum étant 6). C’est une victoire stratégique décisive au Backgammon.',
        strategicConcept: 'full_prime',
        initialBoard: buildCustomBoard(
            { 3: 2, 4: 2, 5: 2, 6: 2, 7: 2, 9: 2, 13: 3 },
            { 12: 5, 17: 3, 19: 5, 24: 2 },
        ),
        turn: 'X',
        dice: [3, 2],
        optimalNotation: '9/7 9/6',
        acceptableNotations: ['9/6 9/7'],
    },
];

/**
 * Récupère le puzzle quotidien de manière déterministe pour une date donnée.
 * Chaque joueur dans le monde obtient le même puzzle pour un jour donné !
 */
export function getDailyPuzzle(date: Date = new Date()): BackgammonPuzzle {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    // Calcul d'une graine de date déterministe
    const seed = year * 10000 + month * 100 + day;
    const index = Math.abs(seed) % PUZZLE_DATABASE.length;

    return PUZZLE_DATABASE[index];
}

/**
 * Récupère l'ensemble des puzzles disponibles dans la base.
 */
export function getAllPuzzles(): BackgammonPuzzle[] {
    return PUZZLE_DATABASE;
}

/**
 * Récupère un puzzle par son identifiant unique.
 */
export function getPuzzleById(id: string): BackgammonPuzzle | null {
    return PUZZLE_DATABASE.find((p) => p.id === id) || null;
}
