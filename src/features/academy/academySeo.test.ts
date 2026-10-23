import { describe, it, expect } from 'vitest';
import { OPENING_ROLLS_15 } from './academyData';
import { getAcademyContent } from './academyTranslations';
import { buildGlobalStructuredData } from '../../lib/seo/structuredData';
import { PRIMARY_LOCALES } from '../../lib/i18n/types';
import { evaluateKeithRaceDecision } from '../../components/academy/MatchEquityCalculator';
import { generateStaticParams as generateOpeningStaticParams } from '../../app/academy/openings/[roll]/page';
import { generateStaticParams as generateConceptStaticParams } from '../../app/academy/concepts/[slug]/page';

describe('Gammon Academy SEO Hub, Programmatic Routes, Calculators & Structured Data Graph', () => {
    it('contient exactement les 15 rouleaux d ouverture sans doublon avec équité 3-Ply et notes en 6 langues', () => {
        expect(OPENING_ROLLS_15).toHaveLength(15);
        const rolls = OPENING_ROLLS_15.map((r) => r.roll);
        expect(new Set(rolls).size).toBe(15);
        expect(rolls).toContain('3-1');
        expect(rolls).toContain('4-2');
        expect(rolls).toContain('6-1');
        expect(rolls).toContain('6-5');

        for (const item of OPENING_ROLLS_15) {
            expect(item.optimalMove.length).toBeGreaterThan(0);
            expect(item.equity3Ply.startsWith('+') || item.equity3Ply.startsWith('-')).toBe(true);
            for (const loc of PRIMARY_LOCALES) {
                expect(item.nickname[loc].length).toBeGreaterThan(2);
                expect(item.strategicNote[loc].length).toBeGreaterThan(10);
            }
        }
    });

    it('génère statiquement les 15 routes /academy/openings/[roll] et les 21 routes /academy/concepts/[slug]', () => {
        const openingParams = generateOpeningStaticParams();
        expect(openingParams).toHaveLength(15);
        expect(openingParams.map((p) => p.roll)).toContain('3-1');
        expect(openingParams.map((p) => p.roll)).toContain('6-4');

        const conceptParams = generateConceptStaticParams();
        expect(conceptParams.length).toBeGreaterThanOrEqual(21);
        expect(conceptParams.map((p) => p.slug)).toContain('golden-point');
        expect(conceptParams.map((p) => p.slug)).toContain('crawford-rule');
        expect(conceptParams.map((p) => p.slug)).toContain('kazaross-xg-met');
    });

    it('fournit un contenu éditorial complet (Videau, Stratégie, FAQ SEO) dans les 6 langues', () => {
        for (const loc of PRIMARY_LOCALES) {
            const content = getAcademyContent(loc);
            expect(content.heroTitle.length).toBeGreaterThan(5);
            expect(content.cubePillars.length).toBeGreaterThanOrEqual(2);
            expect(content.strategyPillars.length).toBeGreaterThanOrEqual(2);
            expect(content.faqs.length).toBeGreaterThanOrEqual(4);
            for (const faq of content.faqs) {
                expect(faq.question.length).toBeGreaterThan(10);
                expect(faq.answer.length).toBeGreaterThan(20);
            }
        }
    });

    it('calcule correctement les décisions de videau en course via evaluateKeithRaceDecision', () => {
        // KeithX = 63 => TakeLimit = floor(63 * 8 / 7) - 3 = 72 - 3 = 69
        expect(evaluateKeithRaceDecision(60, 60, 3, 2).actionCode).toBe('NO_DOUBLE');
        expect(evaluateKeithRaceDecision(60, 63, 3, 2).actionCode).toBe('DOUBLE_TAKE');
        expect(evaluateKeithRaceDecision(60, 66, 3, 2).actionCode).toBe('REDOUBLE_TAKE');
        expect(evaluateKeithRaceDecision(60, 70, 3, 2).actionCode).toBe('DOUBLE_PASS');
    });

    it('génère un graphe JSON-LD Schema.org enrichi de 9 types (WebSite, VideoGame, SoftwareApplication, Course, ItemList, DefinedTermSet, HowTo, FAQPage, BreadcrumbList)', () => {
        const jsonLd = buildGlobalStructuredData();
        expect(jsonLd['@context']).toBe('https://schema.org');
        const graph = jsonLd['@graph'] as ReadonlyArray<Record<string, unknown>>;
        const types = graph.flatMap((node) =>
            Array.isArray(node['@type']) ? (node['@type'] as string[]) : [String(node['@type'])]
        );
        expect(types).toContain('WebSite');
        expect(types).toContain('VideoGame');
        expect(types).toContain('SoftwareApplication');
        expect(types).toContain('Course');
        expect(types).toContain('ItemList');
        expect(types).toContain('DefinedTermSet');
        expect(types).toContain('HowTo');
        expect(types).toContain('FAQPage');
        expect(types).toContain('BreadcrumbList');
    });
});
