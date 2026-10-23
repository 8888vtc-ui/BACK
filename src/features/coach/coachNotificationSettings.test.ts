/**
 * Tests du réglage du seuil de notification du Coach.
 */

import { describe, it, expect } from 'vitest';
import {
    shouldNotify,
    notificationLevelLabel,
    DEFAULT_NOTIFICATION_LEVEL,
} from './coachNotificationSettings';

describe('coachNotificationSettings — shouldNotify', () => {
    it('silent : ne notifie jamais', () => {
        expect(shouldNotify('blunder', 'silent')).toBe(false);
        expect(shouldNotify('inaccuracy', 'silent')).toBe(false);
        expect(shouldNotify('optimal', 'silent')).toBe(false);
    });

    it('blunder : notifie seulement les blunders', () => {
        expect(shouldNotify('blunder', 'blunder')).toBe(true);
        expect(shouldNotify('inaccuracy', 'blunder')).toBe(false);
        expect(shouldNotify('optimal', 'blunder')).toBe(false);
    });

    it('error : notifie blunder + inaccuracy', () => {
        expect(shouldNotify('blunder', 'error')).toBe(true);
        expect(shouldNotify('inaccuracy', 'error')).toBe(true);
        expect(shouldNotify('optimal', 'error')).toBe(false);
    });

    it('libellés lisibles', () => {
        expect(notificationLevelLabel('silent')).toBe('Silencieux');
        expect(notificationLevelLabel('blunder')).toBe('Blunder uniquement');
        expect(notificationLevelLabel('error')).toBe('Erreur + Blunder');
    });

    it('niveau par défaut = blunder', () => {
        expect(DEFAULT_NOTIFICATION_LEVEL).toBe('blunder');
    });
});
