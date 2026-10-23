# Refonte Front-End — Backgammon Pro (Style XG / TMG)

> **Feuille de route pour l'agent développeur.**
> Priorité n°1 : **L'ÉCRAN DE JEU** (plateau + HUD). Priorité n°2 : le LOBBY.
> Le backend, Supabase, le moteur et la logique du Coach sont **conservés tels quels**.

---

## 0. CE QUI EST CONSERVÉ (interdiction de modifier)

| Chemin | Raison |
|---|---|
| `src/engine/`, `src/lib/engine/` | Moteur de jeu |
| `src/features/` | Logique pure du Coach |
| `src/hooks/useBackgammonGame.ts`, `src/hooks/useCoach.ts` | Machines à états |
| `src/actions/` | Micro-programmes atomiques |
| `src/app/api/`, `supabase/` | Backend |
| `src/components/board/Board.tsx` | **Structure** SVG (on peut changer les couleurs/styles, pas la géométrie) |

---

## 1. DIAGNOSTIC VISUEL — POURQUOI C'EST MOCHE

### 1.1 Écran de jeu — défauts constatés

| # | Défaut | Localisation | Impact visuel |
|---|---|---|---|
| D1 | **Pions trop petits** : `clamp(16px, 4.5vw, 40px)` — sur un écran 1600 px, 4.5vw = 72 px mais plafonné à **40 px** | [`Checker.tsx:43-44`](src/components/board/Checker.tsx:43) | Pions ridicules sur grand écran, plateau vide |
| D2 | **Feutre plat** : un seul `radial-gradient` vert sans texture ni vignettage | [`Board.tsx:659`](src/components/board/Board.tsx:659) | Aspect « dessin vectoriel », pas de feutre réaliste |
| D3 | **Bordure bois simpliste** : `bg-gradient-to-b from-[#4a2a16] via-[#3a2010] to-[#2b170c]` sans veinage ni reflet | [`Board.tsx:593`](src/components/board/Board.tsx:593) | Effet « carton marron » |
| D4 | **Triangles sans relief** : deux dégradés plats (ivoire / bordeaux) | [`Board.tsx:152-159`](src/components/board/Board.tsx:152) | Pas de profondeur, pas d'ombre de séparation |
| D5 | **HUD trop chargé** : 4 zones denses sur `h-14`, cartes joueurs avec 4 lignes d'info | [`MatchHud.tsx:155`](src/components/hud/MatchHud.tsx:155) | Surcharge cognitive, aspect « tableau de bord » |
| D6 | **Bouton central criard** : `from-amber-400 to-amber-600` avec ombre orange saturée | [`BoardCenterControls.tsx:73`](src/components/board/BoardCenterControls.tsx:73) | Jure avec le reste, aspect « bouton web » |
| D7 | **Proportions** : plateau en `lg:col-span-8` mais `max-w-6xl` le bride | [`Board.tsx:589`](src/components/board/Board.tsx:589) | Espace perdu à droite, plateau pas assez imposant |
| D8 | **Barre centrale** : `bg-[#221108]` opaque, sans relief | [`Board.tsx:669`](src/components/board/Board.tsx:669) | Bloc marron plat au milieu |
| D9 | **Sabots de sortie** : simples rectangles pointillés | [`Board.tsx:560-570`](src/components/board/Board.tsx:560) | Aspect « placeholder » |
| D10 | **Aucune animation** : pas de transition sur les pions, pas de halo sur les coups jouables | Global | Interface figée, sans vie |

### 1.2 Lobby — défauts constatés

| # | Défaut | Localisation |
|---|---|---|
| L1 | Formulaire administratif : 3 fieldsets + 11 boutons + 5 modules | [`LobbyScreen.tsx:143-299`](src/components/lobby/LobbyScreen.tsx:143) |
| L2 | Titre petit (`text-2xl`) noyé dans un header | [`LobbyScreen.tsx:152`](src/components/lobby/LobbyScreen.tsx:152) |
| L3 | Aucune hiérarchie visuelle : tout a le même poids | Global |
| L4 | Fond vert sombre uniforme, sans profondeur | [`LobbyScreen.tsx:144`](src/components/lobby/LobbyScreen.tsx:144) |

---

## 2. PLAN DE REFONTE — ÉCRAN DE JEU (PRIORITÉ 1)

### PHASE A — Pions 3D réalistes

**Fichier :** `src/components/board/Checker.tsx` (84 lignes → ~140 lignes, reste < 300)

