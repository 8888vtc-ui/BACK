# Analyse du « reste » du logiciel (hors moteur WASM en cours de dev)

> **Contexte** : le moteur Grand-Maître WASM (`xgEngine.worker.ts`) est en cours de test/dev par ailleurs — hors périmètre. Cette analyse couvre les autres chantiers de valeur produit et de consolidation.

---

## 1. État des domaines fonctionnels (vérifié)

| Domaine | Fichiers | Tests | État |
|---|---|---|---|
| **Coach** | [`featureExtractor.ts`](../src/features/coach/featureExtractor.ts), `moveClassifier.ts`, `prompts.ts`, `matchContext.ts`, `explanationCache.ts` | ✅ 6 fichiers de test | Solide |
| **Multiplayer** | `actionValidator.ts`, `elo.ts`, `matchmakingQueue.ts`, `realtimeChannel.ts`, `roomService.ts`, `sessionRecovery.ts`, `clockManager.ts` | ✅ 7 fichiers de test | Solide |
| **Drills** | `blunderBank.ts`, `blunderDrillEngine.ts`, `benchmarkBlunders.ts` | ✅ 3 fichiers de test | Solide |
| **Puzzles** | `puzzleDatabase.ts`, `puzzleEngine.ts`, `puzzleStorage.ts` | ✅ 3 fichiers de test | Solide |
| **Rating** | `ratingCalculator.ts`, `gameAnalyzer.ts`, `gameAnalysisStorage.ts` | ✅ 3 fichiers de test | Solide |
| **API** | `coach`, `evaluate`, `rollout`, `health`, `multiplayer/validate-action` | ✅ tests par route | Solide |

**Constat** : le code est **propre** (zéro TODO/FIXME/deprecated), bien structuré par domaine, et largement testé (614 tests unitaires + 27 e2e).

---

## 2. Points d'amélioration identifiés (hors WASM)

### 🟠 P1 — Précision du coach : comptage exact des tirs

**Fichier** : [`featureExtractor.ts`](../src/features/coach/featureExtractor.ts)

**Problème** : le comptage des tirs (`BlotAnalysis`) a une **simplification assumée** (ligne 16-18) : les pions adverses sur la barre ne sont pas comptés comme menaces directes, et les tirs indirects sont approximés.

**Amélioration** : compter exactement les 36 lancers qui frappent chaque blot, en incluant les pions sur la barre (qui rentrent sur 1-6). Cohérent avec la Priorité 1 de la feuille de route précédente (frappes exactes).

**Impact** : explications du coach plus précises, meilleure détection des blunders de sécurité.

### 🟡 P2 — Cohérence de force IA vs coach

**Problème** : l'adversaire IA (`aiHeuristics.ts`) est plus faible que le coach (`evaluator.ts`). Le coach signale des erreurs que l'IA adverse commet elle-même.

**Amélioration** (sans toucher au WASM) : faire jouer l'adversaire IA avec `evaluator.ts` (bear-off exact + Keith) au lieu de `aiHeuristics.ts`, pour aligner la force de l'IA sur celle du coach.

### 🟡 P3 — Documentation obsolète

**Problème** : [`README.md`](../README.md) mentionne « 552 tests » (réel : 614), et [`PROJECT_MAP.md`](../PROJECT_MAP.md) décrit `xgEngine.worker.ts` comme actif alors qu'il est en cours de dev.

**Amélioration** : mettre à jour les compteurs de tests et l'état des workers.

### 🟢 P4 — Optimisation CI

**Problème** : la simulation PR (`simulatePR.test.ts`) prend ~38s, trop lourd pour la CI régulière.

**Amélioration** : réduire le corpus (3 matchs) pour la CI, garder 10 matchs en mesure ponctuelle.

---

## 3. Matrice de priorisation (hors WASM)

| Priorité | Chantier | Impact | Effort | Risque | Verdict |
|---|---|---|---|---|---|
| **P1** | Comptage exact des tirs (coach) | ⭐⭐⭐⭐ | 🟢 faible | 🟢 faible | Recommandé |
| **P2** | Aligner IA sur le coach (bear-off + Keith) | ⭐⭐⭐ | 🟡 moyen | 🟡 moyen | Recommandé |
| **P3** | Mettre à jour la documentation | ⭐⭐ | 🟢 faible | 🟢 faible | Secondaire |
| **P4** | Optimiser la CI (simulation PR) | ⭐⭐ | 🟢 faible | 🟢 faible | Secondaire |

---

## 4. Recommandation

**Exécuter P1 en premier** : le comptage exact des tirs dans [`featureExtractor.ts`](../src/features/coach/featureExtractor.ts) améliore directement la qualité du coach (le cœur de la valeur produit), pour un coût faible et sans toucher au moteur WASM en cours de dev.

**P2 ensuite** : aligner la force de l'adversaire IA sur celle du coach, pour une expérience cohérente.

**P3-P4** : consolidation (docs, CI).
