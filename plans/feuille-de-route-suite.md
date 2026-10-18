# Feuille de route — Suite recommandée pour le bon fonctionnement du jeu

> **Contexte** : l'Option A (table exacte de bear-off + Keith Count) est déployée et validée (601 tests verts, build OK, ~18 Ko ajoutés). Ce document liste les actions restantes, priorisées, pour garantir un jeu **correct, léger et maintenable**.

---

## Constat d'architecture (vérifié)

- Le jeu orchestre l'IA via [`useBackgammonGame.ts`](../src/hooks/useBackgammonGame.ts) qui appelle **directement** [`evaluateBoard()`](../src/lib/engine/evaluator.ts) (lignes 923 et 1157). **Les améliorations bear-off/Keith sont donc déjà actives en production.**
- Le Web Worker [`gnubg.worker.ts`](../src/workers/gnubg.worker.ts) appelle aussi `evaluateBoard`/`analyzeBoardMoves`/`analyzeBoardCube` — même moteur, cohérent.
- Le module [`raccoon/`](../src/lib/engine/raccoon/index.ts) est **du code mort** : ses fonctions (`evaluateBoardWithRaccoon`, etc.) ne sont importées nulle part dans le code applicatif. Il référence `onnxruntime-web` (~48 Mo de modèle + ~10 Mo de runtime WASM), en **contradiction totale** avec le cahier des charges (< 2 Mo).

---

## Priorité 1 — Nettoyer le code mort Raccoon (cohérence + poids)

**Pourquoi** : `onnxruntime-web` est encore dans [`package.json`](../package.json) (dépendance `^1.20.1`). Même si le module n'est pas importé, la dépendance alourdit `node_modules`, le lockfile, et risque d'être ré-importée par erreur. Le cahier des charges exclut définitivement Raccoon.

**Actions** :
1. Supprimer le dossier [`src/lib/engine/raccoon/`](../src/lib/engine/raccoon/index.ts) (index, raccoonEngine, encoder, adapter, types) et son test [`encoder.test.ts`](../src/lib/engine/raccoon/encoder.test.ts).
2. Retirer `onnxruntime-web` de [`package.json`](../package.json) (`npm uninstall onnxruntime-web`).
3. Vérifier qu'aucun import résiduel ne référence `raccoon` ou `onnxruntime-web`.
4. Relancer `npx tsc --noEmit` + `npx vitest run` (les 601 tests doivent rester verts, moins les tests Raccoon supprimés).

**Risque** : faible. Aucun code applicatif ne dépend de Raccoon.

---

## Priorité 2 — Tests différentiels bear-off vs référence (garantie PR 0.00)

**Pourquoi** : la table de bear-off est mathématiquement exacte, mais il faut la **prouver** sur des positions de référence publiées (gnubg/XG), pas seulement sur des cas d'école.

**Actions** :
1. Constituer un jeu de ~20 positions de bear-off avec équités de référence connues (issues de gnubg 2-ply ou de la littérature).
2. Ajouter un test [`bearoffTable.reference.test.ts`](../src/lib/engine/bearoffTable.test.ts) qui compare `bearoffExpectedRolls` aux valeurs attendues (tolérance stricte).
3. Vérifier que `analyzeBoardMoves` en bear-off pur choisit le coup optimal (PR 0.00) sur ces positions.

---

## Priorité 3 — Valider la décision de videau en course (Keith) sur cas réels

**Pourquoi** : `evaluateKeithCube` est branché dans [`analyzeBoardCube`](../src/lib/engine/evaluator.ts) en régime RACE. Il faut vérifier qu'il ne régresse pas les décisions de videau existantes (Janowski) sur des positions de course réelles.

**Actions** :
1. Ajouter des tests de non-régression sur `analyzeBoardCube` en course pure (double/take/pass).
2. Comparer `evaluateKeithCube` vs les seuils Janowski sur un échantillon de positions de course.
3. Ajuster les seuils (2 pips double, 4 pips pass) si les tests révèlent des écarts.

---

## Priorité 4 — Mesurer la taille réelle du bundle et le temps de génération

**Pourquoi** : la table de bear-off est générée au runtime (~108 Ko en mémoire, ~600 ms une seule fois). Il faut confirmer que ce coût est acceptable sur mobile 4G.

**Actions** :
1. Mesurer le temps de génération de la table sur un profil mobile (throttling CPU).
2. Si > 1 s, envisager de **précalculer la table en fichier statique** (`public/data/bearoff.bin`, ~108 Ko) chargé en lazy, au lieu de la générer au démarrage.
3. Confirmer que le First Load JS reste < 200 Ko.

---

## Priorité 5 — Documentation et ADR

**Pourquoi** : la gouvernance exige une traçabilité des décisions d'architecture.

**Actions** :
1. Ajouter un ADR [`docs/adr/0007-bearoff-exact-keith-count.md`](../docs/adr/README.md) documentant le choix de l'Option A.
2. Mettre à jour [`ARCHITECTURE.md`](../ARCHITECTURE.md) et [`PROJECT_MAP.md`](../PROJECT_MAP.md) pour refléter les nouveaux modules.

---

## Synthèse des priorités

| Priorité | Action | Impact | Risque |
|---|---|---|---|
| 1 | Supprimer Raccoon + `onnxruntime-web` | Cohérence, poids, conformité cahier des charges | 🟢 faible |
| 2 | Tests différentiels bear-off | Garantie PR 0.00 | 🟢 faible |
| 3 | Valider videau Keith en course | Fiabilité des décisions | 🟡 moyen |
| 4 | Mesurer bundle + temps génération | Performance mobile | 🟡 moyen |
| 5 | ADR + documentation | Traçabilité gouvernance | 🟢 faible |

**Recommandation** : exécuter dans l'ordre 1 → 2 → 3 → 4 → 5. La Priorité 1 est la plus urgente car elle élimine une dépendance de ~58 Mo en contradiction avec le cahier des charges, sans aucun risque fonctionnel.
