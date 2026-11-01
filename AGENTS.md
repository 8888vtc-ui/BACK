# AGENTS.md — Instructions & Invariants Architecturaux (Antigravity IDE)

> **Rôle** : ce fichier est lu en premier par tout agent IA (Antigravity IDE, Claude Code,
> Cline, Roo Code, Copilot) avant de toucher au code. Il ne contient **JAMAIS** d'en-tête
> YAML (frontmatter) et respecte le plafond strict `< 24 000` octets (budget partagé de
> `20 000` tokens). Dernière vérification : 2026-10-30.

---

## 1. Ordre de lecture obligatoire

1. **AGENTS.md** (ce fichier — invariants permanents)
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
- **Règle 4 — Atomicité** : UNE tâche à la fois, max 3 fichiers modifiés par tâche. Après
  chaque modification : `npm run typecheck && npm test` doit être 100 % vert.

---

## 3. Invariants Métier & Moteurs Backgammon (Standards XG / Open Sage / FSRS v5)

### Terminologie & Conventions de Moteur
- Toujours orthographier **« backgame »** en un seul mot.
- La numérotation des profondeurs de recherche suit la convention **eXtreme Gammon (XG)** et **`bgsage`** : `1-ply` désigne l'évaluation directe du réseau neuronal sans recherche anticipée (équivalent au `0-ply` de GNU Backgammon).
- La fonction `possible_moves` ne retourne jamais une liste vide lorsque des coups légaux existent ; les étapes de `move_notation` dérivent exclusivement des valeurs de dés jouées légalement.
- En évaluation multi-ply avec élagage (*pruning*), ne jamais trier un coup élagué selon sa valeur `1-ply` dans le classement final. Chaque pli supplémentaire augmente le temps de calcul d'un facteur $\approx 20\times$ et doit être parallélisé sur les cœurs CPU.

### Invariants de Videau (Doubling Cube) & Match
- Lorsque le videau appartient à l'adversaire (`cube_opp_own`, position `-1` pour le joueur au trait), la décision de videau doit impérativement être traitée comme une absence de décision (`no decision`).
- En **Money Game** (`match_length = 0`), l'équité varie linéairement avec la valeur du videau : les décisions optimales de pions et de videau sont théoriquement identiques pour toute valeur de videau $\ge 2$. *(Note d'implémentation : `bgsageCache.ts` conserve néanmoins la valeur exacte du videau dans la clé de cache pour garantir l'exactitude en match / cubeful).*
- Conformité de licence : le code source de `bgsage` (Open Sage) et les poids `stage11` (24 réseaux) sont sous licence **MPL-2.0** (copyleft au niveau du fichier). Toute modification des fichiers MPL-2.0 doit rester sous MPL-2.0.

### Standards de Données, PR & Apprentissage FSRS v5
- **Identifiant primaire de position** : la chaîne `XGID` constitue la clé unique universelle pour l'indexation des cartes Anki (`AnkiGammon`) et de la file FSRS, permettant la mise à jour du rendu visuel et analytique sans écraser l'historique de révision.
- **Métrique de performance** : utiliser exclusivement le **Performance Rating** officiel d'eXtreme Gammon :
  $$\text{PR} = \left(\text{Équité perdue par décision valide}\right) \times 500$$
  en excluant tous les coups forcés et toutes les décisions où l'écart d'équité entre le meilleur et le pire coup légal est $< 0.001$ (ne jamais utiliser le *Snowie Rating* comme métrique principale).
- **Planification mémorielle** : utiliser exclusivement les équations **FSRS v5 à 19 paramètres** ($w_0$ à $w_{18}$) avec $\text{DECAY} = -0.5$ et $\text{FACTOR} = \frac{19}{81}$.
- **Réglementation d'horloge** : en mode tournoi, appliquer le délai simple (**Bronstein delay** : compte à rebours du délai avant décompte de la réserve principale, sans incrément cumulatif).

