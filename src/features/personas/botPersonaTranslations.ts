/**
 * @file botPersonaTranslations.ts
 * @module features/personas/botPersonaTranslations
 * @description Dictionnaire multilingue (FR, EN, ES, PT, DE, AR, JA) des 4 Personas de Bots :
 * Maxime / Arthur (« Le Mauvais Joueur »), Sofia / Elena (« La Riviera »),
 * Victor / Marcus (« L’Homme d’Affaires »), Viktor / Spinoza (« L’Intellectuel »).
 * Strictement 0 any, ≤ 380 lignes.
 */

import type { AIDifficulty } from '../../engine/aiHeuristics';
import type { Locale } from '../../lib/i18n/types';

export interface LocalizedPersonaTexts {
  readonly name: string;
  readonly shortName: string;
  readonly archetypeTitle: string;
  readonly lobbyHint: string;
  readonly styleBadge: string;
  readonly skillTaught: string;
  readonly dialogues: {
    readonly opening: { readonly fun: string; readonly pro: string };
    readonly playerDoubleRoll: { readonly fun: string; readonly pro: string };
    readonly playerBlunder: { readonly fun: string; readonly pro: string };
    readonly playerOptimal: { readonly fun: string; readonly pro: string };
    readonly botHitPlayer: { readonly fun: string; readonly pro: string };
  };
}

export const PERSONA_TEXTS_BY_DIFFICULTY: Record<
  AIDifficulty,
  Record<Locale, LocalizedPersonaTexts>
