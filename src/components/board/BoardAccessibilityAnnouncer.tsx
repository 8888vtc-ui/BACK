'use client';

/**
 * Annonceur d'accessibilité en direct pour le plateau de Backgammon (WCAG 2.1 AA).
 * Rôle : Notifie les lecteurs d'écran des changements de tour, dés et videau.
 * Composant isolé et mémoïsé (React.memo).
 */

import React from 'react';
import { type Player } from '../../engine/backgammonEngine';
import { useI18n } from '../../lib/i18n';

export interface BoardAccessibilityAnnouncerProps {
    player: Player;
    dice: readonly [number, number] | null;
    doublingOfferedBy: Player | null;
    cubeValue: number;
}

const BoardAccessibilityAnnouncerComponent: React.FC<BoardAccessibilityAnnouncerProps> = ({
    player,
    dice,
    doublingOfferedBy,
    cubeValue,
}) => {
    const { t } = useI18n();

    return (
        <>
            <div aria-live="polite" aria-atomic="true" className="sr-only" data-testid="board-accessibility-announcer">
                {t('hud.turn', { player })}
                {dice ? `. ${t('engine.diceRolled', { player, d1: dice[0], d2: dice[1] })}` : ''}
                {doublingOfferedBy ? `. ${t('engine.doubleOffered', { player: doublingOfferedBy, val: cubeValue })}` : ''}
            </div>
            <div aria-label="Raccourcis clavier du plateau" className="sr-only">
                Flèches directionnelles pour naviguer, Entrée pour sélectionner, 1 et 2 pour changer de dé, Échap pour désélectionner.
            </div>
        </>
    );
};

export const BoardAccessibilityAnnouncer = React.memo(BoardAccessibilityAnnouncerComponent);
export default BoardAccessibilityAnnouncer;
