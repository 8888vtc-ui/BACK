# PROJECT MAP — Carte d'orientation du projet

> **Objectif** : permettre à un LLM (ou un développeur) de comprendre le projet en
> **1 minute** et d'ajouter une fonction en **2 minutes**.
>
> Ce fichier est la **porte d'entrée unique**. Lire ce fichier d'abord, puis le
> dossier concerné. Chaque entrée décrit le rôle en une phrase.

---

## 1. Vue d'ensemble (30 secondes)

**Backgammon Tour — Cercle Monte-Carlo & Gammon Academy** (`backgammontour.com` / `gammonacademy.com`) — application web Next.js 15 (React 19, Tailwind 3) de
backgammon avec coach IA temps réel, portée sur mobile via Capacitor (`com.backgammontour.app`).

- **Moteur de règles** : `src/engine/` (TypeScript pur, déterministe).
- **Moteur IA cloud (principal)** : Open Sage (`bgsage-service/`, PR 0.23, 4 niveaux de bot + videau Double/Take/Pass) via `src/lib/engine/bgsageClient.ts`.
- **Moteur IA local (repli offline)** : évaluateur tri-phase TypeScript + table Bear-Off exacte 54 264 états + Keith Count (`src/lib/engine/evaluator.ts`).
- **Moteur legacy** : backend Python GNUBG (archivé sous `archive/backend_engine_gnubg_legacy/`, rollouts historiques).
- **Coach** : Pipeline log-driven (`src/features/coach/logAnalyzer.ts`) + API directe Google Gemini (`gemini-3.8-flash` / `gemini-3.6` / repli `gemini-3.5`) via SSE (`src/app/api/coach/`) avec Cache L2 Supabase (`public.coach_explanations`, clé `position_key`).
- **Doctrine Active (« Perfection Produit Max 70 % $\to$ 100 % »)** : Focus exclusif sur l'éradication de tous les bugs (zéro coup douteux du Bot, stabilité géométrique et esthétique Haute-Horlogerie Monte-Carlo, fluidité 60 FPS) avant l'activation commerciale. Voir [`SYSTEM_SPEC_PROFITABILITY_MANIFESTO.md`](SYSTEM_SPEC_PROFITABILITY_MANIFESTO.md).
- **Modules Actifs Clés** : Jeu Solo vs Bot Open Sage (4 niveaux), Salon Privé sur code 4 chiffres (`BG-XXXX`), Puzzles Quotidiens V2 (`/daily-puzzle` & `/puzzles`), Drills (`/drills`) et Gammon Academy (`/academy`).
- **Persistance** : Supabase (Postgres + Auth + RLS + Cache Coach L2 `coach_explanations` + Erreurs récurrentes `recurring_errors` + Profils `profiles`).
- **Tests** : Vitest (1 310 tests unitaires sur 224 fichiers, 0 échec) + Playwright (e2e) + pytest (`bgsage-service/`).

---

## 2. Arborescence `src/` (1 minute)

### `src/engine/` — Moteur de règles + IA (pur, sans I/O)
| Fichier | Rôle |
|---|---|
| `backgammonEngine.ts` | Règles du jeu : plateau (26 entiers), coups légaux, bear-off, videau, XGID, pip count. **Source de vérité.** |
| `aiHeuristics.ts` | Évaluation de position IA de secours : `evaluateWin`, `scoreBoardForOpponent`, `scoreBoard0PlyNoisy`, `scoreBoard1Ply`, `scoreBoard2PlyForOpponent`. |

### `src/actions/` — Micro-programmes atomiques (Doctrine "1 Bouton = 1 Micro-Programme")
| Fichier | Rôle |
|---|---|
| `types.ts` | `GamePhase` (6 états), `MatchLogEntry` immuable, signatures pures |
| `commitHumanMoveAction.ts` | Commit du tour humain + log immuable + analyse coach |
| `runAiTurnAction.ts` | Tour IA en 3 paliers temporels + `try/finally` |
| `replayFromLogAction.ts` | Replay depuis la Feuille de Match |
| `index.ts` | Point d'entrée de l'architecture atomique |

