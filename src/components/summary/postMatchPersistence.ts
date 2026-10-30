/**
 * Persistance du bilan post-match — IndexedDB (offline-first) + Supabase.
 *
 * Rôle :
 *   1. Enregistre le bilan complet dans IndexedDB (`coach_explanations` + `games`).
 *   2. Enregistre l'analyse dans le stockage local des analyses (`saveGameAnalysis`).
 *   3. Alimente automatiquement la Blunder Bank locale (`recordBlunder`) avec les erreurs
 *      et micro-erreurs du joueur afin que le bouton « Entraîner mes Blunders » cible
 *      immédiatement les positions réelles de la partie.
 *   4. Enfile les mutations Supabase (`games`, `coach_explanations`) via la Sync Queue,
 *      qui les dépile dès que la connexion est rétablie.
 *   5. Agrège les erreurs récurrentes par concept pour alimenter les Drills personnalisés.
 *
 * Module sans état React : appelé une seule fois par manche terminée.
 *
 * Retrait :
 *   Supprimer ce fichier et son usage dans `PostMatchTrainingReport.tsx`.
 */

import { putRecord } from '../../lib/offline/idb';
import { enqueueSync } from '../../lib/offline/syncQueue';
import { saveGameAnalysis } from '../../features/rating/gameAnalysisStorage';
import { recordBlunder } from '../../features/drills/blunderBank';
import { upsertRecurringError } from '../../lib/supabase/db';
import { getCurrentUser } from '../../lib/supabase/auth';
import type { CompleteGameAnalysis } from '../../features/rating/types';
import type { MajorBlunder, MatchSummaryPayload } from './postMatchReportHelpers';

export interface PersistPostMatchParams {
    /** Analyse complète de la manche (peut être null si indisponible). */
    analysis: CompleteGameAnalysis | null | undefined;
    /** Résumé structuré du match. */
    summary: MatchSummaryPayload;
    /** Erreurs majeures extraites. */
    blunders: ReadonlyArray<MajorBlunder>;
    /** Identifiant de la partie. */
    gameId: string;
    /** Identifiant utilisateur (optionnel). */
    userId?: string | null;
}

export interface PersistPostMatchResult {
    /** Le bilan a-t-il été écrit dans IndexedDB ? */
    localSaved: boolean;
    /** Nombre de mutations enfilées pour Supabase. */
    queuedMutations: number;
}

/**
 * Persiste le bilan complet du match (local d'abord, puis synchronisation).
 * Ne lève jamais : toute erreur est journalisée et n'interrompt pas l'UI.
 */
