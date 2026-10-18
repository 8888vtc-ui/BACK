# PROJECT MAP — Carte d'orientation du projet

> **Objectif** : permettre à un LLM (ou un développeur) de comprendre le projet en
> **1 minute** et d'ajouter une fonction en **2 minutes**.
>
> Ce fichier est la **porte d'entrée unique**. Lire ce fichier d'abord, puis le
> dossier concerné. Chaque entrée décrit le rôle en une phrase.

---

## 1. Vue d'ensemble (30 secondes)

**Backgammon Coach IA** — application web Next.js 15 (React 19, Tailwind 3) de
backgammon avec coach IA temps réel, portée sur mobile via Capacitor.

- **Moteur de règles** : `src/engine/` (TypeScript pur, déterministe).
- **Moteur IA** : GNU Backgammon en WebAssembly (`src/workers/`) + backend Python (`backend-engine/`).
- **Coach** : LLM pluggable via Route Handlers (`src/app/api/`).
- **Persistance** : Supabase (Postgres + Auth + RLS).
- **Tests** : Vitest (unitaire) + Playwright (e2e).

---

## 2. Arborescence `src/` (1 minute)

### `src/engine/` — Moteur de règles + IA (pur, sans I/O)
| Fichier | Rôle |
|---|---|
| `backgammonEngine.ts` | Règles du jeu : plateau (26 entiers), coups légaux, bear-off, videau, XGID, pip count. **Source de vérité.** |
| `aiHeuristics.ts` | Évaluation de position IA : `evaluateWin`, `scoreBoardForOpponent`, `scoreBoard0PlyNoisy`, `scoreBoard1Ply`, `scoreBoard2PlyForOpponent`, `selectBestOpponentSequence`. |

### `src/features/` — Logique métier par domaine (pur, testable)
| Dossier | Rôle |
|---|---|
| `coach/` | Extracteur de concepts, classificateur de blunders, prompts LLM |
| `drills/` | Moteur d'exercices (blunders) |
| `multiplayer/` | Validation d'actions, Elo, matchmaking, rooms temps réel |
| `puzzles/` | Puzzles quotidiens |
| `rating/` | Analyse de partie, calcul de PR |
| `openings/` | Base d'ouvertures |
| `export/` | Sérialisation XGID/SGF, partage |
| `knowledge/` | Base de connaissances pédagogiques |

### `src/components/` — Composants React (présentation)
| Dossier | Rôle |
|---|---|
| `board/` | Plateau (Board.tsx actif, BackgammonBoard.tsx legacy, géométrie, thèmes) |
| `coach/` | Panneau coach |
| `hud/` | HUD de match, sélecteur de difficulté |
| `multiplayer/` | Modales multijoueur |
| `rating/` | Review de partie, courbes |
| `stats/` | Dashboard progression |
| `auth/`, `common/`, `toast/`, `providers/`, `pwa/` | Infra UI |

### `src/hooks/` — Hooks React (état + effets)
| Fichier | Rôle |
|---|---|
| `useBackgammonGame.ts` | Machine à états de partie (lancer, déplacer, videau, IA) |
| `useMultiplayerGame.ts` | Partie multijoueur temps réel |
| `useBoardTheme.tsx` | Thème du plateau (contexte) |
| `usePWA.ts`, `useSyncQueue.ts` | PWA, file de sync offline |

### `src/lib/` — Services (I/O, intégrations)
| Dossier | Rôle |
|---|---|
| `supabase/` | Client Supabase, auth, types |
| `i18n/` | Internationalisation (fr/en) |
| `offline/` | Persistance locale (IndexedDB), sync |
| `engine/` | Client moteur (worker), évaluateur, rollouts |
| `monitoring/` | Sentry, logs, alertes |
| `security/` | Rate limiting, schémas Zod |
| `capacitor/` | Haptique, partage, SQLite natif |
| `sound/`, `stats/`, `analytics/`, `pwa/` | Sons, agrégats, analytics, PWA |