### `src/features/` — Logique métier par domaine (pur, testable)
| Dossier | Rôle |
|---|---|
| `coach/` | Extracteur de concepts, classificateur de blunders, prompts LLM, **`logAnalyzer.ts` (pipeline log-driven + verdicts 4 paliers)** |
| `drills/` | Moteur d'exercices de répétition espacée sur blunders (réservé aux abonnés Pro) |
| `multiplayer/` | Validation d'actions, Glicko-2, Salons Privés temps réel par code `BG-XXXX` |
| `puzzles/` | Puzzles quotidiens |
| `rating/` | Analyse de partie, calcul de PR |
| `openings/` | Base d'ouvertures |
| `academy/` | Données encyclopédiques 3-Ply des 15 ouvertures (`academyData.ts`) et guides stratégiques 6 langues (`academyTranslations.ts`) |
| `export/` | Sérialisation XGID/SGF/MAT, partage |
| `knowledge/` | Base de connaissances pédagogiques |

### `src/components/` — Composants React (présentation)
| Dossier | Rôle |
|---|---|
| `board/` | Plateau (`Board.tsx`, `GameScreenView.tsx`, `GameBoardArea.tsx`, géométrie, thèmes) |
| `lobby/` | Lobby principal (`LobbyScreen.tsx`, `LearningModulesGrid.tsx`, `AppScreenViews.tsx`) |
| `nav/` | Barre de navigation horlogère (`AppNavbar.tsx`) et sélecteur 6 langues (`LanguageSelector.tsx`) |
| `academy/` | Hub SEO Gammon Academy (`GammonAcademyView.tsx`, `OpeningRollsTable.tsx`, `MatchEquityCalculator.tsx`, `AcademyKnowledgeGrid.tsx`, `OpeningRollDetailView.tsx`, `ConceptDetailView.tsx`) |
| `coach/` | Panneau coach (`CoachPanel.tsx`, `CoachSidebar.tsx`, `CoachMobileDrawer.tsx`) |
| `hud/` | HUD de match (`MatchHud.tsx`, `MatchHeader.tsx`, `MatchTurnBar.tsx`, sélecteurs) |
| `multiplayer/` | Bannière et composants multijoueur |
| `rating/` | Review de partie, courbes, cours IA (`GameReviewCourse.tsx`) |
| `stats/` | Dashboard progression, erreurs récurrentes (`RecurringErrorsCard.tsx`) |
| `summary/` | Rapport de fin de match (`PostMatchTrainingReport.tsx`, `PostMatchAiSynthesis.tsx` avec Soft Paywall et bouton Audit Dés SHA-256) |
| `dice/` | Modale d'audit cryptographique des dés (`DiceAuditModal.tsx` — vérification HMAC-SHA256 et graines client) |
| `subscription/` | Modale Soft Paywall VIP 3 paliers (`SubscriptionModal.tsx`), tunnel de rétention 3 étapes (`CancelFlowModal.tsx`) et bannière de gestion (`ManageSubscriptionBanner.tsx`) |
| `puzzle/` | Composants V2 du Puzzle du Jour (`DailyPuzzleBoard.tsx`, `DailyPuzzleResultCard.tsx`, `DailyStreakBadge.tsx`) |
| `auth/`, `common/`, `toast/`, `providers/`, `modals/` | Infra UI (`GameModalsContainer.tsx`, `UserAccountMenu.tsx`) |

### `src/hooks/` — Hooks React (état + effets)
| Fichier | Rôle |
|---|---|
| `useBackgammonGame.ts` | Machine à états de partie (lancer, déplacer, videau, IA, session Provably Fair) |
| `useCoach.ts` | Orchestration de l'analyse Coach IA log-driven |
| `useCoachQuota.ts` | Suivi temps réel du quota gratuit de 3 analyses Coach IA / 24h et statut VIP |
| `useCheckerInteractions.ts` | Interactions pions et dés (Smart Click 1 clic, clic droit = petit dé, drag-and-drop ; plus de double-clic natif) |
| `usePlatformControlsRouter.ts` | Routage des contrôles Desktop vs Mobile Tactile |
| `useGamePersistence.ts` | Persistance locale/cloud et analyse de fin de partie |
| `useGameModals.ts` | Gestion centralisée des modales de jeu (incluant `DiceAuditModal` et `SubscriptionModal`) |
| `useOpeningAssistant.ts` | Détection et application des coups d'ouverture certifiés |
| `useMultiplayerGame.ts` | Partie multijoueur temps réel |
| `useBoardTheme.tsx` | Thème du plateau (contexte) |

