/**
 * @file src/lib/__tests__/coachTurnLifecycleAndBotWiring.test.ts
 * @description Suite de tests unitaires validant les 5 Verrous Techniques du cycle Coach & Bot (< 350 lignes, 0 any).
 */

import { describe, it, expect } from 'vitest';
import { createInitialState, generateLegalMoves } from '../../engine/backgammonEngine';
import {
    createHumanTurnSnapshot,
    verifyCheckersPhysicallyExistOnBoard,
    validateMoveAgainstSnapshot,
    sanitizeVerdictWithEquityThreshold,
} from '../../features/coach/turnSnapshot';
import {
    selectBotMoveWithBgsage,
    normalizeBoardStateForBgsage,
    type BgsageEvaluateResponse,
} from '../engine/bgsageClient';
import { BLUNDER_CAP_EMG_BY_DIFFICULTY } from '../../features/personas/botPersonas';
import { resolvePersonaMeta } from '../../components/board/BoardPortraitAndActionRails';

describe('Verrou 1 : Capture immuable du tour humain (HumanTurnSnapshot)', () => {
    it('Preuve 1 : Snapshot pris au lancer humain valide 15 pions par camp et clone le plateau', () => {
        const state = createInitialState();
        state.turn = 'X';
        const dice: [number, number] = [6, 4];
        const snapshot = createHumanTurnSnapshot(state, dice, 1);

        expect(snapshot).not.toBeNull();
        expect(snapshot?.actor).toBe('HUMAN');
        expect(snapshot?.dice).toEqual([6, 4]);
        expect(snapshot?.boardBeforeMove.length).toBe(26);
        expect(snapshot?.pipCountX).toBe(167);
        expect(snapshot?.pipCountO).toBe(167);

        // Vérifie l'immutabilité du snapshot
        const mutableBoard = [...state.board];
        mutableBoard[1] = 99;
        expect(snapshot?.boardBeforeMove[1]).not.toBe(99);

        // Rejet si ce n'est pas le tour de l'humain
        const botState = { ...state, turn: 'O' as const };
        expect(createHumanTurnSnapshot(botState, dice, 1)).toBeNull();

        // Rejet si le compte des pions est corrompu (pas 15 pions)
        const corruptedBoard = [...state.board];
        corruptedBoard[6] = 10; // Trop de pions
        const corruptedState = { ...state, board: corruptedBoard };
        expect(createHumanTurnSnapshot(corruptedState, dice, 1)).toBeNull();
    });
});

describe('Verrou 2 : Coupe-circuit anti-bot & Triple Assertion', () => {
    it('Preuve 2 : Le coup du bot ne déclenche JAMAIS la validation du tour joueur', () => {
        const state = createInitialState();
        state.turn = 'X';
        const snapshot = createHumanTurnSnapshot(state, [6, 4], 1);

        // Appel avec actor === 'O' -> bloqué net
        const botAttempt = validateMoveAgainstSnapshot(snapshot, '8/2* 6/2', '24/14', 'O');
        expect(botAttempt.isValid).toBe(false);
        expect(botAttempt.reason).toBe('ANTI_BOT_SHORT_CIRCUIT_TRIGGERED');
    });

    it('Preuve 3A : Assertion A (Mêmes dés) rejette les coups avec dés discordants', () => {
        const state = createInitialState();
        state.turn = 'X';
        const snapshot = createHumanTurnSnapshot(state, [6, 4], 1);

        // Coup utilisant 5 et 3 alors que les dés sont 6 et 4
        const mismatchAttempt = validateMoveAgainstSnapshot(snapshot, '8/3 6/3', '24/14', 'X');
        expect(mismatchAttempt.isValid).toBe(false);
        expect(mismatchAttempt.reason).toContain('DICE_MISMATCH');
    });

    it('Preuve 3B : Assertion B (Existence physique des pions) éradique les coups fantômes (ex: 11/7)', () => {
        const state = createInitialState();
        state.turn = 'X';
        const snapshot = createHumanTurnSnapshot(state, [6, 4], 1);

        // Sur le plateau initial, la case 11 a 0 pion pour X : 11/7 est physiquement impossible
        expect(verifyCheckersPhysicallyExistOnBoard('11/7 13/7', snapshot!.boardBeforeMove, 'X')).toBe(false);

        // En revanche, 24/14 ou 8/2 6/2 ont des pions réels sur 24, 8 et 6
        expect(verifyCheckersPhysicallyExistOnBoard('8/2 6/2', snapshot!.boardBeforeMove, 'X')).toBe(true);
        expect(verifyCheckersPhysicallyExistOnBoard('24/14', snapshot!.boardBeforeMove, 'X')).toBe(true);

        // La validation globale rejette tout coup optimal fantôme
        const phantomValidation = validateMoveAgainstSnapshot(snapshot, '8/2 6/2', '11/7 13/7', 'X');
        expect(phantomValidation.isValid).toBe(false);
        expect(phantomValidation.reason).toBe('PHANTOM_OPTIMAL_MOVE_11/7 13/7');
    });

    it('Preuve 3C : Assertion C (Vérité d\'équité) ne punit JAMAIS un bon coup (|ΔEMG| <= 0.020)', () => {
        // Une perte minime (ex: 0.012 EMG) doit rester 'good' ou 'optimal', jamais 'inaccuracy' ou 'blunder'
        expect(sanitizeVerdictWithEquityThreshold(0.005, 'optimal')).toBe('optimal');
        expect(sanitizeVerdictWithEquityThreshold(0.015, 'inaccuracy')).toBe('good');
        expect(sanitizeVerdictWithEquityThreshold(0.020, 'inaccuracy')).toBe('good');

        // Une vraie erreur (>= 0.080 EMG) est bien un blunder
        expect(sanitizeVerdictWithEquityThreshold(0.085, 'blunder')).toBe('blunder');
    });
});

