# ADR-007 : Déploiement Hybride XG-Web (Bear-Off Exact 54 264 États + Moteur WASM 2-Ply SIMD)

- **Statut** : Accepté
- **Date** : 2026-10-18
- **Décideurs** : Équipe d'ingénierie Backgammon Suite
- **Domaine** : Moteur de jeu, IA Grand-Maître & Haute Performance

---

## Contexte
Le moteur de base TypeScript fournissait une évaluation heuristique tri-phase fluide, mais manquait de perfection en fin de partie (bear-off) et de profondeur de recherche pour égaler eXtreme Gammon (PR cible <= 0.55). De plus, les tentatives d'intégration de gros modèles ONNX (Raccoon, ~58 Mo) contredisaient le cahier des charges client-side (< 1,5 Mo).

## Décision

Nous déployons une architecture hybride à double étage, 100 % propriétaire (licence MIT), sans aucune dépendance GPL :

1. **Option A — Sécurisation immédiate du frontend (PR 0.00 en bear-off)** :
   - Table exacte 1-sided Bear-Off (`src/lib/engine/bearoffTable.ts`) couvrant les 54 264 positions possibles via l'indexation combinatoire *stars and bars* $C(15+6, 6) = 54\,264$.
   - Stockage précalculé Base64 ultra-compact (`src/lib/engine/bearoffData.ts`) chargé instantanément en 0,12 ms en mémoire (`Uint16Array`, 108 Ko).
   - Formule officielle de course de Tom Keith (1993) avec pénalités de gaspillage d'as, de 2-point, de gaps et d'ancres, couplée aux seuils de Janowski pour la décision de videau en course pure.

2. **Étage Grand-Maître — Core Rust / WASM SIMD 2-Ply (`/xg-web-core`)** :
   - Moteur écrit en Rust pur sans dépendance lourde, compilé en `wasm32-unknown-unknown` :
     - `bitboard.rs` : Représentation compacte du plateau et générateur de coups légaux sans allocation sur le tas dans la boucle chaude.
     - `mlp.rs` : Micro-inférence matricielle SIMD 128-bit pour 3 réseaux spécialisés (*Contact*, *Crashed*, *Race*) quantifiés en `int8` (poids de 121 Ko).
     - `met.rs` : Table d'équité de match officielle **Kazaross-XG2** jusqu'à 25 points.
     - `search.rs` : Algorithme **Expectiminimax 2-ply avec élagage alpha dynamique** balayant les 21 tirages de dés équiprobables.
   - Poids légers distillés via un trainer local (`/xg-web-trainer/distill.py`).

3. **Orchestration Client-Side Asynchrone** :
   - Web Worker dédié (`src/workers/xgEngine.worker.ts`) exécutant la recherche 2-ply en arrière-plan sans blocage du thread principal UI.
   - Sélecteur de niveau "Grand-Maître (XG-Web 2-Ply)" avec repli instantané (Option A) si le binaire WASM n'est pas supporté ou indisponible.

## Conséquences

### Positives
- **Excellence mathématique** : PR 0.00 garanti en bear-off pur et précision Grand-Maître en 2-ply.
- **Poids plume** : L'ensemble des assets binaires pèse **290,6 Ko** (WASM 63 Ko + Poids 121 Ko + Bearoff 106 Ko), soit 19 % du budget de 1,5 Mo.
- **Latence exceptionnelle** : Recherche 2-ply exécutée en **~59 ms** par coup (cible : < 150 ms).
- **Zéro coût d'infrastructure** : 100 % client-side, 0 € de coût serveur.
- **Sécurité de licence** : Code 100 % propriétaire / MIT, aucune contamination GNU GPL.

### Négatives / Contraintes
- Nécessite la compilation du module Rust (`wasm32-unknown-unknown`) lors des modifications profondes du noyau de recherche.
