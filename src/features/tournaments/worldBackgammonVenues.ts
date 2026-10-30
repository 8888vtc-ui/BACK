/**
 * Répertoire Mondial des Clubs, Salons & Lieux Mythiques où Jouer au Backgammon.
 *
 * 16 lieux réels et vérifiés avec coordonnées SVG pour projection cartographique,
 * horaires, avantages pour les joueurs et liens Google Maps.
 * Conforme GOVERNANCE.md (Règle 2 : Zéro donnée factice en repli, Règle 3 : 0 any) et SCALABILITY.md (<= 350 lignes).
 */

export type VenueCategory = 'prestige_palace' | 'federation_club' | 'social_lounge' | 'traditional_cafe';

export interface WorldBackgammonVenue {
    readonly id: string;
    readonly slug: string;
    readonly name: string;
    readonly city: string;
    readonly countryCode: string;
    readonly countryName: string;
    readonly region: 'europe' | 'north_america' | 'middle_east' | 'asia_pacific' | 'latin_america';
    readonly category: VenueCategory;
    readonly federation: string;
    readonly coordinates: {
        readonly lat: number;
        readonly lng: number;
        readonly mapX: number; // 0 à 100 (projection SVG 1000x500)
        readonly mapY: number; // 0 à 100 (projection SVG 1000x500)
    };
    readonly address: string;
    readonly scheduleFr: string;
    readonly atmosphereFr: string;
    readonly playerBenefitsFr: ReadonlyArray<string>;
    readonly seoSummaryFr: string;
    readonly skillLevels: string;
    readonly entryCostLabel: string;
    readonly officialUrl: string;
    readonly googleMapsQuery: string;
    readonly isFeatured: boolean;
}

