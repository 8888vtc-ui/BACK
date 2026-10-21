/**
 * Squelette de chargement du plateau (boiserie + feutrine pulsante).
 * Extrait de `Board.tsx` (LOI 5 : composants ≤ 300 lignes).
 */

import React from 'react';

export const BoardSkeleton: React.FC = () => (
    <div className="h-full w-full max-w-6xl mx-auto select-none">
        <div className="h-full rounded-3xl p-3 sm:p-5 shadow-2xl bg-gradient-to-b from-[#4a2a16] via-[#3a2010] to-[#2b170c]">
            <div className="h-full rounded-2xl bg-[radial-gradient(circle_at_50%_45%,#145337_0%,#0b3824_65%,#051c12_100%)] p-2 sm:p-3 animate-pulse" />
        </div>
    </div>
);

export default BoardSkeleton;
