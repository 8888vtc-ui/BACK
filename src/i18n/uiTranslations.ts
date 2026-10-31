/**
 * Dictionnaires UI complets (Navbar, Lobby, Navigation & Gammon Academy CTA)
 * pour les 6 marchés clés du Backgammon mondial : FR, EN, ES, PT, DE, AR (+ JA).
 * Strictement 0 any, 0 placeholder.
 */

import type { Locale, PrimaryLocale } from '../lib/i18n/types';

export interface UiLocaleStrings {
    readonly navbar: {
        readonly brandSubtitle: string;
        readonly play: string;
        readonly tournaments: string;
        readonly puzzles: string;
        readonly drills: string;
        readonly openings: string;
        readonly progression: string;
        readonly academy: string;
        readonly mobileMenuAria: string;
        readonly languageSelectorAria: string;
    };
    readonly lobby: {
        readonly activeMemberPrefix: string;
        readonly privateSalonSession: string;
        readonly subtitle: string;
        readonly cardAiBadge: string;
        readonly cardAiTitle: string;
        readonly cardAiSubtitle: string;
        readonly cardMultiBadge: string;
        readonly cardMultiTitle: string;
        readonly cardMultiSubtitle: string;
        readonly cardTrainingBadge: string;
        readonly cardTrainingTitle: string;
        readonly cardTrainingSubtitle: string;
        readonly tableAndClock: string;
        readonly configure: string;
        readonly collapse: string;
        readonly ivory: string;
        readonly ebony: string;
        readonly moneyGame: string;
        readonly playNow: string;
        readonly dailyPuzzlesTitle: string;
        readonly dailyPuzzlesDesc: string;
        readonly blunderDrillsTitle: string;
        readonly blunderDrillsDesc: string;
        readonly openBtn: string;
        readonly academyBannerBadge: string;
        readonly academyBannerTitle: string;
        readonly academyBannerDesc: string;
        readonly academyBannerCta: string;
        readonly formatMoneyHint: string;
        readonly formatShortHint: string;
        readonly formatFastHint: string;
        readonly formatStandardHint: string;
        readonly formatLongHint: string;
        readonly opponentNovice: string;
        readonly opponentIntermediate: string;
        readonly opponentMaster: string;
        readonly opponentGrandmaster: string;
    };
    readonly subpages: {
        readonly backToLobby: string;
        readonly puzzlesLink: string;
        readonly drillsLink: string;
        readonly progressionLink: string;
        readonly academyLink: string;
    };
    readonly pwa: {
        readonly installApp: string;
        readonly installAppAria: string;
        readonly iosModalTitle: string;
        readonly iosModalSubtitle: string;
        readonly iosStep1Title: string;
        readonly iosStep1Desc: string;
        readonly iosStep2Title: string;
        readonly iosStep2Desc: string;
        readonly iosModalClose: string;
    };
}

