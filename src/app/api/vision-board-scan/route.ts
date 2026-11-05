/**
 * @file src/app/api/vision-board-scan/route.ts
 * @description Route API Multimodale pour le scan de plateau de Backgammon par Vision IA (Gemini Flash).
 * - Accepte une image encodée en data:image/* (photo de téléphone, upload ou Ctrl+V).
 * - Envoie à Gemini Flash Vision avec schéma JSON strict.
 * - Normalise mathématiquement à exactement 15 pions Blancs et 15 pions Noirs.
 * Strictement <= 250 lignes, 0 any.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
    normalizeVisionBoardTo15Checkers,
    type ScannedBoardVisionResult,
} from '../../../lib/analysis/analysisStudioEngine';

export const dynamic = 'force-dynamic';

const VISION_SYSTEM_PROMPT = `Tu es un grand maître et arbitre de Backgammon expert en reconnaissance visuelle de plateaux réels.
Analyse l'image du plateau de Backgammon et extrait précisément l'état du jeu.
Renvoie UNIQUEMENT un objet JSON valide (aucun markdown, aucune balise, juste le JSON brut) avec la structure exacte suivante :
{
  "points": [24 entiers pour les flèches 1 à 24. Valeurs positives pour les pions du joueur principal, négatives pour l'adversaire, 0 si vide],
  "bar": { "player": entier >= 0, "opponent": entier >= 0 },
  "off": { "player": entier >= 0, "opponent": entier >= 0 },
  "dice": [dé1 entre 1 et 6, dé2 entre 1 et 6],
  "cubeValue": 1 ou 2 ou 4 ou 8 ou 16 ou 32 ou 64,
  "confidence": "HIGH" ou "MEDIUM" ou "LOW",
  "summaryFr": "Courte description en français",
  "summaryEn": "Short description in English"
}`;

export async function POST(req: NextRequest): Promise<Response> {
    try {
        const body = await req.json();
        const { imageDataUrl, homePosition = 'bottom-right' } = body;

        if (!imageDataUrl || typeof imageDataUrl !== 'string') {
            return NextResponse.json(
                { ok: false, error: 'Une image au format base64 ou data URL est requise.' },
                { status: 400 }
            );
        }

        const apiKey = process.env.GEMINI_API_KEY;

        // Fallback déterministe si aucune clé API configurée (ex: tests locaux ou environnement hors-ligne)
        if (!apiKey) {
            const fallbackResult = normalizeVisionBoardTo15Checkers({
                points: [
                    -2, 0, 0, 0, 0, 5,
                    0, 3, 0, 0, 0, -5,
                    5, 0, 0, 0, -3, 0,
                    -5, 0, 0, 0, 0, 2,
                ],
                bar: { player: 0, opponent: 0 },
                dice: [3, 1],
                cubeValue: 1,
                confidence: 'MEDIUM',
                summaryFr: 'Plateau reconstitué (mode local sans clé API). Vous pouvez ajuster les pions manuellement.',
                summaryEn: 'Board reconstructed (local mode without API key). You can adjust checkers manually.',
            });
            return NextResponse.json({ ok: true, result: fallbackResult });
        }

        // Préparation du payload multimodal pour Google Gemini Flash
        const match = imageDataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
        const mimeType = match ? match[1] : 'image/jpeg';
        const base64Data = match ? match[2] : imageDataUrl;

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        const promptText = `${VISION_SYSTEM_PROMPT}\nNote : La maison (jan intérieur du joueur principal / case 1) est située : ${homePosition}.`;

        const requestPayload = {
            contents: [
                {
                    parts: [
                        { text: promptText },
                        {
                            inline_data: {
                                mime_type: mimeType,
                                data: base64Data,
                            },
                        },
                    ],
                },
            ],
            generationConfig: {
                responseMimeType: 'application/json',
            },
        };

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);

        const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestPayload),
            signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!response.ok) {
            // En cas d'erreur de quota ou d'amont, bascule sur une reconstruction résiliente
            const safeFallback = normalizeVisionBoardTo15Checkers({
                points: [
                    -2, 0, 0, 0, 0, 5,
                    0, 3, 0, 0, 0, -5,
                    5, 0, 0, 0, -3, 0,
                    -5, 0, 0, 0, 0, 2,
                ],
                bar: { player: 0, opponent: 0 },
                dice: [3, 1],
                cubeValue: 1,
                confidence: 'LOW',
                summaryFr: 'Plateau par défaut initialisé (erreur amont Vision IA). Ajustez vos pions à la main.',
                summaryEn: 'Default board initialized (upstream Vision AI error). Adjust checkers manually.',
            });
            return NextResponse.json({ ok: true, result: safeFallback });
        }

        const data = await response.json();
        const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!candidateText) {
            throw new Error('Réponse vide de Vision IA');
        }

        const parsedJson = JSON.parse(candidateText.trim()) as Partial<ScannedBoardVisionResult>;
        const normalizedResult = normalizeVisionBoardTo15Checkers(parsedJson);

        return NextResponse.json({ ok: true, result: normalizedResult });
    } catch {
        const resilientResult = normalizeVisionBoardTo15Checkers({
            points: [
                -2, 0, 0, 0, 0, 5,
                0, 3, 0, 0, 0, -5,
                5, 0, 0, 0, -3, 0,
                -5, 0, 0, 0, 0, 2,
            ],
            bar: { player: 0, opponent: 0 },
            dice: [3, 1],
            cubeValue: 1,
            confidence: 'LOW',
            summaryFr: 'Position de départ chargée en secours. Vous pouvez retoucher le tablier manuellement.',
            summaryEn: 'Default position loaded as fallback. You can tweak the board manually.',
        });
        return NextResponse.json({ ok: true, result: resilientResult });
    }
}

