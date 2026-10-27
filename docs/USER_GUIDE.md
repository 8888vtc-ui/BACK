# Guide de l'Utilisateur & Manuel de Compétition — Backgammon Tour & Gammon Academy

Bienvenue dans le manuel officiel de **Backgammon Tour — Cercle Monte-Carlo & Gammon Academy** (`backgammontour.com` / `gammonacademy.com`). Ce guide accompagne les joueurs de tous niveaux, du débutant découvrant le plus ancien jeu de stratégie au compétiteur de tournoi préparant un championnat WBGF.

---

## Sommaire

1. [Règles Officielles du Backgammon de Tournoi](#1-règles-officielles-du-backgammon-de-tournoi)
2. [L'Interface de Jeu, Smart Click & Ergonomie Mobile](#2-linterface-de-jeu-smart-click--ergonomie-mobile)
3. [Le Coach Grand-Maître IA & Quotas VIP](#3-le-coach-grand-maître-ia--quotas-vip)
4. [L'Analyse Profonde & les Rollouts](#4-lanalyse-profonde--les-rollouts)
5. [La Stratégie du Videau (Doubling Cube)](#5-la-stratégie-du-videau-doubling-cube)
6. [Entraînement Délibéré : Gammon Academy, Drills & Puzzles Quotidiens V2](#6-entraînement-délibéré--gammon-academy-drills--puzzles-quotidiens-v2)
7. [Le Mode Multijoueur, Glicko-2 & Audit Provably Fair (SHA-256)](#7-le-mode-multijoueur-glicko-2--audit-provably-fair-sha-256)
8. [Mode Hors-Ligne, 6 Langues & Installation Mobile](#8-mode-hors-ligne-6-langues--installation-mobile)

---

## 1. Règles Officielles du Backgammon de Tournoi

Le Backgammon est un jeu de course, de blocage et de tactique opposant deux joueurs sur un plateau de 24 flèches (points).

### 1.1 Objectif
Être le premier joueur à faire progresser l'ensemble de ses 15 pions vers son jan intérieur (points 1 à 6) pour ensuite les sortir définitivement du plateau (*bear-off*).

### 1.2 Sens de Déplacement & Pip Count
- Le joueur **X (Blancs)** se déplace dans le sens décroissant (du point 24 vers le point 1).
- Le joueur **O (Noirs)** se déplace dans le sens croissant (du point 1 vers le point 24).
- Le **Pip Count** représente la somme totale des flèches que vos pions doivent encore franchir pour quitter le plateau. En début de match, chaque joueur démarre avec 167 pips.

### 1.3 Déplacement des Pions
- Un joueur lance deux dés à six faces.
- Un pion ne peut atterrir que sur une flèche ouverte (inoccupée, occupée par ses propres pions, ou occupée par **un seul pion adverse**).
- **Le Double** : Lorsqu'un joueur obtient un double (ex. 4-4), les valeurs sont jouées **quatre fois** (quatre déplacements de 4 points).
- **Obligation de jouer** : Si un coup est légal, le joueur a l'obligation stricte de jouer le maximum de dés possible.

### 1.4 La Barre et les Pions Frappés
- Un pion isolé sur une flèche est appelé un **blot**.
- Si un pion adverse atterrit sur un blot, celui-ci est **frappé** et placé sur la barre centrale.
- Un joueur ayant un ou plusieurs pions sur la barre doit obligatoirement les faire rentrer dans le jan intérieur adverse avant de pouvoir déplacer tout autre pion.

### 1.5 La Sortie des Pions (Bear-off)
Dès que la totalité de vos 15 pions est réunie dans votre jan intérieur (flèches 1 à 6), vous pouvez commencer à les sortir selon la valeur exacte des dés.

### 1.6 Niveaux de Victoire
- **Victoire Simple (1 point)** : L'adversaire a déjà sorti au moins un pion.
- **Gammon (2 points)** : L'adversaire n'a sorti aucun pion.
- **Backgammon (3 points)** : L'adversaire n'a sorti aucun pion et possède encore au moins un pion sur la barre ou dans votre jan intérieur.

---

## 2. L'Interface de Jeu, Smart Click & Ergonomie Mobile

### 2.1 Le HUD de Match & Cadences de Jeu
Le bandeau supérieur affiche :
- Les scores des deux joueurs et la longueur cible du match (ex. premier à 5 points).
- Le **Pip Count** instantané et son différentiel (ex. `Δ +8`).
- La valeur courante du videau et son propriétaire.
- Le **sélecteur de cadence** (**Coach**, **Tournoi** ou **Blitz**) permettant d'adapter la vitesse d'animation et de lecture des coups du Bot IA.
- L'indicateur de connectivité et de synchronisation (`SyncIndicator`).

### 2.2 Paradigme « Smart Point Click » & Clic sur les Dés
- **Smart Point Click (Destination-First)** : cliquez directement sur une flèche de destination pour jouer un dé simple, enchaîner la somme $d_1 + d_2$, ou fermer une porte (*Make a Point*) avec deux pions en un seul clic.
- **Clic Droit (Desktop)** : joue immédiatement le dé secondaire (le plus petit) ; un clic droit sur le tapis annule le dernier sous-mouvement (*Undo*).
- **Clic sur les Dés Posés** :
  - Tant qu'il reste des dés à jouer, cliquer sur les dés **permute leur ordre** ($[d_1, d_2] \leftrightarrow [d_2, d_1]$).
  - Une fois tous les dés joués, cliquer sur les dés **valide immédiatement le tour**.

### 2.3 Thèmes de Plateau & Ergonomie Mobile
Personnalisez votre confort visuel depuis le menu des paramètres (*Monte-Carlo Heritage*, *Classic Tournament*, *Luxury Leather & Wood*, *Cyber Neon*, *Minimalist Slate*).
Sur smartphone, le **sélecteur tactile de dé** (`mobile-dice-selector`) offre des cibles tactiles confortables (conforme WCAG ≥ 44px).

---

## 3. Le Coach Grand-Maître IA & Quotas VIP

Le Coach Grand-Maître (propulsé par **Open Sage 3-ply** et l'API directe **Google Gemini `gemini-3.8-flash` / `gemini-3.6`**) est votre tuteur interactif permanent.

### 3.1 Détection des Blunders & Métriques
- **Équité (Eq.)** : valeur mathématique espérée de la position.
- **Perte d'Équité (Equity Loss)** :
  - `≤ 0.010` : **Optimal ✅**
  - `≤ 0.020` : **Bon 👍**
  - `> 0.020` : **Imprécision ⚠️**
  - `> 0.080` : **Blunder ❌**

### 3.2 Synthèse IA Post-Match, Quota d'Onboarding & Abonnement Pro (`/pricing`)
- **Évaluation Mathématique & Jeu** : le calcul du PR, le Pip Count, l'évaluation Open Sage, les Puzzles Quotidiens V2 (`/daily-puzzle`) et les Salons Privés (`BG-XXXX`) sont accessibles immédiatement.
- **Quota Coach IA (Onboarding "Aha Moment")** : les joueurs non-abonnés bénéficient de **3 analyses socratiques complètes de Blunders** pour découvrir la puissance pédagogique du Coach IA.
- **Passer Pro / Grandmaster (`/pricing`)** : débloquez le Coach IA illimité (explications en direct + synthèse IA post-match complète + banque personnelle d'entraînement `/drills`) via le **Plan Mensuel Pro (14.99 $/mois)** ou le **Plan Annuel Grandmaster (99.00 $/an, -45 %)**, ainsi que le **Pack Club & Chouette (149,99 €/an pour 5 sièges)**.

---

## 4. L'Analyse Profonde & les Rollouts

Pour les décisions complexes où plusieurs coups affichent des équités très proches, vous pouvez solliciter le microservice d'analyse profonde :

1. Cliquez sur **Lancer un Rollout Profond** dans le panneau du coach.
2. Choisissez la profondeur (2-ply ou 3-ply) et le nombre d'essais statistiques (ex. 1296 parties simulées).
3. La barre de progression Server-Sent Events affiche l'avancement en direct.
4. Le résultat final fournit l'intervalle de confiance statistique pour trancher définitivement la position.

---

## 5. La Stratégie du Videau (Doubling Cube)

Le videau est l'arme stratégique décisive du Backgammon moderne.

### 5.1 Les Décisions de Base
- **Double** : Proposer à l'adversaire de multiplier par deux la mise du match.
- **Take (Accepter)** : L'adversaire accepte le double et devient le propriétaire exclusif du dé.
- **Pass (Refuser)** : L'adversaire abandonne la manche en cours et concède les points actuels.

### 5.2 Règle de Crawford
Dans un match en plusieurs points, dès qu'un joueur atteint le score à 1 point de la victoire (ex. 4-2 dans un match en 5 points), la manche suivante est la **manche de Crawford** : le videau est strictement interdit pendant cette manche.

---

## 6. Entraînement Délibéré : Gammon Academy, Drills & Puzzles Quotidiens V2

- **Gammon Academy (`/academy`)** : encyclopédie interactive certifiée Open Sage 3-ply des 15 lancers d'ouverture, calculateur d'équité de match (MET Kazaross-XG2) et guides stratégiques fondamentaux en 6 langues.
- **Puzzles Quotidiens V2 & Révision FSRS (`/puzzles` & `/daily-puzzle`)** : chaque jour à 00h00 UTC, relevez un défi tactique certifié Open Sage 3-ply avec suivi de série (*Streak*) et révision espacée **FSRS** (J+1, J+3, J+7, J+14, J+30).
- **Drills de Blunders (`/drills`)** : entraînez-vous sur vos propres erreurs passées enregistrées automatiquement dans la banque d'erreurs récurrentes.
- **Dashboard de Progression (`/progression`)** : suivez votre courbe de **Performance Rating (PR)**, vos séries de puzzles et vos concepts prioritaires à retravailler.

---

## 7. Le Salon Privé (`BG-XXXX`), Glicko-2 & Audit Provably Fair (SHA-256)

1. **Exclusivité Salon Privé sur Code (`BG-XXXX`)** : créez un salon privé en 1 clic et partagez votre code à 4 chiffres (ex. `BG-8492`) avec un ami ou partenaire de club pour jouer instantanément sans aucune file d'attente, sous pendule officielle WBF/Fischer.
2. **Classement Glicko-2 Composite** : évaluation pondérant le résultat du match et la qualité de jeu (PR) pour neutraliser la variance des dés sur les matchs courts.
3. **Audit Cryptographique des Dés (Provably Fair SHA-256)** :
   - Avant chaque partie, l'empreinte `SHA-256(serverSeed)` est engagée (*Commit*).
   - Chaque jet de dés est dérivé par `HMAC-SHA256(serverSeed, clientSeed:nonce)` avec échantillonnage par rejet (`< 252`) garantissant zéro biais de modulo.
   - En fin de match (bouton **« 🛡️ Audit Dés (SHA-256) »** du rapport post-match), vérifiez en 1 clic l'intégrité mathématique de tous les jets de la partie et personnalisez votre graine client (`clientSeed`).

---

## 8. Mode Hors-Ligne, 6 Langues & Installation Mobile

- **6 Langues & Support RTL** : interface et terminologie XG intégralement traduites en Français, Anglais, Espagnol, Portugais, Allemand et Arabe (RTL).
- **Web / PWA & Mobile Natif (iOS / Android)** : installable en PWA ou via l'App Store et Google Play.
- **Résilience 100 % Offline** : jouez contre l'IA, résolvez des puzzles et consultez vos statistiques hors-ligne ; vos données se synchronisent automatiquement au retour du réseau.
