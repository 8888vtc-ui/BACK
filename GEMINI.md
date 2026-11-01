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

## 2. Orchestration des 8 Sous-Agents en Coulisses (`Flash-Lite` & `Flash` — Zéro Nom Technique à l'Écran)

1. **`FlashLite-Doc-Guardian` (`gemini-2.5-flash-lite`)** : Vérifie l'alignement terminologique (`ER / PR` 0–30, `ERH` 0–30, `Rating 1500`) et lève une alerte si une incohérence documentaire est détectée.
2. **`FlashLite-3Ply-Engine-Supervisor` (`gemini-2.5-flash-lite`)** : Garantit que le moteur (`BT-Core v4.0` / `bgsage`) et le tableau `buildCandidateMathTable` évaluent les coups en **Vrai 3-ply cubeful** (21 tirages sur 36 + Janowski / Kazaross-XG2) sans jamais inventer d'équités (`-0.457`, `-0.558`, `-0.658 EMG` interdits).
3. **`FlashLite-Board-Invariant-Checker` (`gemini-2.5-flash-lite`)** : Garantit en $< 10\text{ ms}$ qu'il y a exactement **15 pions par camp** (`X_BAR = 0`, `O_BAR = 25`), que le Pip Count est issu d'une **source unique partagée** (`pipCount(board)` de `backgammonEngine.ts`) et que les 4 coups `A/B/C/D` sont légaux et cohérents avec la règle (ex: `24/20 21/20` pour fermer l'ancre sur le point 20 avec 2 pions).
4. **`FlashLite-Rollout-36-Simulator` (`gemini-2.5-flash-lite`)** : Simule les 21 tirages de dés (pondérés sur 36) à 1 tour (*1-Roll Lookahead*) pour compter exactement les lancers constructifs ($X/36$).
5. **`FlashLite-Tactical-Taxonomy-Classifier` (`gemini-2.5-flash-lite`)** : Calcule mathématiquement `isContact(board)` et verrouille l'archétype exact (`PURE_RACE`, `BEAROFF`, `BLITZ`, `HOLDING_GAME`, `PRIME_VS_PRIME`).
6. **`Flash-Nuanced-Pedagogical-Coach` (`gemini-2.5-flash`)** : Rédige l'explication « Tesla 3-Secondes » (18 à 28 mots max) :
   - **Écart minime ($0.001 \le \Delta\text{EMG} \le 0.020$, ex: `-0.010 EMG`)** : `👍 Très bon coup ! (-0.010 EMG | 0 pénalité ER / PR)` ("Ton coup n'est vraiment pas un mauvais coup, mais tu peux gagner +0.010 EMG en jouant...").
   - **1er essai raté (`Essais : 1/2 ❤️🖤`)** : Pénalité `+0.2` et **Indice Socratique ciblé** sans révéler la réponse optimale.
   - **2e essai raté (`Essais : 0/2 🖤🖤`)** : Pénalité complète (`+0.3` à `+0.5`), solution 3-ply complète en 3 blocs.
7. **`Flash-FSRS-Drill-Manager` (`gemini-2.5-flash`)** : Gère les **2 essais maximum (`Essais : 2/2 ❤️❤️`)**, réduit la pénalité de moitié si corrigé au 2e essai et crée automatiquement une carte de révision **FSRS v5** si $\Delta\text{EMG} \ge 0.080$.
8. **`Flash-FullPage-UX-Optimizer` (`gemini-2.5-flash`)** : Garantit le plein écran `100dvh` zéro-scroll, le jeu libre sur le plateau (*Smart Point Click*) avec bouton `[✓ Valider mon coup]` et le tiroir repliable `[📊 Détails 3-ply]`.

---

## 3. Charte Modulaire & Plafonds de Lignes (Règle R1 — `SCALABILITY.md`)

- **Composant React (`.tsx`)** : $\le 300$ lignes max.
- **Hook React (`.ts`)** : $\le 200$ lignes max.
- **Module de logique pure (`.ts`)** : $\le 400$ lignes max.
- **Typage strict (`GOVERNANCE.md`)** : **ZÉRO `any`** en production, validation **Zod** aux frontières d'entrée/sortie.
