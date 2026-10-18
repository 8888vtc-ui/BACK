# Alternatives à GNU Backgammon — moteurs d'évaluation open source

> **Contexte** : tu cherches une alternative à GNU Backgammon (gnubg) pour remplacer l'heuristique tri-phase actuelle par un vrai moteur neuronal, tout en restant idéalement 100 % autonome (navigateur, sans serveur).
>
> **Point clé découvert** : il existe **deux moteurs neuronaux open source modernes, sous licence permissive (MIT/Apache), qui tournent déjà en WebAssembly dans le navigateur**. C'est exactement ce qu'il faut pour éviter le problème de licence GPL de gnubg ET rester autonome.

---

## 🏆 Option 1 — Raccoon Backgammon (LA meilleure alternative)

**Source** : https://raccoonbg.com/ — https://github.com/... (code MIT)

| Critère | Détail |
|---|---|
| **Force** | **Plus fort que le réseau de GNU Backgammon lui-même** (réseau résiduel profond entraîné par distillation à grande échelle, méthodes modernes type AlphaZero). |
| **Licence** | **MIT** (code Python/PyTorch). Les poids entraînés sont distribués séparément. |
| **Exécution** | **100 % local, dans le navigateur via WebAssembly**. Aucun compte, aucun serveur, rien à installer. |
| **Fonctionnalités** | Analyse de position (coups classés, équité cubeless, split win/gammon/backgammon), import/export XGID (compatible XG et gnubg). |
| **Adéquation produit** | ⭐⭐⭐⭐⭐ — correspond exactement à la promesse « 100 % autonome et gratuit sur Netlify ». |

**Points à vérifier avant intégration** :
- La licence exacte des **poids entraînés** (le code est MIT, mais les poids « ship separately » — il faut confirmer leur licence et leur taille).
- Le format d'API (comment appeler l'inférence depuis TypeScript/Next.js).
- La taille du WASM + poids (impact sur le chargement initial).

---

## 🥈 Option 2 — wildbg (moteur neuronal Rust, WASM natif)

**Source** : https://github.com/carsten-wenderdel/wildbg

| Critère | Détail |
|---|---|
| **Force** | Moteur neuronal en **Rust**. Erreur ~5.9 (1-pointers) analysé par gnubg 2-ply (janvier 2024) — niveau solide, en progression. |
| **Licence** | **MIT OU Apache-2.0** (au choix) — permissive, aucun problème de contamination. |
| **Exécution** | **WebAssembly (JavaScript/TypeScript) documenté** (`docs/user/wildbg-wasm.md`), + API HTTP, + API C. |
| **Maturité** | ⚠️ **Alpha** — cube handling incomplet (issue #17), réseaux de démo faibles sur la branche main (les réseaux forts sont sur la branche `nets`). |
| **Adéquation produit** | ⭐⭐⭐⭐ — très prometteur (Rust→WASM est propre et rapide), mais moins mature que Raccoon. |

---

## 🥉 Option 3 — TD-Gammon réimplémentations (PyTorch, MIT)

**Sources** : `dellalibera/td-gammon`, `bobcohensf/backgammon`, `fomorians/td-gammon`, `TobiasVogt/TD-Gammon`

| Critère | Détail |
|---|---|
| **Force** | Réimplémentations de l'algorithme TD-Gammon (Tesauro 1992) — niveau expert historique. |
| **Licence** | **MIT** (la plupart). |
| **Exécution** | Python/PyTorch — **nécessite un serveur** (pas de WASM prêt à l'emploi). |
| **Adéquation produit** | ⭐⭐ — il faudrait exporter en ONNX puis WASM (chantier), ou héberger un serveur Python. Moins adapté que Raccoon/wildbg. |

---

## ⚠️ À écarter — Nodots Backgammon

**Source** : https://backgammon.nodots.com/

- Moteur **GPL-3.0** (npm `@nodots/backgammon-ai`), basé sur GNU Backgammon in-process.
- **Même problème de licence GPL que gnubg** — à écarter pour la même raison.

---

## SYNTHÈSE

| Critère | Raccoon | wildbg | TD-Gammon (PyTorch) |
|---|---|---|---|
| Force | ⭐⭐⭐⭐⭐ (bat gnubg) | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Licence | MIT (code) | MIT/Apache | MIT |
| WASM navigateur | ✅ natif | ✅ natif | ❌ (à exporter) |
| Autonomie | ✅ 100 % local | ✅ 100 % local | ❌ serveur |
| Maturité | ✅ production | ⚠️ alpha | ✅ (ancien) |
| Risque licence | 🟢 | 🟢 | 🟢 |

## RECOMMANDATION DE L'ARCHITECTE

**Raccoon Backgammon est la meilleure alternative à GNU Backgammon** :
1. **Plus fort que gnubg** (réseau résiduel moderne vs réseau 1990s).
2. **Licence MIT** (pas de contamination GPL).
3. **Déjà en WASM navigateur** — correspond exactement à la promesse « 100 % autonome et gratuit sur Netlify ».

**Prochaine étape concrète** : investiguer le dépôt Raccoon pour confirmer :
- la licence et la taille des poids entraînés ;
- l'API d'inférence (comment l'appeler depuis TypeScript) ;
- la faisabilité d'intégration dans `src/lib/engine/evaluator.ts` (remplacer `evaluateBoard` par un appel au WASM Raccoon, avec repli sur le tri-phase actuel).

Souhaites-tu que j'investigue le dépôt Raccoon en détail (licence des poids, API, taille) pour valider la faisabilité d'intégration ?
