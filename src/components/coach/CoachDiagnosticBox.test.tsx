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
});
