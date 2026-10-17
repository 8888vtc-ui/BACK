import { describe, it, expect } from 'vitest';
import {
    BACKGAMMON_COACH_SYSTEM_PROMPT,
    buildCoachUserPrompt,
    generateRuleBasedExplanation,
    CoachPromptParams,
} from './prompts';
import { buildMatchContext } from './matchContext';

const SAMPLE_PARAMS: CoachPromptParams = {
    verdict: 'blunder',
    equityLoss: -0.145,
    playedMove: '13/7',
    optimalMove: '8/4 6/4',
    features: {
        player: 'X',
        pipCountDiff: {
            player: 140,
            opponent: 155,
            leader: 'X',
            diff: -15,
        },
        blotsAndShots: {
            user: [{ point: 7, directShots: 4, indirectShots: 2, totalShots: 6 }],
            best: [],
        },
        boardStructure: {
            innerBoardPoints: 3,
            advancedAnchor: true,
            goldenPoint: false,
            barPoint: true,
            longestPrime: 3,
        },
        contactStatus: 'contact',
    },
    matchContext: buildMatchContext({
        scoreX: 4,
        scoreO: 3,
        matchLength: 7,
        cubeValue: 2,
        cubeOwner: 'X',
        crawford: false,
    }),
    playerLevel: 'intermediate',
};

describe('Coach Prompts & Instructions', () => {
    describe('BACKGAMMON_COACH_SYSTEM_PROMPT', () => {
        it('définit le rôle de Grand-Maître pédagogue', () => {
            expect(BACKGAMMON_COACH_SYSTEM_PROMPT).toContain('Grand-Maître International de Backgammon');
            expect(BACKGAMMON_COACH_SYSTEM_PROMPT).toContain('pédagogue');
        });

        it('impose une règle anti-hallucination stricte', () => {
            expect(BACKGAMMON_COACH_SYSTEM_PROMPT).toContain('RÈGLES ANTI-HALLUCINATION STRICTES');
            expect(BACKGAMMON_COACH_SYSTEM_PROMPT).toContain('JAMAIS inventer');
            expect(BACKGAMMON_COACH_SYSTEM_PROMPT).toContain('STRICTEMENT sur les concepts et métriques');
        });

        it('spécifie la gestion du contexte de match et du videau', () => {
            expect(BACKGAMMON_COACH_SYSTEM_PROMPT).toContain('CONTEXTE DU MATCH & VIDEAU');
            expect(BACKGAMMON_COACH_SYSTEM_PROMPT).toContain('DMP');
            expect(BACKGAMMON_COACH_SYSTEM_PROMPT).toContain('crawford');
            expect(BACKGAMMON_COACH_SYSTEM_PROMPT).toContain('matchLength');
        });

        it('exige un format de réponse JSON strict avec schéma défini', () => {
            expect(BACKGAMMON_COACH_SYSTEM_PROMPT).toContain('FORMAT DE RÉPONSE OBLIGATOIRE (JSON STRICT)');
            expect(BACKGAMMON_COACH_SYSTEM_PROMPT).toContain('"summary"');
            expect(BACKGAMMON_COACH_SYSTEM_PROMPT).toContain('"explanation"');
            expect(BACKGAMMON_COACH_SYSTEM_PROMPT).toContain('"keyConcept"');
            expect(BACKGAMMON_COACH_SYSTEM_PROMPT).toContain('"advice"');
        });

        it('intègre le vocabulaire technique officiel', () => {
            expect(BACKGAMMON_COACH_SYSTEM_PROMPT).toContain('Golden Point');
            expect(BACKGAMMON_COACH_SYSTEM_PROMPT).toContain('Bar Point');
            expect(BACKGAMMON_COACH_SYSTEM_PROMPT).toContain('Jan intérieur');
            expect(BACKGAMMON_COACH_SYSTEM_PROMPT).toContain('Prime');
        });
    });

    describe('buildCoachUserPrompt', () => {
        it('sérialise fidèlement toutes les métriques dans le prompt utilisateur', () => {
            const prompt = buildCoachUserPrompt(SAMPLE_PARAMS);

            expect(prompt).toContain('BLUNDER');
            expect(prompt).toContain('-0.145');
            expect(prompt).toContain('"13/7"');
            expect(prompt).toContain('"8/4 6/4"');
            expect(prompt).toContain('Match en 7 points');
            expect(prompt).toContain('Score X: 4, O: 3');
            expect(prompt).toContain('Videau: 2');
            expect(prompt).toContain('15 pips');
            expect(prompt).toContain('6 tirs/36');
            expect(prompt).toContain('Flèche 7');
            expect(prompt).toContain('JSON strict');
        });

        it('gère une partie d\'argent sans matchLength', () => {
            const moneyParams = {
                ...SAMPLE_PARAMS,
                matchContext: buildMatchContext({
                    scoreX: 0,
                    scoreO: 0,
                    matchLength: 0,
                    cubeValue: 1,
                    cubeOwner: null,
                }),
            };
            const prompt = buildCoachUserPrompt(moneyParams);
            expect(prompt).toContain('Partie d\'argent');
        });
    });

    describe('generateRuleBasedExplanation (repli heuristique)', () => {
        it('génère une explication cohérente basée sur les tirs concédés', () => {
            const res = generateRuleBasedExplanation(SAMPLE_PARAMS);

            expect(res.verdict).toBe('blunder');
            expect(res.summary).toContain('6 tirs directs');
            expect(res.explanation).toContain('13/7');
            expect(res.explanation).toContain('8/4 6/4');
            expect(res.keyConcept).toBe('Minimisation des tirs');
            expect(res.conceptId).toBe('duplication');
            expect(res.whyFailed).toBeTruthy();
            expect(res.whyOptimal).toBeTruthy();
            expect(res.advice).toBeTruthy();
        });
    });
});
