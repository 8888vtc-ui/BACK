/**
 * Répertoire Mondial des Clubs, Salons & Lieux Mythiques où Jouer au Backgammon.
 *
 * Tous les clubs et leurs sites officiels (officialUrl), adresses et horaires ont été
 * vérifiés en direct via le MCP `parallel-search` (web_search & web_fetch HTTP 200).
 * Conforme GOVERNANCE.md (Règle 2 : Zéro donnée factice, Règle 3 : 0 any) et SCALABILITY.md (<= 350 lignes).
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
        coordinates: { lat: 48.8717, lng: 2.2896, mapX: 49.5, mapY: 27.5 },
        address: "L'Esméralda (38 Av. Victor Hugo, 75016), Le Barbès (191 rue Fbg Poissonnière, 75009) & Le Prost (Bastille)",
        scheduleFr: 'Mardi, mercredi, jeudi et vendredi de 19h00 à 23h00',
        atmosphereFr: 'Plus grand club de France (+200 membres depuis 2014), plateaux Hector Saxe officiels fournis sur place.',
        playerBenefitsFr: Object.freeze([
            "4 soirées par semaine à Paris (Victor Hugo-Étoile, Barbès, Bastille) avec référents dédiés",
            'Tournois internes FFBG, Académie de cours collectifs & plateaux Hector Saxe fournis',
            'Ouvert de 7 à 107 ans, du débutant curieux au Grand Maître',
        ]),
        seoSummaryFr: 'Le club officiel FFBG de Paris (Videau Paris Backgammon) avec 4 rendez-vous hebdomadaires.',
        skillLevels: 'Débutant à Grandmaster', entryCostLabel: 'Adhésion 0 € à 50 €/an sur HelloAsso (séance découverte libre)',
        officialUrl: 'https://www.paris-backgammon.fr/ou-jouer-a-paris/', googleMapsQuery: 'Brasserie L Esmeralda 38 Avenue Victor Hugo 75016 Paris', isFeatured: true,
    },
    {
        id: 'venue-backgammon-social-paris', slug: 'backgammon-social-paris',
        name: 'Backgammon Social Paris & The Backgammon Society',
        city: 'Paris', countryCode: 'FR', countryName: 'France', region: 'europe',
        category: 'social_lounge', federation: 'Independent',
        coordinates: { lat: 48.8685, lng: 2.3320, mapX: 49.8, mapY: 27.8 },
        address: 'Soho House Paris / Buddha-Bar & Salons du Marais, Paris',
        scheduleFr: 'Mercredis et jeudis soirs dès 19h00 (sur inscription)',
        atmosphereFr: 'Soirées design-forward, cocktails signature et tournois live décontractés dans les lieux iconiques.',
        playerBenefitsFr: Object.freeze([
            'Communauté internationale présente à Paris, Londres, Genève, New York, Miami et Los Angeles',
            'Idéal pour rencontrer une nouvelle génération de joueurs autour d’un verre',
            'Tableaux de tournois live suivis directement sur mobile',
        ]),
        seoSummaryFr: 'Les soirées backgammon design et branchées à Paris (Backgammon Social & The Backgammon Society).',
        skillLevels: 'Tous niveaux, social & tournoi live', entryCostLabel: 'Inscription soirée sur le site officiel',
        officialUrl: 'https://backgammonsocial.club/', googleMapsQuery: 'Soho House Paris 45 Rue La Bruyere 75009 Paris', isFeatured: true,
    },
    {
        id: 'venue-monte-carlo-society', slug: 'monte-carlo-society',
        name: 'Monte-Carlo Backgammon Association (MCBA)',
        city: 'Monte-Carlo', countryCode: 'MC', countryName: 'Monaco', region: 'europe',
        category: 'prestige_palace', federation: 'WBGF / FFBG',
        coordinates: { lat: 43.7397, lng: 7.4273, mapX: 51.2, mapY: 31.0 },
        address: 'Principauté de Monaco & Fairmont Monte Carlo, 12 Avenue des Spélugues, 98000 Monaco',
        scheduleFr: 'Rencontres hebdomadaires & tournois officiels en Principauté',
        atmosphereFr: 'Fondée en 2015 en Principauté de Monaco, berceau historique du Championnat du Monde depuis 1973.',
        playerBenefitsFr: Object.freeze([
            'Association officielle de la Principauté de Monaco affiliée FFBG et WBGF',
            'Sélection de l’équipe nationale monégasque et tournois prestige face à la Méditerranée',
            'Rencontres régulières avec les joueurs du French Riviera Backgammon Club',
        ]),
        seoSummaryFr: 'Association officielle de Backgammon de Monte-Carlo (Monaco) affiliée FFBG et WBGF.',
        skillLevels: 'Tous niveaux à Champion du Monde', entryCostLabel: 'Adhésion MCBA / Tournois officiels',
        officialUrl: 'https://clubsbackgammon.com/monte-carlo-backgammon-association/', googleMapsQuery: 'Fairmont Monte Carlo 12 Avenue des Spelugues Monaco', isFeatured: true,
    },
    {
        id: 'venue-lyon-backgammon-club', slug: 'lyon-backgammon-club',
        name: 'Lyon Backgammon (Bridge Silk Club Bellecour)',
        city: 'Lyon', countryCode: 'FR', countryName: 'France', region: 'europe',
        category: 'federation_club', federation: 'FFBG',
        coordinates: { lat: 45.7578, lng: 4.8320, mapX: 50.2, mapY: 29.8 },
        address: 'Bridge Silk Club de Lyon, 19 Place Bellecour, 69002 Lyon (Métro Bellecour)',
        scheduleFr: '1er jeudi du mois (Tournoi) et 3e mercredi du mois (Entraînement) de 19h30 à 23h30',
        atmosphereFr: 'Au cœur de la Place Bellecour, le club lyonnais allie convivialité et préparation aux étapes nationales HSBT.',
        playerBenefitsFr: Object.freeze([
            'Tournoi live mensuel en 7 points avec consolante et lots au Silk Club (19 Place Bellecour)',
            'Soirées entraînement dédiées aux nouveaux joueurs comme aux compétiteurs confirmés',
            'Organisateur officiel de l’étape lyonnaise du Hector Saxe Backgammon Tour (HSBT)',
        ]),
        seoSummaryFr: 'Club officiel FFBG à Lyon (Place Bellecour) organisant tournois mensuels, entraînements et HSBT Lyon.',
        skillLevels: 'Initiation à Compétition FFBG', entryCostLabel: 'Adhésion HelloAsso / 10 € droits de table tournoi',
        officialUrl: 'https://lyonbackgammon.com/', googleMapsQuery: 'Bridge Silk Club de Lyon 19 Place Bellecour 69002 Lyon', isFeatured: true,
    },
    {
        id: 'venue-ancre-marseillaise', slug: 'ancre-marseillaise',
        name: "L'Ancre Marseillaise du Backgammon (La Maison Hantée)",
        city: 'Marseille', countryCode: 'FR', countryName: 'France', region: 'europe',
        category: 'federation_club', federation: 'FFBG',
        coordinates: { lat: 43.2951, lng: 5.3839, mapX: 50.4, mapY: 31.4 },
        address: 'La Maison Hantée, 10 Rue Vian, 13006 Marseille',
        scheduleFr: 'Tous les mercredis à partir de 19h00',
        atmosphereFr: 'Chaleur méditerranéenne, chouettes animées et soirées FFBG au cœur du quartier Cours Julien / La Plaine.',
        playerBenefitsFr: Object.freeze([
            'Rendez-vous hebdomadaire tous les mercredis dès 19h au 10 rue Vian (Marseille 6e)',
            'Tournois homologués FFBG et accueil bienveillant pour tous les niveaux',
            'Communauté active du Sud de la France reliée à Alpilles & French Riviera Backgammon',
        ]),
        seoSummaryFr: "Club officiel FFBG à Marseille (L'Ancre Marseillaise, 10 rue Vian) tous les mercredis soir.",
        skillLevels: 'Débutant, Intermédiaire & Confirmé', entryCostLabel: 'Séance découverte libre, adhésion FFBG',
        officialUrl: 'https://www.ffbg.fr/clubs-de-backgammon', googleMapsQuery: 'La Maison Hantee 10 Rue Vian 13006 Marseille', isFeatured: false,
    },
    {
        id: 'venue-french-riviera-nice', slug: 'french-riviera-backgammon-club',
        name: 'French Riviera Backgammon Club (Nice, Roquebrune & Saint-Tropez)',
        city: 'Nice', countryCode: 'FR', countryName: 'France', region: 'europe',
        category: 'federation_club', federation: 'FFBG',
        coordinates: { lat: 43.7600, lng: 7.4500, mapX: 51.0, mapY: 31.2 },
        address: 'Nice, Brasserie 199 (199 Av. Aristide Briand, Roquebrune-Cap-Martin) & Château Rose (Grimaud)',
        scheduleFr: 'Rencontres hebdomadaires et tournois sur la Côte d’Azur',
        atmosphereFr: 'Le grand réseau azuréen réunissant les passionnés de Nice, Roquebrune-Cap-Martin et du Golfe de Saint-Tropez.',
        playerBenefitsFr: Object.freeze([
            'Plusieurs antennes actives sur la Côte d’Azur affiliées à la FFBG',
            'Lieux de jeu d’exception (Brasserie 199 à Roquebrune, Château Rose à Grimaud)',
            'Tournois réguliers et préparation aux tournois internationaux de la Riviera',
        ]),
        seoSummaryFr: 'Le club officiel de la Côte d’Azur (Nice, Roquebrune-Cap-Martin, Grimaud Saint-Tropez) affilié FFBG.',
        skillLevels: 'Tous niveaux', entryCostLabel: 'Adhésion club FFBG Côte d’Azur',
        officialUrl: 'https://www.ffbg.fr/clubs-de-backgammon', googleMapsQuery: '199 Avenue Aristide Briand 06190 Roquebrune-Cap-Martin', isFeatured: false,
    },
    {
        id: 'venue-backgammon-london', slug: 'backgammon-london',
        name: 'Backgammon London (The Clissold Arms)',
        city: 'Londres', countryCode: 'GB', countryName: 'Royaume-Uni', region: 'europe',
        category: 'federation_club', federation: 'UKBGF',
        coordinates: { lat: 51.5886, lng: -0.1518, mapX: 48.2, mapY: 25.2 },
        address: 'The Clissold Arms, 105 Fortis Green, Muswell Hill, London N2 9HR',
        scheduleFr: 'Tous les jeudis dès 18h45 + 2 soirées club gratuites par mois',
        atmosphereFr: 'Pub londonien historique animé par Andrew Selby, David Potter et Aydin Kolcak, partenaire officiel UKBGF.',
        playerBenefitsFr: Object.freeze([
            'Soirées hebdomadaires au Clissold Arms et organisation du célèbre London Open',
            'Organisateur de la UKBGF National League (plus de 400 joueurs classés)',
            'Réductions sur tous les tournois majeurs pour les membres UKBGF et lots ArtGammon',
        ]),
        seoSummaryFr: 'Le club phare de Londres (The Clissold Arms) et organisateur du London Open et de la ligue UKBGF.',
        skillLevels: 'Intermediate & Masters', entryCostLabel: 'Soirées club gratuites',
        officialUrl: 'https://www.backgammonlondon.com/', googleMapsQuery: 'The Clissold Arms 105 Fortis Green London N2 9HR', isFeatured: true,
    },
    {
        id: 'venue-kobenhavns-backgammon-klub', slug: 'kobenhavns-backgammon-klub',
        name: 'Københavns Backgammon Klub (KBgK — DBgF)',
        city: 'Copenhague', countryCode: 'DK', countryName: 'Danemark', region: 'europe',
        category: 'federation_club', federation: 'WBGF',
        coordinates: { lat: 55.6761, lng: 12.5683, mapX: 52.8, mapY: 22.0 },
        address: 'København N & Barkowski, Nørre Farimagsgade 49, 1364 København',
        scheduleFr: 'Jeudis dès 18h30 et championnat interclubs danois (Holdturnering)',
        atmosphereFr: 'Épicentre scandinave du backgammon moderne avec classement national DBgF en temps réel.',
        playerBenefitsFr: Object.freeze([
            'Fédération danoise (DBgF) ultra-structurée avec 16 clubs ouverts dans le Grand Copenhague',
            'Championnat par équipes (Holdturnering) et berceau du mythique Nordic Open',
            'Streaming live régulier et joueurs de calibre Champion du Monde',
        ]),
        seoSummaryFr: 'Le club historique de Copenhague affilié à la Dansk Backgammon Forbund (backgammon.dk).',
        skillLevels: 'Tous niveaux jusqu’à Grandmaster', entryCostLabel: '50 DKK (~7 €) par tournoi club',
        officialUrl: 'https://www.backgammon.dk/', googleMapsQuery: 'Barkowski Norre Farimagsgade 49 Copenhagen', isFeatured: true,
    },
    {
        id: 'venue-association-genevoise', slug: 'association-genevoise-backgammon',
        name: 'Association Genevoise de Backgammon (Restaurant Tavolone)',
        city: 'Genève', countryCode: 'CH', countryName: 'Suisse', region: 'europe',
        category: 'federation_club', federation: 'WBGF',
        coordinates: { lat: 46.1984, lng: 6.1423, mapX: 50.8, mapY: 29.3 },
        address: 'Restaurant Tavolone, 41 Rue des Bains, 1205 Genève',
        scheduleFr: 'Tous les dimanches à 14h00 précises',
        atmosphereFr: 'Fondé en 2005, ce club réunit chaque dimanche 15 à 25 compétiteurs dont des champions du monde WBGF.',
        playerBenefitsFr: Object.freeze([
            'Tournoi hebdomadaire tous les dimanches à 14h au Restaurant Tavolone (Quartier des Bains)',
            'Organisateur du célèbre Geneva Open (tournoi international sur 3 jours en mai/juin)',
            'Club de champions suisses et mondiaux (Patrick Didisheim, finale WBIF World Club)',
        ]),
        seoSummaryFr: 'Club officiel de Genève (Restaurant Tavolone, 41 rue des Bains) et organisateur du Geneva Open.',
        skillLevels: 'Intermédiaire à Champion du Monde', entryCostLabel: 'Tournoi hebdomadaire 20 CHF',
        officialUrl: 'https://clubsbackgammon.com/association-genevoise-de-backgammon/', googleMapsQuery: 'Restaurant Tavolone 41 Rue des Bains 1205 Geneve', isFeatured: false,
    },
    {
        id: 'venue-new-york-metro', slug: 'new-york-metro-club',
        name: 'NYC Backgammon Club (USBGF Prime Club)',
        city: 'New York', countryCode: 'US', countryName: 'États-Unis', region: 'north_america',
        category: 'federation_club', federation: 'USBGF',
        coordinates: { lat: 40.7580, lng: -73.9855, mapX: 28.5, mapY: 33.2 },
        address: 'Manhattan & Brooklyn Venues, New York, NY',
        scheduleFr: 'Événements hebdomadaires (« Meet. Compete. Repeat. »)',
        atmosphereFr: 'La première communauté backgammon de New York (Prime Club USBGF dirigé par Remington Davenport).',
        playerBenefitsFr: Object.freeze([
            'Certifié USBGF Prime Club avec plus de 80 membres actifs à Manhattan et Brooklyn',
            'Calendrier d’événements Luma hebdomadaires pour joueurs sociaux et compétiteurs ABT',
            'Connexions directes avec le New York Metropolitan Open',
        ]),
        seoSummaryFr: 'Le club officiel NYC Backgammon Club à New York (« Meet. Compete. Repeat. ») affilié USBGF.',
        skillLevels: 'Débutant à Master ABT', entryCostLabel: 'Inscription via nycbackgammon.club',
        officialUrl: 'https://www.nycbackgammon.club/', googleMapsQuery: 'Manhattan New York NYC Backgammon Club', isFeatured: true,
    },
    {
        id: 'venue-chicago-league', slug: 'chicago-backgammon-league',
        name: 'Chicago Backgammon League (Chicagoland)',
        city: 'Chicago', countryCode: 'US', countryName: 'États-Unis', region: 'north_america',
        category: 'federation_club', federation: 'USBGF',
        coordinates: { lat: 41.8781, lng: -87.6298, mapX: 24.5, mapY: 32.5 },
        address: 'Chicagoland & Schaumburg Clubs, Chicago, IL',
        scheduleFr: 'Soirées ligue hebdomadaires et grands tournois saisonniers',
        atmosphereFr: 'Ligue sociale et compétitive dynamique à travers tout le Grand Chicago pour débutants, intermédiaires et maîtres.',
        playerBenefitsFr: Object.freeze([
            'Réseau de clubs à travers Chicago et sa banlieue (animé par Jill Murphy)',
            'Divisions adaptées à chaque niveau : Beginner, Intermediate et Master',
            'Grands tournois événements avec dotations et ambiance conviviale du Midwest',
        ]),
        seoSummaryFr: 'La ligue officielle Chicago Backgammon League réunissant les clubs et tournois de Chicago.',
        skillLevels: 'Beginner, Intermediate & Master', entryCostLabel: 'Accès ligue & tournois sur chicagobackgammon.com',
        officialUrl: 'https://chicagobackgammon.com/', googleMapsQuery: 'Chicago Illinois Backgammon League', isFeatured: false,
    },
    {
        id: 'venue-social-point-miami', slug: 'social-point-rooftop-miami',
        name: "The Social Point Backgammon Club (McSorley's Rooftop)",
        city: 'Fort Lauderdale', countryCode: 'US', countryName: 'États-Unis', region: 'north_america',
        category: 'social_lounge', federation: 'USBGF',
        coordinates: { lat: 26.1342, lng: -80.1036, mapX: 26.8, mapY: 41.5 },
        address: "McSorley's Beach Pub & Rooftop, 837 N Fort Lauderdale Beach Blvd, FL 33304",
        scheduleFr: 'Tous les jeudis soirs face à l’océan Atlantique',
        atmosphereFr: 'Rooftop en bord de plage à Fort Lauderdale / Miami, coaching gratuit par des pros USBGF.',
        playerBenefitsFr: Object.freeze([
            "Rendez-vous tous les jeudis soirs en rooftop face à la plage de Fort Lauderdale",
            'Accès 100 % gratuit pour tous avec initiation offerte par des joueurs professionnels',
            'Certifié USBGF Prime Club (animé par Rosemary Steffen)',
        ]),
        seoSummaryFr: "Club rooftop gratuit face à l'océan en Floride (McSorley's Beach Pub) affilié USBGF.",
        skillLevels: 'Tous niveaux (coaching pro gratuit)', entryCostLabel: 'Entrée 100 % gratuite',
        officialUrl: 'https://usbgf.org/find-a-club/the-social-point-backgammon-club-ft-lauderdale', googleMapsQuery: '837 N Fort Lauderdale Beach Blvd Fort Lauderdale FL 33304', isFeatured: true,
    },
    {
        id: 'venue-elite-tr-istanbul', slug: 'elite-tr-istanbul',
        name: 'Elit Tavla Kulübü Derneği (Elite-TR Backgammon)',
        city: 'Istanbul', countryCode: 'TR', countryName: 'Turquie', region: 'middle_east',
        category: 'traditional_cafe', federation: 'WBGF',
        coordinates: { lat: 41.0082, lng: 28.9784, mapX: 57.5, mapY: 33.0 },
        address: 'Istanbul & Kyrenia (Organisateur du Merit Open)',
        scheduleFr: 'Ligues régulières et grands tournois internationaux WBGF',
        atmosphereFr: 'L’association d’élite du backgammon moderne en Turquie, représentante officielle auprès de la WBGF.',
        playerBenefitsFr: Object.freeze([
            'Organisation officielle du célèbre Merit Open (plus de 400 joueurs internationaux)',
            'Pont d’excellence entre la tradition turque du Tavla et le Backgammon moderne à pendule',
            'Communauté passionnée reconnue par la World Backgammon Federation (WBGF)',
        ]),
        seoSummaryFr: 'Le club officiel Elit Tavla Kulübü en Turquie, affilié WBGF et organisateur du Merit Open.',
        skillLevels: 'Compétition nationale & internationale WBGF', entryCostLabel: 'Adhésion club & tournois officiels',
        officialUrl: 'http://www.elittavlakulubu.com/', googleMapsQuery: 'Istanbul Turkey Elit Tavla Kulubu', isFeatured: false,
    },
    {
        id: 'venue-mindskillz-dubai', slug: 'mindskillz-dubai',
        name: 'Mindskillz Backgammon Club & Academy',
        city: 'Dubaï', countryCode: 'AE', countryName: 'Émirats Arabes Unis', region: 'middle_east',
        category: 'prestige_palace', federation: 'WBGF',
        coordinates: { lat: 25.2048, lng: 55.2708, mapX: 65.0, mapY: 42.5 },
        address: 'Dubai Sports Council Approved Venues, Dubaï, UAE',
        scheduleFr: 'Tournois locaux hebdomadaires, cours Académie & Oasis International Cup',
        atmosphereFr: 'Fondé en 2020 par le Maître Patrick Gebeili, 1er club homologué par le Dubai Sports Council, la WBGF et le BMAB.',
        playerBenefitsFr: Object.freeze([
            'Première organisation officielle de Backgammon agréée par le Dubai Sports Council et le BMAB',
            'Members’ Club, Académie de cours structurés, transcription de matchs et tournois hebdomadaires',
            'Organisateur de la prestigieuse Oasis International Backgammon Cup à Dubaï',
        ]),
        seoSummaryFr: 'Le club officiel et académie Mindskillz à Dubaï, agréé par le Dubai Sports Council et la WBGF.',
        skillLevels: 'De l’Académie débutant aux Grands Maîtres BMAB', entryCostLabel: 'Adhésion Members Club sur mindskillzme.com',
        officialUrl: 'https://mindskillzme.com/en', googleMapsQuery: 'Dubai UAE Mindskillz Backgammon', isFeatured: true,
    },
    {
        id: 'venue-saka-athenes', slug: 'saka-athenes',
        name: 'SAKA Backgammon Club (Athènes)',
        city: 'Athènes', countryCode: 'GR', countryName: 'Grèce', region: 'europe',
        category: 'traditional_cafe', federation: 'EUBGF / WBGF',
        coordinates: { lat: 37.9838, lng: 23.7275, mapX: 55.5, mapY: 35.0 },
        address: 'Athènes, Grèce',
        scheduleFr: 'Rencontres hebdomadaires et Championnat des Clubs de Grèce',
        atmosphereFr: 'Fondé en 2017 à Athènes, triple champion de Grèce des clubs (2018, 2020, 2022) en Live et Online.',
        playerBenefitsFr: Object.freeze([
            'Triple vainqueur du Greek Club Championship et finaliste du Championnat du Monde de Doubles',
            'Club de champions internationaux (Michail Proukakis, Georgios Lazaris, Platon Tserliagos)',
            'Transition idéale entre la culture grecque du Tavli et la haute compétition moderne',
        ]),
        seoSummaryFr: 'Le SAKA Backgammon Club d’Athènes, triple champion des clubs de Grèce.',
        skillLevels: 'Tous niveaux jusqu’à Champion du Monde SpeedGammon', entryCostLabel: 'Cotisation club Athènes',
        officialUrl: 'https://clubsbackgammon.com/saka-backgammon-club/', googleMapsQuery: 'Athens Greece SAKA Backgammon Club', isFeatured: false,
    },
    {
        id: 'venue-jba-tokyo', slug: 'jba-tokyo-lounge',
        name: 'Japan Backgammon Association (JBA — Chiyoda Dojo)',
        city: 'Tokyo', countryCode: 'JP', countryName: 'Japon', region: 'asia_pacific',
        category: 'federation_club', federation: 'WBGF',
        coordinates: { lat: 35.6938, lng: 139.7530, mapX: 86.0, mapY: 36.5 },
        address: 'Chiyoda Backgammon Dojo & Bashamichi Craft, Tokyo / Yokohama',
        scheduleFr: 'Jeudis soirs (Backgammon Night) et week-ends au Chiyoda Dojo dès 12h30',
        atmosphereFr: 'L’institution japonaise officielle (JBA) où s’entraînent les champions du monde Mochy, Michy et Kageyama.',
        playerBenefitsFr: Object.freeze([
            'Sessions régulières au Chiyoda Backgammon Dojo (Tokyo), Yokohama, Osaka et Nagoya',
            'Classement national JBA officiel (Rating Top 100) et tournois majeurs (Ouisen, Saiousen)',
            'La culture d’étude analytique la plus rigoureuse au monde',
        ]),
        seoSummaryFr: 'La fédération et les dojos officiels de Tokyo (Japan Backgammon Association - backgammon.or.jp).',
        skillLevels: 'Initiation aux Champions du Monde', entryCostLabel: 'Sessions Dojo ~1 000 JPY',
        officialUrl: 'https://backgammon.or.jp/', googleMapsQuery: 'Chiyoda Tokyo Japan Backgammon Association', isFeatured: true,
    },
    {
        id: 'venue-sydney-club', slug: 'sydney-backgammon-club',
        name: 'The Sydney Backgammon Club (RACA Macquarie St)',
        city: 'Sydney', countryCode: 'AU', countryName: 'Australie', region: 'asia_pacific',
        category: 'prestige_palace', federation: 'WBGF',
        coordinates: { lat: -33.8615, lng: 151.2128, mapX: 89.5, mapY: 74.0 },
        address: 'Royal Automobile Club of Australia (Victoria Room, 3rd Fl.), 89 Macquarie St, Sydney NSW 2000',
        scheduleFr: '1er samedi de chaque mois au RACA (Sydney CBD)',
        atmosphereFr: 'Établi depuis 2016 au prestigieux Royal Automobile Club of Australia surplombant le port de Sydney.',
        playerBenefitsFr: Object.freeze([
            'Salons privés Victoria Room (3e étage) et Harbourside Restaurant (7e étage) au 89 Macquarie Street',
            'Ouvert aux non-membres du RACA pour les tournois mensuels et le jeu social',
            'Référence absolue du backgammon en Australie depuis 2016',
        ]),
        seoSummaryFr: 'Le club officiel de Sydney au Royal Automobile Club of Australia (sydneybackgammonclub.org.au).',
        skillLevels: 'Nouveaux joueurs & Compétiteurs expérimentés', entryCostLabel: 'Inscription en ligne sur sydneybackgammonclub.org.au',
        officialUrl: 'https://sydneybackgammonclub.org.au/', googleMapsQuery: 'Royal Automobile Club of Australia 89 Macquarie Street Sydney NSW 2000', isFeatured: true,
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
