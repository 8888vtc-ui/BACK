'use client';

/**
 * @file src/components/drills/BlunderDrillView.tsx
 * @description Orchestrateur modulaire du Quiz ER / PR et du Carnet de Blunders Personnels (<= 50 lignes, 0 any, 0 emoji).
 * Loi 1 : Tout Joueur Invité (`!authenticStats.isAuthenticated`) est bloqué en amont par `PersonalBlundersGuestLockView`.
 */

import React from 'react';
import { useAuthenticPlayerStats } from '../../hooks/useAuthenticPlayerStats';
import PersonalBlundersGuestLockView from './PersonalBlundersGuestLockView';
import BlunderDrillActiveSession from './BlunderDrillActiveSession';
import type { QuizDrillMode } from './DrillHeader';

export interface BlunderDrillViewProps {
    readonly initialConceptId?: string;
    readonly initialMode?: QuizDrillMode;
    readonly onClose?: () => void;
}

export default function BlunderDrillView(props: BlunderDrillViewProps) {
    const authenticStats = useAuthenticPlayerStats();
    if (!authenticStats.isAuthenticated) {
        return <PersonalBlundersGuestLockView featureMode="quizzes" onUnlockedSuccess={authenticStats.refreshStats} />;
    }
    return <BlunderDrillActiveSession {...props} />;
}