**Changements :**
1. **Taille** : remplacer `clamp(16px, 4.5vw, 40px)` par `clamp(22px, 3.2vw, 56px)` — pions jusqu'à 56 px sur grand écran.
2. **Relief 3D renforcé** :
   - Dégradé radial à 4 arrêts (haut-gauche lumineux → bas-droit sombre).
   - `box-shadow` à 3 couches : ombre portée externe + reflet interne haut + ombre interne bas.
   - Bordure fine avec reflet (`border: 1px solid rgba(255,255,255,0.35)`).
3. **Anneau central** : cercle intérieur avec dégradé inversé (effet « pion concave » Crisloid).
4. **Halo de jouabilité** : quand `isPlayable && isTopChecker`, ajouter `ring-2 ring-amber-300/70` + `animate-pulse` subtil.
5. **Badge numérique** : agrandir à `min-w-[20px] h-[20px] text-[11px]`, fond doré avec ombre.

**Contrainte :** ne pas changer l'API du composant (`color`, `countBadge`, `isPlayable`, `isTopChecker`).

---

### PHASE B — Feutre réaliste

**Fichier :** `src/components/board/Board.tsx` (zone feutre, ligne 659)

**Changements :**
1. **Texture feutre** : superposer 3 couches CSS :
   ```css
   background:
     radial-gradient(ellipse at 50% 40%, #1a6b47 0%, #0f4a30 45%, #072a1b 100%),
     repeating-linear-gradient(45deg, rgba(255,255,255,0.015) 0 2px, transparent 2px 4px);
   ```
2. **Vignettage** : `box-shadow: inset 0 0 120px rgba(0,0,0,0.55)` pour assombrir les bords.
3. **Reflet de lumière** : pseudo-élément `::before` avec `radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.08), transparent 60%)`.
4. **Ombre de séparation** entre le feutre et le bois : `border: 2px solid rgba(0,0,0,0.4)`.

**Contrainte :** ne pas toucher à la grille `grid-cols-[1fr_auto_1fr]` ni aux positions des points.

---

### PHASE C — Bordure bois verni

**Fichier :** `src/components/board/Board.tsx` (cadre, ligne 593)

**Changements :**
1. **Veinage** : `repeating-linear-gradient(90deg, rgba(0,0,0,0.06) 0 3px, transparent 3px 7px)` superposé au dégradé.
2. **Reflet vernis** : `linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 15%, transparent 85%, rgba(0,0,0,0.25) 100%)`.
3. **Bordure dorée** : `border: 1px solid rgba(212,175,55,0.35)` + `box-shadow: 0 20px 60px rgba(0,0,0,0.7)`.
4. **Coins arrondis** : `rounded-[28px]` (au lieu de `rounded-3xl`).

---

### PHASE D — Triangles avec relief

**Fichier :** `src/components/board/Board.tsx` (SVG des points, lignes 140-168)

**Changements :**
1. **Dégradé à 3 arrêts** par couleur :
   - Ivoire : `#faf3e3` → `#e8dcc0` → `#c9b896`
   - Bordeaux : `#9b1f2a` → `#6e1219` → `#3d070c`
2. **Ombre portée** : ajouter un `<polygon>` noir translucide décalé de 2 px sous chaque triangle.
3. **Liseré** : `stroke="rgba(255,255,255,0.12)"` + `strokeWidth="1"`.
4. **Séparation** : fine ligne verticale `rgba(0,0,0,0.25)` entre chaque point.

---

### PHASE E — HUD épuré

**Fichier :** `src/components/hud/MatchHud.tsx` (301 lignes → découper)

**Changements :**
1. **Hauteur** : `h-14` → `h-12` (plus fin).
2. **Fond** : `bg-slate-900/90 backdrop-blur-md` → `bg-black/40 backdrop-blur-xl border-b border-white/10` (translucide, sans bordure lourde).
3. **Cartes joueurs** : réduire à 2 lignes (nom + score), PR en badge compact à droite.
4. **Zone centrale** : garder dernier coup + dés, mais en `text-[10px]` discret.
5. **Zone droite** : videau + ⚙️ uniquement (bouton Doubler déplacé dans le menu).
6. **Découpage Loi 5** : extraire la zone droite dans `HudCubeControls.tsx` (~80 lignes).

---

### PHASE F — Bouton central raffiné

**Fichier :** `src/components/board/BoardCenterControls.tsx` (118 lignes)

**Changements :**
1. **Style** : remplacer le dégradé orange saturé par un bouton « verre dépoli » :
   ```
   bg-white/10 backdrop-blur-md border border-amber-300/40
   text-amber-100 shadow-[0_8px_32px_rgba(0,0,0,0.5)]
   hover:bg-white/15 hover:border-amber-300/70
   ```
