/**
 * @file src/features/personas/humanPersonaPool.test.ts
 * @description Tests ultra-stricts de l'ÉTAPE 1 (BLOC 2/3) :
 * - 300 profils adversaires 100 % naturels (`HUMAN_PERSONA_POOL`),
 * - Interdiction formelle des mots `Bot`, `AI`, `Player123`, `Guest` et des doublons,
 * - Ratings Elo non ronds et cibles ER/PR cohérentes (`6.0–9.0` pour <1500, `3.0–5.0` pour 1500–1650, `1.0–2.0` pour >1650),
 * - Plafond Δ_max strict (`0.035` Expert, `0.075` Intermédiaire, `0.115` Club/Débutant),
 * - Heuristiques de Videau (Prudents vs Agressifs),
 * - Simulateur `HumanThinkingDelay` et Micro-Chat ≤ 30 %.
 */

import { describe, expect, it } from 'vitest';
import {
    computeHumanThinkingDelay,
    DISCREET_HUMAN_GREETINGS,
    evaluateHumanPersonaCubeHeuristic,
    FORBIDDEN_PERSONA_USERNAME_REGEX,
    HUMAN_BLUNDER_CAP_EMG,
    HUMAN_PERSONA_POOL,
    maybePickHumanMicroChatGreeting,
    resolveMoveThinkingContext,
    selectNaturalHumanMoveFromBgsage,
} from './humanPersonaPool';

