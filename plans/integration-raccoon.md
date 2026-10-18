# Plan d'intégration — Raccoon Backgammon (moteur neuronal MIT, WASM navigateur)

> **Décision** : remplacer l'heuristique tri-phase par le moteur neuronal **Raccoon**, plus fort que GNU Backgammon, sous licence MIT, exécuté en WebAssembly dans le navigateur.

---

## 1. Faits techniques confirmés (investigation)

| Élément | Valeur confirmée |
|---|---|
| **Dépôt moteur** | [`lassehjorthmadsen/raccoon`](https://github.com/lassehjorthmadsen/raccoon) — Python/PyTorch, **MIT** |
| **Dépôt site web** | [`lassehjorthmadsen/raccoon-website`](https://github.com/lassehjorthmadsen/raccoon-website) — **MIT** |
| **Architecture réseau** | 10 blocs résiduels, 256 canaux, **11.9M paramètres** |
| **Entrée** | Tenseur `(26, 2, 12)` : plans de pions, barre/bear-off/dés, features pip/blot/ancre/contact |
| **Sortie** | 6 issues mutuellement exclusives (win/gammon/backgammon × 2 sens) → équité cubeless |
| **Sélection de coup** | 0-ply : tous les coups légaux évalués en **un seul forward pass batché** (pas de recherche) |
| **Entraînement** | Distillation supervisée de **40M positions** étiquetées par gnubg 2-ply |
| **Poids en prod** | `exp018-ep22-fp32.onnx` sous `app/models/` du dépôt website — **PR mesuré 0.9500** |
| **Runtime navigateur** | **ONNX Runtime Web** (self-hosté, pas de CDN) |
| **Licence des poids** | MIT (le dépôt website est MIT, « matching the engine ») |
| **Latence** | millisecondes (un seul forward pass, pas de recherche) |

### ⚠️ Points de vigilance (à vérifier avant intégration)

1. **Taille du fichier ONNX** : 11.9M paramètres en fp32 ≈ **~48 Mo**. C'est le point critique pour le chargement initial sur Netlify. Il faudra :
   - soit servir le `.onnx` en statique (Netlify accepte les gros fichiers, mais le premier chargement sera lourd) ;
   - soit vérifier si une version quantifiée (fp16/int8) existe (le nom `fp32` suggère qu'une version fp16 est possible).
2. **Le moteur Python n'est pas câblé pour charger ce checkpoint** (caveat documenté : « loading it from the Python engine is not wired up yet »). Mais **le site web le charge déjà en ONNX Runtime Web** — c'est exactement le chemin qu'on veut suivre.
3. **Le protocole RGP** (Raccoon Game Protocol, UCI-like) existe pour les GUIs d'analyse, mais l'embarquement navigateur passe par ONNX Runtime Web directement.

---

## 2. Architecture cible

```
src/lib/engine/
├── evaluator.ts          # (existant) moteur tri-phase — devient le REPLI
├── raccoon/
│   ├── raccoonEngine.ts  # NOUVEAU : charge le .onnx via ONNX Runtime Web, encode la position, infère
│   ├── encoder.ts        # NOUVEAU : encode BoardState -> tenseur (26,2,12) exact de Raccoon
│   └── types.ts          # NOUVEAU : types immuables (RaccoonEvaluation, RaccoonMove)
└── types.ts              # (existant) contrats Worker
```

**Flux** :
1. `evaluateBoard()` tente d'abord le moteur Raccoon (si le `.onnx` est chargé).
2. Si Raccoon n'est pas encore chargé (premier chargement) ou échoue → **repli sur le tri-phase actuel** (déjà en place, conforme à la charte « Zéro Bug » : pas de catch silencieux, repli explicite et documenté).

---

## 3. Étapes d'implémentation (atomiques, max 3 fichiers par étape)

### Étape 1 — Ajouter la dépendance ONNX Runtime Web
- `package.json` : ajouter `onnxruntime-web`.
- Vérifier la compatibilité Next.js 15 (chargement du `.wasm` d'ORT Web via `public/`).

### Étape 2 — Télécharger et servir le modèle ONNX
- Récupérer `exp018-ep22-fp32.onnx` depuis le dépôt `raccoon-website`.
- Le placer dans `public/models/`.
- Vérifier la taille réelle et décider fp32 vs fp16.

### Étape 3 — Créer `encoder.ts` (encodage exact)
- Implémenter l'encodage `(26, 2, 12)` documenté : plans de pions, barre/bear-off/dés, features pip/blot/ancre/contact.
- **Point critique** : l'encodage doit être **exactement** celui de Raccoon (ordre des plans, normalisations). S'appuyer sur `app/engine/encoder` du dépôt website comme référence.

### Étape 4 — Créer `raccoonEngine.ts` (inférence)
- Charger le `.onnx` via ONNX Runtime Web (lazy, dans un Web Worker pour ne pas bloquer l'UI).
- Exposer `evaluateRaccoon(state): RaccoonEvaluation` (6 probabilités → équité cubeless).
- Exposer `analyzeRaccoonMoves(state, dice): MoveAnalysis[]` (batch de tous les coups légaux).

### Étape 5 — Brancher dans `evaluator.ts` (avec repli)
- `evaluateBoard()` : tenter Raccoon, sinon tri-phase.
- `analyzeBoardMoves()` : tenter Raccoon, sinon tri-phase.
- Conserver le tri-phase comme repli explicite (jamais de données factices).

### Étape 6 — Tests de non-régression
- Tests différentiels : comparer Raccoon vs tri-phase sur des positions de référence.
- Vérifier que le repli fonctionne quand le modèle n'est pas chargé.
- Vérifier la cohérence PR/verdicts avec les nouvelles équités.

---

## 4. Risques et mitigations

| Risque | Mitigation |
|---|---|
| **Taille ~48 Mo** (fp32) | Servir en statique + lazy-load ; envisager fp16/int8 ; afficher un indicateur de chargement |
| **Encodage inexact** (équités fausses silencieuses) | S'appuyer sur l'encodeur de référence du dépôt website + tests différentiels contre fixtures |
| **ORT Web + Next.js 15** (chargement WASM) | Tester tôt (Étape 1) ; repli tri-phase si incompatibilité |
| **Licence des poids** | Confirmée MIT (dépôt website MIT) — à re-vérifier sur le fichier `.onnx` lui-même |

---

## 5. Décision à prendre avant de coder

**Question ouverte** : la taille du modèle (~48 Mo fp32) est-elle acceptable pour ton déploiement Netlify, ou veux-tu que je vérifie d'abord s'il existe une version quantifiée (fp16/int8) plus légère ?

C'est le seul point bloquant potentiel. Tout le reste (licence MIT, WASM navigateur, force > gnubg, API ONNX Runtime Web) est validé et favorable.
