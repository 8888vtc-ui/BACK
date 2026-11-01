# CHARTE DE SCALABILITÉ — Règles impératives

> **Statut : OBLIGATOIRE.** Ce document définit les règles non négociables que toute
> nouvelle création de code DOIT respecter. Aucune fonctionnalité ne peut être ajoutée
> sans se conformer à ces règles. Toute violation doit être corrigée avant merge.

---

## 0. LES 5 LOIS FONDAMENTALES OBLIGATOIRES (DOCTRINE "1 BOUTON = 1 MICRO-PROGRAMME")

Toute création ou modification de code sur ce projet doit respecter sans exception ces 5 lois constitutionnelles :

### LOI 1 — "1 Bouton / 1 Événement = 1 Micro-Programme Isolé" (`src/actions/`)
- Chaque action utilisateur ou système DOIT être un fichier TypeScript pur, indépendant et testable isolément (< 120 lignes max).
- Exemples canoniques : `smartClickCheckerAction.ts`, `swapDiceOrderAction.ts`, `commitHumanMoveAction.ts`, `runAiTurnAction.ts`, `replayFromLogAction.ts`, `retryLastHumanTurnAction.ts`.
- **Principe d'isolation stricte** : Toucher au programme d'un bouton ne doit JAMAIS pouvoir casser un autre bouton.

#### Micro-programmes actuellement implémentés
| Fichier | Rôle |
|---|---|
| [`smartClickCheckerAction.ts`](src/actions/smartClickCheckerAction.ts) | Clic gauche direct sur un pion (Galaxy/XG) |
| [`swapDiceOrderAction.ts`](src/actions/swapDiceOrderAction.ts) | Inversion de l'ordre des dés |
| [`commitHumanMoveAction.ts`](src/actions/commitHumanMoveAction.ts) | Validation du tour humain + log immuable |
| [`runAiTurnAction.ts`](src/actions/runAiTurnAction.ts) | Tour IA en 3 paliers + `try/finally` |
| [`replayFromLogAction.ts`](src/actions/replayFromLogAction.ts) | Replay depuis la Feuille de Match |
| [`retryLastHumanTurnAction.ts`](src/actions/retryLastHumanTurnAction.ts) | « 🔄 Rejouer ce coup » |

### LOI 2 — Machine à États Finis Unique (`gamePhase`)
- **Interdiction formelle d'empiler des booléens contradictoires** (`isRolling`, `isAiThinking`, `canRoll`, `hasMoved`...).
- Le cycle de jeu est gouverné par **UNE SEULE variable d'état stricte `gamePhase`** :
  - `'HUMAN_WAITING_ROLL'` : Seul le lancer de dés humain est autorisé.
  - `'HUMAN_MOVING'` : Seuls les déplacements légaux de pions (`smartClickCheckerAction`, `swapDiceOrderAction`) et l'annulation locale sont autorisés.
  - `'HUMAN_READY_TO_COMMIT'` : Seuls `commitHumanMoveAction` ou l'annulation locale sont autorisés.
  - `'AI_TURN_ROLLING'` : Affiche les dés de l'IA au centre selon la cadence active (`speedPresets.ts` : Coach / Tournoi / Blitz, tous boutons humains verrouillés).
  - `'AI_TURN_SHOWING_ARROWS'` : Affiche les flèches de l'IA sur le plateau gelé avant mouvement selon la cadence active (`speedPresets.ts`).
  - `'GAME_OVER'` : Fin de manche / match.
- **Cohérence mathématique garantie** : Le HUD, les bannières et les commandes lisent uniquement `gamePhase`. Il est impossible d'afficher deux textes contradictoires à l'écran.

### LOI 3 — Immuabilité Absolue & Source de Vérité par la Log (`matchLog`)
- Aucun micro-programme ne mute le tableau `board` en place. Chaque transition utilise des copies gelées (`Object.freeze([...board])`).
- Chaque tour terminé inscrit une entrée immuable dans `matchLog` contenant :
  `{ turnIndex, player: 'X' | 'O', dice, boardBefore: ReadonlyArray<number>, movePlayed, boardAfter: ReadonlyArray<number> }`.
- Les flèches de mouvement sont **TOUJOURS calculées et affichées par rapport à `boardBefore`** (vérification stricte : `boardBefore[from] !== 0`).