describe('HumanPersonaPool — 300 Profils Humains Naturels, Calibration bgsage & HumanThinkingDelay', () => {
    it('contient exactement 300 profils uniques sans aucun mot interdit (Bot, AI, Player123, Guest) ni doublon', () => {
        expect(HUMAN_PERSONA_POOL.length).toBe(300);

        const ids = new Set<string>();
        const usernames = new Set<string>();

        for (const seed of HUMAN_PERSONA_POOL) {
            expect(seed.username.length).toBeGreaterThanOrEqual(4);
            expect(FORBIDDEN_PERSONA_USERNAME_REGEX.test(seed.username), `Pseudo interdit : ${seed.username}`).toBe(false);
            expect(FORBIDDEN_PERSONA_USERNAME_REGEX.test(seed.id), `ID interdit : ${seed.id}`).toBe(false);
            expect(seed.countryFlag.length).toBeGreaterThan(0);
            expect(seed.baseRating % 10, `Rating rond interdit pour ${seed.username}: ${seed.baseRating}`).not.toBe(0);

            ids.add(seed.id);
            usernames.add(seed.username.toLowerCase());
        }

        expect(ids.size).toBe(300);
        expect(usernames.size).toBe(300);

        // Vérifie la présence des exemples emblématiques des 4 familles de pseudos
        const allNames = new Set(HUMAN_PERSONA_POOL.map((s) => s.username));
        for (const sample of [
            'thomas_69', 'laurent75', 'mehdi_92', 'david_bg64', 'philippe59', 'marc_33',
            'Kosta_Ath', 'SvenBG', 'Murat_34', 'Giorgio_Mi', 'Hans_HH', 'Taro_Tokyo', 'Alex_Lon',
            'PipMaster', 'DoubleSix_FR', 'BackgameKing', 'Anchor24', 'CubeHunter', 'PrimeBuilder',
            'Sophie M.', 'Jean-Luc B.', 'Karim T.', 'Claire D.', 'Elena K.',
        ]) {
            expect(allNames.has(sample), `Exemple requis manquant : ${sample}`).toBe(true);
        }
    });

    it('respecte la cohérence Elo <-> ER/PR et les plafonds Δ_max stricts (0.115 / 0.075 / 0.035 EMG)', () => {
        const tier1 = HUMAN_PERSONA_POOL.filter((p) => p.difficulty === 'beginner');
        const tier2 = HUMAN_PERSONA_POOL.filter((p) => p.difficulty === 'intermediate');
        const tier3 = HUMAN_PERSONA_POOL.filter((p) => p.difficulty === 'expert');

        expect(tier1.length).toBe(100);
        expect(tier2.length).toBe(100);
        expect(tier3.length).toBe(100);

        for (const p of tier1) {
            expect(p.baseRating).toBeLessThan(1500);
            expect(p.targetErPr).toBeGreaterThanOrEqual(6.0);
            expect(p.targetErPr).toBeLessThanOrEqual(9.0);
            expect(p.maxDeltaEmg).toBe(0.115);
        }
        for (const p of tier2) {
            expect(p.baseRating).toBeGreaterThanOrEqual(1500);
            expect(p.baseRating).toBeLessThanOrEqual(1650);
            expect(p.targetErPr).toBeGreaterThanOrEqual(3.0);
            expect(p.targetErPr).toBeLessThanOrEqual(5.0);
            expect(p.maxDeltaEmg).toBe(0.075);
        }
        for (const p of tier3) {
            expect(p.baseRating).toBeGreaterThan(1650);
            expect(p.targetErPr).toBeGreaterThanOrEqual(1.0);
            expect(p.targetErPr).toBeLessThanOrEqual(2.0);
            expect(p.maxDeltaEmg).toBe(0.035);
        }

        expect(HUMAN_BLUNDER_CAP_EMG).toEqual({
            beginner: 0.115,
            intermediate: 0.075,
            expert: 0.035,
            grandmaster: 0.0,
        });
    });

    it('élimine tout coup évalué par bgsage dépassant le plafond Δ_max (0.035 / 0.075 / 0.115 EMG)', () => {
        const moves = [
            { move: '8/5 6/5', equity: 0.213, equityLoss: 0.0 },
            { move: '24/20 13/9', equity: 0.185, equityLoss: 0.028 },
            { move: '13/10 6/5', equity: 0.155, equityLoss: 0.058 },
            { move: '24/14', equity: 0.115, equityLoss: 0.098 },
            { move: '6/2', equity: -0.05, equityLoss: 0.263 },
        ];

        const expertSeed = HUMAN_PERSONA_POOL.find((s) => s.difficulty === 'expert')!;
        const interSeed = HUMAN_PERSONA_POOL.find((s) => s.difficulty === 'intermediate')!;
        const begSeed = HUMAN_PERSONA_POOL.find((s) => s.difficulty === 'beginner')!;

        for (const u of [0.05, 0.45, 0.85]) {
            const expChoice = selectNaturalHumanMoveFromBgsage(moves, expertSeed, () => u);
            expect(['8/5 6/5', '24/20 13/9']).toContain(expChoice);

            const intChoice = selectNaturalHumanMoveFromBgsage(moves, interSeed, () => u);
            expect(['8/5 6/5', '24/20 13/9', '13/10 6/5']).toContain(intChoice);

            const begChoice = selectNaturalHumanMoveFromBgsage(moves, begSeed, () => u);
            expect(begChoice).not.toBe('6/2');
        }
    });

    it('applique les heuristiques de Videau (Doubling Too Late >75% / Drop <24% Prudents ; Rush / Pride Take 17-19% Agressifs)', () => {
        // Prudent : ne double qu'à > 75 %, passe sous 24 %
        expect(evaluateHumanPersonaCubeHeuristic({ winProb: 0.72, cubeTemperament: 'cautious' })).toBe('take');
        expect(evaluateHumanPersonaCubeHeuristic({ winProb: 0.77, cubeTemperament: 'cautious' })).toBe('double');
        expect(evaluateHumanPersonaCubeHeuristic({ winProb: 0.23, cubeTemperament: 'cautious' })).toBe('drop');

        // Agressif : double sur un rush (≥ 60-62 %) et Pride Take à 17-19 %
        expect(evaluateHumanPersonaCubeHeuristic({ winProb: 0.63, cubeTemperament: 'aggressive', isOnARush: true })).toBe('double');
        expect(evaluateHumanPersonaCubeHeuristic({ winProb: 0.18, cubeTemperament: 'aggressive' })).toBe('take');
        expect(evaluateHumanPersonaCubeHeuristic({ winProb: 0.15, cubeTemperament: 'aggressive' })).toBe('drop');
    });

    it('respecte toutes les bornes temporelles de HumanThinkingDelay et le plafond de 30 % du Micro-Chat', () => {
        const bounds: Array<[Parameters<typeof computeHumanThinkingDelay>[0], number, number]> = [
            ['matchmaking', 3500, 8500],
            ['dice_roll', 600, 1500],
            ['forced_move', 800, 1400],
            ['simple_race', 1400, 2600],
            ['complex_contact', 3200, 6800],
            ['cube_decision', 3500, 7500],
        ];

        for (const [ctx, minMs, maxMs] of bounds) {
            const low = computeHumanThinkingDelay(ctx, () => 0);
            const high = computeHumanThinkingDelay(ctx, () => 1);
            expect(low.minMs).toBe(minMs);
            expect(low.maxMs).toBe(maxMs);
            expect(low.selectedMs).toBe(minMs);
            expect(high.selectedMs).toBe(maxMs);
        }

        expect(resolveMoveThinkingContext({ legalMoveCount: 1, isContact: true, closeDecisionsCount: 0 })).toBe('forced_move');
        expect(resolveMoveThinkingContext({ legalMoveCount: 12, isContact: true, closeDecisionsCount: 3 })).toBe('complex_contact');
        expect(resolveMoveThinkingContext({ legalMoveCount: 5, isContact: false, closeDecisionsCount: 1 })).toBe('simple_race');

        // Micro-Chat : déclenché uniquement si roll < 0.30 (≤ 30 % des parties)
        expect(maybePickHumanMicroChatGreeting(() => 0.30)).toBeNull();
        expect(maybePickHumanMicroChatGreeting(() => 0.85)).toBeNull();
        const activeGreeting = maybePickHumanMicroChatGreeting(() => 0.12);
        expect(DISCREET_HUMAN_GREETINGS).toContain(activeGreeting);
    });
});
