/**
 * Moteur de règles du Backgammon — module 100 % pur.
 *
 * Aucune dépendance à React, Node ou au navigateur : uniquement du TypeScript
 * déterministe, testable isolément et réutilisable côté client comme côté serveur.
 *
 * Conventions de représentation :
 * - Le plateau est un tableau de 26 entiers :
 *     board[0]     = barre de X (pions X, valeurs positives)
 *     board[1..24] = flèches 1 à 24 (positif = pions X, négatif = pions O)
 *     board[25]    = barre de O (pions O, valeurs négatives)
 * - Un coup est { from, to } :
 *     from ∈ { 0 (barre de X), 1..24 (flèche), 25 (barre de O) }
 *     to   ∈ { 0 (bear-off de X), 1..24 (flèche), 25 (bear-off de O) }
 * - X se déplace de 24 vers 1 (décroissant) puis sort ; O de 1 vers 24 (croissant).
 * - Le bear-off est dérivé du plateau : borneOffCount = 15 - pions restants.
 */

export type Player = 'X' | 'O';

export interface Move {
    /** Flèche de départ : 0 = barre de X, 25 = barre de O, 1..24 = flèche. */
    from: number;
    /** Destination : 0 = bear-off de X, 25 = bear-off de O, 1..24 = flèche. */
    to: number;
}

export interface MoveSequence {
    /** Coups individuels dans l'ordre de jeu (1 à 4 coups). */
    moves: Move[];
    /** Plateau résultant après application de tous les coups. */
    board: number[];
}

export interface BoardState {
    /** Plateau : 26 entiers (voir conventions en tête de fichier). */
    board: number[];
    /** Joueur dont c'est le tour. */
    turn: Player;
    /** Valeur du videau (1, 2, 4, 8…). */
    cubeValue: number;
    /** Possesseur du videau, ou null si centré. */
    cubeOwner: Player | null;
    /** Dés courants, ou null si non lancés. */
    dice: [number, number] | null;
    /** Longueur du match (0 = partie d'argent). */
    matchLength: number;
    scoreX: number;
    scoreO: number;
    /** Règle de Crawford active (videau interdit pour cette partie). */
    crawford: boolean;
    /** Le videau a été doublé ce tour (champ XGID). */
    doubled: boolean;
    /** Abandon : 0 = aucun, 1 = simple, 2 = gammon, 3 = backgammon. */
    resigned: number;
}

export const X_BAR = 0;
export const O_BAR = 25;
export const X_OFF = 0;
export const O_OFF = 25;
export const POINTS = 24;
export const CHECKERS_PER_PLAYER = 15;

// ---------------------------------------------------------------------------
// État initial
// ---------------------------------------------------------------------------

/** Position d'ouverture standard d'une partie de backgammon. */
export function createInitialState(matchLength = 0): BoardState {
    const board = new Array<number>(26).fill(0);
    board[1] = -2; // 2 pions O sur la flèche 1
    board[6] = 5; // 5 pions X sur la flèche 6
    board[8] = 3; // 3 pions X sur la flèche 8
    board[12] = -5; // 5 pions O sur la flèche 12
    board[13] = 5; // 5 pions X sur la flèche 13
    board[17] = -3; // 3 pions O sur la flèche 17
    board[19] = -5; // 5 pions O sur la flèche 19
    board[24] = 2; // 2 pions X sur la flèche 24
    return {
        board,
        turn: 'X',
        cubeValue: 1,
        cubeOwner: null,
        dice: null,
        matchLength,
        scoreX: 0,
        scoreO: 0,
        crawford: false,
        doubled: false,
        resigned: 0,
    };
}

// ---------------------------------------------------------------------------
// XGID
// ---------------------------------------------------------------------------

const XGID_X = 'ABCDEFGHIJKLMNOP'; // A = 1 pion X … P = 16 pions X
const XGID_O = 'abcdefghijklmnop'; // a = 1 pion O … p = 16 pions O

