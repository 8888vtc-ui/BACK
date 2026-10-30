/**
 * Architecture « Caméléon » à Divulgation Progressive (Algorithme d'Elon Musk — Étapes 2, 3.2 & 5).
 *
 * Rôle :
 *   Encapsule la complexité analytique d'Open Sage et la pédagogie de Gemini en 3 strates :
 *     - Couche 0 (« Pureté & Plaisir » / Débutant) : 0 % de jargon, pips masqués par défaut,
 *       conseil post-match basé sur les 4 fondamentaux (Course, Structure, Flexibilité, Sécurité).
 *     - Couche 1 (« Club » / Intermédiaire) : différentiel de course (+12 / -8), échelle PR lisible
 *       (Maître < 5, Expert 5–10, Fort 10–15, En progression > 15), Jauge de Videau visuelle
 *       (Seuil 25 %, Fenêtre 75 %, Recube Vig, Loi de Woolsey).
 *     - Couche 2 (« Grand-Maître / Pro ») : pips exacts, score n-away (3-away, 5-away),
 *       split PR-Positional vs PR-Cube, tri primaire par perte de MWC (%) et Take Point exact.
 *
 * Règles :
 *   - Module pur et déterministe (0 `any`, < 350 lignes).
 */

import type { CompleteGameAnalysis, EvaluatedTurn } from '../rating/types';

export type ChameleonLayer = 0 | 1 | 2;

export type PipDisplayMode = 'hidden' | 'differential' | 'exact';
export type ScoreDisplayMode = 'standard' | 'n-away';
export type CubePositionType = 'holding' | 'race' | 'blitz';

export interface ChameleonLayerConfig {
    readonly layer: ChameleonLayer;
    readonly id: 'beginner' | 'club' | 'pro';
    readonly labelFr: string;
    readonly labelEn: string;
    readonly badgeFr: string;
    readonly pipDisplayMode: PipDisplayMode;
    readonly scoreDisplayMode: ScoreDisplayMode;
    readonly showLiveMetrics: boolean;
    readonly cubePresentation: 'simple_2x' | 'visual_gauge' | 'exact_take_point';
    readonly primaryErrorMetric: 'natural_4_factors' | 'pr_scale' | 'mwc_percent';
}

export const CHAMELEON_STORAGE_KEY = 'bg_chameleon_layer_override';
export const CHAMELEON_LAYER_CHANGE_EVENT = 'bg:chameleon-layer-changed';

export const CHAMELEON_CONFIGS: Record<ChameleonLayer, ChameleonLayerConfig> = {
    0: {
        layer: 0,
        id: 'beginner',
        labelFr: 'Couche 0 · Essentiel & Intuitif',
        labelEn: 'Layer 0 · Essential & Intuitive',
        badgeFr: 'Essentiel (0% Jargon)',
        pipDisplayMode: 'hidden',
        scoreDisplayMode: 'standard',
        showLiveMetrics: false,
        cubePresentation: 'simple_2x',
        primaryErrorMetric: 'natural_4_factors',
    },
    1: {
        layer: 1,
        id: 'club',
        labelFr: 'Couche 1 · Joueur de Club',
        labelEn: 'Layer 1 · Club Player',
        badgeFr: 'Club (Course ± & Videau)',
        pipDisplayMode: 'differential',
        scoreDisplayMode: 'standard',
        showLiveMetrics: false,
        cubePresentation: 'visual_gauge',
        primaryErrorMetric: 'pr_scale',
    },
    2: {
        layer: 2,
        id: 'pro',
        labelFr: 'Couche 2 · Grand-Maître / Pro',
        labelEn: 'Layer 2 · Grandmaster / Pro',
        badgeFr: 'Pro (MWC % & Split PR)',
        pipDisplayMode: 'exact',
        scoreDisplayMode: 'n-away',
        showLiveMetrics: true,
        cubePresentation: 'exact_take_point',
        primaryErrorMetric: 'mwc_percent',
    },
};

export const CHAMELEON_LAYER_CONFIGS = CHAMELEON_CONFIGS;

/**
 * Étape 5 d'Elon Musk : Bascule Automatique Silencieuse du Profil « Caméléon ».
 * Observe les parties enregistrées sans aucun questionnaire initial :
 *   - 0 partie ou (PR > 15 et aucune décision de videau) -> Couche 0
 *   - Utilisation du videau ou PR entre 5 et 15 -> Couche 1
 *   - PR < 5 sur au moins une partie analysée -> Couche 2
 */
