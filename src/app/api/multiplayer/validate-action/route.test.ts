import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from './route';
import { createInitialState } from '../../../../engine/backgammonEngine';

describe('POST /api/multiplayer/validate-action (API Route)', () => {
    it('GET retourne le statut du service de validation', async () => {
        const response = await GET();
        const json = await response.json();
        expect(json.status).toBe('online');
        expect(json.service).toBe('multiplayer-validator');
    });

    it('rejette une requête malformée avec statut 400', async () => {
        const req = new NextRequest('http://localhost:3000/api/multiplayer/validate-action', {
            method: 'POST',
            body: JSON.stringify({}),
        });

        const res = await POST(req);
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.valid).toBe(false);
        expect(json.code).toBe('INVALID_REQUEST');
    });

    it('valide un coup légal avec statut 200', async () => {
        const initialBoard = createInitialState().board;
        const payload = {
            action: {
                type: 'CHECKER_MOVED',
                player: 'X',
                move: { from: 24, to: 23 },
                board: initialBoard,
                usedDice: [true, false],
                timestamp: Date.now(),
            },
            room: {
                id: 'room_test',
                status: 'in_progress',
                turn: 'X',
                board: initialBoard,
                dice: [3, 1],
                usedDice: [false, false],
                cubeValue: 1,
                cubeOwner: null,
                doublingOfferedBy: null,
                isCrawford: false,
                matchLength: 7,
                scoreX: 0,
                scoreO: 0,
            },
        };

        const req = new NextRequest('http://localhost:3000/api/multiplayer/validate-action', {
            method: 'POST',
            body: JSON.stringify(payload),
        });

        const res = await POST(req);
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.valid).toBe(true);
        expect(json.resultingBoard).toBeDefined();
    });

    it('rejette un coup illégal (hors tour) avec statut 422', async () => {
        const initialBoard = createInitialState().board;
        const payload = {
            action: {
                type: 'CHECKER_MOVED',
                player: 'O', // Hors tour
                move: { from: 1, to: 4 },
                board: initialBoard,
                usedDice: [true, false],
                timestamp: Date.now(),
            },
            room: {
                id: 'room_test',
                status: 'in_progress',
                turn: 'X',
                board: initialBoard,
                dice: [3, 1],
                usedDice: [false, false],
                cubeValue: 1,
                cubeOwner: null,
                doublingOfferedBy: null,
                isCrawford: false,
                matchLength: 7,
                scoreX: 0,
                scoreO: 0,
            },
        };

        const req = new NextRequest('http://localhost:3000/api/multiplayer/validate-action', {
            method: 'POST',
            body: JSON.stringify(payload),
        });

        const res = await POST(req);
        expect(res.status).toBe(422);
        const json = await res.json();
        expect(json.valid).toBe(false);
        expect(json.code).toBe('NOT_YOUR_TURN');
    });
});
