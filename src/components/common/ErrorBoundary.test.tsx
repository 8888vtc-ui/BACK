import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import ErrorBoundary from './ErrorBoundary';

function BuggyComponent({ shouldThrow = true }: { shouldThrow?: boolean }) {
    if (shouldThrow) {
        throw new Error('Test explosive error');
    }
    return <div>Normal Content</div>;
}

describe('ErrorBoundary', () => {
    it('rend les enfants normaux lorsquaucune erreur nest levée', () => {
        const html = renderToStaticMarkup(
            <ErrorBoundary name="TestModule">
                <div>Contenu sain</div>
            </ErrorBoundary>,
        );
        expect(html).toContain('Contenu sain');
        expect(html).not.toContain('Une erreur est survenue');
    });

    it('affiche le fallback par défaut lorsquune erreur est interceptée', () => {
        // En simulant l'état d'erreur
        const boundary = new ErrorBoundary({ name: 'ComposantTest', children: null });
        const derivedState = ErrorBoundary.getDerivedStateFromError(new Error('Crash simulé'));
        boundary.state = {
            hasError: derivedState.hasError!,
            error: derivedState.error!,
            showDetails: false,
        };

        const html = renderToStaticMarkup(boundary.render() as React.ReactElement);
        expect(html).toContain('Une erreur est survenue dans « ComposantTest »');
        expect(html).toContain('Réessayer');
        expect(html).toContain('Recharger la page');
        expect(html).toContain('role="alert"');
    });

    it('supporte un fallback personnalisé sous forme de ReactNode', () => {
        const boundary = new ErrorBoundary({
            children: null,
            fallback: <div className="custom-fallback">Secours personnalisé</div>,
        });
        boundary.state = {
            hasError: true,
            error: new Error('Erreur fatale'),
            showDetails: false,
        };

        const html = renderToStaticMarkup(boundary.render() as React.ReactElement);
        expect(html).toContain('Secours personnalisé');
        expect(html).not.toContain('Une erreur est survenue');
    });

    it('supporte un fallback sous forme de fonction (error, reset)', () => {
        const boundary = new ErrorBoundary({
            children: null,
            fallback: (err, reset) => (
                <div>
                    <span>Message : {err.message}</span>
                    <button onClick={reset}>Reset</button>
                </div>
            ),
        });
        boundary.state = {
            hasError: true,
            error: new Error('Défaut réseau 404'),
            showDetails: false,
        };

        const html = renderToStaticMarkup(boundary.render() as React.ReactElement);
        expect(html).toContain('Défaut réseau 404');
        expect(html).toContain('Reset');
    });

    it('déclenche onError lors de componentDidCatch', () => {
        const onError = vi.fn();
        const boundary = new ErrorBoundary({ children: null, onError, name: 'Audit' });
        const error = new Error('Test catch');
        const errorInfo = { componentStack: '\n    in BuggyComponent' };

        // Silencer console.error pendant le test
        const originalConsoleError = console.error;
        console.error = vi.fn();

        boundary.componentDidCatch(error, errorInfo);

        expect(onError).toHaveBeenCalledWith(error, errorInfo);
        console.error = originalConsoleError;
    });

    it('réinitialise létat derreur lors de resetErrorBoundary', () => {
        const onReset = vi.fn();
        const boundary = new ErrorBoundary({ children: null, onReset });
        boundary.state = {
            hasError: true,
            error: new Error('Crash'),
            showDetails: true,
        };

        boundary.setState = vi.fn((newState) => {
            boundary.state = { ...boundary.state, ...(newState as object) };
        });

        boundary.resetErrorBoundary();

        expect(boundary.setState).toHaveBeenCalledWith({
            hasError: false,
            error: null,
            showDetails: false,
        });
        expect(onReset).toHaveBeenCalled();
    });
});
