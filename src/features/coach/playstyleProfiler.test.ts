import { describe, it, expect } from 'vitest';
import { analyzePlaystyle, type PlaystyleLocale } from './playstyleProfiler';
import {
    getInternationalTerm,
    SUPPORTED_INTERNATIONAL_LOCALES,
    BACKGAMMON_TERMINOLOGY_MATRIX,
} from '../../lib/i18n/terminologyMatrix';
import type { CompleteGameAnalysis } from '../rating/types';

function makeSampleAnalysis(overrides: Partial<CompleteGameAnalysis> = {}): CompleteGameAnalysis {
    return {
        id: 'analysis_1',
        gameId: 'game_1',
        date: '2026-10-22T12:00:00Z',
        player: 'X',
        opponentType: 'ai',
        scoreX: 3,
        scoreO: 2,
        matchLength: 7,
        totalMovesCount: 6,
        decisionsCount: 6,
        unforcedDecisionsCount: 6,
        totalEquityLoss: 0.28,
        errorRate: 0.046,
        performanceRating: 23.3,
        estimatedRating: 1450,
        prCategory: 'Intermédiaire',
        breakdown: {
            optimal: 3,
            acceptable: 0,
            doubtful: 1,
            blunder: 2,
            howler: 0,
        },
        evaluatedMoves: [
            {
                moveNumber: 1,
                player: 'X',
                dice: [3, 1],
                boardBefore: [],
                boardAfter: [],
                playedNotation: '13/10* 6/5*',
                optimalNotation: '8/5 6/5',
                equityLoss: -0.12,
                verdict: 'blunder',
                isUnforced: true,
                candidateCount: 12,
                conceptId: 'duplication',
            },
            {
                moveNumber: 2,
                player: 'X',
                dice: [5, 2],
                boardBefore: [],
                boardAfter: [],
                playedNotation: '24/17*',
                optimalNotation: '24/22 13/8',
                equityLoss: -0.11,
                verdict: 'blunder',
                isUnforced: true,
                candidateCount: 15,
                conceptId: 'blitz-attack',
            },
            {
                moveNumber: 3,
                player: 'X',
                dice: [4, 2],
                boardBefore: [],
                boardAfter: [],
                playedNotation: '8/4 6/4',
                optimalNotation: '8/4 6/4',
                equityLoss: 0,
                verdict: 'optimal',
                isUnforced: true,
                candidateCount: 14,
            },
        ],
        ...overrides,
    };
}

describe('Playstyle Profiler & Multilingual Terminology Matrix (EN/FR/ES/DE/JA)', () => {
    it('identifie un profil Aggressive Blitzer lorsque le joueur frappe et expose des blots', () => {
        const analysis = makeSampleAnalysis();
        const profileEn = analyzePlaystyle(analysis, 'en');

        expect(profileEn.archetype).toBe('aggressive_blitzer');
        expect(profileEn.archetypeLabel).toBe('Aggressive Blitzer');
        expect(profileEn.aggressionIndex).toBeGreaterThanOrEqual(65);
        expect(profileEn.primaryWeakness).toContain('vulnerable blots');
        expect(profileEn.recommendedDrillFocus).toContain('duplication');
    });

    it('identifie un profil Racing Specialist ou Balanced All-Rounder sur une partie propre sans erreur', () => {
        const cleanAnalysis = makeSampleAnalysis({
            totalEquityLoss: 0,
            errorRate: 0,
            performanceRating: 0,
            breakdown: { optimal: 5, acceptable: 0, doubtful: 0, blunder: 0, howler: 0 },
            evaluatedMoves: Array.from({ length: 5 }, (_, idx) => ({
                moveNumber: idx + 1,
                player: 'X' as const,
                dice: [6, 5] as [number, number],
                boardBefore: [],
                boardAfter: [],
                playedNotation: '24/13',
                optimalNotation: '24/13',
                equityLoss: 0,
                verdict: 'optimal' as const,
                isUnforced: true,
                candidateCount: 10,
            })),
        });

        const profileFr = analyzePlaystyle(cleanAnalysis, 'fr');
        expect(profileFr.racingAccuracy).toBe(100);
        expect(profileFr.positionalSolidness).toBe(100);
        expect(['racing_specialist', 'balanced_all_rounder', 'tactical_priming']).toContain(
            profileFr.archetype,
        );
    });

    it('génère le profil de style de jeu dans les 5 langues internationales (en, fr, es, de, ja)', () => {
        const analysis = makeSampleAnalysis();
        const locales: PlaystyleLocale[] = ['en', 'fr', 'es', 'de', 'ja'];
        for (const locale of locales) {
            const profile = analyzePlaystyle(analysis, locale);
            expect(profile.archetypeLabel.length).toBeGreaterThan(2);
            expect(profile.primaryWeakness.length).toBeGreaterThan(10);
            expect(profile.playstyleSummary.length).toBeGreaterThan(15);
        }
    });

    it('garantit la complétude de la matrice terminologique sur les 5 langues (en, fr, es, de, ja)', () => {
        const keys = Object.keys(BACKGAMMON_TERMINOLOGY_MATRIX) as (keyof typeof BACKGAMMON_TERMINOLOGY_MATRIX)[];
        expect(keys.length).toBeGreaterThanOrEqual(20);

        for (const key of keys) {
            for (const locale of SUPPORTED_INTERNATIONAL_LOCALES) {
                const translated = getInternationalTerm(key, locale);
                expect(typeof translated).toBe('string');
                expect(translated.trim().length).toBeGreaterThan(0);
            }
        }
    });
});
