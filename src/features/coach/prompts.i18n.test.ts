import { describe, it, expect } from 'vitest';
import {
    getCoachSystemPrompt,
    buildCoachUserPrompt,
    generateRuleBasedExplanation,
    BACKGAMMON_COACH_SYSTEM_PROMPT,
    BACKGAMMON_COACH_SYSTEM_PROMPT_EN,
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

describe('Coach Prompts & Explanations i18n (FR/EN)', () => {
    describe('getCoachSystemPrompt', () => {
        it('retourne le prompt système français par défaut ou avec "fr"', () => {
            const promptFr = getCoachSystemPrompt('fr');
            expect(promptFr).toBe(BACKGAMMON_COACH_SYSTEM_PROMPT);
            expect(promptFr).toContain('Grand-Maître International de Backgammon');
            expect(promptFr).toContain('FORMAT DE RÉPONSE OBLIGATOIRE (JSON STRICT)');
        });

        it('retourne le prompt système anglais avec "en"', () => {
            const promptEn = getCoachSystemPrompt('en');
            expect(promptEn).toBe(BACKGAMMON_COACH_SYSTEM_PROMPT_EN);
            expect(promptEn).toContain('International Grandmaster of Backgammon');
            expect(promptEn).toContain('MANDATORY RESPONSE FORMAT (STRICT JSON)');
        });
    });

    describe('buildCoachUserPrompt', () => {
        it('génère le prompt utilisateur en français', () => {
            const prompt = buildCoachUserPrompt({ ...SAMPLE_PARAMS, language: 'fr' });
            expect(prompt).toContain('DIAGNOSTIC DU MOTEUR');
            expect(prompt).toContain('Coup joué par le joueur : "13/7"');
            expect(prompt).toContain('Coup optimal recommandé par le moteur : "8/4 6/4"');
            expect(prompt).toContain('Niveau déclaré du joueur : intermediate');
            expect(prompt).toContain('CONTEXTE DE MATCH :');
        });

        it('génère le prompt utilisateur en anglais', () => {
            const prompt = buildCoachUserPrompt({ ...SAMPLE_PARAMS, language: 'en' });
            expect(prompt).toContain('ENGINE DIAGNOSIS:');
            expect(prompt).toContain('Move played by player: "13/7"');
            expect(prompt).toContain('Optimal move recommended by engine: "8/4 6/4"');
            expect(prompt).toContain('Declared player level: intermediate');
            expect(prompt).toContain('MATCH CONTEXT:');
        });
    });

    describe('generateRuleBasedExplanation', () => {
        it('produit une explication règle-basée en français', () => {
            const explanation = generateRuleBasedExplanation({ ...SAMPLE_PARAMS, language: 'fr' });
            expect(explanation.summary).toContain('Le coup concède 6 tirs directs contre seulement 0 pour le meilleur coup');
            expect(explanation.explanation).toContain('En jouant 13/7, vous laissez un blot vulnérable');
            expect(explanation.explanation).toContain('Le coup optimal 8/4 6/4 réduit cette exposition');
            expect(explanation.keyConcept).toBe('Minimisation des tirs');
            expect(explanation.advice).toContain('Quand votre adversaire a un jan intérieur solide');
        });

        it('produit une explication règle-basée en anglais', () => {
            const explanation = generateRuleBasedExplanation({ ...SAMPLE_PARAMS, language: 'en' });
            expect(explanation.summary).toContain('The move concedes 6 direct shots compared to only 0 for the best move');
            expect(explanation.explanation).toContain('By playing 13/7, you leave a vulnerable blot');
            expect(explanation.explanation).toContain('The optimal move 8/4 6/4 reduces this exposure');
            expect(explanation.keyConcept).toBe('Shot Minimization');
            expect(explanation.advice).toContain('When your opponent has a strong home board');
        });
    });
});
