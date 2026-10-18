# CHARTE DE SCALABILITÉ — Règles impératives

> **Statut : OBLIGATOIRE.** Ce document définit les règles non négociables que toute
> nouvelle création de code DOIT respecter. Aucune fonctionnalité ne peut être ajoutée
> sans se conformer à ces règles. Toute violation doit être corrigée avant merge.

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

Ces fichiers hérités violent la charte et DOIVENT être découpés :

| Fichier | Lignes | Règle violée |
|---|---|---|
| [`src/components/board/BackgammonBoard.tsx`](src/components/board/BackgammonBoard.tsx) | ~2468 | R1, R5 |
| [`src/app/page.tsx`](src/app/page.tsx) | ~1738 | R1, R5 |
| [`src/hooks/useBackgammonGame.ts`](src/hooks/useBackgammonGame.ts) | ~1389 | R1, R5 |
| [`src/features/knowledge/knowledgeBaseData.ts`](src/features/knowledge/knowledgeBaseData.ts) | ~1587 | R1 (données à externaliser) |

**Règle : aucun nouveau code ne doit s'ajouter à ces fichiers.** Toute modification
doit passer par l'extraction d'un nouveau module conforme à la charte.
