import { describe, it, expect } from 'vitest';
import {
    normalizeCoachPlayerTier,
    BEGINNER_FORBIDDEN_TERMS,
    getTierSystemPrompt,
    enforceTierVocabularyGuard,
    buildAdaptiveDeterministicCoachText,
    getAdaptiveCoachCacheKey,
    TIER_KNOWLEDGE_CONCEPTS,
} from './coachAdaptiveKnowledgeDb';

describe('coachAdaptiveKnowledgeDb', () => {
    describe('normalizeCoachPlayerTier', () => {
        it('normalizes beginner variants', () => {
            expect(normalizeCoachPlayerTier('beginner')).toBe('BEGINNER');
            expect(normalizeCoachPlayerTier('BEGINNER')).toBe('BEGINNER');
            expect(normalizeCoachPlayerTier('debutant')).toBe('BEGINNER');
            expect(normalizeCoachPlayerTier('simple')).toBe('BEGINNER');
        });

        it('normalizes intermediate variants or defaults', () => {
            expect(normalizeCoachPlayerTier('intermediate')).toBe('INTERMEDIATE');
            expect(normalizeCoachPlayerTier(undefined)).toBe('INTERMEDIATE');
            expect(normalizeCoachPlayerTier(null)).toBe('INTERMEDIATE');
            expect(normalizeCoachPlayerTier('club')).toBe('INTERMEDIATE');
        });

        it('normalizes expert variants', () => {
            expect(normalizeCoachPlayerTier('expert')).toBe('EXPERT');
            expect(normalizeCoachPlayerTier('pro')).toBe('EXPERT');
            expect(normalizeCoachPlayerTier('grandmaster')).toBe('EXPERT');
            expect(normalizeCoachPlayerTier('master')).toBe('EXPERT');
        });
    });

    describe('BEGINNER_FORBIDDEN_TERMS', () => {
        it('contains all required blacklisted technical terms', () => {
            const required = ['EMG', 'mEMG', 'MWC', 'cubeful', 'cubeless', '3-ply', 'PR', 'equity', 'équité'];
            for (const req of required) {
                expect(BEGINNER_FORBIDDEN_TERMS).toContain(req);
            }
        });
    });

    describe('getTierSystemPrompt', () => {
        it('generates tier-specific instructions for beginner in FR and EN', () => {
            const frPrompt = getTierSystemPrompt('BEGINNER', 'fr');
            expect(frPrompt).toContain('amical et bienveillant pour DÉBUTANT');
            expect(frPrompt).toContain('INTERDICTION TOTALE');

            const enPrompt = getTierSystemPrompt('BEGINNER', 'en');
            expect(enPrompt).toContain('friendly, encouraging Backgammon coach for BEGINNERS');
            expect(enPrompt).toContain('STRICT BAN');
        });

        it('generates tier-specific instructions for intermediate in FR and EN', () => {
            const frPrompt = getTierSystemPrompt('INTERMEDIATE', 'fr');
            expect(frPrompt).toContain('INTERMÉDIAIRES');
            expect(frPrompt).toContain('combinaisons de dés sur 36');

            const enPrompt = getTierSystemPrompt('INTERMEDIATE', 'en');
            expect(enPrompt).toContain('INTERMEDIATE');
            expect(enPrompt).toContain('combinations out of 36');
        });

        it('generates tier-specific instructions for expert in FR and EN', () => {
            const frPrompt = getTierSystemPrompt('EXPERT', 'fr');
            expect(frPrompt).toContain('Grand-Maître');
            expect(frPrompt).toContain('ΔEMG');

            const enPrompt = getTierSystemPrompt('EXPERT', 'en');
            expect(enPrompt).toContain('Grandmaster');
            expect(enPrompt).toContain('ΔEMG');
        });
    });

    describe('enforceTierVocabularyGuard', () => {
        it('Mode 1 BEGINNER: strips or converts all forbidden jargon into simple language', () => {
            const rawJargon = 'Ce coup perd -0.082 EMG en cubeful 3-ply avec une perte d équité et un PR élevé.';
            const result = enforceTierVocabularyGuard(rawJargon, 'BEGINNER', 'fr', { winPct: 0.62 });

            expect(result.detectedViolations.length).toBeGreaterThan(0);
            expect(result.tierCompliant).toBe(true);

            // Verifie qu'aucun terme interdit ne subsiste
            for (const forbidden of BEGINNER_FORBIDDEN_TERMS) {
                const escaped = forbidden.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`(?<!\\p{L})${escaped}(?!\\p{L})`, 'iu');
                expect(regex.test(result.sanitizedText)).toBe(false);
            }
            expect(result.sanitizedText).toContain('62%');
        });

        it('Mode 2 INTERMEDIATE: enriches with dice combinations and game plan', () => {
            const rawText = 'Avance ton pion pour sortir du jan adverse.';
            const result = enforceTierVocabularyGuard(rawText, 'INTERMEDIATE', 'fr', {
                directShots: 11,
                gamePlan: 'Course',
            });

            expect(result.tierCompliant).toBe(true);
            expect(result.sanitizedText).toContain('11/36');
            expect(result.sanitizedText).toContain('Course');
        });

        it('Mode 3 EXPERT: enriches with exact delta EMG and neural probabilities', () => {
            const rawText = 'Le coup optimal stabilise la structure.';
            const result = enforceTierVocabularyGuard(rawText, 'EXPERT', 'fr', {
                deltaEmg: -0.065,
                neuralProbs: [0.654, 0.182, 0.012],
            });

            expect(result.tierCompliant).toBe(true);
            expect(result.sanitizedText).toContain('-0.065 EMG');
            expect(result.sanitizedText).toContain('[65.4% / 18.2% / 1.2%]');
        });
    });

    describe('buildAdaptiveDeterministicCoachText', () => {
        it('builds clear beginner explanation without jargon', () => {
            const text = buildAdaptiveDeterministicCoachText('BEGINNER', 'fr', {
                optimalMove: '24/18 13/8',
                winPct: 0.72,
            });
            expect(text).toContain('24/18 13/8');
            expect(text).toContain('72% de chances de gagner');
            for (const forbidden of BEGINNER_FORBIDDEN_TERMS) {
                expect(text.toUpperCase()).not.toContain(forbidden.toUpperCase());
            }
        });

        it('builds tactical intermediate explanation with 36 combinations and plan', () => {
            const text = buildAdaptiveDeterministicCoachText('INTERMEDIATE', 'fr', {
                optimalMove: '24/18 13/8',
                directShots: 9,
                gamePlan: 'Course',
                pipsDiff: 16,
            });
            expect(text).toContain('9/36');
            expect(text).toContain('Course');
            expect(text).toContain('16 pips');
        });

        it('builds surgical expert explanation with delta EMG and MWC', () => {
            const text = buildAdaptiveDeterministicCoachText('EXPERT', 'fr', {
                optimalMove: '24/18 13/8',
                deltaEmg: -0.074,
            });
            expect(text).toContain('-0.074 EMG');
            expect(text).toContain('MWC %');
            expect(text).toContain('dupliquant');
        });
    });

    describe('getAdaptiveCoachCacheKey', () => {
        it('produces unique cache keys segregated by tier and locale', () => {
            const k1 = getAdaptiveCoachCacheKey('pos123', 'BEGINNER', 'fr');
            const k2 = getAdaptiveCoachCacheKey('pos123', 'EXPERT', 'fr');
            const k3 = getAdaptiveCoachCacheKey('pos123', 'BEGINNER', 'en');

            expect(k1).not.toBe(k2);
            expect(k1).not.toBe(k3);
            expect(k1).toContain('tier[BEGINNER]');
            expect(k2).toContain('tier[EXPERT]');
        });
    });

    describe('TIER_KNOWLEDGE_CONCEPTS', () => {
        it('provides concept banks for all tiers', () => {
            expect(TIER_KNOWLEDGE_CONCEPTS.BEGINNER.fr.length).toBeGreaterThan(0);
            expect(TIER_KNOWLEDGE_CONCEPTS.INTERMEDIATE.en.length).toBeGreaterThan(0);
            expect(TIER_KNOWLEDGE_CONCEPTS.EXPERT.fr.length).toBeGreaterThan(0);
        });
    });
});
