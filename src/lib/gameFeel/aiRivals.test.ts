import { describe, expect, it } from 'vitest';
import {
    AI_RIVALS_BY_DIFFICULTY,
    computeDopamineMetricsFromHistory,
    getAiRivalForDifficulty,
    resolveAiRivalQuote,
} from './aiRivals';

describe('aiRivals — 4 Rivaux Incarnés & Localisation', () => {
    it('expose les 4 archétypes de base', () => {
        expect(AI_RIVALS_BY_DIFFICULTY.beginner.name).toContain('Maxime');
        expect(AI_RIVALS_BY_DIFFICULTY.intermediate.name).toContain('Sofia');
        expect(AI_RIVALS_BY_DIFFICULTY.expert.name).toContain('Victor');
        expect(AI_RIVALS_BY_DIFFICULTY.grandmaster.name).toContain('Viktor');
    });

    it('localise les rivaux selon la locale via getAiRivalForDifficulty', () => {
        const enRival = getAiRivalForDifficulty('beginner', 'en');
        expect(enRival.name).toBe('Arthur "The Sore Loser"');

        const esRival = getAiRivalForDifficulty('beginner', 'es');
        expect(esRival.name).toBe('Arturo «El Mal Perdedor»');

        const frRival = getAiRivalForDifficulty('beginner', 'fr');
        expect(frRival.name).toContain('Maxime');
    });

    it('résout les citations selon la langue', () => {
        const rival = AI_RIVALS_BY_DIFFICULTY.beginner;
        const metrics = computeDopamineMetricsFromHistory([]);

        const frQuote = resolveAiRivalQuote({
            rival,
            metrics,
            cubeValue: 1,
            doublingOffered: false,
            locale: 'fr',
        });
        expect(frQuote).toContain('Prépare-toi');

        const enQuote = resolveAiRivalQuote({
            rival,
            metrics,
            cubeValue: 1,
            doublingOffered: false,
            locale: 'en',
        });
        expect(enQuote).toContain('Get ready');
    });
});