function encodePoint(count: number): string {
    if (count === 0) return '-';
    if (count > 0) return XGID_X[count - 1];
    return XGID_O[-count - 1];
}

function decodePoint(ch: string): number {
    if (ch === '-') return 0;
    const xi = XGID_X.indexOf(ch);
    if (xi >= 0) return xi + 1;
    const oi = XGID_O.indexOf(ch);
    if (oi >= 0) return -(oi + 1);
    throw new Error(`Caractère XGID invalide : "${ch}"`);
}

/**
 * Sérialise un état en XGID.
 *
 * Format standard GNU Backgammon : `XGID=<24 flèches de 24 à 1><barre X><barre O>:...`
 * L'ordre des 26 caractères est CRITIQUE :
 *   - caractères 0..23  : flèches 24, 23, ..., 1 (dans cet ordre décroissant)
 *   - caractère 24      : barre de X (board[0])
 *   - caractère 25      : barre de O (board[25])
 *
 * Ceci garantit que la flèche 6 (jan intérieur de X) est bien mappée sur le point 6
 * de GNU, et non inversée en point 19.
 */
export function serializeXGID(state: BoardState): string {
    let board = '';
    // Flèches 24 → 1 (ordre décroissant, conforme au standard XGID).
    for (let p = 24; p >= 1; p--) board += encodePoint(state.board[p]);
    // Barre : supporte sans perte la présence simultanée de pions X et O sur la barre.
    const barX = Math.max(0, state.board[X_BAR]);
    const barO = Math.max(0, -state.board[O_BAR]);
    if (barX > 0 && barO > 0) {
        board += encodePoint(barX);
        board += encodePoint(-barO);
    } else {
        board += encodePoint(barX - barO);
        // Bear-off : positif = pions X sortis, négatif = pions O sortis.
        const offX = borneOffCount(state.board, 'X');
        const offO = borneOffCount(state.board, 'O');
        board += encodePoint(offX - offO);
    }

    // Format XGID standard GNU : corps:matchplay:scoreX:scoreO:dice:player_on_roll:cube:cube_owner:crawford:doubled:matchLength
    const matchplay = state.matchLength > 0 ? '1' : '0';
    const scoreX = state.scoreX ?? 0;
    const scoreO = state.scoreO ?? 0;
    const dice = state.dice ? `${state.dice[0]}${state.dice[1]}` : '0';
    const playerOnRoll = state.turn === 'X' ? '0' : '1';
    const cube = state.cubeValue ?? 1;
    const cubeOwner = state.cubeOwner === null ? '0' : state.cubeOwner === 'X' ? '1' : '2';
    const crawford = state.crawford ? '1' : '0';
    const doubled = state.doubled ? '1' : '0';
    return `XGID=${board}:${matchplay}:${scoreX}:${scoreO}:${dice}:${playerOnRoll}:${cube}:${cubeOwner}:${crawford}:${doubled}:${state.matchLength}`;
}

