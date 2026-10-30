import { describe, expect, it } from 'vitest';
import {
    BLUNDER_CAP_EMG_BY_DIFFICULTY,
    BOT_PERSONAS_BY_DIFFICULTY,
    computePersonaBiasDelta,
    computeRealtimeBotErrorRate,
    computeSwapDiceComparison,
    generateBotChatReply,
    getBotPersona,
    isVisuallyObviousBestMove,
    MAX_BOT_DISPLAY_PR,
} from './botPersonas';

describe('botPersonas — 4 Archétypes & Mode Adaptatif (Fun vs Pro)', () => {
    it('associe chaque difficulté à l’archétype correspondant', () => {
        expect(getBotPersona('beginner').shortName).toContain('Mauvais Joueur');
        expect(getBotPersona('intermediate').shortName).toContain('Sofia');
        expect(getBotPersona('expert').shortName).toContain('Homme d’Affaires');
        expect(getBotPersona('grandmaster').shortName).toContain('Intellectuel');
    });

    it('applique un fort bonus de frappe (Blitz) pour Le Mauvais Joueur', () => {
        const boardBefore = new Array<number>(26).fill(0);
        const boardAfterHit = new Array<number>(26).fill(0);
        boardAfterHit[0] = 1; // 1 pion humain envoyé sur la barre

        const blitzDelta = computePersonaBiasDelta(boardBefore, boardAfterHit, 'beginner');
        const raceDelta = computePersonaBiasDelta(boardBefore, boardAfterHit, 'expert');

        expect(blitzDelta).toBeGreaterThan(raceDelta);
        expect(blitzDelta).toBeGreaterThan(0.15);
    });

    it('applique le garde-fou App Store 1.2 sur les messages inappropriés', () => {
        const res = generateBotChatReply('Tu es stupide donne ton téléphone', 'intermediate', 'fun');
        expect(res.filteredByGuardrail).toBe(true);
        expect(res.text).toContain('Monte-Carlo');
    });

    it('adapte le niveau de langage entre le mode Fun (Débutant) et Pro (Expert)', () => {
        const funReply = generateBotChatReply('Donne-moi un conseil pour jouer', 'grandmaster', 'fun', 14.2);
        const proReply = generateBotChatReply('Donne-moi un conseil pour jouer', 'grandmaster', 'pro', 4.8);

        expect(funReply.text).toContain('porte');
        expect(proReply.text).toContain('PR actuel est de 4.8');
    });

    it('calcule correctement le bilan comparatif Swap Dice (Inverser les Dés)', () => {
        const summary = computeSwapDiceComparison([
            { die1: 6, die2: 6 }, // Joueur : 24 pips, 1 double
            { die1: 2, die2: 3 }, // Bot : 5 pips, 0 double
        ]);
        expect(summary.playerTotalPips).toBe(24);
        expect(summary.botTotalPips).toBe(5);
        expect(summary.playerDoubles).toBe(1);
        expect(summary.botDoubles).toBe(0);
        expect(summary.verdictText).toContain('ne vous ont pas désavantagé');
    });

    it('expose des dialogues distincts en mode fun et pro pour les 4 bots', () => {
        for (const key of ['beginner', 'intermediate', 'expert', 'grandmaster'] as const) {
            const p = BOT_PERSONAS_BY_DIFFICULTY[key];
            expect(p.dialogues.opening.fun.length).toBeGreaterThan(10);
            expect(p.dialogues.opening.pro.length).toBeGreaterThan(10);
            expect(p.targetErrorRate).toBeLessThanOrEqual(MAX_BOT_DISPLAY_PR);
        }
    });

    it('calcule en temps réel l’Error Rate (PR) des Bots avec un plafond strict à 10.0', () => {
        const boardBefore = new Array<number>(26).fill(0);
        const boardAfterWeak = new Array<number>(26).fill(0);
        // 6 pions isolés pour pousser l'erreur du bot débutant au-delà du nominal
        boardAfterWeak[2] = -1;
        boardAfterWeak[4] = -1;
        boardAfterWeak[7] = -1;
        boardAfterWeak[9] = -1;
        boardAfterWeak[11] = -1;
        boardAfterWeak[14] = -1;

        const turns = [
            { player: 'O' as const, dice: [3, 1] as const, boardBefore, boardAfter: boardAfterWeak },
            { player: 'O' as const, dice: [5, 2] as const, boardBefore, boardAfter: boardAfterWeak },
        ];

        const beginnerPr = computeRealtimeBotErrorRate(turns, 'beginner');
        const intermediatePr = computeRealtimeBotErrorRate(turns, 'intermediate');
        const expertPr = computeRealtimeBotErrorRate(turns, 'expert');
        const gmPr = computeRealtimeBotErrorRate(turns, 'grandmaster');

        expect(beginnerPr).toBeLessThanOrEqual(10.0);
        expect(beginnerPr).toBeGreaterThan(intermediatePr);
        expect(intermediatePr).toBeGreaterThan(expertPr);
        expect(expertPr).toBeGreaterThan(gmPr);
    });

    it('verrouille les coups d’évidence visuelle (Point d’Or 5/20, Point de Barre 7/18, frappe sûre) et respecte les Blunder Caps ΔE_max', () => {
        const boardBefore = new Array<number>(26).fill(0);
        boardBefore[17] = -3;
        boardBefore[19] = -5;
        const boardAfterMake20 = [...boardBefore];
        boardAfterMake20[17] = -2;
        boardAfterMake20[19] = -4;
        boardAfterMake20[20] = -2; // Ferme le Point d'Or (20 pour O) sans blot

        expect(isVisuallyObviousBestMove(boardBefore, boardAfterMake20, 'O')).toBe(true);
        expect(BLUNDER_CAP_EMG_BY_DIFFICULTY.beginner).toBe(0.16);
        expect(BLUNDER_CAP_EMG_BY_DIFFICULTY.intermediate).toBe(0.085);
        expect(BLUNDER_CAP_EMG_BY_DIFFICULTY.expert).toBe(0.035);
        expect(BLUNDER_CAP_EMG_BY_DIFFICULTY.grandmaster).toBe(0.0);
    });
});
