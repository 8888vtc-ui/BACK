/**
 * Schémas de validation Zod stricts pour les payloads API Backgammon.
 * 
 * Assure l'intégrité des types, la validation des formats (XGID, limites numériques),
 * la prévention d'injection et le rejet anticipé des payloads malformés.
 */

import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

// ---------------------------------------------------------------------------
// 1. Schéma XGID & Moteur d'évaluation
// ---------------------------------------------------------------------------

/**
 * Expression régulière pour valider le préfixe et le format d'un XGID Backgammon valide.
 * Exemple : XGID=-b----E-C---eE---c-e----B-:0:0:1:42:0:0:0:0:10
 */
export const XGID_REGEX = /^XGID=[a-zA-Z0-9_\-:+]+$/;

export const EvaluateRequestSchema = z.object({
    xgid: z
        .string()
        .min(5, 'Le champ xgid doit comporter au moins 5 caractères')
        .max(150, 'Le champ xgid ne peut excéder 150 caractères'),
    ply: z
        .number()
        .int('La profondeur ply doit être un entier')
        .min(0, 'Ply minimum : 0')
        .max(4, 'Ply maximum : 4')
        .default(2),
});

export type EvaluateRequestInput = z.infer<typeof EvaluateRequestSchema>;

// ---------------------------------------------------------------------------
// 2. Schéma Rollout Profond Asynchrone
// ---------------------------------------------------------------------------

export const RolloutRequestSchema = z.object({
    xgid: z
        .string()
        .min(5, 'Le champ xgid doit comporter au moins 5 caractères')
        .max(150, 'Le champ xgid ne peut excéder 150 caractères'),
    trials: z
        .number()
        .int('Le nombre de simulations doit être un entier')
        .min(18, 'Minimum 18 parties')
        .max(10_000, 'Maximum 10 000 parties par tâche')
        .default(1296),
    ply: z
        .number()
        .int('La profondeur ply doit être un entier')
        .min(0, 'Ply minimum : 0')
        .max(4, 'Ply maximum : 4')
        .default(2),
    candidateMoves: z
        .array(z.string().min(1).max(60))
        .max(10, 'Maximum 10 coups candidats par confrontation')
        .optional()
        .default([]),
    seed: z.number().int().optional(),
});

export type RolloutRequestInput = z.infer<typeof RolloutRequestSchema>;

// ---------------------------------------------------------------------------
// 3. Schéma Coach Grand-Maître (/api/coach)
// ---------------------------------------------------------------------------

const BlotsAndShotsSchema = z.object({
    user: z.array(z.any()).default([]),
    best: z.array(z.any()).default([]),
});

const BoardStructureSchema = z.object({
    innerBoardPoints: z.number().int().min(0).max(6).default(0),
    advancedAnchor: z.boolean().default(false),
    goldenPoint: z.boolean().default(false),
    barPoint: z.boolean().default(false),
    longestPrime: z.number().int().min(0).max(6).default(0),
});

const PipCountDiffSchema = z.object({
    player: z.number().int().default(167),
    opponent: z.number().int().default(167),
    leader: z.enum(['X', 'O', 'tie']).default('tie'),
    diff: z.number().int().default(0),
});

export const PositionFeaturesSchema = z.object({
    player: z.enum(['X', 'O']).default('X'),
    pipCountDiff: PipCountDiffSchema.default({
        player: 167,
        opponent: 167,
        leader: 'tie',
        diff: 0,
    }),
    blotsAndShots: BlotsAndShotsSchema.default({ user: [], best: [] }),
    boardStructure: BoardStructureSchema.default({
        innerBoardPoints: 0,
        advancedAnchor: false,
        goldenPoint: false,
        barPoint: false,
        longestPrime: 0,
    }),
    contactStatus: z.enum(['contact', 'pureRace']).default('contact'),
});

export const MatchContextSchema = z.object({
    matchLength: z.number().int().min(0).default(7),
    scoreX: z.number().int().min(0).default(0),
    scoreO: z.number().int().min(0).default(0),
    crawford: z.boolean().default(false),
    cubeValue: z.number().int().min(1).default(1),
}).passthrough();

