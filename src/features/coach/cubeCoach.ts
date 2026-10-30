/**
 * Analyse pédagogique des décisions de videau (doubling cube).
 *
 * Rôle :
 *   Compare la décision du joueur (doubler / prendre / passer) avec la décision
 *   optimale calculée par le moteur (`analyzeBoardCube`), et produit un verdict
 *   pédagogique + une explication simple.
 *
 * Les décisions de videau sont les plus rentables à apprendre : un mauvais
 * double ou un take manqué coûte souvent plus qu'un mauvais coup de pion.
 */

import type { BoardState } from '../../engine/backgammonEngine';
import { analyzeBoardCube } from '../../lib/engine/evaluator';

export type CubeAction = 'double' | 'take' | 'pass' | 'missed_double';

/** Types d'actions moteur associées aux décisions de videau du joueur. */
export type CubeActionType = 'OFFER_DOUBLE' | 'TAKE_DOUBLE' | 'PASS_DOUBLE' | 'MISSED_DOUBLE';

export interface CubeCoachResult {
    /** Verdict pédagogique : optimal / bon / imprécision / blunder. */
    verdict: 'optimal' | 'good' | 'inaccuracy' | 'blunder';
    /** Action optimale recommandée (lisible). */
    optimalAction: string;
    /** Action jouée par le joueur. */
    playedAction: string;
    /** Explication pédagogique courte. */
    explanation: string;
    /** Règle d'or à retenir. */
    advice: string;
    /** Perte d'équité estimée de la décision de videau (<= 0). */
    equityLoss?: number;
}

/** Classification pédagogique d'une décision de videau (sans l'action optimale). */
export type CubeClassification = Pick<CubeCoachResult, 'verdict' | 'explanation' | 'advice'>;

/**
 * Convertit un type d'action moteur (`OFFER_DOUBLE`, `TAKE_DOUBLE`, `PASS_DOUBLE`)
 * ou un libellé (`double`, `take`, `pass`) en `CubeAction` normalisée.
 */
export function mapGameCubeAction(rawAction: string | null | undefined): CubeAction | null {
    if (!rawAction) return null;
    switch (rawAction.toUpperCase()) {
        case 'OFFER_DOUBLE':
        case 'DOUBLE':
            return 'double';
        case 'TAKE_DOUBLE':
        case 'TAKE':
            return 'take';
        case 'PASS_DOUBLE':
        case 'PASS':
            return 'pass';
        case 'MISSED_DOUBLE':
            return 'missed_double';
        default:
            return null;
    }
}

/**
 * Classe la décision du joueur à partir de la chaîne d'action optimale
 * produite par `analyzeBoardCube` (fonction pure, testable sans plateau).
 *
 * Formats d'action optimale reconnus :
 *   - `'Double, take'` / `'Double, pass'` : le double est correct ; la réponse
 *     optimale de l'adversaire est le 2e terme.
 *   - `'No double, take'` : pas de double ; si l'adversaire est quand même
 *     doublé, il doit prendre.
 *   - `'No double (Crawford rule | DMP | Dead cube | Opening position)'` :
 *     videau bloqué, aucune réponse optimale définie.
 */
