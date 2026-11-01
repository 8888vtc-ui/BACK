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
        expect(screen.getAllByText(/Monte-Carlo Backgammon World Championship/i).length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText(/Paris Masters Backgammon FFB/i).length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText(/Riviera Cup Nice/i).length).toBeGreaterThanOrEqual(1);

        // Filtre MEGA uniquement
        fireEvent.click(screen.getByTestId('filter-tier-mega'));
        expect(screen.getAllByText(/Monte-Carlo Backgammon World Championship/i).length).toBeGreaterThanOrEqual(1);
        expect(screen.queryByText(/Riviera Cup Nice/i)).toBeNull();

        // Filtre MOYEN uniquement
        fireEvent.click(screen.getByTestId('filter-tier-moyen'));
        expect(screen.getAllByText(/Riviera Cup Nice/i).length).toBeGreaterThanOrEqual(1);
        expect(screen.queryByText(/Monte-Carlo Backgammon World Championship/i)).toBeNull();
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
        expect(screen.getAllByText(/Page Club Officielle hébergée et offerte/i).length).toBeGreaterThanOrEqual(1);
    });

    it('applique le protocole Elon Musk : hémisphère Nord (lat 38, lng 10, zoom 2.4), zéro coordonnée GPS brute, CTA S’entraîner en Or prioritaire et bouton JOUER CONTRE LE COACH IA dans la navbar', () => {
        renderHub();

        // 1. Pont d'acquisition Time-to-Fun < 3s dans la navbar supérieure à droite
        const playCoachCta = screen.getByTestId('navbar-play-coach-cta') as HTMLAnchorElement;
        expect(playCoachCta).toBeDefined();
        expect(playCoachCta.textContent).toContain('JOUER CONTRE LE COACH IA');
        expect(playCoachCta.getAttribute('href')).toContain('matchLength=7');

        // 2. Recadrage par défaut de la carte sur l'hémisphère Nord (lat: 38, lng: 10, zoom: 2.4)
        const viewport = screen.getByTestId('interactive-world-map-viewport');
        expect(viewport.getAttribute('data-center-lat')).toBe('38');
        expect(viewport.getAttribute('data-center-lng')).toBe('10');
        expect(viewport.getAttribute('data-zoom')).toBe('2.4');

        // 3. Fiche club (popup) : zéro coordonnée GPS brute (48.87°, 2.29°) et CTA "S'entraîner" primaire en Or (#D4AF37) à gauche
        const popup = screen.getByTestId('map-floating-popup');
        expect(popup.textContent).toContain('Paris, France');
        expect(popup.textContent).not.toContain('48.87°');
        expect(popup.textContent).not.toContain('2.29°');

        const trainBtn = screen.getByTestId('map-popup-train-btn');
        const detailBtn = screen.getByTestId('map-popup-action-btn');
        expect(trainBtn.className).toContain('from-[#D4AF37]');
        expect(trainBtn.compareDocumentPosition(detailBtn) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });
});
