import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { toast, toastManager, ToastProvider } from './ToastContext';
import ToastContainer from './ToastContainer';

describe('Système de Toasts & Erreurs Réseau', () => {
    beforeEach(() => {
        toast.clear();
    });

    it('ajoute et retire des toasts via toastManager', () => {
        const id = toast.info('Bienvenue', 'Partie prête');
        expect(toastManager.getAll()).toHaveLength(1);
        expect(toastManager.getAll()[0].title).toBe('Bienvenue');
        expect(toastManager.getAll()[0].message).toBe('Partie prête');
        expect(toastManager.getAll()[0].type).toBe('info');

        toast.dismiss(id);
        expect(toastManager.getAll()).toHaveLength(0);
    });

    it('génère un toast derreur réseau spécifique avec bouton daction retry', () => {
        const onRetry = vi.fn();
        const id = toast.networkError('Connexion au serveur perdue (HTTP 503)', onRetry);

        const current = toastManager.getAll();
        expect(current).toHaveLength(1);
        expect(current[0].id).toBe(id);
        expect(current[0].type).toBe('network');
        expect(current[0].title).toBe('Erreur réseau');
        expect(current[0].message).toBe('Connexion au serveur perdue (HTTP 503)');
        expect(current[0].action?.label).toBe('Réessayer');

        // Test appel de l'action
        current[0].action?.onClick();
        expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('supporte les différents types (success, warning, error)', () => {
        toast.success('Succès', 'Coup optimal validé');
        toast.warning('Attention', 'Blot exposé');
        toast.error('Erreur', 'Coup invalide');

        const all = toastManager.getAll();
        expect(all).toHaveLength(3);
        expect(all.map((t) => t.type)).toEqual(['success', 'warning', 'error']);
    });

    it('ToastContainer ne rend rien quand la liste de toasts est vide', () => {
        const html = renderToStaticMarkup(
            <ToastProvider listenNetworkEvents={false}>
                <ToastContainer />
            </ToastProvider>,
        );
        expect(html).toBe('');
    });

    it('ToastContainer rend les notifications avec rôle alert et bouton fermer', () => {
        toast.networkError('Serveur indisponible');
        toast.success('Bravo', 'Partie gagnée');

        const html = renderToStaticMarkup(
            <ToastProvider listenNetworkEvents={false}>
                <ToastContainer />
            </ToastProvider>,
        );

        expect(html).toContain('role="alert"');
        expect(html).toContain('Erreur réseau');
        expect(html).toContain('Serveur indisponible');
        expect(html).toContain('Partie gagnée');
        expect(html).toContain('aria-label="Fermer la notification"');
    });

    it('clearToasts vide lensemble de la file', () => {
        toast.info('T1');
        toast.info('T2');
        expect(toastManager.getAll()).toHaveLength(2);

        toast.clear();
        expect(toastManager.getAll()).toHaveLength(0);
    });
});
