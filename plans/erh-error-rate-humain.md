# Spécification Théorique & Architecture : L'ERH (Error Rate Humain)

> **Statut** : Document de cadrage propriétaire & feuille de route R&D.  
> **Auteur** : Projet Backgammon Pro.  
> **Date** : Octobre 2026.  
> **Objectif** : Dépasser le paradigme d'évaluation mathématique statique (PR GTO / eXtreme Gammon) en introduisant le premier modèle d'évaluation de jeu **exploitatif et psychologique entre humains**.

---

## 1. Genèse & Constat : Les Limites du PR Classique (BMAB / XG)

Depuis les travaux de Gerald Tesauro (TD-Gammon) et de Xavier Dufaure de Citres (eXtreme Gammon), le monde du Backgammon mesure la force des joueurs via le **Performance Rating (PR)** ou **Error Rate** :

$$\text{PR} = \text{Perte d'Équité Moyenne par Décision non forcée} \times 500$$

### Le Vice Caché du PR Classique
Le PR classique repose sur une hypothèse fondamentale de la théorie des jeux : **l'adversaire est un dieu omniscient sans faille psychologique (Équilibre de Nash / GTO)**.

Dans la réalité d'un match **Humain contre Humain**, cette hypothèse est fausse :
1. **Sanction des coups exploitants** : Si vous affrontez un adversaire terrifié par le videau qui abandonne 40 % de ses cubes, doubler agressivement est la décision qui maximise vos points réels. Pourtant, eXtreme Gammon vous sanctionne d'un blunder (+0.080 d'équité perdue selon la théorie) !
2. **Absence de notion de complexité pratique** : L'ordinateur résout une position chaotique en 15 millisecondes. Un être humain sous pression de l'horloge va paniquer, hésiter et s'effondrer. Créer délibérément du désordre est souvent le meilleur choix pratique en tournoi.
3. **Incapacité à mesurer l'adaptation psychologique** : Le PR récompense le jeu robotique prévisible et punit le génie tactique adaptatif.

---

## 2. Définition Fondamentale de l'ERH

L'**ERH (Error Rate Humain)** ne mesure pas l'écart par rapport à un ordinateur parfait. Il mesure l'écart par rapport à **la décision optimale exploitant les biais cognitifs observables de l'adversaire humain réel** :

$$\text{ERH} = \max_{M} \mathbb{E}_{\text{Adversaire}}[M] - \mathbb{E}_{\text{Adversaire}}[M_{\text{joué}}]$$

- Un joueur qui récite par cœur les tables de XG sans s'adapter à son adversaire aura un **bon PR (ex. 2.5)** mais un **ERH médiocre (ex. 12.0)** car il laisse échapper une multitude d'opportunités d'exploitation.
- Un joueur qui lit la psychologie adverse, tend des pièges en fin de temps et exploite la frilosité du videau aura un **ERH de 0.00 (Exécution Exploitative Parfaite)**.

---

## 3. Le Modèle en 4 Dimensions de Profilage Adversaire

L'ERH s'appuie sur une détection en temps réel (sur 10 à 40 coups) de l'empreinte comportementale de l'adversaire :

```
                               ▲
                               │ Axe 2 : Indice de Panique
                               │ (Backgame / Retard critique)
                               │
       Axe 1 : Frileux ◄───────┼───────► Axe 1 : Gambler
    (Passe trop les cubes)     │       (Accepte tout au videau)
                               │
                               │ Axe 3 : Aversion au Risque
                               │ (Surprotection / Passivité)
                               ▼
```

### Dimension 1 : Élasticité au Videau ($\mathcal{E}_{\text{cube}}$)
- **Profil Frileux (Passif)** :
  - *Comportement* : Son point de refus (Take Point) réel est à 30-35 % de chances au lieu du seuil mathématique de 25 %. Il a peur des gammons.
  - *Exploitation ERH* : Doubler prématurément pour voler le point immédiatement. Ne pas doubler constitue un blunder d'ERH.
- **Profil Gambler (Calling Station)** :
  - *Comportement* : Refuse de passer par orgueil ou méconnaissance.
  - *Exploitation ERH* : Retarder le double, attendre d'avoir une menace directe de gammon pour lui infliger 2 ou 4 points.

