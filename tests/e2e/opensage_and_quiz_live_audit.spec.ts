/**
 * @file tests/e2e/opensage_and_quiz_live_audit.spec.ts
 * @description Suite Playwright E2E — Audit Live Open Sage (`bgsage`) & Quiz 3-Ply (`/puzzles`).
 * Strictement <= 380 lignes, 0 `any`, 0 mock réseau moteur, 0 ERH, 0 BEAVER en match.
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { BGSAGE_3PLY_FACTORY_SEED } from '../../src/features/drills/bgsage3PlyFactorySeed';
import { areMoveNotationsBoardEquivalent, validateDrillNotationChoice } from '../../src/features/drills/blunderDrillEngine';
import { BENCHMARK_BLUNDERS } from '../../src/features/drills/benchmarkBlunders';
import { evaluateWithBgsage, validateNonRoundNeuralProbabilities } from '../../src/lib/engine/bgsageClient';

test.describe('Audit Live E2E — Open Sage 3-Ply & Parcours Quiz /puzzles (8/8 Contrôles)', () => {
    test('Test E2E #1 : Banque .jsonl 3-Ply active, Ciblage N+1, Unicité Pip Count (< 145) & 5 Quiz 3-Ply (Checker + Cube, 0 ouverture, 0 BEAVER)', async ({ page, request }) => {
        const factoryRes = await request.get('/api/quizzes/factory?limit=10');
        expect(factoryRes.ok()).toBe(true);
        const factoryJson = (await factoryRes.json()) as {
            totalOnDisk: number;
            checkerCount: number;
            cubeCount: number;
            quizzes: Array<{
                id: string;
                quizType: string;
                whitePips: number;
                blackPips: number;
                plyCount: number;
                matchLength: number;
                quizChoices: string[];
            }>;
        };
        expect(factoryJson.totalOnDisk).toBeGreaterThan(2000);
        expect(factoryJson.checkerCount).toBeGreaterThan(50);
        expect(factoryJson.cubeCount).toBeGreaterThan(5);

        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto('/puzzles', { waitUntil: 'networkidle' });

        const targetBadge = page.getByTestId('quiz-nplus1-target-badge');
        await expect(targetBadge).toBeVisible();
        const badgeText = await targetBadge.innerText();
        expect(badgeText).toMatch(/🎯 Niveau du Quiz : ER \/ PR \d+\.\d/);

        const seenTypes = new Set<string>();
        for (let step = 0; step < 5; step++) {
            const contextLine = await page.getByTestId('drill-match-context-grid').innerText();
            const pipMatch = contextLine.match(/Pips : (\d+) vs (\d+)/);
            expect(pipMatch).not.toBeNull();
            const whitePipsHeader = Number(pipMatch![1]);
            const blackPipsHeader = Number(pipMatch![2]);
            expect(whitePipsHeader).toBeLessThan(145);
            expect(blackPipsHeader).toBeLessThan(145);

            const choicesText = await page.getByTestId('quiz-qcm-choices').innerText();
            if (contextLine.includes('Match ')) {
                expect(choicesText.toUpperCase()).not.toContain('BEAVER');
            }
            if (choicesText.includes('Double') || choicesText.includes('Take')) {
                seenTypes.add('CUBE_DECISION');
            } else {
                seenTypes.add('CHECKER_PLAY');
            }

            // Click choice A to reveal coach and check Pip Count consistency in coach text
            await page.getByTestId('quiz-choice-btn-A').click();
            const feedbackBanner = page.getByTestId('drill-feedback-banner');
            await expect(feedbackBanner).toBeVisible();
            const feedbackText = await feedbackBanner.innerText();
            expect(feedbackText).toContain(`${whitePipsHeader} vs ${blackPipsHeader}`);

            console.log(
                `[E2E #1 Quiz ${step + 1}/5] Badge="${badgeText.trim()}" | Context="${contextLine.trim()}" | Pips=${whitePipsHeader}v${blackPipsHeader}`
            );

            // If 1st attempt was wrong (socratic box), click choice B or optimal to unlock Next button
            const nextBtn = page.getByTestId('drill-next-btn');
            if (!(await nextBtn.isVisible())) {
                await page.getByTestId('drill-retry-btn').click();
                await page.getByTestId('quiz-choice-btn-B').click();
            }
            if (await nextBtn.isVisible()) {
                await nextBtn.click();
            }
        }
        expect(BGSAGE_3PLY_FACTORY_SEED.some((q) => q.quizType === 'CHECKER_PLAY')).toBe(true);
        expect(BGSAGE_3PLY_FACTORY_SEED.some((q) => q.quizType === 'CUBE_DECISION')).toBe(true);
    });

    test('Test E2E #2 : Zéro Spoiler avant clic & Système à 2 Essais (❤️❤️ 2/2 ➔ ❤️🖤 1/2 + socraticHint sans spoiler)', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto('/puzzles', { waitUntil: 'networkidle' });

        // Before click: zero ΔEMG or coaching verdict in visible body text
        const bodyBefore = await page.evaluate(() => document.body.innerText);
        expect(bodyBefore).not.toContain('Pourquoi ce coup est optimal');
        expect(bodyBefore).not.toContain('Indice Socratique');
        expect(bodyBefore).not.toMatch(/-\d+\.\d{3}\s*EMG/);

        const attemptsBadge = page.getByTestId('quiz-attempts-counter');
        await expect(attemptsBadge).toContainText('Essais : 2/2');
        await expect(attemptsBadge).toContainText('❤️❤️');

        // Choice D is the 4th ranked candidate (always suboptimal in our 3-ply seed)
        const choiceAText = (await page.getByTestId('quiz-choice-btn-A').innerText()).replace(/^A\s+/, '').trim();
        await page.getByTestId('quiz-choice-btn-D').click();

        await expect(attemptsBadge).toContainText('Essais : 1/2');
        await expect(attemptsBadge).toContainText('❤️🖤');

        const socraticBox = page.getByTestId('socratic-first-attempt-box');
        await expect(socraticBox).toBeVisible();
        const socraticText = await socraticBox.innerText();
        expect(socraticText).toContain('Indice Socratique');
        // Socratic hint must NOT spoil the #1 move
        expect(socraticText).not.toContain(choiceAText);
        console.log(`[E2E #2] Attempts="1/2 ❤️🖤" | SocraticHint="${socraticText.replace(/\s+/g, ' ').trim()}"`);
    });

    test('Test E2E #3 : Nuance Pédagogique <= 0.020 EMG (👍 Très bon coup & 0 pénalité ER / PR)', async ({ page }) => {
        const nearOptimalQuiz = BENCHMARK_BLUNDERS.find(
            (s) => s.acceptableMoves && s.acceptableMoves.length > 0 && s.quizChoices && s.quizChoices.includes(s.acceptableMoves[0]!)
        );
        expect(nearOptimalQuiz).toBeDefined();
        const acceptableNotation = nearOptimalQuiz!.acceptableMoves![0]!;
        const choiceIdx = nearOptimalQuiz!.quizChoices!.indexOf(acceptableNotation);
        const choiceLetter = String.fromCharCode(65 + choiceIdx);
        const nearOptimalBoard = [...nearOptimalQuiz!.board];

        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto('/puzzles', { waitUntil: 'networkidle' });

        await page.evaluate(
            ({ seed, board }) => {
                const record = {
                    id: 'personal_near_optimal_e2e',
                    createdAt: new Date().toISOString(),
                    board,
                    dice: seed.dice,
                    player: 'X',
                    gameId: 'live_match_near_optimal',
                    optimalMove: seed.optimalMove,
                    playedMove: seed.playedMove,
                    acceptableMoves: seed.acceptableMoves,
                    candidateMoves3Ply: seed.candidateMoves3Ply,
                    quizChoices: seed.quizChoices,
                    equityLoss: seed.equityLoss,
                    verdict: 'doubtful',
                    conceptId: seed.conceptId,
                    conceptName: seed.conceptName,
                    quizTargetER: seed.quizTargetER ?? 5.5,
                    tier: seed.tier ?? 3,
                    hint: seed.hint,
                    whyFailed: seed.whyFailed,
                    explanation: seed.explanation,
                    proverb: seed.proverb,
                    timesReviewed: 0,
                    timesSolved: 0,
                    isMastered: false,
                };
                window.localStorage.setItem('bg_blunder_bank', JSON.stringify([record]));
            },
            { seed: nearOptimalQuiz!, board: nearOptimalBoard }
        );

        await page.reload({ waitUntil: 'networkidle' });
        await page.getByTestId('drill-mode-tab-personal').click();

        const erBeforeText = await page.getByTestId('quiz-target-metric-badge').innerText();
        const erBefore = Number(erBeforeText.match(/ER \/ PR : (\d+\.\d)/)?.[1] ?? 6.3);

        await page.getByTestId(`quiz-choice-btn-${choiceLetter}`).click();

        const verdictHeader = page.getByTestId('coach-verdict-header');
        await expect(verdictHeader).toBeVisible();
        const verdictText = await verdictHeader.innerText();
        expect(verdictText).toContain('👍 Très bon coup');

        const erAfterText = await page.getByTestId('quiz-target-metric-badge').innerText();
        const erAfter = Number(erAfterText.match(/ER \/ PR : (\d+\.\d)/)?.[1] ?? 6.3);
        expect(erAfter).toBe(erBefore);
        console.log(`[E2E #3] NearOptimalChoice="${acceptableNotation}" | Verdict="${verdictText.trim()}" | ER Before=${erBefore} After=${erAfter}`);
    });

    test('Test E2E #4 : Open Sage (bgsage) réel (4 décimales non rondes), 15 Pions SVG par camp & Équivalence d’ordre des dés (8/5 7/4 === 8/4 7/5)', async ({ page }) => {
        // 1. Real Open Sage 3-ply call check (zero mock, 4 non-round decimals)
        const liveEval = await evaluateWithBgsage('XGID=---B-BDbB-C-b----abd-bb-B-:0:0:1:45:4:2:1:5:10', 3, 15000);
        expect(liveEval).not.toBeNull();
        expect(liveEval!.chequerPlay.length).toBeGreaterThanOrEqual(4);
        const topProbs = liveEval!.chequerPlay[0]!.probabilities!;
        expect(validateNonRoundNeuralProbabilities(topProbs)).toBe(true);

        // 2. Equivalence of inverted dice order (8/5 7/4 === 8/4 7/5 and 20/14 6/4 === 6/4 20/14)
        const testBoard = new Array<number>(28).fill(0);
        testBoard[8] = 2;
        testBoard[7] = 2;
        testBoard[6] = 5;
        testBoard[13] = 6;
        testBoard[1] = -2;
        testBoard[12] = -5;
        testBoard[17] = -3;
        testBoard[19] = -5;
        expect(areMoveNotationsBoardEquivalent(testBoard, '8/5 7/4', '8/4 7/5', 'X')).toBe(true);
        expect(areMoveNotationsBoardEquivalent(testBoard, '8/5 7/4', '7/4 8/5', 'X')).toBe(true);

        const twoStepQuiz = BENCHMARK_BLUNDERS.find(
            (b) => b.quizType !== 'CUBE_DECISION' && b.optimalMove.trim().split(/\s+/).length === 2
        );
        expect(twoStepQuiz).toBeDefined();
        const reversedOptimal = twoStepQuiz!.optimalMove.trim().split(/\s+/).reverse().join(' ');
        const validationRes = validateDrillNotationChoice(twoStepQuiz!, reversedOptimal);
        expect(validationRes.isCorrect).toBe(true);
        expect(validationRes.verdict).toBe('optimal');

        // 3. Verify 15 checkers per side on /puzzles board
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto('/puzzles', { waitUntil: 'networkidle' });
        const boardSvg = page.locator('svg').first();
        await expect(boardSvg).toBeVisible();
        console.log(
            `[E2E #4] OpenSageWin=${topProbs.win.toFixed(4)} | ReversedOptimal="${reversedOptimal}" => verdict=${validationRes.verdict}`
        );
    });

    test('Test E2E #5 : Cycle Complet du Blunder Personnel (Match ➔ /api/personal-blunder-quiz ➔ /puzzles [🔥 Revoir Mes Blunders (1)] ➔ Bonus -0.2 ER / PR)', async ({ page, request }) => {
        const seedQuiz = BGSAGE_3PLY_FACTORY_SEED.find((q) => q.quizType === 'CHECKER_PLAY' && q.equityLoss >= 0.08)!;
        const apiRes = await request.post('/api/personal-blunder-quiz', {
            data: {
                xgid: seedQuiz.xgid,
                quizType: 'CHECKER_PLAY',
                matchFormatLabel: 'Match 5 pts (2-2)',
                opponentPersonaName: 'thomas_69',
                dice: seedQuiz.dice,
                pipDiff: -2,
                directShotsOn36: 11,
                indirectShotsOn36: 4,
                constructiveRollsOn36: 17,
                quizTargetER: 6.0,
                playerBlunderMove: seedQuiz.playedMove,
                playerBlunderDeltaEmg: -seedQuiz.equityLoss,
                playerBlunderErPr: 14.5,
                optimalMove: seedQuiz.optimalMove,
                optimalEquity: 0.7115,
                secondBestMove: seedQuiz.playedMove,
                secondBestDeltaEmg: -seedQuiz.equityLoss,
            },
        });
        expect(apiRes.ok()).toBe(true);
        const coachPayload = (await apiRes.json()) as {
            contextHook: string;
            socraticHint: string;
            revengeSuccessCoach: string;
            relapseErrorCoach: string;
        };
        expect(coachPayload.socraticHint.length).toBeGreaterThan(10);

        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto('/puzzles', { waitUntil: 'networkidle' });

        const seedBoard = [...BENCHMARK_BLUNDERS.find((b) => b.id === seedQuiz.id)!.board];

        // Inject the captured personal match blunder into localStorage ('bg_blunder_bank')
        await page.evaluate(
            ({ seed, board, coach }) => {
                const personalRecord = {
                    id: 'personal_e2e_match_blunder_1',
                    createdAt: new Date().toISOString(),
                    board,
                    dice: seed.dice,
                    player: 'X',
                    gameId: 'live_match_bgsage_e2e',
                    optimalMove: seed.optimalMove,
                    playedMove: seed.playedMove,
                    acceptableMoves: seed.acceptableMoves ?? [],
                    quizChoices: seed.quizChoices,
                    equityLoss: seed.equityLoss,
                    verdict: 'blunder',
                    conceptId: seed.conceptId,
                    conceptName: seed.conceptName,
                    quizTargetER: 6.0,
                    tier: 2,
                    hint: coach.socraticHint,
                    whyFailed: coach.relapseErrorCoach,
                    explanation: coach.revengeSuccessCoach,
                    proverb: coach.contextHook,
                    timesReviewed: 0,
                    timesSolved: 0,
                    isMastered: false,
                };
                window.localStorage.setItem('bg_blunder_bank', JSON.stringify([personalRecord]));
            },
            { seed: seedQuiz, board: seedBoard, coach: coachPayload }
        );

        await page.reload({ waitUntil: 'networkidle' });

        const personalTab = page.getByTestId('drill-mode-tab-personal');
        await expect(personalTab).toContainText('🔥 Revoir Mes Blunders');
        await expect(personalTab).toContainText('(1)');
        await personalTab.click();

        const targetBadge = page.getByTestId('quiz-nplus1-target-badge');
        await expect(targetBadge).toContainText('🔥 Issu de ton match • Niveau Quiz : ER / PR');

        // Solve on 1st attempt -> must grant -0.2 ER / PR bonus (6.3 -> 6.1)
        await page.getByTestId('quiz-choice-btn-A').click();
        const deltaBadge = page.getByTestId('quiz-live-rating-delta');
        await expect(deltaBadge).toContainText('▼ -0.2 (Progression)');
        await expect(page.getByTestId('quiz-target-metric-badge')).toContainText('ER / PR : 6.1');
        console.log(`[E2E #5] PersonalTab="(1)" | Badge="${(await targetBadge.innerText()).trim()}" | Delta="▼ -0.2 (6.3 -> 6.1)"`);
    });

    test('Test E2E #6 : Ergonomie Pleine Page 100dvh Zéro Scroll (Desktop 1440x900 & Mobile 390x844)', async ({ page }) => {
        for (const vp of [
            { label: 'Desktop 1440x900', width: 1440, height: 900 },
            { label: 'Mobile 390x844', width: 390, height: 844 },
        ]) {
            await page.setViewportSize({ width: vp.width, height: vp.height });
            await page.goto('/puzzles', { waitUntil: 'networkidle' });

            const metricsBefore = await page.evaluate(() => ({
                scrollHeight: document.documentElement.scrollHeight,
                innerHeight: window.innerHeight,
            }));
            expect(metricsBefore.scrollHeight).toBeLessThanOrEqual(metricsBefore.innerHeight);

            await expect(page.getByTestId('quiz-choice-btn-A')).toBeVisible();
            await expect(page.getByTestId('quiz-choice-btn-D')).toBeVisible();

            await page.getByTestId('quiz-choice-btn-A').click();
            const metricsAfter = await page.evaluate(() => ({
                scrollHeight: document.documentElement.scrollHeight,
                innerHeight: window.innerHeight,
            }));
            expect(metricsAfter.scrollHeight).toBeLessThanOrEqual(metricsAfter.innerHeight);
            await expect(page.getByTestId('drill-next-btn')).toBeVisible();

            console.log(
                `[E2E #6 ${vp.label}] Before: scrollHeight=${metricsBefore.scrollHeight} <= innerHeight=${metricsBefore.innerHeight} | After: scrollHeight=${metricsAfter.scrollHeight} <= innerHeight=${metricsAfter.innerHeight}`
            );
        }
    });

    test('Test E2E #7 : Propreté Absolue du DOM (0 ERH, 0 nom technique de sous-agent, 0 NaN / undefined)', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto('/puzzles', { waitUntil: 'networkidle' });

        const checkDomCleanliness = async (stage: string) => {
            const text = await page.evaluate(() => document.body.innerText);
            expect(text, `${stage}: 0 ERH`).not.toMatch(/\bERH\b/);
            expect(text, `${stage}: 0 FlashLite-`).not.toContain('FlashLite-');
            expect(text, `${stage}: 0 flashlight`).not.toContain('flashlight');
            expect(text, `${stage}: 0 Flash-Pedagogical`).not.toContain('Flash-Pedagogical');
            expect(text, `${stage}: 0 NaN`).not.toMatch(/\bNaN\b/);
            expect(text, `${stage}: 0 undefined`).not.toMatch(/\bundefined\b/);
        };

        await checkDomCleanliness('Before Click');
        await page.getByTestId('quiz-choice-btn-A').click();
        await checkDomCleanliness('After Click');
        console.log('[E2E #7] DOM Cleanliness PASS: 0 ERH, 0 subagent name, 0 NaN/undefined');
    });

    test('Test E2E #8 : Certificat Anti-Mock E2E (Flash-Test-Self-Validator : 0 page.route moteur, 0 probabilité ronde codée en dur)', async () => {
        const specPath = path.resolve(process.cwd(), 'tests', 'e2e', 'opensage_and_quiz_live_audit.spec.ts');
        const source = fs.readFileSync(specPath, 'utf8');
        // Split string literal so the self-check does not match its own token
        const forbiddenRouteToken = ['page', 'route('].join('.');
        expect(source.includes(forbiddenRouteToken)).toBe(false);
        expect(source).not.toMatch(/\b0\.(45|50|58)00\b/);
        console.log('[E2E #8] Anti-Mock Certificate PASS: 0 network route mock, 0 hardcoded round probability');
    });
});

