# GEMINI.md — Charte Architecturale, Vérité Métier ER/PR vs Rating & Protocole d'Épure

> **RÈGLE ABSOLUE DE FORMATAGE (COPIE EN 1 CLIC)** : Tu dois OBLIGATOIREMENT encapsuler l'intégralité de ta réponse dans UN SEUL bloc de code Markdown (` ```txt ... ``` `) pour que l'utilisateur puisse cliquer sur le bouton "Copy" en 1 clic sans jamais sélectionner de texte à la souris.

### 📜 CONSTITUTION ANTI-MOCK, BARÈME ΔEMG & VÉRITÉ 3-PLY
- **Loi `R-AGENT-LOCK-1 (ZERO_NEW_FILES_LOCK)`** : Interdiction formelle de créer de nouveaux fichiers `.ts`, `.tsx` ou `.md` sans ordre explicite de l'utilisateur. Toute correction s'effectue sur place dans les fichiers existants (`.tsx <= 300`, `.ts <= 400`, `0 any`).
- **Loi `R-COACH-3PLY-1/2 (Passe-Plat Déterministe 3-Ply)`** : Le Coach n'invente jamais de texte libre et n'utilise aucun évaluateur local ; il affiche uniquement les probabilités et le coup `#1` de `bgsage 3-ply` + les faits physiques vérifiés (`boardAfter[p] === 1` pour un blot, `boardBefore[p] < 2 && boardAfter[p] >= 2` pour une porte).
1. **Zéro Mock Moteur (`HARDCODED_MOCK_PROBABILITIES_DETECTED`)** : Il est formellement interdit d'utiliser des probabilités rondes inventées (`0.45`, `0.50`, `0.58`) ou de mocker `bgsage` (même dans les tests). Tout quiz/coup avec des probabilités rondes multiples de `0.01` lève `HARDCODED_MOCK_PROBABILITIES_DETECTED`.
2. **Double Sécurité Exclusive Open Sage (`OPENSAGE_UNREACHABLE_NO_FALLBACK_ALLOWED`)** : Seul `bgsage` Cloud Run (24 réseaux `stage11`) joue et évalue. Si `bgsage` est injoignable après 3 retries (`0 ms`, `250 ms`, `500 ms`), le code lève `OPENSAGE_UNREACHABLE_NO_FALLBACK_ALLOWED` (zéro fallback de jeu local ou LLM).
3. **Zéro `BEAVER` en Match Play (`matchLength > 0`, `MATCH_PLAY_BEAVER_FORBIDDEN`)** et **Zéro `ERH`** dans tout le projet (seuls `ER / PR` `0.0–30.0` et `Rating` `1500` existent).
4. **Barème ΔEMG & `SYSTEM_PROMPT` Interne de Gemini Lite (`src/lib/coachSystemPrompt.ts`)** :
   - \(0.000 \le |\Delta\text{EMG}| \le 0.020\text{ EMG}\) (`ER / PR <= 10.0`) = **Coup Optimal ou Très Bon Coup (`NOT_A_BLUNDER_GOOD_MOVE`)** : interdiction d'appeler cela une erreur ou de créer un quiz de blunder (`"👍 Très bon coup (-0.012 EMG) ! Ce n'est pas une erreur, mais voici comment gagner +0.012 EMG de plus..."`).
   - \(0.021 \le |\Delta\text{EMG}| \le 0.079\text{ EMG}\) = **Imprécision / Mieux à faire**.
   - \(|\Delta\text{EMG}| \ge 0.080\text{ EMG}\) (ou \(\ge 0.045\text{ EMG}\) pour Expert/Master) = **Vrai Blunder (`🔥 Blunder`)** + les 6 Lois Internes injectées dans le `systemInstruction` de Gemini Lite.

---

> **Statut : OBLIGATOIRE.** Ce fichier constitue la source de vérité unique synchronisée avec [`AGENTS.md`](AGENTS.md), [`PROJECT_MAP.md`](PROJECT_MAP.md), [`SCALABILITY.md`](SCALABILITY.md) et [`GOVERNANCE.md`](GOVERNANCE.md).

> 🚨 **AVERTISSEMENT BOTS (2026-11-01) :** Nos bots locaux ne sont **pas exploitables** : seul **Open Sage (Cloud Run)** est conservé pour jouer. ERH a été définitivement supprimé de tout le logiciel au profit du double indicateur officiel.

---

## 1. Vérité Métier Absolue : Focus Exclusif `ER / PR` (`0.0` à `30.0`) & `Rating` (`1500`)