### Dimension 2 : Indice de Panique en Retard ($\mathcal{P}_{\text{timing}}$)
- *Comportement* : Lorsqu'il est mené en course ou enfermé dans un Jan adverse (Backgame), l'humain moyen perd sa lucidité. Il avance ses pions de devant trop vite et détruit sa propre structure.
- *Exploitation ERH* : Conserver un maximum de pions en arrière et étendre la prime. Tout coup qui simplifie prématurément la position vers une course simple est pénalisé par l'ERH.

### Dimension 3 : Aversion au Risque & Frilosité ($\mathcal{R}_{\text{blot}}$)
- *Comportement* : Horreur de laisser un pion seul (blot). Il préfère empiler 6 pions sur une même flèche (« faire un chandelier ») plutôt que de slotter pour construire une porte vitale.
- *Exploitation ERH* : Prendre possession du centre du plateau en toute impunité.

### Dimension 4 : Sensibilité à la Pression Chronométrique ($\mathcal{T}_{\text{clock}}$)
- *Comportement* : Sous la barre des 20 secondes par coup, son Error Rate réel grimpe exponentiellement.
- *Exploitation ERH* : Choisir des variantes tactiques à arborescence large (beaucoup de lancers légaux différents) pour surcharger sa bande passante cognitive.

---

## 4. Exemple Concret : Divergence entre PR et ERH

Considérons une position de milieu de jeu où le joueur Blanc hésite entre deux coups :

| Option de Jeu | Choix de Coup | Évaluation eXtreme Gammon (PR) | Évaluation Réelle face à un Joueur Frileux (ERH) |
|---|---|---|---|
| **Coup A (Course sûre)** | Rentre ses pions, position calme et plate | **PR = 0.00** (Coup d'ordinateur froid) | **ERH = +0.120** (Faute : laisse l'adversaire jouer sans stress) |
| **Coup B (Slot agressif + Double)** | Laisse un blot en 5, menace une prime de 6 | **PR = +0.045** (Imprécision théorique pour XG) | **ERH = 0.00** (Coup Parfait : l'adversaire panique et passe le videau 8 fois sur 10) |

> **Conclusion** : Le Coup B est récompensé par l'ERH car il capitalise sur la faiblesse humaine, alors que le PR le dévalorise.

---

## 5. Intégration Produit dans l'Application

### 1. Dashboard Post-Match en Multijoueur
À la fin d'une partie PvP, le joueur ne reçoit plus seulement son PR froid, mais une double lecture :

```
┌─────────────────────────────────────────────────────────────┐
│                ANALYSE DU MATCH PvP                         │
├──────────────────────────────┬──────────────────────────────┤
│ 📐 PR Théorique (BMAB) : 3.8  │ 🧠 ERH Psychologique : 0.6   │
│ (Qualité formelle vs XG)     │ (Efficacité d'exploitation)  │
├──────────────────────────────┴──────────────────────────────┤
│ 🎯 Diagnostic du Coach :                                    │
│ "Votre adversaire refusait le videau 40% trop vite. En     │
│ doublant agressivement aux tours 12 et 19, vous avez        │
│ parfaitement exploité sa frilosité (+2 points décisifs)."  │
└─────────────────────────────────────────────────────────────┘
```

### 2. Le Profil Dynamique de l'Adversaire
Pendant la partie en ligne, des indicateurs discrets de télémétrie profilent le style de jeu (sans tricherie) :
- *Style identifié* : `Frileux au videau`, `Attaquant compulsif`, `Sensible au chrono`.

---

## 6. Propriété Intellectuelle & Avantage Compétitif

- **100 % Inédit sur le Marché** : Aucune plateforme existante (Backgammon Galaxy, Heroes, Nextgammon, eXtreme Gammon) ne propose d'évaluation exploitative humaine.
- **Différenciateur Majeur** : Positionne l'application non seulement comme un simulateur mathématique, mais comme **la première académie d'intelligence psychologique du jeu**.
- **Propriété Fermée** : Algorithme et heuristiques de profiling développés en interne sous licence propriétaire MIT.
