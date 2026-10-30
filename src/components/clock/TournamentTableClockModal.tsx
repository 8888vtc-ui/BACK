'use client';

/**
 * Pendule WBF / Bronstein Tête-Bêche & Scoreboard de Table de Tournoi (`TournamentTableClockModal.tsx`).
 *
 * Rôle :
 *   Transforme le smartphone posé au bord d'un vrai tablier physique en :
 *   1. Pendule officielle WBF à délai Bronstein par coup (`12s` / `15s` / `8s`) + réserve de match.
 *   2. Feuille de score tactile avec détection automatique de la règle de Crawford et suivi du Videau.
 *   3. Bouton « 📷 Scanner le tablier » en 1 tap qui met la pendule en pause et ouvre le Scanner Photo IA.
 *
 * Dépendances : Aucune dépendance externe (React pur).
 * Comment retirer : Supprimer ce fichier et retirer son appel dans `LobbyScreen.tsx`.
 * Conforme SCALABILITY.md R1 (< 250 lignes, `React.memo`, 0 `any`).
 */

import React, { useCallback, useEffect, useState } from 'react';

export interface TournamentTableClockModalProps {
    readonly isOpen: boolean;
    readonly onClose: () => void;
    readonly onOpenPhotoScanner: () => void;
    readonly initialMatchLength?: number;
}

interface ClockPresetConfig {
    readonly id: 'wbf_standard' | 'wbf_masters' | 'club_blitz';
    readonly label: string;
    readonly reservePerPointSec: number;
    readonly delaySec: number;
}

const CLOCK_PRESETS: readonly ClockPresetConfig[] = [
    { id: 'wbf_standard', label: 'WBF Standard (2m/pt + 12s)', reservePerPointSec: 120, delaySec: 12 },
    { id: 'wbf_masters', label: 'WBF Masters (2.5m/pt + 15s)', reservePerPointSec: 150, delaySec: 15 },
    { id: 'club_blitz', label: 'Speed / Chouette (1m/pt + 8s)', reservePerPointSec: 60, delaySec: 8 },
];

const CUBE_STEPS = [1, 2, 4, 8, 16, 32, 64] as const;

