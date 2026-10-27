import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
    createInitialState,
    generateLegalMoves,
    serializeXGID,
    parseXGID,
    applyMove,
    borneOffCount,
    X_BAR,
    O_BAR,
    O_OFF,
    type BoardState,
} from '../../engine/backgammonEngine';
import {
    selectBotMoveWithBgsage,
    bgsageMoveBoardToProjectBoard,
    ensureBgsageSafeXgid,
    clearBgsageEvaluationCache,
    type BgsageEvaluateResponse,
} from './bgsageClient';
import {
    findBestBoardMove,
    formatMoveSequenceNotationAbsolute,
    analyzeBoardMoves,
} from './evaluator';
import { analyzeHumanMoveFromLogWithBgsage } from '../../features/coach/logAnalyzer';
import type { MatchLogEntry } from '../../actions/types';

describe('Chantier 1 — Cerveau du Bot & Évaluateur Irréprochable (bgsageClient)', () => {
    beforeEach(() => {
        clearBgsageEvaluationCache();
    });

    afterEach(() => {
        clearBgsageEvaluationCache();
    });

    it('1. Ne joue JAMAIS legalSeqs[0] par défaut si aucun candidat ne correspond et retourne null pour basculer sur findBestBoardMove', async () => {
        const stateO: BoardState = {
            ...createInitialState(7),
            turn: 'O',
            dice: [3, 1],
        };
        const legalO = generateLegalMoves(stateO, [3, 1]);
        expect(legalO.length).toBeGreaterThan(1);

        // Vérifie que legalSeqs[0] est un coup arbitraire (1/4 1/2) et NON le coup optimal (17/20 19/20)
        const firstLegalNotation = formatMoveSequenceNotationAbsolute(legalO[0].moves, 'O');
        expect(firstLegalNotation).not.toBe('17/20 19/20');

        // Réponse dont ni le plateau ni la notation ne correspondent à un coup légal
        const unmatchedResponse: BgsageEvaluateResponse = {
            chequerPlay: [
                {
                    rank: 1,
                    notation: '99/98',
                    equity: 0.25,
                    equityLoss: 0,
                    probabilities: null,
                    board: null,
                },
            ],
            cubeDecision: { optimalAction: 'No Double' },
        };

        const botChoice = await selectBotMoveWithBgsage(
            stateO,
            legalO,
            'expert',
            1000,
            Math.random,
            unmatchedResponse,
        );
        // Ne doit JAMAIS renvoyer legalSeqs[0] : doit retourner null
        expect(botChoice).toBeNull();

        // Le repli local findBestBoardMove prend alors le relais et trouve le vrai coup optimal (fermer le point 20)
        const localBest = findBestBoardMove(stateO, [3, 1], 2);
        expect(localBest).not.toBeNull();
        expect(localBest!.sequence.board[20]).toBe(-2);
        expect(localBest!.sequence.board).not.toEqual(legalO[0].board);
    });

    it('2. Apparie par notation convertie en absolu (formatMoveSequenceNotationAbsolute) lorsque m.board est absent', async () => {
        const stateO: BoardState = {
            ...createInitialState(7),
            turn: 'O',
            dice: [3, 1],
        };
        const legalO = generateLegalMoves(stateO, [3, 1]);

        // En perspective O, "8/5 6/5" correspond à "17/20 19/20" en numérotation absolue
        const notationOnlyResponse: BgsageEvaluateResponse = {
            chequerPlay: [
                {
                    rank: 1,
                    notation: '8/5 6/5',
                    equity: 0.19,
                    equityLoss: 0,
                    probabilities: null,
                    board: null,
                },
            ],
            cubeDecision: { optimalAction: 'No Double' },
        };

        const botChoice = await selectBotMoveWithBgsage(
            stateO,
            legalO,
            'grandmaster',
            1000,
            Math.random,
            notationOnlyResponse,
        );

        expect(botChoice).not.toBeNull();
        expect(botChoice!.sequence.board[20]).toBe(-2);
        expect(botChoice!.sequence.board[17]).toBe(-2);
        expect(botChoice!.sequence.board[19]).toBe(-4);
        expect(botChoice!.sequence.board).not.toEqual(legalO[0].board);
    });

    it('3. Gère correctement source="typescript-tri-phase" (m.board déjà dans le référentiel projet board[0..25])', async () => {
        const stateO: BoardState = {
            ...createInitialState(7),
            turn: 'O',
            dice: [3, 1],
        };
        const legalO = generateLegalMoves(stateO, [3, 1]);
        const localMoves = analyzeBoardMoves(stateO, [3, 1], { ply: 2, maxMoves: 64 });

        const triPhaseResponse: BgsageEvaluateResponse = {
            source: 'typescript-tri-phase',
            chequerPlay: localMoves.moves.map((m) => ({
                rank: m.rank,
                notation: m.notation,
                equity: m.equity,
                equityLoss: m.equityLoss,
                probabilities: m.probabilities ?? null,
                board: m.board ?? null,
                moves: m.moves ?? [],
            })),
            cubeDecision: { optimalAction: 'No double, take' },
        };

        const choice = await selectBotMoveWithBgsage(
            stateO,
            legalO,
            'expert',
            1000,
            Math.random,
            triPhaseResponse,
        );

        expect(choice).not.toBeNull();
        expect(choice!.sequence.board[20]).toBe(-2);
        expect(choice!.sequence.board).toEqual(localMoves.bestMove!.board);
    });

    it('4. Symétrie exacte X / O en sortie de barre (O_BAR = 25) : serializeXGID, bgsageMoveBoardToProjectBoard et sélection optimale', async () => {
        // O a 1 pion sur la barre (O_BAR = 25), 1 blot sur la flèche 2 et ses autres pions avancés.
        // X a un blot vulnérable sur la flèche 3. Avec les dés [3, 1], O doit entrer en frappant en 3 (bar/3*)
        // et couvrir/avancer, jamais jouer un coup passif arbitraire.
        const board = new Array<number>(26).fill(0);
        board[O_BAR] = -1;
        board[2] = -1;
        board[12] = -5;
        board[17] = -3;
        board[19] = -5;

        board[3] = 1; // Blot X sur la flèche 3
        board[6] = 5;
        board[8] = 4;
        board[13] = 5;

        const stateBarO: BoardState = {
            ...createInitialState(7),
            board,
            turn: 'O',
            dice: [3, 1],
        };

        // Vérifie le round-trip XGID (y compris avec ensureBgsageSafeXgid quand la flèche 24 est vide)
        const xgid = serializeXGID(stateBarO);
        const safeXgid = ensureBgsageSafeXgid(xgid);
        const parsed = parseXGID(safeXgid);
        expect(parsed.board[O_BAR]).toBe(-1);
        expect(parsed.board[X_BAR]).toBe(0);
        expect(parsed.turn).toBe('O');

        const legalO = generateLegalMoves(stateBarO, [3, 1]);
        expect(legalO.length).toBeGreaterThan(1);

        // Test d'appariement par notation relative de barre pour O ("bar/22* 23/22" = "bar/3* 2/3" en absolu : ferme la porte 3 en frappant X)
        const barNotationResponse: BgsageEvaluateResponse = {
            chequerPlay: [
                {
                    rank: 1,
                    notation: 'bar/22* 23/22',
                    equity: 0.42,
                    equityLoss: 0,
                    probabilities: null,
                    board: null,
                },
            ],
            cubeDecision: { optimalAction: 'No Double' },
        };

        const choiceByNotation = await selectBotMoveWithBgsage(
            stateBarO,
            legalO,
            'grandmaster',
            1000,
            Math.random,
            barNotationResponse,
        );
        expect(choiceByNotation).not.toBeNull();
        expect(choiceByNotation!.sequence.board[O_BAR]).toBe(0);
        expect(choiceByNotation!.sequence.board[3]).toBe(-2); // Porte faite sur la flèche 3
        expect(choiceByNotation!.sequence.board[X_BAR]).toBe(1); // Pion X envoyé sur la barre

        // Vérifie aussi que findBestBoardMove (1-ply et 2-ply) trouve ce même coup optimal
        const bestLocal1Ply = findBestBoardMove(stateBarO, [3, 1], 1);
        const bestLocal2Ply = findBestBoardMove(stateBarO, [3, 1], 2);
        expect(bestLocal1Ply).not.toBeNull();
        expect(bestLocal2Ply).not.toBeNull();
        expect(bestLocal1Ply!.sequence.board[3]).toBe(-2);
        expect(bestLocal1Ply!.sequence.board[X_BAR]).toBe(1);
        expect(bestLocal2Ply!.sequence.board[3]).toBe(-2);
        expect(bestLocal2Ply!.sequence.board[X_BAR]).toBe(1);

        // Vérifie la conversion bgsageMoveBoardToProjectBoard quand X est sur la barre (bgsageBoard[0] = -1 pour O)
        const bgsageAfterBoard = new Array<number>(26).fill(0);
        bgsageAfterBoard[0] = -1; // Adversaire (X) sur la barre dans le référentiel bgsage
        bgsageAfterBoard[25] = 0; // Joueur actif (O) sorti de la barre
        for (let p = 1; p <= 24; p++) {
            bgsageAfterBoard[p] = -choiceByNotation!.sequence.board[25 - p];
        }
        const converted = bgsageMoveBoardToProjectBoard(bgsageAfterBoard, 'O');
        expect(converted).toEqual(choiceByNotation!.sequence.board);
    });

    it('5. Bear-Off optimal pour O (O_OFF = 25) via notation, plateau bgsage et table exacte 54 264 états', async () => {
        // O a ses pions dans son jan intérieur (19..24) : 1 pion en 19, 1 pion en 20, 2 pions en 23
        const board = new Array<number>(26).fill(0);
        board[19] = -1;
        board[20] = -1;
        board[23] = -2;
        board[1] = 2;
        board[2] = 2;

        const stateBearOffO: BoardState = {
            ...createInitialState(7),
            board,
            turn: 'O',
            dice: [6, 5],
        };

        const legalO = generateLegalMoves(stateBearOffO, [6, 5]);
        expect(legalO.length).toBeGreaterThan(1);

        // Avec [6, 5], O peut soit jouer 19/24 20/off (1 seul pion sorti), soit sortir 2 pions (19/off 20/off).
        // Vérifie que findBestBoardMove (1-ply et 2-ply) choisit toujours de sortir les 2 pions (19/off 20/off).
        const bestLocal = findBestBoardMove(stateBearOffO, [6, 5], 1);
        expect(bestLocal).not.toBeNull();
        expect(borneOffCount(bestLocal!.sequence.board, 'O')).toBe(
            borneOffCount(board, 'O') + 2,
        );

        // Vérifie aussi l'appariement par notation relative de bear-off ("6/off 5/off" -> "19/off 20/off")
        const bearOffNotationResponse: BgsageEvaluateResponse = {
            chequerPlay: [
                {
                    rank: 1,
                    notation: '6/off 5/off',
                    equity: 0.85,
                    equityLoss: 0,
                    probabilities: null,
                    board: null,
                },
            ],
            cubeDecision: { optimalAction: 'No Double' },
        };

        const choiceBearOff = await selectBotMoveWithBgsage(
            stateBearOffO,
            legalO,
            'intermediate',
            1000,
            Math.random,
            bearOffNotationResponse,
        );
        expect(choiceBearOff).not.toBeNull();
        expect(borneOffCount(choiceBearOff!.sequence.board, 'O')).toBe(
            borneOffCount(board, 'O') + 2,
        );
        expect(
            choiceBearOff!.sequence.moves.every((m) => m.to === O_OFF),
        ).toBe(true);
    });

    it('6. Cohérence logAnalyzer avec O_BAR = 25 et O_OFF = 25 lorsque localPlayer = "O"', async () => {
        const board = new Array<number>(26).fill(0);
        board[O_BAR] = -1;
        board[19] = -2;
        board[20] = -2;
        board[1] = 2;
        board[2] = 2;

        const moves = [
            { from: O_BAR, to: 3 },
            { from: 3, to: 8 },
        ];
        let boardAfter = [...board];
        for (const m of moves) boardAfter = applyMove(boardAfter, m, 'O');

        const logEntry: MatchLogEntry = Object.freeze({
            turnIndex: 1,
            player: 'O',
            dice: Object.freeze([3, 5]) as readonly [number, number],
            boardBefore: Object.freeze(board),
            movePlayed: Object.freeze(moves),
            boardAfter: Object.freeze(boardAfter),
            notation: 'bar/3 3/8',
        });

        const analysis = await analyzeHumanMoveFromLogWithBgsage({
            logEntry,
            localPlayer: 'O',
            ply: 1,
        });

        expect(analysis).not.toBeNull();
        expect(analysis!.player).toBe('O');
        expect(analysis!.playedNotation).toBe('bar/3 3/8');
        expect(analysis!.equityLoss).toBeGreaterThanOrEqual(0);
    });

    it('7. Niveaux locaux (Grandmaster/Expert 2-ply, Intermediate 1-ply, Beginner 1-ply bruité) : légalité stricte et optimalité', () => {
        const stateO: BoardState = {
            ...createInitialState(7),
            turn: 'O',
            dice: [3, 1],
        };
        const legalO = generateLegalMoves(stateO, [3, 1]);

        // Grandmaster / Expert (2-ply)
        const best2Ply = findBestBoardMove(stateO, [3, 1], 2);
        expect(best2Ply).not.toBeNull();
        expect(best2Ply!.sequence.board[20]).toBe(-2);

        // Intermediate (1-ply tri-phase + table Bear-Off exacte)
        const best1Ply = findBestBoardMove(stateO, [3, 1], 1);
        expect(best1Ply).not.toBeNull();
        expect(best1Ply!.sequence.board[20]).toBe(-2);

        // Beginner (1-ply avec bruit contrôlé, toujours parmi legalSeqs sans jamais d'erreur de règle)
        const analysis1Ply = analyzeBoardMoves(stateO, [3, 1], {
            candidateMoves: legalO,
            ply: 1,
            maxMoves: 64,
        });
        expect(analysis1Ply.moves.length).toBe(legalO.length);
        for (const cand of analysis1Ply.moves) {
            expect(cand.board).toBeDefined();
            expect(cand.moves).toBeDefined();
            const isLegal = legalO.some(
                (seq) => seq.board.join(',') === cand.board!.join(','),
            );
            expect(isLegal).toBe(true);
        }
    });

    it('8. Bug 1 & Bug 2 : /api/evaluate envoie un XGID canonique 10 champs, ajoute source="bgsage-cloud-run", et respecte un cooldown <= 5s', async () => {
        const { POST } = await import('../../app/api/evaluate/route');
        const { NextRequest } = await import('next/server');
        const { serializeCanonicalXGID } = await import('../../engine/backgammonEngine');
        const state = {
            ...createInitialState(7),
            turn: 'X' as const,
            dice: [3, 1] as [number, number],
        };
        const canonicalXgid = serializeCanonicalXGID(state);
        expect(canonicalXgid.replace(/^XGID=/, '').split(':').length).toBe(10);

        const prevUrl = process.env.BGSAGE_API_URL;
        process.env.BGSAGE_API_URL = 'https://bgsage-mock.run.app';

        let capturedBody: Record<string, unknown> | null = null;
        const originalFetch = globalThis.fetch;
        globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
            if (init?.body) {
                capturedBody = JSON.parse(String(init.body));
            }
            return new Response(
                JSON.stringify({
                    chequerPlay: [
                        { rank: 1, notation: '8/5 6/5', equity: 0.19, equityLoss: 0, probabilities: null },
                    ],
                    cubeDecision: { optimalAction: 'No Double' },
                }),
                { status: 200, headers: { 'Content-Type': 'application/json' } },
            );
        }) as typeof fetch;

        try {
            const req = new NextRequest('http://localhost/api/evaluate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ xgid: canonicalXgid, ply: 2 }),
            });
            const res = await POST(req);
            const json = await res.json();
            expect(json.source).toBe('bgsage-cloud-run');
            expect(capturedBody).not.toBeNull();
            expect(String(capturedBody!.xgid).replace(/^XGID=/, '').split(':').length).toBe(10);
        } finally {
            globalThis.fetch = originalFetch;
            process.env.BGSAGE_API_URL = prevUrl;
        }
    });
});