/** Parse un XGID (format 11 champs ou format canonique eXtreme Gammon 10 champs) et reconstruit l'état correspondant sans perte. */
export function parseXGID(xgid: string): BoardState {
    const raw = xgid.startsWith('XGID=') ? xgid.slice(5) : xgid;
    const parts = raw.split(':');
    if ((parts.length !== 10 && parts.length < 11) || parts[0].length !== 26) {
        throw new Error(`XGID invalide : "${xgid}"`);
    }

    const body = parts[0];
    const board = new Array<number>(26).fill(0);

    // Support du format canonique eXtreme Gammon à 10 champs :
    // XGID=[26 chars]:cubeExp:cubeOwner:turnDir:dice:scoreBottom:scoreTop:crawfordJacoby:matchLength:maxCube
    if (parts.length === 10) {
        const barO = decodePoint(body[0]);
        board[O_BAR] = barO <= 0 ? barO : -barO;
        for (let p = 1; p <= 24; p++) {
            board[p] = decodePoint(body[p]);
        }
        const barX = decodePoint(body[25]);
        board[X_BAR] = barX >= 0 ? barX : -barX;

        const cubeExp = Number(parts[1]);
        const cubeValue = cubeExp > 0 ? Math.pow(2, cubeExp) : 1;
        const cubeOwner: Player | null = parts[2] === '1' ? 'X' : parts[2] === '-1' ? 'O' : null;
        const turn: Player = parts[3] === '-1' ? 'O' : 'X';
        const diceField = parts[4];
        const doubled = diceField === 'D' || diceField === 'd';
        const dice: [number, number] | null =
            !diceField || diceField === '0' || diceField === '00' || doubled
                ? null
                : diceField.length === 1
                    ? [Number(diceField), Number(diceField)]
                    : [Number(diceField[0]), Number(diceField[1])];
        const scoreX = Number(parts[5]);
        const scoreO = Number(parts[6]);
        const matchLength = Number(parts[8]);
        const crawford = matchLength > 0 && parts[7] === '1';

        return {
            board,
            turn,
            cubeValue,
            cubeOwner,
            dice,
            matchLength,
            scoreX,
            scoreO,
            crawford,
            doubled,
            resigned: 0,
        };
    }

    // Flèches 24 → 1 (ordre décroissant).
    for (let p = 24; p >= 1; p--) board[p] = decodePoint(body[24 - p]);
    // Barre (caractères 24 et 25 si présence simultanée X et O sur la barre)
    const bar24 = decodePoint(body[24]);
    const bar25 = decodePoint(body[25]);
    if (bar24 > 0 && bar25 < 0) {
        board[X_BAR] = bar24;
        board[O_BAR] = bar25;
    } else {
        board[X_BAR] = bar24 > 0 ? bar24 : 0;
        board[O_BAR] = bar24 < 0 ? bar24 : 0;
    }

    // Format XGID 11 champs : corps:matchplay:scoreX:scoreO:dice:player_on_roll:cube:cube_owner:crawford:doubled:matchLength
    const scoreX = Number(parts[2]);
    const scoreO = Number(parts[3]);
    const diceField = parts[4];
    const dice: [number, number] | null =
        !diceField || diceField === '0' || diceField === '00'
            ? null
            : diceField.length === 1
                ? [Number(diceField), Number(diceField)]
                : [Number(diceField[0]), Number(diceField[1])];
    const turn: Player = parts[5] === '1' ? 'O' : 'X';
    const cubeValue = Number(parts[6]);
    const cubeOwner: Player | null = parts[7] === '1' ? 'X' : parts[7] === '2' ? 'O' : null;
    const crawford = parts[8] === '1';
    const doubled = parts[9] === '1';
    const matchLength = Number(parts[10]);

    return {
        board,
        turn,
        cubeValue,
        cubeOwner,
        dice,
        matchLength,
        scoreX,
        scoreO,
        crawford,
        doubled,
        resigned: 0,
    };
}

// ---------------------------------------------------------------------------
// Comptage
// ---------------------------------------------------------------------------

/** Pip count instantané de chaque joueur. */
export function pipCount(board: number[]): { X: number; O: number } {
    let x = 0;
    let o = 0;
    for (let p = 1; p <= 24; p++) {
        const v = board[p];
        if (v > 0) x += v * p;
        else if (v < 0) o += -v * (25 - p);
    }
    if (board[X_BAR] > 0) x += board[X_BAR] * 25;
    if (board[O_BAR] < 0) o += -board[O_BAR] * 25;
    return { X: x, O: o };
}

/** Nombre de pions déjà sortis (bear-off) pour un joueur. */
export function borneOffCount(board: number[], player: Player): number {
    let onBoard = 0;
    for (let p = 1; p <= 24; p++) {
        const v = board[p];
        if (player === 'X' && v > 0) onBoard += v;
        if (player === 'O' && v < 0) onBoard += -v;
    }
    if (player === 'X') onBoard += Math.max(0, board[X_BAR]);
    else onBoard += Math.max(0, -board[O_BAR]);
    return CHECKERS_PER_PLAYER - onBoard;
}

