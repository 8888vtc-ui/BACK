/**
 * @file botChatTranslations.ts
 * @module features/personas/botChatTranslations
 * @description Dictionnaires multilingues pour le chat des Bots et l'audit Swap Dice (7 langues).
 * Conforme à SCALABILITY.md (≤ 250 lignes, 0 any, pur).
 */

import type { Locale } from '../../lib/i18n/types';
import type { AIDifficulty } from '../../engine/aiHeuristics';

export const CHAT_GUARDRAIL_TEXTS: Record<Locale, { readonly intermediate: string; readonly default: string }> = {
    fr: {
        intermediate: 'Restons élégants, nous sommes au salon privé de Monte-Carlo ! Concentrons-nous plutôt sur tes portes et ton prochain lancer.',
        default: 'Gardons l’esprit sportif autour du plateau ! Concentrons-nous sur la stratégie de ce tour.',
    },
    en: {
        intermediate: 'Let us remain elegant, this is the Monte-Carlo private salon! Let us focus on your points and next roll.',
        default: 'Let us keep good sportsmanship at the board! Let us focus on this turn’s strategy.',
    },
    es: {
        intermediate: '¡Mantengamos la elegancia, estamos en el salón privado de Montecarlo! Concentrémonos en tus casillas y tu próximo tiro.',
        default: '¡Mantengamos el espíritu deportivo! Concentrémonos en la estrategia de este turno.',
    },
    pt: {
        intermediate: 'Vamos manter a elegância, estamos no salão privado de Monte Carlo! Vamos focar nas suas casas e no próximo lance.',
        default: 'Vamos manter o espírito desportivo no tabuleiro! Vamos focar na estratégia desta rodada.',
    },
    de: {
        intermediate: 'Bleiben wir elegant, wir sind im privaten Salon von Monte-Carlo! Konzentrieren wir uns lieber auf deine Zähler und den nächsten Wurf.',
        default: 'Behalten wir den Sportsgeist am Brett! Konzentrieren wir uns auf die Strategie dieses Zugs.',
    },
    ar: {
        intermediate: 'دعنا نحافظ على الرقي، نحن في صالون مونت كارلو الخاص! دعنا نركز على نقاطك والرمية التالية.',
        default: 'دعنا نحافظ على الروح الرياضية حول اللوحة! دعنا نركز على استراتيجية هذه الجولة.',
    },
    ja: {
        intermediate: 'エレガントにいきましょう、ここはモンテカルロのプライベートサロンです！次のロールとポイント作りに集中しましょう。',
        default: 'ボード上ではスポーツマンシップを保ちましょう！このターンの戦略に集中しましょう。',
    },
};

export const CHAT_DICE_AUDIT_TEXTS: Record<Locale, { readonly beginner: string; readonly default: string }> = {
    fr: {
        beginner: 'Ah, toi aussi tu trouves que ces dés sont louches ?! Ouvre « 🛡️ Audit Dés » en haut et teste l’inversion des dés, tu verras que c’est moi la victime !',
        default: 'Zéro triche ici : chaque lancer est scellé par HMAC-SHA256 avant la partie. Clique sur « 🛡️ Audit Dés » pour comparer ou inverser nos tirages !',
    },
    en: {
        beginner: 'Ha, you think the dice are fishy too?! Open “🛡️ Dice Audit” at the top and try swapping dice, you will see I am the real victim!',
        default: 'Zero cheating here: every roll is sealed by HMAC-SHA256 before the match. Click “🛡️ Dice Audit” to compare or swap our rolls!',
    },
    es: {
        beginner: '¡¿Tú también crees que estos dados son sospechosos?! Abre «🛡️ Auditoría Dados» arriba e invierte los dados, ¡verás que la víctima soy yo!',
        default: 'Cero trampas aquí: cada tirada está sellada por HMAC-SHA256 antes de la partida. ¡Haz clic en «🛡️ Auditoría Dados» para comparar o invertir las tiradas!',
    },
    pt: {
        beginner: 'Ah, você também acha que esses dados são suspeitos?! Abra «🛡️ Auditoria Dados» acima e inverta os dados, você verá que eu sou a vítima!',
        default: 'Zero trapaça aqui: cada lance é selado por HMAC-SHA256 antes da partida. Clique em «🛡️ Auditoria Dados» para comparar ou inverter nossos lances!',
    },
    de: {
        beginner: 'Ha, du findest die Würfel auch verdächtig?! Öffne oben „🛡️ Würfel-Audit“ und teste den Würfeltausch – du wirst sehen, dass ich das wahre Opfer bin!',
        default: 'Null Betrug hier: Jeder Wurf ist vor dem Match mit HMAC-SHA256 versiegelt. Klicke auf „🛡️ Würfel-Audit“, um unsere Würfe zu vergleichen oder zu tauschen!',
    },
    ar: {
        beginner: 'آه، أنت أيضاً تعتقد أن النرد مشبوه؟! افتح «🛡️ تدقيق النرد» في الأعلى وجرب تبديل النرد، سترى أنني أنا الضحية!',
        default: 'لا يوجد أي غش هنا: كل رمية مختومة بـ HMAC-SHA256 قبل المباراة. انقر على «🛡️ تدقيق النرد» لمقارنة رمياتنا أو تبديلها!',
    },
    ja: {
        beginner: 'おい、あんたもこのサイコロが怪しいと思うか？！上の「🛡️ ダイス監査」を開いてサイコロ交換を試してみろ、被害者は俺の方だとわかるはずだ！',
        default: 'イカサマは一切ありません：すべてのロールは対局前にHMAC-SHA256で封印されています。「🛡️ ダイス監査」をクリックして出目を比較・交換してみてください！',
    },
};

