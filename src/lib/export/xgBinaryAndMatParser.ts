/**
 * @file src/lib/export/xgBinaryAndMatParser.ts
 * @description Lecteur binaire Delphi/Pascal aligné pour fichiers eXtreme Gammon (.xg / .xgp :
 * `TRichGameHeader` 8 232 octets, `EngineStructBestMove` 2 184 octets, `EngineStructDoubleAction`
 * 132 octets, `TSaveRec` 2 560 octets) et automate de transcription JellyFish (.mat) vers XGID.
 *
 * Strictement < 400 lignes, 0 `any`, 100 % pur et déterministe.
 */

export const XG_CONSTANTS = {
    RM_MAGICNUMBER: 0x484d4752, // 'RGMH' en Little-Endian
    DMLI_MAGIC: 0x494c4d44,     // 'DMLI' dans tsHeaderMatch
    RICH_HEADER_SIZE: 8232,
    SAVE_REC_SIZE: 2560,
    ROLLOUT_CTX_SIZE: 2184,
    BEST_MOVE_STRUCT_SIZE: 2184,
    DOUBLE_ACTION_STRUCT_SIZE: 132,
    UNLIMITED_MATCH_LEN: 99999,
} as const;

export enum XgEntryType {
    tsHeaderMatch = 0,
    tsHeaderGame = 1,
    tsCube = 2,
    tsMove = 3,
    tsFooterGame = 4,
    tsFooterMatch = 5,
    tsComment = 6,
    tsMissing = 7,
}

export interface RichGameHeader {
    readonly magicNumber: number;
    readonly headerVersion: number;
    readonly headerSize: number;
    readonly thumbnailOffset: bigint;
    readonly thumbnailSize: number;
    readonly gameGuid: string;
    readonly gameName: string;
    readonly saveName: string;
    readonly levelName: string;
    readonly comments: string;
    readonly zlibPayloadOffset: number;
}

export interface EvalResult7 {
    readonly loseBG: number;
    readonly loseG: number;
    readonly loseS: number;
    readonly winS: number;
    readonly winG: number;
    readonly winBG: number;
    readonly equity: number;
}

export interface EngineStructBestMove {
    readonly pos: Int8Array;
    readonly dice: [number, number];
    readonly level: number;
    readonly score: [number, number];
    readonly cube: number;
    readonly cubePos: number;
    readonly crawford: number;
    readonly jacoby: number;
    readonly nMoves: number;
    readonly posPlayed: Int8Array[];
    readonly moves: Int8Array[];
    readonly evalLevel: Array<{ level: number; isDouble: boolean }>;
    readonly evals: EvalResult7[];
    readonly irrelevant: boolean;
    readonly met: number;
    readonly choice0: number;
    readonly choice3: number;
}

export interface EngineStructDoubleAction {
    readonly pos: Int8Array;
    readonly level: number;
    readonly score: [number, number];
    readonly cube: number;
    readonly cubePos: number;
    readonly jacoby: number;
    readonly crawford: number;
    readonly met: number;
    readonly flagDouble: number;
    readonly isBeaver: number;
    readonly evalNoDouble: EvalResult7;
    readonly equNoDouble: number;
    readonly equDoubleTake: number;
    readonly equDrop: number;
    readonly levelRequest: number;
    readonly doubleChoice3: number;
    readonly evalDoubleTake: EvalResult7;
}

export interface XGIDState {
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
}

export class AlignedBinaryReader {
    private readonly view: DataView;
    private readonly bytes: Uint8Array;
    public relOffset = 0;

    constructor(buffer: ArrayBuffer | Uint8Array, byteOffset = 0, byteLength?: number) {
        if (buffer instanceof Uint8Array) {
            const len = byteLength ?? buffer.byteLength - byteOffset;
            this.view = new DataView(buffer.buffer, buffer.byteOffset + byteOffset, len);
            this.bytes = new Uint8Array(buffer.buffer, buffer.byteOffset + byteOffset, len);
        } else {
            this.view = new DataView(buffer, byteOffset, byteLength);
            this.bytes = new Uint8Array(buffer, byteOffset, byteLength);
        }
    }

    public align(boundary: 2 | 4 | 8): void {
        const remainder = this.relOffset % boundary;
        if (remainder !== 0) {
            this.relOffset += boundary - remainder;
        }
    }

    public skip(count: number): void {
        this.relOffset += count;
    }

    public readByte(): number {
        const val = this.view.getUint8(this.relOffset);
        this.relOffset += 1;
        return val;
    }

    public readShortInt(): number {
        const val = this.view.getInt8(this.relOffset);
        this.relOffset += 1;
        return val;
    }

    public readBoolean(): boolean {
        return this.readByte() !== 0;
    }

