// @vitest-environment jsdom
/**
 * Tests du module gameReviewPrompts (cours de fin de partie).
 */

import { describe, it, expect } from 'vitest';
import {
    buildGameReviewUserPrompt,
    generateRuleBasedGameReview,
    getGameReviewSystemPrompt,
} from './gameReviewPrompts';
import type { CompleteGameAnalysis } from '../rating/types';

function makeAnalysis(overrides: Partial<CompleteGameAnalysis> = {}): CompleteGameAnalysis {
    return {
        id: 'analysis-1',
        gameId: 'game-1',
        date: '2026-10-20T00:00:00.000Z',
        player: 'X',
        opponentType: 'ai',
        opponentDifficulty: 'expert',
        winner: 'X',
        winType: 'single',
        pointsWon: 1,
        scoreX: 7,
        scoreO: 3,
        matchLength: 7,
        totalMovesCount: 40,
        decisionsCount: 20,
        unforcedDecisionsCount: 18,
        totalEquityLoss: 0.45,
        errorRate: 0.025,
        performanceRating: 12.5,
        estimatedRating: 1500,
        prCategory: 'Intermédiaire',
        breakdown: {
            optimal: 10,
            acceptable: 4,
            doubtful: 3,
            blunder: 2,
            howler: 1,
        },
        evaluatedMoves: [
            {
                moveNumber: 1,
                player: 'X',
                dice: [4, 2],
                boardBefore: [],
                boardAfter: [],
                playedNotation: '24/20 13/11',
                optimalNotation: '24/18',
                equityLoss: -0.045,
                verdict: 'doubtful',
                isUnforced: true,
                candidateCount: 5,
                conceptId: 'golden-point',
            },
            {
                moveNumber: 2,
                player: 'X',
                dice: [6, 1],
                boardBefore: [],
                boardAfter: [],
                playedNotation: '13/7 8/7',
                optimalNotation: '13/7 8/7',
                equityLoss: 0,
                verdict: 'optimal',
                isUnforced: false,
                candidateCount: 1,
            },
        ],
        ...overrides,
    };
}

describe('generateRuleBasedGameReview — repli local déterministe', () => {
    it('génère un cours structuré avec titre, résumé et leçons', () => {
        const course = generateRuleBasedGameReview({ analysis: makeAnalysis() });

        expect(course.title).toBeTruthy();
        expect(course.summary).toBeTruthy();
        expect(Array.isArray(course.strengths)).toBe(true);
        expect(Array.isArray(course.weaknesses)).toBe(true);
        expect(Array.isArray(course.lessons)).toBe(true);
        expect(Array.isArray(course.nextSteps)).toBe(true);
        expect(course.lessons.length).toBeGreaterThan(0);
        expect(course.nextSteps.length).toBeGreaterThan(0);
    });

    it('signale les blunders comme axe de progression', () => {
        const course = generateRuleBasedGameReview({ analysis: makeAnalysis() });
        const hasBlunderWeakness = course.weaknesses.some((w) => w.includes('blunder') || w.includes('Blunder'));
        expect(hasBlunderWeakness).toBe(true);
    });

    it('célèbre un excellent PR', () => {
        const course = generateRuleBasedGameReview({
            analysis: makeAnalysis({ performanceRating: 2.1, prCategory: 'Grand-Maître' }),
        });
        const hasPrStrength = course.strengths.some((s) => s.includes('2.10') || s.includes('Excellent'));
        expect(hasPrStrength).toBe(true);
    });

    it('génère un cours en anglais', () => {
        const course = generateRuleBasedGameReview({ analysis: makeAnalysis(), language: 'en' });
        expect(course.title).toBeTruthy();
        expect(course.summary).toContain('PR');
    });
});

describe('buildGameReviewUserPrompt', () => {
    it('inclut le PR et la ventilation des coups', () => {
        const prompt = buildGameReviewUserPrompt({ analysis: makeAnalysis() });
        expect(prompt).toContain('12.50');
        expect(prompt).toContain('Optimal');
        expect(prompt).toContain('Blunder');
    });

    it('inclut les concepts dominants', () => {
        const prompt = buildGameReviewUserPrompt({ analysis: makeAnalysis() });
        expect(prompt).toContain('golden-point');
    });
});

describe('getGameReviewSystemPrompt', () => {
    it('retourne le prompt français par défaut', () => {
        expect(getGameReviewSystemPrompt()).toContain('Grand-Maître');
    });

    it('retourne le prompt anglais', () => {
        expect(getGameReviewSystemPrompt('en')).toContain('Grandmaster');
    });
});
