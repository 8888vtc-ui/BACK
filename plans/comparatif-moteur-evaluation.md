# Comparatif — Remplacer l'heuristique par un moteur de niveau GNU Backgammon

> **Contexte** : l'évaluation actuelle ([`src/lib/engine/evaluator.ts`](../src/lib/engine/evaluator.ts)) est un moteur tri-phase à coefficients calibrés. Elle est honnête, rapide (< 1 ms) et 100 % autonome, mais sa précision en positions de contact complexes reste inférieure à un vrai moteur neuronal (GNU Backgammon, eXtreme Gammon).
>
> **Objectif** : combler cet écart de précision. Trois options s'offrent à nous, avec des compromis radicalement différents.

---

## OPTION A — Brancher le vrai binaire GNU Backgammon (backend Python existant)

### Principe
Le microservice [`backend-engine/`](../backend-engine) existe déjà et est **complet** :
- [`gnubg_client.py`](../backend-engine/app/gnubg_client.py) pilote le vrai binaire `gnubg -t` (sous-processus).
- [`gnubg_pool.py`](../backend-engine/app/gnubg_pool.py) gère un pool de workers.
- [`parsers.py`](../backend-engine/app/parsers.py) parse la sortie réelle de gnubg (chequerplay + cube decision).
- Tests d'intégration contre le VRAI binaire ([`test_integration_gnubg.py`](../backend-engine/tests/test_integration_gnubg.py)).
- Le routage hybride existe déjà côté frontend : [`analysisService.ts`](../src/lib/analysisService.ts) tente le backend puis bascule sur le moteur local, et [`src/app/api/evaluate/route.ts`](../src/app/api/evaluate/route.ts) fait de même.

**Il ne manque que le déploiement** : construire le Docker ([`Dockerfile`](../backend-engine/Dockerfile) qui installe gnubg via apt), l'héberger (Railway, Fly.io, VPS…), et renseigner `GNUBG_BACKEND_URL`.

### Évaluation

| Critère | Note | Détail |
|---|---|---|
| **Précision** | ⭐⭐⭐⭐⭐ | La référence mondiale. Équité, PR, rollouts exacts. C'est LE standard contre lequel tous les joueurs de tournoi mesurent leur PR. |
| **Coût** | ⭐⭐ | Serveur obligatoire : ~5–15 $/mois (Railway/Fly.io) ou VPS. Contredit la promesse « 100 % gratuit et autonome sur Netlify ». |
| **Autonomie** | ⭐⭐ | Dépend d'un serveur externe. MAIS le repli local existe déjà : si le serveur tombe, l'app bascule sur le moteur tri-phase sans planter. |
| **Effort** | 🟢 FAIBLE | Le code est écrit et testé. Reste : déployer le conteneur, configurer l'URL, valider en conditions réelles. Aucun nouveau code métier. |
| **Latence** | ⚠️ | 1–2 s par évaluation (démarrage process gnubg + chargement poids NN). Inadapté au coach temps réel coup par coup ; parfait pour l'analyse post-partie et les rollouts. |
| **Risque** | 🟢 | Quasi nul techniquement (code existant testé). Risque produit : dépendance infra. |

---

## OPTION B — Embarquer un vrai réseau de neurones dans le navigateur (WASM / TS)

### Principe
Exécuter l'inférence neuronale **localement dans le navigateur**, sans serveur. Deux sous-variantes :

- **B1 — Compiler gnubg en WASM** : porter le code C de gnubg (glib, libxml2, sqlite…) via Emscripten. C'est ce que l'ADR-001 original promettait (`/engine/gnubg.wasm`) — et ce fichier n'a jamais existé, car ce portage est un chantier lourd.
- **B2 — Réimplémenter l'inférence en TS + poids gnubg** : coder en TypeScript l'encodage d'entrée exact de gnubg (~200 entrées par position, documenté uniquement dans le source C `eval.c`), les 3 réseaux (contact, race, crashed) + les bases de bear-off, et charger le fichier de poids réel `gnubg.weights` (~7 Mo).

### Évaluation

| Critère | Note | Détail |
|---|---|---|
| **Précision** | ⭐⭐⭐⭐ | Équivalent gnubg 0-ply/1-ply (très fort, quasi niveau expert) si l'encodage est fidèle. En pratique, atteindre la fidélité exacte de `eval.c` est très difficile. |
| **Coût** | ⭐⭐⭐⭐⭐ | Zéro serveur. ~7 Mo de poids servis en statique (Netlify gratuit). |
| **Autonomie** | ⭐⭐⭐⭐⭐ | 100 % local, hors-ligne, instantané. |
| **Effort** | 🔴 TRÈS ÉLEVÉ | B1 : compilation Emscripten d'un projet C avec dépendances lourdes — risque d'échec élevé. B2 : rétro-ingénierie de l'encodage neuronal de gnubg (centaines d'entrées, ordre exact, normalisations) — le moindre écart produit des équités fausses **silencieusement**. |
| **Licence** | ⚠️ CRITIQUE | gnubg et ses poids sont **GPLv2+**. Les embarquer dans l'app oblige à publier l'intégralité du code sous GPL (contamination). À valider juridiquement AVANT tout développement. |
| **Risque** | 🔴 | Élevé : bugs d'encodage indétectables sans comparer des milliers de positions contre le vrai gnubg ; problème de licence. |

