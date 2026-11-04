// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
    usePlayerTierGate,
    PLAYER_TIER_GATE_STORAGE_KEY,
    getSavedPlayerTierGate,
} from '../../hooks/usePlayerTierGate';
import { PlayerTierGateSwitch } from './PlayerTierGateSwitch';
import { BeginnerHomePortal } from '../home/BeginnerHomePortal';
import { IntermediateHomePortal } from '../home/IntermediateHomePortal';
import { ExpertHomePortal } from '../home/ExpertHomePortal';

function TestGateConsumer() {
    const { tierGate, setTierGate } = usePlayerTierGate();
    return (
        <div>
            <span data-testid="active-gate">{tierGate}</span>
            <PlayerTierGateSwitch currentGate={tierGate} onSelectGate={setTierGate} />
        </div>
    );
}

describe('PlayerTierGate (3 Portes : Débutant | Intermédiaire | Expert)', () => {
    beforeEach(() => {
        if (typeof localStorage !== 'undefined') {
            localStorage.clear();
        }
    });

    afterEach(() => {
        cleanup();
    });

    it('sélectionne BEGINNER par défaut à la 1re visite sans bloquer par un mur d inscription', () => {
        expect(getSavedPlayerTierGate()).toBe('BEGINNER');
        render(<TestGateConsumer />);
        expect(screen.getByTestId('active-gate').textContent).toBe('BEGINNER');
    });

    it('bascule en 1 clic vers INTERMEDIATE et EXPERT et persiste dans localStorage (bgtour_player_gate)', () => {
        render(<TestGateConsumer />);

        fireEvent.click(screen.getByTestId('tier-gate-btn-intermediate'));
        expect(screen.getByTestId('active-gate').textContent).toBe('INTERMEDIATE');
        expect(localStorage.getItem(PLAYER_TIER_GATE_STORAGE_KEY)).toBe('INTERMEDIATE');

        fireEvent.click(screen.getByTestId('tier-gate-btn-expert'));
        expect(screen.getByTestId('active-gate').textContent).toBe('EXPERT');
        expect(localStorage.getItem(PLAYER_TIER_GATE_STORAGE_KEY)).toBe('EXPERT');
    });

    it('garantit 100 % Zéro Jargon sur BeginnerHomePortal (aucune mention de PR, EMG, Rating, 3-ply ou Crawford)', () => {
        const html = renderToStaticMarkup(
            <BeginnerHomePortal onStartGuidedGame={() => {}} onOpenAcademy={() => {}} />,
        );
        expect(html).toContain('beginner-home-portal');
        expect(html).toContain('beginner-academy-btn');
        expect(html).toContain('beginner-play-btn');
        expect(html).not.toMatch(/\bEMG\b/i);
        expect(html).not.toMatch(/\b3-ply\b/i);
        expect(html).not.toMatch(/\bRating\b/i);
        expect(html).not.toMatch(/\bCrawford\b/i);
        expect(html).not.toMatch(/\bERH\b/i);
    });

    it('affiche les portails Club (INTERMEDIATE) et Pro (EXPERT) avec leurs actions directes', () => {
        const clubHtml = renderToStaticMarkup(
            <IntermediateHomePortal
                onFindOpponent={() => {}}
                onInviteFriend={() => {}}
                onOpenQuizzes={() => {}}
            />,
        );
        expect(clubHtml).toContain('intermediate-home-portal');
        expect(clubHtml).toContain('TROUVER UN ADVERSAIRE');

        const expertHtml = renderToStaticMarkup(
            <ExpertHomePortal onStartExpertMatch={() => {}} onOpen3PlyQuizzes={() => {}} />,
        );
        expect(expertHtml).toContain('expert-home-portal');
        expect(expertHtml).toContain('Open Sage 3-Ply');
    });
});

