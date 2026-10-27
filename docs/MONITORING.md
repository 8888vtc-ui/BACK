# Observabilité & Monitoring — Backgammon Pro

Ce document détaille l'architecture de surveillance opérationnelle, d'alerte, de traçage d'erreurs (**Sentry**), de **logs structurés JSON**, de **sondes de santé (health-checks)** et d'**analytics produit**.

---

## 1. Vue d'Ensemble de l'Observabilité

```mermaid
flowchart LR
    subgraph Frontend["Frontend (Next.js 15 / Client & Server)"]
        UI["Composants React & ErrorBoundary"]
        SentryFE["Sentry SDK (Client & Node.js)"]
        JSONLogFE["Logger Structuré JSON"]
        AlertFE["Alert Manager"]
        Analytics["Product Analytics (RGPD)"]
        HealthFE["GET /api/health"]

        UI --> SentryFE
        UI --> JSONLogFE
        JSONLogFE --> AlertFE
        UI --> Analytics
    end

    subgraph Backend["Backend Open Sage (Python 3.11 / FastAPI bgsage-service)"]
        FastAPI["Endpoints FastAPI Open Sage"]
        SentryBE["Sentry SDK / Cloud Run Logs"]
        JSONLogBE["Logger Structuré (Cloud Logging)"]
        AlertBE["Backend Alert Manager"]
        HealthBE["GET /health"]

        FastAPI --> SentryBE
        FastAPI --> JSONLogBE
        JSONLogBE --> AlertBE
    end

    subgraph External["Plateformes Externes d'Ingestion"]
        SentryCloud["Sentry.io (Traces & Exceptions)"]
        LogDrain["Ingesteurs Logs (Datadog / Loki / CloudWatch)"]
        Webhook["Webhooks Alertes (Slack / Discord)"]
        ProductTelemetry["Analytics (PostHog / GA4)"]
    end

    SentryFE & SentryBE --> SentryCloud
    JSONLogFE & JSONLogBE --> LogDrain
    AlertFE & AlertBE --> Webhook
    Analytics --> ProductTelemetry
    HealthFE -.-> HealthBE
```

---

## 2. Intégration Sentry (Frontend & Backend)

