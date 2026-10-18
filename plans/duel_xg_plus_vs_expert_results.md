# Rapport du Duel : XG++++ (3-Ply Sélectif) vs Expert (2-Ply)

- **Date** : 2026-10-18T13:23:31.955Z
- **Volume** : 100 parties simulées en multi-threading
- **Temps total** : 150.5 s (~2.5 min)

## 1. Tableau des Scores (50% X / 50% O alterné)
| Moteur | Niveau | Victoires | Taux de gain | Gammons | Points totaux |
|---|---|---|---|---|---|
| **XG++++** | **Grand-Maître (3-Ply Sélectif)** | **55** | **55.00 %** | **12** | **69** |
| **Expert** | **Maître (2-Ply standard)** | 45 | 45.00 % | 11 | 57 |

## 2. Analyse de la Plus-Value du 3-Ply Sélectif
L'approfondissement à 3-ply sur les positions critiques ($Delta E le 0.040$) permet à XG++++ de :
1. Déjouer les faux-semblants tactiques où un coup semble acceptable à 2-ply mais s'effondre après la réplique adverse.
2. Prendre l'avantage à long terme même face à un moteur 2-ply déjà extrêmement fort (PR 0.55).
