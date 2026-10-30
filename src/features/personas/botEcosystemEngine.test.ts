import { describe, expect, it } from 'vitest';
import {
    MAX_SLIDING_WINDOW_MESSAGES,
    buildBotLlmContextPayload,
    buildTutorModeInterjection,
    classifyMoveGradeNardex,
    classifyRollLuckRating,
    consumeGammon36Roll,
    createGammon36Grid,
    detectClassicalBlunderPattern,
    parseBotTaggedResponse,
    resolveMuskBotOrchestration,
    type ChatTurnExchange,
} from './botEcosystemEngine';

describe('botEcosystemEngine — Gammon36, Grille Nardex EMG, Mode Tuteur & Contexte LLM < 500 ms', () => {
    it('crée la grille sans hasard Gammon36 (36 combinaisons 6×6) et la consomme jusqu’à épuisement', () => {
        const grid = createGammon36Grid();
        expect(grid).toHaveLength(36);
        expect(grid.every((c) => !c.used)).toBe(true);

        const step1 = consumeGammon36Roll(grid, 6, 6);
        expect(step1.wasReset).toBe(false);
        expect(step1.updatedGrid.filter((c) => c.used)).toHaveLength(1);

        // Tenter de rejouer 6-6 avant épuisement lève une erreur explicite
        expect(() => consumeGammon36Roll(step1.updatedGrid, 6, 6)).toThrow(/6-6/);
    });

    it('classifie l’indice de chance GNU Backgammon (Huge Joker > +0.60, Very Unlucky < -0.60)', () => {
        expect(classifyRollLuckRating(0.75)).toBe('VERY_LUCKY');
        expect(classifyRollLuckRating(0.42)).toBe('LUCKY');
        expect(classifyRollLuckRating(0.05)).toBe('UNMARKED');
        expect(classifyRollLuckRating(-0.40)).toBe('UNLUCKY');
        expect(classifyRollLuckRating(-0.82)).toBe('VERY_UNLUCKY');
    });

    it('applique la grille Nardex EMG et n’interrompt pas le joueur sur un coup Douteux (0.02–0.08 EMG)', () => {
        expect(classifyMoveGradeNardex(0.012)).toBe('OPTIMAL_OR_OK');
        expect(classifyMoveGradeNardex(0.045)).toBe('DOUBTFUL');
        expect(classifyMoveGradeNardex(0.14)).toBe('ERROR');
        expect(classifyMoveGradeNardex(0.24)).toBe('BLUNDER');

        // Un coup douteux (0.05 EMG) ne déclenche pas d'interruption du Mode Tuteur
        const doubtfulRes = buildTutorModeInterjection({
            difficulty: 'grandmaster',
            equityLossEmg: 0.05,
            pattern: 'GENERAL_POSITIONAL_LOSS',
        });
        expect(doubtfulRes.shouldInterrupt).toBe(false);

        // Une gaffe (0.22 EMG) brisant un 5-prime déclenche la réplique incarnée de L'Intellectuel
        const boardBefore = new Array<number>(26).fill(0);
        const boardAfter = new Array<number>(26).fill(0);
        for (const pt of [4, 5, 6, 7, 8]) {
            boardBefore[pt] = 2;
            boardAfter[pt] = pt === 8 ? 1 : 2; // brise la 5e porte en case 8
        }
        const pattern = detectClassicalBlunderPattern({ boardBefore, boardAfter });
        expect(pattern).toBe('PREMATURE_PRIME_BREAKUP');

        const blunderRes = buildTutorModeInterjection({
            difficulty: 'grandmaster',
            equityLossEmg: 0.22,
            pattern,
        });
        expect(blunderRes.shouldInterrupt).toBe(true);
        expect(blunderRes.parsed?.emotion).toBe('thinking');
        expect(blunderRes.parsed?.action).toBe('adjust_glasses');
        expect(blunderRes.parsed?.cleanText).toContain('barricade de cinq portes');
    });

    it('assemble un contexte JSON compact fenêtré aux 10 derniers échanges (20 messages max)', () => {
        const longHistory: ChatTurnExchange[] = Array.from({ length: 30 }, (_, i) => ({
            sender: i % 2 === 0 ? 'player' : 'bot',
            text: `Message #${i + 1}`,
        }));

        const payload = buildBotLlmContextPayload({
            difficulty: 'beginner',
            equityLossEmg: 0.22,
            pattern: 'PREMATURE_PRIME_BREAKUP',
            luckDeltaEquity: 0.68,
            chatHistory: longHistory,
        });

        expect(payload.recentHistory).toHaveLength(MAX_SLIDING_WINDOW_MESSAGES);
        expect(payload.recentHistory[0].text).toBe('Message #11');
        expect(payload.turnMathSummary).toEqual({
            grade: 'BLUNDER',
            loss_emg: -0.22,
            pattern: 'PREMATURE_PRIME_BREAKUP',
            luck: 'VERY_LUCKY',
        });
        expect(payload.persona.maxSentences).toBe(3);
        expect(payload.persona.cmuZeroInsultRule).toBe(true);
    });

    it('extrait les balises [emotion:...] et [action:...] et filtre toute violation CMU / App Store 1.2', () => {
        const clean = parseBotTaggedResponse('[emotion:smug][action:rub_hands] Encore un double chanceux !');
        expect(clean).toEqual({
            cleanText: 'Encore un double chanceux !',
            emotion: 'smug',
            action: 'rub_hands',
            filteredByGuardrail: false,
        });

        const unsafe = parseBotTaggedResponse('[emotion:smug] Tu es vraiment un joueur stupide !');
        expect(unsafe.filteredByGuardrail).toBe(true);
        expect(unsafe.cleanText).not.toContain('stupide');
    });

    it('applique l’Orchestrateur Elon Musk : silence pendant la réflexion, Karma Swap sur Huge Joker du Bot, et Sparring muet en mode Pro', () => {
        // 1. Pendant que le joueur réfléchit -> Silence absolu
        const thinking = resolveMuskBotOrchestration({
            isPlayerThinking: true,
            difficulty: 'beginner',
            mode: 'fun',
            actor: 'bot',
            equityLossEmg: 0.35,
            pattern: 'PREMATURE_PRIME_BREAKUP',
            luckDeltaEquity: 0.85,
        });
        expect(thinking.shouldSpeak).toBe(false);
        expect(thinking.activeSpeaker).toBe('NONE');

        // 2. Huge Joker du Bot (> +0.60 Eq) -> Provocation + bouton Karma Swap + préchauffage du clip 9:16
        const botJoker = resolveMuskBotOrchestration({
            isPlayerThinking: false,
            difficulty: 'beginner',
            mode: 'fun',
            actor: 'bot',
            equityLossEmg: 0,
            pattern: 'GENERAL_POSITIONAL_LOSS',
            luckDeltaEquity: 0.78,
        });
        expect(botJoker.shouldSpeak).toBe(true);
        expect(botJoker.activeSpeaker).toBe('BOT_OPPONENT');
        expect(botJoker.showKarmaSwapCta).toBe(true);
        expect(botJoker.shouldPrewarmKarmaClip).toBe(true);
        expect(botJoker.quickReplyPills).toContain('⚡ Karma Swap !');

        // 3. Gaffe du joueur en mode Fun -> L'Adversaire-Tuteur intervient avec CTA Reprendre
        const funBlunder = resolveMuskBotOrchestration({
            isPlayerThinking: false,
            difficulty: 'grandmaster',
            mode: 'fun',
            actor: 'player',
            equityLossEmg: 0.24,
            pattern: 'PREMATURE_PRIME_BREAKUP',
            luckDeltaEquity: 0,
        });
        expect(funBlunder.shouldSpeak).toBe(true);
        expect(funBlunder.activeSpeaker).toBe('BOT_AS_TUTOR');
        expect(funBlunder.showOneTapReplayCta).toBe(true);

        // 4. Même gaffe du joueur en mode Pro -> Silence pendant le match (analyse différée post-match)
        const proBlunder = resolveMuskBotOrchestration({
            isPlayerThinking: false,
            difficulty: 'grandmaster',
            mode: 'pro',
            actor: 'player',
            equityLossEmg: 0.24,
            pattern: 'PREMATURE_PRIME_BREAKUP',
            luckDeltaEquity: 0,
        });
        expect(proBlunder.shouldSpeak).toBe(false);
    });
});
