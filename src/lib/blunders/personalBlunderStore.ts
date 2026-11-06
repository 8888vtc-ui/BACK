/**
 * @file src/lib/blunders/personalBlunderStore.ts
 * @description Carnet de Blunders Personnels (Mémoire complète du match, exclusivité Compte Connecté, résolution par Quiz).
 * Strictement <= 350 lignes, 0 any.
 */

import { parseXGID, pipCount } from '../../engine/backgammonEngine';
import { GNUBG_3PLY_CERTIFIED_POSITIONS, type CertifiedGnubg3PlyPosition } from '../engine/gnubg3PlyCertifiedPositions';

export interface PersonalBlunderCandidate {
    readonly rank: number;
    readonly notation: string;
    readonly winProbPct: number;
    readonly gammonProbPct: number;
    readonly equityEmg: number;
    readonly lossEmg: number;
    readonly isPlayerPlayedMove: boolean;
    readonly isOptimalMove: boolean;
}

export interface PersonalBlunderRecord {
    readonly id: string;
    readonly userId: string;
    readonly createdAtIso: string;
    readonly opponentName: string;
    readonly opponentElo: number | null;
    readonly matchFormatLabel: string;
    readonly matchLength: number;
    readonly scoreBeforeMove: { readonly player: number; readonly opponent: number };
    readonly isCrawford: boolean;
    readonly turnNumber: number;
    readonly decisionType: 'CHECKER_PLAY' | 'CUBE_DECISION';
    readonly board: ReadonlyArray<number>;
    readonly player: 'X' | 'O';
    readonly xgid: string;
    readonly dice: readonly [number, number];
    readonly cubeValue: number;
    readonly cubeOwner: 'X' | 'O' | null;
    readonly pipCount: { readonly player: number; readonly opponent: number };
    readonly conceptId: string;
    readonly conceptNameFr: string;
    readonly conceptNameEn: string;
    readonly playerPlayedMove: string;
    readonly playerWinProbPct: number;
    readonly optimalMove: string;
    readonly optimalWinProbPct: number;
    readonly winProbLossPct: number;
    readonly deltaEmg: number;
    readonly erPenaltyPoints: number;
    readonly candidatesTop4: ReadonlyArray<PersonalBlunderCandidate>;
    readonly mistakeExplanationFr: string;
    readonly mistakeExplanationEn: string;
    readonly solutionExplanationFr: string;
    readonly solutionExplanationEn: string;
    readonly status: 'PENDING' | 'RESOLVED';
    readonly resolvedAtIso?: string;
    readonly attemptsCount: number;
}

export const PERSONAL_BLUNDERS_STORAGE_KEY = 'bg_personal_blunders_v1';
export const PERSONAL_BLUNDERS_UPDATED_EVENT = 'bgtour-personal-blunders-updated';

function emitPersonalBlundersUpdate(): void {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(PERSONAL_BLUNDERS_UPDATED_EVENT));
    }
}

export function getPersonalBlunders(): PersonalBlunderRecord[] {
    if (typeof window === 'undefined') return [];
    try {
        let raw = window.localStorage.getItem(PERSONAL_BLUNDERS_STORAGE_KEY);
        if (!raw) {
            raw = window.localStorage.getItem('bgtour_personal_match_blunders_v2');
        }
        if (!raw) return [];
        const parsed = JSON.parse(raw) as unknown;
        if (!Array.isArray(parsed)) return [];
        return parsed.filter(
            (item): item is PersonalBlunderRecord =>
                typeof item === 'object' &&
                item !== null &&
                typeof (item as PersonalBlunderRecord).id === 'string' &&
                typeof (item as PersonalBlunderRecord).opponentName === 'string' &&
                Array.isArray((item as PersonalBlunderRecord).candidatesTop4),
        );
    } catch {
        return [];
    }
}

function savePersonalBlunders(records: ReadonlyArray<PersonalBlunderRecord>): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(PERSONAL_BLUNDERS_STORAGE_KEY, JSON.stringify(records));
        emitPersonalBlundersUpdate();
    } catch {
        // Ignore storage quota issues
    }
}

