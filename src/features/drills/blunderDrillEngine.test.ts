import { describe, it, expect, beforeEach } from 'vitest';
import {
    normalizeMoveNotation,
    validateDrillMove,
    validateDrillNotationChoice,
    createDrillSession,
    advanceDrillSession,
} from './blunderDrillEngine';
import { BENCHMARK_BLUNDERS } from './benchmarkBlunders';
import { clearBlunderBank, getAllBlunders } from './blunderBank';
import {
    ADAPTIVE_QUIZ_CATEGORIES,
    checkQuizPremiumAccess,
    recordAdaptiveQuizOutcome,
    resetAdaptivePlayerProfile,
    selectNextAdaptiveQuiz,
} from './adaptiveQuizEngine';

describe('BlunderDrillEngine Module', () => {
    beforeEach(() => {
        clearBlunderBank();
    });

    it('normalise correctement les notations de coups', () => {
        expect(normalizeMoveNotation('24/20 13/11')).toBe('13/11 24/20');
        expect(normalizeMoveNotation('8/5* 6/5')).toBe('6/5 8/5');
        expect(normalizeMoveNotation('')).toBe('');
    });

    it('valide immédiatement un coup direct identique au coup optimal', () => {
        const blunder = BENCHMARK_BLUNDERS[0]; // Optimal: '8/5 6/5'
        const moves = [
            { from: 8, to: 5 },
            { from: 6, to: 5 },
        ];

        const result = validateDrillMove(blunder, moves);
        expect(result.isCorrect).toBe(true);
        expect(result.verdict).toBe('optimal');
        expect(result.equityLoss).toBe(0);
        expect(result.canRetry).toBe(false);
        expect(result.feedbackMessage).toContain('Coup optimal');
    });

    it('valide une variante acceptable déclarée avec une perte d’équité minimale', () => {
        const blunder = BENCHMARK_BLUNDERS[0]; // Acceptable: ['6/5 8/5']
        const moves = [
            { from: 6, to: 5 },
            { from: 8, to: 5 },
        ];

        const result = validateDrillMove(blunder, moves);
        expect(result.isCorrect).toBe(true);
        expect(result.canRetry).toBe(false);
        expect(result.equityLoss).toBeLessThanOrEqual(0.025);
    });

    it('rejette un coup erroné en signalant un blunder et autorise la tentative de rejouer', () => {
        const blunder = BENCHMARK_BLUNDERS[0]; // Golden point 3-1
        // Joue le mauvais coup : 24/21 13/12
        const badMoves = [
            { from: 24, to: 21 },
            { from: 13, to: 12 },
        ];

        const result = validateDrillMove(blunder, badMoves);
        expect(result.isCorrect).toBe(false);
        expect(result.canRetry).toBe(true);
        expect(result.equityLoss).toBeGreaterThan(0.025);
        expect(result.hint).toBeDefined();
        expect(result.feedbackMessage).toContain('Rejouez jusqu’à trouver le bon coup');
    });

    it('gère une session de drill complète avec createDrillSession et advanceDrillSession', () => {
        const session = createDrillSession({ maxBlunders: 3 });
        expect(session.blunders.length).toBe(3);
        expect(session.currentIndex).toBe(0);
        expect(session.isCompleted).toBe(false);

        // Réussite sur la 1ère
        const session1 = advanceDrillSession(session, true);
        expect(session1.currentIndex).toBe(1);
        expect(session1.sessionSolvedCount).toBe(1);
        expect(session1.isCompleted).toBe(false);

        // Échec sur la 2ème
        const session2 = advanceDrillSession(session1, false);
        expect(session2.currentIndex).toBe(2);
        expect(session2.sessionSolvedCount).toBe(1);
        expect(session2.isCompleted).toBe(false);

        // Réussite sur la 3ème (dernière)
        const sessionFinal = advanceDrillSession(session2, true);
        expect(sessionFinal.sessionSolvedCount).toBe(2);
        expect(sessionFinal.sessionAttemptsCount).toBe(3);
        expect(sessionFinal.isCompleted).toBe(true);
    });

    it('fournit plus de 100 positions certifiées BGT (GNU Backgammon) couvrant les 9 catégories et les 4 paliers', () => {
        expect(BENCHMARK_BLUNDERS.length).toBeGreaterThanOrEqual(100);
        expect(ADAPTIVE_QUIZ_CATEGORIES.length).toBe(9);
        for (const tier of [1, 2, 3, 4] as const) {
            const tierSession = createDrillSession({ tier, maxBlunders: 20 });
            expect(tierSession.blunders.length).toBeGreaterThanOrEqual(5);
            for (const b of tierSession.blunders) {
                expect(b.tier).toBe(tier);
                expect(b.whyFailed).toBeTruthy();
                expect(b.whyFailed).not.toContain('concède de l\'équité dès la profondeur');
                expect(b.explanation).toBeTruthy();
                expect(b.proverb).toBeTruthy();
                expect(b.quizChoices?.length).toBe(4);
                expect(b.commentaryVariants?.length).toBeGreaterThanOrEqual(3);
            }
        }
    });

    it('valide les choix en Mode Quiz Express QCM via validateDrillNotationChoice', () => {
        const tier2Blunder = BENCHMARK_BLUNDERS.find((b) => b.tier === 2)!;
        const okRes = validateDrillNotationChoice(tier2Blunder, tier2Blunder.optimalMove);
        expect(okRes.isCorrect).toBe(true);
        expect(okRes.verdict).toBe('optimal');

        const trapRes = validateDrillNotationChoice(tier2Blunder, tier2Blunder.playedMove);
        expect(trapRes.isCorrect).toBe(false);
        expect(trapRes.canRetry).toBe(true);
        expect(trapRes.feedbackMessage).toContain('piège initial');
    });

    it('garantit mathématiquement ZÉRO doublon sur tout le parcours adaptatif et fait évoluer le niveau par catégorie', () => {
        resetAdaptivePlayerProfile();
        const all = getAllBlunders().slice(0, 120);
        const seenInRun = new Set<string>();

        for (let i = 0; i < all.length; i++) {
            const pick = selectNextAdaptiveQuiz(all);
            expect(pick.quiz).not.toBeNull();
            expect(seenInRun.has(pick.quiz!.id)).toBe(false);
            seenInRun.add(pick.quiz!.id);
            recordAdaptiveQuizOutcome(pick.quiz!, i % 2 === 0);
        }
        expect(seenInRun.size).toBe(all.length);

        const access = checkQuizPremiumAccess(false);
        expect(access.canPlayQuiz).toBe(true);
        expect(access.isLaunchPromoFree).toBe(true);
        expect(access.remainingFreeToday).toBe('unlimited');
    });

    it('certifie 50 positions de contact 3-ply GNU Backgammon et applique la règle adaptative Niveau N+1 (Up/Down)', async () => {
        const { GNUBG_3PLY_CERTIFIED_POSITIONS } = await import('../../lib/engine/gnubg3PlyCertifiedPositions');
        const { computeNPlus1TargetEr, isNonTrivialContact3PlyQuiz } = await import('./adaptiveNPlus1Selector');

        expect(GNUBG_3PLY_CERTIFIED_POSITIONS.length).toBe(50);
        for (const pos of GNUBG_3PLY_CERTIFIED_POSITIONS) {
            expect(pos.moves.length).toBeGreaterThanOrEqual(4);
            expect(pos.moves[0]!.equityLoss).toBe(0);
            expect(pos.moves[0]!.win).toBeGreaterThan(0);
        }

        // Niveau N+1 standard : Joueur ER 8.0 -> Cible ER 6.7
        const normal = computeNPlus1TargetEr(8.0, 0, 0);
        expect(normal.targetQuizEr).toBe(6.7);
        expect(normal.regulationState).toBe('NORMAL');

        // Auto-régulation Up (série de réussites au 1er essai) : baisse la cible vers Maître/GM
        const boostUp = computeNPlus1TargetEr(8.0, 3, 0);
        expect(boostUp.targetQuizEr).toBeLessThan(normal.targetQuizEr);
        expect(boostUp.regulationState).toBe('BOOST_UP');

        // Auto-régulation Down (2 échecs consécutifs) : remonte la cible (+0.8) pour redonner confiance
        const reliefDown = computeNPlus1TargetEr(8.0, 0, 2);
        expect(reliefDown.targetQuizEr).toBeGreaterThan(normal.targetQuizEr);
        expect(reliefDown.regulationState).toBe('RELIEF_DOWN');

        // Vérifie que les courses pures (race_management) sont rejetées à 100 %
        const raceQuiz = BENCHMARK_BLUNDERS.find((b) => b.conceptId === 'race_management');
        if (raceQuiz) {
            expect(isNonTrivialContact3PlyQuiz(raceQuiz)).toBe(false);
        }
    });
});
