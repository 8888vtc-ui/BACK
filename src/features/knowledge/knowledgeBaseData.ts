import { TheoryConcept } from './types';
import rawConcepts from './knowledgeBaseData.json';

/**
 * Base de données exhaustive de théorie et de données stratégiques de Backgammon.
 * Sources fiables et vérifiées :
 * - Backgammon Galore (Tom Keith, bkgm.com)
 * - Paul Magriel ("Backgammon", la Bible du jeu)
 * - Walter Trice ("Backgammon Boot Camp")
 * - Kit Woolsey ("Backgammon: Pure and Simple", "The Doubling Cube")
 * - Bill Robertie ("Modern Backgammon", "501 Essential Backgammon Problems")
 * - Académie Royale Monte-Carlo (Viktor Orlov & Maître Kenji Sato)
 * - Neil Kazaross (Kazaross-XG2 Match Equity Table, Règle 8912, Neil's Numbers)
 * Données statiques externalisées conformément à SCALABILITY.md (R1).
 */
export const KNOWLEDGE_BASE_CONCEPTS: TheoryConcept[] = rawConcepts as TheoryConcept[];

/**
 * Recherche et consultation dans la base de connaissances.
 */
export function getTheoryConceptById(id: string): TheoryConcept | undefined {
    return KNOWLEDGE_BASE_CONCEPTS.find((c) => c.id === id || c.slug === id);
}

export function searchTheoryConcepts(query: string, language: 'fr' | 'en' = 'fr'): TheoryConcept[] {
    const q = query.trim().toLowerCase();
    if (!q) return KNOWLEDGE_BASE_CONCEPTS;

    return KNOWLEDGE_BASE_CONCEPTS.filter((c) => {
        const title = c.title[language].toLowerCase();
        const summary = c.summary[language].toLowerCase();
        const author = c.author.toLowerCase();
        const tags = c.tags.map((t) => t.toLowerCase());

        return (
            title.includes(q) ||
            summary.includes(q) ||
            author.includes(q) ||
            tags.some((t) => t.includes(q))
        );
    });
}

export function getTheoryConceptsByCategory(category: string): TheoryConcept[] {
    if (category === 'all') return KNOWLEDGE_BASE_CONCEPTS;
    return KNOWLEDGE_BASE_CONCEPTS.filter((c) => c.category === category);
}