export function classifyCubeResponse(optimal: string, action: CubeAction): CubeClassification {
    const optimalIsDouble = optimal.startsWith('Double');
    const isCrawford = optimal.includes('Crawford');
    const optimalResponse: 'take' | 'pass' | null = optimal.includes('pass')
        ? 'pass'
        : optimal.includes('take')
          ? 'take'
          : null;

    if (action === 'missed_double') {
        if (optimalIsDouble) {
            return {
                verdict: 'blunder',
                explanation: '🔔 Videau oublié avant de lancer : votre position était assez forte pour doubler (×2) avant les dés.',
                advice: 'Pensez à vérifier le Videau avant chaque lancer quand votre attaque ou votre course domine.',
            };
        }
        return {
            verdict: 'optimal',
            explanation: 'Bon choix de garder le dé : le videau n’était pas encore mûr.',
            advice: 'Continuez à construire votre position avant de doubler.',
        };
    }

    if (action === 'double') {
        if (optimalIsDouble) {
            return {
                verdict: 'optimal',
                explanation: 'Excellent double : ta position est suffisamment forte pour justifier le videau.',
                advice: 'Double quand ton équité dépasse le seuil de double (~0.55 en money game).',
            };
        }
        if (isCrawford) {
            return {
                verdict: 'blunder',
                explanation: 'Le videau est interdit par la règle de Crawford : un joueur est à 1 point du match.',
                advice: 'Règle de Crawford : pas de videau quand un joueur est à 1 point du match.',
            };
        }
        return {
            verdict: 'blunder',
            explanation: 'Double prématuré : ta position n\'est pas assez forte pour justifier le videau.',
            advice: 'Ne double pas trop tôt : attends une équité clairement favorable.',
        };
    }

    if (action === 'take') {
        if (optimalResponse === 'take') {
            return {
                verdict: 'optimal',
                explanation: 'Bon take : tu as encore assez de chances de gagner pour accepter le videau.',
                advice: 'Prends si tes chances de gain dépassent ~25 % (take point).',
            };
        }
        if (optimalResponse === 'pass') {
            return {
                verdict: 'blunder',
                explanation: 'Take trop optimiste : tes chances de gain sont trop faibles, il fallait passer.',
                advice: 'Passe quand tes chances de gain tombent sous le take point (~25 %).',
            };
        }
        return {
            verdict: 'inaccuracy',
            explanation: 'Take discutable : la position est limite.',
            advice: 'Évalue le take point avant d\'accepter un videau.',
        };
    }

    // action === 'pass'
    if (optimalResponse === 'pass') {
        return {
            verdict: 'optimal',
            explanation: 'Bon pass : tes chances de gain étaient trop faibles pour prendre.',
            advice: 'Passe quand tes chances de gain sont sous le take point.',
        };
    }
    if (optimalResponse === 'take') {
        return {
            verdict: 'blunder',
            explanation: 'Pass trop frileux : tu avais encore assez de chances pour prendre le videau.',
            advice: 'Ne passe pas trop vite : prends si tes chances dépassent ~25 %.',
        };
    }
    return {
        verdict: 'inaccuracy',
        explanation: 'Pass discutable : la position était limite.',
        advice: 'Évalue le take point avant de passer.',
    };
}

/**
 * Analyse la décision de videau du joueur.
 *
 * @param state État du plateau au moment de la décision.
 * @param action Décision du joueur : 'double' | 'take' | 'pass'.
 */
export function analyzeCubeDecision(
    state: BoardState,
    action: CubeAction,
): CubeCoachResult {
    const cube = analyzeBoardCube(state);
    const optimal = cube.optimalAction ?? 'No double, take';
    const { verdict, explanation, advice } = classifyCubeResponse(optimal, action);

    let equityLoss = 0;
    if (verdict === 'blunder') {
        const noDouble = cube.noDouble ?? 0;
        const doubleTake = cube.doubleTake ?? 0;
        const doublePass = cube.doublePass ?? 1;
        const rawDiff =
            action === 'double'
                ? Math.abs(noDouble - Math.min(doubleTake, doublePass))
                : Math.abs(doubleTake - doublePass);
        equityLoss = -Number(Math.max(0.1, rawDiff).toFixed(4));
    } else if (verdict === 'inaccuracy') {

        equityLoss = -0.045;
    } else if (verdict === 'good') {
        equityLoss = -0.015;
    }

    return {
        verdict,
        optimalAction: optimal,
        playedAction: action,
        explanation,
        advice,
        equityLoss,
    };
}

/**
 * Détecte si le joueur a oublié de proposer le Videau avant de lancer les dés ("Missed Cube").
 * Retourne `null` si le videau n'était pas disponible ou si ne pas doubler était correct.
 */
export function detectMissedCubeBeforeRoll(state: BoardState): CubeCoachResult | null {
    const canOfferCube =
        !state.crawford &&
        state.cubeValue < 64 &&
        (state.cubeOwner === null || state.cubeOwner === state.turn);
    if (!canOfferCube) return null;

    const cube = analyzeBoardCube(state);
    const optimal = cube.optimalAction ?? 'No double, take';
    if (!optimal.startsWith('Double')) return null;

    const noDouble = cube.noDouble ?? 0;
    const bestDoubleEq = Math.min(cube.doubleTake ?? 1, cube.doublePass ?? 1);
    const missedLoss = Math.max(0, bestDoubleEq - noDouble);
    if (missedLoss < 0.05) return null;

    const { explanation, advice } = classifyCubeResponse(optimal, 'missed_double');
    return {
        verdict: missedLoss >= 0.08 ? 'blunder' : 'inaccuracy',
        optimalAction: optimal,
        playedAction: 'missed_double',
        explanation,
        advice,
        equityLoss: -Number(missedLoss.toFixed(4)),
    };
}
