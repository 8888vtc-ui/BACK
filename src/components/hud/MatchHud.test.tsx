import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import MatchHud from './MatchHud';

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
        isLoadingBoard: false,
        onToggleLoadingBoard: vi.fn(),
        onSimulateNetworkError: vi.fn(),
    };

    it('affiche le score du match, le format et l’indicateur du tour actif', () => {
        const html = renderToStaticMarkup(<MatchHud {...defaultProps} />);

        // Format du match
        expect(html.replace(/&#x27;/g, "'")).toContain('Match en 7 pts');

        // Cartes joueurs et scores
        expect(html).toContain('X (Blanc)');
        expect(html).toContain('O (Noir)');
        expect(html).toContain('>3<');
        expect(html).toContain('>2<');

        // Joueur X est au tour
        expect(html).toContain('Au tour');
    });

    it('affiche les dés avec leurs valeurs et l’état utilisé/disponible', () => {
        const html = renderToStaticMarkup(
            <MatchHud {...defaultProps} usedDice={[true, false]} />,
        );

        expect(html).toContain('Dé 1 (G)');
        expect(html).toContain('Dé 2 (D)');
        expect(html).toContain('Clic G : Dé gauche');
        // Le dé 1 utilisé a l'icône de validation checkmark SVG
        expect(html).toContain('text-emerald-400');
    });

    it('affiche la valeur et le possesseur du videau', () => {
        const htmlCentered = renderToStaticMarkup(<MatchHud {...defaultProps} />);
        // En backgammon, la valeur 1 s'affiche '64' sur le dé de videau centré
        expect(htmlCentered).toContain('>64<');
        expect(htmlCentered).toContain('Centré');

        const htmlDoubled = renderToStaticMarkup(
            <MatchHud {...defaultProps} cubeValue={4} cubeOwner="X" />,
        );
        expect(htmlDoubled).toContain('>4<');
        expect(htmlDoubled).toContain('Joueur X');
    });

    it('affiche l’indicateur de règle de Crawford quand activée', () => {
        const html = renderToStaticMarkup(
            <MatchHud {...defaultProps} crawford={true} />,
        );
        expect(html).toContain('Crawford');
    });

    it('affiche le toggle de thème avec le libellé Midnight ou Tournament', () => {
        const htmlMidnight = renderToStaticMarkup(
            <MatchHud {...defaultProps} theme="midnight" />,
        );
        expect(htmlMidnight).toContain('Midnight');
        expect(htmlMidnight).toContain('🌙');

        const htmlTour = renderToStaticMarkup(
            <MatchHud {...defaultProps} theme="tournament" />,
        );
        expect(htmlTour).toContain('Tournament');
        expect(htmlTour).toContain('🏆');
    });

    it('contient les boutons d’actions rapides et de test', () => {
        const html = renderToStaticMarkup(<MatchHud {...defaultProps} />);
        expect(html).toContain('aria-label="Lancer les dés"');
        expect(html).toContain('Skeleton');
        expect(html).toContain('Réseau');
        expect(html).toContain('Reset');
    });

    it('affiche le bouton d’accès à la bibliothèque d’ouvertures si la callback est fournie', () => {
        const onOpenOpeningBook = vi.fn();
        const html = renderToStaticMarkup(
            <MatchHud {...defaultProps} onOpenOpeningBook={onOpenOpeningBook} />,
        );
        expect(html).toContain('data-testid="opening-book-hud-btn"');
        expect(html).toContain('Ouvertures');
    });

    it('affiche le bouton d’exportation / importation / partage si onOpenExportImport est fourni', () => {
        const onOpenExportImport = vi.fn();
        const html = renderToStaticMarkup(
            <MatchHud {...defaultProps} onOpenExportImport={onOpenExportImport} />,
        );
        expect(html).toContain('data-testid="export-import-hud-btn"');
        expect(html).toContain('Partager / XGID');
    });

    it('regroupe les paramètres dans le menu popover ⚙️ et les activités dans la barre secondaire repliable', () => {
        const onOpenMultiplayer = vi.fn();
        const onOpenOpeningBook = vi.fn();
        const onOpenExportImport = vi.fn();
        const onTriggerCoach = vi.fn();

        const html = renderToStaticMarkup(
            <MatchHud
                {...defaultProps}
                onOpenMultiplayer={onOpenMultiplayer}
                onOpenOpeningBook={onOpenOpeningBook}
                onOpenExportImport={onOpenExportImport}
                onTriggerCoach={onTriggerCoach}
            />,
        );

        // Déclencheurs dans la rangée principale
        expect(html).toContain('data-testid="hud-settings-toggle-btn"');
        expect(html).toContain('data-testid="hud-modes-toggle-btn"');

        // Menu Paramètres ⚙️
        expect(html).toContain('data-testid="hud-settings-menu"');
        expect(html).toContain('Paramètres &amp; Outils');
        expect(html).toContain('data-testid="audio-toggle-btn"');
        expect(html).toContain('data-testid="backend-info-btn"');
        expect(html).toContain('data-testid="export-import-hud-btn"');

        // Barre secondaire repliable
        expect(html).toContain('data-testid="hud-secondary-nav"');
        expect(html).toContain('data-testid="multiplayer-hud-trigger"');
        expect(html).toContain('data-testid="drills-hud-link"');
        expect(html).toContain('data-testid="puzzles-hud-link"');
        expect(html).toContain('data-testid="coach-hud-trigger"');
        expect(html).toContain('data-testid="opening-book-hud-btn"');
        expect(html).toContain('/progression');
    });
});

