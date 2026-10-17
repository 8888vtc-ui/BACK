'use client';

import React, { useState, useMemo, useCallback } from 'react';
import type { CompleteGameAnalysis, MoveVerdict } from '../../features/rating/types';
import { shareContent, shareGameResult } from '../../lib/capacitor/share';
import { impactLight } from '../../lib/capacitor/haptics';
import EquityCurveChart from './EquityCurveChart';
import ReviewBoardPreview from './ReviewBoardPreview';
import ConceptsErrorSummary from './ConceptsErrorSummary';
import { serializeToSGF, downloadFile } from '../../features/export';
import { useBoardTheme, getModalThemeClasses, type ThemeName } from '../../hooks/useBoardTheme';

export interface GameReviewModalProps {
    analysis: CompleteGameAnalysis | null;
    isOpen: boolean;
    onClose: () => void;
    theme?: ThemeName;
}

export type ReviewTab = 'overview' | 'step_by_step' | 'concepts' | 'table';

export default function GameReviewModal({
    analysis,
    isOpen,
    onClose,
    theme,
}: GameReviewModalProps) {
    const { theme: activeTheme } = useBoardTheme();
    const currentTheme = theme || activeTheme;
    const modalClasses = getModalThemeClasses(currentTheme);

    const [activeTab, setActiveTab] = useState<ReviewTab>('overview');
    const [selectedIndex, setSelectedIndex] = useState<number>(0);
    const [filterOnlyMistakes, setFilterOnlyMistakes] = useState<boolean>(false);

    const evaluatedMoves = analysis?.evaluatedMoves || [];
    const totalMoves = evaluatedMoves.length;

    const isMistakeIndex = useCallback(
        (idx: number) => {
            const m = evaluatedMoves[idx];
            return m ? m.verdict === 'doubtful' || m.verdict === 'blunder' || m.verdict === 'howler' : false;
        },
        [evaluatedMoves],
    );

    // Indices des fautes pour saut rapide
    const mistakeIndices = useMemo(() => {
        const out: number[] = [];
        evaluatedMoves.forEach((m, i) => {
            if (m.verdict === 'doubtful' || m.verdict === 'blunder' || m.verdict === 'howler') {
                out.push(i);
            }
        });
        return out;
    }, [evaluatedMoves]);

    const hasPrevMistake = mistakeIndices.some((idx) => idx < selectedIndex);
    const hasNextMistake = mistakeIndices.some((idx) => idx > selectedIndex);

    const handlePrevMistake = useCallback(() => {
        const earlier = mistakeIndices.filter((idx) => idx < selectedIndex);
        if (earlier.length > 0) {
            setSelectedIndex(earlier[earlier.length - 1]);
        }
    }, [mistakeIndices, selectedIndex]);

    const handleNextMistake = useCallback(() => {
        const later = mistakeIndices.filter((idx) => idx > selectedIndex);
        if (later.length > 0) {
            setSelectedIndex(later[0]);
        }
    }, [mistakeIndices, selectedIndex]);

    if (!isOpen || !analysis) return null;

    const currentTurn = evaluatedMoves[selectedIndex] || evaluatedMoves[0];

    const verdictBadges: Record<
        MoveVerdict,
        { label: string; bg: string; text: string; border: string }
    > = {
        optimal: {
            label: 'Optimal',
            bg: 'bg-emerald-950/60',
            text: 'text-emerald-300',
            border: 'border-emerald-600/40',
        },
        acceptable: {
            label: 'Acceptable',
            bg: 'bg-teal-950/60',
            text: 'text-teal-300',
            border: 'border-teal-600/40',
        },
        doubtful: {
            label: 'Douteux',
            bg: 'bg-amber-950/60',
            text: 'text-amber-300',
            border: 'border-amber-600/40',
        },
        blunder: {
            label: 'Blunder',
            bg: 'bg-rose-950/60',
            text: 'text-rose-300',
            border: 'border-rose-600/40',
        },
        howler: {
            label: 'Howler',
            bg: 'bg-red-950/80',
            text: 'text-red-200',
            border: 'border-red-600/60',
        },
    };

    const movesToShow = filterOnlyMistakes
        ? evaluatedMoves.filter(
              (m) => m.verdict === 'doubtful' || m.verdict === 'blunder' || m.verdict === 'howler',
          )
        : evaluatedMoves;

    const totalDecisions = Math.max(1, analysis.unforcedDecisionsCount);

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="game-review-title"
            className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 animate-in fade-in duration-200 overflow-y-auto ${modalClasses.overlay}`}
            data-testid="game-review-modal"
        >
            <div className={`relative w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden rounded-3xl shadow-2xl my-auto transition-all ${modalClasses.container}`}>
                {/* 1. En-tête du Modal */}
                <div className={`flex items-center justify-between border-b p-4 sm:p-5 ${modalClasses.header}`}>
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-2xl shadow-lg shadow-blue-950">
                            📊
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2
                                    id="game-review-title"
                                    className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2"
                                >
                                    <span>Bilan &amp; Estimation du PR</span>
                                    <span className="text-xs font-normal text-slate-400 hidden sm:inline">
                                        (Partie Complète)
                                    </span>
                                </h2>
                                <span className="rounded-full border border-blue-400/40 bg-blue-500/20 px-2 py-0.5 text-xs font-bold text-blue-300">
                                    {analysis.prCategory}
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Review complète certifiée GNUBG : navigation coup par coup, courbe d'équité et analyse conceptuelle.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                try {
                                    const rawTurns = evaluatedMoves.map((m) => ({
                                        turnNumber: m.moveNumber,
                                        player: m.player,
                                        dice: m.dice,
                                        boardBefore: m.boardBefore,
                                        boardAfter: m.boardAfter,
                                        moves: [],
                                        playedNotation: m.playedNotation,
                                    }));
                                    const sgf = serializeToSGF({
                                        gameId: analysis.gameId,
                                        matchLength: analysis.matchLength,
                                        scoreX: analysis.scoreX,
                                        scoreO: analysis.scoreO,
                                        winner: analysis.winner,
                                        turnsHistory: rawTurns,
                                    });
                                    downloadFile(sgf, `backgammon_${analysis.gameId}.sgf`, 'application/x-go-sgf');
                                } catch (e) {
                                    console.warn('Erreur export SGF :', e);
                                }
                            }}
                            className="hidden sm:flex items-center gap-1.5 rounded-xl border border-indigo-700/60 bg-indigo-950/40 px-3 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-900/60 transition shadow-sm"
                            title="Télécharger l'enregistrement de la partie au format standard SGF (Backgammon GM[6])"
                            data-testid="export-sgf-review-btn"
                        >
                            <span>💾</span>
                            <span>Export SGF</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                impactLight();
                                shareContent({
                                    title: 'Mon bilan Backgammon Pro',
                                    text: `J'ai terminé mon match avec un PR de ${analysis.performanceRating} (${analysis.prCategory}) et un Elo estimé à ${analysis.estimatedRating} !`,
                                    dialogTitle: 'Partager mon bilan de partie',
                                }).catch(() => {});
                            }}
                            className="hidden sm:flex items-center gap-1.5 rounded-xl border border-blue-700/60 bg-blue-950/40 px-3 py-1.5 text-xs font-semibold text-blue-300 hover:bg-blue-900/60 transition shadow-sm"
                            title="Partager mon bilan et mon Performance Rating"
                            data-testid="share-review-btn"
                        >
                            <span>📤</span>
                            <span>Partager</span>
                        </button>

                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-slate-700 bg-slate-800/80 p-2 text-slate-400 hover:text-white hover:bg-slate-700 transition"
                            aria-label="Fermer le bilan"
                            data-testid="close-review-modal-btn"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* 2. Onglets de Navigation Post-Partie */}
                <div className="flex items-center gap-1.5 border-b border-slate-800 bg-slate-950/40 px-4 sm:px-6 py-2.5 overflow-x-auto">
                    <button
                        type="button"
                        onClick={() => setActiveTab('overview')}
                        className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                            activeTab === 'overview'
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                        data-testid="tab-overview"
                    >
                        <span>📈</span>
                        <span>Courbe &amp; Synthèse</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('step_by_step')}
                        className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                            activeTab === 'step_by_step'
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                        data-testid="tab-step-by-step"
                    >
                        <span>♟️</span>
                        <span>Coup par Coup</span>
                        <span className="rounded-full bg-slate-900 px-1.5 py-0.2 text-[10px] text-blue-300">
                            #{selectedIndex + 1}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('concepts')}
                        className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                            activeTab === 'concepts'
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                        data-testid="tab-concepts"
                    >
                        <span>🧠</span>
                        <span>Concepts en Erreur</span>
                        {mistakeIndices.length > 0 && (
                            <span className="rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 text-[10px]">
                                {mistakeIndices.length}
                            </span>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('table')}
                        className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                            activeTab === 'table'
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                        data-testid="tab-table"
                    >
                        <span>📋</span>
                        <span>Table des Coups</span>
                    </button>
                </div>

                {/* 3. Corps de l'onglet actif avec défilement */}
                <div className="p-4 sm:p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-170px)]">
                    {/* ONGLET 1 : SYNTHÈSE & COURBE D'ÉQUITÉ */}
                    {activeTab === 'overview' && (
                        <div className="space-y-5 animate-in fade-in">
                            {/* Cartes Clés : PR & Elo Estimé */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {/* PR Card */}
                                <div className="rounded-2xl border border-blue-500/40 bg-gradient-to-br from-blue-950/50 to-slate-900 p-4 relative overflow-hidden">
                                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                                        Performance Rating (PR)
                                    </span>
                                    <div className="mt-2 flex items-baseline gap-2">
                                        <span
                                            className="text-3xl sm:text-4xl font-extrabold font-mono text-white"
                                            data-testid="review-pr-value"
                                        >
                                            {analysis.performanceRating}
                                        </span>
                                        <span className="rounded-full border border-blue-400/40 bg-blue-500/20 px-2 py-0.5 text-xs font-bold text-blue-300">
                                            {analysis.prCategory}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-[11px] text-slate-400">
                                        Erreur moyenne : -{analysis.errorRate} ΔEq / coup
                                    </p>
                                </div>

                                {/* Elo Estimé Card */}
                                <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-950/40 to-slate-900 p-4">
                                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                                        Niveau Elo Estimé
                                    </span>
                                    <div className="mt-2 flex items-baseline gap-2">
                                        <span
                                            className="text-3xl sm:text-4xl font-extrabold font-mono text-amber-300"
                                            data-testid="review-elo-value"
                                        >
                                            {analysis.estimatedRating}
                                        </span>
                                        <span className="text-xs text-amber-400/80 font-bold">Elo</span>
                                    </div>
                                    <p className="mt-1 text-[11px] text-slate-400">
                                        Étalonnage compétitif officiel WBF / Galaxy
                                    </p>
                                </div>

                                {/* Résultat Manche Card */}
                                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 flex flex-col justify-between">
                                    <div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                            Issue du match
                                        </span>
                                        <p className="mt-1 text-sm font-bold text-white">
                                            {analysis.winner === analysis.player ? '🎉 Victoire Joueur X' : 'Defaite Joueur X'}
                                        </p>
                                    </div>
                                    <div className="text-xs text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2 mt-2">
                                        <span>Score : {analysis.scoreX} - {analysis.scoreO}</span>
                                        <span>{analysis.unforcedDecisionsCount} décisions libres</span>
                                    </div>
                                </div>
                            </div>

                            {/* Courbe d'équité interactive */}
                            <EquityCurveChart
                                moves={evaluatedMoves}
                                selectedIndex={selectedIndex}
                                onSelectIndex={(idx) => {
                                    setSelectedIndex(idx);
                                    setActiveTab('step_by_step');
                                }}
                            />

                            {/* Jauge de Répartition des Coups */}
                            <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                                <div className="flex items-center justify-between text-xs mb-2">
                                    <span className="font-semibold text-slate-300">
                                        Répartition de la qualité des décisions ({analysis.unforcedDecisionsCount})
                                    </span>
                                </div>

                                <div className="flex h-3 w-full rounded-full overflow-hidden bg-slate-800">
                                    {analysis.breakdown.optimal > 0 && (
                                        <div
                                            title={`Optimal : ${analysis.breakdown.optimal}`}
                                            className="bg-emerald-500 transition-all duration-300"
                                            style={{
                                                width: `${(analysis.breakdown.optimal / totalDecisions) * 100}%`,
                                            }}
                                        />
                                    )}
                                    {analysis.breakdown.acceptable > 0 && (
                                        <div
                                            title={`Acceptable : ${analysis.breakdown.acceptable}`}
                                            className="bg-teal-500 transition-all duration-300"
                                            style={{
                                                width: `${(analysis.breakdown.acceptable / totalDecisions) * 100}%`,
                                            }}
                                        />
                                    )}
                                    {analysis.breakdown.doubtful > 0 && (
                                        <div
                                            title={`Douteux : ${analysis.breakdown.doubtful}`}
                                            className="bg-amber-500 transition-all duration-300"
                                            style={{
                                                width: `${(analysis.breakdown.doubtful / totalDecisions) * 100}%`,
                                            }}
                                        />
                                    )}
                                    {analysis.breakdown.blunder > 0 && (
                                        <div
                                            title={`Blunder : ${analysis.breakdown.blunder}`}
                                            className="bg-rose-500 transition-all duration-300"
                                            style={{
                                                width: `${(analysis.breakdown.blunder / totalDecisions) * 100}%`,
                                            }}
                                        />
                                    )}
                                    {analysis.breakdown.howler > 0 && (
                                        <div
                                            title={`Howler : ${analysis.breakdown.howler}`}
                                            className="bg-red-600 transition-all duration-300"
                                            style={{
                                                width: `${(analysis.breakdown.howler / totalDecisions) * 100}%`,
                                            }}
                                        />
                                    )}
                                </div>

                                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                                    <span className="flex items-center gap-1.5 text-emerald-300">
                                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                        Optimal : <strong>{analysis.breakdown.optimal}</strong>
                                    </span>
                                    <span className="flex items-center gap-1.5 text-teal-300">
                                        <span className="h-2 w-2 rounded-full bg-teal-500" />
                                        Acceptable : <strong>{analysis.breakdown.acceptable}</strong>
                                    </span>
                                    <span className="flex items-center gap-1.5 text-amber-300">
                                        <span className="h-2 w-2 rounded-full bg-amber-500" />
                                        Douteux : <strong>{analysis.breakdown.doubtful}</strong>
                                    </span>
                                    <span className="flex items-center gap-1.5 text-rose-300">
                                        <span className="h-2 w-2 rounded-full bg-rose-500" />
                                        Blunder : <strong>{analysis.breakdown.blunder}</strong>
                                    </span>
                                    {analysis.breakdown.howler > 0 && (
                                        <span className="flex items-center gap-1.5 text-red-300">
                                            <span className="h-2 w-2 rounded-full bg-red-600" />
                                            Howler : <strong>{analysis.breakdown.howler}</strong>
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ONGLET 2 : NAVIGATION COUP PAR COUP SUR PLATEAU */}
                    {activeTab === 'step_by_step' && currentTurn && (
                        <div className="space-y-4 animate-in fade-in">
                            <ReviewBoardPreview
                                turn={currentTurn}
                                currentIndex={selectedIndex}
                                totalTurns={totalMoves}
                                onPrev={() => setSelectedIndex((i) => Math.max(0, i - 1))}
                                onNext={() => setSelectedIndex((i) => Math.min(totalMoves - 1, i + 1))}
                                onFirst={() => setSelectedIndex(0)}
                                onLast={() => setSelectedIndex(totalMoves - 1)}
                                onPrevMistake={handlePrevMistake}
                                onNextMistake={handleNextMistake}
                                hasPrevMistake={hasPrevMistake}
                                hasNextMistake={hasNextMistake}
                                onSelectIndex={(idx) => setSelectedIndex(idx)}
                            />

                            {/* Courbe miniature synchronisée pour saut direct */}
                            <div className="pt-2">
                                <EquityCurveChart
                                    moves={evaluatedMoves}
                                    selectedIndex={selectedIndex}
                                    onSelectIndex={(idx) => setSelectedIndex(idx)}
                                />
                            </div>
                        </div>
                    )}

                    {/* ONGLET 3 : CONCEPTS EN ERREUR */}
                    {activeTab === 'concepts' && (
                        <div className="animate-in fade-in">
                            <ConceptsErrorSummary
                                moves={evaluatedMoves}
                                onSelectMoveIndex={(idx) => {
                                    setSelectedIndex(idx);
                                    setActiveTab('step_by_step');
                                }}
                            />
                        </div>
                    )}

                    {/* ONGLET 4 : TABLEAU COMPLET DES COUPS */}
                    {(activeTab === 'table' || activeTab === 'overview') && (
                        <div className="pt-2">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    <span>📋</span>
                                    <span>Inspection Coup par Coup ({movesToShow.length})</span>
                                </h3>

                                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                                    <button
                                        type="button"
                                        onClick={() => setFilterOnlyMistakes(false)}
                                        className={`px-3 py-1 rounded-lg font-medium transition ${
                                            !filterOnlyMistakes
                                                ? 'bg-slate-800 text-white shadow'
                                                : 'text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        Tous les coups ({evaluatedMoves.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFilterOnlyMistakes(true)}
                                        className={`px-3 py-1 rounded-lg font-medium transition ${
                                            filterOnlyMistakes
                                                ? 'bg-rose-900/60 text-rose-200 border border-rose-700/50 shadow'
                                                : 'text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        Erreurs uniquement (
                                        {analysis.breakdown.doubtful +
                                            analysis.breakdown.blunder +
                                            analysis.breakdown.howler}
                                        )
                                    </button>
                                </div>
                            </div>

                            {movesToShow.length === 0 ? (
                                <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-6 text-center text-xs text-slate-400">
                                    Aucune faute à afficher dans cette sélection. Jeu exemplaire !
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-slate-800 bg-slate-950/40 overflow-hidden">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-slate-900/80 text-[11px] text-slate-400 uppercase tracking-wider border-b border-slate-800">
                                            <tr>
                                                <th className="p-3">#</th>
                                                <th className="p-3">Dés</th>
                                                <th className="p-3">Coup Joué</th>
                                                <th className="p-3">Optimal GNUBG</th>
                                                <th className="p-3 text-right">Perte (ΔEq)</th>
                                                <th className="p-3 text-center">Verdict</th>
                                                <th className="p-3 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/60 font-mono">
                                            {movesToShow.map((m, idx) => {
                                                const badge = verdictBadges[m.verdict];
                                                const originalIndex = evaluatedMoves.findIndex(
                                                    (orig) => orig.moveNumber === m.moveNumber,
                                                );
                                                return (
                                                    <tr
                                                        key={idx}
                                                        className="hover:bg-slate-900/50 transition-colors"
                                                    >
                                                        <td className="p-3 text-slate-400 font-sans">
                                                            {m.moveNumber}
                                                        </td>
                                                        <td className="p-3 text-amber-300 font-bold">
                                                            [{m.dice[0]}, {m.dice[1]}]
                                                        </td>
                                                        <td className="p-3 text-white font-bold">
                                                            {m.playedNotation}
                                                        </td>
                                                        <td className="p-3 text-emerald-400">
                                                            {m.optimalNotation}
                                                        </td>
                                                        <td
                                                            className={`p-3 text-right font-bold ${
                                                                m.equityLoss === 0
                                                                    ? 'text-slate-400'
                                                                    : 'text-rose-400'
                                                            }`}
                                                        >
                                                            {m.equityLoss === 0
                                                                ? '0.000'
                                                                : m.equityLoss.toFixed(3)}
                                                        </td>
                                                        <td className="p-3 text-center font-sans">
                                                            <span
                                                                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                                                            >
                                                                {badge.label}
                                                            </span>
                                                        </td>
                                                        <td className="p-3 text-right font-sans">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    if (originalIndex >= 0) {
                                                                        setSelectedIndex(originalIndex);
                                                                        setActiveTab('step_by_step');
                                                                    }
                                                                }}
                                                                className="rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-[11px] font-semibold text-slate-200 transition"
                                                            >
                                                                Inspecter ➔
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* 4. Barre d'action inférieure */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 p-4 bg-slate-950/80">
                    <a
                        href="/drills"
                        className="rounded-xl border border-amber-500/50 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 px-4 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/30 transition shadow-sm flex items-center gap-1.5"
                    >
                        <span>🎯</span>
                        <span>Rejouer mes erreurs en Drill</span>
                    </a>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                impactLight();
                                shareGameResult({
                                    winner: analysis.winner || 'X',
                                    pointsWon: analysis.pointsWon || 1,
                                    winType: analysis.winType || 'single',
                                    scoreX: analysis.scoreX,
                                    scoreO: analysis.scoreO,
                                    matchLength: analysis.matchLength,
                                }).catch(() => {});
                            }}
                            className="rounded-xl border border-blue-500/40 bg-blue-950/40 px-3.5 py-2 text-xs font-bold text-blue-300 hover:bg-blue-900/40 transition flex items-center gap-1.5"
                        >
                            <span>📤</span>
                            <span>Partager</span>
                        </button>

                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
                        >
                            Fermer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
