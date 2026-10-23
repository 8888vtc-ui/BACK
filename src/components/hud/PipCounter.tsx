'use client';

/**
 * Alias de composant `PipCounter` pour l'Audit 10 / 20 (Lisibilité du Pip Count & Différentiel Dynamique).
 */

export {
    PipCountBadge as PipCounter,
    PipCountBadge,
    type PipCountBadgeProps as PipCounterProps,
    type PipCountBadgeProps,
    computePipDiff,
    isLeading,
    getRaceStrategicAdvice,
    getSavedPipCountVisibility,
} from '../board/PipCountBadge';
export { PipCountBadge as default } from '../board/PipCountBadge';
