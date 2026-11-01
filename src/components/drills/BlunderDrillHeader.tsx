'use client';

/**
 * @file src/components/drills/BlunderDrillHeader.tsx
 * @description Façade de ré-export vers `DrillHeader` pour compatibilité ascendante des imports.
 * Strictement < 30 lignes, 0 `any` (GOVERNANCE.md & SCALABILITY.md).
 */

import DrillHeader, {
    DrillHeader as NamedDrillHeader,
    type DrillHeaderProps,
    type QuizDrillMode,
} from './DrillHeader';

export type { QuizDrillMode };
export type BlunderDrillHeaderProps = DrillHeaderProps;
export const BlunderDrillHeader = NamedDrillHeader;
export default DrillHeader;
