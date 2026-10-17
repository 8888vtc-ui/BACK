# ADR-005 : Observabilité Unifiée (Sentry, Logs JSON & Alertes)

- **Statut** : Accepté
- **Date** : 2026-10-17
- **Décideurs** : Équipe d'ingénierie Backgammon Suite
- **Domaine** : DevOps, Monitoring & Qualité de Service

---

## Contexte
La suite applicative est distribuée sur plusieurs runtimes :
- Navigateurs web hétérogènes et WebViews mobiles (Capacitor iOS/Android).
- Runtime Node.js SSR / API Routes (Next.js 15).
- Runtime Python 3.12 (FastAPI + sous-processus GNUBG).

Sans observabilité centralisée, le débogage d'une mauvaise évaluation, d'une rupture de communication ou d'un crash de rendu React sur mobile devient complexe et coûteux.

## Décision
Nous déployons un **écosystème d'observabilité standardisé à trois piliers** :

1. **Traçage Distribué & Gestion d'Erreurs Sentry** :
   - Initialisation unifiée via `@sentry/nextjs` (client, server, edge) et `sentry-sdk[fastapi]`.
   - Les contextes applicatifs (`userId`, `correlationId`, `xgid`, `ply`) sont attachés sous forme de tags Sentry.
   - Intégration dans le composant `ErrorBoundary` pour capturer les erreurs React avec la hiérarchie des composants (`componentStack`).

2. **Logs Structurés JSON & Corrélation de Bout en Bout** :
   - Toutes les couches émettent des logs JSON structurés :
     `{ timestamp, level, service, correlationId, message, context, error }`.
   - L'en-tête `X-Correlation-ID` est généré ou propagé dès l'entrée de la requête client et transmis au microservice backend.
   - Les ingesteurs de logs (Datadog, Grafana Loki, CloudWatch) indexent automatiquement ces métadonnées.

3. **Alerting Opérationnel & Sondes de Santé Dédiées** :
   - Moteur d'alerte avec déduplication anti-tempête (60s) surveillant les pics de latence (> 2.5s), les erreurs 429 de rate limiting et les ruptures de connectivité.
   - Découplage des sondes de santé :
     - `/health` : disponibilité historique.
     - `/health/ready` : readiness probe confirmant que le pool de workers GNUBG est initialisé.
     - `/health/live` : liveness probe rapide.
     - `/api/health` : diagnostic complet frontend/backend/mémoire.

## Conséquences

### Positives
- Diagnostic instantané de tout dysfonctionnement en production.
- Corrélation directe entre un clic utilisateur sur l'UI et l'exécution du worker GNUBG sous Linux.
- Respect strict de la vie privée (anonymisation PII par défaut).

### Négatives / Contraintes
- Légère surcharge réseau lors de l'envoi des rapports d'erreurs en mode dégradé (atténuée par le rate limiting interne de Sentry).