// ---------------------------------------------------------------------------
// Génération des coups légaux
// ---------------------------------------------------------------------------

function isBlocked(board: number[], point: number, player: Player): boolean {
    const v = board[point];
    return player === 'X' ? v <= -2 : v >= 2;
}

function isAllInHome(board: number[], player: Player): boolean {
    if (player === 'X') {
        if (board[X_BAR] > 0) return false;
        for (let p = 7; p <= 24; p++) if (board[p] > 0) return false;
        return true;
    }
    if (board[O_BAR] < 0) return false;
    for (let p = 1; p <= 18; p++) if (board[p] < 0) return false;
    return true;
}

function isHighestOccupied(board: number[], point: number): boolean {
    for (let p = point + 1; p <= 24; p++) if (board[p] > 0) return false;
    return true;
}

function isLowestOccupied(board: number[], point: number): boolean {
    for (let p = 1; p < point; p++) if (board[p] < 0) return false;
    return true;
}

/** Coups possibles pour un seul dé. */
export function generateSingleMoves(board: number[], player: Player, die: number): Move[] {
    const moves: Move[] = [];

    if (player === 'X') {
        if (board[X_BAR] > 0) {
            // X entre dans le jan intérieur adverse de O (flèches 19 à 24) : dé 1 -> 24, dé 6 -> 19
            const dest = 25 - die;
            if (dest >= 1 && dest <= 24 && !isBlocked(board, dest, 'X')) {
                moves.push({ from: X_BAR, to: dest });
            }
            return moves; // obligation d'entrer depuis la barre
        }
        const allHome = isAllInHome(board, 'X');
        for (let p = 1; p <= 24; p++) {
            if (board[p] <= 0) continue;
            const dest = p - die;
            if (dest >= 1) {
                if (!isBlocked(board, dest, 'X')) moves.push({ from: p, to: dest });
            } else if (allHome) {
                if (dest === 0) moves.push({ from: p, to: X_OFF });
                else if (dest < 0 && isHighestOccupied(board, p)) moves.push({ from: p, to: X_OFF });
            }
        }
    } else {
        if (board[O_BAR] < 0) {
            // O entre dans le jan intérieur adverse de X (flèches 1 à 6) : dé 1 -> 1, dé 6 -> 6
            const dest = die;
            if (dest >= 1 && dest <= 24 && !isBlocked(board, dest, 'O')) {
                moves.push({ from: O_BAR, to: dest });
            }
            return moves;
        }
        const allHome = isAllInHome(board, 'O');
        for (let p = 1; p <= 24; p++) {
            if (board[p] >= 0) continue;
            const dest = p + die;
            if (dest <= 24) {
                if (!isBlocked(board, dest, 'O')) moves.push({ from: p, to: dest });
            } else if (allHome) {
                if (dest === 25) moves.push({ from: p, to: O_OFF });
                else if (dest > 25 && isLowestOccupied(board, p)) moves.push({ from: p, to: O_OFF });
            }
        }
    }
    return moves;
}

/** Applique un coup et retourne un nouveau plateau (sans mutation). */
export function applyMove(board: number[], move: Move, player: Player): number[] {
    const b = board.slice();
    const { from, to } = move;
    if (player === 'X') {
        b[from] -= 1;
        if (to !== X_OFF) {
            if (b[to] === -1) {
                b[to] = 1;
                b[O_BAR] -= 1;
            } else {
                b[to] += 1;
            }
        }
    } else {
        b[from] += 1;
        if (to !== O_OFF) {
            if (b[to] === 1) {
                b[to] = -1;
                b[X_BAR] += 1;
            } else {
                b[to] -= 1;
            }
        }
    }
    return b;
}

/** Distance parcourue par un coup (pour identifier le dé utilisé). */
function moveDistance(move: Move, player: Player): number {
    const { from, to } = move;
    if (player === 'X') {
        if (from === X_BAR) return 25 - to;
        if (to === X_OFF) return from;
        return from - to;
    }
    if (from === O_BAR) return to;
    if (to === O_OFF) return 25 - from;
    return to - from;
}

