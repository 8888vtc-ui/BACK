import { describe, it, expect } from 'vitest';
import {
    getRecommendedClockConfig,
    createMatchClock,
    computeClockTick,
    switchClockTurn,
    pauseClock,
    resumeClock,
    syncClockState,
    formatClockTime,
} from './clockManager';

describe('clockManager (Tournament Backgammon Clocks)', () => {
    it('génère la cadence recommandée WBF selon les points du match', () => {
        const config7pts = getRecommendedClockConfig(7, 'delay');
        expect(config7pts.type).toBe('delay');
        expect(config7pts.bankMs).toBe(7 * 120 * 1000); // 14 minutes
        expect(config7pts.delaySeconds).toBe(12);

        const config1pt = getRecommendedClockConfig(1, 'per_turn');
        expect(config1pt.type).toBe('per_turn');
        expect(config1pt.bankMs).toBe(45000);
    });

    it('initialise correctement la pendule avec les réserves de temps', () => {
        const config = getRecommendedClockConfig(5, 'delay');
        const start = 100000;
        const clock = createMatchClock(config, 'X', start);

        expect(clock.activePlayer).toBe('X');
        expect(clock.bankXMs).toBe(600000); // 10 minutes
        expect(clock.bankOMs).toBe(600000);
        expect(clock.delayRemainingMs).toBe(12000); // 12 secondes
        expect(clock.isFlagFallen).toBe(false);
    });

    it('ne déduit rien de la réserve principale si le coup est joué pendant le délai de réflexion gratuit', () => {
        const config = getRecommendedClockConfig(5, 'delay');
        const start = 100000;
        const clock = createMatchClock(config, 'X', start);

        // 5 secondes se sont écoulées (sur 12s de délai gratuit)
        const tick = computeClockTick(clock, start + 5000);

        expect(tick.bankXMs).toBe(600000); // Réserve intacte
        expect(tick.delayRemainingMs).toBe(7000); // 12 - 5 = 7s
        expect(tick.isFlagFallen).toBe(false);
    });

    it('déduit le temps excédentaire de la réserve principale une fois le délai épuisé', () => {
        const config = getRecommendedClockConfig(5, 'delay');
        const start = 100000;
        const clock = createMatchClock(config, 'X', start);

        // 17 secondes se sont écoulées (12s de délai + 5s dans la banque)
        const tick = computeClockTick(clock, start + 17000);

        expect(tick.delayRemainingMs).toBe(0);
        expect(tick.bankXMs).toBe(600000 - 5000); // 595 000 ms
        expect(tick.isFlagFallen).toBe(false);
    });

    it('détecte la chute de drapeau (flag fall / timeout) quand la réserve tombe à zéro', () => {
        const config = { type: 'delay' as const, bankMs: 10000, delaySeconds: 12 };
        const start = 100000;
        const clock = createMatchClock(config, 'X', start);

        // 25 secondes écoulées (12s délai + 13s > 10s de réserve)
        const tick = computeClockTick(clock, start + 25000);

        expect(tick.bankXMs).toBe(0);
        expect(tick.isFlagFallen).toBe(true);
        expect(tick.flagFallenPlayer).toBe('X');
    });

    it('change de tour correctement et réinitialise le délai pour le joueur suivant', () => {
        const config = getRecommendedClockConfig(3, 'delay');
        const start = 100000;
        const clock = createMatchClock(config, 'X', start);

        // X joue son coup en 16 secondes (12s délai + 4s réserve)
        const updatedClock = switchClockTurn(clock, 'O', config, start + 16000);

        expect(updatedClock.activePlayer).toBe('O');
        expect(updatedClock.bankXMs).toBe(config.bankMs - 4000);
        expect(updatedClock.delayRemainingMs).toBe(12000); // Réinitialisé pour O
        expect(updatedClock.turnStartedAt).toBe(start + 16000);
    });

    it('gère la mise en pause et la reprise de la pendule lors de déconnexion', () => {
        const config = getRecommendedClockConfig(3, 'delay');
        const start = 100000;
        const clock = createMatchClock(config, 'X', start);

        // Pause après 14 secondes (12s délai + 2s banque)
        const paused = pauseClock(clock, start + 14000);
        expect(paused.isPaused).toBe(true);
        expect(paused.bankXMs).toBe(config.bankMs - 2000);

        // Pendant la pause de 30 secondes, le temps ne doit pas s'écouler
        const pausedTick = computeClockTick(paused, start + 44000);
        expect(pausedTick.bankXMs).toBe(config.bankMs - 2000);

        // Reprise
        const resumed = resumeClock(paused, start + 44000);
        expect(resumed.isPaused).toBe(false);
        expect(resumed.turnStartedAt).toBe(start + 44000);
    });

    it('synchronise l’état de la pendule avec les valeurs du serveur', () => {
        const config = getRecommendedClockConfig(3, 'delay');
        const clock = createMatchClock(config, 'X');

        const synced = syncClockState(clock, {
            bankXMs: 120000,
            bankOMs: 145000,
            activePlayer: 'O',
            turnStartedAt: 200000,
        });

        expect(synced.bankXMs).toBe(120000);
        expect(synced.bankOMs).toBe(145000);
        expect(synced.activePlayer).toBe('O');
    });

    it('formate correctement le temps d’horloge en MM:SS et dixièmes si critique', () => {
        expect(formatClockTime(125000)).toBe('02:05');
        expect(formatClockTime(60000)).toBe('01:00');
        expect(formatClockTime(45000)).toBe('00:45');
        expect(formatClockTime(8400, true)).toBe('8.4s');
        expect(formatClockTime(0)).toBe('0.0s');
    });

    it('supporte le mode Bronstein et les cadences Speed / Blitz de Backgammon Galaxy', () => {
        const speedCfg = getRecommendedClockConfig(5, 'bronstein', 'speed');
        expect(speedCfg.type).toBe('bronstein');
        expect(speedCfg.bankMs).toBe(5 * 60 * 1000); // 1 min / pt = 5 min
        expect(speedCfg.delaySeconds).toBe(8);

        const blitzCfg = getRecommendedClockConfig(5, 'bronstein', 'blitz');
        expect(blitzCfg.bankMs).toBe(5 * 30 * 1000); // 30s / pt = 2.5 min
        expect(blitzCfg.delaySeconds).toBe(5);

        const start = 100000;
        const clock = createMatchClock(speedCfg, 'X', start);
        expect(clock.delayRemainingMs).toBe(8000);

        // X joue en 6s (< 8s délai Bronstein) : la réserve reste exactement à sa valeur initiale
        const nextClock = switchClockTurn(clock, 'O', speedCfg, start + 6000);
        expect(nextClock.bankXMs).toBe(speedCfg.bankMs);
        expect(nextClock.delayRemainingMs).toBe(8000);
    });

    it('applique correctement l’incrément Fischer sans double délai initial', () => {
        const fischerCfg = getRecommendedClockConfig(3, 'fischer', 'normal');
        const start = 100000;
        const clock = createMatchClock(fischerCfg, 'X', start);

        // En Fischer, delayRemainingMs = 0 : la réserve diminue immédiatement pendant le coup
        expect(clock.delayRemainingMs).toBe(0);
        const tickAfter5s = computeClockTick(clock, start + 5000);
        expect(tickAfter5s.bankXMs).toBe(fischerCfg.bankMs - 5000);

        // À la fin du coup de 5s, X reçoit +12s d'incrément -> réserve finale = bankMs - 5s + 12s = bankMs + 7s
        const nextClock = switchClockTurn(clock, 'O', fischerCfg, start + 5000);
        expect(nextClock.bankXMs).toBe(fischerCfg.bankMs + 7000);
        expect(nextClock.activePlayer).toBe('O');
        expect(nextClock.delayRemainingMs).toBe(0);
    });
});