### LOI 4 — Analyse Log-Driven Exclusivement Réservée au Joueur Connecté (`src/features/coach/analyzeHumanLogAction.ts`)
- L'analyse ne lit JAMAIS l'écran ni le DOM : elle prend en entrée uniquement la dernière ligne immuable de `matchLog`.
- **Condition stricte** : `if (logEntry.player !== localConnectedPlayer) return;` (on n'analyse JAMAIS les coups de l'IA ou de l'adversaire).
- Elle compare le coup joué par l'humain sur `boardBefore` avec le meilleur coup de l'évaluateur et met à jour l'état du panneau Coach.

### LOI 5 — Composants Visuels 100 % Muets ("Dumb UI")
- Les composants React (`Board`, `CoachPanel`, `MatchSheet`, `HUD`) ont l'interdiction formelle de faire le moindre calcul métier ou d'inverser des indices.
- Ils reçoivent des données prêtes à afficher et déclenchent au clic un micro-programme dédié de `src/actions/`.

---

## 0bis. PIPELINE D'ANALYSE LOG-DRIVEN (SOURCE DE VÉRITÉ = JOURNAL DU MATCH)

> **Règle d'or** : l'analyse du Coach est **purement fonctionnelle et déterministe**.
> Elle ne lit JAMAIS l'état visuel React (animations, mutations asynchrones, inversions de rendu).

### Reconstruction déterministe depuis la log
- Pour analyser le coup n° K, on prend l'état initial du match et on **rejoue séquentiellement
  les K-1 coups** enregistrés dans la log (`matchLog` / `moveHistory`) pour obtenir la position
  mathématique **EXACTE** avant le coup.
- Aucun composant d'affichage (UI/DOM) n'intervient dans ce calcul.

### Évaluation mathématique pure
Sur la position reconstruite et avec les dés inscrits dans la log :
1. Génère l'ensemble exhaustif des coups légaux via [`backgammonEngine.ts`](src/engine/backgammonEngine.ts).
2. Évalue chaque coup candidat en priorité via **Open Sage Cloud Run** ([`bgsageClient.ts`](src/lib/engine/bgsageClient.ts) / `analyzeHumanMoveFromLogWithBgsage`), avec repli instantané sur l'évaluateur tri-phase local [`evaluator.ts`](src/lib/engine/evaluator.ts) (Bear-Off 54 264 états + Keith Count).
3. Extrait le meilleur coup mathématique et son équité.
4. Compare avec le coup réellement joué pour calculer la perte d'équité exacte (`equityLoss = max(0, bestEquity - playedEquity)`).

### Verdict en 4 paliers (centralisé dans [`logAnalyzer.ts`](src/features/coach/logAnalyzer.ts))
| Perte d'équité | Verdict |
|---|---|
| ≤ 0.010 | `Optimal ✅` |
| ≤ 0.020 | `Bon 👍` |
| > 0.020 | `Imprécision ⚠️` |
| > 0.080 | `Blunder ❌` |

### Injection dans l'affichage (Dumb UI)
Le composant Coach consomme un objet de résultat **pur** :
```ts
{ turnNumber, player, dice, playedMove, bestMove, equityDiff, verdict }
```
Aucune logique de calcul ou d'inversion n'existe dans le composant d'affichage.

### Ciblage exclusif du joueur connecté
- `if (logEntry.player !== localPlayer) return null;` — on n'analyse JAMAIS l'IA (`O`) ni l'adversaire.
- Le PR est calculé uniquement sur `matchLog.filter(entry => entry.player === localPlayer)`.

---

## 1. Principe fondateur

> **Un fichier = une responsabilité. Un composant = un fichier. Aucun monolithe.**

Le projet ne peut pas avancer si chaque ajout reproduit le monolithisme. La scalabilité
n'est pas une option : c'est une **condition d'existence** du code.

---

## 2. Règles impératives (non négociables)

### R1 — Taille maximale des fichiers

| Type de fichier | Taille maximale |
|---|---|
| Composant React (`.tsx`) | **300 lignes** |
| Hook (`.ts`) | **200 lignes** |
| Module de logique pure (`.ts`) | **400 lignes** |
| Fichier de données statiques | **500 lignes** (sinon externaliser en JSON) |

**Si un fichier dépasse la limite : il DOIT être découpé.** Pas d'exception.

### R2 — Isolation des composants

- Chaque composant vit dans **son propre fichier**, nommé d'après le composant.
- Chaque composant est **auto-documenté** avec un en-tête JSDoc précisant :
  - son rôle ;
  - ses dépendances ;
  - comment le retirer.
- Un composant ne dépend que de **ses props** — jamais de l'état global directement.

### R3 — Mémoïsation obligatoire

- Tout composant rendu **plus d'une fois** (listes, piles, grilles) DOIT être enveloppé
  dans `React.memo`.
- Tout handler passé en prop DOIT être stabilisé via `useCallback`.
- Toute valeur dérivée coûteuse DOIT être mémoïsée via `useMemo`.
- Les lookups répétés DOIVENT utiliser `Set`/`Map` (O(1)), jamais `Array.includes` (O(n)).

### R4 — Tests obligatoires

- Toute nouvelle logique métier DOIT avoir un test unitaire (Vitest).
- Tout nouveau composant interactif DOIT avoir un test de rendu/interaction.
- Le ratio de couverture ne doit **jamais régresser** (actuellement ~77 %).

### R5 — Interdiction des monolithes

- **Interdit** : un composant qui mélange rendu + logique métier + effets de bord.
- **Interdit** : un hook de plus de 200 lignes.
- **Interdit** : une page (`page.tsx`) de plus de 300 lignes — extraire dans des
  composants/hooks dédiés.
- **Interdit** : dupliquer de la logique — extraire dans un helper pur partagé.

### R6 — Délégation pure

- Les composants de présentation **délèguent** toute logique aux handlers reçus en props.
- Ils ne prennent **aucune décision métier** (sélection, validation, calcul).

### R7 — Types centralisés

- Les types partagés entre plusieurs composants vivent dans un fichier `types.ts` dédié.
- Pas de type dupliqué dans plusieurs fichiers.

---

## 3. Pattern de référence (à suivre pour chaque création)

Toute nouvelle création DOIT suivre ce pattern d'isolation :

```
src/features/<domaine>/
├── index.ts               # façade publique (ré-exporte les APIs)
├── types.ts               # types partagés du domaine
├── <composant>.tsx        # un composant = un fichier (React.memo)
├── <composant>.test.tsx   # test du composant
├── use<X>.ts              # hook isolé (≤ 200 lignes)
└── <helper>.ts            # logique pure (≤ 400 lignes)
```

**Principes clés** :
- Un composant = un fichier, auto-documenté, mémoïsé si rendu plusieurs fois.
- Les types et helpers purs sont centralisés dans `types.ts` / un module dédié.
- Les hooks sont isolés et testables indépendamment.
- La façade `index.ts` expose une API stable aux consommateurs.

---

## 4. Template de composant (à copier)

```tsx
'use client';

/**
 * [Rôle du composant].
 *
 * Composant isolé : ne dépend que de ses props, aucune logique métier.
 * Pour le retirer, supprimer ce fichier et son usage dans [parent].
 * Mémoïsé (`React.memo`).
 */

import React from 'react';

export interface MonComposantProps {
    /** [Description de la prop]. */
    maProp: string;
}

const MonComposantComponent: React.FC<MonComposantProps> = ({ maProp }) => (
    <div>{maProp}</div>
);

/** Composant mémoïsé : ne re-rend que si ses props changent. */
export const MonComposant = React.memo(MonComposantComponent);

export default MonComposant;
```

---

## 5. Checklist de validation (avant tout merge)

- [ ] Le fichier fait moins de la limite de taille (R1).
- [ ] Le composant est isolé dans son propre fichier (R2).
- [ ] Le composant est mémoïsé si rendu plusieurs fois (R3).
- [ ] Les handlers sont stabilisés (`useCallback`) (R3).
- [ ] Les lookups sont en O(1) (`Set`/`Map`) (R3).
- [ ] Un test couvre la nouvelle logique (R4).
- [ ] Aucune logique métier dans le composant de présentation (R6).
- [ ] Les types sont centralisés, pas dupliqués (R7).

---

## 6. Dette technique connue (à résorber progressivement)

Ces fichiers hérités ont été résolus ou doivent être découpés sous les seuils R1/R5 :

| Fichier | Lignes | Statut / Règle |
|---|---|---|
| [`src/app/page.tsx`](src/app/page.tsx) | 274 | ✅ Résolu (conforme R1 < 300 lignes) |
| [`src/components/board/Board.tsx`](src/components/board/Board.tsx) | 281 | ✅ Résolu (conforme R1 < 300 lignes) |
| [`src/features/knowledge/knowledgeBaseData.ts`](src/features/knowledge/knowledgeBaseData.ts) | 47 | ✅ Résolu (externalisé dans `knowledgeBaseData.json`) |
| [`src/hooks/useBackgammonGame.ts`](src/hooks/useBackgammonGame.ts) | 164 | ✅ Résolu (conforme R1 < 200 lignes) |
| [`src/hooks/useMultiplayerGame.ts`](src/hooks/useMultiplayerGame.ts) | 144 | ✅ Résolu (conforme R1 < 200 lignes) |
| [`src/components/drills/BlunderDrillView.tsx`](src/components/drills/BlunderDrillView.tsx) | 288 | ✅ Résolu (conforme R1 < 300 lignes — découpé en `DrillHeader`, `DrillContextStrip`, `DrillChoicesGrid`, `DrillCoachFeedback`, `useDrillRating`) |
| [`src/components/drills/BlunderDrillFeedbackCard.tsx`](src/components/drills/BlunderDrillFeedbackCard.tsx) | 114 | ✅ Résolu (conforme R1 < 300 lignes) |
| [`src/hooks/useDrillRating.ts`](src/hooks/useDrillRating.ts) | 149 | ✅ Résolu (conforme R1 < 200 lignes, Zod-validé) |

**Règle : aucun nouveau code ne doit s'ajouter à ces fichiers.** Toute modification
doit passer par l'extraction d'un nouveau module conforme à la charte.
