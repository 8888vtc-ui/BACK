/**
 * Boîte noire d'état du jeu (Flight Recorder) — télémétrie visuelle de débogage.
 *
 * Rôle :
 *   Enregistre dans un tableau circulaire global (`window.__BG_FLIGHT_RECORDER__`)
 *   chaque transition d'état de `useBackgammonGame.ts` avec un horodatage précis
 *   (`performance.now()`), afin de diagnostiquer les bugs de synchronisation
 *   (flèches désynchronisées, blocage de l'IA, doublons dans l'historique).
 *
 * Chaque entrée contient :
 *   - L'état complet du plateau `board[0..25]` AVANT et APRÈS le coup.
 *   - Le joueur actif (`X` ou `O`), les dés tirés, le statut `isAiThinking`.
 *   - Les flèches de mouvement calculées (`from`, `to`) et la vérification
 *     immédiate : `board[from]` contient-il bien un pion du joueur actif au
 *     moment où la flèche est générée ? Sinon, une erreur
 *     `CRITICAL_ARROW_DESYNC_ERROR` est loguée dans `console.error`.
 *
 * Module 100 % pur : aucune dépendance React, testable isolément.
 */

export type FlightPlayer = 'X' | 'O';

export interface FlightArrow {
    from: number;
    to: number;
    /** `board[from]` contient-il un pion du joueur actif au moment de la génération ? */
    sourceValid: boolean;
    /** Valeur brute de `board[from]` au moment de la génération. */
    sourceValue: number;
}

export interface FlightRecord {
    /** Horodatage haute résolution (ms depuis le démarrage de la page). */
    ts: number;
    /** Type d'événement enregistré. */
    event:
    | 'TURN_START'
    | 'DICE_ROLLED'
    | 'MOVE_APPLIED'
    | 'ARROW_GENERATED'
    | 'AI_ARROWS_DISPLAYED'
    | 'TURN_FINISHED'
    | 'GAME_OVER';
    /** Joueur actif au moment de l'événement. */
    player: FlightPlayer;
    /** Dés tirés (si applicable). */
    dice: [number, number] | null;
    /** Statut de réflexion de l'IA. */
    isAiThinking: boolean;
    /** Plateau AVANT le coup (26 entiers). */
    boardBefore: number[];
    /** Plateau APRÈS le coup (26 entiers). */
    boardAfter: number[];
    /** Flèches de mouvement calculées (si applicable). */
    arrows: FlightArrow[];
    /** Message de statut localisé (si applicable). */
    statusMessage: string | null;
}

const MAX_RECORDS = 500;

/**
 * Récupère (ou initialise) le tableau circulaire global de la boîte noire.
 */
export function getFlightRecorder(): FlightRecord[] {
    if (typeof window === 'undefined') {
        return [];
    }
    const w = window as unknown as { __BG_FLIGHT_RECORDER__?: FlightRecord[] };
    if (!w.__BG_FLIGHT_RECORDER__) {
        w.__BG_FLIGHT_RECORDER__ = [];
    }
    return w.__BG_FLIGHT_RECORDER__;
}

/**
 * Ajoute un enregistrement à la boîte noire (tableau circulaire borné).
 */
export function recordFlightEvent(record: FlightRecord): void {
    if (typeof window === 'undefined') return;
    const recorder = getFlightRecorder();
    // Garde anti-doublon React StrictMode : ignore les doubles invocations du reducer (< 5ms)
    const recent = recorder.slice(-3);
    const isDuplicate = recent.some(
        (item) => item.event === record.event && item.player === record.player && Math.abs(record.ts - item.ts) < 5,
    );
    if (isDuplicate) {
        return;
    }
    recorder.push(record);
    // Troncature circulaire : on ne conserve que les MAX_RECORDS derniers événements.
    if (recorder.length > MAX_RECORDS) {
        recorder.splice(0, recorder.length - MAX_RECORDS);
    }
}

/**
 * Vérifie qu'une flèche `{ from, to }` part bien d'une case contenant un pion
 * du joueur actif. Retourne `false` et logue une erreur critique si ce n'est
 * pas le cas (désynchronisation flèche / plateau).
 */
export function validateArrowSource(
    board: number[],
    from: number,
    player: FlightPlayer,
): { sourceValid: boolean; sourceValue: number } {
    const sourceValue = board[from] ?? 0;
    const sourceValid =
        player === 'X' ? sourceValue > 0 : sourceValue < 0;

    if (!sourceValid) {
        // eslint-disable-next-line no-console
        console.error(
            `[CRITICAL_ARROW_DESYNC_ERROR] Flèche générée depuis la case ${from} ` +
            `(valeur=${sourceValue}) pour le joueur ${player}, mais cette case ne ` +
            `contient pas de pion de ${player}. Plateau=${JSON.stringify(board)}`,
        );
    }

    return { sourceValid, sourceValue };
}

/**
 * Condense ou valide les flèches de déplacement d'une séquence de coups pour
 * un affichage parfait sur la position AVANT mouvement.
 * Chaque flèche retournée part STRICTEMENT d'une case contenant un pion du joueur actif.
 */
export function getDisplayArrowsForMoves(
    moves: Array<{ from: number; to: number }>,
    board: number[],
    player: FlightPlayer = 'O',
): Array<{ from: number; to: number }> {
    const journeys: Array<{ from: number; to: number }> = [];
    for (const m of moves) {
        const continuation = journeys.find((j) => j.to === m.from);
        if (continuation) {
            continuation.to = m.to;
        } else {
            journeys.push({ from: m.from, to: m.to });
        }
    }
    // Filtre strictement : chaque flèche DOIT partir d'une case contenant réellement un pion du joueur
    return journeys.filter((j) => {
        const val = board[j.from] ?? 0;
        return player === 'O' ? val < 0 : val > 0;
    });
}

/**
 * Sérialise la boîte noire complète en JSON (pour le bouton "Copier Debug").
 */
export function serializeFlightRecorder(): string {
    return JSON.stringify(getFlightRecorder(), null, 2);
}

/**
 * Copie la boîte noire dans le presse-papier (si disponible).
 */
export async function copyFlightRecorderToClipboard(): Promise<boolean> {
    try {
        const json = serializeFlightRecorder();
        if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(json);
            return true;
        }
        return false;
    } catch {
        return false;
    }
}
