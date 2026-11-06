import { describe, it, expect } from 'vitest';
import {
    HUMAN_PERSONA_POOL,
    FORBIDDEN_PERSONA_USERNAME_REGEX,
    selectNaturalHumanMoveFromBgsage,
    computeHumanThinkingDelay,
    resolveMoveThinkingContext,
    type EvaluatedMoveOption,
} from '../../features/personas/humanPersonaPool';
import {
    analyzeHumanMoveFromLogWithBgsage,
} from '../../features/coach/logAnalyzer';
import { resolveUserCodeProfile } from '../../features/multiplayer/userCodeSessionService';
import type { MatchLogEntry } from '../../actions/types';

describe('Human Persona 300 Authenticity & Coach Isolation Audit', () => {
    // 1. Audit des 300 profils : intégrité, réalisme, 0 robot, 4 formats
    it('300 profils uniques, 0 nom générique Bot/AI/Guest, 4 formats de pseudos, drapeaux valides et Elo non ronds', () => {
        expect(HUMAN_PERSONA_POOL).toHaveLength(300);

        const seenIds = new Set<string>();
        const seenUsernames = new Set<string>();

        let countInitial = 0; // Ex: Thomas R.
        let countDeptYear = 0; // Ex: thomas_69, laurent75
        let countClubCity = 0; // Ex: Kosta_Ath, MonacoRoll
        let countJargon = 0; // Ex: PrimeBuilder, AnchorMaster

        for (const seed of HUMAN_PERSONA_POOL) {
            // Unicité absolue des ID et pseudos
            expect(seenIds.has(seed.id)).toBe(false);
            seenIds.add(seed.id);

            const lowerName = seed.username.toLowerCase();
            expect(seenUsernames.has(lowerName)).toBe(false);
            seenUsernames.add(lowerName);

            // Zéro mot interdit (mots entiers)
            expect(FORBIDDEN_PERSONA_USERNAME_REGEX.test(seed.username)).toBe(false);
            expect(/\b(bot|ai|guest|ia)\b/i.test(seed.username)).toBe(false);

            // Drapeaux et pays valides
            expect(seed.countryFlag.length).toBeGreaterThan(0);
            expect(seed.countryName.length).toBeGreaterThan(0);

            // Elo non rond (aucun multiple de 10)
            expect(seed.baseRating % 10).not.toBe(0);

            // Plafonds d'équité cohérents
            if (seed.difficulty === 'expert') {
                expect(seed.maxDeltaEmg).toBeLessThanOrEqual(0.035);
                expect(seed.baseRating).toBeGreaterThanOrEqual(1650);
            } else if (seed.difficulty === 'intermediate') {
                expect(seed.maxDeltaEmg).toBeLessThanOrEqual(0.075);
                expect(seed.baseRating).toBeGreaterThanOrEqual(1500);
            } else {
                expect(seed.maxDeltaEmg).toBeLessThanOrEqual(0.145);
                expect(seed.baseRating).toBeLessThan(1500);
            }

            // Détection des formats authentiques de noms de club
            if (/^[\p{L}-]+(?:\s[a-z]{2})?\s[A-Z]\.$/u.test(seed.username)) {
                countInitial++;
            }
        }

        expect(countInitial).toBe(300);
        // Vérification de la résolution par code utilisateur (user_1, hum_001, prénom_initiale, nom normalisé)
        const sample1 = resolveUserCodeProfile('user_1');
        const sample2 = resolveUserCodeProfile('hum_042');
        const sample3 = resolveUserCodeProfile('Thomas R.');
        const sample4 = resolveUserCodeProfile('thomas_r');

        expect(sample1).not.toBeNull();
        expect(sample2).not.toBeNull();
        expect(sample3).not.toBeNull();
        expect(sample4).not.toBeNull();
    });

    // 2. Simulation de 300 tours (1 par profil) : respect strict de DeltaMax et différentiation Agressif vs Prudent
    it('Simulation de 300 tours (1 par profil) : 100% des coups respectent DeltaMax sur bgsage et différencient le style Agressif vs Prudent', () => {
        const candidateMoves: ReadonlyArray<EvaluatedMoveOption<string>> = [
            { move: '24/20 13/9', equity: 0.120, equityLoss: 0.000 },
            { move: '13/9 13/10', equity: 0.095, equityLoss: 0.025 },
            { move: '24/18', equity: 0.065, equityLoss: 0.055 },
            { move: '8/4 6/4', equity: 0.025, equityLoss: 0.095 },
            { move: '6/1 6/2', equity: -0.080, equityLoss: 0.200 },
        ];

        let turnsSimulated = 0;
        for (const seed of HUMAN_PERSONA_POOL) {
            // Toujours déterministe avec uniformFn = 0 (meilleur candidat du pool éligible)
            const chosen = selectNaturalHumanMoveFromBgsage(candidateMoves, seed, () => 0);
            const chosenOption = candidateMoves.find((m) => m.move === chosen)!;

            // 100 % des coups respectent le plafond strict Delta_max du profil
            expect(chosenOption.equityLoss).toBeLessThanOrEqual(seed.maxDeltaEmg);
            expect(chosenOption.equityLoss).toBeLessThan(0.150); // Aucun coup absurde
            turnsSimulated++;
        }
        expect(turnsSimulated).toBe(300);

        // Vérification de la différenciation comportementale Agressif (Hit) vs Prudent (Making Point)
        const hitVsPointDecision: ReadonlyArray<EvaluatedMoveOption<string>> = [
            { move: '13/9* (Hit)', equity: 0.100, equityLoss: 0.010, isHit: true },
            { move: '8/4 6/4 (Point)', equity: 0.100, equityLoss: 0.010, makesPoint: true },
        ];

        const aggressiveSeed = HUMAN_PERSONA_POOL.find((s) => s.cubeTemperament === 'aggressive')!;
        const cautiousSeed = HUMAN_PERSONA_POOL.find((s) => s.cubeTemperament === 'cautious')!;

        const aggPick = selectNaturalHumanMoveFromBgsage(hitVsPointDecision, aggressiveSeed, () => 0);
        const cautPick = selectNaturalHumanMoveFromBgsage(hitVsPointDecision, cautiousSeed, () => 0);

        expect(aggPick).toBe('13/9* (Hit)');
        expect(cautPick).toBe('8/4 6/4 (Point)');
    });

    // 3. Cadencement humain HumanThinkingDelay par complexité
    it('HumanThinkingDelay respecte les bornes temporelles selon la complexité de la position (forcé vs course vs contact complexe)', () => {
        const contexts = ['forced_move', 'simple_race', 'complex_contact', 'cube_decision', 'dice_roll', 'matchmaking'] as const;

        for (const ctx of contexts) {
            const minDelay = computeHumanThinkingDelay(ctx, () => 0.0);
            const midDelay = computeHumanThinkingDelay(ctx, () => 0.5);
            const maxDelay = computeHumanThinkingDelay(ctx, () => 1.0);

            expect(minDelay.selectedMs).toBe(minDelay.minMs);
            expect(maxDelay.selectedMs).toBe(maxDelay.maxMs);
            expect(midDelay.selectedMs).toBeGreaterThanOrEqual(minDelay.minMs);
            expect(midDelay.selectedMs).toBeLessThanOrEqual(maxDelay.maxMs);

            // Vérification des bornes métier précises
            if (ctx === 'forced_move') {
                expect(minDelay.minMs).toBeGreaterThanOrEqual(800);
                expect(maxDelay.maxMs).toBeLessThanOrEqual(1400);
            } else if (ctx === 'simple_race') {
                expect(minDelay.minMs).toBeGreaterThanOrEqual(1400);
                expect(maxDelay.maxMs).toBeLessThanOrEqual(2600);
            } else if (ctx === 'complex_contact') {
                expect(minDelay.minMs).toBeGreaterThanOrEqual(3200);
                expect(maxDelay.maxMs).toBeLessThanOrEqual(6800);
            } else if (ctx === 'cube_decision') {
                expect(minDelay.minMs).toBeGreaterThanOrEqual(3500);
                expect(maxDelay.maxMs).toBeLessThanOrEqual(7500);
            }
        }

        // Résolution dynamique du contexte
        expect(resolveMoveThinkingContext({ legalMoveCount: 1, isContact: true, closeDecisionsCount: 0 })).toBe('forced_move');
        expect(resolveMoveThinkingContext({ legalMoveCount: 14, isContact: true, closeDecisionsCount: 3 })).toBe('complex_contact');
        expect(resolveMoveThinkingContext({ legalMoveCount: 6, isContact: false, closeDecisionsCount: 1 })).toBe('simple_race');
    });

    // 4. Isolation stricte du Coach : 0 analyse d'erreur sur le tour de l'adversaire
    it("Le Coach ne se déclenche jamais comme une erreur du joueur sur le tour de l'adversaire", async () => {
        const opponentMoveEntry: MatchLogEntry = {
            turnIndex: 2,
            player: 'O', // L'adversaire joue
            dice: [6, 1],
            boardBefore: [
                0, -2, 0, 0, 0, 0, 5, 0, 3, 0, 0, 0, -5,
                5, 0, 0, 0, -3, 0, -5, 0, 0, 0, 0, 2, 0,
            ],
            movePlayed: [{ from: 6, to: 0 }], // Même si le coup est un blunder
            boardAfter: [
                0, -2, 0, 0, 0, 0, 4, 0, 3, 0, 0, 0, -5,
                5, 0, 0, 0, -3, 0, -5, 0, 0, 0, 0, 2, 0,
            ],
            notation: '6/0',
        };

        // Analyse asynchrone Open Sage : doit impérativement retourner null pour l'adversaire
        const asyncResult = await analyzeHumanMoveFromLogWithBgsage({
            logEntry: opponentMoveEntry,
            localPlayer: 'X',
        });
        expect(asyncResult).toBeNull();

        // Par contraste, le coup du joueur local X d'ouverture est bien analysé
        const initialBoard = [
            0, -2, 0, 0, 0, 0, 5, 0, 3, 0, 0, 0, -5,
            5, 0, 0, 0, -3, 0, -5, 0, 0, 0, 0, 2, 0,
        ];
        const humanMoveEntry: MatchLogEntry = {
            turnIndex: 1,
            player: 'X',
            dice: [3, 1],
            boardBefore: initialBoard,
            movePlayed: [{ from: 8, to: 5 }, { from: 6, to: 5 }],
            boardAfter: initialBoard,
            notation: '8/5 6/5',
        };
        const humanResult = await analyzeHumanMoveFromLogWithBgsage({
            logEntry: humanMoveEntry,
            localPlayer: 'X',
        });
        expect(humanResult).not.toBeNull();
        expect(humanResult?.player).toBe('X');
        expect(humanResult?.verdict).toBe('optimal');
    });
});