### `src/lib/` — Services (I/O, intégrations)
| Dossier | Rôle |
|---|---|
| `supabase/` | Client Supabase, auth, types, erreurs récurrentes |
| `i18n/` | Internationalisation complète 6 langues (`fr`, `en`, `es`, `pt`, `de`, `ar`), support RTL Arabe, matrice terminologique 25 termes XG (couplé à `src/i18n/`) |
| `seo/` | Graphe JSON-LD Schema.org (`structuredData.ts` : `WebSite`, `VideoGame`, `Course`, `FAQPage`, `BreadcrumbList`) |
| `offline/` | Persistance locale (IndexedDB), sync |
| `engine/` | **`bgsageClient.ts` (client Open Sage Cloud Run)**, évaluateur tri-phase local (`evaluator.ts`), rollouts |
| `crypto/` | **`provablyFairRng.ts` (RNG cryptographique HMAC-SHA256 Commit-Play-Reveal sans biais de modulo `< 252`)** |
| `subscription/`, `stripe/` | **`quotaService.ts` (quota 3 analyses / 24h & Grace Period 30j), `retentionEngine.ts` (marge IA, Health Score, Cancel Flow, Dunning), `lifecycleEvents.ts` (9 événements Jour 1 & PQL), `stripePlans.ts` & `stripeClient.ts` (Stripe Billing VIP)** |
| `puzzle/` | **`puzzleService.ts` (catalogue Daily Puzzle V2 certifié Open Sage 3-ply) & `fsrsScheduler.ts` (répétition espacée FSRS)** |
| `rating/` | **`glicko2Service.ts` (classement Glicko-2 Composite pondéré par PR et longueur de match)** |
| `telemetry/` | **`antiCheatDetector.ts` (profilage Ex-Gaussien 5POINT/Regan des temps de réflexion et pertes de focus)** |
| `monitoring/` | Sentry, logs, alertes |
| `security/` | Rate limiting, schémas Zod |
| `capacitor/` | Haptique, partage, SQLite natif |
| `sound/`, `stats/`, `analytics/`, `pwa/` | Synthèse modale Web Audio (`modalAcousticEngine.ts`), haptique (`sensoryFeedbackController.ts`), stats, analytics, PWA |
| `gameFeel/` | Game Feel pur et testé : `speedPresets.ts` (cadences Coach/Tournoi/Blitz T0–T6), `flightPhysics.ts` (durées/keyframes de vol), `pointerGestureMachine.ts` (tap/drag/long-press par type de pointeur) |
| `settings/` | `gameplaySettings.ts` : schéma `GameplaySettings`, valeurs par défaut, migration, persistance de la cadence |

> Moteur : `src/engine/smartClickResolver.ts` résout le clic Destination-First (port > dé simple > somme d1+d2) et le clic sur les dés.

### `src/app/` — App Router (pages + API)
| Chemin | Rôle |
|---|---|
| `page.tsx` | Orchestrateur principal (274 lignes, conforme R1 < 300 lignes) à 3 vues exclusives (`LOBBY`, `GAME`, `SUMMARY`) |
| `academy/`, `drills/`, `puzzles/`, `daily-puzzle/`, `progression/`, `pricing/` | Hub SEO Gammon Academy (`/academy`), Puzzles Quotidiens V2 unifiés (`/puzzles` & `/daily-puzzle`), Drills Pro (`/drills`), Progression (`/progression`), Grille Tarifaire VIP (`/pricing`) |
| `api/coach/`, `api/evaluate/`, `api/rollout/`, `api/stripe/`, `api/multiplayer/`, `api/health/` | Route Handlers serveur (Coach SSE + quota 402, Open Sage, Rollouts, Stripe Checkout/Webhook, Validation multijoueur, Health) |

### `src/workers/` — Web Workers
| Fichier | Rôle |
|---|---|
| `gnubg.worker.ts` | Exécute l'évaluateur tri-phase local de repli hors thread principal |

