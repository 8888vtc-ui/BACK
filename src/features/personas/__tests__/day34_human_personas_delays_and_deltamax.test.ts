import { describe, it, expect } from 'vitest';
import {
    HUMAN_PERSONA_POOL,
    FORBIDDEN_PERSONA_USERNAME_REGEX,
    HUMAN_BLUNDER_CAP_EMG,
    computeHumanThinkingDelay,
    resolveMoveThinkingContext,
    selectNaturalHumanMoveFromBgsage,
    type EvaluatedMoveOption,
} from '../humanPersonaPool';
import {
    computeOpponentThinkingDelay,
    getOpponentBlunderCap,
    pickOpeningBook,
} from '../../../hooks/orchestrators/opponentMoveCalculator';
import { createInitialState, generateLegalMoves } from '../../../engine/backgammonEngine';
import type { AIDifficulty } from '../../../engine/aiHeuristics';

describe('Mission 34/50: 300 Profils HumanPersonaPool, Délais Cognitifs & Plafonds DeltaMax', () => {
    // -------------------------------------------------------------------------
    // 1. Audit des 300 profils : intégrité, crédibilité, 0 mot suspect, drapeaux
    // -------------------------------------------------------------------------
    it('1. Contient exactement 300 profils humains : 0 mot "Bot", "AI", "Robot", "Open Sage", drapeaux valides et styles cohérents', () => {
        expect(HUMAN_PERSONA_POOL).toHaveLength(300);

        const seenIds = new Set<string>();
        const seenUsernames = new Set<string>();

        let beginnerCount = 0;
        let intermediateCount = 0;
        let expertCount = 0;

        for (const persona of HUMAN_PERSONA_POOL) {
            // Unicité absolue
            expect(seenIds.has(persona.id), `ID en double: ${persona.id}`).toBe(false);
            seenIds.add(persona.id);

            const lowerName = persona.username.toLowerCase();
            expect(seenUsernames.has(lowerName), `Pseudo en double: ${persona.username}`).toBe(false);
            seenUsernames.add(lowerName);

            // ZÉRO mot suspect (Bot, AI, Robot, Open Sage, Guest, Player...)
            expect(FORBIDDEN_PERSONA_USERNAME_REGEX.test(persona.username), `Pseudo interdit: ${persona.username}`).toBe(false);
            expect(FORBIDDEN_PERSONA_USERNAME_REGEX.test(persona.id), `ID interdit: ${persona.id}`).toBe(false);
            expect(/\b(bot|ai|robot|open\s*sage|player\d*|guest|ia)\b/i.test(persona.username)).toBe(false);

            // Drapeaux et pays valides
            expect(persona.countryFlag.length).toBeGreaterThanOrEqual(2);
            expect(persona.countryName.length).toBeGreaterThanOrEqual(3);

            // Rating non rond (aucun multiple de 10)
            expect(persona.baseRating % 10, `Rating rond interdit pour ${persona.username}`).not.toBe(0);

            // Tempérament de videau valide et cohérent
            expect(['cautious', 'balanced', 'aggressive']).toContain(persona.cubeTemperament);

            // Répartition par niveau
            if (persona.difficulty === 'beginner') {
                beginnerCount++;
                expect(persona.baseRating).toBeLessThan(1500);
                expect(persona.targetErPr).toBeGreaterThanOrEqual(6.0);
                expect(persona.targetErPr).toBeLessThanOrEqual(9.0);
                expect(persona.maxDeltaEmg).toBe(0.115);
            } else if (persona.difficulty === 'intermediate') {
                intermediateCount++;
                expect(persona.baseRating).toBeGreaterThanOrEqual(1500);
                expect(persona.baseRating).toBeLessThanOrEqual(1650);
                expect(persona.targetErPr).toBeGreaterThanOrEqual(3.0);
                expect(persona.targetErPr).toBeLessThanOrEqual(5.0);
                expect(persona.maxDeltaEmg).toBe(0.075);
            } else if (persona.difficulty === 'expert') {
                expertCount++;
                expect(persona.baseRating).toBeGreaterThan(1650);
                expect(persona.targetErPr).toBeGreaterThanOrEqual(1.0);
                expect(persona.targetErPr).toBeLessThanOrEqual(2.0);
                expect(persona.maxDeltaEmg).toBe(0.035);
            }
        }

        expect(beginnerCount).toBe(100);
        expect(intermediateCount).toBe(100);
        expect(expertCount).toBe(100);
    });

    // -------------------------------------------------------------------------
    // 2. Cadencement HumanThinkingDelay : instantané (400-800 ms) vs réaliste (1.5-3.5s <= 4s)
    // -------------------------------------------------------------------------
    it('2. HumanThinkingDelay est instantané (400–800 ms) sur coup forcé ou 24/13 d ouverture, et réaliste (1.5s–3.5s <= 4s) sur contact complexe', () => {
        // Coup forcé : 400–800 ms
        const forcedMin = computeHumanThinkingDelay('forced_move', () => 0.0);
        const forcedMax = computeHumanThinkingDelay('forced_move', () => 1.0);
        expect(forcedMin.selectedMs).toBe(400);
        expect(forcedMax.selectedMs).toBe(800);

        // Ouverture évidente (ex: 24/13 sur 6-5) : 400–800 ms
        const openMin = computeHumanThinkingDelay('opening_move', () => 0.0);
        const openMax = computeHumanThinkingDelay('opening_move', () => 1.0);
        expect(openMin.selectedMs).toBe(400);
        expect(openMax.selectedMs).toBe(800);

        // Contact complexe : 1500–3500 ms (1.5s–3.5s)
        const contactMin = computeHumanThinkingDelay('complex_contact', () => 0.0);
        const contactMax = computeHumanThinkingDelay('complex_contact', () => 1.0);
        expect(contactMin.selectedMs).toBe(1500);
        expect(contactMax.selectedMs).toBe(3500);

        // Jamais au-dessus de 4s (4000 ms) en cours de jeu pour ne pas ennuyer le joueur
        expect(forcedMax.selectedMs).toBeLessThanOrEqual(4000);
        expect(openMax.selectedMs).toBeLessThanOrEqual(4000);
        expect(contactMax.selectedMs).toBeLessThanOrEqual(4000);

        // Résolution dynamique avec resolveMoveThinkingContext
        expect(resolveMoveThinkingContext({ legalMoveCount: 1, isContact: true, closeDecisionsCount: 0 })).toBe('forced_move');
        expect(resolveMoveThinkingContext({ legalMoveCount: 15, isContact: true, closeDecisionsCount: 3, isOpening: true })).toBe('opening_move');
        expect(resolveMoveThinkingContext({ legalMoveCount: 12, isContact: true, closeDecisionsCount: 3, isOpening: false })).toBe('complex_contact');
        expect(resolveMoveThinkingContext({ legalMoveCount: 4, isContact: false, closeDecisionsCount: 0 })).toBe('simple_race');

        // Intégration opponentMoveCalculator
        const oppForcedDelay = computeOpponentThinkingDelay({
            legalMoveCount: 1,
            isContact: true,
            closeDecisionsCount: 0,
            uniformFn: () => 0.5,
        });
        expect(oppForcedDelay.context).toBe('forced_move');
        expect(oppForcedDelay.selectedMs).toBeGreaterThanOrEqual(400);
        expect(oppForcedDelay.selectedMs).toBeLessThanOrEqual(800);

        const oppOpeningDelay = computeOpponentThinkingDelay({
            legalMoveCount: 15,
            isContact: true,
            closeDecisionsCount: 2,
            isOpening: true,
            uniformFn: () => 0.5,
        });
        expect(oppOpeningDelay.context).toBe('opening_move');
        expect(oppOpeningDelay.selectedMs).toBeGreaterThanOrEqual(400);
        expect(oppOpeningDelay.selectedMs).toBeLessThanOrEqual(800);

        const oppComplexDelay = computeOpponentThinkingDelay({
            legalMoveCount: 14,
            isContact: true,
            closeDecisionsCount: 3,
            uniformFn: () => 0.5,
        });
        expect(oppComplexDelay.context).toBe('complex_contact');
        expect(oppComplexDelay.selectedMs).toBeGreaterThanOrEqual(1500);
        expect(oppComplexDelay.selectedMs).toBeLessThanOrEqual(3500);
        expect(oppComplexDelay.selectedMs).toBeLessThanOrEqual(4000);
    });

    // -------------------------------------------------------------------------
    // 3. Plafond DeltaMax strict sur bgsage (0 coup absurde joué en club)
    // -------------------------------------------------------------------------
    it('3. Plafond DeltaMax strict : aucun adversaire des 300 profils ne joue jamais un coup absurde sur bgsage', () => {
        const candidateMoves: ReadonlyArray<EvaluatedMoveOption<string>> = [
            { move: '24/20 13/9', equity: 0.200, equityLoss: 0.000 },
            { move: '13/9 13/10', equity: 0.170, equityLoss: 0.030 }, // Jouable expert & intermediate & beginner
            { move: '24/18', equity: 0.130, equityLoss: 0.070 },      // Jouable intermediate & beginner
            { move: '8/4 6/4', equity: 0.090, equityLoss: 0.110 },      // Jouable beginner uniquement
            { move: '6/1 6/2', equity: -0.100, equityLoss: 0.300 },     // Coup absurde (blunder massif)
        ];

        // Vérification des plafonds formels
        expect(getOpponentBlunderCap('expert')).toBe(0.035);
        expect(getOpponentBlunderCap('intermediate')).toBe(0.075);
        expect(getOpponentBlunderCap('beginner')).toBe(0.115);
        expect(HUMAN_BLUNDER_CAP_EMG.expert).toBe(0.035);
        expect(HUMAN_BLUNDER_CAP_EMG.intermediate).toBe(0.075);
        expect(HUMAN_BLUNDER_CAP_EMG.beginner).toBe(0.115);

        // Test systématique sur les 300 profils de HUMAN_PERSONA_POOL
        for (const persona of HUMAN_PERSONA_POOL) {
            for (const sampleU of [0.0, 0.33, 0.66, 0.99]) {
                const chosenMove = selectNaturalHumanMoveFromBgsage(
                    candidateMoves,
                    persona,
                    () => sampleU,
                );
                const opt = candidateMoves.find((m) => m.move === chosenMove)!;

                // Respect inconditionnel du plafond d'erreur
                expect(opt.equityLoss).toBeLessThanOrEqual(persona.maxDeltaEmg);
                expect(opt.equityLoss).toBeLessThanOrEqual(HUMAN_BLUNDER_CAP_EMG[persona.difficulty]);

                // Interdiction absolue du coup absurde (0.300 EMG)
                expect(chosenMove).not.toBe('6/1 6/2');

                // En Expert : ne joue jamais au-delà de 0.035 EMG
                if (persona.difficulty === 'expert') {
                    expect(['24/20 13/9', '13/9 13/10']).toContain(chosenMove);
                    expect(opt.equityLoss).toBeLessThanOrEqual(0.035);
                }

                // En Intermediate : ne joue jamais au-delà de 0.075 EMG
                if (persona.difficulty === 'intermediate') {
                    expect(['24/20 13/9', '13/9 13/10', '24/18']).toContain(chosenMove);
                    expect(opt.equityLoss).toBeLessThanOrEqual(0.075);
                }
            }
        }
    });

    // -------------------------------------------------------------------------
    // 4. Reconnaissance d'ouverture évidente (Lover's Leap 24/13 sur 6-5)
    // -------------------------------------------------------------------------
    it('4. Reconnaissance d ouverture évidente : 24/13 sur 6-5 joué immédiatement avec livre ou délai instantané', () => {
        const state = {
            ...createInitialState(),
            turn: 'O' as const,
            dice: [6, 5] as [number, number],
        };
        const dice65: [number, number] = [6, 5];
        const legalSeqs = generateLegalMoves(state, dice65);

        // Livre d'ouverture trouve le coup pour un profil expert
        const bookMove = pickOpeningBook(state.board, dice65, legalSeqs, 'expert');
        expect(bookMove).not.toBeNull();
        expect(bookMove?.moves).toHaveLength(2);

        // Délai instantané sur ouverture
        const delay = computeOpponentThinkingDelay({
            legalMoveCount: legalSeqs.length,
            isContact: true,
            closeDecisionsCount: 1,
            isOpening: true,
        });
        expect(delay.context).toBe('opening_move');
        expect(delay.selectedMs).toBeGreaterThanOrEqual(400);
        expect(delay.selectedMs).toBeLessThanOrEqual(800);
    });
});
