import { describe, it, expect } from 'vitest';
import {
    buildDeterministicSymbolicAudit,
    buildNeuroSymbolicAudit,
    enforceSymbolicAuditAntiHallucination,
    truncateToSwellerHeadline,
    computeTriceEpcMetric,
} from './symbolicAudit';
import { classifyDominantTheme, selectMichyOrMagrielProverb } from './michyProverbs';
import { computeZareLuckVsSkill } from './zareTiltEngine';
import { createInitialState } from '../../engine/backgammonEngine';

describe('Neuro-Symbolic Coach IA — Schéma d’Audit Symbolique en Deux Temps', () => {
    it('classifyDominantTheme identifie correctement RACE, BLITZ, PRIME, HOLDING et BEAROFF', () => {
        expect(classifyDominantTheme({ gamePhase: 'bearoff' })).toBe('BEAROFF');
        expect(classifyDominantTheme({ gamePhase: 'race' })).toBe('RACE');
        expect(classifyDominantTheme({ primeLength: 5, gamePhase: 'contact' })).toBe('PRIME');
        expect(classifyDominantTheme({ opponentBarCount: 1, homeBoardPointsMade: 4 })).toBe('BLITZ');
        expect(classifyDominantTheme({ archetype: 'holding' })).toBe('HOLDING');
    });

    it('selectMichyOrMagrielProverb retourne le proverbe de Michy ou la règle de Magriel adaptée', () => {
        const safeVsBold = selectMichyOrMagrielProverb({
            theme: 'HOLDING',
            directShotsBefore: 1,
            directShotsAfter: 6,
            playerPipCount: 120,
            opponentPipCount: 145,
        });
        expect(safeVsBold.id).toBe('pure-play');
        expect(safeVsBold.author).toBe('Paul Magriel');

        const goldenPoint = selectMichyOrMagrielProverb({
            theme: 'PRIME',
            bestMoveNotation: '8/5 6/5',
        });
        expect(goldenPoint.id).toBe('golden-point');
        expect(goldenPoint.author).toContain('Michy');
    });

    it('truncateToSwellerHeadline impose la limite de charge cognitive de Sweller (<= 15 mots)', () => {
        const longText =
            'Un deux trois quatre cinq six sept huit neuf dix onze douze treize quatorze quinze seize dix-sept dix-huit';
        const truncated = truncateToSwellerHeadline(longText, 15);
        expect(truncated.split(/\s+/).length).toBeLessThanOrEqual(15);
        expect(truncated.endsWith('.')).toBe(true);
    });

    it('buildNeuroSymbolicAudit génère les deux étapes symbolic_audit et pedagogical_explanation', () => {
        const { board } = createInitialState();
        const audit = buildNeuroSymbolicAudit({
            playerPipCount: 142,
            opponentPipCount: 155,
            directShotsBefore: 0,
            directShotsAfter: 6,
            equityLoss: 0.125,
            bestMoveNotation: '13/8 6/5*',
            playedMoveNotation: '13/7',
            primeLength: 4,
            board,
            player: 'X',
            dice: [5, 1],
            luckDelta: -0.14,
            locale: 'fr',
        });

        expect(audit.symbolic_audit).toMatchObject({
            player_pip: 142,
            opponent_pip: 155,
            direct_shots_conceded: 6,
            blunder_delta_equity: -0.125,
            dominant_theme: 'PRIME',
        });

        expect(audit.pedagogical_explanation.correct_play_canonical).toBe('13/8 6/5*');
        expect(audit.pedagogical_explanation.headline.split(/\s+/).length).toBeLessThanOrEqual(15);
        expect(audit.pedagogical_explanation.tactical_rationale).toContain('13/8 6/5*');
        expect(audit.pedagogical_explanation.zare_luck_vs_skill).toContain('Dissociation de Zare');
        expect(audit.pedagogical_explanation.idea_problem_solution).toBeDefined();
        expect(audit.pedagogical_explanation.socratic_hints).toHaveLength(3);
    });

    it('enforceSymbolicAuditAntiHallucination écrase toute hallucination numérique du LLM', () => {
        const groundTruth = buildNeuroSymbolicAudit({
            playerPipCount: 120,
            opponentPipCount: 138,
            directShotsAfter: 4,
            equityLoss: 0.095,
            bestMoveNotation: '24/18 13/8',
            playedMoveNotation: '13/7 13/8',
            gamePhase: 'contact',
        });

        const hallucinatedLlmOutput = {
            symbolic_audit: {
                player_pip: 999,
                opponent_pip: 12,
                direct_shots_conceded: 35,
                blunder_delta_equity: -0.888,
                dominant_theme: 'BLITZ' as const,
            },
            pedagogical_explanation: {
                headline:
                    'Une phrase beaucoup trop longue qui dépasse largement la limite stricte des quinze mots imposée par Sweller dans son modèle cognitif',
                tactical_rationale: 'Analyse socratique valide citant Michy.',
                correct_play_canonical: 'HALLUCINATED_MOVE_99/1',
                zare_luck_vs_skill: 'Dissociation valide.',
            },
        };

        const sanitized = enforceSymbolicAuditAntiHallucination(hallucinatedLlmOutput, groundTruth);

        expect(sanitized.symbolic_audit.player_pip).toBe(120);
        expect(sanitized.symbolic_audit.opponent_pip).toBe(138);
        expect(sanitized.symbolic_audit.direct_shots_conceded).toBe(4);
        expect(sanitized.symbolic_audit.blunder_delta_equity).toBe(-0.095);
        expect(sanitized.symbolic_audit.dominant_theme).toBe('BLITZ');
        expect(sanitized.pedagogical_explanation.correct_play_canonical).toBe('24/18 13/8');
        expect(sanitized.pedagogical_explanation.headline.split(/\s+/).length).toBeLessThanOrEqual(15);
    });

    it('computeTriceEpcMetric et computeZareLuckVsSkill retournent des valeurs déterministes cohérentes', () => {
        const { board } = createInitialState();
        const epc = computeTriceEpcMetric(board, 'X');
        expect(typeof epc).toBe('number');
        expect(epc).toBeGreaterThan(160);

        const zare = computeZareLuckVsSkill({
            equityLoss: 0.11,
            dice: [6, 2],
            luckDelta: -0.15,
            bestMoveNotation: '24/18 13/11',
        });
        expect(zare.skillDeltaEquity).toBe(-0.11);
        expect(zare.luckDeltaEquity).toBe(-0.15);
        expect(zare.totalDeltaEquity).toBe(-0.26);

        const audit = buildDeterministicSymbolicAudit({
            playerPipCount: 100,
            opponentPipCount: 110,
            directShotsAfter: 2,
            equityLoss: 0.08,
            bestMoveNotation: '8/5 6/5',
            playedMoveNotation: '13/7',
        });
        expect(audit.blunder_delta_equity).toBe(-0.08);
    });
});
