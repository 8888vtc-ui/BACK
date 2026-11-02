/**
 * @file src/features/multiplayer/clubChallengerPool.ts
 * @description Vivier des 300 Adversaires Humains Naturels (`HUMAN_PERSONA_POOL`) pour le Matchmaking
 * (« Trouver un adversaire ») avec Verrou Anti-Répétition de 7 Jours (sauf Revanche immédiate).
 *
 * Invariants :
 * - 300 profils naturels répartis en 3 paliers (<1500 `beginner`, 1500–1650 `intermediate`, >1650 `expert`).
 * - Aucun `grandmaster` imbattable en matchmaking.
 * - Délai matchmaking réaliste : 3,5s à 8,5s (`3500..8500 ms` via `computeHumanThinkingDelay('matchmaking')`).
 * - Utilise exclusivement `crypto.getRandomValues` (zéro `Math.random()`).
 */

import type { ClubChallengerDifficulty, PlayerEloProfile } from './types';
import { HUMAN_PERSONA_POOL, type HumanPersonaSeed } from '../personas/humanPersonaSeeds';
import { computeHumanThinkingDelay } from '../personas/humanPersonaPool';

export type ClubChallengerSeed = HumanPersonaSeed;

export const BOT_WEEKLY_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours (1 semaine)
const STORAGE_KEY_BOT_COOLDOWNS = 'bg_club_bot_weekly_cooldowns_v1';

let inMemoryBotCooldowns: Record<string, number> = {};

/** 300 profils internationaux naturels issus de `HUMAN_PERSONA_POOL`. */
export const CLUB_CHALLENGER_SEEDS: ReadonlyArray<ClubChallengerSeed> = HUMAN_PERSONA_POOL;

function cryptoRandomInt(maxExclusive: number): number {
    if (maxExclusive <= 1) return 0;
    const buf = new Uint32Array(1);
    const limit = Math.floor(0x100000000 / maxExclusive) * maxExclusive;
    let val = 0;
    do {
        crypto.getRandomValues(buf);
        val = buf[0];
    } while (val >= limit);
    return val % maxExclusive;
}

function normalizeBotKey(idOrUsername: string): string {
    return idOrUsername.trim().replace(/_\d{10,}$/, '');
}

function readCooldownRegistry(nowMs: number = Date.now()): Record<string, number> {
    if (typeof window !== 'undefined' && window.localStorage) {
        try {
            const raw = window.localStorage.getItem(STORAGE_KEY_BOT_COOLDOWNS);
            if (raw) {
                const parsed = JSON.parse(raw) as Record<string, number>;
                inMemoryBotCooldowns = { ...inMemoryBotCooldowns, ...parsed };
            }
        } catch {
            // Ignore
        }
    }
    const active: Record<string, number> = {};
    for (const [k, ts] of Object.entries(inMemoryBotCooldowns)) {
        if (typeof ts === 'number' && nowMs - ts < BOT_WEEKLY_COOLDOWN_MS) {
            active[k] = ts;
        }
    }
    inMemoryBotCooldowns = active;
    return active;
}

export function resetClubChallengerCooldownsForTests(): void {
    inMemoryBotCooldowns = {};
    if (typeof window !== 'undefined' && window.localStorage) {
        try {
            window.localStorage.removeItem(STORAGE_KEY_BOT_COOLDOWNS);
        } catch {
            // Ignore
        }
    }
}

export function recordClubChallengerEncounter(challengerIdOrUsername: string, nowMs: number = Date.now()): void {
    const key = normalizeBotKey(challengerIdOrUsername);
    if (!key) return;
    const active = readCooldownRegistry(nowMs);
    active[key] = nowMs;
    inMemoryBotCooldowns = active;
    if (typeof window !== 'undefined' && window.localStorage) {
        try {
            window.localStorage.setItem(STORAGE_KEY_BOT_COOLDOWNS, JSON.stringify(active));
        } catch {
            // Ignore
        }
    }
}

