/**
 * @vitest-environment jsdom
 */

import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { KnowledgeBaseModal } from './KnowledgeBaseModal';

describe('KnowledgeBaseModal', () => {
    afterEach(() => {
        cleanup();
    });
    it('ne s\'affiche pas quand isOpen=false', () => {
        render(<KnowledgeBaseModal isOpen={false} onClose={vi.fn()} />);
        expect(screen.queryByTestId('knowledge-base-modal')).toBeNull();
    });

    it('affiche le modal avec le titre et les concepts quand isOpen=true', () => {
        render(<KnowledgeBaseModal isOpen={true} onClose={vi.fn()} />);
        expect(screen.getByTestId('knowledge-base-modal')).toBeDefined();
        expect(screen.getByTestId('kb-detail-title')).toBeDefined();
        expect(screen.getByTestId('kb-search-input')).toBeDefined();
    });

    it('permet de rechercher un concept par mot-clé', () => {
        render(<KnowledgeBaseModal isOpen={true} onClose={vi.fn()} />);
        const searchInput = screen.getByTestId('kb-search-input');

        fireEvent.change(searchInput, { target: { value: 'Trice' } });
        expect(screen.getByTestId('kb-concept-item-trice-epc')).toBeDefined();
    });

    it('permet de changer de catégorie via les chips', () => {
        render(<KnowledgeBaseModal isOpen={true} onClose={vi.fn()} />);
        const cubeCatBtn = screen.getByTestId('kb-category-cube-theory');

        fireEvent.click(cubeCatBtn);
        expect(screen.getByTestId('kb-concept-item-take-point')).toBeDefined();
    });

    it('sélectionne un concept au clic et met à jour le titre détaillé', () => {
        render(<KnowledgeBaseModal isOpen={true} onClose={vi.fn()} />);
        const epcItem = screen.queryByTestId('kb-concept-item-trice-epc');
        if (epcItem) {
            fireEvent.click(epcItem);
            const title = screen.getByTestId('kb-detail-title');
            expect(title.textContent).toContain('EPC');
        }
    });

    it('appelle onClose au clic sur le bouton de fermeture', () => {
        const handleClose = vi.fn();
        render(<KnowledgeBaseModal isOpen={true} onClose={handleClose} />);
        const closeBtn = screen.getByTestId('kb-close-btn');

        fireEvent.click(closeBtn);
        expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('appelle onClose sur la touche Échap', () => {
        const handleClose = vi.fn();
        render(<KnowledgeBaseModal isOpen={true} onClose={handleClose} />);

        fireEvent.keyDown(window, { key: 'Escape' });
        expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('sélectionne automatiquement initialConceptId s\'il est fourni', () => {
        render(<KnowledgeBaseModal isOpen={true} onClose={vi.fn()} initialConceptId="woolsey-law" />);
        const title = screen.getByTestId('kb-detail-title');
        expect(title.textContent).toContain('Woolsey');
    });
});