    public readPascalShortString(maxLen: number): string {
        const actualLen = Math.min(this.readByte(), maxLen);
        let out = '';
        for (let i = 0; i < actualLen; i++) {
            out += String.fromCharCode(this.bytes[this.relOffset + i] ?? 0);
        }
        this.relOffset += maxLen;
        return out;
    }

    public readSmallInt(packed = false): number {
        if (!packed) this.align(2);
        const val = this.view.getInt16(this.relOffset, true);
        this.relOffset += 2;
        return val;
    }

    public readWord(packed = false): number {
        if (!packed) this.align(2);
        const val = this.view.getUint16(this.relOffset, true);
        this.relOffset += 2;
        return val;
    }

    public readWideCharArray(charCount: number, packed = false): string {
        if (!packed) this.align(2);
        const codeUnits: number[] = [];
        let ended = false;
        for (let i = 0; i < charCount; i++) {
            const code = this.view.getUint16(this.relOffset + i * 2, true);
            if (code === 0) ended = true;
            if (!ended) codeUnits.push(code);
        }
        this.relOffset += charCount * 2;
        return String.fromCharCode(...codeUnits);
    }

    public readInteger(packed = false): number {
        if (!packed) this.align(4);
        const val = this.view.getInt32(this.relOffset, true);
        this.relOffset += 4;
        return val;
    }

    public readDword(packed = false): number {
        if (!packed) this.align(4);
        const val = this.view.getUint32(this.relOffset, true);
        this.relOffset += 4;
        return val;
    }

    public readSingle(packed = false): number {
        if (!packed) this.align(4);
        const val = this.view.getFloat32(this.relOffset, true);
        this.relOffset += 4;
        return val;
    }

    public readInt64(packed = false): bigint {
        if (!packed) this.align(8);
        const val = this.view.getBigInt64(this.relOffset, true);
        this.relOffset += 8;
        return val;
    }

    public readDouble(packed = false): number {
        if (!packed) this.align(8);
        const val = this.view.getFloat64(this.relOffset, true);
        this.relOffset += 8;
        return val;
    }

    public readTDateTime(packed = false): Date {
        const days = this.readDouble(packed);
        const unixMs = (days - 25569) * 86400 * 1000;
        return new Date(Math.round(unixMs));
    }

    public readPositionEngine(): Int8Array {
        const pos = new Int8Array(26);
        for (let i = 0; i < 26; i++) pos[i] = this.readShortInt();
        return pos;
    }

    public readEvalResult7(): EvalResult7 {
        return {
            loseBG: this.readSingle(),
            loseG: this.readSingle(),
            loseS: this.readSingle(),
            winS: this.readSingle(),
            winG: this.readSingle(),
            winBG: this.readSingle(),
            equity: this.readSingle(),
        };
    }
}

export function parseRichGameHeader(fileBuffer: ArrayBuffer): RichGameHeader {
    if (fileBuffer.byteLength < XG_CONSTANTS.RICH_HEADER_SIZE) {
        throw new Error(`Fichier trop court (${fileBuffer.byteLength} octets) pour contenir TRichGameHeader.`);
    }
    const r = new AlignedBinaryReader(fileBuffer, 0, XG_CONSTANTS.RICH_HEADER_SIZE);
    const magicNumber = r.readDword(true);
    if (magicNumber !== XG_CONSTANTS.RM_MAGICNUMBER) {
        throw new Error(`Signature RichGameFormat invalide: 0x${magicNumber.toString(16).toUpperCase()}`);
    }
    const headerVersion = r.readDword(true);
    const headerSize = r.readDword(true);
    const thumbnailOffset = r.readInt64(true);
    const thumbnailSize = r.readDword(true);

    const d1 = r.readDword(true).toString(16).padStart(8, '0');
    const d2 = r.readWord(true).toString(16).padStart(4, '0');
    const d3 = r.readWord(true).toString(16).padStart(4, '0');
    let d4 = '';
    for (let i = 0; i < 8; i++) d4 += r.readByte().toString(16).padStart(2, '0');
    const gameGuid = `{${d1}-${d2}-${d3}-${d4.slice(0, 4)}-${d4.slice(4)}}`;

    return {
        magicNumber,
        headerVersion,
        headerSize,
        thumbnailOffset,
        thumbnailSize,
        gameGuid,
        gameName: r.readWideCharArray(1024, true),
        saveName: r.readWideCharArray(1024, true),
        levelName: r.readWideCharArray(1024, true),
        comments: r.readWideCharArray(1024, true),
        zlibPayloadOffset: XG_CONSTANTS.RICH_HEADER_SIZE + thumbnailSize,
    };
}

