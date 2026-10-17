import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import ExportImportModal from './ExportImportModal';
import { createInitialState } from '../../engine/backgammonEngine';

describe('ExportImportModal', () => {
    const initialState = createInitialState(7);

    it('ne produit aucun balisage quand isOpen est false', () => {
        const html = renderToStaticMarkup(
            <ExportImportModal
                isOpen={false}
                onClose={vi.fn()}
                currentState={initialState}
                turnsHistory={[]}
                onImportState={vi.fn()}
            />,
        );
        expect(html).toBe('');
    });

    it('affiche les onglets Exporter, Importer, Lien de Partage et le XGID généré', () => {
        const html = renderToStaticMarkup(
            <ExportImportModal
                isOpen={true}
                onClose={vi.fn()}
                currentState={initialState}
                turnsHistory={[]}
                onImportState={vi.fn()}
            />,
        );

        expect(html).toContain('data-testid="export-import-modal"');
        expect(html).toContain('data-testid="tab-export"');
        expect(html).toContain('data-testid="tab-import"');
        expect(html).toContain('data-testid="tab-share"');
        expect(html).toContain('XGID (Position)');
        expect(html).toContain('SGF (Partie complète)');
        expect(html).toContain('data-testid="copy-export-btn"');
        expect(html).toContain('data-testid="download-export-btn"');
        expect(html).toContain('XGID=-b----E-C---eE---c-e----B-:0:0:1:00:0:0:0:0:7');
    });
});
