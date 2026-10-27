# Plan d'Action — Perfection Produit Max (70 % $\to$ 100 %) : Bot Irréprochable, Esthétique Haute-Horlogerie & Zéro Bug

> **Date de mise à jour** : 24 Octobre 2026. Conformément à [`SYSTEM_SPEC_PROFITABILITY_MANIFESTO.md`](../SYSTEM_SPEC_PROFITABILITY_MANIFESTO.md), **100 % des efforts d'ingénierie sont concentrés sur la Perfection Produit (passage de 70 % à 100 %)** : fiabilisation mathématique absolue du Bot IA, épuration esthétique et géométrique de l'interface (zéro saut de layout, zéro surcharge de bandeaux), et élimination de tous les gros et petits bugs.

---

## 1. État Actuel Consolidé (Octobre 2026)

| Axe | État Actuel | Niveau de Maturité |
|---|---|---|
| **Moteur de Règles & IA** | **Open Sage (`bgsage-service` Cloud Run, PR 0.23)** unifié pour les 4 niveaux de bots + videau et le Coach IA ; repli local tri-phase + table Bear-Off 54 264 états (`evaluator.ts`). WildBG archivé. | **96 % (Production)** |
| **Game Feel & Audio/Haptique** | Smart Point Click (1 clic destination-first), drag-and-drop 0 re-render React, trajectoires FLIP WAAPI, 3 cadences (Coach/Tournoi/Blitz), synthèse modale Web Audio API 0 ms et haptique granulaire. | **95 % (Production)** |
| **Coach IA & Pédagogie** | Pipeline log-driven (`logAnalyzer.ts`), API directe Google Gemini (`gemini-3.8-flash` / `gemini-3.6` / repli `gemini-3.5`) en SSE, Cache L2 Supabase (`coach_explanations`), rapport post-match en 5 sections (`PostMatchTrainingReport`), synthèse IA (`PostMatchAiSynthesis`). | **95 % (Production)** |
| **Puzzles V2, FSRS & Academy** | `/puzzles` et `/daily-puzzle` unifiés sur `DailyPuzzleScreen` V2 (certifié Open Sage 3-ply + répétition espacée FSRS) et agrégés dans `/progression`. Hub SEO `/academy` en 6 langues + RTL. | **95 % (Production)** |
| **Intégrité RNG Provably Fair** | Protocole Commit-Play-Reveal HMAC-SHA256 (`< 252`, zéro biais de modulo) câblé en solo, multijoueur (`MatchHeader.tsx`) et auditable en 1 clic via `DiceAuditModal` (bouton `🛡️ Audit Dés (SHA-256)`). | **95 % (Production)** |
| **Monétisation en 2 Temps & Stripe** | Quota Coach IA (`quotaService.ts`, `useCoachQuota.ts`, `public.profiles` + `public.credit_usage_ledger`), Paywall `402` (`DAILY_COACH_QUOTA_REACHED`, `SubscriptionModal.tsx`, blocage Pro sur `/drills`), page `/pricing` (Phase 1 : 14.99 $/mo & 99.00 $/an ; Phase 2 : Pack Club & Chouette 149,99 €/an + Downsell 9,99 €/mo) et endpoints Stripe (`/api/stripe/checkout`, `/api/stripe/webhook`). | **92 % (Production)** |
| **Salon Privé sur Code (`BG-XXXX`)** | **Exclusivité Salon Privé** (retrait total du matchmaking public, des listes d'attente et des classements publics). Duels directs entre amis/clubs via code à 4 chiffres (`OpenMatchesTable.tsx`, `MultiplayerLobbyModal.tsx`), pendules WBF et dés SHA-256. | **95 % (Production)** |
| **Qualité & Tests** | **1 310 tests unitaires et composants Vitest sur 224 fichiers** (0 échec), `tsc --noEmit` à **0 erreur**, 27 scénarios Playwright E2E, 9 migrations SQL Supabase avec RLS durci. | **94 % (Production)** |

---

## 2. Chantiers Livrés Récemment ✅

1. **Unification du moteur IA sur Open Sage Cloud Run (`ADR-009`)** : suppression de la divergence entre bot et coach, prise en charge complète du videau (`OFFER_DOUBLE`, `TAKE_DOUBLE`, `PASS_DOUBLE`) et pipeline parallèle *Roll & Compute*.
2. **Point 1 — Unification de `/puzzles` et `/daily-puzzle` (Livré)** :
   - [`src/app/puzzles/page.tsx`](../src/app/puzzles/page.tsx) pointe désormais sur [`DailyPuzzleScreen`](../src/app/daily-puzzle/page.tsx).
   - [`userProgressionService.ts`](../src/features/progression/userProgressionService.ts) agrège directement le profil local V2 (`loadLocalPuzzleProfile`) et le catalogue certifié (`DAILY_PUZZLES_CATALOG`).
3. **Point 2 — Câblage UI du Soft Paywall & de l'Audit RNG Provably Fair (Livré)** :
   - Montage de [`DiceAuditModal`](../src/components/dice/DiceAuditModal.tsx) et [`SubscriptionModal`](../src/components/subscription/SubscriptionModal.tsx) dans [`GameModalsContainer.tsx`](../src/components/modals/GameModalsContainer.tsx).
   - Remplacement du `Math.random()` résiduel en multijoueur ([`MatchHeader.tsx`](../src/components/hud/MatchHeader.tsx)) par [`generateProvablyFairRoll`](../src/lib/crypto/provablyFairRng.ts).
   - Ajout du bouton `🛡️ Audit Dés (SHA-256)` dans [`PostMatchTrainingReport.tsx`](../src/components/summary/PostMatchTrainingReport.tsx), du badge de quota + Soft Paywall dans [`PostMatchAiSynthesis.tsx`](../src/components/summary/PostMatchAiSynthesis.tsx) et du lien `⚜ Coach Illimité VIP` (`/pricing`) dans [`UserAccountMenu.tsx`](../src/components/nav/UserAccountMenu.tsx).
4. **Point 3 — Recentrage Exclusif sur le « Salon Privé sur Code (`BG-XXXX`) » (Livré)** :
   - **Suppression intégrale** du matchmaking public classé, des onglets de classement public, des bandeaux de Pré-Saison / liste d'attente et des adversaires simulés dans [`OpenMatchesTable.tsx`](../src/components/lobby/OpenMatchesTable.tsx), [`MultiplayerLobbyModal.tsx`](../src/components/multiplayer/MultiplayerLobbyModal.tsx), [`LobbyScreen.tsx`](../src/components/lobby/LobbyScreen.tsx) et [`useMultiplayerGame.ts`](../src/hooks/useMultiplayerGame.ts).
   - **Conservation exclusive du Salon Privé (`BG-XXXX`)** : création d'un code à 4 chiffres en 1 clic (formats 1, 3, 5, 7 pts) ou connexion directe au code d'un ami / partenaire de club, traduit dans les 6 langues (`uiTranslations.ts`).

---

## 3. Décision Stratégique Marché : Exclusivité « Coach IA Solo + Salon Privé »

### 3.1 Pourquoi supprimer le Matchmaking Public et ne garder que le Salon Privé ?

1. **Zéro problème de liquidité ("Zero Cold-Start")** :
   - Un matchmaking public exige des centaines de joueurs simultanés 24h/24 sous peine d'afficher des files d'attente vides.
   - Le **Salon Privé sur Code (`BG-XXXX`)** fonctionne parfaitement **dès 2 joueurs** (amis, membres d'un club FFBG/WBGF, coach et élève) avec **0 seconde d'attente**.
2. **Alignement 100 % avec le modèle économique (« Pure Skill & Coach VIP »)** :
   - L'avantage concurrentiel de **Backgammon Tour & Gammon Academy** face à *eXtreme Gammon* et *Backgammon Galaxy* est son **Coach IA Grand-Maître** (Open Sage PR 0.23 + Gemini + FSRS).
   - Le Salon Privé nourrit directement l'acquisition virale entre joueurs de club et justifie l'offre **Pack Club & Chouette (149,99 €/an)** ainsi que la revue post-match par le Coach IA.

---

## 4. Prochaines Étapes Prioritaires (Feuille de Route Exécutive)

### 🟠 P1 — Hygiène Git & Découpage Architectural (`SCALABILITY.md`)
1. **Sécurisation Git par lots atomiques** : commiter proprement les fichiers du working tree par domaine fonctionnel (Moteur/GameFeel, Glicko-2/FSRS/Puzzles, Provably Fair/Anti-Cheat, Quotas/Stripe/Pricing, Salon Privé & Docs).
2. **Découpage des fichiers hors budget de lignes (Livré)** :
   - [`src/hooks/useBackgammonGame.ts`](../src/hooks/useBackgammonGame.ts) (164 lignes, budget ≤ 200) : ✅ Résolu (`useMatchProgressionState.ts`, `useGameActionDispatchers.ts`, `useGameActionBridge.ts`, `useGameSessionControl.ts`, `useGameTurnOrchestrators.ts`).
   - [`src/hooks/useMultiplayerGame.ts`](../src/hooks/useMultiplayerGame.ts) (144 lignes, budget ≤ 200) : ✅ Résolu (`useMultiplayerLocalProfile.ts`, `useMultiplayerClockAndTimers.ts`, `useMultiplayerBroadcasters.ts`, `useMultiplayerRoomOrchestrator.ts`).
   - *(Note : `page.tsx` à 274 lignes, `Board.tsx` à 281 lignes et `knowledgeBaseData.ts` à 47 lignes sont également 100 % conformes à `SCALABILITY.md`).*

### 🟡 P2 — Mise en Production Cloud (Supabase & Stripe Live)
1. **Application des migrations SQL Supabase (6 à 9)** sur l'instance de production (`supabase db push`) :
   - `20261023000000_shared_coach_explanations_cache.sql`
   - `20261024000000_glicko2_daily_puzzle_fsrs.sql`
   - `20261025000000_subscription_quotas_stripe.sql`
   - `20261026000000_saas_blueprint_monetization.sql`
2. **Configuration des secrets Stripe Live** sur Vercel/Netlify :
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PRICE_MONTHLY`, `NEXT_PUBLIC_STRIPE_PRICE_YEARLY`, `NEXT_PUBLIC_STRIPE_PRICE_COACH_MONTHLY`, `NEXT_PUBLIC_STRIPE_PRICE_COACH_ANNUAL`, `NEXT_PUBLIC_STRIPE_PRICE_CLUB_CHOUETTE`, `NEXT_PUBLIC_STRIPE_PRICE_DOWNSELL_MONTHLY`.
3. **Automatisation de l'alimentation quotidienne de `daily_puzzles`** : tâche planifiée (`/api/cron/daily-puzzle`) générant et certifiant de nouvelles positions Open Sage 3-ply au-delà du catalogue initial embarqué.

### 🟢 P3 — Enrichissement du Salon Privé (Partage Direct) ✅ (Livré)
1. **Lien d'invitation directe en 1 clic (`https://backgammontour.com/?join=BG-XXXX`)** :
   - ✅ Détection automatique de `?join=BG-XXXX` ou `?room=BG-XXXX` sur `src/app/page.tsx` via `usePrivateRoomInvite.ts`.
   - ✅ Nettoyage fluide de l'URL via `window.history.replaceState` sans rechargement.
   - ✅ Ouverture automatique de `PrivateRoomModal.tsx`, pré-remplissage du code et connexion en 1 clic.
   - ✅ Boutons « Copier le lien direct » et « Partager (WhatsApp / Club) » via Web Share API (`navigator.share`) avec repli presse-papiers dans `PrivateRoomModal.tsx` et `LobbyPrivateRoomTab.tsx`.