export function resolveAutoChameleonLayer(
    analyses: ReadonlyArray<Pick<CompleteGameAnalysis, 'performanceRating' | 'closeCubeDecisionsCount' | 'decisionsCount'>>,
): ChameleonLayer {
    const valid = analyses.filter((a) => a.decisionsCount > 0);
    if (valid.length === 0) return 0;

    const avgPr = valid.reduce((acc, a) => acc + a.performanceRating, 0) / valid.length;
    const totalCloseCube = valid.reduce((acc, a) => acc + (a.closeCubeDecisionsCount ?? 0), 0);

    if (avgPr < 5.0) return 2;
    if (avgPr <= 15.0 || totalCloseCube > 0) return 1;
    return 0;
}

/** Lit la couche Caméléon forcée manuellement en stockage local (ou null si auto). */
export function readStoredChameleonLayer(): ChameleonLayer | null {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    try {
        const raw = window.localStorage.getItem(CHAMELEON_STORAGE_KEY);
        if (raw === '0') return 0;
        if (raw === '1') return 1;
        if (raw === '2') return 2;
        return null;
    } catch {
        return null;
    }
}

/** Enregistre un choix explicite de couche Caméléon (ou null pour revenir en détection auto). */
export function writeStoredChameleonLayer(layer: ChameleonLayer | null): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
        if (layer === null) {
            window.localStorage.removeItem(CHAMELEON_STORAGE_KEY);
        } else {
            window.localStorage.setItem(CHAMELEON_STORAGE_KEY, String(layer));
        }
        window.dispatchEvent(new CustomEvent<ChameleonLayer | null>(CHAMELEON_LAYER_CHANGE_EVENT, { detail: layer }));
    } catch {
        // Ignore storage errors
    }
}

/**
 * Formate le compteur de course selon la strate Caméléon et le Garde-fou n°1 des 10 %
 * (révélation temporaire au clic / toucher long sur l'avatar).
 */
export function formatChameleonPipDisplay(
    pipPlayer: number | null | undefined,
    pipOpponent: number | null | undefined,
    layer: ChameleonLayer,
    forceReveal = false,
): string | null {
    if (pipPlayer === null || pipPlayer === undefined) return null;

    if (layer === 0 && !forceReveal) {
        return null;
    }

    if (layer === 1 && pipOpponent !== null && pipOpponent !== undefined && !forceReveal) {
        // Différentiel de course : positif si le joueur est en avance (moins de pips restants que l'adversaire)
        const diff = pipOpponent - pipPlayer;
        const sign = diff > 0 ? `+${diff}` : `${diff}`;
        return `Course : ${sign}`;
    }

    return `${pipPlayer} pips`;
}

/**
 * Formate le score en notation de tournoi `n-away` pour la Couche 2 (ex: "3-away, 5-away").
 */
export function formatNAwayScore(
    scoreX: number,
    scoreO: number,
    matchLength: number,
    crawford = false,
): string {
    if (matchLength <= 0) return 'Money Game';
    const awayX = Math.max(0, matchLength - scoreX);
    const awayO = Math.max(0, matchLength - scoreO);
    const suffix = crawford ? ' · Crawford' : '';
    return `${awayX}-away, ${awayO}-away${suffix}`;
}

/**
 * Échelle PR globale lisible en Couche 1 (Maître < 5, Expert 5–10, Fort 10–15, En progression > 15).
 */
export function getClubPrScaleLabel(pr: number, locale = 'fr'): { tier: string; range: string; colorClass: string } {
    const isEn = locale !== 'fr';
    if (pr < 5.0) {
        return { tier: isEn ? 'Master' : 'Maître', range: '< 5', colorClass: 'text-emerald-300 border-emerald-400/60 bg-emerald-950/60' };
    }
    if (pr <= 10.0) {
        return { tier: 'Expert', range: '5–10', colorClass: 'text-[#f3c65f] border-[#d4af37]/60 bg-[#26160a]/80' };
    }
    if (pr <= 15.0) {
        return { tier: isEn ? 'Strong' : 'Fort', range: '10–15', colorClass: 'text-amber-300 border-amber-400/60 bg-amber-950/60' };
    }
    return {
        tier: isEn ? 'Improving' : 'En progression',
        range: '> 15',
        colorClass: 'text-sky-300 border-sky-400/60 bg-sky-950/60',
    };
}

/**
 * Formule exacte du Seuil d'Acceptation (Take Point) en Couche 2 :
 *   Take Point = Risque / (Risque + Gain)
 */
export function calculateExactTakePoint(risk: number, gain: number): number {
    const safeRisk = Math.max(0, risk);
    const safeGain = Math.max(0, gain);
    const denominator = safeRisk + safeGain;
    if (denominator <= 0) return 0.25;
    return Number((safeRisk / denominator).toFixed(4));
}

