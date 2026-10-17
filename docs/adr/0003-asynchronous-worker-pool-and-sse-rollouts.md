# ADR-003 : Pool de Workers Asynchrones & Streaming SSE pour Rollouts

- **Statut** : Accepté
- **Date** : 2026-10-16
- **Décideurs** : Équipe d'ingénierie Backgammon Suite
- **Domaine** : Backend GNUBG & Concurrence

---

## Contexte
Les rollouts profonds (simulation de centaines ou de milliers de parties complètes à partir d'une position pour trancher mathématiquement le meilleur coup de pion ou de videau) peuvent durer entre 10 secondes et plusieurs minutes.
Une requête HTTP synchrone classique présenterait des risques majeurs :
1. Timeout des passerelles web et reverse proxies (Cloudflare, Nginx, Vercel 15s limit).
2. Blocage des threads de traitement FastAPI.
3. Absence totale de retour visuel de progression pour l'utilisateur.
4. Impossibilité d'annuler un calcul coûteux si le joueur quitte la page.

## Décision
Nous implémentons un **gestionnaire de tâches asynchrone avec pool de workers et diffusion Server-Sent Events (SSE)** :

1. **Architecture du Pool de Workers (`gnubg_pool.py`)** :
   - Un pool de workers GNUBG configuré avec une taille adaptative (`min(cpu_count(), 4)`).
   - Chaque worker gère un sous-processus `gnubg -t` dédié, prévenant toute corruption d'état mémoire.
   - Les workers sont alloués de manière concurrente avec verrous asynchrones `asyncio.Semaphore`.

2. **Cycle de Vie des Jobs (`JobManager`)** :
   - Soumission : `POST /api/rollout` alloue un `jobId` unique (UUID) et retourne immédiatement un statut HTTP `202 Accepted`.
   - File d'attente FIFO asynchrone (`asyncio.Queue`) qui consomme les tâches dès qu'un worker est libéré.
   - Support natif de l'annulation via `POST /api/jobs/{job_id}/cancel`.

3. **Streaming SSE (`GET /api/jobs/{job_id}/stream`)** :
   - Flux d'événements text/event-stream transmettant en temps réel :
     - Pourcentage d'achèvement (`progress`: 0 à 100%).
     - Nombre d'essais terminés vs total (`trialsDone` / `totalTrials`).
     - Estimation du temps restant (`etaSeconds`).
     - Événement final `completed` avec les équités détaillées et l'intervalle de confiance statistique.

## Conséquences

### Positives
- Zéro risque de timeout HTTP ou de surcharge mémoire.
- Expérience utilisateur dynamique avec barre de progression temps réel sur l'UI Next.js.
- Économie des ressources CPU grâce à l'annulation immédiate des processus orphelins.

### Négatives / Contraintes
- Nécessite le maintien de structures en mémoire pour les jobs actifs (avec purge automatique après expiration).
