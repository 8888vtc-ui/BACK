import { describe, expect, it } from 'vitest';
import {
    CERTIFIED_OPENINGS_3PLY,
    buildOpeningStructuredDataJsonLd,
    buildProgrammaticSitemapEntries,
    computeEpcExact7nPlus1,
    computeFastimateEpc,
    computeJanowskiLiveTakePoint,
    computeRecursiveMatchLiveTakePoint,
    evaluateBehavioralPaywallState,
    reconcileStripeWebhookIdempotency,
} from './behavioralPaywallAndSeoEngine';

describe('behavioralPaywallAndSeoEngine — Paywall Comportemental, SEO & Fintech Stripe', () => {
    describe('1. Machine à États du Paywall Comportemental', () => {
        it('n’affiche aucun paywall si l’utilisateur est déjà abonné (ENTITLED)', () => {
            const res = evaluateBehavioralPaywallState({
                isMatchActive: false,
                isMatchComplete: true,
                isUserEntitled: true,
                sessionBlunderCount: 5,
                chouetteRosterSize: 6,
                previousEquity: 0.90,
                currentEquity: 0.10,
            });
            expect(res.shouldTrigger).toBe(false);
            expect(res.state).toBe('ENTITLED');
        });

        it('séquestre strictement le déclencheur KARMA_SWAP pendant un match actif (zéro interruption)', () => {
            const res = evaluateBehavioralPaywallState({
                isMatchActive: true,
                isMatchComplete: false,
                isUserEntitled: false,
                sessionBlunderCount: 0,
                chouetteRosterSize: 2,
                previousEquity: 0.88,
                currentEquity: 0.12,
            });
            expect(res.shouldTrigger).toBe(false);
            expect(res.bufferedTrigger).toBe('KARMA_SWAP');
            expect(res.state).toBe('BUFFERED_DURING_MATCH');
        });

        it('séquestre le déclencheur COACH_SECOND_BLUNDER pendant le match', () => {
            const res = evaluateBehavioralPaywallState({
                isMatchActive: true,
                isMatchComplete: false,
                isUserEntitled: false,
                sessionBlunderCount: 2,
                chouetteRosterSize: 2,
            });
            expect(res.shouldTrigger).toBe(false);
            expect(res.bufferedTrigger).toBe('COACH_SECOND_BLUNDER');
            expect(res.state).toBe('BUFFERED_DURING_MATCH');
        });

        it('restitue le déclencheur séquestré dès la fin de match', () => {
            const res = evaluateBehavioralPaywallState({
                isMatchActive: false,
                isMatchComplete: true,
                isUserEntitled: false,
                sessionBlunderCount: 2,
                chouetteRosterSize: 2,
                bufferedTrigger: 'KARMA_SWAP',
            });
            expect(res.shouldTrigger).toBe(true);
            expect(res.activeTrigger).toBe('KARMA_SWAP');
            expect(res.bufferedTrigger).toBeNull();
            expect(res.state).toBe('TRIGGERED');
        });

        it('déclenche POST_MATCH_PR_REPORT en fin de match si aucun trigger n’était en mémoire tampon', () => {
            const res = evaluateBehavioralPaywallState({
                isMatchActive: false,
                isMatchComplete: true,
                isUserEntitled: false,
                sessionBlunderCount: 0,
                chouetteRosterSize: 2,
            });
            expect(res.shouldTrigger).toBe(true);
            expect(res.activeTrigger).toBe('POST_MATCH_PR_REPORT');
        });

        it('déclenche CHOUETTE_SEAT_LIMIT hors match dès que l’effectif atteint 5 joueurs', () => {
            const res = evaluateBehavioralPaywallState({
                isMatchActive: false,
                isMatchComplete: false,
                isUserEntitled: false,
                sessionBlunderCount: 0,
                chouetteRosterSize: 5,
            });
            expect(res.shouldTrigger).toBe(true);
            expect(res.activeTrigger).toBe('CHOUETTE_SEAT_LIMIT');
        });
    });

    describe('2. Ouvertures Certifiées 3-Ply & Mathématiques (Janowski, EPC, Fastimate)', () => {
        it('valide l’exactitude de la table des 15 ouvertures 3-Ply', () => {
            expect(CERTIFIED_OPENINGS_3PLY).toHaveLength(15);

            const o31 = CERTIFIED_OPENINGS_3PLY.find((o) => o.roll === '3-1');
            expect(o31?.gtoMove).toBe('8/5 6/5');
            expect(o31?.inaccuracyCostEq).toBe(-0.062);

            const o65 = CERTIFIED_OPENINGS_3PLY.find((o) => o.roll === '6-5');
            expect(o65?.gtoMove).toBe('24/13');
            expect(o65?.inaccuracyCostEq).toBe(-0.125);
        });

        it('calcule exactement les Live Take Points de Janowski (Money & Match récursif)', () => {
            const tp = computeJanowskiLiveTakePoint(1, 1, 0.68);
            expect(tp.tpDead).toBe(0.25);
            expect(tp.tpLive).toBeCloseTo(0.2137, 3); // ~21.4%

            const matchLiveTp = computeRecursiveMatchLiveTakePoint(0.25, 0.20);
            expect(matchLiveTp).toBe(0.2);
        });

        it('calcule la formule fermée EPC exact 7n + 1', () => {
            const epc1 = computeEpcExact7nPlus1(1);
            expect(epc1).toBe(8.1667); // 7(1) + 1 + 1/6

            const epc2 = computeEpcExact7nPlus1(2);
            expect(epc2).toBe(14.9722); // 7(2) + 1 - 1/36
        });

        it('calcule le Fastimate EPC avec décompte structurel', () => {
            const fastimate = computeFastimateEpc(80, 1, 2, 2, 1);
            expect(fastimate).toBe(90.2); // 80 + 4 + 2 + 2 + 1 + 1.2
        });
    });

    describe('3. Générateur SEO Programmatique (Schema.org & Sitemap 7 langues)', () => {
        it('génère un Schema.org @graph JSON-LD riche pour une ouverture', () => {
            const schema = buildOpeningStructuredDataJsonLd({
                roll: '3-1',
                title: 'Guide d’Ouverture 3-1 GTO',
                description: 'Analyse 3-ply du coup optimal 8/5 6/5 au Backgammon.',
                locale: 'fr',
            });
            expect(schema['@context']).toBe('https://schema.org');
            expect(schema['@graph']).toHaveLength(4);

            const types = schema['@graph'].map((item) => item['@type']);
            expect(types).toContain('SoftwareApplication');
            expect(types).toContain('Course');
            expect(types).toContain('FAQPage');
            expect(types).toContain('Dataset');
        });

        it('génère un sitemap programmatique complet sur 7 langues (119 URLs)', () => {
            const sitemap = buildProgrammaticSitemapEntries();
            // 7 langues * (1 root + 1 hub + 15 ouvertures) = 7 * 17 = 119
            expect(sitemap).toHaveLength(119);
            expect(sitemap[0].loc).toContain('https://backgammontour.com/fr');
            expect(sitemap.some((entry) => entry.loc.includes('/ja/openings/3-1'))).toBe(true);
        });
    });

    describe('4. Verrou d’Idempotence Webhook Stripe (Code PostgreSQL 23505)', () => {
        it('ignore les événements déjà traités avec le code d’erreur 23505', () => {
            const processed = new Set(['evt_test_123']);
            const res = reconcileStripeWebhookIdempotency({
                eventId: 'evt_test_123',
                eventType: 'checkout.session.completed',
                alreadyProcessedEventIds: processed,
            });
            expect(res.status).toBe('ALREADY_PROCESSED');
            expect(res.code).toBe('23505');
            expect(res.actionTaken).toBe('IGNORED');
        });

        it('gère checkout.session.completed pour club_chouette avec pack 5 sièges', () => {
            const processed = new Set<string>();
            const res = reconcileStripeWebhookIdempotency({
                eventId: 'evt_club_456',
                eventType: 'checkout.session.completed',
                alreadyProcessedEventIds: processed,
                sessionData: {
                    customerId: 'cus_999',
                    planTier: 'club_chouette',
                },
            });
            expect(res.status).toBe('PROCESSED');
            expect(res.actionTaken).toBe('CLUB_PACK_CREATED');
            expect(res.packCreated?.maxSeats).toBe(5);
            expect(res.packCreated?.planTier).toBe('club_chouette');
        });

        it('gère checkout.session.completed pour pro_individual', () => {
            const processed = new Set<string>();
            const res = reconcileStripeWebhookIdempotency({
                eventId: 'evt_indiv_789',
                eventType: 'checkout.session.completed',
                alreadyProcessedEventIds: processed,
                sessionData: {
                    customerId: 'cus_888',
                    planTier: 'pro_individual',
                },
            });
            expect(res.status).toBe('PROCESSED');
            expect(res.actionTaken).toBe('SUBSCRIPTION_CREATED');
        });

        it('gère customer.subscription.updated et deleted', () => {
            const processed = new Set<string>();
            const updated = reconcileStripeWebhookIdempotency({
                eventId: 'evt_upd_1',
                eventType: 'customer.subscription.updated',
                alreadyProcessedEventIds: processed,
            });
            expect(updated.actionTaken).toBe('SUBSCRIPTION_UPDATED');

            const deleted = reconcileStripeWebhookIdempotency({
                eventId: 'evt_del_1',
                eventType: 'customer.subscription.deleted',
                alreadyProcessedEventIds: processed,
            });
            expect(deleted.actionTaken).toBe('SUBSCRIPTION_CANCELED');
        });
    });
});