2. **Taille** : `px-6 py-3 text-sm` (plus imposant, plus lisible).
3. **Animation** : `animate-pulse` très lent (`duration-[3s]`) sur le contour uniquement.
4. **Icône** : dé de 20 px à gauche du texte.

---

### PHASE G — Proportions du plateau

**Fichier :** `src/components/board/Board.tsx` (ligne 589) + `GameBoardArea.tsx`

**Changements :**
1. Supprimer `max-w-6xl` sur le conteneur du plateau (laisser la grille `lg:col-span-8` gérer).
2. Ajouter `aspect-[4/3]` ou `max-h-[calc(100dvh-6rem)]` pour un ratio stable.
3. Vérifier que le plateau occupe bien ~70 % de la largeur sur desktop.

---

### PHASE H — Animations & micro-interactions

**Nouveau fichier :** `src/components/board/boardAnimations.css` (ou classes Tailwind)

**Changements :**
1. **Pion jouable** : `transition-transform duration-150 hover:-translate-y-1`.
2. **Coup validé** : flash vert bref (`animate-[flash_300ms]`).
3. **Frappe** : secousse horizontale (`animate-[shake_200ms]`).
4. **Dés** : rotation à l'apparition (`animate-[roll_400ms]`).
5. **Respect `prefers-reduced-motion`** : déjà géré dans [`globals.css:31`](src/app/globals.css:31).

---

## 3. PLAN DE REFONTE — LOBBY (PRIORITÉ 2)

### PHASE I — Écran d'accueil épuré

**Fichier :** `src/components/lobby/LobbyScreen.tsx` (302 lignes → réécriture complète, ~200 lignes)

**Nouvelle structure :**
```
┌─────────────────────────────────────────┐
│                                         │
│           BACKGAMMON                    │  ← Titre 5xl, doré, centré
│      ─── Club Privé ───                 │  ← Sous-titre fin
│                                         │
│   ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│   │  🎲     │ │  🌐     │ │  🎯     │  │  ← 3 grandes cartes
│   │ Jouer   │ │ Multi-  │ │ Entraî- │  │
│   │ vs IA   │ │ joueur  │ │ nement  │  │
│   └─────────┘ └─────────┘ └─────────┘  │
│                                         │
│         [ ⚙️ Options ]                  │  ← Panneau repliable
│                                         │
│      ┌───────────────────────┐          │
│      │    JOUER              │          │  ← Bouton doré unique
│      └───────────────────────┘          │
└─────────────────────────────────────────┘
```

