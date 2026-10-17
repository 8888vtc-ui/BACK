import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import SyncIndicator from './SyncIndicator';
import * as useSyncQueueModule from '../../hooks/useSyncQueue';

describe('SyncIndicator Component', () => {
    it('affiche le statut Mode local lorsque Supabase n\'est pas configuré', () => {
        vi.spyOn(useSyncQueueModule, 'useSyncQueue').mockReturnValue({
            status: 'local-only',
            pendingCount: 0,
            syncNow: vi.fn(),
        });

        const html = renderToStaticMarkup(<SyncIndicator />);

        expect(html).toContain('data-testid="sync-status-indicator"');
        expect(html).toContain('Mode local');
        expect(html).toContain('Sync');
    });

    it('affiche le nombre d\'éléments en attente et le bouton Réessayer en cas d\'erreur ou d\'attente', () => {
        vi.spyOn(useSyncQueueModule, 'useSyncQueue').mockReturnValue({
            status: 'error',
            pendingCount: 5,
            syncNow: vi.fn(),
        });

        const html = renderToStaticMarkup(<SyncIndicator />);

        expect(html).toContain('data-testid="sync-status-indicator"');
        expect(html).toContain('5 en attente');
        expect(html).toContain('data-testid="sync-retry-btn"');
        expect(html).toContain('Réessayer');
    });

    it('affiche l\'état normal synchronisé lorsque la file est vide', () => {
        vi.spyOn(useSyncQueueModule, 'useSyncQueue').mockReturnValue({
            status: 'idle',
            pendingCount: 0,
            syncNow: vi.fn(),
        });

        const html = renderToStaticMarkup(<SyncIndicator />);

        expect(html).toContain('data-testid="sync-status-indicator"');
        expect(html).toContain('Sync');
        expect(html).not.toContain('Réessayer');
    });
});
