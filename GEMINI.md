# GEMINI.md — Charte Architecturale, Vérité Métier ER/PR vs ERH vs Rating & Protocole d'Épure

> **Statut : OBLIGATOIRE.** Ce fichier constitue la source de vérité unique synchronisée avec [`AGENTS.md`](AGENTS.md), [`PROJECT_MAP.md`](PROJECT_MAP.md), [`SCALABILITY.md`](SCALABILITY.md) et [`GOVERNANCE.md`](GOVERNANCE.md).

---

## 1. Vérité Métier Absolue : `Rating (1500)` vs `ER / PR (0.0 à 30.0)` vs `ERH (0.0 à 30.0)`

Il est formellement interdit de mélanger le classement Elo/Glicko-2 avec les taux d'erreur `ER / PR` et `ERH` :

1. **`Rating` (autour de `1500`)** :
   - Classement compétitif Glicko-2 / Elo (ex. `Rating : 1500`). Ne jamais l'appeler « Niveau ER » ni l'additionner à des points d'`ER / PR`.
2. **`ER / PR` (*Error Rate / Performance Rating*) — Échelle stricte de `0.0` à `30.0`** :
   - `ER` et `PR` désignent la même métrique ($\text{ER / PR} = \Delta\text{EMG moyen par décision non forcée} \times 500$). Afficher systématiquement **`ER / PR`**.
   - Échelle de **`0.0` (Perfection)** à **`30.0` (Novice)** — plus le chiffre est bas, meilleur est le joueur (initialisé à `6.3`).
   - **Évolution exclusivement par dixièmes (`-0.1`, `-0.2` ou `+0.3`, `+0.4`, `+0.5`)** :
     * ✅ **Coup Optimal (`0.000 EMG`)** : l'`ER / PR` baisse par dixièmes (ex. **`▼ -0.1 (Progression)`** en vert, passant de `6.3` ➔ `6.2`).
     * ❌ **Erreur ou Blunder (ex. `-0.084 EMG`)** : l'`ER / PR` augmente par dixièmes selon la gravité (ex. **`▲ +0.4 (Erreur)`** en rouge, passant de `6.3` ➔ `6.7`).
3. **`ERH` (*Error Rate Humain*) — Échelle stricte de `0.0` à `30.0`** :
   - Métrique propriétaire calibrée sur l'erreur humaine (initialisée à `6.1`, évoluant par dixièmes). Le terme **`ERH`** reste strictement identique partout.
4. **Affichage en haut à droite (`DrillHeader.tsx`)** :
   - **`ER / PR : 6.3`** (avec badge d'évolution en dixièmes après le clic : `▼ -0.1 (Progression)` ou `▲ +0.4 (Erreur)`) | **`ERH : 6.1`** | **`Rating : 1500`**.

---

## 2. Orchestration des 5 Sous-Agents en Coulisses (`Flash-Lite` & `Flash` — Zéro Nom Technique à l'Écran)

1. **`FlashLite-Doc-Auditor` (`gemini-2.5-flash-lite`)** : Vérifie l'alignement terminologique (`ER / PR` 0–30, `ERH` 0–30, `Rating 1500`) entre documentation et code.
2. **`FlashLite-Board-Validator` (`gemini-2.5-flash-lite`)** : Garantit en $< 50\text{ ms}$ qu'il y a exactement **15 pions par camp** (`X_BAR = 0`, `O_BAR = 25`), que le Pip Count est issu d'une **source unique partagée** (`pipCount(board)` de `backgammonEngine.ts` — zéro écart entre le plateau et le texte) et que les 4 coups `A/B/C/D` sont légaux.
3. **`FlashLite-Semantic-Bridge` (`gemini-2.5-flash-lite`)** : Calcule mathématiquement `isContact(board)` et verrouille l'archétype exact (`PURE_RACE`, `BEAROFF`, `BLITZ`, `HOLDING_GAME`, `PRIME_VS_PRIME`). **Règle absolue** : si `isContact === false` (Course Pure), interdiction formelle d'étiqueter le puzzle `Blitz & Attaque de Jan` ou de parler de frapper dans le jan. Calcule aussi le `1-Roll Lookahead` sur 36 et le delta en dixièmes (`0.1` à `0.5`).
4. **`Flash-Pedagogical-Coach` (`gemini-2.5-flash`)** : Rédige l'explication « Tesla 3-Secondes » (phrases courtes de 18 à 28 mots max) :
   - **Si Erreur (`B`, `C`, `D`)** : Bannière Rouge/Ambre `❌ Erreur (-0.084 EMG | Impact ER / PR : +0.4 ➔ 6.7 | -7.5% de victoire)` + `1. Pourquoi ton coup est une erreur` + `2. Pourquoi le coup optimal gagne` + `💡 Comment t'améliorer`.
   - **Si Coup Optimal (`A`)** : Bannière Verte/Or `✅ Coup Optimal ! (0.000 EMG | Impact ER / PR : -0.1 ➔ 6.2 | Équité 100%)` + **aucun bloc d'erreur** (uniquement `Pourquoi ce coup est optimal` + `💡 Règle à retenir`).
5. **`Flash-UX-Simplifier` (`gemini-2.5-flash`)** : Interdit tout nom de sous-agent à l'écran, supprime la sous-ligne verbeuse *"Portes faites..."*, masque le badge de thème avant le clic et garantit le zéro-scroll.

---

## 3. Charte Modulaire & Plafonds de Lignes (Règle R1 — `SCALABILITY.md`)

- **Composant React (`.tsx`)** : $\le 300$ lignes max.
- **Hook React (`.ts`)** : $\le 200$ lignes max.
- **Module de logique pure (`.ts`)** : $\le 400$ lignes max.
- **Typage strict (`GOVERNANCE.md`)** : **ZÉRO `any`** en production, validation **Zod** aux frontières d'entrée/sortie.
