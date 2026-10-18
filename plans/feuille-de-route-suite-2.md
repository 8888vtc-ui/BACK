# Feuille de route — Suite recommandée (après Option A + simulation PR)

> **État actuel** : bear-off exact (PR 0.00), course Keith Count (PR ~2-4), contact tri-phase (PR ~8-12). Le maillon faible est le **régime CONTACT**, qui représente la majorité des décisions d'un match réel.

---

## Constat

Le moteur est désormais **exact dans 2 des 3 régimes** (bear-off, course). Le régime **CONTACT** reste une heuristique à 16 caractéristiques calibrées manuellement ([`evaluateContact()`](../src/lib/engine/evaluator.ts)), dont les coefficients sont des approximations. C'est là que se concentre le PR résiduel (~8-12).

---

## Priorité 1 — Améliorer le régime CONTACT (gain de force maximal)

**Pourquoi** : c'est le seul régime où le moteur reste « joueur de club avancé » au lieu d'« expert ». Améliorer le contact est le levier n°1 pour réduire le PR global.

**Pistes concrètes (par ordre de coût/bénéfice)** :

1. **Frappes exactes sur 36 lancers** : remplacer l'estimation `countShotsOnBlot` (pondération 0.5 pour tir indirect) par un comptage exact des 36 combinaisons de dés qui frappent chaque blot. Déterministe, vérifiable, ~0 coût de poids.
2. **Tables de référence de contact** : calibrer les coefficients de `evaluateContact` sur un corpus de positions publiées avec équités gnubg/XG connues (au lieu de valeurs arbitraires).
3. **1-ply expectiminimax en contact** : évaluer les 21 lancers adverses pour affiner l'équité (coût ~21× l'évaluation, mais < 5 ms en TS pur).

---

## Priorité 2 — Mesurer le PR réel contre une référence (hors-ligne, optionnel)

**Pourquoi** : le PR auto-référencé = 0 ne mesure pas la force réelle. Pour un chiffre objectif, il faut une référence gnubg/XG.

**Piste** : utiliser le backend [`backend-engine/`](../backend-engine) (gnubg 2-ply) **uniquement en développement** (pas en production) pour étiqueter un corpus de positions, puis mesurer le PR du moteur local contre ces étiquettes. Cela ne contredit pas le 100 % client-side (la référence n'est utilisée qu'à la conception, jamais au runtime).

---

## Priorité 3 — Optimiser la simulation PR (performance CI)

**Pourquoi** : la simulation prend ~38s pour 10 matchs, trop lourd pour la CI régulière.

**Pistes** :
1. Réduire le corpus (ex. 3 matchs au lieu de 10) pour la CI, garder 10 matchs en mesure ponctuelle.
2. Marquer le test `simulatePR.test.ts` comme « slow » (exclu du run par défaut, exécuté manuellement).

---

## Priorité 4 — Videau cubeful complet (au-delà de Janowski)

**Pourquoi** : le videau actuel est Janowski (seuils fixes) + Keith (course). Un vrai modèle cubeful (équité cubeful par position) améliorerait les décisions de double/take/pass en contact.

**Piste** : table MET (Match Equity Table) Kazaross-XG2 pour le match play, déjà mentionnée dans l'ADR-007.

---

## Synthèse

| Priorité | Action | Gain | Risque |
|---|---|---|---|
| 1 | Améliorer le contact (frappes exactes + calibration) | ⭐⭐⭐⭐⭐ (PR global ↓) | 🟡 moyen |
| 2 | Mesurer PR réel vs gnubg (dev only) | ⭐⭐⭐⭐ (chiffre objectif) | 🟢 faible |
| 3 | Optimiser simulation PR (CI) | ⭐⭐ (DX) | 🟢 faible |
| 4 | Videau cubeful complet | ⭐⭐⭐ (décisions cube) | 🟡 moyen |

**Recommandation** : exécuter **Priorité 1 d'abord** (frappes exactes sur 36 lancers), car c'est le gain de force le plus important pour le coût le plus faible, et il s'intègre sans casser `backgammonEngine.ts` ni les 614 tests existants.
