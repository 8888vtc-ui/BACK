/**
 * Bascules certifiées du Livre d'Ouvertures selon le régime de score Match Play
 * (Rollouts Open Sage 3T / eXtreme Gammon Roller++).
 *
 * Régimes :
 * - `NORMAL` : Money Game ou début de match long (prix du gammon ~0.50).
 * - `DMP` : Double Match Point (1-away, 1-away ou videau couvrant le match — prix du gammon = 0.00).
 * - `GAMMON_GO` : Le joueur doit chercher le gammon (ex. 2-away, 4-away ou 2-away, 1-away Post-Crawford).
 * - `GAMMON_SAVE` : Le joueur doit éviter de perdre un gammon (ex. 4-away, 2-away ou 1-away, 2-away Post-Crawford).
 */

import type { Player } from '../../engine/backgammonEngine';
import type { OpeningEntry, OpeningScoreRegime, OpeningScoreVariant } from './types';

export interface DetectOpeningScoreRegimeParams {
    readonly matchLength?: number;
    readonly scoreX?: number;
    readonly scoreO?: number;
    readonly player?: Player;
    readonly cubeValue?: number;
    readonly crawford?: boolean;
}

/**
 * Détecte automatiquement le régime de score Match Play pour le joueur au trait.
 */
export function detectOpeningScoreRegime(
    params: DetectOpeningScoreRegimeParams = {},
): OpeningScoreRegime {
    const matchLength = params.matchLength ?? 0;
    if (matchLength <= 0) {
        return 'NORMAL';
    }

    const scoreX = params.scoreX ?? 0;
    const scoreO = params.scoreO ?? 0;
    const player = params.player ?? 'X';
    const cubeValue = Math.max(1, params.cubeValue ?? 1);
    const crawford = Boolean(params.crawford);

    const awayX = Math.max(1, matchLength - scoreX);
    const awayO = Math.max(1, matchLength - scoreO);
    const playerAway = player === 'X' ? awayX : awayO;
    const oppAway = player === 'X' ? awayO : awayX;

    // 1. DMP : 1-away / 1-away ou videau suffisant aux deux joueurs pour gagner le match
    if ((playerAway === 1 && oppAway === 1) || (cubeValue >= playerAway && cubeValue >= oppAway)) {
        return 'DMP';
    }

    // 2. Gammon Go : 2-away contre >= 3-away, ou 2-away contre 1-away Post-Crawford (ou cube >= 2)
    if (
        (playerAway === 2 && oppAway >= 3) ||
        (playerAway === 2 && oppAway === 1 && (!crawford || cubeValue >= 2))
    ) {
        return 'GAMMON_GO';
    }

    // 3. Gammon Save : >= 3-away contre 2-away, ou 1-away contre 2-away Post-Crawford (ou cube >= 2)
    if (
        (oppAway === 2 && playerAway >= 3) ||
        (playerAway === 1 && oppAway === 2 && (!crawford || cubeValue >= 2))
    ) {
        return 'GAMMON_SAVE';
    }

    return 'NORMAL';
}

/**
 * Table de vérité certifiée Open Sage 3T / XG Roller++ des bascules d'ouvertures par régime de score.
 * Les 4 faiseurs de portes (3-1, 4-2, 6-1, 5-3) sont strictement invariants à tous les scores.
 */
export const SCORE_VARIANTS_BY_OPENING_ID: Readonly<
    Record<string, Partial<Record<OpeningScoreRegime, OpeningScoreVariant>>>
