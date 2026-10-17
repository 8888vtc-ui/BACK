# backend-engine — Microservice d'analyse Backgammon (gnubg)

Microservice Python (FastAPI) qui interroge le moteur neuronal **GNU Backgammon**
via son binaire CLI `gnubg -t`, piloté par sous-processus.

C'est le **backend d'analyse profonde** (2-ply+) de l'architecture hybride : il
sert la review post-partie et l'approfondissement à la demande. Le coach temps
réel (0-ply/1-ply) reste côté client en WebAssembly.

## Lancer avec Docker

```bash
docker build -t backgammon-engine .
docker run --rm -p 8000:8000 backgammon-engine
```

## Lancer en local (sans Docker)

Prérequis : `gnubg` installé (`apt-get install gnubg` sur Debian/Ubuntu).

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## API

### `POST /api/evaluate`

Requête :

```json
{
  "xgid": "XGID=-b----E-C---eE---c-e----B-:0:0:1:42:0:0:0:0:10",
  "ply": 2
}
```

Réponse :

```json
{
  "chequerPlay": [
    {
      "rank": 1,
      "notation": "8/5 6/5",
      "equity": 0.123,
      "equityLoss": 0.0,
      "probabilities": {
        "win": 0.532, "winGammon": 0.15, "winBackgammon": 0.005,
        "loseWin": 0.468, "loseGammon": 0.12, "loseBackgammon": 0.004
      }
    }
  ],
  "cubeDecision": {
    "noDouble": 0.123,
    "doubleTake": 0.15,
    "doublePass": 1.0,
    "optimalAction": "Double, take"
  }
}
```

- `equityLoss` = `equity - equity(best)` : 0 pour le meilleur coup, négatif sinon.
- `cubeDecision` : champs `null` si la décision de videau n'est pas disponible
  (ex. videau possédé par l'adversaire).

### `GET /health`

Vérifie que le service répond.

## Tests

### 1. Tests unitaires (sans gnubg requis)

Les tests des parsers et des endpoints de l'API utilisent des fixtures et des mocks :

```bash
pip install -r requirements.txt
pytest tests/test_parsers.py tests/test_api.py -v
```

### 2. Tests d'intégration contre le VRAI binaire `gnubg` (Docker)

Un conteneur Docker installe le véritable binaire `gnubg` (`/usr/games/gnubg`) et valide :
- La communication CLI (`gnubg -t`) en sous-processus.
- Le parsing des coups de pions (`chequerplay`) sur positions réelles :
  - **Ouverture 3-1** : coup optimal `8/5 6/5` (équité ~+0.155), probabilités de gain/gammon/backgammon et pertes d'équité.
  - **Ouverture 4-2** : coup optimal `8/4 6/4` (équité ~+0.095).
  - **Bear-off** : situation de sortie de pions rapide `2/off 1/off`.
- Le parsing des décisions de videau (`cube decision`) :
  - Détection de l'action optimale (`Double, take`, `No double`, `Pass`).
  - Parsing des marges et pourcentages (ex. `No Double, take (28.9%)`).
- L'endpoint FastAPI `/api/evaluate` de bout en bout contre le vrai moteur.

#### Lancement direct avec Docker :
```bash
docker build -t backgammon-engine .
docker run --rm backgammon-engine pytest -v tests/test_integration_gnubg.py
```

#### Lancement avec Docker Compose :
```bash
docker compose -f docker-compose.test.yml up --build --abort-on-container-exit
```

#### Via les scripts dédiés :
- **Linux / macOS / WSL / Git Bash** :
  ```bash
  ./run_docker_tests.sh
  ```
- **Windows (PowerShell)** :
  ```powershell
  .\run_docker_tests.ps1
  ```

## Notes de conception

- **Un process gnubg par requête** : robuste (pas d'état partagé ni de détection
  de prompt), au prix d'un démarrage de ~1-2 s (chargement des poids NN).
- **Commandes gnubg utilisées** : `set board <xgid>` (gnubg parse le XGID
  nativement), `set evaluation chequerplay plies N`, `set evaluation
  cubedecision plies N`, `hint`, et `set dice 0 0` pour forcer la décision de
  videau.
- **Licence** : l'image embarque GNU Backgammon (GPL). Sans conséquence pour un
  projet d'apprentissage ; à valider juridiquement avant commercialisation.