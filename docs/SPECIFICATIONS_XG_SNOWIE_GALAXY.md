# Master Technical & Product Specifications: eXtreme Gammon (XG), Snowie 4 & Backgammon Galaxy Parity

> **Primary Language**: English (International Engineering & WBF/USBGF Competitive Standard)  
> **Supported i18n Locales**: `en` (Primary), `fr`, `es`, `pt`, `de`, `ar` (RTL-ready) + `ja` glossary  
> **Target Benchmarks**: **eXtreme Gammon 2 (XG2)**, **BGBlitz / Snowie 4**, and **Backgammon Galaxy**  
> **Architectural Governance**: Strict compliance with [`GOVERNANCE.md`](../GOVERNANCE.md) (Zero Mocks in Production, Deterministic Engine Truth, Strict TDD) and [`SCALABILITY.md`](../SCALABILITY.md) ($\le 300$ lines per file, decoupled domain/UI).

---

## 1. Executive Vision & International Standards

This specification defines the mathematical, algorithmic, UX/gameplay, and real-time requirements to achieve **100% functional and analytical parity** with the three global pillars of modern backgammon:
1. **eXtreme Gammon (XG2)**: The gold standard for N-Ply neural evaluation, stratified Monte-Carlo rollouts, Kazaross-XG2 Match Equity Tables (MET), Equivalent Money Game (EMG) normalization, and Performance Rating ($\text{PR} = \Delta \text{EMG} \times 500$).
2. **Snowie 4**: The benchmark for clean 1-click/2-click board ergonomics, Unweighted Error Rate ($\text{ER}_{\text{Snowie}}$ normalized per total checker/cube decisions), and crisp positional dissection (Race vs. Contact vs. Bearoff neural nets).
3. **Backgammon Galaxy**: The modern competitive online standard featuring server-authoritative **Bronstein / Simple Delay** and **Fischer** clocks, the **Dual-Condition Galaxy Rating (GR)** system (*Match Winner + Error Rate Winner*), interactive post-match Equity/Luck charts, and **1-Click Blunder Training (Replay & Drill)**.

---

## 2. Internationalization (i18n) & Terminology Specification

### 2.1 Primary Language & Locale Architecture
- All engineering documentation, API contracts, database schemas, match export formats (`XGID`, `.mat`, `.sgf`, `.xg`), and engine telemetry MUST use **English (`en`)** as the canonical source of truth.
- User-facing UI and AI Coach explanations support dynamic locale switching (`src/lib/i18n/`) across:
  - `en`: English (Canonical WBF/USBGF terminology)
  - `fr`: French (FFBG official terminology: *Videau*, *Frappe*, *Porte*, *Jan*, *Règle de Crawford*)
  - `es`: Spanish (*Cubo de doblaje*, *Golpe*, *Punto*, *Regla de Crawford*)
  - `de`: German (*Dopplungswürfel*, *Schlagen*, *Punkt*, *Crawford-Regel*)
  - `ja`: Japanese (*ダブリングキューブ*, *ヒット*, *プライム*, *クロフォードルール*)

### 2.2 Standardized Backgammon Glossary Matrix (i18n)

Implemented in [`src/lib/i18n/terminologyMatrix.ts`](../src/lib/i18n/terminologyMatrix.ts) (`BACKGAMMON_TERMINOLOGY_MATRIX` & `getInternationalTerm`) with full 5-locale coverage (`en`, `fr`, `es`, `de`, `ja`):

