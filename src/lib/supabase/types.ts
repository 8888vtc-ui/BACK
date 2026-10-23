/**
 * Définition TypeScript complète du schéma Supabase de l'application Backgammon.
 * Correspond exactement à la migration 20261016000000_init_backgammon_schema.sql.
 */

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string;
                    username: string | null;
                    display_name: string | null;
                    avatar_url: string | null;
                    rating: number;
                    experience_level: 'beginner' | 'intermediate' | 'expert';
                    preferred_theme: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id: string;
                    username?: string | null;
                    display_name?: string | null;
                    avatar_url?: string | null;
                    rating?: number;
                    experience_level?: 'beginner' | 'intermediate' | 'expert';
                    preferred_theme?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    username?: string | null;
                    display_name?: string | null;
                    avatar_url?: string | null;
                    rating?: number;
                    experience_level?: 'beginner' | 'intermediate' | 'expert';
                    preferred_theme?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: [];
            };
            games: {
                Row: {
                    id: string;
                    user_id: string;
                    opponent_type: 'ai' | 'human';
                    opponent_difficulty: 'beginner' | 'intermediate' | 'expert' | 'grandmaster' | 'legend' | null;
                    match_length: number;
                    score_x: number;
                    score_o: number;
                    winner: 'X' | 'O' | null;
                    win_type: 'single' | 'gammon' | 'backgammon' | 'pass' | null;
                    points_won: number;
                    cube_value: number;
                    cube_owner: 'X' | 'O' | null;
                    is_crawford: boolean;
                    status: 'in_progress' | 'completed' | 'abandoned';
                    started_at: string;
                    ended_at: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    opponent_type?: 'ai' | 'human';
                    opponent_difficulty?: 'beginner' | 'intermediate' | 'expert' | 'grandmaster' | 'legend' | null;
                    match_length?: number;
                    score_x?: number;
                    score_o?: number;
                    winner?: 'X' | 'O' | null;
                    win_type?: 'single' | 'gammon' | 'backgammon' | 'pass' | null;
                    points_won?: number;
                    cube_value?: number;
                    cube_owner?: 'X' | 'O' | null;
                    is_crawford?: boolean;
                    status?: 'in_progress' | 'completed' | 'abandoned';
                    started_at?: string;
                    ended_at?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    opponent_type?: 'ai' | 'human';
                    opponent_difficulty?: 'beginner' | 'intermediate' | 'expert' | 'grandmaster' | 'legend' | null;
                    match_length?: number;
                    score_x?: number;
                    score_o?: number;
                    winner?: 'X' | 'O' | null;
                    win_type?: 'single' | 'gammon' | 'backgammon' | 'pass' | null;
                    points_won?: number;
                    cube_value?: number;
                    cube_owner?: 'X' | 'O' | null;
                    is_crawford?: boolean;
                    status?: 'in_progress' | 'completed' | 'abandoned';
                    started_at?: string;
                    ended_at?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'games_user_id_fkey';
                        columns: ['user_id'];
                        referencedRelation: 'profiles';
                        referencedColumns: ['id'];
                    },
                ];
            };
            moves: {
                Row: {
                    id: string;
                    game_id: string;
                    user_id: string;
                    move_number: number;
                    player: 'X' | 'O';
                    dice: number[];
                    move_notation: string;
                    board_before: number[];
                    board_after: number[];
                    equity_loss: number | null;
                    verdict: 'optimal' | 'bon' | 'douteux' | 'blunder' | 'howler' | 'good' | 'doubtful' | null;
                    optimal_move: string | null;
                    played_at: string;
                };
                Insert: {
                    id?: string;
                    game_id: string;
                    user_id: string;
                    move_number: number;
                    player: 'X' | 'O';
                    dice: number[];
                    move_notation: string;
                    board_before: number[];
                    board_after: number[];
                    equity_loss?: number | null;
                    verdict?: 'optimal' | 'bon' | 'douteux' | 'blunder' | 'howler' | 'good' | 'doubtful' | null;
                    optimal_move?: string | null;
                    played_at?: string;
                };
                Update: {
                    id?: string;
                    game_id?: string;
                    user_id?: string;
                    move_number?: number;
                    player?: 'X' | 'O';
                    dice?: number[];
                    move_notation?: string;
                    board_before?: number[];
                    board_after?: number[];
                    equity_loss?: number | null;
                    verdict?: 'optimal' | 'bon' | 'douteux' | 'blunder' | 'howler' | 'good' | 'doubtful' | null;
                    optimal_move?: string | null;
                    played_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'moves_game_id_fkey';
                        columns: ['game_id'];
                        referencedRelation: 'games';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'moves_user_id_fkey';
                        columns: ['user_id'];
                        referencedRelation: 'profiles';
                        referencedColumns: ['id'];
                    },
                ];
            };
            coach_explanations: {
                Row: {
                    id: string;
                    user_id: string | null;
                    game_id: string | null;
                    move_id: string | null;
                    position_key: string;
                    played_move: string;
                    optimal_move: string;
                    verdict: string;
                    equity_loss: number;
                    summary: string;
                    explanation: string;
                    key_concept: string | null;
                    advice: string | null;
                    source: 'llm' | 'rule-based' | 'cache';
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id?: string | null;
                    game_id?: string | null;
                    move_id?: string | null;
                    position_key: string;
                    played_move: string;
                    optimal_move: string;
                    verdict: string;
                    equity_loss: number;
                    summary: string;
                    explanation: string;
                    key_concept?: string | null;
                    advice?: string | null;
                    source?: 'llm' | 'rule-based' | 'cache';
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    game_id?: string | null;
                    move_id?: string | null;
                    position_key?: string;
                    played_move?: string;
                    optimal_move?: string;
                    verdict?: string;
                    equity_loss?: number;
                    summary?: string;
                    explanation?: string;
                    key_concept?: string | null;
                    advice?: string | null;
                    source?: 'llm' | 'rule-based' | 'cache';
                    created_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'coach_explanations_user_id_fkey';
                        columns: ['user_id'];
                        referencedRelation: 'profiles';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'coach_explanations_game_id_fkey';
                        columns: ['game_id'];
                        referencedRelation: 'games';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'coach_explanations_move_id_fkey';
                        columns: ['move_id'];
                        referencedRelation: 'moves';
                        referencedColumns: ['id'];
                    },
                ];
            };
            user_stats: {
                Row: {
                    user_id: string;
                    games_played: number;
                    games_won: number;
                    games_lost: number;
                    gammons_won: number;
                    backgammons_won: number;
                    total_blunders: number;
                    total_errors: number;
                    total_equity_loss: number;
                    average_error_rate: number;
                    updated_at: string;
                };
                Insert: {
                    user_id: string;
                    games_played?: number;
                    games_won?: number;
                    games_lost?: number;
                    gammons_won?: number;
                    backgammons_won?: number;
                    total_blunders?: number;
                    total_errors?: number;
                    total_equity_loss?: number;
                    average_error_rate?: number;
                    updated_at?: string;
                };
                Update: {
                    user_id?: string;
                    games_played?: number;
                    games_won?: number;
                    games_lost?: number;
                    gammons_won?: number;
                    backgammons_won?: number;
                    total_blunders?: number;
                    total_errors?: number;
                    total_equity_loss?: number;
                    average_error_rate?: number;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'user_stats_user_id_fkey';
                        columns: ['user_id'];
                        referencedRelation: 'profiles';
                        referencedColumns: ['id'];
                    },
                ];
            };
            matchmaking_queue: {
                Row: {
                    id: string;
                    user_id: string | null;
                    guest_id: string | null;
                    display_name: string;
                    rating: number;
                    match_length: number;
                    status: 'waiting' | 'matched' | 'cancelled';
                    matched_room_id: string | null;
                    matched_opponent_id: string | null;
                    matched_opponent_name: string | null;
                    matched_role: 'X' | 'O' | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id?: string | null;
                    guest_id?: string | null;
                    display_name: string;
                    rating?: number;
                    match_length?: number;
                    status?: 'waiting' | 'matched' | 'cancelled';
                    matched_room_id?: string | null;
                    matched_opponent_id?: string | null;
                    matched_opponent_name?: string | null;
                    matched_role?: 'X' | 'O' | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string | null;
                    guest_id?: string | null;
                    display_name?: string;
                    rating?: number;
                    match_length?: number;
                    status?: 'waiting' | 'matched' | 'cancelled';
                    matched_room_id?: string | null;
                    matched_opponent_id?: string | null;
                    matched_opponent_name?: string | null;
                    matched_role?: 'X' | 'O' | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: [];
            };
            game_rooms: {
                Row: {
                    id: string;
                    code: string;
                    room_type: 'public_matchmaking' | 'private_code';
                    status: 'waiting' | 'ready' | 'in_progress' | 'paused' | 'completed' | 'abandoned';
                    match_length: number;
                    host_id: string | null;
                    guest_id: string | null;
                    host_guest_token: string | null;
                    guest_guest_token: string | null;
                    player_x_id: string | null;
                    player_o_id: string | null;
                    player_x_name: string;
                    player_o_name: string;
                    player_x_rating: number;
                    player_o_rating: number;
                    board: number[];
                    score_x: number;
                    score_o: number;
                    turn: 'X' | 'O';
                    dice: number[] | null;
                    used_dice: boolean[];
                    cube_value: number;
                    cube_owner: 'X' | 'O' | null;
                    doubling_offered_by: 'X' | 'O' | null;
                    is_crawford: boolean;
                    time_control_type: 'per_turn' | 'fischer' | 'unlimited';
                    time_limit_seconds: number;
                    clock_x_ms: number;
                    clock_o_ms: number;
                    last_turn_started_at: string;
                    sequence_number: number;
                    winner: 'X' | 'O' | null;
                    win_type: 'single' | 'gammon' | 'backgammon' | 'pass' | 'timeout' | 'disconnect' | null;
                    points_won: number;
                    elo_delta_x: number | null;
                    elo_delta_o: number | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    code: string;
                    room_type?: 'public_matchmaking' | 'private_code';
                    status?: 'waiting' | 'ready' | 'in_progress' | 'paused' | 'completed' | 'abandoned';
                    match_length?: number;
                    host_id?: string | null;
                    guest_id?: string | null;
                    host_guest_token?: string | null;
                    guest_guest_token?: string | null;
                    player_x_id?: string | null;
                    player_o_id?: string | null;
                    player_x_name?: string;
                    player_o_name?: string;
                    player_x_rating?: number;
                    player_o_rating?: number;
                    board?: number[];
                    score_x?: number;
                    score_o?: number;
                    turn?: 'X' | 'O';
                    dice?: number[] | null;
                    used_dice?: boolean[];
                    cube_value?: number;
                    cube_owner?: 'X' | 'O' | null;
                    doubling_offered_by?: 'X' | 'O' | null;
                    is_crawford?: boolean;
                    time_control_type?: 'per_turn' | 'fischer' | 'unlimited';
                    time_limit_seconds?: number;
                    clock_x_ms?: number;
                    clock_o_ms?: number;
                    last_turn_started_at?: string;
                    sequence_number?: number;
                    winner?: 'X' | 'O' | null;
                    win_type?: 'single' | 'gammon' | 'backgammon' | 'pass' | 'timeout' | 'disconnect' | null;
                    points_won?: number;
                    elo_delta_x?: number | null;
                    elo_delta_o?: number | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    code?: string;
                    room_type?: 'public_matchmaking' | 'private_code';
                    status?: 'waiting' | 'ready' | 'in_progress' | 'paused' | 'completed' | 'abandoned';
                    match_length?: number;
                    host_id?: string | null;
                    guest_id?: string | null;
                    host_guest_token?: string | null;
                    guest_guest_token?: string | null;
                    player_x_id?: string | null;
                    player_o_id?: string | null;
                    player_x_name?: string;
                    player_o_name?: string;
                    player_x_rating?: number;
                    player_o_rating?: number;
                    board?: number[];
                    score_x?: number;
                    score_o?: number;
                    turn?: 'X' | 'O';
                    dice?: number[] | null;
                    used_dice?: boolean[];
                    cube_value?: number;
                    cube_owner?: 'X' | 'O' | null;
                    doubling_offered_by?: 'X' | 'O' | null;
                    is_crawford?: boolean;
                    time_control_type?: 'per_turn' | 'fischer' | 'unlimited';
                    time_limit_seconds?: number;
                    clock_x_ms?: number;
                    clock_o_ms?: number;
                    last_turn_started_at?: string;
                    sequence_number?: number;
                    winner?: 'X' | 'O' | null;
                    win_type?: 'single' | 'gammon' | 'backgammon' | 'pass' | 'timeout' | 'disconnect' | null;
                    points_won?: number;
                    elo_delta_x?: number | null;
                    elo_delta_o?: number | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: [];
            };
            room_actions: {
                Row: {
                    id: string;
                    room_id: string;
                    sequence_number: number;
                    player: 'X' | 'O';
                    action_type: 'ROLL_DICE' | 'MOVE_CHECKER' | 'OFFER_DOUBLE' | 'ACCEPT_DOUBLE' | 'PASS_DOUBLE' | 'END_TURN' | 'RESIGN' | 'TIMEOUT' | 'SYNC_SNAPSHOT';
                    dice: number[] | null;
                    move_from: number | null;
                    move_to: number | null;
                    move_notation: string | null;
                    cube_value: number | null;
                    board_after: number[];
                    time_spent_ms: number;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    room_id: string;
                    sequence_number?: number;
                    player: 'X' | 'O';
                    action_type: 'ROLL_DICE' | 'MOVE_CHECKER' | 'OFFER_DOUBLE' | 'ACCEPT_DOUBLE' | 'PASS_DOUBLE' | 'END_TURN' | 'RESIGN' | 'TIMEOUT' | 'SYNC_SNAPSHOT';
                    dice?: number[] | null;
                    move_from?: number | null;
                    move_to?: number | null;
                    move_notation?: string | null;
                    cube_value?: number | null;
                    board_after: number[];
                    time_spent_ms?: number;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    room_id?: string;
                    sequence_number?: number;
                    player?: 'X' | 'O';
                    action_type?: 'ROLL_DICE' | 'MOVE_CHECKER' | 'OFFER_DOUBLE' | 'ACCEPT_DOUBLE' | 'PASS_DOUBLE' | 'END_TURN' | 'RESIGN' | 'TIMEOUT' | 'SYNC_SNAPSHOT';
                    dice?: number[] | null;
                    move_from?: number | null;
                    move_to?: number | null;
                    move_notation?: string | null;
                    cube_value?: number | null;
                    board_after?: number[];
                    time_spent_ms?: number;
                    created_at?: string;
                };
                Relationships: [];
            };
            room_presence_sessions: {
                Row: {
                    id: string;
                    room_id: string;
                    user_id: string | null;
                    guest_token: string | null;
                    role: 'X' | 'O' | 'spectator';
                    socket_id: string | null;
                    is_online: boolean;
                    last_ping_at: string;
                    reconnect_expires_at: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    room_id: string;
                    user_id?: string | null;
                    guest_token?: string | null;
                    role: 'X' | 'O' | 'spectator';
                    socket_id?: string | null;
                    is_online?: boolean;
                    last_ping_at?: string;
                    reconnect_expires_at?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    room_id?: string;
                    user_id?: string | null;
                    guest_token?: string | null;
                    role?: 'X' | 'O' | 'spectator';
                    socket_id?: string | null;
                    is_online?: boolean;
                    last_ping_at?: string;
                    reconnect_expires_at?: string | null;
                    created_at?: string;
                };
                Relationships: [];
            };
            recurring_errors: {
                Row: {
                    id: string;
                    user_id: string;
                    concept_id: string;
                    concept_label: string;
                    occurrence_count: number;
                    total_equity_loss: number;
                    last_seen_at: string;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    concept_id: string;
                    concept_label: string;
                    occurrence_count?: number;
                    total_equity_loss?: number;
                    last_seen_at?: string;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    concept_id?: string;
                    concept_label?: string;
                    occurrence_count?: number;
                    total_equity_loss?: number;
                    last_seen_at?: string;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'recurring_errors_user_id_fkey';
                        columns: ['user_id'];
                        referencedRelation: 'profiles';
                        referencedColumns: ['id'];
                    },
                ];
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            upsert_recurring_error: {
                Args: {
                    p_user_id: string;
                    p_concept_id: string;
                    p_concept_label: string;
                    p_equity_loss: number;
                };
                Returns: {
                    id: string;
                    user_id: string;
                    concept_id: string;
                    concept_label: string;
                    occurrence_count: number;
                    total_equity_loss: number;
                    last_seen_at: string;
                    created_at: string;
                    updated_at: string;
                };
            };
        };
        Enums: {
            [_ in never]: never;
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Game = Database['public']['Tables']['games']['Row'];
export type MoveRecord = Database['public']['Tables']['moves']['Row'];
export type CoachExplanationRecord = Database['public']['Tables']['coach_explanations']['Row'];
export type UserStats = Database['public']['Tables']['user_stats']['Row'];
export type MatchmakingQueueRecord = Database['public']['Tables']['matchmaking_queue']['Row'];
export type GameRoomRecord = Database['public']['Tables']['game_rooms']['Row'];
export type RoomActionRecord = Database['public']['Tables']['room_actions']['Row'];
export type RoomPresenceSessionRecord = Database['public']['Tables']['room_presence_sessions']['Row'];
export type RecurringErrorRecord = Database['public']['Tables']['recurring_errors']['Row'];


