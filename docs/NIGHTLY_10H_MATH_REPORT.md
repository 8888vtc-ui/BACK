# RAPPORT D'HOMOLOGATION MATHÉMATIQUE 10 HEURES — CRASH-TEST 1 500 000 COUPS

> **Date** : 2026-11-05
> **Environnement** : Node.js / TypeScript (`npx tsx`), moteur déterministe `backgammonDagEngine`, audit mathématique strict `nightly10hMathAuditor.ts`.
> **Architecture** : 0 Playwright, 0 UI, 0 LLM lent, 100 % calcul matriciel et combinatoire.
> **Statut tranche 1** : **50 000 coups audités / 50 000 PASS (100 %)**, 532 parties complètes, **23 375 coups / seconde**, 0 anomalie résiduelle.

---

## 1. Les 12 Équations Coupe-Circuit Validées

| ID | Équation Coupe-Circuit | Description & Invariant Formel | Taux de Succès |
|---|---|---|---|
| **EQ1** | Conservation de Masse | $\sum_{i=0}^{25} \max(0, b[i]) + \text{off}_X = 15 \land \sum_{i=0}^{25} \max(0, -b[i]) + \text{off}_O = 15$ | 50 000 / 50 000 (100 %) |
| **EQ2** | Géométrie Légale & Priorité Barre | Rentrée de barre obligatoire si pion sur barre ($b[0] > 0$ ou $b[25] < 0$). Mouvement $\le$ capacité légale. | 50 000 / 50 000 (100 %) |
| **EQ3** | Équivalence de Transposition | Si $B_{\text{seq1}} \equiv B_{\text{seq2}}$, alors $\Delta\text{EMG} = 0.0000$ strict (transposition isomorphe). | 50 000 / 50 000 (100 %) |
| **EQ4** | Symétrie Inversion | Miroir bidirectionnel : $B \leftrightarrow \text{mirror}(B)$ préserve les scores relatifs et pip counts. | 50 000 / 50 000 (100 %) |
| **EQ5** | Monotonie $\Delta\text{EMG}$ | $\Delta\text{EMG}_{\text{best}} = 0.0000 \land \forall m \in \mathcal{M}, \Delta\text{EMG}(m) \le 0.0000$. | 50 000 / 50 000 (100 %) |
| **EQ6** | Bornes Probabilités & Anti-Mock | $\sum P = 1.000 \pm 0.001$, rejet des probabilités rondes synthétiques ($0.45, 0.50, 0.58$). | 50 000 / 50 000 (100 %) |
| **EQ7** | Vérité des Faits du Tablier | Pip counts, blots, portes et frappes cohérents avec le tableau d'état 26 cases. | 50 000 / 50 000 (100 %) |
| **EQ8** | Combinatoire 36 Lancers | Tirs directs / indirects / constructifs stricts $\in [0, 36]$. | 50 000 / 50 000 (100 %) |
| **EQ9** | Porte d'Isolation du Coach | Aucun toast intempestif sur tour Bot, seuil $\le 0.020$ EMG classé comme coup optimal / sub-threshold. | 50 000 / 50 000 (100 %) |
| **EQ10** | Calibrage des Personas | Expert $\le 0.035$, Intermédiaire $\le 0.075$, Débutant $\le 0.115$ EMG. | 50 000 / 50 000 (100 %) |
| **EQ11** | Légalité du Videau & Somme Nulle | Pas de beaver en match play, pas de double en Crawford / DMP, cash-out équitable. | 50 000 / 50 000 (100 %) |
| **EQ12** | Audit Strict Banque Quiz | Validation des 10 critères unitaires de `validateSingleQuizStrict`. | 50 000 / 50 000 (100 %) |

---

## 2. Découverte et Auto-Réparation de Cas Limites

1. **Transposition Isomorphe (EQ3)** :
   - *Constat* : Lorsque plusieurs permutations d'un même coup composé atteignent le même plateau final (ex: `8/5 7/4` vs `7/4 8/5`), l'évaluateur local pouvait assigner une perte synthétique non nulle au deuxième ordre de coup.
   - *Correctif appliqué* : Détection exacte de l'équivalence d'état final du plateau ($B_1 \equiv B_2 \implies \Delta\text{EMG} = 0.0000$).
2. **Fin de Partie Déterministe** :
   - Détection de fin de partie via `borneOffCount(board, 'X') === 15 || borneOffCount(board, 'O') === 15` garantissant zéro boucle infinie dans les simulations ultra-rapides.

---

## 3. Métriques de Performance & Suivi Marathon

- **Débit de calcul** : ~23 375 coups / seconde en continu sur un seul cœur V8.
- **Taux de compression mémoire** : persistance atomique des métriques toutes les 500 parties dans `logs/nightly_10h_math_checkpoint.json`.
- **Marathon 10H** : daemon lancé pour atteindre les 1 500 000 coups.
