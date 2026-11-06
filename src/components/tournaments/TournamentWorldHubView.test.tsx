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
        expect(screen.getByTestId('map-tournaments-section')).toBeDefined();

        // Filtre MEGA uniquement
        fireEvent.click(screen.getByTestId('filter-tier-mega'));
        expect(screen.getByTestId('map-tournaments-section')).toBeDefined();

        // Filtre MOYEN uniquement
        fireEvent.click(screen.getByTestId('filter-tier-moyen'));
        expect(screen.getByTestId('map-tournaments-section')).toBeDefined();
    });

    it('permet de rechercher un tournoi par ville ou nom et de basculer en vue Agenda Chronologique', () => {
        renderHub();

        const searchInput = screen.getByTestId('tournament-search-input');
        fireEvent.change(searchInput, { target: { value: 'Tokyo' } });

        expect(screen.getAllByText(/Tokyo International Backgammon Festival/i).length).toBeGreaterThanOrEqual(1);
        expect(screen.queryByText(/Las Vegas Open/i)).toBeNull();

        // Reset search & switch to Agenda view
        fireEvent.change(searchInput, { target: { value: '' } });
        fireEvent.click(screen.getByTestId('view-mode-agenda'));

        expect(screen.getByTestId('export-all-ics-btn')).toBeDefined();
    });

    it('permet d’épingler un tournoi dans Mon Agenda et d’ouvrir la modale de référencement', () => {
        renderHub();

        fireEvent.click(screen.getByTestId('view-mode-agenda'));
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
        expect(screen.getByTestId('map-pin-paris-vie-deau')).toBeDefined();
        expect(screen.getByTestId('club-detail-panel')).toBeDefined();
    });

    it('permet de cocher/décocher Tournois et Clubs sur la carte et d’enregistrer un club inconnu', async () => {
        renderHub();

        // Cliquer sur "+ Enregistrer mon Club" depuis le header bascule sur la carte et ouvre le formulaire
        fireEvent.click(screen.getByTestId('open-submit-club-btn'));
        expect(screen.getByTestId('world-venues-map-directory')).toBeDefined();
        expect(screen.getByTestId('submit-club-modal')).toBeDefined();

        // Vérifier les 2 cases à cocher [☑ Clubs] et [☑ Tournois]
        const toggleClubs = screen.getByTestId('map-toggle-clubs') as HTMLInputElement;
        const toggleTournaments = screen.getByTestId('map-toggle-tournaments') as HTMLInputElement;
        expect(toggleClubs.checked).toBe(true);
        expect(toggleTournaments.checked).toBe(true);
        expect(screen.getByTestId('map-tournaments-section')).toBeDefined();

        // Décocher Tournois masque les tournois de la carte
        fireEvent.click(toggleTournaments);
        expect(screen.queryByTestId('map-tournaments-section')).toBeNull();

        // Remplir et soumettre un nouveau club inconnu SANS site web (avec Page Club Officielle Offerte)
        expect(screen.getByTestId('club-free-page-offer')).toBeDefined();
        fireEvent.change(screen.getByTestId('club-input-name'), { target: { value: 'Riviera Backgammon Club Antibes' } });
        fireEvent.change(screen.getByTestId('club-input-city'), { target: { value: 'Nice' } });
        fireEvent.change(screen.getByTestId('club-input-country'), { target: { value: 'France' } });
        fireEvent.change(screen.getByTestId('club-input-address'), { target: { value: '12 Promenade du Port, Antibes' } });
        // Laisser l'URL vide -> génère automatiquement la Page Club Officielle Offerte (/tournaments/clubs/...)
        fireEvent.click(screen.getByTestId('submit-club-confirm-btn'));

        // Le club fraîchement créé apparaît immédiatement dans la liste et sur la carte avec son badge Page Offerte
        const matches = await screen.findAllByText(/Riviera Backgammon Club Antibes/i);
        expect(matches.length).toBeGreaterThanOrEqual(1);
        expect(screen.getByTestId('club-detail-panel').textContent).toContain('Riviera Backgammon Club Antibes');
    });

    it('applique le cadrage Monde complet, zéro coordonnée GPS brute, boutons Site Officiel et Jouer au Salon en ligne, et la navbar principale', () => {
        renderHub();

        // 1. Navigation principale
        expect(screen.getByTestId('app-navbar')).toBeDefined();

        // 2. Cadrage par défaut de la carte sur le Monde complet (scale >= 1.0)
        const viewport = screen.getByTestId('interactive-world-map-viewport');
        expect(viewport).toBeDefined();
        expect(parseFloat(viewport.getAttribute('data-zoom') || '1')).toBeGreaterThanOrEqual(1.0);

        // 3. Fiche club côte-à-côte : zéro coordonnée GPS brute et boutons d'action concrets
        const panel = screen.getByTestId('club-detail-panel');
        expect(panel.textContent).toContain('Paris, France');
        expect(panel.textContent).not.toContain('48.87°');
        expect(panel.textContent).not.toContain('2.29°');

        const officialSiteBtn = screen.getByTestId('club-official-site-btn');
        const playOnlineBtn = screen.getByTestId('club-play-online-btn');
        expect(officialSiteBtn.textContent.toLowerCase()).toContain('site officiel');
        expect(playOnlineBtn.textContent.toLowerCase()).toContain('jouer au salon');
    });
});
