# GEMINI.md — Charte Architecturale, Protocole d'Épure Elon Musk & Invariants Métier

> **Statut : OBLIGATOIRE.** Ce fichier synchronise les règles maîtresses du projet avec [`AGENTS.md`](AGENTS.md), [`PROJECT_MAP.md`](PROJECT_MAP.md), [`SCALABILITY.md`](SCALABILITY.md) et [`GOVERNANCE.md`](GOVERNANCE.md).

---

## 1. Séparation Stricte des Modes d'Entraînement « ER » (`/puzzles`) et « ERH » (`/drills`)

1. **Zéro Doublon d'Onglets** :
   - La route `/puzzles` affiche **exclusivement** le mode **Quiz ER** (mathématique pure, calcul d'équité exacte $\Delta\text{EMG}$ / MWC).
   - La route `/drills` affiche **exclusivement** le mode **Quiz ERH** (pertinence humaine, maximisation de l'erreur adverse sous pression).
   - La barre d'onglets redondante `Quizz PR (Maths) | Quizz ERH` dans le panneau droit est **définitivement bannie**.
2. **Isolation Totale des États & Niveaux en Temps Réel** :
   - Les stores `erRating` et `erhRating` sont strictement séparés dans [`src/features/drills/quizRatingStore.ts`](src/features/drills/quizRatingStore.ts) et consommés via le hook dédié [`src/hooks/useDrillRating.ts`](src/hooks/useDrillRating.ts) (validation Zod aux frontières I/O `localStorage`).
   - À chaque coup validé, le score du mode actif évolue en temps réel avec feedback visuel immédiat (`+` en vert / `-` en rouge) sans jamais polluer l'autre mode.

---

## 2. Architecture « Tesla 3-Secondes » sur `/drills` & `/puzzles`

Le module d'entraînement est découpé en **5 sous-modules légers** (chacun $< 200$ lignes) orchestrés par [`BlunderDrillView.tsx`](src/components/drills/BlunderDrillView.tsx) ($< 300$ lignes) :

| Module | Lignes | Responsabilité stricte |
|---|---|---|
| [`src/components/drills/DrillHeader.tsx`](src/components/drills/DrillHeader.tsx) | 149 | 1 seule ligne supérieure : bouton `← Retour`, titre unique (`Quiz ER` OU `Quiz ERH`) et badge dynamique `Niveau ER` / `Niveau ERH`. |
| [`src/components/drills/DrillContextStrip.tsx`](src/components/drills/DrillContextStrip.tsx) | 97 | 1 seule ligne de contexte : `Match X pts (Score) • Videau : X • Retard : X pips`. Suppression de « Jet à jouer », « Trait aux Blancs » et « Course : Blanc vs Noir ». |
| [`src/components/drills/DrillChoicesGrid.tsx`](src/components/drills/DrillChoicesGrid.tsx) | 90 | Grille 2×2 des 4 candidats (`A`, `B`, `C`, `D`) : flèche de prévisualisation au survol (`hover`) et validation directe en **1 clic** (suppression du bouton `✓ VALIDER`). |
| [`src/components/drills/DrillCoachFeedback.tsx`](src/components/drills/DrillCoachFeedback.tsx) | 143 | *Progressive Disclosure* : masqué avant le clic. Apparaît **uniquement après le clic** avec le verdict du Coach IA (Gemini Flash / Flash-Lite) en 3 lignes + `XX/36` lancers constructifs + `Question suivante →`. |
| [`src/hooks/useDrillRating.ts`](src/hooks/useDrillRating.ts) | 149 | Hook isolé gérant en temps réel l'évolution séparée du Niveau `ER` et du Niveau `ERH` avec validation Zod. |

---

## 3. Charte Modulaire & Plafonds de Lignes (Règle R1 — `SCALABILITY.md`)

- **Composant React (`.tsx`)** : $\le 300$ lignes max.
- **Hook React (`.ts`)** : $\le 200$ lignes max.
- **Module de logique pure (`.ts`)** : $\le 400$ lignes max.
- **Typage strict (`GOVERNANCE.md`)** : **ZÉRO `any`** en production, validation **Zod** aux frontières d'entrée/sortie.
- **Direction Artistique « Haute Horlogerie / Monte-Carlo »** : Fond `#050505` (Noir Obsidienne), cartes `#12151C` (Anthracite profond), accents Or `#D4AF37`, Émeraude `#10B981`, Corail `#EF4444`.

