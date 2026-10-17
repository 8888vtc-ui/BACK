'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Toast, useToast } from './ToastContext';

function ToastIcon({ type }: { type: Toast['type'] }) {
    switch (type) {
        case 'network':
            return (
                <svg className="h-5 w-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 4.243a9 9 0 01-2.829-6.364M3 3l18 18"
                    />
                </svg>
            );
        case 'error':
            return (
                <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
            );
        case 'warning':
            return (
                <svg className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                </svg>
            );
        case 'success':
            return (
                <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
            );
        case 'info':
        default:
            return (
                <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
            );
    }
}

function ToastItem({
    toast,
    onClose,
}: {
    toast: Toast;
    onClose: (id: string) => void;
}) {
    const [paused, setPaused] = useState(false);
    const duration = toast.duration ?? 5000;
    const remainingRef = useRef(duration);
    const lastTickRef = useRef(Date.now());

    useEffect(() => {
        if (duration <= 0) return;

        const interval = setInterval(() => {
            if (!paused) {
                const now = Date.now();
                const delta = now - lastTickRef.current;
                remainingRef.current -= delta;
                lastTickRef.current = now;

                if (remainingRef.current <= 0) {
                    clearInterval(interval);
                    onClose(toast.id);
                }
            } else {
                lastTickRef.current = Date.now();
            }
        }, 100);

        return () => clearInterval(interval);
    }, [paused, duration, toast.id, onClose]);

    const borderClass =
        toast.type === 'network'
            ? 'border-rose-500/50 bg-rose-950/20 shadow-rose-900/30'
            : toast.type === 'error'
                ? 'border-red-500/50 bg-red-950/20 shadow-red-900/30'
                : toast.type === 'warning'
                    ? 'border-amber-500/50 bg-amber-950/20 shadow-amber-900/30'
                    : toast.type === 'success'
                        ? 'border-emerald-500/50 bg-emerald-950/20 shadow-emerald-900/30'
                        : 'border-blue-500/50 bg-blue-950/20 shadow-blue-900/30';

    return (
        <div
            role="alert"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            className={`pointer-events-auto relative flex w-full max-w-sm items-start gap-3 rounded-xl border bg-slate-900/95 p-4 shadow-2xl backdrop-blur-md transition-all duration-200 hover:scale-[1.01] ${borderClass}`}
        >
            <div className="mt-0.5 flex-shrink-0">
                <ToastIcon type={toast.type} />
            </div>

            <div className="flex-1 pr-2">
                <h3 className="text-sm font-semibold text-slate-100">{toast.title}</h3>
                {toast.message && (
                    <p className="mt-1 text-xs leading-relaxed text-slate-300">{toast.message}</p>
                )}
                {toast.action && (
                    <button
                        type="button"
                        onClick={() => {
                            toast.action?.onClick();
                            onClose(toast.id);
                        }}
                        className="mt-2 inline-flex items-center rounded bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-200 ring-1 ring-slate-700 transition hover:bg-slate-700 hover:text-white"
                    >
                        {toast.action.label}
                    </button>
                )}
            </div>

            <button
                type="button"
                onClick={() => onClose(toast.id)}
                aria-label="Fermer la notification"
                className="flex-shrink-0 rounded-lg p-1 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
            >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
}

export default function ToastContainer() {
    const { toasts, removeToast } = useToast();

    if (toasts.length === 0) return null;

    return (
        <aside
            aria-label="Notifications"
            className="fixed bottom-4 right-4 z-50 flex max-w-sm flex-col-reverse gap-2.5 pointer-events-none"
        >
            {toasts.map((t) => (
                <ToastItem key={t.id} toast={t} onClose={removeToast} />
            ))}
        </aside>
    );
}
