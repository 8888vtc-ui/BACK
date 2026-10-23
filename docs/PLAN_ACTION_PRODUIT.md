# Plan d'action — Feuille de Route Produit & Technique (Backgammon Tour & Gammon Academy)

> **Date de mise à jour** : 23 Octobre 2026. Ce document synthétise l'état réel du produit après le déploiement d'**Open Sage** sur Google Cloud Run, l'implémentation des 4 piliers de [`docs/MASTER_SPEC_EXCELLENCE.md`](MASTER_SPEC_EXCELLENCE.md), l'unification des Puzzles Quotidiens V2 + FSRS (**Point 1**) et le câblage complet du Soft Paywall Stripe & du RNG Provably Fair SHA-256 (**Point 2**).

---

## 1. État Actuel Consolidé (Octobre 2026)

| Axe | État Actuel | Niveau de Maturité |
|---|---|---|
| **Moteur de Règles & IA** | **Open Sage (`bgsage-service` Cloud Run, PR 0.23)** unifié pour les 4 niveaux de bots + videau et le Coach IA ; repli local tri-phase + table Bear-Off 54 264 états (`evaluator.ts`). WildBG archivé. | **96 % (Production)** |
| **Game Feel & Audio/Haptique** | Smart Point Click (1 clic destination-first), drag-and-drop 0 re-render React, trajectoires FLIP WAAPI, 3 cadences (Coach/Tournoi/Blitz), synthèse modale Web Audio API 0 ms et haptique granulaire. | **95 % (Production)** |
| **Coach IA & Pédagogie** | Pipeline log-driven (`logAnalyzer.ts`), Gemini 2.5 Flash en SSE, Cache L2 Supabase (`coach_explanations`), rapport post-match en 5 sections (`PostMatchTrainingReport`), synthèse IA (`PostMatchAiSynthesis`). | **95 % (Production)** |
| **Puzzles V2, FSRS & Academy** | `/puzzles` et `/daily-puzzle` unifiés sur `DailyPuzzleScreen` V2 (certifié Open Sage 3-ply + répétition espacée FSRS) et agrégés dans `/progression`. Hub SEO `/academy` en 6 langues + RTL. | **95 % (Production)** |
| **Intégrité RNG Provably Fair** | Protocole Commit-Play-Reveal HMAC-SHA256 (`< 252`, zéro biais de modulo) câblé en solo, multijoueur (`MatchHeader.tsx`) et auditable en 1 clic via `DiceAuditModal` (bouton `🛡️ Audit Dés (SHA-256)`). | **95 % (Production)** |
| **Monétisation Freemium & Stripe** | Quota 3 analyses Coach IA gratuites / 24h (`quotaService.ts`, `useCoachQuota.ts`), Soft Paywall `402` (`SubscriptionModal.tsx`, `PostMatchAiSynthesis.tsx`), page `/pricing` et endpoints Stripe (`/api/stripe/checkout`, `/api/stripe/webhook`). | **92 % (Production)** |
| **Qualité & Tests** | **1 145+ tests unitaires et composants Vitest** (0 échec), `tsc --noEmit` à **0 erreur**, 27 scénarios Playwright E2E, 8 migrations SQL Supabase avec RLS durci. | **92 % (Production)** |

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

---

## 3. Prochaines Étapes Prioritaires (Reste à Faire)

### 🟠 P1 — Hygiène Git & Découpage Architecturale (`SCALABILITY.md`)
1. **Sécurisation Git par lots atomiques** : commiter proprement les fichiers du working tree par domaine fonctionnel (Moteur/GameFeel, Glicko-2/FSRS/Puzzles, Provably Fair/Anti-Cheat, Quotas/Stripe/Pricing, Docs).
2. **Découpage des fichiers hors budget de lignes** :
   - [`src/hooks/useBackgammonGame.ts`](../src/hooks/useBackgammonGame.ts) (~2 372 lignes, budget ≤ 200) : extraire le reducer pur et les effets temporels du tour IA.
   - [`src/components/Board.tsx`](../src/components/Board.tsx) (~994 lignes, budget ≤ 300) : extraire les sous-composants SVG (flèches d'intention, surcouche de drag, barres).
   - [`src/features/knowledge/knowledgeBaseData.ts`](../src/features/knowledge/knowledgeBaseData.ts) (~1 587 lignes) : externaliser les données statiques en JSON.

### 🟡 P2 — Mise en Production Cloud (Supabase & Stripe Live)
1. **Application des migrations SQL Supabase (6 à 8)** sur l'instance de production (`supabase db push`) :
   - `20261023000000_shared_coach_explanations_cache.sql`
   - `20261024000000_glicko2_daily_puzzle_fsrs.sql`
   - `20261025000000_subscription_quotas_stripe.sql`
2. **Configuration des secrets Stripe Live** sur Vercel/Netlify :
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PRICE_COACH_MONTHLY`, `NEXT_PUBLIC_STRIPE_PRICE_COACH_ANNUAL`, `NEXT_PUBLIC_STRIPE_PRICE_CLUB_CHOUETTE`.
3. **Automatisation de l'alimentation quotidienne de `daily_puzzles`** : tâche planifiée (Cron / Edge Function) générant et certifiant de nouvelles positions Open Sage 3-ply au-delà du catalogue initial embarqué.
