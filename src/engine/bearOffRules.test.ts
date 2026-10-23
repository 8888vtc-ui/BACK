import { describe, it, expect } from 'vitest';
import { X_OFF, O_OFF, X_BAR } from './backgammonEngine';
import {
    canPlayerBearOff,
    getHighestOccupiedInnerPoint,
    isLegalOverRollBearOff,
    resolveDeterministicBearOffMove,
    isQuickBearOffSwipe,
    formatBearOffCounter,
} from './bearOffRules';

describe('bearOffRules (Audit 4/20 — Sortie des Pions & Sur-lancer)', () => {
    it('valide que les 15 pions sont dans le jan intérieur avant d’autoriser le bear-off', () => {
        const board = new Array<number>(26).fill(0);
        board[1] = 5;
        board[6] = 10;
        expect(canPlayerBearOff(board, 'X')).toBe(true);

        // Un pion traînant sur le point 7 interdit la sortie
        board[7] = 1;
        expect(canPlayerBearOff(board, 'X')).toBe(false);

        // Un pion sur la barre interdit la sortie
        board[7] = 0;
        board[X_BAR] = 1;
        expect(canPlayerBearOff(board, 'X')).toBe(false);
    });

    it('identifie le pion le plus éloigné dans le jan intérieur et valide la règle du sur-lancer (over-roll)', () => {
        const board = new Array<number>(26).fill(0);
        board[4] = 2; // Pion le plus éloigné en 4
        board[2] = 3;

        const highest = getHighestOccupiedInnerPoint(board, 'X');
        expect(highest).toEqual({ point: 4, distance: 4 });

        // Dé 6 ou 5 > 4 : le sur-lancer est légal uniquement depuis le point 4 (le plus éloigné)
        expect(isLegalOverRollBearOff(board, 'X', 4, 6)).toBe(true);
        expect(isLegalOverRollBearOff(board, 'X', 4, 5)).toBe(true);
        // Interdit de sortir le point 2 en sur-lancer tant qu'il reste un pion en 4 !
        expect(isLegalOverRollBearOff(board, 'X', 2, 6)).toBe(false);
    });

    it('résout de manière 100 % déterministe : correspondance exacte d’abord, puis sur-lancer depuis le plus éloigné', () => {
        const leftDieTargets = new Map<number, number[]>([[4, [X_OFF]]]); // Dé 6 (over-roll depuis 4)
        const rightDieTargets = new Map<number, number[]>([[2, [X_OFF]]]); // Dé 2 (exact depuis 2)

        // Même si preferredDie = 0 (dé 6), le dé 2 a une correspondance exacte (point 2 === dé 2)
        const exactFirst = resolveDeterministicBearOffMove({
            player: 'X',
            offPoint: X_OFF,
            leftDieTargets,
            rightDieTargets,
            dice: [6, 2],
            preferredDie: 0,
        });
        expect(exactFirst).toEqual({
            from: 2,
            to: X_OFF,
            die: 1,
            dieValue: 2,
            isOverRoll: false,
        });

        // Quand les deux dés sont en sur-lancer (ex: [6, 5] avec pions en 4 et 3), choisit le pion le plus éloigné (4)
        const overRollOnly = resolveDeterministicBearOffMove({
            player: 'X',
            offPoint: X_OFF,
            leftDieTargets: new Map<number, number[]>([[4, [X_OFF]], [3, [X_OFF]]]),
            rightDieTargets: new Map<number, number[]>([[4, [X_OFF]]]),
            dice: [6, 5],
            preferredDie: 0,
        });
        expect(overRollOnly).toEqual({
            from: 4,
            to: X_OFF,
            die: 0,
            dieValue: 6,
            isOverRoll: true,
        });

        // Fonctionne de manière symétrique pour O (sortie vers 25 depuis 19..24)
        const oExact = resolveDeterministicBearOffMove({
            player: 'O',
            offPoint: O_OFF,
            leftDieTargets: new Map<number, number[]>([[22, [O_OFF]]]), // 25 - 22 = 3 (exact pour dé 3)
            rightDieTargets: new Map<number, number[]>([[23, [O_OFF]]]),
            dice: [3, 5],
            preferredDie: 0,
        });
        expect(oExact?.from).toBe(22);
        expect(oExact?.isOverRoll).toBe(false);
    });

    it('détecte un swipe rapide vers le sabot extérieur et formate le compteur exact count/15', () => {
        expect(isQuickBearOffSwipe(42, 6)).toBe(true);
        expect(isQuickBearOffSwipe(12, 5)).toBe(false); // Trop court
        expect(isQuickBearOffSwipe(35, 40)).toBe(false); // Trop vertical

        expect(formatBearOffCounter(0)).toBe('0/15');
        expect(formatBearOffCounter(7)).toBe('7/15');
        expect(formatBearOffCounter(15)).toBe('15/15');
    });
});