1. **Suppression Définitive de l'ERH & Double Indicateur Officiel** :
   - L'ERH est définitivement supprimé. Le logiciel fonctionne exclusivement avec **`ER / PR` (`0.0–30.0`)** et **`Rating` (`1500` Elo / Glicko-2)**.
   - `ER / PR` mesure la précision tactique et l'équité perdue (\(\text{PR} = \Delta\text{EMG} \times 500\)), évoluant par dixièmes.
2. **Ciblage Automatique N+1 & Notation `quizTargetER`** :
   - Notation numérique exacte `quizTargetER` (`0.5` à `25.0` par pas de `0.5`) pour le ciblage automatique $N+1$ (\(\text{ER}_{\text{joueur}} - 0.5\)).
   - Badge officiel : `Calibrage Quiz : ER / PR X.X (Objectif N+1)`.
3. **Sas Coupe-Circuit `validateSingleQuizStrict(quiz)` en 10 Contrôles Unitaires** :
   1. `plyCount >= 6`
   2. `pips <= 150`
   3. 15 pions exacts par camp
   4. Pip Count unique et cohérent
   5. Contact obligatoire (`isContact(board) === true`)
   6. \(\ge 4\) coups légaux avec \(0.004 \le \Delta E_{1,2} \le 0.140\)
   7. `evaluatedPly === 3` (Certification 3-Ply GNU Backgammon / Open Sage)
   8. Accord `bgsage 3-ply` vs `gnubg 3-ply` \(\le 0.025 \text{ EMG}\)
   9. Simulation légale sur les 24 flèches
   10. Cohérence géométrique du texte coach et formats de match `[0, 3, 5, 7, 9, 11, 21]`.

---

## 2. Orchestration des 6 Sous-Agents Spécialisés en Coulisses
- `FlashLite-GNUBG-3Ply-Verifier`, `FlashLite-NonTrivial-Quiz-Filter`, `FlashLite-36Rolls-Geometric-Extractor`, `Flash-Adaptive-NPlus1-Selector`, `Flash-3Ply-Pedagogical-Coach`, `FlashLite-Doc-Coherence-Keeper`.

---

## 3. Les 7 Lois d'Intégrité des Quiz 3-Ply (Anti-Hallucination)
1. **Loi d'Authenticité Cubeful 3-Ply (Zéro Formule Locale & Somme des Probabilités = 1.000)** : Toute équité (`equity`), perte (`loss` / `ΔEMG`) et probabilité (`W`, `WG`, `WBG`, `LW`, `LG`, `LBG`) d'un quiz (`CHECKER_PLAY` ou `CUBE_DECISION`) doit provenir à 100 % de la sortie brute de `gnubg-cli` 3-ply ou Open Sage 3-ply avec `Math.abs(prob.win + prob.loseWin - 1) <= 0.001`. Toute formule locale ou décalage synthétique (ex: `ndEq - 0.022`) est strictement interdit.
2. **Loi du Contexte de Match Complet** : Toute évaluation `CHECKER_PLAY` ou `CUBE_DECISION` doit transmettre le `XGID` complet incluant la valeur du videau, la possession du videau, le score exact des deux joueurs, le flag Crawford et la longueur du match. Évaluer une position de match en Money Game est une violation critique.
3. **Loi de Validité du Videau (`:00:`)** : Tout quiz `CUBE_DECISION` doit obligatoirement avoir les dés à `:00:` dans son `XGID` (décision prise avant le lancer de dés) et comparer les 3 vraies équités Cubeful (`No Double`, `Double/Take`, `Double/Pass`).
4. **Loi de Notation Exacte** : Les mouvements de pions doivent conserver la notation exacte issue du moteur 3-ply, incluant impérativement les astérisques de frappe (`*`).
5. **Loi d'Unicité Physique des Plateaux (Anti-Recyclage de Score)** : Il est interdit de fabriquer artificiellement des milliers de quiz en réutilisant la même configuration de plateau (`board` 26 cases + dés) sous différents scores de match. Chaque couple `${quizType}:${boardPrefix26}:${dice}` doit être unique (ou plafonné à maximum 2 variantes de score critique comme Normal vs DMP/Gammon Save si et seulement si le meilleur coup change réellement).
6. **Loi d'Écart Minimum Pédagogique (Zéro Ex Æquo)** : Tout quiz dont le choix #2 a une perte d'équité `loss < 0.003` par rapport au choix #1 (coups ex æquo) doit être rejeté par le validateur afin de ne jamais pénaliser un joueur sur deux coups mathématiquement équivalents.
7. **Loi de Reprise Atomique (`Resume` & Seed Sync)** : Tout script de génération doit charger les clés existantes au démarrage (`Set`), écrire de façon atomique (`appendFileSync`), et synchroniser périodiquement `src/features/drills/bgsage3PlyFactorySeed.ts`.
