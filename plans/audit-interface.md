# Audit de l'Interface de Jeu — Backgammon Pro

> **Objectif** : analyser l'interface (UI/UX) et identifier les points de friction et la dette technique.

---

## 1. État de l'interface (vérifié)

### Composants monolithiques (dette technique)

| Fichier | Taille | Problème |
|---|---|---|
| [`page.tsx`](../src/app/page.tsx) | **1483 lignes** | 25+ `useState`/`useEffect`/`useCallback`, orchestration complète (jeu, coach, multijoueur, modales, raccourcis, haptique, sons, persistance) |
| [`MatchHud.tsx`](../src/components/hud/MatchHud.tsx) | **766 lignes** | 60+ props, gère score + dés + videau + paramètres + navigation secondaire + multijoueur |

**Conséquence** : ces deux fichiers concentrent toute la logique d'interface, rendant les modifications risquées et les tests difficiles.

### Points positifs (déjà solides)

- **ARIA labels complets** : `role="region"`, `aria-label`, `aria-expanded`, `aria-modal` sur le HUD.
- **Raccourcis clavier** : Espace (lancer), Tab, D (double) — « Speed-Play ».
- **Haptique** : `impactLight/Medium/Heavy` sur chaque interaction.
- **Sons** : `soundEngine` avec toggle mute.
- **Thèmes** : `snowie_classic` et autres, avec toggle.
- **Responsive** : viewports mobile (iPhone 13, Pixel 5) testés.

---

## 2. Points de friction identifiés

### 🔴 P0 — Découper les composants monolithiques

**Pourquoi** : `page.tsx` (1483 lignes) et `MatchHud.tsx` (766 lignes) sont trop gros. Toute modification est risquée.

**Actions** :
1. Extraire la logique d'orchestration de `page.tsx` vers des hooks dédiés (déjà partiellement fait via `useBackgammonGame`, `useCoach`, `useMultiplayerGame`).
2. Découper `MatchHud.tsx` en sous-composants (ScoreBoard, DiceControls, CubeControls, SettingsMenu, SecondaryNav).

### 🟠 P1 — Cohérence des sélecteurs de test

**Pourquoi** : les tests e2e utilisent des `data-testid` qui ont été renommés lors du refactoring du Board (déjà partiellement corrigé en P0 de l'audit jouabilité).

**Actions** :
1. Terminer la réintroduction des `data-testid` manquants (`ghost-checker-`, `tray-zone-o`, `keyboard-focus-indicator-`).
2. Réactiver les tests e2e restants.

### 🟡 P2 — Accessibilité clavier du plateau

**Pourquoi** : la navigation clavier sur les flèches (ArrowLeft/ArrowRight, Home/End) n'est plus implémentée dans le nouveau Board.

**Actions** :
1. Réimplémenter la navigation clavier (tabindex, focus indicator, gestion des touches) dans `Board.tsx`.
2. Réactiver `accessibility.spec.ts`.

---

## 3. Matrice de priorisation

| Priorité | Chantier | Impact | Effort | Risque |
|---|---|---|---|---|
| **P0** | Découper les composants monolithiques | ⭐⭐⭐⭐ | 🔴 élevé | 🟡 moyen |
| **P1** | Cohérence des sélecteurs de test | ⭐⭐⭐ | 🟡 moyen | 🟢 faible |
| **P2** | Accessibilité clavier du plateau | ⭐⭐⭐ | 🟡 moyen | 🟢 faible |

---

## 4. Recommandation

**P1 d'abord** (cohérence des sélecteurs) : c'est le prolongement direct de l'audit jouabilité, coût faible, et il débloque les tests e2e.

**P2 ensuite** (accessibilité clavier) : réimplémenter la navigation clavier dans le nouveau Board.

**P0 en dernier** (découpage) : c'est le chantier le plus lourd et risqué, à faire avec précaution (refactoring incrémental, tests de non-régression à chaque étape).
