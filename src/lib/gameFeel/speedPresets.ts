/**
 * Profils de cadence du bot et des animations (Game Feel Spec §3).
 *
 * Source unique de vérité pour la chronométrie du tour adverse :
 *   T0 handoff → T1 roulement des dés (calcul IA lancé en parallèle) → T2 lecture des dés
 *   → T3 flèches d'intention → T4 vol des pions → T5 pause entre pions → T6 persistance des flèches.
 */

export type GameSpeed = 'coach' | 'tournament' | 'blitz';

export const GAME_SPEED_ORDER: readonly GameSpeed[] = ['coach', 'tournament', 'blitz'] as const;

export interface SpeedPreset {
    /** Délai entre la fin du tour humain et le lancer des dés du bot. */
    readonly T0_TURN_HANDOFF_MS: number;
    /** Durée du roulement des dés (le calcul IA tourne en parallèle). */
    readonly T1_DICE_ROLL_ANIMATION_MS: number;
    /** Temps minimal pendant lequel les dés restent posés avant le premier mouvement. */
    readonly T2_DICE_READ_PAUSE_MS: number;
    /** Affichage des flèches d'intention avant le mouvement (0 = désactivé). */
    readonly T3_ARROW_PREVIEW_MS: number;
    /** Facteur appliqué à la formule de durée de vol (§2). */
    readonly T4_FLIGHT_SPEED_FACTOR: number;
    /** Intervalle entre deux pions déplacés par le bot (non-double). */
    readonly T5_BETWEEN_MOVES_PAUSE_MS: number;
    /** Maintien des flèches du dernier coup adverse après la fin du lancer humain. */
    readonly T6_RETAIN_AFTER_HUMAN_ROLL_MS: number;
    /** Durée d'annonce quand le bot ne peut pas jouer. */
    readonly NO_MOVE_ANNOUNCE_MS: number;
    /** Délai dur du calcul distant avant repli sur le moteur local. */
    readonly COMPUTE_HARD_DEADLINE_MS: number;
    /** Contact visible sur la case intermédiaire d'un coup combiné. */
    readonly COMBO_TOUCHDOWN_MS: number;
    /** Répit visuel après le dernier pion du bot avant de rendre la main. */
    readonly END_OF_TURN_BREATH_MS: number;
}

/** En double (4 pions), la cadence s'accélère de 25 % pour éviter la lourdeur. */
export const DOUBLES_CADENCE_FACTOR = 0.75;
/** L'indicateur « réflexion » n'apparaît que si le calcul dépasse T2 + ce délai. */
export const THINKING_INDICATOR_GRACE_MS = 250;
/** Budget de la décision de videau pré-calculée. */
export const CUBE_DECISION_BUDGET_MS = 600;

export const SPEED_PRESETS: Readonly<Record<GameSpeed, SpeedPreset>> = Object.freeze({
    coach: Object.freeze({
        T0_TURN_HANDOFF_MS: 500,
        T1_DICE_ROLL_ANIMATION_MS: 900,
        T2_DICE_READ_PAUSE_MS: 600,
        T3_ARROW_PREVIEW_MS: 1000,
        T4_FLIGHT_SPEED_FACTOR: 1.35,
        T5_BETWEEN_MOVES_PAUSE_MS: 320,
        T6_RETAIN_AFTER_HUMAN_ROLL_MS: 1200,
        NO_MOVE_ANNOUNCE_MS: 1200,
        COMPUTE_HARD_DEADLINE_MS: 2500,
        COMBO_TOUCHDOWN_MS: 90,
        END_OF_TURN_BREATH_MS: 300,
    }),
    tournament: Object.freeze({
        T0_TURN_HANDOFF_MS: 250,
        T1_DICE_ROLL_ANIMATION_MS: 600,
        T2_DICE_READ_PAUSE_MS: 300,
        T3_ARROW_PREVIEW_MS: 300,
        T4_FLIGHT_SPEED_FACTOR: 1.0,
        T5_BETWEEN_MOVES_PAUSE_MS: 140,
        T6_RETAIN_AFTER_HUMAN_ROLL_MS: 600,
        NO_MOVE_ANNOUNCE_MS: 700,
        COMPUTE_HARD_DEADLINE_MS: 1800,
        COMBO_TOUCHDOWN_MS: 70,
        END_OF_TURN_BREATH_MS: 150,
    }),
    blitz: Object.freeze({
        T0_TURN_HANDOFF_MS: 60,
        T1_DICE_ROLL_ANIMATION_MS: 300,
        T2_DICE_READ_PAUSE_MS: 120,
        T3_ARROW_PREVIEW_MS: 0,
        T4_FLIGHT_SPEED_FACTOR: 0.6,
        T5_BETWEEN_MOVES_PAUSE_MS: 40,
        T6_RETAIN_AFTER_HUMAN_ROLL_MS: 0,
        NO_MOVE_ANNOUNCE_MS: 350,
        COMPUTE_HARD_DEADLINE_MS: 1100,
        COMBO_TOUCHDOWN_MS: 30,
        END_OF_TURN_BREATH_MS: 0,
    }),
});

export const DEFAULT_GAME_SPEED: GameSpeed = 'tournament';

export function isGameSpeed(value: unknown): value is GameSpeed {
    return value === 'coach' || value === 'tournament' || value === 'blitz';
}

export function getSpeedPreset(speed: GameSpeed | undefined | null): SpeedPreset {
    return SPEED_PRESETS[isGameSpeed(speed) ? speed : DEFAULT_GAME_SPEED];
}

/** Pause effective entre deux pions du bot (accélérée en double). */
export function getBetweenMovesPauseMs(preset: SpeedPreset, isDouble: boolean): number {
    return Math.round(preset.T5_BETWEEN_MOVES_PAUSE_MS * (isDouble ? DOUBLES_CADENCE_FACTOR : 1));
}
