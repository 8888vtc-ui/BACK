// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { CoachDiagnosticBox } from './CoachDiagnosticBox';

describe('CoachDiagnosticBox', () => {
    afterEach(() => {
        cleanup();
    });

    it('affiche le diagnostic tactique et le résumé du Grand-Maître', () => {
        render(
            <CoachDiagnosticBox
                tacticalSummary="Abandon du point 20 laissant 2 blots"
                summary="Erreur de tempo majeure"
                whyFailed="Le coup joué fragilise l'ancre défensive."
                whyOptimal="Le coup optimal sécurise le Golden Point."
                keyConcept="Golden Point"
            />,
        );

        expect(screen.getByText('Abandon du point 20 laissant 2 blots')).toBeDefined();
        expect(screen.getByText('Erreur de tempo majeure')).toBeDefined();
        expect(screen.getByText("Le coup joué fragilise l'ancre défensive.")).toBeDefined();
        expect(screen.getByText('Le coup optimal sécurise le Golden Point.')).toBeDefined();
        expect(screen.getByText('Golden Point')).toBeDefined();
    });

    it('rend le badge de concept interactif et déclenche onOpenKnowledgeConcept au clic', () => {
        const onOpenKnowledgeConcept = vi.fn();
        render(
            <CoachDiagnosticBox
                tacticalSummary="Formation d'une prime de 5 points"
                keyConcept="Prime 5"
                conceptId="prime_building"
                onOpenKnowledgeConcept={onOpenKnowledgeConcept}
            />,
        );

        const badgeBtn = screen.getByTestId('coach-concept-badge-btn');
        expect(badgeBtn).toBeDefined();
        fireEvent.click(badgeBtn);

        expect(onOpenKnowledgeConcept).toHaveBeenCalledWith('prime_building');
    });

    it('retourne null quand aucun contenu nest disponible et quil ny a pas de streaming', () => {
        const { container } = render(<CoachDiagnosticBox isStreaming={false} />);
        expect(container.firstChild).toBeNull();
    });

    it('permet de basculer en 1 clic entre le mode Débutant (Simple) et le mode Pro (Technique) sans double signe moins', () => {
        render(
            <CoachDiagnosticBox
                summary="Pion isolé exposé"
                explanation="Analyse technique Michy / Magriel / Woolsey."
                symbolicAudit={{
                    player_pip: 142,
                    opponent_pip: 155,
                    direct_shots_conceded: 6,
                    blunder_delta_equity: -0.125,
                    dominant_theme: 'PRIME',
                }}
            />,
        );
        const funBtn = screen.getByTestId('coach-level-fun-btn');
        const proBtn = screen.getByTestId('coach-level-pro-btn');
        expect(funBtn.getAttribute('aria-pressed')).toBe('true');
        expect(screen.getByTestId('coach-symbolic-telemetry').textContent).toContain('6 dés sur 36 vous frappent');
        expect(screen.getByTestId('coach-symbolic-telemetry').textContent).toContain('% de victoire perdus');

        fireEvent.click(proBtn);
        expect(proBtn.getAttribute('aria-pressed')).toBe('true');
        const telemetryPro = screen.getByTestId('coach-symbolic-telemetry').textContent ?? '';
        expect(telemetryPro).toContain('ΔEq -0.125');
        expect(telemetryPro).not.toContain('--0.125');
        expect(screen.getByTestId('coach-emotional-verdict').textContent).toContain('Blunder (??)');
    });

    it('décerne le badge dopaminergique ✨ Coup Brillant (!!) pour un coup audacieux validé par le 3-ply (0.000 EMG loss avec risque pris)', () => {
        render(
            <CoachDiagnosticBox
                summary="Coup audacieux"
                equityLoss={0}
                symbolicAudit={{
                    player_pip: 130,
                    opponent_pip: 140,
                    direct_shots_conceded: 2,
                    blunder_delta_equity: 0,
                    dominant_theme: 'BLITZ',
                }}
            />,
        );
        expect(screen.getByTestId('coach-emotional-verdict').textContent).toContain('✨ Coup Brillant (!!)');
    });

    it('affiche les puces Zéro-Jargon (< 3 s) et les 3 boutons capsules 2 mots (Voir danger, Voir idée, Réessayer) en mode Débutant', () => {
        const onRetryMove = vi.fn();
        window.localStorage.setItem('bg_experience_mode_v1', 'fun');
        render(
            <CoachDiagnosticBox
                summary="Gaffe"
                equityLoss={0.092}
                recurringErrorCount={4}
                onRetryMove={onRetryMove}
                symbolicAudit={{
                    player_pip: 140,
                    opponent_pip: 132,
                    direct_shots_conceded: 14,
                    blunder_delta_equity: -0.092,
                    dominant_theme: 'BLITZ',
                }}
            />,
        );

        const bullets = screen.getByTestId('coach-bilevel-bullets');
        expect(bullets.textContent).toContain('Ce pion isolé donne 14 lancers sur 36 pour te frapper.');
        expect(bullets.textContent).toContain('Prends plutôt la case 5 pour bâtir un mur.');
        expect(bullets.textContent).toContain("4e erreur similaire cette semaine");

        const dangerBtn = screen.getByTestId('coach-cta-danger-btn');
        const ideaBtn = screen.getByTestId('coach-cta-idea-btn');
        const retryBtn = screen.getByTestId('coach-cta-retry-btn');
        expect(dangerBtn.textContent).toBe('Voir danger');
        expect(ideaBtn.textContent).toBe('Voir idée');
        expect(retryBtn.textContent).toBe('Réessayer');

        fireEvent.click(retryBtn);
        expect(onRetryMove).toHaveBeenCalledTimes(1);
    });

    it('affiche le plateau interactif Débutant, permet de toucher une case et de simuler le coup Avant/Après sur le plateau', () => {
        window.localStorage.setItem('bg_experience_mode_v1', 'fun');
        const initialBoard = new Array<number>(26).fill(0);
        initialBoard[8] = 3;
        initialBoard[6] = 5;
        initialBoard[13] = 5;
        initialBoard[24] = 2;

        render(
            <CoachDiagnosticBox
                summary="Oubli de la Porte d'Or"
                equityLoss={0.085}
                playedMove="13/10 13/12"
                optimalMove="8/5 6/5"
                board={initialBoard}
                dice={[3, 1]}
                symbolicAudit={{
                    player_pip: 167,
                    opponent_pip: 167,
                    direct_shots_conceded: 11,
                    blunder_delta_equity: -0.085,
                    dominant_theme: 'PRIME',
                }}
            />,
        );

        const interactiveBoard = screen.getByTestId('coach-beginner-interactive-board');
        expect(interactiveBoard).toBeDefined();

        // Clic sur la case 5 du MiniBoardDiagram
        const point5 = screen.getByTestId('mini-board-point-5');
        fireEvent.click(point5);

        const pointFeedback = screen.getByTestId('coach-board-point-feedback');
        expect(pointFeedback.textContent).toContain('Bien vu ! La case 5 est la cible clé du coup de Maître');

        // Bouton Avant/Après sur le plateau
        const simBtn = screen.getByTestId('coach-board-sim-toggle-btn');
        expect(simBtn.textContent).toContain('Revoir avant le coup');
        fireEvent.click(simBtn);
        expect(simBtn.textContent).toContain('Simuler le coup sur le plateau');
    });
});
