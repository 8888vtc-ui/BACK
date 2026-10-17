import { TheoryConcept } from './types';

/**
 * Base de données exhaustive de théorie et de données stratégiques de Backgammon.
 * Sources fiables et vérifiées :
 * - Backgammon Galore (Tom Keith, bkgm.com)
 * - Paul Magriel ("Backgammon", la Bible du jeu)
 * - Walter Trice ("Backgammon Boot Camp")
 * - Kit Woolsey ("Backgammon: Pure and Simple", "The Doubling Cube")
 * - Bill Robertie ("Modern Backgammon", "501 Essential Backgammon Problems")
 * - Marc Olsen ("Backgammon Pure Strategy", "From Basics to Badass")
 * - Neil Kazaross (Kazaross-XG2 Match Equity Table, Règle 8912, Neil's Numbers)
 * - Masayuki Mochizuki "Mochy" (Règles d'or, critères de Blitz & Prime vs Prime)
 */
export const KNOWLEDGE_BASE_CONCEPTS: TheoryConcept[] = [
    // -------------------------------------------------------------------------
    // 1. PRINCIPES FONDAMENTAUX (PAUL MAGRIEL)
    // -------------------------------------------------------------------------
    {
        id: 'golden-point',
        slug: 'golden-point',
        category: 'fundamentals',
        title: {
            fr: 'Le Golden Point (Point 5 & Point 20)',
            en: 'The Golden Point (Point 5 & Point 20)',
        },
        author: 'Paul Magriel',
        difficulty: 'beginner',
        tags: ['Point 5', 'Golden Point', 'Ancre', 'Magriel', 'Priorité Absolue'],
        summary: {
            fr: 'La case la plus influente et stratégique du plateau de backgammon pour l’attaque (point 5) et la défense (point 20).',
            en: 'The single most strategically critical point on the backgammon board for both offense (5-pt) and defense (20-pt).',
        },
        keyTakeaway: {
            fr: 'Construire son point 5 ou prendre le point 20 adverse est la priorité stratégique numéro 1 en début de partie.',
            en: 'Making your 5-point or securing the opponent’s 20-point is the #1 strategic priority in the opening.',
        },
        explanation: {
            fr: [
                'Nommé par Paul Magriel dans son livre séminal de 1976, le Golden Point (point 5 du joueur, point 20 de l’adversaire) est la case maîtresse du jan intérieur.',
                'Offensivement, le point 5 bloque l’évasion des pions adverses avec un 4, complémente le point 6 pour amorcer une prime de 6 portes, et sert de base de tir pour frapper dans tout le jan extérieur.',
                'Défensivement (l’ancre d’or sur le 20), il empêche l’adversaire de fermer un barrage complet, garantit un point de retour sûr pour vos pions frappés, et offre une excellente base de contre-attaque sur le jan extérieur adverse.',
            ],
            en: [
                'Named by Paul Magriel in his seminal 1976 work, the Golden Point (your 5-point, opponent’s 20-point) is the cornerstone of inner board play.',
                'Offensively, the 5-point blocks opponent escape rolls of 4, forms a prime foundation alongside the 6-point, and projects attacking power across the board.',
                'Defensively (the 20-point golden anchor), it prevents full opponent primes, gives a reliable reentry sanctuary, and threatens counter-strikes across the outer board.',
            ],
        },
        formulaOrRule: {
            name: 'Hiérarchie des portes intérieures de Magriel',
            formula: 'Point 5 > Point 4 > Point 7 (Bar) > Point 3 > Point 2 > Point 1',
            explanation: {
                fr: 'Le point 5 surpasse toujours le point 4 et le bar-point car il restreint le plus grand nombre de sorties directes adverses.',
                en: 'The 5-point always outranks the 4-point and bar-point because it constrains the highest number of direct escape numbers.',
            },
        },
        practicalExamples: [
            {
                positionDesc: {
                    fr: 'Lancer d’ouverture 3-1 pour les Blancs.',
                    en: 'Opening roll 3-1 for White.',
                },
                bestPlay: '8/5 6/5',
                reasoning: {
                    fr: 'Construit immédiatement le Golden Point (5-pt) sans concéder de faiblesse. C’est le coup le plus fort de tout le livre d’ouverture.',
                    en: 'Immediately makes the 5-point with zero blot exposure. The single highest-equity opening roll in backgammon.',
                },
            },
        ],
        goldenRule: {
            fr: 'Si vous pouvez fabriquer le point 5 sans risque excessif, faites-le quasi-systématiquement.',
            en: 'Whenever you can make the 5-point without catastrophic risk, do so almost unconditionally.',
        },
        sources: [
            {
                title: 'Backgammon (Chapter 4: The Golden Point)',
                author: 'Paul Magriel',
                type: 'book',
                details: 'Quadrangle/The New York Times Book Co., 1976.',
            },
            {
                title: 'The Golden Point and Anchor Play',
                author: 'Tom Keith',
                type: 'website',
                url: 'https://www.bkgm.com/articles/Keith/golden-point.html',
            },
        ],
    },
    {
        id: 'bar-point',
        slug: 'bar-point',
        category: 'fundamentals',
        title: {
            fr: 'Le Bar-Point (Point 7 & Point 18)',
            en: 'The Bar-Point (Point 7 & Point 18)',
        },
        author: 'Paul Magriel',
        difficulty: 'beginner',
        tags: ['Point 7', 'Bar Point', 'Blocage', 'Pont'],
        summary: {
            fr: 'Le point 7 fait la liaison entre le jan intérieur et extérieur. Il bloque le lancer direct de 6 des pions adverses sur la barre ou sur le point 1.',
            en: 'The 7-point bridges the inner and outer boards, blocking direct 6s from the opponent’s 1-point and bar.',
        },
        keyTakeaway: {
            fr: 'Le Bar-point bloque la foulée naturelle de 6 des pions adverses et constitue le verrou de la prime.',
            en: 'The Bar-point blocks the opponent’s natural leap of 6 and locks the exterior shoulder of a prime.',
        },
        explanation: {
            fr: [
                'Le point 7 est situé à exactement 6 pips du point 1 adverse (point 24). Puisque 6 est le plus grand chiffre sur un dé ordinaire, détenir le point 7 empêche un pion adverse en 24 de s’échapper d’un seul coup direct.',
                'En attaque, construire le bar-point avec un lancer 6-1 (13/7 8/7) établit immédiatement le premier pas vers une prime continue.',
            ],
            en: [
                'The 7-point is exactly 6 pips from the opponent’s 1-point (24). Since 6 is the maximum single die roll, holding the 7-point denies a clean direct leap out.',
                'On offense, establishing the bar-point with an opening 6-1 (13/7 8/7) lays the initial cornerstone for a 4-to-6 prime.',
            ],
        },
        practicalExamples: [
            {
                positionDesc: {
                    fr: 'Lancer d’ouverture 6-1.',
                    en: 'Opening roll 6-1.',
                },
                bestPlay: '13/7 8/7',
                reasoning: {
                    fr: 'Fait la porte 7 (bar-point) et empêche les Noirs de s’échapper du point 24 avec un 6.',
                    en: 'Constructs the 7-point, trapping Black’s back checkers from leaping with a 6.',
                },
            },
        ],
        goldenRule: {
            fr: 'Le Bar-point transforme un jan ordinaire en mur infranchissable dès que le point 6 ou 5 est déjà acquis.',
            en: 'The Bar-point turns standard home boards into impenetrable walls when paired with points 6 or 5.',
        },
        sources: [
            {
                title: 'Backgammon (Chapter 5: The Bar-Point)',
                author: 'Paul Magriel',
                type: 'book',
                details: '1976.',
            },
        ],
    },
    {
        id: 'advanced-anchor',
        slug: 'advanced-anchor',
        category: 'fundamentals',
        title: {
            fr: 'Les Ancres Avancées (Points 20, 21, 22)',
            en: 'Advanced Anchors (Points 20, 21, 22)',
        },
        author: 'Paul Magriel & Marc Olsen',
        difficulty: 'intermediate',
        tags: ['Ancre', 'Défense', 'Antidote au Blitz', '20-pt', '21-pt'],
        summary: {
            fr: 'Établir une porte dans le jan intérieur adverse pour neutraliser les attaques blitz et sécuriser une sortie facile.',
            en: 'Securing a point in the opponent’s home board to neutralize blitzes and guarantee safe transitions.',
        },
        keyTakeaway: {
            fr: 'Une ancre avancée (20 ou 21) immunise quasi-totalement contre les gammons et offre un tremplin de contre-attaque.',
            en: 'An advanced anchor (20 or 21) virtually immunizes against gammons and creates an offensive spring-board.',
        },
        explanation: {
            fr: [
                'Rester coincé sur le point 24 (l’ancre de base) expose le joueur à un encerclement progressif et à un blitz dévastateur.',
                'En avançant sur le point 20 (Golden Anchor) ou 21 (Point 4 adverse), vos pions sont à portée de saut immédiat vers le jan extérieur avec des dés moyens (4, 5, 6).',
                'De plus, l’adversaire ne peut plus slotter ou attaquer agressivement sans risquer d’être frappé en retour immédiatement.',
            ],
            en: [
                'Staying trapped on the 24-point leaves you vulnerable to primes and devastating blitz attacks.',
                'Stepping up to the 20-point (Golden Anchor) or 21-point puts your back checkers within easy leaping distance (4, 5, 6) of the outer board.',
                'Moreover, the opponent cannot slot inner board points freely without facing immediate retributive shots.',
            ],
        },
        practicalExamples: [
            {
                positionDesc: {
                    fr: 'L’adversaire a amorcé un blitz avec 2 portes intérieures et frappe l’un de vos pions avec un 5.',
                    en: 'Opponent started a blitz with 2 home points and hits your checker with a 5.',
                },
                bestPlay: 'Rentrer sur le point 20 (avec un 5) ou fabriquer l’ancre dès que possible',
                reasoning: {
                    fr: 'L’ancre avancée détruit la force cinétique du blitz adverse.',
                    en: 'The advanced anchor completely disarms the kinetic momentum of an opponent blitz.',
                },
            },
        ],
        goldenRule: {
            fr: 'Face à un adversaire agressif qui amasse des bâtisseurs, avancez immédiatement votre ancre.',
            en: 'Against an opponent mobilizing builders for an attack, advance your anchor immediately.',
        },
        sources: [
            {
                title: 'Backgammon Pure Strategy (Anchor Hierarchy)',
                author: 'Marc Olsen',
                type: 'book',
                details: '2017.',
            },
        ],
    },
    {
        id: 'duplication',
        slug: 'duplication',
        category: 'fundamentals',
        title: {
            fr: 'Le Principe de Duplication',
            en: 'The Duplication Principle',
        },
        author: 'Paul Magriel',
        difficulty: 'intermediate',
        tags: ['Duplication', 'Probabilités', 'Mathématiques', 'Minimiser les tirs'],
        summary: {
            fr: 'Disposer ses pions vulnérables de sorte que l’adversaire ait besoin du MÊME chiffre pour frapper et pour accomplir une autre tâche essentielle.',
            en: 'Arranging blots so the opponent requires the EXACT SAME die roll to hit as to perform another key task.',
        },
        keyTakeaway: {
            fr: 'Deux blots à 4 cases de distance ne donnent pas 2x plus de tirs : ils partagent les mêmes 11 lancers de 4.',
            en: 'Two blots at 4-pip distance do not give twice the shots: they duplicate the same 11 rolls containing a 4.',
        },
        explanation: {
            fr: [
                'Un dé à six faces offre 36 combinaisons possibles. Si l’adversaire a besoin d’un 3 pour frapper le blot A (11 lancers) et d’un 5 pour frapper le blot B (11 lancers), il a 11 + 11 - 2 = 20 lancers favorables (plus de 55% de chances de frapper !).',
                'Si au contraire vous placez vos deux blots à 3 cases de distance (ou si le coup clé de l’adversaire nécessite aussi un 3), le nombre total de combinaisons dangereuses reste plafonné à 11 lancers.',
                'La duplication s’applique aussi entre frappe et rentrée depuis la barre, ou entre frappe et construction d’une porte clé.',
            ],
            en: [
                'A pair of dice yields 36 combinations. If the opponent needs a 3 to hit blot A (11 rolls) and a 5 to hit blot B (11 rolls), they have 20 hitting rolls (over 55% chance!).',
                'If you duplicate the requirement so that both blots are 3 pips away, the total danger remains capped at only 11 rolls.',
                'Duplication also operates between hitting vs reentering from the bar, or hitting vs making an essential point.',
            ],
        },
        formulaOrRule: {
            name: 'Formule des tirs directs dupliqués',
            formula: 'Tirs Distincts (A ou B) = 11 + 11 - 2 = 20/36 (55.5%) vs Dupliqués = 11/36 (30.5%)',
            explanation: {
                fr: 'Dupliquer réduit le risque de frappe adverse de 55.5% à 30.5% (gain de 25% d’équité !).',
                en: 'Duplicating cuts opponent hitting probability from 55.5% down to 30.5% (a 25% equity gain!).',
            },
        },
        practicalExamples: [
            {
                positionDesc: {
                    fr: 'Vous devez laisser un blot. L’adversaire a déjà besoin d’un 4 pour entrer depuis la barre.',
                    en: 'You must leave a blot. The opponent already needs a 4 to enter from the bar.',
                },
                bestPlay: 'Laisser le blot à distance de 4 direct de l’attaquant',
                reasoning: {
                    fr: 'L’adversaire ne peut pas utiliser son 4 pour frapper ET pour entrer : le 4 est doublement surchargé.',
                    en: 'The opponent cannot use the same 4 to both enter and hit: the 4 is completely overloaded.',
                },
            },
        ],
        goldenRule: {
            fr: 'Quand vous devez vous exposer, offrez des cibles demandant le même numéro que celui dont l’adversaire a déjà impérativement besoin.',
            en: 'When forced to expose a blot, make it require the exact number the opponent desperately needs elsewhere.',
        },
        sources: [
            {
                title: 'Backgammon (Chapter 9: Duplication and Diversification)',
                author: 'Paul Magriel',
                type: 'book',
                details: '1976.',
            },
            {
                title: 'Duplication in Backgammon',
                author: 'Kit Woolsey',
                type: 'website',
                url: 'https://www.bkgm.com/articles/Woolsey/duplication.html',
            },
        ],
    },
    {
        id: 'pure-play',
        slug: 'pure-play',
        category: 'fundamentals',
        title: {
            fr: 'Le Jeu Pur (Pure Play) vs Fausse Sécurité',
            en: 'Pure Play vs False Safety',
        },
        author: 'Paul Magriel & Marc Olsen',
        difficulty: 'advanced',
        tags: ['Pure Play', 'Structure', 'Qualité des points', 'Courage stratégique'],
        summary: {
            fr: 'Privilégier la perfection de la structure et le contrôle des cases nobles, quitte à risquer un tir calculé, plutôt que d’entasser les pions passivement.',
            en: 'Prioritizing sound structure and prime construction over timid safety plays that ruin checker flexibility.',
        },
        keyTakeaway: {
            fr: 'Empiler 5 pions sur la porte 6 ou 8 pour "ne pas se faire taper" détruit vos chances de gain à moyen terme.',
            en: 'Piling 5 checkers on the 6 or 8-point out of fear ruins your long-term winning chances.',
        },
        explanation: {
            fr: [
                'Les débutants sacrifient souvent leur jeu pour éviter un blot immédiat, finissant avec des piles mortes sur les points 6 et 8.',
                'Le jeu pur consiste à placer les bâtisseurs exactement là où ils construisent des portes idéales (points 4, 5, 7), en calculant le risque réel.',
                'Si l’adversaire n’a pas de jan intérieur fort (0 ou 1 porte), se faire frapper ne coûte que quelques pips, alors que réussir son jeu pur gagne la partie.',
            ],
            en: [
                'Beginners frequently ruin their position to avoid an immediate shot, leaving dead stacks on points 6 and 8.',
                'Pure play deploys builders precisely where they threaten optimal prime points (4, 5, 7), accepting quantified risk.',
                'If the opponent holds a weak home board (0-1 points), getting hit only costs a few pips, whereas completing a prime wins the game.',
            ],
        },
        practicalExamples: [
            {
                positionDesc: {
                    fr: 'L’adversaire a 2 pions sur la barre et 1 seule porte fermée. Vous jouez 5-2.',
                    en: 'Opponent has 2 checkers on the bar and only 1 home point closed. You roll 5-2.',
                },
                bestPlay: 'Slotter le point 5 ou 4 (ex: 13/8 6/4) au lieu d’un coup passif 13/8 8/6',
                reasoning: {
                    fr: 'La punition en cas de frappe est minime, mais fabriquer la porte suivante au tour suivant scelle la victoire.',
                    en: 'The penalty if hit is negligible, but closing the next home point next turn seals the win.',
                },
            },
        ],
        goldenRule: {
            fr: 'Jouez pour construire la position gagnante, pas simplement pour survivre au tour courant.',
            en: 'Play to construct the winning structure, not merely to survive the current turn.',
        },
        sources: [
            {
                title: 'Backgammon: Pure Strategy',
                author: 'Marc Olsen',
                type: 'book',
                details: '2017.',
            },
        ],
    },
    {
        id: 'tempo-hit',
        slug: 'tempo-hit',
        category: 'fundamentals',
        title: {
            fr: 'Le Coup de Tempo (Tempo Hit)',
            en: 'The Tempo Hit',
        },
        author: 'Kit Woolsey & Paul Magriel',
        difficulty: 'intermediate',
        tags: ['Tempo', 'Frappe en jan', 'Perturbation', 'Attaque'],
        summary: {
            fr: 'Frapper un pion adverse dans son propre jan intérieur, même au prix d’un blot laissé exposé, pour priver l’adversaire de la moitié de son prochain tour.',
            en: 'Hitting an opponent blot in your home board, even leaving a return blot, to rob half their next turn.',
        },
        keyTakeaway: {
            fr: 'Un pion envoyé sur la barre force l’adversaire à dépenser un dé entier rien que pour entrer.',
            en: 'A checker sent to the bar forces the opponent to spend a full die just to reenter.',
        },
        explanation: {
            fr: [
                'Quand l’adversaire menace de faire une porte majeure ou d’attaquer vos pions au tour suivant, un coup de tempo brise son élan.',
                'L’adversaire doit utiliser l’un de ses deux dés pour entrer, ce qui divise par deux sa capacité d’action sur le reste du plateau.',
                'Même si l’adversaire vous frappe en retour depuis la barre, il a perdu l’opportunité de consolider sa position maîtresse.',
            ],
            en: [
                'When the opponent is poised to make a key point or launch a lethal blitz, a tempo hit disrupts their timing.',
                'The opponent must spend one die entering, cutting their effective mobility on the rest of the board in half.',
                'Even if they hit you back from the bar, they have missed their window to consolidate their primary strategic goal.',
            ],
        },
        practicalExamples: [
            {
                positionDesc: {
                    fr: 'L’adversaire a split ses pions sur votre point 2 et menace de faire une ancre avancée. Vous jouez un coup qui peut frapper sur le 2.',
                    en: 'Opponent split to your 2-point and threatens an anchor. You roll a number that can hit on the 2.',
                },
                bestPlay: 'Frapper sur le point 2 (coup de tempo)',
                reasoning: {
                    fr: 'Empêche l’adversaire de convertir son blot en ancre et l’oblige à recommencer depuis la barre.',
                    en: 'Denies the opponent an anchor and forces them to reenter from square one.',
                },
            },
        ],
        goldenRule: {
            fr: 'Quand l’adversaire menace une action dévastatrice, frappez en tempo pour lui voler la moitié de son tour.',
            en: 'When the opponent threatens a devastating play, hit in tempo to steal half their roll.',
        },
        sources: [
            {
                title: 'Backgammon: Pure and Simple',
                author: 'Kit Woolsey',
                type: 'book',
                details: '1987.',
            },
        ],
    },

    // -------------------------------------------------------------------------
    // 2. LES 5 PLANS DE JEU MAJEURS (BILL ROBERTIE & MARC OLSEN)
    // -------------------------------------------------------------------------
    {
        id: 'running-game',
        slug: 'running-game',
        category: 'game-plans',
        title: {
            fr: 'La Course Pure (Running Game)',
            en: 'The Running Game',
        },
        author: 'Walter Trice & Bill Robertie',
        difficulty: 'beginner',
        tags: ['Course', 'Pip Count', 'Désengagement', 'Plans de jeu'],
        summary: {
            fr: 'Désengager tous ses pions sans contact et courir vers la victoire lorsque l’on mène nettement au pip count.',
            en: 'Disengaging all checkers past contact to convert a substantial pip count lead into victory.',
        },
        keyTakeaway: {
            fr: 'Si vous menez la course de plus de 10% du pip count total, brisez le contact et courez.',
            en: 'If you lead the race by more than 10% of total pips, break contact and run.',
        },
        explanation: {
            fr: [
                'La course pure survient lorsque les pions des deux joueurs se sont croisés et qu’aucun contact physique ou frappe n’est plus possible.',
                'Le plan de course se décide avant la fin du contact : si vous menez au score de pips (Pip Count), votre intérêt absolu est de courir et de refuser la bagarre.',
                'À l’inverse, si vous êtes en retard au pip count, vous devez conserver le contact à tout prix (garder une ancre ou un barrage).',
            ],
            en: [
                'A pure race begins once checkers have disengaged and no further contact or hitting can occur.',
                'The racing plan is chosen while contact remains: if you lead significantly in pips, simplify and run.',
                'Conversely, if trailing in the race, you must preserve contact at all costs (maintaining anchors or primes).',
            ],
        },
        formulaOrRule: {
            name: 'Règle des 8-10% pour la course',
            formula: 'Avance Requise = Pip Count Total × 0.08 à 0.10',
            explanation: {
                fr: 'À 120 pips, une avance de 10-12 pips justifie de rompre le contact pour passer en course pure.',
                en: 'At 120 pips, a 10-12 pip lead fully justifies breaking contact to enter a pure race.',
            },
        },
        practicalExamples: [
            {
                positionDesc: {
                    fr: 'Vous menez 110 contre 128 pips. Vous avez un 6-5 avec une ancre sur le point 20 adverse.',
                    en: 'You lead 110 to 128 pips. You roll 6-5 with an anchor on the opponent’s 20-point.',
                },
                bestPlay: '20/15 20/14 (Évacuer l’ancre et courir)',
                reasoning: {
                    fr: 'Votre avance de 18 pips est décisive en course. Conserver l’ancre ne ferait que risquer de vous faire coincer.',
                    en: 'Your 18-pip lead is decisive in a race. Holding the anchor only risks being primed.',
                },
            },
        ],
        goldenRule: {
            fr: 'En avance de course : courez et simplifiez. En retard de course : bloquez et cherchez le contact.',
            en: 'Ahead in the race: run and simplify. Behind in the race: maintain contact and block.',
        },
        sources: [
            {
                title: 'Backgammon Boot Camp (Chapter 7: The Running Game)',
                author: 'Walter Trice',
                type: 'book',
                details: 'Fortress Publishing, 2004.',
            },
        ],
    },
    {
        id: 'holding-game',
        slug: 'holding-game',
        category: 'game-plans',
        title: {
            fr: 'Le Jeu de Blocage (Holding Game)',
            en: 'The Holding Game',
        },
        author: 'Bill Robertie',
        difficulty: 'intermediate',
        tags: ['Holding Game', 'Ancre 20', 'Ancre 18', 'Timing de frappe'],
        summary: {
            fr: 'Conserver une ancre avancée (idéalement le 20 ou 18 adverse) pour intercepter l’adversaire lors de son retour au bercail.',
            en: 'Maintaining a strategic anchor (ideally the 20 or 18-pt) to ambush the opponent during their home-run clearing.',
        },
        keyTakeaway: {
            fr: 'L’ancre de holding game attend patiemment que l’adversaire laisse un tir forcé lors du démantèlement de ses portes extérieures.',
            en: 'The holding anchor waits patiently for the opponent to leave a forced blot while clearing outer points.',
        },
        explanation: {
            fr: [
                'Le holding game est le plan par excellence lorsque l’on accuse un retard modéré de course (10 à 30 pips) mais que l’on détient une ancre solide.',
                'Les meilleures ancres sont le point 20 (Golden Point) et le point 18 (Bar-point adverse).',
                'Pendant que l’adversaire ramène ses pions, il est souvent forcé de laisser un tir lorsqu’il dégage ses points 13, 8 ou 7. Si vous le frappez alors que votre jan intérieur est solide, vous remportez la partie.',
            ],
            en: [
                'The holding game is the premier strategy when facing a moderate racing deficit (10-30 pips) while holding a strong anchor.',
                'The supreme anchors are the 20-point (Golden Anchor) and 18-point (opponent bar-point).',
                'As the opponent clears points 13, 8, or 7, awkward rolls frequently force a blot. Hitting it against a sturdy home board turns the game into an instant win.',
            ],
        },
        practicalExamples: [
            {
                positionDesc: {
                    fr: 'Vous avez l’ancre sur le 20 adverse et 15 pips de retard. L’adversaire a vidé son point 13 et doit vider son point 8.',
                    en: 'You hold the 20-point anchor trailing by 15 pips. Opponent cleared the 13-point and must clear the 8-point.',
                },
                bestPlay: 'Conserver l’ancre sur le 20 intacte et renforcer son jan intérieur',
                reasoning: {
                    fr: 'Ne cassez jamais votre ancre tant que l’adversaire n’a pas franchi la zone de tir en toute sécurité.',
                    en: 'Never abandon your anchor until the opponent has safely cleared past your striking range.',
                },
            },
        ],
        goldenRule: {
            fr: 'Dans un holding game, construisez votre jan intérieur pour que chaque tir futur soit immédiatement fatal à l’adversaire.',
            en: 'In a holding game, build your home board so that any future hit proves immediately fatal.',
        },
        sources: [
            {
                title: 'Modern Backgammon',
                author: 'Bill Robertie',
                type: 'book',
                details: '2001.',
            },
        ],
    },
    {
        id: 'prime-vs-prime',
        slug: 'prime-vs-prime',
        category: 'game-plans',
        title: {
            fr: 'Prime contre Prime (Prime vs Prime & Timing)',
            en: 'Prime vs Prime & Timing Battles',
        },
        author: 'Masayuki Mochizuki (Mochy) & Marc Olsen',
        difficulty: 'advanced',
        tags: ['Prime vs Prime', 'Timing', 'Mochy', 'Barrage de 6', 'Craquage'],
        summary: {
            fr: 'La guerre d’usure ultime : deux primes se font face. Le joueur dont la structure craque le premier perd la partie.',
            en: 'The ultimate war of attrition: two primes clash. The player whose timing collapses first loses.',
        },
        keyTakeaway: {
            fr: 'Dans une guerre de primes, avoir du timing (pions de réserve capables de bouger sans casser la prime) est la clé de la victoire.',
            en: 'In a prime vs prime battle, timing (reserve checkers that can move without cracking the prime) dictates the victor.',
        },
        explanation: {
            fr: [
                'Quand les deux joueurs ont enfermé les pions adverses derrière une prime de 4, 5 ou 6 portes, aucun pion arrière ne peut bouger.',
                'Chaque tour se résume alors à déplacer les pions d’avant. Dès qu’un joueur n’a plus de coups d’attente légaux, il est contraint d’ouvrir sa propre prime : c’est le "craquage" (crunching).',
                'Selon Mochy (#1 mondial), pour évaluer qui a le meilleur timing, comptez le nombre de coups d’attente disponibles avant d’être forcé de détruire une porte maîtresse.',
            ],
            en: [
                'When both players trap enemy checkers behind a 4, 5, or 6-prime, back checkers are completely paralyzed.',
                'Each turn forces forward checker movement. Once a player runs out of spare waiting moves, they must dismantle their own prime—this is "crunching".',
                'According to Mochy (#1 world Giant), evaluate timing by counting viable spare moves before an essential prime point must be broken.',
            ],
        },
        formulaOrRule: {
            name: 'Règle du timing de Mochy',
            formula: 'Meilleur timing = Nombre de bâtisseurs mobiles en réserve + Pions coincés profondément',
            explanation: {
                fr: 'Plus vos pions sont en arrière et plus vous avez de constructeurs sur les points 8, 7, 6, plus votre prime tiendra longtemps.',
                en: 'Checkers positioned further back and spare builders on 8, 7, 6 extend prime survival duration.',
            },
        },
        practicalExamples: [
            {
                positionDesc: {
                    fr: 'Guerre de prime 5 contre 5. Vous devez jouer 2-1.',
                    en: '5-prime vs 5-prime battle. You must play 2-1.',
                },
                bestPlay: 'Jouer un pion de réserve sur le jan extérieur sans toucher aux 5 portes de la prime',
                reasoning: {
                    fr: 'Préserver l’intégrité des 5 portes à tout prix jusqu’à ce que l’adversaire craque le premier.',
                    en: 'Preserve all 5 prime points at all costs until the opponent is forced to break first.',
                },
            },
        ],
        goldenRule: {
            fr: 'Dans un Prime vs Prime, ralentissez votre jeu au maximum : chaque pips gaspillé vers l’avant rapproche votre prime du précipice.',
            en: 'In a Prime vs Prime, slow down as much as possible: every pip rushed forward brings your prime closer to collapse.',
        },
        sources: [
            {
                title: 'Mochy’s Backgammon Theory: Prime vs Prime Battles',
                author: 'Masayuki Mochizuki',
                type: 'article',
                url: 'https://www.bkgm.com/articles/Mochizuki/prime-vs-prime.html',
            },
        ],
    },
    {
        id: 'blitz-attack',
        slug: 'blitz-attack',
        category: 'game-plans',
        title: {
            fr: 'L’Attaque Éclair (The Blitz)',
            en: 'The Blitz Attack',
        },
        author: 'Marc Olsen & Paul Magriel',
        difficulty: 'intermediate',
        tags: ['Blitz', 'Attaque', 'Closeout', 'Gammon', 'Pression'],
        summary: {
            fr: 'Attaquer férocement dans son jan intérieur pour enfermer 2 pions ou plus sur la barre et fermer les 6 portes (close-out).',
            en: 'Relentlessly attacking inside your home board to trap 2+ opponent checkers on the bar and achieve a close-out.',
        },
        keyTakeaway: {
            fr: 'Le Blitz réussit quand l’attaquant possède au moins 2 portes intérieures et une supériorité nette de bâtisseurs.',
            en: 'A Blitz thrives when holding at least 2 home points and a decisive builder advantage.',
        },
        explanation: {
            fr: [
                'Le blitz est le plan le plus violent du backgammon et la principale source de victoires par gammon.',
                'Il nécessite 3 conditions selon Marc Olsen : (1) L’adversaire a au moins 1 pion sur la barre ou un blot en jan, (2) L’attaquant dispose d’au moins 9 ou 10 pions dans la zone d’attaque (points 1 à 11), (3) L’adversaire n’a pas d’ancre avancée.',
                'Pendant un blitz, la valeur d’un blot importe peu : le seul objectif est d’empêcher l’adversaire d’entrer.',
            ],
            en: [
                'The blitz is backgammon’s most lethal plan and the primary generator of gammon wins.',
                'Marc Olsen identifies 3 conditions: (1) Opponent has a checker on the bar or loose in home board, (2) Attacker commands 9-10 checkers in the attack zone (points 1-11), (3) Opponent lacks an advanced anchor.',
                'During a blitz, loose return blots matter little: the sole goal is denying the opponent reentry.',
            ],
        },
        practicalExamples: [
            {
                positionDesc: {
                    fr: 'L’adversaire est sur la barre. Vous avez fermé les points 6, 5 et 4. Vous jouez 3-1.',
                    en: 'Opponent on the bar. You hold points 6, 5, 4. You roll 3-1.',
                },
                bestPlay: '6/3* 4/3 ou attaquer sur le point 3 pour fermer une 4ème porte',
                reasoning: {
                    fr: 'Fermer une 4ème porte réduit les chances d’entrée de l’adversaire à seulement 2 chiffres sur 6 (33%).',
                    en: 'Making a 4th home point drops opponent reentry chances down to just 2 numbers out of 6 (33%).',
                },
            },
        ],
        goldenRule: {
            fr: 'Si vous blittez, n’hésitez pas : attaquez chaque tour tant que l’adversaire n’a pas d’ancre.',
            en: 'When blitzing, do not hesitate: strike every turn until the opponent establishes an anchor.',
        },
        sources: [
            {
                title: 'From Basics to Badass (The Blitz Chapter)',
                author: 'Marc Olsen',
                type: 'book',
                details: '2015.',
            },
        ],
    },
    {
        id: 'back-game',
        slug: 'back-game',
        category: 'game-plans',
        title: {
            fr: 'Le Back Game (Jeu Arrière)',
            en: 'The Back Game',
        },
        author: 'Bill Robertie & Walter Trice',
        difficulty: 'master',
        tags: ['Back Game', 'Double Ancre', 'Timing', 'Déficit de course', 'Stratégie Complexe'],
        summary: {
            fr: 'Stratégie de dernier recours : détenir 2 ancres profondes dans le jan adverse avec un retard massif de pips pour renverser la partie en toute fin.',
            en: 'Last-resort strategy: holding 2 deep anchors in the enemy home board with massive pip deficit to strike at the finish line.',
        },
        keyTakeaway: {
            fr: 'Un Back Game requiert impérativement 2 ancres (ex: 1-2 ou 1-3) et au moins 50 à 80 pips de retard pour fonctionner.',
            en: 'A viable Back Game strictly demands 2 anchors (e.g. 1-2 or 1-3) and at least 50-80 pips of deficit.',
        },
        explanation: {
            fr: [
                'Le Back Game est l’une des stratégies les plus spectaculaires et difficiles du backgammon.',
                'Critères impératifs de Robertie : (1) Détenir 2 ancres dans le jan adverse (les meilleures sont 1-2, 1-3 et 2-3), (2) Avoir un retard de 50 à 100 pips (sans ce retard, vos pions avant vont craquer trop tôt), (3) Construire une prime devant son propre jan.',
                'Le moment de vérité survient quand l’adversaire commence à sortir ses pions et doit exposer un blot : la frappe depuis l’une des ancres retourne alors la partie de manière irréversible.',
            ],
            en: [
                'The Back Game is one of backgammon’s most complex, double-edged strategies.',
                'Robertie’s golden criteria: (1) Hold 2 anchors in the enemy home board (best: 1-2, 1-3, 2-3), (2) Trail by 50-100 pips (without this deficit, your forward points crunch too soon), (3) Build a solid home prime.',
                'The climax happens when the opponent bears off and is forced to leave a blot: hitting from your anchor flips the game permanently.',
            ],
        },
        practicalExamples: [
            {
                positionDesc: {
                    fr: 'Vous avez 65 pips de retard avec les ancres sur les points 1 et 3 adverses.',
                    en: 'You trail by 65 pips holding the 1 and 3 points in opponent home board.',
                },
                bestPlay: 'Recycler des pions pour ralentir son propre timing et construire une prime fermée sur ses points 5, 6, 7',
                reasoning: {
                    fr: 'Le timing est l’oxygène du Back Game : si vous craquez avant que l’adversaire n’expose un blot, vous perdez par gammon.',
                    en: 'Timing is the oxygen of a Back Game: if your front collapses before the opponent blunders, you lose a gammon.',
                },
            },
        ],
        goldenRule: {
            fr: 'Ne jouez un Back Game que si vous possédez DEUX ancres et au moins 50 pips de retard. Une seule ancre n’est PAS un back game !',
            en: 'Never play a Back Game without TWO anchors and at least 50 pips of deficit. One anchor is NOT a back game!',
        },
        sources: [
            {
                title: 'Modern Backgammon (Vol. 2: The Back Game)',
                author: 'Bill Robertie',
                type: 'book',
                details: '2001.',
            },
            {
                title: 'Back Game Timing & Viability',
                author: 'Walter Trice',
                type: 'article',
                url: 'https://www.bkgm.com/articles/Trice/back-game.html',
            },
        ],
    },

    // -------------------------------------------------------------------------
    // 3. THÉORIE DU VIDEAU & MATHÉMATIQUES (KIT WOOLSEY & MARC OLSEN)
    // -------------------------------------------------------------------------
    {
        id: 'take-point',
        slug: 'take-point',
        category: 'cube-theory',
        title: {
            fr: 'Calcul du Take Point (Point d’Acceptation du Videau)',
            en: 'Take Point Calculation (The 25% Rule)',
        },
        author: 'Kit Woolsey & Marc Olsen',
        difficulty: 'intermediate',
        tags: ['Videau', 'Take Point', '25%', 'Mathématiques', 'Cote'],
        summary: {
            fr: 'La cote mathématique exacte requise pour accepter un double adverse en partie d’argent (25% de chances de gain).',
            en: 'The exact mathematical break-even equity threshold required to accept a double in money play (25% win chance).',
        },
        keyTakeaway: {
            fr: 'En partie d’argent sans gammon : si vos chances de victoire dépassent 25%, vous DEVEZ accepter (Take).',
            en: 'In money play without gammons: if your winning chances exceed 25%, you MUST take.',
        },
        explanation: {
            fr: [
                'Si vous passez (Drop), vous perdez 1 point certain (-1.000 d’équité).',
                'Si vous acceptez (Take), vous jouez pour 2 points : en gagnant 25% du temps (+2 pts) et en perdant 75% du temps (-2 pts), votre espérance est de (0.25 × +2) + (0.75 × -2) = +0.50 - 1.50 = -1.00 point.',
                'Le seuil d’indifférence mathématique est donc rigoureusement 25%.',
                'Dès que vous avez 26% de chances de victoire, accepter rapporte plus sur le long terme que de concéder immédiatement le point.',
            ],
            en: [
                'If you drop, you lose exactly 1 point (-1.000 equity).',
                'If you take, you play for 2 points: winning 25% of the time (+2 pts) and losing 75% (-2 pts) gives an expected value of (0.25 × 2) + (0.75 × -2) = -1.00 point.',
                'The mathematical break-even point is therefore strictly 25%.',
                'At 26% winning chances, taking yields higher expected return over time than surrendering the point.',
            ],
        },
        formulaOrRule: {
            name: 'Formule fondamentale du Take Point',
            formula: 'Take Point = Risque / (Risque + Gain) = 1 / (1 + 3) = 25.0%',
            explanation: {
                fr: 'En match play, cette valeur s’ajuste selon les scores via la Match Equity Table (MET).',
                en: 'In match play, this threshold shifts based on score via the Match Equity Table (MET).',
            },
        },
        practicalExamples: [
            {
                positionDesc: {
                    fr: 'Course pure, vous avez 28% de chances d’emporter la course. L’adversaire double.',
                    en: 'Pure race, you hold 28% winning chances. Opponent doubles.',
                },
                bestPlay: 'TAKE (Accepter le videau)',
                reasoning: {
                    fr: '28% est supérieur au Take Point de 25%. Passer concéderait 0.06 pt d’équité par coup.',
                    en: '28% comfortably exceeds the 25% threshold. Dropping surrenders 0.06 pts in equity blunder.',
                },
            },
        ],
        goldenRule: {
            fr: 'Si vous avez 1 chance sur 4 de l’emporter, dites "OUI" au videau.',
            en: 'If you have a 1-in-4 shot at victory, say "TAKE" to the cube.',
        },
        sources: [
            {
                title: 'The Doubling Cube in Backgammon',
                author: 'Kit Woolsey',
                type: 'book',
                details: '1992.',
            },
            {
                title: 'Backgammon Galore Cube Mathematics',
                author: 'Tom Keith',
                type: 'website',
                url: 'https://www.bkgm.com/articles/cube.html',
            },
        ],
    },
    {
        id: 'woolsey-law',
        slug: 'woolsey-law',
        category: 'cube-theory',
        title: {
            fr: 'La Loi de Woolsey pour le Videau',
            en: 'Woolsey’s Law for Doubling',
        },
        author: 'Kit Woolsey',
        difficulty: 'intermediate',
        tags: ['Loi de Woolsey', 'Psychologie', 'Videau', 'Pression'],
        summary: {
            fr: '"Si vous hésitez sérieusement entre Take et Pass pour votre adversaire, alors vous DEVEZ doubler immédiatement."',
            en: '"If you are in doubt whether a position is a take or a pass, it is always a double."',
        },
        keyTakeaway: {
            fr: 'Si le choix de l’adversaire est difficile, doubler le force à prendre une décision sous pression.',
            en: 'If the opponent’s decision is agonized, doubling forces them into high-stakes error territory.',
        },
        explanation: {
            fr: [
                'Formulée par le Grand-Maître Kit Woolsey, cette maxime est la plus célèbre de toute la théorie du videau.',
                'Le raisonnement est d’une logique implacable : si la position est tellement forte que vous vous demandez si l’adversaire doit passer, c’est que votre avantage est immense.',
                'Si l’adversaire accepte à tort un Pass, vous gagnez 2 points au lieu de 1. S’il passe à tort un Take, vous empochez immédiatement le gain sans courir le moindre risque de retournement.',
            ],
            en: [
                'Coined by Grandmaster Kit Woolsey, this rule is the cornerstone of practical cube handling.',
                'The logic is razor-sharp: if the position is so formidable that you wonder if they should pass, your advantage is massive.',
                'If the opponent mistakenly takes a pass, you collect 2 points. If they mistakenly drop a take, you lock in an instant point with zero counterplay risk.',
            ],
        },
        practicalExamples: [
            {
                positionDesc: {
                    fr: 'Vous venez de frapper un blot adverse et avez 3 portes intérieures fermées. Vous hésitez à doubler.',
                    en: 'You hit an opponent blot and command 3 closed home points. You hesitate to double.',
                },
                bestPlay: 'DOUBLE immédiat selon la loi de Woolsey',
                reasoning: {
                    fr: 'Tout tour favorable suivant (ex: faire une 4ème porte) créera une perte de marché totale où l’adversaire passera.',
                    en: 'Any favorable roll next turn (e.g. 4th point) creates a total market loser where the opponent drops.',
                },
            },
        ],
        goldenRule: {
            fr: 'Dans le doute sur le Pass adverse : DOUBLEZ toujours !',
            en: 'When in doubt about the opponent’s pass: always DOUBLE!',
        },
        sources: [
            {
                title: 'Woolsey’s Law',
                author: 'Kit Woolsey',
                type: 'article',
                url: 'https://www.bkgm.com/articles/Woolsey/woolseys-law.html',
            },
        ],
    },
    {
        id: 'market-loss',
        slug: 'market-loss',
        category: 'cube-theory',
        title: {
            fr: 'Perte de Marché & Volatilité (Market Losers)',
            en: 'Market Loss & Volatility',
        },
        author: 'Marc Olsen',
        difficulty: 'advanced',
        tags: ['Perte de Marché', 'Volatilité', 'Timing de double', 'XG Analysis'],
        summary: {
            fr: 'Identifier les lancers qui améliorent tellement votre position au tour suivant que l’adversaire passera instantanément le videau.',
            en: 'Identifying rolls next turn that improve your position so drastically that the opponent will instantly drop.',
        },
        keyTakeaway: {
            fr: 'Une position volatile avec de nombreux "market losers" doit être doublée immédiatement avant que le marché ne disparaisse.',
            en: 'A volatile position with numerous market losers must be doubled before the window slams shut.',
        },
        explanation: {
            fr: [
                'On appelle "Market Loser" un lancer du joueur qui transforme une position où l’adversaire aurait pu accepter le videau (Take) en une position où l’adversaire doit impérativement abandonner (Pass).',
                'Si vous ne doublez pas avant ce coup, vous perdez 1 point complet de gain potentiel (vous ne gagnerez que 1 pt au lieu de 2 pts).',
                'Plus une position a de volatilité (menaces de frappe, de fermeture de prime ou de blitz), plus vous devez doubler tôt.',
            ],
            en: [
                'A "Market Loser" is a roll that converts a position the opponent could have taken into an undisputed pass.',
                'If you fail to double beforehand, you permanently lose 1 full point of potential profit (cashing 1 pt instead of 2).',
                'The higher the volatility (threats of hitting, prime extension, or blitz closeout), the earlier you must ship the cube.',
            ],
        },
        practicalExamples: [
            {
                positionDesc: {
                    fr: 'L’adversaire a un blot exposé dans votre jan. 17 lancers sur 36 vous permettent de frapper et fermer une porte.',
                    en: 'Opponent has a loose blot in your board. 17 rolls out of 36 hit and make a point.',
                },
                bestPlay: 'DOUBLE immédiat',
                reasoning: {
                    fr: '17 lancers sont des market losers complets. Attendre un tour de plus est un blunder magistral.',
                    en: '17 rolls are decisive market losers. Waiting an additional turn is a massive blunder.',
                },
            },
        ],
        goldenRule: {
            fr: 'Doublez au sommet de votre menace, pas après sa réalisation.',
            en: 'Double at the apex of your threat, not after its realization.',
        },
        sources: [
            {
                title: 'Backgammon Pure Strategy (Chapter on Volatility)',
                author: 'Marc Olsen',
                type: 'book',
                details: '2017.',
            },
        ],
    },

    // -------------------------------------------------------------------------
    // 4. COURSE, EPC & SORTIE (WALTER TRICE & NEIL KAZAROSS)
    // -------------------------------------------------------------------------
    {
        id: 'trice-epc',
        slug: 'trice-epc',
        category: 'race-bearoff',
        title: {
            fr: 'L’Effective Pip Count (EPC) de Walter Trice',
            en: 'Walter Trice’s Effective Pip Count (EPC)',
        },
        author: 'Walter Trice',
        difficulty: 'advanced',
        tags: ['EPC', 'Walter Trice', 'Course', 'Wastage', 'Gaspillage'],
        summary: {
            fr: 'La méthode universelle pour corriger le pip count brut en mesurant le gaspillage (wastage) des points bas.',
            en: 'The universal mathematical standard correcting raw pip counts by accounting for low-point wastage.',
        },
        keyTakeaway: {
            fr: 'Avoir des pions empilés sur les points 1 et 2 gaspille des pips lors du lancer de 5 et 6. L’EPC mesure la course réelle.',
            en: 'Stacking checkers on points 1 and 2 wastes pips when rolling 5s and 6s. EPC quantifies true racing distance.',
        },
        explanation: {
            fr: [
                'Le pip count brut additionne simplement la distance de chaque pion. Mais lors de la sortie (bear-off), obtenir un 6 pour sortir un pion sur le point 1 gaspille 5 pips complets ! C’est le "wastage" (gaspillage de pips).',
                'Le mathématicien Walter Trice a démontré que le nombre effectif de pips (EPC) correspond au nombre moyen de lancers nécessaires multiplié par 7 (moyenne d’un lancer de 2 dés = 7 pips) + 1.',
                'Pour une position bien distribuée sans sur-empilement, l’EPC moyen d’un joueur avec n pions restants est approximativement : EPC = Pips + (Pions restants × 1.3 à 2.0).',
            ],
            en: [
                'Raw pip count merely sums checker distances. But during bear-off, rolling a 6 to bear off a 1-point checker wastes 5 pips! This is "wastage".',
                'Walter Trice proved Effective Pip Count (EPC) equals average rolls needed times 7 (the expectation of two dice) + 1.',
                'For well-distributed home boards, standard EPC formula: EPC = Raw Pips + Wastage (~1.5-2.0 pips per remaining checker).',
            ],
        },
        formulaOrRule: {
            name: 'Formule de Trice pour le Bear-off pur',
            formula: 'EPC ≈ Raw Pips + (Checkers in Home Board × 1.5) + Pénalité d’empilement (points 1 & 2)',
            explanation: {
                fr: 'Une position avec 4 pions sur le point 1 a un gaspillage massif comparé à 4 pions distribués sur 4, 3, 2, 1.',
                en: 'A position with 4 checkers on the 1-point incurs massive wastage compared to smooth distribution on 4, 3, 2, 1.',
            },
        },
        practicalExamples: [
            {
                positionDesc: {
                    fr: 'Joueur A : 40 pips (bien étalés). Joueur B : 38 pips (mais 6 pions empilés sur le point 1).',
                    en: 'Player A: 40 pips (well distributed). Player B: 38 pips (but 6 checkers crammed on the 1-pt).',
                },
                bestPlay: 'Joueur A mène en réalité la course d’environ 3 EPC malgré un pip count facialement supérieur !',
                reasoning: {
                    fr: 'Les 6 pions sur le 1 gaspillent jusqu’à 10 pips réels lors des gros lancers.',
                    en: 'The 6 checkers on the 1-point will waste up to 10 actual pips on high rolls.',
                },
            },
        ],
        goldenRule: {
            fr: 'Ne vous fiez jamais au pip count brut en fin de partie : comptez le gaspillage des points bas.',
            en: 'Never trust raw pip count in the endgame: always factor low-point wastage into your EPC.',
        },
        sources: [
            {
                title: 'Backgammon Boot Camp (Chapter 14: Effective Pip Count)',
                author: 'Walter Trice',
                type: 'book',
                details: '2004.',
            },
        ],
    },
    {
        id: 'kazaross-8912',
        slug: 'kazaross-8912',
        category: 'race-bearoff',
        title: {
            fr: 'La Règle 8912 de Neil Kazaross',
            en: 'The Kazaross 8912 Rule for Contact Bear-Off',
        },
        author: 'Neil Kazaross',
        difficulty: 'master',
        tags: ['Kazaross', '8912', 'Sortie sous contact', 'Bear-off', 'Ancre 20'],
        summary: {
            fr: 'La règle mathématique suprême pour savoir quand doubler et quand accepter lors de la sortie face à une ancre adverse sur le point 20.',
            en: 'The benchmark mathematical formula governing cube decisions when bearing off against an opponent 20-point anchor.',
        },
        keyTakeaway: {
            fr: 'Permet de calculer au pip près la frontière exacte de Redouble et de Take face à une ancre de holding game.',
            en: 'Calculates the exact pip boundaries for redoubles and takes against an enemy holding anchor.',
        },
        explanation: {
            fr: [
                'Développée par Neil Kazaross (l’un des plus grands théoriciens modernes du jeu), la règle 8912 analyse la situation très fréquente où le joueur sort ses pions face à une ancre adverse sur le point 20.',
                'Les chiffres 8, 9, 12 représentent les seuils de sécurité de pips ajustés nécessaires pour : (8) Doubler de façon limite, (9) Doubler avec un take évident, (12) Entrer dans la zone de Passe.',
            ],
            en: [
                'Formulated by Neil Kazaross, the 8912 rule governs the prevalent scenario where a player bears off against an enemy 20-point anchor.',
                'The benchmarks 8, 9, 12 dictate pip thresholds for: (8) Initial double, (9) Redouble with solid take, (12) Entering drop territory.',
            ],
        },
        practicalExamples: [
            {
                positionDesc: {
                    fr: 'Joueur en phase de sortie contre ancre adverse sur le point 20.',
                    en: 'Player bearing off against an opponent 20-point anchor.',
                },
                bestPlay: 'Double / Take selon le différentiel 8912',
                reasoning: {
                    fr: 'La règle 8912 compare le pip count net aux seuils critiques pour valider si le double est dans la fenêtre optimale.',
                    en: 'The 8912 rule compares the net pip count against critical thresholds to confirm double/take boundaries.',
                },
            },
        ],
        goldenRule: {
            fr: 'Face à une ancre sur le point 20, ne doublez pas avant d’avoir sécurisé vos points extérieurs 7 et 8.',
            en: 'Against a 20-point anchor, never double before securing and clearing your 7 and 8 points.',
        },
        sources: [
            {
                title: 'The 8912 Rule and Holding Game Bear-offs',
                author: 'Neil Kazaross',
                type: 'article',
                url: 'https://www.bkgm.com/articles/Kazaross/8912rule.html',
            },
        ],
    },

    // -------------------------------------------------------------------------
    // 5. MATCH PLAY & TABLES MET (NEIL KAZAROSS & XG)
    // -------------------------------------------------------------------------
    {
        id: 'kazaross-xg-met',
        slug: 'kazaross-xg-met',
        category: 'match-play',
        title: {
            fr: 'La Table Kazaross-XG2 de Match Equity',
            en: 'The Kazaross-XG2 Match Equity Table (MET)',
        },
        author: 'Neil Kazaross & Xavier Dufaure de Citres (XG)',
        difficulty: 'master',
        tags: ['MET', 'Kazaross-XG', 'Match Play', 'MWC', 'Probabilités de Match'],
        summary: {
            fr: 'La table mondiale de référence qui convertit n’importe quel score de match en probabilité exacte de victoire finale (MWC).',
            en: 'The gold-standard worldwide table translating any match score into precise Match Winning Chances (MWC).',
        },
        keyTakeaway: {
            fr: 'En tournoi, on ne joue pas pour des points isolés : chaque décision vise à maximiser son pourcentage de gain du match.',
            en: 'In match play, every checker and cube decision aims solely to maximize total Match Winning Chance.',
        },
        explanation: {
            fr: [
                'Créée à partir de millions de rollouts profonds par eXtreme Gammon (XG), la table Kazaross-XG2 est le cœur mathématique de tous les moteurs modernes.',
                'Elle calcule avec une précision chirurgicale l’équité à chaque score (par exemple à 2-away / 3-away, le joueur en tête a 59.5% de chances d’emporter le match).',
                'Ces pourcentages changent radicalement la valeur des gammons et dictent des actions de videau totalement différentes de la partie d’argent.',
            ],
            en: [
                'Derived from millions of neural rollouts via eXtreme Gammon (XG), the Kazaross-XG2 MET is modern backgammon’s mathematical backbone.',
                'It details equity across every match score (e.g. at 2-away / 3-away, the leader commands 59.5% MWC).',
                'These percentages shift gammon values dramatically and prescribe cube strategies completely distinct from money play.',
            ],
        },
        formulaOrRule: {
            name: 'Neil’s Numbers (Calcul mental rapide de MET)',
            formula: 'MWC ≈ 50% + (Différence de points × Facteur d’échelle selon l’éloignement du but)',
            explanation: {
                fr: 'Une méthode mnémotechnique conçue par Neil Kazaross pour recalculer la MET de tête en plein tournoi sans antisèche.',
                en: 'A mental shortcut designed by Neil Kazaross to compute match equity over the board without a cheat sheet.',
            },
        },
        practicalExamples: [
            {
                positionDesc: {
                    fr: 'Score 1-away / 2-away (Vous menez 6 à 5 dans un match en 7). Règle de Crawford.',
                    en: 'Score 1-away / 2-away (Leading 6-5 in a 7-point match). Crawford Game.',
                },
                bestPlay: 'Jouer ultra-sécuritaire pour éviter tout gammon',
                reasoning: {
                    fr: 'Gagner rapporte 1 pt (victoire du match). Perdre un gammon vous ferait perdre le match directement (5 + 2 = 7) !',
                    en: 'A single loss keeps the match tied; a gammon loss loses the entire match immediately (5 + 2 = 7)!',
                },
            },
        ],
        goldenRule: {
            fr: 'En tournoi, consultez toujours la distance au but (Away) plutôt que le score brut pour guider vos choix de videau.',
            en: 'In tournament play, always evaluate your score as distance away from the goal, never as raw points.',
        },
        sources: [
            {
                title: 'The Kazaross-XG2 Match Equity Table',
                author: 'Neil Kazaross',
                type: 'table',
                url: 'https://www.bkgm.com/articles/Kazaross/met.html',
            },
        ],
    },
    {
        id: 'crawford-rule',
        slug: 'crawford-rule',
        category: 'match-play',
        title: {
            fr: 'La Règle de Crawford & Post-Crawford Free Drop',
            en: 'The Crawford Rule & Post-Crawford Free Drop',
        },
        author: 'John R. Crawford & Neil Kazaross',
        difficulty: 'intermediate',
        tags: ['Crawford', 'Règles officielles', 'Free Drop', 'Tournoi'],
        summary: {
            fr: 'Dès qu’un joueur atteint le score à 1 point du match (ex: 6/7), le videau est strictement interdit pour la manche suivante.',
            en: 'When a player first reaches 1 point away from match victory, the doubling cube is banned for that single game.',
        },
        keyTakeaway: {
            fr: 'Partie Crawford : aucun videau. Partie Post-Crawford : le retardataire DOIT doubler au coup 1 ou 2 quasi-systématiquement !',
            en: 'Crawford Game: zero cube play. Post-Crawford: the trailer must double on roll 1 or 2 almost unconditionally!',
        },
        explanation: {
            fr: [
                'Inventée par John R. Crawford dans les années 1970 pour rétablir l’équité sportive en tournoi, cette règle évite que le retardataire ne double à chaque coup sans risque.',
                'Durant la partie Crawford, le videau ne peut être utilisé par aucun des deux joueurs.',
                'Si le meneur perd la partie Crawford, on entre en Post-Crawford : le retardataire doit alors doubler immédiatement au premier tour légal pour rentabiliser chaque victoire !',
                'Le Free Drop : si le retardataire est à un score impair (ex: 3-away ou 5-away), le meneur peut refuser le double sans payer de pénalité mathématique (Free Drop).',
            ],
            en: [
                'Created by John R. Crawford in the 1970s, this rule prevents the trailer from instantly doubling without risk on every roll.',
                'During the Crawford game, the cube is completely frozen for both sides.',
                'If the leader loses the Crawford game, we enter Post-Crawford play: the trailer must double immediately on roll 1 or 2.',
                'The Free Drop: when the trailer is an odd number away (e.g. 3-away, 5-away), the leader can pass a double without paying a mathematical price.',
            ],
        },
        practicalExamples: [
            {
                positionDesc: {
                    fr: 'Partie Post-Crawford. Vous êtes mené 6 à 4 dans un match en 7.',
                    en: 'Post-Crawford game. You trail 6 to 4 in a 7-point match.',
                },
                bestPlay: 'DOUBLER dès le premier tour après avoir lancé les dés',
                reasoning: {
                    fr: 'Vous avez besoin de 3 points. Gagner une partie à 2 points vous amène à 6-6 (DMP). Gagner une partie à 1 point vous laisserait mené 6-5.',
                    en: 'You need 3 points. A 2-point win brings you to 6-6 (DMP). A 1-point win leaves you trailing 6-5.',
                },
            },
        ],
        goldenRule: {
            fr: 'En Post-Crawford avec le retard au score : doublez dès votre première opportunité légale sans attendre !',
            en: 'In Post-Crawford trailing the match: double at your very first legal opportunity without delay!',
        },
        sources: [
            {
                title: 'Official Tournament Rules: The Crawford Rule',
                author: 'USBGF (U.S. Backgammon Federation)',
                type: 'website',
                url: 'https://usbgf.org/rules/',
            },
        ],
    },
    {
        id: 'dmp-strategy',
        slug: 'dmp-strategy',
        category: 'match-play',
        title: {
            fr: 'Stratégie en Double Match Point (DMP)',
            en: 'Double Match Point (DMP) Strategy',
        },
        author: 'Kit Woolsey',
        difficulty: 'intermediate',
        tags: ['DMP', 'Mort Subite', 'Zéro Gammon', 'Gains purs'],
        summary: {
            fr: 'Quand les deux joueurs sont à 1 point du match (ex: 6-6 dans un match en 7), les gammons ne valent STRICTEMENT RIEN.',
            en: 'When both players are 1 point away (e.g. 6-6 in a 7-pt match), gammons carry ZERO value.',
        },
        keyTakeaway: {
            fr: 'En DMP, seule la probabilité pure de gain compte : sacrifiez n’importe quel nombre de gammons si cela augmente vos chances de victoire de 0.1%.',
            en: 'At DMP, pure winning probability is king: sacrifice any number of gammons if it increases your win rate by 0.1%.',
        },
        explanation: {
            fr: [
                'Le Double Match Point est la mort subite du backgammon. Le vainqueur de cette manche remporte le match, peu importe que la victoire soit simple ou backgammon.',
                'Tous les principes de prudence contre les gammons disparaissent : vous pouvez laisser 4 blots si cela augmente vos chances d’échapper un pion ou de gagner la course.',
                'En ouverture DMP, le slotting agressif sur le point 5 ou 4 devient beaucoup plus fort car le risque de perdre par gammon est nul.',
            ],
            en: [
                'Double Match Point is sudden death. Whoever wins this single game wins the tournament match, regardless of gammon.',
                'All anti-gammon caution evaporates: leave 4 blots if it raises your chance of escaping or winning the race by 0.1%.',
                'In DMP openings, aggressive slotting on points 5 or 4 gains massive equity because gammon penalties do not exist.',
            ],
        },
        practicalExamples: [
            {
                positionDesc: {
                    fr: 'Ouverture 2-1 à DMP.',
                    en: 'Opening roll 2-1 at DMP.',
                },
                bestPlay: '13/11 6/5 (Slot du Golden Point)',
                reasoning: {
                    fr: 'En partie d’argent, 13/11 24/23 est plus standard pour limiter les gammons. À DMP, le slot 6/5 est supérieur car le risque de gammon est nul.',
                    en: 'In money play, 13/11 24/23 is common to reduce gammon losses. At DMP, slotting 6/5 is superior due to zero gammon penalty.',
                },
            },
        ],
        goldenRule: {
            fr: 'À DMP : ignorez totalement les gammons. Choisissez uniquement le coup qui maximise le pourcentage de victoires brutes.',
            en: 'At DMP: ignore gammons entirely. Select only the move maximizing pure raw win percentage.',
        },
        sources: [
            {
                title: 'How to Play Tournament Backgammon (DMP Dynamics)',
                author: 'Kit Woolsey',
                type: 'book',
                details: '1990.',
            },
        ],
    },

    // -------------------------------------------------------------------------
    // 6. THÉORIE DES OUVERTURES (WOOLSEY & HEINRICH)
    // -------------------------------------------------------------------------
    {
        id: 'opening-philosophy',
        slug: 'opening-philosophy',
        category: 'openings',
        title: {
            fr: 'Philosophie Moderne des Ouvertures de Backgammon',
            en: 'Modern Opening Roll Philosophy',
        },
        author: 'Kit Woolsey & Hal Heinrich',
        difficulty: 'beginner',
        tags: ['Ouvertures', 'Livre de Coups', 'Making', 'Running', 'Splitting', 'Slotting'],
        summary: {
            fr: 'Les 4 familles stratégiques universelles pour jouer les 15 lancers d’ouverture non-doubles.',
            en: 'The 4 universal strategic families for playing the 15 non-double opening rolls.',
        },
        keyTakeaway: {
            fr: 'Chaque coup d’ouverture relève de 4 actions : Faire une porte (Making), Courir (Running), Fendre (Splitting) ou Sloter (Slotting).',
            en: 'Every opening roll belongs to 4 fundamental intents: Making points, Running, Splitting, or Slotting.',
        },
        explanation: {
            fr: [
                'Au premier tour, les doubles sont impossibles (les joueurs lancent chacun un dé, le plus fort commence). Il n’existe donc que 15 lancers possibles (1-2 à 6-5).',
                '1. Faire une porte (Making) : 3-1 (point 5), 4-2 (point 4), 5-3 (point 3), 6-1 (point 7). Ce sont les meilleurs lancers du jeu.',
                '2. Courir (Running) : 6-5 (Lover’s Leap : 24/13), le seul coup d’ouverture qui s’échappe directement dans le jan extérieur.',
                '3. Fendre et Descendre (Split and Down) : 2-1, 3-2, 4-3, 5-2, 5-4. Avancer un pion arrière (split vers 20, 21 ou 23) tout en descendant un bâtisseur depuis le 13.',
                '4. Sloter (Slotting) : déposer délibérément un blot sur le point 5 avec l’intention de le fermer au tour suivant.',
            ],
            en: [
                'On opening rolls, doubles are impossible. There are strictly 15 unique rolls (1-2 through 6-5).',
                '1. Making points: 3-1 (5-pt), 4-2 (4-pt), 5-3 (3-pt), 6-1 (7-pt). These are the supreme opening rolls.',
                '2. Running: 6-5 ("Lover’s Leap" 24/13), escaping a back checker directly to the midpoint.',
                '3. Split and Down: 2-1, 3-2, 4-3, 5-2, 5-4. Stepping up a back checker while bringing down a builder from the 13.',
                '4. Slotting: intentionally placing a loose blot on the 5-point to make it on the subsequent roll.',
            ],
        },
        practicalExamples: [
            {
                positionDesc: {
                    fr: 'Lancer d’ouverture 3-1.',
                    en: 'Opening roll 3-1.',
                },
                bestPlay: '8/5 6/5 (Fait le Golden Point)',
                reasoning: {
                    fr: 'Le meilleur coup d’ouverture absolu du backgammon moderne.',
                    en: 'The single most dominant opening play in modern backgammon.',
                },
            },
        ],
        goldenRule: {
            fr: 'Si vous ne pouvez pas fabriquer une porte majeure, fendez vos arrières pour préparer une ancre tout en descendant un bâtisseur.',
            en: 'If you cannot make a major point, split your back checkers to contest an anchor while bringing down a builder.',
        },
        sources: [
            {
                title: 'The Backgammon Opening Book',
                author: 'Kit Woolsey & Hal Heinrich',
                type: 'book',
                details: '1998.',
            },
        ],
    },

    // -------------------------------------------------------------------------
    // 7. RÈGLES D'OR DE GRAND-MAÎTRE (MOCHY & FALAFEL)
    // -------------------------------------------------------------------------
    {
        id: 'mochy-golden-rules',
        slug: 'mochy-golden-rules',
        category: 'rules-of-thumb',
        title: {
            fr: 'Les Règles d’Or de Masayuki Mochizuki (Mochy)',
            en: 'Mochy’s Golden Strategic Rules',
        },
        author: 'Masayuki Mochizuki (Mochy, #1 Mondial)',
        difficulty: 'intermediate',
        tags: ['Mochy', 'Règles d’or', 'Heuristiques', 'Grand-Maître'],
        summary: {
            fr: 'Les heuristiques éprouvées par le numéro 1 mondial pour trouver le coup parfait en moins de 10 secondes.',
            en: 'Field-tested heuristics from the world’s #1 Giant to pinpoint optimal plays in under 10 seconds.',
        },
        keyTakeaway: {
            fr: 'Un coup grand-maître respecte 3 équilibres : Sécurité de course, Flexibilité des bâtisseurs et Pression sur l’ancre.',
            en: 'A grandmaster play balances 3 tensions: race safety, builder flexibility, and anchor pressure.',
        },
        explanation: {
            fr: [
                'Masayuki Mochizuki (Mochy), champion du monde et triple n°1 des Giants of Backgammon, résume la prise de décision en 3 questions instantanées :',
                '1. Qui mène la course ? (Si c’est moi, je cours et je simplifie ; si c’est l’adversaire, je maintiens la complexité).',
                '2. Qui a le meilleur jan intérieur ? (Si j’ai 3 portes et l’adversaire 1, je peux jouer audacieux et slotter sans peur).',
                '3. Quel est l’état des ancres ? (Si j’ai l’ancre sur le point 20, je ne crains aucun blitz).',
            ],
            en: [
                'World Champion and 3-time #1 Giant Masayuki Mochizuki distills over-the-board clarity into 3 instant questions:',
                '1. Who leads the race? (Leader runs and simplifies; trailer keeps complexity).',
                '2. Who has the stronger home board? (If I have 3 points and opponent has 1, I can play bold and slot freely).',
                '3. What is the status of anchors? (Holding the 20-point anchor renders me immune to blitzes).',
            ],
        },
        practicalExamples: [
            {
                positionDesc: {
                    fr: 'Avance de 18 pips avec jan adverse encore ouvert.',
                    en: '18-pip racing lead against an open opponent home board.',
                },
                bestPlay: 'Rompre le contact en sécurité (Course Pure)',
                reasoning: {
                    fr: 'Appliquer la 1ère règle de Mochy : quand on mène la course, simplifier et fuir le contact.',
                    en: 'Apply Mochy’s 1st rule: when leading the race, simplify and break contact without looking for fights.',
                },
            },
        ],
        goldenRule: {
            fr: 'Avant de jouer, demandez-vous toujours : "Quelle est la faiblesse de mon adversaire que ce coup exploite directement ?"',
            en: 'Before moving, always ask: "What specific weakness in the opponent’s position does this play directly exploit?"',
        },
        sources: [
            {
                title: 'Backgammon Masters Awarding Reference Series',
                author: 'Masayuki Mochizuki',
                type: 'website',
                url: 'https://mochybackgammon.com/',
            },
        ],
    },
    // -------------------------------------------------------------------------
    // 8. CONCEPTS STRATÉGIQUES DE FRANÇOIS TARDIEU (TRIPLE CHAMPION D'EUROPE)
    // -------------------------------------------------------------------------
    {
        id: 'tardieu-strategic-concepts',
        slug: 'tardieu-strategic-concepts',
        category: 'fundamentals',
        title: {
            fr: 'Concepts Stratégiques de François Tardieu',
            en: 'Strategic Concepts by François Tardieu',
        },
        author: 'François Tardieu (Triple Champion d’Europe)',
        difficulty: 'master',
        tags: ['Tardieu', 'Grand-Maître', 'Ancre Avancée', 'Timing', 'Prime vs Blitz', 'Livre'],
        summary: {
            fr: 'Les analyses approfondies de François Tardieu sur la structure des ancres, la gestion du pion unique en arrière (one man back) et la dynamique prime contre blitz.',
            en: 'François Tardieu’s profound analyses on anchor structures, managing the lone back checker (one man back), and priming vs blitz dynamics.',
        },
        keyTakeaway: {
            fr: 'Ne dispersez jamais un pion sans objectif précis : chaque ancre ou slot doit soit préparer une prime, soit étouffer la mobilité adverse.',
            en: 'Never expose a checker without a distinct plan: every anchor or slot must either build a prime or suffocate opponent mobility.',
        },
        explanation: {
            fr: [
                'Issu du célèbre document de travail qui a circulé pendant plus de 20 ans parmi l’élite du backgammon avant d’être édité par Stéphane Chenevière, cet ouvrage propose une méthodologie rigoureuse de prise de décision.',
                'Tardieu insiste sur la valeur inestimable des ancres hautes (points 20 et 21) pour briser l’agressivité adverse et sur la patience dans le timing d’une prime.',
                'Face à une menace de blitz, il formule la règle impérative : "Contester l’ancre immédiatement ou fuir sans attendre l’encerclement".',
            ],
            en: [
                'Originating from the legendary manuscript passed between top grandmasters for 20 years before its formal publication edited by Stéphane Chenevière, this treatise offers a disciplined framework for decision making.',
                'Tardieu underscores the paramount value of high anchors (20 and 21 points) in neutralizing opponent momentum and maintaining prime timing.',
                'When facing a blitz threat, he establishes the rule: "Contest the anchor immediately or flee before encirclement".',
            ],
        },
        practicalExamples: [
            {
                positionDesc: {
                    fr: 'Adversaire menaçant un blitz avec 2 portes intérieures et un pion en l’air.',
                    en: 'Opponent threatening a blitz with 2 home points and a checker in the air.',
                },
                bestPlay: 'Avancer sur le point 20 adverse ou consolider une ancre',
                reasoning: {
                    fr: 'Selon Tardieu, l’ancre haute est le seul vaccin absolu contre le blitz.',
                    en: 'According to Tardieu, the high anchor is the sole absolute vaccine against the blitz.',
                },
            },
        ],
        goldenRule: {
            fr: 'Un blitz sans ancre de repli est un suicide positionnel : construisez vos fondations arrières avant de lancer une attaque tous azimuts.',
            en: 'A blitz without a fallback anchor is positional suicide: secure your rear foundation before launching an all-out attack.',
        },
        sources: [
            {
                title: 'Backgammon: Strategic Concepts',
                author: 'François Tardieu (Édité par Stéphane Chenevière)',
                type: 'book',
                url: 'https://shop.backgammongalaxy.com/products/backgammon-strategic-concepts-by-francois-tardieu-softcover',
                details: 'Ouvrage culte de référence internationale, disponible chez Backgammon Galaxy et Roadkill Books.',
            },
        ],
    },
    // -------------------------------------------------------------------------
    // 9. LES 21 PROVERBES D'OUVERTURE DE MICHI (MICHIHITO KAGEYAMA)
    // -------------------------------------------------------------------------
    {
        id: 'michy-proverbs-opening',
        slug: 'michy-proverbs-opening',
        category: 'openings',
        title: {
            fr: 'Les 21 Proverbes d’Ouverture de Michy',
            en: 'Michy’s 21 Opening Proverbs',
        },
        author: 'Michihito Kageyama (Michy, #2 Mondial)',
        difficulty: 'intermediate',
        tags: ['Michy', 'Opening Concepts', 'Proverbes', 'Break the mountain', 'Double Tiger', 'Livre'],
        summary: {
            fr: 'Les règles mnémotechniques et proverbes de Michihito Kageyama pour maîtriser la phase d’ouverture sans mémoriser des milliers de variantes.',
            en: 'Michihito Kageyama’s acclaimed proverbs and heuristics to master opening play without brute-force rote memorization.',
        },
        keyTakeaway: {
            fr: 'Appliquez les proverbes phares : "Break the Mountain" (dégager le point 6 surchargé), "Make the 5-point" et "Double Tiger" (frapper deux pions d’un coup dans son jan).',
            en: 'Apply the flagship proverbs: "Break the Mountain" (strip the overloaded 6-point), "Make the 5-point", and "Double Tiger" (hit two blots simultaneously inside your home board).',
        },
        explanation: {
            fr: [
                'Dans son best-seller "Opening Concepts", Michihito Kageyama et Roland Herrera codifient le jeu d’ouverture avec 21 proverbes d’une clarté redoutable.',
                '"Break the mountain" : avec 5 pions sur le point 6 en début de partie, il est vital d’utiliser les petits dés (1, 2, 3) pour faire descendre ces pions vers les points 5 ou 4 plutôt que de laisser cette "montagne" inutile.',
                '"Double Tiger" : lorsque vous pouvez frapper 2 pions adverses dans votre propre jan intérieur en laissant deux blots, l’attaque "Double Tigre" est presque toujours supérieure au jeu passif.',
            ],
            en: [
                'In his best-seller "Opening Concepts", Michihito Kageyama and Roland Herrera codify early game play into 21 strikingly effective proverbs.',
                '"Break the mountain": with 5 checkers stranded on the 6-point, use small rolls (1, 2, 3) to dismantle the "mountain" toward points 5 or 4 rather than letting them rot.',
                '"Double Tiger": whenever you can hit two opponent blots in your own home board while leaving two return blots, the "Double Tiger" play almost always supersedes passive alternatives.',
            ],
        },
        practicalExamples: [
            {
                positionDesc: {
                    fr: 'Lancer 2-1 après un split adverse laissant un pion exposé sur votre point 5 et 4.',
                    en: '2-1 roll after an opponent split leaving blots on your 5 and 4 points.',
                },
                bestPlay: 'Frapper les 2 pions (Double Tiger)',
                reasoning: {
                    fr: 'Envoie 2 pions adverses à la barre et paralyse l’initiative adverse, même au prix d’un blot temporaire.',
                    en: 'Sends 2 checkers to the bar and obliterates opponent initiative despite temporary return shots.',
                },
            },
        ],
        goldenRule: {
            fr: 'Face à un choix difficile en ouverture : ne construisez pas passivement en retrait si vous pouvez frapper en jan ("Double Tiger").',
            en: 'When facing an opening dilemma: never build passively if you can strike in your home board ("Double Tiger").',
        },
        sources: [
            {
                title: 'Opening Concepts (Backgammon Odyssey Series)',
                author: 'Michihito Kageyama & Roland Herrera',
                type: 'book',
                url: 'https://bgmichy.com/authors',
                details: 'Best-seller mondial disponible sur bgmichy.com et chez Backgammon Galaxy.',
            },
        ],
    },
    // -------------------------------------------------------------------------
    // 10. TECHNIQUE DE FIN DE PARTIE DE MICHI (AMOEBA & TRAP PLAY)
    // -------------------------------------------------------------------------
    {
        id: 'michy-endgame-technique',
        slug: 'michy-endgame-technique',
        category: 'race-bearoff',
        title: {
            fr: 'Technique de Fin de Partie de Michy (Amoeba & Trap Play)',
            en: 'Michy’s Endgame Technique (Amoeba & Trap Play)',
        },
        author: 'Michihito Kageyama (Michy, #2 Mondial)',
        difficulty: 'advanced',
        tags: ['Michy', 'Endgame Technique', 'Amoeba Play', 'Trap Play', 'Bearoff', 'Livre'],
        summary: {
            fr: 'Les techniques de pointe de fin de partie avec contact : l’Amoeba Play, le Trap Play et la gestion du Phantom Point.',
            en: 'Advanced contact endgame techniques: Amoeba Play, the Trap Play, and navigating the Phantom Point.',
        },
        keyTakeaway: {
            fr: 'En fin de partie avec contact, façonnez vos pions comme une amibe souple ("Amoeba Play") pour ne jamais laisser de tirs directs lors de la rentrée adverse.',
            en: 'In contact endgames, morph your checkers like an amoeba to avoid leaving direct shots when the opponent enters.',
        },
        explanation: {
            fr: [
                'Dans "Endgame Technique" (Volume 2 de la série Backgammon Odyssey), Michy démontre que la plupart des erreurs de fin de partie surviennent avant la sortie effective des pions.',
                'L’"Amoeba Play" consiste à étaler ses pions harmonieusement (2 pions par flèche sur les points 6, 5, 4, 3) pour absorber n’importe quel lancer de dés sans être forcé de laisser un tir direct.',
                'Le "Trap Play" force l’adversaire reclus sur une ancre à craquer son timing avant vous.',
            ],
            en: [
                'In "Endgame Technique" (Vol. 2 of Backgammon Odyssey), Michy demonstrates that most endgame blunders occur well before the actual checker clearance.',
                'The "Amoeba Play" spreads checkers smoothly (2 per point across 6, 5, 4, 3) to absorb any dice roll without being forced to break and yield a direct shot.',
                'The "Trap Play" compels an anchored opponent to crack their timing first.',
            ],
        },
        practicalExamples: [
            {
                positionDesc: {
                    fr: 'Bear-off sous contact avec adversaire sur le point 1 adverse (ancre as).',
                    en: 'Bear-off under contact with opponent sitting on the 1-point (ace-point anchor).',
                },
                bestPlay: 'Distribuer en Amoeba (piles de 2 pions équilibrées)',
                reasoning: {
                    fr: 'Empêche tout dé dévastateur (comme 6-5 ou 6-1) de créer un blot fatal.',
                    en: 'Prevents devastating rolls like 6-5 or 6-1 from forcing fatal inner board blots.',
                },
            },
        ],
        goldenRule: {
            fr: 'Ne sortez pas vos pions précipitamment si cela crée un blot intérieur : la sécurité prime sur la vitesse de bear-off sous contact.',
            en: 'Do not bear off prematurely if it exposes an inner blot: safety outranks bear-off speed while contact remains.',
        },
        sources: [
            {
                title: 'Endgame Technique (Backgammon Odyssey Series 2)',
                author: 'Michihito Kageyama & Roland Herrera',
                type: 'book',
                url: 'https://bgmichy.com/authors',
                details: 'Guide de référence sur les fins de partie avec contact, disponible sur bgmichy.com.',
            },
        ],
    },
    // -------------------------------------------------------------------------
    // 11. BACKGAMMON MASTERCLASS (MOCHY & MARC OLSEN)
    // -------------------------------------------------------------------------
    {
        id: 'mochy-masterclass',
        slug: 'mochy-masterclass',
        category: 'rules-of-thumb',
        title: {
            fr: 'Backgammon Masterclass (Mochy & Marc Olsen)',
            en: 'Backgammon Masterclass (Mochy & Marc Olsen)',
        },
        author: 'Masayuki Mochizuki & Marc Olsen',
        difficulty: 'master',
        tags: ['Mochy', 'Marc Olsen', 'Masterclass', 'PR', 'XG Rollouts', 'Livre'],
        summary: {
            fr: 'La synthèse des conférences et séminaires d’élite de Mochy et Marc Olsen sur la pureté du jeu et l’analyse d’équité assistée par IA.',
            en: 'Synthesis of elite masterclasses by Mochy and Marc Olsen on game purity, equity distribution, and AI rollout dissection.',
        },
        keyTakeaway: {
            fr: 'Chaque décision doit minimiser le Performance Rating (PR) en maximisant la duplication des lancers clés adverses.',
            en: 'Every move must drive your Performance Rating (PR) toward 0 by maximizing duplication of opponent key rolls.',
        },
        explanation: {
            fr: [
                'Publié en 2023, "Backgammon Masterclass" regroupe les enseignements de séminaires donnés par Mochy et Olsen aux quatre coins du monde.',
                'Le livre détaille comment les grands maîtres calculent l’équité dynamique, comment exploiter les asymétries de position, et comment utiliser la "pureté" tactique pour étouffer le jeu adverse.',
            ],
            en: [
                'Published in 2023, "Backgammon Masterclass" brings together seminars presented worldwide by Mochy and Olsen.',
                'The book details how grandmasters calculate dynamic equity, exploit positional asymmetries, and leverage "pure play" to stifle opponent counterplay.',
            ],
        },
        practicalExamples: [
            {
                positionDesc: {
                    fr: 'Choix entre frapper un pion ou construire une porte fermée.',
                    en: 'Choice between hitting a loose blot or closing a solid home point.',
                },
                bestPlay: 'Calculer la duplication des dés adverses',
                reasoning: {
                    fr: 'Si l’adversaire a besoin du même dé (ex: 4) pour entrer et pour frapper ailleurs, la frappe est doublement efficace.',
                    en: 'If the opponent requires the same number (e.g. 4) to enter and to strike elsewhere, hitting is doubly potent.',
                },
            },
        ],
        goldenRule: {
            fr: 'Dupliquez les bons dés adverses : forcez l’adversaire à avoir besoin du même chiffre pour frapper et pour entrer.',
            en: 'Duplicate opponent good numbers: force them to need the exact same die to enter and to hit.',
        },
        sources: [
            {
                title: 'Backgammon Masterclass',
                author: 'Masayuki Mochizuki & Marc Olsen',
                type: 'book',
                url: 'https://shop.backgammongalaxy.com/products/backgammon-masterclass-by-mochy-olsen',
                details: 'Disponible chez Backgammon Galaxy.',
            },
        ],
    },
];

/**
 * Recherche et consultation dans la base de connaissances.
 */
export function getTheoryConceptById(id: string): TheoryConcept | undefined {
    return KNOWLEDGE_BASE_CONCEPTS.find((c) => c.id === id || c.slug === id);
}

export function searchTheoryConcepts(query: string, language: 'fr' | 'en' = 'fr'): TheoryConcept[] {
    const q = query.trim().toLowerCase();
    if (!q) return KNOWLEDGE_BASE_CONCEPTS;

    return KNOWLEDGE_BASE_CONCEPTS.filter((c) => {
        const title = c.title[language].toLowerCase();
        const summary = c.summary[language].toLowerCase();
        const author = c.author.toLowerCase();
        const tags = c.tags.map((t) => t.toLowerCase());

        return (
            title.includes(q) ||
            summary.includes(q) ||
            author.includes(q) ||
            tags.some((t) => t.includes(q))
        );
    });
}

export function getTheoryConceptsByCategory(category: string): TheoryConcept[] {
    if (category === 'all') return KNOWLEDGE_BASE_CONCEPTS;
    return KNOWLEDGE_BASE_CONCEPTS.filter((c) => c.category === category);
}
