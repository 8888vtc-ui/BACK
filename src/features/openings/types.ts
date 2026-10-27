/**
 * Types pour la Bibliothèque d'Ouvertures (Opening Book) de Backgammon.
 *
 * Catalogue des 15 jets d'ouverture initiaux (sans les doubles)
 * certifiés selon les rollouts 4-ply / XG++ du circuit mondial.
 */

import type { Move } from '../../engine/backgammonEngine';

export type OpeningCategory =
    | 'Faire une porte'
    | 'Échappée & Course'
    | 'Split & Slot'
    | 'Développement';

/** Régime de score Match Play gouvernant les bascules du Livre d'Ouvertures (3T / XG Roller++). */
export type OpeningScoreRegime = 'NORMAL' | 'DMP' | 'GAMMON_GO' | 'GAMMON_SAVE';

export interface OpeningScoreVariant {
    /** Notation standard du coup optimal dans ce régime de score */
    bestMoveNotation: string;
    /** Séquence de déplacements du coup optimal dans ce régime */
    bestMoves: Move[];
    /** Justification stratégique issue des rollouts 3T / XG Roller++ */
    explanation: string;
}

export interface OpeningAlternative {
    /** Notation du coup alternatif (ex: "24/23 13/11") */
    notation: string;
    /** Perte d'équité par rapport au coup optimal certifié (ex: -0.015) */
    equityLoss: number;
    /** Style de jeu associé */
    style: 'Classique' | 'Agressif' | 'Défensif' | 'Moderne' | 'Course';
    /** Raisonnement tactique de cette alternative */
    description: string;
}

export interface OpeningEntry {
    /** Identifiant unique (ex: "opening_3_1") */
    id: string;
    /** Jet de dés ordonné [d1, d2] avec d1 >= d2 */
    dice: [number, number];
    /** Nom emblématique du jet (ex: "Le Point d'Or (Golden Point)") */
    name: string;
    /** Catégorie stratégique */
    category: OpeningCategory;
    /** Notation standard du coup optimal recommandé (ex: "8/5 6/5") */
    bestMoveNotation: string;
    /** Séquence de déplacements du coup recommandé */
    bestMoves: Move[];
    /** Variantes et alternatives jouables avec leur perte d'équité */
    alternatives: OpeningAlternative[];
    /** Équité de référence issue des rollouts (ex: +0.165) */
    equity: number;
    /** Probabilité de victoire globale (%) */
    winPercentage: number;
    /** Probabilité de victoire par gammon (%) */
    gammonPercentage: number;
    /** Probabilité de défaite par gammon subie (%) */
    loseGammonPercentage: number;
    /** Explication pédagogique détaillée du coup */
    explanation: string;
    /** Principe stratégique fondamental à retenir */
    keyRule: string;
    /** Enseignement ou proverbe du Maître (Michy, Tardieu, Mochy) */
    masterQuote?: {
        author: string;
        book: string;
        proverb: string;
        buyUrl: string;
    };
    /** Variantes optimales selon le régime de score Match Play (DMP, Gammon Go, Gammon Save) */
    scoreVariants?: Partial<Record<OpeningScoreRegime, OpeningScoreVariant>>;
}
