# 🏛️ MANIFESTE DIRECTEUR — PERFECTION PRODUIT MAX & MONOPOLE TECHNOLOGIQUE (2026)

> **LOI ABSOLUE DU DÉPÔT POUR LES AGENTS IA (ARGON / GEMINI 3.8 FLASH / CLAUDE) :**
> L'application est actuellement estimée à **70 % de sa cible finale**.
> **INTERDICTION FORMELLE de disperser les efforts sur la commercialisation tant que le produit n'a pas atteint 100 % de Perfection Technique, Mathématique et Esthétique.**
> Dans un monde où l'IA est omniprésente, notre seul monopole ("Moat") consiste à créer **le meilleur produit de Backgammon jamais conçu** : plus précis, plus beau, plus fluide et plus pédagogique qu'eXtreme Gammon 2 (XG2) et Backgammon Galaxy réunis.

---

## 1. DOCTRINE « PERFECTION PRODUIT MAX » (DE 70 % À 100 %)

### 1.1. Les 4 Piliers Non-Négociables de la Perfection (Priorité Exclusives)

1. **PILIER A — Intelligence Irréprochable du Bot & Vérité Mathématique (Zéro Coup Douteux)** :
   - **Zéro repli sur un coup arbitraire (`legalSeqs[0]`)** : si Open Sage (`bgsage-service` Cloud Run) ou `/api/evaluate` subit une latence ou une absence de champ `board`, le Bot a **interdiction absolue** de jouer `legalSeqs[0]`. Il doit systématiquement résoudre le coup optimal via le moteur tri-phase + table Bear-Off exacte 54 264 états (`findBestBoardMove` dans `src/lib/engine/evaluator.ts`).
   - **Fidélité 100 % de l'encodage XGID & Miroir Joueur O** : validation mathématique bout-en-bout entre `serializeXGID` (`src/engine/backgammonEngine.ts`), `xgid_to_board` (`bgsage-service/app/xgid.py`) et `bgsageMoveBoardToProjectBoard` (`src/lib/engine/bgsageClient.ts`), y compris lorsque `O` (Bot) a des pions sur la barre (`O_BAR = 25`) ou en sortie (`O_OFF = 25`).
   - **4 Niveaux de Bot calibrés avec précision** :
     - *Grand-Maître* : Open Sage 3-ply (PR ~0.23) / repli local 2-ply exact.
     - *Expert* : Open Sage 2-ply / repli local 2-ply exact.
     - *Intermédiaire* : Open Sage 1-ply / repli local 1-ply `evaluator.ts`.
     - *Débutant* : Open Sage 1-ply + bruit gaussien contrôlé.

2. **PILIER B — Esthétique Haute-Horlogerie « Cercle Monte-Carlo » & Zéro Surcharge Visuelle** :
   - **Stabilité géométrique absolue du plateau** : le plateau (`Board.tsx`) ne doit **JAMAIS** sauter, se redimensionner brutalement (ex: passage `col-span-12` $\to$ `col-span-8` au 1er coup joué) ni être écrasé par des bandeaux superflus.
   - **Éradication de l'empilement des barres parasites** :
     - Pas de doublon de Pip Count entre `MatchHud` et `PipCountBadge`.
     - Intégration harmonieuse et discrète de `DopamineJuiceBanner` et `MoveTimelineBar` sans jamais compresser la hauteur du feutre (`FeltSurface`).
     - Hiérarchie typographique, alignements au pixel près, contrastes WCAG AA et transitions fluides à **60 FPS constants** (`transform` et `opacity` uniquement).

