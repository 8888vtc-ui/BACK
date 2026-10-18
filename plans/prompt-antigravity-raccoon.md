# PROMPT ANTIGRAVITY — Intégration du moteur neuronal Raccoon Backgammon (ONNX Runtime Web) sur Netlify

> **Objectif** : remplacer l'heuristique tri-phase actuelle par le moteur neuronal **Raccoon** (plus fort que GNU Backgammon, licence MIT), exécuté 100 % dans le navigateur via ONNX Runtime Web, avec le modèle `.onnx` hébergé sur **Netlify Blobs** (coût 0 €).

---

## CONTEXTE TECHNIQUE (à lire avant de coder)

### Le projet actuel
- Application Next.js 15 (App Router) + React 19 + TypeScript strict + Tailwind CSS.
- Le moteur d'évaluation actuel est [`src/lib/engine/evaluator.ts`](src/lib/engine/evaluator.ts) : un évaluateur **tri-phase** (Contact / Crashed / Race-BearOff) à coefficients calibrés.
- Il expose : `evaluateBoard(state)`, `analyzeBoardMoves(state, dice)`, `analyzeBoardCube(state)`, `findBestBoardMove(state, dice)`, `classifyPosition(board)`.
- Le Web Worker [`src/workers/gnubg.worker.ts`](src/workers/gnubg.worker.ts) appelle ces fonctions.
- Le client [`src/lib/engine/client.ts`](src/lib/engine/client.ts) orchestre le worker.

### Le moteur Raccoon (source de vérité)
- Dépôt moteur : `https://github.com/lassehjorthmadsen/raccoon` (Python/PyTorch, **MIT**).
- Dépôt site web : `https://github.com/lassehjorthmadsen/raccoon-website` (**MIT**).
- **Modèle en production** : `exp018-ep22-fp32.onnx` situé dans `app/models/` du dépôt `raccoon-website`. PR mesuré **0.9500**.
- **Architecture réseau** : 10 blocs résiduels, 256 canaux, **11.9M paramètres**.
- **Entrée** : tenseur de forme `(26, 2, 12)` — plans de pions, barre/bear-off/dés, features pip/blot/ancre/contact.
- **Sortie** : 6 issues mutuellement exclusives (win/gammon/backgammon × 2 sens) → équité cubeless.
- **Sélection de coup** : 0-ply, tous les coups légaux évalués en **un seul forward pass batché** (pas de recherche).
- **Runtime navigateur** : **ONNX Runtime Web** (`onnxruntime-web`), self-hosté (pas de CDN).
- **Encodage de référence** : `app/engine/encoder` dans le dépôt `raccoon-website` (à lire et reproduire fidèlement).

---

## RÈGLES DE GOUVERNANCE (NON NÉGOCIABLES)

1. **Séparation des couches** : le code Raccoon va dans `src/lib/engine/raccoon/` (couche évaluation). Aucun JSX, aucun DOM, aucun `localStorage`/`fetch` dans cette couche.
2. **Zéro catch silencieux** : si le modèle n'est pas chargé ou échoue, lever une erreur explicite OU retourner un type `Result<T, Error>`. **Jamais** de données factices.
3. **Typage strict** : zéro `any`, zéro `ts-ignore`. Types centralisés dans `src/lib/engine/raccoon/types.ts`.
4. **Workflow atomique** : une étape à la fois, max 3 fichiers par étape, compilation TypeScript propre après chaque étape.

---

## ÉTAPES D'IMPLÉMENTATION (dans l'ordre strict)

### Étape 1 — Dépendance ONNX Runtime Web
- Ajouter `onnxruntime-web` à `package.json` (dependencies).
- Vérifier la compatibilité Next.js 15 : le `.wasm` d'ORT Web doit être servi depuis `public/` (copier `ort-wasm-simd-threaded.wasm` et `ort-wasm-simd-threaded.jsep.wasm` dans `public/`).
- Configurer `next.config.mjs` si nécessaire pour autoriser le chargement WASM.

