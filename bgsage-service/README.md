# bgsage-service (Open Sage — Google Cloud Run)

Microservice backend d'évaluation de positions et de videau de backgammon adossé au moteur
neuronal open source **Open Sage** ([`bgsage`](https://github.com/markbgsage/bgsage)).

- **URL de production (Cloud Run)** : `https://bgsage-service-468274233732.europe-west1.run.app`
- **Projet GCP** : `gurugammon` (`europe-west1`)

## Niveaux de Bots exposés

| Paramètre `ply` | Niveau Open Sage | PR mesuré (vs 3-ply) | Usage Frontend |
|---:|---|---:|---|
| `3` | `BgBotAnalyzer(eval_level="3ply")` | **0.00 PR** | Bot `grandmaster` & Coach IA |
| `2` | `BgBotAnalyzer(eval_level="2ply")` | **2.22 PR** | Bot `expert` |
| `1` | `BgBotAnalyzer(eval_level="1ply")` | **4.89 PR** | Bot `intermediate` (& `beginner` avec bruit $\pm 0.14\text{ Eq}$ $\rightarrow$ **15.07 PR**) |

## Endpoints

- `GET /health` — santé du service (`{"status": "ok", "engine": "bgsage"}`).
- `POST /api/evaluate` — contrat principal du frontend Next.js (`bgsageClient.ts`) :
  - Accepte un `xgid` (format frontend 11 champs ou format canonique XG 10 champs) et `ply` (`1..3`).
  - Retourne `chequerPlay` (coups classés avec `notation`, `equity`, `cubelessEquity`, `equityLoss`, `probabilities`, `board` 26 entiers, `playerGamePlan`, `opponentGamePlan`), `cubeDecision` (`noDouble`, `doubleTake`, `doublePass`, `optimalAction`), `gamePlans` et `isRace`.
  - Si les dés sont à `0` (`dice = null`), évalue uniquement `cubeDecision` et `gamePlans` (utilisé pour les décisions de videau avant le lancer des dés).
- `POST /api/evaluate-board` — évaluation directe depuis un tableau de 26 entiers (`board`, `dice`, `ply`).
- `POST /api/selfplay` — simulation de parties complètes entre deux bots Open Sage (`player1_ply`, `player2_ply`, `games`, `seed`).
- `POST /analyze` — analyse structurée avec probabilités non cumulatives.

## Convention du plateau `bgsage` (26 entiers)

- `board[0]` : barre de l'adversaire ($\le 0$ en entrée)
- `board[1..24]` : flèches 1 à 24 ($> 0$ = joueur au trait qui avance de $24 \to 1$, $< 0$ = adversaire qui avance de $1 \to 24$)
- `board[25]` : barre du joueur au trait ($\ge 0$ en entrée)

## Déploiement Google Cloud Run

```bash
gcloud run deploy bgsage-service \
  --source bgsage-service \
  --project gurugammon \
  --region europe-west1 \
  --platform managed \
  --allow-unauthenticated \
  --min-instances 0 \
  --max-instances 10 \
  --concurrency 2 \
  --memory 2Gi \
  --cpu 4
```
