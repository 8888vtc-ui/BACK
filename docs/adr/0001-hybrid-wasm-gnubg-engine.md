# ADR-001 : Architecture Hybride Client WASM / Backend Neural GNUBG

- **Statut** : Accepté
- **Date** : 2026-10-15
- **Décideurs** : Équipe d'ingénierie Backgammon Suite
- **Domaine** : Moteur de jeu & Évaluation IA

---

## Contexte
Le Backgammon moderne repose sur des réseaux de neurones (évaluation de positions et de videau) dont la référence absolue est **GNU Backgammon (GNUBG)**.
Nous avions deux exigences contradictoires :
1. **Zéro latence et jeu hors-ligne total** : Le joueur doit pouvoir déplacer ses pions, recevoir une évaluation de base et jouer contre l'IA sans connexion Internet ni latence réseau.
2. **Précision chirurgicale de tournoi (2-ply+) et rollouts profonds** : Les explications de blunders de haut niveau et les analyses post-partie nécessitent des calculs intensifs (chargement des poids neuronaux, explorations d'arbres à plusieurs demi-coups) inadaptés aux processeurs mobiles modestes ou aux batteries limitées.

## Décision
Nous adoptons une **architecture hybride adaptative à deux étages** :

1. **Étage Client (WebAssembly / Web Worker)** :
   - Évaluation temps réel en **0-ply et 1-ply**.
   - Exécution asynchrone isolée dans un Web Worker dédié ([`src/workers/gnubg.worker.ts`](file:///c:/Users/LAPTOP/Desktop/PROJET%20TUTO/BACKGAMMON/src/workers/gnubg.worker.ts)) pour garantir 60 FPS constants sur l'UI.
   - Fonctionne à 100% hors-ligne sur navigateur et mobile (Capacitor).

2. **Étage Serveur (Python FastAPI + GNUBG natif CLI)** :
   - Microservice dédié ([`backend-engine/`](file:///c:/Users/LAPTOP/Desktop/PROJET%20TUTO/BACKGAMMON/backend-engine)) exécutant le binaire natif Linux GNUBG (`gnubg -t`).
   - Prend en charge l'évaluation profonde **2-ply+** et les **rollouts statistiques multithreadés**.

3. **Orchestrateur Intelligent (`analysisService.ts`)** :
   - Si la profondeur demandée est ≤ 1-ply : routage direct vers le Web Worker WASM local.
   - Si la profondeur est ≥ 2-ply : requête vers `POST /api/evaluate`.
   - **Bascule adaptative (Circuit Breaker)** : Si le backend dépasse 800ms de latence moyenne (EMA) ou subit des échecs consécutifs, l'orchestrateur bascule automatiquement sur le worker WASM local en mode de secours dégradé sans jamais bloquer la partie.

## Conséquences

### Positives
- Fluidité absolue de jeu sans dépendance au réseau en cours de match.
- Zéro coût de calcul serveur pour 90% des interactions courantes de jeu.
- Précision maximale préservée pour l'analyse approfondie des blunders.
- Résilience native contre les pannes d'infrastructure backend.

### Négatives / Contraintes
- Nécessité de maintenir deux implémentations de communication (postMessage Worker vs HTTP REST).
- Double validation des formats de positions (chaînes XGID standardisées).
