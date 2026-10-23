# Référentiel d'Excellence et Spécifications Maîtres : Compétition, Rétention & Intégrité

Ce document constitue la référence architecturale, mathématique et ergonomique absolue pour le développement et l'évolution de la plateforme de Backgammon compétitive (calibre Backgammon Galaxy v2, eXtreme Gammon XG2, Chess.com et Lichess).

---

## Sommaire
1. [Pilier 1 : Matrice d'Interaction Zero-Friction & Cinématique FLIP/WAAPI](#1-matrice-dinteraction-zero-friction--cinématique-flipwaapi)
2. [Pilier 2 : Matchmaking Glicko-2 Composite & Gamification Pédagogique](#2-matchmaking-glicko-2-composite--gamification-pédagogique)
3. [Pilier 3 : Psychoacoustique Modale & Micro-Haptique d'Orfèvrerie](#3-psychoacoustique-modale--micro-haptique-dorfèvrerie)
4. [Pilier 4 : Économie Freemium Éthique & Netcode Provably Fair (RNG Inviolable)](#4-économie-freemium-éthique--netcode-provably-fair-rng-inviolable)

---

## 1. Matrice d'Interaction Zero-Friction & Cinématique FLIP/WAAPI

### 1.1 Élimination du Double-Clic & Paradigme Smart Point Click
* **Interdiction de `onDoubleClick` natif** : le debounce de 250–300 ms détruit la réactivité instantanée ; l'exécution optimiste risque de déplacer 2 pions distincts au lieu d'un seul sur la somme $d_1 + d_2$.
* **Smart Point Click (Destination-First)** :
  * Clic sur flèche atteignable en 1 dé $\to$ déplace le pion légal.
  * Clic sur flèche atteignable en somme $d_1 + d_2$ $\to$ enchaîne les 2 sous-coups (avec pause intermédiaire de 55 ms et vérification de la légalité de la case de passage).
  * Clic sur flèche pour fermer une porte ("Make a Point") avec 2 pions $\to$ déplace simultanément les 2 pions avec un décalage chorégraphié de 45 ms.
* **Clic sur les Dés Posés (Dual-State)** :
  * Si dés restants $> 0$ : permute l'ordre des dés ($[d_1, d_2] \leftrightarrow [d_2, d_1]$) et surélève le dé actif de 3 px.
  * Si tous les dés sont joués ($= 0$) : valide et confirme immédiatement le tour (`confirmTurn()`).
* **Clic Droit Pions (Desktop)** : joue directement le dé secondaire (le plus bas) sans altérer l'ordre visuel des dés. Clic droit tapis $\to$ Undo.

### 1.2 Seuils Biomécaniques & Machine à États Pointeur
* **Zéro re-render React** pendant le déplacement continu : écriture directe des variables `--drag-x` et `--drag-y` via `requestAnimationFrame` sur le nœud DOM, avec capture matérielle `setPointerCapture`.
* `DRAG_DISTANCE_THRESHOLD_MOUSE_PX` = $5\text{ px}$.
* `DRAG_DISTANCE_THRESHOLD_TOUCH_PX` = $12\text{ px}$.
* `TAP_MAX_DURATION_MS` = $220\text{ ms}$.
* `SNAP_RADIUS_PX` = $36\text{ px}$ (rayon d'attraction magnétique).
* `SNAP_HYSTERESIS_PX` = $44\text{ px}$ (décrochage pour éviter tout scintillement entre flèches contiguës).

### 1.3 Calibrage Cinématique FLIP (Web Animations API)
$$\text{FLIGHT\_DURATION\_MS}(D_{\text{px}}) = \text{clamp}\left(125 + 0.22 \cdot D_{\text{px}}, \, 140, \, 290\right)\text{ ms}$$
* **Coup Normal** : `cubic-bezier(0.22, 1.0, 0.36, 1.0)` — pic à `scale(1.08)` avec ombre portée à `offset: 0.45`.
* **Frappe de Blot (Attaquant)** : `cubic-bezier(0.16, 1.0, 0.30, 1.0)`, durée $\text{clamp}(115 + 0.20 \cdot D, 130, 265)\text{ ms}$.
* **Éjection du Blot vers la Barre** : décollage synchronisé à **75 % du vol de l'attaquant** (`HIT_EJECT_DELAY_MS`), durée $260\text{ ms}$ avec rebond `cubic-bezier(0.34, 1.45, 0.64, 1.0)`.
* **Sortie de Pion (Bear-off)** : $195\text{ ms}$, `cubic-bezier(0.25, 0.90, 0.35, 1.0)`.
* **Saut Combiné ($d_1 + d_2$)** : Saut 1 raccourci de 15 %, contact au sol de $55\text{ ms}$ (`INTERMEDIATE_TOUCH_PAUSE_MS`), puis second saut.

### 1.4 Pipeline Parallèle du Bot & Profils de Vitesse
Lancement immédiat des dés dès $T_0$ ; le calcul Open Sage s'exécute en parallèle du roulement ($T_1$) et de la lecture cognitive ($T_2$), annulant la latence perçue :
* **Coach** : $T_0 = 280$, $T_1 = 550$, $T_2 = 700$, $T_3 = 650$ (flèches d'intention complètes), $T_4 = 260$, $T_5 = 480$.
* **Tournoi** : $T_0 = 160$, $T_1 = 380$, $T_2 = 450$, $T_3 = 180$, $T_4 = 195$, $T_5 = 250$.
* **Blitz** : $T_0 = 80$, $T_1 = 230$, $T_2 = 200$, $T_3 = 0$, $T_4 = 140$, $T_5 = 110$.
* *Sur un double (4 coups)* : accélération automatique de $25\,\%$ sur $T_4$ et $T_5$.
* *Persistance $T_6$* : les flèches du dernier coup adverse restent affichées jusqu'au clic sur "Lancer les dés" ou "Doubler".

---

## 2. Matchmaking Glicko-2 Composite & Gamification Pédagogique

### 2.1 Le Problème de la Variance des Dés & Score Composite UBC
Dans les matchs courts (1 ou 3 pts), les dés créent un bruit stochastique qui corrompt le classement Glicko-2 standard si l'on n'utilise que le résultat binaire victoire/défaite ($s \in \{0, 1\}$).
* **Score Continu Composite** :
  $$s_j = w(L) \cdot \mathbb{I}(\text{Victoire}) + (1 - w(L)) \cdot \frac{1}{1 + \exp\left(-\gamma \cdot (\text{PR}_j - \text{PR}_i)\right)}$$
  avec $w(L) = \frac{L}{L + 4}$ et $\gamma = 0.35$.
* **Garde-fous mathématiques** :
  * Constante système $\tau$ bridée à $[0.20; 0.30]$ pour éviter les emballements de volatilité $\sigma$.
  * Algorithme de l'Illinois pour la convergence superlinéaire de la racine de volatilité.

### 2.2 Puzzles Quotidiens & Répétition Espacée FSRS
* **Hub /daily-puzzle** : une position certifiée par Open Sage chaque jour à 00h00 UTC avec Streak tracker.
* **Cascade de certification en 3 passes d'Open Sage** :
  1. *Filtre d'éligibilité* : Blunder humain $\ge 0.080$ EMG, unicité $\Delta E_{1,2} \ge 0.035$, non-gin ($P \in [0.15; 0.85]$), attractivité du leurre (joué en 1-ply mais réfuté en 3-ply).
  2. *Certification Sage 3T* : Rollout tronqué 7 tours (PR 0.23).
  3. *Full Rollout* : 1 296 à 20 736 trajectoires pour les cas de backgame complexes.
* **Ordonnanceur FSRS** : les blunders commis par le joueur en partie sont réinjectés en puzzles de révision personnalisés à J+1, J+3, J+7, J+14, J+30 dans la table Supabase `recurring_errors`.

---

## 3. Psychoacoustique Modale & Micro-Haptique d'Orfèvrerie

### 3.1 Synthèse Modale Pure Web Audio API (0 ms de Latence)
Élimination totale des balises DOM `<audio>` (qui ajoutent 150 à 300 ms de latence). Simulation physique par banc de filtres Biquad et amortissement Rayleigh-Woodhouse ($R_k = b_1 + b_3 f_k^2$) :
* **Feutre Épais** : 95 Hz (sub-table), 240 Hz (corps), 620 Hz et 1450 Hz (fibres). Attaque $T_c \approx 6\text{ ms}$, extinction en $42\text{ ms}$, filtre passe-bas anti-fatigue à $1\,800\text{ Hz}$.
* **Bois Noble (Ébène/Palissandre)** : 142 Hz (cavité), 315 Hz (Mode 1), 718 Hz (Mode 2), transitoire d'attaque à $1\,580\text{ Hz}$. Pitch shift de $-12\,\%$ lors des captures.
* **Ivoire / Résine Haute Densité (Dés)** : Modes inharmoniques à 1120 Hz, 2480 Hz, 4150 Hz, 6800 Hz ($Q$ entre 15 et 35), zéro sustain.
* **Jeton de Casino Lourd (Argile 14g)** : 185 Hz (pression d'air) + 2670 Hz et 3890 Hz ($Q \approx 40$), avec encoche anti-fatigue à $3\,200\text{ Hz}$.
* **Protection Anti-Fatigue** : Jitter stochastique de $\pm 4\,\%$ sur les fréquences ; si cadence inter-coups $< 220\text{ ms}$ (Blitz), réduction automatique de $30\,\%$ du decay.

### 3.2 Séquençage Haptique (Taptic Engine / Core Haptics)
* **Frappe de Blot (15 ms)** : `HapticTransient` ($1.0, 0.85$) + `HapticContinuous` $15\text{ ms}$ ($0.95, 0.30$) avec coupure nette pour freinage électromagnétique actif de l'actionneur LRA.
* **Roulement Granulaire de Dés (610 ms)** : Nappe continue de frottement feutre ($0 \to 500\text{ ms}$) + 10 impacts dégressifs géométriques aux timestamps $0, 18, 45, 82, 130, 192, 270, 368, 485, 610\text{ ms}$.

---

## 4. Économie Freemium Éthique & Netcode Provably Fair (RNG Inviolable)

### 4.1 Modèle Économique & Structure des Coûts Unitaires
* **Philosophie** : Zéro pub, Zéro monnaie virtuelle ("Zero Ads, Zero Coins, Pure Skill"). Le jeu multijoueur et local est 100 % gratuit et illimité.
* **Coût marginal d'une analyse complète de match** :
  * Open Sage sur Google Cloud Run (scale-to-zero) : $0{,}000127\ \$$
  * Gemini 2.0 / 2.5 Flash (5–8 moments clés filtrés) : $0{,}000520\ \$$
  * **Coût total consolidé** : $0{,}000647\ \$$ ($\approx 0{,}000599\ \text{€}$).
* **Grille Tarifaire Stripe Billing** :
  * *Freemium* : 0 € (3 analyses complètes offertes / 24h, PR et stats dés illimités).
  * *Coach IA Mensuel* : 9,99 € TTC / mois.
  * *Coach IA Annuel (Cœur de cible)* : 79,99 € TTC / an (soit 6,67 € / mois, -33 %, essai 7 jours).
  * *Pack Club & Chouette* : 149,99 € TTC / an (jusqu'à 5 comptes).
* **Rentabilité** : Point mort d'infrastructure à seulement **9 abonnés payants**. À 1 000 abonnés : **74 681 € de bénéfice net annuel (marge opérationnelle de 97,9 %)**.
* **Soft Paywall (Inspiration Chess.com)** : Au 4e match de la journée, valoriser les coups positifs du joueur (coups brillants, PR) avant d'inviter à débloquer le coach illimité.

### 4.2 Protocole Cryptographique Provably Fair (Zéro Biais de Modulo)
* **Phase 1 (Commit)** : le serveur publie `serverSeedHash = SHA-256(serverSeed)` avant le match.
* **Phase 2 (Play)** : combinaison canonique `clientSeed = clientSeedA + ":" + clientSeedB`, indexée par un `nonce` incrémental ($0, 1, 2, \dots$).
* **Échantillonnage par rejet (< 252)** :
  * $256 \pmod 6 = 4$ crée un biais de $+0{,}39\,\%$ sur un modulo naïf.
  * L'algorithme extrait $D_n = \text{HMAC-SHA256}(\text{serverSeed}, \text{clientSeed}:n)$ et **rejette tout octet $\ge 252$**.
  * Pour chaque octet $< 252$ : $\text{face} = (b_i \bmod 6) + 1$, assurant une probabilité strictement uniforme de $42/252 = 1/6$.
  * Au jet d'ouverture ($nonce = 0$), rejet obligatoire des doubles ($d_2 \neq d_1$).
* **Audit en 1 Clic** : vérificateur dans le navigateur via `window.crypto.subtle` recalculant en 0 ms l'intégralité des tirages du match après révélation de la graine serveur.

### 4.3 Détection Anti-Triche "Smart Cheating" (5POINT / Regan)
* Détection du tricheur sélectif (qui joue 85 % de ses coups manuellement mais consulte XG sur 2 à 3 coups critiques).
* Modélisation Ex-Gaussienne du temps de réflexion ($RT = \mathcal{N}(\mu, \sigma^2) + \text{Exp}(1/\tau)$) : détection de la latence de transcription mécanique (7 à 14 s constante) et des événements de perte de focus (`window.onblur` / `visibilitychange`).
* Z-score composite avec seuil d'investigation à $3.5\sigma$ et suspension d'homologation à $4.25\sigma$.
