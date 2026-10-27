/**
 * Moteur d'agrégation des statistiques joueur et d'analyse des concepts faibles.
 *
 * Calcule :
 * - Le taux d'erreur (Error Rate / Average Equity Loss) et le Performance Rating (PR)
 * - La matrice de maîtrise des concepts stratégiques fondamentaux du Backgammon
 * - Les concepts faibles prioritaires à travailler avec recommandations pédagogiques
 */

import { getAllRecords } from '../offline/idb';
import type {
    LocalGameRecord,
    LocalMoveRecord,
    LocalCoachExplanationRecord,
    LocalRecurrentMistakeRecord,
} from '../offline/persistenceService';
import type { RecurringErrorRecord } from '../supabase/types';
import { getPRCategory as getPRCategoryFromRating } from '../../features/rating/ratingCalculator';

export interface ConceptMetric {
    id: string;
    name: string;
    category: 'Sécurité & Blots' | 'Course & Pips' | 'Structure & Prime' | 'Ancre & Portes' | 'Videau & Score';
    errorCount: number;
    blunderCount: number;
    totalEquityLoss: number;
    masteryScore: number; // 0 à 100%
    priority: 'high' | 'medium' | 'low';
    recommendation: string;
    description: string;
}

export interface PlayerProgressionStats {
    totalGamesPlayed: number;
    totalGamesWon: number;
    winRate: number; // 0 à 100%
    totalGammonsWon: number;
    totalBackgammonsWon: number;
    totalMovesEvaluated: number;
    totalBlunders: number;
    totalDoubtful: number;
    totalEquityLoss: number;
    averageErrorRate: number; // Perte d'équité moyenne par décision
    performanceRating: number; // PR officiel (équivalent GNU / XG)
    prCategory: 'Grand-Maître' | 'Maître' | 'Expert' | 'Avancé' | 'Intermédiaire' | 'Débutant';
    concepts: ConceptMetric[];
    weakestConcepts: ConceptMetric[]; // Top concepts nécessitant du travail
    recentExplanations: LocalCoachExplanationRecord[];
}

export const STRATEGIC_CONCEPTS_CATALOG: Array<Omit<ConceptMetric, 'errorCount' | 'blunderCount' | 'totalEquityLoss' | 'masteryScore' | 'priority'>> = [
    {
        id: 'blot_safety',
        name: 'Minimisation des tirs & Sécurité des blots',
        category: 'Sécurité & Blots',
        description: 'Exposition non nécessaire de pions vulnérables face à un jan intérieur solide adverse.',
        recommendation: 'Comptez systématiquement le nombre de tirs directs (1 à 6) et indirects avant de disperser vos pions.',
    },
    {
        id: 'race_management',
        name: 'Règle de course en avance (Pip Count)',
        category: 'Course & Pips',
        description: 'Refus de rompre le contact ou dispersion inutile lorsqu\'on mène nettement à la course.',
        recommendation: 'Dès que vous avez plus de 8-10 pips d\'avance, fuyez le contact et ne cherchez plus la confrontation.',
    },
    {
        id: 'golden_point',
        name: 'Contrôle du Golden Point (Porte 5 / 20)',
        category: 'Ancre & Portes',
        description: 'Sous-évaluation du Point 5, la porte maîtresse de l\'attaque et du jan intérieur.',
        recommendation: 'Faire ou bloquer le Point 5 (flèche 5 pour X, flèche 20 pour O) doit être votre priorité dès l\'ouverture.',
    },
    {
        id: 'prime_building',
        name: 'Construction & Maintien de Prime',
        category: 'Structure & Prime',
        description: 'Démantèlement prématuré d\'un barrage de portes consécutives au lieu de verrouiller l\'adversaire.',
        recommendation: 'Une prime de 4 à 6 portes paralyse l\'adversaire : privilégiez son extension plutôt que d\'avancer seul.',
    },
    {
        id: 'advanced_anchor',
        name: 'Ancre avancée en jan adverse',
        category: 'Ancre & Portes',
        description: 'Négligence de la création d\'une ancre solide sur les flèches 20, 21 ou 22.',
        recommendation: 'Une ancre avancée empêche le blitz adverse et garantit une rentrée sereine en cas de frappe.',
    },
    {
        id: 'cube_score',
        name: 'Décisions de Videau & Gestion de Score',
        category: 'Videau & Score',
        description: 'Erreurs de double ou de prise de videau sans respecter la MET ou les régimes DMP/Crawford.',
        recommendation: 'Consultez le seuil de prise (Take Point) et n\'oubliez jamais qu\'à DMP, les gammons ne comptent pas.',
    },
];

