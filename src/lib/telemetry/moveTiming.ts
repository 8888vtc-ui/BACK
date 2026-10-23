/**
 * Télémétrie Anti-Triche IA — Horodatage du Temps de Décision & Détection de Perte de Focus.
 *
 * Responsabilités :
 *   1. Horodatage exact du temps de réflexion par coup :
 *      RT = t_validation - t_lancer_dés (en millisecondes).
 *   2. Détection de perte de focus fenêtre / changement d'onglet :
 *      Écoute `window.addEventListener('blur', ...)` et `document.addEventListener('visibilitychange', ...)`
 *      pour identifier les signatures de consultation d'eXtreme Gammon (XG) ou d'un bot externe
 *      pendant les décisions complexes.
 *   3. Agrégation dans les métadonnées de match (`MatchTelemetryMetadata`) pour analyse statistique différée.
 */

export type FocusLossEventType = 'blur' | 'visibilitychange';

export interface FocusLossEvent {
    readonly timestamp: number;
    readonly type: FocusLossEventType;
    readonly visibilityState: DocumentVisibilityState | 'blurred';
    readonly turnIndex: number | null;
    readonly duringActiveDecision: boolean;
    readonly elapsedSinceRollMs: number | null;
}

export interface MoveDecisionTimingEntry {
    readonly turnIndex: number;
    readonly player: 'X' | 'O';
    readonly dice: readonly [number, number];
    /** Horodatage du lancer de dés (t_lancer_dés). */
    readonly rollTimestamp: number;
    /** Horodatage de la validation du coup (t_validation). */
    readonly validationTimestamp: number;
    /** Temps de réflexion exact : RT = t_validation - t_lancer_dés (ms). */
    readonly reactionTimeMs: number;
    /** Nombre de pertes de focus (blur / onglet caché) durant la réflexion de ce coup. */
    readonly focusLossCount: number;
    /** Événements détaillés de perte de focus survenus pendant ce tour. */
    readonly focusLossEvents: ReadonlyArray<FocusLossEvent>;
    /** Indique si le tour présente une signature de bascule d'écran / onglet pendant la réflexion. */
    readonly flaggedExternalConsultSuspect: boolean;
}

export interface MatchTelemetryMetadata {
    readonly matchStartedAt: number;
    readonly decisions: ReadonlyArray<MoveDecisionTimingEntry>;
    readonly focusLossLog: ReadonlyArray<FocusLossEvent>;
    readonly totalDecisions: number;
    readonly totalFocusLosses: number;
    readonly focusLossesDuringDecisions: number;
    readonly meanReactionTimeMs: number;
    readonly minReactionTimeMs: number | null;
    readonly maxReactionTimeMs: number | null;
    readonly suspiciousTurnsCount: number;
}

export interface MoveTimingTrackerOptions {
    /** Horloge injectable (par défaut `Date.now`). */
    readonly now?: () => number;
    /** Callback optionnel déclenché à chaque perte de focus détectée. */
    readonly onFocusLoss?: (event: FocusLossEvent) => void;
    /** Callback optionnel déclenché à chaque validation de coup chronométrée. */
    readonly onDecisionRecorded?: (entry: MoveDecisionTimingEntry) => void;
}

/**
 * Calcule le temps de décision exact par coup : RT = t_validation - t_lancer_dés (borné à >= 0).
 */
export function computeDecisionReactionTime(
    rollTimestamp: number,
    validationTimestamp: number,
): number {
    if (!Number.isFinite(rollTimestamp) || !Number.isFinite(validationTimestamp)) {
        return 0;
    }
    return Math.max(0, Math.round(validationTimestamp - rollTimestamp));
}

export class MoveTimingTracker {
    private readonly nowFn: () => number;
    private readonly onFocusLossCallback?: (event: FocusLossEvent) => void;
    private readonly onDecisionRecordedCallback?: (entry: MoveDecisionTimingEntry) => void;

