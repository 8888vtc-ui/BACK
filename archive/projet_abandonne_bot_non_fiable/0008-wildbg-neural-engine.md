# ADR-008 : Remplacement du moteur XG-Web par WildBG (moteur neuronal MIT/Apache-2.0)

- **Statut** : Accepté
- **Date** : 2026-10-20
- **Décideur** : Équipe Backgammon Coach IA

---

## Contexte

Le moteur maison **XG-Web** (Rust → WASM, `xg-web-core/`) était **cassé à la racine** :
- PR réel mesuré **243.91** (niveau débutant, 1/100 coups optimaux).
- Encodage incohérent (`INPUT_DIM = 250` mais seulement ~205 features remplies).
- Poids factices (sinus/cosinus déterministes, jamais entraînés).
- Format binaire `XGWB01` ne correspondant pas au vrai format gnubg.

L'ADR-007 (déploiement hybride XG-Web) est **remplacé** par le présent ADR.

## Décision

Remplacer XG-Web par **WildBG** ([carsten-wenderdel/wildbg](https://github.com/carsten-wenderdel/wildbg)),
un moteur neuronal open source (MIT/Apache-2.0) compilé en WebAssembly :

- **Réseaux forts** (branche `nets`) : `contact.onnx` + `race.onnx` (~2.9 Mo).
- **Runtime** : `tract-onnx` (inférence ONNX pure Rust, pas ONNX Runtime Web).
- **Crate C ABI maison** : `wildbg-cabi/` (sans wasm-bindgen, pour éviter la
  dépendance à `wasm-bindgen-cli`).
- **Client TypeScript** : [`wildbgClient.ts`](../../src/lib/engine/wildbgClient.ts).

## Conséquences

### Positives
- Moteur neuronal **réel** (erreur ~5.9, niveau intermédiaire) au lieu d'un
  moteur cassé (PR 243.91).
- Licence **permissive** (MIT/Apache-2.0), aucune contamination GPL.
- 100 % client-side, zéro serveur, hors-ligne préservé.
- Videau natif (Janowski simplifié) + évaluation + meilleur coup.

### Négatives
- **Taille WASM 14.11 Mo** (gzip ~4 Mo) : au-dessus de la barre historique de
  2 Mo (abandonnée, voir [`INTEGRATION_WILDBG.md`](../INTEGRATION_WILDBG.md)).
- **Cube simplifié** sur la branche `nets` (seuil fixe, pas Janowski complet).
- **33 imports wasm-bindgen** à fournir manuellement (shim `getrandom 0.2`).

## Alternatives considérées

| Alternative | Verdict |
|---|---|
| Raccoon (MIT, ONNX) | ❌ ~48 Mo, pas de videau natif |
| gnubg-nn (GPL-3.0) | ❌ contamination GPL (embarquement interdit) |
| wildbg (MIT/Apache) | ✅ retenu |
| Réparer XG-Web | ❌ encodage + poids à refaire entièrement |

## Références

- [`INTEGRATION_WILDBG.md`](../INTEGRATION_WILDBG.md) — intégration détaillée.
- [`PLAN_AMELIORATION_XG.md`](../PLAN_AMELIORATION_XG.md) — plan d'amélioration vers XG.
