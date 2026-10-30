'use client';

/**
 * Bulle de réaction incarnée du Bot sur le plateau Plein Écran (`BoardLivePersonaBubble.tsx`).
 * Applique l'orchestration « Façon Elon Musk » (`resolveMuskBotOrchestration`) :
 * - Silence absolu pendant que le joueur réfléchit (`isPlayerThinking === true`).
 * - Affiche uniquement les moments forts : Salutation d'ouverture, Huge Joker (`⚡ Karma Swap !`)
 *   ou Alerte Tuteur sur Blunder (`↩️ Reprendre`).
 * Strictement < 120 lignes, 0 any.
 */

import React, { useMemo, useState } from 'react';
import type { AIDifficulty } from '../../engine/aiHeuristics';
import { getBotPersona, readStoredExperienceMode } from '../../features/personas/botPersonas';
import { useTranslation } from '../../i18n';
import {
    detectClassicalBlunderPattern,
    resolveMuskBotOrchestration,
} from '../../features/personas/botEcosystemEngine';

export interface BoardLivePersonaBubbleProps {
    readonly difficulty?: AIDifficulty;
    readonly isPlayerThinking: boolean;
    readonly turnsCount: number;
    readonly verdict?: string | null;
    readonly equityLoss?: number | null;
    readonly boardBefore?: readonly number[];
    readonly boardAfter?: readonly number[];
    readonly opponentDice?: [number, number] | null;
    readonly onReplayMove?: () => void;
    readonly onOpenCoach?: () => void;
}

const BoardLivePersonaBubbleComponent: React.FC<BoardLivePersonaBubbleProps> = ({
    difficulty = 'expert',
    isPlayerThinking,
    turnsCount,
    verdict,
    equityLoss,
    boardBefore,
    boardAfter,
    opponentDice,
    onReplayMove,
    onOpenCoach,
}) => {
    const [dismissedKey, setDismissedKey] = useState<string | null>(null);
    const { locale } = useTranslation();
    const persona = getBotPersona(difficulty, locale);
    const mode = readStoredExperienceMode();

    const bubbleState = useMemo(() => {
        if (isPlayerThinking) return null;

        const isBotDoubleJoker = Boolean(opponentDice && opponentDice[0] === opponentDice[1]);
        const absLoss = Math.abs(equityLoss ?? 0);
        const isPlayerBlunder = (verdict === 'blunder' || verdict === 'error') && absLoss >= 0.08;

        if (isPlayerBlunder || isBotDoubleJoker) {
            const pattern =
                boardBefore && boardAfter
                    ? detectClassicalBlunderPattern({ boardBefore, boardAfter })
                    : 'GENERAL_POSITIONAL_LOSS';
            const decision = resolveMuskBotOrchestration({
                isPlayerThinking: false,
                difficulty,
                mode,
                actor: isPlayerBlunder ? 'player' : 'bot',
                equityLossEmg: isPlayerBlunder ? absLoss : 0,
                pattern,
                luckDeltaEquity: isBotDoubleJoker ? 0.65 : 0,
                locale: locale as 'fr' | 'en' | 'es' | 'pt' | 'de' | 'ar' | 'ja',
            });
            if (decision.shouldSpeak && decision.parsedMessage) {
                return {
                    key: `musk-${turnsCount}-${verdict ?? 'joker'}-${opponentDice?.join('-') ?? ''}`,
                    text: decision.parsedMessage.cleanText,
                    showKarmaSwap: decision.showKarmaSwapCta,
                    showReplay: decision.showOneTapReplayCta,
                };
            }
        }

        if (turnsCount === 0) {
            return {
                key: `opening-${difficulty}`,
                text: persona.dialogues.opening[mode],
                showKarmaSwap: false,
                showReplay: false,
            };
        }

        return null;
    }, [isPlayerThinking, opponentDice, equityLoss, verdict, boardBefore, boardAfter, difficulty, mode, turnsCount, persona, locale]);

    if (!bubbleState || dismissedKey === bubbleState.key) return null;

    return (
        <div
            data-testid="board-bot-speech-bubble"
            className="sr-only"
        >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-slate-900 text-base">
                {persona.avatar}
            </span>
            <div className="min-w-0 flex-1 leading-snug">
                <span className="font-bold text-[#f3c65f] mr-1.5">{persona.shortName} :</span>
                <span className="text-[11px] text-slate-200 line-clamp-2">{bubbleState.text}</span>
            </div>
            {bubbleState.showReplay && onReplayMove && (
                <button
                    type="button"
                    data-testid="board-bot-replay-cta"
                    onClick={onReplayMove}
                    className="shrink-0 rounded-lg border border-amber-400/70 bg-amber-500/20 px-2 py-1 text-[11px] font-bold text-amber-200 hover:bg-amber-500/30 transition"
                >
                    ↩️ Reprendre
                </button>
            )}
            {bubbleState.showKarmaSwap && onOpenCoach && (
                <button
                    type="button"
                    data-testid="board-bot-karma-swap-cta"
                    onClick={onOpenCoach}
                    className="shrink-0 rounded-lg border border-emerald-400/70 bg-emerald-500/20 px-2 py-1 text-[11px] font-bold text-emerald-200 hover:bg-emerald-500/30 transition"
                >
                    ⚡ Karma Swap !
                </button>
            )}
            <button
                type="button"
                aria-label="Fermer la bulle du Bot"
                onClick={() => setDismissedKey(bubbleState.key)}
                className="shrink-0 text-[11px] text-slate-400 hover:text-white px-1"
            >
                ✕
            </button>
        </div>
    );
};

export const BoardLivePersonaBubble = React.memo(BoardLivePersonaBubbleComponent);
export default BoardLivePersonaBubble;