function generateSequences(
    board: number[],
    player: Player,
    dice: number[],
    index: number,
    current: Move[],
    results: MoveSequence[],
): void {
    if (index === dice.length) {
        if (current.length > 0) {
            results.push({ moves: [...current], board });
        }
        return;
    }
    const die = dice[index];
    const singles = generateSingleMoves(board, player, die);
    if (singles.length === 0) {
        generateSequences(board, player, dice, index + 1, current, results);
        return;
    }
    for (const move of singles) {
        const next = applyMove(board, move, player);
        generateSequences(next, player, dice, index + 1, [...current, move], results);
    }
}

function boardKey(board: number[]): string {
    return board.join(',');
}

/**
 * Calcule récursivement tous les mouvements légaux pour un jet de dés.
 *
 * - Les doubles produisent 4 mouvements.
 * - Règle stricte du maximum de dés : on ne conserve que les séquences qui
 *   utilisent le plus de dés possible ; si un seul dé est jouable, on joue le
 *   plus fort.
 * - Les doublons de position finale sont éliminés.
 * - Retourne [] si aucun coup n'est possible (le joueur passe).
 */
export function generateLegalMoves(state: BoardState, dice: [number, number]): MoveSequence[] {
    const [d1, d2] = dice;
    if (d1 < 1 || d1 > 6 || d2 < 1 || d2 > 6) {
        throw new Error(`Dés invalides : [${d1}, ${d2}]`);
    }
    const player = state.turn;
    const orders: number[][] = d1 === d2 ? [[d1, d1, d1, d1]] : [[d1, d2], [d2, d1]];

    const all: MoveSequence[] = [];
    for (const order of orders) {
        generateSequences(state.board, player, order, 0, [], all);
    }

    if (all.length === 0) return [];

    const maxDice = Math.max(...all.map((s) => s.moves.length));
    let filtered = all.filter((s) => s.moves.length === maxDice);

    // Règle officielle du plus fort dé (WBF / USBGF Règle 4.2 / XG2 / Snowie) :
    // Lorsqu'un seul dé peut être joué au total (maxDice === 1) et que chaque dé
    // est individuellement jouable, le joueur a l'obligation de jouer le plus fort,
    // y compris s'il entre depuis la barre.
    const onBar = player === 'X' ? state.board[X_BAR] > 0 : state.board[O_BAR] < 0;
    if (maxDice === 1 && d1 !== d2) {
        const d1Moves = generateSingleMoves(state.board, player, d1);
        const d2Moves = generateSingleMoves(state.board, player, d2);
        if (d1Moves.length > 0 && d2Moves.length > 0) {
            const higher = Math.max(d1, d2);
            const higherMoves = d1 === higher ? d1Moves : d2Moves;
            filtered = filtered.filter((s) =>
                higherMoves.some((m) => m.from === s.moves[0].from && m.to === s.moves[0].to),
            );
        }
    }

    const seen = new Set<string>();
    const result: MoveSequence[] = [];
    for (const s of filtered) {
        // Depuis la barre, deux entrées différentes (ex: bar/24 vs bar/20) peuvent
        // mener au même plateau final. On inclut donc le premier coup dans la clé
        // de déduplication pour préserver le choix d'entrée du joueur.
        const key = onBar && s.moves.length > 0
            ? `${s.moves[0].from}:${s.moves[0].to}|${boardKey(s.board)}`
            : boardKey(s.board);
        if (!seen.has(key)) {
            seen.add(key);
            result.push(s);
        }
    }
    return result;
}

/**
 * Calcule les cibles légales pour chaque dé en appliquant la règle du maximum de dés.
 * Utilise generateLegalMoves pour déterminer les séquences autorisées.
 */
