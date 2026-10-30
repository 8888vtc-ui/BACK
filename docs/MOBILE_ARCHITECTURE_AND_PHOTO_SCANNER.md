# Spécification Technique — Architecture Mobile Compétitive & Scanner Photo de Tournoi

> **Statut** : ACTIF & VÉRIFIÉ (2026-10-29) — Référencé par [`PROJECT_MAP.md`](../PROJECT_MAP.md).
> Ce document consigne l'architecture géométrique et tactile déployée sur smartphone (`360×640 px` à `430×932 px`) ainsi que le pipeline de reconnaissance optique de positions de tournoi (**Photo → XGID + Éditeur Tactile Rapide**).

---

## 1. Géométrie Mobile Portrait-First : Grille « Zero-Margin » à `12,65` Colonnes & Ratio `1.15:1`

### 1.1 Résolution du Paradoxe Géométrique (`src/app/globals.css`, `BoardFrame.tsx`)
- **Mode Portrait (`max-width: 767px and orientation: portrait`)** :
  - Le conteneur `.board-adaptive-shell` occupe `width: 100vw`, `aspect-ratio: 1.15 / 1` (`375×326 px` sur iPhone SE, `390×339 px` sur iPhone 14/15) avec `2 px` de bordure externe (`4 px` au total).
  - La pile supérieure de 5 pions (`42,3 %`) + la pile inférieure de 5 pions (`42,3 %`) + la rivière centrale (`15,4 %`, `50–52 px`) éliminent toute déformation en « aiguilles fines » et libèrent `340 px` à `558 px` de hauteur pour le HUD, le Coach IA et la barre du pouce.
- **Mode Paysage (`max-height: 500px and orientation: landscape`)** :
  - `.board-adaptive-shell` adopte `height: calc(100dvh - 8px); width: auto; aspect-ratio: 1.18 / 1` avec contrôles latéraux en *Side-HUD*.

### 1.2 Répartition Horizontale (`BoardQuadrantRow.tsx`, `BoardCentralBar.tsx`, `Checker.tsx`)
- **Sabot de sortie contextuel (`BoardQuadrantRow.tsx`)** :
  - Sur mobile (`< sm`), la 14e colonne est repliée à `0 px` (`max-sm:w-0 max-sm:overflow-hidden`) tant qu'aucun pion n'est sorti ni éligible à la sortie, et s'ouvre contextuellement (`w-8` avec halo émeraude) dès qu'un pion peut sortir.
  - Le nombre de pions sortis est affiché en permanence dans [`HudScoreboard.tsx`](../src/components/hud/HudScoreboard.tsx) (`· X/15`).
- **Barre centrale à `0.65fr` (`BoardCentralBar.tsx`)** :
  - Largeur mobile fixée à `19 px` (`w-[19px] sm:w-14 md:w-20`), portant la largeur de chacune des 12 flèches entre **`28,1 px` et `33,7 px`**.
- **Diamètre des pions à `94 %` de la flèche (`Checker.tsx`, `BoardPointGhostChecker.tsx`)** :
  - `clamp(26.5px, min(7.4vw, calc((100dvh - 135px) / 11.2)), 46px)` (`27,6 px` sur iPhone SE, `28,7 px` sur iPhone 14/15).
  - **Empilement *Cap-at-5*** ([`boardGeometry.ts`](../src/components/board/boardGeometry.ts)) : maximum `5` disques physiques visibles par flèche (`MAX_VISIBLE = 5`) avec badge numérique sur l'apex dès `6` pions.

---

## 2. Machine à États Tactile « Zéro-Friction »

