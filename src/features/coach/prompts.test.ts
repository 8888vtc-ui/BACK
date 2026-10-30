import { describe, it, expect } from 'vitest';
import {
    BACKGAMMON_COACH_SYSTEM_PROMPT,
    buildCoachUserPrompt,
    generateRuleBasedExplanation,
    CoachPromptParams,
} from './prompts';
import { buildMatchContext } from './matchContext';
import {
    pickVariedCheckerErrorCopy,
    pickVariedCubeErrorCopy,
    type VariedCheckerCategory,
    type VariedCubeCategory,
} from './coachVariedMessagesBank';

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
        it('définit le rôle de Grand-Maître charismatique et direct', () => {
            expect(BACKGAMMON_COACH_SYSTEM_PROMPT).toContain('Grand-Maître de Backgammon');
            expect(BACKGAMMON_COACH_SYSTEM_PROMPT).toContain('charismatique');
            expect(BACKGAMMON_COACH_SYSTEM_PROMPT).toContain('punchline');
        });

        it('impose une règle anti-hallucination stricte', () => {
            expect(BACKGAMMON_COACH_SYSTEM_PROMPT).toContain('RÈGLES ANTI-HALLUCINATION STRICTES');
            expect(BACKGAMMON_COACH_SYSTEM_PROMPT).toContain('JAMAIS inventer');
            expect(BACKGAMMON_COACH_SYSTEM_PROMPT).toContain('STRICTEMENT sur les métriques');
        });

        it('impose une profondeur analytique de Grand-Maître (100 à 180 mots) sans la bride de 30 mots', () => {
            expect(BACKGAMMON_COACH_SYSTEM_PROMPT).toContain('PROFONDEUR ANALYTIQUE DE GRAND-MAÎTRE (100 À 180 MOTS)');
            expect(BACKGAMMON_COACH_SYSTEM_PROMPT).toContain('100 à 180 mots');
            expect(BACKGAMMON_COACH_SYSTEM_PROMPT).toContain('Point d\'Or');
            expect(BACKGAMMON_COACH_SYSTEM_PROMPT).toContain('Compte de Keith');
            expect(BACKGAMMON_COACH_SYSTEM_PROMPT).not.toContain('30 mots');
        });

        it('exige un format de réponse JSON strict avec schéma défini', () => {
            expect(BACKGAMMON_COACH_SYSTEM_PROMPT).toContain('FORMAT DE RÉPONSE OBLIGATOIRE (JSON STRICT)');
            expect(BACKGAMMON_COACH_SYSTEM_PROMPT).toContain('"summary"');
            expect(BACKGAMMON_COACH_SYSTEM_PROMPT).toContain('"explanation"');
            expect(BACKGAMMON_COACH_SYSTEM_PROMPT).toContain('"keyConcept"');
            expect(BACKGAMMON_COACH_SYSTEM_PROMPT).toContain('"advice"');
        });

        it('intègre la structure punchline (erreur + règle d\'or)', () => {
            expect(BACKGAMMON_COACH_SYSTEM_PROMPT).toContain('erreur tactique immédiate');
            expect(BACKGAMMON_COACH_SYSTEM_PROMPT).toContain('règle d\'or');
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
            expect(prompt).toContain('ANALYSE DU VIDEAU & VOLATILITÉ (MARKET WINDOW)');
            expect(prompt).toContain('Cash Point');
            expect(prompt).toContain('JSON strict');
        });

        it('inclut la section CUBE & MARKET WINDOW VOLATILITY en anglais', () => {
            const promptEn = buildCoachUserPrompt({ ...SAMPLE_PARAMS, language: 'en' });
            expect(promptEn).toContain('## CUBE & MARKET WINDOW VOLATILITY:');
            expect(promptEn).toContain('Market Window: Double Point');
            expect(promptEn).toContain('Position Volatility:');
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

        it("utilise l'union exacte des tirs et la duplication quand shotExposure est fourni", () => {
            const prompt = buildCoachUserPrompt({
                ...SAMPLE_PARAMS,
                features: {
                    ...SAMPLE_PARAMS.features,
                    blotsAndShots: {
                        user: [
                            { point: 5, directShots: 11, indirectShots: 2, totalShots: 13 },
                            { point: 6, directShots: 11, indirectShots: 3, totalShots: 14 },
                        ],
                        best: [],
                    },
                    shotExposure: {
                        user: {
                            totalRolls: 23,
                            directRolls: 20,
                            indirectRolls: 3,
                            hittingNumbers: [3, 4],
                            duplicatedNumbers: [{ die: 3, blots: [5, 6] }],
                        },
                        best: { totalRolls: 0, directRolls: 0, indirectRolls: 0, hittingNumbers: [], duplicatedNumbers: [] },
                    },
                },
            });
            expect(prompt).toContain('23 tirs/36 distincts');
            expect(prompt).not.toContain('27 tirs/36');
            expect(prompt).toContain('le 3 frappe les flèches 5 et 6');
        });

        it('signale un majorant (≤) sans shotExposure et plusieurs blots', () => {
            const prompt = buildCoachUserPrompt({
                ...SAMPLE_PARAMS,
                features: {
                    ...SAMPLE_PARAMS.features,
                    blotsAndShots: {
                        user: [
                            { point: 5, directShots: 11, indirectShots: 2, totalShots: 13 },
                            { point: 6, directShots: 11, indirectShots: 3, totalShots: 14 },
                        ],
                        best: [],
                    },
                },
            });
            expect(prompt).toContain('≤ 27 tirs/36');
        });

        it('affiche le Keith Count en course pure et les écarts de probabilités', () => {
            const prompt = buildCoachUserPrompt({
                ...SAMPLE_PARAMS,
                features: {
                    ...SAMPLE_PARAMS.features,
                    contactStatus: 'pureRace',
                    keithCount: { player: 70, opponent: 78, diff: -8 },
                    bgsage: {
                        isRace: true,
                        playerGamePlan: 'race',
                        opponentGamePlan: 'race',
                        evalLevel: '3ply',
                        optimalMetrics: {
                            equity: 0.3, cubelessEquity: 0.3, winProb: 0.7, winGammonProb: 0.1,
                            winBackgammonProb: 0, loseGammonProb: 0.02, loseBackgammonProb: 0,
                            playerGamePlan: 'race', opponentGamePlan: 'race',
                        },
                        playedMetrics: {
                            equity: 0.2, cubelessEquity: 0.2, winProb: 0.65, winGammonProb: 0.1,
                            winBackgammonProb: 0, loseGammonProb: 0.05, loseBackgammonProb: 0,
                            playerGamePlan: 'race', opponentGamePlan: 'race',
                        },
                    },
                },
            });
            expect(prompt).toContain('Compte de Keith (après le coup joué) : Joueur 70, Adversaire 78 (écart -8)');
            expect(prompt).toContain('Gain +5.0, Gammon 0.0, Risque de gammon adverse -3.0');
        });

        it('génère un prompt spécialisé VIDEAU (sans parler de déplacement de pions) lors d’une décision de Cube', () => {
            const cubePrompt = buildCoachUserPrompt({
                ...SAMPLE_PARAMS,
                playedMove: 'Videau : Doubler (×2)',
                optimalMove: 'No double, take',
            });
            expect(cubePrompt).toContain('DÉCISION DE VIDEAU / CUBE');
            expect(cubePrompt).toContain('INTERDICTION ABSOLUE de parler de déplacements de pions');
            expect(cubePrompt).toContain('"Videau : Doubler (×2)"');
            expect(cubePrompt).toContain('"No double, take"');
            expect(cubePrompt).not.toContain('Exposition des blots après le coup joué');
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

        it('Bug 6 : ne parle PAS du Golden Point sur un simple split 24/20 (1 seul pion) et ne donne PAS le faux conseil de rompre le contact en début/milieu de partie', () => {
            const res = generateRuleBasedExplanation({
                verdict: 'doubtful',
                equityLoss: -0.045,
                playedMove: '13/9 13/8',
                optimalMove: '24/20 13/8',
                features: {
                    player: 'X',
                    pipCountDiff: {
                        player: 148,
                        opponent: 162,
                        leader: 'X',
                        diff: -14, // En avance de 14 pips mais en début/milieu de partie (148 pips)
                    },
                    blotsAndShots: {
                        user: [],
                        best: [],
                    },
                    boardStructure: {
                        innerBoardPoints: 2,
                        advancedAnchor: false,
                        goldenPoint: false,
                        barPoint: false,
                        longestPrime: 2,
                    },
                    beforeBoardStructure: {
                        innerBoardPoints: 2,
                        advancedAnchor: false,
                        goldenPoint: false,
                        barPoint: false,
                        longestPrime: 2,
                    },
                    bestBoardStructure: {
                        innerBoardPoints: 2,
                        advancedAnchor: false,
                        goldenPoint: false,
                        barPoint: false,
                        longestPrime: 2,
                    },
                    contactStatus: 'contact',
                },
            });

            expect(res.conceptId).not.toBe('golden-point');
            expect(res.conceptId).not.toBe('running-game');
            expect(res.summary).not.toContain('rompre le contact');
            expect(res.whyOptimal).not.toContain('Golden Point');
        });

        it('Bug 6 : identifie le Golden Point uniquement quand une porte (>= 2 pions) est réellement créée sur le point 5 (X) ou 20 (O)', () => {
            const res = generateRuleBasedExplanation({
                verdict: 'blunder',
                equityLoss: -0.12,
                playedMove: '24/21 13/12',
                optimalMove: '8/5 6/5',
                features: {
                    player: 'X',
                    pipCountDiff: {
                        player: 163,
                        opponent: 167,
                        leader: 'X',
                        diff: -4,
                    },
                    blotsAndShots: {
                        user: [],
                        best: [],
                    },
                    beforeBoardStructure: {
                        innerBoardPoints: 1,
                        advancedAnchor: false,
                        goldenPoint: false,
                        barPoint: false,
                        longestPrime: 1,
                    },
                    boardStructure: {
                        innerBoardPoints: 1,
                        advancedAnchor: false,
                        goldenPoint: false,
                        barPoint: false,
                        longestPrime: 1,
                    },
                    bestBoardStructure: {
                        innerBoardPoints: 2,
                        advancedAnchor: false,
                        goldenPoint: true,
                        barPoint: false,
                        longestPrime: 2,
                    },
                    contactStatus: 'contact',
                },
            });

            expect(res.conceptId).toBe('golden-point');
            expect(res.keyConcept).toBe('Contrôle du Golden Point');
        });

        it('fournit 10 variantes distinctes de style Grand-Maître IA pour chaque catégorie d’erreur (Cube et Pions)', () => {
            const cubeCats: VariedCubeCategory[] = [
                'PREMATURE_DOUBLE',
                'OPTIMISTIC_TAKE',
                'TIMID_PASS',
                'MISSED_DOUBLE',
            ];
            for (const cat of cubeCats) {
                const seen = new Set<string>();
                for (let i = 0; i < 60; i++) {
                    const copy = pickVariedCubeErrorCopy(cat, {
                        playedMove: 'Videau : Doubler (×2)',
                        optimalMove: 'No double, take',
                        equityLoss: -0.12,
                        seedExtra: `turn-${i}`,
                    });
                    seen.add(copy.summary);
                }
                expect(seen.size).toBe(10);
            }

            const checkerCats: VariedCheckerCategory[] = [
                'SHOT_EXPOSURE',
                'GOLDEN_POINT',
                'BAR_POINT',
                'PRIME_EXTEND',
                'TEMPO_HIT',
                'REAR_ESCAPE',
                'ENDGAME_CONTACT_BREAK',
                'PURE_RACE',
                'HOME_GATE',
                'ADVANCED_ANCHOR',
                'BACK_SPLIT',
                'MIDPOINT_UNSTACK',
                'POSITIONAL_FLEXIBILITY',
            ];
            for (const cat of checkerCats) {
                const seen = new Set<string>();
                for (let i = 0; i < 60; i++) {
                    const copy = pickVariedCheckerErrorCopy(cat, {
                        playedMove: '13/7',
                        optimalMove: '8/5 6/5',
                        equityLoss: -0.11,
                        userShots: 6,
                        bestShots: 0,
                        seedExtra: `turn-${i}`,
                    });
                    seen.add(copy.summary);
                }
                expect(seen.size).toBe(10);
            }
        });
    });
});
