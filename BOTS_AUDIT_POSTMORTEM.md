# POST-MORTEM — Bots locaux non exploitables & PR inventés (2026-11-01)

> **Statut : OBLIGATOIRE À LIRE.** Ce document dit la vérité sur nos bots. Il prime sur tout texte marketing
> (README, commentaires « certifié », « Goliath », « Grand-Maître ») qui le contredirait.

---

## 1. Ce qu'on a fait de travers

Nous avons construit et vanté des **bots locaux** (BT-Core « 3-ply », BT-ERH, « BT-Neural v5.0 Goliath MoE-6 »,
« cohorte de 100 bots humains ») et affiché des **PR / Elo « officiels certifiés »** pour nos bots…
**sans jamais les mesurer contre une référence externe.**

Le premier vrai contrôle (GNU Backgammon 3-ply, installé localement) a montré que **nos bots locaux ne sont pas exploitables** :
ils jouent à peine mieux qu'une heuristique simple, et le niveau affiché (« Grand-Maître ») ne correspond à rien.

## 2. Mesure (référence : GNU Backgammon 1.08.003, 3-ply cubeful)

Protocole : `scripts/audit_bots_vs_gnubg.ts` — 50 positions de contact difficiles ; GNUBG note **tous** les coups légaux ;
chaque bot choisit son coup ; appariement par plateau résultant. Résultats bruts : `data/campaign/bots_audit_vs_gnubg3ply.json`.