function formatClockMmSs(totalSec: number): string {
    const clamped = Math.max(0, Math.ceil(totalSec));
    const mins = Math.floor(clamped / 60);
    const secs = clamped % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

const TournamentTableClockModalComponent: React.FC<TournamentTableClockModalProps> = ({
    isOpen,
    onClose,
    onOpenPhotoScanner,
    initialMatchLength = 7,
}) => {
    const [matchLength, setMatchLength] = useState<number>(initialMatchLength || 7);
    const [preset, setPreset] = useState<ClockPresetConfig>(CLOCK_PRESETS[0]);
    const [activePlayer, setActivePlayer] = useState<'P1' | 'P2' | null>(null);
    const [reserveP1, setReserveP1] = useState<number>(initialMatchLength * CLOCK_PRESETS[0].reservePerPointSec);
    const [reserveP2, setReserveP2] = useState<number>(initialMatchLength * CLOCK_PRESETS[0].reservePerPointSec);
    const [delayLeft, setDelayLeft] = useState<number>(CLOCK_PRESETS[0].delaySec);
    const [scoreP1, setScoreP1] = useState<number>(0);
    const [scoreP2, setScoreP2] = useState<number>(0);
    const [crawfordUsed, setCrawfordUsed] = useState<boolean>(false);
    const [isCrawfordGame, setIsCrawfordGame] = useState<boolean>(false);
    const [cubeValue, setCubeValue] = useState<number>(1);
    const [headToHeadFlip, setHeadToHeadFlip] = useState<boolean>(true);

    const resetClocks = useCallback(
        (nextLength: number, nextPreset: ClockPresetConfig) => {
            setActivePlayer(null);
            const totalReserve = Math.max(1, nextLength) * nextPreset.reservePerPointSec;
            setReserveP1(totalReserve);
            setReserveP2(totalReserve);
            setDelayLeft(nextPreset.delaySec);
        },
        [],
    );

    useEffect(() => {
        if (!isOpen || !activePlayer) return;
        const interval = setInterval(() => {
            setDelayLeft((prevDelay) => {
                if (prevDelay > 0.1) {
                    return Number((prevDelay - 0.1).toFixed(1));
                }
                if (activePlayer === 'P1') {
                    setReserveP1((r) => Math.max(0, Number((r - 0.1).toFixed(1))));
                } else {
                    setReserveP2((r) => Math.max(0, Number((r - 0.1).toFixed(1))));
                }
                return 0;
            });
        }, 100);
        return () => clearInterval(interval);
    }, [isOpen, activePlayer]);

    const handleTapClock = useCallback(
        (tappedBy: 'P1' | 'P2') => {
            const nextActive = tappedBy === 'P1' ? 'P2' : 'P1';
            setActivePlayer(nextActive);
            setDelayLeft(preset.delaySec);
        },
        [preset.delaySec],
    );

    const handleAddScore = useCallback(
        (player: 'P1' | 'P2', delta: number) => {
            const nextP1 = player === 'P1' ? Math.max(0, scoreP1 + delta) : scoreP1;
            const nextP2 = player === 'P2' ? Math.max(0, scoreP2 + delta) : scoreP2;
            setScoreP1(nextP1);
            setScoreP2(nextP2);
            setCubeValue(1);
            if (!crawfordUsed && (nextP1 === matchLength - 1 || nextP2 === matchLength - 1)) {
                setIsCrawfordGame(true);
                setCrawfordUsed(true);
            } else if (isCrawfordGame && delta > 0) {
                setIsCrawfordGame(false);
            }
        },
        [scoreP1, scoreP2, crawfordUsed, isCrawfordGame, matchLength],
    );

    if (!isOpen) return null;

    return (
        <div
            data-testid="tournament-table-clock-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Pendule et Table de Tournoi WBF"
            className="fixed inset-0 z-50 flex flex-col justify-between bg-[#06080e] p-3 sm:p-5 text-slate-100 select-none"
        >
            {/* Zone Joueur 2 (Haut — inversable à 180° pour jeu face-à-face sur tablier réel) */}
            <button
                type="button"
                data-testid="clock-zone-p2"
                onClick={() => handleTapClock('P2')}
                className={`flex-1 w-full rounded-3xl border-2 p-4 flex flex-col items-center justify-center gap-1 transition-all touch-manipulation ${
                    headToHeadFlip ? 'rotate-180' : ''
                } ${
                    activePlayer === 'P2'
                        ? 'border-amber-400 bg-gradient-to-b from-[#2b1a09] to-[#140c05] shadow-[0_0_40px_rgba(245,158,11,0.3)]'
                        : 'border-white/10 bg-[#0d121c]/80 opacity-80'
                }`}
            >
                <span className="text-xs font-bold uppercase tracking-widest text-amber-200/80">
                    Joueur 2 (Noir / O) · Score {scoreP2}/{matchLength}
                </span>
                <span data-testid="clock-reserve-p2" className="font-mono text-4xl sm:text-6xl font-black tabular-nums text-[#fdf8eb]">
                    {formatClockMmSs(reserveP2)}
                </span>
                <span className="rounded-full border border-amber-400/40 bg-black/50 px-3 py-0.5 font-mono text-sm font-bold text-amber-300">
                    Délai : {activePlayer === 'P2' ? `${delayLeft.toFixed(1)}s` : `${preset.delaySec}.0s`}
                </span>
            </button>

            {/* Barre Centrale d'Arbitrage : Pause, Score, Crawford, Videau & Scanner Photo 1-Tap */}
            <div className="my-2.5 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#d4af37]/40 bg-[#120b06] px-3 py-2 shadow-xl">
                <div className="flex items-center gap-1.5">
                    <button
                        type="button"
                        data-testid="clock-pause-btn"
                        onClick={() => setActivePlayer(null)}
                        className="rounded-xl border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-bold text-amber-100"
                    >
                        ⏸ Pause
                    </button>
                    <button
                        type="button"
                        onClick={() => setHeadToHeadFlip((f) => !f)}
                        className="rounded-xl border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-bold text-slate-200"
                        title="Pivoter l'affichage du Joueur 2 à 180°"
                    >
                        🔄 180°
                    </button>
                    <select
                        aria-label="Cadence WBF"
                        value={preset.id}
                        onChange={(e) => {
                            const next = CLOCK_PRESETS.find((p) => p.id === e.target.value) ?? CLOCK_PRESETS[0];
                            setPreset(next);
                            resetClocks(matchLength, next);
                        }}
                        className="rounded-xl border border-white/15 bg-black/70 px-2 py-1.5 text-xs text-amber-100"
                    >
                        {CLOCK_PRESETS.map((p) => (
                            <option key={p.id} value={p.id}>{p.label}</option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-mono">
                    <button type="button" data-testid="clock-score-p1-plus" onClick={() => handleAddScore('P1', 1)} className="rounded-lg border border-amber-400/40 bg-amber-500/15 px-2 py-1 font-bold text-amber-100">+1 J1 ({scoreP1})</button>
                    <button
                        type="button"
                        data-testid="clock-cube-cycle-btn"
                        onClick={() => setCubeValue(CUBE_STEPS[(CUBE_STEPS.indexOf(cubeValue as (typeof CUBE_STEPS)[number]) + 1) % CUBE_STEPS.length])}
                        className="rounded-lg border border-white/20 bg-black/60 px-2.5 py-1 font-black text-[#f3c65f]"
                    >
                        {isCrawfordGame ? 'CRAWFORD' : `Cube ${cubeValue}×`}
                    </button>
                    <button type="button" data-testid="clock-score-p2-plus" onClick={() => handleAddScore('P2', 1)} className="rounded-lg border border-sky-400/40 bg-sky-500/15 px-2 py-1 font-bold text-sky-100">+1 J2 ({scoreP2})</button>
                </div>

                <div className="flex items-center gap-1.5">
                    <button
                        type="button"
                        data-testid="table-clock-scan-board-btn"
                        onClick={() => {
                            setActivePlayer(null);
                            onOpenPhotoScanner();
                        }}
                        className="rounded-xl border border-emerald-400 bg-gradient-to-r from-emerald-600 to-teal-500 px-3 py-1.5 text-xs font-black text-white shadow-md hover:brightness-110"
                    >
                        📷 Scanner le tablier
                    </button>
                    <button
                        type="button"
                        data-testid="close-table-clock-btn"
                        onClick={onClose}
                        className="rounded-xl border border-white/15 bg-black/60 px-2.5 py-1.5 text-xs font-bold text-slate-300 hover:text-white"
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Zone Joueur 1 (Bas) */}
            <button
                type="button"
                data-testid="clock-zone-p1"
                onClick={() => handleTapClock('P1')}
                className={`flex-1 w-full rounded-3xl border-2 p-4 flex flex-col items-center justify-center gap-1 transition-all touch-manipulation ${
                    activePlayer === 'P1'
                        ? 'border-amber-400 bg-gradient-to-b from-[#2b1a09] to-[#140c05] shadow-[0_0_40px_rgba(245,158,11,0.3)]'
                        : 'border-white/10 bg-[#0d121c]/80 opacity-80'
                }`}
            >
                <span className="text-xs font-bold uppercase tracking-widest text-amber-200/80">
                    Joueur 1 (Blanc / X) · Score {scoreP1}/{matchLength}
                </span>
                <span data-testid="clock-reserve-p1" className="font-mono text-4xl sm:text-6xl font-black tabular-nums text-[#fdf8eb]">
                    {formatClockMmSs(reserveP1)}
                </span>
                <span className="rounded-full border border-amber-400/40 bg-black/50 px-3 py-0.5 font-mono text-sm font-bold text-amber-300">
                    Délai : {activePlayer === 'P1' ? `${delayLeft.toFixed(1)}s` : `${preset.delaySec}.0s`}
                </span>
            </button>
        </div>
    );
};

export const TournamentTableClockModal = React.memo(TournamentTableClockModalComponent);
export default TournamentTableClockModal;
