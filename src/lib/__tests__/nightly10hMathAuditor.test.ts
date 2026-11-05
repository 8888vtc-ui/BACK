import { describe, it, expect } from 'vitest';
import {
    auditEq1MassConservation,
    auditEq2LegalGeometryBarWbgf,
    auditEq3TranspositionEquivalence,
    auditEq4SymmetryInversion,
    auditEq5MonotonicityDeltaEmg,
    auditEq6ProbabilityBoundsAntiMock,
    auditEq7RealBoardFactsTruth,
    auditEq836RollCombinatorics,
    auditEq9CoachIsolationGate,
    auditEq10PersonaPoolCalibration,
    auditEq11CubeLegalityZeroSum,
    auditEq12QuizBankStrict,
    auditMoveNightly,
} from '../engine/nightly10hMathAuditor';
import { createInitialState } from '../../engine/backgammonEngine';

describe('🔬 AUDIT MATHÉMATIQUE 12 ÉQUATIONS COUPE-CIRCUIT (nightly10hMathAuditor)', () => {
    const initialState = createInitialState();

    it('Équation #1 : Conservation stricte des 15 dames pour X et O', () => {
        const pass = auditEq1MassConservation(initialState.board, 0, 0);
        expect(pass.passed).toBe(true);

        const corruptedBoard = [...initialState.board];
        corruptedBoard[6] = 4; // retire 1 pion
        const fail = auditEq1MassConservation(corruptedBoard, 0, 0);
        expect(fail.passed).toBe(false);
    });

    it('Équation #2 : Légalité géométrique et priorité absolue de la barre', () => {
        // Coup légal d'ouverture 3-1
        const pass = auditEq2LegalGeometryBarWbgf(initialState.board, [{ from: 8, to: 5 }, { from: 6, to: 5 }], [3, 1], 'X');
        expect(pass.passed).toBe(true);

        // Pion sur la barre mais tentative de jouer un pion ailleurs
        const boardWithBar = [...initialState.board];
        boardWithBar[0] = 1; // 1 pion sur barre
        const failBar = auditEq2LegalGeometryBarWbgf(boardWithBar, [{ from: 8, to: 5 }], [3, 1], 'X');
        expect(failBar.passed).toBe(false);
        expect(failBar.detail).toContain('BAR_PRIORITY_STRICT');
    });

    it('Équation #3 : Équivalence mathématique des transpositions', () => {
        const pass = auditEq3TranspositionEquivalence(initialState.board, '24/21 13/8', '13/8 24/21', 'X', 0.0);
        expect(pass.passed).toBe(true);
    });

    it('Équation #4 : Symétrie miroir 25-i et idempotence', () => {
        const pass = auditEq4SymmetryInversion(initialState.board);
        expect(pass.passed).toBe(true);
    });

    it('Équation #5 : Monotonie des candidats et delta EMG <= 0', () => {
        const pass = auditEq5MonotonicityDeltaEmg(-0.015, [-0.015, -0.040, -0.090]);
        expect(pass.passed).toBe(true);

        const failGain = auditEq5MonotonicityDeltaEmg(0.010);
        expect(failGain.passed).toBe(false);
    });

    it('Équation #6 : Bornes des probabilités neuronales et anti-mock', () => {
        const pass = auditEq6ProbabilityBoundsAntiMock({
            win: 0.5432, winG: 0.1823, winBG: 0.0123, loseG: 0.1412, loseBG: 0.0089,
        });
        expect(pass.passed).toBe(true);

        const failMock = auditEq6ProbabilityBoundsAntiMock({
            win: 0.50, winG: 0.20, winBG: 0.01, loseG: 0.15, loseBG: 0.005,
        });
        expect(failMock.passed).toBe(false);
        expect(failMock.detail).toContain('HARDCODED_MOCK_PROBABILITIES_DETECTED');
    });

    it('Équation #7 : Vérité mathématique des faits du plateau et pip count', () => {
        const pass = auditEq7RealBoardFactsTruth(initialState.board, initialState.board, 'X');
        expect(pass.passed).toBe(true);
    });

    it('Équation #8 : Bornage combinatoire sur base 36 lancers', () => {
        const pass = auditEq836RollCombinatorics(11, 14, 25);
        expect(pass.passed).toBe(true);

        const fail = auditEq836RollCombinatorics(38, 5, 10);
        expect(fail.passed).toBe(false);
    });

    it('Équation #9 : Isolation Coach (zéro popup sur tour Bot)', () => {
        const pass = auditEq9CoachIsolationGate('BOT', false, -0.080);
        expect(pass.passed).toBe(true);

        const failBot = auditEq9CoachIsolationGate('BOT', true, -0.080);
        expect(failBot.passed).toBe(false);
    });

    it('Équation #10 : Calibration mathématique des 300 profils IA', () => {
        const passExpert = auditEq10PersonaPoolCalibration('expert', -0.025);
        expect(passExpert.passed).toBe(true);

        const failExpert = auditEq10PersonaPoolCalibration('expert', -0.150);
        expect(failExpert.passed).toBe(false);
    });

    it('Équation #11 : Légalité du videau et somme nulle du Cash-Out', () => {
        const passCashOut = auditEq11CubeLegalityZeroSum(7, false, false, false, {
            pointsShareA: 600, pointsShareB: 400,
            deltaPointsA: 100, deltaPointsB: -100,
            eloDeltaA: 12, eloDeltaB: -12,
            zeroSumVerified: true,
            winProbabilityA: 0.6, winProbabilityB: 0.4,
        });
        expect(passCashOut.passed).toBe(true);

        const failBeaver = auditEq11CubeLegalityZeroSum(5, false, false, true);
        expect(failBeaver.passed).toBe(false);
        expect(failBeaver.detail).toContain('MATCH_PLAY_BEAVER_FORBIDDEN');
    });

    it('Équation #12 : Intégrité stricte des quiz certifiés 3-ply', () => {
        const passEmpty = auditEq12QuizBankStrict(undefined);
        expect(passEmpty.passed).toBe(true);
    });

    it('Orchestration complète : auditMoveNightly sur un coup type', () => {
        const report = auditMoveNightly({
            player: 'X',
            boardBefore: initialState.board,
            boardAfter: initialState.board,
            dice: [3, 1],
            movesPlayed: [],
            playedNotation: 'Pass',
            optimalNotation: 'Pass',
            equityLossEmg: 0.0,
            actor: 'BOT',
            personaTier: 'expert',
            isCoachTriggered: false,
        });
        expect(report.isValid).toBe(true);
        expect(report.checks.length).toBe(12);
    });
});

