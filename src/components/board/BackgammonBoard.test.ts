import { describe, it, expect } from 'vitest';
import {
    computeBarLayout,
    computeCoachGhostPositions,
} from './BackgammonBoard';
import {
    X_BAR,
    O_BAR,
    X_OFF,
    Move,
} from '../../engine/backgammonEngine';

function makeBoard(
    xPoints: Record<number, number> = {},
    oPoints: Record<number, number> = {},
    xBar = 0,
    oBar = 0,
): number[] {
    const board = new Array<number>(26).fill(0);
    for (const [p, n] of Object.entries(xPoints)) board[Number(p)] = n;
    for (const [p, n] of Object.entries(oPoints)) board[Number(p)] = -n;
    board[X_BAR] = xBar;
    board[O_BAR] = -oBar;
    return board;
}

describe('computeCoachGhostPositions (index datterrissage exact)', () => {
    it('positionne le fantôme coach à la base (index 0) sur une flèche vide', () => {
        const board = makeBoard({ 8: 2 });
        const moves: Move[] = [{ from: 8, to: 4 }];
        const positions = computeCoachGhostPositions(board, moves, 'X');

        expect(positions).toHaveLength(1);
        expect(positions[0]).not.toBeNull();
        expect(positions[0]!.point).toBe(4);
        expect(positions[0]!.landingIndex).toBe(0);
    });

    it('positionne le fantôme coach à la base (index 0) lors dune frappe dun blot adverse', () => {
        // Point 4 a 1 pion adverse (-1). X frappe ce pion.
        const board = makeBoard({ 8: 1 }, { 4: 1 });
        const moves: Move[] = [{ from: 8, to: 4 }];
        const positions = computeCoachGhostPositions(board, moves, 'X');

        expect(positions).toHaveLength(1);
        expect(positions[0]).not.toBeNull();
        expect(positions[0]!.point).toBe(4);
        // Le blot est envoyé à la barre, le pion qui frappe atterrit donc à l'index 0 (base)
        expect(positions[0]!.landingIndex).toBe(0);
    });

    it('positionne le fantôme coach au sommet dune pile alliée existante', () => {
        // Point 4 a déjà 2 pions X. X en ajoute un 3ème.
        const board = makeBoard({ 4: 2, 8: 1 });
        const moves: Move[] = [{ from: 8, to: 4 }];
        const positions = computeCoachGhostPositions(board, moves, 'X');

        expect(positions).toHaveLength(1);
        expect(positions[0]!.point).toBe(4);
        expect(positions[0]!.landingIndex).toBe(2);
    });

    it('positionne deux fantômes successifs atterrissant sur la même flèche (8/4 6/4)', () => {
        // Position initiale : point 4 est vide, deux coups atterrissent sur le point 4
        const board = makeBoard({ 8: 1, 6: 1 });
        const moves: Move[] = [
            { from: 8, to: 4 },
            { from: 6, to: 4 },
        ];
        const positions = computeCoachGhostPositions(board, moves, 'X');

        expect(positions).toHaveLength(2);
        // Le premier coup atterrit à l'index 0
        expect(positions[0]!.point).toBe(4);
        expect(positions[0]!.landingIndex).toBe(0);
        // Le second coup atterrit par-dessus le premier, à l'index 1
        expect(positions[1]!.point).toBe(4);
        expect(positions[1]!.landingIndex).toBe(1);
        // La coordonnée cy du second coup est plus haute (ou décalée) que celle du premier
        expect(positions[1]!.cy).not.toBe(positions[0]!.cy);
    });

    it('ignore proprement les coups de sortie du plateau (bear-off)', () => {
        const board = makeBoard({ 1: 1 });
        const moves: Move[] = [{ from: 1, to: X_OFF }];
        const positions = computeCoachGhostPositions(board, moves, 'X');

        expect(positions).toHaveLength(1);
        expect(positions[0]).toBeNull();
    });
});