export async function persistPostMatchReport(
    params: PersistPostMatchParams,
): Promise<PersistPostMatchResult> {
    const { analysis, summary, blunders, gameId, userId } = params;
    let localSaved = false;
    let queuedMutations = 0;

    const reportId = `report_${gameId}_${Date.now()}`;
    const createdAt = new Date().toISOString();

    // 1. IndexedDB — bilan complet (offline-first, toujours disponible).
    try {
        await putRecord('coach_explanations', {
            id: reportId,
            game_id: gameId,
            position_key: `post_match_${gameId}`,
            played_move: '',
            optimal_move: '',
            verdict: 'post-match',
            equity_loss: -summary.totalEquityLoss,
            summary: `PR ${summary.performanceRating.toFixed(2)} — ${summary.prCategory}`,
            explanation: JSON.stringify({
                summary,
                blunders: blunders.map((b) => ({
                    turnNumber: b.turnNumber,
                    dice: b.dice,
                    playedNotation: b.playedNotation,
                    optimalNotation: b.optimalNotation,
                    equityLoss: b.equityLoss,
                    phase: b.phase,
                })),
            }),
            key_concept: null,
            advice: null,
            source: 'post-match',
            created_at: createdAt,
        });
        localSaved = true;
    } catch (e) {
        console.warn('[PostMatch] Échec écriture IndexedDB du bilan :', e);
    }

    // 2. Stockage local des analyses (courbe de PR) + alimentation directe de la Blunder Bank (drills).
    if (analysis) {
        try {
            saveGameAnalysis(analysis);
        } catch (e) {
            console.warn('[PostMatch] Échec enregistrement analyse locale :', e);
        }

        try {
            for (const m of analysis.evaluatedMoves) {
                const absLoss = Math.abs(m.equityLoss);
                if (m.player === 'X' && absLoss >= 0.04 && Array.isArray(m.boardBefore) && m.boardBefore.length >= 26) {
                    const normalizedBoard = m.boardBefore.length >= 28
                        ? m.boardBefore.slice(0, 28)
                        : [...m.boardBefore, 0, 0].slice(0, 28);
                    recordBlunder({
                        board: normalizedBoard,
                        dice: m.dice,
                        player: 'X',
                        playedMove: m.playedNotation,
                        optimalMove: m.optimalNotation,
                        equityLoss: absLoss,
                        verdict: absLoss >= 0.15 ? 'howler' : absLoss >= 0.08 ? 'blunder' : 'doubtful',
                        conceptId: m.conceptId || 'blot_safety',
                        conceptName: m.conceptId ? `Concept : ${m.conceptId}` : 'Précision tactique & Sécurité',
                        explanation: m.explanation || `Le coup ${m.optimalNotation} préservait mieux votre structure que ${m.playedNotation}.`,
                        gameId,
                    });
                }
            }
        } catch (e) {
            console.warn('[PostMatch] Échec alimentation BlunderBank :', e);
        }
    }

    // 3. File de synchronisation Supabase (no-op si Supabase non configuré).
    try {
        const gameSyncId = await enqueueSync('games', 'update', {
            id: gameId,
            user_id: userId ?? null,
            score_x: analysis?.scoreX ?? 0,
            score_o: analysis?.scoreO ?? 0,
            match_length: analysis?.matchLength ?? 0,
            winner: analysis?.winner ?? null,
            updated_at: createdAt,
        });
        if (gameSyncId) queuedMutations += 1;

        const reportSyncId = await enqueueSync('coach_explanations', 'insert', {
            id: reportId,
            game_id: gameId,
            user_id: userId ?? null,
            position_key: `post_match_${gameId}`,
            verdict: 'post-match',
            equity_loss: -summary.totalEquityLoss,
            summary: `PR ${summary.performanceRating.toFixed(2)} — ${summary.prCategory}`,
            explanation: JSON.stringify(summary),
            source: 'post-match',
            created_at: createdAt,
        });
        if (reportSyncId) queuedMutations += 1;
    } catch (e) {
        console.warn('[PostMatch] Échec mise en file de synchronisation :', e);
    }

    // 4. Agrégation des erreurs récurrentes par concept (Drills personnalisés).
    if (userId && blunders.length > 0) {
        const byConcept = new Map<string, { total: number; count: number }>();
        for (const b of blunders) {
            const concept = b.conceptId || 'blot_safety';
            const entry = byConcept.get(concept) ?? { total: 0, count: 0 };
            entry.total += b.equityLoss;
            entry.count += 1;
            byConcept.set(concept, entry);
        }

        for (const [conceptId, entry] of byConcept) {
            try {
                await upsertRecurringError(
                    userId,
                    conceptId,
                    conceptId,
                    Number((entry.total / entry.count).toFixed(3)),
                );
            } catch (e) {
                console.warn('[PostMatch] Échec agrégation erreur récurrente :', e);
            }
        }
    }

    return { localSaved, queuedMutations };
}

/**
 * Résout l'identifiant utilisateur courant (null si non connecté).
 */
export async function resolveCurrentUserId(): Promise<string | null> {
    try {
        const user = await getCurrentUser();
        return user?.id ?? null;
    } catch {
        return null;
    }
}
