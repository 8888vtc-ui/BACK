# Audit de Jouabilité — Backgammon Pro

> **Objectif** : analyser la jouabilité (expérience utilisateur, interactions, accessibilité) et identifier les points de friction à corriger.

---

## 1. Constat majeur : les tests e2e de jouabilité sont désactivés

L'audit révèle que **les flux critiques de jouabilité ne sont pas réellement testés en e2e** — ils sont marqués `test.skip` / `test.describe.skip` car « fragiles » ou « sélecteurs obsolètes ».

| Fichier | Tests désactivés | Raison |
|---|---|---|
| [`game-flow.spec.ts`](../e2e/game-flow.spec.ts) | 3 tests `skip` (tour de jeu, videau, review post-partie) | « timing fragile », « flux multi-étapes fragile » |
| [`snowie-tmg-interaction.spec.ts`](../e2e/snowie-tmg-interaction.spec.ts) | 1 test `skip` (boucle complète auto-move + drag-and-drop) | « indicateur de tour IA fragile » |
| [`accessibility.spec.ts`](../e2e/accessibility.spec.ts) | **tout le describe `skip`** (navigation clavier, ARIA, skip links) | « sélecteurs obsolètes » |

**Conséquence** : la jouabilité (jouer un coup, gérer le videau, accessibilité clavier) n'est **pas vérifiée en conditions réelles**. Une régression de jouabilité passerait inaperçue.

---

## 2. Points de friction identifiés

### 🔴 P0 — Réactiver les tests e2e de jouabilité

**Pourquoi** : c'est le problème n°1. Sans tests e2e actifs, la jouabilité n'est pas garantie.

**Actions** :
1. **Stabiliser les sélecteurs** : remplacer les sélecteurs obsolètes par des `data-testid` stables.
2. **Réactiver `accessibility.spec.ts`** : réaligner les sélecteurs (skip links, ARIA, focus clavier).
3. **Réactiver les flux de jeu** : stabiliser le timing (remplacer `waitForTimeout` par des attentes conditionnelles `expect(...).toBeVisible()`).

### 🟠 P1 — Robustesse des interactions (auto-move, drag-and-drop)

**Pourquoi** : les tests `skip` mentionnent « indicateur de tour IA fragile » et « timing fragile », signe que les interactions dépendent de timings arbitraires (350ms d'animation).

**Actions** :
1. Remplacer les `waitForTimeout(350)` par des attentes sur l'état (ex. `expect(ghost).toBeVisible()`).
2. Rendre l'indicateur de tour IA déterministe (pas de dépendance au timing).

### 🟡 P2 — Accessibilité clavier (WCAG 2.1 AA)

**Pourquoi** : tout le describe d'accessibilité est désactivé. La navigation clavier, les skip links et les attributs ARIA ne sont pas vérifiés.

**Actions** :
1. Réactiver les tests d'accessibilité avec des sélecteurs à jour.
2. Vérifier la navigation clavier sur les flèches (ArrowLeft/ArrowRight).

---

## 3. Matrice de priorisation

| Priorité | Chantier | Impact | Effort | Risque |
|---|---|---|---|---|
| **P0** | Réactiver les tests e2e de jouabilité | ⭐⭐⭐⭐⭐ | 🟡 moyen | 🟡 moyen |
| **P1** | Robustesse des interactions (timing) | ⭐⭐⭐⭐ | 🟡 moyen | 🟢 faible |
| **P2** | Accessibilité clavier | ⭐⭐⭐ | 🟡 moyen | 🟢 faible |

---

## 4. Recommandation

**Exécuter P0 en premier** : réactiver les tests e2e de jouabilité (game-flow, snowie-tmg, accessibility). C'est le chantier qui garantit que la jouabilité est réellement vérifiée, et il révèlera les bugs de jouabilité cachés par les tests désactivés.

**P1 ensuite** : stabiliser les interactions (remplacer les timings arbitraires par des attentes conditionnelles).

**P2** : réactiver l'accessibilité clavier.
