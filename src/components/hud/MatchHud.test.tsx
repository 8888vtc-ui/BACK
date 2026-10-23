// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { render, fireEvent } from '@testing-library/react';
import MatchHud from './MatchHud';
import { createInitialState } from '../../engine/backgammonEngine';

describe('MatchHud', () => {
    const defaultProps = {
        matchLength: 7,
        scoreX: 3,
        scoreO: 2,
        turn: 'X' as const,
        crawford: false,
        dice: [4, 2] as [number, number],
        usedDice: [false, false] as [boolean, boolean],
        cubeValue: 1,
        cubeOwner: null,
        theme: 'midnight' as const,
        onThemeToggle: vi.fn(),
        onDoubleCube: vi.fn(),
        onRollDice: vi.fn(),
        onResetGame: vi.fn(),
    };

    it('affiche le format, les cartes joueurs (Vous vs IA Expert) et le tour actif sans jargon X/O', () => {
        const html = renderToStaticMarkup(<MatchHud {...defaultProps} />);

        expect(html).toContain('Match 7 pts');
        expect(html).toContain('>Vous<');
        expect(html).toContain('>IA Expert<');
        expect(html).not.toContain('X (Vous - Blanc)');
        expect(html).toContain('>3<');
        expect(html).toContain('>2<');
        expect(html).toContain('ring-[#f3c65f]');
    });

    it('ne duplique ni les dés ni le videau dans le HUD supérieur (unifiés sur le plateau)', () => {
        const html = renderToStaticMarkup(
            <MatchHud {...defaultProps} usedDice={[true, false]} />,
        );

        expect(html).not.toContain('data-testid="hud-dice"');
        expect(html).not.toContain('data-testid="hud-double-btn"');
        expect(html).not.toContain('data-testid="hud-roll-dice-btn"');
    });

    it('affiche le bouton Coach 1-clic directement dans la barre HUD quand onTriggerCoach est fourni', () => {
        const html = renderToStaticMarkup(
            <MatchHud {...defaultProps} onTriggerCoach={vi.fn()} />,
        );
        expect(html).toContain('data-testid="hud-coach-btn"');
    });

    it('affiche l’indicateur de règle de Crawford quand activée', () => {
        const html = renderToStaticMarkup(
            <MatchHud {...defaultProps} crawford={true} />,
        );
        expect(html).toContain('Crawford');
    });

    it('affiche le dernier coup joué en notation standard', () => {
        const html = renderToStaticMarkup(
            <MatchHud {...defaultProps} lastMoveNotation="24/18 18/13" />,
        );
        expect(html).toContain('data-testid="hud-last-move"');
        expect(html).toContain('24/18 18/13');
    });

    it('contient le bouton Lobby et le menu ⚙️ sans boutons de jeu redondants', () => {
        const html = renderToStaticMarkup(<MatchHud {...defaultProps} />);
        expect(html).toContain('data-testid="hud-back-to-lobby-btn"');
        expect(html).toContain('data-testid="hud-settings-toggle-btn"');
        expect(html).not.toContain('data-testid="hud-roll-dice-btn"');
        expect(html).not.toContain('data-testid="hud-double-btn"');
    });

    it('ne contient plus le bouton « Nouvelle Partie » ni les outils de debug', () => {
        const html = renderToStaticMarkup(<MatchHud {...defaultProps} />);
        expect(html).not.toContain('hud-new-game-btn');
        expect(html).not.toContain('copy-debug-btn');
        expect(html).not.toContain('hud-modes-toggle-btn');
        expect(html).not.toContain('hud-secondary-nav');
    });

    it('affiche le bouton d’exportation / importation dans le menu ⚙️', () => {
        const onOpenExportImport = vi.fn();
        const html = renderToStaticMarkup(
            <MatchHud {...defaultProps} onOpenExportImport={onOpenExportImport} />,
        );
        expect(html).toContain('data-testid="export-import-hud-btn"');
        expect(html).toContain('Partager / XGID');
    });

    it('regroupe les paramètres dans le menu popover ⚙️', () => {
        const onOpenExportImport = vi.fn();
        const onTriggerCoach = vi.fn();

        const html = renderToStaticMarkup(
            <MatchHud
                {...defaultProps}
                onOpenExportImport={onOpenExportImport}
                onTriggerCoach={onTriggerCoach}
            />,
        );

        expect(html).toContain('data-testid="hud-settings-toggle-btn"');
        expect(html).toContain('data-testid="hud-settings-menu"');
        expect(html).toContain('data-testid="audio-toggle-btn"');
        expect(html).toContain('data-testid="export-import-hud-btn"');
        expect(html).toContain('data-testid="coach-hud-trigger"');
    });

    it('ouvre la modale InGameMenuModal lors du clic sur Lobby quand une manche est active', () => {
        const onBackToLobby = vi.fn();
        const { getByTestId, queryByTestId } = render(
            <MatchHud
                {...defaultProps}
                isGameActive={true}
                onBackToLobby={onBackToLobby}
            />,
        );

        // Au début la modale est fermée
        expect(queryByTestId('in-game-menu-modal')).toBeNull();

        // Clic sur le bouton Lobby
        fireEvent.click(getByTestId('hud-back-to-lobby-btn'));

        // La modale est maintenant ouverte et onBackToLobby n’est pas appelé directement
        expect(getByTestId('in-game-menu-modal')).toBeDefined();
        expect(onBackToLobby).not.toHaveBeenCalled();
    });

    it('affiche l’alerte explicite de rentrée obligatoire quand un pion est sur la barre', () => {
        const boardState = createInitialState(7);
        boardState.board[0] = 1; // 1 pion blanc sur la barre
        boardState.turn = 'X';

        const html = renderToStaticMarkup(
            <MatchHud {...defaultProps} turn="X" playerColor="X" boardState={boardState} />,
        );

        expect(html).toContain('data-testid="hud-bar-checker-alert"');
        expect(html).toContain('1 sur la barre : rentrée obligatoire (flèches 19 à 24)');
    });

    it('affiche l’enjeu du videau dans le scoreboard quand cubeValue > 1', () => {
        const html = renderToStaticMarkup(
            <MatchHud {...defaultProps} cubeValue={4} cubeOwner="X" />,
        );

        expect(html).toContain('Cube 4×');
        expect(html).toContain('Enjeu : 4 pts');
    });
});