export interface CubeVisualGaugeEvaluation {
    /** Seuil théorique d'acceptation en partie libre (25.0 %). */
    readonly baseTakePointPercent: number;
    /** Réduction liée au Recube Vig (1.5 % en jeu d'attente, 6.0 % en course/blitz). */
    readonly recubeVigPercent: number;
    /** Seuil d'acceptation effectif après Recube Vig (ex: 23.5 % ou 19.0 %). */
    readonly effectiveTakePointPercent: number;
    /** Fenêtre de double théorique (75.0 %). */
    readonly doubleWindowPercent: number;
    /** La Loi de Woolsey (« En cas de doute, doublez ») s'applique-t-elle ? */
    readonly woolseyLawApplies: boolean;
    /** Recommandation pédagogique claire pour le joueur de Club. */
    readonly clubRecommendationFr: string;
}

/**
 * Évalue la Jauge Visuelle de Videau à 3 repères pour la Couche 1 :
 *   1. Seuil d'Acceptation à 25 % modulé par le Recube Vig (1–2 % holding, ~6 % course/blitz)
 *   2. Fenêtre de Double à l'approche des 75 %
 *   3. Loi de Woolsey (« En cas de doute, doublez »)
 */
export function evaluateCubeVisualGauge(
    winProbabilityPercent: number,
    positionType: CubePositionType = 'race',
): CubeVisualGaugeEvaluation {
    const clampedWin = Math.max(0, Math.min(100, winProbabilityPercent));
    const baseTakePointPercent = 25.0;
    const recubeVigPercent = positionType === 'holding' ? 1.5 : 6.0;
    const effectiveTakePointPercent = Number((baseTakePointPercent - recubeVigPercent).toFixed(1));
    const doubleWindowPercent = 75.0;
    const woolseyLawApplies = clampedWin >= 66.0 && clampedWin < doubleWindowPercent;

    let clubRecommendationFr: string;
    if (clampedWin < effectiveTakePointPercent) {
        clubRecommendationFr = `Passer (Drop) : vos chances (${clampedWin.toFixed(0)} %) sont sous le seuil de prise de ${effectiveTakePointPercent} %.`;
    } else if (clampedWin >= 78.0) {
        clubRecommendationFr = `Double / Pass : avantage décisif (${clampedWin.toFixed(0)} % ≥ fenêtre de 75 %).`;
    } else if (clampedWin >= 68.0) {
        clubRecommendationFr = `Double / Take (Loi de Woolsey : « En cas de doute, doublez » — fenêtre 68–75 %).`;
    } else {
        clubRecommendationFr = `Pas de double (${clampedWin.toFixed(0)} %) : conservez le videau au centre.`;
    }

    return {
        baseTakePointPercent,
        recubeVigPercent,
        effectiveTakePointPercent,
        doubleWindowPercent,
        woolseyLawApplies,
        clubRecommendationFr,
    };
}

export type PositionalFactor = 'Course' | 'Structure' | 'Flexibilité' | 'Sécurité';

export interface FourFactorsAdvice {
    readonly primaryFactor: PositionalFactor;
    readonly secondaryFactor: PositionalFactor;
    readonly headlineFr: string;
    readonly narrativeFr: string;
}

/**
 * Couche 0 (Débutant — 0 % de jargon) :
 * Traduit une décision clé de la partie en 2 phrases de français courant appuyées
 * exclusivement sur les 4 fondamentaux positionnels : Course, Structure, Flexibilité, Sécurité.
 */
export function buildFourFactorsNaturalAdvice(
    turn: Pick<EvaluatedTurn, 'moveNumber' | 'playedNotation' | 'optimalNotation' | 'conceptId'> | null | undefined,
): FourFactorsAdvice {
    if (!turn) {
        return {
            primaryFactor: 'Structure',
            secondaryFactor: 'Sécurité',
            headlineFr: 'Belle tenue de table : vos dames sont restées groupées et solidaires.',
            narrativeFr:
                'Continuez à construire des cases protégées par deux dames côte à côte (Structure) tout en évitant de laisser des dames isolées à portée de frappe (Sécurité).',
        };
    }

    const concept = (turn.conceptId ?? '').toLowerCase();
    if (concept.includes('safety') || concept.includes('blot')) {
        return {
            primaryFactor: 'Sécurité',
            secondaryFactor: 'Structure',
            headlineFr: `Moment clé au tour ${turn.moveNumber} : protégez vos dames isolées.`,
            narrativeFr: `Au tour ${turn.moveNumber}, le coup ${turn.playedNotation} a laissé une dame isolée vulnérable (Sécurité), alors que ${turn.optimalNotation} regroupait vos dames pour verrouiller votre camp (Structure).`,
        };
    }
    if (concept.includes('race') || concept.includes('bear')) {
        return {
            primaryFactor: 'Course',
            secondaryFactor: 'Flexibilité',
            headlineFr: `Moment clé au tour ${turn.moveNumber} : accélérez le retour de vos dames.`,
            narrativeFr: `Au tour ${turn.moveNumber}, jouer ${turn.optimalNotation} au lieu de ${turn.playedNotation} faisait avancer vos dames les plus éloignées sans gaspillage (Course) tout en gardant des options fluides pour le tour suivant (Flexibilité).`,
        };
    }
    if (concept.includes('prime') || concept.includes('bar') || concept.includes('anchor')) {
        return {
            primaryFactor: 'Structure',
            secondaryFactor: 'Flexibilité',
            headlineFr: `Moment clé au tour ${turn.moveNumber} : formez un mur devant l'adversaire.`,
            narrativeFr: `Au tour ${turn.moveNumber}, le déplacement ${turn.optimalNotation} construisait une barrière solide de cases consécutives (Structure) tout en préparant plusieurs rebonds actifs (Flexibilité).`,
        };
    }

    return {
        primaryFactor: 'Flexibilité',
        secondaryFactor: 'Sécurité',
        headlineFr: `Moment clé au tour ${turn.moveNumber} : gardez vos dames connectées.`,
        narrativeFr: `Au tour ${turn.moveNumber}, préférer ${turn.optimalNotation} à ${turn.playedNotation} répartissait mieux vos dames pour les prochains dés (Flexibilité) sans offrir de cible directe à l'adversaire (Sécurité).`,
    };
}

