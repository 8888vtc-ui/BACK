// @vitest-environment jsdom
/**
 * Tests du composant RecurringErrorsCard.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';

const mockGetRecurringErrors = vi.fn();
const mockGetCurrentUser = vi.fn();

vi.mock('../../lib/supabase/db', () => ({
    getRecurringErrors: (...args: unknown[]) => mockGetRecurringErrors(...args),
}));

vi.mock('../../lib/supabase/auth', () => ({
    getCurrentUser: (...args: unknown[]) => mockGetCurrentUser(...args),
}));

import { RecurringErrorsCard } from './RecurringErrorsCard';

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe('RecurringErrorsCard', () => {
    it('affiche un état invitant à se connecter si non authentifié', async () => {
        mockGetCurrentUser.mockResolvedValue(null);

        render(<RecurringErrorsCard />);

        await waitFor(() => {
            expect(screen.getByTestId('recurring-errors-guest')).toBeTruthy();
        });
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