describe('computeBarLayout (évitement strict de tout chevauchement)', () => {
    const CHECKER_R = 35;
    const PLAY_Y0 = 44;
    const PLAY_Y1 = 656;

    it('évite tout chevauchement quand le videau est au centre (cubeOwner === null)', () => {
        // 4 pions X et 4 pions O sur la barre avec videau neutre
        const board = makeBoard({}, {}, 4, 4);
        const layout = computeBarLayout(board, null, 1);

        const cubeTop = layout.cube.y - layout.cube.size / 2;
        const cubeBottom = layout.cube.y + layout.cube.size / 2;

        expect(layout.cube.y).toBe((PLAY_Y0 + PLAY_Y1) / 2); // 350
        expect(layout.xCheckers).toHaveLength(4);
        expect(layout.oCheckers).toHaveLength(4);

        // Tous les pions O doivent être strictement au-dessus du videau avec marge >= 12px
        for (const o of layout.oCheckers) {
            const oBottom = o.cy + CHECKER_R;
            expect(cubeTop - oBottom).toBeGreaterThanOrEqual(12);
            expect(o.cy - CHECKER_R).toBeGreaterThanOrEqual(PLAY_Y0);
        }

        // Tous les pions X doivent être strictement en-dessous du videau avec marge >= 12px
        for (const x of layout.xCheckers) {
            const xTop = x.cy - CHECKER_R;
            expect(xTop - cubeBottom).toBeGreaterThanOrEqual(12);
            expect(x.cy + CHECKER_R).toBeLessThanOrEqual(PLAY_Y1);
        }

        // Les pions O et X ne se chevauchent pas
        const lowestO = Math.max(...layout.oCheckers.map((c) => c.cy + CHECKER_R));
        const highestX = Math.min(...layout.xCheckers.map((c) => c.cy - CHECKER_R));
        expect(highestX - lowestO).toBeGreaterThan(layout.cube.size);
    });

    it('évite tout chevauchement quand le videau est possédé par X (cubeOwner === X)', () => {
        // Videau en bas près de PLAY_Y1, 4 pions X sur la barre
        const board = makeBoard({}, {}, 4, 0);
        const layout = computeBarLayout(board, 'X', 2);

        const cubeTop = layout.cube.y - layout.cube.size / 2;
        const cubeBottom = layout.cube.y + layout.cube.size / 2;

        expect(cubeBottom).toBeLessThanOrEqual(PLAY_Y1);

        // Le pion X le plus bas doit être strictement au-dessus du videau avec marge >= 12px
        for (const x of layout.xCheckers) {
            const xBottom = x.cy + CHECKER_R;
            expect(cubeTop - xBottom).toBeGreaterThanOrEqual(12);
            expect(x.cy - CHECKER_R).toBeGreaterThanOrEqual(PLAY_Y0);
        }
    });

    it('évite tout chevauchement quand le videau est possédé par O (cubeOwner === O)', () => {
        // Videau en haut près de PLAY_Y0, 4 pions O sur la barre
        const board = makeBoard({}, {}, 0, 4);
        const layout = computeBarLayout(board, 'O', 4);

        const cubeTop = layout.cube.y - layout.cube.size / 2;
        const cubeBottom = layout.cube.y + layout.cube.size / 2;

        expect(cubeTop).toBeGreaterThanOrEqual(PLAY_Y0);

        // Le pion O le plus haut doit être strictement en-dessous du videau avec marge >= 12px
        for (const o of layout.oCheckers) {
            const oTop = o.cy - CHECKER_R;
            expect(oTop - cubeBottom).toBeGreaterThanOrEqual(12);
            expect(o.cy + CHECKER_R).toBeLessThanOrEqual(PLAY_Y1);
        }
    });

    it('positionne les badges de compteur sur le dernier pion visible quand count >= 2', () => {
        const board = makeBoard({}, {}, 5, 3);
        const layout = computeBarLayout(board, null, 1);

        expect(layout.xBadge).not.toBeNull();
        expect(layout.xBadge!.count).toBe(5);
        expect(layout.xBadge!.cy).toBe(layout.xCheckers[layout.xCheckers.length - 1].cy);

        expect(layout.oBadge).not.toBeNull();
        expect(layout.oBadge!.count).toBe(3);
        expect(layout.oBadge!.cy).toBe(layout.oCheckers[layout.oCheckers.length - 1].cy);
    });

    it('ne génère pas de badge si moins de 2 pions sont sur la barre', () => {
        const board = makeBoard({}, {}, 1, 0);
        const layout = computeBarLayout(board, null, 1);

        expect(layout.xBadge).toBeNull();
        expect(layout.oBadge).toBeNull();
    });
});
