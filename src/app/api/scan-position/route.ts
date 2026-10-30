/**
 * @file src/app/api/scan-position/route.ts
 * @description Route Handler Next.js App Router — Reconnaissance de position de tournoi par Photo (Vision IA).
 *
 * Endpoint : POST /api/scan-position
 * Gouvernance :
 * - Règle 2 (Zéro donnée factice) : Si `GEMINI_API_KEY` est absente ou si l'appel échoue,
 *   retourne une erreur HTTP explicite (503 / 502 / 422) sans jamais inventer de position.
 * - Règle 3 : Typage strict (0 `any`).
 * - SCALABILITY.md R1 : < 220 lignes.
 */

import { NextRequest } from 'next/server';
import { checkRateLimit, RATE_LIMIT_PROFILES } from '../../../lib/security/rateLimit';
import { resolveLlmEndpointConfig } from '../../../lib/coach/coachRouteHelpers';
import {
    validateAndBuildScannedPosition,
    type HomeQuadrantOrientation,
    type RawVisionBoardPayload,
} from '../../../features/export/positionPhotoParser';

export const dynamic = 'force-dynamic';

const VALID_ORIENTATIONS: ReadonlySet<HomeQuadrantOrientation> = new Set([
    'bottom-right',
    'bottom-left',
    'top-right',
    'top-left',
]);

const VISION_SYSTEM_PROMPT = `Tu es un arbitre international de Backgammon (WBF/USBGF) spécialisé dans la lecture optique de tabliers de tournoi.
Analyse la photo du plateau de Backgammon et retourne UNIQUEMENT un objet JSON strictement conforme au schéma suivant (sans texte autour ni balises markdown) :
{
  "topRowVisual": [12 entiers de gauche à droite pour les 12 flèches du haut],
  "bottomRowVisual": [12 entiers de gauche à droite pour les 12 flèches du bas],
  "barX": entier >= 0 (pions clairs/blancs sur la barre centrale),
  "barO": entier >= 0 (pions foncés/noirs sur la barre centrale),
  "cubeValue": entier parmi 1, 2, 4, 8, 16, 32, 64,
  "cubeOwner": "X" | "O" | null,
  "dice": [d1, d2] ou null,
  "turn": "X" | "O"
}
Conventions :
- Pions clairs / blancs / ivoire = valeurs POSITIVES (+1 à +15) = joueur "X".
- Pions foncés / noirs / rouges / marrons = valeurs NÉGATIVES (-1 à -15) = joueur "O".
- Flèche vide = 0.`;

interface ScanPositionRequestBody {
    readonly imageDataUrl?: unknown;
    readonly orientation?: unknown;
    readonly matchLength?: unknown;
    readonly scoreX?: unknown;
    readonly scoreO?: unknown;
    readonly crawford?: unknown;
}

function extractJsonObject(rawText: string): RawVisionBoardPayload {
    const trimmed = rawText.trim();
    const fenceStripped = trimmed
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
    const firstBrace = fenceStripped.indexOf('{');
    const lastBrace = fenceStripped.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
        throw new Error('Réponse Vision IA dépourvue d’objet JSON valide.');
    }
    return JSON.parse(fenceStripped.slice(firstBrace, lastBrace + 1)) as RawVisionBoardPayload;
}

export async function POST(req: NextRequest | Request): Promise<Response> {
    const rateLimit = checkRateLimit(req, RATE_LIMIT_PROFILES.COACH);
    if (!rateLimit.allowed && rateLimit.response) {
        return rateLimit.response;
    }

    let body: ScanPositionRequestBody;
    try {
        body = (await req.json()) as ScanPositionRequestBody;
    } catch {
        return Response.json(
            { ok: false, error: 'INVALID_JSON', message: 'Corps JSON invalide.' },
            { status: 400 },
        );
    }

    const imageDataUrl = typeof body.imageDataUrl === 'string' ? body.imageDataUrl.trim() : '';
    if (!imageDataUrl.startsWith('data:image/') || imageDataUrl.length > 10_000_000) {
        return Response.json(
            {
                ok: false,
                error: 'INVALID_IMAGE',
                message: 'Une image encodée en data:image/* (max ~7 Mo) est requise.',
            },
            { status: 400 },
        );
    }

    const orientation: HomeQuadrantOrientation =
        typeof body.orientation === 'string' &&
        VALID_ORIENTATIONS.has(body.orientation as HomeQuadrantOrientation)
            ? (body.orientation as HomeQuadrantOrientation)
            : 'bottom-right';

    const { apiKey, baseUrl, model } = resolveLlmEndpointConfig();
    if (!apiKey) {
        return Response.json(
            {
                ok: false,
                error: 'VISION_API_UNCONFIGURED',
                message:
                    'Clé API Gemini Vision non configurée sur le serveur. Utilisez l’Éditeur Tactile Rapide (« Tap-to-Adjust ») ci-dessous pour composer la position.',
            },
            { status: 503 },
        );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12_000);

    try {
        const upstreamRes = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model,
                temperature: 0,
                messages: [
                    { role: 'system', content: VISION_SYSTEM_PROMPT },
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: `Analyse cette photo de Backgammon (jan intérieur Blanc/X situé en : ${orientation}) et renvoie le JSON des 24 flèches.`,
                            },
                            {
                                type: 'image_url',
                                image_url: { url: imageDataUrl },
                            },
                        ],
                    },
                ],
            }),
            signal: controller.signal,
        });

        if (!upstreamRes.ok) {
            return Response.json(
                {
                    ok: false,
                    error: 'UPSTREAM_VISION_ERROR',
                    message: `Le service Vision IA a répondu avec le statut HTTP ${upstreamRes.status}.`,
                },
                { status: 502 },
            );
        }

        const data = (await upstreamRes.json()) as {
            choices?: ReadonlyArray<{ message?: { content?: string } }>;
        };
        const content = data.choices?.[0]?.message?.content;
        if (!content || typeof content !== 'string') {
            return Response.json(
                {
                    ok: false,
                    error: 'EMPTY_VISION_RESPONSE',
                    message: 'Réponse vide du modèle Vision IA.',
                },
                { status: 502 },
            );
        }

        const rawPayload = extractJsonObject(content);
        const parsed = validateAndBuildScannedPosition(rawPayload, orientation, {
            matchLength: typeof body.matchLength === 'number' ? body.matchLength : 7,
            scoreX: typeof body.scoreX === 'number' ? body.scoreX : 0,
            scoreO: typeof body.scoreO === 'number' ? body.scoreO : 0,
            crawford: Boolean(body.crawford),
        });

        if (!parsed.ok) {
            return Response.json(
                {
                    ok: false,
                    error: 'INVALID_VISION_BOARD',
                    message: parsed.error.message,
                },
                { status: 422 },
            );
        }

        return Response.json({
            ok: true,
            result: parsed.value,
        });
    } catch (err: unknown) {
        const message =
            err instanceof Error
                ? err.message
                : 'Échec de l’analyse optique de la photo.';
        return Response.json(
            {
                ok: false,
                error: 'VISION_PARSE_FAILED',
                message,
            },
            { status: 502 },
        );
    } finally {
        clearTimeout(timeoutId);
    }
}
