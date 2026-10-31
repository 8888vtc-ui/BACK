import { describe, expect, it } from 'vitest';
import { createInitialState, parseXGID } from '../../engine/backgammonEngine';
import {
    analyzeBtErhMoves,
    computeTrapComplexityBonus,
    evaluatePositionErh2Ply,
} from './btErhEngine';
import {
    analyzeBtErhCube,
    createInitialOpponentProfile,
    recordOpponentCheckerMove,
    recordOpponentCubeDecision,
    STRICT_GTO_CUBE_SAFETY_CAP_EMG,
} from './opponentErhTracker';

describe('BT-ERH v2.0 — Exploitation de la Réponse Humaine (Chequer Play, Pièges & Videau)', () => {
    it('1. Conserve 100 % la décision GTO de BT-Core face à une machine (opponentPr <= 1.5)', () => {
        const state = parseXGID('XGID=-b----E-C---eE---c-e----B-:0:0:1:42:0:0:0:7:10');
        const res = analyzeBtErhMoves(state, [4, 2], { opponentPr: 0.5, ply: 2 });

        expect(res.isGtoMode).toBe(true);
        expect(res.bestMove?.notation).toBe('8/4 6/4');
        expect(res.bestMove?.inducedBlunderRate).toBe(0);
    });

    it('2. Calcule l’espérance humaine Softmax (erhEquity >= gtoEquity) et respecte le plafond de sacrifice <= 0.015 EMG', () => {
        const state = parseXGID('XGID=-b---BD-C---dD--bc-e----B-:0:0:1:52:0:0:0:7:10');
        const res = analyzeBtErhMoves(state, [5, 2], {
            opponentPr: 8.5,
            ply: 2,
            maxGtoSacrificeEmg: 0.015,
            timeBudgetMs: 500,
        });

        expect(res.isGtoMode).toBe(false);
        expect(res.moves.length).toBeGreaterThan(1);

        const m0 = res.moves[0];
        expect(m0.erhEquity).toBeGreaterThanOrEqual(m0.gtoEquity);
        expect(m0.inducedBlunderRate).toBeGreaterThanOrEqual(0);

        // Vérifie que le coup choisi ne sacrifie jamais plus de 0.015 EMG par rapport au meilleur coup GTO
        const maxGto = Math.max(...res.moves.map((m) => m.gtoEquity));
        expect(maxGto - m0.gtoEquity).toBeLessThanOrEqual(0.0151);
    });

    it('3. Actualise en direct le profil télémétrique adverse (PR glissant, Fear of Gammons, Pride Take)', () => {
        let profile = createInitialOpponentProfile('intermediate');
        expect(profile.estimatedPr).toBeCloseTo(6.5, 1);

        for (let i = 0; i < 6; i++) {
            profile = recordOpponentCheckerMove(profile, {
                equityLossEmg: 0.095,
                isUnforcedDecision: true,
                oppLoseGammonProb: 0.24,
                didHitChecker: true,
                didBreakHomeOrKeyPoint: true,
                isPassiveOverStackMove: true,
            });
        }
        expect(profile.estimatedPr).toBeGreaterThan(15);
        expect(profile.blunderRate).toBe(1);
        expect(profile.fearOfGammonsIndex).toBeGreaterThan(0.52);
        expect(profile.greedHitIndex).toBeGreaterThan(0.50);

        profile = recordOpponentCubeDecision(profile, {
            decision: 'TAKE',
            gtoAction: 'DOUBLE_PASS',
            oppLoseGammonProb: 0.30,
            equityLossTakeVsPass: 0.18,
        });
        expect(profile.prideTakeIndex).toBeGreaterThan(0.45);
    });

    it('4. Respecte le garde-fou GTO strict (<= 0.025 EMG) sur le Videau exploitatif analyzeBtErhCube', () => {
        const state = createInitialState(7);
        const fearfulProfile = createInitialOpponentProfile('beginner');
        const cubeRes = analyzeBtErhCube(state, fearfulProfile);

        // En position initiale équilibrée, le garde-fou bloque tout bluff double absurde
        expect(cubeRes.optimalAction).toContain('No double');
        expect(cubeRes.gtoEquityLoss).toBeLessThanOrEqual(STRICT_GTO_CUBE_SAFETY_CAP_EMG);
    });

    it('5. Évalue correctement le bonus de complexité tactique (tirs indirects & dilemme Frappe vs Prime)', () => {
        const state = parseXGID('XGID=-a-B-BC-C---cD--bc-e----B-:0:0:1:31:0:0:0:7:10');
        const details = computeTrapComplexityBonus(state.board, 'X');
        expect(details.bonus).toBeGreaterThanOrEqual(0);
        expect(details.bonus).toBeLessThanOrEqual(0.035);

        const erh2Ply = evaluatePositionErh2Ply(state, 9.0);
        expect(erh2Ply.erhEquity).toBeGreaterThanOrEqual(erh2Ply.gtoEquity);
    });
});