| Geste / Action | Implémentation | Fichier de référence |
|---|---|---|
| **Hitbox colonnaire intégrale** | Toute la largeur de la flèche × `50 %` de la hauteur du plateau capte le tap | [`BoardPoint.tsx`](../src/components/board/BoardPoint.tsx) |
| **1-Tap Smart Move** | Toucher une flèche source joue immédiatement le dé actif `d1` (ou `d2` si `d1` est bloqué) | [`usePlatformControlsRouter.ts`](../src/hooks/usePlatformControlsRouter.ts) |
| **Drag-and-Drop anti-*Fat-Finger*** | Décalage vertical de `-48 px` (`translateY(-48px) scale(1.22)`) au-dessus de la pulpe du doigt | [`DraggedCheckerOverlay.tsx`](../src/components/board/DraggedCheckerOverlay.tsx), [`useBoardDragAndDrop.ts`](../src/components/board/useBoardDragAndDrop.ts) |
| **Inversion des dés dans la rivière** | Toucher les dés **ou** la moitié opposée de la rivière (`river-swap-zone`) inverse `d1 ↔ d2` (`1→2 ⇄ 2→1`) | [`BoardDiceRiver.tsx`](../src/components/board/BoardDiceRiver.tsx) |

---

## 3. Architecture Viewport Portrait en 6 Bandes (`100dvh`) & Coach IA Non-Occlusif

1. **Verrouillage `100dvh` isolé au plateau de match** : la classe `.mobile-game-viewport-lock` ([`globals.css`](../src/app/globals.css)) est appliquée uniquement sur la vue `GAME` ([`src/app/page.tsx`](../src/app/page.tsx)), préservant le défilement naturel sur le Lobby et les pages secondaires.
2. **Bandeau Coach IA & Toggle 1-Tap des Flèches SVG** ([`MobilePortraitCoachBanner.tsx`](../src/components/coach/MobilePortraitCoachBanner.tsx)) :
   - Placé sous le plateau en mode Portrait (zéro superposition sur les flèches `1` à `12`).
   - Affiche le verdict (`Optimal`, `Imprécision`, `Blunder -0.XXX`), le bouton **`👁 Meilleur ↔ ↩ Mon Coup`** qui superpose les flèches vectorielles SVG sur le plateau, le bouton **`↩ Rejouer`** sur erreur, et ouvre le *Bottom Sheet* ([`CoachMobileDrawer.tsx`](../src/components/coach/CoachMobileDrawer.tsx)) au tap.

---

## 4. Reconnaissance Photo de Tournoi & Éditeur Tactile Rapide (« Tap-to-Adjust »)

Permet aux joueurs de tournoi de photographier une position réelle et de l'analyser en quelques secondes dans [`MatchImportExportModal.tsx`](../src/components/modals/MatchImportExportModal.tsx) (onglet **`📷 Photo / Éditeur`**) :

1. **Analyseur Pur & Validation Mathématique** ([`src/features/export/positionPhotoParser.ts`](../src/features/export/positionPhotoParser.ts)) :
   - Remappe les 24 flèches visuelles selon les 4 orientations possibles du jan intérieur (`bottom-right`, `bottom-left`, `top-right`, `top-left`).
   - Vérifie l'invariant des `15` pions par joueur (`countBoardCheckers`), signale toute pile haute (`≥ 6` pions) ou anomalie, et génère le `XGID` canonique via `serializeXGID`.
   - Respecte strictement la **Règle 2 de `GOVERNANCE.md` (Zéro donnée factice)** : renvoie un `Result<ScannedPositionResult, Error>` typé sans jamais inventer de position.
2. **Route API Multimodale** ([`src/app/api/scan-position/route.ts`](../src/app/api/scan-position/route.ts)) :
   - `POST /api/scan-position` protégé par *Rate Limiting* (`RATE_LIMIT_PROFILES.COACH`).
   - Interroge Gemini Vision avec schéma JSON déterministe ; si `GEMINI_API_KEY` est absente, retourne HTTP `503` (`VISION_API_UNCONFIGURED`) et invite à utiliser l'éditeur tactile.
3. **Interface Capture + Éditeur « Tap-to-Adjust »** ([`src/components/modals/PositionPhotoScannerTab.tsx`](../src/components/modals/PositionPhotoScannerTab.tsx)) :
   - Sélection photo / caméra (`capture="environment"`), choix de l'orientation du jan intérieur, et grille interactive de 24 flèches + barre centrale permettant d'ajouter/retirer des pions en **1 tap** (`⚪ +Blanc`, `⚫ +Noir`, `🧹 -1`), de régler les dés, le videau et le trait, puis de charger la position dans le moteur Open Sage + Coach IA.
