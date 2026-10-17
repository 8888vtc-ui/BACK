/**
 * Banque de Blunders de Référence (Positions d'entraînement initiales).
 *
 * Fournit 5 positions d'erreurs tactiques emblématiques calibrées sur le moteur
 * GNUBG pour permettre un entraînement immédiat même si le joueur n'a pas encore
 * accumulé de parties en local.
 */

import type { PlayerBlunderRecord } from './types';
import { X_BAR, O_BAR, X_OFF, O_OFF } from '../../engine/backgammonEngine';

export const BENCHMARK_BLUNDERS: PlayerBlunderRecord[] = [
    {
        id: 'bench_blunder_golden_point',
        createdAt: '2025-01-01T00:00:00.000Z',
        // Position initiale standard
        board: (() => {
            const b = new Array(28).fill(0);
            b[1] = -2;
            b[6] = 5;
            b[8] = 3;
            b[12] = -5;
            b[13] = 5;
            b[17] = -3;
            b[19] = -5;
            b[24] = 2;
            return b;
        })(),
        dice: [3, 1],
        player: 'X',
        playedMove: '24/21 13/12',
        optimalMove: '8/5 6/5',
        acceptableMoves: ['6/5 8/5'],
        equityLoss: 0.178,
        verdict: 'blunder',
        conceptId: 'golden_point',
        conceptName: 'Contrôle du Golden Point (Porte 5 / 20)',
        explanation:
            'Le coup 3-1 est le meilleur jet d’ouverture du jeu : il DOIT être utilisé pour fabriquer le Point 5 (8/5 6/5), le point clé de l’attaque et de la défense.',
        hint: 'Le Point 5 est la clé du jan intérieur. Cherchez à y assembler deux pions pour créer une porte maîtresse.',
        timesReviewed: 0,
        timesSolved: 0,
        isMastered: false,
    },
    {
        id: 'bench_blunder_blot_safety',
        createdAt: '2025-01-02T00:00:00.000Z',
        // X a un blot isolé sur le point 11 sous le feu direct de O
        board: (() => {
            const b = new Array(28).fill(0);
            b[1] = -2;
            b[6] = 4;
            b[7] = 2;
            b[8] = 3;
            b[11] = 1; // Blot vulnérable
            b[13] = 3;
            b[17] = -3;
            b[19] = -4;
            b[20] = -2;
            b[21] = -2;
            b[22] = -2;
            b[24] = 2;
            return b;
        })(),
        dice: [4, 2],
        player: 'X',
        playedMove: '13/9 13/11',
        optimalMove: '11/5',
        acceptableMoves: ['11/7 7/5', '11/9 9/5'],
        equityLoss: 0.215,
        verdict: 'howler',
        conceptId: 'blot_safety',
        conceptName: 'Minimisation des tirs & Sécurité des blots',
        explanation:
            'Face à un jan adverse solide, laisser traîner un pion isolé à portée directe (6 pips) est un suicide tactique. Le rapatrier en sécurité (11/5) était impératif.',
        hint: 'Un blot en plein milieu du champ est sous le tir direct de l’adversaire. Mettez-le à l’abri dans votre jan intérieur.',
        timesReviewed: 0,
        timesSolved: 0,
        isMastered: false,
    },
    {
        id: 'bench_blunder_prime_building',
        createdAt: '2025-01-03T00:00:00.000Z',
        // X a les portes 4, 5, 6, 7 et peut poser la 5ème ou 6ème porte
        board: (() => {
            const b = new Array(28).fill(0);
            b[1] = -2;
            b[4] = 2;
            b[5] = 2;
            b[6] = 2;
            b[7] = 2;
            b[8] = 3;
            b[13] = 2;
            b[17] = -3;
            b[19] = -4;
            b[20] = -2;
            b[21] = -2;
            b[22] = -2;
            b[24] = 2;
            return b;
        })(),
        dice: [5, 3],
        player: 'X',
        playedMove: '24/16',
        optimalMove: '8/3 6/3',
        acceptableMoves: ['6/3 8/3'],
        equityLoss: 0.192,
        verdict: 'blunder',
        conceptId: 'prime_building',
        conceptName: 'Construction & Maintien de Prime',
        explanation:
            'Avec les points 4, 5, 6 et 7 déjà tenus, construire la porte 3 (8/3 6/3) crée un barrage infranchissable de 5 portes consécutives (5-prime) qui paralyse les pions adverses.',
        hint: 'Regardez la porte 3 : en y assemblant deux pions, vous allongez votre mur à 5 portes consécutives.',
        timesReviewed: 0,
        timesSolved: 0,
        isMastered: false,
    },
    {
        id: 'bench_blunder_advanced_anchor',
        createdAt: '2025-01-04T00:00:00.000Z',
        // X doit choisir entre s'enfuir seul ou consolider l'ancre avancée sur le point 20 (point 5 adverse)
        board: (() => {
            const b = new Array(28).fill(0);
            b[1] = -3;
            b[3] = -2;
            b[5] = -3;
            b[6] = 5;
            b[8] = 3;
            b[12] = -3;
            b[13] = 4;
            b[19] = -4;
            b[20] = 1; // blot en camp adverse
            b[24] = 2; // deux pions au fond
            return b;
        })(),
        dice: [4, 1],
        player: 'X',
        playedMove: '20/15',
        optimalMove: '24/20 13/12',
        acceptableMoves: ['24/20 8/7', '24/20 6/5'],
        equityLoss: 0.145,
        verdict: 'blunder',
        conceptId: 'advanced_anchor',
        conceptName: 'Ancre avancée en jan adverse',
        explanation:
            'Au lieu de fuir seul et d’abandonner le camp adverse, faire l’ancre sur le point 20 (24/20) neutralise l’attaque de l’adversaire et vous garantit un point d’appui imprenable.',
        hint: 'Ne laissez pas l’adversaire dominer son jan intérieur. Créez une ancre défensive solide sur la flèche 20.',
        timesReviewed: 0,
        timesSolved: 0,
        isMastered: false,
    },
    {
        id: 'bench_blunder_race_management',
        createdAt: '2025-01-05T00:00:00.000Z',
        // X mène largement à la course (+25 pips), a un contact minimal et doit rompre sans frapper inutilement
        board: (() => {
            const b = new Array(28).fill(0);
            b[2] = 2;
            b[3] = 3;
            b[4] = 3;
            b[5] = 3;
            b[6] = 2;
            b[10] = 2; // 2 pions à rapatrier
            b[15] = -1; // blot adverse isolé
            b[19] = -4;
            b[20] = -3;
            b[21] = -3;
            b[22] = -4;
            return b;
        })(),
        dice: [6, 1],
        player: 'X',
        playedMove: '10/4 10/9',
        optimalMove: '10/4 6/5',
        acceptableMoves: ['10/3', '10/4 5/4'],
        equityLoss: 0.088,
        verdict: 'doubtful',
        conceptId: 'race_management',
        conceptName: 'Règle de course en avance (Pip Count)',
        explanation:
            'En tête à la course, chaque pion doit rentrer dans le jan intérieur le plus vite possible sans laisser de traîneau. Jouer 10/4 6/5 permet de sécuriser la rentrée sans dispersion.',
        hint: 'Vous menez largement à la course : rentrez vos pions en jan sans créer de blot inutile.',
        timesReviewed: 0,
        timesSolved: 0,
        isMastered: false,
    },
];
