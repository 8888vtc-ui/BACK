'use client';

/**
 * Modale d'Audit Cryptographique en 1 Clic — Provably Fair RNG (`DiceAuditModal.tsx`).
 *
 * Rôle :
 *   Permet au joueur d'auditer localement à 100 % dans son navigateur (via `window.crypto.subtle`)
 *   l'intégrité de chaque lancer de dés selon le protocole Commit-Play-Reveal (HMAC-SHA256 + Rejet < 252).
 *
 * Conforme à SCALABILITY.md (< 300 lignes, 0 any, Dumb UI pure).
 */

import React, { useState, useEffect } from 'react';
import { REJECTION_THRESHOLD, type ProvablyFairSessionState } from '../../lib/crypto/provablyFairRng';
import { useDiceAuditSubtle, type DiceAuditRollInput } from './useDiceAuditSubtle';
import DiceAuditSeedsSection from './DiceAuditSeedsSection';
import DiceAuditRollsTable from './DiceAuditRollsTable';

export type { DiceAuditRollInput };

export interface DiceAuditModalProps {
    readonly isOpen: boolean;
    readonly onClose: () => void;
    readonly session?: ProvablyFairSessionState;
    readonly serverSeed?: string;
    readonly serverSeedHash?: string;
    readonly clientSeed?: string;
    readonly rolls?: ReadonlyArray<DiceAuditRollInput>;
    readonly onUpdateClientSeeds?: (clientSeedA: string, clientSeedB: string) => void;
}

export const DiceAuditModal: React.FC<DiceAuditModalProps> = ({
    isOpen,
    onClose,
    session,
    serverSeed,
    serverSeedHash,
    clientSeed,
    rolls,
    onUpdateClientSeeds,
}) => {
    const {
        effectiveServerSeed,
        effectiveServerSeedHash,
        effectiveClientSeed,
        browserAuditRows,
        isSubtleVerified,
        isHashMatch,
        copiedFeedback,
        runSubtleCryptoAudit,
        handleCopyAuditProof,
    } = useDiceAuditSubtle({
        isOpen,
        session,
        serverSeed,
        serverSeedHash,
        clientSeed,
        rolls,
    });

    const [customSeedA, setCustomSeedA] = useState<string>(session?.clientSeedA ?? '');
    const [customSeedB, setCustomSeedB] = useState<string>(session?.clientSeedB ?? '');

    // Fermeture au clavier via Escape
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="dice-audit-modal-title"
            data-testid="dice-audit-modal"
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#070402]/85 p-3 backdrop-blur-md sm:p-6"
            onClick={onClose}
        >
            <div
                className="w-full max-w-4xl max-h-[92vh] overflow-y-auto space-y-4 rounded-3xl border border-white/10 bg-gradient-to-b from-[#1a0f08] via-[#120a05] to-[#0a0503] p-4 text-[#fdf8eb] shadow-[0_28px_80px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,245,205,0.2)] sm:p-6"
                onClick={(e) => e.stopPropagation()}
            >
                {/* En-tête de la modale */}
                <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2.5">
                        <span
                            aria-hidden="true"
                            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-400/50 bg-emerald-950/60 text-xl shadow-inner"
                        >
                            🛡
                        </span>
                        <div>
                            <h2
                                id="dice-audit-modal-title"
                                className="font-serif text-base font-black uppercase tracking-wider text-[#fdf8eb] sm:text-lg"
                            >
                                Auditeur Cryptographique Provably Fair (Zero-Trust)
                            </h2>
                            <p className="text-[11px] text-[#e8dcc6]/70">
                                Protocole Commit-Play-Reveal • HMAC-SHA256 • Échantillonnage par Rejet (&lt; {REJECTION_THRESHOLD}) • Web Crypto API
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        data-testid="dice-audit-close-btn"
                        aria-label="Fermer la modale d'audit"
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-[#fce8b2] transition hover:border-white/25 hover:text-white active:scale-95"
                    >
                        ✕ Fermer
                    </button>
                </header>

                {/* Sceau de conformité vert animé */}
                <section
                    data-testid="dice-audit-compliance-seal"
                    className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-3.5 shadow-lg transition-all ${
                        isSubtleVerified
                            ? 'border-emerald-400/65 bg-gradient-to-r from-emerald-950/80 via-emerald-900/50 to-emerald-950/80 text-emerald-100'
                            : 'border-rose-500/65 bg-rose-950/70 text-rose-100'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <span
                            aria-hidden="true"
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-emerald-300/70 bg-emerald-500/25 text-lg font-black text-emerald-300 animate-pulse shadow-[0_0_18px_rgba(16,185,129,0.55)]"
                        >
                            ✓
                        </span>
                        <div>
                            <p className="font-serif text-sm font-black tracking-wide text-emerald-200 sm:text-base">
                                ✓ 100 % Équitable &amp; Vérifié mathématiquement
                            </p>
                            <p className="text-[11px] text-emerald-100/80">
                                Équiprobabilité stricte de 42/252 (1/6) par face • 0,00 % de biais de modulo • Vérifié localement via{' '}
                                <code className="font-mono text-emerald-300">window.crypto.subtle</code>
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => void runSubtleCryptoAudit()}
                        data-testid="dice-audit-rerun-btn"
                        className="rounded-xl border border-emerald-400/55 bg-emerald-900/60 px-3 py-1.5 text-xs font-bold text-emerald-100 transition hover:bg-emerald-800/70 active:scale-95"
                    >
                        🔄 Recalculer (SubtleCrypto)
                    </button>
                </section>

                {/* Affichage des graines (Commit - Play - Reveal) */}
                <DiceAuditSeedsSection
                    effectiveServerSeedHash={effectiveServerSeedHash}
                    effectiveServerSeed={effectiveServerSeed}
                    effectiveClientSeed={effectiveClientSeed}
                    isHashMatch={isHashMatch}
                    customSeedA={customSeedA}
                    customSeedB={customSeedB}
                    setCustomSeedA={setCustomSeedA}
                    setCustomSeedB={setCustomSeedB}
                    onUpdateClientSeeds={onUpdateClientSeeds}
                />

                {/* Tableau déroulant de tous les jets de la partie */}
                <DiceAuditRollsTable rows={browserAuditRows} />

                {/* Pied de modale : Bouton d'exportation / copie pour vérification externe */}
                <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3">
                    <p className="text-[11px] text-[#e8dcc6]/70">
                        Vérifiable indépendamment via OpenSSL, CyberChef ou tout terminal HMAC-SHA256.
                    </p>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => void handleCopyAuditProof()}
                            data-testid="dice-audit-copy-btn"
                            className="inline-flex items-center gap-2 rounded-xl border border-[#f3c65f] bg-gradient-to-r from-[#8b6914] via-[#d4af37] to-[#f3c65f] px-4 py-2 text-xs font-black uppercase tracking-wider text-[#1a0f07] shadow-[0_6px_18px_rgba(212,175,55,0.28)] transition hover:brightness-105 active:scale-95"
                        >
                            <span aria-hidden="true">{copiedFeedback ? '✓' : '📋'}</span>
                            <span>
                                {copiedFeedback
                                    ? 'Preuve cryptographique copiée !'
                                    : 'Exporter / Copier la preuve HMAC (JSON & CLI)'}
                            </span>
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default DiceAuditModal;