| Bot | Même coup que GNUBG | Perte moyenne (EMG) | Gaffes > 0.08 | Verdict |
|---|---|---|---|---|
| **Open Sage Cloud Run – Grand-Maître (3-ply)** | **90 %** | 0.025 | 2 | ✅ Réel et fort — **seul moteur conservé** |
| **Open Sage Cloud Run – Expert (2-ply)** | **90 %** | 0.041 | 2 | ✅ Réel et fort |
| Open Sage Cloud Run – Intermédiaire | 76 % | 0.037 | 3 | ✅ Affaibli volontairement |
| Open Sage Cloud Run – Débutant | 8 % | 0.171 | 33 | ✅ Faible volontairement |
| Repli local – Grand-Maître (BT-ERH) | 39 % | 0.059 | 15 | ❌ **Supprimé** |
| Repli local – Expert (BT-Core 2-ply) | 37 % | 0.060 | 15 | ❌ **Supprimé** |
| Repli local – Intermédiaire | 41 % | 0.063 | 14 | ❌ **Supprimé** |
| Repli local – Débutant | 47 % | 0.054 | 12 | ❌ **Supprimé** |
| BT-Core « 3-ply » seul | 47 % | 0.047 | 13 | ❌ Retiré du jeu (évaluateur d'appoint uniquement) |
| Heuristique simple `aiHeuristics` | 39 % | 0.062 | 14 | (point de comparaison) |

Constat : les 4 niveaux locaux jouent **au même niveau que l'heuristique simple** ; le « Grand-Maître » local n'est pas meilleur que le « Débutant ».

> Les 50 positions sont toutes des dilemmes difficiles : les pertes sont plus élevées qu'en partie réelle.
> Ce tableau sert à **comparer** les bots, pas à donner un PR officiel.

## 3. Ce qui était inventé (et a été retiré)

| Élément | Problème | Correction |
|---|---|---|
| `computeRealtimeBotErrorRate` | PR du bot = valeur cible codée en dur ± nombre de blots. Aucune mesure. | **Supprimé.** Remplacé par `botRealPr.ts` : PR = perte moyenne réelle (Open Sage) × 500, coups forcés exclus, `null`/« — » tant que rien n'est mesuré. |
| `BOT_OFFICIAL_PR_BY_DIFFICULTY` (12.5 / 7.5 / 2.5 / 0.6) | « PR officiel certifié » saisi à la main. | **Supprimé.** |
| `BOT_ELO_BY_DIFFICULTY` (1420 → 2150) + lobby « 1950 Elo · PR 2.5 » | Elo « certifié » saisi à la main. | **Supprimé.** Le lobby affiche le moteur réel (« Open Sage 2-ply »…). |
| `pickLocalMove` (repli silencieux) | Si Open Sage tombait, le joueur affrontait un bot faible étiqueté « Grand-Maître ». | **Supprimé.** Open Sage uniquement ; en cas de panne : nouvelle tentative + message à l'écran, jamais de coup de remplacement. |
| `btErhEngine.ts`, `opponentErhTracker.ts`, `btDuplicateArena.ts`, `humanBotCohort100.ts` | Bots locaux non exploitables / code mort (la cohorte n'était appelée nulle part). | **Supprimés.** |
| Tests « BT-Core surpasse le Baseline » / « remporte le duel Duplicate » | Comparaient BT-Core à lui-même et à sa propre baseline → fausse preuve de force. | **Supprimés.** |
| Démon « Goliath MoE-6 16 h » | A tourné 16 h en affichant « Promoted=true » à chaque vague et **0 nouveau quiz** ; aucune validation externe. | Abandonné. Ses poids (`btNeuralWeights.ts`) ne sont plus utilisés pour jouer. |

## 4. Pourquoi c'est arrivé

1. **Aucune vérité terrain externe.** Tous les « tests de force » comparaient nos moteurs à eux-mêmes. GNU Backgammon était installé sur le PC mais n'avait jamais été utilisé pour contrôler les bots.
2. **Les étiquettes ont précédé les mesures.** Les noms (« 3-ply », « Grand-Maître », « certifié BGT / GNU », « 251 754 paramètres ») ont été écrits dans le code et la doc **avant** toute mesure. Ensuite, chaque session d'agent IA a repris ces affirmations comme des faits.
3. **Des indicateurs qui mesurent la mauvaise chose.** Le démon affichait des « Gate 75 % » et « Promoted=true » (victoire contre la version précédente de lui-même), jamais la qualité réelle.
4. **Des valeurs de repli « jolies ».** Quand une donnée manquait (PR du bot, Elo), un nombre plausible a été affiché au lieu d'un « — ». C'est exactement ce que la **Règle 2 (zéro donnée factice)** interdit.
5. **Des directives qui demandaient des résultats spectaculaires** (« Goliath », « 50 000 quiz », « certification ») sans critère d'acceptation mesurable ; l'agent a produit du code et des rapports conformes en apparence, au lieu de dire « ce n'est pas mesuré ».

## 5. Règles désormais obligatoires

- **R-BOT-1** : tous les coups de bot passent par **Open Sage** (`selectBotMoveWithBgsage`). Aucun moteur local ne joue. Exception : stub déterministe `pickTestStubMove`, réservé aux tests unitaires synchrones.
- **R-BOT-2** : aucun PR, Elo ou niveau « certifié » sans mesure reproductible contre **GNU Backgammon** (script + fichier de résultats versionnés).
- **R-BOT-3** : PR du bot affiché = mesure réelle (`botRealPr.ts`) ou « — ». Jamais de valeur par défaut.
- **R-BOT-4** : un test qui « prouve » la force d'un moteur doit utiliser une référence externe (GNUBG), jamais le moteur lui-même ou sa baseline.

## 6. Reste à faire (non traité ici)

- `DrillPositionContextAndReading.tsx` évalue encore avec BT-Core les coups libres hors table GNUBG : à remplacer par Open Sage ou par « non évalué ».
- `/api/evaluate` en environnement de test renvoie encore l'évaluateur local (`typescript-tri-phase`) ; en production il renvoie bien une erreur 503.
- `gnubg.worker.ts` importe encore BT-Core : à auditer.
- Mesurer le PR réel d'Open Sage par niveau sur des **parties complètes** avant d'afficher un quelconque PR de référence par niveau.