    private matchStartedAt: number;
    private activeRollTimestamp: number | null = null;
    private activeTurnIndex: number | null = null;
    private currentTurnFocusEvents: FocusLossEvent[] = [];
    private decisions: MoveDecisionTimingEntry[] = [];
    private focusLossLog: FocusLossEvent[] = [];

    constructor(options: MoveTimingTrackerOptions = {}) {
        this.nowFn = options.now ?? (() => Date.now());
        this.onFocusLossCallback = options.onFocusLoss;
        this.onDecisionRecordedCallback = options.onDecisionRecorded;
        this.matchStartedAt = this.nowFn();
    }

    /**
     * Démarre le chronomètre de réflexion lors du lancer des dés (`t_lancer_dés`).
     */
    public markDiceRolled(turnIndex?: number, timestamp?: number): number {
        const ts = timestamp ?? this.nowFn();
        this.activeRollTimestamp = ts;
        this.activeTurnIndex = turnIndex ?? this.decisions.length + 1;
        this.currentTurnFocusEvents = [];
        return ts;
    }

    /**
     * Alias de `markDiceRolled`.
     */
    public startDecisionTimer(turnIndex?: number, timestamp?: number): number {
        return this.markDiceRolled(turnIndex, timestamp);
    }

    /**
     * Enregistre le temps de réflexion à la validation du coup (`RT = t_validation - t_lancer_dés`).
     */
    public recordMoveValidated(params: {
        turnIndex: number;
        player: 'X' | 'O';
        dice: readonly [number, number];
        validationTimestamp?: number;
        rollTimestampOverride?: number;
    }): MoveDecisionTimingEntry {
        const validationTimestamp = params.validationTimestamp ?? this.nowFn();
        const rollTimestamp =
            params.rollTimestampOverride ?? this.activeRollTimestamp ?? validationTimestamp;
        const reactionTimeMs = computeDecisionReactionTime(rollTimestamp, validationTimestamp);

        const turnFocusEvents = Object.freeze([...this.currentTurnFocusEvents]);
        const focusLossCount = turnFocusEvents.length;

        const entry: MoveDecisionTimingEntry = Object.freeze({
            turnIndex: params.turnIndex,
            player: params.player,
            dice: Object.freeze([params.dice[0], params.dice[1]]) as readonly [number, number],
            rollTimestamp,
            validationTimestamp,
            reactionTimeMs,
            focusLossCount,
            focusLossEvents: turnFocusEvents,
            flaggedExternalConsultSuspect: focusLossCount > 0,
        });

        this.decisions.push(entry);
        this.activeRollTimestamp = null;
        this.activeTurnIndex = null;
        this.currentTurnFocusEvents = [];

        this.onDecisionRecordedCallback?.(entry);
        return entry;
    }

    /**
     * Enregistre un événement de perte de focus (`blur` ou `visibilitychange` -> `hidden`).
     */
    public recordFocusLoss(
        type: FocusLossEventType,
        visibilityState: DocumentVisibilityState | 'blurred' = type === 'blur' ? 'blurred' : 'hidden',
        timestamp?: number,
    ): FocusLossEvent {
        const ts = timestamp ?? this.nowFn();
        const duringActiveDecision = this.activeRollTimestamp !== null;
        const elapsedSinceRollMs =
            this.activeRollTimestamp !== null
                ? computeDecisionReactionTime(this.activeRollTimestamp, ts)
                : null;

        const event: FocusLossEvent = Object.freeze({
            timestamp: ts,
            type,
            visibilityState,
            turnIndex: this.activeTurnIndex,
            duringActiveDecision,
            elapsedSinceRollMs,
        });

        this.focusLossLog.push(event);
        if (duringActiveDecision) {
            this.currentTurnFocusEvents.push(event);
        }

        this.onFocusLossCallback?.(event);
        return event;
    }