### `src/app/` — App Router (pages + API)
| Chemin | Rôle |
|---|---|
| `page.tsx` | Écran principal de jeu |
| `drills/`, `puzzles/`, `progression/` | Pages secondaires |
| `api/coach/`, `api/evaluate/`, `api/rollout/`, `api/health/` | Route Handlers serveur |

### `src/workers/` — Web Workers
| Fichier | Rôle |
|---|---|
| `xgEngine.worker.ts` | Exécute le moteur Grand-Maître XG-Web 2-Ply WASM SIMD |
| `gnubg.worker.ts` | Exécute l'évaluateur tri-phase fallback hors thread principal |

---

## 2bis. Anatomie de `page.tsx` (le composant principal, ~1738 lignes)

> ⚠️ **Fichier monolithique en cours de découpage.** Voici sa structure interne pour
> savoir exactement ce qui s'y passe en un clic.

### États (`useState`)
| État | Rôle |
|---|---|
| `coach`, `coachHighlight` | Analyse du coach (verdict, explication, surbrillance) |
| `matchStats`, `optimalStreak`, `brilliantMove` | Statistiques de session (PR, streak, coup de maître) |
| `isBoardLoading`, `isAnalyzing` | États de chargement |
| `isMatchmakingModalOpen`, `isGameReviewModalOpen`, `isOpeningBookModalOpen`, `isExportImportModalOpen`, `isKnowledgeModalOpen`, `isMobileDrawerOpen` | Ouverture des modales |
| `latestGameAnalysis` | Analyse complète post-partie |
| `preferredDie` | Dé préféré (0 ou 1) |

### Handlers de jeu (délégation au hook `useBackgammonGame`)
| Handler | Rôle |
|---|---|
| `handlePlayMove(from, to, die)` | Joue un coup (drag-and-drop) |
| `handleSelectDie(die)` | Sélectionne un dé (auto-move intelligent) |
| `handleDieDoubleClick(die)` | Double-clic dé (auto-move le plus sûr) |
| `handleCheckerClick(point)` | Clic pion (auto-move Snowie/TMG) |
| `handleCheckerDoubleClick(point)` | Double-clic pion (somme des dés) |
| `handleCheckerRightClick(point)` | Clic droit (second dé) |
| `handleDestinationClick(dest)` | Clic destination légale |
| `handleDeselect()` | Désélection |

### Effets (`useEffect`)
| Effet | Rôle |
|---|---|
| Multijoueur | Écoute les actions distantes, synchronise le match |
| Offline | Enregistre la partie (persistance offline-first) |
| Raccourcis clavier | Espace (lancer), Tab (inverser dés), D (doubler) |
| Auto-play | Joue le coup forcé unique après 600ms |
| Coach | Détecte les blunders et déclenche l'analyse |

### Logique coach
| Bloc | Rôle |
|---|---|
| `handleTriggerCoach()` | Analyse le coup joué (moteur + LLM) |
| `dismissCoach()` | Ferme l'analyse |
| `handleReplayMove()` | Rejoue le coup erroné |

### Logique opening book
| Bloc | Rôle |
|---|---|
| `openingEntry` | Détecte le coup d'ouverture certifié |
| `handleApplyOpeningMove(moves)` | Applique le coup book en un clic |

### Rendu JSX
1. **HUD fixe** (MatchHud, bandeau streak, sélecteur difficulté)
2. **Plateau** (`Board`)
3. **Panneau coach** (CoachPanel)
4. **~10 modales** (matchmaking, review, opening book, export, knowledge, etc.)

---

## 3. Conventions (à respecter impérativement)

Voir [`SCALABILITY.md`](SCALABILITY.md) pour les règles complètes. Résumé :

1. **Un fichier = une responsabilité.** Composant ≤ 300 lignes, hook ≤ 200, logique ≤ 400.
2. **Un composant = un fichier**, auto-documenté (JSDoc : rôle, dépendances, comment retirer).
3. **Mémoïsation** : `React.memo` sur les composants rendus plusieurs fois, `useCallback`/`useMemo` sur les handlers/valeurs dérivées.
4. **Tests obligatoires** : toute logique métier a un test Vitest.
5. **Délégation pure** : les composants de présentation ne prennent aucune décision métier.
6. **Types centralisés** : pas de type dupliqué.

