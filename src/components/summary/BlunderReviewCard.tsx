'use client';

/**
 * Carte unitaire d'une gaffe avec MiniBoardDiagram, mode puzzle interactif et voix du Coach (< 300 lignes, 0 any).
 */

import React from 'react';
import MiniBoardDiagram from '../board/MiniBoardDiagram';
import ShareBlunderButton from '../share/ShareBlunderButton';
import {
    classifyMoveByEquityLoss,
    PHASE_LABELS,
    PHASE_LABELS_EN,
    REPORT_CATEGORY_META,
    type MajorBlunder,
} from './postMatchReportHelpers';

export interface BlunderReviewCardProps {
    blunder: MajorBlunder;
    idx: number;
    player: 'X' | 'O';
    isReplaying: boolean;
    selectedCandidate: string | null;
    clickedPoints: number[];
    isVoiceActive: boolean;
    locale: string;
    onStartReplay: (idx: number) => void;
    onSelectCandidate: (candidate: string) => void;
    onPointClick: (point: number, blunder: MajorBlunder) => void;
    onSpeak: (text: string) => void;
    onToggleAutoVoice: () => void;
}

export const BlunderReviewCard: React.FC<BlunderReviewCardProps> = ({
    blunder,
    idx,
    player,
    isReplaying,
    selectedCandidate,
    clickedPoints,
    isVoiceActive,
    locale,
    onStartReplay,
    onSelectCandidate,
    onPointClick,
    onSpeak,
    onToggleAutoVoice,
}) => {
    const isEn = locale === 'en';
    const cat = blunder.category ?? classifyMoveByEquityLoss(blunder.equityLoss, blunder.cubeEquityLoss);
    const meta = REPORT_CATEGORY_META[cat];
    const phaseLabel = isEn ? PHASE_LABELS_EN[blunder.phase] : PHASE_LABELS[blunder.phase];
    const isSolved = selectedCandidate === blunder.optimalNotation;
    const hideOptimal = isReplaying && !isSolved;

    const candidateChoices =
        idx % 2 === 0
            ? [blunder.optimalNotation, blunder.playedNotation]
            : [blunder.playedNotation, blunder.optimalNotation];

    const coachText = `${blunder.diagnostic ?? ''} ${blunder.keyConcept ?? ''}`.trim();

    return (
        <article
            data-testid={`match-blunder-card-${idx}`}
            className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#1e120a]/95 to-[#120a05]/95 p-3.5 shadow-[0_16px_40px_rgba(0,0,0,0.65)] space-y-3"
        >
            {/* En-tête de la carte : Tour, Grands Dés, Phase, Badge de Sévérité */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                <div className="flex items-center gap-2.5">
                    <div
                        data-testid={`blunder-dice-badge-${idx}`}
                        className="flex items-center gap-1 rounded-xl border border-white/15 bg-[#2a180c] px-2.5 py-1.5 shadow-inner"
                        title={isEn ? `Dice roll ${blunder.dice[0]}-${blunder.dice[1]}` : `Jet de dés ${blunder.dice[0]}-${blunder.dice[1]}`}
                    >
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#d4af37] bg-[#fdf8eb] font-mono text-base font-black text-[#1a0f07] shadow">
                            {blunder.dice[0]}
                        </span>
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#d4af37] bg-[#fdf8eb] font-mono text-base font-black text-[#1a0f07] shadow">
                            {blunder.dice[1]}
                        </span>
                    </div>

                    <div>
                        <div className="flex items-center gap-1.5">
                            <span className="font-serif text-xs font-black uppercase tracking-wider text-[#fdf8eb]">
                                {isEn ? 'Turn' : 'Tour'} #{blunder.turnNumber}
                            </span>
                            <span className="rounded-md border border-white/10 bg-[#140b06] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#f3c65f]">
                                {phaseLabel}
                            </span>
                        </div>
                        {blunder.xgid && (
                            <p
                                data-testid={`blunder-xgid-${idx}`}
                                className="mt-0.5 max-w-[220px] truncate font-mono text-[10px] text-[#e8dcc6]/60 sm:max-w-xs"
                                title={blunder.xgid}
                            >
                                {blunder.xgid}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1.5">
                    <span
                        data-testid={`blunder-severity-badge-${idx}`}
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-mono text-xs font-black ${meta.badgeClass}`}
                    >
                        <span aria-hidden="true">{meta.icon}</span>
                        <span>-{blunder.equityLoss.toFixed(3)} Eq</span>
                        <span className="font-sans text-[10px] font-bold opacity-90">
                            • {isEn ? meta.shortEn : meta.shortFr}
                        </span>
                    </span>
                </div>
            </div>

            {/* Snapshot visuel Mini-Board Diagram avec flèches comparatives */}
            <MiniBoardDiagram
                board={blunder.boardBefore}
                dice={blunder.dice}
                turn={blunder.player ?? player}
                playedMove={blunder.playedNotation}
                optimalMove={blunder.optimalNotation}
                hideOptimalArrow={hideOptimal}
                highlightedPoints={isReplaying ? clickedPoints : undefined}
                onPointClick={isReplaying ? (pt) => onPointClick(pt, blunder) : undefined}
                locale={locale}
            />

            {/* Comparaison Coup Joué vs Coup Optimal */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="rounded-xl border border-rose-500/30 bg-rose-950/30 px-3 py-2">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-rose-300">
                        🔴 {isEn ? 'Your move (dashed red)' : 'Coup joué (rouge pointillé)'}
                    </span>
                    <span className="mt-0.5 block font-mono text-xs font-black text-rose-100">
                        {blunder.playedNotation}
                    </span>
                </div>
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-3 py-2">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                        🟢 {isEn ? 'Engine optimal (solid green/gold)' : 'Optimal moteur (vert/or plein)'}
                    </span>
                    <span className="mt-0.5 block font-mono text-xs font-black text-emerald-100">
                        {hideOptimal
                            ? isEn
                                ? '??? (Find the optimal move!)'
                                : '??? (Trouvez le meilleur coup !)'
                            : blunder.optimalNotation}
                    </span>
                </div>
            </div>

            {/* Mode interactif / Puzzle : "Rejouer ce coup" */}
            {isReplaying && (
                <div
                    data-testid={`blunder-replay-puzzle-${idx}`}
                    className="rounded-xl border border-[#f3c65f]/50 bg-[#26160c]/90 p-3 space-y-2"
                >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-bold text-[#f3c65f]">
                            🎯{' '}
                            {isEn
                                ? `Interactive Replay — Choose or click the best move with [${blunder.dice[0]}-${blunder.dice[1]}]:`
                                : `Mode Puzzle Interactif — Choisissez ou cliquez le coup optimal avec [${blunder.dice[0]}-${blunder.dice[1]}] :`}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                            {candidateChoices.map((choice) => (
                                <button
                                    key={choice}
                                    type="button"
                                    onClick={() => onSelectCandidate(choice)}
                                    data-testid={`replay-choice-${idx}-${choice}`}
                                    className={`rounded-xl border px-3 py-1.5 font-mono text-xs font-black transition ${
                                        selectedCandidate === choice
                                            ? choice === blunder.optimalNotation
                                                ? 'border-emerald-400 bg-emerald-600 text-white'
                                                : 'border-rose-400 bg-rose-600 text-white'
                                            : 'border-white/15 bg-[#140b06] text-[#fdf8eb] hover:border-[#f3c65f]'
                                    }`}
                                >
                                    {choice}
                                </button>
                            ))}
                        </div>
                    </div>

                    {selectedCandidate && (
                        <p
                            data-testid={`replay-feedback-${idx}`}
                            className={`text-xs font-bold ${isSolved ? 'text-emerald-300' : 'text-rose-300'}`}
                        >
                            {isSolved
                                ? isEn
                                    ? `✅ Brilliant! ${blunder.optimalNotation} is the Grandmaster move (saves +${blunder.equityLoss.toFixed(3)} Eq).`
                                    : `✅ Exact ! ${blunder.optimalNotation} est le coup optimal du moteur (économise +${blunder.equityLoss.toFixed(3)} Eq).`
                                : isEn
                                  ? `❌ ${selectedCandidate} loses -${blunder.equityLoss.toFixed(3)} Eq. Try again or inspect the green arrow!`
                                  : `❌ ${selectedCandidate} perd -${blunder.equityLoss.toFixed(3)} Eq. Sélectionnez l'autre candidat pour révéler la flèche optimale !`}
                        </p>
                    )}
                </div>
            )}

            {/* Explication pédagogique du Coach + Actions */}
            <div className="rounded-xl border border-white/10 bg-[#140b06]/85 p-2.5 space-y-1.5">
                {blunder.diagnostic && (
                    <p className="text-xs leading-relaxed text-[#fdf8eb]">
                        <strong className="text-[#f3c65f]">🎯 {isEn ? 'Diagnostic:' : 'Diagnostic :'}</strong>{' '}
                        {blunder.diagnostic}
                    </p>
                )}
                {blunder.keyConcept && (
                    <p className="text-xs leading-relaxed text-[#e8dcc6]/85">
                        <strong className="text-emerald-300">💡 {isEn ? 'Key Concept:' : 'Concept Clé :'}</strong>{' '}
                        {blunder.keyConcept}
                    </p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5">
                    <button
                        type="button"
                        onClick={() => onStartReplay(idx)}
                        data-testid={`replay-blunder-move-btn-${idx}`}
                        className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-black uppercase tracking-wider transition active:scale-95 ${
                            isReplaying
                                ? 'border-[#f3c65f] bg-[#f3c65f] text-[#1a0f07]'
                                : 'border-white/15 bg-[#2a180c] text-[#fce8b2] hover:border-[#f3c65f] hover:bg-[#382010]'
                        }`}
                    >
                        <span aria-hidden="true">🎯</span>
                        <span>
                            {isReplaying
                                ? isEn
                                    ? 'Exit Replay'
                                    : 'Quitter le puzzle'
                                : isEn
                                  ? 'Replay this move'
                                  : 'Rejouer ce coup'}
                        </span>
                    </button>

                    <div className="flex flex-wrap items-center gap-1.5">
                        <ShareBlunderButton
                            data={{
                                board: blunder.boardBefore,
                                dice: blunder.dice,
                                turn: blunder.player ?? player,
                                bestMoveNotation: blunder.optimalNotation,
                                playedMoveNotation: blunder.playedNotation,
                                equityLoss: blunder.equityLoss,
                                keyConcept: blunder.keyConcept,
                                locale,
                            }}
                            variant="full"
                        />
                        <button
                            type="button"
                            onClick={() => onSpeak(coachText)}
                            data-testid={`speak-blunder-btn-${idx}`}
                            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-white/10 bg-[#1c1008] px-2.5 py-1 text-[11px] font-bold text-[#e8dcc6] transition hover:border-[#f3c65f] hover:text-white"
                            title={isEn ? 'Listen to Coach explanation' : 'Écouter l’explication du Coach'}
                        >
                            <span aria-hidden="true">🔊</span>
                            <span>{isEn ? 'Listen' : 'Écouter'}</span>
                        </button>
                        <button
                            type="button"
                            onClick={onToggleAutoVoice}
                            data-testid={`toggle-voice-coach-btn-${idx}`}
                            className={`rounded-xl border px-2 py-1 text-[10px] font-bold transition ${
                                isVoiceActive
                                    ? 'border-emerald-500/50 bg-emerald-950/50 text-emerald-300'
                                    : 'border-white/10 bg-[#120904] text-[#e8dcc6]/60'
                            }`}
                        >
                            {isVoiceActive
                                ? isEn
                                    ? '🎙️ Auto-Voice ON'
                                    : '🎙️ Voix Auto ON'
                                : isEn
                                  ? '🔇 Auto-Voice OFF'
                                  : '🔇 Voix Auto OFF'}
                        </button>
                    </div>
                </div>
            </div>
        </article>
    );
};

export default BlunderReviewCard;
