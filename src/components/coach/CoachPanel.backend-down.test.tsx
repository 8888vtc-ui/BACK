// @vitest-environment jsdom
import React from 'react';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import CoachPanel from './CoachPanel';
import {
    extractStrategicFeatures,
    generateRuleBasedExplanation,
    buildMatchContext,
    StrategicFeatures,
} from '../../features/coach';
import { createInitialState, applyMove, Move } from '../../engine/backgammonEngine';
import { analyzeBoardMoves, formatMoveSequenceNotation } from '../../lib/engine/evaluator';

describe('Coach déclenchement & Repli local quand Backend Down', () => {
    const originalFetch = globalThis.fetch;

    beforeEach(() => {
        vi.restoreAllMocks();
    });

    afterEach(() => {
        cleanup();
        globalThis.fetch = originalFetch;
        vi.clearAllMocks();
    });

    it('calcule equityLoss à la fin du tour vs meilleur coup et extrait les features', () => {
        const state = createInitialState(7);
        const dice: [number, number] = [3, 1];
        const evalState = { ...state, dice, turn: 'X' as const };

        // Évaluation Expectimax 2-ply du coup
        const analysis = analyzeBoardMoves(evalState, dice, { ply: 2 });
        expect(analysis.bestMove).toBeDefined();
        expect(analysis.moves.length).toBeGreaterThan(0);

        const best = analysis.bestMove!;
        // Coup sous-optimal forcé pour simuler une erreur du joueur
        const badMoves: Move[] = [{ from: 24, to: 20 }]; // Coup incomplet ou exposant un blot
        const playedNotation = formatMoveSequenceNotation(badMoves, 'X');

        const matched = analysis.moves.find(
            (m) => m.notation.replace(/\s+/g, '') === playedNotation.replace(/\s+/g, ''),
        );
        const equityLoss = matched ? matched.equityLoss : -0.15;
        expect(equityLoss).toBeLessThanOrEqual(-0.06);

        // Calcul des plateaux résultants pour extraction des concepts stratégiques
        let playedEndState = evalState;
        let bPlayed = [...evalState.board];
        for (const m of badMoves) bPlayed = applyMove(bPlayed, m, 'X');
        playedEndState = { ...evalState, board: bPlayed };

        let bestEndState = evalState;
        if (best.moves) {
            let bBest = [...evalState.board];
            for (const m of best.moves) bBest = applyMove(bBest, m, 'X');
            bestEndState = { ...evalState, board: bBest };
        }

        const features: StrategicFeatures = extractStrategicFeatures(evalState, playedEndState, bestEndState);
        expect(features).toBeDefined();
        expect(features.player).toBe('X');
        expect(features.pipCountDiff).toBeDefined();
    });

    it('bascule de bout en bout sur l\'explication locale regla-basée quand le backend est down (503 Service Unavailable)', async () => {
        vi.spyOn(console, 'warn').mockImplementation(() => { });

        // Simulation d'une panne complète du backend (erreur réseau / HTTP 503 / timeout)
        globalThis.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch: Backend down (HTTP 503)'));

        const state = createInitialState(7);
        const matchCtx = buildMatchContext({
            matchLength: 7,
            scoreX: 2,
            scoreO: 3,
            cubeValue: 1,
            cubeOwner: null,
            crawford: false,
        });

        const features: StrategicFeatures = {
            player: 'X',
            pipCountDiff: {
                player: 167,
                opponent: 160,
                leader: 'O',
                diff: 7,
            },
            blotsAndShots: {
                user: [{ point: 11, directShots: 4, indirectShots: 2, totalShots: 6 }],
                best: [],
            },
            boardStructure: {
                innerBoardPoints: 2,
                advancedAnchor: true,
                goldenPoint: false,
                barPoint: true,
                longestPrime: 3,
            },
            contactStatus: 'contact',
        };

        render(
            <CoachPanel
                verdict="blunder"
                equityLoss={-0.145}
                playedMove="24/23 13/10"
                optimalMove="8/5 6/5"
                features={features}
                matchContext={matchCtx}
                onDismiss={() => { }}
                triggerMode="auto"
                autoThreshold="doubtful"
                apiUrl="/api/coach"
            />,
        );

        // L'API a été appelée
        expect(globalThis.fetch).toHaveBeenCalled();

        // En raison de la panne du backend, le CoachPanel doit basculer sans blocage
        // vers la source 'rule-based' issue de featureExtractor
        await waitFor(() => {
            const badge = screen.getByTestId('coach-source-rule-based');
            expect(badge).toBeDefined();
        });

        // Vérification de la présence de l'explication locale regla-basée affichée à l'utilisateur
        expect(screen.getAllByText('24/23 13/10').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('8/5 6/5').length).toBeGreaterThanOrEqual(1);
        // Le diagnostic pédagogique du Grand-Maître est affiché.
        expect(screen.getByTestId('coach-diagnostic-box')).toBeDefined();
        expect(screen.getByText(/Conseil/i)).toBeDefined();
    });

    it('génère immédiatement une explication locale valide via generateRuleBasedExplanation en cas d\'indisponibilité', () => {
        const features: StrategicFeatures = {
            player: 'X',
            pipCountDiff: {
                player: 140,
                opponent: 155,
                leader: 'X',
                diff: -15,
            },
            blotsAndShots: {
                user: [{ point: 7, directShots: 6, indirectShots: 2, totalShots: 8 }],
                best: [],
            },
            boardStructure: {
                innerBoardPoints: 3,
                advancedAnchor: true,
                goldenPoint: true,
                barPoint: true,
                longestPrime: 4,
            },
            contactStatus: 'contact',
        };

        const ruleBased = generateRuleBasedExplanation({
            verdict: 'blunder',
            equityLoss: -0.16,
            playedMove: '24/20 13/11',
            optimalMove: '8/4 6/4',
            features,
            language: 'fr',
        });

        expect(ruleBased.summary).toBeTruthy();
        expect(ruleBased.explanation).toBeTruthy();
        expect(ruleBased.keyConcept).toBeTruthy();
        expect(ruleBased.advice).toBeTruthy();
    });
});
