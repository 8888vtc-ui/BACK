# Référence Complète de l'API — Backgammon Pro

Cette documentation décrit l'ensemble des points d'accès (**Endpoints REST**), des flux **Server-Sent Events (SSE)** et des protocoles de communication de la suite Backgammon Pro.

---

## 1. Vue d'Ensemble & Sécurité

### 1.1 Architecture des Services
- **Passerelle Web & Client Applicatif** : Next.js 15 App Router (port local : `3000`).
- **Moteur d'Analyse Neuronal Open Sage** : Microservice FastAPI Python + C++ `bgsage` (Google Cloud Run / port local : `8080`).
  - Production : `https://bgsage-service-468274233732.europe-west1.run.app`

### 1.2 En-têtes HTTP de Sécurité
Toutes les réponses de l'API incluent automatiquement les en-têtes suivants :
```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
X-Correlation-ID: <UUID-v4>
```

### 1.3 Limitation de Débit (Rate Limiting)
- Seuil standard : **60 requêtes par minute** par adresse IP sur les endpoints de calcul (`/api/evaluate`, `/analyze`).
- En cas de dépassement, l'API répond avec le code HTTP **`429 Too Many Requests`** accompagné des en-têtes :
  - `Retry-After: 60`
  - `X-RateLimit-Limit: 60`
  - `X-RateLimit-Remaining: 0`

---

## 2. Endpoints du Moteur d'Analyse (Open Sage / bgsage)

### 2.1 Évaluer une Position — `POST /api/evaluate`

Analyse une position XGID donnée via le moteur neuronal Open Sage : fournit le meilleur coup, les coups candidats ordonnés, l'équité, et l'analyse de décision de videau.

- **URL** : `/api/evaluate`
- **Méthode** : `POST`
- **En-têtes** :
  - `Content-Type: application/json`
  - `X-Correlation-ID` *(optionnel)* : Identifiant de traçage distribué

#### Corps de la Requête (JSON)
| Champ | Type | Obligatoire | Description |
|---|---|---|---|
| `xgid` | `string` | **Oui** | Position au format standard XGID (longueur : 5 à 150 caractères). |
| `ply` | `integer` | Non | Profondeur d'analyse en demi-coups (défaut : `2`, min : `0`, max : `4`). |

```json
{
  "xgid": "XGID=-b----E-C---eE---c-e----B-:0:0:1:42:0:0:0:0:10",
  "ply": 2
}
```

#### Réponse de Succès — `200 OK`
```json
{
  "chequerPlay": [
    {
      "rank": 1,
      "notation": "8/4 6/4",
      "equity": 0.095,
      "equityLoss": 0.0,
      "probabilities": {
        "win": 0.525,
        "winGammon": 0.142,
        "winBackgammon": 0.005,
        "loseWin": 0.475,
        "loseGammon": 0.128,
        "loseBackgammon": 0.004
      }
    },
    {
      "rank": 2,
      "notation": "24/20 13/11",
      "equity": -0.012,
      "equityLoss": -0.107,
      "probabilities": {
        "win": 0.495,
        "winGammon": 0.125,
        "winBackgammon": 0.003,
        "loseWin": 0.505,
        "loseGammon": 0.141,
        "loseBackgammon": 0.005
      }
    }
  ],
  "cubeDecision": {
    "noDouble": 0.095,
    "doubleTake": 0.118,
    "doublePass": 1.0,
    "optimalAction": "No double, take"
  }
}
```

---

### 2.2 Soumettre un Rollout Profond — `POST /api/rollout`

Soumet un job de simulation statistique asynchrone (Rollout) dans la file d'attente du pool de workers GNUBG.

- **URL** : `/api/rollout`
- **Méthode** : `POST`

#### Corps de la Requête (JSON)
```json
{
  "xgid": "XGID=-b----E-C---eE---c-e----B-:0:0:1:42:0:0:0:0:10",
  "ply": 2,
  "trials": 1296,
  "seed": 42
}
```

