// @vitest-environment jsdom
/**
 * Tests des composants RecurringErrorsCard et CoachPreMatchBriefingCard (Supabase + fallback IndexedDB invité).
 */

import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { clearStore, putRecord } from '../../lib/offline/idb';

const mockGetRecurringErrors = vi.fn();
const mockGetCurrentUser = vi.fn();

vi.mock('../../lib/supabase/db', () => ({
    getRecurringErrors: (...args: unknown[]) => mockGetRecurringErrors(...args),
}));

vi.mock('../../lib/supabase/auth', () => ({
    getCurrentUser: (...args: unknown[]) => mockGetCurrentUser(...args),
}));

import { RecurringErrorsCard } from './RecurringErrorsCard';
import { CoachPreMatchBriefingCard } from '../lobby/CoachPreMatchBriefingCard';

afterEach(async () => {
    cleanup();
    vi.clearAllMocks();
    await clearStore('recurrent_mistakes');
});

describe('RecurringErrorsCard', () => {
    it('affiche un état invitant à se connecter si non authentifié et aucune erreur locale', async () => {
        mockGetCurrentUser.mockResolvedValue(null);

        render(<RecurringErrorsCard />);

        await waitFor(() => {
            expect(screen.getByTestId('recurring-errors-guest')).toBeTruthy();
        });
    });

    it('affiche les erreurs locales IndexedDB pour un joueur invité ayant commis des blunders', async () => {
        mockGetCurrentUser.mockResolvedValue(null);
        await putRecord('recurrent_mistakes', {
            id: 'm1',
            category: 'golden_point',
            position_xgid: 'XGID=test',
            played_move: '13/9',
            optimal_move: '8/5 6/5',
            equity_loss: 0.14,
            created_at: '2026-10-23T10:00:00.000Z',
        });

        render(<RecurringErrorsCard />);

        await waitFor(() => {
            expect(screen.getByTestId('recurring-errors-card')).toBeTruthy();
        });
        expect(screen.getByTestId('recurring-errors-local-badge')).toBeTruthy();
        expect(screen.getByText(/Golden Point/i)).toBeTruthy();
        expect(screen.getByText('×1')).toBeTruthy();
    });

    it('affiche un état vide si aucune erreur récurrente', async () => {
        mockGetCurrentUser.mockResolvedValue({ id: 'user-1' });
        mockGetRecurringErrors.mockResolvedValue([]);

        render(<RecurringErrorsCard />);

        await waitFor(() => {
            expect(screen.getByTestId('recurring-errors-empty')).toBeTruthy();
        });
    });

    it('affiche les erreurs récurrentes triées', async () => {
        mockGetCurrentUser.mockResolvedValue({ id: 'user-1' });
        mockGetRecurringErrors.mockResolvedValue([
            {
                id: 'e1',
                user_id: 'user-1',
                concept_id: 'golden-point',
                concept_label: 'Golden Point',
                occurrence_count: 5,
                total_equity_loss: 0.25,
                last_seen_at: '2026-10-20T00:00:00.000Z',
                created_at: '2026-10-20T00:00:00.000Z',
                updated_at: '2026-10-20T00:00:00.000Z',
            },
            {
                id: 'e2',
                user_id: 'user-1',
                concept_id: 'bar-point',
                concept_label: 'Bar Point',
                occurrence_count: 2,
                total_equity_loss: 0.1,
                last_seen_at: '2026-10-20T00:00:00.000Z',
                created_at: '2026-10-20T00:00:00.000Z',
                updated_at: '2026-10-20T00:00:00.000Z',
            },
        ]);

        render(<RecurringErrorsCard />);

        await waitFor(() => {
            expect(screen.getByTestId('recurring-errors-card')).toBeTruthy();
        });
        expect(screen.getByText('Golden Point')).toBeTruthy();
        expect(screen.getByText('Bar Point')).toBeTruthy();
        expect(screen.getByText('×5')).toBeTruthy();
        expect(screen.getByText('×2')).toBeTruthy();
    });
});

describe('CoachPreMatchBriefingCard', () => {
    it('affiche le briefing pré-match personnalisé avec le point faible n°1 dans le Lobby', async () => {
        mockGetCurrentUser.mockResolvedValue(null);
        await putRecord('recurrent_mistakes', {
            id: 'm2',
            category: 'blot_safety',
            position_xgid: 'XGID=test2',
            played_move: '24/20',
            optimal_move: '13/9',
            equity_loss: 0.185,
            created_at: '2026-10-23T11:00:00.000Z',
        });

        const onOpenDrills = vi.fn();
        render(<CoachPreMatchBriefingCard onOpenDrills={onOpenDrills} />);

        await waitFor(() => {
            expect(screen.getByTestId('lobby-briefing-error-badge')).toBeTruthy();
        });
        expect(screen.getByTestId('lobby-prematch-briefing')).toBeTruthy();
        expect(screen.getByTestId('lobby-briefing-drill-btn')).toBeTruthy();
    });
});