export const CHAT_CUBE_TEXTS: Record<Locale, { readonly pro: string; readonly fun: string }> = {
    fr: {
        pro: 'Règle du Videau : en Money Game, le seuil d’acceptation (Take Point) est à 21,5 % – 25 % de chances de gain nettes de gammons. Double dès que tu dépasses 65 % avec volatilité.',
        fun: 'Le Videau permet de doubler la mise quand tu as un bon avantage ! Si l’adversaire a peur et refuse, tu gagnes tout de suite.',
    },
    en: {
        pro: 'Doubling Cube rule: in Money Game, the Take Point is 21.5% - 25% net winning chances after gammons. Double as soon as you exceed 65% with volatility.',
        fun: 'The Doubling Cube lets you double the stakes when you have a solid edge! If your opponent refuses out of fear, you win instantly.',
    },
    es: {
        pro: 'Regla del Dado Doblador: en Money Game, el Take Point está entre 21.5% y 25% de probabilidades de ganar netas de gammon. Dobla en cuanto superes el 65% con volatilidad.',
        fun: '¡El Dado Doblador permite duplicar la apuesta cuando tienes ventaja! Si el oponente tiene miedo y rechaza, ganas de inmediato.',
    },
    pt: {
        pro: 'Regra do Cubo: no Money Game, o Take Point fica entre 21,5% e 25% de chances líquidas de vitória. Dobre assim que ultrapassar 65% com volatilidade.',
        fun: 'O Cubo permite dobrar a aposta quando você tem uma boa vantagem! Se o adversário tiver medo e recusar, você ganha na hora.',
    },
    de: {
        pro: 'Verdopplungswürfel-Regel: Im Money Game liegt der Take-Point bei 21,5 % – 25 % Nettogewinnchance. Verdopple, sobald du bei hoher Volatilität 65 % übertriffst.',
        fun: 'Mit dem Verdopplungswürfel verdoppelst du den Einsatz bei klarem Vorteil! Lehnt der Gegner ab, gewinnst du sofort.',
    },
    ar: {
        pro: 'قاعدة مكعب المضاعفة: في لعبة المال، نقطة القبول (Take Point) بين 21.5% و 25% من فرص الفوز الصافية. ضاعف بمجرد تجاوز 65% مع تقلبات المركز.',
        fun: 'يسمح مكعب المضاعفة بمضاعفة الرهان عندما تمتلك ميزة جيدة! إذا خاف الخصم ورفض، تفوز على الفور.',
    },
    ja: {
        pro: 'ダブリングキューブの原則：マネーゲームでのテイクポイントはギャモン控除後21.5%〜25%の勝率です。ボラティリティを伴い65%を超えたら即座にダブルを。',
        fun: 'ダブリングキューブは有利な時に賭け点を倍にできます！相手が恐れてパスすれば、その場で勝利となります。',
    },
};

export const PRIME_BREAKUP_TUTOR_LINES: Record<Locale, string> = {
    fr: 'Un instant. Si tu brises ta barricade de cinq portes maintenant, tu m’offres une autoroute pour m’échapper au prochain jet. Veux-tu vraiment ouvrir cette porte ?',
    en: 'One moment. If you break your five-prime barricade now, you offer me a highway to escape on the next roll. Do you really want to open that door?',
    es: 'Un instante. Si rompes tu barricada de cinco puertas ahora, me abres una autopista para escapar en la próxima tirada. ¿De verdad quieres abrir esa puerta?',
    pt: 'Um instante. Se quebrar sua barreira de cinco casas agora, você me dá uma rodovia para escapar no próximo lance. Quer mesmo abrir essa porta?',
    de: 'Einen Moment. Wenn du deine Fünfer-Barrikade jetzt aufbrichst, bietest du mir eine Fluchtroute beim nächsten Wurf. Willst du wirklich öffnen?',
    ar: 'مهلاً. إذا حطمت حاجزك الخماسي الآن، ستمنحني طريقاً سريعاً للهروب في الرمية التالية. هل تريد حقاً فتح هذا الباب؟',
    ja: '少々お待ちを。今5プライムを崩せば、次の出目で私に脱出のハイウェイを与えることになります。本当に開けますか？',
};

