# ADR-002 : Next.js 15 App Router & Export Statique Capacitor

- **Statut** : Accepté
- **Date** : 2026-10-15
- **Décideurs** : Équipe d'ingénierie Backgammon Suite
- **Domaine** : Frontend & Application Mobile

---

## Contexte
L'application doit cibler simultanément :
1. Le **Web moderne** (SEO, rendu serveur, API routes de streaming LLM `/api/coach` et proxy de sécurité).
2. Les plateformes mobiles natives **iOS et Android** via **Capacitor 8**, qui exigent impérativement des fichiers statiques locaux (`out/index.html`, bundles JS/CSS) embarqués dans la WebView de l'application native.

Les architectures classiques maintiennent souvent deux dépôts distincts (Next.js pour le web et Vite/React Native pour le mobile), entraînant une duplication de code colossale pour l'état du jeu, les composants d'échiquier et les moteurs de règles.

## Décision
Nous choisissons **une base de code unique Next.js 15 App Router** dotée d'une double stratégie de compilation :

1. **Compilation Web Standard (Serveur / Vercel / Netlify / Docker)** :
   - Mode par défaut : `output: undefined` dans `next.config.mjs`.
   - Toutes les routes API dynamiques (`/api/coach`, `/api/evaluate`, `/api/health`, `/api/multiplayer/validate-action`) et le middleware de sécurité sont actifs.

2. **Compilation Mobile Dédiée (`scripts/build-mobile.mjs`)** :
   - Positionne la variable d'environnement `CAPACITOR_BUILD=true`.
   - Active `output: 'export'` et `images: { unoptimized: true }` dans `next.config.mjs`.
   - Isole temporairement les route handlers dynamiques non compatibles avec l'export statique strict avant de déclencher `next build`.
   - Génère le répertoire statique `out/` puis exécute automatiquement `npx cap sync` pour propager les assets compilés dans `android/app/src/main/assets/public/` et `ios/App/App/public/`.

## Conséquences

### Positives
- **100% de logique partagée** : Règles du jeu, composants React 19, i18n, gestion du videau et styling Tailwind sont partagés à la ligne de code près.
- Un seul framework, un seul pipeline de tests unitaire (Vitest).
- Les fonctionnalités mobiles natives (Capacitor Haptics, Capacitor SQLite, Share) sont invoquées via des couches d'abstraction légères sans impacter le web.

### Négatives / Contraintes
- Nécessité d'exécuter `npm run build:mobile` spécifiquement lors du packaging des binaires natifs.
- Les fonctionnalités reposant sur les Route Handlers serveur nécessitent un fallback hors-ligne côté client mobile (ex. explication heuristique de secours pour le coach si le terminal est hors-ligne).