export function getPendingPersonalBlundersCount(): number {
    return getPersonalBlunders().filter((b) => b.status === 'PENDING').length;
}

export type NewPersonalBlunderInput = Omit<
    PersonalBlunderRecord,
    'id' | 'createdAtIso' | 'status' | 'attemptsCount'
> & {
    readonly id?: string;
    readonly createdAtIso?: string;
    readonly status?: 'PENDING' | 'RESOLVED';
    readonly attemptsCount?: number;
};

export function recordPersonalMatchBlunder(input: NewPersonalBlunderInput): PersonalBlunderRecord | null {
    // Loi 1 : Interdit tout enregistrement si !isAuthenticated (0 blunder pour pending_guest_session)
    if (!input.userId || input.userId === 'pending_guest_session') {
        return null;
    }
    const existing = getPersonalBlunders();
    const record: PersonalBlunderRecord = {
        ...input,
        id: input.id ?? `blunder_${Date.now()}_turn${input.turnNumber}`,
        createdAtIso: input.createdAtIso ?? new Date().toISOString(),
        status: input.status ?? 'PENDING',
        attemptsCount: input.attemptsCount ?? 0,
    };
    const samePositionIdx = existing.findIndex(
        (b) =>
            b.id === record.id ||
            (b.player === record.player &&
                ((b.dice[0] === record.dice[0] && b.dice[1] === record.dice[1]) ||
                    (b.dice[0] === record.dice[1] && b.dice[1] === record.dice[0])) &&
                b.board.length === record.board.length &&
                b.board.every((val, i) => val === record.board[i])),
    );
    let updated: PersonalBlunderRecord[];
    if (samePositionIdx >= 0) {
        const prev = existing[samePositionIdx];
        const merged: PersonalBlunderRecord = {
            ...prev,
            ...record,
            deltaEmg: Math.min(prev.deltaEmg, record.deltaEmg),
            status: 'PENDING',
        };
        updated = existing.map((item, idx) => (idx === samePositionIdx ? merged : item));
    } else {
        updated = [record, ...existing.filter((b) => b.id !== record.id)].slice(0, 100);
    }
    savePersonalBlunders(updated);
    return record;
}

export function markPersonalBlunderAttempt(
    blunderId: string,
    isOptimal: boolean,
): PersonalBlunderRecord | null {
    const list = getPersonalBlunders();
    let updatedItem: PersonalBlunderRecord | null = null;
    const next = list.map((item) => {
        if (item.id !== blunderId) return item;
        const resolved = isOptimal || item.status === 'RESOLVED';
        updatedItem = {
            ...item,
            status: resolved ? 'RESOLVED' : 'PENDING',
            resolvedAtIso: isOptimal && !item.resolvedAtIso ? new Date().toISOString() : item.resolvedAtIso,
            attemptsCount: item.attemptsCount + 1,
        };
        return updatedItem;
    });
    if (updatedItem) {
        savePersonalBlunders(next);
    }
    return updatedItem;
}

export function attachPendingGuestBlundersToUser(userId: string): PersonalBlunderRecord[] {
    if (!userId) return getPersonalBlunders();
    const list = getPersonalBlunders();
    let changed = false;
    const next = list.map((item) => {
        if (!item.userId || item.userId === 'pending_guest_session') {
            changed = true;
            return { ...item, userId };
        }
        return item;
    });
    if (changed) {
        savePersonalBlunders(next);
    }
    return next;
}

export function clearPersonalBlunders(): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.removeItem(PERSONAL_BLUNDERS_STORAGE_KEY);
        emitPersonalBlundersUpdate();
    } catch {
        // Ignore
    }
}