> = {
  beginner: {
    fr: {
      name: 'Maxime « Le Mauvais Joueur »',
      shortName: 'Le Mauvais Joueur',
      archetypeTitle: 'Colérique Théâtral & Blitz Agressif',
      lobbyHint: 'Maxime · Blitz & Mauvaise foi',
      styleBadge: 'Blitz Ultra-Agressif',
      skillTaught: 'Punir la sur-agressivité & gérer la barre',
      dialogues: {
        opening: {
          fun: "Prépare-toi ! Aujourd'hui les dés sont avec moi, je vais chasser chacun de tes pions isolés !",
          pro: 'Mode Blitz engagé. Voyons si ta défense du jan intérieur résiste à une pression maximale sur le tempo.',
        },
        playerDoubleRoll: {
          fun: 'Encore un double ?! C’est statistiquement absurde, tu as soudoyé le serveur SHA-256 ou quoi ?!',
          pro: 'Un Huge Joker pile sur ce tempo ?! Même le générateur Provably Fair complote contre mon Blitz !',
        },
        playerBlunder: {
          fun: 'Oh oui, laisse ce pion exposé devant mes portes, je me frotte déjà les mains ! (Clique sur Reprendre si tu veux te protéger !)',
          pro: 'Attention, cette ligne lâche de l’équité EMG en m’offrant des tirs directs gratuits au prochain jet.',
        },
        playerOptimal: {
          fun: 'Pfff, tu fermes pile la porte que je visais... Tu as de la chance que mes dés dorment !',
          pro: 'Coup optimal (0 perte EMG). Tu verrouilles mes tirs directs et conserves l’initiative.',
        },
        botHitPlayer: {
          fun: 'BAM ! Direction la barre ! Tu croyais vraiment que j’allais laisser ce pion tout seul tranquille ?',
          pro: 'Frappe directe sur le tempo : tu perds 22 pips à la course et l’initiative sur le jan.',
        },
      },
    },
    en: {
      name: 'Arthur "The Sore Loser"',
      shortName: 'The Sore Loser',
      archetypeTitle: 'Hot-Headed Blitz Hustler',
      lobbyHint: 'Arthur · Blitz & Dice Complaints',
      styleBadge: 'Ultra-Aggressive Blitz',
      skillTaught: 'Punish over-aggression & manage the bar',
      dialogues: {
        opening: {
          fun: 'Get ready! Today the dice are mine, I am hunting down every single one of your blots!',
          pro: 'Blitz mode engaged. Let us see if your home board withstands relentless tempo pressure.',
        },
        playerDoubleRoll: {
          fun: 'Another double?! That is statistically absurd, did you bribe the SHA-256 server or what?!',
          pro: 'A huge joker right on this tempo?! Even Provably Fair RNG is conspiring against my blitz!',
        },
        playerBlunder: {
          fun: 'Oh yes, leave that blot right in front of my points, I am rubbing my hands! (Click Undo if you want to protect it!)',
          pro: 'Careful, this line leaks EMG equity by granting me direct hitting rolls on the next turn.',
        },
        playerOptimal: {
          fun: 'Argh, you closed the exact point I needed... Lucky for you my dice are sleeping!',
          pro: 'Optimal move (0 EMG loss). You lock down direct shots and preserve initiative.',
        },
        botHitPlayer: {
          fun: 'BAM! Off to the bar! Did you really think I would leave that lone blot alone?',
          pro: 'Direct tempo hit: you lose 22 pips in the race and forfeit board initiative.',
        },
      },
    },
    es: {
      name: 'Arturo «El Mal Perdedor»',
      shortName: 'El Mal Perdedor',
      archetypeTitle: 'Temperamental y Blitz Agresivo',
      lobbyHint: 'Arturo · Blitz y quejas del dado',
      styleBadge: 'Blitz Ultra-Agresivo',
      skillTaught: 'Castigar la agresividad y controlar la barra',
      dialogues: {
        opening: {
          fun: '¡Prepárate! Hoy los dados son míos, ¡cazaré cada una de tus fichas sueltas!',
          pro: 'Modo Blitz activado. Veremos si tu defensa aguanta la presión de tempo.',
        },
        playerDoubleRoll: {
          fun: '¡¿Otro doble?! ¡Es absurdo, seguro compraste al servidor SHA-256!',
          pro: '¡¿Un gran joker en este momento?! ¡Hasta el RNG conspira contra mi ataque!',
        },
        playerBlunder: {
          fun: '¡Eso es, déjame esa ficha ahí! (¡Haz clic en Deshacer si quieres salvarte!)',
          pro: 'Cuidado, esta jugada pierde equidad EMG ofreciendo tiros directos.',
        },
        playerOptimal: {
          fun: 'Uff, cerraste justo la puerta que quería... ¡Qué suerte tienes!',
          pro: 'Jugada óptima (0 pérdida EMG). Neutralizas mis tiros directos.',
        },
        botHitPlayer: {
          fun: '¡PUM! ¡A la barra! ¿Creías que iba a dejar pasar esa ficha?',
          pro: 'Golpe directo al tempo: pierdes 22 pips y la iniciativa.',
        },
      },
    },
    pt: {
      name: 'Artur «O Mau Perdedor»',
      shortName: 'O Mau Perdedor',
      archetypeTitle: 'Temperamental e Blitz Agressivo',
      lobbyHint: 'Artur · Blitz e reclamações dos dados',
      styleBadge: 'Blitz Ultra-Agressivo',
      skillTaught: 'Punir o excesso de agressividade e a barra',
      dialogues: {
        opening: {
          fun: 'Prepare-se! Hoje os dados são meus, vou caçar cada uma das suas peças soltas!',
          pro: 'Modo Blitz ativado. Vamos ver se sua defesa suporta a pressão do tempo.',
        },
        playerDoubleRoll: {
          fun: 'Outro duplo?! Isso é um absurdo, você comprou o servidor SHA-256?!',
          pro: 'Um super curinga neste momento?! Até o RNG conspira contra meu ataque!',
        },
        playerBlunder: {
          fun: 'Ah sim, deixe essa peça desprotegida! (Clique em Desfazer para se proteger!)',
          pro: 'Cuidado, essa linha perde equidade EMG oferecendo tiros diretos.',
        },
        playerOptimal: {
          fun: 'Droga, fechou exatamente a casa que eu queria... Muita sorte sua!',
          pro: 'Jogada ideal (0 perda EMG). Você trava meus tiros diretos.',
        },
        botHitPlayer: {
          fun: 'BUM! Direto para a barra! Achou que eu deixaria essa peça passar?',
          pro: 'Golpe direto no tempo: você perde 22 pips e a iniciativa.',
        },
      },
    },
    de: {
      name: 'Arthur „Der schlechte Verlierer“',
      shortName: 'Der schlechte Verlierer',
      archetypeTitle: 'Hitzköpfiger Blitz-Stürmer',
      lobbyHint: 'Arthur · Blitz & Würfelklagen',
      styleBadge: 'Ultra-aggressiver Blitz',
      skillTaught: 'Überaggression bestrafen & Bar-Management',
      dialogues: {
        opening: {
          fun: 'Mach dich bereit! Heute gehören die Würfel mir, ich jage jeden deiner Blots!',
          pro: 'Blitz-Modus aktiv. Mal sehen, ob dein Heimfeld dem Tempo-Druck standhält.',
        },
        playerDoubleRoll: {
          fun: 'Schon wieder ein Pasch?! Das ist statistisch lächerlich, hast du den Zufallsgenerator bestochen?!',
          pro: 'Ein Mega-Joker genau jetzt?! Sogar das provably fair RNG arbeitet gegen mich!',
        },
        playerBlunder: {
          fun: 'Oh ja, lass den Stein da ruhig ungeschützt liegen! (Klicke auf Rückgängig zum Retten!)',
          pro: 'Achtung, dieser Zug verliert EMG-Equity und gibt mir direkte Schüsse.',
        },
        playerOptimal: {
          fun: 'Mist, genau den Punkt zugemacht, den ich brauchte... Reines Glück!',
          pro: 'Optimaler Zug (0 EMG-Verlust). Du nimmst mir das Tempo und die Schüsse.',
        },
        botHitPlayer: {
          fun: 'BÄMM! Ab auf die Bar! Dachtest du echt, ich lasse dich ungeschoren davonkommen?',
          pro: 'Direkter Tempotreffer: Du verlierst 22 Pips und die Initiative.',
        },
      },
    },
    ar: {
      name: 'آرثر "الخاسر المتذمر"',
      shortName: 'الخاسر المتذمر',
      archetypeTitle: 'هجوم خاطف ومتقلب المزاج',
      lobbyHint: 'آرثر · هجوم خاطف ولوم النرد',
      styleBadge: 'هجوم خاطف فائق الشراسة',
      skillTaught: 'معاقبة الشراسة الزائدة وإدارة الحاجز',
      dialogues: {
        opening: {
          fun: 'استعد! النرد في صفي اليوم، سأصطاد كل قرص معزول لك!',
          pro: 'بدأ الهجوم الخاطف. سنرى إن كان دفاعك يصمد أمام هذا الضغط.',
        },
        playerDoubleRoll: {
          fun: 'دبل مجدداً؟! هذا مستحيل إحصائياً، هل رشوت الخادم؟!؟!',
          pro: 'ضربة حظ خارقة في هذا التوقيت؟! حتى مصفوفة العشوائية تتآمر ضدي!',
        },
        playerBlunder: {
          fun: 'أجل، اترك هذا القرص مكشوفاً أمامي! (اضغط تراجع إذا أردت حمايته!)',
          pro: 'انتبه، هذه النقلة تهدر الإنصاف بمنحي ضربات مباشرة مؤكدة.',
        },
        playerOptimal: {
          fun: 'أغلقت النقطة التي كنت أريدها بالضبط... حظك كبير!',
          pro: 'نقلة مثالية (0 خسارة). أغلقت مسارات الهجوم وحافظت على المبادرة.',
        },
        botHitPlayer: {
          fun: 'بام! إلى الحاجز مباشرة! هل ظننت أنني سأتساهل معك؟',
          pro: 'ضربة تكتيكية سريعة: خسرت 22 نقطة في السباق وفقدت المبادرة.',
        },
      },
    },
    ja: {
      name: 'アーサー「負けず嫌い」',
      shortName: '負けず嫌い',
      archetypeTitle: '直情型ブリッツ・ハスラー',
      lobbyHint: 'アーサー・超攻撃ブリッツ',
      styleBadge: '超攻撃型ブリッツ',
      skillTaught: '過度な攻撃性の迎撃とバー管理',
      dialogues: {
        opening: {
          fun: '覚悟しな！今日のダイスは俺の味方だ、孤立した駒を片っ端から仕留めてやる！',
          pro: 'ブリッツ開始。君のインナーがこの猛攻のテンポに耐えられるか試させてもらおう。',
        },
        playerDoubleRoll: {
          fun: 'またゾロ目かよ？！確率的におかしいだろ、乱数サーバーを買収したのか？！',
          pro: 'このテンポでジョーカーだと？！暗号ハッシュ生成器まで俺に逆らっているのか！',
        },
        playerBlunder: {
          fun: 'いいねぇ、そこに駒を晒したままにするのか！(守りたいならやり直すんだな！)',
          pro: '注意：この手は次のターンで直接ヒットを与え、EMGエクイティを失っています。',
        },
        playerOptimal: {
          fun: 'チッ、狙っていたポイントをきっちり塞がれたか…運のいいやつだ！',
          pro: '最善手（EMG損失0）。こちらのダイレクトショットを封じイニシアチブを維持。',
        },
        botHitPlayer: {
          fun: 'バチコーン！バー行きだ！見逃すわけがないだろ！',
          pro: 'テンポヒット成功：レースで22ピップの後退とボードの主導権を奪取。',
        },
      },
    },
  },
  intermediate: {
    fr: {
      name: 'Sofia « La Joueuse Riviera »',
      shortName: 'Sofia « La Riviera »',
      archetypeTitle: 'Charme Monte-Carlo & Jeu de Pièges',
      lobbyHint: 'Sofia · Pièges & Holding Monte-Carlo',
      styleBadge: 'Holding Game & Appâts',
      skillTaught: 'Déjouer les pions appâts & gérer une ancre',
      dialogues: {
        opening: {
          fun: 'Bonsoir ! Une partie sous les lustres de Monte-Carlo ? Promis, mes pions isolés sont... presque tous innocents.',
          pro: 'Voyons comment tu gères ton timing face à une ancre haute et des pions appâts calculés.',
        },
        playerDoubleRoll: {
          fun: 'Oh, quel lancer audacieux ! Les dés ont visiblement un faible pour toi ce soir.',
          pro: 'Un double à haute équité qui résout élégamment ta sortie d’arrière-garde.',
        },
        playerBlunder: {
          fun: 'Un conseil d’amie : ce coup découvre ta maison alors que mon ancre attend dans l’ombre. Tu veux le rejouer ?',
          pro: 'Piège tactique : ce coup dégrade ton équité EMG en exposant ta structure à une contre-attaque.',
        },
        playerOptimal: {
          fun: 'Élégant et prudent ! Tu n’es pas tombé dans mon petit piège sur ce tour.',
          pro: 'Lecture chirurgicale : tu refuses l’appât et préserves la pureté de ta structure.',
        },
        botHitPlayer: {
          fun: 'Tu as mordu à l’appât ! Ce pion semblait vulnérable, mais mon ancre attendait ton ouverture.',
          pro: 'Contre-attaque depuis l’ancre : ton timing recule pendant que ma structure tient.',
        },
      },
    },
    en: {
      name: 'Elena "The Riviera Shark"',
      shortName: 'Elena "The Riviera"',
      archetypeTitle: 'Monte-Carlo Charm & Trap Play',
      lobbyHint: 'Elena · Traps & Monte-Carlo Holding',
      styleBadge: 'Holding Game & Baits',
      skillTaught: 'Outsmart bait checkers & anchor play',
      dialogues: {
        opening: {
          fun: 'Good evening! A match under Monte-Carlo chandeliers? I promise my lone blots are... mostly innocent.',
          pro: 'Let us see how you handle timing against a high anchor and calculated bait checkers.',
        },
        playerDoubleRoll: {
          fun: 'Oh, what a daring roll! The dice clearly have a soft spot for you tonight.',
          pro: 'A high-equity double that smoothly resolves your back-checker escape.',
        },
        playerBlunder: {
          fun: 'Friendly advice: that move exposes your home while my anchor lurks in the shadows. Want to retry?',
          pro: 'Tactical trap: this move degrades your EMG equity by exposing structure to counter-attack.',
        },
        playerOptimal: {
          fun: 'Elegant and poised! You did not step into my little trap on this turn.',
          pro: 'Surgical read: you decline the bait and preserve your positional purity.',
        },
        botHitPlayer: {
          fun: 'You took the bait! That checker looked helpless, but my anchor was waiting.',
          pro: 'Anchor counter-strike: your timing falls behind while my structure remains solid.',
        },
      },
    },
    es: {
      name: 'Elena «La Jugadora Riviera»',
      shortName: 'Elena «La Riviera»',
      archetypeTitle: 'Encanto de Montecarlo y Trampas',
      lobbyHint: 'Elena · Trampas y Holding Montecarlo',
      styleBadge: 'Holding Game y Cebos',
      skillTaught: 'Desactivar fichas cebo y juego de ancla',
      dialogues: {
        opening: {
          fun: '¡Buenas noches! ¿Una partida bajo las luces de Montecarlo? Mis fichas sueltas son casi todas inocentes...',
          pro: 'Veamos cómo gestionas tu timing contra un ancla alta y fichas cebo.',
        },
        playerDoubleRoll: {
          fun: '¡Qué tiro tan afortunado! Parece que los dados te prefieren esta noche.',
          pro: 'Un doble de alta equidad que resuelve la salida de tu retaguardia.',
        },
        playerBlunder: {
          fun: 'Un consejo de amiga: ese movimiento expone tu casa mientras mi ancla vigila. ¿Quieres reintentar?',
          pro: 'Trampa táctica: expones tu estructura a un contraataque directo.',
        },
        playerOptimal: {
          fun: '¡Elegante y certero! No caíste en mi pequeña trampa.',
          pro: 'Lectura impecable: rechazas el cebo y mantienes tu ventaja posicional.',
        },
        botHitPlayer: {
          fun: '¡Mordiste el anzuelo! Esa ficha parecía indefensa, pero mi ancla esperaba su momento.',
          pro: 'Contraataque desde el ancla: tu timing retrocede mientras mi estructura aguanta.',
        },
      },
    },
    pt: {
      name: 'Sofia «A Jogadora Riviera»',
      shortName: 'Sofia «A Riviera»',
      archetypeTitle: 'Charme de Monte Carlo e Armadilhas',
      lobbyHint: 'Sofia · Armadilhas e Holding Monte Carlo',
      styleBadge: 'Holding Game e Iscas',
      skillTaught: 'Neutralizar iscas e gerenciar âncoras',
      dialogues: {
        opening: {
          fun: 'Boa noite! Sob os lustres de Monte Carlo? Prometo que minhas peças isoladas são quase inocentes...',
          pro: 'Vamos ver como você gerencia seu tempo contra uma âncora alta e peças-isca.',
        },
        playerDoubleRoll: {
          fun: 'Que lançamento ousado! Os dados têm uma queda por você esta noite.',
          pro: 'Um duplo de alta equidade que resolve com elegância a saída da retaguarda.',
        },
        playerBlunder: {
          fun: 'Conselho de amiga: esse lance abre sua casa enquanto minha âncora vigia. Quer tentar de novo?',
          pro: 'Armadilha tática: esse lance expõe sua estrutura a um contra-ataque da minha âncora.',
        },
        playerOptimal: {
          fun: 'Elegante e prudente! Não caiu na minha armadilha desta vez.',
          pro: 'Leitura cirúrgica: você recusa a isca e mantém a pureza estrutural.',
        },
        botHitPlayer: {
          fun: 'Mordeu a isca! Essa peça parecia indefesa, mas minha âncora estava esperando.',
          pro: 'Contra-ataque da âncora: seu tempo atrasa enquanto minha estrutura segue firme.',
        },
      },
    },
    de: {
      name: 'Elena „Der Riviera-Hai“',
      shortName: 'Elena „Riviera“',
      archetypeTitle: 'Monte-Carlo-Charme & Fallenstellerin',
      lobbyHint: 'Elena · Fallen & Monte-Carlo-Holding',
      styleBadge: 'Holding Game & Köder',
      skillTaught: 'Ködersteine enttarnen & Ankerspiel',
      dialogues: {
        opening: {
          fun: 'Guten Abend! Eine Partie unter den Kronleuchtern von Monte-Carlo? Meine Blots sind... fast harmlos.',
          pro: 'Mal sehen, wie du dein Timing gegen einen hohen Anker und kalkulierte Köder managst.',
        },
        playerDoubleRoll: {
          fun: 'Oh, welch kühner Wurf! Die Würfel sind dir heute Abend sichtlich wohlgesinnt.',
          pro: 'Ein Pasch mit hoher Equity, der deine hinteren Steine elegant befreit.',
        },
        playerBlunder: {
          fun: 'Ein freundlicher Rat: Dieser Zug schwächt dein Feld, während mein Anker lauert. Nochmal probieren?',
          pro: 'Taktische Falle: Dieser Zug mindert deine EMG-Equity und lädt zum Konter ein.',
        },
        playerOptimal: {
          fun: 'Elegant und wachsam! Du bist nicht auf meine kleine Finte hereingefallen.',
          pro: 'Chirurgischer Blick: Du lehnst den Köder ab und bewahrst deine Struktur.',
        },
        botHitPlayer: {
          fun: 'Angebissen! Dieser Stein schien wehrlos, aber mein Anker hat nur gewartet.',
          pro: 'Konter aus dem Anker: Dein Timing bricht ein, während mein Board stabil bleibt.',
        },
      },
    },
    ar: {
      name: 'إيلينا "قرش ريفييرا"',
      shortName: 'إيلينا "ريفييرا"',
      archetypeTitle: 'سحر مونتي كارلو والمصائد',
      lobbyHint: 'إيلينا · مصائد وتمركز دفاعي',
      styleBadge: 'لعب تمركز دفاعي وطُعم',
      skillTaught: 'تفادي أقراص الطعم وإدارة المرساة',
      dialogues: {
        opening: {
          fun: 'مساء الخير! جولة تحت أضواء مونتي كارلو؟ أعدك أن أقراصي المكشوفة بريئة... تقريباً.',
          pro: 'لنرى كيف تدير توقيتك في مواجهة مرساة متقدمة وأقراص طُعم مدروسة.',
        },
        playerDoubleRoll: {
          fun: 'رمية جريئة ورائعة! يبدو أن النرد معجب بك الليلة.',
          pro: 'رمية دبل عالية الإنصاف تحل مشكلة خروج أقراصك الخلفية بأناقة.',
        },
        playerBlunder: {
          fun: 'نصيحة ودية: هذه النقلة تكشف منطقتك بينما مرساتي تتربص. هل تود المحاولة مجدداً؟',
          pro: 'فخ تكتيكي: هذه النقلة تضعف إنصافك وتعرض هيكلك لهجوم مضاد.',
        },
        playerOptimal: {
          fun: 'حذر وأنيق! لم تقع في فخي الصغير هذه المرة.',
          pro: 'قراءة دقيقة: رفضت الطعم وحافظت على صلابة موقعك.',
        },
        botHitPlayer: {
          fun: 'ابتلعت الطعم! بدا القرص سهلاً لكن مرساتي كانت بالمرصاد.',
          pro: 'هجوم مضاد من المرساة: تراجع توقيتك بينما هيكلي متماسك.',
        },
      },
    },
    ja: {
      name: 'エレナ「リヴィエラの女王」',
      shortName: 'エレナ「リヴィエラ」',
      archetypeTitle: 'モンテカルロの誘惑と罠',
      lobbyHint: 'エレナ・ホールディング戦術',
      styleBadge: 'ホールディング＆ベイト',
      skillTaught: '誘い駒の回避とアンカー戦術',
      dialogues: {
        opening: {
          fun: 'こんばんは。モンテカルロのシャンデリアの下で一局いかが？私の孤立駒は…ほぼ無害よ。',
          pro: 'ハイアンカーと計算された餌駒に対して、あなたがどうタイミングを測るか見せてもらおうかしら。',
        },
        playerDoubleRoll: {
          fun: 'あら、見事なロールね！今夜はダイスに好かれているようね。',
          pro: 'バックチェッカーの脱出を一挙に解決する高エクイティなダブルです。',
        },
        playerBlunder: {
          fun: '友達としてのアドバイス：アンカーが見張っているのに陣地を空けるなんて。やり直す？',
          pro: '戦術的な罠：この手はバックアンカーからの反撃を許し、EMGエクイティを損ないます。',
        },
        playerOptimal: {
          fun: 'エレガントで冷静ね。私の仕掛けた小粋な罠に引っかからないなんて。',
          pro: '正確無比な判断：甘い誘いを退け、陣形の美しさを保ちました。',
        },
        botHitPlayer: {
          fun: '罠にかかったわね！隙だらけに見えたでしょうけど、アンカーが待っていたのよ。',
          pro: 'アンカーからの反撃：こちらの陣形を維持したまま相手のタイミングを破壊。',
        },
      },
    },
  },
  expert: {
    fr: {
      name: 'Victor « L’Homme d’Affaires »',
      shortName: 'L’Homme d’Affaires',
      archetypeTitle: 'Stratège High-Roller, Course & Videau',
      lobbyHint: 'Victor · Videau & Course High-Roller',
      styleBadge: 'Course Pure & Videau Actif',
      skillTaught: 'Maîtrise du Videau (Take/Pass 25%) & Course',
      dialogues: {
        opening: {
          fun: 'Le temps c’est de l’équité ! Surveille la course et prépare-toi à négocier le Videau comme un contrat.',
          pro: 'Marché ouvert. On joue l’espérance mathématique pure : chaque pip et chaque fenêtre de Cube comptent.',
        },
        playerDoubleRoll: {
          fun: 'Sacré dividende sur ce lancer ! Ton portefeuille de pips vient de bondir d’un coup.',
          pro: 'Volatilité maximale : ce double déplace brusquement la fenêtre de Cube en ta faveur.',
        },
        playerBlunder: {
          fun: 'Halte là, mauvais investissement ! Tu exposes ton capital sans couverture. Reprends ce coup tant qu’il est temps !',
          pro: 'Erreur d’allocation EMG : mauvaise gestion du ratio risque/rendement par rapport à la ligne optimale.',
        },
        playerOptimal: {
          fun: 'Investissement rentable ! Tu sécurises tes pions avec un retour sur investissement impeccable.',
          pro: 'Exécution optimale : tu maximises l’équité sans gammon et consolides ton différentiel de course.',
        },
        botHitPlayer: {
          fun: 'Liquidation immédiate de ton pion isolé ! Ça te coûte 20 pips de pénalité au bilan.',
          pro: 'Opération à ROI positif : gain net au différentiel de course et neutralisation de ton tempo.',
        },
      },
    },
    en: {
      name: 'Marcus "The High-Roller"',
      shortName: 'The High-Roller',
      archetypeTitle: 'High-Roller Cube & Race Strategist',
      lobbyHint: 'Marcus · Cube & High-Roller Race',
      styleBadge: 'Pure Race & Active Cube',
      skillTaught: 'Cube Mastery (Take/Pass 25%) & Pure Race',
      dialogues: {
        opening: {
          fun: 'Time is equity! Watch the pip count and prepare to trade the doubling cube like a Wall Street contract.',
          pro: 'Market open. Pure mathematical expectation: every pip and every cube window matters.',
        },
        playerDoubleRoll: {
          fun: 'Huge dividend on that roll! Your pip portfolio just surged instantly.',
          pro: 'Peak volatility: this double abruptly shifts the cube window in your favor.',
        },
        playerBlunder: {
          fun: 'Hold on, bad investment! You exposed capital with zero hedge. Undo that move while you still can!',
          pro: 'Suboptimal EMG allocation: poor risk/reward ratio compared to the benchmark line.',
        },
        playerOptimal: {
          fun: 'Solid ROI! You secured your checkers with textbook capital management.',
          pro: 'Optimal execution: maximizing no-gammon equity and consolidating your race lead.',
        },
        botHitPlayer: {
          fun: 'Immediate liquidation of that blot! That costs you a 20-pip penalty on the balance sheet.',
          pro: 'Positive-ROI trade: net gain in pip count differential and tempo disruption.',
        },
      },
    },
    es: {
      name: 'Marcos «El Inversor»',
      shortName: 'El Inversor',
      archetypeTitle: 'Estratega del Cubo y Carrera',
      lobbyHint: 'Marcos · Cubo y Carrera High-Roller',
      styleBadge: 'Carrera Pura y Cubo Activo',
      skillTaught: 'Dominio del Cubo (Take/Pass 25%) y Carrera',
      dialogues: {
        opening: {
          fun: '¡El tiempo es equidad! Vigila la carrera y prepárate para negociar el cubo como un contrato.',
          pro: 'Mercado abierto. Jugamos con pura esperanza matemática: cada pip cuenta.',
        },
        playerDoubleRoll: {
          fun: '¡Vaya dividendo en este tiro! Tu balance de pips acaba de subir de golpe.',
          pro: 'Volatilidad máxima: este doble mueve la ventana del cubo a tu favor.',
        },
        playerBlunder: {
          fun: '¡Alto ahí, mala inversión! Arriesgas capital sin cobertura. ¡Rehaz la jugada mientras puedas!',
          pro: 'Error de asignación EMG: mala relación riesgo/beneficio frente a la línea óptima.',
        },
        playerOptimal: {
          fun: '¡Retorno de inversión impecable! Aseguras tus piezas con gran visión.',
          pro: 'Ejecución óptima: maximizas la equidad y consolidas tu ventaja de carrera.',
        },
        botHitPlayer: {
          fun: '¡Liquidación inmediata de esa ficha! Te cuesta 20 pips en el balance.',
          pro: 'Operación con ROI positivo: ganancia neta en la carrera y quiebre de tempo.',
        },
      },
    },
    pt: {
      name: 'Marcos «O Homem de Negócios»',
      shortName: 'O Homem de Negócios',
      archetypeTitle: 'Estrategista de Cubo e Corrida',
      lobbyHint: 'Marcos · Cubo e Corrida High-Roller',
      styleBadge: 'Corrida Pura e Cubo Ativo',
      skillTaught: 'Domínio do Cubo (Take/Pass 25%) e Corrida',
      dialogues: {
        opening: {
          fun: 'Tempo é equidade! Monitore a corrida e prepare-se para negociar o cubo como um contrato.',
          pro: 'Mercado aberto. Pura esperança matemática: cada pip e cada janela de dobra importam.',
        },
        playerDoubleRoll: {
          fun: 'Belo dividendo! Sua carteira de pips acabou de dar um salto.',
          pro: 'Volatilidade máxima: este duplo desloca a janela do cubo a seu favor.',
        },
        playerBlunder: {
          fun: 'Espere aí, mau investimento! Você expôs capital sem proteção. Desfaça enquanto há tempo!',
          pro: 'Erro de alocação EMG: relação risco/retorno desfavorável em relação à linha ideal.',
        },
        playerOptimal: {
          fun: 'Investimento rentável! Você protegeu suas peças com retorno impecável.',
          pro: 'Execução ideal: maximizando a equidade e consolidando a vantagem de corrida.',
        },
        botHitPlayer: {
          fun: 'Liquidação imediata dessa peça! Isso custa 20 pips no seu balanço.',
          pro: 'Operação com ROI positivo: ganho líquido na contagem de pips e perda de tempo.',
        },
      },
    },
    de: {
      name: 'Marcus „Der High-Roller“',
      shortName: 'Der High-Roller',
      archetypeTitle: 'High-Roller Würfel- & Rennstratege',
      lobbyHint: 'Marcus · Doppler & schnelles Rennen',
      styleBadge: 'Reines Rennen & Aktiver Doppler',
      skillTaught: 'Dopplungsbeherrschung (25% Schwelle) & Rennen',
      dialogues: {
        opening: {
          fun: 'Zeit ist Equity! Behalte den Pip-Count im Auge und handle den Doppler wie einen Wall-Street-Vertrag.',
          pro: 'Der Markt ist offen. Reine mathematische Erwartung: Jeder Pip und jedes Würfelfenster zählen.',
        },
        playerDoubleRoll: {
          fun: 'Fette Dividende bei diesem Wurf! Dein Pip-Portfolio ist schlagartig gewachsen.',
          pro: 'Maximale Volatilität: Dieser Pasch verschiebt das Doppelfenster abrupt zu deinen Gunsten.',
        },
        playerBlunder: {
          fun: 'Halt, schlechte Investition! Du riskierst Kapital ohne Absicherung. Nimm das zurück, solange du kannst!',
          pro: 'Suboptimale EMG-Allokation: Schlechtes Risiko-Rendite-Verhältnis gegenüber der Benchmark.',
        },
        playerOptimal: {
          fun: 'Solider ROI! Du sicherst deine Steine mit lehrbuchmäßigem Risikomanagement.',
          pro: 'Optimale Ausführung: Maximierung der Equity und Festigung deines Rennvorsprungs.',
        },
        botHitPlayer: {
          fun: 'Sofortige Liquidation dieses Blots! Das kostet dich 20 Pips in der Bilanz.',
          pro: 'Trade mit positivem ROI: Netto-Gewinn im Pip-Differential und Tempo-Zerstörung.',
        },
      },
    },
    ar: {
      name: 'ماركوس "رجل الأعمال"',
      shortName: 'رجل الأعمال',
      archetypeTitle: 'خبير المضاعفة وسباق الأقراص',
      lobbyHint: 'ماركوس · مكعب المضاعفة والسباق',
      styleBadge: 'سباق نقي ومكعب نشط',
      skillTaught: 'إتقان مكعب المضاعفة (قبول/رفض 25%) والسباق',
      dialogues: {
        opening: {
          fun: 'الوقت هو الإنصاف! راقب السباق واستعد للتفاوض حول مكعب المضاعفة كصفقة تجارية.',
          pro: 'السوق مفتوح. نلعب بالاحتمالات الرياضية البحتة: كل نقطة سباق وكل نافذة مضاعفة ذات قيمة.',
        },
        playerDoubleRoll: {
          fun: 'أرباح هائلة من هذه الرمية! محفظة نقاطك قفزت فوراً.',
          pro: 'تقلبات حادة: هذه الرمية المزدوجة تنقل نافذة المضاعفة لصالحك تماماً.',
        },
        playerBlunder: {
          fun: 'تمهل، استثمار فاشل! تعرض رأس مالك دون تحوط. تراجع عن النقلة ما دام بإمكانك!',
          pro: 'سوء توزيع إنصاف: نسبة المخاطرة إلى العائد ضعيفة مقارنة بالنقلة المثالية.',
        },
        playerOptimal: {
          fun: 'عائد استثماري ممتاز! أمنت أقراصك باحترافية مالية عالية.',
          pro: 'تنفيذ مثالي: تعظيم الإنصاف وترسيخ تقدمك في السباق.',
        },
        botHitPlayer: {
          fun: 'تصفية فورية لهذا القرص! خسرت 20 نقطة في الميزانية العمومية.',
          pro: 'صفقة ذات عائد إيجابي: فارق سباق إيجابي وتعطيل للمبادرة.',
        },
      },
    },
    ja: {
      name: 'マーカス「ハイローラー」',
      shortName: 'ハイローラー',
      archetypeTitle: 'キューブ＆レースの勝負師',
      lobbyHint: 'マーカス・キューブと高速ラン',
      styleBadge: '純粋レース＆積極的キューブ',
      skillTaught: 'キューブ判断（テイク25%）とランニング',
      dialogues: {
        opening: {
          fun: '時はエクイティなり！ピップカウントを注視し、ダブリングキューブをウォール街の契約書のように扱え。',
          pro: '市場開場。純粋な期待値の勝負だ：1ピップ、キューブの1ウィンドウが勝敗を分ける。',
        },
        playerDoubleRoll: {
          fun: '莫大な配当が出たな！ピップ資産が一瞬で跳ね上がったぞ。',
          pro: '最大のボラティリティ：このダブルでキューブウィンドウが一気に君へ傾いた。',
        },
        playerBlunder: {
          fun: '待て、ひどい投資だ！ヘッジなしで資産を晒すな。取り消せるうちに戻せ！',
          pro: '最適解と比較してリスクリワード比が劣悪。EMG配分ミスです。',
        },
        playerOptimal: {
          fun: '手堅い利回りだ！教科書通りのリスク管理で駒を守り切ったな。',
          pro: '完璧な執行：ギャモンなしのエクイティを最大化し、ピップリードを確固たるものに。',
        },
        botHitPlayer: {
          fun: '孤立駒を即座に損切り執行！貸借対照表に20ピップの損失計上だな。',
          pro: 'ROIプラスの取引：ピップ差の純増とテンポの強奪に成功。',
        },
      },
    },
  },
  grandmaster: {
    fr: {
      name: 'Viktor « L’Intellectuel »',
      shortName: 'Viktor « L’Intellectuel »',
      archetypeTitle: 'Philosophe Grand-Maître & Architecte 5-Prime',
      lobbyHint: 'Viktor · Barricade 3-ply & Mentor',
      styleBadge: 'Jeu Positionnel & Barricade (Prime)',
      skillTaught: 'Probabilités sur 36, constructeurs & 5-Prime',
      dialogues: {
        opening: {
          fun: 'Comme l’écrivait Sun Tzu, la victoire se construit avant la bataille. Construisons nos portes avec harmonie.',
          pro: 'Concentrons-nous sur la pureté structurelle : duplication des dés, constructeurs et contrôle du point 5.',
        },
        playerDoubleRoll: {
          fun: 'Le hasard sourit aux esprits préparés ! Ce double ne représentait que 1 chance sur 36, savoure-le.',
          pro: 'Événement à haute équité qui résout ta duplication. La variance fait toute la poésie du Backgammon.',
        },
        playerBlunder: {
          fun: 'Un instant ! Si tu joues ainsi, tu affaiblis ta barricade et m’offres une route d’évasion. Veux-tu reconsidérer ?',
          pro: 'Perte d’équité significative : la ligne optimale préservait tes constructeurs et maximisait la couverture sur 36.',
        },
        playerOptimal: {
          fun: 'Belle harmonie géométrique ! Tes pions se protègent mutuellement comme une vraie phalange.',
          pro: 'Précision Grand-Maître : couverture optimale des constructeurs et duplication parfaite des tirs adverses.',
        },
        botHitPlayer: {
          fun: 'En laissant ce pion à portée directe, tu m’offrais plus de 11 combinaisons sur 36 de te frapper.',
          pro: 'Frappe positionnelle permettant de verrouiller le tempo tout en préparant la fermeture du Prime.',
        },
      },
    },
    en: {
      name: 'Spinoza "The Grandmaster"',
      shortName: 'Spinoza "The Master"',
      archetypeTitle: 'Grandmaster Philosopher & 5-Prime Architect',
      lobbyHint: 'Spinoza · 3-ply Prime & Mentor',
      styleBadge: 'Positional Play & Prime Building',
      skillTaught: '36-Roll Probabilities, Builders & 5-Prime',
      dialogues: {
        opening: {
          fun: 'As Sun Tzu wrote, victory is forged before the battle. Let us construct our points with mathematical harmony.',
          pro: 'Let us focus on structural purity: dice duplication, spare builders, and commanding the 5-point.',
        },
        playerDoubleRoll: {
          fun: 'Chance favors the prepared mind! That double was only 1 in 36, savor it.',
          pro: 'High-equity realization that resolves your duplication. Variance is the very poetry of backgammon.',
        },
        playerBlunder: {
          fun: 'One moment! Moving there weakens your prime and gifts me an escape route. Would you like to reconsider?',
          pro: 'Significant equity loss: the benchmark line preserved builders and maximized 36-roll coverage.',
        },
        playerOptimal: {
          fun: 'Beautiful geometric harmony! Your checkers protect each other like a true Greek phalanx.',
          pro: 'Grandmaster precision: optimal builder placement and flawless duplication of opponent return shots.',
        },
        botHitPlayer: {
          fun: 'Leaving that blot in direct range granted me more than 11 combinations out of 36 to hit.',
          pro: 'Positional hit: seizing tempo while preparing the final closure of the 6-prime.',
        },
      },
    },
    es: {
      name: 'Spinoza «El Gran Maestro»',
      shortName: 'Spinoza «El Maestro»',
      archetypeTitle: 'Filósofo y Arquitecto de 5-Prime',
      lobbyHint: 'Spinoza · Barrera 3-ply y Mentor',
      styleBadge: 'Juego Posicional y Barrera',
      skillTaught: 'Probabilidades de 36, Constructores y 5-Prime',
      dialogues: {
        opening: {
          fun: 'Como escribió Sun Tzu, la victoria se forja antes de la batalla. Construyamos con armonía.',
          pro: 'Centrémonos en la pureza estructural: duplicación de dados y control del punto 5.',
        },
        playerDoubleRoll: {
          fun: '¡El azar favorece a las mentes preparadas! Ese doble era 1 entre 36, disfrútalo.',
          pro: 'Evento de alta equidad que resuelve tu duplicación.',
        },
        playerBlunder: {
          fun: '¡Un momento! Esa jugada debilita tu barrera y me abre una salida. ¿Quieres reconsiderar?',
          pro: 'Pérdida de equidad notable: la línea óptima conservaba tus constructores.',
        },
        playerOptimal: {
          fun: '¡Hermosa armonía geométrica! Tus fichas se defienden como una falange griega.',
          pro: 'Precisión de Gran Maestro: cobertura óptima y duplicación perfecta.',
        },
        botHitPlayer: {
          fun: 'Al dejar esa ficha a tiro directo, me diste más de 11 combinaciones sobre 36 para golpearte.',
          pro: 'Golpe posicional: asegura el tempo y prepara el cierre de la barrera.',
        },
      },
    },
    pt: {
      name: 'Spinoza «O Grão-Mestre»',
      shortName: 'Spinoza «O Mestre»',
      archetypeTitle: 'Filósofo e Arquiteto de 5-Prime',
      lobbyHint: 'Spinoza · Barreira 3-ply e Mentor',
      styleBadge: 'Jogo Posicional e Barreira',
      skillTaught: 'Probabilidades de 36, Construtores e 5-Prime',
      dialogues: {
        opening: {
          fun: 'Como escreveu Sun Tzu, a vitória é forjada antes da batalha. Vamos construir com harmonia.',
          pro: 'Foco na pureza estrutural: duplicação de dados e controle do ponto 5.',
        },
        playerDoubleRoll: {
          fun: 'O acaso favorece as mentes preparadas! Esse duplo era 1 em 36, aproveite.',
          pro: 'Evento de alta equidade que resolve sua duplicação estrutural.',
        },
        playerBlunder: {
          fun: 'Um instante! Esse lance enfraquece sua barreira e me dá uma rota de fuga. Quer rever?',
          pro: 'Perda significativa de equidade: a melhor linha preservava construtores.',
        },
        playerOptimal: {
          fun: 'Bela harmonia geométrica! Suas peças se protegem mutuamente.',
          pro: 'Precisão de Grão-Mestre: cobertura ideal e duplicação perfeita.',
        },
        botHitPlayer: {
          fun: 'Ao deixar essa peça ao alcance direto, você me deu mais de 11 combinações em 36 para acertar.',
          pro: 'Golpe posicional: travar o tempo enquanto preparo o fechamento do Prime.',
        },
      },
    },
    de: {
      name: 'Spinoza „Der Großmeister“',
      shortName: 'Spinoza „Der Meister“',
      archetypeTitle: 'Philosoph & 5er-Prime-Architekt',
      lobbyHint: 'Spinoza · 3-Ply-Barrikade & Mentor',
      styleBadge: 'Positionsspiel & Blockadenbau',
      skillTaught: '36-Würfel-Wahrscheinlichkeiten & 5-Prime',
      dialogues: {
        opening: {
          fun: 'Wie Sun Tzu schrieb: Der Sieg wird vor der Schlacht geschmiedet. Bauen wir unsere Punkte in Harmonie.',
          pro: 'Konzentrieren wir uns auf strukturelle Reinheit: Würfel-Duplikation und Kontrolle über Punkt 5.',
        },
        playerDoubleRoll: {
          fun: 'Der Zufall begünstigt den vorbereiteten Geist! Dieser Pasch war 1 zu 36, genieße ihn.',
          pro: 'Ein Zug von hoher Equity, der deine Duplikation auflöst. Varianz ist die Poesie des Spiels.',
        },
        playerBlunder: {
          fun: 'Einen Moment! Dieser Zug schwächt deine Barrikade und schenkt mir einen Fluchtweg. Überdenken?',
          pro: 'Signifikanter Equity-Verlust: Die optimale Linie hätte deine Builder geschützt.',
        },
        playerOptimal: {
          fun: 'Wunderschöne geometrische Harmonie! Deine Steine schützen sich gegenseitig wie eine Phalanx.',
          pro: 'Großmeisterliche Präzision: Optimale Abdeckung und perfekte Duplikation.',
        },
        botHitPlayer: {
          fun: 'Diesen Stein in direkter Schussweite zu lassen, gab mir über 11 von 36 Trefferchancen.',
          pro: 'Positioneller Treffer: Sichert das Tempo und bereitet die Schließung des Prime vor.',
        },
      },
    },
    ar: {
      name: 'سبينوزا "الأستاذ الكبير"',
      shortName: 'سبينوزا "الأستاذ"',
      archetypeTitle: 'فيلسوف ومهندس الحواجز الخماسية',
      lobbyHint: 'سبينوزا · حاجز ثلاثي الطبقات ومرشد',
      styleBadge: 'لعب موضعي وبناء الحواجز',
      skillTaught: 'احتمالات الـ 36، البناة والحواجز',
      dialogues: {
        opening: {
          fun: 'كما كتب صن تزو، النصر يُصنع قبل المعركة. لنبنِ نقاطنا بتناغم رياضي هندسي.',
          pro: 'لنركز على النقاء الهيكلي: تكرار النرد، البناة الإضافيون، والسيطرة على النقطة 5.',
        },
        playerDoubleRoll: {
          fun: 'الحظ يبتسم للعقول المستعدة! هذا الدبل احتمال 1 من 36، استمتع به.',
          pro: 'تحقق إنصاف عالٍ يحل مشكلة التكرار لديك.',
        },
        playerBlunder: {
          fun: 'لحظة واحدة! نقلتك هذه تضعف حاجزك وتمنحني مسار هروب. هل تود مراجعتها؟',
          pro: 'خسارة ملحوظة في الإنصاف: النقلة المثلى كانت تحمي البناة وتغطي النرد.',
        },
        playerOptimal: {
          fun: 'تناسق هندسي بديع! أقراصك تحمي بعضها البعض ككتيبة يونانية.',
          pro: 'دقة أستاذ كبير: توزيع مثالي للبناة وتكرار تام لضربات الخصم.',
        },
        botHitPlayer: {
          fun: 'ترك هذا القرص في مدى مباشر منحني أكثر من 11 تركيبة من أصل 36 لضربه.',
          pro: 'ضربة موضعية تكتيكية: انتزاع للمبادرة وتمهيد لإغلاق الحاجز السداسي.',
        },
      },
    },
    ja: {
      name: 'スピノザ「グランドマスター」',
      shortName: 'スピノザ「導師」',
      archetypeTitle: '哲人グランドマスター＆プライム建築家',
      lobbyHint: 'スピノザ・3プライ深層解析',
      styleBadge: 'ポジション戦＆プライム構築',
      skillTaught: '36通りの確率論・ビルダー・5プライム',
      dialogues: {
        opening: {
          fun: '孫子が述べたように、勝敗は戦う前に決するもの。幾何学的な調和をもってポイントを築こう。',
          pro: '構造の純粋性に集中しましょう：ダイスの重複利用、ビルダーの配置、そして5ポイントの支配。',
        },
        playerDoubleRoll: {
          fun: '幸運は準備された心に微笑む！36分の1の奇跡だ、味わうといい。',
          pro: '重複問題を一挙に解消する高エクイティなロール。分散こそバックギャモンの詩です。',
        },
        playerBlunder: {
          fun: '待ちなさい！その着手はプライムを弱め、私に脱出路を与えてしまう。考え直しますか？',
          pro: '重大なエクイティ損失：最善手はビルダーを温存し36通りのカバー率を最大化していました。',
        },
        playerOptimal: {
          fun: '美しい幾何学的調和だ！駒たちがまるで古代のファランクスのように互いを守り合っている。',
          pro: 'グランドマスターの精度：最適なビルダー配置と相手のリターンショットへの完全な重複。',
        },
        botHitPlayer: {
          fun: 'ダイレクトの位置に駒を晒せば、36通り中11通り以上でヒットの機会が巡ってくる。',
          pro: 'ポジショナルヒット：テンポを掌握し、フルプライムの完成へと駒を進めます。',
        },
      },
    },
  },
};
