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
    Profile,
    Database,
} from './types';

type GameInsert = Database['public']['Tables']['games']['Insert'];
type GameUpdate = Database['public']['Tables']['games']['Update'];
type MoveInsert = Database['public']['Tables']['moves']['Insert'];
type CoachExplanationInsert = Database['public']['Tables']['coach_explanations']['Insert'];
type RecurringErrorInsert = Database['public']['Tables']['recurring_errors']['Insert'];
type RecurringErrorUpdate = Database['public']['Tables']['recurring_errors']['Update'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

/** Intervalles canoniques FSRS en jours : J+1, J+3, J+7, J+14, J+30. */
export const FSRS_INTERVALS_DAYS = [1, 3, 7, 14, 30] as const;
export const DEFAULT_FSRS_EASE_FACTOR = 2.5;
export const MIN_FSRS_EASE_FACTOR = 1.3;
export const MAX_FSRS_EASE_FACTOR = 3.0;

export interface FsrsScheduleInput {
    readonly repetitionCount?: number;
    readonly easeFactor?: number;
    readonly isSuccess: boolean;
    readonly now?: Date;
}

export interface FsrsScheduleResult {
    readonly next_review_date: string;
    readonly repetition_count: number;
    readonly ease_factor: number;
    readonly interval_days: number;
}

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

/**
 * Calcule le prochain état de révision espacée FSRS (intervalles J+1, J+3, J+7, J+14, J+30).
 * - Si échec (`isSuccess === false`) : réinitialise à J+1 (`repetition_count = 0`) et réduit `ease_factor`.
 * - Si succès (`isSuccess === true`) : progresse le long des paliers `[1, 3, 7, 14, 30]` et incrémente `repetition_count`.
 */
export function computeFsrsSchedule(input: FsrsScheduleInput): FsrsScheduleResult {
    const now = input.now ?? new Date();
    const currentRep = Math.max(0, Math.floor(input.repetitionCount ?? 0));
    const currentEase =
        input.easeFactor !== undefined && Number.isFinite(input.easeFactor)
            ? Math.max(MIN_FSRS_EASE_FACTOR, Math.min(MAX_FSRS_EASE_FACTOR, input.easeFactor))
            : DEFAULT_FSRS_EASE_FACTOR;

    if (!input.isSuccess) {
        const intervalDays = FSRS_INTERVALS_DAYS[0]; // J+1
        const nextEase = Number(
            Math.max(MIN_FSRS_EASE_FACTOR, currentEase - 0.2).toFixed(2),
        );
        const nextDate = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);
        return {
            next_review_date: nextDate.toISOString(),
            repetition_count: 0,
            ease_factor: nextEase,
            interval_days: intervalDays,
        };
    }

    const stageIdx = Math.min(currentRep, FSRS_INTERVALS_DAYS.length - 1);
    const intervalDays = FSRS_INTERVALS_DAYS[stageIdx];
    const nextRep = currentRep + 1;
    const nextEase = Number(
        Math.min(MAX_FSRS_EASE_FACTOR, currentEase + 0.1).toFixed(2),
    );
    const nextDate = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);

    return {
        next_review_date: nextDate.toISOString(),
        repetition_count: nextRep,
        ease_factor: nextEase,
        interval_days: intervalDays,
    };
}

/**
 * Met à jour le statut de révision FSRS (`next_review_date`, `repetition_count`, `ease_factor`)
 * d'une erreur récurrente dans `recurring_errors`.
 */
export async function updateRecurringErrorReviewStatus(
    userId: string,
    conceptId: string,
    updates: Pick<
        RecurringErrorUpdate,
        'next_review_date' | 'repetition_count' | 'ease_factor' | 'position_xgid'
    >,
): Promise<RecurringErrorRecord | null> {
    const { data, error } = await supabase
        .from('recurring_errors')
        .update({
            ...updates,
            updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('concept_id', conceptId)
        .select()
        .single();

    if (error) {
        console.warn('[Supabase DB] Erreur mise à jour FSRS recurring_errors :', error.message);
        return null;
    }

    return (data as RecurringErrorRecord) ?? null;
}

/**
 * Enregistre une erreur (ou un puzzle raté au 1er essai) et planifie sa révision FSRS
 * dans `recurring_errors` (J+1, J+3, J+7, J+14, J+30).
 */
export async function scheduleRecurringErrorFsrs(params: {
    userId: string;
    conceptId: string;
    conceptLabel: string;
    equityLoss: number;
    positionXgid?: string;
    repetitionCount?: number;
    easeFactor?: number;
    isSuccess?: boolean;
    now?: Date;
}): Promise<RecurringErrorRecord | null> {
    const schedule = computeFsrsSchedule({
        repetitionCount: params.repetitionCount ?? 0,
        easeFactor: params.easeFactor ?? DEFAULT_FSRS_EASE_FACTOR,
        isSuccess: params.isSuccess ?? false,
        now: params.now,
    });

    const baseRow = await upsertRecurringError(
        params.userId,
        params.conceptId,
        params.conceptLabel,
        params.equityLoss,
    );

    const updatedRow = await updateRecurringErrorReviewStatus(params.userId, params.conceptId, {
        next_review_date: schedule.next_review_date,
        repetition_count: schedule.repetition_count,
        ease_factor: schedule.ease_factor,
        position_xgid: params.positionXgid ?? null,
    });

    if (updatedRow) {
        return updatedRow;
    }

    if (baseRow) {
        return {
            ...baseRow,
            next_review_date: schedule.next_review_date,
            repetition_count: schedule.repetition_count,
            ease_factor: schedule.ease_factor,
            position_xgid: params.positionXgid ?? null,
        };
    }

    return null;
}

/**
 * Récupère les positions / concepts arrivés à échéance de révision FSRS (`next_review_date <= now`).
 */
export async function getDueRecurringErrorsForReview(
    userId: string,
    asOfDate: Date = new Date(),
    limit = 20,
): Promise<RecurringErrorRecord[]> {
    const rows = await getRecurringErrors(userId, limit);
    const cutoffMs = asOfDate.getTime();
    return rows.filter((r) => {
        if (!r.next_review_date) return true;
        const reviewMs = Date.parse(r.next_review_date);
        return Number.isNaN(reviewMs) || reviewMs <= cutoffMs;
    });
}

/**
 * Met à jour le profil utilisateur Supabase avec `current_streak`, `max_streak` et `puzzle_rating`.
 */
export async function updateProfilePuzzleStats(
    userId: string,
    updates: {
        current_streak: number;
        max_streak: number;
        puzzle_rating: number;
        last_puzzle_date?: string | null;
    },
): Promise<Profile | null> {
    const payload: ProfileUpdate = {
        current_streak: updates.current_streak,
        max_streak: updates.max_streak,
        puzzle_rating: Math.round(updates.puzzle_rating),
        last_puzzle_date: updates.last_puzzle_date ?? null,
        updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', userId)
        .select()
        .single();

    if (error) {
        console.warn('[Supabase DB] Erreur mise à jour puzzle stats du profil :', error.message);
        return null;
    }

    return (data as Profile) ?? null;
}
