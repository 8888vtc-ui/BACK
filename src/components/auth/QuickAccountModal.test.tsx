import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { QuickAccountModal } from './QuickAccountModal';

describe('QuickAccountModal Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('ne rend rien si isOpen est faux', () => {
        const html = renderToStaticMarkup(
            <QuickAccountModal isOpen={false} onClose={() => {}} />,
        );
        expect(html).toBe('');
    });

    it('affiche le titre 10 000 PTS et les champs obligatoires pseudo, email, mot de passe', () => {
        const html = renderToStaticMarkup(
            <QuickAccountModal isOpen={true} onClose={() => {}} />,
        );

        expect(html).toContain('quick-account-modal');
        expect(html).toContain('quick-account-close-btn');
        expect(html).toContain('quick-account-pseudo-input');
        expect(html).toContain('quick-account-email-input');
        expect(html).toContain('quick-account-password-input');
        expect(html).toContain('quick-account-submit-btn');
        expect(html).toContain('10 000 PTS');
    });
});

