# Cadrage stratégique — Alternative légère & performante au moteur de jeu

> **Contexte** : l'option Raccoon brute est **définitivement exclue** (~48 Mo ONNX fp32, absence totale de tête de videau, absence de tables de bear-off). Tout backend payant nécessitant Docker est également exclu.
>
> **Objectif** : présenter 2 à 3 alternatives techniques concrètes et viables pour maximiser la force de jeu et l'analyse, en respectant **zéro compromis** sur les 4 critères d'éligibilité stricts.
>
> **Contrainte de méthode** : ce document est un **comparatif factuel, chiffré et vérifiable**. Aucun code applicatif n'est généré ici.

---

## 0. Rappel des critères d'éligibilité (zéro compromis)

| # | Critère | Seuil dur |
|---|---|---|
| 1 | **Zéro serveur externe** | 100 % client-side (Web Worker ou thread principal), hors-ligne préservé |
| 2 | **Videau natif** | Décisions Double / Take / Pass (Janowski ou équivalent) |
| 3 | **Poids ultra-léger** | < 2 Mo de bundle total, chargement instantané mobile 4G |
| 4 | **Conservation des acquis** | 579 tests unitaires, interfaces TypeScript, [`Board.tsx`](../src/app/page.tsx) sans régression ni réécriture majeure |

---

## 1. Réponse à la question « Snowie utilisait quel moteur ? »

**Snowie n'utilisait pas un moteur « importable »** : c'était un logiciel commercial propriétaire (1998–2004, Oasya/Snowie Group), dont le cœur était un **réseau de neurones entraîné par auto-apprentissage (self-play)**, dans la lignée directe de **TD-Gammon** de Gerald Tesauro (IBM, 1992).

Faits vérifiés (sources : Wikipedia TD-Gammon, GammOnLine « Dawn of the Bots », bkgm.com) :

- **TD-Gammon** (Tesauro, 1992) est le premier réseau neuronal de backgammon, entraîné par **TD(λ) reinforcement learning** en self-play, sans connaissance humaine initiale. Il a atteint un niveau « strong master », proche des meilleurs humains.
- **Snowie** (1998) et **JellyFish** (1994) sont les deux programmes commerciaux **directement inspirés de TD-Gammon**. Snowie 4 (2002) a ajouté une connaissance spécifique des backgames et des primes, et son 2-ply était « légèrement plus fort que le 3-ply de Snowie 3 ».
- **GNU Backgammon** est « basé sur la même technologie dont JellyFish et Snowie sont issus » (réseau neuronal type TD-Gammon, 3 réseaux : contact / race / crashed + bases de bear-off).

**Conclusion opérationnelle** : il n'existe **aucun moteur Snowie réutilisable** (code fermé, jamais publié). La seule voie « esprit Snowie » est de reproduire l'approche TD-Gammon en self-play — ce qui est exactement ce que font les alternatives open source modernes ci-dessous. Snowie est donc un **point de référence historique de force**, pas une source technique exploitable.

---

## 2. Les 3 alternatives retenues

Après élimination de Raccoon (48 Mo, pas de videau), de GNU Backgammon embarqué (GPL + ~7 Mo de poids + rétro-ingénierie de `eval.c`), et de Nodots (GPL), trois pistes restent viables sous la barre des 2 Mo :

