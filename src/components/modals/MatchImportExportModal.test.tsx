// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import MatchImportExportModal from './MatchImportExportModal';
import { createInitialState } from '../../engine/backgammonEngine';

describe('MatchImportExportModal', () => {
    const defaultState = createInitialState(7);
    const mockClose = vi.fn();
    const mockImportState = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    it('ne rend rien si isOpen est faux', () => {
        const { container } = render(
            <MatchImportExportModal
                isOpen={false}
                onClose={mockClose}
                currentState={defaultState}
            />
        );
        expect(container.firstChild).toBeNull();
    });

    it('affiche le titre et les onglets lorsque ouvert', () => {
        render(
            <MatchImportExportModal
                isOpen={true}
                onClose={mockClose}
                currentState={defaultState}
                locale="fr"
            />
        );

        expect(screen.getByText(/Import & Export Horloger/i)).toBeDefined();
        expect(screen.getByTestId('tab-import-btn')).toBeDefined();
        expect(screen.getByTestId('tab-export-btn')).toBeDefined();
    });

    it('permet de basculer sur l\'onglet Exporter et affiche les options .mat, .sgf, XGID', () => {
        render(
            <MatchImportExportModal
                isOpen={true}
                onClose={mockClose}
                currentState={defaultState}
                locale="fr"
            />
        );

        const exportTab = screen.getByTestId('tab-export-btn');
        fireEvent.click(exportTab);

        expect(screen.getByTestId('download-mat-btn')).toBeDefined();
        expect(screen.getByTestId('download-sgf-btn')).toBeDefined();
        expect(screen.getByTestId('copy-xgid-btn')).toBeDefined();
        expect(screen.getByText(/Position Courante \(XGID\)/i)).toBeDefined();
    });

    it('importe correctement un XGID saisi dans le champ texte', () => {
        render(
            <MatchImportExportModal
                isOpen={true}
                onClose={mockClose}
                currentState={defaultState}
                onImportState={mockImportState}
                locale="fr"
            />
        );

        const textarea = screen.getByTestId('import-textarea');
        fireEvent.change(textarea, {
            target: { value: 'XGID=-b----E-C---eE---c-e----A-:0:0:1:00:0:0:0:0:10' }
        });

        const loadButton = screen.getByTestId('apply-import-btn');
        fireEvent.click(loadButton);

        expect(mockImportState).toHaveBeenCalledTimes(1);
        expect(mockClose).toHaveBeenCalledTimes(1);
    });

    it('affiche un message d\'erreur pour un contenu non reconnu', () => {
        render(
            <MatchImportExportModal
                isOpen={true}
                onClose={mockClose}
                currentState={defaultState}
                onImportState={mockImportState}
                locale="fr"
            />
        );

        const textarea = screen.getByTestId('import-textarea');
        fireEvent.change(textarea, {
            target: { value: 'Texte invalide qui ne correspond a rien' }
        });

        const loadButton = screen.getByTestId('apply-import-btn');
        fireEvent.click(loadButton);

        expect(mockImportState).not.toHaveBeenCalled();
        expect(screen.getByText(/Format non reconnu/i)).toBeDefined();
    });

    it('importe avec succès un match .mat et invoque onImportMatch', () => {
        const mockImportMatch = vi.fn();
        const matContent = ` 7 point match\n\n Game 1\n Alice : 0                   Bob : 0\n  1) 31: 8/5 6/5             65: 24/13\n`;

        render(
            <MatchImportExportModal
                isOpen={true}
                onClose={mockClose}
                currentState={defaultState}
                onImportMatch={mockImportMatch}
                locale="fr"
            />
        );

        const textarea = screen.getByTestId('import-textarea');
        fireEvent.change(textarea, { target: { value: matContent } });

        const loadButton = screen.getByTestId('apply-import-btn');
        fireEvent.click(loadButton);

        expect(mockImportMatch).toHaveBeenCalledTimes(1);
        expect(mockImportMatch.mock.calls[0][0].type).toBe('mat');
        expect(mockImportMatch.mock.calls[0][0].playerX).toBe('Alice');
        expect(mockImportMatch.mock.calls[0][0].turns).toHaveLength(2);
        expect(mockClose).toHaveBeenCalledTimes(1);
    });

    it('copie le XGID dans le presse-papiers avec succès', async () => {
        const writeTextMock = vi.fn().mockResolvedValue(undefined);
        Object.assign(navigator, {
            clipboard: {
                writeText: writeTextMock,
                readText: vi.fn(),
            },
        });

        render(
            <MatchImportExportModal
                isOpen={true}
                onClose={mockClose}
                currentState={defaultState}
                locale="fr"
            />
        );

        const exportTab = screen.getByTestId('tab-export-btn');
        fireEvent.click(exportTab);

        const copyBtn = screen.getByTestId('copy-xgid-btn');
        fireEvent.click(copyBtn);

        expect(writeTextMock).toHaveBeenCalledTimes(1);
        expect(writeTextMock.mock.calls[0][0]).toMatch(/^XGID=/);
    });
});
