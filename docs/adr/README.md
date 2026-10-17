# Architecture Decision Records (ADR) — Backgammon Suite

Ce répertoire consigne l'historique de toutes les décisions d'architecture structurantes prises au cours de la conception et du développement de l'application **Backgammon Pro**.

Chaque décision suit le format standardisé de Michael Nygard (Statut, Contexte, Décision, Conséquences).

---

## Index des Décisions

| Référence | Titre | Statut | Date | Domaine |
|---|---|---|---|---|
| [**ADR-001**](file:///c:/Users/LAPTOP/Desktop/PROJET%20TUTO/BACKGAMMON/docs/adr/0001-hybrid-wasm-gnubg-engine.md) | Architecture Hybride Client WASM / Backend Neural GNUBG | **Accepté** | 2026-10-15 | Moteur & IA |
| [**ADR-002**](file:///c:/Users/LAPTOP/Desktop/PROJET%20TUTO/BACKGAMMON/docs/adr/0002-nextjs-app-router-and-capacitor-export.md) | Next.js 15 App Router & Export Statique Capacitor | **Accepté** | 2026-10-15 | Frontend & Mobile |
| [**ADR-003**](file:///c:/Users/LAPTOP/Desktop/PROJET%20TUTO/BACKGAMMON/docs/adr/0003-asynchronous-worker-pool-and-sse-rollouts.md) | Pool de Workers Asynchrones & Streaming SSE pour Rollouts | **Accepté** | 2026-10-16 | Backend & Concurrence |
| [**ADR-004**](file:///c:/Users/LAPTOP/Desktop/PROJET%20TUTO/BACKGAMMON/docs/adr/0004-realtime-multiplayer-and-authoritative-validation.md) | Multijoueur Supabase Realtime & Validation Serveur Anti-Triche | **Accepté** | 2026-10-16 | Multijoueur & Sécurité |
| [**ADR-005**](file:///c:/Users/LAPTOP/Desktop/PROJET%20TUTO/BACKGAMMON/docs/adr/0005-unified-observability-and-structured-logging.md) | Observabilité Unifiée (Sentry, Logs JSON & Alertes) | **Accepté** | 2026-10-17 | DevOps & Surveillance |
| [**ADR-006**](file:///c:/Users/LAPTOP/Desktop/PROJET%20TUTO/BACKGAMMON/docs/adr/0006-local-first-offline-resilience.md) | Stratégie Local-First (IndexedDB, SQLite & SyncQueue) | **Accepté** | 2026-10-17 | Stockage & Hors-ligne |
