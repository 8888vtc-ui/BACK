# Analyse & Priorisation Logicielle — Backgammon Pro

> **Objectif** : analyser l'état réel du logiciel et établir la priorité des chantiers pour maximiser la valeur produit et la fiabilité.

---

## 1. État réel de l'architecture (vérifié dans le code)

### Les 3 moteurs d'IA parallèles (fragmentation critique)

| Moteur | Fichier | Rôle réel | Force | Branché ? |
|---|---|---|---|---|
| **Heuristique IA** | [`aiHeuristics.ts`](../src/engine/aiHeuristics.ts) | Fait jouer l'**adversaire IA** (0/1/2-ply) | Club avancé | ✅ Oui (via `useBackgammonGame.ts`) |
| **Évaluateur tri-phase + bear-off + Keith** | [`evaluator.ts`](../src/lib/engine/evaluator.ts) | **Coach / analyse** (bear-off exact PR 0.00, course Keith) | Expert (bear-off/course) | ✅ Oui (coach, worker `gnubg.worker.ts`) |
| **Moteur Grand-Maître WASM 2-ply** | [`xgEngine.worker.ts`](../src/workers/xgEngine.worker.ts) | Moteur Rust→WASM SIMD 2-ply | **Grand-Maître** | ❌ **NON branché** (seulement son test) |

**Problème central** : le moteur le plus fort (`xgEngine.worker.ts`, WASM 2-ply) est **développé mais déconnecté**. Les fichiers binaires existent (`public/engine/xg_web_core.wasm`, `weights_xg_web.bin`), mais aucun code applicatif ne l'importe. L'adversaire IA joue avec l'heuristique la plus faible, et le coach utilise un moteur différent.

### Conséquence

- **Incohérence de force** : l'adversaire IA (heuristique) est plus faible que le coach (bear-off exact + Keith). Un joueur voit le coach signaler des erreurs que l'IA adverse commet elle-même.
- **Gaspillage** : le moteur WASM Grand-Maître (le plus gros investissement) est inutilisé.

---

## 2. Priorisation logicielle (par valeur produit)

### 🔴 P0 — Unifier les moteurs d'IA (cohérence + force)

**Pourquoi** : c'est le problème structurel n°1. Trois moteurs parallèles = incohérence de force, code dupliqué, et le meilleur moteur inutilisé.

**Actions** :
1. **Brancher `xgEngine.worker.ts`** au jeu (adversaire IA + coach) avec repli sur `evaluator.ts`.
2. **Unifier** : un seul point d'entrée d'évaluation (`evaluateBoard` / `analyzeBoardMoves`) qui route vers WASM si dispo, sinon tri-phase.
3. **Supprimer ou déprécier `aiHeuristics.ts`** (redondant avec `evaluator.ts`).

### 🟠 P1 — Améliorer le régime CONTACT (force du coach)

**Pourquoi** : le contact (PR ~8-12) est le maillon faible du coach. Les frappes exactes sur 36 lancers + calibration sur positions de référence réduiraient le PR global.

### 🟡 P2 — Mesurer le PR réel (chiffre objectif)

**Pourquoi** : le PR auto-référencé = 0 ne mesure pas la force. Utiliser gnubg (backend) **en dev uniquement** pour étiqueter un corpus et mesurer le PR objectif.

### 🟢 P3 — Consolidation (DX, docs, CI)

- Optimiser la simulation PR pour la CI (corpus réduit).
- Mettre à jour `PROJECT_MAP.md` (mentionne `xgEngine.worker.ts` comme actif alors qu'il ne l'est pas).
- Videau cubeful complet (table MET Kazaross-XG2).

---

## 3. Matrice de priorisation

| Priorité | Chantier | Impact | Effort | Risque | Verdict |
|---|---|---|---|---|---|
| **P0** | Unifier les 3 moteurs (brancher WASM) | ⭐⭐⭐⭐⭐ | 🟡 moyen | 🟡 moyen | **URGENT** |
| **P1** | Améliorer le contact (frappes exactes) | ⭐⭐⭐⭐ | 🟢 faible | 🟢 faible | Recommandé |
| **P2** | Mesurer PR réel vs gnubg (dev) | ⭐⭐⭐ | 🟢 faible | 🟢 faible | Recommandé |
| **P3** | Consolidation (docs, CI, videau cubeful) | ⭐⭐ | 🟢 faible | 🟢 faible | Secondaire |

---

## 4. Recommandation

**Exécuter P0 en premier** : brancher le moteur WASM Grand-Maître (`xgEngine.worker.ts`) au jeu et au coach, avec repli sur `evaluator.ts`. C'est le chantier qui apporte le plus de valeur (force Grand-Maître + cohérence) et qui résout la fragmentation structurelle. Sans P0, les améliorations du coach (P1) restent incohérentes avec un adversaire IA plus faible.

**P1 ensuite** : améliorer le contact pour réduire le PR résiduel du coach.

**P2-P3** : consolidation et mesure objective.
