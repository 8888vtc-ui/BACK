/**
 * Moteur Mathématique Pur — Glicko-2 à Score Continu Composite Anti-Variance.
 *
 * Implémente l'algorithme de Mark Glickman (Glicko-2) adapté aux systèmes
 * stochastiques à forte variance de dés (Backgammon / adaptation UBC) :
 * - Paramètres publics : r (défaut 1500), RD (défaut 350, plancher à 30), σ (défaut 0.06).
 * - Constante système : τ = 0.25 (bridée dans [0.20, 0.30]).
 * - Constante d'échelle : κ = 173.7178.
 * - Score Continu Composite s_j ∈ [0, 1] pondérant l'issue du match par la longueur L
 *   via w(L) = L / (L + 4) et la logistique de l'écart de Performance Rating (PR) Open Sage.
 * - Solveur de volatilité σ' par l'algorithme de l'Illinois (tolérance ε = 10^-6).
 *
 * Strictement 0 `any`, 100 % pur et déterministe.
 */

export const DEFAULT_GLICKO2_RATING = 1500;
export const DEFAULT_GLICKO2_RD = 350;
export const MIN_GLICKO2_RD = 30;
export const MAX_GLICKO2_RD = 350;
export const DEFAULT_GLICKO2_VOLATILITY = 0.06;

export const DEFAULT_SYSTEM_TAU = 0.25;
export const MIN_SYSTEM_TAU = 0.20;
export const MAX_SYSTEM_TAU = 0.30;

/** Facteur de conversion entre l'échelle publique (Elo/Glicko-1) et l'échelle interne Glicko-2. */
export const GLICKO2_SCALE = 173.7178;
export const KAPPA = GLICKO2_SCALE;

/** Facteur de sensibilité γ du différentiel de Performance Rating (PR). */
export const DEFAULT_PR_GAMMA = 0.35;

/** Tolérance de convergence ε de l'algorithme de l'Illinois. */
export const ILLINOIS_EPSILON = 1e-6;
export const ILLINOIS_MAX_ITERATIONS = 100;

export interface Glicko2Player {
    readonly rating: number;
    readonly rd: number;
    readonly volatility: number;
}

export interface Glicko2InternalScale {
    readonly mu: number;
    readonly phi: number;
}

export interface CompositeScoreInput {
    /** Victoire du joueur sur le match (true / 1 si victoire, false / 0 si défaite). */
    readonly isVictory: boolean | number;
    /** Longueur du match en points (1, 3, 5, 7, 11...). */
    readonly matchLength: number;
    /** Performance Rating (PR Open Sage) du joueur (plus bas = meilleur). */
    readonly playerPR: number;
    /** Performance Rating (PR Open Sage) de l'adversaire (plus bas = meilleur). */
    readonly opponentPR: number;
    /** Facteur de sensibilité γ (défaut : 0.35). */
    readonly gamma?: number;
}

export interface CompositeScoreBreakdown {
    /** Score continu composite final s_j ∈ [0, 1]. */
    readonly score: number;
    /** Poids du résultat binaire du match w(L) = L / (L + 4). */
    readonly matchWeight: number;
    /** Poids de la composante technique PR : 1 - w(L). */
    readonly prWeight: number;
    /** Indicatrice de victoire I(Victoire) ∈ {0, 1}. */
    readonly winIndicator: number;
    /** Composante logistique issue du différentiel de PR ∈ (0, 1). */
    readonly prSigmoid: number;
}

export interface Glicko2MatchObservation {
    /** Classement public r_j de l'adversaire (ou du puzzle). */
    readonly opponentRating: number;
    /** Déviation publique RD_j de l'adversaire (ou du puzzle). */
    readonly opponentRD: number;
    /**
     * Score observé s_j ∈ [0, 1].
     * Si omis, calculé automatiquement via `composite` (Score Continu Composite).
     */
    readonly score?: number;
    /** Paramètres de match Backgammon pour calculer le score continu composite s_j. */
    readonly composite?: CompositeScoreInput;
}

export interface Glicko2Options {
    /** Constante système τ (défaut 0.25, bridée entre 0.20 et 0.30). */
    readonly tau?: number;
    /** Tolérance de convergence de l'Illinois (défaut 1e-6). */
    readonly epsilon?: number;
    /** Facteur de sensibilité PR γ (défaut 0.35). */
    readonly gamma?: number;
}

