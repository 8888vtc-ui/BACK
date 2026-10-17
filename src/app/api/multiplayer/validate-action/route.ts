/**
 * Route Handler Next.js App Router — Validation Serveur des Coups & Actions (Anti-triche).
 *
 * Endpoint : POST /api/multiplayer/validate-action
 * Payload : ActionValidationContext
 * Retourne : { valid: boolean, code: string, reason?: string, resultingBoard?: number[] }
 */

import { NextRequest } from 'next/server';
import { validateGameAction, ActionValidationContext } from '../../../../features/multiplayer/actionValidator';
import { checkRateLimit, RATE_LIMIT_PROFILES } from '../../../../lib/security/rateLimit';

export const dynamic = 'force-dynamic';

export async function GET() {
    return Response.json({
        service: 'multiplayer-validator',
        status: 'online',
        rules: ['turn_authority', 'dice_bounds', 'bar_mandatory', 'blocked_points', 'bear_off_home', 'crawford_cube'],
    });
}

export async function POST(req: NextRequest) {
    // 1. Protection anti-flood / rate limiting
    const rateLimit = checkRateLimit(req, RATE_LIMIT_PROFILES.MULTIPLAYER_ACTION);
    if (!rateLimit.allowed && rateLimit.response) {
        return rateLimit.response;
    }

    try {
        const body = (await req.json()) as ActionValidationContext;

        if (!body || !body.action || !body.room) {
            return Response.json(
                { valid: false, code: 'INVALID_REQUEST', reason: 'Corps de requête invalide : action et room requis.' },
                { status: 400 },
            );
        }

        const result = validateGameAction(body);

        if (!result.valid) {
            return Response.json(result, { status: 422 });
        }

        return Response.json(result, { status: 200 });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Erreur interne du validateur';
        return Response.json(
            { valid: false, code: 'INTERNAL_ERROR', reason: message },
            { status: 500 },
        );
    }
}
