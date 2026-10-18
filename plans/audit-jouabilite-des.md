# Audit de Jouabilité des Dés — Vérification factuelle

> **Question** : la jouabilité des dés est-elle correcte ? Voit-on bien le dernier dé du joueur ? L'affichage correspond-il aux attentes des joueurs ?

---

## 1. Ce qui est CORRECT (vérifié dans le code)

| Élément | État | Détail |
|---|---|---|
| **Dés de l'adversaire affichés** | ✅ | [`page.tsx`](../src/app/page.tsx) ligne 1107 : « Dés IA : X - Y » dans le HUD + toast (ligne 308) |
| **Dernier dé restant visible** | ✅ | Le dé non utilisé est `bg-white text-slate-900` (contraste fort) |
| **Dé sélectionné mis en évidence** | ✅ | `ring-2 ring-sky-400` (anneau bleu) |
| **Dé utilisé désactivé** | ✅ | `disabled` + `opacity-60` |

---

## 2. Problèmes de jouabilité IDENTIFIÉS

### 🔴 P0 — Le dé utilisé devient illisible (`opacity-60`)

**Problème** : quand un joueur joue son premier dé, ce dé devient `opacity-60` (60% d'opacité) et `disabled`. Le joueur ne peut plus **relire clairement** la valeur du dé qu'il a déjà joué.

**Attente des joueurs** : le joueur doit pouvoir **voir** quel dé il a déjà utilisé (pour planifier son second coup), tout en comprenant qu'il est « consommé ».

**Correction** : au lieu de `opacity-60` (qui rend le dé illisible), utiliser un **état visuel distinct** qui conserve la lisibilité de la valeur :
- Garder la valeur lisible (pas d'opacité réduite).
- Indiquer « utilisé » par une **coche** ou un **fond grisé léger** (ex. `bg-slate-200 text-slate-500` au lieu de `opacity-60`).

### 🟠 P1 — Les dés de l'adversaire ne sont pas intégrés au plateau

**Problème** : les dés de l'adversaire sont affichés dans le HUD (« Dés IA : X - Y ») mais **pas sur le plateau** lui-même. Le joueur doit détourner le regard vers le HUD.

**Attente des joueurs** : voir les dés de l'adversaire **à côté du plateau** (comme sur un vrai plateau physique), pas dans un coin du HUD.

**Correction** : afficher les dés de l'adversaire dans la « rivière centrale » du plateau (à côté des dés du joueur), avec un style distinct (grisé ou marqué « IA »).

---

## 3. Réponse à la question

**La jouabilité des dés n'est PAS entièrement correcte.** Deux problèmes réels :

1. **Le dé utilisé devient illisible** (`opacity-60`) — le joueur ne peut pas relire quel dé il a joué.
2. **Les dés de l'adversaire sont dans le HUD, pas sur le plateau** — moins intuitif qu'un vrai plateau.

Ces deux points correspondent exactement aux critiques des concurrents (Galaxy : « hard to tell where the opponent moved », « dice are there after many seconds »).

---

## 4. Recommandations

| Priorité | Action | Impact | Risque |
|---|---|---|---|
| **P0** | Rendre le dé utilisé lisible (coche au lieu d'opacité) | ⭐⭐⭐⭐ | 🟢 faible |
| **P1** | Afficher les dés de l'adversaire sur le plateau | ⭐⭐⭐ | 🟢 faible |

**Recommandation** : exécuter **P0 d'abord** (lisibilité du dé utilisé), car c'est le problème le plus impactant et le plus simple à corriger (changement de classe CSS).