**Les 3 cartes (choix validé par l'utilisateur) :**

| Carte | Icône | Action | Cible |
|---|---|---|---|
| **Jouer contre l'IA** | 🎲 | Sélectionne le mode solo, ouvre le panneau Options (format + niveau + coach), puis `onStart({ matchLength, difficulty, coachEnabled })` | `handleLobbyStart` |
| **Multijoueur en ligne** | 🌐 | Appelle `onOpenModule('multiplayer')` → `modals.openMatchmaking()` | `handleOpenLobbyModule` |
| **Entraînement** | 🎯 | Ouvre un sous-menu avec 2 entrées : **Drills de Blunders** (`/drills`) et **Puzzles Quotidiens** (`/puzzles`) | `handleOpenLobbyModule` |

**Comportement de sélection :**
- Une seule carte active à la fois (`selectedMode: 'ai' | 'multiplayer' | 'training'`).
- Carte active : `border-amber-400/70 bg-amber-500/10 ring-1 ring-amber-400/40`.
- Carte inactive : `border-white/10 bg-white/5 hover:bg-white/10`.
- Le bouton **JOUER** est désactivé tant qu'aucune carte n'est sélectionnée.
- Pour `multiplayer` et `training`, le bouton JOUER déclenche l'action (pas de navigation directe au clic sur la carte).

**Changements :**
1. **Titre** : `text-5xl sm:text-7xl font-black tracking-tight` avec dégradé doré (`bg-clip-text text-transparent bg-gradient-to-b from-amber-200 to-amber-500`).
2. **3 cartes** : `grid grid-cols-1 sm:grid-cols-3 gap-4`, chaque carte `h-40 rounded-2xl border border-white/10 bg-white/5 backdrop-blur hover:bg-white/10 hover:border-amber-400/50 transition`.
3. **Panneau Options** : `<details>` natif ou état `useState`, contenant format + niveau + mode coach.
4. **Bouton JOUER** : `w-full max-w-md mx-auto py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 font-black text-lg`.
5. **Fond** : feutre sombre avec vignettage (même traitement que le plateau).

**Contrainte :** conserver les `data-testid` existants (`lobby-start-btn`, `lobby-format-*`, `lobby-opponent-*`, `lobby-mode-*`) pour ne pas casser les tests.

---

## 4. QCM DE VALIDATION — 50 QUESTIONS

> **Répondez OUI ou NON.** Un NON = une tâche à ajouter au plan.
> Les réponses ci-dessous reflètent l'état **actuel** du code, pas l'état souhaité.

### A. Écran de jeu — Plateau (Q1-Q12)

| # | Question | Réponse actuelle | Action si NON |
|---|---|---|---|
| 1 | Les pions font-ils au moins 50 px sur un écran 1600 px ? | **NON** (plafond 40 px) | Phase A |
| 2 | Le feutre a-t-il une texture (pas un simple dégradé) ? | **NON** | Phase B |
| 3 | Le feutre a-t-il un vignettage sur les bords ? | **NON** | Phase B |
| 4 | La bordure bois a-t-elle un veinage visible ? | **NON** | Phase C |
| 5 | La bordure bois a-t-elle un reflet vernis ? | **NON** | Phase C |
| 6 | Les triangles ont-ils un dégradé à 3 arrêts ? | **NON** (2 arrêts) | Phase D |
| 7 | Les triangles ont-ils une ombre portée ? | **NON** | Phase D |
| 8 | La barre centrale a-t-elle un relief ? | **NON** (fond plat) | Phase D |
| 9 | Les sabots de sortie sont-ils stylisés (pas des pointillés) ? | **NON** | Phase D |
| 10 | Le plateau occupe-t-il ~70 % de la largeur sur desktop ? | **NON** (`max-w-6xl` bride) | Phase G |
| 11 | Le plateau a-t-il un ratio stable (pas de déformation) ? | **NON** | Phase G |
| 12 | Les pions ont-ils un halo quand ils sont jouables ? | **NON** | Phase A |

### B. Écran de jeu — HUD (Q13-Q20)

| # | Question | Réponse actuelle | Action si NON |
|---|---|---|---|
| 13 | Le HUD fait-il moins de 56 px de haut ? | **NON** (`h-14` = 56 px) | Phase E |
| 14 | Le HUD est-il translucide (pas opaque) ? | **NON** (`bg-slate-900/90`) | Phase E |
| 15 | Les cartes joueurs tiennent-elles sur 2 lignes max ? | **NON** (4 lignes) | Phase E |
| 16 | Le bouton Doubler est-il dans le menu (pas dans le HUD) ? | **NON** | Phase E |
| 17 | Le HUD fait-il moins de 300 lignes ? | **NON** (301) | Phase E |
| 18 | Le HUD a-t-il une bordure inférieure fine (pas d'ombre lourde) ? | **NON** | Phase E |
| 19 | Le dernier coup est-il affiché discrètement (`text-[10px]`) ? | **NON** (`text-[11px]`) | Phase E |
| 20 | Le HUD est-il lisible sur mobile (pas de débordement) ? | **OUI** | — |

### C. Écran de jeu — Bouton central (Q21-Q25)

| # | Question | Réponse actuelle | Action si NON |
|---|---|---|---|
| 21 | Le bouton central est-il en « verre dépoli » (pas orange saturé) ? | **NON** | Phase F |
| 22 | Le bouton central fait-il au moins `px-6 py-3` ? | **NON** (`px-5 py-2.5`) | Phase F |
| 23 | Le bouton central a-t-il une animation subtile ? | **NON** | Phase F |
| 24 | Le bouton central a-t-il une icône dé ? | **OUI** (emoji 🎲) | — |
| 25 | Existe-t-il un seul bouton de lancer (pas de doublon) ? | **OUI** | — |

### D. Écran de jeu — Animations (Q26-Q30)

| # | Question | Réponse actuelle | Action si NON |
|---|---|---|---|
| 26 | Les pions ont-ils une transition au survol ? | **OUI** (`hover:-translate-y-1`) | — |
| 27 | Les coups validés ont-ils un flash visuel ? | **NON** | Phase H |
| 28 | Les frappes ont-elles une secousse ? | **NON** | Phase H |
| 29 | Les dés ont-ils une animation d'apparition ? | **NON** | Phase H |
| 30 | `prefers-reduced-motion` est-il respecté ? | **OUI** | — |

### E. Lobby (Q31-Q38)

| # | Question | Réponse actuelle | Action si NON |
|---|---|---|---|
| 31 | Le titre fait-il au moins `text-5xl` ? | **NON** (`text-2xl`) | Phase I |
| 32 | Y a-t-il 3 grandes cartes de choix (pas 11 boutons) ? | **NON** | Phase I |
| 33 | Les options avancées sont-elles repliées par défaut ? | **NON** | Phase I |
| 34 | Y a-t-il un seul bouton « JOUER » doré ? | **NON** (bouton « Démarrer le match ») | Phase I |
| 35 | Le fond du lobby a-t-il un vignettage ? | **NON** | Phase I |
| 36 | Les `data-testid` existants sont-ils conservés ? | **OUI** | — |
| 37 | Le lobby fait-il moins de 300 lignes ? | **NON** (302) | Phase I |
| 38 | Le lobby est-il SSR-safe (pas de `localStorage` au rendu) ? | **OUI** | — |

### F. Architecture & Loi 5 (Q39-Q45)

| # | Question | Réponse actuelle | Action si NON |
|---|---|---|---|
| 39 | `page.tsx` fait-il moins de 300 lignes ? | **NON** (331) | Extraire `useGameOrchestration` |
| 40 | `MatchHud.tsx` fait-il moins de 300 lignes ? | **NON** (301) | Phase E |
| 41 | `soundEngine.ts` fait-il moins de 300 lignes ? | **NON** (375) | Découper |
| 42 | `NewGameModal.tsx` est-il utilisé ? | **NON** (orphelin) | Supprimer |
| 43 | `MatchTurnBar.tsx` a-t-il un nom exact ? | **NON** (ne gère que le videau) | Renommer |
| 44 | Tous les composants `coach/` font-ils moins de 300 lignes ? | **OUI** | — |
| 45 | Tous les composants `summary/` font-ils moins de 250 lignes ? | **OUI** | — |

### G. Son & Accessibilité (Q46-Q50)

| # | Question | Réponse actuelle | Action si NON |
|---|---|---|---|
| 46 | Le son est-il contrôlable via le menu ⚙️ ? | **OUI** | — |
| 47 | L'état mute est-il persisté ? | **OUI** | — |
| 48 | Les effets bear-off et défaite existent-ils ? | **NON** | Ajouter |
| 49 | Un hook `useSound` SSR-safe existe-t-il ? | **NON** | Créer |
| 50 | Le contraste WCAG AA est-il vérifié sur les 4 thèmes ? | **NON** | Audit |

### Synthèse

| Catégorie | OUI | NON |
|---|---|---|
| A. Plateau | 0 | 12 |
| B. HUD | 1 | 7 |
| C. Bouton central | 2 | 3 |
| D. Animations | 2 | 3 |
| E. Lobby | 2 | 6 |
| F. Architecture | 2 | 5 |
| G. Son & A11y | 2 | 3 |
| **TOTAL** | **11** | **39** |

**39 points sur 50 sont NON conformes.** C'est cohérent avec votre constat : « c'est moche ».

---

## 5. ORDRE D'EXÉCUTION

```
Phase A (Pions 3D)        ← impact visuel maximal, 1 fichier
    ↓
Phase B (Feutre)          ← impact visuel fort, 1 zone
    ↓
Phase C (Bois verni)      ← impact visuel fort, 1 zone
    ↓
Phase D (Triangles)       ← impact visuel moyen, SVG
    ↓
Phase E (HUD épuré)       ← lisibilité, découpage Loi 5
    ↓
Phase F (Bouton central)  ← cohérence
    ↓
Phase G (Proportions)     ← layout
    ↓
Phase H (Animations)      ← finition
    ↓
Phase I (Lobby)           ← priorité 2
```

**Point de contrôle après chaque phase :** `npm run typecheck` + `npx vitest run src/components/board src/components/hud`.

---

## 6. CRITÈRES D'ACCEPTATION

- [ ] Pions ≥ 50 px sur écran 1600 px
- [ ] Feutre avec texture + vignettage
- [ ] Bois avec veinage + reflet
- [ ] Triangles avec dégradé 3 arrêts + ombre
- [ ] HUD ≤ 56 px, translucide, 2 lignes par joueur
- [ ] Bouton central en verre dépoli
- [ ] Plateau ~70 % de largeur
- [ ] Lobby : titre 5xl + 3 cartes + 1 bouton
- [ ] `npm run typecheck` → 0 erreur
- [ ] Tests 100 % verts
- [ ] Aucun fichier > 300 lignes hors sanctuaire