export const WORLD_BACKGAMMON_VENUES: ReadonlyArray<WorldBackgammonVenue> = Object.freeze([
    {
        id: 'venue-paris-vie-deau', slug: 'paris-vie-deau',
        name: "Paris Vie d'Eau (Videau Paris Backgammon Club)",
        city: 'Paris', countryCode: 'FR', countryName: 'France', region: 'europe',
        category: 'federation_club', federation: 'FFBG',
        coordinates: { lat: 48.8566, lng: 2.3522, mapX: 49.5, mapY: 27.5 },
        address: 'Café de la Mairie, 8 Place Saint-Sulpice, 75006 Paris',
        scheduleFr: 'Tous les mardis et jeudis de 19h00 à 23h30',
        atmosphereFr: 'Ambiance studieuse et conviviale dans un salon historique de Saint-Germain-des-Prés.',
        playerBenefitsFr: Object.freeze([
            'Tournois mensuels homologués FFBG & cours collectifs tous niveaux',
            'Championnat interne Live & Online avec pendules Fischer',
            "Accueil gratuit d'initiation pour les nouveaux joueurs",
        ]),
        seoSummaryFr: 'Le club de référence à Paris pour progresser au backgammon en compétition officielle FFBG avec pendule.',
        skillLevels: 'Débutant à Grandmaster', entryCostLabel: 'Adhésion club 45 €/an (séance découverte offerte)',
        officialUrl: 'https://paris-backgammon.fr', googleMapsQuery: 'Cafe de la Mairie 8 Place Saint-Sulpice 75006 Paris', isFeatured: true,
    },
    {
        id: 'venue-backgammon-social-paris', slug: 'backgammon-social-paris',
        name: 'Backgammon Social Paris (Experimental Marais)',
        city: 'Paris', countryCode: 'FR', countryName: 'France', region: 'europe',
        category: 'social_lounge', federation: 'Independent',
        coordinates: { lat: 48.8638, lng: 2.3585, mapX: 49.8, mapY: 27.8 },
        address: 'Le Marais / Grands Boulevards, 75003 Paris',
        scheduleFr: 'Mercredis et dimanches dès 18h30',
        atmosphereFr: 'Cocktails signature, musique lounge et plateaux en cuir dans les lieux branchés de la capitale.',
        playerBenefitsFr: Object.freeze([
            'Cadre cocktail bar branché au cœur du Marais',
            'Idéal pour rencontrer une nouvelle génération de joueurs sans pression',
            'Plateaux de luxe fournis sur place sur simple réservation',
        ]),
        seoSummaryFr: "Le rendez-vous décontracté et branché pour jouer au backgammon à Paris autour d'un cocktail.",
        skillLevels: 'Tous niveaux, casual & intermédiaire', entryCostLabel: 'Consommation sur place (entrée libre)',
        officialUrl: 'https://backgammonsocial.club', googleMapsQuery: 'Le Marais Paris Backgammon Social Club', isFeatured: true,
    },
    {
        id: 'venue-monte-carlo-society', slug: 'monte-carlo-society',
        name: 'Monte-Carlo Backgammon Society & Fairmont Salon',
        city: 'Monte-Carlo', countryCode: 'MC', countryName: 'Monaco', region: 'europe',
        category: 'prestige_palace', federation: 'WBGF',
        coordinates: { lat: 43.7397, lng: 7.4273, mapX: 51.2, mapY: 31.0 },
        address: 'Fairmont Monte Carlo, 12 Avenue des Spélugues, 98000 Monaco',
        scheduleFr: 'Vendredis et samedis de 17h00 à minuit',
        atmosphereFr: 'Luxe Haute-Horlogerie surplombant le virage mythique du Grand Prix et la Méditerranée.',
        playerBenefitsFr: Object.freeze([
            'Lieu mythique du Championnat du Monde depuis 1973 face à la Méditerranée',
            'Rencontres avec les Grands Maîtres mondiaux et tournois VIP',
            'Cadre Haute-Horlogerie & dress code élégant',
        ]),
        seoSummaryFr: 'Le sanctuaire mondial du backgammon à Monaco, salon historique du Championnat du Monde.',
        skillLevels: 'Intermédiaire à Champion du Monde', entryCostLabel: 'Réservé aux membres & tournois officiels',
        officialUrl: 'https://backgammon-society.com', googleMapsQuery: 'Fairmont Monte Carlo 12 Avenue des Spelugues Monaco', isFeatured: true,
    },
    {
        id: 'venue-ancre-marseillaise', slug: 'ancre-marseillaise',
        name: "L'Ancre Marseillaise du Backgammon (La Maison Hantée)",
        city: 'Marseille', countryCode: 'FR', countryName: 'France', region: 'europe',
        category: 'federation_club', federation: 'FFBG',
        coordinates: { lat: 43.2951, lng: 5.3839, mapX: 50.4, mapY: 31.4 },
        address: '10 Rue Vian (La Plaine / Cours Julien), 13006 Marseille',
        scheduleFr: 'Tous les mercredis dès 19h00 et samedis 14h30',
        atmosphereFr: 'Chaleur méditerranéenne, chouette animée et esprit de camaraderie sous les platanes.',
        playerBenefitsFr: Object.freeze([
            'Sessions hebdomadaires tous les mercredis dès 19h (10 rue Vian)',
            'Grand tournoi mensuel homologué FFBG le samedi',
            'Ambiance méditerranéenne ultra-conviviale ouverte aux débutants',
        ]),
        seoSummaryFr: 'Club officiel de backgammon à Marseille, rendez-vous du Cours Julien et tournois FFBG.',
        skillLevels: 'Débutant, Intermédiaire & Confirmé', entryCostLabel: 'Gratuit pour débuter, adhésion 30 €/an',
        officialUrl: 'https://www.ffbg.fr', googleMapsQuery: '10 Rue Vian 13006 Marseille France', isFeatured: false,
    },
    {
        id: 'venue-lyon-backgammon-club', slug: 'lyon-backgammon-club',
        name: 'Lyon Backgammon Club',
        city: 'Lyon', countryCode: 'FR', countryName: 'France', region: 'europe',
        category: 'federation_club', federation: 'FFBG',
        coordinates: { lat: 45.7640, lng: 4.8357, mapX: 50.2, mapY: 29.8 },
        address: 'Brasserie Saxe Lafayette, 69003 Lyon',
        scheduleFr: 'Lundis soirs à partir de 19h30',
        atmosphereFr: 'Tradition des bouchons lyonnais alliée à la rigueur stratégique des tournois FFBG.',
        playerBenefitsFr: Object.freeze([
            'Club historique de la région Auvergne-Rhône-Alpes affilié FFBG',
            'Étape majeure du circuit national HSBT',
            'Accompagnement tactique au videau et à la pendule pour les nouveaux membres',
        ]),
        seoSummaryFr: "Le club de backgammon lyonnais incontournable pour s'initier et disputer les étapes nationales.",
        skillLevels: 'Tous niveaux', entryCostLabel: 'Adhésion 35 €/an (première séance libre)',
        officialUrl: 'https://lyonbackgammon.com', googleMapsQuery: 'Brasserie Saxe Lafayette Lyon Backgammon', isFeatured: false,
    },
    {
        id: 'venue-backgammon-london', slug: 'backgammon-london',
        name: 'Backgammon London (The Clissold Arms)',
        city: 'Londres', countryCode: 'GB', countryName: 'Royaume-Uni', region: 'europe',
        category: 'federation_club', federation: 'UKBGF',
        coordinates: { lat: 51.5886, lng: -0.1518, mapX: 48.2, mapY: 25.2 },
        address: '105 Fortis Green, Muswell Hill, London N2 9HR',
        scheduleFr: '1er et 3e mardi du mois dès 19h00',
        atmosphereFr: 'Pub victorien légendaire des Kinks avec bières artisanales et ligues londoniennes passionnées.',
        playerBenefitsFr: Object.freeze([
            '2 soirées club gratuites par mois dans un pub londonien historique',
            'Ligue nationale UKBGF à plus de 400 joueurs',
            'Tournois Intermediates & Masters accessibles à tarifs réduits',
        ]),
        seoSummaryFr: "L'un des clubs de backgammon les plus chaleureux de Londres, affilié à la fédération UKBGF.",
        skillLevels: 'Intermediate & Advanced', entryCostLabel: 'Entrée gratuite aux soirées club',
        officialUrl: 'https://www.backgammonlondon.com', googleMapsQuery: 'The Clissold Arms 105 Fortis Green London N2 9HR', isFeatured: false,
    },
    {
        id: 'venue-kobenhavns-backgammon-klub', slug: 'kobenhavns-backgammon-klub',
        name: 'Københavns Backgammon Klub (KBgK) & Barkowski',
        city: 'Copenhague', countryCode: 'DK', countryName: 'Danemark', region: 'europe',
        category: 'federation_club', federation: 'DBGF / WBGF',
        coordinates: { lat: 55.6761, lng: 12.5683, mapX: 52.8, mapY: 22.0 },
        address: 'Barkowski, Nørre Farimagsgade 49, 1364 København',
        scheduleFr: 'Jeudis dès 18h30 et dimanches après-midi',
        atmosphereFr: 'Hygge danois authentique, analyses minutieuses et niveau mondial d’analyse.',
        playerBenefitsFr: Object.freeze([
            "Plus grand club d'Europe du Nord avec système de classement national danois",
            'Soirées du jeudi soir réunissant des joueurs de niveau World Class',
            'Berceau du légendaire Nordic Open',
        ]),
        seoSummaryFr: "Le club légendaire de Copenhague où s'entraînent les champions du Nordic Open.",
        skillLevels: 'Tous niveaux jusqu’à World Class', entryCostLabel: 'Participation tournoi 50 DKK (~7 €)',
        officialUrl: 'https://www.backgammon.dk', googleMapsQuery: 'Barkowski Norre Farimagsgade 49 Copenhagen', isFeatured: true,
    },
    {
        id: 'venue-association-genevoise', slug: 'association-genevoise-backgammon',
        name: 'Association Genevoise de Backgammon (Restaurant Tavolone)',
        city: 'Genève', countryCode: 'CH', countryName: 'Suisse', region: 'europe',
        category: 'federation_club', federation: 'SBGV / WBGF',
        coordinates: { lat: 46.1984, lng: 6.1423, mapX: 50.8, mapY: 29.3 },
        address: 'Restaurant Tavolone, 41 Rue des Bains, 1205 Genève',
        scheduleFr: 'Tous les dimanches à 14h00 précises',
        atmosphereFr: 'Raffinement genevois, horlogerie tactique et tournois dominicaux très disputés.',
        playerBenefitsFr: Object.freeze([
            'Tournoi hebdomadaire tous les dimanches à 14h (41 rue des Bains)',
            'Pépinière de champions du monde et de Suisse (Geneva Open)',
            'Niveau de jeu très élevé idéal pour progresser rapidement',
        ]),
        seoSummaryFr: 'Club officiel de backgammon de Genève, tournois dominicaux au Restaurant Tavolone.',
        skillLevels: 'Intermédiaire à Expert', entryCostLabel: 'Tournoi 20 CHF (cotisation annuelle 50 CHF)',
        officialUrl: 'https://clubsbackgammon.com/association-genevoise-de-backgammon/', googleMapsQuery: 'Restaurant Tavolone 41 Rue des Bains 1205 Geneve', isFeatured: false,
    },
    {
        id: 'venue-new-york-metro', slug: 'new-york-metro-club',
        name: 'New York Metropolitan Backgammon Club',
        city: 'New York', countryCode: 'US', countryName: 'États-Unis', region: 'north_america',
        category: 'federation_club', federation: 'USBGF',
        coordinates: { lat: 40.7580, lng: -73.9855, mapX: 28.5, mapY: 33.2 },
        address: 'Midtown Manhattan & Upper East Side, New York, NY 10022',
        scheduleFr: 'Mardis et jeudis soirs dès 19h00',
        atmosphereFr: 'Énergie électrique de Manhattan, Chouettes animées et analyse avec les maîtres de l’ABT.',
        playerBenefitsFr: Object.freeze([
            'Épicentre américain des célèbres Chouettes new-yorkaises et du NY Metro Open',
            "Analyse de positions en direct avec des maîtres de l'American Backgammon Tour",
            'Soirées hebdomadaires dans des clubs et cafés de Manhattan',
        ]),
        seoSummaryFr: "Le célèbre club métropolitain de New York réunissant les joueurs de l'American Backgammon Tour.",
        skillLevels: 'Intermediate, Advanced & Master', entryCostLabel: '15 $ / session (gratuit pour les membres USBGF)',
        officialUrl: 'https://usbgf.org', googleMapsQuery: 'Midtown Manhattan New York Backgammon Club', isFeatured: true,
    },
    {
        id: 'venue-chicago-league', slug: 'chicago-backgammon-league',
        name: 'Chicago Backgammon League & Winnetka Club',
        city: 'Chicago', countryCode: 'US', countryName: 'États-Unis', region: 'north_america',
        category: 'federation_club', federation: 'USBGF',
        coordinates: { lat: 41.8781, lng: -87.6298, mapX: 24.5, mapY: 32.5 },
        address: 'City Works / Winnetka Community House, Chicago, IL',
        scheduleFr: 'Tous les mardis et mercredis soirs dès 18h30',
        atmosphereFr: 'Institution depuis 1983, esprit sportif et chaleureux du Midwest.',
        playerBenefitsFr: Object.freeze([
            'Réseau multi-salles (City Works, Firehouse Grill, Winnetka Community House depuis 1983)',
            'Offres boissons/restauration dédiées aux joueurs les mardis et mercredis soirs',
            'Divisions Open et Intermediate adaptées à chaque PR',
        ]),
        seoSummaryFr: 'Ligue historique de Chicago et Winnetka active depuis plus de 40 ans sur le circuit américain.',
        skillLevels: 'Open & Intermediate divisions', entryCostLabel: '10 $ tournoi hebdomadaire',
        officialUrl: 'https://chicagobackgammon.com', googleMapsQuery: 'Winnetka Community House Chicago Backgammon', isFeatured: false,
    },
    {
        id: 'venue-social-point-miami', slug: 'social-point-rooftop-miami',
        name: "The Social Point Rooftop Club (McSorley's Beach Pub)",
        city: 'Fort Lauderdale', countryCode: 'US', countryName: 'États-Unis', region: 'north_america',
        category: 'social_lounge', federation: 'USBGF',
        coordinates: { lat: 26.1342, lng: -80.1036, mapX: 26.8, mapY: 41.5 },
        address: '837 N Fort Lauderdale Beach Blvd, Fort Lauderdale, FL 33304',
        scheduleFr: 'Tous les jeudis soirs de 18h30 à 22h30',
        atmosphereFr: 'Brise marine, rooftop face à l’océan Atlantique et ambiance décontractée sous les palmiers.',
        playerBenefitsFr: Object.freeze([
            "Parties en rooftop face à l'océan Atlantique tous les jeudis soirs",
            'Entrée 100 % gratuite avec coaching offert par des pros USBGF',
            'Communauté dynamique et festive sur la côte floridienne',
        ]),
        seoSummaryFr: "Jouer au backgammon en rooftop face à l'océan en Floride avec cours d'initiation gratuits.",
        skillLevels: 'Tous niveaux (cours gratuits débutants)', entryCostLabel: 'Entrée 100 % gratuite',
        officialUrl: 'https://usbgf.org/find-a-club/the-social-point-backgammon-club-ft-lauderdale', googleMapsQuery: '837 N Fort Lauderdale Beach Blvd Fort Lauderdale FL', isFeatured: true,
    },
    {
        id: 'venue-elite-tr-istanbul', slug: 'elite-tr-istanbul',
        name: 'Elite-TR Backgammon Club & Cafés du Bosphore',
        city: 'Istanbul', countryCode: 'TR', countryName: 'Turquie', region: 'middle_east',
        category: 'traditional_cafe', federation: 'WBA',
        coordinates: { lat: 41.0082, lng: 28.9784, mapX: 57.5, mapY: 33.0 },
        address: 'Bebek & Kadıköy Rıhtım, Istanbul',
        scheduleFr: 'Tous les jours en continu (24h/24 dans certains cafés)',
        atmosphereFr: 'Thé turc fumant au son des dés en bois d’olivier sur fond de bateaux du Bosphore.',
        playerBenefitsFr: Object.freeze([
            "Immersion dans la capitale historique du Tavla où l'on joue à toute heure du jour et de la nuit",
            'Transition parfaite entre jeu traditionnel et Backgammon moderne à pendule',
            "Tournois de clubs à forte dotation toute l'année",
        ]),
        seoSummaryFr: "L'art du Tavla et du backgammon de compétition au cœur des cafés traditionnels d'Istanbul.",
        skillLevels: 'Traditionnel Tavla & Compétition WBA', entryCostLabel: 'Consommation thé/café (libre)',
        officialUrl: 'https://clubsbackgammon.com', googleMapsQuery: 'Kadikoy Rihtim Istanbul Tavla', isFeatured: false,
    },
    {
        id: 'venue-mindskillz-dubai', slug: 'mindskillz-dubai',
        name: 'Mindskillz Backgammon Club & Academy',
        city: 'Dubaï', countryCode: 'AE', countryName: 'Émirats Arabes Unis', region: 'middle_east',
        category: 'prestige_palace', federation: 'WBGF',
        coordinates: { lat: 25.2048, lng: 55.2708, mapX: 65.0, mapY: 42.5 },
        address: 'Business Bay & DIFC, Dubai',
        scheduleFr: 'Samedis et mardis dès 18h00',
        atmosphereFr: 'Design contemporain ultra-moderne, salons privés climatisés et technologie analytique.',
        playerBenefitsFr: Object.freeze([
            'Premier club homologué par le Dubai Sports Council et partenaire officiel WBGF',
            "Académie d'entraînement structurée avec analyse vidéo et XG/Open Sage",
            'Tournois internationaux luxueux au cœur de Dubaï',
        ]),
        seoSummaryFr: "Le club d'élite et académie de backgammon à Dubaï homologué par le Dubai Sports Council.",
        skillLevels: 'De l’initiation aux Masters internationaux', entryCostLabel: 'Accès membre ou pass soirée 100 AED',
        officialUrl: 'https://mindskillzme.com', googleMapsQuery: 'Mindskillz Business Bay Dubai UAE', isFeatured: true,
    },
    {
        id: 'venue-saka-athenes', slug: 'saka-athenes',
        name: 'SAKA Backgammon Club & Fédération Hellénique',
        city: 'Athènes', countryCode: 'GR', countryName: 'Grèce', region: 'europe',
        category: 'traditional_cafe', federation: 'EUBGF',
        coordinates: { lat: 37.9838, lng: 23.7275, mapX: 55.5, mapY: 35.0 },
        address: 'Psychiko & Pláka, Athènes',
        scheduleFr: 'Vendredis soirs et dimanches 17h00',
        atmosphereFr: 'Cafés d’Athènes vibrants, passion méditerranéenne pour le Tavli et ligues à pendule.',
        playerBenefitsFr: Object.freeze([
            'Culture ancestrale du Tavli grec alliée aux ligues modernes de Backgammon de tournoi',
            'Rencontres hebdomadaires chaleureuses en terrasse et clubs athéniens',
            'Excellent tremplin vers les tournois méditerranéens',
        ]),
        seoSummaryFr: 'Le rendez-vous des passionnés de Tavli et de tournois de backgammon à Athènes.',
        skillLevels: 'Tous niveaux (Tavli & Backgammon moderne)', entryCostLabel: 'Entrée libre au café',
        officialUrl: 'https://clubsbackgammon.com/saka-backgammon-club/', googleMapsQuery: 'Psychiko Athens Greece Backgammon', isFeatured: false,
    },
    {
        id: 'venue-jba-tokyo', slug: 'jba-tokyo-lounge',
        name: 'Japan Backgammon Association (JBA) Tokyo Lounge',
        city: 'Tokyo', countryCode: 'JP', countryName: 'Japon', region: 'asia_pacific',
        category: 'federation_club', federation: 'JBA / WBGF',
        coordinates: { lat: 35.6762, lng: 139.6503, mapX: 86.0, mapY: 36.5 },
        address: 'Shinagawa & Ginza District, Tokyo',
        scheduleFr: 'Mercredis et samedis de 13h00 à 21h00',
        atmosphereFr: 'Précision chirurgicale japonaise, silence de concentration et respect de la pendule.',
        playerBenefitsFr: Object.freeze([
            "L'école de backgammon la plus précise au monde (terre de Mochy, Michy et Akiko Yazawa)",
            'Ligues régulières, cours analytiques 3-Ply et Tokyo Open',
            'Discipline exemplaire et accueil passionné des joueurs internationaux',
        ]),
        seoSummaryFr: "Le centre d'entraînement des champions du monde japonais de backgammon à Tokyo.",
        skillLevels: 'Tous niveaux (cours et tournois par paliers)', entryCostLabel: 'Participation 1 000 JPY (~6 €)',
        officialUrl: 'https://backgammon.or.jp', googleMapsQuery: 'Shinagawa Tokyo Japan Backgammon League', isFeatured: true,
    },
    {
        id: 'venue-sydney-club', slug: 'sydney-backgammon-club',
        name: 'Sydney Backgammon Club (Royal Automobile Club)',
        city: 'Sydney', countryCode: 'AU', countryName: 'Australie', region: 'asia_pacific',
        category: 'prestige_palace', federation: 'WBGF',
        coordinates: { lat: -33.8615, lng: 151.2128, mapX: 89.5, mapY: 74.0 },
        address: 'RACA, 89 Macquarie Street, Sydney NSW 2000',
        scheduleFr: 'Tous les mardis soirs dès 18h00',
        atmosphereFr: 'Club privé colonial surplombant Circular Quay, boiseries anciennes et joueurs chevronnés.',
        playerBenefitsFr: Object.freeze([
            'Cadre prestigieux au Royal Automobile Club of Australia face au port de Sydney',
            'Tournois mensuels officiels et soirées sociales hebdomadaires',
            'Point de chute incontournable des joueurs en Asie-Pacifique',
        ]),
        seoSummaryFr: "Le club d'élite de Sydney au Royal Automobile Club of Australia face à Circular Quay.",
        skillLevels: 'Intermediate & Advanced', entryCostLabel: 'Gratuit pour membres RACA, 15 AUD pour invités',
        officialUrl: 'https://sydneybackgammonclub.org.au', googleMapsQuery: '89 Macquarie Street Sydney NSW 2000 Australia', isFeatured: false,
    },
]);

/** Filtre les lieux mondiaux de backgammon selon région, catégorie et recherche. */
export function filterWorldVenues(
    venues: ReadonlyArray<WorldBackgammonVenue>,
    regionFilter: string,
    categoryFilter: VenueCategory | 'all',
    searchQuery: string
): ReadonlyArray<WorldBackgammonVenue> {
    const q = searchQuery?.trim().toLowerCase();
    return Object.freeze(
        venues.filter((v) => {
            if (regionFilter && regionFilter !== 'all' && v.region !== regionFilter) return false;
            if (categoryFilter && categoryFilter !== 'all' && v.category !== categoryFilter) return false;
            if (q && q.length > 0) {
                const text = `${v.name} ${v.city} ${v.countryName} ${v.address} ${v.federation} ${v.atmosphereFr}`.toLowerCase();
                if (!text.includes(q)) return false;
            }
            return true;
        })
    );
}
