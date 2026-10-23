/**
 * Tests unitaires pour l'architecture atomique "1 Bouton = 1 Micro-Programme"
 * Valide les 5 Lois Fondamentales (LOI 1, LOI 2, LOI 3, LOI 4, LOI 5).
 */

import { describe, it, expect, vi } from 'vitest';
import {
    GamePhase,
    MatchLogEntry,
    commitHumanMoveAction,
    runAiTurnAction,
    replayFromLogAction,
    analyzeHumanLogAction,
} from '../index';
import { deriveStrictGamePhase } from '../../hooks/useBackgammonGame';
import { createInitialState } from '../../engine/backgammonEngine';

describe('Architecture Atomique & Machine à États Stricte', () => {
    describe('LOI 2 — Machine à États Finis Unique (gamePhase)', () => {
        it('dérive rigoureusement la phase de jeu unique sans aucun booléen contradictoire', () => {
            // 1. En attente de lancer
            expect(deriveStrictGamePhase('WAITING_FOR_ROLL', [false, false], null, null)).toBe(
                'HUMAN_WAITING_ROLL',
            );

            // 2. Humain en cours de déplacement (au moins un dé restant)
            expect(deriveStrictGamePhase('PLAYING_MOVES', [true, false], null, null)).toBe(
                'HUMAN_MOVING',
            );

            // 3. Humain prêt à valider (tous les dés consommés)
            expect(deriveStrictGamePhase('PLAYING_MOVES', [true, true], null, null)).toBe(
                'HUMAN_READY_TO_COMMIT',
            );

            // 4. Tour IA - Lancer des dés (sans flèches)
            expect(deriveStrictGamePhase('OPPONENT_THINKING', [false, false], null, null)).toBe(
                'AI_TURN_ROLLING',
            );

            // 5. Tour IA - Flèches affichées avant déplacement
            expect(
                deriveStrictGamePhase(
                    'OPPONENT_THINKING',
                    [false, false],
                    [{ from: 13, to: 8 }],
                    null,
                ),
            ).toBe('AI_TURN_SHOWING_ARROWS');

            // 6. Fin de match
            expect(
                deriveStrictGamePhase('GAME_OVER', [false, false], null, {
                    winner: 'X',
                    loser: 'O',
                    pointsWon: 1,
                    multiplier: 1,
                    winType: 'single',
                }),
            ).toBe('GAME_OVER');
        });

        it('commitHumanMoveAction refuse les transitions illégales et passe à AI_TURN_ROLLING', () => {
            const initialBoard = createInitialState().board;
            const dummyMove = { from: 24, to: 20 };
            const boardAfter = [...initialBoard];

            // Rejette si la phase n'est pas autorisée
            expect(() =>
                commitHumanMoveAction({
                    currentPhase: 'HUMAN_WAITING_ROLL',
                    turnIndex: 1,
                    player: 'X',
                    dice: [4, 2],
                    boardBefore: initialBoard,
                    movesPlayed: [dummyMove],
                    boardAfter,
                    matchLog: [],
                }),
            ).toThrow(/Transition illégale/);

            // Valide et fait transiter proprement vers AI_TURN_ROLLING
            const result = commitHumanMoveAction({
                currentPhase: 'HUMAN_READY_TO_COMMIT',
                turnIndex: 1,
                player: 'X',
                dice: [4, 2],
                boardBefore: initialBoard,
                movesPlayed: [dummyMove],
                boardAfter,
                matchLog: [],
            });

            expect(result.nextPhase).toBe('AI_TURN_ROLLING');
            expect(result.updatedLog).toHaveLength(1);
            expect(result.newLogEntry.player).toBe('X');
            expect(Object.isFrozen(result.newLogEntry)).toBe(true);
            expect(Object.isFrozen(result.newLogEntry.boardBefore)).toBe(true);
            expect(Object.isFrozen(result.newLogEntry.boardAfter)).toBe(true);
        });

        it('commitHumanMoveAction passe à GAME_OVER si isGameOver est vrai', () => {
            const initialBoard = createInitialState().board;
            const result = commitHumanMoveAction({
                currentPhase: 'HUMAN_READY_TO_COMMIT',
                turnIndex: 1,
                player: 'X',
                dice: [4, 2],
                boardBefore: initialBoard,
                movesPlayed: [{ from: 1, to: 0 }],
                boardAfter: initialBoard,
                matchLog: [],
                isGameOver: true,
            });

            expect(result.nextPhase).toBe('GAME_OVER');
        });
    });

    describe('LOI 4 — Analyse Log-Driven Exclusivement Réservée au Joueur Connecté', () => {
        it('ignore strictement les entrées de log de l’ordinateur / adversaire (O)', () => {
            const board = createInitialState().board;
            const aiLogEntry: MatchLogEntry = Object.freeze({
                turnIndex: 1,
                player: 'O',
                dice: [3, 1] as const,
                boardBefore: Object.freeze([...board]),
                movePlayed: Object.freeze([{ from: 1, to: 4 }]),
                boardAfter: Object.freeze([...board]),
                notation: '1/4',
            });

            const analysis = analyzeHumanLogAction({
                logEntry: aiLogEntry,
                localConnectedPlayer: 'X',
            });

            // STRICTEMENT NULL : on n'analyse jamais les coups de l'ordinateur
            expect(analysis).toBeNull();
        });

        it('analyse le coup du joueur Blanc (X) depuis boardBefore et retourne une évaluation complète', () => {
            const board = createInitialState().board;
            const humanLogEntry: MatchLogEntry = Object.freeze({
                turnIndex: 1,
                player: 'X',
                dice: [3, 1] as const,
                boardBefore: Object.freeze([...board]),
                movePlayed: Object.freeze([
                    { from: 8, to: 5 },
                    { from: 6, to: 5 },
                ]),
                boardAfter: Object.freeze([...board]),
            });

            const analysis = analyzeHumanLogAction({
                logEntry: humanLogEntry,
                localConnectedPlayer: 'X',
            });

            expect(analysis).not.toBeNull();
            expect(analysis?.player).toBe('X');
            expect(analysis?.playedNotation).toContain('8/5');
            expect(analysis?.optimalNotation).toBeDefined();
            expect(analysis?.verdict).toBe('optimal'); // 8/5 6/5 est le coup optimal sur 3-1 !
            expect(analysis?.equityLoss).toBeCloseTo(0, 2);
        });
    });

    describe('LOI 1, 2, 3 — runAiTurnAction (Paliers temporels et garantie try/finally)', () => {
        it('exécute les 3 paliers du tour IA et rend systématiquement la main à HUMAN_WAITING_ROLL', async () => {
            const board = createInitialState().board;
            const phases: GamePhase[] = [];
            let arrowsReceived: Array<{ from: number; to: number }> = [];
            let boardReceived: ReadonlyArray<number> | null = null;
            let logEntryReceived: MatchLogEntry | null = null;

            const entry = await runAiTurnAction(
                {
                    currentBoard: board,
                    turnIndex: 2,
                    dice: [3, 1],
                    difficulty: 'expert',
                    rollDurationMs: 0, // synchrone pour les tests unitaires
                    previewDurationMs: 0,
                },
                {
                    onPhaseChange: (p) => phases.push(p),
                    onArrowsReady: (arrows) => {
                        arrowsReceived = arrows;
                    },
                    onApplyBoard: (b) => {
                        boardReceived = b;
                    },
                    onLogEntryAdded: (l) => {
                        logEntryReceived = l;
                    },
                },
            );

            // Vérification de la séquence de phases (LOI 2)
            expect(phases).toContain('AI_TURN_ROLLING');
            expect(phases).toContain('AI_TURN_SHOWING_ARROWS');
            expect(phases[phases.length - 1]).toBe('HUMAN_WAITING_ROLL');

            // Vérification des flèches et de la log (LOI 3)
            expect(arrowsReceived.length).toBeGreaterThan(0);
            expect(boardReceived).not.toBeNull();
            expect(logEntryReceived).not.toBeNull();
            expect(entry.player).toBe('O');
            expect(Object.isFrozen(entry)).toBe(true);
            expect(Object.isFrozen(entry.boardBefore)).toBe(true);
            expect(Object.isFrozen(entry.boardAfter)).toBe(true);
        });

        it('garantit le retour à HUMAN_WAITING_ROLL même en cas d’exception dans les calculs', async () => {
            const board = createInitialState().board;
            const phases: GamePhase[] = [];

            // Simule un callback qui lève une exception pendant l'affichage des flèches
            const throwingCallbacks = {
                onPhaseChange: (p: GamePhase) => phases.push(p),
                onArrowsReady: () => {
                    throw new Error('Erreur simulée dans le rendu graphique des flèches');
                },
            };

            await expect(
                runAiTurnAction(
                    {
                        currentBoard: board,
                        turnIndex: 2,
                        dice: [3, 1],
                        rollDurationMs: 0,
                        previewDurationMs: 0,
                    },
                    throwingCallbacks,
                ),
            ).rejects.toThrow('Erreur simulée dans le rendu graphique des flèches');

            // Malgré l'exception, le bloc finally a OBLIGATOIREMENT libéré la main
            expect(phases[phases.length - 1]).toBe('HUMAN_WAITING_ROLL');
        });
    });

    describe('LOI 3 — replayFromLogAction (Reconstitution fidèle et immuable)', () => {
        it('reconstruit la position sans altérer le log', () => {
            const boardBefore = createInitialState().board;
            const boardAfter = [...boardBefore];
            boardAfter[24] -= 1;
            boardAfter[20] += 1;

            const logEntry: MatchLogEntry = Object.freeze({
                turnIndex: 5,
                player: 'X',
                dice: [4, 2] as const,
                boardBefore: Object.freeze([...boardBefore]),
                movePlayed: Object.freeze([{ from: 24, to: 20 }]),
                boardAfter: Object.freeze([...boardAfter]),
                notation: '24/20',
            });

            // Replay de boardBefore
            const replayBefore = replayFromLogAction({ logEntry, showBefore: true });
            expect(replayBefore.previewBoard).toEqual(boardBefore);
            expect(replayBefore.activePlayer).toBe('X');
            expect(replayBefore.dice).toEqual([4, 2]);

            // Replay de boardAfter
            const replayAfter = replayFromLogAction({ logEntry, showBefore: false });
            expect(replayAfter.previewBoard).toEqual(boardAfter);
            expect(replayAfter.turnIndex).toBe(5);
            expect(replayAfter.arrows).toEqual([{ from: 24, to: 20 }]);
        });
    });
});
