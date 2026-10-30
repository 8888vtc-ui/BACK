/**
 * @file src/lib/export/photoToXgidAndMat.test.ts
 * @description Tests unitaires des parseurs binaires Delphi/Pascal (.xg : TRichGameHeader 8232B,
 * EngineStructBestMove 2184B, EngineStructDoubleAction 132B), de l'automate JellyFish (.mat)
 * et du pipeline optique « Photo-to-XGID » (Homographie 3x3, contrainte des 15 dames, 1-Tap & Search Interval 3-Ply).
 */

import { describe, it, expect } from 'vitest';
import {
    XG_CONSTANTS,
    parseRichGameHeader,
    parseEngineStructBestMove,
    parseEngineStructDoubleAction,
    positionEngineToXGIDCheckers,
    createStartingBoard,
    encodeXGID,
} from './xgBinaryAndMatParser';
import {
    BoardHomographyRectifier,
    TournamentBoardOpticalAnalyzer,
    OneTapXGIDController,
    parseMatMatchToXGIDs,
    runXG3PlySearchIntervalPipeline,
    type CandidateMoveEval,
} from './photoToXgidPipeline';

describe('Spécifications Binaires Delphi/Pascal (.xg) — Alignement Exact', () => {
    it('valide la signature RGMH (0x484D4752) de TRichGameHeader (8 232 octets) et calcule zlibPayloadOffset', () => {
        const buf = new ArrayBuffer(XG_CONSTANTS.RICH_HEADER_SIZE);
        const view = new DataView(buf);
        view.setUint32(0, XG_CONSTANTS.RM_MAGICNUMBER, true);
        view.setUint32(4, 1, true);
        view.setUint32(8, XG_CONSTANTS.RICH_HEADER_SIZE, true);
        view.setUint32(20, 4096, true); // dwThumbnailSize = 4096

        const header = parseRichGameHeader(buf);
        expect(header.magicNumber).toBe(XG_CONSTANTS.RM_MAGICNUMBER);
        expect(header.thumbnailSize).toBe(4096);
        expect(header.zlibPayloadOffset).toBe(8232 + 4096);
    });

    it('décode EngineStructBestMove sur exactement 2 184 octets avec le padding Delphi aux octets 26..27', () => {
        const bytes = new Uint8Array(XG_CONSTANTS.BEST_MOVE_STRUCT_SIZE);
        const view = new DataView(bytes.buffer);
        bytes[1] = 2; // pos[1] = 2
        // Octets 26..27 = padding d'alignement 4 octets
        view.setInt32(28, 6, true); // Dice[1] = 6
        view.setInt32(32, 4, true); // Dice[2] = 4
        view.setInt32(48, 2, true); // Cube = 2
        bytes[2182] = 0; // Choice0
        bytes[2183] = 1; // Choice3

        const decoded = parseEngineStructBestMove(bytes, 0);
        expect(decoded.pos[1]).toBe(2);
        expect(decoded.dice).toEqual([6, 4]);
        expect(decoded.cube).toBe(2);
        expect(decoded.choice3).toBe(1);
    });

    it('décode EngineStructDoubleAction sur exactement 132 octets avec le padding Delphi aux octets 26..27', () => {
        const bytes = new Uint8Array(XG_CONSTANTS.DOUBLE_ACTION_STRUCT_SIZE);
        const view = new DataView(bytes.buffer);
        view.setInt32(28, 2, true); // Level = 2 (3-ply)
        view.setInt32(40, 4, true); // Cube = 4
        view.setFloat32(88, 0.72, true); // equB (No Double)
        view.setFloat32(92, 0.85, true); // equDouble (Double/Take)
        view.setFloat32(96, 1.0, true); // equDrop

        const decoded = parseEngineStructDoubleAction(bytes, 0);
        expect(decoded.level).toBe(2);
        expect(decoded.cube).toBe(4);
        expect(decoded.equNoDouble).toBeCloseTo(0.72, 2);
        expect(decoded.equDoubleTake).toBeCloseTo(0.85, 2);
        expect(decoded.equDrop).toBeCloseTo(1.0, 2);
    });

    it('convertit un PositionEngine du joueur du Haut (turn = -1) vers le référentiel XGID du joueur du Bas', () => {
        const pos = new Int8Array(26);
        pos[24] = 2;
        const xgidCheckers = positionEngineToXGIDCheckers(pos, -1);
        expect(xgidCheckers[1]).toBe(-2);
    });
});