| Canonical Concept (`en`) | XG / Snowie Notation | French (`fr`) | Spanish (`es`) | German (`de`) | Japanese (`ja`) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Performance Rating** | `PR` ($\Delta \text{EMG} \times 500$) | Note de Performance (PR) | Índice de Rendimiento (PR) | Leistungsindex (PR) | パフォーマンスレート (PR) |
| **Snowie Error Rate** | `ER (Snowie)` | Taux d'erreur Snowie | Tasa de error Snowie | Snowie-Fehlerrate | Snowieエラー率 |
| **Luck-Adjusted PR** | `PR (Luck-Adj.)` | PR Ajusté à la Chance | PR Ajustado por Suerte | Glücksbereinigtes PR | ラック調整済みPR |
| **Equivalent Money Game** | `EMG` | Équité Normalisée (EMG) | Equidad EMG | Äquivalentes Geldspiel (EMG) | 等価マネーゲーム (EMG) |
| **Match Winning Chances** | `MWC (%)` | Chances de Gain du Match | Probabilidad de Ganar | Match-Gewinnchancen | マッチ勝率 (MWC) |
| **Doubling Cube** | `Cube` (`1..64`) | Videau | Cubo de Doblaje | Dopplungswürfel | ダブリングキューブ |
| **Double / Take / Pass** | `D / T / P` | Doubler / Prendre / Passer | Doblar / Aceptar / Pasar | Doppeln / Annehmen / Passen | ダブル / テイク / パス |
| **Too Good to Double** | `TG / P` or `TG / T` | Trop fort pour doubler | Demasiado bueno para doblar | Zu gut zum Doppeln | トゥーグッド (ダブル不要) |
| **Blunder / Mistake / Inaccuracy** | `??` / `?!` / `?` | Bévue / Erreur / Imprécision | Error grave / Error / Imprecisión | Grober Fehler / Fehler / Ungenauigkeit | ブランダー / ミス / 疑問手 |
| **Blunder Training** | `Replay & Drill` | Blunder Training (Rejeu) | Entrenamiento de Errores | Fehler-Training (Drill) | ブランダートレーニング |
| **Bronstein / WBF Delay** | `Delay (12s)` | Délai Bronstein / WBF | Retardo Bronstein / WBF | Bronstein-Verzögerung | ブロンシュタイン・ディレイ |
| **Fischer Increment** | `Increment (+s)` | Incrément Fischer | Incremento Fischer | Fischer-Inkrement | フィッシャー・インクリメント |

---

## 3. Mathematical & Engine Specifications (XG & Snowie Parity)

### 3.1 Multi-Tier N-Ply Evaluation & Stratified Rollouts
The evaluation pipeline orchestrates four deterministic tiers:

| Analysis Level | Engine Depth | Move Filter (Candidate Pruning) | Target Latency (p95) | Runtime Execution Target |
| :--- | :--- | :--- | :---: | :--- |
| **0-Ply / Offline Instant** | Direct neural pass or Tri-Phase + Exact 54,264 Bear-Off | All legal sequences evaluated | $< 5\text{ ms}$ | `bgsage-service` (0-ply) / Local `evaluator.ts` (`gnubg.worker.ts`) |
| **1-Ply (Fast)** | 1-ply (21 distinct dice replies) | Top 8 moves from 0-ply | $< 20\text{ ms}$ | `bgsage-service` (Open Sage C-bindings on Google Cloud Run) |
| **2-Ply (XG Fast / Snowie 2-Ply)** | $21 \times 21 = 441$ reply branches | Normal Filter: Top 5 + any move within $0.080\text{ EMG}$ | $< 60\text{ ms}$ | `bgsage-service` (Open Sage 2-ply on Google Cloud Run) |
| **3-Ply (XG World Class)** | $21^3 = 9\,261$ branches | Dynamic 2-pass: re-evaluates moves where $\|\Delta E\| \le 0.060\text{ EMG}$ | $< 320\text{ ms}$ | `bgsage-service` (Open Sage 3-ply, PR 0.23) |
| **Rollout 1296 / 3888 (Gold)** | $36^2 = 1\,296$ or $3 \times 36^2 = 3\,888$ trials | Top 2 to 4 candidates | $1.5\text{ s} - 6.0\text{ s}$ (SSE stream) | `/api/rollout` (Variance-Reduced Stratified Rollout) |

