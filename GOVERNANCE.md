# 🏛️ Charte de Gouvernance — Architecture « Zéro Bug » & Tolérance Zéro

> **Statut** : IMPÉRATIF — toute modification, ajout de code ou refactoring sur ce projet de Backgammon doit se plier à ces 4 règles d'or architecturales et comportementales incompressibles.

Ce cadre garantit la stabilité, la testabilité et la propreté absolue du code. Toute violation d'une de ces règles doit être **refusée**.

---

## RÈGLE 1 : SÉPARATION STRICTE DES COUCHES (COUPLING ISOLATION)

Le code est divisé en **3 couches étanches**. Il est formellement interdit de mélanger leurs responsabilités.

### 1. Couche Métier / Règles — `src/engine/`
- **Purement déterministe et mathématique.**
- Gère exclusivement les règles du Backgammon : génération des coups légaux, réentrée depuis la barre, bear-off, doubles.
- **Interdits** : code React, JSX, effets de bord (`localStorage`, `fetch`, `console.log` en production).

### 2. Couche Évaluation & Coach — `src/lib/engine/`
- Calcule l'équité, le Top 3 des coups, les verdicts et le PR.
- S'appuie sur le moteur tri-phase local.
- Renvoie des **structures de données typées**.
- **Interdits** : interaction directe avec le DOM, modification de l'affichage.

### 3. Couche UI / Présentation — `src/components/`, `src/app/`
- Uniquement de l'affichage et de la capture d'événements (clics, survol).
- **Interdits** : calcul lourd, logique de règles de jeu. Elle se contente d'afficher l'état fourni par les couches 1 et 2.

---

## RÈGLE 2 : TOLÉRANCE ZÉRO AUX « CATCH » SILENCIEUX ET AUX DONNÉES FACTICES

- **Interdiction formelle** de créer des blocs `try / catch` qui avalent une erreur pour renvoyer des valeurs par défaut magiques (équités codées en dur, faux scores, fausses listes de coups).
- Si une fonction échoue ou si une donnée est invalide, elle doit :
  - soit **lever une erreur explicite** (`throw new Error(...)`),
  - soit **retourner un type `Result<T, Error>`** géré de manière explicite.
- **Aucun « mock » caché en production.**

---

## RÈGLE 3 : TYPAGE STRICT TYPESCRIPT ET INTÉGRITÉ DES API INTERNES

- Mode **`strict: true`** exigé sur tout le projet.
- **Zéro `any`**, zéro `ts-ignore` non documenté.
- Les interfaces et types de données échangés entre le plateau ([`Board.tsx`](src/components/board/Board.tsx)), le coach ([`useCoach.ts`](src/hooks/useCoach.ts)) et l'évaluateur ([`evaluator.ts`](src/lib/engine/evaluator.ts)) doivent être **centralisés dans des fichiers de types dédiés et immuables**.

---

## RÈGLE 4 : WORKFLOW DE DÉVELOPPEMENT ATOMIQUE

- **Une seule tâche à la fois** : ne jamais modifier plus d'un sous-système ou de 3 fichiers à la fois.
- **Vérification systématique** : après chaque modification atomique, le code doit compiler sans aucune erreur TypeScript ni avertissement de build.

---

## Engagement

En acceptant ce cadre, tout contributeur (humain ou IA) s'engage à **refuser tout code qui violerait l'une de ces 4 règles**.

---

## Références croisées

| Document | Rôle |
|---|---|
| [`PROJECT_MAP.md`](PROJECT_MAP.md) | Carte d'orientation — comprendre le projet en 1 minute. |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Architecture détaillée (modules, flux, décisions). |
| [`SCALABILITY.md`](SCALABILITY.md) | Charte de scalabilité impérative. |
| [`GOVERNANCE.md`](GOVERNANCE.md) | **Charte de gouvernance « Zéro Bug » (ce document).** |
