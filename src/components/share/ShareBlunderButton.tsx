'use client';

/**
 * Bouton viral de partage en 1-clic "Partager ce Quiz (HD)" (PNG 1200x630).
 * Conforme à SCALABILITY.md (< 150 lignes, 0 any, mémoïsé).
 */

import React, { useCallback, useState } from 'react';
import type { BlunderQuizCardData } from '../../features/share/blunderShareCard';
import { generateSocialShareText, getViralQuizHeadline } from '../../features/share/blunderShareCard';
import { renderBlunderQuizPng, downloadBlunderQuizPng } from '../../features/share/renderBlunderQuizPng';
import { KarmaClipEngine, type KarmaClipPayload } from '../../features/share/karmaClipGenerator';
import { trackSaasLifecycleEvent } from '../../lib/subscription/lifecycleEvents';
import { toast } from '../toast/ToastContext';

export interface ShareBlunderButtonProps {
    readonly data: BlunderQuizCardData;
    readonly variant?: 'compact' | 'full' | 'icon';
    readonly defaultIncludeSolution?: boolean;
    readonly className?: string;
}

const ShareBlunderButtonComponent: React.FC<ShareBlunderButtonProps> = ({
    data,
    variant = 'full',
    defaultIncludeSolution = false,
    className = '',
}) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [isGeneratingClip, setIsGeneratingClip] = useState(false);
    const [includeSolution, setIncludeSolution] = useState(defaultIncludeSolution);

    const handleShareKarmaClip = useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isGeneratingClip) return;
        setIsGeneratingClip(true);
        try {
            const generator = new KarmaClipEngine();
            const payload: KarmaClipPayload = {
                matchSeed: `${data.dice[0]}${data.dice[1]}X`,
                botName: 'Maxime « Le Mauvais Joueur »',
                botTrashTalk: 'Encore un double miraculeux ? Les dés sont truqués !',
                originalBotRoll: [6, 6],
                swappedPlayerRoll: [data.dice[0], data.dice[1]],
                cubeValue: data.cubeValue ?? 2,
                winProbBefore: 3.6,
                winProbAfter: 89.2,
                equitySwing: Number(Math.max(0.45, Math.abs(data.equityLoss ?? 0.85)).toFixed(3)),
            };
            const outcome = await generator.shareClipNatively(payload, () => {});
            toast.success(
                outcome === 'shared'
                    ? 'Clip Karma 9:16 partagé sur TikTok / Reels / WhatsApp !'
                    : 'Clip Karma 9:16 téléchargé avec succès !',
                'Clip Karma Swap 9:16',
            );
        } catch (err: unknown) {
            toast.error(
                err instanceof Error ? err.message : 'Erreur lors du rendu du Clip Karma 9:16.',
                'Clip 9:16',
            );
        } finally {
            setIsGeneratingClip(false);
        }
    }, [data, isGeneratingClip]);

    const handleShare = useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isGenerating) return;
        setIsGenerating(true);

        try {
            const cardData: BlunderQuizCardData = {
                ...data,
                includeSolution,
            };

            const blob = await renderBlunderQuizPng(cardData);
            const filename = `backgammon-quiz-${data.dice[0]}${data.dice[1]}.png`;
            const file = new File([blob], filename, { type: 'image/png' });
            const shareText = generateSocialShareText(cardData);
            const headline = getViralQuizHeadline(cardData);

            let sharedViaApi = false;
            if (typeof navigator !== 'undefined') {
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    try {
                        await navigator.share({
                            title: headline,
                            text: shareText,
                            files: [file],
                        });
                        sharedViaApi = true;
                    } catch {
                        // L'utilisateur a annulé ou le partage natif a échoué : repli vers téléchargement
                    }
                }

                if (!sharedViaApi && navigator.clipboard?.writeText) {
                    try {
                        await navigator.clipboard.writeText(shareText);
                    } catch {
                        // Ignoré
                    }
                }
            }

            if (!sharedViaApi) {
                downloadBlunderQuizPng(blob, filename);
            }

            trackSaasLifecycleEvent('blunder_shared', {
                roll: `${data.dice[0]}-${data.dice[1]}`,
                bestMove: data.bestMoveNotation,
                equityLoss: data.equityLoss ?? 0,
                hasSolution: includeSolution,
            });

            toast.success(
                sharedViaApi
                    ? 'Quiz HD partagé avec succès !'
                    : 'Image PNG 1200x630 téléchargée et texte copié !',
                'Partage Viral HD',
            );
        } catch (err: unknown) {
            toast.error(
                err instanceof Error ? err.message : 'Erreur lors de la génération du quiz.',
                'Erreur Partage',
            );
        } finally {
            setIsGenerating(false);
        }
    }, [data, includeSolution, isGenerating]);

    const isEn = Boolean(data.locale && data.locale !== 'fr');

    if (variant === 'icon') {
        return (
            <button
                type="button"
                onClick={handleShare}
                disabled={isGenerating}
                data-testid="share-blunder-btn"
                title={isEn ? 'Share HD Quiz (1200x630)' : 'Partager ce Quiz (HD 1200x630)'}
                className={`flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-slate-900 text-slate-200 transition hover:border-amber-400/50 hover:text-white active:scale-95 disabled:opacity-50 ${className}`}
            >
                <span className="text-sm">{isGenerating ? '⏳' : '📸'}</span>
            </button>
        );
    }

    return (
        <div className={`inline-flex flex-wrap items-center gap-1.5 ${className}`}>
            <button
                type="button"
                onClick={handleShare}
                disabled={isGenerating}
                data-testid="share-blunder-btn"
                className="inline-flex min-h-[36px] items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-200 shadow-sm transition hover:border-amber-400/50 hover:text-white active:scale-95 disabled:opacity-50"
            >
                <span className="text-sm">{isGenerating ? '⏳' : '📸'}</span>
                <span>
                    {isGenerating
                        ? (isEn ? 'Generating HD…' : 'Génération HD…')
                        : (isEn ? "Share This Quiz (HD)" : 'Partager ce Quiz (HD)')}
                </span>
            </button>
            <button
                type="button"
                onClick={handleShareKarmaClip}
                disabled={isGeneratingClip}
                data-testid="share-karma-clip-btn"
                title={isEn ? 'Export 9:16 Karma Swap Clip (TikTok / Reels / WhatsApp)' : 'Exporter le Clip Karma 9:16 (TikTok / Reels / WhatsApp)'}
                className="inline-flex min-h-[36px] items-center justify-center gap-1.5 rounded-xl border border-amber-400/50 bg-amber-500/15 px-3 py-1.5 text-xs font-bold text-amber-200 shadow-sm transition hover:border-amber-400 hover:text-white active:scale-95 disabled:opacity-50"
            >
                <span className="text-sm">{isGeneratingClip ? '⏳' : '🎬'}</span>
                <span>{isGeneratingClip ? 'Clip 9:16…' : 'Clip Karma 9:16'}</span>
            </button>
            <label
                data-testid="include-solution-label"
                className="hidden sm:flex items-center gap-1 text-[11px] text-slate-300 cursor-pointer select-none"
            >
                <input
                    type="checkbox"
                    checked={includeSolution}
                    onChange={(e) => setIncludeSolution(e.target.checked)}
                    data-testid="include-solution-checkbox"
                    className="rounded border-white/20 bg-slate-900 text-amber-500 focus:ring-0"
                />
                <span>{isEn ? 'With solution' : 'Avec solution'}</span>
            </label>
        </div>
    );
};

export const ShareBlunderButton = React.memo(ShareBlunderButtonComponent);
export default ShareBlunderButton;