#### Output Probability Vector (5-Tuple Standard)
Every evaluation returns the canonical 5-tuple probability vector from the active player's perspective:
$$\mathbf{P} = \left( P_{\text{win}}, \; P_{\text{winGammon}}, \; P_{\text{winBG}}, \; P_{\text{loseGammon}}, \; P_{\text{loseBG}} \right)$$
where:
- $P_{\text{win}} \in [0, 1]$ is total win probability (including gammons and backgammons),
- $P_{\text{lose}} = 1 - P_{\text{win}}$,
- Cubeless Money Equity:
  $$E_{\text{cubeless}} = \left(2 P_{\text{win}} - 1\right) + \left(P_{\text{winGammon}} - P_{\text{loseGammon}}\right) + \left(P_{\text{winBG}} - P_{\text{loseBG}}\right) \in [-3, +3]$$

---

### 3.2 Match Equity Tables (MET: Kazaross-XG2 & Woolsey-Heinrich)

The system supports selectable Match Equity Tables in `src/features/coach/matchContext.ts`:
1. **Kazaross-XG2 (Default Standard)**: Exact $25 \times 25$ empirical rollout matrix used in eXtreme Gammon 2.
2. **Woolsey-Heinrich (Classic Snowie Standard)**: Selectable for legacy Snowie 4 comparison.

#### MWC to EMG (Equivalent Money Game) Normalization
Given match score $(a_P, a_O)$ (points away for Player $P$ and Opponent $O$) and active cube value $C$:
- Let $M_{\text{win}} = \text{MET}(a_P - C, a_O)$ and $M_{\text{loss}} = \text{MET}(a_P, a_O - C)$.
- Any Match Winning Chance $\text{MWC} \in [0, 1]$ is mapped linearly to **EMG**:
  $$\text{EMG}(\text{MWC}) = 2 \cdot \frac{\text{MWC} - M_{\text{loss}}}{M_{\text{win}} - M_{\text{loss}}} - 1$$
- Any decision equity loss in EMG is:
  $$\Delta E_{\text{EMG}} = \text{EMG}(\text{MWC}_{\text{optimal}}) - \text{EMG}(\text{MWC}_{\text{played}}) \ge 0$$

#### Janowski Cubeful Model & Cube Decision States
For non-Crawford games where the cube is alive, the engine computes:
- $E_{\text{ND}}$ (*No Double* cubeful equity),
- $E_{\text{DT}}$ (*Double / Take* cubeful equity at $2C$, accounting for cube efficiency $x \in [0.60, 0.75]$ and recube vig),
- $E_{\text{DP}} = +1.000\text{ EMG}$ (*Double / Pass* equity).

The effective equity of offering a double is $E_{\text{Double}} = \min(E_{\text{DT}}, E_{\text{DP}})$.
- **Double Threshold**: $E_{\text{Double}} \ge E_{\text{ND}}$ and $E_{\text{ND}} < +1.000\text{ EMG}$.
- **Take Threshold**: From the defender's perspective, $E_{\text{Take}} \ge E_{\text{Pass}}$ (i.e., attacker's $E_{\text{DT}} \le +1.000\text{ EMG}$).
- **Too Good to Double**: $E_{\text{ND}} > E_{\text{DP}} = +1.000\text{ EMG}$ (gammon threats outweigh winning 1 point immediately).
- **Post-Crawford Free Drop**: Automatically triggered when the trailer's score is odd-away (e.g., 1-away vs. 2-away or 1-away vs. 4-away with cube at 2) where $\text{MET}(1, a_O - C) = \text{MET}(1, a_O - 2C)$.

---

### 3.3 Performance Rating (PR), Snowie Error Rate & Luck-Adjusted PR

