import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import MatchTurnBar from './MatchTurnBar';

describe('MatchTurnBar Component', () => {
    const defaultProps = {
        isMultiplayerActive: false,
        rollOffDone: true,
        rollOff: { xDie: null, oDie: null, winner: null },
        onRollOff: vi.fn(),
        phase: 'WAITING_FOR_ROLL',
        isMyTurnToRoll: true,
        canDouble: true,
        cubeValue: 1,
        onOfferDouble: vi.fn(),
        onRollDice: vi.fn(),
        difficulty: 'expert' as const,
        onChangeDifficulty: vi.fn(),
    };

    it('renders roll dice and doubler buttons when it is player turn to roll', () => {
        const html = renderToStaticMarkup(<MatchTurnBar {...defaultProps} />);

        expect(html).toContain('data-testid="roll-dice-btn"');
        expect(html).toContain('data-testid="doubler-btn"');
        expect(html).toContain('Lancer les dés');
        expect(html).toContain('Doubler');
    });

    it('renders opponent thinking alert during OPPONENT_THINKING phase', () => {
        const html = renderToStaticMarkup(
            <MatchTurnBar
                {...defaultProps}
                isMyTurnToRoll={false}
                phase="OPPONENT_THINKING"
                opponentStatusMessage="Analyse 3-ply en cours..."
                lastOpponentDice={[4, 2]}
            />
        );

        expect(html).toContain('Analyse 3-ply en cours...');
        expect(html).toContain('Dés IA : 4 - 2');
    });

    it('renders multiplayer badge in multiplayer mode', () => {
        const html = renderToStaticMarkup(
            <MatchTurnBar
                {...defaultProps}
                isMultiplayerActive={true}
                isMyTurnToRoll={false}
            />
        );

        expect(html).toContain('Match Multijoueur Classé');
    });

    it('renders toggle-live-advice-btn when onToggleLiveAdvice is provided', () => {
        const onToggle = vi.fn();
        const html = renderToStaticMarkup(
            <MatchTurnBar
                {...defaultProps}
                isLiveAdviceEnabled={true}
                onToggleLiveAdvice={onToggle}
            />
        );

        expect(html).toContain('data-testid="toggle-live-advice-btn"');
        expect(html).toContain('IA en live :');
        expect(html).toContain('ON');
    });
});
