/**
 * @file scripts/verify_coach_api_3tiers_autotest.ts
 * @description Banc d'Auto-Test API en 3 Jets pour la Matrice Adaptative du Coach IA (DÉBUTANT, INTERMÉDIAIRE, EXPERT).
 * Exécute 3 jets successifs sur une position réelle de Backgammon (6-1 ouverture) et certifie la conformité du vocabulaire.
 * Strictement <= 400 lignes, 0 any.
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { POST as coachApiPost } from '../src/app/api/coach/route';
import {
    BEGINNER_FORBIDDEN_TERMS,
    enforceTierVocabularyGuard,
    type CoachPlayerTier,
} from '../src/lib/coach/coachAdaptiveKnowledgeDb';

interface JetValidationResult {
    readonly tier: CoachPlayerTier;
    readonly locale: 'fr' | 'en';
    readonly status: number;
    readonly explanationText: string;
    readonly passed: boolean;
    readonly errors: readonly string[];
}

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

async function parseSseStreamResponse(res: Response): Promise<{ explanation: string; summary: string }> {
    if (!res.body) {
        return { explanation: '', summary: '' };
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let accumulated = '';
    let explanation = '';
    let summary = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        const lines = accumulated.split('\n');
        accumulated = lines.pop() ?? '';

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const dataStr = trimmed.replace(/^data:\s*/, '');
            if (dataStr === '[DONE]') continue;
            try {
                const parsed = JSON.parse(dataStr) as {
                    full?: { explanation?: string; summary?: string };
                    verifiedAudit?: { pedagogical_explanation?: { tactical_rationale?: string; headline?: string } };
                    content?: string;
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
                // Fragment partiel ignoré
            }
        }
    }

    return { explanation, summary };
}

async function runJet(tier: CoachPlayerTier, locale: 'fr' | 'en'): Promise<JetValidationResult> {
    const payload = {
        ...TEST_POSITION,
        playerTier: tier,
        language: locale,
        playerLevel: tier === 'BEGINNER' ? 'beginner' : tier === 'EXPERT' ? 'expert' : 'intermediate',
    };

    const req = new Request('http://localhost:3000/api/coach', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
            'accept-language': locale,
        },
        body: JSON.stringify(payload),
    });

    const res = await coachApiPost(req);
    const { explanation, summary } = await parseSseStreamResponse(res);
    const fullText = `${summary} ${explanation}`.trim();
    const errors: string[] = [];

    if (tier === 'BEGINNER') {
        // Validation Jet 1 : Débutant
        // 1. Zéro terme interdit
        for (const term of BEGINNER_FORBIDDEN_TERMS) {
            const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(?<!\\p{L})${escaped}(?!\\p{L})`, 'iu');
            if (regex.test(fullText)) {
                errors.push(`Terme interdit détecté en Mode Débutant : "${term}"`);
            }
        }
        // 2. Vocabulaire accessible
        const hasAccessibleWord = locale === 'fr'
            ? /sécurité|maison|pion|protéger|courir|chances/i.test(fullText)
            : /safe|safety|checker|home|protect|run|chances/i.test(fullText);
        if (!hasAccessibleWord) {
            errors.push('Aucun concept accessible débutant (sécurité, pions, maison) identifié');
        }
    } else if (tier === 'INTERMEDIATE') {
        // Validation Jet 2 : Intermédiaire
        // 1. Combinaisons sur 36
        const hasCombinations = /\b\d{1,2}\/36\b/i.test(fullText) || fullText.includes('36');
        if (!hasCombinations) {
            errors.push('Absence de référence aux combinaisons sur 36 (X/36)');
        }
        // 2. Plan de jeu ou tactique de club
        const hasTactics = /course|race|prime|mur|blitz|ancre|holding|golden point|pip/i.test(fullText);
        if (!hasTactics) {
            errors.push('Absence de plan de jeu de club (Course, Prime, Blitz, Ancre, Pips)');
        }
    } else {
        // Validation Jet 3 : Expert
        // 1. Équité EMG ou notation chirurgicale
        const hasEmg = /EMG|ΔEMG|delta\s*emg/i.test(fullText);
        if (!hasEmg) {
            errors.push("Absence de métrique d'équité chirurgicale (EMG)");
        }
        // 2. Concepts de haut niveau (MWC, duplication, timing, probabilités)
        const hasExpertConcept = /MWC|duplication|timing|prime|containment|Janowski|Trice|distribution/i.test(fullText);
        if (!hasExpertConcept) {
            errors.push('Absence de concept de haut niveau (MWC, Duplication, Timing, etc.)');
        }
    }

    const passed = res.status === 200 && errors.length === 0;

    return {
        tier,
        locale,
        status: res.status,
        explanationText: fullText,
        passed,
        errors,
    };
}

async function main() {
    console.log('======================================================================');
    console.log('🎯 BANC D’AUTO-TEST IA EN API DU COACH (3 NIVEAUX : 3 JETS SUCCESSIFS)');
    console.log('Position de test : 6-1 ouverture (24/23 13/8 joué vs 24/18 13/8 optimal)');
    console.log('======================================================================\n');

    const tiers: CoachPlayerTier[] = ['BEGINNER', 'INTERMEDIATE', 'EXPERT'];
    const results: JetValidationResult[] = [];

    for (const tier of tiers) {
        console.log(`⏳ Exécution du Jet pour le niveau ${tier} (FR)...`);
        const resultFr = await runJet(tier, 'fr');
        results.push(resultFr);

        if (!resultFr.passed) {
            console.warn(`⚠️ Corrections appliquées via enforceTierVocabularyGuard pour ${tier}...`);
            const guarded = enforceTierVocabularyGuard(resultFr.explanationText, tier, 'fr', {
                deltaEmg: -0.082,
                directShots: 11,
                optimalMove: '24/18 13/8',
                gamePlan: 'Course',
            });
            console.log(`  Texte corrigé : ${guarded.sanitizedText.slice(0, 120)}...`);
        }
    }

    console.log('\n----------------------------------------------------------------------');
    console.log('📋 RÉSULTATS COMPARATIFS CÔTE-À-CÔTE DES 3 NIVEAUX (MÊME POSITION) :');
    console.log('----------------------------------------------------------------------');

    for (const r of results) {
        console.log(`\n🔹 [JET ${r.tier}] (Status HTTP ${r.status}) :`);
        console.log(`"${r.explanationText}"`);
        if (r.passed) {
            console.log(`✅ Conforme à 100% au barème et aux règles du niveau ${r.tier}`);
        } else {
            console.log(`❌ Échec : ${r.errors.join(' | ')}`);
        }
    }

    console.log('\n======================================================================');
    const allPassed = results.every((r) => r.passed);
    if (allPassed) {
        console.log('🏆 100% PASS : Les 3 Niveaux du Coach IA sont validés avec succès !');
        process.exit(0);
    } else {
        console.error('💥 Des non-conformités subsistent dans la matrice adaptative.');
        process.exit(1);
    }
}

void main();
