import { describe, it, expect } from 'vitest';
import {
    importMatchOrPosition,
    importXGID,
    importMAT,
    importSGF,
    parseNotationToMoves,
    parseSingleMoveToken,
    expandMoveExpression,
} from './matchImporter';
import { createInitialState, X_BAR, O_BAR, X_OFF, O_OFF } from '../../engine/backgammonEngine';
import { serializeToMAT } from './matSerializer';
import type { MatchExportData } from './types';

describe('Match Importer (Universal Import Engine)', () => {
    describe('1. Parsing de notations unitaires et composées', () => {
        it('parse des coups simples pour X et O', () => {
            const moveX = parseSingleMoveToken('8/5', 'X');
            expect(moveX).toEqual({ from: 8, to: 5 });

            // Pour O, la notation '8/5' (relative à O) correspond à from: 25 - 8 = 17, to: 25 - 5 = 20
            const moveO = parseSingleMoveToken('8/5', 'O');
            expect(moveO).toEqual({ from: 17, to: 20 });
        });

        it('gère correctement les frappes avec astérisque', () => {
            const hitX = parseSingleMoveToken('13/7*', 'X');
            expect(hitX).toEqual({ from: 13, to: 7 });

            const hitO = parseSingleMoveToken('24/18*', 'O');
            expect(hitO).toEqual({ from: 1, to: 7 });
        });

        it('gère la rentrée de la barre ("bar" ou "25")', () => {
            const barX = parseSingleMoveToken('bar/20', 'X');
            expect(barX).toEqual({ from: X_BAR, to: 20 });

            const barO = parseSingleMoveToken('bar/20', 'O');
            expect(barO).toEqual({ from: O_BAR, to: 5 });

            const barNumX = parseSingleMoveToken('25/22', 'X');
            expect(barNumX).toEqual({ from: X_BAR, to: 22 });
        });

        it('gère le bear-off ("off" ou "0")', () => {
            const offX = parseSingleMoveToken('6/off', 'X');
            expect(offX).toEqual({ from: 6, to: X_OFF });

            const offO = parseSingleMoveToken('6/off', 'O');
            expect(offO).toEqual({ from: 19, to: O_OFF });

            const offZeroX = parseSingleMoveToken('3/0', 'X');
            expect(offZeroX).toEqual({ from: 3, to: X_OFF });
        });

        it('développe les répétitions entre parenthèses (ex: doubles "13/10(2)")', () => {
            const expanded = expandMoveExpression('13/10(2)', 'X');
            expect(expanded).toHaveLength(2);
            expect(expanded[0]).toEqual({ from: 13, to: 10 });
            expect(expanded[1]).toEqual({ from: 13, to: 10 });

            const quadruple = expandMoveExpression('6/off(4)', 'X');
            expect(quadruple).toHaveLength(4);
            expect(quadruple.every((m) => m.from === 6 && m.to === X_OFF)).toBe(true);
        });

        it('décompose les mouvements composés (ex: "24/18/13")', () => {
            const compound = expandMoveExpression('24/18/13', 'X');
            expect(compound).toHaveLength(2);
            expect(compound[0]).toEqual({ from: 24, to: 18 });
            expect(compound[1]).toEqual({ from: 18, to: 13 });
        });

        it('parse une ligne complète de tour et ignore les passes', () => {
            const moves = parseNotationToMoves('8/5 6/5', 'X');
            expect(moves).toEqual([
                { from: 8, to: 5 },
                { from: 6, to: 5 },
            ]);

            const passMoves = parseNotationToMoves('Cannot Move', 'X');
            expect(passMoves).toEqual([]);

            const passMoves2 = parseNotationToMoves('Pass', 'O');
            expect(passMoves2).toEqual([]);
        });
    });

    describe('2. Import XGID', () => {
        const EXAMPLE_XGID = 'XGID=B----e-c---Ee---C-E----b--:1:0:0:42:0:1:0:0:0:10';

        it('importe un XGID complet avec succès', () => {
            const res = importXGID(EXAMPLE_XGID);
            expect(res.type).toBe('xgid');
            expect(res.state.matchLength).toBe(10);
            expect(res.state.turn).toBe('X');
            expect(res.state.dice).toEqual([4, 2]);
            expect(res.state.cubeValue).toBe(1);
            expect(res.state.board[1]).toBe(-2);
            expect(res.state.board[6]).toBe(5);
        });

        it('importe un XGID sans préfixe explicite', () => {
            const raw = 'B----e-c---Ee---C-E----b--:1:0:0:42:0:1:0:0:0:10';
            const res = importXGID(raw);
            expect(res.type).toBe('xgid');
            expect(res.state.matchLength).toBe(10);
        });

        it('rejette un XGID vide ou invalide', () => {
            expect(() => importXGID('')).toThrow();
            expect(() => importXGID('XGID=invalid_garbage')).toThrow();
        });
    });

    describe('3. Import Fichier .mat (JellyFish / Galaxy / GNUbg)', () => {
        const MAT_SAMPLE = ` 7 point match

 Game 1
 Alice : 3                   Bob : 2
  1) 31: 8/5 6/5             65: 24/13
  2) 42: 8/4 6/4             52: 13/8 13/11
  3) 61: 13/7 8/7            43: 8/4 6/3
      Wins 2 points`;

        it('reconstruit fidèlement les métadonnées et la chaîne complète de tours', () => {
            const res = importMAT(MAT_SAMPLE);
            expect(res.type).toBe('mat');
            expect(res.playerX).toBe('Alice');
            expect(res.playerO).toBe('Bob');
            expect(res.matchLength).toBe(7);
            expect(res.scoreX).toBe(3);
            expect(res.scoreO).toBe(2);
            expect(res.winner).toBe('X');
            expect(res.pointsWon).toBe(2);

            // 3 lignes de 2 coups = 6 tours au total
            expect(res.turns).toHaveLength(6);

            // Tour 1 : Alice joue 31: 8/5 6/5
            const t1 = res.turns[0];
            expect(t1.turnIndex).toBe(1);
            expect(t1.player).toBe('X');
            expect(t1.dice).toEqual([3, 1]);
            expect(t1.movePlayed).toEqual([
                { from: 8, to: 5 },
                { from: 6, to: 5 },
            ]);
            // Vérifie que les pions ont bien bougé sur boardAfter
            expect(t1.boardAfter[5]).toBe(2); // Nouvelle porte sur la flèche 5
            expect(t1.boardAfter[8]).toBe(2); // 3 - 1 = 2 sur la flèche 8
            expect(t1.boardAfter[6]).toBe(4); // 5 - 1 = 4 sur la flèche 6

            // Tour 2 : Bob joue 65: 24/13
            const t2 = res.turns[1];
            expect(t2.turnIndex).toBe(2);
            expect(t2.player).toBe('O');
            expect(t2.dice).toEqual([6, 5]);
            // Chaînage parfait : le boardBefore du coup 2 est exactement le boardAfter du coup 1
            expect(t2.boardBefore).toEqual(t1.boardAfter);

            // Chaînage continu sur l'ensemble de la partie
            for (let i = 0; i < res.turns.length - 1; i++) {
                expect(res.turns[i + 1].boardBefore).toEqual(res.turns[i].boardAfter);
            }

            // Le plateau final correspond au boardAfter du dernier tour
            expect(res.finalBoard).toEqual(res.turns[res.turns.length - 1].boardAfter);
        });

        it('importe un fichier .mat généré par serializeToMAT sans altération (aller-retour)', () => {
            const initial = createInitialState(5);
            const exportData: MatchExportData = {
                gameId: 'roundtrip_1',
                playerX: 'GrandmasterX',
                playerO: 'GrandmasterO',
                matchLength: 5,
                scoreX: 1,
                scoreO: 0,
                winner: 'O',
                pointsWon: 1,
                currentState: initial,
                turnsHistory: [
                    {
                        turnNumber: 1,
                        player: 'X',
                        dice: [4, 2],
                        boardBefore: initial.board,
                        boardAfter: initial.board,
                        moves: [
                            { from: 8, to: 4 },
                            { from: 6, to: 4 },
                        ],
                    },
                    {
                        turnNumber: 2,
                        player: 'O',
                        dice: [5, 3],
                        boardBefore: initial.board,
                        boardAfter: initial.board,
                        moves: [
                            { from: 17, to: 22 }, // 8/3 en notation O
                            { from: 19, to: 22 }, // 6/3 en notation O
                        ],
                    },
                ],
            };

            const matString = serializeToMAT(exportData);
            const imported = importMAT(matString);

            expect(imported.playerX).toBe('GrandmasterX');
            expect(imported.playerO).toBe('GrandmasterO');
            expect(imported.matchLength).toBe(5);
            expect(imported.turns).toHaveLength(2);
            expect(imported.turns[0].player).toBe('X');
            expect(imported.turns[1].player).toBe('O');
        });
    });

    describe('4. Détecteur universel importMatchOrPosition', () => {
        it('aiguille automatiquement vers XGID pour une chaîne XGID', () => {
            const res = importMatchOrPosition('XGID=B----e-c---Ee---C-E----b--:1:0:0:42:0:1:0:0:0:7');
            expect(res.type).toBe('xgid');
        });

        it('aiguille automatiquement vers MAT pour un fichier texte JellyFish', () => {
            const content = ` 5 point match\n Game 1\n Alice : 0 Bob : 0\n 1) 31: 8/5 6/5\n`;
            const res = importMatchOrPosition(content);
            expect(res.type).toBe('mat');
        });

        it('aiguille automatiquement vers SGF pour un fichier SGF', () => {
            const content = '(;FF[4]GM[6]PB[Alice]PW[Bob]MI[length:7][bs:0][ws:0];B[31]8/5 6/5)';
            const res = importMatchOrPosition(content);
            expect(res.type).toBe('sgf');
        });

        it('lève une erreur claire sur un contenu non reconnu', () => {
            expect(() => importMatchOrPosition('Ceci est un texte quelconque')).toThrow(
                /Format non reconnu/,
            );
        });
    });
});
