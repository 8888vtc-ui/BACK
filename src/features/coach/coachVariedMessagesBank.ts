/**
 * @file src/features/coach/coachVariedMessagesBank.ts
 * @description Banque de 10 variantes d'explications naturelles de style Grand-Maître IA
 * pour chaque catégorie d'erreur (Videau / Cube et Déplacement de pions).
 * Garantit un ressenti IA vivant et non-répétitif à 0 € de coût API (0 ms).
 */

export type VariedCheckerCategory =
    | 'SHOT_EXPOSURE'
    | 'GOLDEN_POINT'
    | 'BAR_POINT'
    | 'PRIME_EXTEND'
    | 'TEMPO_HIT'
    | 'REAR_ESCAPE'
    | 'ENDGAME_CONTACT_BREAK'
    | 'PURE_RACE'
    | 'HOME_GATE'
    | 'ADVANCED_ANCHOR'
    | 'BACK_SPLIT'
    | 'MIDPOINT_UNSTACK'
    | 'POSITIONAL_FLEXIBILITY';

export type VariedCubeCategory =
    | 'PREMATURE_DOUBLE'
    | 'OPTIMISTIC_TAKE'
    | 'TIMID_PASS'
    | 'MISSED_DOUBLE';

export interface VariedExplanationCopy {
    readonly summary: string;
    readonly whyFailed: string;
    readonly whyOptimal: string;
    readonly advice: string;
}

export interface VariedCopyContext {
    readonly playedMove: string;
    readonly optimalMove: string;
    readonly equityLoss: number;
    readonly userShots?: number;
    readonly bestShots?: number;
    readonly playerPips?: number;
    readonly opponentPips?: number;
    readonly primeLength?: number;
    readonly blotsCount?: number;
    readonly seedExtra?: string | number;
}

/**
 * Hachage déterministe FNV-1a 32-bit pour sélectionner 1 variante parmi 10
 * sans scintillement React au sein d'un même coup, mais variée d'un tour à l'autre.
 */