#### Réponse — `202 Accepted`
```json
{
  "jobId": "rollout-f8a32b14-49c0-482a",
  "status": "queued",
  "createdAt": 1773722400.0,
  "progress": {
    "jobId": "rollout-f8a32b14-49c0-482a",
    "status": "queued",
    "progress": 0.0,
    "trialsDone": 0,
    "totalTrials": 1296,
    "currentStep": "En attente d'un worker..."
  }
}
```

---

### 2.3 Streaming de Progression du Rollout — `GET /api/rollout/{jobId}/stream`

Diffuse en temps réel les étapes et pourcentages d'achèvement d'un rollout via **Server-Sent Events (SSE)**.

- **URL** : `/api/rollout/{jobId}/stream` (et état ponctuel via `GET /api/rollout/{jobId}`)
- **Méthode** : `GET`
- **Content-Type** : `text/event-stream`

#### Flux d'Événements SSE
```http
event: progress
data: {"jobId": "rollout-f8a32b14", "status": "running", "progress": 35.5, "trialsDone": 460, "totalTrials": 1296, "etaSeconds": 8.2}

event: progress
data: {"jobId": "rollout-f8a32b14", "status": "running", "progress": 78.0, "trialsDone": 1010, "totalTrials": 1296, "etaSeconds": 2.5}

event: completed
data: {"jobId": "rollout-f8a32b14", "status": "completed", "result": {"bestMove": "8/4 6/4", "equity": 0.098, "confidenceInterval": "±0.012"}}
```

---

### 2.4 Annulation d'un Rollout — `POST /api/rollout/{jobId}/cancel`

Interrompt immédiatement le calcul du rollout et libère le worker alloué.

- **URL** : `/api/rollout/{jobId}/cancel`
- **Méthode** : `POST`
- **Réponse** : `200 OK` avec `status: "cancelled"`.

---

### 2.5 Statistiques du Pool de Workers — `GET /api/pool/stats`

Renvoie les métriques instantanées de charge du pool de workers.

#### Réponse — `200 OK`
```json
{
  "poolSize": 4,
  "idleWorkers": 3,
  "busyWorkers": 1,
  "queuedJobs": 0,
  "completedJobs": 24,
  "failedJobs": 0
}
```

---

## 3. Endpoints du Coach Grand-Maître & IA

### 3.1 Streaming de l'Explication Pédagogique — `POST /api/coach`

Génère une explication grand-maître en flux continu décrivant pourquoi le coup joué est une erreur par rapport au coup optimal, en s'appuyant sur les concepts extraits (primes, ancres, blots, pip counts) et le Cache L2 partagé Supabase (`coach_explanations`).

- **URL** : `/api/coach`
- **Méthode** : `POST`
- **Content-Type** : `application/json` (requête) -> `text/event-stream` (réponse)

#### Corps de la Requête (JSON)
```json
{
  "playedMove": "24/20 13/11",
  "bestMove": "8/4 6/4",
  "equityLoss": -0.107,
  "lang": "fr",
  "matchContext": {
    "scoreX": 3,
    "scoreO": 2,
    "matchLength": 5,
    "isCrawford": false,
    "cubeValue": 1
  },
  "extractedConcepts": {
    "blotsCount": 2,
    "primeLength": 3,
    "pipDiff": 8
  }
}
```

#### Événements SSE Reçus (`200 OK`)
```http
event: token
data: {"text": "Votre coup 24/20 13/11 laisse deux pions vulnérables..."}

event: token
data: {"text": " Le coup optimal 8/4 6/4 sécurise immédiatement le point 4 stratégique."}

event: done
data: {"cached": false, "provider": "llm"}
```