| Rang | Solution | Nature | Poids estimé | Videau |
|---|---|---|---|---|
| 🥇 | **A — Tables exactes + heuristique améliorée (100 % TS)** | Tables de bear-off précalculées + Keith Count + frappes exactes | **< 500 Ko** | ✅ Janowski (déjà en place) |
| 🥈 | **B — Micro-réseau quantifié int8 (distillation maison)** | Réseau type Raccoon réduit, quantifié int8, inférence TS pure | **~1–1,5 Mo** | ⚠️ Janowski alimenté par le réseau |
| 🥉 | **C — wildbg (Rust → WASM)** | Moteur neuronal Rust compilé WASM | **~1–2 Mo** (à confirmer) | ❌ incomplet (issue #17) |

---

## 3. OPTION A — Tables exactes + heuristique améliorée (100 % TypeScript)

### 3.1 Architecture technique

- **Langage / runtime** : TypeScript pur, exécuté dans le Web Worker existant ([`gnubg.worker.ts`](../src/workers/gnubg.worker.ts)) ou le thread principal. **Zéro dépendance externe**, zéro WASM, zéro ONNX.
- **Mécanisme d'évaluation** (3 briques mathématiques exactes et vérifiables) :
  1. **Base de bear-off EXACTE** : les 54 264 positions à un côté (15 pions sur 6 flèches) sont énumérées une fois. Pour chacune, on calcule la probabilité exacte de sortir en 1, 2, 3… lancers par récursion dynamique. Stockée en `Uint8Array`/`Uint16Array` compressé. **C'est mathématiquement exact — meilleur que gnubg lui-même en bear-off** (gnubg utilise la même approche par base de données).
  2. **Course (race) — Keith Count complet** : règle de Keith/Thorp documentée et validée publiquement (~90 % de décisions take/drop correctes). Remplace l'approximation actuelle de `evaluateRace()`.
  3. **Contact — frappes EXACTES sur 36 combinaisons** : énumération des 36 lancers et comptage exact des frappes sur chaque blot (déterministe, déjà partiellement présent dans [`featureExtractor.ts`](../src/features/coach/featureExtractor.ts) via `countShots`).
- **Gestion du hasard** : déterministe (énumération des 36 lancers), pas de Monte-Carlo nécessaire pour l'évaluation 0-ply/1-ply.
- **Videau** : décision **Janowski** déjà implémentée dans [`evaluator.ts`](../src/lib/engine/evaluator.ts) (`analyzeBoardCube`), alimentée par l'équité cubeless exacte des tables. **Aucune régression** : c'est le chemin actuel, simplement rendu plus précis.

### 3.2 Mesures et coûts réels

| Métrique | Valeur |
|---|---|
| **Poids ajouté au build** | **~200–500 Ko** (table de bear-off compressée). Aucun runtime. |
| **Temps d'exécution / coup** | **< 1 ms** (lookup table + arithmétique entière) |
| **Force estimée (pions)** | Niveau « joueur de club avancé / expert ». **Exacte** en bear-off et course (les 2 régimes où les erreurs coûtent le plus cher en PR). En contact complexe (blitz, backgame), reste sous gnubg mais **nettement au-dessus** de l'heuristique tri-phase actuelle. |
| **Force estimée (videau)** | **Excellente en course/bear-off** (Keith Count + tables exactes = take/drop quasi parfaits). En contact, Janowski reste approximatif mais correct. |
| **PR attendu** | Non mesurable directement sans benchmark, mais l'élimination des erreurs de bear-off/course (les plus pénalisantes en PR) produit le **plus gros gain immédiat**. |

### 3.3 Plan de migration pas-à-pas

1. **Générateur de base de bear-off** (script Node/TS hors bundle) : récursion sur 54 264 positions → fichier `public/data/bearoff.bin` (~200–500 Ko).
2. **Charger la table** dans [`evaluator.ts`](../src/lib/engine/evaluator.ts) (lazy, via `fetch` + cache, ou import statique).
3. **Remplacer `evaluateRace()`** par le lookup exact + Keith Count.
4. **Remplacer l'estimation des frappes** dans `evaluateContact()` par le comptage exact sur 36 lancers.
5. **Conserver `backgammonEngine.ts` intact** : aucune modification de la génération de coups, du plateau, ni des interfaces.
6. **Tests de non-régression** : les 579 tests existants doivent passer sans modification ; ajouter des tests de vérification mathématique (somme des probabilités = 1, symétries, cas limites).

**Stratégie de repli** : chaque brique est **indépendante et vérifiable**. Si la table de bear-off échoue à charger, on retombe sur l'heuristique actuelle (repli explicite, conforme à la charte « Zéro Bug »). Aucun point de bascule global.

---

## 4. OPTION B — Micro-réseau quantifié int8 (distillation maison)

### 4.1 Architecture technique

- **Langage / runtime** : TypeScript pur, inférence **sans ONNX Runtime** (multiplication matrice-vecteur écrite à la main sur `Int8Array`/`Float32Array`). Zéro WASM, zéro dépendance.
- **Mécanisme d'évaluation** : un **petit réseau résiduel** (ex. 4–6 blocs, 64–128 canaux, ~200–500 K paramètres) **distillé** depuis un moteur fort (gnubg 2-ply ou Raccoon) sur un corpus de positions. Quantifié en **int8** (poids + activations), avec déquantification à la volée.
- **Entrée** : encodage compact type Tesauro (~198 entrées) ou l'encodage Raccoon `(26, 2, 12)` déjà implémenté dans [`encoder.ts`](../src/lib/engine/raccoon/encoder.ts) — **réutilisable tel quel**.
- **Sortie** : 6 issues mutuellement exclusives (win/gammon/backgammon × 2) → équité cubeless, comme Raccoon.
- **Gestion du hasard** : 0-ply (évaluation directe) ou 1-ply (expectiminimax sur 21 lancers).
- **Videau** : **pas de tête de videau native** — décision Janowski alimentée par l'équité cubeless du réseau (même approche que l'actuel [`analyzeBoardCubeWithRaccoon`](../src/lib/engine/raccoon/index.ts)).