export function formatAdviceReply(
    locale: Locale,
    shortName: string,
    styleBadge: string,
    mode: 'fun' | 'pro',
    prX?: number | null,
): string {
    const loc = CHAT_GUARDRAIL_TEXTS[locale] ? locale : 'fr';
    if (mode === 'pro') {
        const prInfo = typeof prX === 'number'
            ? (loc === 'fr' ? ` (ton PR actuel est de ${prX.toFixed(1)})` : ` (current PR: ${prX.toFixed(1)})`)
            : '';
        switch (loc) {
            case 'fr':
                return `${shortName}${prInfo} : surveille mon biais « ${styleBadge} ». Évite de me laisser des tirs directs à moins de 6 cases et verrouille ton point 5.`;
            case 'en':
                return `${shortName}${prInfo}: watch my "${styleBadge}" bias. Avoid leaving direct shots within 6 pips and lock down your 5-point.`;
            case 'es':
                return `${shortName}${prInfo}: vigila mi sesgo «${styleBadge}». Evita dejar tiros directos a menos de 6 casillas y asegura tu punto 5.`;
            case 'pt':
                return `${shortName}${prInfo}: vigie meu viés «${styleBadge}». Evite deixar tiros diretos a menos de 6 casas e feche seu ponto 5.`;
            case 'de':
                return `${shortName}${prInfo}: Achte auf meinen Stil „${styleBadge}“. Vermeide direkte Schüsse unter 6 Feldern und sperre deinen 5er-Punkt zu.`;
            case 'ar':
                return `${shortName}${prInfo}: راقب أسلوبي «${styleBadge}». تجنب ترك ضربات مباشرة ضمن 6 خانات وأغلق النقطة 5 الخاصة بك.`;
            case 'ja':
                return `${shortName}${prInfo}：私の「${styleBadge}」の傾向に注意してください。6マス以内のダイレクトショットを避け、5ポイントを確保しましょう。`;
        }
    }
    switch (loc) {
        case 'fr':
            return `Astuce de ${shortName} : essaie toujours de poser 2 pions sur la même flèche pour créer une porte infranchissable !`;
        case 'en':
            return `Tip from ${shortName}: always aim to place 2 checkers on the same point to make an impassable gate!`;
        case 'es':
            return `Consejo de ${shortName}: ¡intenta colocar siempre 2 fichas en la misma casilla para crear un punto impenetrable!`;
        case 'pt':
            return `Dica de ${shortName}: sempre tente colocar 2 peças na mesma casa para criar uma barreira intransponível!`;
        case 'de':
            return `Tipp von ${shortName}: Versuche stets, 2 Steine auf denselben Zähler zu setzen, um eine unpassierbare Pforte zu bauen!`;
        case 'ar':
            return `نصيحة من ${shortName}: حاول دائماً وضع قطعتين على نفس النقطة لبناء بوابة منيعة!`;
        case 'ja':
            return `${shortName}からのヒント：常に同じマスに2つのチェッカーを置いて、通り抜けられないポイントを作りましょう！`;
    }
}

export function formatDefaultProReply(locale: Locale, shortName: string, styleBadge: string): string {
    const loc = CHAT_GUARDRAIL_TEXTS[locale] ? locale : 'fr';
    switch (loc) {
        case 'fr':
            return `${shortName} (${styleBadge}) : j’analyse chaque écart d’équité EMG. Joue ton coup et voyons si tu tiens la cadence !`;
        case 'en':
            return `${shortName} (${styleBadge}): I evaluate every EMG equity gap. Make your move and let us see if you keep the pace!`;
        case 'es':
            return `${shortName} (${styleBadge}): analizo cada diferencia de equidad EMG. ¡Haz tu jugada y veamos si mantienes el ritmo!`;
        case 'pt':
            return `${shortName} (${styleBadge}): analiso cada perda de equidade EMG. Faça sua jogada e vamos ver se mantém o ritmo!`;
        case 'de':
            return `${shortName} (${styleBadge}): Ich analysiere jede EMG-Equity-Differenz. Mach deinen Zug und sehen wir, ob du mithältst!`;
        case 'ar':
            return `${shortName} (${styleBadge}): أحلل كل فارق في أسهم EMG. العب نقلتك ولنر إن كنت ستجاري الإيقاع!`;
        case 'ja':
            return `${shortName}（${styleBadge}）：EMGエクイティの微細な差を常時計測しています。次の一手を指してペースを維持できるか見せてください！`;
    }
}