#### Réponse Quota Dépassé — `402 Payment Required` (Soft Paywall)
Lorsque l'utilisateur gratuit a consommé ses **3 analyses Coach IA offertes sur 24h glissantes**, l'endpoint retourne :
```json
{
  "error": "QUOTA_EXCEEDED",
  "message": "Vous avez utilisé vos 3 analyses Coach IA gratuites aujourd'hui.",
  "usedToday": 3,
  "dailyLimit": 3,
  "resetAt": "2026-10-24T00:00:00.000Z",
  "upgradeUrl": "/pricing"
}
```

---

### 3.2 Synthèse & Cours IA Post-Match — `POST /api/coach/review`

Génère en streaming SSE le cours pédagogique complet de fin de match (forces, axes de travail, leçons prioritaires) à partir du bilan `CompleteGameAnalysis`. Soumis au même contrôle de quota (`402 Payment Required` au-delà de 3 analyses gratuites / 24h pour les comptes non-VIP).

- **URL** : `/api/coach/review`
- **Méthode** : `POST`
- **Content-Type** : `application/json` -> `text/event-stream`

---

## 4. Endpoints de Validation d'Autorité Multijoueur

### 4.1 Valider une Action de Jeu — `POST /api/multiplayer/validate-action`

Endpoint serveur d'autorité garantissant l'intégrité anti-triche des parties multijoueur.

- **URL** : `/api/multiplayer/validate-action`
- **Méthode** : `POST`

#### Corps de la Requête (JSON)
```json
{
  "roomId": "room-88fa-1234",
  "actionType": "move",
  "turn": "X",
  "dice": [4, 2],
  "moves": [
    { "from": 8, "to": 4 },
    { "from": 6, "to": 4 }
  ],
  "currentBoard": [0, -2, 0, 0, 0, 0, 5, 0, 3, 0, 0, 0, -5, 5, 0, 0, 0, -3, 0, -5, 0, 0, 0, 0, 2, 0]
}
```

#### Réponses
- **`200 OK`** : Coup légal validé par les règles officielles.
  ```json
  {
    "valid": true,
    "resultingBoard": [...],
    "pipCounts": { "X": 167, "O": 167 }
  }
  ```
- **`400 Bad Request`** : Violation des règles (ex. tentative de déplacement illégal).
  ```json
  {
    "valid": false,
    "error": "Mouvement illégal : point de destination bloqué par plus de deux pions adverses."
  }
  ```

---

## 5. Endpoints Stripe Billing & Abonnements VIP

### 5.1 Créer une Session Stripe Checkout — `POST /api/stripe/checkout`

Crée une session de paiement sécurisée Stripe Checkout pour l'un des plans VIP (`coach_monthly` à 9,99 €/mois, `coach_annual` à 79,99 €/an avec 7 jours d'essai, `club_chouette` à 149,99 €/an).

- **URL** : `/api/stripe/checkout`
- **Méthode** : `POST`
- **Corps de la Requête (JSON)** :
  ```json
  {
    "planId": "coach_annual",
    "userId": "usr-uuid",
    "email": "champion@backgammontour.com"
  }
  ```
- **Réponse — `200 OK`** :
  ```json
  {
    "url": "https://checkout.stripe.com/c/pay/cs_live_...",
    "sessionId": "cs_live_..."
  }
  ```

### 5.2 Webhook de Synchronisation Stripe — `POST /api/stripe/webhook`

Vérifie la signature cryptographique `Stripe-Signature` et synchronise les événements `checkout.session.completed`, `customer.subscription.updated` et `customer.subscription.deleted` dans la table Supabase `user_subscriptions`.

---

## 6. Sondes de Santé & Monitoring

| Endpoint | Méthode | Destination | Description | Format Réponse |
|---|---|---|---|---|
| `/api/health` | `GET` | Open Sage (`bgsage-service`) | Disponibilité du microservice neuronal Cloud Run. | `{"status": "ok", "engine": "bgsage"}` |
| `/api/health` | `GET` | Frontend Next.js | Diagnostic global : ping actif du backend, heap mémoire et état Supabase. | `{"status": "ok", "checks": {"backendEngine": {"status": "ok", "latencyMs": 14}, ...}}` |
