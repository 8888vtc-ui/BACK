import { describe, expect, it } from 'vitest';
import {
    getGlossaryTerm,
    transduceMoveNotationToSsml,
    transduceSingleStepToSpeech,
    WBGF_MULTILINGUAL_GLOSSARY,
} from './ttsPhoneticTransducer';
import {
    computeJanowskiMatchEquity,
    computeRetrogradeLiveCubeTakePoint,
} from '../engine/janowskiCube';

describe('ttsPhoneticTransducer & Janowski 2013 MET (Rapport #13 Axes 2 & 5)', () => {
    it('expose les 18 termes officiels WBGF dans les 7 langues (EN, FR, ES, PT, DE, AR, JA)', () => {
        expect(Object.keys(WBGF_MULTILINGUAL_GLOSSARY)).toHaveLength(18);
        expect(getGlossaryTerm('GOLDEN_POINT', 'fr')).toBe("Point d'or (Point 5)");
        expect(getGlossaryTerm('GOLDEN_POINT', 'ja')).toContain('ゴールデンポイント');
        expect(getGlossaryTerm('DOUBLING_CUBE', 'ar')).toContain('مكعب المضاعفة');
        expect(getGlossaryTerm('FREE_DROP', 'de')).toContain('Kostenloses Passen');
    });

    it('transduit 24/18 13/8* et 8/5(2) en SSML fluide sans jamais prononcer "*" ou "/"', () => {
        expect(transduceSingleStepToSpeech('8/5(2)', 'fr')).toBe(
            "deux pions du huit au cinq pour fermer le point d'or",
        );

        const frSsml = transduceMoveNotationToSsml({
            moveNotation: '24/18 13/8*',
            deltaEquityNemg: -0.12,
            directShotsOutOf36: 11,
            lang: 'fr',
        });
        expect(frSsml).toContain('Jouer du vingt-quatre au dix-huit');
        expect(frSsml).toContain('puis du treize au huit en frappant');
        expect(frSsml).toContain('<emphasis level="moderate">120 millièmes</emphasis>');
        expect(frSsml).toContain('11 tirs directs sur trente-six');
        expect(frSsml).not.toContain('*');

        const enSsml = transduceMoveNotationToSsml({
            moveNotation: '24/18 13/8*',
            deltaEquityNemg: -0.12,
            lang: 'en',
        });
        expect(enSsml).toContain('Playing twenty-four to eighteen');
        expect(enSsml).toContain('thirteen to eight hitting');
        expect(enSsml).toContain('point 1 2 0');
    });

    it('calcule la MET révisée de Janowski (2013) en Pré-Crawford, Crawford et Post-Crawford (Free Drop 1.2%)', () => {
        // Score symétrique -> 50.0%
        expect(computeJanowskiMatchEquity({ playerAway: 5, opponentAway: 5 })).toBe(0.5);

        // 1-away 2-away Post-Crawford -> 51.2% (allocation Free Drop de 1.2%)
        expect(
            computeJanowskiMatchEquity({
                playerAway: 1,
                opponentAway: 2,
                crawfordState: 'POST_CRAWFORD',
            }),
        ).toBe(0.512);

        // 1-away 2-away Crawford -> 0.525 + 0.57 * (1 / 4) = 0.6675
        expect(
            computeJanowskiMatchEquity({
                playerAway: 1,
                opponentAway: 2,
                crawfordState: 'CRAWFORD',
            }),
        ).toBe(0.6675);

        // 2-away 4-away Pre-Crawford -> 0.5 + 0.87 * (2 / 10) = 0.674
        expect(
            computeJanowskiMatchEquity({
                playerAway: 2,
                opponentAway: 4,
                crawfordState: 'PRE_CRAWFORD',
            }),
        ).toBe(0.674);
    });

    it('calcule le Take Point à videau vivant par induction rétrograde (TP_1 - TP_1*TP_2 + ...)', () => {
        // Sans gammon en Money Game infini : TP_k = 0.25 -> série géométrique alternée convergeant vers 0.20
        const tpLive = computeRetrogradeLiveCubeTakePoint([0.25, 0.25, 0.25, 0.25, 0.25]);
        expect(tpLive).toBeCloseTo(0.2002, 3);
    });
});