export function parseEngineStructBestMove(recordBuffer: Uint8Array, byteOffset: number): EngineStructBestMove {
    const r = new AlignedBinaryReader(recordBuffer, byteOffset, XG_CONSTANTS.BEST_MOVE_STRUCT_SIZE);
    const pos = r.readPositionEngine();
    const dice: [number, number] = [r.readInteger(), r.readInteger()];
    const level = r.readInteger();
    const score: [number, number] = [r.readInteger(), r.readInteger()];
    const cube = r.readInteger();
    const cubePos = r.readInteger();
    const crawford = r.readInteger();
    const jacoby = r.readInteger();
    const nMoves = r.readInteger();

    const posPlayed: Int8Array[] = [];
    for (let i = 0; i < 32; i++) posPlayed.push(r.readPositionEngine());

    const moves: Int8Array[] = [];
    for (let i = 0; i < 32; i++) {
        const mv = new Int8Array(8);
        for (let j = 0; j < 8; j++) mv[j] = r.readShortInt();
        moves.push(mv);
    }

    const evalLevel: Array<{ level: number; isDouble: boolean }> = [];
    for (let i = 0; i < 32; i++) {
        const lvl = r.readSmallInt();
        const isDouble = r.readBoolean();
        r.readByte();
        evalLevel.push({ level: lvl, isDouble });
    }

    const evals: EvalResult7[] = [];
    for (let i = 0; i < 32; i++) evals.push(r.readEvalResult7());

    const irrelevant = r.readBoolean();
    const met = r.readShortInt();
    const choice0 = r.readShortInt();
    const choice3 = r.readShortInt();

    if (r.relOffset !== XG_CONSTANTS.BEST_MOVE_STRUCT_SIZE) {
        throw new Error(`Désalignement EngineStructBestMove: lu ${r.relOffset} octets au lieu de 2184.`);
    }

    return { pos, dice, level, score, cube, cubePos, crawford, jacoby, nMoves, posPlayed, moves, evalLevel, evals, irrelevant, met, choice0, choice3 };
}

export function parseEngineStructDoubleAction(recordBuffer: Uint8Array, byteOffset: number): EngineStructDoubleAction {
    const r = new AlignedBinaryReader(recordBuffer, byteOffset, XG_CONSTANTS.DOUBLE_ACTION_STRUCT_SIZE);
    const pos = r.readPositionEngine();
    const level = r.readInteger();
    const score: [number, number] = [r.readInteger(), r.readInteger()];
    const cube = r.readInteger();
    const cubePos = r.readInteger();
    const jacoby = r.readInteger();
    const crawford = r.readSmallInt();
    const met = r.readSmallInt();
    const flagDouble = r.readSmallInt();
    const isBeaver = r.readSmallInt();
    const evalNoDouble = r.readEvalResult7();
    const equNoDouble = r.readSingle();
    const equDoubleTake = r.readSingle();
    const equDrop = r.readSingle();
    const levelRequest = r.readSmallInt();
    const doubleChoice3 = r.readSmallInt();
    const evalDoubleTake = r.readEvalResult7();

    if (r.relOffset !== XG_CONSTANTS.DOUBLE_ACTION_STRUCT_SIZE) {
        throw new Error(`Désalignement EngineStructDoubleAction: lu ${r.relOffset} octets au lieu de 132.`);
    }

    return { pos, level, score, cube, cubePos, jacoby, crawford, met, flagDouble, isBeaver, evalNoDouble, equNoDouble, equDoubleTake, equDrop, levelRequest, doubleChoice3, evalDoubleTake };
}

export function positionEngineToXGIDCheckers(posEngine: Int8Array, turn: -1 | 1): Int8Array {
    const xgidBoard = new Int8Array(26);
    if (turn === 1) {
        for (let i = 0; i < 26; i++) xgidBoard[i] = posEngine[i] ?? 0;
    } else {
        for (let i = 0; i < 26; i++) xgidBoard[25 - i] = -(posEngine[i] ?? 0);
    }
    return xgidBoard;
}

export function encodeXGID(state: XGIDState): string {
    let checkerStr = '';
    for (let i = 0; i < 26; i++) {
        const count = state.checkers[i] ?? 0;
        if (count === 0) checkerStr += '-';
        else if (count > 0) checkerStr += String.fromCharCode(64 + Math.min(count, 16));
        else checkerStr += String.fromCharCode(96 + Math.min(Math.abs(count), 16));
    }
    return [
        `XGID=${checkerStr}`,
        state.cubeExp.toString(),
        state.cubeOwner.toString(),
        state.turn.toString(),
        state.dice,
        state.scoreBottom.toString(),
        state.scoreTop.toString(),
        state.crawfordOrJacoby.toString(),
        state.matchLength.toString(),
        state.maxCubeExp.toString(),
    ].join(':');
}

