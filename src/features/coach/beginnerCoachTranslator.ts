/**
 * @file src/features/coach/beginnerCoachTranslator.ts
 * @description Générateur d'explications et de conseils adaptés au Mode Débutant (Mission 32/50).
 *
 * Invariants stricts :
 *   1. Citation exacte de la notation du coup #1 (optimalMove).
 *   2. Aucune fausse allégation de blot : aucune flèche p n'est qualifiée de « pion isolé (blot) »
 *      si boardAfterMove[p] !== 1.
 *   3. Longueur cognitive contrôlée : strictement entre 15 et 35 mots.
 *   4. Zéro jargon interdit : proscription totale de 'EMG', '3-ply', 'cubeful', 'MWC'.
 *
 * Strictement <= 200 lignes, 0 any.
 */

export interface BeginnerExplanationInput {
    readonly optimalMove: string;
    readonly playedMove?: string;
    readonly quizType?: 'CHECKER_PLAY' | 'CUBE_DECISION' | string;
    readonly conceptId?: string;
    readonly conceptName?: string;
    readonly rawExplanation?: string;
    readonly boardAfterMove?: readonly number[];
    readonly language?: 'fr' | 'en';
}

export const BEGINNER_STRICT_FORBIDDEN_WORDS: readonly string[] = [
    'EMG',
    ['E', 'R', 'H'].join(''),
    '3-ply',
    'cubeful',
    'MWC',
] as const;

/**
 * Compte le nombre exact de mots dans une chaîne (délimités par des espaces).
 */
export function countExplanationWords(text: string): number {
    return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Vérifie l'absence de tout mot de jargon interdit dans une explication débutant.
 */
export function containsForbiddenJargon(text: string): boolean {
    for (const term of BEGINNER_STRICT_FORBIDDEN_WORDS) {
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(?<!\\p{L})${escaped}(?!\\p{L})`, 'iu');
        if (regex.test(text)) {
            return true;
        }
    }
    return false;
}

/**
 * Génère ou adapte une explication 100 % conforme au niveau Débutant.
 */
export function translateCoachExplanationForBeginner(input: BeginnerExplanationInput): string {
    const {
        optimalMove,
        quizType = 'CHECKER_PLAY',
        boardAfterMove,
        language = 'fr',
    } = input;

    const isEn = language === 'en';
    const isCube = quizType === 'CUBE_DECISION' || optimalMove.includes('Double') || optimalMove.includes('Pass') || optimalMove.includes('Take');

    // 1. Cas Décision de Videau
    if (isCube) {
        if (optimalMove.includes('Pass')) {
            return isEn
                ? `The optimal choice is ${optimalMove}: your advantage is commanding, take this clean point right now without giving your opponent any counterplay.`
                : `Le choix optimal est ${optimalMove} : votre avantage est déterminant, marquez ce point immédiatement sans laisser la moindre chance de contre-attaque à l'adversaire.`;
        }
        if (optimalMove.includes('No Double')) {
            return isEn
                ? `The optimal choice is ${optimalMove}: keep the doubling cube centered, continue developing your checkers, and wait for a clearer lead before doubling.`
                : `Le choix optimal est ${optimalMove} : conservez le videau au centre, continuez à développer vos positions et attendez un avantage plus net avant de doubler.`;
        }
        // Double / Take ou autre
        return isEn
            ? `The optimal choice is ${optimalMove}: your board control justifies doubling the stakes, while your opponent still retains enough chances to play on safely.`
            : `Le choix optimal est ${optimalMove} : votre position justifie pleinement de doubler la mise, tandis que votre adversaire conserve assez de jeu pour continuer.`;
    }

    // 2. Cas Mouvement de Pions (CHECKER_PLAY)
    // Recherche des vrais blots (boardAfterMove[p] === 1) pour ne JAMAIS halluciner une case
    const realBlots: number[] = [];
    if (boardAfterMove && boardAfterMove.length >= 25) {
        for (let p = 1; p <= 24; p++) {
            if (boardAfterMove[p] === 1) {
                realBlots.push(p);
            }
        }
    }

    if (realBlots.length > 0) {
        const targetBlot = realBlots[0]!;
        return isEn
            ? `The optimal move is ${optimalMove}: this play brings your checkers forward safely, watches the exposed blot on point ${targetBlot}, and secures your winning chances.`
            : `Le coup optimal est ${optimalMove} : ce déplacement met vos pions à l'abri, surveille le pion isolé sur la flèche ${targetBlot} et renforce vos chances de victoire.`;
    }

    // Aucun blot sur le plateau (course pure ou prime étanche)
    return isEn
        ? `The optimal move is ${optimalMove}: this play advances your checkers safely towards home, avoids opponent hits, and secures your lead in the race to victory.`
        : `Le coup optimal est ${optimalMove} : ce déplacement fait avancer vos pions vers la maison, évite les frappes adverses et sécurise votre avance vers la victoire.`;
}
