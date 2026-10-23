/**
 * Service d'accès aux données Supabase pour le Backgammon.
 *
 * Fournit les opérations CRUD strictement typées pour :
 * - Parties (games)
 * - Coups joués (moves)
 * - Explications coach (coach_explanations)
 * - Statistiques joueur (user_stats)
 */

import { supabase } from './client';
import type {
    Game,
    MoveRecord,
    CoachExplanationRecord,
    UserStats,
    RecurringErrorRecord,
    Database,
} from './types';

type GameInsert = Database['public']['Tables']['games']['Insert'];
type GameUpdate = Database['public']['Tables']['games']['Update'];
type MoveInsert = Database['public']['Tables']['moves']['Insert'];
type CoachExplanationInsert = Database['public']['Tables']['coach_explanations']['Insert'];
type RecurringErrorInsert = Database['public']['Tables']['recurring_errors']['Insert'];

/**
 * Crée une nouvelle partie pour l'utilisateur connecté.
 */
export async function createGameRecord(params: GameInsert): Promise<Game | null> {
    const { data, error } = await supabase
        .from('games')
        .insert(params)
        .select()
        .single();

    if (error) {
        console.warn('[Supabase DB] Erreur création de partie :', error.message);
        return null;
    }

    return data;
}

/**
 * Met à jour une partie existante (scores, fin de partie, vainqueur).
 */
export async function updateGameRecord(
    gameId: string,
    updates: GameUpdate,
): Promise<Game | null> {
    const { data, error } = await supabase
        .from('games')
        .update(updates)
        .eq('id', gameId)
        .select()
        .single();

    if (error) {
        console.warn('[Supabase DB] Erreur mise à jour de partie :', error.message);
        return null;
    }

    return data;
}

/**
 * Enregistre un coup joué avec son évaluation GNU Backgammon.
 */
export async function recordMove(moveData: MoveInsert): Promise<MoveRecord | null> {
    const { data, error } = await supabase
        .from('moves')
        .insert(moveData)
        .select()
        .single();

    if (error) {
        console.warn('[Supabase DB] Erreur enregistrement de coup :', error.message);
        return null;
    }

    return data;
}

/**
 * Enregistre une explication générée par le Coach IA en base de données.
 */
export async function saveCoachExplanationRecord(
    explanationData: CoachExplanationInsert,
): Promise<CoachExplanationRecord | null> {
    const { data, error } = await supabase
        .from('coach_explanations')
        .insert(explanationData)
        .select()
        .single();

    if (error) {
        console.warn('[Supabase DB] Erreur enregistrement explication coach :', error.message);
        return null;
    }

    return data;
}

/**
 * Interroge le cache global partagé L2 (`coach_explanations`) par clé canonique `position_key`.
 * Privilégie les explications issues du LLM (`source === 'llm'`) sur les replis heuristiques.
 */
export async function getSharedCoachExplanation(
    positionKey: string,
): Promise<CoachExplanationRecord | null> {
    const normalizedKey = positionKey.trim();
    if (!normalizedKey) return null;

    try {
        const { data, error } = await supabase
            .from('coach_explanations')
            .select('*')
            .eq('position_key', normalizedKey)
            .order('created_at', { ascending: false })
            .limit(5);

        if (error || !data || data.length === 0) {
            return null;
        }

        const rows = data as CoachExplanationRecord[];
        const llmMatch = rows.find((r) => r.source === 'llm' && Boolean(r.explanation));
        return llmMatch ?? rows[0] ?? null;
    } catch {
        return null;
    }
}

/**
 * Récupère l'historique des parties récentes de l'utilisateur.
 */
export async function getUserGames(
    userId: string,
    limit = 20,
): Promise<Game[]> {
    const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.warn('[Supabase DB] Erreur chargement historique parties :', error.message);
        return [];
    }

    return data ?? [];
}

/**
 * Récupère les coups d'une partie spécifique.
 */
export async function getGameMoves(gameId: string): Promise<MoveRecord[]> {
    const { data, error } = await supabase
        .from('moves')
        .select('*')
        .eq('game_id', gameId)
        .order('move_number', { ascending: true });

    if (error) {
        console.warn('[Supabase DB] Erreur chargement des coups :', error.message);
        return [];
    }

    return data ?? [];
}

/**
 * Enregistre ou incrémente une erreur récurrente pour un concept stratégique donné.
 *
 * Utilise la fonction RPC `upsert_recurring_error` (définie dans la migration SQL)
 * qui incrémente le compteur et cumule la perte d'équité de façon atomique.
 */
export async function upsertRecurringError(
    userId: string,
    conceptId: string,
    conceptLabel: string,
    equityLoss: number,
): Promise<RecurringErrorRecord | null> {
    const { data, error } = await supabase.rpc('upsert_recurring_error', {
        p_user_id: userId,
        p_concept_id: conceptId,
        p_concept_label: conceptLabel,
        p_equity_loss: equityLoss,
    });

    if (error) {
        console.warn('[Supabase DB] Erreur upsert erreur récurrente :', error.message);
        return null;
    }

    return (data as RecurringErrorRecord) ?? null;
}

/**
 * Récupère les erreurs récurrentes d'un utilisateur, triées par occurrence décroissante.
 */
export async function getRecurringErrors(
    userId: string,
    limit = 20,
): Promise<RecurringErrorRecord[]> {
    const { data, error } = await supabase
        .from('recurring_errors')
        .select('*')
        .eq('user_id', userId)
        .order('occurrence_count', { ascending: false })
        .limit(limit);

    if (error) {
        console.warn('[Supabase DB] Erreur chargement erreurs récurrentes :', error.message);
        return [];
    }

    return data ?? [];
}
