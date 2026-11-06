/**
 * @file src/features/drills/quizTierGates.ts
 * @description Définition et filtrage officiel des 3 Portes de Quiz 3-Ply (Mission 31/50).
 *
 * Spécification stricte des Portes :
 *   - Porte 1 (`BEGINNER`)     : quiz `ER 13.0–20.0`
 *   - Porte 2 (`INTERMEDIATE`) : quiz `ER 6.0–13.0`
 *   - Porte 3 (`EXPERT`)       : quiz `ER 0.5–6.0` (incluant `CHECKER_PLAY` et `CUBE_DECISION`)
 *
 * Strictement <= 200 lignes, 0 `any`.
 */

export type QuizPorteGate = 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT';

export interface PorteGateConfig {
    readonly id: QuizPorteGate;
    readonly porteNumber: 1 | 2 | 3;
    readonly minEr: number;
    readonly maxEr: number;
    readonly labelFr: string;
    readonly labelEn: string;
    readonly descriptionFr: string;
    readonly descriptionEn: string;
}

export const PORTE_GATES_CONFIG: Readonly<Record<QuizPorteGate, PorteGateConfig>> = {
    BEGINNER: {
        id: 'BEGINNER',
        porteNumber: 1,
        minEr: 13.0,
        maxEr: 20.0,
        labelFr: 'Porte 1 — Débutant',
        labelEn: 'Gate 1 — Beginner',
        descriptionFr: 'Quiz fondamentaux ER 13.0–20.0 (sorties de barre, sécurité élémentaire, avancée)',
        descriptionEn: 'Foundational drills ER 13.0–20.0 (bar entry, basic safety, advancing)',
    },
    INTERMEDIATE: {
        id: 'INTERMEDIATE',
        porteNumber: 2,
        minEr: 6.0,
        maxEr: 13.0,
        labelFr: 'Porte 2 — Intermédiaire',
        labelEn: 'Gate 2 — Intermediate',
        descriptionFr: 'Quiz tactiques ER 6.0–13.0 (primes de 4-5 portes, ancres avancées, tenue)',
        descriptionEn: 'Tactical drills ER 6.0–13.0 (4-5 primes, advanced anchors, holding game)',
    },
    EXPERT: {
        id: 'EXPERT',
        porteNumber: 3,
        minEr: 0.5,
        maxEr: 6.0,
        labelFr: 'Porte 3 — Expert & Master',
        labelEn: 'Gate 3 — Expert & Master',
        descriptionFr: 'Quiz World-Class ER 0.5–6.0 (pions critiques, blitz agressif & décisions de videau)',
        descriptionEn: 'World-Class drills ER 0.5–6.0 (critical checker play, aggressive blitz & cube decisions)',
    },
};

/**
 * Normalise un identifiant ou numéro de porte en `QuizPorteGate`.
 */
export function normalizePorteGate(gate: string | number | undefined | null): QuizPorteGate | null {
    if (!gate) return null;
    const str = String(gate).trim().toUpperCase();
    if (str === '1' || str === 'BEGINNER' || str === 'DEBUTANT') return 'BEGINNER';
    if (str === '2' || str === 'INTERMEDIATE' || str === 'INTERMEDIAIRE' || str === 'CLUB') return 'INTERMEDIATE';
    if (str === '3' || str === 'EXPERT' || str === 'MASTER') return 'EXPERT';
    return null;
}

/**
 * Détermine la Porte principale d'un quiz selon sa cible d'ER.
 */
export function getQuizPorteGate(quizTargetER: number): QuizPorteGate {
    if (quizTargetER >= 13.0) return 'BEGINNER';
    if (quizTargetER >= 6.0) return 'INTERMEDIATE';
    return 'EXPERT';
}

/**
 * Filtre si un quiz appartient à la Porte spécifiée.
 */
export function isQuizInPorteGate(
    quiz: { readonly quizTargetER?: number; readonly quizType?: string },
    gateInput: string | number | QuizPorteGate
): boolean {
    const gate = normalizePorteGate(gateInput);
    if (!gate) return true;

    const er = quiz.quizTargetER ?? 10.0;
    const config = PORTE_GATES_CONFIG[gate];
    return er >= config.minEr && er <= config.maxEr;
}

