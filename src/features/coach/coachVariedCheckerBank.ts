/**
 * @file src/features/coach/coachVariedCheckerBank.ts
 * @description Banque de 10 variantes d'explications naturelles de style Grand-Maître IA
 * pour chaque catégorie d'erreur de placement de pions (Checker Play).
 * Chaque catégorie possède 10 formulations distinctes interpolées avec les coups exacts.
 */

import {
    selectVariantIndex,
    type VariedCheckerCategory,
    type VariedCopyContext,
    type VariedExplanationCopy,
} from './coachVariedMessagesBank';

export function pickVariedCheckerErrorCopy(
    category: VariedCheckerCategory,
    ctx: VariedCopyContext,
): VariedExplanationCopy {
    const lossMilli = Math.round(Math.abs(ctx.equityLoss) * 1000);
    const seed = `${category}|${ctx.playedMove}|${ctx.optimalMove}|${lossMilli}|${ctx.userShots ?? 0}|${ctx.playerPips ?? 0}|${ctx.seedExtra ?? ''}`;
    const idx = selectVariantIndex(seed, 10);

    const pld = ctx.playedMove;
    const opt = ctx.optimalMove;
    const uShots = ctx.userShots ?? 0;
    const bShots = ctx.bestShots ?? 0;
    const pPips = ctx.playerPips ?? 150;
    const oPips = ctx.opponentPips ?? 150;
    const primeLen = ctx.primeLength ?? 4;
    const blots = ctx.blotsCount ?? 1;

    switch (category) {
        case 'SHOT_EXPOSURE': {
            const variants: ReadonlyArray<VariedExplanationCopy> = [
                {
                    summary: `Le coup ${pld} concède ${uShots} tirs directs contre seulement ${bShots} pour ${opt}.`,
                    whyFailed: `En jouant ${pld}, vous laissez un blot vulnérable offrant à l'adversaire ${uShots} chances sur 36 de frapper.`,
                    whyOptimal: `Le coup optimal ${opt} réduit cette exposition à ${bShots} tirs tout en consolidant votre structure.`,
                    advice: `Quand l'adversaire possède un jan intérieur menaçant, chaque tir concédé coûte très cher en équité.`,
                },
                {
                    summary: `Exposition critique : ${pld} offre ${uShots} tirs directs sur 36 (contre ${bShots} avec ${opt}).`,
                    whyFailed: `Votre ligne ${pld} disperse vos pions sous le feu adverse et multiplie les dés de frappe (${uShots}/36).`,
                    whyOptimal: `Jouer ${opt} resserre vos blocs et abaisse immédiatement le danger à ${bShots}/36.`,
                    advice: `Dupliquez les dés adverses ou mettez vos pions à l'abri plutôt que de multiplier les cibles isolées.`,
                },
                {
                    summary: `Danger de frappe : vous concédez ${uShots} tirs directs avec ${pld} au lieu de ${bShots} via ${opt}.`,
                    whyFailed: `Avec ${pld}, un pion reste à découvert dans la ligne de mire directe (${uShots} lancers adverses sur 36).`,
                    whyOptimal: `La variante ${opt} sécurise vos pions vulnérables (${bShots}/36 tirs) sans céder le tempo.`,
                    advice: `Un pion frappé vous fait perdre à la fois la course en pips et l'initiative tactique.`,
                },
                {
                    summary: `Imprudence défensive : ${uShots} tirs directs concédés sur ${pld}, contre ${bShots} sur ${opt}.`,
                    whyFailed: `Le choix ${pld} sous-estime la probabilité de riposte adverse (${uShots} combinaisons sur 36 touchent).`,
                    whyOptimal: `Préférer ${opt} verrouille la sécurité de vos dames (${bShots}/36) et préserve votre équité.`,
                    advice: `Comptez toujours les tirs directs (à 1–6 cases) avant de laisser un blot dans l'outfield.`,
                },
                {
                    summary: `Alerte sécurité : ${pld} laisse ${uShots} tirs directs à l'adversaire contre ${bShots} avec ${opt}.`,
                    whyFailed: `En optant pour ${pld}, vous offrez un tempo de frappe gratuit sur ${uShots} lancers des 36 possibles.`,
                    whyOptimal: `La ligne du moteur ${opt} neutralise ces menaces (${bShots} tirs) et garde vos pions connectés.`,
                    advice: `Plus le jan intérieur adverse compte de portes fermées, plus la sécurité des blots devient prioritaire.`,
                },
                {
                    summary: `Trop de cibles offertes : ${uShots} tirs directs après ${pld}, contre seulement ${bShots} après ${opt}.`,
                    whyFailed: `Jouer ${pld} expose inutilement votre structure à ${uShots} séquences de frappe sur 36.`,
                    whyOptimal: `Le coup ${opt} élimine cette prise de risque excessive (${bShots}/36) tout en restant constructif.`,
                    advice: `Ne prenez un risque d'exposition que si le gain positionnel en face est massif et immédiat.`,
                },
                {
                    summary: `Fragilité tactique : ${pld} ouvre ${uShots} tirs directs (${bShots} seulement avec ${opt}).`,
                    whyFailed: `Votre coup ${pld} brise la protection mutuelle de vos pions et concède ${uShots}/36 tirs.`,
                    whyOptimal: `La solution ${opt} abaisse l'exposition à ${bShots}/36 et force l'adversaire à jouer passivement.`,
                    advice: `La discipline n°1 des Grands-Maîtres consiste à refuser les tirs gratuits à l'adversaire.`,
                },
                {
                    summary: `Sur-exposition aux dés adverses : ${uShots} tirs directs sur ${pld} contre ${bShots} sur ${opt}.`,
                    whyFailed: `L'option ${pld} laisse traîner un blot exactement à portée des meilleurs dés adverses (${uShots}/36).`,
                    whyOptimal: `Choisir ${opt} réduit drastiquement la fenêtre de tir adverse (${bShots}/36) et stabilise le plateau.`,
                    advice: `Vérifiez systématiquement les distances de 1 à 6 devant les pions adverses avant de valider.`,
                },
                {
                    summary: `Coût de sécurité élevé : ${pld} concède ${uShots} tirs directs là où ${opt} n'en laisse que ${bShots}.`,
                    whyFailed: `En validant ${pld}, vous acceptez un risque de retour à la barre sur ${uShots} lancers sur 36.`,
                    whyOptimal: `Le coup recommandé ${opt} protège votre avance de course en limitant les tirs à ${bShots}/36.`,
                    advice: `Protéger ses blots en milieu de partie évite 80 % des retournements catastrophiques.`,
                },
                {
                    summary: `Vulnérabilité directe : ${uShots} tirs directs concédés par ${pld} (seulement ${bShots} avec ${opt}).`,
                    whyFailed: `Le déplacement ${pld} crée une cible franche que l'adversaire touche ${uShots} fois sur 36.`,
                    whyOptimal: `La manoeuvre ${opt} assainit votre position (${bShots} tirs) et conserve une structure compacte.`,
                    advice: `Gardez vos pions groupés par paires dès que le contact direct s'intensifie.`,
                },
            ];
            return variants[idx];
        }

        case 'GOLDEN_POINT': {
            const variants: ReadonlyArray<VariedExplanationCopy> = [
                {
                    summary: `Faire la porte du 5 (Golden Point) avec ${opt} est le coup le plus précieux du Backgammon.`,
                    whyFailed: `Jouer ${pld} passe à côté de la création du Golden Point et disperse vos pions sans rien construire.`,
                    whyOptimal: `Le coup optimal ${opt} verrouille la porte du 5 : il bloque la sortie adverse et installe une forteresse.`,
                    advice: `Le Point 5 est la clé de voûte de toute attaque et défense : sécurisez-le dès que les dés le permettent !`,
                },
                {
                    summary: `Opportunité manquée sur le Golden Point : ${opt} fermait la case 5 maîtresse du plateau.`,
                    whyFailed: `Avec ${pld}, vous laissez la flèche 5 grande ouverte alors que vos bâtisseurs permettaient de la verrouiller.`,
                    whyOptimal: `La ligne ${opt} s'empare immédiatement du point d'or, cœur stratégique de votre jan intérieur.`,
                    advice: `Qui contrôle son point 5 contrôle le jan intérieur, les menaces de blitz et la barrière de prime.`,
                },
                {
                    summary: `Priorité absolue au Point d'Or : ${opt} construisait la porte du 5 au lieu de ${pld}.`,
                    whyFailed: `Votre coup ${pld} privilégie un mouvement secondaire en négligeant la case la plus rentable du jeu.`,
                    whyOptimal: `En jouant ${opt}, vous érigez un pilier sur la case 5 qui asphyxie les pions arrières adverses.`,
                    advice: `Proverbe de Michy : quand vos dés permettent de faire le point 5 proprement, ne cherchez pas ailleurs !`,
                },
                {
                    summary: `Le coup ${opt} scellait le Golden Point (case 5), bien supérieur au déplacement ${pld}.`,
                    whyFailed: `En choisissant ${pld}, vous renoncez à fermer la porte qui coupe les meilleures sorties adverses.`,
                    whyOptimal: `Le choix ${opt} plante deux pions sur la flèche 5 et transforme votre potentiel d'attaque.`,
                    advice: `Une porte sur le 5 enlève les 4 et les 5 aux pions adverses tentant de s'évader ou de rentrer.`,
                },
                {
                    summary: `Domination du jan intérieur : ${opt} verrouillait le Golden Point contrairement à ${pld}.`,
                    whyFailed: `Le déplacement ${pld} laisse un trou béant au cœur de votre jan sur la flèche 5.`,
                    whyOptimal: `Construire la porte avec ${opt} ancre votre structure et prépare une prime redoutable.`,
                    advice: `La flèche 5 est le pivot naturel entre la porte du 6 et la porte du 4 : fermez-la en priorité.`,
                },
                {
                    summary: `Erreur de hiérarchie stratégique : ${opt} sécurisait le Golden Point face à ${pld}.`,
                    whyFailed: `Jouer ${pld} gaspille un lancer parfait qui vous offrait la case la plus convoitée du tablier.`,
                    whyOptimal: `Avec ${opt}, la porte du 5 est verrouillée, augmentant immédiatement vos menaces de gammon.`,
                    advice: `En ouverture comme en milieu de partie, la prise du point 5 prime presque toujours sur la course.`,
                },
                {
                    summary: `Construction maîtresse manquée : ${opt} prenait le Golden Point alors que ${pld} reste passif.`,
                    whyFailed: `L'option ${pld} déplace vos pions sans créer la moindre nouvelle porte clé.`,
                    whyOptimal: `Le coup ${opt} combine deux bâtisseurs sur la flèche 5 pour dominer la bataille de position.`,
                    advice: `Regardez toujours en premier si vos deux dés convergent vers la flèche 5 (ou 20 côté O).`,
                },
                {
                    summary: `Clé de voûte négligée : ${opt} bâtissait le Golden Point au lieu de ${pld}.`,
                    whyFailed: `En validant ${pld}, vous laissez à l'adversaire l'espoir d'ancrer sur votre point 5 au prochain tour.`,
                    whyOptimal: `Verrouiller la case via ${opt} confisque définitivement ce point d'ancrage à l'adversaire.`,
                    advice: `Prendre son point 5 a un double effet : construire votre mur ET priver l'adversaire de sa meilleure ancre.`,
                },
                {
                    summary: `Le moteur réclame ${opt} : fermeture immédiate du Golden Point contre ${pld}.`,
                    whyFailed: `Votre ligne ${pld} sous-exploite la synergie de vos pions sur les flèches 8 et 6.`,
                    whyOptimal: `La manoeuvre ${opt} concrétise vos bâtisseurs en fermant la porte royale du 5.`,
                    advice: `Les pions en réserve sur le 8 et le 6 servent avant tout à fabriquer le Golden Point.`,
                },
                {
                    summary: `Verrouillage stratégique : ${opt} érigeait le Golden Point là où ${pld} disperse vos forces.`,
                    whyFailed: `Choisir ${pld} retarde la construction de votre jan intérieur d'au moins un tour complet.`,
                    whyOptimal: `Avec ${opt}, la porte du 5 est acquise dès maintenant avec un gain net d'équité.`,
                    advice: `Au Backgammon, un tour de retard sur la prise du point 5 suffit souvent à inverser l'initiative.`,
                },
            ];
            return variants[idx];
        }

        case 'BAR_POINT': {
            const variants: ReadonlyArray<VariedExplanationCopy> = [
                {
                    summary: `Faire la porte du 7 (Bar Point) avec ${opt} bloque la fuite adverse et amorce une prime.`,
                    whyFailed: `Jouer ${pld} néglige de verrouiller la barricade stratégique du point 7.`,
                    whyOptimal: `Le coup optimal ${opt} ferme le Bar Point pour interdire aux pions adverses les sorties par un 6.`,
                    advice: `La porte du Bar (7) fait le pont entre l'outfield et le jan intérieur : fermez-la dès que possible.`,
                },
                {
                    summary: `Barricade du 7 manquée : ${opt} sécurisait le Bar Point contrairement à ${pld}.`,
                    whyFailed: `Avec ${pld}, vous laissez le point 7 ouvert et facilitez l'évasion des dames arrières adverses.`,
                    whyOptimal: `En jouant ${opt}, vous érigez un barrage à 6 cases de la case 1 adverse.`,
                    advice: `Le Bar Point (7) combiné au point 6 crée déjà embryon de prime très difficile à franchir.`,
                },
                {
                    summary: `Contrôle du Bar Point : ${opt} verrouillait la flèche 7 au lieu de ${pld}.`,
                    whyFailed: `Votre coup ${pld} disperse vos bâtisseurs sans saisir le point de blocage naturel du 7.`,
                    whyOptimal: `La ligne ${opt} soude votre mur extérieur avec votre jan pour étouffer le contre-jeu adverse.`,
                    advice: `Après le Golden Point (5), le Bar Point (7) est la deuxième porte la plus précieuse à construire.`,
                },
                {
                    summary: `Verrouillage des 6 adverses : ${opt} fermait le Bar Point face au coup passif ${pld}.`,
                    whyFailed: `Choisir ${pld} laisse aux pions arrières adverses tous leurs 6 pour s'échapper vers le milieu.`,
                    whyOptimal: `Le coup ${opt} plante un verrou sur la case 7 et prépare une prime continue.`,
                    advice: `Bloquer les 6 adverses avec le point 7 est le meilleur moyen d'amorcer un jeu de prime (Priming Game).`,
                },
                {
                    summary: `Construction de bloc : ${opt} prenait le Bar Point (case 7) que ${pld} ignore.`,
                    whyFailed: `En jouant ${pld}, vous passez à côté d'une porte propre qui sécurisait simultanément deux pions.`,
                    whyOptimal: `La variante ${opt} installe un relais blindé sur le 7, idéal pour alimenter ensuite votre jan.`,
                    advice: `Une porte sur le 7 sert à la fois de bouclier défensif et de rampe de lancement pour vos constructeurs.`,
                },
                {
                    summary: `Opportunité sur la flèche 7 : ${opt} fermait le Bar Point au lieu de ${pld}.`,
                    whyFailed: `Le déplacement ${pld} laisse votre structure discontinue entre le point 13 et le point 6.`,
                    whyOptimal: `Jouer ${opt} comble ce vide en verrouillant le point 7 avec une excellente connectivité.`,
                    advice: `Des portes adjacentes (7 et 6) valent toujours beaucoup plus que des portes isolées.`,
                },
                {
                    summary: `Priorité au mur extérieur : ${opt} scellait le Bar Point contre ${pld}.`,
                    whyFailed: `Votre choix ${pld} abandonne le contrôle de la case 7 sans gain de course compensatoire.`,
                    whyOptimal: `Avec ${opt}, vous confisquez la case 7 et réduisez de moitié les dés d'évasion adverses.`,
                    advice: `Contre deux pions adverses reculés sur le 24, fermer le point 7 est une arme d'encerclement redoutable.`,
                },
                {
                    summary: `Le coup ${opt} construisait le Bar Point (7), supérieur en structure à ${pld}.`,
                    whyFailed: `Valider ${pld} laisse vos pions moins coordonnés pour le prochain lancer.`,
                    whyOptimal: `La solution ${opt} sécurise la flèche 7 et prépare l'encerclement méthodique de l'adversaire.`,
                    advice: `Pensez toujours en termes de portes consécutives : le point 7 est la charnière de toute grande prime.`,
                },
                {
                    summary: `Point de blocage oublié : ${opt} prenait la porte du 7 au lieu de ${pld}.`,
                    whyFailed: `L'action ${pld} néglige la fermeture gratuite du Bar Point offerte par vos dés.`,
                    whyOptimal: `En choisissant ${opt}, vous consolidez votre position tout en coupant les lignes de fuite.`,
                    advice: `Une porte faite sans laisser de blot sur la case 7 est un investissement à rendement immédiat.`,
                },
                {
                    summary: `Solidité structurelle : ${opt} verrouillait le Bar Point là où ${pld} relâche la pression.`,
                    whyFailed: `Avec ${pld}, aucune porte nouvelle n'est créée pour contenir les pions adverses.`,
                    whyOptimal: `Le coup optimal ${opt} ancre solidement la flèche 7 et domine l'outfield.`,
                    advice: `Construire le point 7 tôt dans la manche dicte le rythme stratégique de toute la partie.`,
                },
            ];
            return variants[idx];
        }

        case 'PRIME_EXTEND': {
            const variants: ReadonlyArray<VariedExplanationCopy> = [
                {
                    summary: `Une prime de ${primeLen} portes consécutives avec ${opt} offre un verrouillage stratégique décisif.`,
                    whyFailed: `Jouer ${pld} affaiblit ou manque d'étendre votre mur de prime de ${primeLen} portes.`,
                    whyOptimal: `Le coup ${opt} consolide ou prolonge la prime pour paralyser totalement l'évasion adverse.`,
                    advice: `Face à des pions adverses piégés, étendre votre prime prime toujours sur la course.`,
                },
                {
                    summary: `Mur de prime : ${opt} érigeait ${primeLen} portes consécutives contrairement à ${pld}.`,
                    whyFailed: `Avec ${pld}, vous laissez une brèche dans votre barrage ou brisez une porte existante.`,
                    whyOptimal: `La ligne ${opt} soude ${primeLen} flèches d'affilée, transformant le camp adverse en prison.`,
                    advice: `Une prime de 5 portes bloque les 6 ; une prime de 6 portes est mathématiquement infranchissable !`,
                },
                {
                    summary: `Asphyxie positionnelle : ${opt} prolongeait votre prime à ${primeLen} portes au lieu de ${pld}.`,
                    whyFailed: `Votre coup ${pld} relâche l'étau alors que les dames arrières adverses étaient prises au piège.`,
                    whyOptimal: `En jouant ${opt}, vous verrouillez ${primeLen} portes contiguës et forcez l'effondrement du timing adverse.`,
                    advice: `Ne cassez jamais un mur de prime tant que l'adversaire n'a pas été contraint de détruire son propre plateau.`,
                },
                {
                    summary: `Cohésion du barrage : ${opt} maintenait/étendait ${primeLen} portes consécutives face à ${pld}.`,
                    whyFailed: `Le déplacement ${pld} avance trop vite et disloque la continuité de votre mur de blocage.`,
                    whyOptimal: `Choisir ${opt} garde vos ${primeLen} portes compactes pour étouffer toute tentative de sortie.`,
                    advice: `En jeu de prime, la compacité des portes côte à côte vaut dix fois plus que quelques pips d'avance.`,
                },
                {
                    summary: `Verrouillage en prime (${primeLen} portes) : ${opt} surclasse nettement ${pld}.`,
                    whyFailed: `En optant pour ${pld}, vous offrez un créneau d'évasion inespéré aux pions arrières adverses.`,
                    whyOptimal: `Le coup ${opt} scelle un rideau continu de ${primeLen} portes devant le pion adverse.`,
                    advice: `Chaque porte ajoutée à une prime divise par deux les séquences de fuite de votre adversaire.`,
                },
                {
                    summary: `Construction de mur : ${opt} alignait ${primeLen} portes consécutives que ${pld} néglige.`,
                    whyFailed: `Valider ${pld} disperse vos constructeurs au lieu de souder le prochain maillon de votre prime.`,
                    whyOptimal: `Avec ${opt}, votre barrage atteint ${primeLen} flèches jointives et prend un ascendant écrasant.`,
                    advice: `Alimentez patiemment le devant de votre prime avec vos pions de réserve (spares).`,
                },
                {
                    summary: `Discipline de Prime : ${opt} préservait vos ${primeLen} portes jointives contre ${pld}.`,
                    whyFailed: `Le choix ${pld} ouvre prématurément l'arrière de votre mur avant d'avoir capturé l'adversaire.`,
                    whyOptimal: `La variante ${opt} maintient le blocus de ${primeLen} portes jusqu'à l'asphyxie complète en face.`,
                    advice: `Faites rouler votre prime d'arrière en avant (Rolling Prime) sans jamais laisser de trou au milieu.`,
                },
                {
                    summary: `Barrage hermétique : ${opt} formait ${primeLen} portes d'affilée au lieu de ${pld}.`,
                    whyFailed: `Jouer ${pld} confond jeu de course et jeu d'encerclement en délaissant votre mur.`,
                    whyOptimal: `Le moteur impose ${opt} : ${primeLen} portes consécutives immobilisent durablement l'adversaire.`,
                    advice: `Quand un pion adverse est bloqué derrière votre mur, ralentissez le jeu et renforcez la barricade.`,
                },
                {
                    summary: `Puissance du blocus : ${opt} verrouillait une prime de ${primeLen} portes face à ${pld}.`,
                    whyFailed: `L'action ${pld} manque l'occasion de souder vos portes en un bloc continu.`,
                    whyOptimal: `Grâce à ${opt}, vos ${primeLen} portes consécutives privent l'adversaire de ses 5 et de ses 6.`,
                    advice: `Une prime continue force l'adversaire à jouer uniquement avec ses pions avant et à casser son jan.`,
                },
                {
                    summary: `Continuité stratégique : ${opt} érigeait ${primeLen} portes contiguës contrairement à ${pld}.`,
                    whyFailed: `En jouant ${pld}, vous laissez un intervalle franchissable au cœur de votre dispositif.`,
                    whyOptimal: `Le coup optimal ${opt} bouche cet intervalle et porte votre prime à ${primeLen} flèches.`,
                    advice: `Une prime sans trou est la stratégie la plus sûre pour convertir un avantage sans variance.`,
                },
            ];
            return variants[idx];
        }

        case 'TEMPO_HIT': {
            const variants: ReadonlyArray<VariedExplanationCopy> = [
                {
                    summary: `Frapper le blot adverse avec ${opt} gagne un tempo décisif et brise la course adverse.`,
                    whyFailed: `Jouer ${pld} est trop passif et laisse l'adversaire consolider sa position sans être inquiété.`,
                    whyOptimal: `Le coup optimal ${opt} envoie un pion adverse à la barre et reprend l'initiative tactique.`,
                    advice: `Frapper un pion exposé vole un demi-tour à l'adversaire et l'oblige à réentrer depuis la barre.`,
                },
                {
                    summary: `Initiative manquée : ${opt} frappait pour voler le tempo, contrairement au coup passif ${pld}.`,
                    whyFailed: `Avec ${pld}, vous laissez survivre un blot adverse qui va couvrir une porte clé au prochain tour.`,
                    whyOptimal: `La frappe ${opt} expédie l'adversaire sur la barre et lui fait perdre la moitié de son lancer.`,
                    advice: `Au Backgammon, le tempo est roi : un pion adverse à la barre ne peut pas construire son plateau !`,
                },
                {
                    summary: `Frappe de Tempo obligatoire : ${opt} punissait le blot adverse là où ${pld} recule.`,
                    whyFailed: `En choisissant ${pld}, vous laissez à l'adversaire ses deux dés pleins pour vous attaquer ou s'ancrer.`,
                    whyOptimal: `Jouer ${opt} frappe immédiatement, gagne de précieux pips à la course et dicte le rythme.`,
                    advice: `Chaque fois que vous envoyez un pion à la barre, l'adversaire doit d'abord dépenser un dé pour rentrer.`,
                },
                {
                    summary: `Refus d'attaque coûteux : ${opt} saisissait la frappe directe omise par ${pld}.`,
                    whyFailed: `Votre coup ${pld} pèche par excès de prudence et laisse l'adversaire développer ses bâtisseurs.`,
                    whyOptimal: `L'action ${opt} détruit le pion avancé adverse et bascule la pression dans l'autre camp.`,
                    advice: `Ne laissez jamais un blot adverse s'installer confortablement dans votre zone ou au milieu du terrain.`,
                },
                {
                    summary: `Prise d'initiative : ${opt} envoyait l'adversaire à la barre au lieu du jeu calme ${pld}.`,
                    whyFailed: `Valider ${pld} accorde un tour gratuit de consolidation à votre adversaire.`,
                    whyOptimal: `Le coup ${opt} frappe au bon moment pour désorganiser le timing adverse et creuser l'écart.`,
                    advice: `La frappe de tempo est la meilleure défense quand l'adversaire menace de fermer une porte.`,
                },
                {
                    summary: `Gain de temps et de course : ${opt} frappait le blot adverse ignoré par ${pld}.`,
                    whyFailed: `Avec ${pld}, vous subissez le jeu au lieu de forcer l'adversaire à se défendre depuis la barre.`,
                    whyOptimal: `Choisir ${opt} inflige un recul immédiat en pips à l'adversaire tout en activant vos pions.`,
                    advice: `Frapper dans l'outfield ou dans son jan fait reculer l'adversaire de 15 à 24 pips d'un seul coup !`,
                },
                {
                    summary: `Agressivité contrôlée : le moteur impose la frappe ${opt} plutôt que ${pld}.`,
                    whyFailed: `Le déplacement ${pld} respecte trop le pion isolé adverse et cède le contrôle du centre.`,
                    whyOptimal: `Avec ${opt}, la frappe met l'adversaire sous pression immédiate dès son jet de réentrée.`,
                    advice: `Critères de Magriel : quand vos constructeurs sont prêts à suivre, frappez pour saisir l'initiative !`,
                },
                {
                    summary: `Destruction de bâtisseur adverse : ${opt} frappait la cible laissée intacte par ${pld}.`,
                    whyFailed: `En jouant ${pld}, vous laissez en vie un pion constructeur que l'adversaire utilisera contre vous.`,
                    whyOptimal: `La variante ${opt} élimine ce bâtisseur et force l'adversaire à repartir de la case 24.`,
                    advice: `Éliminer un bâtisseur adverse avancé neutralise instantanément ses combinaisons de fermeture.`,
                },
                {
                    summary: `Vol de tempo décisif : ${opt} mettait l'adversaire sur la barre face à ${pld}.`,
                    whyFailed: `Votre option ${pld} joue la sécurité passive mais perd la bataille du tempo.`,
                    whyOptimal: `Frapper via ${opt} confisque un dé adverse et vous donne un tour d'avance pour construire.`,
                    advice: `Un demi-tour d'avance (un dé consommé à la barre) suffit souvent à fermer la porte décisive.`,
                },
                {
                    summary: `Punition tactique : ${opt} frappait pour prendre la main, bien supérieur à ${pld}.`,
                    whyFailed: `Le choix ${pld} épargne un pion adverse vulnérable qui méritait d'être renvoyé à la barre.`,
                    whyOptimal: `Le coup optimal ${opt} saisit l'opportunité de frappe et maximise votre équité cubeful.`,
                    advice: `Quand un blot adverse vous offre du tempo à faible risque de retour, frappez sans hésiter.`,
                },
            ];
            return variants[idx];
        }

        case 'REAR_ESCAPE': {
            const variants: ReadonlyArray<VariedExplanationCopy> = [
                {
                    summary: `Évader un pion arrière avec ${opt} est la priorité absolue avant que l'adversaire ne ferme sa prime.`,
                    whyFailed: `Jouer ${pld} disperse vos pions (${blots} blot(s), ${uShots}/36 tirs) en laissant vos pions arrières piégés.`,
                    whyOptimal: `Le coup optimal ${opt} fait courir immédiatement un pion arrière hors du camp adverse vers un relais sûr.`,
                    advice: `Sur les gros lancers en début de partie, donnez la priorité à l'évasion de vos pions arrières (case 24).`,
                },
                {
                    summary: `Urgence d'évasion : ${opt} libérait un pion arrière contrairement à ${pld}.`,
                    whyFailed: `Avec ${pld}, vos dames du fond restent enfermées (${uShots}/36 tirs concédés) sous la menace d'une prime.`,
                    whyOptimal: `La ligne ${opt} extrait un pion arrière vers le milieu du terrain et brise l'encerclement.`,
                    advice: `Tant que vos deux pions arrières restent bloqués sur le 24, vous risquez le gammon à chaque manche.`,
                },
                {
                    summary: `Fuite salvatrice : ${opt} faisait courir votre pion reculé au lieu de ${pld}.`,
                    whyFailed: `En choisissant ${pld}, vous bougez des pions déjà libres et laissez vos arrières en otage (${uShots}/36 tirs).`,
                    whyOptimal: `Jouer ${opt} utilise vos gros dés pour franchir le barrage adverse d'un seul bond.`,
                    advice: `Les 6 et les 5 du début de partie servent en priorité à sortir de la prison de la case 24.`,
                },
                {
                    summary: `Libération des arrières : ${opt} sauvait un pion du fond là où ${pld} s'attarde.`,
                    whyFailed: `Votre coup ${pld} ignore le danger d'étouffement de vos pions reculés (${blots} blot(s), ${uShots}/36 tirs).`,
                    whyOptimal: `L'action ${opt} propulse un pion arrière dans l'outfield et rééquilibre la course.`,
                    advice: `Un pion arrière évadé divise par trois le risque d'être enfermé derrière un mur de 5 ou 6 portes.`,
                },
                {
                    summary: `Priorité au dégagement arrière : ${opt} s'échappait proprement contre ${pld}.`,
                    whyFailed: `Valider ${pld} laisse vos deux pions du fond passifs pendant que l'adversaire masse ses bâtisseurs.`,
                    whyOptimal: `Le coup ${opt} saisit la fenêtre d'évasion avant que le Bar Point adverse ne se referme.`,
                    advice: `N'attendez jamais que l'adversaire ait fermé 4 portes pour tenter de sortir vos pions arrières !`,
                },
                {
                    summary: `Briser le blocus : ${opt} évadait un pion reculé au lieu du coup ${pld}.`,
                    whyFailed: `Le déplacement ${pld} joue uniquement dans votre camp et abandonne vos pions du 24 à leur sort.`,
                    whyOptimal: `Avec ${opt}, un pion arrière rejoint vos relais du milieu (point 13) en toute sécurité.`,
                    advice: `La connexion entre vos pions arrières et votre Midpoint (13) est vitale pour assurer la course.`,
                },
                {
                    summary: `Fenêtre d'évasion manquée : ${opt} sortait du camp adverse contrairement à ${pld}.`,
                    whyFailed: `En jouant ${pld}, vous gaspillez un lancer d'évasion idéal et concédez ${uShots}/36 tirs.`,
                    whyOptimal: `La variante ${opt} met immédiatement un pion arrière hors de portée de la prime adverse.`,
                    advice: `Dès qu'un lancer vous permet d'atteindre ou d'approcher le point 13 depuis le fond, courez !`,
                },
                {
                    summary: `Course d'émancipation : le moteur impose l'évasion ${opt} plutôt que ${pld}.`,
                    whyFailed: `Votre ligne ${pld} entasse des pions à l'avant mais oublie de libérer l'arrière-garde.`,
                    whyOptimal: `Choisir ${opt} dégage un pion reculé et fluidifie toute votre circulation de pions.`,
                    advice: `Au Backgammon, votre position n'est jamais plus forte que le sort de votre pion le plus reculé.`,
                },
                {
                    summary: `Sortie du piège : ${opt} extrayait votre dame arrière face au coup ${pld}.`,
                    whyFailed: `L'option ${pld} laisse deux cibles figées au fond du jan adverse (${uShots}/36 tirs concédés).`,
                    whyOptimal: `Avec ${opt}, vous franchissez la ligne de front et réduisez drastiquement les menaces de gammon.`,
                    advice: `Sauver un premier pion arrière transforme une défense périlleuse en course équilibrée.`,
                },
                {
                    summary: `Oxygène stratégique : ${opt} libérait l'arrière-garde ignorée par ${pld}.`,
                    whyFailed: `Jouer ${pld} vous condamne à manquer d'espace et de timing dans quelques tours.`,
                    whyOptimal: `Le coup optimal ${opt} évacue un pion arrière à temps et sécurise votre développement.`,
                    advice: `Utilisez chaque grand dé d'ouverture pour désengorger la flèche 24 avant qu'elle ne devienne un piège.`,
                },
            ];
            return variants[idx];
        }

        case 'ENDGAME_CONTACT_BREAK': {
            const variants: ReadonlyArray<VariedExplanationCopy> = [
                {
                    summary: `En fin de partie (${pPips} pips restants), ${opt} rompt réellement le contact pour entrer en course pure.`,
                    whyFailed: `Jouer ${pld} maintient le contact alors qu'une transition nette vers la course pure était disponible.`,
                    whyOptimal: `Le coup ${opt} dépasse le dernier pion adverse et sécurise la course de sortie.`,
                    advice: `En fin de partie avec l'avantage à la course, dépassez le dernier blocus adverse dès que possible.`,
                },
                {
                    summary: `Transition en course pure : à ${pPips} pips, ${opt} supprimait tout contact contre ${pld}.`,
                    whyFailed: `Avec ${pld}, vous laissez traîner un pion derrière le rideau adverse sans aucune nécessité.`,
                    whyOptimal: `La ligne ${opt} franchit définitivement le dernier pion adverse et élimine tout risque de frappe.`,
                    advice: `Quand vous menez en fin de manche, supprimer le contact annule 100 % des chances de retour par frappe.`,
                },
                {
                    summary: `Fin de contact décisive (${pPips} pips) : ${opt} sécurisait la course au lieu de ${pld}.`,
                    whyFailed: `Votre coup ${pld} prolonge artificiellement le contact et offre des lancers miracles à l'adversaire.`,
                    whyOptimal: `En jouant ${opt}, vous basculez en course sans contact où votre avance s'exprime pleinement.`,
                    advice: `Ne donnez jamais de tirs tardifs en fin de partie quand vous pouvez croiser sans risque.`,
                },
                {
                    summary: `Dépassement propre (${pPips} pips) : ${opt} coupait le contact contrairement à ${pld}.`,
                    whyFailed: `Choisir ${pld} garde une dame en arrière à la merci d'un blocage ou d'un tir de dernière minute.`,
                    whyOptimal: `Le coup ${opt} ramène le dernier pion au-delà des lignes adverses pour un bear-off serein.`,
                    advice: `Franchir le dernier pion adverse en fin de partie verrouille mathématiquement votre avantage.`,
                },
                {
                    summary: `Clôture du contact (${pPips} pips restants) : ${opt} surclasse nettement ${pld}.`,
                    whyFailed: `En validant ${pld}, vous retardez la séparation des armées alors que la course vous sourit.`,
                    whyOptimal: `La variante ${opt} efface le dernier point de friction et lance le sprint final vers la sortie.`,
                    advice: `Le joueur en tête à la course cherche toujours à éteindre le contact le plus tôt possible.`,
                },
                {
                    summary: `Sécurisation du sprint final (${pPips} pips) : ${opt} croisait sans contact face à ${pld}.`,
                    whyFailed: `Le déplacement ${pld} avance des pions déjà rentrés en oubliant de libérer le dernier croisement.`,
                    whyOptimal: `Avec ${opt}, plus aucun pion adverse ne peut vous frapper jusqu'à la fin de la manche.`,
                    advice: `Priorité absolue en approche de bear-off : faire passer votre dernier pion devant le dernier pion adverse.`,
                },
                {
                    summary: `Rupture nette du contact (${pPips} pips) : le moteur impose ${opt} au lieu de ${pld}.`,
                    whyFailed: `Votre option ${pld} laisse subsister une zone d'accrochage inutile en fin de parcours.`,
                    whyOptimal: `Jouer ${opt} sépare définitivement les deux camps et garantit une course pure sans accident.`,
                    advice: `Éliminer la variance d'un tir tardif est la marque des joueurs de tournoi expérimentés.`,
                },
                {
                    summary: `Passage en course pure (${pPips} pips) : ${opt} éliminait le dernier contact contre ${pld}.`,
                    whyFailed: `Avec ${pld}, l'adversaire conserve un espoir tactique d'accrocher votre dernier pion.`,
                    whyOptimal: `L'action ${opt} éteint ce contre-jeu en franchissant proprement la ligne de croisement.`,
                    advice: `Dès que vos dés permettent de passer le dernier obstacle en fin de manche, faites-le immédiatement.`,
                },
                {
                    summary: `Verrouillage de fin de manche (${pPips} pips) : ${opt} brisait le contact là où ${pld} hésite.`,
                    whyFailed: `Jouer ${pld} maintient une tension tactique qui ne profite qu'au joueur mené.`,
                    whyOptimal: `Le choix ${opt} transforme la fin de partie en simple course de vitesse à votre avantage.`,
                    advice: `Celui qui mène simplifie la position ; celui qui est mené cherche la complication.`,
                },
                {
                    summary: `Croisement décisif (${pPips} pips) : ${opt} ouvrait la course pure au lieu de ${pld}.`,
                    whyFailed: `En jouant ${pld}, vous manquez l'occasion de clore définitivement la phase de contact.`,
                    whyOptimal: `Le coup optimal ${opt} assure une transition 100 % propre vers la rentrée et la sortie des pions.`,
                    advice: `Vérifiez toujours si votre lancer permet de dépasser le dernier pion adverse avant de jouer dans le jan.`,
                },
            ];
            return variants[idx];
        }

        case 'PURE_RACE': {
            const variants: ReadonlyArray<VariedExplanationCopy> = [
                {
                    summary: `En course pure (${pPips} contre ${oPips} pips), minimisez le gaspillage (EPC) avec ${opt}.`,
                    whyFailed: `Jouer ${pld} augmente le gaspillage sur les points bas ou retarde le regroupement de vos pions.`,
                    whyOptimal: `Le coup optimal ${opt} maximise l'efficacité de sortie (EPC) et améliore votre Keith Count.`,
                    advice: `En course pure, ramenez vos pions arrières sans empiler les flèches 1 et 2.`,
                },
                {
                    summary: `Efficacité de course (${pPips} vs ${oPips} pips) : ${opt} optimise vos crossovers mieux que ${pld}.`,
                    whyFailed: `Avec ${pld}, vous enterrez des pions sur les flèches basses ou perdez un franchissement de quadrant.`,
                    whyOptimal: `La ligne ${opt} répartit harmonieusement vos pions sur les points 4, 5 et 6 pour sortir sans déchet.`,
                    advice: `En course sans contact, chaque crossover (passage de barrière de quadrant) vaut un demi-dé d'avance.`,
                },
                {
                    summary: `Optimisation EPC (${pPips} contre ${oPips} pips) : ${opt} bat ${pld} sur le rendement de sortie.`,
                    whyFailed: `Votre coup ${pld} crée des piles rigides et augmente votre Effective Pip Count (EPC).`,
                    whyOptimal: `En jouant ${opt}, vous maximisez le nombre de lancers qui sortent deux pions par tour.`,
                    advice: `Évitez toujours de placer un 4e ou 5e pion sur les flèches 1 et 2 pendant la rentrée au jan.`,
                },
                {
                    summary: `Technique de Bear-off (${pPips} vs ${oPips} pips) : ${opt} réduit le gaspillage de pips face à ${pld}.`,
                    whyFailed: `Choisir ${pld} laisse des trous dans votre jan ou retarde l'entrée de vos derniers traînards.`,
                    whyOptimal: `Le coup ${opt} lisse votre distribution intérieure et abaisse votre compte de Keith.`,
                    advice: `Règle d'or en course pure : rentrez d'abord les pions extérieurs avant de bouger à l'intérieur du jan.`,
                },
                {
                    summary: `Rendement de course (${pPips} contre ${oPips} pips) : le moteur préfère ${opt} à ${pld}.`,
                    whyFailed: `En validant ${pld}, vous gaspillez du potentiel sur les gros dés à venir lors du bear-off.`,
                    whyOptimal: `La variante ${opt} garnit les flèches hautes (6, 5, 4) pour absorber parfaitement les 6 et les 5.`,
                    advice: `Des pions placés sur les cases 6, 5 et 4 sortent sans aucun pip perdu sur la majorité des lancers.`,
                },
                {
                    summary: `Précision en course pure (${pPips} vs ${oPips} pips) : ${opt} économise de précieux tempos sur ${pld}.`,
                    whyFailed: `Le déplacement ${pld} dégrade la souplesse de votre structure de sortie.`,
                    whyOptimal: `Avec ${opt}, vous minimisez les lancers qui ne sortent qu'un seul pion au tour suivant.`,
                    advice: `En bear-off serré, sortir un pion dès maintenant vaut presque toujours mieux que d'avancer à l'intérieur.`,
                },
                {
                    summary: `Gestion des crossovers (${pPips} contre ${oPips} pips) : ${opt} surclasse ${pld}.`,
                    whyFailed: `Votre option ${pld} laisse un pion à la traîne dans l'outfield au lieu de réduire vos crossovers.`,
                    whyOptimal: `Jouer ${opt} accélère le regroupement dans le jan intérieur et optimise votre EPC.`,
                    advice: `Comptez le nombre de pions encore hors du jan : chaque pion rentré réduit la variance de fin de manche.`,
                },
                {
                    summary: `Fluidité de sortie (${pPips} vs ${oPips} pips) : ${opt} évite l'empilement créé par ${pld}.`,
                    whyFailed: `Avec ${pld}, vos pions s'accumulent sur les petites cases (1–2), ce qui coûte cher au Keith Count.`,
                    whyOptimal: `L'action ${opt} maintient un profil en escalier idéal pour un bear-off rapide.`,
                    advice: `Chaque pion au-delà de deux sur la flèche 1 ou 2 ajoute +1 à +2 pips de pénalité au compte de Keith.`,
                },
                {
                    summary: `Discipline de sprint (${pPips} contre ${oPips} pips) : ${opt} maximise vos sorties face à ${pld}.`,
                    whyFailed: `Jouer ${pld} fait perdre une fraction de tour précieuse dans une course où chaque dé compte.`,
                    whyOptimal: `Le choix ${opt} place vos dames sur les flèches les plus rentables mathématiquement.`,
                    advice: `Quand il n'y a plus de contact, oubliez les portes : seule compte la vitesse pure de sortie !`,
                },
                {
                    summary: `Économie de pips (${pPips} vs ${oPips} pips) : ${opt} est la ligne optimale devant ${pld}.`,
                    whyFailed: `En jouant ${pld}, vous créez une structure creuse qui gaspillera les dés moyens (3 et 4).`,
                    whyOptimal: `Le coup optimal ${opt} comble les cases intermédiaires et assure un bear-off sans accroc.`,
                    advice: `Un jan intérieur plat (2 à 3 pions par flèche) bat toujours un jan empilé en course pure.`,
                },
            ];
            return variants[idx];
        }

        case 'HOME_GATE': {
            const variants: ReadonlyArray<VariedExplanationCopy> = [
                {
                    summary: `Fermer une porte intérieure avec ${opt} renforce votre jan et complique la réentrée adverse.`,
                    whyFailed: `Jouer ${pld} disperse vos pions au lieu de fermer une porte protectrice dans votre jan.`,
                    whyOptimal: `Le coup optimal ${opt} construit une solide porte dans votre jan intérieur.`,
                    advice: `Fermer des portes dans son jan intérieur protège vos pions et prépare le verrouillage.`,
                },
                {
                    summary: `Construction du jan intérieur : ${opt} fermait une porte clé contrairement à ${pld}.`,
                    whyFailed: `Avec ${pld}, vous manquez l'occasion d'ajouter une nouvelle porte à votre forteresse intérieure.`,
                    whyOptimal: `La ligne ${opt} soude deux pions dans votre jan, augmentant la menace sur tout blot adverse.`,
                    advice: `Chaque porte supplémentaire dans votre jan intérieur augmente exponentiellement le coût d'une frappe.`,
                },
                {
                    summary: `Solidité du jan : ${opt} verrouillait une case intérieure au lieu du coup ${pld}.`,
                    whyFailed: `Votre coup ${pld} bouge sans créer de point fermé alors qu'une porte intérieure était gratuite.`,
                    whyOptimal: `En jouant ${opt}, vous réduisez les cases d'atterrissage adverses et renforcez votre attaque.`,
                    advice: `Un jan à 4 portes fermées enlève déjà plus de 44 % des jets de réentrée à un pion sur la barre !`,
                },
                {
                    summary: `Porte intérieure manquée : ${opt} consolidait votre camp face à ${pld}.`,
                    whyFailed: `Choisir ${pld} laisse votre jan intérieur poreux et sans menace dissuasive.`,
                    whyOptimal: `Le coup ${opt} bâtit une porte propre qui sécurise vos pions tout en menaçant le blitz.`,
                    advice: `Faire des portes chez soi est le fondement de toute stratégie d'attaque ou de retenue.`,
                },
                {
                    summary: `Renforcement intérieur : le moteur privilégie la porte ${opt} sur ${pld}.`,
                    whyFailed: `En validant ${pld}, vous laissez vos pions déconnectés au lieu de sécuriser une flèche du jan.`,
                    whyOptimal: `La variante ${opt} ferme immédiatement une porte intérieure et stabilise votre position.`,
                    advice: `Privilégiez la fermeture des portes hautes (6, 5, 4) avant les portes profondes (2, 1).`,
                },
                {
                    summary: `Verrouillage progressif : ${opt} ajoutait une porte intérieure que ${pld} néglige.`,
                    whyFailed: `Le déplacement ${pld} avance à vide sans améliorer le nombre de points fermés dans votre jan.`,
                    whyOptimal: `Avec ${opt}, vous convertissez vos bâtisseurs en une porte solide et permanente.`,
                    advice: `Les bâtisseurs n'ont de valeur que lorsqu'on les utilise pour fermer de vraies portes !`,
                },
                {
                    summary: `Pression sur la barre : ${opt} fermait une porte du jan au lieu de ${pld}.`,
                    whyFailed: `Votre option ${pld} laisse trop de portes ouvertes dans votre camp en cas d'échange de frappes.`,
                    whyOptimal: `Jouer ${opt} densifie votre jan intérieur et rend chaque future frappe beaucoup plus punitive.`,
                    advice: `Avant d'attaquer à découvert, assurez-vous d'avoir un jan intérieur plus fort que celui de l'adversaire.`,
                },
                {
                    summary: `Architecture du jan : ${opt} scellait une porte intérieure contre ${pld}.`,
                    whyFailed: `Avec ${pld}, vous gaspillez une combinaison exacte qui fermait une case de votre jan.`,
                    whyOptimal: `L'action ${opt} verrouille cette flèche et améliore à la fois votre sécurité et votre potentiel de gammon.`,
                    advice: `Un jan intérieur bien construit travaille pour vous jusqu'au dernier tour de la manche.`,
                },
                {
                    summary: `Sécurité intérieure : ${opt} bâtissait une porte propre là où ${pld} s'éparpille.`,
                    whyFailed: `Jouer ${pld} néglige la construction directe offerte par votre lancer dans le jan.`,
                    whyOptimal: `Le choix ${opt} plante un point solide chez vous sans concéder la moindre faiblesse.`,
                    advice: `Fermer une porte intérieure propre est presque toujours supérieur à un simple avancement de course.`,
                },
                {
                    summary: `Forteresse intérieure : ${opt} construisait une porte clé face au coup ${pld}.`,
                    whyFailed: `En jouant ${pld}, votre jan intérieur stagne et laisse l'adversaire circuler sans crainte.`,
                    whyOptimal: `Le coup optimal ${opt} érige une nouvelle porte chez vous et reprend l'ascendant structurel.`,
                    advice: `Comparez toujours le nombre de portes intérieures des deux joueurs pour savoir qui a le droit d'attaquer.`,
                },
            ];
            return variants[idx];
        }

        case 'ADVANCED_ANCHOR': {
            const variants: ReadonlyArray<VariedExplanationCopy> = [
                {
                    summary: `L'ancre avancée avec ${opt} assure votre sécurité et bride le développement adverse.`,
                    whyFailed: `Jouer ${pld} délaisse ou abandonne l'ancre avancée sans compensation majeure immédiate.`,
                    whyOptimal: `Jouer ${opt} maintient ou sécurise l'ancre avancée et le contrôle du jan adverse.`,
                    advice: `Ne démontez jamais une ancre avancée sans une compensation immédiate écrasante.`,
                },
                {
                    summary: `Assurance-vie stratégique : ${opt} sécurisait l'ancre avancée contrairement à ${pld}.`,
                    whyFailed: `Avec ${pld}, vous renoncez au point d'ancrage haut dans le camp adverse (cases 20–21).`,
                    whyOptimal: `La ligne ${opt} plante ou conserve une ancre avancée qui neutralise toute menace de blitz.`,
                    advice: `Une ancre sur le point 20 ou 21 réduit les risques de gammon à presque zéro et assure votre réentrée.`,
                },
                {
                    summary: `Contrôle défensif : ${opt} établissait/gardait l'ancre haute au lieu de ${pld}.`,
                    whyFailed: `Votre coup ${pld} quitte ou ignore le meilleur point d'appui défensif dans le jan adverse.`,
                    whyOptimal: `En jouant ${opt}, vous tenez fermement une ancre haute qui guette le moindre faux pas adverse.`,
                    advice: `Tenir le point 20 ou 21 adverse empêche l'adversaire de fermer sa prime et prépare vos contre-attaques.`,
                },
                {
                    summary: `Point d'appui majeur : ${opt} verrouillait l'ancre avancée face à ${pld}.`,
                    whyFailed: `Choisir ${pld} laisse vos pions arrières vulnérables ou brise votre police d'assurance trop tôt.`,
                    whyOptimal: `Le coup ${opt} ancre deux pions sur une case haute du jan adverse pour contrôler la manche.`,
                    advice: `Une ancre avancée est à la fois un abri sûr pour rentrer de la barre et un tremplin vers le milieu.`,
                },
                {
                    summary: `Discipline d'ancrage : le moteur impose ${opt} pour tenir l'ancre avancée contre ${pld}.`,
                    whyFailed: `En validant ${pld}, vous lâchez votre point fort arrière alors que le contact reste dangereux.`,
                    whyOptimal: `La variante ${opt} préserve l'ancre avancée et force l'adversaire à prendre des risques pour passer.`,
                    advice: `Tant que vous êtes derrière à la course, gardez votre ancre haute jusqu'au moment exact d'un tir direct.`,
                },
                {
                    summary: `Bouclier anti-gammon : ${opt} sécurisait l'ancre avancée que ${pld} abandonne.`,
                    whyFailed: `Le déplacement ${pld} affaiblit votre présence dans le jan adverse sans nécessité tactique.`,
                    whyOptimal: `Avec ${opt}, votre ancre haute surveille tout l'outfield adverse et protège votre équité.`,
                    advice: `L'ancre sur le point 20 (Golden Point adverse) est la meilleure position défensive du Backgammon.`,
                },
                {
                    summary: `Stabilité arrière : ${opt} construisait/maintenait l'ancre avancée au lieu de ${pld}.`,
                    whyFailed: `Votre option ${pld} disperse vos pions arrières alors qu'un ancrage haut était garanti.`,
                    whyOptimal: `Jouer ${opt} soude vos deux pions arrières sur une case stratégique du jan adverse.`,
                    advice: `Dès que vos dés permettent d'unir vos pions arrières sur la case 20, 21 ou 18, saisissez l'ancre !`,
                },
                {
                    summary: `Pression sur le jan adverse : ${opt} tenait l'ancre avancée contrairement à ${pld}.`,
                    whyFailed: `Avec ${pld}, vous libérez le jan adverse de toute surveillance et facilitez sa fermeture.`,
                    whyOptimal: `L'action ${opt} occupe une flèche clé chez l'adversaire et bloque sa construction de prime.`,
                    advice: `Une ancre haute gêne considérablement l'adversaire lorsqu'il devra rentrer ses propres pions.`,
                },
                {
                    summary: `Ancrage de Grand-Maître : ${opt} privilégiait l'ancre avancée sur ${pld}.`,
                    whyFailed: `Jouer ${pld} commet l'erreur classique de lâcher l'ancre sans avoir pris l'avantage à la course.`,
                    whyOptimal: `Le choix ${opt} garde le verrou défensif en place tout en faisant progresser l'avant-garde.`,
                    advice: `On ne quitte une ancre avancée que pour frapper, courir en tête, ou sur un double dé massif.`,
                },
                {
                    summary: `Sécurité de l'arrière-garde : ${opt} scellait l'ancre avancée face au coup ${pld}.`,
                    whyFailed: `En jouant ${pld}, vous perdez votre point d'ancrage et vous exposez à l'encerclement.`,
                    whyOptimal: `Le coup optimal ${opt} installe une base arrière imprenable qui garantit votre fin de partie.`,
                    advice: `Une ancre avancée transforme même une position dominée en un Take facile au videau.`,
                },
            ];
            return variants[idx];
        }

        case 'BACK_SPLIT': {
            const variants: ReadonlyArray<VariedExplanationCopy> = [
                {
                    summary: `Séparer vos pions arrières avec ${opt} prépare une ancre avancée et duplique les dés adverses.`,
                    whyFailed: `Jouer ${pld} laisse vos deux pions arrières passifs sur la case 24 sans préparer d'ancre défensive.`,
                    whyOptimal: `Le coup optimal ${opt} avance un pion arrière vers la case 20/21 tout en descendant un bâtisseur actif.`,
                    advice: `Séparer ses pions arrières tôt multiplie les lancers d'ancrage et gêne le développement adverse.`,
                },
                {
                    summary: `Dynamisme d'ouverture : ${opt} activait un split arrière contrairement au coup passif ${pld}.`,
                    whyFailed: `Avec ${pld}, vos deux dames du fond restent collées sur la case 24 et subissent le jeu.`,
                    whyOptimal: `La ligne ${opt} sépare vos arrières pour menacer immédiatement de prendre une ancre haute.`,
                    advice: `En début de manche, avancer un pion du 24 vers le 20 ou 21 force l'adversaire à un choix délicat.`,
                },
                {
                    summary: `Split & Bâtisseur : ${opt} combinait défense arrière et développement mieux que ${pld}.`,
                    whyFailed: `Votre coup ${pld} brûle vos deux dés sur la même zone au lieu d'agir sur les deux fronts.`,
                    whyOptimal: `En jouant ${opt}, un dé prépare l'ancre arrière tandis que l'autre descend un constructeur du 13.`,
                    advice: `L'équilibre parfait en ouverture : un dé pour séparer l'arrière (24), un dé pour descendre du Midpoint (13).`,
                },
                {
                    summary: `Préparation d'ancre : ${opt} séparait vos pions reculés au lieu de ${pld}.`,
                    whyFailed: `Choisir ${pld} laisse l'adversaire construire tranquillement ses portes sans contre-menace chez lui.`,
                    whyOptimal: `Le coup ${opt} plante un éclaireur sur une flèche haute adverse et multiplie vos bons dés au prochain tour.`,
                    advice: `Un pion avancé sur le 20 ou 21 vous donne tous les 1, 3, 4 et 6 pour ancrer ou vous évader ensuite.`,
                },
                {
                    summary: `Initiative sur les deux ailes : le moteur préfère le split ${opt} à ${pld}.`,
                    whyFailed: `En validant ${pld}, votre arrière-garde reste figée et perd un précieux tour de développement.`,
                    whyOptimal: `La variante ${opt} conteste immédiatement le jan adverse tout en alimentant votre outfield.`,
                    advice: `Ne laissez jamais vos deux pions arrières dormir sur la flèche 24 quand l'adversaire n'a pas encore de jan fort.`,
                },
                {
                    summary: `Flexibilité d'ouverture : ${opt} ouvrait le jeu par un split arrière face à ${pld}.`,
                    whyFailed: `Le déplacement ${pld} empile vos pions à l'avant sans créer de relais pour sortir du fond.`,
                    whyOptimal: `Avec ${opt}, vous créez un point d'appui avancé et dupliquez les dés d'attaque adverses.`,
                    advice: `C'est au tout début de la manche, quand le jan adverse est vide, que le split arrière est le moins risqué !`,
                },
                {
                    summary: `Contre-jeu préventif : ${opt} séparait les dames du 24 contrairement à ${pld}.`,
                    whyFailed: `Votre option ${pld} joue de façon trop recroquevillée et abandonne le contrôle du camp adverse.`,
                    whyOptimal: `Jouer ${opt} avance résolument un pion arrière pour disputer les cases 20 et 21.`,
                    advice: `Un split précoce oblige l'adversaire à choisir entre vous frapper à découvert ou construire chez lui.`,
                },
                {
                    summary: `Développement bilatéral : ${opt} activait l'arrière-garde ignorée par ${pld}.`,
                    whyFailed: `Avec ${pld}, vous négligez de mettre en mouvement vos pions les plus éloignés de la sortie.`,
                    whyOptimal: `L'action ${opt} amorce la sortie d'un pion arrière tout en plaçant un bâtisseur au centre.`,
                    advice: `Chaque case gagnée par un pion arrière en ouverture facilite toute votre stratégie de milieu de jeu.`,
                },
                {
                    summary: `Pression sur les ancres hautes : ${opt} lançait un split actif au lieu de ${pld}.`,
                    whyFailed: `Jouer ${pld} laisse le champ totalement libre aux constructeurs adverses.`,
                    whyOptimal: `Le choix ${opt} place une sentinelle sur le point 20/21 qui menace à la fois d'ancrer et de frapper.`,
                    advice: `Les Grands-Maîtres utilisent systématiquement les petits dés d'ouverture pour séparer les pions arrières.`,
                },
                {
                    summary: `Coordination Arrière/Centre : ${opt} surclasse ${pld} par son activité tactique.`,
                    whyFailed: `En jouant ${pld}, vous gardez une structure trop passive à l'arrière du plateau.`,
                    whyOptimal: `Le coup optimal ${opt} répartit l'effort entre la préparation d'une ancre et l'apport d'un bâtisseur.`,
                    advice: `Pensez toujours à activer vos deux pions du 24 dès les premiers tours avant que le piège ne se referme.`,
                },
            ];
            return variants[idx];
        }

        case 'MIDPOINT_UNSTACK': {
            const variants: ReadonlyArray<VariedExplanationCopy> = [
                {
                    summary: `Dégorger le Midpoint (point 13) avec ${opt} active vos bâtisseurs pour couvrir une porte au prochain tour.`,
                    whyFailed: `Jouer ${pld} conserve une pile rigide sur le point 13 et réduit vos bons lancers constructeurs sur 36.`,
                    whyOptimal: `Le coup optimal ${opt} place un bâtisseur actif (cases 8 à 11) qui multiplie vos dés de fermeture.`,
                    advice: `Dégorgez la pile de 5 pions du point 13 pour alimenter vos bâtisseurs d'attaque.`,
                },
                {
                    summary: `Activation des bâtisseurs : ${opt} dégorgeait la pile du 13 contrairement à ${pld}.`,
                    whyFailed: `Avec ${pld}, 5 pions restent empilés sans rendement sur le Midpoint pendant que votre attaque manque de munitions.`,
                    whyOptimal: `La ligne ${opt} descend un constructeur dans l'outfield pour préparer la prise des points 7, 5 ou 4.`,
                    advice: `Les pions du point 13 au-delà du deuxième sont des « spares » faits pour être descendus en bâtisseurs !`,
                },
                {
                    summary: `Génération de lancers constructifs : ${opt} mobilisait le Midpoint au lieu de ${pld}.`,
                    whyFailed: `Votre coup ${pld} fige votre réserve du point 13 et appauvrit votre prochain lancer.`,
                    whyOptimal: `En jouant ${opt}, vous déployez des bâtisseurs sur les flèches 9–11 qui travaillent en synergie avec le 8 et le 6.`,
                    advice: `Plus vous avez de flèches différentes occupées entre 8 et 11, plus vous aurez de combinaisons pour fermer des portes.`,
                },
                {
                    summary: `Lutte contre les piles (« Candlesticks ») : ${opt} déchargeait le point 13 face à ${pld}.`,
                    whyFailed: `Choisir ${pld} laisse des tours de 5 pions immobiles (« chandeliers ») qui étouffent votre flexibilité.`,
                    whyOptimal: `Le coup ${opt} met vos pions de réserve au travail dans la zone de construction.`,
                    advice: `Au Backgammon moderne, une pile de 5 ou 6 pions sur la même flèche est un capital dormant : faites-le circuler !`,
                },
                {
                    summary: `Apport de munitions tactiques : le moteur impose ${opt} pour dégorger le 13 contre ${pld}.`,
                    whyFailed: `En validant ${pld}, vous manquez de constructeurs à portée directe de votre jan intérieur.`,
                    whyOptimal: `La variante ${opt} amène un pion du 13 à distance idéale pour couvrir une porte au tour suivant.`,
                    advice: `Pour fermer le point 5 ou le point 7 sans laisser de blot, il vous faut au moins 3 flèches sources actives.`,
                },
                {
                    summary: `Circulation des réserves : ${opt} faisait descendre le Midpoint au lieu de ${pld}.`,
                    whyFailed: `Le déplacement ${pld} dégarnit vos flèches courtes ou empile le point 6 sans toucher à la réserve du 13.`,
                    whyOptimal: `Avec ${opt}, le point 13 alimente harmonieusement votre zone d'attaque extérieure.`,
                    advice: `Évitez d'empiler le point 6 quand vous pouvez faire descendre un bâtisseur souple depuis le point 13.`,
                },
                {
                    summary: `Richesse du prochain lancer (/36) : ${opt} déployait un bâtisseur du 13 face à ${pld}.`,
                    whyFailed: `Votre option ${pld} réduit le nombre de dés sur 36 capables de fabriquer une porte au prochain tour.`,
                    whyOptimal: `Jouer ${opt} maximise votre couverture combinatoire grâce à un bâtisseur frais dans l'outfield.`,
                    advice: `Un bon coup de développement se juge au nombre de lancers sur 36 qui deviennent excellents au tour d'après.`,
                },
                {
                    summary: `Fluidité du Midpoint : ${opt} libérait un constructeur du 13 ignoré par ${pld}.`,
                    whyFailed: `Avec ${pld}, votre structure reste lourde au centre et manque de relais intermédiaires.`,
                    whyOptimal: `L'action ${opt} crée un pont naturel entre la flèche 13 et la flèche 8.`,
                    advice: `Placer un bâtisseur sur le 9, le 10 ou le 11 double instantanément vos chances de fermer le Bar Point ou le 5.`,
                },
                {
                    summary: `Dynamisme de construction : ${opt} activait vos spares du 13 contrairement à ${pld}.`,
                    whyFailed: `Jouer ${pld} joue de manière trop statique et sous-utilise votre réserve centrale.`,
                    whyOptimal: `Le choix ${opt} mobilise un pion du Midpoint pour menacer toute la zone de construction.`,
                    advice: `Ne gardez que 3 ou 4 pions sur le point 13 : les autres doivent descendre préparer vos portes !`,
                },
                {
                    summary: `Préparation d'attaque : ${opt} amenait un bâtisseur du 13, bien supérieur à ${pld}.`,
                    whyFailed: `En jouant ${pld}, vous n'ajoutez aucun nouvel angle d'attaque pour votre prochain jet de dés.`,
                    whyOptimal: `Le coup optimal ${opt} positionne un constructeur actif qui met votre jan sous haute tension positive.`,
                    advice: `Les Grands-Maîtres préparent toujours leurs portes un tour à l'avance en descendant les pions du 13.`,
                },
            ];
            return variants[idx];
        }

        case 'POSITIONAL_FLEXIBILITY':
        default: {
            const variants: ReadonlyArray<VariedExplanationCopy> = [
                {
                    summary: `Votre coup ${pld} perd en flexibilité positionnelle (-${Math.abs(ctx.equityLoss).toFixed(3)} d'équité) par rapport à ${opt}.`,
                    whyFailed: `Le coup joué ${pld} réduit la flexibilité de vos bâtisseurs et diminue vos bons dés au tour suivant.`,
                    whyOptimal: `Le coup optimal ${opt} répartit mieux vos pions de réserve (spares) et maximise vos lancers constructifs sur 36.`,
                    advice: `Évaluez toujours la souplesse de votre structure et la distribution de vos pions avant de valider.`,
                },
                {
                    summary: `Harmonie des bâtisseurs : ${opt} conserve une bien meilleure coordination que ${pld}.`,
                    whyFailed: `Avec ${pld}, vos pions s'entassent sur des flèches peu productives et perdent en synergie.`,
                    whyOptimal: `La ligne ${opt} distribue vos pions de réserve de manière équilibrée pour couvrir tous les prochains jets.`,
                    advice: `Une bonne structure au Backgammon évite les tours hautes (« chandeliers ») et étale les pions actifs.`,
                },
                {
                    summary: `Souplesse combinatoire : ${opt} maximise vos bons lancers sur 36 contrairement à ${pld}.`,
                    whyFailed: `Votre coup ${pld} rigidifie votre position et vous laissera davantage de mauvais dés au tour suivant.`,
                    whyOptimal: `En jouant ${opt}, vous gardez un pion de réserve sur chaque point clé pour réagir à n'importe quel jet.`,
                    advice: `Garder un 3e pion (« spare ») sur vos portes clés vous évite de devoir les casser au prochain lancer.`,
                },
                {
                    summary: `Gestion des pions de réserve (Spares) : ${opt} surclasse ${pld} en fluidité.`,
                    whyFailed: `Choisir ${pld} dégarnit une porte jusqu'à 2 pions figés (« stripped point ») ou empile une case basse.`,
                    whyOptimal: `Le coup ${opt} préserve l'équilibre de vos portes et maintient une excellente connectivité.`,
                    advice: `Une porte réduite à exactement 2 pions (« stripped ») devient rigide et risque de casser sur un gros dé.`,
                },
                {
                    summary: `Coordination globale : le moteur recommande ${opt} plutôt que ${pld} (-${Math.abs(ctx.equityLoss).toFixed(3)} EMG).`,
                    whyFailed: `En validant ${pld}, vous perdez de la souplesse entre votre arrière-garde et vos constructeurs.`,
                    whyOptimal: `La variante ${opt} maintient vos lignes de communication ouvertes et optimise votre équité 3-ply.`,
                    advice: `Assurez-vous toujours que vos pions se protègent et se relaient mutuellement à moins de 6 cases.`,
                },
                {
                    summary: `Qualité de distribution : ${opt} évite les rigidités créées par ${pld}.`,
                    whyFailed: `Le déplacement ${pld} gaspille du potentiel en plaçant un pion là où il ne construit plus rien.`,
                    whyOptimal: `Avec ${opt}, chaque pion déplacé conserve un rôle actif pour les deux prochains tours.`,
                    advice: `Avant d'enterrer un pion sur une flèche basse (1, 2 ou 3), cherchez un coup qui le garde actif plus haut !`,
                },
                {
                    summary: `Préparation du prochain tour : ${opt} offre nettement plus de suites favorables que ${pld}.`,
                    whyFailed: `Votre option ${pld} résout le tour actuel mais dégrade la géométrie de votre plateau pour la suite.`,
                    whyOptimal: `Jouer ${opt} anticipe les 36 lancers suivants et maximise votre rendement moyen.`,
                    advice: `Pensez avec un coup d'avance : quel plateau laisse le plus de dés constructifs au tour suivant ?`,
                },
                {
                    summary: `Équilibre structurel : ${opt} garde une géométrie supérieure au déplacement ${pld}.`,
                    whyFailed: `Avec ${pld}, vous créez un déséquilibre entre l'attaque, la course et la sécurité de vos blocs.`,
                    whyOptimal: `L'action ${opt} harmonise vos groupes de pions sans concéder de faiblesse tactique.`,
                    advice: `Les coups les plus forts au Backgammon améliorent deux zones du plateau simultanément.`,
                },
                {
                    summary: `Précision positionnelle : ${opt} bat ${pld} grâce à une meilleure économie de moyens.`,
                    whyFailed: `Jouer ${pld} consomme vos meilleurs pions de réserve sans créer de menace concrète.`,
                    whyOptimal: `Le choix ${opt} conserve vos munitions sur les flèches hautes tout en avançant proprement.`,
                    advice: `Protégez la souplesse de vos flèches 8, 7 et 6 : ce sont les moteurs de toute votre partie.`,
                },
                {
                    summary: `Finesse de Grand-Maître : ${opt} optimise votre potentiel sur 36 lancers face à ${pld}.`,
                    whyFailed: `En jouant ${pld}, vous laissez votre structure légèrement moins réactive aux prochains dés.`,
                    whyOptimal: `Le coup optimal ${opt} aligne parfaitement vos pions pour capter le maximum de lancers gagnants.`,
                    advice: `Ces écarts de précision positionnelle font toute la différence entre un bon joueur et un PR < 5 !`,
                },
            ];
            return variants[idx];
        }
    }
}

