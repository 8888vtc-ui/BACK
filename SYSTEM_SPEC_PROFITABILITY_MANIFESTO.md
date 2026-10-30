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

5. **PILIER E — Écosystème de Bots Personnifiés, Interface Adaptative (« UI Caméléon ») & Addiction Positive** :
   - **Incarnation des 4 Adversaires (Fin du Robot Muet)** : Transformer les 4 paliers actuels (*Léo, Sofia, Kenji, Viktor*) en **4 Archétypes Vivants** dotés à la fois d'un **biais tactique dans le moteur** (`evaluator.ts` / `bgsageClient.ts`) et d'une **personnalité conversationnelle temps réel (< 500 ms)** :
     1. **Le Mauvais Joueur (Style Blitz Agressif)** : Surpondère les frappes, casse ses portes pour attaquer et peste avec mauvaise foi contre les dés (*Luck Rating* / *Huge Joker*), sans jamais insulter l'intelligence du joueur (conformité étude CMU).
     2. **La Dragueuse « Riviera Monte-Carlo » (Style Holding & Pièges)** : Conserve des ancres hautes, pose des pions appâts (*blots* calculés) et taquine avec l'élégance d'un salon privé de Monte-Carlo (avec garde-fous stricts App Store Section 1.2 : filtrage E/S + boutons *Signaler / Muet*).
     3. **L'Homme d'Affaires High-Roller (Style Course Pure & Videau Actif)** : Optimise le *Pip Count*, négocie agressivement le Videau (*Doubling Cube*) et enseigne les seuils mathématiques de *Take / Pass* (25 %).
     4. **L'Intellectuel Grand-Maître (Style Positionnel & Barricade / Prime)** : Construit des murs de 5–6 portes consécutives et enseigne les probabilités sur 36 en 2–3 phrases maximum.
   - **Double Environnement Adaptatif (« S'amuser pour le Débutant » ↔ « S'améliorer pour le Pro »)** :
     - **Mode Découverte / Ludique (Débutant)** : Interface épurée, format court 1 point (DMP) ou sans hasard (**Gammon36**), repères visuels sur les portes et pions isolés, et **Tuteur Préventif incarné par le Bot** qui réagit *avant* la validation d'une grosse gaffe (> 0,12 EMG) sans jargon intimidant.
     - **Mode Master / Pro (Expert)** : HUD analytique complet (perte d'équité en millipoints EMG, *Performance Rating* PR, Keith Count, distribution sur 36), zéro interruption pendant le coup et sparring spécialisé à haute profondeur (2-ply / 3-ply Open Sage).
   - **Neutralisation du « Syndrome des Dés Truqués »** : Coupler l'audit cryptographique `provablyFairRng.ts` avec le bouton pédagogique **« 🔄 Rejouer en Inversant les Dés (Swap Dice) »** permettant au joueur de rejouer exactement la même graine en prenant les tirages qu'avait reçus le Bot.

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

---

## 4. DOCTRINE SOLOPRENEUR AUGMENTÉ, ALGORITHME EN 5 ÉTAPES & MASTER PLAN AUTOFINANCÉ

1. **Souveraineté Capitalistique (0 % Dilution)** :
   - Le projet opère selon le modèle du **Solopreneur Augmenté** (marge opérationnelle cible > 75 %, 100 % du capital et des droits de vote conservés).
   - Le coût marginal d'inférence IA et d'évaluation est maintenu sous **0 à 5 $ / jour pour 1 000 joueurs actifs quotidiens (DAU)** grâce au couplage : évaluateur local (`evaluator.ts`) + Cache L2 Supabase (`public.coach_explanations`) + fenêtrage JSON compact (< 500 ms) sur `gemini-3.8-flash`.

2. **Application Stricte de « L'Algorithme en 5 Étapes » & de « L'Indice Idiot » d'Elon Musk** :
   - **Étape 1 (Questionner chaque exigence)** & **Étape 2 (Supprimer au moins 10 % des étapes superflues)** : Suppression totale du matchmaking public (remplacé par les 4 Bots Personnifiés disponibles 24h/24 et le Salon Privé `BG-XXXX` à 0 seconde d'attente). Suppression des bandeaux redondants sur le plateau.
   - **Étape 3 (Simplifier & Optimiser)** : Unification du moteur de jeu et du coaching conversationnel autour des événements mathématiques du plateau (`Blunder > 0.12 EMG`, `Huge Joker`, `Hit Blot`, `Cube Window`).
   - **Étape 4 (Accélérer le temps de cycle)** : Sessions atomiques de 3 minutes (Match 1 pt DMP, Défi Tactique Flash, Puzzle du Jour).
   - **Étape 5 (Automatiser en dernier)** : Priorité aux réactions déterministes pré-cachées (0 ms, coût 0 $) avant d'appeler le LLM en streaming.

3. **Master Plan Autofinancé en 3 Paliers & Distribution-First** :
   - **Palier 1 (Viralité Organique & Preuve Terrain)** : Exploiter les réactions théâtrales des 4 Bots (*Le Mauvais Joueur*, *La Dragueuse*) et le bouton **« Inverser les Dés (Swap Dice) »** comme moteur de contenus courts (TikTok / Reels / Shorts / Clubs) et valider l'expérience auprès d'au moins 10 joueurs cibles (5 débutants + 5 joueurs de club).
   - **Palier 2 (Monétisation par la Valeur — Cible 10k€ à 20k€ MRR)** : Commercialiser une transition mesurable (« Apprenez en vous amusant sans vous faire humilier » pour le Débutant ; « Divisez votre PR par deux face à 4 sparring-partners spécialisés » pour le Pro).
   - **Palier 3 (Expansion Autofinancée & Revue de Pivot à 90 Jours)** : Réinvestir les bénéfices dans le déploiement App Store / Google Play (Capacitor) et auditer trimestriellement la rétention et la conversion tout en protégeant l'énergie du fondateur (< 35h/semaine d'opérations répétitives).
