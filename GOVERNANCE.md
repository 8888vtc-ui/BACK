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

### 2. Couche Évaluation & Coach — `src/lib/engine/`, `src/features/coach/`
- Calcule l'équité, le Top 3 des coups, les verdicts (4 paliers `logAnalyzer.ts` / 6 paliers `moveClassifier.ts`) et le PR.
- S'appuie en priorité sur le moteur neuronal **Open Sage (`bgsageClient.ts`)** sur Google Cloud Run, avec repli instantané hors-ligne sur le moteur tri-phase local (`evaluator.ts` + Bear-Off 54 264 états).
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

## RÈGLE 5 : LES 7 LOIS D'INTÉGRITÉ DES QUIZ 3-PLY (ANTI-HALLUCINATION)

1. **Loi d'Authenticité Cubeful 3-Ply (Zéro Formule Locale & Somme des Probabilités = 1.000)** : Toute équité (`equity`), perte (`loss` / `ΔEMG`) et probabilité (`W`, `WG`, `WBG`, `LW`, `LG`, `LBG`) d'un quiz (`CHECKER_PLAY` ou `CUBE_DECISION`) doit provenir à 100 % de la sortie brute de `gnubg-cli` 3-ply ou Open Sage 3-ply avec `Math.abs(prob.win + prob.loseWin - 1) <= 0.001`. Toute formule locale ou décalage synthétique (ex: `ndEq - 0.022`) est strictement interdit.
2. **Loi du Contexte de Match Complet** : Toute évaluation `CHECKER_PLAY` ou `CUBE_DECISION` doit transmettre le `XGID` complet incluant la valeur du videau, la possession du videau, le score exact des deux joueurs, le flag Crawford et la longueur du match. Évaluer une position de match en Money Game est une violation critique.
3. **Loi de Validité du Videau (`:00:`)** : Tout quiz `CUBE_DECISION` doit obligatoirement avoir les dés à `:00:` dans son `XGID` (décision prise avant le lancer de dés) et comparer les 3 vraies équités Cubeful (`No Double`, `Double/Take`, `Double/Pass`).
4. **Loi de Notation Exacte** : Les mouvements de pions doivent conserver la notation exacte issue du moteur 3-ply, incluant impérativement les astérisques de frappe (`*`).
5. **Loi d'Unicité Physique des Plateaux (Anti-Recyclage de Score)** : Il est interdit de fabriquer artificiellement des milliers de quiz en réutilisant la même configuration de plateau (`board` 26 cases + dés) sous différents scores de match. Chaque couple `${quizType}:${boardPrefix26}:${dice}` doit être unique (ou plafonné à maximum 2 variantes de score critique comme Normal vs DMP/Gammon Save si et seulement si le meilleur coup change réellement).
6. **Loi d'Écart Minimum Pédagogique (Zéro Ex Æquo)** : Tout quiz dont le choix #2 a une perte d'équité `loss < 0.003` par rapport au choix #1 (coups ex æquo) doit être rejeté par le validateur afin de ne jamais pénaliser un joueur sur deux coups mathématiquement équivalents.
7. **Loi de Reprise Atomique (`Resume` & Seed Sync)** : Tout script de génération doit charger les clés existantes au démarrage (`Set`), écrire de façon atomique (`appendFileSync`), et synchroniser périodiquement `src/features/drills/bgsage3PlyFactorySeed.ts`.

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
