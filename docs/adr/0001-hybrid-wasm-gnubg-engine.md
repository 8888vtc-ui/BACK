# ADR-001 : Moteur d'Évaluation TypeScript Tri-Phase 100 % Local

- **Statut** : Accepté (révisé 2026-10-18)
- **Date** : 2026-10-15
- **Décideurs** : Équipe d'ingénierie Backgammon Suite
- **Domaine** : Moteur de jeu & Évaluation IA

---

## Contexte
Le Backgammon moderne repose sur des évaluations de position et de videau de haute qualité. L'objectif du produit est d'être **100 % autonome, gratuit et sans serveur** (déploiement Netlify statique), avec une évaluation instantanée exécutée directement dans le navigateur.

## Décision
Nous adoptons un **moteur d'évaluation TypeScript pur à architecture tri-phase**, exécuté localement en moins de 1 ms :

1. **Étage Client (TypeScript pur)** :
   - Évaluateur tri-phase dans [`src/lib/engine/evaluator.ts`](file:///c:/Users/LAPTOP/Desktop/PROJET%20TUTO/BACKGAMMON/src/lib/engine/evaluator.ts) :
     - **RACE / Bear-Off** : formule de course de Thorp (Effective Pip Count + wastage).
     - **CONTACT** : 16 caractéristiques stratégiques (probabilité de frappe, prime, ancre, flèches clés).
     - **CRASHED** : positions écrasées évaluées avec les règles de contact.
   - Exécution asynchrone isolée dans un Web Worker dédié ([`src/workers/gnubg.worker.ts`](file:///c:/Users/LAPTOP/Desktop/PROJET%20TUTO/BACKGAMMON/src/workers/gnubg.worker.ts)).
   - Fonctionne à 100 % hors-ligne sur navigateur et mobile (Capacitor).

2. **Aucun binaire WASM ni serveur externe** :
   - Le fichier `/engine/gnubg.wasm` et les poids neuronaux n'existent pas dans le projet.
   - Le microservice Python optionnel ([`backend-engine/`](file:///c:/Users/LAPTOP/Desktop/PROJET%20TUTO/BACKGAMMON/backend-engine)) n'est **pas** branché en production ; il reste disponible pour une analyse profonde future, mais n'est pas requis.

## Conséquences

### Positives
- Fluidité absolue de jeu sans dépendance au réseau en cours de match.
- Zéro coût de calcul serveur, zéro latence réseau.
- Déploiement statique simple (Netlify), aucune infrastructure à maintenir.
- Transparence totale : l'interface reflète fidèlement le moteur réel.

### Négatives / Contraintes
- L'évaluation repose sur des heuristiques à coefficients calibrés, pas sur un réseau de neurones entraîné.
- La précision de tournoi (2-ply+ profond) est limitée par rapport à un vrai moteur GNU Backgammon.
