# 🎲 Backgammon Tour — Cercle Monte-Carlo & Gammon Academy (Coach Grand-Maître IA)

[![CI - Quality, Tests & Builds](https://github.com/user/backgammon/actions/workflows/ci.yml/badge.svg)](https://github.com/user/backgammon/actions/workflows/ci.yml)
[![CD - Deployment](https://github.com/user/backgammon/actions/workflows/deploy.yml/badge.svg)](https://github.com/user/backgammon/actions/workflows/deploy.yml)

Plateforme officielle **Backgammon Tour** (`backgammontour.com`) & **Gammon Academy** (`gammonacademy.com`) — application web et mobile hybride (Next.js 15, React 19, Tailwind CSS, Capacitor) de Backgammon Tournament-grade avec direction artistique **Salon Privé Monte-Carlo** et **moteur d'évaluation hybride** :

- **Cloud (précision professionnelle)** : microservice **Open Sage** (`bgsage-service/`, PR 0.23, 4 niveaux de bot + videau Double/Take/Pass) déployé sur Google Cloud Run avec repli automatique sur le moteur local.
- **Local (offline, temps réel)** : évaluateur **tri-phase TypeScript** (`evaluator.ts` : Contact / Crashed / Race-BearOff) + bear-off exact (54 264 états) + Keith Count, derrière un point d'entrée unifié.

Analyse en temps réel, opening book certifié, drills de blunders, puzzles quotidiens et multijoueur en ligne. Le jeu et l'analyse rapide fonctionnent **100 % hors-ligne** ; le cloud ajoute la précision super-grand-maître et les rollouts profonds.

---

## 📚 Documentation
 
| Document | Rôle |
|---|---|
| [`SYSTEM_SPEC_PROFITABILITY_MANIFESTO.md`](SYSTEM_SPEC_PROFITABILITY_MANIFESTO.md) | **Loi Absolue du Dépôt** — Positionnement Hard Paywall (14.99 $/mo, 99 $/an), SLA Marge > 85%, Gemini 3.6, Zéro freemium passif. |
| [`PROJECT_MAP.md`](PROJECT_MAP.md) | **Carte d'orientation** — comprendre le projet en 1 minute, ajouter une fonction en 2 minutes. **Lire en premier.** |
| [`docs/BRAND_AND_SEO.md`](docs/BRAND_AND_SEO.md) | **Charte de Marque, Domaines, Logo & SEO** — architecture `backgammontour.com` & `gammonacademy.com`, blason Monte-Carlo et JSON-LD. |
| [`docs/MASTER_SPEC_EXCELLENCE.md`](docs/MASTER_SPEC_EXCELLENCE.md) | **Référentiel d'Excellence Master** — Spécifications absolues : Game Feel FLIP, Glicko-2 Composite, Psychoacoustique & Hard Paywall. |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Architecture détaillée (modules, flux, décisions). |
| [`SCALABILITY.md`](SCALABILITY.md) | Charte de scalabilité impérative (règles non négociables). |
| [`DOCS_ENGINE.md`](DOCS_ENGINE.md) | Architecture du moteur d'évaluation unifié (Open Sage Cloud Run + repli tri-phase local). |
| [`GOVERNANCE.md`](GOVERNANCE.md) | **Charte de gouvernance « Zéro Bug »** — 4 règles d'or architecturales et comportementales incompressibles. |

---

## 🚀 Démarrage Rapide

### Développement Local
```bash
# Installation des dépendances
npm install

# Validation lint & types
npm run lint
npm run typecheck

# Lancement en développement local
npm run dev

# Construction et lancement de production
npm run build
npm start
```

### Stack Complète via Docker Compose (Frontend + Microservice Open Sage)
```bash
# Lance le frontend sur :3000 et le backend bgsage sur :8080
docker compose up --build -d
```

---

## 🧪 Tests

### 1. Tests Unitaires & Composants (Vitest)

1 310 tests unitaires et d'intégration (224 fichiers de test, 0 échec) couvrant le moteur de règles, le benchmark Open Sage (4 niveaux de bots + videau), la priorité au dé le plus élevé, le coach IA Google Gemini (`gemini-3.8-flash` / `gemini-3.6`), la notation bijective (4 000 parties), la sécurité, l'observabilité (logger JSON, alertes, analytics produit) et l'interface :

```bash
npm test
```

### 2. Tests Backend Python & Open Sage (Pytest)

Tests validant l'API FastAPI, le parser XGID et l'évaluation Open Sage :

```bash
pytest bgsage-service/tests -v
```

### 3. Tests End-to-End (Playwright)

27 tests E2E vérifiant :
- **Partie complète** : Lancer de dés, cibles de déplacements, application des coups book, gestion du videau (double/take/pass), fin de manche et ouverture de la modal de Review Post-partie (`e2e/game-flow.spec.ts`).
- **Déclenchement du coach** : Diagnostic de blunder, métriques de match MET Kazaross, bascule automatique / manuelle, mode dégradé hors-ligne, streaming de l'explication grand-maître et fermeture (`e2e/coach.spec.ts`).
- **Authentification** : Bouton de connexion HUD, modale OAuth (Google / Apple), bascule d'onglets Connexion / Inscription, validation formulaire et fermeture (`e2e/auth.spec.ts`).
- **Viewports mobile** : Ergonomie responsive sur iPhone 13 (390x844) et Pixel 5 (393x851), cibles tactiles WCAG ≥ 44px, sélecteur tactile de dé mobile (`mobile-dice-selector`) et interactions tactiles sans débordement (`e2e/mobile-viewports.spec.ts`).

```bash
# Exécuter toute la suite E2E sur Desktop Chrome
npm run test:e2e:desktop

# Exécuter la suite sur les Viewports Mobile (iPhone 13 & Pixel 5)
npm run test:e2e:mobile

# Exécuter l'ensemble des scénarios
npm run test:e2e

# Interface interactive Playwright UI
npm run test:e2e:ui
```

### 4. Microservice Backend & Tests Open Sage (Docker)

```bash
cd bgsage-service
docker build -t bgsage-service .
docker run --rm bgsage-service pytest -v tests/test_api.py
```

---

## 🔍 Observabilité & Monitoring

Le système intègre une solution complète de surveillance et de monitoring en production :

- **Sentry (Frontend & Backend)** : Traçage des erreurs et des performances avec replays de session et capture des crashs React via `ErrorBoundary`.
- **Logs Structurés JSON** : Format JSON standardisé avec corrélation par requête (`X-Correlation-ID`) compatible Datadog, Grafana Loki, CloudWatch.
- **Sondes de Santé (Health-Checks)** :
  - Frontend : `GET /api/health` (ping actif du backend, mémoire heap/rss, statut Supabase).
  - Backend Open Sage (`bgsage-service`) : `GET /health` (statut du moteur neuronal `bgsage` sur Google Cloud Run).
- **Alerting Opérationnel** : Détection des anomalies (latence > 2.5s, 429 rate limit, échecs consécutifs) avec déduplication et forward webhook (Slack/Discord).
- **Analytics Produit (RGPD)** : Télémétrie d'usage sans cookies tiers, avec consentement préalable et support pluggable (GA4, PostHog).
- Documentation complète : [`docs/MONITORING.md`](file:///c:/Users/LAPTOP/Desktop/PROJET%20TUTO/BACKGAMMON/docs/MONITORING.md).

---

## 🚢 CI/CD & Déploiement

Le projet intègre une chaîne d'intégration et de déploiement continu automatisée avec **GitHub Actions** :

- **Pipeline CI (`.github/workflows/ci.yml`)** : Exécute ESLint, TypeScript Typecheck, Vitest (1 310 tests sur 224 fichiers), Pytest (`bgsage-service/tests`), build de l'image Docker `bgsage-service` et Playwright E2E.
- **Pipeline CD (`.github/workflows/deploy.yml`)** : Déploie automatiquement le frontend sur **Vercel** ou **Netlify**, et déploie le microservice **Open Sage (`bgsage-service`)** sur **Google Cloud Run** / **GHCR**.
- **Configurations dédiées** :
  - [`vercel.json`](file:///c:/Users/LAPTOP/Desktop/PROJET%20TUTO/BACKGAMMON/vercel.json) : Configuration Next.js & en-têtes de sécurité
  - [`netlify.toml`](file:///c:/Users/LAPTOP/Desktop/PROJET%20TUTO/BACKGAMMON/netlify.toml) : Plugin Netlify Next.js & en-têtes de sécurité
  - [`docker-compose.yml`](file:///c:/Users/LAPTOP/Desktop/PROJET%20TUTO/BACKGAMMON/docker-compose.yml) : Orchestration multi-conteneurs pour VPS / production
  - [`docs/DEVOPS_CICD.md`](file:///c:/Users/LAPTOP/Desktop/PROJET%20TUTO/BACKGAMMON/docs/DEVOPS_CICD.md) : Guide complet d'architecture et de configuration des secrets.

---

## 📱 Packaging Stores & Mobile Release (iOS & Android)

La publication sur l'**Apple App Store** et le **Google Play Store** est entièrement instrumentée :

- **Signature Automatisée** : Support de Keystore Release Android (AAB) et ExportOptions iOS (IPA) pour l'identifiant `com.backgammontour.app`.
- **Génération des Captures d'Écran** : Script Playwright [`scripts/capture-store-screenshots.mjs`](file:///c:/Users/LAPTOP/Desktop/PROJET%20TUTO/BACKGAMMON/scripts/capture-store-screenshots.mjs) couvrant les dimensions officielles (iPhone 6.7", iPhone 6.5", iPad 12.9", Smartphones & Tablettes Android).
- **Fiches de Métadonnées Multilingues (6 Langues)** : Fiches complètes dans `store-assets/metadata/` (`fr-FR`, `en-US`, `es-ES`, `pt-BR`, `de-DE`, `ar-SA`).
- **Pipeline de Release Mobile** : Workflow GitHub Actions [`.github/workflows/release-mobile.yml`](file:///c:/Users/LAPTOP/Desktop/PROJET%20TUTO/BACKGAMMON/.github/workflows/release-mobile.yml) et configuration [`fastlane/Fastfile`](file:///c:/Users/LAPTOP/Desktop/PROJET%20TUTO/BACKGAMMON/fastlane/Fastfile).
- Guide complet : [`docs/MOBILE_STORE_PACKAGING.md`](file:///c:/Users/LAPTOP/Desktop/PROJET%20TUTO/BACKGAMMON/docs/MOBILE_STORE_PACKAGING.md).

---

## 📚 Documentation Complète & Références

| Document | Description |
|---|---|
| [**Guide Utilisateur & Manuel de Jeu**](file:///c:/Users/LAPTOP/Desktop/PROJET%20TUTO/BACKGAMMON/docs/USER_GUIDE.md) | Manuel exhaustif : règles de tournoi WBGF, Smart Click, coach IA, videau, Academy, puzzles FSRS, audit Provably Fair et multijoueur. |
| [**Référence de l'API**](file:///c:/Users/LAPTOP/Desktop/PROJET%20TUTO/BACKGAMMON/docs/API_REFERENCE.md) | Spécification des endpoints REST, flux SSE (rollouts, coach, review), quota `402`, Stripe Billing et rate-limiting. |
| [**Index des ADRs d'Architecture**](file:///c:/Users/LAPTOP/Desktop/PROJET%20TUTO/BACKGAMMON/docs/adr/README.md) | Les 9 décisions d'architecture structurantes (`ADR-001` à `ADR-009` : Open Sage Cloud Run, Capacitor, Workers SSE, Anti-triche, Sentry, Offline). |
| [**Plan d'Action Produit**](file:///c:/Users/LAPTOP/Desktop/PROJET%20TUTO/BACKGAMMON/docs/PLAN_ACTION_PRODUIT.md) | État d'avancement consolidé (Octobre 2026) et feuille de route P1/P2. |
| [**Guide de Contribution (CONTRIBUTING)**](file:///c:/Users/LAPTOP/Desktop/PROJET%20TUTO/BACKGAMMON/CONTRIBUTING.md) | Prérequis, installation locale, standards de code, tests et processus de Pull Request. |
| [**Architecture Système Globale**](file:///c:/Users/LAPTOP/Desktop/PROJET%20TUTO/BACKGAMMON/ARCHITECTURE.md) | Spécification technique, modèle de données, extracteur de concepts et moteur de règles. |
| [**Observabilité & Monitoring**](file:///c:/Users/LAPTOP/Desktop/PROJET%20TUTO/BACKGAMMON/docs/MONITORING.md) | Guide Sentry, logs structurés JSON, alertes temps réel, sondes de santé et analytics RGPD. |
| [**DevOps & CI/CD**](file:///c:/Users/LAPTOP/Desktop/PROJET%20TUTO/BACKGAMMON/docs/DEVOPS_CICD.md) | Pipelines GitHub Actions, déploiement Vercel / Netlify et conteneurisation Docker GHCR. |
| [**Packaging Mobile Stores**](file:///c:/Users/LAPTOP/Desktop/PROJET%20TUTO/BACKGAMMON/docs/MOBILE_STORE_PACKAGING.md) | Signature Android/iOS, captures d'écran Playwright, fiches stores et Fastlane. |
| [**Spécification Multijoueur**](file:///c:/Users/LAPTOP/Desktop/PROJET%20TUTO/BACKGAMMON/docs/MULTIPLAYER_REALTIME_SPEC.md) | Canaux Supabase Realtime, protocole de synchronisation d'état et horloges Fischer. |
| [**Audit de Sécurité RLS**](file:///c:/Users/LAPTOP/Desktop/PROJET%20TUTO/BACKGAMMON/docs/RLS_SECURITY_AUDIT.md) | Audit des politiques de sécurité Row Level Security et étanchéité des données. |



