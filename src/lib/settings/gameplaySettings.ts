/**
 * Schéma des préférences de jouabilité (Game Feel Spec §5) + persistance localStorage.
 */
import { DEFAULT_GAME_SPEED, isGameSpeed, type GameSpeed } from '../gameFeel/speedPresets';

export type MoveInputMode = 'one_click_smart' | 'select_then_click' | 'drag_only';
export type AutoConfirmMode = 'never' | 'forced_only' | 'always_except_cube' | 'always';
export type PipCountVisibility = 'always' | 'race_only' | 'hidden';
export type PointNumbersVisibility = 'always' | 'relative_to_player' | 'hidden';
export type ReducedMotionPref = 'system' | 'on' | 'off';

export interface GameplaySettings {
    readonly version: 2;
    /** Profil de cadence du bot et des animations. */
    readonly gameSpeed: GameSpeed;
    /** one_click_smart : Source-First + Destination-First ; select_then_click : 1er clic sélectionne ; drag_only : glisser uniquement. */
    readonly moveInputMode: MoveInputMode;
    /** Le clic gauche joue le dé le plus haut (inversable par clic sur les dés). */
    readonly higherDieFirst: boolean;
    /**
     * never : toujours valider manuellement.
     * forced_only : validation auto uniquement si le tour n'avait qu'une séquence légale.
     * always_except_cube : auto, sauf si l'adversaire a accès au videau au tour suivant.
     * always : validation automatique dès que les dés sont joués.
     */
    readonly autoConfirmTurn: AutoConfirmMode;
    /** Sortie automatique en course pure quand toutes les séquences sortent le même nombre de pions. */
    readonly autoBearOff: boolean;
    /** Lancer automatique quand le joueur ne peut pas doubler (Crawford, videau adverse, videau mort). */
    readonly autoRoll: boolean;
    readonly showPipCount: PipCountVisibility;
    readonly showPointNumbers: PointNumbersVisibility;
    readonly showDestinationBadges: boolean;
    readonly keepOpponentMoveArrowsUntilRoll: boolean;
    readonly reducedMotion: ReducedMotionPref;
    readonly haptics: boolean;
    readonly soundOnLanding: boolean;
}

export const DEFAULT_GAMEPLAY_SETTINGS: GameplaySettings = Object.freeze({
    version: 2,
    gameSpeed: DEFAULT_GAME_SPEED,
    moveInputMode: 'one_click_smart',
    higherDieFirst: true,
    autoConfirmTurn: 'forced_only',
    autoBearOff: true,
    autoRoll: true,
    showPipCount: 'always',
    showPointNumbers: 'relative_to_player',
    showDestinationBadges: true,
    keepOpponentMoveArrowsUntilRoll: true,
    reducedMotion: 'system',
    haptics: true,
    soundOnLanding: true,
});

export const AUTO_CONFIRM_MODES: readonly AutoConfirmMode[] = Object.freeze([
    'never',
    'forced_only',
    'always_except_cube',
    'always',
]);

export function isAutoConfirmMode(value: unknown): value is AutoConfirmMode {
    return AUTO_CONFIRM_MODES.includes(value as AutoConfirmMode);
}

export function getNextAutoConfirmMode(current: AutoConfirmMode): AutoConfirmMode {
    const idx = AUTO_CONFIRM_MODES.indexOf(current);
    return AUTO_CONFIRM_MODES[(idx + 1) % AUTO_CONFIRM_MODES.length];
}

/** Migration depuis l'ancien format (autoConfirmTurn booléen, sans version). */
export function migrateGameplaySettings(raw: unknown): GameplaySettings {
    if (typeof raw !== 'object' || raw === null) return DEFAULT_GAMEPLAY_SETTINGS;
    const r = raw as Record<string, unknown>;
    const legacyAuto = r.autoConfirmTurn;
    const autoConfirmTurn: AutoConfirmMode =
        legacyAuto === true
            ? 'always'
            : legacyAuto === false
              ? 'never'
              : AUTO_CONFIRM_MODES.includes(legacyAuto as AutoConfirmMode)
                ? (legacyAuto as AutoConfirmMode)
                : DEFAULT_GAMEPLAY_SETTINGS.autoConfirmTurn;

    const pick = <K extends keyof GameplaySettings>(k: K, allowed?: readonly unknown[]): GameplaySettings[K] => {
        const v = r[k as string];
        if (v === undefined) return DEFAULT_GAMEPLAY_SETTINGS[k];
        if (allowed) return (allowed.includes(v) ? v : DEFAULT_GAMEPLAY_SETTINGS[k]) as GameplaySettings[K];
        return (typeof v === typeof DEFAULT_GAMEPLAY_SETTINGS[k] ? v : DEFAULT_GAMEPLAY_SETTINGS[k]) as GameplaySettings[K];
    };

    return Object.freeze({
        version: 2,
        gameSpeed: isGameSpeed(r.gameSpeed) ? r.gameSpeed : DEFAULT_GAMEPLAY_SETTINGS.gameSpeed,
        moveInputMode: pick('moveInputMode', ['one_click_smart', 'select_then_click', 'drag_only']),
        higherDieFirst: pick('higherDieFirst'),
        autoConfirmTurn,
        autoBearOff: pick('autoBearOff'),
        autoRoll: pick('autoRoll'),
        showPipCount: pick('showPipCount', ['always', 'race_only', 'hidden']),
        showPointNumbers: pick('showPointNumbers', ['always', 'relative_to_player', 'hidden']),
        showDestinationBadges: pick('showDestinationBadges'),
        keepOpponentMoveArrowsUntilRoll: pick('keepOpponentMoveArrowsUntilRoll'),
        reducedMotion: pick('reducedMotion', ['system', 'on', 'off']),
        haptics: pick('haptics'),
        soundOnLanding: pick('soundOnLanding'),
    });
}

export const GAME_SPEED_STORAGE_KEY = 'backgammon.gameSpeed';

export function getSavedGameSpeed(defaultValue: GameSpeed = DEFAULT_GAME_SPEED): GameSpeed {
    if (typeof window === 'undefined') return defaultValue;
    try {
        const v = window.localStorage.getItem(GAME_SPEED_STORAGE_KEY);
        return isGameSpeed(v) ? v : defaultValue;
    } catch {
        return defaultValue;
    }
}

export function saveGameSpeed(speed: GameSpeed): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(GAME_SPEED_STORAGE_KEY, speed);
    } catch {
        // Stockage indisponible (navigation privée) : préférence non persistée.
    }
}

export const AUTO_CONFIRM_MODE_STORAGE_KEY = 'backgammon.autoConfirmMode';

export function getSavedAutoConfirmMode(
    defaultValue: AutoConfirmMode = DEFAULT_GAMEPLAY_SETTINGS.autoConfirmTurn,
): AutoConfirmMode {
    if (typeof window === 'undefined') return defaultValue;
    try {
        const stored = window.localStorage.getItem(AUTO_CONFIRM_MODE_STORAGE_KEY);
        if (isAutoConfirmMode(stored)) return stored;
        const legacy = window.localStorage.getItem('bg_auto_confirm_turn');
        if (legacy === 'true') return 'always';
        if (legacy === 'false') return 'never';
        if (isAutoConfirmMode(legacy)) return legacy;
        return defaultValue;
    } catch {
        return defaultValue;
    }
}

export function saveAutoConfirmMode(mode: AutoConfirmMode): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(AUTO_CONFIRM_MODE_STORAGE_KEY, mode);
    } catch {
        // Stockage indisponible (navigation privée) : préférence non persistée.
    }
}
