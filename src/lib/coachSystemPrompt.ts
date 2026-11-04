/**
 * @file src/lib/coachSystemPrompt.ts
 * @description Barrière Mathématique Pré-Appel (classifyMoveByDeltaEmg, evaluateMoveBlunderGate)
 * et barrière cognitive `GEMINI_LITE_INTERNAL_SYSTEM_PROMPT` avec les 6 Lois Métier.
 * Strictement <= 220 lignes, 0 any, 0 ERH.
 */

export type MoveCategory = 'OPTIMAL' | 'NEAR_OPTIMAL_GOOD_MOVE' | 'INACCURACY' | 'BLUNDER';
export type MoveStatus = 'NOT_A_BLUNDER_GOOD_MOVE' | 'INACCURACY_MIEUX_A_FAIRE' | 'TRUE_BLUNDER';

export interface MoveEvaluationGateResult {
    readonly category: MoveCategory;
    readonly status: MoveStatus;
    readonly isBlunderQuizEligible: boolean;
    readonly badgeLabel: string;
    readonly feedbackMessage: string;
}

/**
 * Barrière Mathématique Pré-Appel (classifyMoveByDeltaEmg)
 * Applique le barème strict sur |deltaEmg|.
 */
export function classifyMoveByDeltaEmg(deltaEmg: number, isExpertOrMaster = false): MoveEvaluationGateResult {
    const absLoss = Math.abs(deltaEmg);

    if (absLoss < 0.0005) {
        return {
            category: 'OPTIMAL',
            status: 'NOT_A_BLUNDER_GOOD_MOVE',
            isBlunderQuizEligible: false,
            badgeLabel: 'Coup Optimal',
            feedbackMessage: `✅ Coup optimal ! (-0.000 EMG)`,
        };
    }

    if (absLoss <= 0.020) {
        const lossStr = absLoss.toFixed(3);
        return {
            category: 'NEAR_OPTIMAL_GOOD_MOVE',
            status: 'NOT_A_BLUNDER_GOOD_MOVE',
            isBlunderQuizEligible: false,
            badgeLabel: 'Très bon coup',
            feedbackMessage: `👍 Très bon coup (-${lossStr} EMG) ! Ce n'est pas une erreur, mais voici comment gagner +${lossStr} EMG de plus...`,
        };
    }

    const inaccuracyUpperLimit = isExpertOrMaster ? 0.045 : 0.079;
    if (absLoss <= inaccuracyUpperLimit) {
        return {
            category: 'INACCURACY',
            status: 'INACCURACY_MIEUX_A_FAIRE',
            isBlunderQuizEligible: false,
            badgeLabel: 'Imprécision / Mieux à faire',
            feedbackMessage: `⚠️ Imprécision (-${absLoss.toFixed(3)} EMG) : il y avait un plan légèrement supérieur.`,
        };
    }

    return {
        category: 'BLUNDER',
        status: 'TRUE_BLUNDER',
        isBlunderQuizEligible: true,
        badgeLabel: '🔥 Blunder',
        feedbackMessage: `❌ Blunder (-${absLoss.toFixed(3)} EMG) : perte d'équité significative.`,
    };
}

export function evaluateMoveBlunderGate(deltaEmg: number, isExpertOrMaster = false): MoveEvaluationGateResult {
    return classifyMoveByDeltaEmg(deltaEmg, isExpertOrMaster);
}

/**
 * Barrière Cognitive `GEMINI_LITE_INTERNAL_SYSTEM_PROMPT` (6 Lois Métier)
 */
export const GEMINI_LITE_INTERNAL_SYSTEM_PROMPT = `Tu es un grand-maître expert de Backgammon (style Magriel/Trice).
Respecte absolument et sans exception les 6 Lois Métier suivantes :

1. Loi Interne 1 (Respect du Barème ΔEMG) : Si |ΔEMG| <= 0.020, tu as l'interdiction absolue d'appeler ce coup une erreur ou un blunder ; félicite le joueur pour son très bon coup et montre la nuance à +0.010 EMG. N'utilise le mot 'Blunder / Gaffe' que si |ΔEMG| >= 0.080.
2. Loi Interne 2 (Zéro Invention Géométrique) : Utilise EXCLUSIVEMENT le Pip Count exact, les numéros de cases, les X/36 tirs directs et les Y/36 lancers constructifs fournis dans le JSON de bgsage 3-ply. N'invente jamais un chiffre.
3. Loi Interne 3 (Course vs Contact) : Si isContact === false (Course pure), interdiction absolue de parler de Blitz, de frapper (hit), de barre ou d'ancre.
4. Loi Interne 4 (Règles Match vs Money) : Si matchLength > 0 (Match Play), le Beaver n'existe pas et la règle Jacoby est désactivée. Ne mentionne jamais Beaver en match.
5. Loi Interne 5 (Métriques Officielles) : Utilise ER / PR (échelle 0.0 à 30.0, évoluant par dixièmes -0.1 à +0.5), ERA (Error Rate Adaptatif pour la psychologie du videau et le jeu contre adversaire réel) et Rating (1500). Ne mentionne jamais l'ancien acronyme obsolète ERH.
6. Loi Interne 6 (Coupe-Circuit Auto-Vérification) : Si le JSON reçu contient playerDeltaEmg > -0.020 alors qu'on te demande d'expliquer un blunder, renvoie status: 'NOT_A_BLUNDER_GOOD_MOVE' pour corriger l'affichage.`;
