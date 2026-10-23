import Link from 'next/link';

export default function NotFound() {
    return (
        <main className="flex min-h-dvh flex-col items-center justify-center p-6 text-center bg-[#090d16] text-slate-100">
            <h1 className="font-serif text-6xl font-black text-amber-300 drop-shadow">404</h1>
            <p className="mt-3 text-sm text-slate-300">Page introuvable dans le Salon Privé Monte-Carlo.</p>
            <Link
                href="/"
                className="mt-6 rounded-full border border-[#d4af37]/60 bg-gradient-to-b from-[#2a1f0d] to-[#120d08] px-6 py-2.5 text-xs font-bold text-amber-200 transition hover:border-[#f3c65f] hover:text-amber-100"
            >
                Retour au Salon de Jeu
            </Link>
        </main>
    );
}
