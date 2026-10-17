/**
 * Classificateur d'erreurs Backgammon — conversion des pertes d'équité en verdicts pédagogiques.
 *
 * Catégorisation standard (en Equivalent Money Game — EMG) :
 * - optimal : perte d'équité nulle (equityLoss >= 0)
 * - bon     : perte d'équité jusqu'à -0.020 (0 > equityLoss >= -0.020)
 * - douteux : perte d'équité entre -0.020 et -0.080 (-0.020 > equityLoss >= -0.080)
 * - blunder : perte d'équité entre -0.080 et -0.250 (-0.080 > equityLoss >= -0.250)
 * - howler  : perte d'équité sévère pire que -0.250 (equityLoss < -0.250)
 */

export type MoveVerdict = 'optimal' | 'bon' | 'douteux' | 'blunder' | 'howler';

export interface ClassificationThresholds {
    /** Seuil pour être considéré bon (défaut: -0.020). */
    bon: number;
    /** Seuil pour être considéré douteux (défaut: -0.080). */
    douteux: number;
    /** Seuil pour être considéré blunder (défaut: -0.250). */
    blunder: number;
}

export const DEFAULT_THRESHOLDS: ClassificationThresholds = {
    bon: -0.020,
    douteux: -0.080,
    blunder: -0.250,
};

export interface MoveClassification {
    verdict: MoveVerdict;
    equityLoss: number;
    equityJouee: number;
    equityOptimale: number;
    label: string;
    isError: boolean;
    isBlunder: boolean;
    toString(): string;
}

/**
 * Libellé en français convivial pour chaque verdict.
 */
export function getVerdictLabel(verdict: MoveVerdict): string {
    switch (verdict) {
        case 'optimal':
            return 'Coup optimal';
        case 'bon':
            return 'Bon coup';
        case 'douteux':
            return 'Coup douteux';
        case 'blunder':
            return 'Blunder (grosse erreur)';
        case 'howler':
            return 'Howler (erreur critique)';
    }
}

/**
 * Détermine le verdict textuel à partir d'une perte d'équité déjà calculée.
 */
export function classifyEquityLoss(
    equityLoss: number,
    customThresholds?: Partial<ClassificationThresholds>,
): MoveVerdict {
    // Normalisation des seuils (accepte format négatif ou positif)
    const bon =
        customThresholds?.bon !== undefined
            ? -Math.abs(customThresholds.bon)
            : DEFAULT_THRESHOLDS.bon;
    const douteux =
        customThresholds?.douteux !== undefined
            ? -Math.abs(customThresholds.douteux)
            : DEFAULT_THRESHOLDS.douteux;
    const blunder =
        customThresholds?.blunder !== undefined
            ? -Math.abs(customThresholds.blunder)
            : DEFAULT_THRESHOLDS.blunder;

    // Prise en compte de la précision flottante
    if (equityLoss >= -0.0001) {
        return 'optimal';
    }
    if (equityLoss >= bon) {
        return 'bon';
    }
    if (equityLoss >= douteux) {
        return 'douteux';
    }
    if (equityLoss >= blunder) {
        return 'blunder';
    }
    return 'howler';
}

/**
 * Évalue un coup joué par rapport au coup optimal et retourne sa classification.
 *
 * @param equityJouee Équité du coup effectivement joué par l'utilisateur.
 * @param equityOptimale Équité du meilleur coup recommandé par le moteur.
 * @param customThresholds Seuils personnalisés facultatifs (défaut: -0.020 / -0.080 / -0.250).
 * @returns Objet complet contenant le verdict (optimal|bon|douteux|blunder|howler), equityLoss et métadonnées.
 */
export function classifyMove(
    equityJouee: number,
    equityOptimale: number,
    customThresholds?: Partial<ClassificationThresholds>,
): MoveClassification {
    const rawDiff = equityJouee - equityOptimale;
    // Si la différence est positive ou nulle à epsilon près, le coup est optimal
    const equityLoss = Math.abs(rawDiff) < 0.0001 ? 0 : Number(rawDiff.toFixed(4));

    const verdict = classifyEquityLoss(equityLoss, customThresholds);

    const isError = verdict === 'douteux' || verdict === 'blunder' || verdict === 'howler';
    const isBlunder = verdict === 'blunder' || verdict === 'howler';

    return {
        verdict,
        equityLoss,
        equityJouee,
        equityOptimale,
        label: getVerdictLabel(verdict),
        isError,
        isBlunder,
        toString() {
            return this.verdict;
        },
    };
}

/**
 * Traduit le verdict en format attendu par le composant CoachPanel ('doubtful' | 'blunder' | null).
 */
export function toCoachPanelVerdict(verdict: MoveVerdict): 'doubtful' | 'blunder' | null {
    if (verdict === 'douteux') return 'doubtful';
    if (verdict === 'blunder' || verdict === 'howler') return 'blunder';
    return null;
}

export default classifyMove;