/**
 * Associe un texte d'explication ou un concept clé à un identifiant du catalogue.
 */
export function categorizeExplanation(keyConcept?: string | null, text?: string | null): string {
    const combined = `${keyConcept || ''} ${text || ''}`.toLowerCase();

    if (combined.includes('tir') || combined.includes('blot') || combined.includes('exposition') || combined.includes('vulnérable')) {
        return 'blot_safety';
    }
    if (combined.includes('course') || combined.includes('pip') || combined.includes('avance')) {
        return 'race_management';
    }
    if (combined.includes('golden') || combined.includes('point 5') || combined.includes('porte 5')) {
        return 'golden_point';
    }
    if (combined.includes('prime') || combined.includes('barrage') || combined.includes('mur')) {
        return 'prime_building';
    }
    if (combined.includes('ancre') || combined.includes('anchor')) {
        return 'advanced_anchor';
    }
    if (combined.includes('videau') || combined.includes('cube') || combined.includes('dmp') || combined.includes('crawford') || combined.includes('met')) {
        return 'cube_score';
    }

    return 'blot_safety'; // Catégorie par défaut
}

/**
 * Évalue la catégorie PR en fonction du score PR (GNU / XG standard).
 *
 * Source de vérité unique : [`getPRCategory`](src/features/rating/ratingCalculator.ts:61).
 * Réexporté ici pour préserver la compatibilité des imports existants.
 */
export const getPRCategory = getPRCategoryFromRating;

/**
 * Calcule l'agrégation complète des statistiques joueur depuis IndexedDB et l'historique.
 */
export async function aggregateUserStats(): Promise<PlayerProgressionStats> {
    const games = await getAllRecords<LocalGameRecord>('games');
    const moves = await getAllRecords<LocalMoveRecord>('moves');
    const explanations = await getAllRecords<LocalCoachExplanationRecord>('coach_explanations');

    // 1. Statistiques des parties
    const completedGames = games.filter((g) => g.status === 'completed');
    const totalGamesPlayed = completedGames.length;
    const gamesWon = completedGames.filter((g) => g.winner === 'X');
    const winRate = completedGames.length > 0 ? (gamesWon.length / completedGames.length) * 100 : 50;

    const gammonsWon = gamesWon.filter((g) => g.win_type === 'gammon').length;
    const backgammonsWon = gamesWon.filter((g) => g.win_type === 'backgammon').length;

    // 2. Évaluation des coups et des pertes d'équité
    const movesWithLoss = moves.filter((m) => typeof m.equity_loss === 'number' && m.equity_loss !== null);
    const totalMovesEvaluated = movesWithLoss.length || Math.max(1, explanations.length);

    let totalEquityLoss = 0;
    let totalBlunders = 0;
    let totalDoubtful = 0;

    // Compteurs par concept
    const conceptCounts = new Map<string, { errorCount: number; blunderCount: number; totalEquityLoss: number }>();
    STRATEGIC_CONCEPTS_CATALOG.forEach((c) => {
        conceptCounts.set(c.id, { errorCount: 0, blunderCount: 0, totalEquityLoss: 0 });
    });

    // Agréger depuis les coups
    for (const m of movesWithLoss) {
        const loss = Math.abs(m.equity_loss || 0);
        totalEquityLoss += loss;
        if (m.verdict === 'blunder' || loss >= 0.08) {
            totalBlunders++;
        } else if (m.verdict === 'douteux' || m.verdict === 'doubtful' || loss >= 0.02) {
            totalDoubtful++;
        }
    }

    // Agréger depuis les explications du coach
    for (const exp of explanations) {
        const conceptId = categorizeExplanation(exp.key_concept, `${exp.summary} ${exp.explanation}`);
        const loss = Math.abs(exp.equity_loss || 0.05);
        const isBlunder = exp.verdict === 'blunder' || loss >= 0.08;

        const current = conceptCounts.get(conceptId) || { errorCount: 0, blunderCount: 0, totalEquityLoss: 0 };
        current.errorCount += 1;
        if (isBlunder) current.blunderCount += 1;
        current.totalEquityLoss += loss;
        conceptCounts.set(conceptId, current);

        if (movesWithLoss.length === 0) {
            totalEquityLoss += loss;
            if (isBlunder) totalBlunders++;
            else totalDoubtful++;
        }
    }

    // Calcul du taux d'erreur et du PR
    const decisionsCount = Math.max(1, totalMovesEvaluated);
    const averageErrorRate = Number((totalEquityLoss / decisionsCount).toFixed(4));
    // PR = (equity loss total / décisions) * 500 (formule officielle de Snowie / GNU / eXtreme Gammon)
    const rawPr = averageErrorRate * 500;
    const performanceRating = Number(Math.max(1.5, Math.min(30.0, rawPr || 6.5)).toFixed(1));
    const prCategory = getPRCategory(performanceRating);

    // 3. Matrice de métriques par concept
    const concepts: ConceptMetric[] = STRATEGIC_CONCEPTS_CATALOG.map((base) => {
        const data = conceptCounts.get(base.id) || { errorCount: 0, blunderCount: 0, totalEquityLoss: 0 };
        const loss = Number(data.totalEquityLoss.toFixed(3));
        const mistakes = data.errorCount;

        // Score de maîtrise inversement proportionnel aux fautes commises
        const penalty = mistakes * 15 + loss * 50;
        const masteryScore = Math.max(10, Math.min(100, Math.round(100 - penalty)));

        let priority: 'high' | 'medium' | 'low' = 'low';
        if (mistakes >= 3 || loss >= 0.25 || masteryScore < 60) {
            priority = 'high';
        } else if (mistakes >= 1 || loss >= 0.08 || masteryScore < 80) {
            priority = 'medium';
        }

        return {
            ...base,
            errorCount: mistakes,
            blunderCount: data.blunderCount,
            totalEquityLoss: loss,
            masteryScore,
            priority,
        };
    });

    // Trier les concepts faibles par impact décroissant (perte d'équité + nombre de blunders)
    const weakestConcepts = [...concepts]
        .sort((a, b) => b.totalEquityLoss + b.blunderCount * 0.1 - (a.totalEquityLoss + a.blunderCount * 0.1))
        .filter((c) => c.priority === 'high' || c.errorCount > 0)
        .slice(0, 3);

    // Si le joueur débute et n'a pas encore fait d'erreurs, suggérer les 2 concepts fondamentaux
    if (weakestConcepts.length === 0) {
        weakestConcepts.push(concepts[0], concepts[1]);
    }

    return {
        totalGamesPlayed,
        totalGamesWon: gamesWon.length,
        winRate: Number(winRate.toFixed(1)),
        totalGammonsWon: gammonsWon,
        totalBackgammonsWon: backgammonsWon,
        totalMovesEvaluated: decisionsCount,
        totalBlunders,
        totalDoubtful,
        totalEquityLoss: Number(totalEquityLoss.toFixed(3)),
        averageErrorRate,
        performanceRating,
        prCategory,
        concepts,
        weakestConcepts,
        recentExplanations: explanations.slice(-5).reverse(),
    };
}

