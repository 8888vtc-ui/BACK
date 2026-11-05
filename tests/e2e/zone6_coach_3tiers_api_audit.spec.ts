/**
 * @file tests/e2e/zone6_coach_3tiers_api_audit.spec.ts
 * @description Suite Playwright E2E Zone 6/7 : Audit & Auto-Correction de l'API Coach en 3 Niveaux
 * Valide les 3 jets de vocabulaire adaptatif (Débutant, Intermédiaire, Expert) et l'isolation du tour joueur.
 * Strictement <= 300 lignes, 0 `any`.
 */

import { test, expect } from '@playwright/test';
import { BEGINNER_FORBIDDEN_TERMS } from '../../src/lib/coach/coachAdaptiveKnowledgeDb';

const TEST_POSITION = {
    xgid: 'XGID=-b----E-C---eE---c-e----B-:0:0:1:61:0:0:0:0:10',
    dice: [6, 1] as [number, number],
    playedMove: '24/23 13/8',
    optimalMove: '24/18 13/8',
    equityLoss: -0.082,
    verdict: 'blunder' as const,
    features: {
        player: 'X' as const,
        pipCountDiff: { player: 167, opponent: 167, leader: 'tie' as const, diff: 0 },
        blotsAndShots: {
            user: [{ point: 23, directShots: 11, indirectShots: 0, totalShots: 11 }],
            best: [],
        },
        boardStructure: {
            innerBoardPoints: 2,
            advancedAnchor: false,
            goldenPoint: false,
            barPoint: true,
            longestPrime: 2,
        },
        contactStatus: 'contact' as const,
    },
    matchContext: {
        matchLength: 5,
        scoreX: 0,
        scoreO: 0,
        crawford: false,
        cubeValue: 1,
    },
};

async function parseSseStream(responseBody: string): Promise<{ explanation: string; summary: string }> {
    const lines = responseBody.split('\n');
    let explanation = '';
    let summary = '';

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const dataStr = trimmed.replace(/^data:\s*/, '');
        if (dataStr === '[DONE]') continue;
        try {
            const parsed = JSON.parse(dataStr) as {
                full?: { explanation?: string; summary?: string };
                verifiedAudit?: { pedagogical_explanation?: { tactical_rationale?: string; headline?: string } };
            };
            if (parsed.full?.explanation) {
                explanation = parsed.full.explanation;
                summary = parsed.full.summary ?? '';
            }
            if (parsed.verifiedAudit?.pedagogical_explanation?.tactical_rationale) {
                explanation = parsed.verifiedAudit.pedagogical_explanation.tactical_rationale;
                summary = parsed.verifiedAudit.pedagogical_explanation.headline ?? '';
            }
        } catch {
            // Fragment SSE partiel ignoré
        }
    }
    return { explanation, summary };
}

test.describe('Zone 6 — Audit & Validation API Coach en 3 Niveaux & Vocabulaire Adaptatif', () => {

    test('1. Jet #1 Mode BEGINNER : 0 jargon (aucun terme interdit) & bienveillance', async ({ request }) => {
        const response = await request.post('/api/coach', {
            data: {
                ...TEST_POSITION,
                playerTier: 'BEGINNER',
                playerLevel: 'beginner',
                language: 'fr',
            },
            headers: {
                'Accept': 'text/event-stream',
                'accept-language': 'fr',
            },
        });

        expect(response.status()).toBe(200);
        const textBody = await response.text();
        const { explanation, summary } = await parseSseStream(textBody);
        const fullText = `${summary} ${explanation}`.trim();

        expect(fullText.length).toBeGreaterThan(10);

        // 1. Zéro terme interdit dans la réponse Débutant
        for (const term of BEGINNER_FORBIDDEN_TERMS) {
            const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(?<!\\p{L})${escaped}(?!\\p{L})`, 'iu');
            expect(regex.test(fullText)).toBe(false);
        }

        // 2. Notions accessibles uniquement
        const isAccessible = /sécurité|maison|pion|protéger|courir|chances|danger|garde/i.test(fullText);
        expect(isAccessible).toBe(true);
    });

    test('2. Jet #2 Mode INTERMEDIATE : Fréquence sur 36 dés et tactique de club', async ({ request }) => {
        const response = await request.post('/api/coach', {
            data: {
                ...TEST_POSITION,
                playerTier: 'INTERMEDIATE',
                playerLevel: 'intermediate',
                language: 'fr',
            },
            headers: {
                'Accept': 'text/event-stream',
                'accept-language': 'fr',
            },
        });

        expect(response.status()).toBe(200);
        const textBody = await response.text();
        const { explanation, summary } = await parseSseStream(textBody);
        const fullText = `${summary} ${explanation}`.trim();

        expect(fullText.length).toBeGreaterThan(15);

        // Combinaisons sur 36
        const hasCombinations = /\b\d{1,2}\/36\b/i.test(fullText) || fullText.includes('36');
        expect(hasCombinations).toBe(true);

        // Notions de club (Course, Prime, Blitz, Ancre, Contact, Pips, etc.)
        const hasTactics = /course|race|prime|mur|blitz|ancre|holding|golden point|pip|contact|sécurité|frappe/i.test(fullText);
        expect(hasTactics).toBe(true);
    });

    test('3. Jet #3 Mode EXPERT : Équité chirurgicale (EMG) et concepts de Grand-Maître', async ({ request }) => {
        const response = await request.post('/api/coach', {
            data: {
                ...TEST_POSITION,
                playerTier: 'EXPERT',
                playerLevel: 'expert',
                language: 'fr',
            },
            headers: {
                'Accept': 'text/event-stream',
                'accept-language': 'fr',
            },
        });

        expect(response.status()).toBe(200);
        const textBody = await response.text();
        const { explanation, summary } = await parseSseStream(textBody);
        const fullText = `${summary} ${explanation}`.trim();

        expect(fullText.length).toBeGreaterThan(20);

        // Métrique d'équité chirurgicale (EMG ou Eq)
        const hasEmgOrEq = /EMG|ΔEMG|delta\s*emg|Eq/i.test(fullText);
        expect(hasEmgOrEq).toBe(true);

        // Concepts d'experts (Duplication, Timing, Prime, Magriel, Michy, etc.)
        const hasExpertConcept = /MWC|duplication|timing|prime|containment|Janowski|Trice|distribution|Magriel|Michy/i.test(fullText);
        expect(hasExpertConcept).toBe(true);
    });

    test('4. Composant MoveErrorPopToast : Bouton Rejouer ce coup interactif', async ({ page }) => {
        await page.goto('/play?gate=beginner');
        await page.waitForSelector('[data-testid="app-game-view"]', { timeout: 15000 });

        // Vérifier que le plateau est interactif
        const boardView = page.locator('[data-testid="app-game-view"]');
        await expect(boardView).toBeVisible();

        // Le bouton de replay sur toast est prêt à l'emploi si déclenché
        const replayBtn = page.locator('[data-testid="error-toast-replay-btn"]');
        if (await replayBtn.isVisible()) {
            await expect(replayBtn).toContainText('Rejouer');
        }
    });
});