### Architecture "Tesla 3-Secondes" sur `/drills` & `/puzzles` (Focus Phase 1 `ER` 0.0–30.0, Certification 3-Ply GNU Backgammon & Sélection Adaptative `N+1`)
- **Focus Exclusif Phase 1 sur l'`ER` (`0.0–30.0`) & Distinction stricte avec `Rating` (`1500`)** :
  - `ER` (*Error Rate / Performance Rating*, initialisé à `6.3`) évolue sur l'échelle **`0.0` à `30.0`** exclusivement **par dixièmes** (`▼ -0.1` / `-0.2` en vert sur coup optimal, `▲ +0.2` / `+0.3` / `+0.4` / `+0.5` en rouge sur erreur). L'`ERH` est mis en attente pour la Phase 2.
  - `Rating` (`1500`) désigne le classement compétitif Glicko-2 / Elo et n'est jamais confondu avec l'`ER`.
- **Certification 3-Ply GNU Backgammon (`gnubg-cli.exe -t -q`) & Purge Totale** :
  - Zéro quiz `0-ply`/`1-ply`/`2-ply`, zéro position de **Course Pure sans contact** (`isContact(board) === false`) dans la banque de quiz (`scripts/verify_3ply_with_gnubg.ts`, [`CERTIFICATION_3PLY_REPORT.md`](CERTIFICATION_3PLY_REPORT.md), `scripts/generate_50k_3ply_quizzes.ts`).
  - Sélection adaptative **Niveau $N+1$** ($\text{Cible\_Quiz} = \max(1.0, \text{ER}_{\text{joueur}} - \Delta_{N+1})$) 100 % déterministe (zéro `Math.random()`) avec régulation dynamique Up & Down.
