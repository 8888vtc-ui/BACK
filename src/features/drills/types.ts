/**
 * Types pour les Drills de Blunders (Entraînement aux erreurs passées).
 *
 * Permet d'enregistrer les erreurs et blunders du joueur et de les rejouer
 * sous forme d'exercices tactiques interactifs jusqu'à trouver le coup optimal.
 */

import type { Move, Player } from '../../engine/backgammonEngine';
import type { AnalyzeMovesResult } from '../../lib/engine/types';

export type BlunderVerdict = 'blunder' | 'doubtful' | 'howler';

export interface PlayerBlunderRecord {
    /** Identifiant unique de l'erreur */
    id: string;
    /** Date de survenue (ISO string) */
    createdAt: string;
    /** Plateau avant le coup (28 cases: 0..27) */
    board: number[];
    /** Dés lancés [d1, d2] */
    dice: [number, number];
    /** Joueur au trait lors de l'erreur */
    player: Player;
    /** Coup fautif joué par le joueur (notation, ex: "24/20 13/11") */
    playedMove: string;
    /** Coup optimal certifié par le moteur (notation, ex: "24/18") */
    optimalMove: string;
    /** Variantes acceptables tolérées (notation) */
    acceptableMoves?: string[];
    /** Perte d'équité subie (ex: 0.125) */
    equityLoss: number;
    /** Qualification de l'erreur */
    verdict: BlunderVerdict;
    /** Identifiant du concept stratégique associé (ex: 'blot_safety') */
    conceptId: string;
    /** Nom lisible du concept (ex: 'Minimisation des tirs & Sécurité des blots') */
    conceptName: string;
    /** Explication pédagogique du coup correct */
    explanation: string;
    /** Indice pédagogique pour aider le joueur sans donner la solution */
    hint?: string;
    /** Nombre de fois où cette erreur a été rejouée en drill */
    timesReviewed: number;
    /** Nombre de fois où le joueur a trouvé le bon coup */
    timesSolved: number;
    /** L'erreur est-elle considérée comme maîtrisée */
    isMastered: boolean;
    /** Date du dernier essai */
    lastAttemptDate?: string;
    /** Identifiant de la partie source si disponible */
    gameId?: string;
    /** Contexte de match optionnel */
    matchContext?: {
        scoreX: number;
        scoreO: number;
        matchLength: number;
        cubeValue: number;
        cubeOwner: Player | null;
        crawford: boolean;
    };
}

export interface BlunderBankStats {
    /** Nombre total d'erreurs enregistrées dans la banque */
    totalBlunders: number;
    /** Nombre d'erreurs corrigées et maîtrisées */
    masteredCount: number;
    /** Nombre d'erreurs restantes à travailler */
    remainingToReview: number;
    /** Taux de maîtrise global (0 à 100%) */
    masteryRate: number;
    /** Taux de réussite aux tentatives (0 à 100%) */
    accuracyRate: number;
    /** Total de tentatives effectuées */
    totalAttempts: number;
}

export interface DrillValidationResult {
    /** Le coup joué est-il correct (optimal ou acceptable) */
    isCorrect: boolean;
    /** Verdict du coup joué lors du drill */
    verdict: 'optimal' | 'acceptable' | 'blunder' | 'doubtful';
    /** Perte d'équité du coup joué */
    equityLoss: number;
    /** Notation du coup joué par le joueur */
    playedNotation: string;
    /** Notation du coup optimal attendu */
    optimalNotation: string;
    /** Message d'encouragement ou d'explication */
    feedbackMessage: string;
    /** Indice contextuel en cas d'erreur */
    hint?: string;
    /** Autorise une nouvelle tentative immédiate */
    canRetry: boolean;
    /** Analyse détaillée issue du moteur */
    analysis?: AnalyzeMovesResult;
}

export interface BlunderDrillSession {
    /** Liste ordonnée des erreurs à travailler */
    blunders: PlayerBlunderRecord[];
    /** Index de l'erreur courante */
    currentIndex: number;
    /** Nombre de réussites dans cette session */
    sessionSolvedCount: number;
    /** Nombre de tentatives dans cette session */
    sessionAttemptsCount: number;
    /** La session est-elle achevée */
    isCompleted: boolean;
}
