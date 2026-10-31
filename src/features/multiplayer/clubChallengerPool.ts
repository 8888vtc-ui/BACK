/**
 * @file src/features/multiplayer/clubChallengerPool.ts
 * @description Vivier de 100 Adversaires Internationaux Actifs pour le Matchmaking (« Trouver un adversaire »)
 * avec Verrou Anti-Répétition de 7 Jours (sauf Revanche immédiate).
 *
 * Invariants :
 * - 100 bots actifs répartis du Débutant (`beginner`, ~1420 Elo) au Club (`intermediate`, ~1680 Elo)
 *   et au Pro/Maître (`expert`, ~1950 Elo). AUCUN champion imbattable (`grandmaster` exclu).
 * - Un joueur ne peut JAMAIS retomber sur le même bot pendant 1 semaine (`BOT_WEEKLY_COOLDOWN_MS = 7 jours`),
 *   SAUF s'il demande explicitement une revanche immédiate (`isRematch: true`).
 * - Utilise exclusivement `crypto.getRandomValues` (zéro `Math.random()`).
 */

import type { ClubChallengerDifficulty, PlayerEloProfile } from './types';

export interface ClubChallengerSeed {
    readonly id: string;
    readonly username: string;
    readonly countryFlag: string;
    readonly countryName: string;
    readonly baseRating: number;
    readonly difficulty: ClubChallengerDifficulty;
}

export const BOT_WEEKLY_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours (1 semaine)
const STORAGE_KEY_BOT_COOLDOWNS = 'bg_club_bot_weekly_cooldowns_v1';

let inMemoryBotCooldowns: Record<string, number> = {};

/**
 * 100 profils internationaux actifs (34 Débutant, 34 Club, 32 Pro). Zéro `grandmaster`.
 */
