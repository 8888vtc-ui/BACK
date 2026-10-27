# Architecture UI/UX et Ingénierie Front-End pour le Backgammon Compétitif sur Web Mobile et PWA

## 1. Contexte & Problématique Géométrique

La conception d'une application web de Backgammon compétitif intégrant l'analyse par intelligence artificielle (calcul d'équité, Performance Rating ou PR), un chronomètre de tournoi et un plateau interactif se heurte sur smartphone à un paradoxe géométrique et cognitif majeur.

Contrairement aux échecs dont la grille carrée de $8 \times 8$ s'intègre naturellement dans la largeur d'un écran tenu verticalement, le tablier de Backgammon présente une topologie intrinsèquement panoramique composée de 4 quadrants de 6 flèches (24 points), séparés par une barre centrale (*the bar*) et flanqués de cours de sortie (*bear-off trays*).

L'analyse des standards de l'industrie (Backgammon Galaxy 2025/2026, Board Game Arena, Backgammon Studio Heroes, Lichess) impose **trois ruptures architecturales** :
1. **Géométrie Portrait-First adaptée à l'utilisation à une main (*one-handed UX*)** : suppression du drag-and-drop au profit du *Tap-to-Move*.
2. **Désencombrement radical par divulgation progressive (*Progressive Disclosure*)** : sanctuarisation de **85 % du viewport pour la zone de jeu pure**.
3. **Verrouillage du moteur de rendu mobile** : CSS `100dvh`, Safe Areas, `touch-action: none` pour éliminer les instabilités du navigateur et les crashs de mémoire WebKit iOS.

---

## 2. Géométrie du Plateau et Ergonomie Tactile : Portrait vs Paysage

### Comparatif d'Orientation

| Paramètre Ergonomique | Mode Portrait (Vertical - Standard Mobile) | Mode Paysage (Horizontal - Standard Tournoi/Tablette) |
| :--- | :--- | :--- |
| **Prise en main et posture** | Utilisation à une main (*One-handed thumb zone*), idéale en mobilité (>80% des sessions). | Utilisation à deux mains obligatoire, fatigante sur sessions longues. |
| **Continuité de navigation** | Transition fluide entre lobby, jeu et analyse post-partie. | Rupture cinétique si les menus ou claviers forcent la rotation. |
| **Hauteur du plateau** | Compression verticale équivalente à 8,5 - 9 pions avec empilement condensé. | Ratio de tournoi natif de 11 pions de haut (5 haut + 1 écart + 5 bas). |
| **Largeur des flèches** | Étroite ($\approx 26-28\text{ px}$ sur écran de $390\text{ px}$), exigeant des zones de tap étendues. | Large ($\approx 48-55\text{ px}$), permettant un contact direct sur chaque pion. |
| **Dés et Videau** | Intégrés dans la gouttière centrale ou barre d'action du pouce. | Positionnés sur les moitiés gauche/droite et sur la barre centrale. |

### Budget Spatial & Compression Géométrique en Mode Portrait

Sur un smartphone standard de $390\text{ px}$ de large :
- **Cour de sortie latérale (Bear-off & Videau)** : $32\text{ px}$ à $34\text{ px}$
- **Barre centrale (The Bar)** : $26\text{ px}$ à $28\text{ px}$
- **12 colonnes de flèches** : $330\text{ px}$ restants, soit exactement **$27,5\text{ px}$ par flèche**.

#### Empilement Condensé « Cap-at-5 » avec Badge Numérique
Pour éviter que les piles de plus de 5 pions ne débordent sur la gouttière centrale et n'écrasent les dés :
- Le moteur de rendu fige visuellement la pile à un **maximum de 5 pions visibles** (avec chevauchement vertical de 15% à 20%).
- Dès qu'une flèche compte $\ge 6$ pions (jusqu'à 15), le 5ᵉ pion (le plus proche du centre) reçoit un **badge typographique à fort contraste** (`font-weight: 700`, `tabular-nums`) affichant la cardinalité exacte (`6`, `7`, ..., `15`).

---

## 3. Ergonomie Tactile : Remplacement du Drag-and-Drop par le Tap-to-Move

Sur une colonne de $27,5\text{ px}$, le glisser-déposer (*drag-and-drop*) provoque une occlusion totale par la pulpe du pouce (*fat-finger occlusion*) et génère des erreurs de saisie en cadence rapide.

### Spécifications de l'Interaction Tactile
1. **Cibles Tactiles Unifiées par Flèche (*Column Hitboxes*)** :
   - La hitbox tactile s'étend sur toute la hauteur du quadrant ($140-180\text{ px}$), dépassant largement le seuil minimal d'accessibilité de $48\text{ px}$.
2. **Surbrillance Prédictive en Deux Temps** :
   - **Tap 1 (Origine)** : élévation subtile de la pile d'origine et illumination des flèches cibles légales (pour le premier dé, le second dé, et le coup combiné).
   - **Tap 2 (Destination)** : exécution immédiate du déplacement.