/**
 * Couche 2 (Pro / Tournoi) :
 * Trie les erreurs de match par perte réelle de Match Winning Chances (MWC %) en priorité
 * afin d'éliminer les distorsions de l'EMG en match, avec l'EMG en critère secondaire.
 */
export function sortEvaluatedMovesByMwcLoss(moves: ReadonlyArray<EvaluatedTurn>): EvaluatedTurn[] {
    return [...moves].sort((a, b) => {
        const mwcLossA =
            typeof a.mwcBefore === 'number' && typeof a.mwcAfter === 'number'
                ? Math.abs(a.mwcBefore - a.mwcAfter)
                : 0;
        const mwcLossB =
            typeof b.mwcBefore === 'number' && typeof b.mwcAfter === 'number'
                ? Math.abs(b.mwcBefore - b.mwcAfter)
                : 0;

        if (Math.abs(mwcLossB - mwcLossA) > 0.01) {
            return mwcLossB - mwcLossA;
        }
        return Math.abs(b.equityLoss) - Math.abs(a.equityLoss);
    });
}

export interface ProgressiveMasteryGoal {
    readonly focusMode: 'MAJOR_BLUNDERS_AND_CUBE' | 'ZERO_BLUNDER_TARGET' | 'MICRO_BLUNDERS_POLISH';
    readonly badgeLabelFr: string;
    readonly goalDescriptionFr: string;
}

/**
 * Calibre l'objectif progressif selon le nombre de blunders et de cubes oubliés (4-5 -> 1 -> 0).
 */
export function buildProgressiveMasteryGoal(params: {
    readonly blundersCount: number;
    readonly inaccuraciesCount: number;
    readonly missedCubesCount?: number;
}): ProgressiveMasteryGoal {
    const { blundersCount, inaccuraciesCount, missedCubesCount = 0 } = params;

    if (blundersCount === 0) {
        return {
            focusMode: 'MICRO_BLUNDERS_POLISH',
            badgeLabelFr: '🏆 Exécution Pro : 0 Blunder !',
            goalDescriptionFr:
                inaccuraciesCount > 0
                    ? `Zéro grosse erreur sur cette manche ! Votre prochain levier : gommer vos ${inaccuraciesCount} micro-blunder(s) de précision.`
                    : 'Partie chirurgicale (0 blunder, 0 micro-blunder) — niveau Grand-Maître !',
        };
    }

    if (blundersCount === 1 && missedCubesCount === 0) {
        return {
            focusMode: 'ZERO_BLUNDER_TARGET',
            badgeLabelFr: '🎯 Niveau Bon Joueur : 1 seul Blunder',
            goalDescriptionFr:
                'Un bon joueur ne commet qu’un seul blunder par partie. Corrigez cette unique décision clé ci-dessous pour viser le Zéro Blunder !',
        };
    }

    const cubeNote = missedCubesCount > 0 ? ` et ${missedCubesCount} décision(s) de Videau oubliée(s)` : '';
    return {
        focusMode: 'MAJOR_BLUNDERS_AND_CUBE',
        badgeLabelFr: `⚡ Cap Progression : ${blundersCount} Blunders${cubeNote}`,
        goalDescriptionFr: `Concentrez-vous uniquement sur ces ${blundersCount} tournants clés${cubeNote} : passer de ${blundersCount} blunders à 1 seul doublera vos victoires !`,
    };
}
