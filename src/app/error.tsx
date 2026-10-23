'use client';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <main className="flex min-h-dvh flex-col items-center justify-center p-6 text-center bg-[#090d16] text-slate-100">
            <h1 className="font-serif text-3xl font-black text-amber-300 drop-shadow">Une interruption est survenue</h1>
            <p className="mt-3 text-xs text-slate-400 max-w-md">{error.message || 'Erreur inattendue dans le Salon Monte-Carlo.'}</p>
            <button
                type="button"
                onClick={() => reset()}
                className="mt-6 rounded-full border border-[#d4af37]/60 bg-gradient-to-b from-[#2a1f0d] to-[#120d08] px-6 py-2.5 text-xs font-bold text-amber-200 transition hover:border-[#f3c65f] hover:text-amber-100"
            >
                Réessayer la Session
            </button>
        </main>
    );
}
