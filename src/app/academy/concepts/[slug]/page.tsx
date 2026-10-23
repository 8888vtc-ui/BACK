/**
 * Page SEO Programmatique dédiée à chacun des 21 Concepts Stratégiques (`/academy/concepts/[slug]`).
 * Générée statiquement via `generateStaticParams()` pour une compatibilité 100 % SSR + Export Statique Capacitor.
 */

import React from 'react';
import type { Metadata } from 'next';
import { KNOWLEDGE_BASE_CONCEPTS } from '../../../../features/knowledge/knowledgeBaseData';
import ConceptDetailView from '../../../../components/academy/ConceptDetailView';

export function generateStaticParams(): Array<{ slug: string }> {
    return KNOWLEDGE_BASE_CONCEPTS.map((concept) => ({
        slug: concept.slug,
    }));
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const concept = KNOWLEDGE_BASE_CONCEPTS.find((c) => c.slug === slug) ?? KNOWLEDGE_BASE_CONCEPTS[0];

    return {
        title: `${concept.title.fr} (${concept.author}) — Théorie Backgammon & Gammon Academy`,
        description: `${concept.summary.fr} Règle d’or : ${concept.goldenRule.fr} (${concept.title.en})`,
        keywords: [...concept.tags, concept.author, 'Backgammon Tour', 'Gammon Academy'],
        alternates: {
            canonical: `/academy/concepts/${concept.slug}`,
            languages: {
                'fr-FR': `/academy/concepts/${concept.slug}`,
                'en-US': `/academy/concepts/${concept.slug}?lang=en`,
                'es-ES': `/academy/concepts/${concept.slug}?lang=es`,
                'pt-BR': `/academy/concepts/${concept.slug}?lang=pt`,
                'de-DE': `/academy/concepts/${concept.slug}?lang=de`,
                'ar-SA': `/academy/concepts/${concept.slug}?lang=ar`,
            },
        },
    };
}

export default async function ConceptDetailPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<React.ReactElement> {
    const { slug } = await params;
    return <ConceptDetailView slug={slug} />;
}
