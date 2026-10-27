import { describe, expect, it } from 'vitest';
import { createInitialState, X_BAR, O_BAR } from '../../engine/backgammonEngine';
import {
    isPureRace,
    isBearOffPhase,
    extractHomeCounts,
    calculateEffectivePipCount,
    evaluateRaceCube,
    evaluateIsightRace,
    computeTriceNormalWinProbability,
    MEAN_PIPS_PER_ROLL,
    VAR_PIPS_PER_ROLL,
} from './effectivePipCount';
import { computeJanowskiCubeEvaluation, detectJanowskiPhase } from './janowskiCube';

describe('effectivePipCount — Détection de course et calcul EPC', () => {
    it('isPureRace détecte correctement le contact ou la course pure', () => {
        // 1. Position initiale : contact fort
        const initial = createInitialState();
        expect(isPureRace(initial.board)).toBe(false);

        // 2. Présence sur la barre
        const barBoard = new Array<number>(26).fill(0);
        barBoard[X_BAR] = 1;
        barBoard[1] = 14;
        barBoard[24] = -15;
        expect(isPureRace(barBoard)).toBe(false);

        // 3. Course pure : X a tous ses pions sur 1..6 et O sur 19..24
        const pureRaceBoard = new Array<number>(26).fill(0);
        pureRaceBoard[1] = 5;
        pureRaceBoard[2] = 5;
        pureRaceBoard[3] = 5;
        pureRaceBoard[22] = -5;
        pureRaceBoard[23] = -5;
        pureRaceBoard[24] = -5;
        expect(isPureRace(pureRaceBoard)).toBe(true);

        // 4. Contact encore présent : un pion de X est en 13 alors qu'un pion de O est en 10
        const contactBoard = new Array<number>(26).fill(0);
        contactBoard[13] = 2; // X
        contactBoard[10] = -2; // O (O avance vers 24, donc X à 13 doit encore croiser O à 10)
        expect(isPureRace(contactBoard)).toBe(false);
    });

    it('isBearOffPhase identifie quand tous les pions sont dans le jan intérieur', () => {
        const board = new Array<number>(26).fill(0);
        // X : 15 pions dans le home board (points 1..6)
        board[1] = 5;
        board[2] = 5;
        board[6] = 5;
        // O : pions encore en dehors (point 13)
        board[13] = -5;
        board[24] = -10;

        expect(isBearOffPhase(board, 'X')).toBe(true);
        expect(isBearOffPhase(board, 'O')).toBe(false);

        // Si X a 1 pion sur le point 7, ce n'est plus bear-off
        board[7] = 1;
        board[6] = 4;
        expect(isBearOffPhase(board, 'X')).toBe(false);
    });

    it('extractHomeCounts extrait fidèlement les 6 flèches du home board', () => {
        const board = new Array<number>(26).fill(0);
        board[1] = 2;
        board[2] = 3;
        board[6] = 4;
        board[24] = -2;
        board[23] = -3;
        board[19] = -4;

        expect(extractHomeCounts(board, 'X')).toEqual([2, 3, 0, 0, 0, 4]);
        expect(extractHomeCounts(board, 'O')).toEqual([2, 3, 0, 0, 0, 4]);
    });

    it('calculateEffectivePipCount calcule avec précision le Wastage et l’EPC en bear-off', () => {
        const board = new Array<number>(26).fill(0);
        // Position A : 2 pions sur la flèche 1 pour X
        board[1] = 2;
        const resA = calculateEffectivePipCount(board, 'X');

        expect(resA.rawPips).toBe(2);
        expect(resA.isBearOff).toBe(true);
        expect(resA.checkersRemaining).toBe(2);
        // Pour 2 pions sur le point 1, 1 seul lancer suffit (sauf 0 lancer possible)
        expect(resA.expectedRolls).toBeGreaterThanOrEqual(1);
        expect(resA.epc).toBeGreaterThanOrEqual(resA.rawPips);
        expect(resA.wastage).toBeGreaterThanOrEqual(0);
    });

    it('calculateEffectivePipCount applique des pénalités de gaspillage sur les points bas', () => {
        // Deux positions avec même nombre de pions (6 pions) :
        // Position 1 : étalée sur 4, 3, 2, 1 (bonne répartition)
        const boardSmooth = new Array<number>(26).fill(0);
        boardSmooth[4] = 2;
        boardSmooth[3] = 2;
        boardSmooth[2] = 1;
        boardSmooth[1] = 1;
        // Pips = 2*4 + 2*3 + 1*2 + 1*1 = 8 + 6 + 2 + 1 = 17

        // Position 2 : 6 pions empilés sur le point 1 (gaspillage massif)
        const boardStacked = new Array<number>(26).fill(0);
        boardStacked[1] = 6;
        // Pips = 6*1 = 6

        const resSmooth = calculateEffectivePipCount(boardSmooth, 'X');
        const resStacked = calculateEffectivePipCount(boardStacked, 'X');

        // La position empilée sur l'as-point doit afficher un gaspillage (wastage) significatif
        expect(resStacked.wastage).toBeGreaterThan(resSmooth.wastage);
    });

    it('evaluateRaceCube applique la règle de Trice et détecte la fenêtre de videau', () => {
        const board = new Array<number>(26).fill(0);
        // Course pure :
        // X : 6 pions sur point 2 (Pips: 12)
        board[2] = 6;
        // O : 6 pions sur point 20 (Pips: 6 * 5 = 30)
        board[20] = -6;

        expect(isPureRace(board)).toBe(true);

        const evalX = evaluateRaceCube(board, 'X', false);
        expect(evalX.isPureRace).toBe(true);
        expect(evalX.leader).toBe('X');
        expect(evalX.epcLead).toBeGreaterThan(5);
        // Avec une avance massive (12 vs 30 pips), le double est soit gagnant (Double/Pass), soit trop fort
        expect(['Double, pass', 'Too good to double']).toContain(evalX.action);

        // Égalité parfaite de course
        const tiedBoard = new Array<number>(26).fill(0);
        tiedBoard[2] = 6;
        tiedBoard[23] = -6; // 25 - 23 = 2 pips par pion
        const evalTied = evaluateRaceCube(tiedBoard, 'X', false);
        expect(evalTied.action).toBe('No double, take');
    });

    it('utilise les constantes exactes de renouvellement (49/6 pips/lancer et 665/36 variance)', () => {
        expect(MEAN_PIPS_PER_ROLL).toBeCloseTo(8.1667, 4);
        expect(VAR_PIPS_PER_ROLL).toBeCloseTo(18.4722, 4);

        const evenRace = computeTriceNormalWinProbability({
            rollerEPC: 70,
            opponentEPC: 70,
            rollerRawPips: 62,
            opponentRawPips: 62,
        });
        // Le joueur au trait a +49/12 pips d'avance grâce au trait -> P(Win) > 0.55
        expect(evenRace.winProb).toBeGreaterThan(0.55);
        expect(evenRace.winProb).toBeLessThan(0.65);
    });

    it('evaluateIsightRace calcule les seuils d’Axel Reichert (l + l/6, Double/Take/Pass)', () => {
        const board = new Array<number>(26).fill(0);
        // X : 10 pions sur la flèche 6 (60 pips)
        board[6] = 10;
        // O : 11 pions sur la flèche 19 (66 pips du point de vue de O)
        board[19] = -11;

        const isight = evaluateIsightRace(board, 'X');
        expect(isight.rollerRawPips).toBe(60);
        expect(isight.opponentRawPips).toBe(66);
        expect(isight.criteriaTotal).toBe(70); // 60 + 60/6 = 70
        expect(isight.pointOfLastTake).toBe(68);
        expect(isight.initialDoubleThreshold).toBe(64);
        expect(['DOUBLE_TAKE', 'REDOUBLE_TAKE']).toContain(isight.moneyDecision);
        expect(isight.cpwPiecewisePercent).toBeGreaterThan(70);
    });

    it('computeJanowskiCubeEvaluation différencie la Cube Efficiency par phase (Course vs Blitz)', () => {
        const probs = {
            win: 0.72,
            winGammon: 0.18,
            winBackgammon: 0.01,
            loseWin: 0.28,
            loseGammon: 0.04,
            loseBackgammon: 0.0,
        };
        const raceEval = computeJanowskiCubeEvaluation(probs, 'PURE_RACE');
        const blitzEval = computeJanowskiCubeEvaluation(probs, 'BLITZ');
        expect(blitzEval.efficiency.x1).toBeGreaterThan(raceEval.efficiency.x1);
        expect(raceEval.takePointLive).toBeCloseTo(0.22, 1);
        expect(raceEval.doublePoint).toBeLessThan(raceEval.cashPoint);

        const initial = createInitialState();
        expect(['HOLDING_GAME', 'CONTACT']).toContain(detectJanowskiPhase(initial.board, 'X'));
    });
});
