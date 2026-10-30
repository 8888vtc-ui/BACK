import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import HudScoreboard from './HudScoreboard';

describe('HudScoreboard Component', () => {
    it('affiche les scores de Vous et IA sans jargon X/O et met en évidence le joueur au tour', () => {
        const html = renderToStaticMarkup(
            <HudScoreboard
                matchLength={7}
                scoreX={3}
                scoreO={2}
                turn="X"
                dice={null}
                usedDice={[false, false]}
            />,
        );
        expect(html).toContain('Match 7 pts');
        expect(html).toContain('>Vous<');
        expect(html).toContain('>IA<');
        expect(html).toContain('Vous (Blanc)');
        expect(html).toContain('IA (Noir)');
        expect(html).not.toContain('X (Vous - Blanc)');
        expect(html).toContain('>3<');
        expect(html).toContain('>2<');
        expect(html).toContain('ring-[#f3c65f]/70');
    });

    it('affiche le badge Crawford si actif', () => {
        const html = renderToStaticMarkup(
            <HudScoreboard
                matchLength={7}
                scoreX={6}
                scoreO={2}
                turn="O"
                crawford={true}
                dice={[3, 1]}
                usedDice={[false, false]}
            />,
        );
        expect(html).toContain('Crawford');
    });

    it('affiche les badges PR en direct pour les deux joueurs', () => {
        const html = renderToStaticMarkup(
            <HudScoreboard
                matchLength={5}
                scoreX={1}
                scoreO={0}
                turn="X"
                dice={null}
                usedDice={[false, false]}
                prX={4.2}
                prO={12.7}
            />,
        );
        expect(html).toContain('data-testid="hud-player-x-pr"');
        expect(html).toContain('data-testid="hud-player-o-pr"');
        expect(html).toContain('PR 4.2');
        expect(html).toContain('PR 12.7');
        // PR ≤ 7 → ambre, PR > 7 → rouge.
        expect(html).toContain('text-amber-300');
        expect(html).toContain('text-rose-300');
    });

    it('affiche les pip counts des deux joueurs', () => {
        const html = renderToStaticMarkup(
            <HudScoreboard
                matchLength={7}
                scoreX={0}
                scoreO={0}
                turn="X"
                dice={null}
                usedDice={[false, false]}
                pipX={148}
                pipO={153}
            />,
        );
        expect(html).toContain('148 pips');
        expect(html).toContain('153 pips');
    });

    it('affiche le joueur humain en Noir quand il choisit les Noirs (couleur visuelle)', () => {
        const html = renderToStaticMarkup(
            <HudScoreboard
                matchLength={7}
                scoreX={0}
                scoreO={0}
                turn="X"
                dice={null}
                usedDice={[false, false]}
                playerColor="O"
            />,
        );
        expect(html).toContain('Vous (Noir)');
        expect(html).toContain('IA (Blanc)');
        expect(html).not.toContain('Vous (Blanc)');
    });

    it('affiche l’EPC en infobulle de pip count lorsque la course est pure', () => {
        const html = renderToStaticMarkup(
            <HudScoreboard
                matchLength={5}
                scoreX={2}
                scoreO={1}
                turn="X"
                dice={null}
                usedDice={[false, false]}
                pipX={45}
                pipO={52}
                epcX={51.2}
                epcO={58.6}
                isPureRace={true}
            />,
        );
        expect(html).toContain('title="Pip count : 45 pips | EPC: 51.2"');
        expect(html).toContain('title="Pip count : 52 pips | EPC: 58.6"');
    });

    it('adapte l’affichage du scoreboard aux 3 couches Caméléon (0: masqué sans PR, 1: différentiel Course ±, 2: score n-away)', () => {
        const htmlLayer0 = renderToStaticMarkup(
            <HudScoreboard
                matchLength={7} scoreX={4} scoreO={2} turn="X"
                dice={null} usedDice={[false, false]} pipX={69} pipO={79} prX={16.2}
                chameleonLayer={0}
            />,
        );
        expect(htmlLayer0).not.toContain('data-testid="hud-player-x-pip"');
        expect(htmlLayer0).not.toContain('data-testid="hud-player-x-pr"');

        const htmlLayer1 = renderToStaticMarkup(
            <HudScoreboard
                matchLength={7} scoreX={4} scoreO={2} turn="X"
                dice={null} usedDice={[false, false]} pipX={69} pipO={79} prX={8.4}
                chameleonLayer={1}
            />,
        );
        expect(htmlLayer1).toContain('Course : +10');
        expect(htmlLayer1).toContain('Course : -10');

        const htmlLayer2 = renderToStaticMarkup(
            <HudScoreboard
                matchLength={7} scoreX={4} scoreO={2} turn="X"
                dice={null} usedDice={[false, false]} pipX={69} pipO={79} prX={3.1}
                chameleonLayer={2}
            />,
        );
        expect(htmlLayer2).toContain('3-away, 5-away');
        expect(htmlLayer2).toContain('69 pips');
    });

    it('expose les déclencheurs interactifs pour basculer le score en format X-Away (XG2) au clic ou clic droit', () => {
        const html = renderToStaticMarkup(
            <HudScoreboard
                matchLength={7}
                scoreX={3}
                scoreO={2}
                turn="X"
                dice={null}
                usedDice={[false, false]}
            />,
        );
        expect(html).toContain('data-testid="hud-player-x-score"');
        expect(html).toContain('data-testid="hud-player-o-score"');
        expect(html).toContain('Away Score (XG2)');
    });
});