export interface MatTurnSnapshot {
    readonly gameNumber: number;
    readonly moveNumber: number;
    readonly player: 1 | -1;
    readonly rawAction: string;
    readonly xgidBeforePlay: string;
    readonly xgidAfterPlay: string;
}

export function createStartingBoard(variation: 'Standard' | 'NackGammon' = 'Standard'): Int8Array {
    const b = new Int8Array(26);
    if (variation === 'NackGammon') {
        b[24] = 2; b[23] = 2; b[13] = 4; b[8] = 3; b[6] = 4;
        b[1] = -2; b[2] = -2; b[12] = -4; b[17] = -3; b[19] = -4;
    } else {
        b[24] = 2; b[13] = 5; b[8] = 3; b[6] = 5;
        b[1] = -2; b[12] = -5; b[17] = -3; b[19] = -5;
    }
    return b;
}

export function applyMatCheckerPlay(board: Int8Array, player: 1 | -1, diceStr: string, moveNotation: string): void {
    const cleaned = moveNotation.trim();
    if (!cleaned || /^(cannot move|no move|---\??|\?\?)$/i.test(cleaned)) return;

    const d1 = parseInt(diceStr[0] ?? '0', 10);
    const d2 = parseInt(diceStr[1] ?? '0', 10);
    const tokens = cleaned.split(/\s+/);

    const toAbsIndex = (ptStr: string): number => {
        const s = ptStr.toLowerCase().replace(/\*/g, '');
        if (s === 'bar' || s === '25') return player === 1 ? 25 : 0;
        if (s === 'off' || s === '0') return player === 1 ? 0 : 25;
        const p = parseInt(s, 10);
        return player === 1 ? p : 25 - p;
    };

    const executeSingleStep = (absFrom: number, absTo: number): void => {
        board[absFrom] = (board[absFrom] ?? 0) - player;
        const isBearOff = (player === 1 && absTo === 0) || (player === -1 && absTo === 25);
        if (!isBearOff) {
            if (board[absTo] === -player) {
                board[absTo] = 0;
                const oppBar = player === 1 ? 0 : 25;
                board[oppBar] = (board[oppBar] ?? 0) - player;
            }
            board[absTo] = (board[absTo] ?? 0) + player;
        }
    };

    for (const token of tokens) {
        const multMatch = token.match(/\((\d+)\)$/);
        const repetitions = multMatch ? parseInt(multMatch[1] ?? '1', 10) : 1;
        const parts = token.replace(/\(\d+\)$/, '').split('/');

        for (let r = 0; r < repetitions; r++) {
            for (let idx = 0; idx < parts.length - 1; idx++) {
                const rawFrom = parts[idx] ?? '';
                const rawTo = parts[idx + 1] ?? '';
                const explicitHit = rawFrom.endsWith('*') || rawTo.endsWith('*');
                const absFrom = toAbsIndex(rawFrom);
                const absTo = toAbsIndex(rawTo);
                const relFrom = player === 1 ? absFrom : 25 - absFrom;
                const relTo = player === 1 ? absTo : 25 - absTo;
                const dist = relFrom - relTo;

                if (parts.length === 2 && relTo > 0 && dist > Math.max(d1, d2) && (dist === d1 + d2 || (d1 === d2 && dist % d1 === 0))) {
                    if (d1 === d2) {
                        const steps = dist / d1;
                        let curRel = relFrom;
                        for (let s = 0; s < steps; s++) {
                            const nextRel = curRel - d1;
                            executeSingleStep(player === 1 ? curRel : 25 - curRel, player === 1 ? nextRel : 25 - nextRel);
                            curRel = nextRel;
                        }
                    } else {
                        const absMid1 = player === 1 ? relFrom - d1 : 25 - (relFrom - d1);
                        const absMid2 = player === 1 ? relFrom - d2 : 25 - (relFrom - d2);
                        const mid1Blocked = (board[absMid1] ?? 0) * player < -1;
                        const mid2Blocked = (board[absMid2] ?? 0) * player < -1;
                        const mid1Blot = board[absMid1] === -player;
                        const mid2Blot = board[absMid2] === -player;
                        let chosenAbsMid = absMid1;
                        if (mid1Blocked && !mid2Blocked) chosenAbsMid = absMid2;
                        else if (!mid1Blocked && mid2Blocked) chosenAbsMid = absMid1;
                        else if (explicitHit && board[absTo] !== -player && mid2Blot && !mid1Blot) chosenAbsMid = absMid2;
                        else if (!explicitHit && mid1Blot && !mid2Blot) chosenAbsMid = absMid2;
                        executeSingleStep(absFrom, chosenAbsMid);
                        executeSingleStep(chosenAbsMid, absTo);
                    }
                } else {
                    executeSingleStep(absFrom, absTo);
                }
            }
        }
    }
}