export interface IllinoisSolverResult {
    readonly sigmaPrime: number;
    readonly iterations: number;
    readonly converged: boolean;
    readonly finalBracketGap: number;
}

export interface Glicko2UpdateResult {
    /** Nouveau classement public r'. */
    readonly rating: number;
    /** Nouvelle déviation publique RD' (avec plancher à 30 et plafond à 350). */
    readonly rd: number;
    /** Déviation publique brute non bridée 173.7178 * φ'. */
    readonly rawRd: number;
    /** Nouvelle volatilité σ'. */
    readonly volatility: number;
    /** Variation nette de classement (r' - r). */
    readonly ratingDelta: number;
    /** Paramètres internes finaux (μ', φ'). */
    readonly muPrime: number;
    readonly phiPrime: number;
    /** Déviation pré-période φ*. */
    readonly phiStar: number;
    /** Variance estimée v (Infinity si aucun match joué). */
    readonly variance: number;
    /** Amélioration estimée Δ (0 si aucun match joué). */
    readonly delta: number;
    /** Scores continus composites s_j utilisés pour chaque match de la période. */
    readonly scores: ReadonlyArray<number>;
    /** Détails de convergence du solveur de l'Illinois. */
    readonly illinois: IllinoisSolverResult;
}

export interface HeadToHeadCompositeMatch {
    readonly playerX: Glicko2Player;
    readonly playerO: Glicko2Player;
    readonly winner: 'X' | 'O';
    readonly matchLength: number;
    readonly playerXPR: number;
    readonly playerOPR: number;
    readonly options?: Glicko2Options;
}

export interface HeadToHeadCompositeResult {
    readonly playerX: Glicko2UpdateResult;
    readonly playerO: Glicko2UpdateResult;
    readonly compositeScoreX: CompositeScoreBreakdown;
    readonly compositeScoreO: CompositeScoreBreakdown;
}

/**
 * Crée un profil joueur Glicko-2 initialisé aux valeurs réglementaires par défaut.
 */
export function createDefaultGlicko2Player(
    overrides?: Partial<Glicko2Player>,
): Glicko2Player {
    const rawRd = overrides?.rd ?? DEFAULT_GLICKO2_RD;
    return {
        rating: overrides?.rating ?? DEFAULT_GLICKO2_RATING,
        rd: Math.max(MIN_GLICKO2_RD, Math.min(MAX_GLICKO2_RD, rawRd)),
        volatility:
            overrides?.volatility !== undefined && overrides.volatility > 0
                ? overrides.volatility
                : DEFAULT_GLICKO2_VOLATILITY,
    };
}

/**
 * Bride la constante système τ dans l'intervalle anti-variance [0.20, 0.30].
 */
export function clampSystemTau(tau: number = DEFAULT_SYSTEM_TAU): number {
    if (!Number.isFinite(tau)) return DEFAULT_SYSTEM_TAU;
    return Math.max(MIN_SYSTEM_TAU, Math.min(MAX_SYSTEM_TAU, tau));
}

/**
 * Calcule le poids du résultat binaire du match en fonction de sa longueur L :
 * w(L) = L / (L + 4)
 * - En 1 point : w(1) = 0.20 (le PR compte pour 80% du score).
 * - En 7 points : w(7) = 7/11 ≈ 0.6364 (la victoire compte pour ~64%).
 */
export function computeMatchWeight(matchLength: number): number {
    const safeLength = Math.max(1, Number.isFinite(matchLength) ? matchLength : 1);
    return safeLength / (safeLength + 4);
}

/**
 * Calcule la composante sigmoïde de performance technique (PR Open Sage) :
 * 1 / (1 + exp(-γ * (PR_adversaire - PR_joueur)))
 */
export function computePrSigmoid(
    playerPR: number,
    opponentPR: number,
    gamma: number = DEFAULT_PR_GAMMA,
): number {
    const safePlayerPR = Math.max(0, Number.isFinite(playerPR) ? playerPR : 0);
    const safeOpponentPR = Math.max(0, Number.isFinite(opponentPR) ? opponentPR : 0);
    const safeGamma = Number.isFinite(gamma) && gamma > 0 ? gamma : DEFAULT_PR_GAMMA;
    const diff = safeOpponentPR - safePlayerPR;
    return 1 / (1 + Math.exp(-safeGamma * diff));
}

