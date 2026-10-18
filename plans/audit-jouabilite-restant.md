# Audit — Soucis de Jouabilité Restants & État de la Documentation

> **Question** : y a-t-il d'autres soucis de jouabilité ? La documentation est-elle à jour ?

---

## 1. Autres soucis de jouabilité identifiés

### 🟠 P1 — Affichage du videau (cube) : « 64 » au lieu de « 1 »

**Fichier** : [`Board.tsx`](../src/components/board/Board.tsx) ligne 479.

**Problème** : le cube affiche `state.cubeValue === 1 ? '64' : state.cubeValue`. Quand le cube vaut 1 (non doublé), il affiche « 64 » — une convention de backgammon (le cube « au centre » affiche sa valeur maximale potentielle), mais **confuse pour les joueurs** qui s'attendent à voir « 1 ».

**Attente des joueurs** : voir la valeur réelle du cube (1, 2, 4, 8...), pas « 64 ».

**Correction** : afficher `state.cubeValue` directement (1, 2, 4, 8...), avec éventuellement un indicateur visuel distinct pour le cube « au centre » (non doublé).

### 🟡 P2 — Navigation clavier sur les flèches (non réimplémentée)

**Fichier** : [`Board.tsx`](../src/components/board/Board.tsx).

**Problème** : la navigation clavier (ArrowLeft/Right, Home/End, Enter, Escape) n'est pas encore réimplémentée dans le nouveau Board. Les labels ARIA sont branchés (P2 précédent), mais pas la navigation au clavier.

**Attente des joueurs** : pouvoir jouer entièrement au clavier (accessibilité WCAG 2.1 AA).

### 🟡 P3 — Raccourcis clavier non documentés dans l'UI

**Problème** : les raccourcis clavier (Espace = lancer, Tab, D = double) existent dans le code mais ne sont **pas affichés** dans l'interface (pas de guide visible).

**Attente des joueurs** : découvrir les raccourcis clavier facilement.

---

## 2. État de la documentation

### ✅ À jour

- [`ARCHITECTURE.md`](../ARCHITECTURE.md) : mentionne `bearoffTable.ts` + `keithCount.ts`.
- [`docs/adr/0007-hybrid-xg-web-bearoff-wasm.md`](../docs/adr/0007-hybrid-xg-web-bearoff-wasm.md) : documente l'Option A.
- [`README.md`](../README.md) / [`CONTRIBUTING.md`](../CONTRIBUTING.md) : compteurs de tests à jour (619).

### ❌ Manquant (changements récents non documentés)

Les changements de jouabilité récents ne sont **pas documentés** :
- Dé utilisé lisible (fond grisé + barré).
- Dés de l'adversaire sur le plateau (rivière centrale).
- Ring rose sur les pions frappés de la barre.
- Labels ARIA branchés sur les flèches.
- Module `shotCounter.ts` (comptage exact des tirs).

---

## 3. Recommandations

| Priorité | Action | Impact | Risque |
|---|---|---|---|
| **P1** | Corriger l'affichage du cube (« 64 » → « 1 ») | ⭐⭐⭐ | 🟢 faible |
| **P2** | Réimplémenter la navigation clavier | ⭐⭐⭐ | 🟡 moyen |
| **P3** | Afficher les raccourcis clavier dans l'UI | ⭐⭐ | 🟢 faible |
| **Doc** | Mettre à jour la documentation (jouabilité + shotCounter) | ⭐⭐ | 🟢 faible |

**Recommandation** : exécuter **P1 d'abord** (affichage du cube, simple et impactant), puis **mettre à jour la documentation** (coût quasi nul), puis **P2/P3** (navigation clavier et raccourcis).
