// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import TournamentWorldHubView from './TournamentWorldHubView';
import TournamentDetailView from './TournamentDetailView';
import { WORLD_TOURNAMENTS_CATALOG } from '../../features/tournaments/worldTournamentsCatalog';
import { extractTournamentTrainingFromUrl } from '../../hooks/usePrivateRoomInvite';
import { I18nProvider } from '../../i18n';

describe('TournamentWorldHubView', () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    afterEach(() => {
        cleanup();
    });

    const renderHub = () =>
        render(
            <I18nProvider>
                <TournamentWorldHubView initialTournaments={WORLD_TOURNAMENTS_CATALOG} />
            </I18nProvider>,
        );

    it('affiche le catalogue mondial complet et permet de filtrer par catégorie MEGA, GRAND et MOYEN', () => {
        renderHub();

        expect(screen.getByTestId('tournament-world-hub-view')).toBeDefined();
        expect(screen.getByText(/Monte-Carlo Backgammon World Championship/i)).toBeDefined();
        expect(screen.getByText(/Paris Masters Backgammon FFB/i)).toBeDefined();
        expect(screen.getByText(/Riviera Cup Nice/i)).toBeDefined();

        // Filtre MEGA uniquement
        fireEvent.click(screen.getByTestId('filter-tier-mega'));
        expect(screen.getByText(/Monte-Carlo Backgammon World Championship/i)).toBeDefined();
        expect(screen.queryByText(/Riviera Cup Nice/i)).toBeNull();

        // Filtre MOYEN uniquement
        fireEvent.click(screen.getByTestId('filter-tier-moyen'));
        expect(screen.getByText(/Riviera Cup Nice/i)).toBeDefined();
        expect(screen.queryByText(/Monte-Carlo Backgammon World Championship/i)).toBeNull();
    });

    it('permet de rechercher un tournoi par ville ou nom et de basculer en vue Agenda Chronologique', () => {
        renderHub();

        const searchInput = screen.getByTestId('tournament-search-input');
        fireEvent.change(searchInput, { target: { value: 'Tokyo' } });

        expect(screen.getByText(/Tokyo International Backgammon Festival/i)).toBeDefined();
        expect(screen.queryByText(/Las Vegas Open/i)).toBeNull();

        // Reset search & switch to Agenda view
        fireEvent.change(searchInput, { target: { value: '' } });
        fireEvent.click(screen.getByTestId('view-mode-agenda'));

        expect(screen.getByTestId('export-all-ics-btn')).toBeDefined();
    });

    it('permet d’épingler un tournoi dans Mon Agenda et d’ouvrir la modale de référencement', () => {
        renderHub();

        const bookmarkBtn = screen.getByTestId('bookmark-tournament-monte-carlo-world-championship-2027');
        fireEvent.click(bookmarkBtn);

        const myAgendaBtn = screen.getByTestId('filter-my-agenda');
        expect(myAgendaBtn.textContent).toContain('1');

        fireEvent.click(screen.getByTestId('open-submit-tournament-btn'));
        expect(screen.getByTestId('submit-tournament-modal')).toBeDefined();
    });

    it('affiche la fiche détaillée complète d’un tournoi (/tournaments/[slug]) et génère le lien d’entraînement officiel', () => {
        const mc = WORLD_TOURNAMENTS_CATALOG[0]!;
        const related = WORLD_TOURNAMENTS_CATALOG.slice(1, 4);

        render(
            <I18nProvider>
                <TournamentDetailView tournament={mc} relatedTournaments={related} />
            </I18nProvider>,
        );

        const trainBtn = screen.getByTestId('detail-train-btn') as HTMLAnchorElement;
        expect(trainBtn).toBeDefined();
        const href = trainBtn.getAttribute('href') ?? '';
        expect(href).toContain('matchLength=17');

        const parsed = extractTournamentTrainingFromUrl(href);
        expect(parsed).toEqual({
            matchLength: 17,
            tournamentName: mc.name,
        });
    });

    it('permet de basculer en vue Palmarès & Résultats et affiche les champions historiques et leurs PR', () => {
        renderHub();

        const resultsTabBtn = screen.getByTestId('view-mode-results');
        expect(resultsTabBtn).toBeDefined();
        fireEvent.click(resultsTabBtn);

        expect(screen.getByTestId('tournament-results-archive-view')).toBeDefined();
        expect(screen.getByText(/Sander Lylloff/i)).toBeDefined();
        expect(screen.getByText(/Michihito Kageyama/i)).toBeDefined();
        expect(screen.getByText(/PR 2.12/i)).toBeDefined();
        expect(screen.getByTestId('replay-final-res-mc-2026')).toBeDefined();
    });

    it('permet de basculer en vue Où Jouer (Carte & Clubs) et affiche la carte SVG ainsi que les clubs et avantages joueurs', () => {
        renderHub();

        const venuesTabBtn = screen.getByTestId('view-mode-venues');
        expect(venuesTabBtn).toBeDefined();
        fireEvent.click(venuesTabBtn);

        expect(screen.getByTestId('world-venues-map-directory')).toBeDefined();
        expect(screen.getAllByText(/Paris Vie d'Eau/i).length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText(/Mindskillz Backgammon Club/i).length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText(/Pourquoi jouer ici — Avantages du lieu/i).length).toBeGreaterThanOrEqual(1);
        expect(screen.getByTestId('map-pin-paris-vie-deau')).toBeDefined();
    });
});