export function computeLegalTargets(
    state: BoardState,
    dice: [number, number],
    usedDice: [boolean, boolean] | boolean[],
): { leftDieTargets: Map<number, number[]>; rightDieTargets: Map<number, number[]> } {
    const leftDieTargets = new Map<number, number[]>();
    const rightDieTargets = new Map<number, number[]>();

    const addTarget = (map: Map<number, number[]>, from: number, to: number) => {
        const list = map.get(from) ?? [];
        if (!list.includes(to)) {
            list.push(to);
            map.set(from, list);
        }
    };

    const player = state.turn;
    const [d1, d2] = dice;
    const isDouble = d1 === d2;

    // 1. CAS D'UN DOUBLE (d1 === d2) : Règle officielle -> 4 coups au total de valeur d1
    if (isDouble) {
        const usedCount = usedDice.filter(Boolean).length;
        const remainingCount = Math.max(0, 4 - usedCount);

        if (remainingCount === 0) {
            return { leftDieTargets, rightDieTargets };
        }

        const remainingDice = Array(remainingCount).fill(d1);
        const all: MoveSequence[] = [];
        generateSequences(state.board, player, remainingDice, 0, [], all);

        if (all.length === 0) {
            return { leftDieTargets, rightDieTargets };
        }

        const maxMoves = Math.max(...all.map((s) => s.moves.length));
        const validSeqs = all.filter((s) => s.moves.length === maxMoves);

        for (const seq of validSeqs) {
            const firstMove = seq.moves[0];
            addTarget(leftDieTargets, firstMove.from, firstMove.to);
            addTarget(rightDieTargets, firstMove.from, firstMove.to);
        }

        return { leftDieTargets, rightDieTargets };
    }

    // 2. CAS D'UN NON-DOUBLE (d1 !== d2) : 2 dés distincts
    if (usedDice[0] && usedDice[1]) {
        return { leftDieTargets, rightDieTargets };
    }

    // Dé 1 déjà joué, seul Dé 2 reste
    if (usedDice[0] && !usedDice[1]) {
        for (const m of generateSingleMoves(state.board, player, d2)) {
            addTarget(rightDieTargets, m.from, m.to);
        }
        return { leftDieTargets, rightDieTargets };
    }

    // Dé 2 déjà joué, seul Dé 1 reste
    if (!usedDice[0] && usedDice[1]) {
        for (const m of generateSingleMoves(state.board, player, d1)) {
            addTarget(leftDieTargets, m.from, m.to);
        }
        return { leftDieTargets, rightDieTargets };
    }

    // Aucun dé n'a encore été joué : on applique generateLegalMoves pour respecter le max de dés et la règle du plus fort
    const legalSeqs = generateLegalMoves(state, dice);
    if (legalSeqs.length === 0) {
        return { leftDieTargets, rightDieTargets };
    }

    const maxDice = Math.max(...legalSeqs.map((s) => s.moves.length));

    if (maxDice === 1) {
        const d1Moves = generateSingleMoves(state.board, player, d1);
        const d2Moves = generateSingleMoves(state.board, player, d2);

        if (d1Moves.length > 0 && d2Moves.length > 0) {
            // Deux dés individuellement jouables mais un seul possible : règle du plus fort
            const higher = Math.max(d1, d2);
            const moves = d1 === higher ? d1Moves : d2Moves;
            const targetMap = d1 === higher ? leftDieTargets : rightDieTargets;
            for (const m of moves) {
                addTarget(targetMap, m.from, m.to);
            }
        } else {
            if (d1Moves.length > 0) {
                for (const m of d1Moves) {
                    addTarget(leftDieTargets, m.from, m.to);
                }
            }
            if (d2Moves.length > 0) {
                for (const m of d2Moves) {
                    addTarget(rightDieTargets, m.from, m.to);
                }
            }
        }
        return { leftDieTargets, rightDieTargets };
    }

    // maxDice >= 2 : un premier coup n'est autorisé que s'il permet de jouer ensuite un coup légal
    for (const m of generateSingleMoves(state.board, player, d1)) {
        const next = applyMove(state.board, m, player);
        if (generateSingleMoves(next, player, d2).length > 0) {
            addTarget(leftDieTargets, m.from, m.to);
        }
    }

    for (const m of generateSingleMoves(state.board, player, d2)) {
        const next = applyMove(state.board, m, player);
        if (generateSingleMoves(next, player, d1).length > 0) {
            addTarget(rightDieTargets, m.from, m.to);
        }
    }

    return { leftDieTargets, rightDieTargets };
}