describe('Automate JellyFish (.mat) -> XGID (Inversion 1-24, Frappes Implicites, Crawford)', () => {
    it('transcrit un match .mat avec multiplicateurs (2), frappes implicites sans * et détection Crawford/Post-Crawford', () => {
        const matSample = `
; [Variation "Standard"]
3 point match

 Game 1
 Alice : 0                 Bob : 0
  1) 31: 8/5 6/5           42: 8/4 6/4
  2) 61: 13/7 8/7          cannot move

 Game 2
 Alice : 2                 Bob : 0
  1) 65: 24/13             33: 24/21(2) 13/10(2)

 Game 3
 Alice : 2                 Bob : 1
  1) 42: 8/4 6/4           51: 24/23 13/8
`;
        const snapshots = parseMatMatchToXGIDs(matSample);
        expect(snapshots.length).toBe(8);

        // Game 2 : Alice a 2 points dans un match en 3 -> Manche Crawford (champ 8 = 1)
        const game2Turn1 = snapshots.find((s) => s.gameNumber === 2 && s.moveNumber === 1 && s.player === 1);
        expect(game2Turn1?.xgidBeforePlay.split(':')[7]).toBe('1');

        // Game 3 : Post-Crawford (champ 8 = 0)
        const game3Turn1 = snapshots.find((s) => s.gameNumber === 3 && s.moveNumber === 1 && s.player === 1);
        expect(game3Turn1?.xgidBeforePlay.split(':')[7]).toBe('0');
    });
});

describe('Pipeline Optique « Photo-to-XGID » — Homographie, Contrainte 15 Dames, 1-Tap & Search Interval', () => {
    it('résout exactement l’homographie inverse 3x3 pour un quadrilatère projectif vers 1024x800', () => {
        const H = BoardHomographyRectifier.computeInverseHomography([
            { x: 100, y: 50 },
            { x: 1124, y: 50 },
            { x: 1124, y: 850 },
            { x: 100, y: 850 },
        ]);
        // Pour (u=0, v=0) -> (x=100, y=50)
        expect(H[2]).toBeCloseTo(100, 4);
        expect(H[5]).toBeCloseTo(50, 4);
        // Pour (u=1024, v=800) -> (x=1124, y=850)
        const denom = H[6]! * 1024 + H[7]! * 800 + 1;
        const xProj = (H[0]! * 1024 + H[1]! * 800 + H[2]!) / denom;
        const yProj = (H[3]! * 1024 + H[4]! * 800 + H[5]!) / denom;
        expect(xProj).toBeCloseTo(1124, 3);
        expect(yProj).toBeCloseTo(850, 3);
    });

    it('régularise une pile de 6 dames sous-comptée à 5 grâce à la contrainte des 15 dames par camp', () => {
        const detections = [
            { pointIndex: 6, rawCount: 5, regularizedCount: 5, owner: 1 as const, confidence: 0.62, isStacked: false },
            { pointIndex: 8, rawCount: 3, regularizedCount: 3, owner: 1 as const, confidence: 0.96, isStacked: false },
            { pointIndex: 13, rawCount: 4, regularizedCount: 4, owner: 1 as const, confidence: 0.94, isStacked: false },
            { pointIndex: 24, rawCount: 2, regularizedCount: 2, owner: 1 as const, confidence: 0.98, isStacked: false },
        ];
        // Somme brute = 14 avec 0 pion sorti -> la flèche 6 (confiance 0.62) passe à 6 dames empilées
        const res = TournamentBoardOpticalAnalyzer.enforceFifteenCheckersConstraint(detections, 0, 15);
        expect(res.bearOffBottom).toBe(0);
        expect(detections[0]?.regularizedCount).toBe(6);
        expect(detections[0]?.isStacked).toBe(true);
    });

    it('ajuste les piles en 1-Tap, inverse le sens 1-24 et exécute l’entonnoir Search Interval Normal (32 -> 8 -> 4)', async () => {
        const initial: {
            checkers: Int8Array;
            cubeExp: number;
            cubeOwner: -1 | 0 | 1;
            turn: -1 | 1;
            dice: string;
            scoreBottom: number;
            scoreTop: number;
            crawfordOrJacoby: number;
            matchLength: number;
            maxCubeExp: number;
        } = {
            checkers: createStartingBoard('Standard'),
            cubeExp: 0,
            cubeOwner: 0,
            turn: 1,
            dice: '31',
            scoreBottom: 0,
            scoreTop: 0,
            crawfordOrJacoby: 0,
            matchLength: 7,
            maxCubeExp: 10,
        };
        const ctrl = new OneTapXGIDController(initial);
        expect(ctrl.getXGID()).toBe(encodeXGID(initial));

        // Tap sur le slot 5 de la flèche 6 (qui contient déjà 5 dames) -> passe à 6 dames
        const updatedXgid = ctrl.onTapPointSlot(6, 5, 1);
        expect(updatedXgid).toContain('XGID=-b----F');

        // Entonnoir Search Interval Normal
        const candidates: CandidateMoveEval[] = Array.from({ length: 12 }, (_, idx) => ({
            moveNotation: `m${idx}`,
            resultingXGID: updatedXgid,
            equity1PlyCubeless: 0.5 - idx * 0.03,
            evalLevelReached: 1 as const,
        }));

        const ranked = await runXG3PlySearchIntervalPipeline(candidates, 'Normal', {
            eval1PlyCubeful: async (m) => m.equity1PlyCubeless,
            eval2Ply: async (m) => (m.equity1PlyCubeful ?? 0) - 0.01,
            eval3Ply: async (m) => (m.equity2Ply ?? 0) + 0.005,
        });

        const count3Ply = ranked.filter((m) => m.evalLevelReached === 3).length;
        expect(count3Ply).toBeLessThanOrEqual(4);
        expect(ranked[0]?.evalLevelReached).toBe(3);
    });
});
