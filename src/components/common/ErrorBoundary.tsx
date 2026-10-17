'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { captureException } from '../../lib/monitoring/sentry';

export interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    onReset?: () => void;
    name?: string;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    showDetails: boolean;
}

/**
 * ErrorBoundary React avec UI de secours moderne, options de rechargement/retry,
 * et journalisation de l'erreur.
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            showDetails: false,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        this.props.onError?.(error, errorInfo);
        // Journalisation sécurisée en console
        if (typeof console !== 'undefined' && console.error) {
            console.error(`[ErrorBoundary${this.props.name ? ` - ${this.props.name}` : ''}]:`, error, errorInfo);
        }
        // Transmission au monitoring Sentry avec contexte de pile du composant
        captureException(error, {
            tags: {
                boundary: this.props.name || 'default',
            },
            extra: {
                componentStack: errorInfo.componentStack,
            },
        });
    }

    resetErrorBoundary = (): void => {
        this.setState({
            hasError: false,
            error: null,
            showDetails: false,
        });
        this.props.onReset?.();
    };

    toggleDetails = (): void => {
        this.setState((prev) => ({ showDetails: !prev.showDetails }));
    };

    render(): ReactNode {
        const { hasError, error, showDetails } = this.state;
        const { children, fallback, name } = this.props;

        if (hasError && error) {
            if (typeof fallback === 'function') {
                return fallback(error, this.resetErrorBoundary);
            }
            if (fallback) {
                return fallback;
            }

            return (
                <div
                    role="alert"
                    aria-live="assertive"
                    className="my-4 w-full max-w-4xl rounded-xl border border-red-500/40 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-md"
                >
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-400 ring-1 ring-red-500/30">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                        </div>

                        <div className="flex-1">
                            <h2 className="text-lg font-bold text-red-200">
                                Une erreur est survenue {name ? `dans « ${name} »` : ''}
                            </h2>
                            <p className="mt-1 text-sm text-slate-300">
                                Le composant n&apos;a pas pu s&apos;afficher correctement en raison d&apos;une exception inattendue.
                            </p>

                            <div className="mt-4 flex flex-wrap items-center gap-3">
                                <button
                                    type="button"
                                    onClick={this.resetErrorBoundary}
                                    className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-red-600/30 transition hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                        />
                                    </svg>
                                    Réessayer
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        if (typeof window !== 'undefined') {
                                            window.location.reload();
                                        }
                                    }}
                                    className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700 hover:text-white"
                                >
                                    Recharger la page
                                </button>

                                <button
                                    type="button"
                                    onClick={this.toggleDetails}
                                    className="text-xs text-slate-400 underline underline-offset-4 hover:text-slate-200"
                                >
                                    {showDetails ? 'Masquer les détails techniques' : 'Afficher les détails techniques'}
                                </button>
                            </div>

                            {showDetails && (
                                <div className="mt-4 rounded-lg bg-slate-950 p-4 text-xs font-mono text-red-300 ring-1 ring-slate-800">
                                    <p className="font-semibold">{error.name}: {error.message}</p>
                                    {error.stack && (
                                        <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-[11px] text-slate-400">
                                            {error.stack}
                                        </pre>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        return children;
    }
}