export const UI_TRANSLATIONS: Record<PrimaryLocale, UiLocaleStrings> = {
    fr: {
        navbar: {
            brandSubtitle: 'Tour · Académie',
            play: 'Salon de Jeu',
            tournaments: 'Tournois & Agenda',
            puzzles: 'Puzzles',
            drills: 'Entraînement',
            openings: 'Ouvertures',
            progression: 'Progression',
            academy: 'Académie',
            mobileMenuAria: 'Menu de navigation mobile',
            languageSelectorAria: 'Sélecteur de langue',
        },
        lobby: {
            activeMemberPrefix: 'Membre Actif',
            privateSalonSession: 'Salon Privé · Session Active',
            subtitle: 'Backgammon Tour',
            cardAiBadge: '5 Maîtres',
            cardAiTitle: 'Jouer contre l’IA',
            cardAiSubtitle: 'Partie rapide ou Match classé',
            cardMultiBadge: 'En Ligne',
            cardMultiTitle: 'Jouer en Ligne',
            cardMultiSubtitle: 'Adversaire direct ou Salon Ami',
            cardTrainingBadge: 'Académie',
            cardTrainingTitle: 'Puzzles & Quizz',
            cardTrainingSubtitle: 'Revoir mes Blunders & Problèmes',
            tableAndClock: 'Table & Pendule',
            configure: '▾ Configurer',
            collapse: '▴ Réduire',
            ivory: 'Ivoire',
            ebony: 'Ébène',
            moneyGame: 'Money',
            playNow: 'Lancer la Partie',
            dailyPuzzlesTitle: '🧩 Puzzles Quotidiens',
            dailyPuzzlesDesc: 'Problèmes tactiques du jour',
            blunderDrillsTitle: '🎯 Quizz & Mes Blunders',
            blunderDrillsDesc: 'Corrigez vos erreurs réelles de match',
            openBtn: 'Ouvrir →',
            academyBannerBadge: 'Encyclopédie Grand-Maître · SEO Hub',
            academyBannerTitle: 'Backgammon Tour — Guides des 15 Ouvertures, Videau & Stratégie 3-Ply',
            academyBannerDesc: 'Étudiez les tables d’équité Monte-Carlo, le seuil de Take Point à 21,5 %, la règle de Crawford et le Keith Count.',
            academyBannerCta: 'Explorer l’Académie →',
            formatMoneyHint: "Partie d'argent",
            formatShortHint: 'Match court',
            formatFastHint: 'Match rapide',
            formatStandardHint: 'Match standard',
            formatLongHint: 'Match long',
            opponentNovice: 'Novice',
            opponentIntermediate: 'Intermédiaire',
            opponentMaster: 'Maître',
            opponentGrandmaster: 'Grand Maître',
        },
        subpages: {
            backToLobby: 'Retour au Lobby',
            puzzlesLink: 'Puzzles Quotidiens',
            drillsLink: 'Drills de Blunders',
            progressionLink: 'Progression & PR',
            academyLink: 'Gammon Academy',
        },
        pwa: {
            installApp: "Installer l'App",
            installAppAria: "Installer l'application Backgammon Tour sur votre appareil",
            iosModalTitle: "Installer Backgammon Tour",
            iosModalSubtitle: "Profitez d'une expérience native plein écran sans barre d'adresse ni interruption.",
            iosStep1Title: "1. Appuyez sur Partager",
            iosStep1Desc: "Dans la barre de menu Safari (en bas sur iPhone, en haut sur iPad).",
            iosStep2Title: "2. Sur l'écran d'accueil",
            iosStep2Desc: "Faites défiler le menu et sélectionnez « Sur l'écran d'accueil ».",
            iosModalClose: "J'ai compris",
        },
    },
    en: {
        navbar: {
            brandSubtitle: 'Tour · Academy',
            play: 'Game Salon',
            tournaments: 'Tournaments & Calendar',
            puzzles: 'Puzzles',
            drills: 'Drills',
            openings: 'Openings',
            progression: 'Progression',
            academy: 'Academy',
            mobileMenuAria: 'Mobile navigation menu',
            languageSelectorAria: 'Language selector',
        },
        lobby: {
            activeMemberPrefix: 'Active Member',
            privateSalonSession: 'Private Salon · Active Session',
            subtitle: 'Backgammon Tour',
            cardAiBadge: 'Monte-Carlo 3-Ply',
            cardAiTitle: 'Play vs AI',
            cardAiSubtitle: 'Private Table · Real-Time Coach',
            cardMultiBadge: 'Invite Code',
            cardMultiTitle: 'Private Salon',
            cardMultiSubtitle: 'Challenge a Friend or Club Partner',
            cardTrainingBadge: 'Academy',
            cardTrainingTitle: 'Training',
            cardTrainingSubtitle: 'Tactical Drills · Puzzles',
            tableAndClock: 'Table & Clock',
            configure: '▾ Configure',
            collapse: '▴ Collapse',
            ivory: 'Ivory',
            ebony: 'Ebony',
            moneyGame: 'Money',
            playNow: 'Play Now',
            dailyPuzzlesTitle: '🧩 Daily Puzzles',
            dailyPuzzlesDesc: 'Monte-Carlo 3-Ply certified positions',
            blunderDrillsTitle: '🎯 Blunder Drills',
            blunderDrillsDesc: 'Replay and fix your critical mistakes',
            openBtn: 'Open →',
            academyBannerBadge: 'Grandmaster Encyclopedia · Strategy Hub',
            academyBannerTitle: 'Backgammon Tour — 15 Opening Rolls, Doubling Cube & 3-Ply Strategy',
            academyBannerDesc: 'Master Monte-Carlo equity tables, the 21.5% Live Cube Take Point, Crawford Rule, and Keith Count.',
            academyBannerCta: 'Explore Academy →',
            formatMoneyHint: 'Money game',
            formatShortHint: 'Short match',
            formatFastHint: 'Fast match',
            formatStandardHint: 'Standard match',
            formatLongHint: 'Championship match',
            opponentNovice: 'Novice',
            opponentIntermediate: 'Intermediate',
            opponentMaster: 'Master',
            opponentGrandmaster: 'Grandmaster',
        },
        subpages: {
            backToLobby: 'Back to Lobby',
            puzzlesLink: 'Daily Puzzles',
            drillsLink: 'Blunder Drills',
            progressionLink: 'Progression & PR',
            academyLink: 'Gammon Academy',
        },
        pwa: {
            installApp: 'Install App',
            installAppAria: 'Install Backgammon Tour application on your device',
            iosModalTitle: 'Install Backgammon Tour',
            iosModalSubtitle: 'Enjoy a native full-screen experience with no address bar or interruptions.',
            iosStep1Title: '1. Tap the Share button',
            iosStep1Desc: 'In the Safari menu bar (bottom on iPhone, top on iPad).',
            iosStep2Title: '2. Add to Home Screen',
            iosStep2Desc: "Scroll down and select 'Add to Home Screen'.",
            iosModalClose: 'Got it',
        },
    },
    es: {
        navbar: {
            brandSubtitle: 'Tour · Academia',
            play: 'Salón de Juego',
            tournaments: 'Torneos y Agenda',
            puzzles: 'Problemas',
            drills: 'Entrenamiento',
            openings: 'Aperturas',
            progression: 'Progresión',
            academy: 'Academia',
            mobileMenuAria: 'Menú de navegación móvil',
            languageSelectorAria: 'Selector de idioma',
        },
        lobby: {
            activeMemberPrefix: 'Miembro Activo',
            privateSalonSession: 'Salón Privado · Sesión Activa',
            subtitle: 'Backgammon Tour',
            cardAiBadge: 'Monte-Carlo 3-Ply',
            cardAiTitle: 'Jugar contra la IA',
            cardAiSubtitle: 'Mesa Privada · Coach en Tiempo Real',
            cardMultiBadge: 'Código Invitación',
            cardMultiTitle: 'Salón Privado',
            cardMultiSubtitle: 'Desafía a un Amigo o Compañero de Club',
            cardTrainingBadge: 'Academia',
            cardTrainingTitle: 'Entrenamiento',
            cardTrainingSubtitle: 'Drills Tácticos · Problemas',
            tableAndClock: 'Mesa y Reloj',
            configure: '▾ Configurar',
            collapse: '▴ Ocultar',
            ivory: 'Marfil',
            ebony: 'Ébano',
            moneyGame: 'Money',
            playNow: 'Jugar ahora',
            dailyPuzzlesTitle: '🧩 Problemas Diarios',
            dailyPuzzlesDesc: 'Posiciones certificadas por Monte-Carlo 3-Ply',
            blunderDrillsTitle: '🎯 Drills de Errores (Blunders)',
            blunderDrillsDesc: 'Repite y corrige tus errores críticos',
            openBtn: 'Abrir →',
            academyBannerBadge: 'Enciclopedia Gran Maestro · Estrategia',
            academyBannerTitle: 'Backgammon Tour — Las 15 Aperturas, Dado de Doblaje y Estrategia 3-Ply',
            academyBannerDesc: 'Domina las tablas de equidad Monte-Carlo, el Take Point al 21,5 %, la regla de Crawford y el conteo de Pips.',
            academyBannerCta: 'Explorar la Academia →',
            formatMoneyHint: 'Partida libre',
            formatShortHint: 'Partido corto',
            formatFastHint: 'Partido rápido',
            formatStandardHint: 'Partido estándar',
            formatLongHint: 'Partido largo',
            opponentNovice: 'Novato',
            opponentIntermediate: 'Intermedio',
            opponentMaster: 'Maestro',
            opponentGrandmaster: 'Gran Maestro',
        },
        subpages: {
            backToLobby: 'Volver al Salón',
            puzzlesLink: 'Problemas Diarios',
            drillsLink: 'Drills de Blunders',
            progressionLink: 'Progresión y PR',
            academyLink: 'Gammon Academy',
        },
        pwa: {
            installApp: 'Instalar App',
            installAppAria: 'Instalar la aplicación Backgammon Tour en tu dispositivo',
            iosModalTitle: 'Instalar Backgammon Tour',
            iosModalSubtitle: 'Disfruta de una experiencia nativa en pantalla completa sin barra de direcciones ni interrupciones.',
            iosStep1Title: '1. Pulsa el botón Compartir',
            iosStep1Desc: 'En la barra de menú Safari (abajo en iPhone, arriba en iPad).',
            iosStep2Title: '2. A pantalla de inicio',
            iosStep2Desc: 'Desplázate y selecciona «Añadir a pantalla de inicio».',
            iosModalClose: 'Entendido',
        },
    },
    pt: {
        navbar: {
            brandSubtitle: 'Tour · Academia',
            play: 'Salão de Jogo',
            tournaments: 'Torneios e Agenda',
            puzzles: 'Desafios',
            drills: 'Treino',
            openings: 'Aberturas',
            progression: 'Progressão',
            academy: 'Academia',
            mobileMenuAria: 'Menu de navegação móvel',
            languageSelectorAria: 'Seletor de idioma',
        },
        lobby: {
            activeMemberPrefix: 'Membro Ativo',
            privateSalonSession: 'Salão Privado · Sessão Ativa',
            subtitle: 'Backgammon Tour',
            cardAiBadge: 'Monte-Carlo 3-Ply',
            cardAiTitle: 'Jogar contra a IA',
            cardAiSubtitle: 'Mesa Privada · Coach em Tempo Real',
            cardMultiBadge: 'Código Convite',
            cardMultiTitle: 'Salão Privado',
            cardMultiSubtitle: 'Desafie um Amigo ou Parceiro de Clube',
            cardTrainingBadge: 'Academia',
            cardTrainingTitle: 'Treinamento',
            cardTrainingSubtitle: 'Drills Táticos · Desafios',
            tableAndClock: 'Mesa e Relógio',
            configure: '▾ Configurar',
            collapse: '▴ Recolher',
            ivory: 'Marfim',
            ebony: 'Ébano',
            moneyGame: 'Money',
            playNow: 'Jogar agora',
            dailyPuzzlesTitle: '🧩 Desafios Diários',
            dailyPuzzlesDesc: 'Posições certificadas pelo Monte-Carlo 3-Ply',
            blunderDrillsTitle: '🎯 Treino de Blunders',
            blunderDrillsDesc: 'Jogue novamente e corrija seus erros graves',
            openBtn: 'Abrir →',
            academyBannerBadge: 'Enciclopédia Grande Mestre · Estratégia',
            academyBannerTitle: 'Backgammon Tour — As 15 Aberturas, Dado de Dobra e Estratégia 3-Ply',
            academyBannerDesc: 'Domine a equidade Monte-Carlo, o Take Point de 21,5%, a Regra de Crawford e a Contagem de Pips.',
            academyBannerCta: 'Explorar Academia →',
            formatMoneyHint: 'Partida a dinheiro',
            formatShortHint: 'Partida curta',
            formatFastHint: 'Partida rápida',
            formatStandardHint: 'Partida padrão',
            formatLongHint: 'Partida longa',
            opponentNovice: 'Novato',
            opponentIntermediate: 'Intermediário',
            opponentMaster: 'Mestre',
            opponentGrandmaster: 'Grande Mestre',
        },
        subpages: {
            backToLobby: 'Voltar ao Salão',
            puzzlesLink: 'Desafios Diários',
            drillsLink: 'Treino de Blunders',
            progressionLink: 'Progressão e PR',
            academyLink: 'Gammon Academy',
        },
        pwa: {
            installApp: 'Instalar App',
            installAppAria: 'Instalar o aplicativo Backgammon Tour no seu dispositivo',
            iosModalTitle: 'Instalar Backgammon Tour',
            iosModalSubtitle: 'Desfrute de uma experiência nativa em tela cheia sem barra de endereços nem interrupções.',
            iosStep1Title: '1. Toque no botão Compartilhar',
            iosStep1Desc: 'Na barra do Safari (embaixo no iPhone, em cima no iPad).',
            iosStep2Title: '2. Adicionar à Tela de Início',
            iosStep2Desc: "Role o menu e selecione 'Adicionar à Tela de Início'.",
            iosModalClose: 'Entendi',
        },
    },
    de: {
        navbar: {
            brandSubtitle: 'Tour · Akademie',
            play: 'Spielsalon',
            tournaments: 'Turniere & Kalender',
            puzzles: 'Puzzles',
            drills: 'Training',
            openings: 'Eröffnungen',
            progression: 'Fortschritt',
            academy: 'Akademie',
            mobileMenuAria: 'Mobiles Navigationsmenü',
            languageSelectorAria: 'Sprachauswahl',
        },
        lobby: {
            activeMemberPrefix: 'Aktives Mitglied',
            privateSalonSession: 'Privatsalon · Aktive Sitzung',
            subtitle: 'Backgammon Tour',
            cardAiBadge: 'Monte-Carlo 3-Ply',
            cardAiTitle: 'Gegen KI spielen',
            cardAiSubtitle: 'Privattisch · Echtzeit-Coach',
            cardMultiBadge: 'Einladungscode',
            cardMultiTitle: 'Privatsalon',
            cardMultiSubtitle: 'Freund oder Clubpartner herausfordern',
            cardTrainingBadge: 'Akademie',
            cardTrainingTitle: 'Training',
            cardTrainingSubtitle: 'Taktik-Drills · Puzzles',
            tableAndClock: 'Tisch & Uhr',
            configure: '▾ Konfigurieren',
            collapse: '▴ Einklappen',
            ivory: 'Elfenbein',
            ebony: 'Ebenholz',
            moneyGame: 'Money',
            playNow: 'Jetzt spielen',
            dailyPuzzlesTitle: '🧩 Tägliche Puzzles',
            dailyPuzzlesDesc: 'Monte-Carlo 3-Ply zertifizierte Stellungen',
            blunderDrillsTitle: '🎯 Blunder-Drills',
            blunderDrillsDesc: 'Wiederholen und korrigieren Sie kritische Fehler',
            openBtn: 'Öffnen →',
            academyBannerBadge: 'Großmeister-Enzyklopädie · Strategie',
            academyBannerTitle: 'Backgammon Tour — Die 15 Eröffnungen, Dopplungswürfel & 3-Ply-Strategie',
            academyBannerDesc: 'Meistern Sie Monte-Carlo Equity-Tabellen, den 21,5 % Take Point, die Crawford-Regel und den Pip-Count.',
            academyBannerCta: 'Akademie entdecken →',
            formatMoneyHint: 'Geldspiel',
            formatShortHint: 'Kurzes Match',
            formatFastHint: 'Schnelles Match',
            formatStandardHint: 'Turnier-Match',
            formatLongHint: 'Meisterschafts-Match',
            opponentNovice: 'Anfänger',
            opponentIntermediate: 'Fortgeschritten',
            opponentMaster: 'Meister',
            opponentGrandmaster: 'Großmeister',
        },
        subpages: {
            backToLobby: 'Zurück zum Salon',
            puzzlesLink: 'Tägliche Puzzles',
            drillsLink: 'Blunder-Drills',
            progressionLink: 'Fortschritt & PR',
            academyLink: 'Gammon Academy',
        },
        pwa: {
            installApp: 'App installieren',
            installAppAria: 'Backgammon Tour App auf Ihrem Gerät installieren',
            iosModalTitle: 'Backgammon Tour installieren',
            iosModalSubtitle: 'Erleben Sie die App im Vollbildmodus ohne Adressleiste oder Störungen.',
            iosStep1Title: '1. Teilen-Button tippen',
            iosStep1Desc: 'In der Safari-Menüleiste (unten beim iPhone, oben beim iPad).',
            iosStep2Title: '2. Zum Home-Bildschirm',
            iosStep2Desc: "Nach unten scrollen und 'Zum Home-Bildschirm' auswählen.",
            iosModalClose: 'Verstanden',
        },
    },
    ar: {
        navbar: {
            brandSubtitle: 'Tour · الأكاديمية',
            play: 'صالون اللعب',
            tournaments: 'البطولات والأجندة',
            puzzles: 'الألغاز',
            drills: 'التدريبات',
            openings: 'الافتتاحيات',
            progression: 'التقدم',
            academy: 'الأكاديمية',
            mobileMenuAria: 'قائمة التنقل للهاتف',
            languageSelectorAria: 'اختيار اللغة',
        },
        lobby: {
            activeMemberPrefix: 'عضو نشط',
            privateSalonSession: 'الصالون الخاص · جلسة نشطة',
            subtitle: 'Backgammon Tour',
            cardAiBadge: 'Monte-Carlo 3-Ply',
            cardAiTitle: 'اللعب ضد الذكاء الاصطناعي',
            cardAiSubtitle: 'طاولة خاصة · مدرب فوري',
            cardMultiBadge: 'رمز دعوة',
            cardMultiTitle: 'صالون خاص',
            cardMultiSubtitle: 'تحدَّ صديقاً أو زميلاً في النادي',
            cardTrainingBadge: 'الأكاديمية',
            cardTrainingTitle: 'التدريب التكتيكي',
            cardTrainingSubtitle: 'تدريبات الأخطاء · ألغاز يومية',
            tableAndClock: 'الطاولة والساعة',
            configure: '▾ إعدادات الطاولة',
            collapse: '▴ طي الإعدادات',
            ivory: 'عاجي',
            ebony: 'أبنوس',
            moneyGame: 'مباراة حرة',
            playNow: 'العب الآن',
            dailyPuzzlesTitle: '🧩 الألغاز اليومية',
            dailyPuzzlesDesc: 'وضعيات معتمدة من محرك Monte-Carlo 3-Ply',
            blunderDrillsTitle: '🎯 تدريبات تصحيح الأخطاء',
            blunderDrillsDesc: 'أعد لعب أخطائك الفادحة وصححها',
            openBtn: 'فتح ←',
            academyBannerBadge: 'موسوعة الأستاذ الكبير · استراتيجية شاملة',
            academyBannerTitle: 'Backgammon Tour — دليل الافتتاحيات الـ 15، مكعب المضاعفة واستراتيجية 3-Ply',
            academyBannerDesc: 'أتقن جداول القيمة المتوقعة (Equity)، ونقطة القبول عند 21.5%، وقاعدة كروفورد، وحساب النقاط (Pip Count).',
            academyBannerCta: 'استكشف الأكاديمية ←',
            formatMoneyHint: 'لعب حر',
            formatShortHint: 'مباراة قصيرة',
            formatFastHint: 'مباراة سريعة',
            formatStandardHint: 'مباراة بطولة قياسية',
            formatLongHint: 'مباراة طويلة',
            opponentNovice: 'مبتدئ',
            opponentIntermediate: 'متوسط',
            opponentMaster: 'أستاذ',
            opponentGrandmaster: 'أستاذ كبير (GM)',
        },
        subpages: {
            backToLobby: 'العودة إلى الصالون',
            puzzlesLink: 'الألغاز اليومية',
            drillsLink: 'تدريبات الأخطاء',
            progressionLink: 'التقدم ومعدل PR',
            academyLink: 'أكاديمية الغامون',
        },
        pwa: {
            installApp: 'تثبيت التطبيق',
            installAppAria: 'تثبيت تطبيق جولة الطاولة على جهازك',
            iosModalTitle: 'تثبيت Backgammon Tour',
            iosModalSubtitle: 'استمتع بتجربة ملء الشاشة دون شريط العناوين أو أي تشتيت.',
            iosStep1Title: '1. اضغط على زر المشاركة',
            iosStep1Desc: 'في شريط أدوات سفاري (بالأسفل في آيفون، بالأعلى في آيباد).',
            iosStep2Title: '2. إضافة إلى الشاشة الرئيسية',
            iosStep2Desc: 'مرر للأسفل واختر «إضافة إلى الشاشة الرئيسية».',
            iosModalClose: 'فهمت ذلك',
        },
    },
};

export function getUiStrings(locale: Locale): UiLocaleStrings {
    if (locale in UI_TRANSLATIONS) {
        return UI_TRANSLATIONS[locale as PrimaryLocale];
    }
    return UI_TRANSLATIONS.en;
}
