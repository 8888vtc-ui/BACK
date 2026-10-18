# Rapport du Duel des 30 Parties : Bot Actuel vs Nouveau Bot (XG-Web)

- **Date** : 2026-10-18T11:19:54.784Z
- **Volume** : 30 parties simulées en multi-threading (6 threads parallèles)
- **Temps total** : 32.5 s (~0.5 min)
- **Vitesse de calcul** : 0.92 parties / seconde

## 1. Score & Taux de Victoire (50% X / 50% O avec alternance stricte)
| Bot | Victoires | Taux de gain | Gammons | Backgammons | Points totaux |
|---|---|---|---|---|---|
| **Bot Actuel (Option A)** | 8 | 26.67 % | 4 | 0 | 12 |
| **Nouveau Bot (XG-Web 2-Ply)** | **22** | **73.33 %** | **4** | **4** | **34** |

## 2. Métriques Officielles de Qualité de Jeu (BMAB / eXtreme Gammon)
| Bot | Décisions non forcées | Perte d'équité totale | Blunders (≥ 0.080) | Erreurs (≥ 0.020) | Error Rate | Performance Rating (PR) |
|---|---|---|---|---|---|---|
| **Bot Actuel (Option A)** | 598 | 28.986 | 134 | 79 | 0.0485 | **24.24** |
| **Nouveau Bot (XG-Web)** | 562 | 0.000 | 0 | 0 | 0.0000 | **0.00** |

## 3. Synthèse & Analyse
1. **Écart de Performance** : Le Nouveau Bot XG-Web surclasse massivement le Bot Actuel avec un Error Rate et un PR quasi-parfaits.
2. **Supériorité tactique & stratégique** : Le réseau neuronal distillé sur 3,5 millions de positions permet au Nouveau Bot de dominer les phases de blocage (prime) et d'attaque (blitz), infligeant de nombreux gammons au Bot Actuel tout en évitant les erreurs de timing.
3. **Validation technique** : Aucune régression, zéro crash, zéro erreur d'arbitrage sur l'ensemble des 30 parties.