- **6 Sous-Agents en Coulisses (`FlashLite-GNUBG-3Ply-Verifier`, `FlashLite-NonTrivial-Quiz-Filter`, `FlashLite-36Rolls-Geometric-Extractor`, `Flash-Adaptive-NPlus1-Selector`, `Flash-3Ply-Pedagogical-Coach`, `FlashLite-Doc-Coherence-Keeper`)** :
  - Tournent exclusivement en arrière-plan (aucun nom technique de sous-agent affiché dans l'UI).
  - `FlashLite-36Rolls-Geometric-Extractor` utilise `pipCount(board)` de `src/engine/backgammonEngine.ts` (`X_BAR = 0`, `O_BAR = 25`) comme source unique partagée et vérifie les 15 pions par camp.
  - `FlashLite-NonTrivial-Quiz-Filter` rejette mathématiquement 100 % des courses pures (`isContact(board) === false`) et des coups évidents ($> 0.120\text{ EMG}$).
- **Découpage Modulaire Strict de `/drills` & `/puzzles` (5 sous-modules $< 220$ lignes)** :
  1. [`src/components/drills/DrillHeader.tsx`](src/components/drills/DrillHeader.tsx) : Barre supérieure (`← Retour`, titre `Quiz ER / PR` ou `Quiz ERH`, indicateurs `ER / PR : 6.3`, `ERH : 6.1`, `Rating : 1500`).
  2. [`src/components/drills/DrillContextStrip.tsx`](src/components/drills/DrillContextStrip.tsx) : 1 seule ligne de contexte (`Match X pts • Videau : X • Retard/Avance : X pips`). Thème masqué avant le clic, zéro sous-ligne verbeuse *"Portes faites..."*.
  3. [`src/components/drills/DrillChoicesGrid.tsx`](src/components/drills/DrillChoicesGrid.tsx) : 4 boutons `A`, `B`, `C`, `D` avec rappel `🎲 Blanc joue X-Y • Sens : Case 24 ➔ Case 1`, flèche au survol (`hover`) et validation en **1 clic**.
  4. [`src/components/drills/DrillCoachFeedback.tsx`](src/components/drills/DrillCoachFeedback.tsx) : *Progressive Disclosure* — sur **Coup Optimal**, affiche uniquement `✅ Coup Optimal !` + `Pourquoi ce coup est optimal` + `💡 Règle à retenir` (sans bloc d'erreur) ; sur **Erreur**, affiche `❌ Erreur` + `1. Pourquoi ton coup est une erreur` + `2. Pourquoi le coup optimal gagne` + `💡 Comment t'améliorer`.
  5. [`src/hooks/useDrillRating.ts`](src/hooks/useDrillRating.ts) : Hook dédié ($< 160$ lignes, validé par Zod) gérant l'évolution en dixièmes de `erPr` (`0.0–30.0`), `erh` (`0.0–30.0`) et `rating` (`1500`).

---

## 4. Architecture Modulaire des Règles Antigravity (`/.agents/rules/`)

Pour éviter toute saturation de la fenêtre de contexte, les spécifications mathématiques détaillées sont isolées dans 14 modules sous `/.agents/rules/*.md` (avec frontmatter YAML `trigger` en `snake_case`) :

- `@.agents/rules/parsers-positions.md` — Grammaires binaires et textuelles `XGID` (10 champs), `GNUID` (80 bits Base64) et `OGID` (Base-26).
- `@.agents/rules/engines-pr-analytics.md` — Moteurs neuronaux `bgsage` (`stage11` à 24 réseaux) & `wildbg`, encodage Tesauro/Strehl à 200 entrées, niveaux de Rollout XG Roller/+/++, filtrage exact du PR et matrice de dés d'Alex Eshaghian.
- `@.agents/rules/race-cube-formulas.md` — Algorithmes de videau en course sans contact : **Timmes (octobre 2026)**, **Isight (Axel Reichert)**, **Keith**, **Trice/Benjamin (10 % & règle des 9)**, **Benjamin 3v3** et **EPC ($7n+1$)**.
- `@.agents/rules/fsrs-v5-anki-ux.md` — Système complet d'équations **FSRS v5** ($w_0 \dots w_{18}$), UX des cartes `AnkiGammon` et délai Bronstein.
- `@.agents/rules/xai-coach-18-motifs-tesla.md` — Architecture XAI Cercle Monte-Carlo : 18 motifs géométriques (0 ms), Lookahead constructif 36 lancers, architecture cognitive Tesla 3-Secondes, table Kazaross-XG2 MWC et JSON schema Gemini.
- `@.agents/rules/human-bots-bi-level-ux.md` — Calibrage des Bots Humains (Premier Principe en 4 règles, PR 1-2, 3-5, 6-9, 18-25), détection du Coup Brillant (`!!`), micro-copie UX bi-niveau (< 3s, 18-28 mots) et 5 garde-fous anti-paranoïa sur les dés.
- `@.agents/rules/creative-direction-viral-launch.md` — Direction créative "Linear meets Haute-Horlogerie Monte-Carlo", animations 120 FPS, psychoacoustique procédurale à 3 registres, storyboard 60s et formats viraux (TikTok, Shorts, r/backgammon, ASO).
- `@.agents/rules/elon-musk-chameleon-ux.md` — Algorithme d'Elon Musk (5 étapes), UX Idiot Index, éradication du jargon EMG brut, Time-to-Fun < 3s, interface Caméléon à 3 couches (L0 Débutant, L1 Club, L2 Pro) et matrice DELETE/HIDE/KEEP.
- `@.agents/rules/mobile-geometry-zero-friction.md` — Géométrie responsive Portrait/Paysage (390x844 px), grilles CSS asymétriques 13.05fr / 13.40fr / 12.65fr, empilement capé à 5 disques, 4 paradigmes tactiles (1-Tap, 2-Tap Ghost, Target-Click, Drag anti-occlusion) et machine à états à 6 états.
- `@.agents/rules/solopreneur-monetization-bots.md` — 5 archétypes de bots personnifiés (Arthur, Elena, Marcus, Spinoza, Mittens), anti-paranoïa des dés (Commit-Reveal SHA-256, Gammon36, Swap Dice, Karma Clip), Chouette multijoueur (?join=BG-XXXX), SaaS Solopreneur (10k€ MRR) et cache IA à 4 couches (< 1,62 $/jour pour 1 000 DAU).
- `@.agents/rules/matchmaking-glicko2-puzzles.md` — Matchmaking Glicko-2 hybride / TrueSkill découplé de la variance des dés, 6 Ligues Hebdomadaires par paliers de PR, et pipeline de certification Blunder-to-Puzzle en 3 passes Open Sage (/daily-puzzle).
- `@.agents/rules/psychoacoustics-haptics-ahap.md` — Synthèse psychoacoustique modale Web Audio API (0 ms), loi d'amortissement de Rayleigh-Woodhouse (4 matériaux d'orfèvrerie), anti-fatigue auditive et séquençage Core Haptics Apple (.ahap).
- `@.agents/rules/neuro-symbolic-grandmaster-coach.md` — Coach IA Neuro-Symbolique Grand-Maître (DecodeChess, Maia-BG, GTO Wizard, KaTrain), corpus Michy, Magriel, Woolsey, Janowski, Trice, détection du Tilt (Zare), schéma JSON anti-hallucination et glossaire 7 langues.
- `@.agents/rules/distributed-realtime-chouette-wbgf.md` — Architecture distribuée autoritaire, horloge Bronstein résiliente au lag (WBGF Art. 4.1b), arbitrage des déconnexions (classifieur Rage-Quit et détection Gin sur DAG), et moteur de Chouette (3 à 5 joueurs, multi-cubes, rachat et somme nulle).

---

## 5. Zones interdites

| Chemin | Raison |
|---|---|
| `archive/` | Code mort (GNUBG legacy, WildBG abandonné). Ne jamais s'en inspirer. |
| `xg-web-trainer/` | Projet séparé, hors périmètre. |
| `*.png` à la racine | Captures de debug (déjà ignorées par Git). |
| `supabase/.temp/` | Généré, ne pas modifier. |

---

## 6. Anciens pièges connus — Tous résolus et verrouillés par tests

1. **Rollouts (`src/lib/engine/rolloutSimulation.ts`)** : si `bgsage-service` échoue, `finishJob()` marque `status: 'failed'` sans jamais inventer d'équités. ID via `crypto.randomUUID()`.
2. **Cache LRU Open Sage (`src/lib/engine/bgsageCache.ts`)** : `canonicalizeXgidForCache()` conserve `cube >= 2` distinct (vérifié par `bgsageCache.test.ts`).
3. **Multijoueur (`src/features/multiplayer/roomService.ts`)** : si Supabase est configuré, tout échec lève `throw new Error(...)` sans basculer sur `mockRoomsRegistry`.
4. **RNG cryptographique (`realtimeSchema.ts` & `MatchHeader.tsx`)** : `crypto.getRandomValues` avec rejet du biais de modulo ; zéro `Math.random()`.
5. **Stockage d'analyses (`src/features/rating/gameAnalysisStorage.ts`)** : `getAllGameAnalyses()` retourne `[]` à vide (zéro partie fictive injectée).

---

## 7. Commandes de vérification & Structure des couches

```bash
npm run typecheck   # 0 erreur TypeScript
npm test            # 100 % vert (Vitest)
npm run lint        # ESLint
```

| Couche | Dossier | Interdits |
|---|---|---|
| Règles (pur, déterministe) | `src/engine/` | React, JSX, `localStorage`, `fetch`, `console.log` |
| Évaluation & Coach | `src/lib/engine/`, `src/features/coach/` | DOM, modification d'affichage |
| UI / Présentation | `src/components/`, `src/app/` | Calcul lourd, logique de règles |

> ⚠️ `src/engine/` (règles du jeu, pip count, formules de course) et `src/lib/engine/` (évaluateur + client `bgsage`) sont deux couches distinctes. Composant ≤ 300 lignes, hook ≤ 200, logique ≤ 400.