/**
 * Calcule le Score Continu Composite s_j ∈ [0, 1] et retourne sa décomposition complète :
 * s_j = w(L) * I(Victoire) + (1 - w(L)) * (1 / (1 + exp(-γ * (PR_adv - PR_joueur))))
 */
export function computeCompositeScoreBreakdown(
    input: CompositeScoreInput,
): CompositeScoreBreakdown {
    const matchWeight = computeMatchWeight(input.matchLength);
    const prWeight = 1 - matchWeight;
    const winIndicator =
        typeof input.isVictory === 'boolean'
            ? input.isVictory
                ? 1
                : 0
            : Math.max(0, Math.min(1, Number(input.isVictory) || 0));
    const prSigmoid = computePrSigmoid(
        input.playerPR,
        input.opponentPR,
        input.gamma ?? DEFAULT_PR_GAMMA,
    );
    const rawScore = matchWeight * winIndicator + prWeight * prSigmoid;
    const score = Math.max(0, Math.min(1, rawScore));

    return {
        score,
        matchWeight,
        prWeight,
        winIndicator,
        prSigmoid,
    };
}

/**
 * Retourne directement le Score Continu Composite s_j ∈ [0, 1].
 */
export function computeCompositeScore(input: CompositeScoreInput): number {
    return computeCompositeScoreBreakdown(input).score;
}

/**
 * Étape 2 : Projection des paramètres publics (r, RD) sur l'échelle interne Glicko-2 (μ, φ).
 */
export function toGlicko2Scale(
    rating: number,
    rd: number,
): Glicko2InternalScale {
    const safeRd = Math.max(MIN_GLICKO2_RD, rd);
    return {
        mu: (rating - DEFAULT_GLICKO2_RATING) / GLICKO2_SCALE,
        phi: safeRd / GLICKO2_SCALE,
    };
}

/**
 * Étape 8 : Reconversion des paramètres internes (μ', φ') vers l'échelle publique (r', RD').
 */
export function fromGlicko2Scale(
    muPrime: number,
    phiPrime: number,
): { rating: number; rd: number; rawRd: number } {
    const rating = GLICKO2_SCALE * muPrime + DEFAULT_GLICKO2_RATING;
    const rawRd = GLICKO2_SCALE * phiPrime;
    const rd = Math.max(MIN_GLICKO2_RD, Math.min(MAX_GLICKO2_RD, rawRd));
    return { rating, rd, rawRd };
}

/**
 * Étape 3a : Fonction d'atténuation de la déviation adverse g(φ) :
 * g(φ) = 1 / sqrt(1 + 3 * φ^2 / π^2)
 */
export function gPhi(phi: number): number {
    return 1 / Math.sqrt(1 + (3 * phi * phi) / (Math.PI * Math.PI));
}

/**
 * Étape 3b : Espérance logistique de résultat E(μ, μ_j, φ_j) :
 * E(μ, μ_j, φ_j) = 1 / (1 + exp(-g(φ_j) * (μ - μ_j)))
 */
export function expectedGlicko2Outcome(
    mu: number,
    muJ: number,
    phiJ: number,
): number {
    const g = gPhi(phiJ);
    return 1 / (1 + Math.exp(-g * (mu - muJ)));
}

/**
 * Fonction objectif f(x) de l'Étape 5 (Mark Glickman) dont on cherche la racine :
 * f(x) = [e^x * (Δ^2 - φ^2 - v - e^x)] / [2 * (φ^2 + v + e^x)^2] - (x - a) / τ^2
 */
export function volatilityObjectiveF(
    x: number,
    phiSquared: number,
    v: number,
    deltaSquared: number,
    a: number,
    tauSquared: number,
): number {
    const ex = Math.exp(x);
    const num = ex * (deltaSquared - phiSquared - v - ex);
    const denomBase = phiSquared + v + ex;
    const denom = 2 * denomBase * denomBase;
    return num / denom - (x - a) / tauSquared;
}