export function isClubChallengerOnWeeklyCooldown(challengerIdOrUsername: string, nowMs: number = Date.now()): boolean {
    const key = normalizeBotKey(challengerIdOrUsername);
    const active = readCooldownRegistry(nowMs);
    const ts = active[key];
    return typeof ts === 'number' && nowMs - ts < BOT_WEEKLY_COOLDOWN_MS;
}

export function resolveChallengerDifficultyForElo(playerRating: number): ClubChallengerDifficulty {
    const safeRating = Number.isFinite(playerRating) ? playerRating : 1500;
    if (safeRating < 1500) return 'beginner';
    if (safeRating <= 1650) return 'intermediate';
    return 'expert';
}

export interface SelectClubChallengerOptions {
    readonly isRematch?: boolean;
    readonly previousChallenger?: PlayerEloProfile | null;
    readonly nowMs?: number;
}

/**
 * Sélectionne un adversaire parmi les 300 profils naturels :
 * - Si `isRematch: true` avec `previousChallenger`, autorise la revanche immédiate contre ce même profil.
 * - Sinon, exclut tout profil déjà affronté au cours des 7 derniers jours (`BOT_WEEKLY_COOLDOWN_MS`).
 */
export function selectClubChallengerForRating(
    playerRating: number,
    options?: SelectClubChallengerOptions,
): PlayerEloProfile {
    const nowMs = options?.nowMs ?? Date.now();
    if (options?.isRematch && options.previousChallenger) {
        recordClubChallengerEncounter(options.previousChallenger.id, nowMs);
        recordClubChallengerEncounter(options.previousChallenger.username, nowMs);
        return { ...options.previousChallenger, id: `${normalizeBotKey(options.previousChallenger.id)}_${nowMs}` };
    }

    const targetDifficulty = resolveChallengerDifficultyForElo(playerRating);
    const freshTierPool = CLUB_CHALLENGER_SEEDS.filter(
        (c) =>
            c.difficulty === targetDifficulty &&
            !isClubChallengerOnWeeklyCooldown(c.id, nowMs) &&
            !isClubChallengerOnWeeklyCooldown(c.username, nowMs),
    );
    const freshGlobalPool =
        freshTierPool.length > 0
            ? freshTierPool
            : CLUB_CHALLENGER_SEEDS.filter(
                  (c) =>
                      !isClubChallengerOnWeeklyCooldown(c.id, nowMs) &&
                      !isClubChallengerOnWeeklyCooldown(c.username, nowMs),
              );
    const candidates = freshGlobalPool.length > 0 ? freshGlobalPool : CLUB_CHALLENGER_SEEDS;

    const safeRating = Number.isFinite(playerRating) ? playerRating : 1500;
    const sorted = [...candidates].sort(
        (a, b) => Math.abs(a.baseRating - safeRating) - Math.abs(b.baseRating - safeRating),
    );
    const topPool = sorted.slice(0, Math.min(8, sorted.length));
    const chosen = topPool[cryptoRandomInt(topPool.length)] ?? CLUB_CHALLENGER_SEEDS[0];

    recordClubChallengerEncounter(chosen.id, nowMs);
    recordClubChallengerEncounter(chosen.username, nowMs);

    let finalRating = chosen.baseRating;
    if (finalRating % 10 === 0) finalRating += 3;

    const seedIndex = Math.max(0, CLUB_CHALLENGER_SEEDS.findIndex((s) => s.id === chosen.id));
    const standardAvatarUrl = `/avatars/user-avatar-${(seedIndex % 5) + 1}.jpg`;

    return {
        id: `${chosen.id}_${nowMs}`,
        username: chosen.username,
        displayName: `${chosen.countryFlag} ${chosen.username}`,
        rating: finalRating,
        averagePr: chosen.targetErPr,
        avatarUrl: standardAvatarUrl,
        countryFlag: chosen.countryFlag,
        countryName: chosen.countryName,
        clubBotDifficulty: chosen.difficulty,
        isGuest: false,
    };
}

/** Délai d'attente matchmaking humain : 3,5s à 8,5s (3500..8500 ms). */
export function computeRealisticMatchmakingDelayMs(): number {
    return computeHumanThinkingDelay('matchmaking').selectedMs;
}
