/**
 * @file src/features/multiplayer/userCodeSessionService.ts
 * @description Service de connexion par Code Utilisateur & Sessions Profils (300 profils actifs).
 * Permet l'identification instantanée sans mot de passe, la persistance par session/localStorage,
 * et l'isolation stricte entre contextes (<= 350 lignes, 0 any).
 */

import {
  HUMAN_PERSONA_POOL,
  resolveNaturalChallengerAvatarUrl,
  type HumanPersonaSeed,
} from '../personas/humanPersonaSeeds';
import type { ClubChallengerDifficulty, PlayerEloProfile } from './types';

export type PlayerStyle = 'PRUDENT' | 'AGGRESSIVE' | 'BALANCED';

export interface UserCodeProfile extends PlayerEloProfile {
  readonly userCode: string;
  readonly style: PlayerStyle;
  readonly difficulty: ClubChallengerDifficulty;
  readonly baseRating: number;
}

export const USER_CODE_STORAGE_KEY = 'bgt_user_code';
export const USER_PASSPORT_STORAGE_KEY = 'bg_player_passport_v1';
export const USER_ELO_STORAGE_KEY = 'bg_player_elo_v1';

function mapTemperamentToStyle(temperament: string): PlayerStyle {
  if (temperament === 'cautious') return 'PRUDENT';
  if (temperament === 'aggressive') return 'AGGRESSIVE';
  return 'BALANCED';
}

function normalizeKey(str: string): string {
  return str.trim().toLowerCase().replace(/[\s_.-]+/g, '');
}

/**
 * Résout un profil parmi les 300 codes utilisateurs actifs de HUMAN_PERSONA_POOL.
 * Accepte : identifiant (ex: 'user_1', 'user_42'), pseudo (ex: 'thomas_69', 'Kosta_Ath', 'Thomas R.'),
 * ou numéro d'index (ex: '1'..'300').
 */
export function resolveUserCodeProfile(userCodeOrQuery: string): UserCodeProfile | null {
  if (!userCodeOrQuery || typeof userCodeOrQuery !== 'string') return null;
  const raw = userCodeOrQuery.trim();
  if (!raw) return null;

  const norm = normalizeKey(raw);

  // 1. Recherche par identifiant direct (exact ou préfixe user_/hum_)
  let seed = HUMAN_PERSONA_POOL.find((s) => s.id === raw || normalizeKey(s.id) === norm);

  // 2. Recherche par numéro d'index (ex: '1'..'300', 'user_1'..'user_300', 'hum_001'..'hum_300')
  const numMatch = raw.match(/^(?:user_|hum_)?0*(\d+)$/i);
  if (!seed && numMatch) {
    const idx = parseInt(numMatch[1], 10) - 1;
    if (idx >= 0 && idx < HUMAN_PERSONA_POOL.length) {
      seed = HUMAN_PERSONA_POOL[idx];
    }
  }

  // 3. Recherche par nom d'utilisateur (normalisé)
  if (!seed) {
    seed = HUMAN_PERSONA_POOL.find((s) => normalizeKey(s.username) === norm);
  }

  // 4. Recherche tolérante (alias sans séparateurs, ex: thomas69 -> thomas_69 ou thomas r.)
  if (!seed) {
    seed = HUMAN_PERSONA_POOL.find((s) => {
      const sNorm = normalizeKey(s.username);
      return sNorm.startsWith(norm) || norm.startsWith(sNorm);
    });
  }

  if (!seed) return null;

  const seedIndex = HUMAN_PERSONA_POOL.findIndex((s) => s.id === seed!.id);
  const avatarUrl = resolveNaturalChallengerAvatarUrl(seed.username, Math.max(0, seedIndex));

  // Rating réel non-rond (pas un multiple de 10)
  let finalRating = seed.baseRating;
  if (finalRating % 10 === 0) finalRating += 3;

  return {
    id: seed.id,
    userCode: seed.id,
    username: seed.username,
    displayName: seed.username,
    rating: finalRating,
    baseRating: seed.baseRating,
    averagePr: seed.targetErPr,
    avatarUrl,
    countryFlag: seed.countryFlag,
    countryName: seed.countryName,
    clubBotDifficulty: seed.difficulty,
    difficulty: seed.difficulty,
    style: mapTemperamentToStyle(seed.cubeTemperament),
    isGuest: false,
  };
}

/**
 * Connecte instantanément un utilisateur via son code parmi les 300 actifs.
 * Enregistre la session dans le stockage fourni (par défaut window.localStorage).
 */
export function loginWithUserCode(
  userCode: string,
  storageOverride?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
): UserCodeProfile {
  const profile = resolveUserCodeProfile(userCode);
  if (!profile) {
    throw new Error(`Code utilisateur inconnu : "${userCode}". Doit correspondre à l'un des 300 profils actifs.`);
  }

  const storage = storageOverride ?? (typeof window !== 'undefined' ? window.localStorage : null);
  if (storage) {
    try {
      storage.setItem(USER_CODE_STORAGE_KEY, profile.id);
      storage.setItem(
        USER_PASSPORT_STORAGE_KEY,
        JSON.stringify({
          pseudo: profile.username,
          email: `${profile.id}@backgammontour.com`,
          experienceLevel: profile.difficulty,
          avatarUrl: profile.avatarUrl,
          countryName: profile.countryName,
          countryCode: profile.countryFlag,
          registeredAt: new Date().toISOString(),
          supabaseSynced: true,
        })
      );
      storage.setItem(USER_ELO_STORAGE_KEY, String(profile.rating));
    } catch {
      // Storage unavailable or disabled
    }
  }

  return profile;
}

/**
 * Récupère le profil actuellement connecté en session, ou génère un profil Invité instantané.
 */
export function getActiveUserProfile(
  storageOverride?: Pick<Storage, 'getItem' | 'setItem'>
): UserCodeProfile {
  const storage = storageOverride ?? (typeof window !== 'undefined' ? window.localStorage : null);
  let savedCode: string | null = null;

  if (storage) {
    try {
      savedCode = storage.getItem(USER_CODE_STORAGE_KEY);
    } catch {
      savedCode = null;
    }
  }

  if (savedCode) {
    const prof = resolveUserCodeProfile(savedCode);
    if (prof) return prof;
  }

  // Profil Invité instantané par défaut (Rating 1500)
  return {
    id: 'guest_instant',
    userCode: 'guest_instant',
    username: 'Joueur Invité',
    displayName: 'Joueur Invité',
    rating: 1500,
    baseRating: 1500,
    averagePr: 6.3,
    avatarUrl: '/avatars/user-avatar-1.jpg',
    countryFlag: '🇫🇷',
    countryName: 'France',
    clubBotDifficulty: 'intermediate',
    difficulty: 'intermediate',
    style: 'BALANCED',
    isGuest: true,
  };
}