---

## 4. Comment ajouter une fonction (2 minutes)

### Cas A — Ajouter un composant UI
1. Créer `src/components/<domaine>/MonComposant.tsx` (template ci-dessous).
2. L'importer et l'utiliser dans la page/le parent.
3. Vérifier : `npx tsc --noEmit` + `npx vitest run`.

### Cas B — Ajouter une logique métier
1. Créer `src/features/<domaine>/maFonction.ts` (fonction pure).
2. Créer `src/features/<domaine>/maFonction.test.ts` (test).
3. L'exporter via `src/features/<domaine>/index.ts`.

### Cas C — Ajouter une Route Handler
1. Créer `src/app/api/<nom>/route.ts`.
2. Valider l'entrée avec Zod (`src/lib/security/schemas.ts`).
3. Ajouter le rate limiting (`src/lib/security/rateLimit.ts`).

### Template de composant

```tsx
'use client';

/**
 * [Rôle du composant].
 *
 * Composant isolé : ne dépend que de ses props, aucune logique métier.
 * Pour le retirer, supprimer ce fichier et son usage dans [parent].
 * Mémoïsé (`React.memo`).
 */

import React from 'react';

export interface MonComposantProps {
    /** [Description de la prop]. */
    maProp: string;
}

const MonComposantComponent: React.FC<MonComposantProps> = ({ maProp }) => (
    <div>{maProp}</div>
);

export const MonComposant = React.memo(MonComposantComponent);
export default MonComposant;
```

---

## 5. Points d'entrée clés (pour naviguer vite)

| Question | Réponse |
|---|---|
| Où sont les règles du jeu ? | [`src/engine/backgammonEngine.ts`](src/engine/backgammonEngine.ts) |
| Où est le plateau ? | [`src/components/board/Board.tsx`](src/components/board/Board.tsx) |
| Où est la logique de partie ? | [`src/hooks/useBackgammonGame.ts`](src/hooks/useBackgammonGame.ts) |
| Où est le coach IA ? | [`src/features/coach/`](src/features/coach/) + [`src/app/api/coach/route.ts`](src/app/api/coach/route.ts) |
| Où est le moteur GNUBG ? | [`src/workers/gnubg.worker.ts`](src/workers/gnubg.worker.ts) + [`backend-engine/`](backend-engine/) |
| Où sont les types Supabase ? | [`src/lib/supabase/types.ts`](src/lib/supabase/types.ts) |
| Où sont les règles de scalabilité ? | [`SCALABILITY.md`](SCALABILITY.md) |
| Où est l'architecture détaillée ? | [`ARCHITECTURE.md`](ARCHITECTURE.md) |

---

## 6. Code mort / redondant identifié (audit 2026-10)

> Ces fichiers ne sont **importés nulle part** dans le code de production (seulement
> par leurs propres tests). À confirmer avant suppression : certains peuvent être
> destinés à une fonctionnalité future.

| Fichier | Statut | Action suggérée |
|---|---|---|
| [`src/components/board/BackgammonBoard.tsx`](src/components/board/BackgammonBoard.tsx) | Legacy (plus importé par les vues, mais référencé par ses 6 tests + `useBoardTheme`) | À supprimer après migration complète vers `Board.tsx` |

### Redondance connue

| Redondance | Détail |
|---|---|
| `BackgammonBoard.tsx` vs `Board.tsx` | Deux rendus de plateau coexistent (SVG legacy vs HTML/Tailwind actif) |
| `boardGeometry.ts` vs constantes internes de `BackgammonBoard.tsx` | La géométrie est dupliquée (le legacy garde ses propres constantes) |

> **Règle** : ne rien supprimer sans confirmation. Cette section sert à **voir** ce qui
> est mort/redondant avant de décider.