#### A. XG Performance Rating (`PR`) — Primary Metric
$$\text{PR}_{\text{XG}} = \frac{\sum_{i \in \mathcal{D}_{\text{checker}}} \Delta E_{i}^{\text{EMG}} + \sum_{j \in \mathcal{D}_{\text{cube}}} \Delta E_{j}^{\text{EMG}}}{|\mathcal{D}_{\text{checker}}| + |\mathcal{D}_{\text{cube}}|} \times 500$$
where:
- $\mathcal{D}_{\text{checker}}$ is the set of **Unforced Checker Decisions** (turns where the number of distinct legal resulting board states is $\ge 2$).
- $\mathcal{D}_{\text{cube}}$ is the set of **Close or Actioned Cube Decisions** (pre-roll states where the player can double and $\|E_{\text{ND}} - E_{\text{Double}}\| \le 0.200\text{ EMG}$, or where a double was actually offered/faced).

#### B. Snowie Unweighted Error Rate (`ER_Snowie`) — Secondary Metric
Snowie normalizes total equity loss by the **total number of turns played by both players** (or total player turns including forced moves), expressed in millipoints per move:
$$\text{ER}_{\text{Snowie}} = \frac{\sum \Delta E^{\text{EMG}}}{N_{\text{total\_turns}}} \times 1000$$

#### C. Dice Luck & Luck-Adjusted Equity
For every dice roll $r_t = (d_1, d_2)$ at state $S_t$:
$$\text{Luck}_{\text{EMG}}(t) = E_{\text{EMG}}^*(S_t, r_t) - \sum_{k=1}^{21} w_k E_{\text{EMG}}^*(S_t, r_k), \quad w_k = \begin{cases} \frac{1}{36} & \text{if } d_1 = d_2 \\ \frac{2}{36} & \text{if } d_1 \ne d_2 \end{cases}$$
- **Luck-Adjusted Match Equity**: $\Delta \text{MWC}_{\text{skill}} = \Delta \text{MWC}_{\text{actual}} - \Delta \text{MWC}_{\text{luck}}$.

#### D. Error Severity Classification Thresholds (EMG)
- **Optimal / Excellent (`logAnalyzer`: `Optimal ✅`)**: $\Delta E_{\text{EMG}} \le 0.010$ (`moveClassifier` optimal $\le 0.005$)
- **Good (`logAnalyzer`: `Bon 👍`)**: $0.010 < \Delta E_{\text{EMG}} \le 0.020$
- **Inaccuracy (`?` / `logAnalyzer`: `Imprécision ⚠️`)**: $0.020 < \Delta E_{\text{EMG}} \le 0.040$
- **Mistake (`?!` / `logAnalyzer`: `Imprécision ⚠️`)**: $0.040 < \Delta E_{\text{EMG}} \le 0.080$
- **Blunder (`??` / `logAnalyzer`: `Blunder ❌`)**: $\Delta E_{\text{EMG}} > 0.080$ (`howler` $> 0.250$)

---

## 4. Core Gameplay, Ergonomics & 60 FPS Zero-Latency Specification

### 4.1 Interaction Modes (Desktop & Mobile)
1. **Smart Point Click (Destination-First — Zero Native Double-Click)**:
   - **Left-Click on Checker or Target Point**: Prioritizes the currently active/preferred die (`preferredDie`, toggled by clicking the dice or pressing `Tab`). Clicking a destination point reachable in 1 die plays it immediately; clicking a destination reachable via the sum $d_1 + d_2$ chains both sub-moves with a 55ms intermediate touch pause (`smartClickResolver.ts`); native `onDoubleClick` is strictly prohibited to avoid 250ms debounce latency.
   - **Right-Click on Checker**: Explicitly plays the secondary die (`1 - preferredDie`). Right-click on the board felt triggers Undo.
   - **Point-Building Shortcut (Port Click)**: Clicking an empty point or blot when two checkers can legally land on it plays both checkers to make the point with a 45ms choreographed stagger.
