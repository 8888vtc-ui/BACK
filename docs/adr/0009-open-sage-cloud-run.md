# ADR 0009 : Microservice Open Sage sur Google Cloud Run comme Moteur Unique

- **Statut** : Accepté
- **Date** : 2026-10-22
- **Décideurs** : Équipe Technique & Métier
- **Remplace** :
  - `ADR 0001 : Hybrid WASM GNU Backgammon Engine`
  - `ADR 0008 : WildBG Neural Engine`

---

## 1. Contexte & Problématique

Le projet a successivement expérimenté :
1. **GNU Backgammon (WASM / Docker)** : précis mais lourd en mémoire, initialisation lente et complexe en conteneur.
2. **WildBG (WASM Rust/C local)** : instabilités, imprécisions sur certaines positions et difficulté de maintenance.

Le besoin impératif était de disposer d'un moteur de niveau **Super-Grand-Maître (PR < 0.30)**, ultra-fiable, capable de gérer les 4 niveaux de bots (Beginner, Intermediate, Expert, Grandmaster), l'évaluation continue du videau (Double / Take / Pass) selon les standards **Snowie 4 Pro** et **eXtreme Gammon 2 (XG2)**, tout en maintenant une latence d'analyse inférieure à 150 ms.

---

## 2. Décision Architecturale

Nous adoptons **Open Sage** (`bgsage-service/`) hébergé sur **Google Cloud Run** comme **moteur neuronal unique et faisant autorité** pour :
- Le jeu des bots IA (tous niveaux).
- Le Coach IA en temps réel (diagnostic des blunders et suggestions optimales).
- L'analyse du videau (doubler, accepter, passer).

### Caractéristiques de déploiement :
- **Service Cloud Run** : `https://bgsage-service-468274233732.europe-west1.run.app`
- **Endpoints clés** :
  - `GET /health` : sonde de disponibilité.
  - `POST /api/evaluate` : contrat unifié XGID avec métadonnées complètes (meilleur coup, liste ordonnée des coups candidats, probabilités de gain/gammon/backgammon, équité cubeful/cubeless, décision videau).
- **Client TypeScript** : `src/lib/engine/bgsageClient.ts` avec gestion des timeouts, repli gracieux et cache local.

---

## 3. Conséquences & Bénéfices

- **Précision maximale** : PR certifié à 0.23 en 2-ply et 3-ply.
- **Zéro dépendance binaire locale lourde** : Plus de compilation Rust/WASM locale ni de gros fichiers `.wasm` dans le bundle client Next.js.
- **Architecture unifiée** : Un seul contrat JSON canonique pour le bot et le Coach.
- **Résilience** : En cas de coupure réseau temporaire, le moteur dispose d'un repli local déterministe (`evaluator.ts` + table de bear-off) sans jamais bloquer l'expérience joueur.
