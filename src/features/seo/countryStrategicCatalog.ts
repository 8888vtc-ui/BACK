/**
 * Catalogue SEO International par Pays / Marché Linguistique (`src/features/seo/countryStrategicCatalog.ts`).
 *
 * Cible les requêtes culturelles natives à fort volume dans chaque pays :
 * - France / Monaco / Suisse (`fr-FR`) : Backgammon en ligne, FFB, Cercle Monte-Carlo
 * - USA / UK / International (`en-US`) : Play Backgammon Online, USBGF, UKBGF, AI Coach
 * - Allemagne / DACH (`de-DE`) : Backgammon online spielen, DBGV, Verdopplungswürfel, KI-Trainer
 * - Espagne / Amérique Latine (`es-ES`) : Jugar Backgammon online, Tablas Reales, Dado de Doblar
 * - Brésil / Portugal (`pt-BR`) : Jogar Gamão online grátis, Regras do Gamão, Cubo de Dobrar
 * - Monde Arabe / MENA (`ar-SA`) : العب الطاولة (باكجامون) أونلاين, شيش بيش, بطولة دبي
 *
 * Strictement 0 `any`, données vérifiées et alignées avec `worldTournamentsCatalog.ts`.
 */

export interface CountryFaqItem {
    readonly question: string;
    readonly answer: string;
}

export interface CountryLocalHighlight {
    readonly name: string;
    readonly city: string;
    readonly href: string;
    readonly badge: string;
}

export interface CountryStrategicPageEntry {
    readonly slug: string;
    readonly langCode: 'fr' | 'en' | 'de' | 'es' | 'pt' | 'ar';
    readonly hreflang: 'fr-FR' | 'en-US' | 'de-DE' | 'es-ES' | 'pt-BR' | 'ar-SA';
    readonly dir: 'ltr' | 'rtl';
    readonly flag: string;
    readonly countryName: string;
    readonly nativeGameName: string;
    readonly seoTitle: string;
    readonly seoDescription: string;
    readonly keywords: readonly string[];
    readonly h1: string;
    readonly heroSubtitle: string;
    readonly culturalHookTitle: string;
    readonly culturalHookBody: string;
    readonly erhSectionTitle: string;
    readonly erhSectionBody: string;
    readonly ctaPlayLabel: string;
    readonly ctaQuizLabel: string;
    readonly ctaRulesLabel: string;
    readonly localHighlightsTitle: string;
    readonly localHighlights: readonly CountryLocalHighlight[];
    readonly faqs: readonly CountryFaqItem[];
}

