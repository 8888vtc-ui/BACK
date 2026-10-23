/**
 * Page SEO Programmatique dédiée à chacun des 15 Rouleaux d'Ouverture (`/academy/openings/[roll]`).
 * Générée statiquement via `generateStaticParams()` pour une compatibilité 100 % SSR + Export Statique Capacitor.
 */

import React from 'react';
import type { Metadata } from 'next';
import { OPENING_ROLLS_15 } from '../../../../features/academy/academyData';
import OpeningRollDetailView from '../../../../components/academy/OpeningRollDetailView';

export function generateStaticParams(): Array<{ roll: string }> {
    return OPENING_ROLLS_15.map((entry) => ({
        roll: entry.roll,
    }));
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ roll: string }>;
}): Promise<Metadata> {
    const { roll } = await params;
    const entry = OPENING_ROLLS_15.find((item) => item.roll === roll) ?? OPENING_ROLLS_15[0];

    return {
        title: `Ouverture ${entry.roll} au Backgammon (${entry.optimalMove}) — Équité 3-Ply ${entry.equity3Ply}`,
        description: `${entry.nickname.fr} (${entry.nickname.en}) : pourquoi ${entry.optimalMove} est le coup optimal sur ${entry.roll} (${entry.equity3Ply} équité 3-Ply, ${entry.winPct} gain). ${entry.strategicNote.fr}`,
        alternates: {
            canonical: `/academy/openings/${entry.roll}`,
            languages: {
                'fr-FR': `/academy/openings/${entry.roll}`,
                'en-US': `/academy/openings/${entry.roll}?lang=en`,
                'es-ES': `/academy/openings/${entry.roll}?lang=es`,
                'pt-BR': `/academy/openings/${entry.roll}?lang=pt`,
                'de-DE': `/academy/openings/${entry.roll}?lang=de`,
                'ar-SA': `/academy/openings/${entry.roll}?lang=ar`,
            },
        },
    };
}

export default async function OpeningRollDetailPage({
    params,
}: {
    params: Promise<{ roll: string }>;
}): Promise<React.ReactElement> {
    const { roll } = await params;
    return <OpeningRollDetailView roll={roll} />;
}