### Étape 2 — Héberger le modèle sur Netlify Blobs
- Récupérer `exp018-ep22-fp32.onnx` depuis le dépôt `raccoon-website` (`app/models/`).
- Le stocker dans un **Netlify Blob** (store dédié, ex: `raccoon-model`).
- Créer une route API `src/app/api/model/route.ts` qui sert le `.onnx` depuis le Blob (ou exposer une URL de téléchargement).
- Alternative si Blobs est complexe : servir le `.onnx` directement dans `public/models/` (accepter le risque de déploiement lent).

### Étape 3 — Créer `src/lib/engine/raccoon/types.ts`
- Types immuables : `RaccoonEvaluation` (6 probabilités + équité cubeless), `RaccoonMoveAnalysis`, `RaccoonEngineStatus`.
- Type `Result<T, E>` pour la gestion d'erreur explicite.

### Étape 4 — Créer `src/lib/engine/raccoon/encoder.ts`
- Implémenter l'encodage `BoardState` → tenseur `(26, 2, 12)` **exactement** comme `app/engine/encoder` du dépôt `raccoon-website`.
- **Point critique** : l'ordre des plans, les normalisations et les features (pip, blot, ancre, contact) doivent être identiques au modèle entraîné. Toute divergence produit des équités fausses silencieusement.
- Écrire des tests unitaires comparant l'encodage à des fixtures du dépôt Raccoon.

### Étape 5 — Créer `src/lib/engine/raccoon/raccoonEngine.ts`
- Charger le `.onnx` via ONNX Runtime Web (lazy, dans un Web Worker pour ne pas bloquer l'UI).
- Exposer `evaluateRaccoon(state): Promise<Result<RaccoonEvaluation, Error>>`.
- Exposer `analyzeRaccoonMoves(state, dice): Promise<Result<RaccoonMoveAnalysis[], Error>>` (batch de tous les coups légaux en un forward pass).

### Étape 6 — Brancher dans `src/lib/engine/evaluator.ts` (avec repli)
- `evaluateBoard()` : tenter Raccoon d'abord, sinon **repli explicite** sur le tri-phase actuel.
- `analyzeBoardMoves()` : idem.
- Le repli doit être **documenté et visible** (pas de catch silencieux) : si Raccoon n'est pas chargé, retourner le résultat tri-phase avec un indicateur `source: 'tri-phase'`.

### Étape 7 — Tests de non-régression
- Tests différentiels Raccoon vs tri-phase sur des positions de référence.
- Test du repli quand le modèle n'est pas chargé.
- Vérifier la cohérence PR/verdicts avec les nouvelles équités.
- `npx tsc --noEmit` et `npx vitest run` doivent passer sans erreur.

---

## LIVRABLES ATTENDUS

1. Le moteur Raccoon intégré et fonctionnel dans le navigateur.
2. Le repli tri-phase conservé et documenté.
3. Le modèle `.onnx` hébergé sur Netlify (Blobs ou `public/models/`).
4. Compilation TypeScript propre + tests verts.
5. Documentation mise à jour (README, ADR) reflétant le nouveau moteur.

---

## POINTS DE VIGILANCE CRITIQUES

1. **Encodage exact** : c'est LE risque n°1. Reproduire fidèlement `app/engine/encoder` du dépôt Raccoon, sinon les équités sont fausses.
2. **Taille du modèle (~48 Mo)** : chargement lazy + indicateur de progression. Ne pas bloquer le premier rendu.
3. **ORT Web + Next.js 15** : tester tôt (Étape 1) le chargement du `.wasm` d'ORT Web.
4. **Licence** : MIT confirmé (code + poids). Aucun problème de contamination GPL.
5. **Repli** : le tri-phase actuel doit rester fonctionnel comme filet de sécurité (conforme à la charte « Zéro Bug »).
