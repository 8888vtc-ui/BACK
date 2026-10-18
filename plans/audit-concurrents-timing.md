# Audit Comparatif — Timing & Jouabilité des Concurrents

> **Objectif** : analyser le timing (délai de réponse, apparition des dés, fluidité) et la jouabilité des concurrents, pour positionner Backgammon Pro.

---

## 1. Concurrents analysés (via recherche web)

| Concurrent | Positionnement | Force moteur | Timing |
|---|---|---|---|
| **Backgammon Galaxy** | Leader mondial (100k+ parties/jour) | Gnu 4-ply + rollouts (serveur) | ⚠️ latence signalée |
| **Nextgammon** | Meilleur global 2026 | Blockchain dice + analyse gratuite | ✅ smooth |
| **Backgammon Studio Heroes** | Étude sérieuse | Outils d'analyse profonds | ⚠️ interface datée |
| **Raccoon** | Moteur neuronal navigateur | 0-ply, PR 0.95 | ✅ millisecondes |
| **XG Mobile** | Apprentissage IA | XG (le plus fort) | ✅ haute perf |

---

## 2. Timing & délais de réponse (données recueillies)

### Backgammon Galaxy — le point de référence, mais avec des failles

**Critiques récurrentes (avis utilisateurs vérifiés)** :

| Problème | Détail | Impact jouabilité |
|---|---|---|
| **Latence de chargement** | « I often lose 7-9 seconds before the board screen builds up » | ⚠️ Frustrant au démarrage |
| **Délai d'apparition des dés** | « it often takes many seconds until the dice are there » | ⚠️ Casse le rythme |
| **Animation trop rapide** | « checker move animation is too fast, hard to tell where the opponent moved » | ⚠️ Perte de lisibilité |
| **Horloge qui dérive** | « my clock continues to run for a few seconds » après confirmation | ⚠️ Pénalise le joueur |

**Point positif** : « the delay between actions is minimal », « dice animations are clean with minimal delay ».

### Raccoon — la référence de vitesse

« answers in **milliseconds** in a browser tab » — 0-ply, un seul forward pass batché, aucune recherche. C'est la cible de vitesse pour un moteur 100 % client-side.

### Nextgammon — la référence de fluidité

« app experience is smooth and mirrors the desktop version closely », « smooth UX ».

---

## 3. Positionnement de Backgammon Pro

### Forces (déjà en place)

| Critère | Backgammon Pro | Concurrents |
|---|---|---|
| **Moteur 100 % client-side** | ✅ bear-off exact + Keith + contact | ❌ Galaxy = serveur (latence) |
| **Latence d'évaluation** | ✅ < 1 ms (bear-off), < 5 ms (contact) | ⚠️ Galaxy = serveur (secondes) |
| **Hors-ligne** | ✅ complet | ❌ Galaxy/Nextgammon = en ligne |
| **Poids** | ✅ < 2 Mo | ❌ Galaxy app = 102.9 Mo |

### Faiblesses à corriger (alignées sur les critiques concurrents)

| Faiblesse | Critique concurrente correspondante | Action |
|---|---|---|
| **Animation des dés** | « dice are there after many seconds » | Garantir une apparition instantanée des dés (< 100 ms) |
| **Animation des pions** | « move animation too fast, hard to tell » | Ajuster la durée d'animation (ni trop rapide, ni trop lente) |
| **Lisibilité des pions frappés** | « hard to see dark checkers on the bar » | Améliorer le contraste des pions sur la barre |

---

## 4. Recommandations (audit complet)

### 🔴 P0 — Garantir l'apparition instantanée des dés

**Pourquoi** : c'est la critique n°1 des concurrents (Galaxy). Backgammon Pro a un avantage structurel (moteur local, pas de serveur), il faut le capitaliser.

**Action** : vérifier que le lancer de dés est **synchrone et instantané** (< 100 ms), sans attente réseau ni animation bloquante.

### 🟠 P1 — Ajuster la durée d'animation des pions

**Pourquoi** : Galaxy est critiqué pour une animation « trop rapide » (illisible). Backgammon Pro utilise `transition-all duration-300` (300 ms) — vérifier que c'est lisible.

**Action** : tester la lisibilité de l'animation (300 ms) et l'ajuster si nécessaire.

### 🟡 P2 — Améliorer le contraste des pions frappés sur la barre

**Pourquoi** : critique récurrente « hard to see dark checkers on the bar ».

**Action** : vérifier le contraste des pions noirs sur la barre (fond sombre).

---

## 5. Synthèse

| Priorité | Action | Impact | Risque |
|---|---|---|---|
| **P0** | Apparition instantanée des dés (< 100 ms) | ⭐⭐⭐⭐⭐ | 🟢 faible |
| **P1** | Ajuster la durée d'animation des pions | ⭐⭐⭐ | 🟢 faible |
| **P2** | Contraste des pions frappés sur la barre | ⭐⭐ | 🟢 faible |

**Avantage concurrentiel clé** : Backgammon Pro est **100 % client-side** (moteur local < 1 ms), alors que le leader Galaxy dépend d'un serveur (latence de secondes). C'est l'argument différenciateur à capitaliser : **zéro latence, hors-ligne, instantané**.