/**
 * Évalue la sécurité d'un coup individuel { from, to } pour un joueur donné.
 * Un score plus élevé correspond à un coup plus sûr et stratégiquement par défaut (Snowie/TMG) :
 * 1. Sortie d'un pion (Bear-off) : score maximal (pion retiré définitivement du plateau).
 * 2. Frappe d'un blot adverse : avantage tactique majeur (l'adversaire est renvoyé à la barre).
 * 3. Formation d'une porte (2 pions ou plus sur la case d'arrivée) : sécurité absolue contre toute frappe.
 * 4. Atterrissage sur une porte déjà fermée (3 pions ou plus) : sécurité totale.
 * 5. Laisser un blot : pénalisé selon les menaces directes des pions adverses (distance 1 à 6 et barre adverse).
 * 6. Casser une porte préexistante : pénalisé si on passe de >=2 pions à 1 pion sur la case source.
 * 7. Course aux pips : progression positive favorisée en cas d'égalité.
 */
export function evaluateMoveSafety(
    board: number[],
    move: Move,
    player: Player = 'X',
): number {
    const isX = player === 'X';
    const { from, to } = move;

    // 1. Sortie de pion (Bear-off) : sécurité absolue
    const isBearOff = isX ? to === X_OFF : to === O_OFF;
    if (isBearOff) {
        return 10000;
    }

    const boardAfter = applyMove(board, move, player);
    let score = 0;

    // 2. Frappe d'un blot adverse envoyé à la barre
    const oppBar = isX ? O_BAR : X_BAR;
    const oppBarAfter = isX ? Math.abs(boardAfter[oppBar]) : boardAfter[oppBar];
    const oppBarBefore = isX ? Math.abs(board[oppBar]) : board[oppBar];
    if (oppBarAfter > oppBarBefore) {
        score += 5000;
    }

    // 3. Sécurité sur la case d'arrivée (to)
    const myCheckersOnTarget = isX ? boardAfter[to] : -boardAfter[to];
    if (myCheckersOnTarget >= 2) {
        // Porte fermée sécurisée : impossible à frapper
        score += 2000 + myCheckersOnTarget * 50;
    } else if (myCheckersOnTarget === 1) {
        // Blot vulnérable laissé sur la flèche d'arrivée : compte les menaces directes de l'adversaire
        let directThreats = 0;
        const oppCheckersOnBar = isX ? Math.abs(boardAfter[O_BAR]) : boardAfter[X_BAR];

        // Menace depuis la barre adverse
        if (oppCheckersOnBar > 0) {
            const enterPoint = isX ? 25 - to : to;
            if (enterPoint >= 1 && enterPoint <= 6) {
                directThreats += 2;
            }
        }

        // Menaces directes à distance 1 à 6
        for (let d = 1; d <= 6; d++) {
            const threatPt = isX ? to + d : to - d;
            if (threatPt >= 1 && threatPt <= 24) {
                const oppCount = isX ? boardAfter[threatPt] : -boardAfter[threatPt];
                if (oppCount < 0) {
                    directThreats += 1;
                }
            }
        }

        score -= directThreats * 250;

        // Jan intérieur ami : légèrement plus sûr
        if ((isX && to <= 6) || (!isX && to >= 19)) {
            score += 40;
        }
    }

    // 4. Pénalité si on a cassé une porte sur la flèche source
    const prevMyFrom = isX ? board[from] : -board[from];
    const newMyFrom = isX ? boardAfter[from] : -boardAfter[from];
    if (prevMyFrom >= 2 && newMyFrom === 1) {
        score -= 600;
    }

    // 5. Avancée dans la course (pips)
    const pipsAdvanced = isX ? from - to : to - from;
    score += pipsAdvanced * 10;

    return score;
}

