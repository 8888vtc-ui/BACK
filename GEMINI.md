# GEMINI.md — Charte Architecturale, Vérité Métier ER/PR vs ERH vs Rating & Protocole d'Épure

> **Statut : OBLIGATOIRE.** Ce fichier constitue la source de vérité unique synchronisée avec [`AGENTS.md`](AGENTS.md), [`PROJECT_MAP.md`](PROJECT_MAP.md), [`SCALABILITY.md`](SCALABILITY.md) et [`GOVERNANCE.md`](GOVERNANCE.md).

---

## 1. Vérité Métier Absolue : Focus Exclusif `ER` (`0.0` à `30.0`), Certification 3-Ply GNU Backgammon & Sélection Adaptative `N+1`

Il est formellement interdit de mélanger le classement Elo/Glicko-2 avec le taux d'erreur `ER` (*Error Rate*) :

1. **Focus Exclusif Phase 1 sur l'`ER` (`0.0` à `30.0`)** :
   - `ER` (*Error Rate* officiel $\text{ER} = \Delta\text{EMG moyen par décision non forcée} \times 500$) évolue sur l'échelle stricte de **`0.0` (Perfection Grand-Maître)** à **`30.0` (Novice)** — plus le chiffre est bas, meilleur est le joueur (initialisé à `6.3`).
   - L'`ERH` (*Error Rate Humain*) est mis en pause proprement pour la Phase 2 afin de concentrer 100 % de l'UI et du moteur sur l'**`ER`** et la certification **3-ply**.
   - **Évolution exclusivement par dixièmes (`-0.1`, `-0.2` ou `+0.2`, `+0.3`, `+0.4`, `+0.5`)** :
     * ✅ **Coup Optimal (`0.000 EMG`)** : l'`ER` baisse par dixièmes (ex. **`▼ -0.1 (Progression)`** en vert, passant de `6.3` ➔ `6.2`).
     * ❌ **Erreur ou Blunder (ex. `-0.084 EMG`)** : l'`ER` augmente par dixièmes selon la gravité (ex. **`▲ +0.4 (Erreur)`** en rouge, passant de `6.3` ➔ `6.7`).
2. **Preuve & Validation Officielle 3-Ply via GNU Backgammon (`gnubg-cli.exe -t -q`)** :
   - Interdiction absolue des quiz `0-ply` / `1-ply` / `2-ply` et des positions de **Course Pure sans contact** (`isContact(board) === false` / `PURE_RACE`).
   - Validation croisée via `scripts/verify_3ply_with_gnubg.ts` et rapport officiel [`CERTIFICATION_3PLY_REPORT.md`](CERTIFICATION_3PLY_REPORT.md) comparant le temps d'inférence réel, les 5 probabilités neuronales ($P(\text{win})$, $P(\text{win G})$, $P(\text{win BG})$, $P(\text{lose G})$, $P(\text{lose BG})$) et le $\Delta\text{EMG}$ du Top 5 en `3-ply cubeful`.
3. **Sélection Adaptative Déterministe « Niveau $N+1$ » (Zéro `Math.random()`)** :
   - $\text{ER}_{\text{joueur}}$ = moyenne pondérée entre l'`ER` en Quiz et l'`ER` en Analyse de Parties.
   - **Règle du Niveau $N+1$** : $\text{Cible\_Quiz} = \max\left(1.0,\; \text{ER}_{\text{joueur}} - \Delta_{N+1}\right)$ avec auto-régulation dynamique **Up & Down** (baisse vers `5.0`, `3.5`, `2.0` sur série de réussites au 1er essai ; remontée de `+0.8` à `+1.2` sur 2 échecs consécutifs).

---

## 2. Orchestration des 6 Sous-Agents Spécialisés en Coulisses (`Flash-Lite` & `Flash` — Zéro Nom Technique à l'Écran)

1. **`FlashLite-GNUBG-3Ply-Verifier` (`gemini-2.5-flash-lite`)** : Pilote l'interface CLI avec GNU Backgammon (`gnubg-cli.exe -t -q`), vérifie la concordance des probabilités `3-ply cubeful` et génère le rapport de certification [`CERTIFICATION_3PLY_REPORT.md`](CERTIFICATION_3PLY_REPORT.md).
2. **`FlashLite-NonTrivial-Quiz-Filter` (`gemini-2.5-flash-lite`)** : Rejette 100 % des courses pures (`isContact(board) === false`), des coups forcés et des évidences ($> 0.120\text{ EMG}$ trivial) pour ne retenir que les dilemmes stratégiques à $\ge 4$ coups légaux non triviaux.
3. **`FlashLite-36Rolls-Geometric-Extractor` (`gemini-2.5-flash-lite`)** : Calcule le Pip Count exact (source unique `pipCount(board)`), vérifie les **15 pions par camp** et simule les 36 lancers du tour suivant (*1-Roll Lookahead*).
4. **`Flash-Adaptive-NPlus1-Selector` (`gemini-2.5-flash`)** : Calcule en temps réel l'`ER` combiné du joueur (Quiz + Parties) et sélectionne de manière 100 % déterministe le prochain quiz au **Niveau $N+1$** avec régulation dynamique Up/Down.
5. **`Flash-3Ply-Pedagogical-Coach` (`gemini-2.5-flash`)** : Rédige l'indice socratique au 1er essai raté (`Essais : 1/2 ❤️🖤`), le feedback nuancé (`-0.010 EMG` = *Très bon coup ! 0 pénalité ER*) et la synthèse 3-ply finale en $< 28$ mots.
6. **`FlashLite-Doc-Coherence-Keeper` (`gemini-2.5-flash-lite`)** : Audite en continu la documentation (`GEMINI.md`, `AGENTS.md`, `CERTIFICATION_3PLY_REPORT.md`) et bloque toute dérive vers le 0-ply ou l'aléatoire.

---

## 3. Charte Modulaire & Plafonds de Lignes (Règle R1 — `SCALABILITY.md`)

- **Composant React (`.tsx`)** : $\le 300$ lignes max.
- **Hook React (`.ts`)** : $\le 200$ lignes max.
- **Module de logique pure (`.ts`)** : $\le 400$ lignes max.
- **Typage strict (`GOVERNANCE.md`)** : **ZÉRO `any`** en production, validation **Zod** aux frontières d'entrée/sortie.