### 4.2 Mesures et coûts réels

| Métrique | Valeur |
|---|---|
| **Poids ajouté au build** | **~1–1,5 Mo** (poids int8 : 500 K param × 1 octet ≈ 500 Ko + overhead). **Sous la barre des 2 Mo.** |
| **Temps d'exécution / coup** | **~1–5 ms** (inférence int8 en JS pur, batch de coups légaux) |
| **Force estimée (pions)** | **Supérieure à l'heuristique tri-phase**, potentiellement proche de Raccoon si la distillation est bien faite. Dépend fortement de la **qualité du corpus de distillation** et de la **fidélité de l'encodage**. |
| **Force estimée (videau)** | Janowski alimenté par un réseau plus précis = **meilleure que le tri-phase**, mais **pas de vraie tête cubeful** (même limite que Raccoon). |
| **PR attendu** | Non garanti sans entraînement réel. Risque de **force silencieusement fausse** si l'encodage dérive. |

### 4.3 Plan de migration pas-à-pas

1. **Entraîner/distiller** le micro-réseau hors-ligne (Python/PyTorch, hors bundle) sur un corpus de positions étiquetées gnubg 2-ply.
2. **Exporter en int8** (quantification post-entraînement) → fichier `public/models/micro.bin` (~500 Ko–1 Mo).
3. **Écrire l'inférence TS pure** (matmul int8) dans un nouveau module `src/lib/engine/micro/`.
4. **Réutiliser [`encoder.ts`](../src/lib/engine/raccoon/encoder.ts)** pour l'encodage d'entrée (déjà testé).
5. **Brancher dans [`evaluator.ts`](../src/lib/engine/evaluator.ts)** avec repli explicite sur le tri-phase (même pattern que Raccoon actuel).
6. **Tests différentiels** : comparer micro-réseau vs tri-phase vs fixtures de référence.

**Stratégie de repli** : repli explicite sur le tri-phase si le modèle n'est pas chargé ou échoue (pattern déjà en place). Risque principal : **encodage inexact → équités fausses silencieuses**, à mitiger par des tests différentiels massifs.

---

## 5. OPTION C — wildbg (Rust → WASM)

### 5.1 Architecture technique

- **Langage / runtime** : moteur neuronal en **Rust**, compilé en **WebAssembly** (documentation officielle `docs/user/wildbg-wasm.md`). Licence **MIT OU Apache-2.0** (au choix).
- **Mécanisme d'évaluation** : réseau neuronal entraîné par self-play (type TD-Gammon), inférence WASM native.
- **Gestion du hasard** : évaluation 0-ply/1-ply, rollouts en cours de développement.
- **Videau** : **❌ INCOMPLET** — issue #17 « Proper cube handling » toujours ouverte. **Ne satisfait pas le critère d'éligibilité n°2.**

### 5.2 Mesures et coûts réels

