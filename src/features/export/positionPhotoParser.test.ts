import { describe, it, expect } from 'vitest';
import {
    applyPointEditorTap,
    countBoardCheckers,
    createEmptyEditorBoard,
    createInitialEditorBoard,
    getVisualRowPointMapping,
    validateAndBuildScannedPosition,
    type RawVisionBoardPayload,
} from './positionPhotoParser';
import { X_BAR, O_BAR } from '../../engine/backgammonEngine';

describe('positionPhotoParser — Reconnaissance Photo Tournoi & Éditeur Tactile', () => {
    it('mappe correctement les 4 orientations de jan intérieur (bottom-right, bottom-left, top-right, top-left)', () => {
        const br = getVisualRowPointMapping('bottom-right');
        expect(br.topRowPoints[0]).toBe(13);
        expect(br.topRowPoints[11]).toBe(24);
        expect(br.bottomRowPoints[0]).toBe(12);
        expect(br.bottomRowPoints[11]).toBe(1);

        const bl = getVisualRowPointMapping('bottom-left');
        expect(bl.bottomRowPoints[0]).toBe(1);
        expect(bl.bottomRowPoints[5]).toBe(6);
        expect(bl.topRowPoints[0]).toBe(24);

        const tr = getVisualRowPointMapping('top-right');
        expect(tr.topRowPoints[11]).toBe(1);
        expect(tr.bottomRowPoints[0]).toBe(13);

        const tl = getVisualRowPointMapping('top-left');
        expect(tl.topRowPoints[0]).toBe(1);
        expect(tl.bottomRowPoints[0]).toBe(24);
    });

    it('valide une position de départ standard et génère le XGID exact sans avertissement', () => {
        // En orientation bottom-right :
        // topRow (13..24) : pt 13 = +5 (idx 0), pt 17 = -3 (idx 4), pt 19 = -5 (idx 6), pt 24 = +2 (idx 11)
        // bottomRow (12..1) : pt 12 = -5 (idx 0), pt 8 = +3 (idx 4), pt 6 = +5 (idx 6), pt 1 = -2 (idx 11)
        const payload: RawVisionBoardPayload = {
            topRowVisual: [5, 0, 0, 0, -3, 0, -5, 0, 0, 0, 0, 2],
            bottomRowVisual: [-5, 0, 0, 0, 3, 0, 5, 0, 0, 0, 0, -2],
            barX: 0,
            barO: 0,
            cubeValue: 2,
            cubeOwner: 'X',
            dice: [3, 1],
            turn: 'X',
        };

        const res = validateAndBuildScannedPosition(payload, 'bottom-right', {
            matchLength: 7,
            scoreX: 2,
            scoreO: 1,
        });

        expect(res.ok).toBe(true);
        if (!res.ok) return;
        expect(res.value.totalCheckersX).toBe(15);
        expect(res.value.totalCheckersO).toBe(15);
        expect(res.value.warnings).toHaveLength(0);
        expect(res.value.state.board[24]).toBe(2);
        expect(res.value.state.board[6]).toBe(5);
        expect(res.value.state.board[1]).toBe(-2);
        expect(res.value.state.dice).toEqual([3, 1]);
        expect(res.value.state.cubeValue).toBe(2);
        expect(res.value.xgid).toContain('XGID=');
    });

    it('signale un avertissement si plus de 15 pions ou une pile >= 6 sont détectés', () => {
        const payload: RawVisionBoardPayload = {
            topRowVisual: [6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5],
            bottomRowVisual: [0, 0, 0, 0, 0, 0, 6, 0, 0, 0, 0, -2],
            barX: 0,
            barO: 0,
        };

        const res = validateAndBuildScannedPosition(payload, 'bottom-right');
        expect(res.ok).toBe(true);
        if (!res.ok) return;
        expect(res.value.totalCheckersX).toBe(17);
        expect(res.value.ambiguousPoints).toContain(13);
        expect(res.value.ambiguousPoints).toContain(6);
        expect(res.value.warnings.length).toBeGreaterThanOrEqual(2);
    });

    it('rejette explicitement un payload malformé sans jamais inventer de position factice (Règle 2)', () => {
        const invalidPayload = {
            topRowVisual: [1, 2, 3],
            bottomRowVisual: [],
        } as unknown as RawVisionBoardPayload;

        const res = validateAndBuildScannedPosition(invalidPayload);
        expect(res.ok).toBe(false);
        if (!res.ok) {
            expect(res.error.message).toContain('24 flèches');
        }
    });

    it('permet d’ajuster les pions en 1 tap via applyPointEditorTap en respectant le plafond de 15 pions', () => {
        let board = createEmptyEditorBoard();
        board = applyPointEditorTap(board, 6, 'add-x');
        board = applyPointEditorTap(board, 6, 'add-x');
        expect(board[6]).toBe(2);

        // Si on clique avec add-o sur une flèche occupée par X, elle est vidée d'abord
        board = applyPointEditorTap(board, 6, 'add-o');
        expect(board[6]).toBe(0);
        board = applyPointEditorTap(board, 6, 'add-o');
        expect(board[6]).toBe(-1);

        // Gomme (remove)
        board = applyPointEditorTap(board, 6, 'remove');
        expect(board[6]).toBe(0);

        // Plafond à 15 sur la position initiale
        const fullBoard = createInitialEditorBoard();
        expect(countBoardCheckers(fullBoard)).toEqual({ totalX: 15, totalO: 15 });
        const afterExtra = applyPointEditorTap(fullBoard, 5, 'add-x');
        expect(afterExtra[5]).toBe(0); // Bloqué car déjà 15 pions X

        // Barre X et O
        const barBoard = applyPointEditorTap(createEmptyEditorBoard(), X_BAR, 'add-x');
        expect(barBoard[X_BAR]).toBe(1);
        const barBoardO = applyPointEditorTap(barBoard, O_BAR, 'add-o');
        expect(barBoardO[O_BAR]).toBe(-1);
    });
});
