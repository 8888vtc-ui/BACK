# Guide de l'Utilisateur & Manuel de Compétition — Backgammon Pro

Bienvenue dans le manuel officiel de **Backgammon Pro**. Ce guide a été conçu pour accompagner les joueurs de tous niveaux, du débutant découvrant le plus ancien jeu de stratégie au compétiteur de tournoi préparant un championnat.

---

## Sommaire

1. [Règles Officielles du Backgammon de Tournoi](#1-règles-officielles-du-backgammon-de-tournoi)
2. [L'Interface de Jeu & Ergonomie Mobile](#2-linterface-de-jeu--ergonomie-mobile)
3. [Le Coach Grand-Maître IA](#3-le-coach-grand-maître-ia)
4. [L'Analyse Profonde & les Rollouts](#4-lanalyse-profonde--les-rollouts)
5. [La Stratégie du Videau (Doubling Cube)](#5-la-stratégie-du-videau-doubling-cube)
6. [Entraînement Délibéré : Drills & Puzzles Quotidiens](#6-entraînement-délibéré--drills--puzzles-quotidiens)
7. [Le Mode Multijoueur en Ligne](#7-le-mode-multijoueur-en-ligne)
8. [Mode Hors-Ligne & Installation Mobile](#8-mode-hors-ligne--installation-mobile)

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

## 2. L'Interface de Jeu & Ergonomie Mobile

### 2.1 Le HUD de Match
Le bandeau supérieur affiche :
- Les scores des deux joueurs et la longueur cible du match (ex. premier à 5 points).
- Le **Pip Count** instantané et son différentiel (ex. `Δ +8`).
- La valeur courante du videau et son propriétaire.
- L'indicateur de connectivité et de synchronisation (`SyncIndicator`).

### 2.2 Thèmes de Plateau
Personnalisez votre confort visuel depuis le menu des paramètres :
1. **Classic Tournament** : Feutrine verte et bois noble de championnat.
2. **Luxury Leather & Wood** : Cuir grainé bordeaux et finitions dorées.
3. **Cyber Neon** : Contraste sombre futuriste et reflets néon.
4. **Minimalist Slate** : Épuration graphique moderne pour une concentration maximale.

### 2.3 Contrôles Tactiles & Sélecteur de Dé Mobile
Sur smartphone, appuyez sur un pion pour visualiser ses flèches de destination possibles.
Lorsque plusieurs dés peuvent déplacer le même pion, le **sélecteur tactile de dé** (`mobile-dice-selector`) apparaît au bas de l'écran pour vous permettre de choisir le dé souhaité avec une cible tactile confortable (conforme WCAG ≥ 44px).

---

## 3. Le Coach Grand-Maître IA

Le Coach Grand-Maître est votre tuteur interactif permanent.

### 3.1 Détection des Blunders
Dès qu'un coup joué entraîne une perte d'équité supérieure au seuil critique :
- Une alerte visuelle discrète apparaît sur le coup.
- Le volet du coach s'ouvre pour vous présenter la comparaison entre votre coup et le meilleur coup identifié par le réseau de neurones.

### 3.2 Comprendre les Métriques du Coach
- **Équité (Eq.)** : La valeur mathématique espérée de la position (de -1.0 à +1.0 en points de match).
- **Perte d'Équité (Equity Loss)** : La différence entre l'équité du meilleur coup possible et votre coup.
  - `0.000` : Coup optimal.
  - `-0.020 à -0.050` : Imprécision mineure (*doubtful*).
  - `-0.050 à -0.080` : Erreur tactique (*error*).
  - `< -0.080` : Faute majeure (**Blunder**).

### 3.3 Explications Pédagogiques en Direct
Le coach ne se contente pas de vous donner des chiffres : il vous explique avec clarté les concepts sous-jacents :
- **Construction de prime** : Importance de créer des blocs de 4, 5 ou 6 flèches consécutives.
- **Attaque et Blitz** : Pourquoi attaquer un pion adverse dans votre jan intérieur pour l'empêcher de s'ancrer.
- **Ancres avancées** : La valeur stratégique des points 20 et 21 (Golden Anchor).
- **Sécurité et duplication** : Minimiser les tirs directs de l'adversaire.

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

## 6. Entraînement Délibéré : Drills & Puzzles Quotidiens

- **Drills de Blunders (`/drills`)** : Entraînez-vous sur vos propres erreurs passées enregistrées automatiquement. Rejouez la position jusqu'à trouver le coup de grand-maître du premier coup.
- **Puzzles Quotidiens (`/puzzles`)** : Chaque jour, un défi tactique certifié est proposé à la communauté avec classement ELO.
- **Dashboard de Progression (`/progression`)** : Suivez votre courbe de **Performance Rating (PR)** match après match. Un PR inférieur à 5.0 vous classe parmi les joueurs de niveau maître international !

---

## 7. Le Mode Multijoueur en Ligne

1. Ouvrez le lobby multijoueur depuis l'accueil.
2. **Matchmaking Rapide** : Vous êtes instantanément mis en relation avec un adversaire de votre niveau ELO.
3. **Salons Privés** : Créez une chambre avec un code à 6 caractères pour inviter un ami.
4. **Horloge de Tournoi** : Les pendules utilisent le temps Fischer officiel (ex. 2 minutes de réserve + 12 secondes d'incrément par coup).
5. **Reconnexion Automatique** : En cas de perte de signal 4G/Wi-Fi, vous disposez de 60 secondes pour revenir dans la partie sans pénalité.

---

## 8. Mode Hors-Ligne & Installation Mobile

- **Web / PWA** : L'application peut être installée comme une Progressive Web App sur votre bureau ou écran d'accueil mobile.
- **iOS & Android** : Disponible nativement sur l'App Store et Google Play.
- **Résilience 100% Offline** : Jouez contre l'IA, résolvez des drills et consultez vos statistiques en plein vol ou en zone blanche. Vos données se synchronisent de manière transparente dès le retour du réseau.
