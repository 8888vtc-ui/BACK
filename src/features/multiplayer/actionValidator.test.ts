import { describe, it, expect } from 'vitest';
import { validateGameAction, ActionValidationContext } from './actionValidator';
import { createInitialState, X_BAR, O_BAR, X_OFF, O_OFF } from '../../engine/backgammonEngine';

describe('actionValidator (Validation Serveur Anti-triche)', () => {
    const baseRoom = {
        id: 'room_test_1',
        status: 'in_progress',
        turn: 'X' as const,
        board: createInitialState().board,
        dice: [3, 1] as [number, number] | null,
        usedDice: [false, false] as [boolean, boolean],
        cubeValue: 1,
        cubeOwner: null,
        doublingOfferedBy: null,
        isCrawford: false,
        matchLength: 7,
        scoreX: 0,
        scoreO: 0,
    };

    it('refuse une action si ce n’est pas le tour du joueur', () => {
        const result = validateGameAction({
            room: baseRoom,
            action: {
                type: 'CHECKER_MOVED',
                player: 'O', // Ce n'est pas le tour de O
                move: { from: 1, to: 4 },
                board: baseRoom.board,
                usedDice: [true, false],
                timestamp: Date.now(),
            },
        });

        expect(result.valid).toBe(false);
        expect(result.code).toBe('NOT_YOUR_TURN');
        expect(result.reason).toContain("ce n'est pas le tour de O");
    });

    it('refuse des valeurs de dés invalides (ex: dés à 7 faces ou négatifs)', () => {
        const roomNoDice = { ...baseRoom, dice: null };
        const result = validateGameAction({
            room: roomNoDice,
            action: {
                type: 'DICE_ROLLED',
                player: 'X',
                dice: [7, 0], // Invalide
                timestamp: Date.now(),
            },
        });

        expect(result.valid).toBe(false);
        expect(result.code).toBe('INVALID_DICE_VALUES');
    });

    it('refuse de relancer les dés si les dés sont déjà lancés pour le tour', () => {
        const result = validateGameAction({
            room: baseRoom, // baseRoom has dice: [3, 1]
            action: {
                type: 'DICE_ROLLED',
                player: 'X',
                dice: [4, 2],
                timestamp: Date.now(),
            },
        });

        expect(result.valid).toBe(false);
        expect(result.code).toBe('DICE_ALREADY_ROLLED');
    });

    it('refuse un coup si la case de départ ne contient aucun pion du joueur', () => {
        const result = validateGameAction({
            room: baseRoom,
            action: {
                type: 'CHECKER_MOVED',
                player: 'X',
                move: { from: 2, to: 1 }, // La flèche 2 est vide au départ
                board: baseRoom.board,
                usedDice: [true, false],
                timestamp: Date.now(),
            },
        });

        expect(result.valid).toBe(false);
        expect(result.code).toBe('NO_CHECKER_AT_SOURCE');
    });

    it('impose la règle de la barre : interdit de bouger un autre pion si un pion est sur la barre', () => {
        const boardWithBar = [...baseRoom.board];
        boardWithBar[X_BAR] = 1; // 1 pion X sur la barre

        const result = validateGameAction({
            room: { ...baseRoom, board: boardWithBar },
            action: {
                type: 'CHECKER_MOVED',
                player: 'X',
                move: { from: 24, to: 21 }, // Tente de bouger depuis 24 alors qu'il est sur la barre !
                board: boardWithBar,
                usedDice: [true, false],
                timestamp: Date.now(),
            },
        });

        expect(result.valid).toBe(false);
        expect(result.code).toBe('BAR_MUST_ENTER');
        expect(result.reason).toContain('Règle de la barre');
    });

    it('refuse un déplacement vers une flèche bloquée par 2+ pions adverses', () => {
        // Au départ, la flèche 1 a 2 pions O (-2)
        // Tentative de X de bouger de la flèche 4 (si pion présent) vers 1
        const boardCustom = [...baseRoom.board];
        boardCustom[4] = 2; // 2 pions X sur flèche 4
        // flèche 1 = -2 (bloquée par O)

        const result = validateGameAction({
            room: { ...baseRoom, board: boardCustom },
            action: {
                type: 'CHECKER_MOVED',
                player: 'X',
                move: { from: 4, to: 1 },
                board: boardCustom,
                usedDice: [true, false],
                timestamp: Date.now(),
            },
        });

        expect(result.valid).toBe(false);
        expect(result.code).toBe('POINT_BLOCKED');
        expect(result.reason).toContain('bloquée par l\'adversaire');
    });

    it('refuse le Bear-off (sortie de pion) si tous les 15 pions ne sont pas dans le jan intérieur', () => {
        // Au départ, les pions X sont dispersés (flèches 24, 13, 8, 6)
        const boardCustom = [...baseRoom.board];
        boardCustom[3] = 1; // 1 pion X en flèche 3

        const result = validateGameAction({
            room: { ...baseRoom, board: boardCustom },
            action: {
                type: 'CHECKER_MOVED',
                player: 'X',
                move: { from: 3, to: X_OFF }, // Tentative de bear-off
                board: boardCustom,
                usedDice: [true, false],
                timestamp: Date.now(),
            },
        });

        expect(result.valid).toBe(false);
        expect(result.code).toBe('BEAR_OFF_NOT_ALLOWED');
        expect(result.reason).toContain('tous les 15 pions');
    });

    it('valide un coup légal et retourne le plateau résultant', () => {
        // Coup d'ouverture standard : 24/23 (dé 1)
        const result = validateGameAction({
            room: baseRoom,
            action: {
                type: 'CHECKER_MOVED',
                player: 'X',
                move: { from: 24, to: 23 },
                board: baseRoom.board,
                usedDice: [true, false],
                timestamp: Date.now(),
            },
        });

        expect(result.valid).toBe(true);
        expect(result.code).toBe('OK');
        expect(result.resultingBoard).toBeDefined();
        expect(result.resultingBoard![24]).toBe(1); // 2 - 1 = 1
        expect(result.resultingBoard![23]).toBe(1); // 0 + 1 = 1
    });

    it('refuse une offre de videau pendant la manche de Crawford', () => {
        const result = validateGameAction({
            room: { ...baseRoom, dice: null, isCrawford: true },
            action: {
                type: 'DOUBLE_OFFERED',
                player: 'X',
                cubeValue: 2,
                timestamp: Date.now(),
            },
        });

        expect(result.valid).toBe(false);
        expect(result.code).toBe('CRAWFORD_RESTRICTION');
    });

    it('refuse une offre de videau après que les dés ont déjà été lancés', () => {
        const result = validateGameAction({
            room: { ...baseRoom, dice: [3, 1] }, // Dés déjà lancés
            action: {
                type: 'DOUBLE_OFFERED',
                player: 'X',
                cubeValue: 2,
                timestamp: Date.now(),
            },
        });

        expect(result.valid).toBe(false);
        expect(result.code).toBe('CANNOT_DOUBLE_AFTER_ROLL');
    });
});