/**
 * Sélectionne la destination par défaut (la plus sûre) parmi une liste de destinations candidates.
 */
export function getSafestDestination(
    from: number,
    destinations: number[],
    board: number[],
    player: Player = 'X',
): number {
    if (destinations.length === 0) return from;
    if (destinations.length === 1) return destinations[0];

    let bestDest = destinations[0];
    let maxSafety = -Infinity;

    for (const dest of destinations) {
        const safety = evaluateMoveSafety(board, { from, to: dest }, player);
        if (safety > maxSafety) {
            maxSafety = safety;
            bestDest = dest;
        }
    }

    return bestDest;
}

export interface DetectedMove {
    from: number;
    to: number;
    player: Player;
    isHit: boolean;
    isBearOff: boolean;
}

/**
 * Détecte le coup unique joué entre deux états consécutifs du plateau (26 entiers).
 * Retourne null si aucun coup ou s'il s'agit d'une réinitialisation complète de partie.
 */
export function detectBoardMove(
    prevBoard: number[],
    nextBoard: number[],
): DetectedMove | null {
    if (!prevBoard || !nextBoard || prevBoard.length < 26 || nextBoard.length < 26) {
        return null;
    }

    let xFrom: number | null = null;
    let xTo: number | null = null;
    let oHitFrom: number | null = null;

    let oFrom: number | null = null;
    let oTo: number | null = null;
    let xHitFrom: number | null = null;

    let changesCount = 0;

    for (let p = 0; p < 26; p++) {
        const diff = nextBoard[p] - prevBoard[p];
        if (diff === 0) continue;
        changesCount++;

        // Pour X (positif)
        if (prevBoard[p] > 0 && nextBoard[p] < prevBoard[p]) {
            if (xFrom === null) xFrom = p;
        } else if (nextBoard[p] > prevBoard[p] && nextBoard[p] > 0) {
            if (xTo === null) xTo = p;
        }

        // Pour O (négatif)
        if (prevBoard[p] < 0 && nextBoard[p] > prevBoard[p]) {
            if (oFrom === null) oFrom = p;
        } else if (nextBoard[p] < prevBoard[p] && nextBoard[p] < 0) {
            if (oTo === null) oTo = p;
        }

        // Frappe subie par O : O avait -1 et la case contient maintenant > 0 (X)
        if (prevBoard[p] === -1 && nextBoard[p] > 0) {
            oHitFrom = p;
        }
        // Frappe subie par X : X avait +1 et la case contient maintenant < 0 (O)
        if (prevBoard[p] === 1 && nextBoard[p] < 0) {
            xHitFrom = p;
        }
    }

    // Réinitialisation de partie ou chargement complet (trop de cases modifiées)
    if (changesCount > 3 || changesCount === 0) {
        return null;
    }

    const prevXOff = borneOffCount(prevBoard, 'X');
    const nextXOff = borneOffCount(nextBoard, 'X');
    if (xFrom !== null && xTo === null && nextXOff === prevXOff + 1) {
        xTo = 0;
    }

    const prevOOff = borneOffCount(prevBoard, 'O');
    const nextOOff = borneOffCount(nextBoard, 'O');
    if (oFrom !== null && oTo === null && nextOOff === prevOOff + 1) {
        oTo = 25;
    }

    if (xFrom !== null && xTo !== null) {
        return {
            from: xFrom,
            to: xTo,
            player: 'X',
            isHit: oHitFrom !== null,
            isBearOff: xTo === 0,
        };
    }

    if (oFrom !== null && oTo !== null) {
        return {
            from: oFrom,
            to: oTo,
            player: 'O',
            isHit: xHitFrom !== null,
            isBearOff: oTo === 25,
        };
    }

    return null;
}