export const CoachRequestSchema = z.object({
    verdict: z.enum(['blunder', 'doubtful']).default('blunder'),
    equityLoss: z.number().max(0.1, "L'equityLoss doit être négatif ou quasi-nul").default(-0.1),
    playedMove: z.string().min(1, 'playedMove requis').max(100),
    optimalMove: z.string().min(1, 'optimalMove requis').max(100),
    features: PositionFeaturesSchema.optional(),
    matchContext: MatchContextSchema.optional(),
    playerLevel: z.enum(['beginner', 'intermediate', 'expert']).default('intermediate'),
    language: z.enum(['fr', 'en']).default('fr'),
});

export type CoachRequestInput = z.infer<typeof CoachRequestSchema>;

// ---------------------------------------------------------------------------
// 4. Schéma Validation Coup Multijoueur (/api/multiplayer/validate-action)
// ---------------------------------------------------------------------------

export const MultiplayerActionPayloadSchema = z.object({
    from: z.number().int().optional(),
    to: z.number().int().optional(),
    moves: z.array(z.any()).optional(),
    dieValue: z.number().int().optional(),
    value: z.number().int().optional(),
    reason: z.string().optional(),
}).passthrough();

export const MultiplayerActionSchema = z.object({
    id: z.string().uuid().optional(),
    room_id: z.string().min(1),
    user_id: z.string().min(1),
    action_type: z.enum([
        'roll_dice',
        'move',
        'propose_double',
        'respond_double',
        'confirm_turn',
        'resign',
    ]),
    payload: MultiplayerActionPayloadSchema.default({}),
    client_timestamp: z.number().default(() => Date.now()),
    server_seq: z.number().int().optional(),
});

export const MultiplayerRoomSchema = z.object({
    id: z.string().min(1),
    status: z.enum(['waiting', 'playing', 'finished', 'abandoned']),
    match_length: z.number().int().min(0).default(7),
    score_x: z.number().int().min(0).default(0),
    score_o: z.number().int().min(0).default(0),
    current_turn: z.enum(['X', 'O']),
    crawford: z.boolean().default(false),
    cube_value: z.number().int().min(1).default(1),
    cube_owner: z.enum(['X', 'O']).nullable().default(null),
    board: z.array(z.number()).length(28).optional(),
    dice: z.array(z.number()).optional(),
    used_dice: z.array(z.boolean()).optional(),
}).passthrough();

export const ActionValidationContextSchema = z.object({
    action: MultiplayerActionSchema,
    room: MultiplayerRoomSchema,
    previousActions: z.array(MultiplayerActionSchema).optional().default([]),
});

export type ActionValidationContextInput = z.infer<typeof ActionValidationContextSchema>;

// ---------------------------------------------------------------------------
// 5. Utilitaire de validation Zod pour API Routes
// ---------------------------------------------------------------------------

export type ValidationResult<T> =
    | { success: true; data: T }
    | { success: false; response: Response };

/**
 * Valide le corps JSON d'une requête avec un schéma Zod.
 * Retourne HTTP 400 Bad Request avec le détail des erreurs si invalide.
 */
export async function validateJsonBody<T>(
    req: NextRequest | Request,
    schema: z.ZodType<T>,
): Promise<ValidationResult<T>> {
    let json: unknown;
    try {
        json = await req.json();
    } catch {
        return {
            success: false,
            response: new Response(
                JSON.stringify({
                    error: 'Corps de requête invalide',
                    message: 'Le payload doit être un JSON valide.',
                }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                },
            ),
        };
    }

    const parseResult = schema.safeParse(json);
    if (!parseResult.success) {
        const issues = parseResult.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
            code: issue.code,
        }));

        return {
            success: false,
            response: new Response(
                JSON.stringify({
                    error: 'Erreur de validation des données',
                    message: 'Le payload fourni ne respecte pas le schéma requis.',
                    issues,
                }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                },
            ),
        };
    }

    return { success: true, data: parseResult.data };
}