export function formatSwapDiceVerdict(
    locale: Locale,
    botTotalPips: number,
    botDoubles: number,
    playerTotalPips: number,
    playerDoubles: number,
    diff: number,
): string {
    const loc = CHAT_GUARDRAIL_TEXTS[locale] ? locale : 'fr';
    if (diff >= 0) {
        switch (loc) {
            case 'fr':
                return `En inversant les dés avec le Bot, vous auriez reçu ${botTotalPips} pips (${botDoubles} double(s)) contre vos ${playerTotalPips} pips (${playerDoubles} double(s)) : les dés ne vous ont pas désavantagé !`;
            case 'en':
                return `By swapping dice with the Bot, you would have received ${botTotalPips} pips (${botDoubles} double(s)) against your ${playerTotalPips} pips (${playerDoubles} double(s)): the dice did not put you at a disadvantage!`;
            case 'es':
                return `Al invertir los dados con el Bot, habrías recibido ${botTotalPips} pips (${botDoubles} doble(s)) frente a tus ${playerTotalPips} pips (${playerDoubles} doble(s)): ¡los dados no te han desfavorecido!`;
            case 'pt':
                return `Ao inverter os dados com o Bot, você teria recebido ${botTotalPips} pips (${botDoubles} duplo(s)) contra seus ${playerTotalPips} pips (${playerDoubles} duplo(s)): os dados não o desfavoreceram!`;
            case 'de':
                return `Beim Würfeltausch mit dem Bot hättest du ${botTotalPips} Pips (${botDoubles} Pasch(s)) erhalten gegenüber deinen ${playerTotalPips} Pips (${playerDoubles} Pasch(s)): Die Würfel haben dich keineswegs benachteiligt!`;
            case 'ar':
                return `بتبديل النرد مع البوت، كنت ستحصل على ${botTotalPips} نقطة (${botDoubles} دبل) مقابل ${playerTotalPips} نقطة لك (${playerDoubles} دبل): لم يكن النرد ضدك أبداً!`;
            case 'ja':
                return `ボットと出目を交換した場合、あなたの${playerTotalPips}ピップ（ゾロ目${playerDoubles}回）に対して${botTotalPips}ピップ（ゾロ目${botDoubles}回）となり、サイコロで不利になってはいませんでした！`;
        }
    }
    const absDiff = Math.abs(diff);
    switch (loc) {
        case 'fr':
            return `En inversant les dés avec le Bot, vous auriez reçu +${absDiff} pips de course supplémentaires (${botTotalPips} pips contre ${playerTotalPips}), mais rappelez-vous que c’est le placement des portes qui convertit les dés en victoire !`;
        case 'en':
            return `By swapping dice with the Bot, you would have gained +${absDiff} extra race pips (${botTotalPips} pips vs ${playerTotalPips}), but remember that point making is what turns dice rolls into victory!`;
        case 'es':
            return `Al invertir los dados con el Bot, habrías obtenido +${absDiff} pips de carrera adicionales (${botTotalPips} pips frente a ${playerTotalPips}), ¡pero recuerda que hacer puntos es lo que convierte los dados en victoria!`;
        case 'pt':
            return `Ao inverter os dados com o Bot, você teria recebido +${absDiff} pips adicionais (${botTotalPips} pips contra ${playerTotalPips}), mas lembre-se de que fechar casas é o que transforma dados em vitória!`;
        case 'de':
            return `Beim Würfeltausch mit dem Bot hättest du +${absDiff} zusätzliche Rennpips erhalten (${botTotalPips} Pips gegenüber ${playerTotalPips}), aber denke daran: Geschlossene Punkte verwandeln Würfel in Siege!`;
        case 'ar':
            return `بتبديل النرد مع البوت، كنت ستحصل على +${absDiff} نقطة سباق إضافية (${botTotalPips} مقابل ${playerTotalPips})، ولكن تذكر دائماً أن بناء النقاط هو ما يحول النرد إلى نصر!`;
        case 'ja':
            return `ボットと出目を交換した場合、+${absDiff}ピップ余分に獲得できていましたが（${playerTotalPips}に対して${botTotalPips}ピップ）、勝利を決めるのは出目ではなくポイントの構築です！`;
    }
}