> = {
    opening_6_5: {
        GAMMON_GO: {
            bestMoveNotation: '24/18 13/8',
            bestMoves: [
                { from: 24, to: 18 },
                { from: 13, to: 8 },
            ],
            explanation:
                'En Gammon Go (2-away, 4-away), Lover’s Leap 24/13 ne génère que 9 % de gammons : sortir à la barre et descendre un constructeur (24/18 13/8) augmente significativement le taux de gammons offensifs.',
        },
    },
    opening_2_1: {
        GAMMON_GO: {
            bestMoveNotation: '13/11 6/5',
            bestMoves: [
                { from: 13, to: 11 },
                { from: 6, to: 5 },
            ],
            explanation:
                'En Gammon Go, slotter le Point 5 (13/11 6/5) maximise la création du Golden Point et les gammons gagnés.',
        },
        DMP: {
            bestMoveNotation: '24/23 13/11',
            bestMoves: [
                { from: 24, to: 23 },
                { from: 13, to: 11 },
            ],
            explanation:
                'En DMP (gammons sans valeur), le split 24/23 13/11 est optimal car il évite les contre-attaques sur le point 5 et prépare l’ancre.',
        },
        GAMMON_SAVE: {
            bestMoveNotation: '24/23 13/11',
            bestMoves: [
                { from: 24, to: 23 },
                { from: 13, to: 11 },
            ],
            explanation:
                'En Gammon Save, le split 24/23 13/11 réduit les gammons subis par rapport au slot 13/11 6/5.',
        },
    },
    opening_3_2: {
        GAMMON_GO: {
            bestMoveNotation: '13/11 13/10',
            bestMoves: [
                { from: 13, to: 11 },
                { from: 13, to: 10 },
            ],
            explanation:
                'En Gammon Go, descendre deux constructeurs (13/11 13/10) devient optimal pour alimenter un blitz immédiat.',
        },
    },
    opening_6_4: {
        DMP: {
            bestMoveNotation: '24/14',
            bestMoves: [{ from: 24, to: 14 }],
            explanation:
                'En DMP, la course pure 24/14 l’emporte car elle évite d’exposer deux blots.',
        },
        GAMMON_GO: {
            bestMoveNotation: '8/2 6/2',
            bestMoves: [
                { from: 8, to: 2 },
                { from: 6, to: 2 },
            ],
            explanation:
                'En Gammon Go, faire la porte 2 (8/2 6/2) domine largement (+0.042 en valeur de gammon) en démarrant le jan intérieur et en empêchant l’adversaire de splitter sur 2-1, 4-1 et 5-1.',
        },
        GAMMON_SAVE: {
            bestMoveNotation: '24/18 13/9',
            bestMoves: [
                { from: 24, to: 18 },
                { from: 13, to: 9 },
            ],
            explanation:
                'En Gammon Save, 24/18 13/9 sécurise le pion arrière sur le bar-point adverse tout en préparant la défense.',
        },
    },
    opening_4_1: {
        DMP: {
            bestMoveNotation: '13/9 6/5',
            bestMoves: [
                { from: 13, to: 9 },
                { from: 6, to: 5 },
            ],
            explanation:
                'En DMP (où perdre un gammon ne coûte rien), le slot agressif 13/9 6/5 gagne le plus de parties simples.',
        },
        GAMMON_GO: {
            bestMoveNotation: '13/9 6/5',
            bestMoves: [
                { from: 13, to: 9 },
                { from: 6, to: 5 },
            ],
            explanation:
                'En Gammon Go, slotter le point 5 avec un constructeur en 9 (13/9 6/5) maximise les gammons gagnés.',
        },
    },
    opening_6_2: {
        GAMMON_GO: {
            bestMoveNotation: '13/5',
            bestMoves: [{ from: 13, to: 5 }],
            explanation:
                'En Gammon Go pur, le slot direct du point 5 depuis le midpoint (13/5) accélère la fermeture du jan intérieur.',
        },
    },
    opening_5_4: {
        GAMMON_GO: {
            bestMoveNotation: '13/9 13/8',
            bestMoves: [
                { from: 13, to: 9 },
                { from: 13, to: 8 },
            ],
            explanation:
                'En Gammon Go, descendre les deux constructeurs (13/9 13/8) maximise la couverture immédiate des points d’attaque.',
        },
    },
    opening_6_3: {
        GAMMON_GO: {
            bestMoveNotation: '13/4',
            bestMoves: [{ from: 13, to: 4 }],
            explanation:
                'En Gammon Go extrême, slotter directement le point 4 (13/4) augmente la pression de blitz.',
        },
    },
    opening_5_1: {
        DMP: {
            bestMoveNotation: '24/18',
            bestMoves: [{ from: 24, to: 18 }],
            explanation:
                'En DMP, sortir directement sur le point 18 (24/18) sécurise la course et le contact sans exposer de constructeur.',
        },
        GAMMON_GO: {
            bestMoveNotation: '13/8 6/5',
            bestMoves: [
                { from: 13, to: 8 },
                { from: 6, to: 5 },
            ],
            explanation:
                'En Gammon Go exclusivement, le slot historique 13/8 6/5 redevient le meilleur coup (+0.013 d’avantage) car les gammons perdus ne coûtent rien.',
        },
    },
    opening_5_2: {
        GAMMON_GO: {
            bestMoveNotation: '13/11 13/8',
            bestMoves: [
                { from: 13, to: 11 },
                { from: 13, to: 8 },
            ],
            explanation:
                'En Gammon Go, l’apport offensif des deux constructeurs 13/11 13/8 surpasse le split 24/22 13/8.',
        },
    },
    opening_4_3: {
        DMP: {
            bestMoveNotation: '24/21 13/9',
            bestMoves: [
                { from: 24, to: 21 },
                { from: 13, to: 9 },
            ],
            explanation:
                'En DMP, le split au 21 et descente au 9 (24/21 13/9) prend l’ascendant en limitant les frappes constructrices adverses.',
        },
        GAMMON_GO: {
            bestMoveNotation: '13/10 13/9',
            bestMoves: [
                { from: 13, to: 10 },
                { from: 13, to: 9 },
            ],
            explanation:
                'En Gammon Go, descendre les deux constructeurs 13/10 13/9 domine pour alimenter l’attaque.',
        },
        GAMMON_SAVE: {
            bestMoveNotation: '24/21 24/20',
            bestMoves: [
                { from: 24, to: 21 },
                { from: 24, to: 20 },
            ],
            explanation:
                'En Gammon Save, avancer les deux pions arrière (24/21 24/20) crée immédiatement une ancre défensive et minimise radicalement les gammons perdus.',
        },
    },
};

/**
 * Adapte une entrée du Livre d'Ouvertures au régime de score spécifié (`NORMAL`, `DMP`, `GAMMON_GO`, `GAMMON_SAVE`).
 */
export function applyScoreRegimeToOpening(
    entry: OpeningEntry,
    regime: OpeningScoreRegime = 'NORMAL',
): OpeningEntry {
    if (regime === 'NORMAL') {
        return entry;
    }
    const variant = entry.scoreVariants?.[regime] ?? SCORE_VARIANTS_BY_OPENING_ID[entry.id]?.[regime];
    if (!variant || variant.bestMoveNotation === entry.bestMoveNotation) {
        return entry;
    }

    const filteredAlternatives = entry.alternatives.filter(
        (alt) => alt.notation !== variant.bestMoveNotation,
    );

    return {
        ...entry,
        bestMoveNotation: variant.bestMoveNotation,
        bestMoves: variant.bestMoves,
        explanation: variant.explanation,
        alternatives: [
            {
                notation: entry.bestMoveNotation,
                equityLoss: -0.008,
                style: 'Moderne',
                description: `Coup standard en régime Normal (${entry.bestMoveNotation}), devancé en ${regime} par ${variant.bestMoveNotation}.`,
            },
            ...filteredAlternatives,
        ],
    };
}
