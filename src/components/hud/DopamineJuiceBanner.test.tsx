// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { DopamineJuiceBanner } from './DopamineJuiceBanner';
import type { CoachAnalysisHistoryEntry } from '../../hooks/useCoachHelpers';

afterEach(() => {
    cleanup();
});

function makeEntry(params: {
    turnIndex: number;
    verdict: 'optimal' | 'good' | 'inaccuracy' | 'blunder';
    equityLoss: number;
    secondCandidateLoss?: number;
}): CoachAnalysisHistoryEntry {
    return {
        turnIndex: params.turnIndex,
        timestamp: 1700000000000 + params.turnIndex,
        dice: [3, 1],
        boardBefore: new Array<number>(26).fill(0),
        boardAfter: new Array<number>(26).fill(0),
        highlight: null,
        coachState: {
            verdict: params.verdict,
            equityLoss: params.equityLoss,
            playedMove: '8/5 6/5',
            optimalMove: '8/5 6/5',
            explanation: null,
            candidates:
                params.secondCandidateLoss !== undefined
                    ? [
                          {
                              rank: 1,
                              notation: '8/5 6/5',
                              equity: 0.45,
                              equityLoss: 0,
                          },
                          {
                              rank: 2,
                              notation: '24/20',
                              equity: 0.45 - params.secondCandidateLoss,
                              equityLoss: params.secondCandidateLoss,
                          },
                      ]
                    : [],
        },
    };
}

describe('DopamineJuiceBanner — 4 High-Dopamine & Addiction Mechanics', () => {
    it('affiche le Rival IA incarné (Boss Ladder), son PR cible et sa réplique', () => {
        render(<DopamineJuiceBanner difficulty="expert" coachHistory={[]} cubeValue={1} />);

        expect(screen.getByTestId('dopamine-ai-rival-card').textContent).toContain('Maître Kenji Sato');
        expect(screen.getByTestId('dopamine-ai-rival-pr').textContent).toContain('PR ~3.5');
        expect(screen.getByTestId('dopamine-ai-rival-quote').textContent).toContain('Point d’Or');
    });

    it('célèbre un Coup Brillant (!!) et un Combo de Maître x3 sur une série optimale', () => {
        const history: CoachAnalysisHistoryEntry[] = [
            makeEntry({ turnIndex: 1, verdict: 'optimal', equityLoss: 0 }),
            makeEntry({ turnIndex: 3, verdict: 'optimal', equityLoss: 0 }),
            makeEntry({ turnIndex: 5, verdict: 'optimal', equityLoss: 0, secondCandidateLoss: 0.088 }),
        ];

        render(<DopamineJuiceBanner difficulty="grandmaster" coachHistory={history} cubeValue={1} />);

        const brilliant = screen.getByTestId('dopamine-brilliant-badge');
        expect(brilliant.textContent).toContain('COUP BRILLANT !!');
        expect(brilliant.textContent).toContain('+0.088');

        const combo = screen.getByTestId('dopamine-combo-badge');
        expect(combo.textContent).toContain('COMBO MAÎTRE x3');
    });

    it('affiche la haute tension dramatique du videau (Quitte ou Double / High Stakes)', () => {
        const { rerender } = render(
            <DopamineJuiceBanner difficulty="intermediate" cubeValue={2} doublingOfferedBy="O" />,
        );

        expect(screen.getByTestId('dopamine-cube-stakes').textContent).toContain('QUITTE OU DOUBLE x4 !');

        rerender(<DopamineJuiceBanner difficulty="intermediate" cubeValue={4} doublingOfferedBy={null} />);
        expect(screen.getByTestId('dopamine-cube-stakes').textContent).toContain('HAUTE TENSION x4');
    });

    it('déclenche en 1 clic le Défi Ghost (retour sur la pire gaffe du match) et la Revanche', () => {
        const onGhost = vi.fn();
        const onRematch = vi.fn();
        const history: CoachAnalysisHistoryEntry[] = [
            makeEntry({ turnIndex: 2, verdict: 'blunder', equityLoss: 0.095 }),
            makeEntry({ turnIndex: 6, verdict: 'blunder', equityLoss: 0.175 }),
            makeEntry({ turnIndex: 8, verdict: 'optimal', equityLoss: 0 }),
        ];

        render(
            <DopamineJuiceBanner
                difficulty="beginner"
                coachHistory={history}
                onTriggerGhostChallenge={onGhost}
                onInstantRematch={onRematch}
            />,
        );

        const ghostBtn = screen.getByTestId('dopamine-ghost-challenge-btn');
        expect(ghostBtn.textContent).toContain('Défi Ghost (Tour #6)');
        fireEvent.click(ghostBtn);
        expect(onGhost).toHaveBeenCalledWith(6);

        const rematchBtn = screen.getByTestId('dopamine-instant-rematch-btn');
        fireEvent.click(rematchBtn);
        expect(onRematch).toHaveBeenCalledTimes(1);
    });
});
