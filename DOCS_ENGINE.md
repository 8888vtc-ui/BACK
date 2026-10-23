# Architecture du Moteur Backgammon (Open Sage Cloud Run + Repli Local)

> **Statut** : document mis à jour (2026-10) après retrait de WildBG WASM et branchement
> unifié des Bots IA et du Coach IA sur **Open Sage (`bgsage-service` sur Google Cloud Run)**.

## 1. Vue d'ensemble

Le moteur de production repose sur **Open Sage (`bgsage-service`)** déployé sur Google Cloud Run (`https://bgsage-service-468274233732.europe-west1.run.app`), qui pilote à la fois :
- **Les 4 niveaux de Bots IA adverses** (coups de pions + décisions de videau Double / Take / Pass)
- **Le Coach IA temps réel** (analyse log-driven des coups humains et bilans de fin de match)

> **Pourquoi WildBG WASM a été retiré** : l'audit empirique contre Open Sage 3-ply a montré que l'évaluateur 0-ply WildBG atteignait un PR de `~26.6` (absence de recherche multi-ply sur les 21 tirages). L'architecture utilise désormais exclusivement **Open Sage** en ligne (avec repli déterministe local `evaluator.ts` + table exacte de bear-off 54 264 états en cas de coupure réseau).

### Moteur Cloud Principal : Open Sage (`bgsage-service` sur Google Cloud Run)

Le microservice **`bgsage-service`** fournit des évaluations neuronales multi-ply (`1-ply`, `2-ply`, `3-ply`) et prend en charge les coups de pions (`checker_play`), le videau (`cube_action` avec score `away1`/`away2`) et la classification stratégique (`classify_game_plans`).

| Niveau Bot Frontend | Niveau Open Sage | PR mesuré (vs 3-ply) | Snowie Error Rate | % Coups Optimaux | Usage |
|---|---|---:|---:|---:|---|
| **`grandmaster`** | **Open Sage `3-ply`** | **0.00 PR** | `0.0000` | **100 %** | Bot Grand-Maître & Oracle Coach IA |
| **`expert`** | **Open Sage `2-ply`** | **2.22 PR** | `0.0044` | **90 %** | Bot Expert (niveau World Class) |
| **`intermediate`** | **Open Sage `1-ply`** | **4.89 PR** | `0.0098` | **85 %** | Bot Intermédiaire / Maître |
| **`beginner`** | **Open Sage `1-ply` + Bruit ($\pm 0.14\text{ Eq}$)** | **15.07 PR** | `0.0301` | **65 %** | Bot Débutant / Joueur de club |

## 2. Prise en charge complète du Videau (Cube : Double / Take / Pass)

Les décisions de videau du Bot IA et du Coach sont intégralement gérées par Open Sage via [`evaluateBotCubeWithBgsage`](src/lib/engine/bgsageClient.ts) :

1. **Proposition de Double par le Bot (`OFFER_DOUBLE`)** :
   - Avant de lancer les dés, si le videau est disponible (hors Crawford), Open Sage calcule `noDouble` ($E_{\text{ND}}$), `doubleTake` ($E_{\text{DT}}$) et `doublePass` ($E_{\text{DP}} = +1.0$) en tenant compte du score du match (`away1`, `away2`) et de la valeur du cube.
   - Le bot propose le double si et seulement si $\min(E_{\text{DT}}, E_{\text{DP}}) > E_{\text{ND}} + 0.005$ et $E_{\text{ND}} < E_{\text{DP}}$ (évite de doubler les positions *Too Good to Double*).
2. **Réponse du Bot à un Double humain (`TAKE_DOUBLE` / `PASS_DOUBLE`)** :
   - Lorsque le joueur humain propose un double, Open Sage évalue la position du point de vue du doubleur :
   - Si $E_{\text{DT}} \le E_{\text{DP}}$ ($\le +1.0$), le bot **accepte (`TAKE_DOUBLE`)**.
   - Si $E_{\text{DT}} > E_{\text{DP}}$ ($> +1.0$), le bot **refuse (`PASS_DOUBLE`)**.
3. **Règle de Crawford** :
   - Le videau est automatiquement verrouillé pendant la manche Crawford (`shouldDouble = false`).

## 3. Points d'entrée principaux

| Fonction | Rôle | Fichier |
|---|---|---|
| `evaluateWithBgsage(xgid, ply)` | Appel HTTP vers `POST /api/evaluate` (Cloud Run) | [`bgsageClient.ts`](src/lib/engine/bgsageClient.ts) |
| `selectBotMoveWithBgsage(state, legalSeqs, difficulty)` | Sélection du coup du Bot IA (1/2/3-ply + appariement exact des 24 flèches) | [`bgsageClient.ts`](src/lib/engine/bgsageClient.ts) |
| `evaluateBotCubeWithBgsage(state, difficulty)` | Décision de videau du Bot IA (Double / Take / Pass) via Open Sage | [`bgsageClient.ts`](src/lib/engine/bgsageClient.ts) |
| `analyzeHumanMoveFromLogWithBgsage(params)` | Analyse log-driven du coup humain pour le Coach IA | [`logAnalyzer.ts`](src/features/coach/logAnalyzer.ts) |
| `evaluateBoard(state, ply)` | Repli local déterministe (table Bear-off 54 264 états + tri-phase/Keith) | [`evaluator.ts`](src/lib/engine/evaluator.ts) |

## 4. Règles officielles garanties (`backgammonEngine.ts`)

1. **Priorité absolue à la barre** (`barActive > 0`).
2. **Doubles** : 4 sous-mouvements séquentiels.
3. **Maximum de dés obligatoires** : interdiction de jouer 1 dé si une ligne à 2 dés existe.
4. **Règle du plus gros dé** : obligation de jouer le dé supérieur si un seul dé est jouable.
5. **Over-bearing strict** : autorisé en bear-off uniquement si aucune case supérieure ne contient de pion.