3. **PILIER C — Pédagogie Neuro-Symbolique Google Gemini (`gemini-3.8-flash` & `gemini-3.6`) Sans Hallucination** :
   - **Usage exclusif de l'API directe Google Generative Language** (`https://generativelanguage.googleapis.com/v1beta/openai/`) :
     - Temps réel SSE (`/api/coach`) : **`gemini-3.8-flash`**.
     - Analyse profonde & revue de match (`/api/coach/review`) : **`gemini-3.6`**.
     - Repli économique / hors-ligne : **`gemini-3.5`** puis moteur déterministe local (`generateRuleBasedExplanation`).
   - **Séparation stricte Calcul / Langage** : le moteur déterministe calcule 100 % des métriques (`Equity`, `Error EMG`, `Pip Count`, `Shots/36`, `Cube Action`, `Game Phase`) et les verrouille via `symbolicAudit.ts`.
   - **Cache L2 Serveur Supabase (`public.coach_explanations`)** : indexé par `position_key` (SHA-256) pour un affichage en 0 ms sur toute position déjà rencontrée.

4. **PILIER D — Fiabilité « Zéro Gros Bug, Zéro Petit Bug » sur 100 % des Flux** :
   - **Interactions Plateau** : Smart Point Click 1-clic (`smartClickResolver.ts`), clic droit dé secondaire, clic sur les dés (permutation / confirmation), drag-and-drop 0 re-render, Undo sous-coup par sous-coup, videau (`Offer / Take / Pass`) et règle de Crawford.
   - **Modules Actifs** :
     - **Salon Privé sur Code (`BG-XXXX`)** : connexion temps réel instantanée entre 2 joueurs, pendules WBF/Fischer et audit dés SHA-256 (`DiceAuditModal.tsx`).
     - **Puzzles Quotidiens V2 (`/daily-puzzle` & `/puzzles`)** et **Gammon Academy (`/academy`)**.
     - **Banque d'entraînement de Blunders (`/drills`)** alimentée par `public.recurring_errors`.

---

## 2. RÉPARTITION DES RÔLES IA (ORCHESTRATION AUTONOME ARGON + FLASH 3.8 + CLAUDE)

Pour atteindre 100 % de perfection sans micro-management humain toutes les 3 minutes :

| Agent / Modèle | Rôle Exclusif | Domaines d'Intervention |
| :--- | :--- | :--- |
| **ARGON (Antigravity Pro + Chrome DevTools MCP)** | **Architecte Principal, Moteur Mathématique & Inspection Visuelle Live** | - Audit et correction des bugs profonds du Bot (`bgsageClient.ts`, `evaluator.ts`, `xgid.py`, `useOpponentTurnOrchestrator.ts`).<br>- Machine à états `useBackgammonGame.ts` et physique FLIP 60 FPS.<br>- Inspection visuelle réelle via navigateur (`chrome-devtools-mcp` / Playwright) avec captures d'écran avant/après. |
| **GEMINI 3.8 FLASH (`flash`)** | **Exécuteur Haute Vélocité ("Débroussaillage", UI, Découpage R1 & Tests)** | - Nettoyage esthétique CSS/Tailwind, alignements, suppression des bandeaux redondants.<br>- Découpage des fichiers dépassant `SCALABILITY.md` (`useBackgammonGame.ts`, `useMultiplayerGame.ts`).<br>- Génération exhaustive de tests unitaires Vitest et vérification i18n 6 langues. |
| **CLAUDE (Ponctuel)** | **Direction Artistique Chirurgicale & Second Regard Critique** | - Revue ponctuelle de l'harmonie visuelle luxe ("Monte-Carlo Heritage") ou des formulations pédagogiques Grands-Maîtres. |

---

## 3. ARCHITECTURE DE MONÉTISATION (PRÊTE EN ARRIÈRE-PLAN — ACTIVATION APRÈS PERFECTION 100 %)

L'infrastructure Stripe et Supabase (`public.profiles`, `public.credit_usage_ledger`, `public.processed_webhooks_events`, `public.checkout_sessions_lock`) est maintenue propre en arrière-plan et ne sera poussée commercialement qu'une fois la Perfection Produit validée à 100 % :
- **Phase 1 (Court Terme post-perfection)** : Hard Paywall sur le Coach IA (3 blunders expliqués en onboarding) et `/drills`, plans `coach_monthly` (14.99 $/mo) et `coach_yearly` (99.00 $/an).
- **Phase 2 (Long Terme)** : Pack Club & Chouette (`club_chouette` à 149,99 €/an pour 5 sièges) et Downsell anti-churn (`9,99 €/mo`).
