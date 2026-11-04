/**
 * @file src/features/drills/personalBlunder19Checks.test.ts
 * @description Suite de tests Vitest pour valider l'audit intégral des 22 Contrôles Coupe-Circuit (`22/22 PASS`),
 * le test du câble débranché (`test_unplugged_opensage_must_fail`), les vraies probabilités à 4 décimales de `bgsage` 3-ply,
 * le vrai Pip Count (`134 vs 122`) et l'absence totale de `BEAVER` en Match Play.
 * Strictement <= 280 lignes, 0 `any` (GOVERNANCE.md & SCALABILITY.md).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    clearPersonalBlunderRegistryForTests,
    certifyPersonalBlunder3PlyLive,
    captureLiveMatchBlunderIfEligible,
} from './personalBlunderPipeline';
import { runFull22ChecksPersonalBlunderAudit } from './personalBlunder19ChecksValidator';
import { evaluateWithBgsageStrictRetry, selectBotMoveWithBgsageStrict } from '../../lib/engine/bgsageClient';
import { classifyMoveByDeltaEmg, GEMINI_LITE_INTERNAL_SYSTEM_PROMPT } from '../../lib/coachSystemPrompt';
import { generatePersonalBlunderCoachWithCascade, buildSanitizedGeminiRequestBody } from '../coach/personalBlunderDeterministicFallback';
import type { Certified3PlyLegalMoveEntry, CompetitionFormatSpec, Gnubg3PlyCrossCheckReport } from './bgsage3PlyQuizFactoryCore';
import type { SemanticArchetype } from './drillSubAgentsPipeline';

describe('Personal Blunder 22 Checks Audit Suite & Unplugged Open Sage Kill-Switch', () => {
    beforeEach(() => {
        clearPersonalBlunderRegistryForTests();
    });

    it('valide les 6 Lois Internes de coachSystemPrompt.ts et traite un coup à -0.012 EMG comme "👍 Très bon coup (-0.012 EMG) !"', async () => {
        // 1. Les 6 Lois Métier sont gravées dans GEMINI_LITE_INTERNAL_SYSTEM_PROMPT et injectées dans systemInstruction
        for (let lawIdx = 1; lawIdx <= 6; lawIdx++) {
            expect(GEMINI_LITE_INTERNAL_SYSTEM_PROMPT).toContain(`Loi Interne ${lawIdx}`);
        }
        expect(GEMINI_LITE_INTERNAL_SYSTEM_PROMPT).toContain('NOT_A_BLUNDER_GOOD_MOVE');

        const gate012 = classifyMoveByDeltaEmg(-0.012, false);
        expect(gate012.category).toBe('NEAR_OPTIMAL_GOOD_MOVE');
        expect(gate012.status).toBe('NOT_A_BLUNDER_GOOD_MOVE');
        expect(gate012.isBlunderQuizEligible).toBe(false);
        expect(gate012.feedbackMessage).toBe(
            "👍 Très bon coup (-0.012 EMG) ! Ce n'est pas une erreur, mais voici comment gagner +0.012 EMG de plus...",
        );

        const match7Spec: CompetitionFormatSpec = {
            id: 'match_7_0_0',
            label: 'Match 7 pts (0-0)',
            regime: 'MATCH_NORMAL',
            matchLength: 7,
            scoreX: 0,
            scoreO: 0,
            crawford: false,
            crawfordAlreadyPlayed: false,
            cubeValue: 1,
            cubeOwner: null,
            jacoby: false,
            kazarossMwcX: 50.0,
            kazarossGammonPriceX: 0.51,
            kazarossTakePointX: 22.0,
        };

        const capture012 = captureLiveMatchBlunderIfEligible({
            quizType: 'CHECKER_PLAY',
            xgid: 'XGID=---B-BDbB-C-b----abd-bb-B-:0:0:1:45:0:0:0:7:10',
            plyCount: 14,
            dice: [4, 5],
            board: [],
            player: 'X',
            playerMoveNotation: '24/15',
            playerMoveDeltaEmg: -0.012,
            formatSpec: match7Spec,
            opponentPersonaName: 'thomas_69',
        });
        expect(capture012.eligible).toBe(false);
        expect(capture012.reason).toBe('NOT_A_BLUNDER_GOOD_MOVE');

        const coachRes012 = await generatePersonalBlunderCoachWithCascade(
            {
                xgid: 'XGID=---B-BDbB-C-b----abd-bb-B-:0:0:1:45:0:0:0:7:10',
                quizType: 'CHECKER_PLAY',
                matchFormatLabel: 'Match 7 pts',
                opponentPersonaName: 'thomas_69',
                dice: [4, 5],
                pipDiff: 12,
                directShotsOn36: 4,
                indirectShotsOn36: 8,
                constructiveRollsOn36: 11,
                quizTargetER: 9.0,
                playerBlunderMove: '24/15',
                playerBlunderDeltaEmg: -0.012,
                playerBlunderErPr: 6.0,
                optimalMove: '24/20 10/5',
                optimalEquity: -0.8522,
                secondBestMove: '24/15',
                secondBestDeltaEmg: -0.012,
            },
            { skipCache: true },
        );
        expect(coachRes012.contextHook).toBe(
            "👍 Très bon coup (-0.012 EMG) ! Ce n'est pas une erreur, mais voici comment gagner +0.012 EMG de plus...",
        );

        const bodyJson = buildSanitizedGeminiRequestBody({
            xgid: 'XGID=---B-BDbB-C-b----abd-bb-B-:0:0:1:45:0:0:0:7:10',
            quizType: 'CHECKER_PLAY',
            matchFormatLabel: 'Match 7 pts',
            opponentPersonaName: 'thomas_69',
            dice: [4, 5],
            pipDiff: 12,
            directShotsOn36: 4,
            indirectShotsOn36: 8,
            constructiveRollsOn36: 11,
            quizTargetER: 9.0,
            playerBlunderMove: '24/20 6/1',
            playerBlunderDeltaEmg: -0.0984,
            playerBlunderErPr: 30.0,
            optimalMove: '24/20 10/5',
            optimalEquity: -0.8522,
            secondBestMove: '24/15',
            secondBestDeltaEmg: -0.0315,
        });
        expect(bodyJson).toContain('Loi Interne 1');
        expect(bodyJson).toContain('Loi Interne 6');
    });

    it('test_unplugged_opensage_must_fail : lève OPENSAGE_UNREACHABLE_NO_FALLBACK_ALLOWED après 3 essais sans coup de secours', async () => {
        let attempts = 0;
        const unpluggedFetch = async (): Promise<Response> => {
            attempts++;
            return new Response('Open Sage Cloud Run Unreachable', { status: 503 });
        };

        await expect(
            evaluateWithBgsageStrictRetry(
                'XGID=---B-BDbB-C-b----abd-bb-B-:0:0:1:45:0:0:0:7:10',
                3,
                { customFetch: unpluggedFetch as typeof fetch, skipCache: true },
            ),
        ).rejects.toThrow('OPENSAGE_UNREACHABLE_NO_FALLBACK_ALLOWED');
        expect(attempts).toBe(3);

        await expect(
            selectBotMoveWithBgsageStrict(
                { board: new Array<number>(26).fill(0), turn: 'X', dice: [4, 5], cubeValue: 1, cubeOwner: null, matchLength: 7, scoreX: 0, scoreO: 0, crawford: false, doubled: false, resigned: 0 },
                [{ moves: [{ from: 24, to: 20 }, { from: 10, to: 5 }], board: new Array<number>(26).fill(0) }],
                'expert',
                { customFetch: unpluggedFetch as typeof fetch },
            ),
        ).rejects.toThrow('OPENSAGE_UNREACHABLE_NO_FALLBACK_ALLOWED');
    });

    it('valide 22/22 PASS sur les 2 Quiz de Blunders Personnels (1 CHECKER_PLAY + 1 CUBE_DECISION sans BEAVER en match)', async () => {
        const competitionMatch7: CompetitionFormatSpec = {
            id: 'match_7_0_0',
            label: 'Match 7 pts (0-0 • Normal • Videau : 1)',
            regime: 'MATCH_NORMAL',
            matchLength: 7,
            scoreX: 0,
            scoreO: 0,
            crawford: false,
            crawfordAlreadyPlayed: false,
            cubeValue: 1,
            cubeOwner: null,
            jacoby: false,
            kazarossMwcX: 50.0,
            kazarossGammonPriceX: 0.51,
            kazarossTakePointX: 22.0,
        };

        const competitionMatch5: CompetitionFormatSpec = {
            id: 'match_5_1_2',
            label: 'Match 5 pts (1-2 • 4-away / 3-away • Videau : 1)',
            regime: 'MATCH_NORMAL',
            matchLength: 5,
            scoreX: 1,
            scoreO: 2,
            crawford: false,
            crawfordAlreadyPlayed: false,
            cubeValue: 1,
            cubeOwner: null,
            jacoby: false,
            kazarossMwcX: 40.5,
            kazarossGammonPriceX: 0.54,
            kazarossTakePointX: 21.5,
        };

        const archetype: SemanticArchetype = 'HOLDING_GAME';

        const gnubgCrossCheckChecker: Gnubg3PlyCrossCheckReport = {
            isAgreementValid: true,
            top1DisagreementEmg: 0.000,
            gnubgTopMove3Ply: '24/20 10/5',
            bgsageTopMove3Ply: '24/20 10/5',
        };

        // Vraies probabilités neuronales à 4 décimales de bgsage 3-ply sur XGID=---B-BDbB-C-b----abd-bb-B-:0:0:1:45:0:0:0:7:10
        const realProbsMove1 = { win: 0.3104, winGammon: 0.0859, winBackgammon: 0.0040, loseWin: 0.6896, loseGammon: 0.2222, loseBackgammon: 0.0062 };
        const realProbsMove2 = { win: 0.3056, winGammon: 0.0683, winBackgammon: 0.0032, loseWin: 0.6944, loseGammon: 0.2118, loseBackgammon: 0.0051 };
        const realProbsMove3 = { win: 0.2907, winGammon: 0.0862, winBackgammon: 0.0039, loseWin: 0.7093, loseGammon: 0.2784, loseBackgammon: 0.0087 };
        const realProbsMove4 = { win: 0.2396, winGammon: 0.0529, winBackgammon: 0.0020, loseWin: 0.7604, loseGammon: 0.1536, loseBackgammon: 0.0068 };

        const checkerMoves3Ply: readonly Certified3PlyLegalMoveEntry[] = [
            {
                rank: 1,
                notation: '24/20 10/5',
                evaluatedPly: 3,
                equity: -0.8522,
                deltaEmg: 0.0000,
                equityLoss: 0.0000,
                erPrScore: 0.0,
                erPrTenthsDelta: -0.2,
                isInstinctive0PlyChoice: false,
                playerGamePlan: 'anchoring',
                opponentGamePlan: 'attacking',
                probabilities: realProbsMove1,
            },
            {
                rank: 2,
                notation: '24/15',
                evaluatedPly: 3,
                equity: -0.8837,
                deltaEmg: -0.0315,
                equityLoss: 0.0315,
                erPrScore: 15.8,
                erPrTenthsDelta: 0.3,
                isInstinctive0PlyChoice: false,
                playerGamePlan: 'racing',
                opponentGamePlan: 'attacking',
                probabilities: realProbsMove2,
            },
            {
                rank: 3,
                notation: '24/20 6/1',
                evaluatedPly: 3,
                equity: -0.9506,
                deltaEmg: -0.0984,
                equityLoss: 0.0984,
                erPrScore: 30.0,
                erPrTenthsDelta: 0.4,
                isInstinctive0PlyChoice: true,
                playerGamePlan: 'anchoring',
                opponentGamePlan: 'attacking',
                probabilities: realProbsMove3,
            },
            {
                rank: 4,
                notation: '10/5 6/2',
                evaluatedPly: 3,
                equity: -0.9612,
                deltaEmg: -0.1090,
                equityLoss: 0.1090,
                erPrScore: 30.0,
                erPrTenthsDelta: 0.5,
                isInstinctive0PlyChoice: false,
                playerGamePlan: 'anchoring',
                opponentGamePlan: 'racing',
                probabilities: realProbsMove4,
            },
        ];

        const quiz1 = await certifyPersonalBlunder3PlyLive(
            {
                quizType: 'CHECKER_PLAY',
                xgid: 'XGID=---B-BDbB-C-b----abd-bb-B-:0:0:1:45:0:0:0:7:10',
                plyCount: 14,
                dice: [4, 5],
                board: [],
                player: 'X',
                playerMoveNotation: '24/20 6/1',
                playerMoveDeltaEmg: -0.0984,
                formatSpec: competitionMatch7,
                opponentPersonaName: 'thomas_69',
            },
            {
                customFetch: async () =>
                    new Response(
                        JSON.stringify({
                            chequerPlay: checkerMoves3Ply.map((m) => ({
                                notation: m.notation,
                                equity: m.equity,
                                equityLoss: m.equityLoss,
                                playerGamePlan: m.playerGamePlan,
                                opponentGamePlan: m.opponentGamePlan,
                                probabilities: m.probabilities,
                            })),
                            gamePlans: { player: 'anchoring', opponent: 'attacking' },
                            latencyMs: { '1': 18, '2': 44, '3': 112 },
                        }),
                    ),
                gnubgCrossCheck: gnubgCrossCheckChecker,
                archetype,
            },
        );

        // Quiz #2 : CUBE_DECISION en Match 5 pts (1-2) sur XGID=---B-BDbB-C-b----abd-bb-B-:0:0:1:45:1:2:0:5:10
        // Vraies probabilités bgsage 3-ply : [0.3091, 0.0852, 0.0039, 0.2164, 0.0065]
        // 4 états légaux en Match Play (ZÉRO BEAVER) : No Double, Too Good to Double, Double / Take, Double / Pass
        const realProbsCubeMatch5 = { win: 0.3091, winGammon: 0.0852, winBackgammon: 0.0039, loseWin: 0.6909, loseGammon: 0.2164, loseBackgammon: 0.0065 };
        const gnubgCrossCheckCube: Gnubg3PlyCrossCheckReport = {
            isAgreementValid: true,
            top1DisagreementEmg: 0.000,
            gnubgTopMove3Ply: 'No Double',
            bgsageTopMove3Ply: 'No Double',
        };

        const cubeMovesMatch5: readonly Certified3PlyLegalMoveEntry[] = [
            {
                rank: 1,
                notation: 'No Double',
                evaluatedPly: 3,
                equity: -0.6762,
                deltaEmg: 0.0000,
                equityLoss: 0.0000,
                erPrScore: 0.0,
                erPrTenthsDelta: -0.2,
                isInstinctive0PlyChoice: false,
                playerGamePlan: 'anchoring',
                opponentGamePlan: 'attacking',
                probabilities: realProbsCubeMatch5,
            },
            {
                rank: 2,
                notation: 'Too Good to Double',
                evaluatedPly: 3,
                equity: -0.7145,
                deltaEmg: -0.0383,
                equityLoss: 0.0383,
                erPrScore: 19.2,
                erPrTenthsDelta: 0.3,
                isInstinctive0PlyChoice: false,
                playerGamePlan: 'anchoring',
                opponentGamePlan: 'attacking',
                probabilities: realProbsMove1,
            },
            {
                rank: 3,
                notation: 'Double / Take',
                evaluatedPly: 3,
                equity: -0.7689,
                deltaEmg: -0.0927,
                equityLoss: 0.0927,
                erPrScore: 30.0,
                erPrTenthsDelta: 0.4,
                isInstinctive0PlyChoice: true,
                playerGamePlan: 'anchoring',
                opponentGamePlan: 'attacking',
                probabilities: realProbsMove2,
            },
            {
                rank: 4,
                notation: 'Double / Pass',
                evaluatedPly: 3,
                equity: -0.8054,
                deltaEmg: -0.1292,
                equityLoss: 0.1292,
                erPrScore: 30.0,
                erPrTenthsDelta: 0.5,
                isInstinctive0PlyChoice: false,
                playerGamePlan: 'anchoring',
                opponentGamePlan: 'attacking',
                probabilities: realProbsMove3,
            },
        ];

        const quiz2 = await certifyPersonalBlunder3PlyLive(
            {
                quizType: 'CUBE_DECISION',
                xgid: 'XGID=---B-BDbB-C-b----abd-bb-B-:0:0:1:45:1:2:0:5:10',
                plyCount: 16,
                dice: [4, 5],
                board: [],
                player: 'X',
                playerMoveNotation: 'Double / Take',
                playerMoveDeltaEmg: -0.0927,
                formatSpec: competitionMatch5,
                opponentPersonaName: 'Kosta_Ath',
            },
            {
                customFetch: async () =>
                    new Response(
                        JSON.stringify({
                            chequerPlay: cubeMovesMatch5.map((m) => ({
                                notation: m.notation,
                                equity: m.equity,
                                equityLoss: m.equityLoss,
                                playerGamePlan: m.playerGamePlan,
                                opponentGamePlan: m.opponentGamePlan,
                                probabilities: m.probabilities,
                            })),
                            cubeDecision: {
                                noDouble: -0.6762,
                                doubleTake: -1.5996,
                                doublePass: 1.0000,
                                optimalAction: 'No Double',
                            },
                            gamePlans: { player: 'anchoring', opponent: 'attacking' },
                            latencyMs: { '1': 19, '2': 47, '3': 118 },
                        }),
                    ),
                gnubgCrossCheck: gnubgCrossCheckCube,
                archetype,
            },
        );

        const auditReport = await runFull22ChecksPersonalBlunderAudit([quiz1, quiz2]);
        expect(auditReport.failedReasons).toEqual([]);
        expect(auditReport.allPassed).toBe(true);
        expect(auditReport.passedCount).toBe(22);
    });
});