2. **Touch-First Ergonomics (Mobile/Tablet)**:
   - Minimum `44x44 px` WCAG touch targets on all 24 points, bar, and bear-off trays (`X_OFF = 0`, `O_OFF = 25`).
   - Tap on dice swaps `preferredDie` (`0 <-> 1`) with immediate visual and haptic feedback.
   - Tap on a movable checker plays the active die or illuminates target points when ambiguous.
3. **Full Sub-Move Undo & Turn Confirmation Lifecycle**:
   - Players must be able to **Undo (`Ctrl+Z` / Undo button)** any sub-move within their current turn, **including the final die**, before the turn is committed (or within the configurable auto-commit grace window).
4. **Strict 60 FPS Rendering & Non-Blocking AI Transitions**:
   - No 2-ply or neural evaluation may run synchronously inside a React render or synchronous `useEffect` block during checker movement animations.
   - AI turn preparation (`OPPONENT_PREPARE_ROLL`) must yield a browser paint frame (`requestAnimationFrame` / async timer) before computing `findBestBoardMove`, ensuring zero frame drops on the human player's final checker slide.

---

## 5. Backgammon Galaxy Competitive & Post-Match Specifications

### 5.1 Competitive Clock System (Bronstein / Simple Delay & Fischer) & Network Resilience
- **Tournament Default & Speed Presets (`src/features/multiplayer/clockManager.ts`)**:
  - **Normal (WBF / Galaxy Standard)**: $2.0\text{ min per match point}$ + $12\text{ s}$ delay/increment.
  - **Speed (Galaxy Speed)**: $1.0\text{ min per match point}$ + $8\text{ s}$ delay/increment.
  - **Blitz (Galaxy Blitz)**: $30\text{ s per match point}$ + $5\text{ s}$ delay/increment.
  - **Bronstein / Simple Delay (`delay` / `bronstein`)**: Free delay counts down to $0.0\text{ s}$ on every turn before a single millisecond of the Time Bank is consumed; the main time bank never increases above its start-of-turn balance.
  - **Fischer Increment (`fischer`)**: Main Time Bank ticks immediately during the turn (`delayRemainingMs = 0`), and `+delaySeconds` is added to the active player's Time Bank upon completing each legal turn.
- **Auto-Reconnection & Outbound Action Queue (`src/features/multiplayer/realtimeChannel.ts`)**:
  - Exponential backoff reconnection (`1s`, `2s`, `4s`, `8s`, `16s` up to 5 attempts) triggered automatically on `CHANNEL_ERROR`, `TIMED_OUT`, or browser `online` events.
  - Outbound `pendingActions` FIFO queue buffers game actions dispatched during transient network drops and flushes them in order upon `SUBSCRIBED` restoration.
  - 45-second disconnect countdown with `onOpponentForfeitByDisconnect` notification.

### 5.2 Galaxy Rating (GR) — Dual-Condition Rating Formula
In Ranked Multiplayer matches, rating points ($\Delta \text{GR}$) require satisfying two criteria:
1. **Match Outcome ($W_{\text{match}} \in \{0, 1\}$)**: Winning the match to $L$ points.
2. **Error Rate Outcome ($W_{\text{PR}} \in \{0, 1\}$)**: Achieving a lower (better) PR than the opponent ($\text{PR}_{\text{player}} \le \text{PR}_{\text{opponent}}$).

Given Elo expectation $E_A = \frac{1}{1 + 10^{(R_B - R_A)/400}}$ and match weight $K(L) = 16 \sqrt{L}$:
- **Full Victory ($W_{\text{match}} = 1 \land W_{\text{PR}} = 1$)**: Winner gains $+K(L) \cdot (1 - E_A)$; Loser loses $-K(L) \cdot (1 - E_A)$.
- **Split Outcome ($W_{\text{match}} = 1 \land W_{\text{PR}} = 0$, "Lucky Win")**: The match winner only receives $50\%$ of the normal rating gain, and the outplaying loser ("PR Winner") is shielded from $50\%$ of the rating loss.

