# Guide de Contribution — Backgammon Tour & Gammon Academy

Merci de vous intéresser à la contribution sur **Backgammon Tour — Cercle Monte-Carlo & Gammon Academy** ! Ce projet vise à offrir la meilleure expérience de Backgammon compétitif et d'entraînement assisté par IA.

---

## 1. Code de Conduite

Nous nous engageons à offrir un environnement accueillant, respectueux et bienveillant pour l'ensemble des contributeurs, quel que soit leur niveau d'expérience. Tout comportement inapproprié ou irrespectueux sera modéré.

---

## 2. Prérequis & Environnement de Développement

Pour compiler et tester l'ensemble du projet, vous aurez besoin de :
- **Node.js** : Version `20.x` ou supérieure (avec `npm 10+`).
- **Python** : Version `3.11+` avec `pip`.
- **Docker & Docker Compose** *(recommandé)* : Pour exécuter le microservice d'analyse neuronal **Open Sage (`bgsage-service`)**.
- **Git** : Pour le versionnement du code.

---

## 3. Installation Locale Pas-à-Pas

### 3.1 Cloner le Dépôt
```bash
git clone https://github.com/votre-orga/backgammon.git
cd backgammon
```

### 3.2 Installer les Dépendances Frontend (Next.js 15)
```bash
npm install
```

### 3.3 Installer les Dépendances Backend (FastAPI Open Sage)
```bash
# Optionnel : activez un environnement virtuel
python -m venv venv
# Linux / macOS : source venv/bin/activate
# Windows : .\venv\Scripts\Activate.ps1

pip install -r bgsage-service/requirements.txt -r bgsage-service/requirements-dev.txt
```

### 3.4 Lancer l'Application en Développement
```bash
# Terminal 1 : Frontend Next.js
npm run dev

# Terminal 2 (optionnel si vous travaillez sur le moteur localement) : Backend Open Sage
cd bgsage-service
uvicorn app.main:app --reload --port 8080
```
L'application web est accessible sur `http://localhost:3000`.

---

## 4. Stack Complète via Docker Compose

Pour tester l'intégralité de la pile (Frontend + Microservice Open Sage `bgsage-service`) en conditions de production :
```bash
docker compose up --build -d
```
- Frontend : `http://localhost:3000`
- Backend Open Sage : `http://localhost:8080` (sonde `GET /health`)

---

## 5. Commandes de Validation & Tests

Avant de soumettre toute modification, vous devez vous assurer que **100% de la suite de tests et de typage réussit** :

| Commande | Rôle | Seuil d'Acceptation |
|---|---|---|
| `npm run lint` | Validation ESLint | **0 erreur** (code de sortie 0) |
| `npm run typecheck` | Validation TypeScript | **0 erreur de typage** |
| `npm test` | Suite de tests unitaires Vitest | **1 310+ tests réussis (224+ fichiers, 0 échec)** |
| `pytest bgsage-service/tests -v` | Tests unitaires Python Open Sage | **100% des tests passés** |
| `npm run test:e2e:desktop` | Tests End-to-End Playwright | **27 tests E2E passés** |
| `npm run build` | Build de production Next.js | **Compilation sans erreur** |

---

## 6. Conventions de Code & Standards

### 6.1 TypeScript & React 19
- **Typage Strict** : Évitez tout usage de `any`. Définissez des interfaces ou types dédiés.
- **Règles des Hooks** : Ne jamais appeler de Hooks de manière conditionnelle ou après un retour prématuré (`return`).
- **Accessibilité (a11y)** : Tous les éléments interactifs doivent posséder un label aria explicite, respecter les cibles tactiles WCAG ≥ 44px et supporter la navigation au clavier.
- **Internationalisation (i18n)** : Tout texte affiché à l'utilisateur doit être extrait dans les dictionnaires i18n (6 langues supportées : `fr`, `en`, `es`, `pt`, `de`, `ar` dans `src/i18n/` et `src/lib/i18n/translations/`).

### 6.2 Python & FastAPI
- Respectez la convention **PEP 8**.
- Tous les modèles de requêtes/réponses d'API doivent être typés via **Pydantic v2**.
- Les logs doivent impérativement transiter par `structured_logger` pour maintenir le format JSON.

### 6.3 Conventions de Commits (Conventional Commits)
Rédigez vos messages de commit selon la convention standard :
- `feat: ajouter la détection des ancres avancées dans le coach`
- `fix: corriger le calcul du score de Crawford en fin de manche`
- `docs: mettre à jour le guide utilisateur sur les rollouts`
- `test: ajouter un test d'intégration sur l'horloge Fischer`
- `refactor: simplifier la gestion des thèmes du plateau`

---

## 7. Processus de Pull Request (PR)

1. **Créer une branche de travail thématique** :
   ```bash
   git checkout -b feat/nom-de-votre-fonctionnalite
   ```
2. **Développer et ajouter des tests** couvrant votre nouvelle logique.
3. **Valider localement** :
   ```bash
   npm run lint && npm run typecheck && npm test && npm run build
   ```
4. **Ouvrir une Pull Request** avec une description détaillée de votre changement, des captures d'écran si l'interface est modifiée, et le lien vers l'issue associée.
5. Les workflows GitHub Actions s'exécuteront automatiquement pour valider votre PR.