function buildRecordFromCertifiedPosition(params: {
    pos: CertifiedGnubg3PlyPosition;
    id: string;
    userId: string;
    createdAtIso: string;
    opponentName: string;
    opponentElo: number;
    matchLength: number;
    scoreBeforeMove: { player: number; opponent: number };
    turnNumber: number;
    playedMoveIndex: number;
    conceptNameEn: string;
    mistakeExplanationFr: string;
    mistakeExplanationEn: string;
    solutionExplanationFr: string;
    solutionExplanationEn: string;
}): PersonalBlunderRecord {
    const { pos } = params;
    const parsedState = parseXGID(pos.xgid);
    const pips = pipCount(parsedState.board);
    const bestMove = pos.moves[0]!;
    const blunderMove = pos.moves[params.playedMoveIndex] ?? pos.moves[pos.moves.length - 1]!;

    const pickedMoves = [
        bestMove,
        pos.moves[1] ?? bestMove,
        pos.moves[2] ?? blunderMove,
        blunderMove,
    ];
    const uniqueMoves: typeof pos.moves[number][] = [];
    const seen = new Set<string>();
    for (const m of [...pickedMoves, ...pos.moves]) {
        if (!seen.has(m.notation)) {
            seen.add(m.notation);
            uniqueMoves.push(m);
        }
        if (uniqueMoves.length >= 4) break;
    }

    const candidatesTop4: PersonalBlunderCandidate[] = uniqueMoves.map((m, idx) => ({
        rank: idx + 1,
        notation: m.notation,
        winProbPct: Number((m.win * 100).toFixed(1)),
        gammonProbPct: Number((m.winGammon * 100).toFixed(1)),
        equityEmg: Number(m.equity.toFixed(3)),
        lossEmg: Number((-Math.abs(m.equityLoss)).toFixed(3)),
        isPlayerPlayedMove: m.notation === blunderMove.notation,
        isOptimalMove: m.notation === bestMove.notation,
    }));

    const optimalWinPct = Number((bestMove.win * 100).toFixed(1));
    const playerWinPct = Number((blunderMove.win * 100).toFixed(1));
    const winLossPct = Number(Math.max(1.2, optimalWinPct - playerWinPct).toFixed(1));
    const deltaEmg = -Number(Math.abs(blunderMove.equityLoss).toFixed(3));
    const erPenaltyPoints = Number(Math.min(0.5, Math.max(0.2, Math.abs(blunderMove.equityLoss) * 4.2)).toFixed(1));

    return {
        id: params.id,
        userId: params.userId,
        createdAtIso: params.createdAtIso,
        opponentName: params.opponentName,
        opponentElo: params.opponentElo,
        matchFormatLabel: params.matchLength > 0 ? `Match en ${params.matchLength} pts` : 'Money Game',
        matchLength: params.matchLength,
        scoreBeforeMove: params.scoreBeforeMove,
        isCrawford: false,
        turnNumber: params.turnNumber,
        decisionType: 'CHECKER_PLAY',
        board: parsedState.board,
        player: parsedState.turn,
        xgid: pos.xgid,
        dice: pos.dice,
        cubeValue: parsedState.cubeValue,
        cubeOwner: parsedState.cubeOwner,
        pipCount: {
            player: parsedState.turn === 'X' ? pips.X : pips.O,
            opponent: parsedState.turn === 'X' ? pips.O : pips.X,
        },
        conceptId: pos.conceptId,
        conceptNameFr: pos.conceptName,
        conceptNameEn: params.conceptNameEn,
        playerPlayedMove: blunderMove.notation,
        playerWinProbPct: playerWinPct,
        optimalMove: bestMove.notation,
        optimalWinProbPct: optimalWinPct,
        winProbLossPct: winLossPct,
        deltaEmg,
        erPenaltyPoints,
        candidatesTop4,
        mistakeExplanationFr: params.mistakeExplanationFr,
        mistakeExplanationEn: params.mistakeExplanationEn,
        solutionExplanationFr: params.solutionExplanationFr,
        solutionExplanationEn: params.solutionExplanationEn,
        status: 'PENDING',
        attemptsCount: 0,
    };
}