---

## 2bis. Anatomie de `page.tsx` (274 lignes — découpé en hooks et vues dédiés)

> ✅ **Conforme à la règle R1 (< 300 lignes).** Le rendu est gouverné par un état maître
> `appScreen` (`'LOBBY' | 'GAME' | 'SUMMARY'`) garantissant qu'une seule vue est montée à la fois.

| Hook / Vue délégué | Responsabilité extraite |
|---|---|
| `LobbyView` (`AppScreenViews.tsx`) | Écran d'accueil et configuration de match |
| `GameScreenView` (`GameScreenView.tsx`) | Écran de jeu complet (HUD + Plateau + Coach + Modales) |
| `SummaryView` (`AppScreenViews.tsx`) | Bilan de fin de match |
| `useBackgammonGame` | Machine à états du jeu et adversaire IA Open Sage |
| `useCoach` | Analyse log-driven des coups humains et calcul PR |
| `useCheckerInteractions` | Gestion des interactions Smart Click (1 clic, clic droit = petit dé, drag-and-drop) sur pions et dés |
| `usePlatformControlsRouter` | Adaptation automatique Desktop (clavier/souris) vs Mobile (tactile) |
| `useGamePersistence` | Sauvegarde offline-first et historique des tours |
| `useGameModals` | Ouverture/fermeture des modales et tiroir mobile |

---

## 3. Conventions (à respecter impérativement)

Voir [`SCALABILITY.md`](SCALABILITY.md) et [`GOVERNANCE.md`](GOVERNANCE.md) pour les règles complètes. Résumé :

1. **Un fichier = une responsabilité.** Composant ≤ 300 lignes, hook ≤ 200, logique ≤ 400.
2. **Un composant = un fichier**, auto-documenté (JSDoc : rôle, dépendances, comment retirer).
3. **Mémoïsation** : `React.memo` sur les composants rendus plusieurs fois, `useCallback`/`useMemo` sur les handlers/valeurs dérivées.
4. **Tests obligatoires** : toute logique métier a un test Vitest.
5. **Délégation pure** : les composants de présentation ne prennent aucune décision métier.
6. **Types centralisés** : pas de type dupliqué.

---

## 4. Comment ajouter une fonction (2 minutes)

### Cas A — Ajouter un composant UI
1. Créer `src/components/<domaine>/MonComposant.tsx`.
2. L'importer et l'utiliser dans la vue ou le parent.
3. Vérifier : `npm run typecheck` + `npm test`.

### Cas B — Ajouter une logique métier
1. Créer `src/features/<domaine>/maFonction.ts` (fonction pure).
2. Créer `src/features/<domaine>/maFonction.test.ts` (test).
3. L'exporter via `src/features/<domaine>/index.ts`.

### Cas C — Ajouter une Route Handler
1. Créer `src/app/api/<nom>/route.ts`.
2. Valider l'entrée avec Zod (`src/lib/security/schemas.ts`).
3. Ajouter le rate limiting (`src/lib/security/rateLimit.ts`).

---

## 5. Points d'entrée clés (pour naviguer vite)

