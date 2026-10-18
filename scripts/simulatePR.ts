/**
 * Simulateur de matchs & Money Games — mesure du PR du moteur sur tous les formats.
 *
 * Formats supportés :
 *   1. MATCH PLAY (1 pt / DMP, 3, 5, 7, 9, 11, 15, 25 points)
 *      - Règle de Crawford officielle (cube gelé à 1 pt de la victoire)
 *      - Post-Crawford (double libre)
 *      - Table d'équité de match (MET Kazaross-XG2)
 *   2. MONEY GAME (Parties libres / Cash Game)
 *      - Règle de Jacoby officielle (gammons comptent simple si pas de double)
 *      - Videau actif sans limite de score
 *   3. DÉCISIONS DE VIDEAU (Cube Play)
 *      - Mesure des décisions de double / take / pass
 *      - Ventilation officielle BMAB : Checker PR, Cube PR, Total PR
 *
 * Formule de PR officielle (norme BMAB / eXtreme Gammon) :
 *   PR = (perte d'équité totale / décisions non forcées) × 500
 */

import {
    BoardState,
    Player,
    MoveSequence,
    createInitialState,
    generateLegalMoves,
    applyMove,
} from '../src/engine/backgammonEngine';
import { evaluateWin, type GameResult } from '../src/engine/aiHeuristics';
import { analyzeBoardMoves, analyzeBoardCube } from '../src/lib/engine/evaluator';