/**
 * Étape 5 : Calcul de la nouvelle volatilité σ' via l'algorithme de l'Illinois.
 *
 * Implémente la division par 2 de l'ordonnée de la borne stagnante (`f_A = f_A / 2`)
 * lorsque `f_C * f_B > 0` (même signe), garantissant une convergence super-linéaire
 * sans divergence avec tolérance ε = 10^-6.
 */
export function solveVolatilityIllinois(
    phi: number,
    sigma: number,
    v: number,
    delta: number,
    tauInput: number = DEFAULT_SYSTEM_TAU,
    epsilon: number = ILLINOIS_EPSILON,
): IllinoisSolverResult {
    const safeSigma = sigma > 0 ? sigma : DEFAULT_GLICKO2_VOLATILITY;
    const tau = clampSystemTau(tauInput);
    const tauSquared = tau * tau;
    const phiSquared = phi * phi;
    const deltaSquared = delta * delta;
    const a = Math.log(safeSigma * safeSigma);

    const f = (x: number): number =>
        volatilityObjectiveF(x, phiSquared, v, deltaSquared, a, tauSquared);

    let A = a;
    let B: number;

    if (deltaSquared > phiSquared + v) {
        B = Math.log(deltaSquared - phiSquared - v);
    } else {
        let k = 1;
        while (f(a - k * tau) < 0 && k < ILLINOIS_MAX_ITERATIONS) {
            k += 1;
        }
        B = a - k * tau;
    }

    let fA = f(A);
    let fB = f(B);
    let iterations = 0;

    while (Math.abs(B - A) > epsilon && iterations < ILLINOIS_MAX_ITERATIONS) {
        iterations += 1;
        const denom = fB - fA;
        if (Math.abs(denom) < 1e-18) {
            break;
        }

        const C = A + ((A - B) * fA) / denom;
        const fC = f(C);

        if (fC * fB <= 0) {
            A = B;
            fA = fB;
        } else {
            // Algorithme de l'Illinois : division par 2 de la borne stagnante si même signe
            fA = fA / 2;
        }

        B = C;
        fB = fC;
    }

    const finalBracketGap = Math.abs(B - A);
    const sigmaPrime = Math.exp(A / 2);

    return {
        sigmaPrime,
        iterations,
        converged: finalBracketGap <= epsilon,
        finalBracketGap,
    };
}

/**
 * Exécute les 8 étapes complètes du système Glicko-2 à Score Continu Composite
 * pour un joueur sur une période de classement (1 ou plusieurs matchs).
 */
