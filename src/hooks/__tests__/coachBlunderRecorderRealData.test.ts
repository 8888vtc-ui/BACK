/**
 * @file src/hooks/__tests__/coachBlunderRecorderRealData.test.ts
 * @description Test Vitest vérifiant l'interdiction d'enregistrement pour les Invités,
 * et la persistance exacte de la date ISO, du vrai nom d'adversaire, du vrai score et du vrai tour.
 * Strictement <= 200 lignes, 0 any.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handleBlunderAndDecisionRecording } from '../coach/coachBlunderRecorder';
import { getPersonalBlunders, clearPersonalBlunders } from '../../lib/blunders/personalBlunderStore';
import type { MatchLogEntry } from '../../actions/types';
import type { HumanMoveAnalysis, CoachVerdict } from '../../features/coach/logAnalyzer';
import type { CoachState } from '../useCoachHelpers';

describe('coachBlunderRecorder & personalBlunderStore Unification', () => {
    let mockStore: Record<string, string> = {};

    beforeEach(() => {
        mockStore = {};
        const mockLocalStorage = {
            getItem: vi.fn((key: string) => mockStore[key] ?? null),
            setItem: vi.fn((key: string, val: string) => {
                mockStore[key] = String(val);
            }),
            removeItem: vi.fn((key: string) => {
                delete mockStore[key];
            }),
            clear: vi.fn(() => {
                mockStore = {};
            }),
        };

        vi.stubGlobal('window', {
            localStorage: mockLocalStorage,
            dispatchEvent: vi.fn(),
        });

        clearPersonalBlunders();
    });

    const createDummyLogEntry = (turnIndex = 14): MatchLogEntry => {
        const board = new Array<number>(28).fill(0);
        board[1] = 2;
        board[24] = -2;
        return {
            turnIndex,
            player: 'X',
            dice: [6, 4],
            movePlayed: [{ from: 24, to: 14 }],
            boardBefore: board,
            boardAfter: board,
            timestamp: Date.now(),
            notation: '24/14',
            packet: {
                packetId: 'pkt_test_1',
                turnNumber: turnIndex,
                actor: 'X',
                boardBeforeMove: board,
                boardAfterMove: board,
                offBefore: { X: 0, O: 0 },
                offAfter: { X: 0, O: 0 },
                diceRolled: [6, 4],
                playedMoveNotation: '24/14',
                playedSubMoves: [{ from: 24, to: 14, die: 6, isHit: false }],
                matchContext: {
                    matchLength: 7,
                    scoreX: 3,
                    scoreO: 4,
                    cubeValue: 2,
                    cubeOwner: 'X',
                    crawford: false,
                },
            },
        };
    };

    const createDummyResult = (turnIndex = 14): HumanMoveAnalysis => ({
        turnIndex,
        player: 'X',
        playedNotation: '24/14',
        optimalNotation: '24/18 13/9',
        verdict: 'blunder' as CoachVerdict,
        equityLoss: -0.145,
        isUnforced: true,
        isBlunder: true,
        bestEquity: 0.42,
        playedEquity: 0.275,
        candidateMoves: [
            { notation: '24/18 13/9', equity: 0.42, equityLoss: 0, winProbability: 0.62, gammonProbability: 0.18 },
            { notation: '24/14', equity: 0.275, equityLoss: -0.145, winProbability: 0.48, gammonProbability: 0.12 },
        ],
    });

    const dummyCoachState: CoachState = {
        verdict: 'blunder',
        equityLoss: 0.145,
        playedMove: '24/14',
        optimalMove: '24/18 13/9',
        explanation: 'Il fallait renforcer le milieu de terrain.',
        whyFailed: 'En jouant 24/14, vous cédez -0.145 EMG.',
        whyOptimal: '24/18 13/9 sécurise votre structure.',
    };

    it('1. Interdit tout enregistrement si isAuthenticated === false (0 blunder pour les Invités)', () => {
        const lastEntry = createDummyLogEntry(5);
        const result = createDummyResult();

        handleBlunderAndDecisionRecording({
            lastEntry,
            result,
            coachState: dummyCoachState,
            playedNotation: '24/14',
            verdict: 'blunder',
            equityLoss: -0.145,
            isAuthenticated: false,
            userId: 'pending_guest_session',
            recordDecisionStats: vi.fn(),
            setBrilliantMove: vi.fn(),
            isStale: () => false,
        });

        const stored = getPersonalBlunders();
        expect(stored.length).toBe(0);
    });

    it('2. Enregistre exactement la date ISO, le vrai nom d’adversaire, le score et le tour pour un Joueur Connecté en PvP', () => {
        const lastEntry = createDummyLogEntry(14);
        const result = createDummyResult();

        const beforeTime = Date.now() - 1000;

        handleBlunderAndDecisionRecording({
            lastEntry,
            result,
            coachState: dummyCoachState,
            playedNotation: '24/14',
            verdict: 'blunder',
            equityLoss: -0.145,
            isAuthenticated: true,
            userId: 'member_alexandre',
            challengerProfile: {
                displayName: 'Elena Rostova',
                username: 'elena_r',
                rating: 1640,
                countryName: 'Monaco',
            },
            recordDecisionStats: vi.fn(),
            setBrilliantMove: vi.fn(),
            isStale: () => false,
        });

        const stored = getPersonalBlunders();
        expect(stored.length).toBe(1);

        const record = stored[0]!;
        // Vrai adversaire & vrai Elo
        expect(record.opponentName).toBe('Elena Rostova');
        expect(record.opponentElo).toBe(1640);

        // Vrai score & vrai tour
        expect(record.scoreBeforeMove.player).toBe(3);
        expect(record.scoreBeforeMove.opponent).toBe(4);
        expect(record.turnNumber).toBe(14);

        // Vrai format de match
        expect(record.matchLength).toBe(7);
        expect(record.matchFormatLabel).toBe('Match en 7 pts');

        // Vraie date ISO valide
        expect(typeof record.createdAtIso).toBe('string');
        const parsedTime = new Date(record.createdAtIso).getTime();
        expect(Number.isFinite(parsedTime)).toBe(true);
        expect(parsedTime).toBeGreaterThanOrEqual(beforeTime);

        // Décision & notation
        expect(record.playerPlayedMove).toBe('24/14');
        expect(record.optimalMove).toBe('24/18 13/9');
        expect(record.status).toBe('PENDING');
    });

    it('3. Enregistre le vrai nom du bot persona et le score pour une partie solo connectée', () => {
        const lastEntry = createDummyLogEntry(8);
        const result = createDummyResult();

        handleBlunderAndDecisionRecording({
            lastEntry,
            result,
            coachState: dummyCoachState,
            playedNotation: '24/14',
            verdict: 'blunder',
            equityLoss: -0.145,
            difficulty: 'grandmaster',
            isAuthenticated: true,
            userId: 'member_david',
            recordDecisionStats: vi.fn(),
            setBrilliantMove: vi.fn(),
            isStale: () => false,
        });

        const stored = getPersonalBlunders();
        expect(stored.length).toBe(1);

        const record = stored[0]!;
        // Bot persona Grandmaster en FR
        expect(record.opponentName).toBe('Viktor « L’Intellectuel »');
        expect(record.turnNumber).toBe(8);
        expect(record.scoreBeforeMove.player).toBe(3);
        expect(record.scoreBeforeMove.opponent).toBe(4);
    });
});