### 2.1 Configuration Frontend
Le SDK `@sentry/nextjs` est initialisé à travers trois points d'entrée :
- [`sentry.client.config.ts`](file:///c:/Users/LAPTOP/Desktop/PROJET%20TUTO/BACKGAMMON/sentry.client.config.ts) : Capture les exceptions côté navigateur avec replays de session en cas d'erreur.
- [`sentry.server.config.ts`](file:///c:/Users/LAPTOP/Desktop/PROJET%20TUTO/BACKGAMMON/sentry.server.config.ts) : Capture les erreurs Node.js lors du rendu SSR et des routes API.
- [`sentry.edge.config.ts`](file:///c:/Users/LAPTOP/Desktop/PROJET%20TUTO/BACKGAMMON/sentry.edge.config.ts) : Initialisation pour le runtime Edge (middleware).
- [`src/lib/monitoring/sentry.ts`](file:///c:/Users/LAPTOP/Desktop/PROJET%20TUTO/BACKGAMMON/src/lib/monitoring/sentry.ts) : Module centralisé fournissant `captureException`, `captureMessage`, `setMonitoringUser`, `addMonitoringBreadcrumb`.
- Intégration dans le composant [`src/components/common/ErrorBoundary.tsx`](file:///c:/Users/LAPTOP/Desktop/PROJET%20TUTO/BACKGAMMON/src/components/common/ErrorBoundary.tsx) pour remonter automatiquement les crashs de rendu React avec le `componentStack`.

### 2.2 Configuration Backend (FastAPI Open Sage)
- [`bgsage-service/app/main.py`](file:///c:/Users/LAPTOP/Desktop/PROJET%20TUTO/BACKGAMMON/bgsage-service/app/main.py) :
  - Microservice FastAPI déployé sur Google Cloud Run (`bgsage-service`, Python 3.11) exposant `/health`, `/api/evaluate`, `/api/evaluate-board` et `/api/selfplay`.
  - *(Note : l'ancien service `backend-engine/` a été archivé sous `archive/backend_engine_gnubg_legacy/`).*

### Variables d'Environnement :
| Variable | Contexte | Description |
|---|---|---|
| `NEXT_PUBLIC_SENTRY_DSN` | Frontend | DSN public pour les erreurs du navigateur |
| `SENTRY_DSN` | Frontend & Backend | DSN serveur pour les routes API et le microservice Python |

---

## 3. Logs Structurés JSON

### 3.1 Côté Serveur Next.js & Client
Le module [`src/lib/monitoring/logger.ts`](file:///c:/Users/LAPTOP/Desktop/PROJET%20TUTO/BACKGAMMON/src/lib/monitoring/logger.ts) produit :
- **En environnement serveur** : Des lignes JSON conformes aux agrégateurs de logs (Datadog, Loki, CloudWatch, Vercel Log Drain) :
  ```json
  {
    "timestamp": "2026-10-17T06:25:00.000Z",
    "level": "info",
    "service": "backgammon-app",
    "correlationId": "req-98f2-1a2b",
    "message": "Succès opération: evaluate_position",
    "context": { "ply": 2, "durationMs": 42 }
  }
  ```
- **En environnement client** : Un format lisible avec horodatage et contexte dépliable dans les DevTools.
- **Propagation de Corrélation** : Support des `child` loggers pour lier les logs à un `correlationId` ou `userId`.

### 3.2 Côté Backend Python (`bgsage-service`)
Le microservice [`bgsage-service/app/main.py`](file:///c:/Users/LAPTOP/Desktop/PROJET%20TUTO/BACKGAMMON/bgsage-service/app/main.py) journalise les requêtes entrantes et leur latence d'évaluation Open Sage sur Google Cloud Logging.

---

## 4. Sondes de Santé (Health-Checks)

### 4.1 Backend Open Sage (`bgsage-service` — FastAPI)

| Endpoint | Méthode | Rôle | Format de Réponse |
|---|---|---|---|
| `/health` | `GET` | Sonde de disponibilité principale (utilisée par `docker-compose.yml` et Google Cloud Run). | `{"status": "ok", "engine": "bgsage"}` |

### 4.2 Frontend Web App (Next.js)

| Endpoint | Méthode | Rôle | Format de Réponse |
|---|---|---|---|
| `/api/health` | `GET` | Diagnostic complet du frontend. Ping actif du backend (`/health`), vérification de la mémoire Node.js (RSS / Heap) et de Supabase. | Code `200` si tout est sain, ou `207 Multi-Status` (`status: "degraded"`) avec détails d'erreur si le backend est indisponible. |

---

## 5. Système d'Alerte Opérationnel

Le module [`src/lib/monitoring/alerts.ts`](file:///c:/Users/LAPTOP/Desktop/PROJET%20TUTO/BACKGAMMON/src/lib/monitoring/alerts.ts) surveille les anomalies en temps réel :

- **Types d'Alertes Gérées** :
  - `HIGH_LATENCY` : Latence anormale sur les évaluations (> 2.5s).
  - `CONSECUTIVE_FAILURES` : Échecs répétés de communication réseau.
  - `RATE_LIMIT_TRIGGERED` : Pic de code HTTP 429.
  - `CRITICAL_ERROR` : Exceptions non interceptées dans les workers.
- **Protection Anti-Tempête (Debounce)** : Déduplication automatique des alertes identiques sur une fenêtre glissante de 60 secondes.
- **Canaux de Dispatch** :
  - Notification Sentry avec sévérité adaptée.
  - Envoi Webhook externe (Slack, Discord, PagerDuty) via la variable `ALERT_WEBHOOK_URL`.

---

## 6. Analytics Produit & Télémétrie

Le module [`src/lib/analytics/productAnalytics.ts`](file:///c:/Users/LAPTOP/Desktop/PROJET%20TUTO/BACKGAMMON/src/lib/analytics/productAnalytics.ts) assure le suivi produit dans le strict respect du **RGPD** :

- **Consentement Utilisateur** : Aucun événement n'est émis tant que le consentement n'est pas accordé (`analytics.setConsent(false)` bloque et vide le buffer).
- **Taxonomie des Événements** :
  - `game_started` : Difficulté, longueur de match, mode Crawford.
  - `game_completed` : Vainqueur, score, durée, Performance Rating (PR), nombre de blunders.
  - `coach_requested` : Origine du déclencheur (manuel, alerte blunder, review).
  - `coach_explanation_viewed` : Type de coup, sévérité, provider (LLM vs heuristique), durée.
  - `deep_rollout_submitted` : Profondeur (ply), nombre d'essais (trials).
  - `cube_action` : Décision de videau (double, take, pass).
  - `drill_completed` / `daily_puzzle_completed` : Taux de réussite et tentatives.
- **Compatibilité Multi-Fournisseurs** :
  - Google Analytics 4 via `gtag`.
  - PostHog via `window.posthog`.
  - Mode console sécurisé en développement local.