export function updateGlicko2Rating(
    player: Glicko2Player,
    matches: ReadonlyArray<Glicko2MatchObservation>,
    options?: Glicko2Options,
): Glicko2UpdateResult {
    const tau = clampSystemTau(options?.tau ?? DEFAULT_SYSTEM_TAU);
    const epsilon = options?.epsilon ?? ILLINOIS_EPSILON;
    const gamma = options?.gamma ?? DEFAULT_PR_GAMMA;

    // Étape 1 & 2 : Projection sur l'échelle Glicko-2 (μ, φ)
    const { mu, phi } = toGlicko2Scale(player.rating, player.rd);
    const sigma = player.volatility > 0 ? player.volatility : DEFAULT_GLICKO2_VOLATILITY;

    // Cas particulier : le joueur n'a disputé aucun match durant la période
    if (matches.length === 0) {
        const phiStar = Math.sqrt(phi * phi + sigma * sigma);
        const { rating, rd, rawRd } = fromGlicko2Scale(mu, phiStar);
        return {
            rating,
            rd,
            rawRd,
            volatility: sigma,
            ratingDelta: 0,
            muPrime: mu,
            phiPrime: phiStar,
            phiStar,
            variance: Number.POSITIVE_INFINITY,
            delta: 0,
            scores: [],
            illinois: {
                sigmaPrime: sigma,
                iterations: 0,
                converged: true,
                finalBracketGap: 0,
            },
        };
    }

    // Étape 3 & 4 : Calcul de la variance estimée v et de l'amélioration Δ
    let inverseVarianceSum = 0;
    let outcomeDiscrepancySum = 0;
    const resolvedScores: number[] = [];

    for (const match of matches) {
        const { mu: muJ, phi: phiJ } = toGlicko2Scale(
            match.opponentRating,
            match.opponentRD,
        );
        const gJ = gPhi(phiJ);
        const eJ = expectedGlicko2Outcome(mu, muJ, phiJ);

        const sJ =
            match.score !== undefined
                ? Math.max(0, Math.min(1, match.score))
                : match.composite
                  ? computeCompositeScore({
                        ...match.composite,
                        gamma: match.composite.gamma ?? gamma,
                    })
                  : 0.5;

        resolvedScores.push(sJ);
        inverseVarianceSum += gJ * gJ * eJ * (1 - eJ);
        outcomeDiscrepancySum += gJ * (sJ - eJ);
    }

    const v = 1 / Math.max(1e-12, inverseVarianceSum);
    const delta = v * outcomeDiscrepancySum;

    // Étape 5 : Mise à jour de la volatilité σ' par l'algorithme de l'Illinois
    const illinois = solveVolatilityIllinois(phi, sigma, v, delta, tau, epsilon);
    const sigmaPrime = illinois.sigmaPrime;

    // Étape 6 : Déviation pré-période φ*
    const phiStar = Math.sqrt(phi * phi + sigmaPrime * sigmaPrime);

    // Étape 7 : Nouveaux paramètres internes φ' et μ'
    const phiPrime = 1 / Math.sqrt(1 / (phiStar * phiStar) + 1 / v);
    const muPrime = mu + phiPrime * phiPrime * outcomeDiscrepancySum;

    // Étape 8 : Reconversion vers l'échelle publique (r', RD')
    const { rating, rd, rawRd } = fromGlicko2Scale(muPrime, phiPrime);

    return {
        rating: Number(rating.toFixed(2)),
        rd: Number(rd.toFixed(2)),
        rawRd: Number(rawRd.toFixed(2)),
        volatility: Number(sigmaPrime.toFixed(6)),
        ratingDelta: Number((rating - player.rating).toFixed(2)),
        muPrime,
        phiPrime,
        phiStar,
        variance: v,
        delta,
        scores: resolvedScores,
        illinois,
    };
}

/**
 * Calcule la mise à jour Glicko-2 simultanée d'un duel Backgammon (Joueur X vs Joueur O)
 * pondéré par leurs Performance Ratings (PR Open Sage) et la longueur du match.
 */
export function evaluateHeadToHeadCompositeMatch(
    input: HeadToHeadCompositeMatch,
): HeadToHeadCompositeResult {
    const gamma = input.options?.gamma ?? DEFAULT_PR_GAMMA;

    const compositeScoreX = computeCompositeScoreBreakdown({
        isVictory: input.winner === 'X',
        matchLength: input.matchLength,
        playerPR: input.playerXPR,
        opponentPR: input.playerOPR,
        gamma,
    });

    const compositeScoreO = computeCompositeScoreBreakdown({
        isVictory: input.winner === 'O',
        matchLength: input.matchLength,
        playerPR: input.playerOPR,
        opponentPR: input.playerXPR,
        gamma,
    });

    const resultX = updateGlicko2Rating(
        input.playerX,
        [
            {
                opponentRating: input.playerO.rating,
                opponentRD: input.playerO.rd,
                score: compositeScoreX.score,
            },
        ],
        input.options,
    );

    const resultO = updateGlicko2Rating(
        input.playerO,
        [
            {
                opponentRating: input.playerX.rating,
                opponentRD: input.playerX.rd,
                score: compositeScoreO.score,
            },
        ],
        input.options,
    );

    return {
        playerX: resultX,
        playerO: resultO,
        compositeScoreX,
        compositeScoreO,
    };
}

/**
 * Met à jour le classement Puzzle (`puzzle_rating`) d'un joueur via Glicko-2
 * après une tentative sur un puzzle calibré.
 */
export function updatePuzzleGlicko2Rating(
    player: Glicko2Player,
    puzzleRating: number,
    puzzleRD: number = 85,
    score: number,
): Glicko2UpdateResult {
    return updateGlicko2Rating(player, [
        {
            opponentRating: puzzleRating,
            opponentRD: puzzleRD,
            score: Math.max(0, Math.min(1, score)),
        },
    ]);
}