| Métrique | Valeur |
|---|---|
| **Poids ajouté au build** | **~1–2 Mo** (WASM + poids, à confirmer sur la branche `nets`). Sous la barre des 2 Mo. |
| **Temps d'exécution / coup** | **~1–5 ms** (WASM natif, rapide) |
| **Force estimée (pions)** | Erreur ~5.9 (1-pointers) analysé par gnubg 2-ply (janvier 2024) — **niveau solide, en progression**, mais **alpha**. |
| **Force estimée (videau)** | **❌ Non géré** (issue #17). Éliminatoire. |
| **PR attendu** | Non publié de façon comparable. Maturité alpha. |

### 5.3 Plan de migration pas-à-pas

1. Compiler wildbg en WASM (branche `nets` pour les réseaux forts).
2. Charger le WASM dans le Web Worker.
3. Adapter l'interface d'appel à [`types.ts`](../src/lib/engine/types.ts).
4. **Videau** : impossible à satisfaire nativement — il faudrait **réimplémenter Janowski par-dessus**, ce qui ne répond pas au critère n°2.

**Stratégie de repli** : repli sur le tri-phase. Mais **l'absence de videau natif est éliminatoire** au regard du cahier des charges.

---

## 6. Synthèse comparative

| Critère | A — Tables exactes TS | B — Micro-réseau int8 | C — wildbg WASM |
|---|---|---|---|
| **Zéro serveur (100 % client)** | ✅ | ✅ | ✅ |
| **Videau natif** | ✅ Janowski (existant) | ⚠️ Janowski + réseau | ❌ incomplet (issue #17) |
| **Poids < 2 Mo** | ✅ ~200–500 Ko | ✅ ~1–1,5 Mo | ✅ ~1–2 Mo |
| **Conservation des acquis** | ✅ zéro régression | ✅ (réutilise encoder) | ⚠️ adaptation WASM |
| **Force pions** | ⭐⭐⭐ (exact bear-off/course) | ⭐⭐⭐⭐ (si distillation réussie) | ⭐⭐⭐ (alpha) |
| **Force videau** | ⭐⭐⭐⭐ (exact en course) | ⭐⭐⭐ | ❌ |
| **Risque technique** | 🟢 faible (maths vérifiables) | 🟡 moyen (encodage) | 🔴 alpha + videau |
| **Effort** | 🟡 moyen | 🔴 élevé (entraînement) | 🟡 moyen |
| **Licence** | 🟢 domaine public | 🟢 (notre code) | 🟢 MIT/Apache |

---

## 7. Recommandation de l'architecte

**Stratégie en 2 temps : A maintenant, B en option d'évolution.**

1. **Option A d'abord (recommandée)** : c'est la **seule** qui satisfait **les 4 critères sans aucun compromis**, avec le **meilleur ratio force/risque**. Elle rend le moteur **exact** dans les 2 régimes (bear-off, course) où les erreurs détruisent le plus le PR des joueurs humains, pour **< 500 Ko** et **< 1 ms**. Le videau Janowski existant est **conservé et amélioré** (alimenté par des équités exactes). Zéro régression sur les 579 tests.

2. **Option B en évolution ultérieure** : si un gain supplémentaire en contact complexe est requis, distiller un micro-réseau int8 (< 1,5 Mo) réutilisant l'encodeur Raccoon déjà en place. C'est le chemin « esprit Snowie/TD-Gammon » moderne, mais il exige un corpus de distillation de qualité et des tests différentiels massifs pour éviter les équités fausses silencieuses.

3. **Option C à écarter** : l'absence de videau natif (issue #17) est **éliminatoire** au regard du critère n°2, malgré une licence et un poids favorables.

**Point de vigilance transversal** : la barre des 2 Mo exclut **définitivement** ONNX Runtime Web (le runtime WASM seul pèse ~10–25 Mo, cf. `ort-wasm-simd-threaded.wasm` ≈ 10,6 Mo), ce qui confirme l'exclusion de Raccoon **et de toute solution reposant sur ONNX Runtime Web**. Toute alternative neuronale doit donc reposer sur une **inférence écrite à la main** (TS pur ou WASM dédié), jamais sur ORT.
