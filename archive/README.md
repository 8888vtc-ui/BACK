# 🗄️ Archive — Code mort

> ⚠️ **Ne pas lire, ne pas s'en inspirer, ne pas modifier.**

Ce dossier contient du code **abandonné**, conservé uniquement pour l'historique :

| Sous-dossier | Contenu | Statut |
|---|---|---|
| `backend_engine_gnubg_legacy/` | Backend Python GNUBG (rollouts historiques) | Abandonné (ADR 0001) |
| `projet_abandonne_bot_non_fiable/` | WildBG (WASM, PR ~26,6 mesuré) | Abandonné (ADR 0008) |
| `docs_historiques/` | Documentation obsolète | Périmée |

Le moteur actif est **Open Sage** (`bgsage-service/`) avec repli local tri-phase
(`src/lib/engine/evaluator.ts`). Voir [`PROJECT_MAP.md`](../PROJECT_MAP.md).

Ce dossier est exclu de la compilation TypeScript (voir [`tsconfig.json`](../tsconfig.json)).
