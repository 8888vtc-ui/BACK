/**
 * Types pour la Base de Connaissances Théorique et Stratégique Grand-Maître de Backgammon.
 * Références aux théories de Paul Magriel, Walter Trice, Kit Woolsey, Bill Robertie,
 * Marc Olsen, Neil Kazaross et Masayuki Mochizuki (Mochy).
 */

export type TheoryCategory =
    | 'fundamentals'   // Principes Fondamentaux (Magriel, Pure Play, Duplication)
    | 'game-plans'    // 5 Plans de Jeu Majeurs (Robertie, Olsen)
    | 'cube-theory'   // Théorie du Videau & Mathématiques (Woolsey, Olsen)
    | 'race-bearoff'  // Course, EPC & Sortie (Trice, Kazaross)
    | 'match-play'    // Match Play & Tables MET (Kazaross-XG)
    | 'openings'      // Ouvertures Modernes (Woolsey & Heinrich)
    | 'rules-of-thumb'; // Maximes & Règles d'or de Grand-Maître (Mochy, Falafel)

export type TheoryDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'master';

export interface ExternalSourceReference {
    title: string;
    author: string;
    type: 'book' | 'article' | 'table' | 'website';
    url?: string;
    details?: string;
}

export interface TheoryConcept {
    id: string;
    slug: string;
    category: TheoryCategory;
    title: {
        fr: string;
        en: string;
    };
    author: string; // Ex: "Paul Magriel", "Walter Trice", "Kit Woolsey", "Marc Olsen", "Neil Kazaross"
    difficulty: TheoryDifficulty;
    tags: string[];
    summary: {
        fr: string;
        en: string;
    };
    keyTakeaway: {
        fr: string;
        en: string;
    };
    explanation: {
        fr: string[];
        en: string[];
    };
    formulaOrRule?: {
        name: string;
        formula?: string;
        explanation: {
            fr: string;
            en: string;
        };
    };
    practicalExamples: {
        positionDesc: { fr: string; en: string };
        bestPlay: string;
        reasoning: { fr: string; en: string };
    }[];
    goldenRule: {
        fr: string;
        en: string;
    };
    sources: ExternalSourceReference[];
}
