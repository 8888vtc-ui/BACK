'use client';

/**
 * @file src/components/board/LandscapeHint.tsx
 * @description Composant neutralisé suite à la refonte Mobile-First Portrait Thumb-Dock (100dvh).
 * Le plateau s'adapte désormais nativement en portrait comme en paysage sans bannière intrusive.
 */

import React from 'react';

/** Clé de persistance historique du masquage de la bannière. */
export const LANDSCAPE_HINT_DISMISS_KEY = 'backgammon_landscape_hint_dismissed';

/** Media query de détection du mobile en portrait. */
export const LANDSCAPE_HINT_QUERY = '(orientation: portrait) and (max-width: 767px)';

const LandscapeHintComponent: React.FC = () => null;

export const LandscapeHint = React.memo(LandscapeHintComponent);

export default LandscapeHint;