export const CLUB_CHALLENGER_SEEDS: ReadonlyArray<ClubChallengerSeed> = [
    // --- Palier 1 : 34 Bots Débutant / Loisir (1360 – 1555 Elo -> `beginner`, PR ~12.5) ---
    { id: 'club_fr_lucas', username: 'Lucas_Lyon69', countryFlag: '🇫🇷', countryName: 'France', baseRating: 1365, difficulty: 'beginner' },
    { id: 'club_es_mateo', username: 'Mateo_Madrid', countryFlag: '🇪🇸', countryName: 'Espagne', baseRating: 1375, difficulty: 'beginner' },
    { id: 'club_it_giulia', username: 'Giulia_Roma', countryFlag: '🇮🇹', countryName: 'Italie', baseRating: 1385, difficulty: 'beginner' },
    { id: 'club_br_thiago', username: 'Thiago_Rio', countryFlag: '🇧🇷', countryName: 'Brésil', baseRating: 1390, difficulty: 'beginner' },
    { id: 'club_ca_chloe', username: 'Chloe_Mtl', countryFlag: '🇨🇦', countryName: 'Canada', baseRating: 1395, difficulty: 'beginner' },
    { id: 'club_us_mason', username: 'Mason_Austin', countryFlag: '🇺🇸', countryName: 'États-Unis', baseRating: 1405, difficulty: 'beginner' },
    { id: 'club_be_thomas', username: 'Thomas_Bxl', countryFlag: '🇧🇪', countryName: 'Belgique', baseRating: 1410, difficulty: 'beginner' },
    { id: 'club_pt_tiago', username: 'Tiago_Lisboa', countryFlag: '🇵🇹', countryName: 'Portugal', baseRating: 1415, difficulty: 'beginner' },
    { id: 'club_mx_diego', username: 'Diego_CDMX', countryFlag: '🇲🇽', countryName: 'Mexique', baseRating: 1420, difficulty: 'beginner' },
    { id: 'club_ar_valen', username: 'Valentina_BA', countryFlag: '🇦🇷', countryName: 'Argentine', baseRating: 1425, difficulty: 'beginner' },
    { id: 'club_pl_jakub', username: 'Jakub_Waw', countryFlag: '🇵🇱', countryName: 'Pologne', baseRating: 1430, difficulty: 'beginner' },
    { id: 'club_ma_yassine', username: 'Yassine_Casa', countryFlag: '🇲🇦', countryName: 'Maroc', baseRating: 1435, difficulty: 'beginner' },
    { id: 'club_fr_camille', username: 'Camille_Bdx', countryFlag: '🇫🇷', countryName: 'France', baseRating: 1440, difficulty: 'beginner' },
    { id: 'club_de_lena', username: 'Lena_Koeln', countryFlag: '🇩🇪', countryName: 'Allemagne', baseRating: 1445, difficulty: 'beginner' },
    { id: 'club_gb_harry', username: 'Harry_Leeds', countryFlag: '🇬🇧', countryName: 'Royaume-Uni', baseRating: 1450, difficulty: 'beginner' },
    { id: 'club_es_lucia', username: 'Lucia_Sevilla', countryFlag: '🇪🇸', countryName: 'Espagne', baseRating: 1455, difficulty: 'beginner' },
    { id: 'club_it_marco', username: 'Marco_Torino', countryFlag: '🇮🇹', countryName: 'Italie', baseRating: 1460, difficulty: 'beginner' },
    { id: 'club_us_chloe', username: 'Chloe_Denver', countryFlag: '🇺🇸', countryName: 'États-Unis', baseRating: 1465, difficulty: 'beginner' },
    { id: 'club_au_liam', username: 'Liam_Sydney', countryFlag: '🇦🇺', countryName: 'Australie', baseRating: 1470, difficulty: 'beginner' },
    { id: 'club_ie_conor', username: 'Conor_Dublin', countryFlag: '🇮🇪', countryName: 'Irlande', baseRating: 1475, difficulty: 'beginner' },
    { id: 'club_cl_matias', username: 'Matias_Stgo', countryFlag: '🇨🇱', countryName: 'Chili', baseRating: 1480, difficulty: 'beginner' },
    { id: 'club_co_sofia', username: 'Sofia_Bogota', countryFlag: '🇨🇴', countryName: 'Colombie', baseRating: 1485, difficulty: 'beginner' },
    { id: 'club_tn_amine', username: 'Amine_Tunis', countryFlag: '🇹🇳', countryName: 'Tunisie', baseRating: 1490, difficulty: 'beginner' },
    { id: 'club_sn_moussa', username: 'Moussa_Dakar', countryFlag: '🇸🇳', countryName: 'Sénégal', baseRating: 1495, difficulty: 'beginner' },
    { id: 'club_ro_andrei', username: 'Andrei_Buc', countryFlag: '🇷🇴', countryName: 'Roumanie', baseRating: 1500, difficulty: 'beginner' },
    { id: 'club_cz_tomas', username: 'Tomas_Praha', countryFlag: '🇨🇿', countryName: 'Tchéquie', baseRating: 1505, difficulty: 'beginner' },
    { id: 'club_hu_bence', username: 'Bence_Pest', countryFlag: '🇭🇺', countryName: 'Hongrie', baseRating: 1510, difficulty: 'beginner' },
    { id: 'club_HR_luka', username: 'Luka_Split', countryFlag: '🇭🇷', countryName: 'Croatie', baseRating: 1515, difficulty: 'beginner' },
    { id: 'club_fi_aleksi', username: 'Aleksi_Hel', countryFlag: '🇫🇮', countryName: 'Finlande', baseRating: 1520, difficulty: 'beginner' },
    { id: 'club_no_ingrid', username: 'Ingrid_Oslo', countryFlag: '🇳🇴', countryName: 'Norvège', baseRating: 1525, difficulty: 'beginner' },
    { id: 'club_kr_minjun', username: 'MinJun_Seoul', countryFlag: '🇰🇷', countryName: 'Corée du Sud', baseRating: 1530, difficulty: 'beginner' },
    { id: 'club_sg_wei', username: 'Wei_Marina', countryFlag: '🇸🇬', countryName: 'Singapour', baseRating: 1540, difficulty: 'beginner' },
    { id: 'club_za_liam', username: 'Liam_Cape', countryFlag: '🇿🇦', countryName: 'Afrique du Sud', baseRating: 1545, difficulty: 'beginner' },
    { id: 'club_nz_finn', username: 'Finn_Auckland', countryFlag: '🇳🇿', countryName: 'Nouvelle-Zélande', baseRating: 1555, difficulty: 'beginner' },

    // --- Palier 2 : 34 Bots Intermédiaire / Club (1560 – 1785 Elo -> `intermediate`, PR ~7.5) ---
    { id: 'club_gr_nikos', username: 'Nikos_Tavli', countryFlag: '🇬🇷', countryName: 'Grèce', baseRating: 1565, difficulty: 'intermediate' },
    { id: 'club_tr_emre', username: 'Emre_Bosphorus', countryFlag: '🇹🇷', countryName: 'Turquie', baseRating: 1575, difficulty: 'intermediate' },
    { id: 'club_de_lukas', username: 'Lukas_Munich', countryFlag: '🇩🇪', countryName: 'Allemagne', baseRating: 1585, difficulty: 'intermediate' },
    { id: 'club_gb_oliver', username: 'Oliver_Mayfair', countryFlag: '🇬🇧', countryName: 'Royaume-Uni', baseRating: 1595, difficulty: 'intermediate' },
    { id: 'club_jp_kenji', username: 'Kenji_Shibuya', countryFlag: '🇯🇵', countryName: 'Japon', baseRating: 1605, difficulty: 'intermediate' },
    { id: 'club_se_erik', username: 'Erik_Stockholm', countryFlag: '🇸🇪', countryName: 'Suède', baseRating: 1610, difficulty: 'intermediate' },
    { id: 'club_ch_marc', username: 'Marc_Geneve', countryFlag: '🇨🇭', countryName: 'Suisse', baseRating: 1615, difficulty: 'intermediate' },
    { id: 'club_nl_daan', username: 'Daan_Amsterdam', countryFlag: '🇳🇱', countryName: 'Pays-Bas', baseRating: 1625, difficulty: 'intermediate' },
    { id: 'club_at_felix', username: 'Felix_Wien', countryFlag: '🇦🇹', countryName: 'Autriche', baseRating: 1630, difficulty: 'intermediate' },
    { id: 'club_dk_mikkel', username: 'Mikkel_Cph', countryFlag: '🇩🇰', countryName: 'Danemark', baseRating: 1640, difficulty: 'intermediate' },
    { id: 'club_il_noam', username: 'Noam_TelAviv', countryFlag: '🇮🇱', countryName: 'Israël', baseRating: 1645, difficulty: 'intermediate' },
    { id: 'club_lb_karim', username: 'Karim_Beirut', countryFlag: '🇱🇧', countryName: 'Liban', baseRating: 1655, difficulty: 'intermediate' },
    { id: 'club_fr_julien', username: 'Julien_Paris16', countryFlag: '🇫🇷', countryName: 'France', baseRating: 1660, difficulty: 'intermediate' },
    { id: 'club_it_alessio', username: 'Alessio_Firenze', countryFlag: '🇮🇹', countryName: 'Italie', baseRating: 1665, difficulty: 'intermediate' },
    { id: 'club_es_carlos', username: 'Carlos_BCN', countryFlag: '🇪🇸', countryName: 'Espagne', baseRating: 1675, difficulty: 'intermediate' },
    { id: 'club_us_logan', username: 'Logan_Chicago', countryFlag: '🇺🇸', countryName: 'États-Unis', baseRating: 1680, difficulty: 'intermediate' },
    { id: 'club_ca_felix', username: 'Felix_Quebec', countryFlag: '🇨🇦', countryName: 'Canada', baseRating: 1685, difficulty: 'intermediate' },
    { id: 'club_br_rafael', username: 'Rafael_SP', countryFlag: '🇧🇷', countryName: 'Brésil', baseRating: 1695, difficulty: 'intermediate' },
    { id: 'club_ar_nicolas', username: 'Nicolas_Rosario', countryFlag: '🇦🇷', countryName: 'Argentine', baseRating: 1700, difficulty: 'intermediate' },
    { id: 'club_pt_diogo', username: 'Diogo_Porto', countryFlag: '🇵🇹', countryName: 'Portugal', baseRating: 1705, difficulty: 'intermediate' },
    { id: 'club_be_arthur', username: 'Arthur_Anvers', countryFlag: '🇧🇪', countryName: 'Belgique', baseRating: 1715, difficulty: 'intermediate' },
    { id: 'club_cy_stavros', username: 'Stavros_Limassol', countryFlag: '🇨🇾', countryName: 'Chypre', baseRating: 1720, difficulty: 'intermediate' },
    { id: 'club_eg_omar', username: 'Omar_Alexandria', countryFlag: '🇪🇬', countryName: 'Égypte', baseRating: 1725, difficulty: 'intermediate' },
    { id: 'club_ae_tariq', username: 'Tariq_Dubai', countryFlag: '🇦🇪', countryName: 'Émirats Arabes Unis', baseRating: 1735, difficulty: 'intermediate' },
    { id: 'club_in_arjun', username: 'Arjun_Mumbai', countryFlag: '🇮🇳', countryName: 'Inde', baseRating: 1740, difficulty: 'intermediate' },
    { id: 'club_jp_yui', username: 'Yui_Osaka', countryFlag: '🇯🇵', countryName: 'Japon', baseRating: 1745, difficulty: 'intermediate' },
    { id: 'club_de_hanna', username: 'Hanna_Berlin', countryFlag: '🇩🇪', countryName: 'Allemagne', baseRating: 1750, difficulty: 'intermediate' },
    { id: 'club_gb_charlotte', username: 'Charlotte_Bath', countryFlag: '🇬🇧', countryName: 'Royaume-Uni', baseRating: 1755, difficulty: 'intermediate' },
    { id: 'club_se_oskar', username: 'Oskar_Uppsala', countryFlag: '🇸🇪', countryName: 'Suède', baseRating: 1760, difficulty: 'intermediate' },
    { id: 'club_no_henrik', username: 'Henrik_Bergen', countryFlag: '🇳🇴', countryName: 'Norvège', baseRating: 1765, difficulty: 'intermediate' },
    { id: 'club_dk_soren', username: 'Soren_Aarhus', countryFlag: '🇩🇰', countryName: 'Danemark', baseRating: 1770, difficulty: 'intermediate' },
    { id: 'club_pl_kamil', username: 'Kamil_Krakow', countryFlag: '🇵🇱', countryName: 'Pologne', baseRating: 1775, difficulty: 'intermediate' },
    { id: 'club_rs_nikola', username: 'Nikola_Belgrade', countryFlag: '🇷🇸', countryName: 'Serbie', baseRating: 1780, difficulty: 'intermediate' },
    { id: 'club_ge_giorgi', username: 'Giorgi_Tbilisi', countryFlag: '🇬🇪', countryName: 'Géorgie', baseRating: 1785, difficulty: 'intermediate' },

    // --- Palier 3 : 32 Bots Pro / Maître de Club (1790 – 1980 Elo -> `expert`, PR ~2.5, plafond strict) ---
    { id: 'club_jp_haruto', username: 'Haruto_Kyoto', countryFlag: '🇯🇵', countryName: 'Japon', baseRating: 1795, difficulty: 'expert' },
    { id: 'club_gr_dimitris', username: 'Dimitris_Ath', countryFlag: '🇬🇷', countryName: 'Grèce', baseRating: 1805, difficulty: 'expert' },
    { id: 'club_dk_freja', username: 'Freja_Odense', countryFlag: '🇩🇰', countryName: 'Danemark', baseRating: 1810, difficulty: 'expert' },
    { id: 'club_us_nathan', username: 'Nathan_NYC', countryFlag: '🇺🇸', countryName: 'États-Unis', baseRating: 1820, difficulty: 'expert' },
    { id: 'club_gb_arthur', username: 'Arthur_Chelsea', countryFlag: '🇬🇧', countryName: 'Royaume-Uni', baseRating: 1825, difficulty: 'expert' },
    { id: 'club_de_max', username: 'Maximilian_HH', countryFlag: '🇩🇪', countryName: 'Allemagne', baseRating: 1835, difficulty: 'expert' },
    { id: 'club_it_lorenzo', username: 'Lorenzo_Milano', countryFlag: '🇮🇹', countryName: 'Italie', baseRating: 1840, difficulty: 'expert' },
    { id: 'club_tr_kerem', username: 'Kerem_Ankara', countryFlag: '🇹🇷', countryName: 'Turquie', baseRating: 1845, difficulty: 'expert' },
    { id: 'club_mc_antoine', username: 'Antoine_MC', countryFlag: '🇲🇨', countryName: 'Monaco', baseRating: 1855, difficulty: 'expert' },
    { id: 'club_se_astrid', username: 'Astrid_Malmo', countryFlag: '🇸🇪', countryName: 'Suède', baseRating: 1860, difficulty: 'expert' },
    { id: 'club_ch_elena', username: 'Elena_Zurich', countryFlag: '🇨🇭', countryName: 'Suisse', baseRating: 1865, difficulty: 'expert' },
    { id: 'club_am_armen', username: 'Armen_Yerevan', countryFlag: '🇦🇲', countryName: 'Arménie', baseRating: 1875, difficulty: 'expert' },
    { id: 'club_fr_edouard', username: 'Edouard_Cannes', countryFlag: '🇫🇷', countryName: 'France', baseRating: 1880, difficulty: 'expert' },
    { id: 'club_jp_takumi', username: 'Takumi_Ginza', countryFlag: '🇯🇵', countryName: 'Japon', baseRating: 1885, difficulty: 'expert' },
    { id: 'club_dk_kasper', username: 'Kasper_Roskilde', countryFlag: '🇩🇰', countryName: 'Danemark', baseRating: 1890, difficulty: 'expert' },
    { id: 'club_us_victoria', username: 'Victoria_Boston', countryFlag: '🇺🇸', countryName: 'États-Unis', baseRating: 1895, difficulty: 'expert' },
    { id: 'club_il_yonatan', username: 'Yonatan_Haifa', countryFlag: '🇮🇱', countryName: 'Israël', baseRating: 1900, difficulty: 'expert' },
    { id: 'club_de_florian', username: 'Florian_Frankfurt', countryFlag: '🇩🇪', countryName: 'Allemagne', baseRating: 1905, difficulty: 'expert' },
    { id: 'club_gb_sebastian', username: 'Sebastian_Ox', countryFlag: '🇬🇧', countryName: 'Royaume-Uni', baseRating: 1915, difficulty: 'expert' },
    { id: 'club_nl_bram', username: 'Bram_Rotterdam', countryFlag: '🇳🇱', countryName: 'Pays-Bas', baseRating: 1920, difficulty: 'expert' },
    { id: 'club_no_magnus', username: 'Magnus_Trondheim', countryFlag: '🇳🇴', countryName: 'Norvège', baseRating: 1925, difficulty: 'expert' },
    { id: 'club_tr_selim', username: 'Selim_Izmir', countryFlag: '🇹🇷', countryName: 'Turquie', baseRating: 1930, difficulty: 'expert' },
    { id: 'club_gr_kostas', username: 'Kostas_Thess', countryFlag: '🇬🇷', countryName: 'Grèce', baseRating: 1935, difficulty: 'expert' },
    { id: 'club_it_edoardo', username: 'Edoardo_Venezia', countryFlag: '🇮🇹', countryName: 'Italie', baseRating: 1940, difficulty: 'expert' },
    { id: 'club_es_alvaro', username: 'Alvaro_Bilbao', countryFlag: '🇪🇸', countryName: 'Espagne', baseRating: 1945, difficulty: 'expert' },
    { id: 'club_at_moritz', username: 'Moritz_Salzburg', countryFlag: '🇦🇹', countryName: 'Autriche', baseRating: 1950, difficulty: 'expert' },
    { id: 'club_ca_laurent', username: 'Laurent_Westmount', countryFlag: '🇨🇦', countryName: 'Canada', baseRating: 1955, difficulty: 'expert' },
    { id: 'club_au_oliver', username: 'Oliver_Melbourne', countryFlag: '🇦🇺', countryName: 'Australie', baseRating: 1960, difficulty: 'expert' },
    { id: 'club_ar_santiago', username: 'Santiago_Palermo', countryFlag: '🇦🇷', countryName: 'Argentine', baseRating: 1965, difficulty: 'expert' },
    { id: 'club_lb_ziad', username: 'Ziad_Achrafieh', countryFlag: '🇱🇧', countryName: 'Liban', baseRating: 1970, difficulty: 'expert' },
    { id: 'club_mc_charlotte', username: 'Charlotte_Larvotto', countryFlag: '🇲🇨', countryName: 'Monaco', baseRating: 1975, difficulty: 'expert' },
    { id: 'club_jp_ren', username: 'Ren_Yokohama', countryFlag: '🇯🇵', countryName: 'Japon', baseRating: 1980, difficulty: 'expert' },
] as const;

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
    if (safeRating < 1560) return 'beginner';
    if (safeRating < 1790) return 'intermediate';
    return 'expert';
}