export const COUNTRY_STRATEGIC_CATALOG: ReadonlyArray<CountryStrategicPageEntry> = [
    {
        slug: 'france-monaco',
        langCode: 'fr',
        hreflang: 'fr-FR',
        dir: 'ltr',
        flag: '🇫🇷🇲🇨',
        countryName: 'France, Monaco & Francophonie',
        nativeGameName: 'Backgammon (Toutes Tables)',
        seoTitle: 'Jouer au Backgammon en Ligne (France & Monaco) — Coach IA & Méthode ERH',
        seoDescription:
            'Plateforme francophone de référence inspirée du Cercle Monte-Carlo : jouez au Backgammon en ligne gratuitement, maîtrisez le Videau et réduisez votre PR avec le Coach Vocal IA et la Méthode ERH.',
        keywords: [
            'jouer au backgammon en ligne',
            'backgammon gratuit france',
            'cercle monte-carlo backgammon',
            'fédération française de backgammon ffb',
            'coach ia backgammon français',
            'méthode erh backgammon',
            'règles du backgammon en 5 minutes',
        ],
        h1: 'Backgammon en Ligne — Édition France, Monaco & Cercle Monte-Carlo',
        heroSubtitle:
            'Du salon feutré de Monte-Carlo aux clubs parisiens et lyonnais : affrontez nos 5 adversaires calibrés, écoutez le Coach Vocal en français et entraînez-vous sur vos propres Blunders.',
        culturalHookTitle: 'Du Trictrac historique au Backgammon de Compétition Moderne (FFB & WBGF)',
        culturalHookBody:
            'La France et la Principauté de Monaco bercent l’élite mondiale du Backgammon depuis plus de cinquante ans. Contrairement au Jacquet ou au Trictrac ancien, le Backgammon moderne se joue avec le Videau (cube doubleur) et se mesure au Performance Rating (PR). Notre plateforme vous offre un entraînement de niveau Grand-Maître en français intégral.',
        erhSectionTitle: 'La Méthode ERH : Exploitez la Psychologie et le Niveau Réel de votre Adversaire',
        erhSectionBody:
            'Au-delà du coup théorique pur, notre Quizz ERH (Exploitation du Risque et de l’Erreur Humaine) vous apprend à ajuster votre stratégie face à un joueur prudent, impulsif ou sujet aux fautes sous pression.',
        ctaPlayLabel: '🎲 Jouer Maintenant en Français',
        ctaQuizLabel: '🎭 Tester mon Indice ERH (Quizz)',
        ctaRulesLabel: '📖 Règles du Backgammon en 5 min',
        localHighlightsTitle: 'Tournois & Clubs Mythiques en France et à Monaco',
        localHighlights: [
            { name: 'Championnat du Monde de Monte-Carlo', city: 'Monaco', href: '/tournaments/monte-carlo-world-championship-2027', badge: 'Championnat du Monde' },
            { name: 'Paris Masters FFB', city: 'Paris', href: '/tournaments/paris-masters-ffb-2026', badge: 'Tournoi Majeur FFB' },
            { name: 'Riviera Cup Nice', city: 'Nice', href: '/tournaments/riviera-cup-nice-2027', badge: 'Côte d’Azur' },
            { name: 'Club Paris Vie d’Eau', city: 'Paris', href: '/tournaments/clubs/paris-vie-deau', badge: 'Club Officiel' },
        ],
        faqs: [
            {
                question: 'Où jouer au Backgammon en ligne gratuitement en français ?',
                answer: 'Sur Backgammon Tour (Cercle Monte-Carlo), vous pouvez jouer gratuitement en ligne ou contre 5 Bots personnifiés, avec analyse du Performance Rating (PR) et Coach Vocal en français.',
            },
            {
                question: 'Quelle est la différence entre le PR et l’Indice ERH au Backgammon ?',
                answer: 'Le PR (Performance Rating) mesure l’écart mathématique face à un moteur parfait, tandis que notre Indice ERH mesure votre capacité à exploiter les erreurs et la psychologie d’un adversaire humain réel.',
            },
        ],
    },
    {
        slug: 'usa-uk',
        langCode: 'en',
        hreflang: 'en-US',
        dir: 'ltr',
        flag: '🇺🇸🇬🇧',
        countryName: 'United States & United Kingdom',
        nativeGameName: 'Tournament Backgammon',
        seoTitle: 'Play Backgammon Online Free (USA & UK) — AI Coach, PR Analyzer & ERH Quiz',
        seoDescription:
            'Play tournament-grade Backgammon online for free. Train with our 3-Ply Neural AI Coach, master the Doubling Cube, review your own match blunders, and test your ERH Index.',
        keywords: [
            'play backgammon online free',
            'backgammon ai coach',
            'backgammon pr analyzer',
            'usbgf tournament training',
            'ukbgf backgammon',
            'backgammon blunder drill',
            'doubling cube trainer',
        ],
        h1: 'Tournament Backgammon Online — USA & UK Grandmaster Edition',
        heroSubtitle:
            'Built for USBGF and UKBGF club & tournament players: zero pay-to-win coins, certified SHA-256 / 36-Bag dice, 3-Layer Chameleon AI Coach, and automatic Personal Blunder Quizzes.',
        culturalHookTitle: 'From New York & Las Vegas Chouettes to London Mayfair Clubs',
        culturalHookBody:
            'Whether you compete on the ABT (American Backgammon Tour) in Las Vegas and Chicago or the UKBGF Tour in London, lowering your Performance Rating (PR) requires instant visual feedback. Our Chameleon Coach translates complex equity swings into clear 3-second tactical rules.',
        erhSectionTitle: 'The ERH Method: Exploiting Human Risk & Opponent Error Rates',
        erhSectionBody:
            'Engines assume a perfect opponent. In real club matches, knowing whether your opponent is cube-timid, overly aggressive, or prone to contact errors changes the optimal play. Train this edge in our ERH Quiz.',
        ctaPlayLabel: '🎲 Play Backgammon Now (Free)',
        ctaQuizLabel: '🎭 Start Adaptive ERH Quiz',
        ctaRulesLabel: '📖 Learn the Rules in 5 Min',
        localHighlightsTitle: 'Featured USA & UK Tournaments and Clubs',
        localHighlights: [
            { name: 'Las Vegas Open', city: 'Las Vegas, NV', href: '/tournaments/las-vegas-open-2026', badge: 'ABT Major' },
            { name: 'Chicago Open', city: 'Chicago, IL', href: '/tournaments/chicago-open-2027', badge: 'USBGF Classic' },
            { name: 'UK Backgammon Open', city: 'London / Coventry', href: '/tournaments/uk-backgammon-open-2027', badge: 'UKBGF Championship' },
            { name: 'New York Metro Backgammon Club', city: 'New York, NY', href: '/tournaments/clubs/new-york-metro-club', badge: 'Historic Club' },
        ],
        faqs: [
            {
                question: 'What is the best site to play Backgammon online with an AI Coach?',
                answer: 'Backgammon Tour offers free online play with a 3-Ply neural AI Coach, automatic Personal Blunder Quizzes after every match, voice commentary, and zero pay-to-win coins.',
            },
            {
                question: 'How does the Personal Blunder Quiz work?',
                answer: 'Every time you commit a checker or doubling cube blunder during a match, the position is automatically added to your "Review My Blunders" deck so you can master your exact weaknesses.',
            },
        ],
    },
    {
        slug: 'deutschland-dach',
        langCode: 'de',
        hreflang: 'de-DE',
        dir: 'ltr',
        flag: '🇩🇪🇦🇹🇨🇭',
        countryName: 'Deutschland, Österreich & Schweiz (DACH)',
        nativeGameName: 'Turnier-Backgammon',
        seoTitle: 'Backgammon Online Spielen (Deutschland & DACH) — KI-Trainer & ERH-Methode',
        seoDescription:
            'Spielen Sie kostenlos Turnier-Backgammon online auf Deutsch. Verbessern Sie Ihr PR mit unserem 3-Ply KI-Coach, meistern Sie den Verdopplungswürfel und trainieren Sie Ihre eigenen Blunders.',
        keywords: [
            'backgammon online spielen',
            'backgammon kostenlos deutsch',
            'backgammon ki trainer',
            'verdopplungswürfel strategie',
            'backgammon regeln lernen',
            'dbgv backgammon turnier',
        ],
        h1: 'Backgammon Online Spielen — KI-Grossmeister-Trainer (DACH-Edition)',
        heroSubtitle:
            'Präzision wie ein Schweizer Uhrwerk: Spielen Sie kostenlos ohne Werbung, hören Sie den deutschen Sprach-Coach und verwandeln Sie jeden Spielfehler automatisch in Ihr persönliches Quiz.',
        culturalHookTitle: 'Deutsche & Schweizer Backgammon-Tradition auf Weltklasseniveau',
        culturalHookBody:
            'Der deutschsprachige Raum zählt zu den stärksten Backgammon-Nationen Europas. Unser Chamäleon-Coach passt sich mit einem Klick Ihrem Niveau an: vom Einsteiger (Gewinnchancen in Prozent) über den Klubspieler bis zum Turnier-Profi (exakte Equity & PR).',
        erhSectionTitle: 'Die ERH-Methode: Menschliche Fehlerraten & Psychologie gezielt nutzen',
        erhSectionBody:
            'Lernen Sie im ERH-Quiz, wie Sie gegen zögerliche, ungeduldige oder fehleranfällige Gegner im echten Turnierspiel die maximale Gewinnwahrscheinlichkeit herausholen.',
        ctaPlayLabel: '🎲 Jetzt auf Deutsch Spielen',
        ctaQuizLabel: '🎭 Adaptives ERH-Quiz Starten',
        ctaRulesLabel: '📖 Backgammon-Regeln in 5 Min.',
        localHighlightsTitle: 'Turniere & Clubs in Deutschland und der Schweiz',
        localHighlights: [
            { name: 'German Backgammon Open', city: 'Frankfurt / Niedernhausen', href: '/tournaments/german-backgammon-open-2027', badge: 'Deutsches Hauptturnier' },
            { name: 'Geneva Lake Classic', city: 'Genf (Suisse)', href: '/tournaments/geneva-lake-classic-2027', badge: 'Schweizer Klassiker' },
            { name: 'Association Genevoise de Backgammon', city: 'Genf', href: '/tournaments/clubs/association-genevoise-backgammon', badge: 'Offizieller Club' },
        ],
        faqs: [
            {
                question: 'Kann man auf Backgammon Tour kostenlos auf Deutsch spielen?',
                answer: 'Ja, das gesamte Spiel, die 5 KI-Persönlichkeiten, der deutsche Sprach-Coach und das adaptive Fehler-Quiz sind komplett auf Deutsch verfügbar.',
            },
            {
                question: 'Wie lernt man den Verdopplungswürfel (Cube) am schnellsten?',
                answer: 'Unser Coach zeigt Ihnen nach jeder Entscheidung sofort, ob ein Doppeln oder Annehmen (Take Point ab 21,5 % Gewinnchance) korrekt war.',
            },
        ],
    },
    {
        slug: 'espana-latam',
        langCode: 'es',
        hreflang: 'es-ES',
        dir: 'ltr',
        flag: '🇪🇸🇲🇽🇦🇷',
        countryName: 'España y Latinoamérica',
        nativeGameName: 'Backgammon (Tablas Reales)',
        seoTitle: 'Jugar al Backgammon Online Gratis (España y LatAm) — Entrenador IA y Quiz ERH',
        seoDescription:
            'Juega al Backgammon online gratis en español. Aprende las reglas en 5 minutos, domina el Dado de Doblar (Videau) y corrige tus propios errores con nuestro Entrenador Vocal IA.',
        keywords: [
            'jugar backgammon online gratis',
            'backgammon en español',
            'reglas del backgammon',
            'entrenador backgammon ia',
            'dado de doblar backgammon',
            'tablas reales online',
        ],
        h1: 'Jugar al Backgammon Online en Español — Entrenador IA y Método ERH',
        heroSubtitle:
            'Domina las 15 aperturas, el Dado de Doblar y la psicología del rival con nuestro Entrenador IA en español, con voz natural y cuestionarios adaptativos de tus propios errores.',
        culturalHookTitle: 'De las Tablas Reales al Backgammon de Torneo Internacional',
        culturalHookBody:
            'Tanto en España como en México, Argentina, Colombia y Chile, el Backgammon vive un auge competitivo. Nuestra interfaz Camaleón te guía paso a paso desde tus primeras partidas hasta el cálculo avanzado de PR.',
        erhSectionTitle: 'Método ERH: Cómo Jugar Según el Perfil Psicológico de tu Rival',
        erhSectionBody:
            'No se juega igual contra un rival temeroso con el cubo que contra un jugador agresivo. Nuestro Quiz ERH te entrena con escenarios humanos reales.',
        ctaPlayLabel: '🎲 Jugar Ahora en Español',
        ctaQuizLabel: '🎭 Probar el Quiz Adaptativo ERH',
        ctaRulesLabel: '📖 Reglas en 5 Minutos',
        localHighlightsTitle: 'Torneos Internacionales y Clubes Cercanos',
        localHighlights: [
            { name: 'Gibraltar Backgammon Championship', city: 'Gibraltar / Costa del Sol', href: '/tournaments/gibraltar-championship-2027', badge: 'Torneo Internacional' },
            { name: 'Monte-Carlo World Championship', city: 'Mónaco', href: '/tournaments/monte-carlo-world-championship-2027', badge: 'Mundial WBGF' },
        ],
        faqs: [
            {
                question: '¿Dónde jugar al Backgammon online gratis en español sin anuncios?',
                answer: 'En Backgammon Tour puedes jugar gratis desde móvil o PC con análisis de inteligencia artificial en español, voz integrada y sin fichas de pago.',
            },
            {
                question: '¿Cómo aprender las aperturas del Backgammon rápidamente?',
                answer: 'Nuestra Academia y el Quiz ERH te enseñan las 15 jugadas iniciales (como 3-1 en el punto 5 o 6-1 en el punto de barra) directamente sobre el tablero.',
            },
        ],
    },
    {
        slug: 'brasil-portugal',
        langCode: 'pt',
        hreflang: 'pt-BR',
        dir: 'ltr',
        flag: '🇧🇷🇵🇹',
        countryName: 'Brasil e Portugal',
        nativeGameName: 'Gamão (Backgammon)',
        seoTitle: 'Jogar Gamão Online Grátis (Brasil e Portugal) — Treinador IA e Método ERH',
        seoDescription:
            'Jogue Gamão (Backgammon) online grátis em português. Aprenda as regras em 5 minutos, domine o Dado de Dobrar e reveja os seus próprios erros com o Treinador de Voz IA.',
        keywords: [
            'jogar gamão online grátis',
            'gamão online brasil',
            'regras do gamão',
            'treinador de gamão ia',
            'backgammon em português',
            'dado de dobrar gamão',
        ],
        h1: 'Jogar Gamão (Backgammon) Online Grátis — Edição Brasil e Portugal',
        heroSubtitle:
            'A plataforma definitiva de Gamão em português: jogue no celular ou computador, ouça as dicas do Treinador IA com voz nativa e transforme suas falhas de partida em um Quiz personalizado.',
        culturalHookTitle: 'A Paixão pelo Gamão no Brasil e em Portugal com Precisão de Grande Mestre',
        culturalHookBody:
            'No Brasil e em Portugal, o Gamão é tradição nos clubes e praias. Agora você conta com o motor neural 3-Ply do Cercle Monte-Carlo traduzido em português, sem propagandas e sem venda de moedas virtuais.',
        erhSectionTitle: 'Método ERH: Explore o Risco e a Taxa de Erro Humana no Gamão',
        erhSectionBody:
            'Descubra como adaptar suas jogadas de peças e do cubo de dobra quando enfrenta um adversário cauteloso, impaciente ou mais fraco tecnicamente.',
        ctaPlayLabel: '🎲 Jogar Gamão Agora (Grátis)',
        ctaQuizLabel: '🎭 Iniciar Quiz ERH & Meus Erros',
        ctaRulesLabel: '📖 Regras do Gamão em 5 Min',
        localHighlightsTitle: 'Torneios de Gamão no Brasil e no Mundo',
        localHighlights: [
            { name: 'São Paulo Backgammon Open', city: 'São Paulo, Brasil', href: '/tournaments/sao-paulo-open-2027', badge: 'Brasil Major' },
            { name: 'Monte-Carlo World Championship', city: 'Mônaco', href: '/tournaments/monte-carlo-world-championship-2027', badge: 'Mundial WBGF' },
        ],
        faqs: [
            {
                question: 'Qual é o melhor site para jogar Gamão online grátis em português?',
                answer: 'O Backgammon Tour oferece Gamão online gratuito com Treinador de Inteligência Artificial em português, voz nativa (pt-BR) e revisão automática dos seus erros.',
            },
            {
                question: 'Como funciona o Dado de Dobrar no Gamão?',
                answer: 'Quando você tem vantagem clara na partida, pode propor dobrar o valor do jogo (×2, ×4). Nosso treinador mostra em tempo real quando dobrar e quando aceitar.',
            },
        ],
    },
    {
        slug: 'monde-arabe-mena',
        langCode: 'ar',
        hreflang: 'ar-SA',
        dir: 'rtl',
        flag: '🇸🇦🇦🇪🇪🇬',
        countryName: 'العالم العربي والشرق الأوسط (MENA)',
        nativeGameName: 'طاولة / باكجامون (Tawla & Backgammon)',
        seoTitle: 'العب الطاولة (باكجامون) أونلاين مجاناً — مدرب الذكاء الاصطناعي ومنهج ERH',
        seoDescription:
            'العب الطاولة العالمية (Backgammon) أونلاين مجاناً باللغة العربية. تعلم القواعد في 5 دقائق، أتقن مكعب المضاعفة، وراجع أخطاءك مع المدرب الصوتي الذكي.',
        keywords: [
            'طاولة أونلاين مجانا',
            'لعبة الطاولة باكجامون',
            'شيش بيش اون لاين',
            'قواعد لعبة الطاولة العالمية',
            'مدرب باكجامون ذكاء اصطناعي',
            'بطولة دبي للباكجامون',
        ],
        h1: 'العب الطاولة العالمية (باكجامون) أونلاين — المدرب الذكي ومنهج ERH',
        heroSubtitle:
            'من بيروت والقاهرة إلى دبي والرياض: استمتع بلعبة الطاولة الاحترافية بواجهة عربية كاملة (RTL)، مدرب صوتي ذكي، واختبار تكيفي يعالج أخطاءك تلقائياً.',
        culturalHookTitle: 'من الطاولة الشرقية التقليدية إلى بطولات الباكجامون العالمية',
        culturalHookBody:
            'تعتبر لعبة الطاولة جزءاً أصيلاً من التراث العربي. تمنحك منصتنا تجربة احترافية وفق معايير الاتحاد العالمي (WBGF) مع شرح مبسط للمبتدئين وتحليل عميق للمحترفين بدون أي إعلانات.',
        erhSectionTitle: 'منهج ERH: كيف تستغل نفسية الخصم ومعدل الخطأ البشري',
        erhSectionBody:
            'تعلم كيف تختار النقلة المثالية عندما تواجه خصماً متردداً في المضاعفة أو خصماً مندفعاً يرتكب أخطاء تحت الضغط.',
        ctaPlayLabel: '🎲 العب الآن مجاناً بالعربية',
        ctaQuizLabel: '🎭 ابدأ اختبار ERH ومراجعة أخطائي',
        ctaRulesLabel: '📖 تعلم القواعد في 5 دقائق',
        localHighlightsTitle: 'أبرز البطولات والأندية في العالم العربي والبحر المتوسط',
        localHighlights: [
            { name: 'Dubai Creek Backgammon Masters', city: 'دبي، الإمارات', href: '/tournaments/dubai-creek-masters-2027', badge: 'بطولة دولية' },
            { name: 'Merit Open Cyprus', city: 'قبرص', href: '/tournaments/merit-open-cyprus-2026', badge: 'بطولة كبرى' },
            { name: 'MindSkillz Backgammon Lounge', city: 'دبي', href: '/tournaments/clubs/mindskillz-dubai', badge: 'نادي رسمي' },
        ],
        faqs: [
            {
                question: 'كيف ألعب الطاولة العالمية (Backgammon) أونلاين مجاناً بالعربية؟',
                answer: 'يوفر موقع Backgammon Tour واجهة عربية كاملة مع مدرب ذكاء اصطناعي ناطق بالعربية واختبارات تفاعلية لتطوير مستواك مجاناً.',
            },
            {
                question: 'ما الفرق بين الطاولة العادية والباكجامون الدولي؟',
                answer: 'في الباكجامون الدولي يمكن ضرب الحجر المفرد (Blot) واستخدام مكعب المضاعفة (Videau) لزيادة نقاط الجولة، مما يجعلها لعبة مهارة واستراتيجية.',
            },
        ],
    },
] as const;

export function getCountryStrategicPageBySlug(slug: string): CountryStrategicPageEntry | null {
    const clean = slug.trim().toLowerCase();
    return COUNTRY_STRATEGIC_CATALOG.find((item) => item.slug === clean) ?? null;
}

