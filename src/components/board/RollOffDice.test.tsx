import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { RollOffDice } from './RollOffDice';

describe('RollOffDice', () => {
    it('affiche des placeholders quand les dés ne sont pas lancés', () => {
        const html = renderToStaticMarkup(
            <RollOffDice xDie={null} oDie={null} onRollOff={() => { }} />,
        );
        expect(html).toContain('?');
    });

    it('affiche les valeurs des dés quand lancés', () => {
        const html = renderToStaticMarkup(
            <RollOffDice xDie={5} oDie={3} onRollOff={() => { }} />,
        );
        expect(html).toContain('Dé de X');
        expect(html).toContain('Dé de O');
    });

    it('affiche le bouton Lancer', () => {
        const html = renderToStaticMarkup(
            <RollOffDice xDie={null} oDie={null} onRollOff={() => { }} />,
        );
        expect(html).toContain('Lancer');
    });

    it('expose un data-testid roll-off-dice', () => {
        const html = renderToStaticMarkup(
            <RollOffDice xDie={null} oDie={null} onRollOff={() => { }} />,
        );
        expect(html).toContain('roll-off-dice');
    });
});
