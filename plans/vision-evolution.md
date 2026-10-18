# Vision d'Évolution du Projet — Backgammon Pro

> **Date** : Octobre 2026. Synthèse stratégique de l'état actuel et des trajectoires d'évolution.

---

## 1. État actuel (bilan factuel)

### Moteur d'IA — 3 générations + 2 niveaux de profondeur

| Génération | Moteur | Force (PR) | Statut |
|---|---|---|---|
| **G1** | Heuristique tri-phase (Option A) | PR ~24 (contact) | ✅ Actif (repli) |
| **G2** | Bear-off exact + Keith Count | PR 0.00 (bear-off) | ✅ Actif |
| **G3a** | **XG-Web Expert (2-ply)** | PR ~0.55 | ✅ Fonctionnel |
| **G3b** | **XG-Web Grand-Maître XG++++ (3-ply sélectif)** | **PR ~2.75** | ✅ Fonctionnel, dominant |

**Hiérarchie des niveaux XG-Web** (même moteur Rust, profondeur différente) :
- **Expert (2-ply)** : expectiminimax 2-ply standard, < 50 ms/coup.
- **Grand-Maître XG++++ (3-ply sélectif)** : approfondissement à 3-ply sur les positions critiques (ΔEq ≥ 0.040), < 100 ms/coup, réseau distillé sur **15M positions**.

**Duels mesurés** :
- XG-Web (2-ply) écrase l'Option A : **73.33% vs 26.67%**, PR 0.00 vs 24.24.
- XG++++ (3-ply) bat l'Expert (2-ply) : **55% vs 45%** sur 100 parties.

### Interface — 8 améliorations UX livrées

Pip count différentiel, roll-off cliquable, dés vectoriels, flèches coach, videau dynamique, badges, thème flat, inversion d'orientation. **673 tests verts.**

---

## 2. Les 3 trajectoires d'évolution

### Trajectoire A — Consolider le moteur Grand-Maître (XG-Web)

**Objectif** : faire du moteur WASM 2-ply le moteur par défaut (jeu + coach), avec l'Option A comme repli.

**Actions** :
1. Brancher `xgEngine.worker.ts` au jeu et au coach (actuellement non branché).
2. Unifier les 3 moteurs en un seul point d'entrée.
3. Mesurer le PR réel vs gnubg/XG sur un corpus de référence.

**Impact** : force Grand-Maître partout, cohérence IA/coach.

### Trajectoire B — L'ERH (Error Rate Humain) — différenciation R&D

**Objectif** : dépasser le PR classique (GTO) avec un modèle **exploitatif et psychologique** entre humains, documenté dans [`erh-error-rate-humain.md`](plans/erh-error-rate-humain.md).

**Concept** : l'ERH mesure l'écart par rapport à la décision optimale **exploitant les biais cognitifs de l'adversaire réel** (frileux au videau, gambler, aversion au risque), pas par rapport à un ordinateur parfait.

**Impact** : différenciation produit unique (aucun concurrent ne propose cela), positionnement « coach psychologique ».

### Trajectoire C — Polissage produit & distribution

**Objectif** : consolider la jouabilité, l'accessibilité et la distribution mobile.

**Actions** :
1. Réactiver les tests e2e (jouabilité, accessibilité clavier).
2. Découper les composants monolithiques (`page.tsx` 1483 lignes, `MatchHud.tsx` 766 lignes).
3. Finaliser le packaging mobile (Capacitor, stores).

---

## 3. Recommandation stratégique

**Ordre d'exécution** :

1. **Trajectoire A d'abord** (brancher XG-Web) : c'est le gain de force le plus immédiat et le plus impactant. Le moteur Grand-Maître est déjà fonctionnel et dominant — il ne manque que le branchement.

2. **Trajectoire B ensuite** (ERH) : c'est la **différenciation stratégique** à long terme. Aucun concurrent (Galaxy, XG, Nextgammon) ne propose un coach psychologique exploitatif. C'est le positionnement qui distingue Backgammon Pro.

3. **Trajectoire C en continu** (polissage) : jouabilité, accessibilité, distribution.

---

## 4. Vision à 12 mois

Backgammon Pro devient :
- **Le moteur le plus fort en client-side** (XG-Web WASM 2-ply, PR 0.00, < 2 Mo, hors-ligne).
- **Le seul coach psychologique** (ERH) qui apprend à exploiter les faiblesses humaines, pas juste à réciter les tables GTO.
- **L'expérience la plus fluide** (zéro latence, dés instantanés, UX pro).

Le positionnement : **« le backgammon des Grands-Maîtres, avec un coach qui lit l'âme de l'adversaire »**.
