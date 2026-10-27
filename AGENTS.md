# AGENTS.md — Instructions pour agents IA

> **Rôle** : ce fichier est lu en premier par tout agent IA (Claude Code, Cline, Roo Code,
> Copilot, etc.) avant de toucher au code. Il contient **uniquement** des faits vérifiés
> et actionnables. Dernière vérification : 2026-10-27.

---

## 1. Ordre de lecture obligatoire

1. **AGENTS.md** (ce fichier)
2. [`PROJECT_MAP.md`](PROJECT_MAP.md) — arborescence et rôle de chaque dossier
3. [`GOVERNANCE.md`](GOVERNANCE.md) — 4 règles d'or non négociables
4. [`SCALABILITY.md`](SCALABILITY.md) — budgets de lignes et conventions

Ne pas lire `README.md` en premier : il contient des chiffres marketing non vérifiés.

---

## 2. Règles absolues (issues de GOVERNANCE.md)

- **Règle 2 — Zéro donnée factice** : INTERDIT de retourner des valeurs codées en dur
  en repli. Si une dépendance échoue → `throw new Error(...)` ou `Result<T, Error>`.
  Jamais de mock silencieux, jamais d'équité inventée.
- **Règle 3 — Typage strict** : ZÉRO `any` en production (les fichiers `*.test.ts`
  sont tolérés). `strict: true` est actif dans [`tsconfig.json`](tsconfig.json).
- **Règle 4 — Atomicité** : UNE tâche à la fois, max 3 fichiers modifiés. Après chaque
  modification : `npm run typecheck && npm test` doit être vert.

---

## 3. Zones interdites

| Chemin | Raison |
|---|---|
| `archive/` | Code mort (GNUBG legacy, WildBG abandonné). Ne jamais s'en inspirer. |
| `xg-web-trainer/` | Projet séparé, hors périmètre. |
| `*.png` à la racine | Captures de debug (déjà ignorées par Git). |
| `supabase/.temp/` | Généré, ne pas modifier. |

---

## 4. Anciens pièges connus — Tous résolus et vérifiés (2026-10-27)

Ces 5 pièges historiques ont été **corrigés et verrouillés par tests unitaires**.
Ne jamais réintroduire ces anti-patterns :

### 4.1 Rollouts (`src/lib/engine/rolloutSimulation.ts`) — ✅ Résolu

- Si Open Sage (`bgsage-service`) ne répond pas ou ne fournit aucun coup, `finishJob()` marque le job en `status: 'failed'` sans jamais inventer d'équités ni de notations de coups codées en dur.
- L'identifiant de job utilise `crypto.randomUUID()` (et `subscribe()` est strictement typé via `RolloutListener`, zéro `any`).

### 4.2 Cache LRU Open Sage (`src/lib/engine/bgsageCache.ts`) — ✅ Résolu

- `canonicalizeXgidForCache()` ne normalise **jamais** la valeur du cube (`cube >= 2` reste distinct) : l'équité cubeful (`cubeDecision`), le take point et le risque de gammon dépendent de la valeur du cube.
- Vérifié par `src/lib/engine/bgsageCache.test.ts:109` (`cube 2` et `cube 4` produisent deux clés distinctes).

### 4.3 Multijoueur (`src/features/multiplayer/roomService.ts`) — ✅ Résolu

- Lorsque Supabase est configuré (`isSupabaseConfigured() === true`), tout échec réseau ou base de données lève une erreur explicite (`throw new Error(...)`) sans jamais basculer silencieusement sur `mockRoomsRegistry`.
- L'identifiant local de salle utilise `crypto.randomUUID()` (zéro `Math.random()`).

### 4.4 RNG cryptographique (`realtimeSchema.ts` & `MatchHeader.tsx`) — ✅ Résolu

- `src/features/multiplayer/realtimeSchema.ts` — `generateRoomCode()` utilise `crypto.getRandomValues` avec rejet du biais de modulo (`value >= limit`).
- `src/components/hud/MatchHeader.tsx` — en multijoueur, l'absence de `provablyFair` bloque le lancer avec une erreur explicite sans repli `Math.random()`.

### 4.5 Stockage d'analyses (`src/features/rating/gameAnalysisStorage.ts`) — ✅ Résolu

- `getAllGameAnalyses()` retourne `[]` lorsque `localStorage` est vide et n'injecte plus les 3 parties fictives de démonstration dans le profil du joueur.
- `src/features/drills/blunderBank.ts` conserve ses 5 blunders de référence pour l'entraînement pédagogique.

---

## 5. Commandes de vérification

```bash
npm run typecheck   # doit retourner 0 erreur
npm test            # 224 fichiers Vitest, doit être 100 % vert
npm run lint        # ESLint
npm run test:e2e    # Playwright (27 scénarios)
```

---

## 6. Conventions de code (résumé)

- **Un fichier = une responsabilité.** Composant ≤ 300 lignes, hook ≤ 200, logique ≤ 400.
- **Un composant = un fichier**, auto-documenté (JSDoc : rôle, dépendances, comment retirer).
- **Mémoïsation** : `React.memo` sur les composants rendus plusieurs fois,
  `useCallback`/`useMemo` sur les handlers/valeurs dérivées.
- **Tests obligatoires** : toute logique métier a un test Vitest.
- **Types centralisés** : pas de type dupliqué.

---

## 7. Structure des couches (GOVERNANCE.md Règle 1)

| Couche | Dossier | Interdits |
|---|---|---|
| Règles (pur, déterministe) | `src/engine/` | React, JSX, `localStorage`, `fetch`, `console.log` |
| Évaluation & Coach | `src/lib/engine/`, `src/features/coach/` | DOM, modification d'affichage |
| UI / Présentation | `src/components/`, `src/app/` | Calcul lourd, logique de règles |

> ⚠️ **Ambiguïté de nommage** : `src/engine/` (règles du jeu) et `src/lib/engine/`
> (évaluateur + client bgsage) sont deux choses différentes. Ne pas confondre.