/**
 * Agrège les erreurs récurrentes stockées localement dans IndexedDB ('recurrent_mistakes')
 * pour servir de fallback hors-ligne ou invité à `getRecurringErrors` (Supabase).
 */
export async function loadAggregatedLocalRecurringErrors(limit = 5): Promise<RecurringErrorRecord[]> {
    const mistakes = await getAllRecords<LocalRecurrentMistakeRecord>('recurrent_mistakes');
    if (mistakes.length === 0) return [];
    const byConcept = new Map<string, { count: number; totalLoss: number; lastSeen: string }>();
    for (const m of mistakes) {
        const cid = m.category || 'blot_safety';
        const prev = byConcept.get(cid) ?? { count: 0, totalLoss: 0, lastSeen: m.created_at || new Date().toISOString() };
        const loss = Math.abs(Number(m.equity_loss) || 0);
        const lastSeen = m.created_at && m.created_at > prev.lastSeen ? m.created_at : prev.lastSeen;
        byConcept.set(cid, { count: prev.count + 1, totalLoss: Number((prev.totalLoss + loss).toFixed(4)), lastSeen });
    }
    return Array.from(byConcept.entries())
        .map(([conceptId, agg]) => {
            const match = STRATEGIC_CONCEPTS_CATALOG.find((c) => c.id === conceptId || c.id.replace('_', '-') === conceptId);
            return {
                id: `local_rec_${conceptId}`,
                user_id: 'guest_local',
                concept_id: conceptId,
                concept_label: match?.name ?? conceptId,
                occurrence_count: agg.count,
                total_equity_loss: agg.totalLoss,
                last_seen_at: agg.lastSeen,
                created_at: agg.lastSeen,
                updated_at: agg.lastSeen,
            };
        })
        .sort((a, b) => b.occurrence_count - a.occurrence_count || b.total_equity_loss - a.total_equity_loss)
        .slice(0, limit);
}
