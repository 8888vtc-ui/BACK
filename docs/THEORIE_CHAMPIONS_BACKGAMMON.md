# 📚 Guide Stratégique des Grands-Maîtres : François Tardieu, Michy & Mochy

> Ce document synthétise les concepts théoriques, les heuristiques de décision et les proverbes des plus grands maîtres du Backgammon contemporain : le triple champion d'Europe français **François Tardieu**, le pédagogue et n°2 mondial **Michihito Kageyama (« Michy »)**, et le double champion du monde et n°1 mondial **Masayuki Mochizuki (« Mochy »)**.
>
> Ces principes sont directement intégrés dans le moteur d'analyse, l'Encyclopédie de Connaissances (`KnowledgeBaseModal`) et le panneau de détection des blunders (`CoachPanel`) de votre application.

---

## Sommaire

1. [Architecture Pédagogique du Coach de Blunders](#1-architecture-pédagogique-du-coach-de-blunders)
2. [François Tardieu : *Backgammon Strategic Concepts*](#2-françois-tardieu--backgammon-strategic-concepts)
3. [Michihito Kageyama (Michy) : *La Trilogie Backgammon Odyssey*](#3-michihito-kageyama-michy--la-trilogie-backgammon-odyssey)
   - [Les 21 Proverbes d'Ouverture (*Opening Concepts*)](#les-21-proverbes-douverture-opening-concepts)
   - [Techniques Avancées de Fin de Partie (*Endgame Technique*)](#techniques-avancées-de-fin-de-partie-endgame-technique)
4. [Masayuki Mochizuki (Mochy) : *Backgammon Masterclass*](#4-masayuki-mochizuki-mochy--backgammon-masterclass)
5. [Guide Pratique des Erreurs : Diagnostic & Livre Associé](#5-guide-pratique-des-erreurs--diagnostic--livre-associé)
6. [Bibliographie Officielle & Liens d'Acquisition Légale](#6-bibliographie-officielle--liens-dacquisition-légale)

---

## 1. Architecture Pédagogique du Coach de Blunders

Lorsqu'un joueur réalise un coup sous-optimal, l'application quantifie la perte d'équité ($\Delta Eq$) par rapport à l'évaluation Expectimax / XG++ :
- **$\Delta Eq \le -0.060$** : Coup douteux (*Doubtful*) $\rightarrow$ Alerte pédagogique.
- **$\Delta Eq \le -0.120$** : Faute majeure (*Blunder*) $\rightarrow$ Déclenchement automatique du Coach.

Dès qu'une erreur est détectée, le `CoachPanel` :
1. Isole le concept fautif (ex: `blot_safety`, `advanced_anchor`, `prime_building`, `race_management`).
2. Affiche un encart dédié **« Pour progresser sur cette erreur : Livre Recommandé »**.
3. Offre un bouton d'accès direct à la fiche de la base de connaissances interne (`onOpenKnowledgeConcept`).
4. Propose un lien vers la boutique officielle de l'ouvrage pour permettre au joueur d'approfondir la théorie.

---

## 2. François Tardieu : *Backgammon Strategic Concepts*

**Auteur :** François Tardieu (Édité par Stéphane Chenevière)  
**Titre :** *Backgammon: Strategic Concepts*  
**Origine :** Document culte ayant circulé sous forme de manuscrit PDF pendant 20 ans avant sa publication officielle.

### Les 4 Piliers Stratégiques de Tardieu :

### 1. La Suprématie des Ancres Hautes (Points 20 & 21)
* **Principe :** Rester sur le point 24 expose le joueur à un encerclement progressif. L'ancre d'or (point 20) ou l'ancre 21 adverse immunise quasi-totalement contre le blitz et garantit une sortie avec n'importe quel dé moyen (4, 5, 6).
* **Citation clé :** *« Ne dispersez aucun blot sans ancre de repli : la structure des ancres est la fondation absolue de toute stratégie. »*

### 2. Le Timing d'une Prime
* **Principe :** Une prime n'a de valeur que si vous avez le timing pour l'alimenter. Démonter prématurément ses portes intérieures pour conserver une prime extérieure est une des causes majeures de défaites.

### 3. La Gestion du « One Man Back »
* **Principe :** Lorsqu'il ne vous reste qu'un seul pion arriéré dans le jan adverse, ne le laissez jamais passif en fond de court. Avancez-le vers le point 20 ou le point 18 pour menacer les constructions adverses et forcer l'adversaire à jouer prudemment.

### 4. L'Enclume et le Marteau
* **Principe :** Votre jan intérieur est l'enclume, votre jan extérieur (points 7, 8, 9) est le marteau. Frapper un pion adverse n'a de sens que si votre enclume possède des portes fermées pour le coincer sur la barre.

---

## 3. Michihito Kageyama (Michy) : *La Trilogie Backgammon Odyssey*

**Auteur :** Michihito Kageyama & Roland Herrera  
**Titres :** *Opening Concepts* (Vol. 1), *Endgame Technique* (Vol. 2), *Back Checker Strategy* (Vol. 3)

### Les 21 Proverbes d'Ouverture (*Opening Concepts*)

Michy a révolutionné l'enseignement du backgammon en remplaçant la mémorisation brute par des proverbes mnémotechniques imagés :

| Proverbe de Michy | Jet de dés type | Signification & Règle d'or |
| :--- | :--- | :--- |
| **« Break the Mountain »** | 2-1, 3-2, 4-3 | Avec 5 pions sur le point 6 en début de partie, utilisez les petits dés pour faire descendre ces pions vers les points 5 ou 4 plutôt que de laisser cette « montagne » inutile. |
| **« Double Tiger »** | 2-1, 3-1, 4-2 | Frapper deux pions adverses d'un coup dans son jan intérieur en laissant deux blots. L'attaque agressive surpasse quasi-systématiquement le repli passif. |
| **« Golden Point Priority »** | 3-1, 5-3 | Le point 5 (et l'ancre 20) est la porte maîtresse du jeu. Aucune alternative ne surpasse la construction du point 5. |
| **« Lover's Leap »** | 6-5 | Échapper un pion arriéré du point 24 jusqu'au point médian 13 en un seul saut. En cas d'avance à la course, fuyez sans hésiter. |
| **« Split and Slot »** | 2-1, 5-1 | Si vous ne pouvez faire une porte, scindez vos pions arrière (split) et posez un bâtisseur en jan intérieur (slot) pour préparer les futurs tours. |

### Techniques Avancées de Fin de Partie (*Endgame Technique*)

1. **L'Amoeba Play (Jeu de l'Amibe) :**
   * En fin de partie sous contact, étalez vos pions en piles équilibrées de 2 pions sur les points 6, 5, 4 et 3. Cette distribution absorbe n'importe quel tirage de dés sans vous forcer à casser votre structure.
2. **Le Trap Play :**
   * Forcer l'adversaire reclus sur une ancre défensive à détruire son timing avant le vôtre en ralentissant volontairement l'avancée de vos pions.
3. **Le Phantom Point :**
   * Ne pas vider une porte clé trop tôt si l'adversaire peut encore vous frapper depuis la barre.

---

## 4. Masayuki Mochizuki (Mochy) : *Backgammon Masterclass*

**Auteurs :** Masayuki Mochizuki (« Mochy ») & Marc Olsen (2023, Backgammon Galaxy)

Le numéro 1 mondial a modélisé la prise de décision rapide autour de 3 questions fondamentales à poser avant chaque mouvement :

```
          ┌────────────────────────────────────────┐
          │     Les 3 Questions Clés de Mochy      │
          └───────────────────┬────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
   1. LA COURSE?       2. LES JANS?         3. LES ANCRES?
   Qui mène au pip     Qui a le plus de     Ai-je sécurisé le
   count ? Si c'est    portes fermées ?     point 20 ? Si oui,
   vous : fuyez le     Si c'est vous :      le blitz adverse
   contact et courez.  attaquez et slottez. est inoffensif.
```

### La Règle de Duplication de Mochy :
* Lorsque vous devez laisser des pions exposés (blots), arrangez-vous pour que l'adversaire ait besoin du **même chiffre exact** pour accomplir deux tâches (ex: entrer depuis la barre ET vous frapper sur le jan extérieur).

---

## 5. Guide Pratique des Erreurs : Diagnostic & Livre Associé

| Nature de l'Erreur Jouée | Perte typique $\Delta Eq$ | Concept fautif | Ouvrage de référence conseillé |
| :--- | :--- | :--- | :--- |
| **Négligence de la porte 5 d'ouverture** (ex: jouer 24/20 sur 3-1) | -0.165 à -0.180 | Golden Point | *Opening Concepts* (Michy) & *Strategic Concepts* (Tardieu) |
| **Refus de fuir avec Lover's Leap** (jouer 24/18 13/8 sur 6-5) | -0.095 à -0.120 | Course & Échappée | *Backgammon Masterclass* (Mochy & Olsen) |
| **Passivité face à un blitz adverse** (ne pas avancer d'ancre) | -0.110 à -0.150 | Ancre Avancée | *Backgammon Strategic Concepts* (François Tardieu) |
| **Sortie de pion précipitée créant un blot fatal** | -0.150 à -0.300 | Amoeba & Bear-off | *Endgame Technique* (Michy) |
| **Prise de videau sans respect du seuil à DMP** | -0.200 à -0.450 | Théorie du Videau | *Backgammon Masterclass* (Mochy) & *The Doubling Cube* (Woolsey) |

---

## 6. Bibliographie Officielle & Liens d'Acquisition Légale

Pour soutenir les auteurs et étudier les rollouts complets :

1. **François Tardieu :**
   * *Backgammon: Strategic Concepts* (Édité par Stéphane Chenevière)  
   * Boutique : [Backgammon Galaxy Store](https://shop.backgammongalaxy.com/products/backgammon-strategic-concepts-by-francois-tardieu-softcover) & [Roadkill Books](https://backgammonbooks.com/)
2. **Michihito Kageyama (« Michy ») :**
   * *Opening Concepts* (Vol. 1), *Endgame Technique* (Vol. 2), *Back Checker Strategy* (Vol. 3)  
   * Site officiel de l'auteur : [bgmichy.com](https://bgmichy.com/authors)
3. **Masayuki Mochizuki (« Mochy ») :**
   * *Backgammon Masterclass* (avec Marc Olsen)  
   * Boutique : [Backgammon Galaxy](https://shop.backgammongalaxy.com/products/backgammon-masterclass-by-mochy-olsen)  
   * Site officiel de Mochy : [mochybackgammon.com](https://mochybackgammon.com/)
4. **Ressources Gratuites Ouvertes & Règles :**
   * [Deluxe Backgammon Guides PDF](https://www.deluxebackgammon.co.uk/guides/backgammon-documents-in-pdf-format) (Fiches de règles et matrices)
   * [World Backgammon Federation (WBGF)](https://wbgf.info) (Règlements officiels de tournoi)
   * [Backgammon Galore (bkgm.com)](https://www.bkgm.com) (Archive historique mondiale d'articles et d'analyses)