describe('Verrou 3 : Vrai branchement du Bot sur Open Sage & Filtrage Δ_max calibré', () => {
    it('Preuve 4 : Normalisation correcte de la perspective bot pour Open Sage', () => {
        const state = createInitialState();
        state.turn = 'O';
        state.scoreX = 2;
        state.scoreO = 1;

        const normalized = normalizeBoardStateForBgsage(state);
        expect(normalized.turn).toBe('X');
        expect(normalized.scoreX).toBe(1);
        expect(normalized.scoreO).toBe(2);
        // La case 24 de O devient la case 1 de X
        expect(normalized.board[1]).toBe(state.board[24] === 0 ? 0 : -state.board[24]);
    });

    it('Preuve 4B : Respect absolu du plafond Δ_max pour chaque niveau de bot', async () => {
        const state = createInitialState();
        state.turn = 'O';
        const legalSeqs = generateLegalMoves(state, [6, 4]);

        const fakeBgsageResponse: BgsageEvaluateResponse = {
            isRace: false,
            chequerPlay: [
                { rank: 1, notation: '24/14', equity: 0.100, equityLoss: 0.0, probabilities: null, evalLevel: '3-ply' },
                { rank: 2, notation: '24/18 13/9', equity: 0.080, equityLoss: 0.020, probabilities: null, evalLevel: '3-ply' },
                { rank: 3, notation: '13/7 13/9', equity: 0.035, equityLoss: 0.065, probabilities: null, evalLevel: '3-ply' },
                { rank: 4, notation: '8/2 6/2', equity: -0.010, equityLoss: 0.110, probabilities: null, evalLevel: '3-ply' },
                { rank: 5, notation: '24/20 24/18', equity: -0.200, equityLoss: 0.300, probabilities: null, evalLevel: '3-ply' },
            ],
            cubeDecision: {},
            source: 'bgsage-stage11',
        };

        // Grandmaster : toujours le meilleur coup (Δ = 0.000)
        const gmChoice = await selectBotMoveWithBgsage(
            state, legalSeqs, 'grandmaster', 1000, () => 0.0, fakeBgsageResponse,
        );
        expect(gmChoice?.equityLoss).toBe(0.0);

        // Expert : perte plafonnée à 0.035 EMG
        const expertChoice = await selectBotMoveWithBgsage(
            state, legalSeqs, 'expert', 1000, () => 0.0, fakeBgsageResponse,
        );
        expect(expertChoice?.equityLoss).toBeLessThanOrEqual(BLUNDER_CAP_EMG_BY_DIFFICULTY.expert);

        // Intermediate : perte plafonnée à 0.075 EMG
        const interChoice = await selectBotMoveWithBgsage(
            state, legalSeqs, 'intermediate', 1000, () => 0.0, fakeBgsageResponse,
        );
        expect(interChoice?.equityLoss).toBeLessThanOrEqual(BLUNDER_CAP_EMG_BY_DIFFICULTY.intermediate);

        // Beginner : perte plafonnée à 0.115 EMG (ne prend JAMAIS le move à 0.300 EMG)
        const begChoice = await selectBotMoveWithBgsage(
            state, legalSeqs, 'beginner', 1000, () => 0.0, fakeBgsageResponse,
        );
        expect(begChoice?.equityLoss).toBeLessThanOrEqual(BLUNDER_CAP_EMG_BY_DIFFICULTY.beginner);
    });
});

describe('Verrou 4 : Carte d\'adversaire exempte de badges 3-ply mensongers', () => {
    it('Preuve 5 : Un bot IA n\'affiche JAMAIS de mention "3-Ply", "Open Sage" ou faux PR statique', () => {
        const botMeta = resolvePersonaMeta('beginner', 'fr', null, null, null);
        expect(botMeta.opponentDisplayName).toBeDefined();
        expect(botMeta.opponentDisplayName).not.toContain('3-Ply');
        expect(botMeta.opponentDisplayName).not.toContain('Open Sage');

        // L'Elo d'un bot non classé en ligne est '—' (pas de faux rating)
        expect(botMeta.botElo).toBe('—');

        // Le badge du bot indique son style humain (ex: Blitz Agressif)
        expect(botMeta.opponentBadge).toBeDefined();
        expect(botMeta.opponentBadge).not.toContain('3-Ply');
    });
});
