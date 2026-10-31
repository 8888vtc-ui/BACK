/**
 * @file src/features/multiplayer/clubChallengerPool.ts
 * @description Vivier d'Adversaires Internationaux de Club pour le Matchmaking Rapide (« Trouver un adversaire »).
 *
 * Invariants :
 * - Adapte le niveau de l'adversaire à l'Elo du joueur : du Débutant (`beginner`, ~1420 Elo)
 *   au Club (`intermediate`, ~1680 Elo) et au Pro/Maître (`expert`, ~1950 Elo).
 * - AUCUN champion imbattable (`grandmaster` est strictement exclu du matchmaking automatique).
 * - Utilise exclusivement `crypto.getRandomValues` (zéro `Math.random()`).
 * - Strictement 0 `any`, < 200 lignes.
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

/**
 * 36 profils internationaux répartis en 3 paliers accessibles (Débutant, Club, Pro).
 * Zéro niveau `grandmaster` afin que chaque adversaire reste humainement battable.
 */
export const CLUB_CHALLENGER_SEEDS: ReadonlyArray<ClubChallengerSeed> = [
    // --- Palier 1 : Débutant / Loisir (1360 – 1545 Elo -> `beginner`, PR ~12.5) ---
    { id: 'club_fr_lucas', username: 'Lucas_Lyon69', countryFlag: '🇫🇷', countryName: 'France', baseRating: 1410, difficulty: 'beginner' },
    { id: 'club_es_mateo', username: 'Mateo_Madrid', countryFlag: '🇪🇸', countryName: 'Espagne', baseRating: 1435, difficulty: 'beginner' },
    { id: 'club_it_giulia', username: 'Giulia_Roma', countryFlag: '🇮🇹', countryName: 'Italie', baseRating: 1460, difficulty: 'beginner' },
    { id: 'club_br_thiago', username: 'Thiago_Rio', countryFlag: '🇧🇷', countryName: 'Brésil', baseRating: 1480, difficulty: 'beginner' },
    { id: 'club_ca_chloe', username: 'Chloe_Mtl', countryFlag: '🇨🇦', countryName: 'Canada', baseRating: 1495, difficulty: 'beginner' },
    { id: 'club_us_mason', username: 'Mason_Austin', countryFlag: '🇺🇸', countryName: 'États-Unis', baseRating: 1515, difficulty: 'beginner' },
    { id: 'club_be_thomas', username: 'Thomas_Bxl', countryFlag: '🇧🇪', countryName: 'Belgique', baseRating: 1530, difficulty: 'beginner' },
    { id: 'club_pt_tiago', username: 'Tiago_Lisboa', countryFlag: '🇵🇹', countryName: 'Portugal', baseRating: 1445, difficulty: 'beginner' },
    { id: 'club_mx_diego', username: 'Diego_CDMX', countryFlag: '🇲🇽', countryName: 'Mexique', baseRating: 1470, difficulty: 'beginner' },
    { id: 'club_ar_valen', username: 'Valentina_BA', countryFlag: '🇦🇷', countryName: 'Argentine', baseRating: 1505, difficulty: 'beginner' },
    { id: 'club_pl_jakub', username: 'Jakub_Waw', countryFlag: '🇵🇱', countryName: 'Pologne', baseRating: 1425, difficulty: 'beginner' },
    { id: 'club_ma_yassine', username: 'Yassine_Casa', countryFlag: '🇲🇦', countryName: 'Maroc', baseRating: 1525, difficulty: 'beginner' },

    // --- Palier 2 : Intermédiaire / Joueur de Club (1550 – 1785 Elo -> `intermediate`, PR ~7.5) ---
    { id: 'club_gr_nikos', username: 'Nikos_Tavli', countryFlag: '🇬🇷', countryName: 'Grèce', baseRating: 1590, difficulty: 'intermediate' },
    { id: 'club_tr_emre', username: 'Emre_Bosphorus', countryFlag: '🇹🇷', countryName: 'Turquie', baseRating: 1630, difficulty: 'intermediate' },
    { id: 'club_de_lukas', username: 'Lukas_Munich', countryFlag: '🇩🇪', countryName: 'Allemagne', baseRating: 1665, difficulty: 'intermediate' },
    { id: 'club_gb_oliver', username: 'Oliver_Mayfair', countryFlag: '🇬🇧', countryName: 'Royaume-Uni', baseRating: 1695, difficulty: 'intermediate' },
    { id: 'club_jp_kenji', username: 'Kenji_Shibuya', countryFlag: '🇯🇵', countryName: 'Japon', baseRating: 1720, difficulty: 'intermediate' },
    { id: 'club_se_erik', username: 'Erik_Stockholm', countryFlag: '🇸🇪', countryName: 'Suède', baseRating: 1745, difficulty: 'intermediate' },
    { id: 'club_ch_marc', username: 'Marc_Geneve', countryFlag: '🇨🇭', countryName: 'Suisse', baseRating: 1615, difficulty: 'intermediate' },
    { id: 'club_nl_daan', username: 'Daan_Amsterdam', countryFlag: '🇳🇱', countryName: 'Pays-Bas', baseRating: 1680, difficulty: 'intermediate' },
    { id: 'club_at_felix', username: 'Felix_Wien', countryFlag: '🇦🇹', countryName: 'Autriche', baseRating: 1645, difficulty: 'intermediate' },
    { id: 'club_dk_mikkel', username: 'Mikkel_Cph', countryFlag: '🇩🇰', countryName: 'Danemark', baseRating: 1710, difficulty: 'intermediate' },
    { id: 'club_il_noam', username: 'Noam_TelAviv', countryFlag: '🇮🇱', countryName: 'Israël', baseRating: 1760, difficulty: 'intermediate' },
    { id: 'club_lb_karim', username: 'Karim_Beirut', countryFlag: '🇱🇧', countryName: 'Liban', baseRating: 1775, difficulty: 'intermediate' },

    // --- Palier 3 : Pro / Maître de Club (1790 – 1975 Elo -> `expert`, PR ~2.5, plafond strict) ---
    { id: 'club_jp_haruto', username: 'Haruto_Kyoto', countryFlag: '🇯🇵', countryName: 'Japon', baseRating: 1820, difficulty: 'expert' },
    { id: 'club_gr_dimitris', username: 'Dimitris_Ath', countryFlag: '🇬🇷', countryName: 'Grèce', baseRating: 1855, difficulty: 'expert' },
    { id: 'club_dk_freja', username: 'Freja_Odense', countryFlag: '🇩🇰', countryName: 'Danemark', baseRating: 1885, difficulty: 'expert' },
    { id: 'club_us_nathan', username: 'Nathan_NYC', countryFlag: '🇺🇸', countryName: 'États-Unis', baseRating: 1910, difficulty: 'expert' },
    { id: 'club_gb_arthur', username: 'Arthur_Chelsea', countryFlag: '🇬🇧', countryName: 'Royaume-Uni', baseRating: 1935, difficulty: 'expert' },
    { id: 'club_de_max', username: 'Maximilian_HH', countryFlag: '🇩🇪', countryName: 'Allemagne', baseRating: 1955, difficulty: 'expert' },
    { id: 'club_it_lorenzo', username: 'Lorenzo_Milano', countryFlag: '🇮🇹', countryName: 'Italie', baseRating: 1840, difficulty: 'expert' },
    { id: 'club_tr_kerem', username: 'Kerem_Ankara', countryFlag: '🇹🇷', countryName: 'Turquie', baseRating: 1895, difficulty: 'expert' },
    { id: 'club_mc_antoine', username: 'Antoine_MC', countryFlag: '🇲🇨', countryName: 'Monaco', baseRating: 1925, difficulty: 'expert' },
    { id: 'club_se_astrid', username: 'Astrid_Malmo', countryFlag: '🇸🇪', countryName: 'Suède', baseRating: 1870, difficulty: 'expert' },
    { id: 'club_ch_elena', username: 'Elena_Zurich', countryFlag: '🇨🇭', countryName: 'Suisse', baseRating: 1945, difficulty: 'expert' },
    { id: 'club_am_armen', username: 'Armen_Yerevan', countryFlag: '🇦🇲', countryName: 'Arménie', baseRating: 1970, difficulty: 'expert' },
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

/**
 * Détermine le palier de difficulté (`beginner`, `intermediate`, `expert`) correspondant à l'Elo du joueur.
 * Ne retourne JAMAIS `grandmaster` (aucun champion imbattable en matchmaking).
 */
export function resolveChallengerDifficultyForElo(playerRating: number): ClubChallengerDifficulty {
    const safeRating = Number.isFinite(playerRating) ? playerRating : 1500;
    if (safeRating < 1560) return 'beginner';
    if (safeRating < 1790) return 'intermediate';
    return 'expert';
}

/**
 * Sélectionne un adversaire international crédible dont l'Elo et le niveau de jeu correspondent
 * au joueur local (du Débutant au Pro, sans champion imbattable).
 */
export function selectClubChallengerForRating(playerRating: number): PlayerEloProfile {
    const targetDifficulty = resolveChallengerDifficultyForElo(playerRating);
    const candidates = CLUB_CHALLENGER_SEEDS.filter((c) => c.difficulty === targetDifficulty);

    // Trie par proximité d'Elo et tire au sort parmi les 5 profils les plus proches
    const safeRating = Number.isFinite(playerRating) ? playerRating : 1500;
    const sorted = [...candidates].sort(
        (a, b) => Math.abs(a.baseRating - safeRating) - Math.abs(b.baseRating - safeRating),
    );
    const topPool = sorted.slice(0, Math.min(5, sorted.length));
    const chosen = topPool[cryptoRandomInt(topPool.length)] ?? CLUB_CHALLENGER_SEEDS[0];

    // Légère oscillation naturelle d'Elo (-14 à +14 pts) et de PR Moyen Public
    const jitter = cryptoRandomInt(29) - 14;
    const finalRating = Math.max(1350, Math.min(1985, chosen.baseRating + jitter));
    const basePr = chosen.difficulty === 'beginner' ? 12.5 : chosen.difficulty === 'intermediate' ? 7.5 : 2.5;
    const prJitter = (cryptoRandomInt(7) - 3) * 0.1;
    const averagePr = Number(Math.max(1.8, basePr + prJitter).toFixed(2));

    return {
        id: `${chosen.id}_${Date.now()}`,
        username: chosen.username,
        displayName: `${chosen.countryFlag} ${chosen.username}`,
        rating: finalRating,
        averagePr,
        countryFlag: chosen.countryFlag,
        countryName: chosen.countryName,
        clubBotDifficulty: chosen.difficulty,
        isGuest: false,
    };
}

/**
 * Calcule un délai de recherche réaliste (en ms) entre 2 600 ms et 4 400 ms.
 */
export function computeRealisticMatchmakingDelayMs(): number {
    return 2600 + cryptoRandomInt(1801);
}