### 5.3 Interactive Post-Match Review & Blunder Training ("Replay & Drill")
1. **3-Mode Interactive Equity, MWC & Luck Chart (`src/components/rating/EquityCurveChart.tsx`)**:
   - Interactive mode switcher (`EMG (ΔEq)`, `MWC %`, and `Luck 🎲`) plotting turn-by-turn fluctuations.
   - Clicking any turn node jumps the review board directly to that turn (`boardBefore`, `dice`, `playedNotation` vs. `optimalNotation`).
2. **Blunder Training Quiz Mode (`src/components/rating/ReviewBoardPreview.tsx` & `GameReviewModal.tsx`)**:
   - Every mistake and blunder is automatically indexed into `src/features/drills/blunderBank.ts` during `analyzeCompleteGame`.
   - Clicking **`🎯 Drill`** (`data-testid="toggle-blunder-drill-btn"`) hides the engine's optimal move and challenges the player to identify the optimal play among candidate choices with immediate EMG feedback.

---

## 6. Pedagogical AI Coach Architecture & Contextual Playstyle Profiler

### 6.1 Contextual Playstyle Profiler (`src/features/coach/playstyleProfiler.ts`)
- Analyzes unforced decisions across a complete game (`analyzePlaystyle(analysis, locale)`) and classifies the player into one of 5 archetypes across 5 languages (`en`, `fr`, `es`, `de`, `ja`):
  - `aggressive_blitzer` (*Aggressive Blitzer*)
  - `conservative_builder` (*Conservative Builder*)
  - `tactical_priming` (*Tactical Priming Architect*)
  - `racing_specialist` (*Pure Race Specialist*)
  - `balanced_all_rounder` (*Balanced All-Rounder*)
- Computes quantitative indices (`aggressionIndex`, `positionalSolidness`, `racingAccuracy` on a `0..100` scale), diagnoses the player's `primaryWeakness`, and recommends targeted `recommendedDrillFocus` concepts in `GameReviewCourse.tsx` (`data-testid="coach-playstyle-profile"`).

### 6.2 PR-Integrity Protection (Tournament vs. Training Modes)
To ensure that live AI Coach hints never corrupt or artificially inflate a player's official **Performance Rating (PR)**:
1. **Ranked / Tournament Mode**:
   - Live Coach hints, opening book overlays, and candidate evaluations are **strictly locked** during active play and unlocked only in Post-Match Review.
2. **Training / Coaching Mode**:
   - Players may request a **Live Coach Hint** (`triggerCoach`) before committing their move.
   - Any turn where a hint was viewed before move confirmation is flagged with `isAssistedTurn: true` in the `MatchLogEntry` and **excluded from official unassisted PR leaderboards** (tracked separately as *Assisted Training PR*).

### 6.3 Hybrid Deterministic + LLM Tactical Explainer
- **Layer 1 (Deterministic Feature Extractor — `tacticalExplainer.ts` & `logAnalyzer.ts`)**:
  - Computes exact pip counts, prime lengths, home-board points, direct/indirect shots (1 to 12 pips), back-checker anchor status, and Kazaross MET gammon prices.
- **Layer 2 (Contextual LLM Synthesizer — `/api/coach` & `/api/coach/review`)**:
  - Consumes the immutable `CoachDigest` / `CompleteGameAnalysis` JSON and generates natural-language pedagogical feedback via direct Google Gemini API (`gemini-3.8-flash` / `gemini-3.6` / fallback `gemini-3.5`) in the user's active locale (`en`, `fr`, `es`, `pt`, `de`, `ar`) without ever inventing moves or probabilities.
- **Layer 3 (Canonical Position Cache — `explanationCache.ts` & `coachExplanationPersistence.ts`)**:
  - Caches explanations by canonical `position_key` (SHA-256 of board + match context + move + locale) in L1 Memory LRU + L2 shared Supabase table `public.coach_explanations`.
