// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { DiceAuditModal } from './DiceAuditModal';
import { computeServerSeedHash } from '../../lib/crypto/provablyFairRng';

const REFERENCE_SERVER_SEED =
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
const REFERENCE_CLIENT_SEED = 'alice_and_bob_seed_12345';

describe('DiceAuditModal — Panneau d’Audit en 1 Clic (Provably Fair)', () => {
    it('n’affiche rien lorsque isOpen vaut false', () => {
        const { queryByTestId } = render(
            <DiceAuditModal isOpen={false} onClose={vi.fn()} />,
        );
        expect(queryByTestId('dice-audit-modal')).toBeNull();
    });

    it('affiche le sceau de conformité, les 3 graines, le tableau des jets validés et le bouton d’exportation', async () => {
        const onClose = vi.fn();
        const serverSeedHash = computeServerSeedHash(REFERENCE_SERVER_SEED);

        const rolls = [
            { nonce: 0, actualDice: [4, 3] as const, isOpeningRoll: true },
            { nonce: 1, actualDice: [3, 5] as const, isOpeningRoll: false },
            { nonce: 2, actualDice: [5, 5] as const, isOpeningRoll: false },
        ];

        const { getByTestId, getByText } = render(
            <DiceAuditModal
                isOpen={true}
                onClose={onClose}
                serverSeed={REFERENCE_SERVER_SEED}
                serverSeedHash={serverSeedHash}
                clientSeed={REFERENCE_CLIENT_SEED}
                rolls={rolls}
            />,
        );

        // Sceau de conformité vert animé
        expect(getByTestId('dice-audit-compliance-seal').textContent).toContain(
            '✓ 100 % Équitable & Vérifié mathématiquement',
        );

        // Graines
        expect(getByTestId('dice-audit-server-seed-hash').textContent).toBe(serverSeedHash);
        expect(getByTestId('dice-audit-server-seed').textContent).toBe(REFERENCE_SERVER_SEED);
        expect(getByTestId('dice-audit-client-seed').textContent).toBe(REFERENCE_CLIENT_SEED);

        // Tableau déroulant de tous les jets
        expect(getByText('Tour (nonce)')).toBeDefined();
        expect(getByText('Jet Réel')).toBeDefined();
        expect(getByText('Jet Recalculé')).toBeDefined();
        expect(getByText('Préfixe HMAC')).toBeDefined();
        expect(getByText('Statut')).toBeDefined();

        await waitFor(() => {
            expect(getByTestId('dice-audit-status-0').textContent).toBe('Validé ✓');
            expect(getByTestId('dice-audit-status-1').textContent).toBe('Validé ✓');
            expect(getByTestId('dice-audit-status-2').textContent).toBe('Validé ✓');
        });

        expect(getByTestId('dice-audit-row-0').textContent).toContain('[4, 3]');
        expect(getByTestId('dice-audit-row-1').textContent).toContain('[3, 5]');
        expect(getByTestId('dice-audit-row-2').textContent).toContain('[5, 5]');

        // Bouton d'exportation / copie
        const copyBtn = getByTestId('dice-audit-copy-btn');
        fireEvent.click(copyBtn);
        await waitFor(() => {
            expect(copyBtn.textContent).toContain('Preuve cryptographique copiée !');
        });

        // Fermeture
        fireEvent.click(getByTestId('dice-audit-close-btn'));
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