export function buildCertifiedDemoPersonalBlunders(userId = 'connected_member'): PersonalBlunderRecord[] {
    const p1 = GNUBG_3PLY_CERTIFIED_POSITIONS[2] ?? GNUBG_3PLY_CERTIFIED_POSITIONS[0]!;
    const p2 = GNUBG_3PLY_CERTIFIED_POSITIONS[3] ?? GNUBG_3PLY_CERTIFIED_POSITIONS[1]!;
    const p3 = GNUBG_3PLY_CERTIFIED_POSITIONS[1] ?? GNUBG_3PLY_CERTIFIED_POSITIONS[0]!;

    return [
        buildRecordFromCertifiedPosition({
            pos: p1,
            id: 'blunder_match_kosta_turn12',
            userId,
            createdAtIso: '2026-11-05T21:14:00.000Z',
            opponentName: 'Kosta_Ath',
            opponentElo: 1584,
            matchLength: 5,
            scoreBeforeMove: { player: 2, opponent: 3 },
            turnNumber: 12,
            playedMoveIndex: 2,
            conceptNameEn: 'Holding Game & Advanced Anchor',
            mistakeExplanationFr:
                'En courant avec un seul pion arrière (24/15), tu abandonnes le contact dans le jan adverse tout en laissant un pion isolé exposé aux frappes directes de Kosta_Ath.',
            mistakeExplanationEn:
                'By running with a single back checker (24/15), you abandon contact in the opponent home board while leaving a direct blot exposed to Kosta_Ath.',
            solutionExplanationFr:
                'Jouer 24/20 13/8 avance vers l’ancre du Point 20 tout en renforçant le Point 8 : tu conserves 49.7 % de chances de victoire et prépares le blocage.',
            solutionExplanationEn:
                'Playing 24/20 13/8 steps up toward the 20-point anchor while reinforcing the 8-point, preserving 49.7% winning chances and preparing your blockade.',
        }),
        buildRecordFromCertifiedPosition({
            pos: p2,
            id: 'blunder_match_marc75_turn9',
            userId,
            createdAtIso: '2026-11-04T18:42:00.000Z',
            opponentName: 'Marc_75',
            opponentElo: 1492,
            matchLength: 7,
            scoreBeforeMove: { player: 4, opponent: 4 },
            turnNumber: 9,
            playedMoveIndex: 3,
            conceptNameEn: 'Blot Safety & Duplication',
            mistakeExplanationFr:
                'Jouer 9/3 8/5(2) disperse tes constructeurs et laisse des cibles directes dans ton champ extérieur face au jan déjà fermé de Marc_75.',
            mistakeExplanationEn:
                'Playing 9/3 8/5(2) scatters your builders and leaves direct targets in your outer board against Marc_75’s strong inner board.',
            solutionExplanationFr:
                'Le double déplacement pur 8/2(2) sécurise immédiatement la case 2 sans exposer de pion isolé et minimise tes pertes de gammon.',
            solutionExplanationEn:
                'The clean 8/2(2) double move immediately secures the 2-point without exposing any blot and minimizes gammon losses.',
        }),
        buildRecordFromCertifiedPosition({
            pos: p3,
            id: 'blunder_match_elena_turn16',
            userId,
            createdAtIso: '2026-11-03T14:20:00.000Z',
            opponentName: 'Elena_M',
            opponentElo: 1640,
            matchLength: 5,
            scoreBeforeMove: { player: 3, opponent: 2 },
            turnNumber: 16,
            playedMoveIndex: 4,
            conceptNameEn: 'Advanced Anchor in Opponent Home (20-Point)',
            mistakeExplanationFr:
                'En jouant 21/20 13/9, tu négliges le pion arrière resté seul sur la case 24 et offres des tirs d’attaque gratuits à Elena_M.',
            mistakeExplanationEn:
                'By playing 21/20 13/9, you leave the lone back checker stranded on the 24-point and give Elena_M free attacking shots.',
            solutionExplanationFr:
                'Jouer 24/20 10/9 évacue le dernier pion de la case 24 pour rejoindre la case 20 tout en coordonnant tes constructeurs sur la case 9 (75.6 % de victoire).',
            solutionExplanationEn:
                'Playing 24/20 10/9 rescues the last checker from the 24-point onto the 20-point while coordinating your builders on the 9-point (75.6% win chance).',
        }),
    ];
}

export function seedDemoPersonalBlunders(userId = 'connected_member'): PersonalBlunderRecord[] {
    const demo = buildCertifiedDemoPersonalBlunders(userId);
    savePersonalBlunders(demo);
    return demo;
}