3. **Coup Forcé et Auto-Move** :
   - Lorsqu'un seul coup légal existe (ex. rentrée obligatoire depuis la barre), déclenchement d'un *auto-move* après une temporisation de $250\text{ ms}$ (pour laisser à l'œil le temps de lire le tirage des dés).
4. **Bouton Undo Proéminent** :
   - Placée dans la zone naturelle du pouce pour corriger immédiatement toute manipulation sans pénalité.

---

## 4. Architecture en Trois Strates : HUD Minimaliste et Bottom Sheet

Pour sanctuariser **85 % de la hauteur d'écran pour le tablier de jeu pur**, l'interface est découpée en trois strates étanches :

```
+-------------------------------------------------------------+
| Strate 1 : HUD Opponent (44px) - Avatar, Pip, PR, Chrono    |  ~5%
+-------------------------------------------------------------+
|                                                             |
|                                                             |
| Strate 2 : PURE PLAY ZONE (Tablier 24 flèches, Bear-Off,    |  85%
|             Barre centrale, Gouttière des dés)              |
|                                                             |
|                                                             |
+-------------------------------------------------------------+
| Strate 1 : HUD Joueur (88px) - Pip delta, Chrono, Thumb Dock|  ~10%
+-------------------------------------------------------------+
| Strate 3 : BOTTOM SHEET (Overlay 0 / 46dvh / 90dvh)         |
|             Coach IA, PR, Équité, Historique des coups      |
+-------------------------------------------------------------+
```

### Détail des Composants

1. **Strate 1 : HUD Minimaliste (15% au total)**
   - **Haut (44px + Safe Area Top)** : Adversaire, PR, Pip Count adverse, score du match, chrono adverse, icône paramètres (48x48px).
   - **Bas (88px + Safe Area Bottom)** : Pip delta joueur, chrono actif, dock d'action du pouce (Roll / Confirm / Undo / Cube / Coach Sheet).
2. **Strate 2 : Pure Play Zone (85%)**
   - Rendu vectoriel SVG réversible (sens horaire ou anti-horaire).
   - `touch-action: none;` et `user-select: none;`.
3. **Strate 3 : Bottom Sheet d'Analyse IA à 3 Crans**
   - **Collapsed (`0px`)** : Barre de prise en main discrète en cours de match.
   - **Half-Expanded (`46dvh`)** : Le tablier reste intégralement visible au-dessus. Affichage des probabilités de gain (Win%, G%, BG%) et des deltas d'équité ($\Delta\text{Eq}$).
   - **Full-Expanded (`90dvh`)** : Consultation de l'historique complet, matrice de décisions du videau et graphiques de PR.

---

## 5. Ingénierie Front-End PWA & Prévention des Crashs WebKit

1. **Verrouillage Viewport `100dvh`** :
   - Évite les sauts d'affichage dus aux barres d'adresse dynamiques de Safari iOS et Chrome Android.
2. **Safe Areas Hardware** :
   - Prise en compte de `env(safe-area-inset-top)` et `env(safe-area-inset-bottom)`.
3. **Suppression du Rebond Élastique et du Pull-to-Refresh** :
   - `overscroll-behavior: none;` et `overflow: hidden;` sur `html` et `body`.
4. **Pointer Events API & Isolation `:hover`** :
   - Remplacement des événements souris par `pointerdown`/`pointerup`.
   - Restriction des états `:hover` aux écrans non-tactiles via `@media (hover: hover) and (pointer: fine)`.
5. **Stabilisation Typographique** :
   - `font-variant-numeric: tabular-nums;` sur tous les chronomètres, compteurs de pip et badges de score pour empêcher tout sautillement horizontal lors des mises à jour DOM.

---

## 6. Plan d'Implémentation & Statut du Projet

- [x] **Étape 1 : Verrouillage Système & Viewport 100dvh Strict**
  - Méta-tags `viewportFit: cover`, `userScalable: false`.
  - CSS global `overscroll-behavior: none`, `touch-action: none`.
- [x] **Étape 2 : Budget Spatial « 85% Pure Play » & HUD Minimaliste (15%)**
  - Refonte compacte de `MatchHeader` et `MobileThumbDock`.
- [x] **Étape 3 : Géométrie Portrait & Empilement Condensé « Cap-at-5 »**
  - Badge numérique `6..15` (`tabular-nums`, or/obsidienne) sur le 5ᵉ pion dans `BoardPoint.tsx` et `boardGeometry.ts`.
- [x] **Étape 4 : Moteur Tactile Purement « Tap-to-Move »**
  - Seuil biomécanique anti-fantôme sous le pouce (`pointer: coarse`), auto-move sur coup forcé fluide à 250 ms.
- [x] **Étape 5 : Bottom Sheet d'Analyse IA 3-Positions (Half/Full)**
  - Normalisation de `CoachMobileDrawer` à 3 crans (`0px` / `46dvh` / `90dvh`) avec navigation temporelle et vue continue du tablier.