    /**
     * Attache les écouteurs `window.addEventListener('blur', ...)` et
     * `document.addEventListener('visibilitychange', ...)` et retourne la fonction de nettoyage.
     */
    public attachBrowserListeners(
        targetWindow: Window | undefined = typeof window !== 'undefined' ? window : undefined,
        targetDocument: Document | undefined = typeof document !== 'undefined' ? document : undefined,
    ): () => void {
        if (!targetWindow && !targetDocument) {
            return () => {};
        }

        const handleBlur = () => {
            this.recordFocusLoss('blur', 'blurred');
        };

        const handleVisibilityChange = () => {
            if (!targetDocument || targetDocument.visibilityState === 'hidden') {
                this.recordFocusLoss(
                    'visibilitychange',
                    targetDocument ? targetDocument.visibilityState : 'hidden',
                );
            }
        };

        if (targetWindow && typeof targetWindow.addEventListener === 'function') {
            targetWindow.addEventListener('blur', handleBlur);
        }
        if (targetDocument && typeof targetDocument.addEventListener === 'function') {
            targetDocument.addEventListener('visibilitychange', handleVisibilityChange);
        }

        return () => {
            if (targetWindow && typeof targetWindow.removeEventListener === 'function') {
                targetWindow.removeEventListener('blur', handleBlur);
            }
            if (targetDocument && typeof targetDocument.removeEventListener === 'function') {
                targetDocument.removeEventListener('visibilitychange', handleVisibilityChange);
            }
        };
    }

    /**
     * Indique si une décision est actuellement en cours de chronométrage.
     */
    public isDecisionInProgress(): boolean {
        return this.activeRollTimestamp !== null;
    }

    /**
     * Retourne le nombre de pertes de focus survenues depuis le lancer courant.
     */
    public getCurrentTurnFocusLossCount(): number {
        return this.currentTurnFocusEvents.length;
    }

    /**
     * Retourne le dernier horodatage de lancer actif (ou null).
     */
    public getActiveRollTimestamp(): number | null {
        return this.activeRollTimestamp;
    }

    /**
     * Agrège et retourne les métadonnées télémétriques immuables du match.
     */
    public getMatchMetadata(): MatchTelemetryMetadata {
        const totalDecisions = this.decisions.length;
        const totalFocusLosses = this.focusLossLog.length;
        const focusLossesDuringDecisions = this.focusLossLog.filter(
            (e) => e.duringActiveDecision,
        ).length;

        let sumRt = 0;
        let minRt: number | null = null;
        let maxRt: number | null = null;
        let suspiciousTurnsCount = 0;

        for (const d of this.decisions) {
            sumRt += d.reactionTimeMs;
            if (minRt === null || d.reactionTimeMs < minRt) minRt = d.reactionTimeMs;
            if (maxRt === null || d.reactionTimeMs > maxRt) maxRt = d.reactionTimeMs;
            if (d.flaggedExternalConsultSuspect) suspiciousTurnsCount += 1;
        }

        const meanReactionTimeMs =
            totalDecisions > 0 ? Math.round(sumRt / totalDecisions) : 0;

        return Object.freeze({
            matchStartedAt: this.matchStartedAt,
            decisions: Object.freeze([...this.decisions]),
            focusLossLog: Object.freeze([...this.focusLossLog]),
            totalDecisions,
            totalFocusLosses,
            focusLossesDuringDecisions,
            meanReactionTimeMs,
            minReactionTimeMs: minRt,
            maxReactionTimeMs: maxRt,
            suspiciousTurnsCount,
        });
    }

    /**
     * Réinitialise toutes les métriques pour un nouveau match.
     */
    public reset(timestamp?: number): void {
        this.matchStartedAt = timestamp ?? this.nowFn();
        this.activeRollTimestamp = null;
        this.activeTurnIndex = null;
        this.currentTurnFocusEvents = [];
        this.decisions = [];
        this.focusLossLog = [];
    }
}

/**
 * Fabrique une instance de suivi télémétrique `MoveTimingTracker`.
 */
export function createMoveTimingTracker(
    options: MoveTimingTrackerOptions = {},
): MoveTimingTracker {
    return new MoveTimingTracker(options);
}
