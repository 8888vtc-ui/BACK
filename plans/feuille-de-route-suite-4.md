# Feuille de route — Suite (correction du biais directionnel X/O)

> **État** : bear-off exact, course Keith, contact tri-phase (avec biais directionnel X/O découvert), coach précis, IA alignée. 621 tests verts.

---

## Découverte : biais directionnel X/O dans le régime CONTACT

Le test de symétrie ([`evaluator.contact.test.ts`](../src/lib/engine/evaluator.contact.test.ts)) a révélé que l'évaluateur de contact **favorise systématiquement X** : dans une position et son miroir, X est favori dans les deux cas.

### Source du biais (identifiée)

Dans [`evaluateContact()`](../src/lib/engine/evaluator.ts), la boucle des flèches clés :

```ts
for (let p = 1; p <= 7; p++) {
    const w = KEY_POINT_WEIGHTS[p] ?? 1.0;
    ...
}
```

`KEY_POINT_WEIGHTS` est défini pour les flèches 1-7 **du point de vue de X uniquement**. Pour O, les flèches clés sont 18-24 (miroir), mais le code ne fait pas le miroir. Résultat : X reçoit les bonus de points clés, O non.

---

## Priorité 1 — Corriger le biais directionnel (symétrie X/O)

**Pourquoi** : c'est un bug de calibration qui fausse la force du moteur (X avantagé). Le corriger améliore l'équité et la précision du régime CONTACT.

**Actions** :
1. **Miroir des flèches clés** : dans `evaluateContact`, pour O, utiliser `KEY_POINT_WEIGHTS[25 - p]` au lieu de `KEY_POINT_WEIGHTS[p]`.
2. **Vérifier les autres conventions directionnelles** : `anchorValue`, `longestPrime`, `trappedCheckersBehindPrime`, `countShotsOnBlot` — s'assurer qu'elles sont symétriques.
3. **Réactiver le test de symétrie stricte** : `expect(e1).toBeCloseTo(-e2, 1)`.

**Impact** : équité symétrique, force du moteur plus juste.

---

## Priorité 2 — 1-ply expectiminimax en contact

**Pourquoi** : le contact reste 0-ply (évaluation directe). Un 1-ply (évaluer les 21 lancers adverses) affinerait l'équité.

**Actions** :
1. Dans `evaluateContact`, après le calcul 0-ply, évaluer les 21 lancers adverses et moyenner.
2. Coût : ~21× l'évaluation, mais < 5 ms en TS pur.

---

## Priorité 3 — Mesurer le PR réel vs gnubg (dev only)

**Pourquoi** : le PR auto-référencé = 0 ne mesure pas la force. Utiliser gnubg (backend) en dev pour étiqueter un corpus et mesurer le PR objectif.

---

## Synthèse

| Priorité | Action | Gain | Risque |
|---|---|---|---|
| 1 | Corriger le biais directionnel X/O | ⭐⭐⭐⭐ (équité juste) | 🟡 moyen |
| 2 | 1-ply expectiminimax en contact | ⭐⭐⭐ (précision) | 🟡 moyen |
| 3 | Mesurer PR réel vs gnubg (dev) | ⭐⭐⭐ (chiffre objectif) | 🟢 faible |

**Recommandation** : exécuter **Priorité 1 d'abord** (correction du biais directionnel), car c'est un bug réel qui fausse la force du moteur, et sa correction est localisée (miroir des flèches clés).
