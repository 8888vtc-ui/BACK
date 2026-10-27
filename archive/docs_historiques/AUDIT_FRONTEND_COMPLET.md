# AUDIT QA TOTAL & ARCHITECTURE FRONT-END — Backgammon

> **STATUT : CORRECTIONS APPLIQUÉES** — Les constats ci-dessous ont été corrigés lors de la phase de réparation. Voir la section [« Journal des corrections appliquées »](#journal-des-corrections-appliquées) en fin de document.

**Type de mission initiale :** Audit en lecture seule (aucun fichier de code modifié).
**Méthode :** Inspection statique du code source (`read_file`, `search_files`) sur les zones désignées : hydratation SSR/CSR, doublons d'interface, race conditions du Coach IA, faisabilité du design « haut de gamme » et de l'audio.
**Verdict global :** l'architecture a déjà fait l'objet d'un refactor anti-hydratation partiel et documenté (commentaires « ANTI-HYDRATATION », tests de non-régression `page.hydration.test.tsx`), mais **des angles morts subsistent** : une page orpheline avec bug d'hydratation réel, des props et composants « fantômes » jamais nettoyés après le refactor, et une race condition non gardée dans le Coach IA.

---

## Sommaire des constats

| # | Zone | Fichier(s) clé(s) | Sévérité | Statut |
|---|------|--------------------|----------|--------|
| A1 | Hydratation — lecture `localStorage` dans un initialiseur `useState` lors du SSR | [`src/app/home/page.tsx`](src/app/home/page.tsx:34) | 🔴 Critique (bug réel) | Confirmé |
| A2 | Hydratation — pattern à risque identique (latent) | [`Board.tsx`](src/components/board/Board.tsx:340), [`PipCountBadge.tsx`](src/components/board/PipCountBadge.tsx:73) | 🟠 Majeur (latent) | Confirmé |
| A3 | Pattern anti-hydratation correct (référence) | [`MatchHud.tsx`](src/components/hud/MatchHud.tsx:104) | ✅ Bonne pratique | Confirmé |
| B1 | Modale fantôme jamais montée (code mort) | [`NewGameModal.tsx`](src/components/hud/NewGameModal.tsx:58) | 🟡 Mineur (dette) | Confirmé |
| B2 | Bandeau Roll-off fantôme jamais monté (code mort) | [`RollOffDice.tsx`](src/components/board/RollOffDice.tsx:27) | 🟡 Mineur (dette) | Confirmé |
| B3 | Props mortes traversant 3 couches (`rollOff`, `rollOffDone`, `onRollOff`, `onStartNewMatch`, `onToggleOrientation`) | [`page.tsx`](src/app/page.tsx:316), [`GameScreenView.tsx`](src/components/board/GameScreenView.tsx:149), [`MatchHeader.tsx`](src/components/hud/MatchHeader.tsx:67) | 🟡 Mineur (dette) | Confirmé |
| B4 | Deuxième écran d'accueil concurrent et orphelin | [`src/app/home/page.tsx`](src/app/home/page.tsx:33) vs [`LobbyScreen.tsx`](src/components/lobby/LobbyScreen.tsx:66) | 🟠 Majeur (confusion produit) | Confirmé |
| C1 | Race condition Coach IA — aucune annulation de requête périmée | [`useCoach.ts`](src/hooks/useCoach.ts:186-380) | 🔴 Critique | Confirmé |
| C2 | Double autorité de remise à zéro du Coach (2 `useEffect` concurrents) | [`useCoach.ts`](src/hooks/useCoach.ts:166-181) | 🟠 Majeur | Confirmé |
| D1 | Rendu des pions en CSS `box-shadow` (pas de `<filter>` SVG) | [`Checker.tsx`](src/components/board/Checker.tsx:41-73) | 🟢 Info (faisabilité) | Confirmé |
| D2 | Duplication de la constante `MAX_VISIBLE` (2 sources de vérité) | [`Board.tsx`](src/components/board/Board.tsx:41), [`boardGeometry.ts`](src/components/board/boardGeometry.ts:73) | 🟡 Mineur | Confirmé |
| D3 | Moteur audio procédural déjà robuste et extensible | [`soundEngine.ts`](src/lib/sound/soundEngine.ts:12-58) | ✅ Bonne base | Confirmé |

---

## A. Erreur d'hydratation (Next.js SSR vs CSR)

### A1 — Bug confirmé : `src/app/home/page.tsx`

```tsx
// src/app/home/page.tsx (lignes 33-36)
export default function HomePage() {
    const [showOnboarding, setShowOnboarding] = useState(() => !hasSeenOnboarding());
    const [matchFormat, setMatchFormat] = useState<MatchFormat>(() => readStoredMatchFormat());
    const [playerColor, setPlayerColor] = useState<Player>(() => readStoredPlayerColor());
```

Les trois initialiseurs paresseux de [`useState()`](src/app/home/page.tsx:34) s'exécutent **pendant le rendu**, aussi bien côté serveur (Next.js SSR) que côté client lors de l'hydratation. Or :
- Côté serveur, `hasSeenOnboarding()`, [`readStoredMatchFormat()`](src/components/hud/MatchFormatSelector.tsx:40) et `readStoredPlayerColor()` n'ont pas accès à `localStorage` → elles retournent leurs valeurs par défaut.
- Côté client, au premier rendu (qui DOIT être identique au HTML servi pour que React puisse hydrater sans erreur), ces mêmes fonctions lisent le `localStorage` réel du navigateur.

**Si l'utilisateur a déjà une préférence enregistrée** (`matchFormat !== 7`, `playerColor !== 'X'`, onboarding déjà vu), le HTML généré au premier rendu client diffère de celui du serveur → `Hydration failed because the initial UI does not match what was rendered on the server`. C'est un bug d'hydratation **réel et reproductible**, pas seulement théorique.

C'est exactement le même anti-pattern que les commentaires « ANTI-HYDRATATION » présents ailleurs dans le code (ex. [`MatchHud.tsx`](src/components/hud/MatchHud.tsx:102)) ont pour but d'éviter — mais il n'a pas été appliqué sur cette page.

### A2 — Pattern à risque latent : `Board.tsx` et `PipCountBadge.tsx`

```tsx
// src/components/board/Board.tsx (lignes 339-342)
const [orientation, setOrientation] = useState<BoardOrientation>(() =>
    getSavedOrientation('normal'),
);
```

[`getSavedOrientation()`](src/components/board/boardOrientation.ts:58) lit directement `localStorage.getItem(...)` dans l'initialiseur paresseux. Même anomalie dans [`PipCountBadge.tsx`](src/components/board/PipCountBadge.tsx:73) avec `getSavedPipCountVisibility(true)`.

**Pourquoi ce n'est pas (encore) le bug visible en production :** `Board` et `PipCountBadge` ne sont montés qu'après la bascule `appScreen === 'GAME'` dans [`page.tsx`](src/app/page.tsx:56), elle-même déclenchée par un clic utilisateur (jamais par le rendu SSR initial, qui est toujours `'LOBBY'`). Le premier montage de `Board` se produit donc **après** l'hydratation complète de la page `/`, hors du contrôle de React en mode « reconciliation serveur ↔ client ».

**Pourquoi c'est tout de même un risque réel à documenter :**
1. Toute évolution future (deep-link direct vers la vue GAME, SSR partiel, route dédiée `/play`, restauration de session *avant* le premier paint) réintroduirait l'erreur immédiatement.
2. C'est une incohérence avec le pattern de référence déjà en place ailleurs dans le même fichier (`soundEngine.isMute()` synchronisé via `useEffect`), ce qui complique la maintenance et la revue de code : deux conventions cohabitent pour le même problème.

### A3 — Bon pattern de référence (à généraliser)

```tsx
// src/components/hud/MatchHud.tsx (lignes 101-108)
const [isMuted, setIsMuted] = useState(false); // valeur identique SSR/CSR

useEffect(() => {
    setIsMuted(soundEngine.isMute()); // synchronisation APRÈS montage
}, []);
```

C'est le seul endroit où le pattern anti-hydratation est appliqué correctement avec une justification explicite en commentaire. **Recommandation :** c'est ce pattern — état initial constant + synchronisation dans `useEffect` — qui doit remplacer les lectures directes de `localStorage` dans les initialiseurs `useState` identifiées en A1/A2.

### Vérifications complémentaires effectuées

- [`useBackgammonGame.ts`](src/hooks/useBackgammonGame.ts:200-201) : l'état initial du jeu provient de `createInitialState(matchLength)`, une fonction pure sans `Date.now()` ni `Math.random()` ni accès `localStorage` → **aucun risque d'hydratation sur le moteur de jeu lui-même**. Les seuls `Date.now()` / `Math.random()` trouvés dans ce fichier interviennent dans des actions dispatchées après interaction utilisateur (lancer de dés, horodatage d'événements télémétrie), jamais dans le calcul de l'état initial.
- [`useGamePersistence.ts`](src/hooks/useGamePersistence.ts:44-45) : l'identifiant de partie (`Date.now()` + `Math.random()`) est généré dans un `useEffect`, donc après montage — safe.
- [`useMultiplayerGame.ts`](src/hooks/useMultiplayerGame.ts:101-104) : lecture de `bg_guest_id` protégée par `typeof window !== 'undefined'` — à vérifier si elle intervient dans un `useState` lazy ou un `useEffect` (non déterminant ici car le multijoueur n'est jamais actif au premier rendu).
- [`useCoachPreferences.ts`](src/components/coach/useCoachPreferences.ts:69-90) : **même anti-pattern** qu'en A2 (lecture `localStorage`/`navigator.onLine` dans 3 initialiseurs `useState` paresseux), mais `CoachPanel` n'est monté qu'en vue GAME — même raisonnement de risque latent que A2.

---

## B. Conflits d'interface et doublons

### B1/B2 — Composants fantômes : code mort, jamais rendu

Recherche exhaustive de `<NewGameModal` et `<RollOffDice` dans tout `src/` : **zéro résultat**. Ces deux composants existent, sont testés unitairement, mais ne sont **jamais montés** dans l'arbre React actuel :

- [`NewGameModal.tsx`](src/components/hud/NewGameModal.tsx:58) : seul son **type** `NewGameSelection` est importé (par [`page.tsx`](src/app/page.tsx:27) et [`MatchHeader.tsx`](src/components/hud/MatchHeader.tsx:28)) ; le composant React lui-même n'apparaît dans aucun JSX.
- [`RollOffDice.tsx`](src/components/board/RollOffDice.tsx:27) : idem, uniquement référencé dans son propre fichier de test.

**Conclusion :** contrairement à l'hypothèse initiale de la mission (« l'ancienne modale apparaît encore et se superpose »), ces éléments **ne se superposent plus visuellement** dans l'état actuel du code — un refactor antérieur les a déjà débranchés du rendu, et un test de non-régression ([`page.hydration.test.tsx`](src/app/page.hydration.test.tsx:41-54)) vérifie explicitement leur absence du HTML produit par `LobbyView`. **Le symptôme utilisateur rapporté provient donc soit d'une version antérieure/un cache de build, soit des « props fantômes » décrites en B3 qui témoignent d'un refactor inachevé.**

### B3 — Props mortes : la tuyauterie du Roll-off et du « Nouvelle Partie » existe encore

Le flux de données suivant est **intégralement câblé** de bout en bout, alors que rien ne l'affiche :

```
useMatchBootstrap() → { rollOff, rollOffDone, handleRollOff }
  → page.tsx (lignes 88, 316-318)
    → GameScreenView (props rollOffDone, rollOff, onRollOff — lignes 64-66)
      → MatchHeader (props rollOffDone, rollOff — lignes 44-50)
        → MatchHeaderComponent : props déclarées dans l'interface MAIS
          jamais déstructurées dans la signature de la fonction (lignes 67-81)
          → DONC rollOffDone / rollOff / onRollOff / onStartNewMatch
             sont calculés, transmis... puis silencieusement ignorés.
```

Même diagnostic pour `onToggleOrientation` : [`MatchHeaderProps`](src/components/hud/MatchHeader.tsx:63-64) déclare la prop, mais [`GameScreenView.tsx`](src/components/board/GameScreenView.tsx:140-158) ne la transmet même pas à `<MatchHeader>` — l'orientation est en réalité gérée localement et correctement dans [`Board.tsx`](src/components/board/Board.tsx:350-356) via son propre état + `localStorage`.

**Impact :** ce n'est pas un bug visuel actif, mais une **dette de refactor non finalisée** : un développeur lisant `MatchHeaderProps` croira à tort que `MatchHeader` affiche encore un Roll-off ou propose `NewGameModal`, ce qui explique très probablement la confusion à l'origine de cette mission d'audit. C'est le signal typique d'un renommage/déplacement de fonctionnalité (vers `MatchHud` + `BoardCenterControls`) où l'ancien contrat d'interface (`props`) n'a pas été nettoyé.

### B4 — Deuxième écran d'accueil concurrent : `/home` vs `LobbyScreen`

[`src/app/home/page.tsx`](src/app/home/page.tsx:33) est une **route Next.js indépendante** (`/home`) qui réimplémente — avec un design différent et plus sommaire — une bonne partie des responsabilités de [`LobbyScreen.tsx`](src/components/lobby/LobbyScreen.tsx:66) (choix du format de match, choix du mode, bouton de lancement, onboarding) :

| Aspect | `/` → `LobbyScreen.tsx` | `/home` → `HomePage` |
|---|---|---|
| Sélection du format | ✅ (cartes + panneau Options) | ✅ (`MatchFormatSelector`) |
| Sélection du niveau IA | ✅ | ❌ absent |
| Sélection de la couleur | ❌ absent | ✅ (`ColorSelector`) |
| Lancement de la partie | `onStart()` → moteur de jeu réel | `<Link href="/">` (ne transmet AUCUNE sélection au moteur !) |
| Bug d'hydratation | Non (préférences lues en `useEffect`, ligne 82-84) | **Oui (A1)** |

Recherche de liens entrants (`href="/home"`, `router.push('/home')`) dans tout `src/` : **aucun résultat**. Cette page est donc **orpheline** — inatteignable depuis le parcours utilisateur normal, mais toujours déployée et accessible par URL directe, avec un bug d'hydratation actif et une UX non connectée au vrai moteur de jeu (le bouton « ▶ Jouer » navigue vers `/` sans transmettre `matchFormat`/`playerColor` choisis). C'est un candidat évident à la suppression ou à la fusion avec `LobbyScreen`.

---

## C. Désynchronisation du Coach IA (Race Conditions)

### C1 — Aucune annulation des analyses asynchrones périmées

```ts
// src/hooks/useCoach.ts (lignes 186-380)
useEffect(() => {
    const log = game.matchLog ?? [];
    if (log.length === 0) return;
    const lastEntry = log[log.length - 1];
    if (lastEntry.player !== 'X') return;
    if (lastPlayerEvalRef.current === String(lastEntry.turnIndex)) return;
    lastPlayerEvalRef.current = String(lastEntry.turnIndex);

    void (async () => {
        const result = await analyzeHumanMoveFromLogWithBgsage({ ... }); // appel réseau potentiellement lent
        // ... 150 lignes plus loin ...
        setCoach({ ... });          // ligne ~344
        setCoachHighlight({ ... }); // ligne ~366
    })();
}, [game.matchLog, game.state, onCoachTriggered, notificationLevel]);
```

Ce `useEffect` **ne retourne aucune fonction de nettoyage** (`return () => { ... }`) et **n'utilise aucun `AbortController`**. La seule protection, `lastPlayerEvalRef`, empêche seulement de **redéclencher** une analyse pour un même `turnIndex` — elle ne protège pas contre l'**ordre d'arrivée** des réponses :

**Scénario de désynchronisation reproductible :**
1. Tour N : le joueur joue un coup → `matchLog` grandit → l'effet se déclenche → appel réseau A vers `analyzeHumanMoveFromLogWithBgsage` (lent, ex. 2 s).
2. Avant que A ne réponde, le joueur relance les dés pour le tour N+1 (ou l'IA joue et rend la main) → `game.matchLog` change à nouveau → l'effet se redéclenche → appel réseau B est lancé (rapide, répond en 300 ms).
3. B répond en premier → `setCoach(résultat du tour N+1)` s'affiche.
4. A répond ensuite (réseau plus lent) → **`setCoach(résultat du tour N)` écrase l'affichage courant** avec une analyse **périmée**, visuellement décorrélée du `currentTurn` / `matchLog` réels au moment de l'affichage.

C'est exactement le symptôme décrit dans le périmètre de la mission : *« l'analyse affichée est décalée, un état périmé est conservé en mémoire »*. **Correctif de principe (à ne pas implémenter dans cette mission) :** ajouter un identifiant de requête (ex. `requestId = log.length` ou `lastEntry.turnIndex`) capturé avant l'`await`, puis vérifier après résolution que `lastPlayerEvalRef.current` (ou un ref dédié) correspond toujours à ce même identifiant avant d'appeler `setCoach`/`setCoachHighlight` ; sinon, ignorer silencieusement la réponse périmée.

### C2 — Deux autorités concurrentes de remise à zéro du Coach

Deux `useEffect` séparés réinitialisent `coach`/`coachHighlight` à `null`, avec des conditions de déclenchement différentes :

```ts
// Effet #1 — nouvelle manche/partie (lignes 166-172)
useEffect(() => {
    if (game.moveHistory && game.moveHistory.length === 0 && currentTurnMovesRef.current.length === 0) {
        setCoach(null);
        setCoachHighlight(null);
    }
}, [game.moveHistory, currentTurnMovesRef]);

// Effet #2 — dès que X relance les dés (lignes 176-181)
useEffect(() => {
    if (game.state.turn === 'X' && game.dice !== null) {
        setCoach(null);
        setCoachHighlight(null);
    }
}, [game.state.turn, game.dice]);
```

Combinés à l'absence de garde décrite en C1, ces deux effets de purge peuvent s'intercaler **entre le déclenchement et la résolution** de l'analyse asynchrone de l'effet #3, créant une fenêtre où `setCoach(null)` (purge légitime du nouveau tour) est immédiatement suivi par `setCoach(résultat périmé)` (réponse tardive de l'ancien tour) — ce qui **réaffiche** une analyse que le code avait pourtant correctement effacée. C'est la cause racine la plus probable du symptôme « panneau qui réapparaît alors qu'il avait disparu ».

---

## D. Faisabilité du design « haut de gamme » & Audio

### D1 — Pions (`Checker.tsx`) : rendu CSS pur, pas de `<filter>` SVG

[`Checker.tsx`](src/components/board/Checker.tsx:41-73) simule le relief 3D entièrement via `box-shadow` + `radial-gradient` en CSS inline (pas de SVG, pas de `<filter>` `feDropShadow`/`feGaussianBlur`). Le plateau lui-même ([`Board.tsx`](src/components/board/Board.tsx:148-183)) utilise du SVG uniquement pour les triangles (`<polygon>` + `<linearGradient>`), pas pour les pions.

**Implication pour l'intégration future de filtres SVG (ombres portées 3D, textures) :**
- **Compatible sans casser l'existant** : il est possible d'ajouter des filtres SVG en parallèle (ex. un calque `<svg>` superposé avec `feDropShadow` pour l'ombre portée des pions) sans toucher à la logique de positionnement, car `Checker.tsx` est un composant 100 % de présentation, isolé, sans dépendance au calcul de géométrie.
- **Mais une ombre portée SVG réaliste sous un pion HTML/CSS est structurellement limitée** : les filtres SVG s'appliquent à du contenu SVG, pas directement à des `<div>`. Deux voies possibles : (a) convertir `Checker.tsx` en SVG natif (`<circle>`/`<g>`) pour bénéficier nativement de `<filter>`, ou (b) conserver le CSS et utiliser `filter: drop-shadow(...)` (CSS, pas SVG) qui offre un résultat visuel proche sans migration de composant. **Aucune des deux options ne nécessite de modifier `boardGeometry.ts`**, qui ne gère que des coordonnées/tailles (`CHECKER_D`, `CHECKER_R`, `POINT_W`...) totalement découplées du rendu visuel.

### D2 — Duplication de constantes entre `Board.tsx` et `boardGeometry.ts`

```ts
// src/components/board/Board.tsx (ligne 41)
const MAX_VISIBLE = 5; // pile plafonnée à 5 pions + badge

// src/components/board/boardGeometry.ts (ligne 73)
export const MAX_VISIBLE = 5; // règle des 5 pions visibles + badge
```

La même règle métier (« 5 pions visibles maximum par flèche ») est codée **deux fois**, dans deux modules différents, sans que l'un n'importe l'autre. `Board.tsx` utilise sa propre constante locale au lieu de celle, pourtant déjà exportée et documentée comme source de vérité, de [`boardGeometry.ts`](src/components/board/boardGeometry.ts:73). Aucun impact visuel aujourd'hui (les deux valeurs sont identiques), mais c'est un risque de **dérive silencieuse** : une future évolution (ex. passage à 6 pions visibles sur grand écran) ne modifiera qu'une des deux constantes si le développeur ne connaît pas l'existence de l'autre, recréant une incohérence visuelle plateau/pile. **Recommandation :** faire importer `MAX_VISIBLE` depuis `boardGeometry.ts` dans `Board.tsx` et supprimer la redéfinition locale.

### D3 — Moteur audio procédural (`soundEngine.ts`) : base déjà solide et extensible

[`BackgammonSoundEngine`](src/lib/sound/soundEngine.ts:12-58) est un singleton Web Audio 100 % procédural (aucun asset `.mp3`/`.wav` à charger), avec :
- lecture/écriture `localStorage` déjà protégées par `typeof window !== 'undefined'` (lignes 18-27, 50-56) — pattern SSR-safe correct, à prendre en modèle pour les corrections de la section A ;
- une méthode par effet sonore (`playDiceRoll()`, et par extension `playCubeOffer()`, `playVictory()`, `playBlunderAlert()` déjà utilisées ailleurs dans le code via `soundEngine.play...()`) ;
- synthèse par oscillateurs + bruit filtré (`createNoiseBuffer`), ce qui rend l'ajout de **nouveaux effets sonores** (ex. claquement de pion sur point, fanfare de double, ambiance de club) possible **sans dépendance externe ni fichier audio à héberger** — seulement l'ajout de nouvelles méthodes suivant le même gabarit (oscillateur + `GainNode` + enveloppe ADSR simplifiée).

**Point de vigilance pour l'intégration future :** la méthode `getContext()` crée le contexte audio au premier appel ; sur mobile (Safari/iOS en particulier), un `AudioContext` ne peut être démarré qu'à la suite d'un geste utilisateur direct (clic/tap). Les points d'appel actuels (`onRollDice`, `onDoubleCube`, etc. dans [`MatchHud.tsx`](src/components/hud/MatchHud.tsx:1)) sont bien déclenchés par des clics, donc déjà conformes à cette contrainte — à reproduire pour tout nouvel effet sonore ajouté.

---

## Synthèse des causes racines probables des symptômes rapportés

| Symptôme rapporté dans la mission | Cause racine identifiée |
|---|---|
| « Erreur d'hydratation au premier rendu » | A1 — `src/app/home/page.tsx` lit `localStorage` dans 3 initialiseurs `useState` paresseux, exécutés pendant le rendu SSR et le premier rendu client |
| « L'ancienne modale `NewGameModal` / le bandeau Tirage au sort apparaissent encore et se superposent » | B1-B3 — Les composants ne sont plus montés, mais leurs **props sont encore câblées de bout en bout** jusqu'à `MatchHeader` sans y être consommées ; probable confusion avec une version antérieure du build, ou avec la page orpheline `/home` (B4) qui, elle, reste accessible |
| « L'analyse du Coach est décalée / état périmé conservé en mémoire » | C1-C2 — Aucune annulation (`AbortController` / ref de séquence) des appels asynchrones de `analyzeHumanMoveFromLogWithBgsage` dans `useCoach.ts` ; une réponse réseau lente d'un tour antérieur peut écraser l'affichage d'un tour plus récent |

---

## Recommandations (non implémentées — à planifier dans une mission de correction séparée)

1. **A1 (critique)** : refondre `src/app/home/page.tsx` selon le pattern de référence A3 (état initial constant + synchronisation `localStorage` dans `useEffect`), ou supprimer purement cette route orpheline (voir B4) si elle est remplacée par `LobbyScreen`.
2. **A2** : appliquer le même correctif à [`Board.tsx`](src/components/board/Board.tsx:340) (`orientation`) et [`PipCountBadge.tsx`](src/components/board/PipCountBadge.tsx:73) (`visible`) par cohérence et prévention des régressions futures, même si le risque n'est pas actif aujourd'hui.
3. **B4** : décider explicitement du sort de `/home` — suppression recommandée (code mort orphelin, UX non connectée au moteur réel, bug d'hydratation actif) ou fusion de ses fonctionnalités utiles (sélecteur de couleur) dans `LobbyScreen.tsx`.
4. **B3** : nettoyer les props mortes (`rollOff`, `rollOffDone`, `onRollOff`, `onStartNewMatch`, `onToggleOrientation`) de `MatchHeaderProps`, `GameScreenViewProps` et de leurs appels dans `page.tsx`, pour que le contrat d'interface reflète fidèlement ce qui est réellement rendu.
5. **C1 (critique)** : introduire un garde de péremption (ref de séquence comparée après `await`, ou `AbortController`) dans l'effet d'analyse log-driven de `useCoach.ts`, avant tout appel à `setCoach`/`setCoachHighlight`.
6. **C2** : consolider les deux `useEffect` de purge (166-181) en une seule source d'autorité, ou documenter explicitement leur non-chevauchement voulu avec des tests de régression dédiés.
7. **D2** : faire pointer `Board.tsx` vers l'unique constante `MAX_VISIBLE` exportée par `boardGeometry.ts`.
8. **D1/D3** : aucune action bloquante — la base (géométrie pure, moteur audio procédural, `Checker.tsx` isolé) est saine et prête à accueillir les évolutions « haut de gamme » décrites dans le périmètre de la mission.

---

## Journal des corrections appliquées

| # | Constat | Action réalisée | Fichier(s) |
|---|---------|-----------------|------------|
| C1 | Race condition Coach IA | Ajout de `analysisRequestIdRef` (compteur de séquence) + helper `isStale()` ; toute réponse asynchrone périmée est ignorée avant `setCoach`/`setCoachHighlight`/`setLastMoveFeedback` | [`useCoach.ts`](src/hooks/useCoach.ts:157) |
| C2 | Double autorité de purge | Les deux `useEffect` de purge incrémentent désormais `analysisRequestIdRef`, invalidant les analyses en vol (fin du « panneau fantôme ») | [`useCoach.ts`](src/hooks/useCoach.ts:165) |
| A1/B4 | Hydratation + route orpheline | Suppression complète de `src/app/home/page.tsx` (route inatteignable, UX non connectée au moteur, bug d'hydratation actif) | `src/app/home/` (supprimé) |
| A2 | Hydratation `Board.tsx` | `orientation` initialisé à `'normal'` (constant SSR/CSR) puis synchronisé depuis `localStorage` dans un `useEffect` | [`Board.tsx`](src/components/board/Board.tsx:339) |
| A2 | Hydratation `PipCountBadge.tsx` | `visible` initialisé à `true` puis synchronisé dans un `useEffect` | [`PipCountBadge.tsx`](src/components/board/PipCountBadge.tsx:72) |
| A2bis | Hydratation `useCoachPreferences.ts` | Les 3 `useState` paresseux remplacés par des constantes + un `useEffect` de synchronisation post-montage | [`useCoachPreferences.ts`](src/components/coach/useCoachPreferences.ts:69) |
| B1/B2 | Code mort | Suppression de `NewGameModal.tsx`, `RollOffDice.tsx` et `RollOffDice.test.tsx` | `src/components/hud/`, `src/components/board/` |
| B3 | Props mortes | Retrait de `rollOff`, `rollOffDone`, `onRollOff`, `onStartNewMatch`, `onToggleOrientation`, `isMatchStarted` de `MatchHeaderProps`, `MatchHudProps`, `GameScreenViewProps` et de leurs appels dans `page.tsx` | [`MatchHeader.tsx`](src/components/hud/MatchHeader.tsx:35), [`MatchHud.tsx`](src/components/hud/MatchHud.tsx:31), [`GameScreenView.tsx`](src/components/board/GameScreenView.tsx:23), [`page.tsx`](src/app/page.tsx:1) |
| D2 | Duplication `MAX_VISIBLE` | `Board.tsx` importe désormais `MAX_VISIBLE` depuis `boardGeometry.ts` ; redéfinition locale supprimée | [`Board.tsx`](src/components/board/Board.tsx:19) |
| — | Tests corrompus (préexistants) | Réparation de 3 fichiers de test dont la première ligne était corrompue (`LE import`, ` DES REMARAUE//`, `OK//`) | `CoachArrows.test.ts`, `useBoardTheme.test.tsx`, `GameReviewCourse.test.tsx` |

### Validation

- **Typecheck** : `npx tsc --noEmit` → **0 erreur**.
- **Tests unitaires** : `npx vitest run` → **144 fichiers / 822 tests, 100 % de succès**.
- **Build production** : `npx next build` → **compilation réussie**.