| Question | Réponse |
|---|---|
| Où sont les règles du jeu ? | [`src/engine/backgammonEngine.ts`](src/engine/backgammonEngine.ts) |
| Où est le moteur IA unifié ? | [`DOCS_ENGINE.md`](DOCS_ENGINE.md) + [`src/lib/engine/bgsageClient.ts`](src/lib/engine/bgsageClient.ts) + [`src/lib/engine/evaluator.ts`](src/lib/engine/evaluator.ts) |
| Où est le plateau ? | [`src/components/board/Board.tsx`](src/components/board/Board.tsx) |
| Où est la logique de partie ? | [`src/hooks/useBackgammonGame.ts`](src/hooks/useBackgammonGame.ts) |
| Où est le coach IA ? | [`src/features/coach/`](src/features/coach/) + [`src/app/api/coach/route.ts`](src/app/api/coach/route.ts) |
| Où est le RNG Provably Fair & son audit UI ? | [`src/lib/crypto/provablyFairRng.ts`](src/lib/crypto/provablyFairRng.ts) + [`src/components/dice/DiceAuditModal.tsx`](src/components/dice/DiceAuditModal.tsx) |
| Où sont le Soft Paywall, le quota Coach et Stripe ? | [`src/lib/subscription/quotaService.ts`](src/lib/subscription/quotaService.ts) + [`src/hooks/useCoachQuota.ts`](src/hooks/useCoachQuota.ts) + [`src/components/subscription/SubscriptionModal.tsx`](src/components/subscription/SubscriptionModal.tsx) + [`src/app/pricing/page.tsx`](src/app/pricing/page.tsx) |
| Où sont les Puzzles Quotidiens V2 & FSRS ? | [`src/lib/puzzle/puzzleService.ts`](src/lib/puzzle/puzzleService.ts) + [`src/lib/puzzle/fsrsScheduler.ts`](src/lib/puzzle/fsrsScheduler.ts) + [`src/app/daily-puzzle/page.tsx`](src/app/daily-puzzle/page.tsx) |
| Où sont les types Supabase ? | [`src/lib/supabase/types.ts`](src/lib/supabase/types.ts) |
| Où sont les règles de scalabilité ? | [`SCALABILITY.md`](SCALABILITY.md) |
| Où est le référentiel d'excellence (Game Feel, Glicko-2, Audio, Provably Fair) ? | [`docs/MASTER_SPEC_EXCELLENCE.md`](docs/MASTER_SPEC_EXCELLENCE.md) |
| Où est l'architecture détaillée ? | [`ARCHITECTURE.md`](ARCHITECTURE.md) |

---

## 6. Statut de la documentation et archives (audit 2026-10)

| Catégorie | Fichiers de référence actifs | Archives historiques (`archive/docs_historiques/`) |
|---|---|---|
| **Manifeste & Stratégie Produit** | [`SYSTEM_SPEC_PROFITABILITY_MANIFESTO.md`](SYSTEM_SPEC_PROFITABILITY_MANIFESTO.md), [`docs/PLAN_ACTION_PRODUIT.md`](docs/PLAN_ACTION_PRODUIT.md) | `archive/docs_historiques/ROADMAP_PARITE_XG_GALAXY.md`, `archive/docs_historiques/AUDIT_SYSTEME_ET_PARITE_XG_GALAXY.md` |
| **Excellence & Game Feel** | [`docs/MASTER_SPEC_EXCELLENCE.md`](docs/MASTER_SPEC_EXCELLENCE.md) (Game Feel WAAPI, Glicko-2 Composite, Audio modal, Provably Fair) | — |
| **Moteur IA** | [`DOCS_ENGINE.md`](DOCS_ENGINE.md), [`bgsage-service/README.md`](bgsage-service/README.md), [`docs/adr/0009-open-sage-cloud-run.md`](docs/adr/0009-open-sage-cloud-run.md) | `archive/projet_abandonne_bot_non_fiable/`, `archive/docs_historiques/TECHNIQUE_XG.md`, `archive/docs_historiques/PLAN_AMELIORATION_XG.md` |
| **Architecture & Règles** | [`PROJECT_MAP.md`](PROJECT_MAP.md), [`ARCHITECTURE.md`](ARCHITECTURE.md), [`SCALABILITY.md`](SCALABILITY.md), [`GOVERNANCE.md`](GOVERNANCE.md) | `archive/docs_historiques/AUDIT_FRONTEND_COMPLET.md`, `archive/docs_historiques/FRONTEND_REFACTOR_PLAN.md` |
| **Marque, SEO & i18n (6 Langues)** | [`docs/SEO_AND_I18N_MASTERPLAN.md`](docs/SEO_AND_I18N_MASTERPLAN.md), [`docs/BRAND_AND_SEO.md`](docs/BRAND_AND_SEO.md) | — |
| **Salon Privé `BG-XXXX` & Sécurité** | [`docs/MULTIPLAYER_REALTIME_SPEC.md`](docs/MULTIPLAYER_REALTIME_SPEC.md), [`docs/RLS_SECURITY_AUDIT.md`](docs/RLS_SECURITY_AUDIT.md), [`docs/API_REFERENCE.md`](docs/API_REFERENCE.md) | — |