export function selectVariantIndex(seed: string, modulo = 10): number {
    let hash = 2166136261;
    for (let i = 0; i < seed.length; i++) {
        hash ^= seed.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return Math.abs(hash >>> 0) % modulo;
}

function buildSeed(ctx: VariedCopyContext, category: string): string {
    const lossMilli = Math.round(Math.abs(ctx.equityLoss) * 1000);
    return `${category}|${ctx.playedMove}|${ctx.optimalMove}|${lossMilli}|${ctx.userShots ?? 0}|${ctx.playerPips ?? 0}|${ctx.seedExtra ?? ''}`;
}

/**
 * Retourne l'une des 10 variantes Grand-Maître pour une décision de VIDEAU (Cube).
 */
export function pickVariedCubeErrorCopy(
    category: VariedCubeCategory,
    ctx: VariedCopyContext,
): VariedExplanationCopy {
    const idx = selectVariantIndex(buildSeed(ctx, category), 10);
    const loss = Math.abs(ctx.equityLoss).toFixed(3);
    const opt = ctx.optimalMove;
    const pld = ctx.playedMove;

    const banks: Record<VariedCubeCategory, ReadonlyArray<VariedExplanationCopy>> = {
        PREMATURE_DOUBLE: [
            {
                summary: `Double prématuré (-${loss} EMG) : votre avantage ne suffit pas encore à ouvrir la fenêtre de marché.`,
                whyFailed: `Avec « ${pld} », vous cédez la propriété du videau alors que vos séquences de perte de marché restent trop rares.`,
                whyOptimal: `Conserver le videau (${opt}) vous laisse encaisser la volatilité sans offrir de recube gratuit.`,
                advice: `Attendez d'approcher ~66 % de chances de gain effectives avant d'envoyer le cube.`,
            },
            {
                summary: `Double prématuré (-${loss} EMG) : vous donnez le levier du recube à l'adversaire trop tôt.`,
                whyFailed: `Proposer « ${pld} » maintenant fige votre avantage potentiel et arme votre adversaire avec un cube à ×4.`,
                whyOptimal: `La ligne « ${opt} » garde la pression maximale tout en conservant l'option de doubler au prochain tour.`,
                advice: `Loi de Woolsey : si la position manque de séquences écrasantes au prochain lancer, gardez le cube au centre.`,
            },
            {
                summary: `Double prématuré (-${loss} EMG) : la position manque encore de menaces de gammon ou de tirs décisifs.`,
                whyFailed: `En choisissant « ${pld} », vous surestimez votre avance actuelle et offrez un Take facile en face.`,
                whyOptimal: `Jouer un tour supplémentaire (${opt}) permet de vérifier si vos dés améliorent réellement votre structure.`,
                advice: `Un bon double doit menacer de perdre son marché (Pass forcé) sur une part importante des 36 lancers.`,
            },
            {
                summary: `Double prématuré (-${loss} EMG) : le videau est un actif précieux qu'il ne faut pas brader.`,
                whyFailed: `L'action « ${pld} » transfère le contrôle du cube sans que l'adversaire ne soit sous réelle menace d'asphyxie.`,
                whyOptimal: `La décision « ${opt} » préserve votre flexibilité stratégique à coût nul.`,
                advice: `Tant que l'adversaire dispose de sorties confortables, patientez un tour de plus avant de doubler.`,
            },
            {
                summary: `Double prématuré (-${loss} EMG) : l'indice de Janowski indique que vous êtes sous le seuil de double.`,
                whyFailed: `Votre décision « ${pld} » sacrifie l'accès exclusif au videau pour un gain d'équité cubeful négatif.`,
                whyOptimal: `Rester sur « ${opt} » protège votre équité en cas de mauvais lancer au tour suivant.`,
                advice: `En position de contact équilibrée, le propriétaire du videau détient un avantage décisif : ne le donnez pas tôt.`,
            },
            {
                summary: `Double prématuré (-${loss} EMG) : vous doublez dans une position encore trop fluide.`,
                whyFailed: `Avec « ${pld} », l'adversaire accepte confortablement et retourne la pression dès le premier retournement de dés.`,
                whyOptimal: `Choisir « ${opt} » vous permet de voir le prochain lancer gratuitement sans risque de contre-videau.`,
                advice: `Ne confondez pas un léger avantage positionnel avec une véritable fenêtre de double.`,
            },
            {
                summary: `Double prématuré (-${loss} EMG) : trop peu de lancers sur 36 vous font passer au-dessus du Cash Point.`,
                whyFailed: `En annonçant « ${pld} », vous payez le prix fort de la cession du cube sans forcer de dilemme adverse.`,
                whyOptimal: `La recommandation moteur (${opt}) maintient l'équilibre cubeful optimal.`,
                advice: `Comptez vos lancers constructeurs : s'ils sont inférieurs à 8–10 sur 36, différez le videau.`,
            },
            {
                summary: `Double prématuré (-${loss} EMG) : votre avance de course ou de structure est encore réversible.`,
                whyFailed: `Le choix « ${pld} » expose votre match à un contre-double dévastateur si l'adversaire frappe ou s'évade.`,
                whyOptimal: `Attendre avec « ${opt} » maximise votre espérance de gain sur l'ensemble des 36 lancers.`,
                advice: `Gardez le cube en réserve tant que les pions arrières adverses ont des portes d'évasion directes.`,
            },
            {
                summary: `Double prématuré (-${loss} EMG) : le timing du videau est trop hâtif d'au moins un tour.`,
                whyFailed: `Votre action « ${pld} » transforme une position légèrement favorable en pari à haute variance pour vous.`,
                whyOptimal: `Suivre « ${opt} » laisse mûrir vos menaces tactiques avant d'engager le multiplicateur.`,
                advice: `Au Backgammon de haut niveau, retenir un cube marginal rapporte souvent plus que de forcer l'action.`,
            },
            {
                summary: `Double prématuré (-${loss} EMG) : la fenêtre de marché n'est pas encore atteinte.`,
                whyFailed: `Jouer « ${pld} » donne à l'adversaire un Take évident assorti d'un puissant levier de recube.`,
                whyOptimal: `Conserver la main (${opt}) reste strictement supérieur selon l'évaluation cubeful.`,
                advice: `Vérifiez toujours si un bon lancer vous ferait réellement perdre votre marché avant de tourner le cube.`,
            },
        ],
        OPTIMISTIC_TAKE: [
            {
                summary: `Take trop optimiste (-${loss} EMG) : vos chances de retournement sont tombées sous le Take Point.`,
                whyFailed: `En choisissant « ${pld} », vous acceptez de jouer pour le double des points dans une position déjà perdante.`,
                whyOptimal: `Refuser le videau (${opt}) limite votre perte immédiate à 1 fois la mise actuelle.`,
                advice: `En Money Game ou score neutre, passez dès que votre probabilité de gain cubeful passe sous ~21,5 %–25 %.`,
            },
            {
                summary: `Take trop optimiste (-${loss} EMG) : le risque de gammon adverse rend cette prise mathématiquement trop chère.`,
                whyFailed: `Accepter avec « ${pld} » ignore le poids des gammons qui alourdit sévèrement votre seuil de Take.`,
                whyOptimal: `La décision « ${opt} » sauvegarde vos points de match pour une manche plus favorable.`,
                advice: `Quand l'adversaire attaque avec un jan intérieur fort, votre Take Point monte nettement au-dessus de 25 %.`,
            },
            {
                summary: `Take trop optimiste (-${loss} EMG) : le Cash Point adverse est déjà franchi.`,
                whyFailed: `Votre prise « ${pld} » sous-estime l'écart de course ou le verrouillage structurel de l'adversaire.`,
                whyOptimal: `Passer proprement (${opt}) est la discipline essentielle des grands joueurs de tournoi.`,
                advice: `Savoir abandonner un point à temps est la clé pour protéger son Performance Rating (PR).`,
            },
            {
                summary: `Take trop optimiste (-${loss} EMG) : trop peu de séquences favorables vous permettent de revenir.`,
                whyFailed: `Avec « ${pld} », même le levier du recube ne compense pas votre déficit d'équité actuel.`,
                whyOptimal: `Le moteur valide « ${opt} » : encaisser la perte simple coûte nettement moins cher.`,
                advice: `En course pure, utilisez les formules de Keith ou d'Isight pour repérer le seuil exact de Pass.`,
            },
            {
                summary: `Take trop optimiste (-${loss} EMG) : vous défendez une position où le contre-jeu est épuisé.`,
                whyFailed: `Choisir « ${pld} » vous expose à perdre le double (voire le quadruple en cas de gammon) sans ancre solide.`,
                whyOptimal: `Opter pour « ${opt} » coupe immédiatement l'hémorragie d'équité.`,
                advice: `Sans ancre avancée ni contact direct, ne prenez jamais un cube sur un simple espoir de doubles dés.`,
            },
            {
                summary: `Take trop optimiste (-${loss} EMG) : l'adversaire a déjà perdu son marché mais dans le bon sens (Too Good / Pass).`,
                whyFailed: `L'action « ${pld} » transforme une manche perdue d'un point en catastrophe potentielle au tableau d'affichage.`,
                whyOptimal: `Rendre les armes sur cette manche (${opt}) préserve intactes vos chances dans le match.`,
                advice: `Évaluez froidement vos portes de sortie : si moins de 1 lancer sur 5 vous sauve, c'est un Pass clair.`,
            },
            {
                summary: `Take trop optimiste (-${loss} EMG) : la structure adverse étouffe vos dernières ressources tactiques.`,
                whyFailed: `Accepter le cube (${pld}) revient à payer une prime de risque disproportionnée face au mur adverse.`,
                whyOptimal: `La ligne « ${opt} » respecte la mathématique du Take Point ajusté au score.`,
                advice: `Méfiez-vous des positions « mirages » où vous avez encore du contact mais zéro timing pour l'exploiter.`,
            },
            {
                summary: `Take trop optimiste (-${loss} EMG) : l'écart de pips et de tempo dépasse le seuil de tolérance.`,
                whyFailed: `En jouant « ${pld} », vous offrez à l'adversaire une espérance de gain supérieure à +1,00 EMG.`,
                whyOptimal: `La sagesse commande « ${opt} » afin de repartir à zéro sur la manche suivante.`,
                advice: `Un bon joueur gagne autant de matchs par les cubes qu'il refuse que par ceux qu'il envoie.`,
            },
            {
                summary: `Take trop optimiste (-${loss} EMG) : la valeur du recube est neutralisée par la domination adverse.`,
                whyFailed: `Prendre avec « ${pld} » ne vous donne presque aucun scénario réaliste de retournement de videau.`,
                whyOptimal: `Choisir « ${opt} » verrouille votre perte au minimum légal.`,
                advice: `Plus la position est basse en volatilité, plus votre seuil de Take doit être strict (~22 %–25 %).`,
            },
            {
                summary: `Take trop optimiste (-${loss} EMG) : le rapport risque/récompense penche nettement vers le Pass.`,
                whyFailed: `Votre décision « ${pld} » concède ${loss} d'équité cubeful par rapport au refus immédiat.`,
                whyOptimal: `S'incliner avec « ${opt} » est le choix mathématiquement irréprochable ici.`,
                advice: `Ne laissez jamais la frustration d'un bon lancer adverse vous pousser à un Take d'orgueil.`,
            },
        ],
        TIMID_PASS: [
            {
                summary: `Pass trop frileux (-${loss} EMG) : vous aviez largement les ressources pour accepter ce videau !`,
                whyFailed: `En déclarant « ${pld} », vous abandonnez 100 % de la mise alors que votre équité de prise était supérieure.`,
                whyOptimal: `Accepter le cube (${opt}) vous donnait le levier exclusif du recube à ×4 en cas de retour.`,
                advice: `Loi de Woolsey : dans le doute sur une décision serrée, prenez le videau plutôt que de passer !`,
            },
            {
                summary: `Pass trop frileux (-${loss} EMG) : la possession du videau réduisait votre seuil de Take autour de ~21,5 %.`,
                whyFailed: `Votre refus « ${pld} » sous-estime la puissance du levier de recube que vous obteniez en prenant.`,
                whyOptimal: `Prendre avec « ${opt} » obligeait encore l'adversaire à convertir sa position sans erreur.`,
                advice: `En position de contact, un seul tir direct touché suffit souvent à retourner complètement le match.`,
            },
            {
                summary: `Pass trop frileux (-${loss} EMG) : vous rendez les armes alors que le contact vous offre un vrai contre-jeu.`,
                whyFailed: `L'action « ${pld} » offre un point gratuit à l'adversaire sur un double pourtant prenable.`,
                whyOptimal: `La ligne « ${opt} » capitalise sur vos chances de frappe et sur la propriété du cube.`,
                advice: `Tant que vous tenez une ancre haute et un jan intérieur décent, vos chances dépassent souvent 25 %.`,
            },
            {
                summary: `Pass trop frileux (-${loss} EMG) : l'écart à la course ne justifiait pas encore d'abandonner.`,
                whyFailed: `Choisir « ${pld} » surestime l'avance adverse : la fenêtre de marché restait ouverte pour un Take.`,
                whyOptimal: `Prendre (${opt}) est obligatoire dès que vos chances de victoire cubeful franchissent le Take Point.`,
                advice: `En course pure, tant que l'écart reste dans la marge de tolérance de Keith/Isight, prenez résolument.`,
            },
            {
                summary: `Pass trop frileux (-${loss} EMG) : vous laissez filer une défense tout à fait viable.`,
                whyFailed: `Avec « ${pld} », vous cédez à l'intimidation du videau sans que le risque de gammon ne soit rédhibitoire.`,
                whyOptimal: `Accepter (${opt}) punit les doubles agressifs et maintient la pression psychologique.`,
                advice: `Si un adversaire comprend que vous passez trop facilement, il vous doublera à la moindre occasion.`,
            },
            {
                summary: `Pass trop frileux (-${loss} EMG) : la volatilité restante jouait en votre faveur comme preneur du cube.`,
                whyFailed: `Votre décision « ${pld} » ignore la valeur d'option du recube (Dead Cube vs Live Cube).`,
                whyOptimal: `Le moteur recommande clairement « ${opt} » pour exploiter chaque séquence de retournement.`,
                advice: `Un preneur de videau gagne deux armes : continuer à jouer ET être le seul à pouvoir doubler ensuite.`,
            },
            {
                summary: `Pass trop frileux (-${loss} EMG) : l'adversaire avait un bon double, mais vous aviez un bon Take !`,
                whyFailed: `En jouant « ${pld} », vous confondez « bon double adverse » et « Pass obligatoire ».`,
                whyOptimal: `La majorité des bons doubles au Backgammon sont des « Double / Take » (${opt}), pas des Pass.`,
                advice: `La fenêtre entre le point de Double (~66 %) et le Cash Point (~76 %) est large : c'est la zone du Take !`,
            },
            {
                summary: `Pass trop frileux (-${loss} EMG) : vos chances de gain cubeful justifiaient pleinement d'accepter.`,
                whyFailed: `Abandonner via « ${pld} » vous coûte ${loss} EMG d'espérance mathématique nette.`,
                whyOptimal: `Rester dans la manche avec « ${opt} » minimise votre perte moyenne sur le long terme.`,
                advice: `Même mené, vérifiez toujours si un double ou un tir chanceux au prochain tour vous remet dans la course.`,
            },
            {
                summary: `Pass trop frileux (-${loss} EMG) : votre structure défensive limitait suffisamment les gammons adverses.`,
                whyFailed: `Refuser avec « ${pld} » traite la position comme si vous risquiez un gammon massif, ce qui n'est pas le cas.`,
                whyOptimal: `Prendre (${opt}) tire parti de votre ancre pour absorber la pression adverse.`,
                advice: `Sans menace sérieuse de gammon, il ne vous faut qu'un peu plus de 1 victoire sur 5 pour prendre le cube.`,
            },
            {
                summary: `Pass trop frileux (-${loss} EMG) : le verdict cubeful est sans appel en faveur de la prise.`,
                whyFailed: `Le choix « ${pld} » concède un point certain là où le combat offrait encore de vraies ressources.`,
                whyOptimal: `Saisir le cube (${opt}) était la réponse de Grand-Maître attendue sur cette position.`,
                advice: `Travaillez vos seuils de Take Point : défendre courageusement le videau abaisse drastiquement votre PR.`,
            },
        ],
        MISSED_DOUBLE: [
            {
                summary: `Videau oublié (-${loss} EMG) : vous étiez en pleine fenêtre de marché avant de lancer les dés !`,
                whyFailed: `En jouant « ${pld} », vous laissez passer l'occasion de doubler la mise sur une position mûre.`,
                whyOptimal: `Envoyer le videau (${opt}) forçait l'adversaire à un choix critique sous haute pression.`,
                advice: `Avant chaque lancer de dés, posez-vous le réflexe : « Un bon lancer me fait-il perdre mon marché ? »`,
            },
            {
                summary: `Videau oublié (-${loss} EMG) : vos séquences de perte de marché imposaient de tourner le cube.`,
                whyFailed: `Omettre le videau (${pld}) vous prive du multiplicateur ×2 sur vos meilleurs lancers à venir.`,
                whyOptimal: `La décision « ${opt} » maximise immédiatement la valeur de votre avantage positionnel.`,
                advice: `Dès qu'environ 8 à 12 lancers sur 36 transforment la position en Pass écrasant, doublez maintenant !`,
            },
            {
                summary: `Videau oublié (-${loss} EMG) : vous jouez pour 1 point une position qui en vaut déjà 2.`,
                whyFailed: `Avec « ${pld} », si vous réalisez un gros lancer maintenant, l'adversaire passera au tour suivant pour 1 seul point.`,
                whyOptimal: `Proposer « ${opt} » avant de rouler capture toute la valeur de la volatilité imminente.`,
                advice: `C'est l'essence du Market Window : on double juste avant le lancer qui risque de tuer le suspense.`,
            },
            {
                summary: `Videau oublié (-${loss} EMG) : votre domination tactique ou à la course méritait le videau.`,
                whyFailed: `Lancer les dés sans doubler (${pld}) laisse l'adversaire espérer un retournement à moindre coût.`,
                whyOptimal: `Le moteur signale « ${opt} » : faites payer le juste prix à l'adversaire pour voir la suite.`,
                advice: `En attaque (Blitz) ou en prime verrouillée, la volatilité est maximale : n'oubliez jamais le cube.`,
            },
            {
                summary: `Videau oublié (-${loss} EMG) : opportunité de Cash ou de Double/Take manquée avant le jet.`,
                whyFailed: `En restant sur « ${pld} », vous sous-exploitez votre avantage d'équité de ${loss} EMG.`,
                whyOptimal: `Activer le videau (${opt}) convertit votre supériorité sur le plateau en points au score.`,
                advice: `Un avantage positionnel non doublé à temps perd la moitié de sa valeur théorique en tournoi.`,
            },
            {
                summary: `Videau oublié (-${loss} EMG) : la règle de Janowski commandait d'envoyer le cube à ce tour précis.`,
                whyFailed: `Votre oubli (« ${pld} ») offre un tour gratuit à votre adversaire dans une position critique.`,
                whyOptimal: `Tourner le videau (${opt}) était la décision cubeful n°1 du moteur.`,
                advice: `Prenez une demi-seconde d'arrêt systématique avant de cliquer sur les dés lorsque le cube vous appartient.`,
            },
            {
                summary: `Videau oublié (-${loss} EMG) : vos menaces de frappe et de couverture creusaient l'écart.`,
                whyFailed: `Passer à côté du double (${pld}) réduit fortement votre rendement sur les lancers constructeurs.`,
                whyOptimal: `L'action « ${opt} » met immédiatement l'adversaire face à ses responsabilités au Take Point.`,
                advice: `Quand vous avez un pion adverse à la barre ou plusieurs bâtisseurs prêts à fermer, vérifiez toujours le cube !`,
            },
            {
                summary: `Videau oublié (-${loss} EMG) : l'avance à la course avait franchi le seuil d'action du videau.`,
                whyFailed: `Continuer à ×1 (${pld}) gaspille une fenêtre de double idéale où la course tourne en votre faveur.`,
                whyOptimal: `La recommandation « ${opt} » s'appuie sur l'efficacité nette de votre avance en pips.`,
                advice: `En course sans contact, dès que votre avance atteint ~8 %–10 % du compte de pips, le double s'impose.`,
            },
            {
                summary: `Videau oublié (-${loss} EMG) : vous aviez le contrôle total du tempo pour doubler.`,
                whyFailed: `Ne pas doubler (${pld}) laisse la porte ouverte à un jet miracle adverse sans avoir encaissé d'équité.`,
                whyOptimal: `Engager le cube (${opt}) punit immédiatement la fragilité de la position adverse.`,
                advice: `Les Grands-Maîtres gagnent la majorité de leurs points de PR grâce à une vigilance constante sur le videau.`,
            },
            {
                summary: `Videau oublié (-${loss} EMG) : fenêtre de double manquée au sommet de votre initiative.`,
                whyFailed: `L'action « ${pld} » laisse dormir le videau alors que tous les voyants stratégiques étaient au vert.`,
                whyOptimal: `La ligne optimale « ${opt} » encaisse votre avantage avant que les dés ne parlent.`,
                advice: `Installez une routine mentale fixe : 1) Regarder le score, 2) Évaluer le videau, 3) Lancer les dés.`,
            },
        ],
    };

    return banks[category][idx];
}

export { pickVariedCheckerErrorCopy } from './coachVariedCheckerBank';