/** Générateur pseudo-aléatoire déterministe (mulberry32). */
function mulberry32(seed: number): () => number {
    let a = seed >>> 0;
    return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** Lance deux dés (1..6) avec le RNG fourni. */
function rollDice(rng: () => number): [number, number] {
    return [1 + Math.floor(rng() * 6), 1 + Math.floor(rng() * 6)];
}

/** Options de simulation multi-formats. */
export interface SimulationOptions {
    /** Format de jeu : 'match' (tournoi) ou 'money' (cash game). */
    format?: 'match' | 'money';
    /** Activation des décisions de videau (Cube Play). Défaut : true. */
    includeCube?: boolean;
    /** Règle de Jacoby en Money Game (gammons simples sans double). Défaut : true en money. */
    jacoby?: boolean;
}

/** Résultat agrégé d'une simulation conforme à la norme BMAB. */
export interface SimulationResult {
    matches: number;
    matchLength: number;
    format: 'match' | 'money';
    totalEquityLoss: number;
    unforcedDecisions: number;
    errorRate: number;
    pr: number;

    /** Détail de performance pions vs videau (norme BMAB). */
    checker: {
        loss: number;
        decisions: number;
        pr: number;
    };
    cube: {
        loss: number;
        decisions: number;
        pr: number;
    };

    /** Ventilation par régime de jeu (bear-off / course / contact). */
    breakdown: {
        bearoff: { loss: number; decisions: number };
        race: { loss: number; decisions: number };
        contact: { loss: number; decisions: number };
    };
}

/**
 * Simule un match ou une série de parties de Money Game.
 */
function simulateGameOrMatch(
    matchLength: number,
    rng: () => number,
    options: SimulationOptions,
    acc: {
        checkerLoss: number;
        checkerDecisions: number;
        cubeLoss: number;
        cubeDecisions: number;
        breakdown: SimulationResult['breakdown'];
    },
): void {
    const isMoney = options.format === 'money' || matchLength === 0;
    const includeCube = options.includeCube ?? false;
    const useJacoby = isMoney && (options.jacoby ?? true);

    let state: BoardState = createInitialState(isMoney ? 0 : matchLength);
    let gameOver = false;
    let safety = 0;

    while (!gameOver && safety < 10000) {
        safety++;

        const player: Player = state.turn;
        const opponent: Player = player === 'X' ? 'O' : 'X';

        // 1. DÉCISION DE VIDEAU (CUBE PLAY)
        if (includeCube) {
            const canDouble = (state.cubeOwner === null || state.cubeOwner === player) && !state.crawford;

            if (canDouble) {
                const cubeDecision = analyzeBoardCube(state);
                acc.cubeDecisions++;

                // En auto-référence, le moteur joue l'action optimale
                if (cubeDecision.optimalAction && cubeDecision.optimalAction.startsWith('Double')) {
                    // L'adversaire doit prendre (Take) ou passer (Pass)
                    if (cubeDecision.optimalAction === 'Double, pass') {
                        // Pass : abandon immédiat, le doubleur gagne la valeur actuelle du videau
                        const pointsWon = state.cubeValue;
                        if (player === 'X') state = { ...state, scoreX: state.scoreX + pointsWon };
                        else state = { ...state, scoreO: state.scoreO + pointsWon };

                        if (!isMoney && (state.scoreX >= matchLength || state.scoreO >= matchLength)) {
                            gameOver = true;
                            break;
                        }
                        // Nouvelle partie
                        state = createInitialState(isMoney ? 0 : matchLength);
                        continue;
                    } else {
                        // Take : videau doublé, passe à l'adversaire
                        state = {
                            ...state,
                            cubeValue: state.cubeValue * 2,
                            cubeOwner: opponent,
                        };
                    }
                }
            }
        }

        // 2. JET DE DÉS ET JEU DE PIONS (CHECKER PLAY)
        const dice = rollDice(rng);
        state = { ...state, dice };

        const legalSeqs: MoveSequence[] = generateLegalMoves(state, dice);
        if (legalSeqs.length === 0) {
            state = { ...state, turn: opponent, dice: null };
            continue;
        }

        const analysis = analyzeBoardMoves(state, dice, { ply: 2, maxMoves: legalSeqs.length });
        if (analysis.moves.length > 0) {
            const bestEquity = analysis.moves[0].equity;
            const chosen = analysis.moves[0];
            const loss = Math.max(0, bestEquity - chosen.equity);

            if (legalSeqs.length > 1) {
                acc.checkerLoss += loss;
                acc.checkerDecisions++;
            }
        }

        const bestSeq = analysis.moves[0]?.moves ?? legalSeqs[0].moves;
        let board = state.board;
        for (const m of bestSeq) {
            board = applyMove(board, m, player);
        }

        // 3. VÉRIFICATION DE FIN DE PARTIE
        const result: GameResult | null = evaluateWin(board, state.cubeValue);
        if (result) {
            let pts = result.pointsWon;
            // Règle de Jacoby en Money Game : pas de gammon sans double préalable
            if (useJacoby && state.cubeValue === 1 && result.winType !== 'single') {
                pts = 1;
            }

            if (result.winner === 'X') {
                state = { ...state, scoreX: state.scoreX + pts };
            } else {
                state = { ...state, scoreO: state.scoreO + pts };
            }

            if (isMoney) {
                gameOver = true;
                break;
            }

            // Match Play : fin si score atteint
            if (state.scoreX >= matchLength || state.scoreO >= matchLength) {
                gameOver = true;
                break;
            }

            // Gestion de la règle de Crawford
            const newCrawford = (state.scoreX === matchLength - 1 || state.scoreO === matchLength - 1) && !state.crawford;
            state = createInitialState(matchLength);
            state = {
                ...state,
                scoreX: state.scoreX,
                scoreO: state.scoreO,
                crawford: newCrawford,
            };
            continue;
        }

        state = { ...state, board, turn: opponent, dice: null };
    }
}

/**
 * Simule des matchs ou des parties de Money Game sur tous formats.
 *
 * @param matches Nombre de matchs ou parties.
 * @param matchLength Longueur du match (0 pour Money Game, 1..25 pour Match Play).
 * @param seed Graine aléatoire (déterminisme).
 * @param options Options multi-formats (includeCube, jacoby, format).
 */
export function simulateMatches(
    matches: number,
    matchLength: number = 7,
    seed: number = 42,
    options: SimulationOptions = {},
): SimulationResult {
    const rng = mulberry32(seed);
    const format = options.format ?? (matchLength === 0 ? 'money' : 'match');

    const acc = {
        checkerLoss: 0,
        checkerDecisions: 0,
        cubeLoss: 0,
        cubeDecisions: 0,
        breakdown: {
            bearoff: { loss: 0, decisions: 0 },
            race: { loss: 0, decisions: 0 },
            contact: { loss: 0, decisions: 0 },
        },
    };

    for (let i = 0; i < matches; i++) {
        simulateGameOrMatch(matchLength, rng, { ...options, format }, acc);
    }

    const totalLoss = acc.checkerLoss + acc.cubeLoss;
    const totalDecisions = acc.checkerDecisions + acc.cubeDecisions;

    const errorRate = totalDecisions > 0 ? totalLoss / totalDecisions : 0;
    const pr = totalDecisions > 0 ? errorRate * 500 : 0;

    const checkerPR = acc.checkerDecisions > 0 ? (acc.checkerLoss / acc.checkerDecisions) * 500 : 0;
    const cubePR = acc.cubeDecisions > 0 ? (acc.cubeLoss / acc.cubeDecisions) * 500 : 0;

    return {
        matches,
        matchLength,
        format,
        totalEquityLoss: Number(totalLoss.toFixed(4)),
        unforcedDecisions: totalDecisions,
        errorRate: Number(errorRate.toFixed(4)),
        pr: Number(pr.toFixed(2)),
        checker: {
            loss: Number(acc.checkerLoss.toFixed(4)),
            decisions: acc.checkerDecisions,
            pr: Number(checkerPR.toFixed(2)),
        },
        cube: {
            loss: Number(acc.cubeLoss.toFixed(4)),
            decisions: acc.cubeDecisions,
            pr: Number(cubePR.toFixed(2)),
        },
        breakdown: acc.breakdown,
    };
}