export interface SelectClubChallengerOptions {
    readonly isRematch?: boolean;
    readonly previousChallenger?: PlayerEloProfile | null;
    readonly nowMs?: number;
}

/**
 * Sélectionne un adversaire parmi les 100 bots actifs :
 * - Si `isRematch: true` avec `previousChallenger`, autorise la revanche immédiate contre ce même bot.
 * - Sinon, exclut tout bot déjà affronté au cours des 7 derniers jours (`BOT_WEEKLY_COOLDOWN_MS`).
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
    const topPool = sorted.slice(0, Math.min(6, sorted.length));
    const chosen = topPool[cryptoRandomInt(topPool.length)] ?? CLUB_CHALLENGER_SEEDS[0];

    recordClubChallengerEncounter(chosen.id, nowMs);
    recordClubChallengerEncounter(chosen.username, nowMs);

    const jitter = cryptoRandomInt(29) - 14;
    const finalRating = Math.max(1350, Math.min(1985, chosen.baseRating + jitter));
    const basePr = chosen.difficulty === 'beginner' ? 12.5 : chosen.difficulty === 'intermediate' ? 7.5 : 2.5;
    const prJitter = (cryptoRandomInt(7) - 3) * 0.1;
    const averagePr = Number(Math.max(1.8, basePr + prJitter).toFixed(2));
    const seedIndex = Math.max(0, CLUB_CHALLENGER_SEEDS.findIndex((s) => s.id === chosen.id));
    const standardAvatarUrl = `/avatars/user-avatar-${(seedIndex % 5) + 1}.jpg`;

    return {
        id: `${chosen.id}_${nowMs}`,
        username: chosen.username,
        displayName: `${chosen.countryFlag} ${chosen.username}`,
        rating: finalRating,
        averagePr,
        avatarUrl: standardAvatarUrl,
        countryFlag: chosen.countryFlag,
        countryName: chosen.countryName,
        clubBotDifficulty: chosen.difficulty,
        isGuest: false,
    };
}

export function computeRealisticMatchmakingDelayMs(): number {
    return 2600 + cryptoRandomInt(1801);
}