---

## OPTION C — Tables de référence exactes + heuristique améliorée (100 % local)

### Principe
Remplacer les coefficients arbitraires par des **mathématiques exactes et vérifiables**, sans réseau de neurones :

1. **Base de bear-off EXACTE** : les 54 264 positions à un côté (15 pions sur 6 flèches) sont énumérables. On calcule pour chacune la probabilité exacte de sortir en 1, 2, 3… lancers (récursion dynamique). Fichier généré ~200–500 Ko (Uint16 quantifié). **C'est mathématiquement exact — meilleur que gnubg lui-même en bear-off** (gnubg utilise la même approche par base de données).
2. **Course (race) — Keith Count complet** : la règle de Keith/Thorp est documentée et validée publiquement (~90 % de décisions take/drop correctes). Remplace l'approximation actuelle de [`evaluateRace()`](../src/lib/engine/evaluator.ts).
3. **Contact — tables de frappe EXACTES sur 36 combinaisons** : au lieu d'estimer les tirs, on énumère les 36 lancers et on compte exactement combien frappent chaque blot (calcul déterministe, déjà partiellement présent dans [`featureExtractor.ts`](../src/features/coach/featureExtractor.ts) via `countShots`).
4. **Calibration sur positions de référence** : ajuster les coefficients restants sur un jeu de positions publiées avec équités connues (ouvrages de référence, positions de test gnubg documentées).

### Évaluation

| Critère | Note | Détail |
|---|---|---|
| **Précision** | ⭐⭐⭐ | **Exacte** en bear-off et course (les 2 régimes où les erreurs coûtent le plus cher en PR). En contact complexe (blitz, backgame), reste en dessous de gnubg — mais nettement au-dessus de l'heuristique actuelle. Niveau « joueur de club avancé/expert ». |
| **Coût** | ⭐⭐⭐⭐⭐ | Zéro. Fichiers générés < 500 Ko, servis en statique. |
| **Autonomie** | ⭐⭐⭐⭐⭐ | 100 % local, < 1 ms, hors-ligne, conforme à la charte [`GOVERNANCE.md`](../GOVERNANCE.md). |
| **Effort** | 🟡 MOYEN | Générateur de base de bear-off (script Node/TS, récursion sur 54 264 positions) + intégration dans `evaluateRace`/`evaluateContact` + tests de non-régression. Mathématiques connues et publiées, aucun reverse-engineering. |
| **Licence** | 🟢 | Aucun problème : les maths (Keith, Thorp) sont du domaine public, le code est le nôtre. |
| **Risque** | 🟢 | Faible : chaque table est vérifiable mathématiquement (somme des probabilités = 1, symétries, cas limites testables). |

---

## SYNTHÈSE COMPARATIVE

| Critère | A — Backend gnubg | B — NN embarqué WASM/TS | C — Tables exactes locales |
|---|---|---|---|
| Précision contact | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ (si fidèle) | ⭐⭐⭐ |
| Précision bear-off/course | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ (exact) |
| Coût infra | 5–15 $/mois | 0 | 0 |
| Autonomie / hors-ligne | ❌ (repli local ✅) | ✅ | ✅ |
| Effort | 🟢 Faible (déjà codé) | 🔴 Très élevé | 🟡 Moyen |
| Risque technique | 🟢 | 🔴 (encodage silencieux faux) | 🟢 |
| Risque licence GPL | 🟢 (serveur séparé) | 🔴 Critique | 🟢 |
| Latence | 1–2 s | < 10 ms | < 1 ms |
| Conforme « Netlify gratuit sans serveur » | ❌ | ✅ | ✅ |

## RECOMMANDATION DE L'ARCHITECTE

**Stratégie en 2 temps : C maintenant, A en option premium plus tard.**

1. **Option C d'abord** : c'est le seul choix qui respecte à la fois la contrainte produit (« 100 % autonome et gratuit sur Netlify »), la charte de gouvernance (zéro risque, maths vérifiables) et qui apporte le plus gros gain de précision immédiat — car les erreurs de bear-off et de course sont celles qui détruisent le PR des joueurs humains. Le moteur devient **exact** dans 2 des 3 régimes.

2. **Option A en complément optionnel** (plus tard, si besoin) : l'architecture hybride est déjà codée ([`analysisService.ts`](../src/lib/analysisService.ts)). Si un jour tu veux des rollouts de référence ou une analyse post-partie « niveau Galaxy », il suffira de déployer le conteneur existant — sans toucher au frontend.

3. **Option B : à écarter** — effort maximal, risque de licence GPL critique, et risque de bugs d'encodage silencieux incompatibles avec la charte « Zéro Bug ».
