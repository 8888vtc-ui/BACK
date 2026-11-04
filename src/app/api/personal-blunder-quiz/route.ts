/**
 * @file route.ts
 * @description Route API Next.js / Netlify pour le coach personnel de blunder (/api/personal-blunder-quiz)
 * avec cascade de modèles Google Flash-Lite et secours déterministe en 0 ms.
 * Zéro any, zéro ERH.
 */

import { NextResponse } from 'next/server';
import {
    PersonalBlunderCoachRequestPayload,
    generatePersonalBlunderCoachWithCascade,
} from '../../../features/coach/personalBlunderDeterministicFallback';

export async function POST(req: Request): Promise<NextResponse> {
    try {
        const body = (await req.json()) as PersonalBlunderCoachRequestPayload;
        if (!body || typeof body.xgid !== 'string' || typeof body.playerBlunderMove !== 'string') {
            return NextResponse.json(
                { error: 'Invalid payload structure: missing xgid or playerBlunderMove' },
                { status: 400 }
            );
        }

        const coachTexts = await generatePersonalBlunderCoachWithCascade(body);
        return NextResponse.json(coachTexts, { status: 200 });
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown server error';
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
