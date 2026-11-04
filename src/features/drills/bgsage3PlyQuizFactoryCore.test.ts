import { describe, expect, it } from 'vitest';
import {
    ALL_COMPETITION_FORMATS,
    TARGET_MAX_QUIZZES,
    TARGET_CHECKER_QUIZZES,
    TARGET_CUBE_QUIZZES,
    extractGeometric36Rolls,
    computeQuizTargetERAndBracket,
    computeErPrForMove,
    formatUiQuizLevelBadge,
    validateSingleQuizStrict,
    type Certified3PlyQuiz,
} from './bgsage3PlyQuizFactoryCore';
import { parseXGID } from '../../engine/backgammonEngine';
import { validateBoardState } from './drillSubAgentsPipeline';

describe('bgsage3PlyQuizFactoryCore — Sas Coupe-Circuit 14 Contrôles (14/14 PASS) & 50 000 Quiz', () => {
    it('définit TARGET_MAX_QUIZZES = 50000 (40 000 CHECKER_PLAY + 10 000 CUBE_DECISION) et tous les formats [0, 3, 5, 7, 9, 11, 21]', () => {
        expect(TARGET_MAX_QUIZZES).toBe(50000);
        expect(TARGET_CHECKER_QUIZZES).toBe(40000);
        expect(TARGET_CUBE_QUIZZES).toBe(10000);

        const matchLengths = new Set(ALL_COMPETITION_FORMATS.map((f) => f.matchLength));
        for (const ml of [0, 3, 5, 7, 9, 11, 21] as const) {
            expect(matchLengths.has(ml)).toBe(true);
        }
    });

    it('calcule quizTargetER en pas de 0.5 exacts sur les 5 tranches (DEBUTANT à MASTER) avec gap12 >= 0.008 et Zéro ERH', () => {
        const deb = computeQuizTargetERAndBracket({ gap12Emg: 0.095, is3PlyTrapVs0Ply: false, is1PlyTrapVs3Ply: false });
        expect(deb.targetBracket).toBe('DEBUTANT');
        expect((deb.quizTargetER * 2) % 1).toBe(0);

        const club = computeQuizTargetERAndBracket({ gap12Emg: 0.052, is3PlyTrapVs0Ply: true, is1PlyTrapVs3Ply: false });
        expect(club.targetBracket).toBe('CLUB');

        const inter = computeQuizTargetERAndBracket({ gap12Emg: 0.029, is3PlyTrapVs0Ply: true, is1PlyTrapVs3Ply: false });
        expect(inter.targetBracket).toBe('INTERMEDIAIRE');

        const exp = computeQuizTargetERAndBracket({ gap12Emg: 0.018, is3PlyTrapVs0Ply: true, is1PlyTrapVs3Ply: false });
        expect(exp.targetBracket).toBe('EXPERT');

        const master = computeQuizTargetERAndBracket({ gap12Emg: 0.0097, is3PlyTrapVs0Ply: true, is1PlyTrapVs3Ply: true });
        expect(master.targetBracket).toBe('MASTER');
        expect(master.quizTargetER).toBeGreaterThanOrEqual(0.5);
        expect(master.quizTargetER).toBeLessThanOrEqual(2.0);

        const opt = computeErPrForMove({ rank: 1, equityLoss: 0 });
        expect(opt.erPrScore).toBe(0.0);
        expect((opt as { erhScore?: unknown }).erhScore).toBeUndefined();
    });

    it('valide les 14 contrôles unitaires (14/14 PASS) de validateSingleQuizStrict(quiz) pour CHECKER_PLAY et CUBE_DECISION', () => {
        const xgid = 'XGID=---B-BDbB-C-b----abd-bb-B-:0:0:1:45:0:0:0:7:10';
        const parsed = parseXGID(xgid);
        const boardVal = validateBoardState(parsed.board, 'X');
        const geom = extractGeometric36Rolls(boardVal.normalizedBoard, '24/20 10/5');
        const pipText = `${geom.whitePips} vs ${geom.blackPips} pips`;

        const validQuiz: Certified3PlyQuiz = {
            id: 'test_midgame_3ply_14pass',
            quizType: 'CHECKER_PLAY',
            xgid,
            canonicalTurn: 'X',
            canonicalDirection: 'Case 24 ➔ Case 1',
            uiQuizLevelBadge: formatUiQuizLevelBadge(5.5),
            plyCount: 10,
            evaluatedPly: 3,
            dice: [4, 5],
            matchLength: 7,
            quizTargetER: 5.5,
            targetBracket: 'INTERMEDIAIRE',
            tierLabel: 'INTERMEDIATE',
            matchupDepthLabel: 'bgsage 3-ply vs gnubg 3-ply',
            competition: ALL_COMPETITION_FORMATS.find((f) => f.matchLength === 7 && !f.crawford && f.cubeOwner === null)!,
            isContact: true,
            archetype: 'HOLDING_GAME',
            conceptId: 'advanced_anchor',
            conceptName: 'Jeu de Retenue & Ancre Avancée',
            optimalMove: '24/20 10/5',
            instinctive0PlyMove: '24/15',
            instinctive0PlyLossEmg: 0.0285,
            is3PlyTrapVs0Ply: true,
            is1PlyTrapVs3Ply: false,
            requiredEr: 6.0,
            targetNPlus1Er: 5.5,
            whitePips: geom.whitePips,
            blackPips: geom.blackPips,
            pipCountDisplayed: pipText,
            pipCountText: pipText,
            geometry36: geom,
            gnubg3PlyVerification: {
                gnubgTopMove3Ply: '24/20 10/5',
                bgsageTopMove3Ply: '24/20 10/5',
                top1DisagreementEmg: 0.0,
                isAgreementValid: true,
            },
            coachExplanation3Ply: `En 3-ply (${pipText}), 24/20 10/5 sécurise la case 5 avec ${geom.constructiveRollsOn36}/36 lancers constructifs.`,
            socraticHint: `Observez le compte (${pipText}) et vos ${geom.constructiveRollsOn36}/36 lancers constructifs.`,
            quizChoices: ['24/20 10/5', '24/15', '24/20 6/1', '10/5 6/2'],
            legalMoves3Ply: [
                {
                    rank: 1,
                    notation: '24/20 10/5',
                    evaluatedPly: 3,
                    equity: -0.821,
                    deltaEmg: 0.0,
                    equityLoss: 0.0,
                    erPrScore: 0.0,
                    erPrTenthsDelta: -0.1,
                    isInstinctive0PlyChoice: false,
                    playerGamePlan: 'anchoring',
                    opponentGamePlan: 'priming',
                    probabilities: { win: 0.315, winGammon: 0.081, winBackgammon: 0.002, loseWin: 0.685, loseGammon: 0.22, loseBackgammon: 0.007 },
                },
                {
                    rank: 2,
                    notation: '24/15',
                    evaluatedPly: 3,
                    equity: -0.8495,
                    deltaEmg: -0.0285,
                    equityLoss: 0.0285,
                    erPrScore: 14.3,
                    erPrTenthsDelta: 0.2,
                    isInstinctive0PlyChoice: true,
                    playerGamePlan: 'anchoring',
                    opponentGamePlan: 'priming',
                    probabilities: { win: 0.306, winGammon: 0.066, winBackgammon: 0.002, loseWin: 0.694, loseGammon: 0.204, loseBackgammon: 0.006 },
                },
                {
                    rank: 3,
                    notation: '24/20 6/1',
                    evaluatedPly: 3,
                    equity: -0.95,
                    deltaEmg: -0.129,
                    equityLoss: 0.129,
                    erPrScore: 30.0,
                    erPrTenthsDelta: 0.5,
                    isInstinctive0PlyChoice: false,
                    playerGamePlan: 'anchoring',
                    opponentGamePlan: 'priming',
                    probabilities: { win: 0.295, winGammon: 0.091, winBackgammon: 0.003, loseWin: 0.705, loseGammon: 0.275, loseBackgammon: 0.012 },
                },
                {
                    rank: 4,
                    notation: '10/5 6/2',
                    evaluatedPly: 3,
                    equity: -0.99,
                    deltaEmg: -0.169,
                    equityLoss: 0.169,
                    erPrScore: 30.0,
                    erPrTenthsDelta: 0.5,
                    isInstinctive0PlyChoice: false,
                    playerGamePlan: 'anchoring',
                    opponentGamePlan: 'priming',
                    probabilities: { win: 0.253, winGammon: 0.061, winBackgammon: 0.001, loseWin: 0.747, loseGammon: 0.172, loseBackgammon: 0.009 },
                },
            ],
        };

        expect(() => validateSingleQuizStrict(validQuiz)).not.toThrow();

        // Contrôle #12 — Faux Ex-Aequo (< 0.008 EMG)
        expect(() =>
            validateSingleQuizStrict({
                ...validQuiz,
                legalMoves3Ply: [
                    validQuiz.legalMoves3Ply[0]!,
                    { ...validQuiz.legalMoves3Ply[1]!, deltaEmg: -0.005, equityLoss: 0.005 },
                    validQuiz.legalMoves3Ply[2]!,
                    validQuiz.legalMoves3Ply[3]!,
                ],
            }),
        ).toThrow(/CHECK_12_REJECTED/);

        // Contrôle #13 — Coup transposé aboutissant au même plateau final (24/15 et 24/20 20/15 sans frappe intermédiaire)
        expect(() =>
            validateSingleQuizStrict({
                ...validQuiz,
                quizChoices: ['24/20 10/5', '24/15', '24/20 20/15', '10/5 6/2'],
            }),
        ).toThrow(/CHECK_13_REJECTED/);

        // Contrôle #6 — win + loseWin !== 1.000
        expect(() =>
            validateSingleQuizStrict({
                ...validQuiz,
                legalMoves3Ply: [
                    validQuiz.legalMoves3Ply[0]!,
                    {
                        ...validQuiz.legalMoves3Ply[1]!,
                        probabilities: { ...validQuiz.legalMoves3Ply[1]!.probabilities, win: 0.629, loseWin: 0.377 },
                    },
                    validQuiz.legalMoves3Ply[2]!,
                    validQuiz.legalMoves3Ply[3]!,
                ],
            }),
        ).toThrow(/CHECK_6_REJECTED/);

        // Contrôle #9 — Rejet de "0/36 lancers constructifs"
        expect(() =>
            validateSingleQuizStrict({
                ...validQuiz,
                coachExplanation3Ply: `En 3-ply (${pipText}), 24/20 10/5 avec 0/36 lancers constructifs.`,
            }),
        ).toThrow(/CHECK_9_REJECTED/);

        // Contrôle #14 — Spoiler ER/EMG dans un bouton A/B/C/D
        expect(() =>
            validateSingleQuizStrict({
                ...validQuiz,
                quizChoices: ['24/20 10/5 (-0.000 EMG)', '24/15', '24/20 6/1', '10/5 6/2'],
            }),
        ).toThrow(/CHECK_14_REJECTED/);
    });
});
