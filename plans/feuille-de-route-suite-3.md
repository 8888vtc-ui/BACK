# Feuille de route — Suite (après P1 + P2)

> **État** : bear-off exact (PR 0.00), course Keith, contact tri-phase (maillon faible), coach précis (tirs exacts), IA alignée sur le coach. 619 tests verts.

---

## Priorité 1 — Améliorer le régime CONTACT (gain de force maximal)

**Pourquoi** : le contact (PR ~8-12) est le dernier maillon faible. `evaluateContact()` dans [`evaluator.ts`](../src/lib/engine/evaluator.ts) utilise `countShotsOnBlot` avec la **même approximation** que celle corrigée dans le coach (pondération 0.5 pour tir indirect, pions sur la barre non comptés).

**Actions** :
1. **Remplacer `countShotsOnBlot`** par le comptage exact des 36 lancers (déjà implémenté dans [`featureExtractor.ts`](../src/features/coach/featureExtractor.ts) — factoriser la logique).
2. **Calibrer les coefficients** de `evaluateContact` sur des positions de référence publiées (au lieu de valeurs arbitraires).
3. **1-ply expectiminimax** en contact (évaluer les 21 lancers adverses, < 5 ms).

**Impact** : PR global ↓, cohérence avec le coach (même comptage exact).

---

## Priorité 2 — Mettre à jour la documentation (cohérence)

**Pourquoi** : [`README.md`](../README.md) et [`CONTRIBUTING.md`](../CONTRIBUTING.md) mentionnent « 552 tests » (réel : 619). [`PROJECT_MAP.md`](../PROJECT_MAP.md) décrit `xgEngine.worker.ts` comme actif alors qu'il est en cours de dev.

**Actions** :
1. Mettre à jour les compteurs de tests (619 tests / 104 fichiers).
2. Corriger l'état des workers dans `PROJECT_MAP.md`.

---

## Priorité 3 — Optimiser la CI (simulation PR)

**Pourquoi** : la simulation PR (`simulatePR.test.ts`) prend ~38s, trop lourd pour la CI régulière.

**Actions** :
1. Réduire le corpus (3 matchs) pour la CI, garder 10 matchs en mesure ponctuelle.
2. Marquer le test comme « slow » (exclu du run par défaut).

---

## Synthèse

| Priorité | Action | Gain | Risque |
|---|---|---|---|
| 1 | Améliorer le contact (frappes exactes + calibration) | ⭐⭐⭐⭐⭐ | 🟡 moyen |
| 2 | Mettre à jour la documentation | ⭐⭐ | 🟢 faible |
| 3 | Optimiser la CI | ⭐⭐ | 🟢 faible |

**Recommandation** : exécuter **Priorité 1 d'abord** (frappes exactes dans `evaluateContact`), car c'est le gain de force le plus important, et il **factorise** la logique déjà écrite dans le coach (pas de duplication).
