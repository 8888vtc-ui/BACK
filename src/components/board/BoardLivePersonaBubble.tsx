'use client';

/**
 * Bulle de réaction incarnée du Bot sur le plateau Plein Écran (`BoardLivePersonaBubble.tsx`).
 * Applique l'orchestration « Façon Elon Musk » (`resolveMuskBotOrchestration`) :
 * - Silence absolu pendant que le joueur réfléchit (`isPlayerThinking === true`).
 * - Affiche uniquement les moments forts : Salutation d'ouverture, Huge Joker (`⚡ Karma Swap !`)
 *   ou Alerte Tuteur sur Blunder (`↩️ Reprendre`).
 * Strictement < 120 lignes, 0 any.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { AIDifficulty } from '../../engine/aiHeuristics';
import { getBotPersona, readStoredExperienceMode } from '../../features/personas/botPersonas';
import { useTranslation } from '../../i18n';
import {
    detectClassicalBlunderPattern,
    resolveMuskBotOrchestration,
} from '../../features/personas/botEcosystemEngine';
import { BotPortraitMedallion } from '../common/MonteCarloIcons';

const VARIED_BLUNDER_COMMENTS: ReadonlyArray<string> = [
    'Attention à la structure : garder tes portes connectées te donnera bien plus d’options au prochain tour.',
    'Ce coup laisse une fenêtre de tir directe : pense à sécuriser ton blot avant d’ouvrir le jeu.',
    'En gardant tes pions groupés, tu contrôles beaucoup mieux le centre du plateau.',
    'Un coup tentant, mais consolider ton jan intérieur était encore plus fort ici !',
    'Prends une seconde pour compter les dés adverses qui frappent avant d’avancer seul.',
    'La course et le contact demandent deux plans différents : ici, la solidité primait.',
];

const VARIED_DOUBLE_JOKER_COMMENTS: ReadonlyArray<string> = [
    'Les dés sourient à l’audace sur ce jet ! Voyons comment tu vas riposter.',
    'Un joli double au bon moment… mais la partie est encore longue !',
    'La roue tourne vite au Backgammon : garde ton sang-froid sur le prochain lancer.',
    'Beau tempo sur ces dés, à toi de trouver la parade tactique !',
    'Les doublés changent la course en un éclair, restons concentrés.',
];

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
    const [isMuted, setIsMuted] = useState<boolean>(false);
    const shownTextsRef = useRef<Set<string>>(new Set());
    const lastSpokenTurnRef = useRef<number>(-99);
    const lastBoardBeforeSigRef = useRef<string>('');
    const lastOpponentDiceSigRef = useRef<string>('');
    const { locale } = useTranslation();
    const persona = getBotPersona(difficulty, locale);
    const mode = readStoredExperienceMode();

    useEffect(() => {
        if (turnsCount === 0) {
            shownTextsRef.current.clear();
            lastSpokenTurnRef.current = -99;
            lastBoardBeforeSigRef.current = '';
            lastOpponentDiceSigRef.current = '';
        }
    }, [turnsCount]);

    const bubbleState = useMemo(() => {
        if (isPlayerThinking) return null;

        if (turnsCount === 0) {
            const openText = persona.dialogues.opening[mode];
            return {
                key: `opening-${difficulty}`,
                text: openText,
                showKarmaSwap: false,
                showReplay: false,
            };
        }

        // Anti-spam : au moins 4 tours d'écart entre deux bulles au cours d'une même partie
        if (turnsCount - lastSpokenTurnRef.current < 4) {
            return null;
        }

        const boardSig = boardBefore ? boardBefore.join(',') : '';
        const boardAfterSig = boardAfter ? boardAfter.join(',') : '';
        const isBotBlockedOnBar = Boolean(boardAfter && (boardAfter[25] ?? 0) < 0 && boardSig === boardAfterSig);
        const diceSig = opponentDice ? `${turnsCount}:${opponentDice[0]}-${opponentDice[1]}` : '';
        const isBotDoubleJoker = Boolean(
            !isBotBlockedOnBar &&
            opponentDice &&
            opponentDice[0] === opponentDice[1] &&
            diceSig !== lastOpponentDiceSigRef.current,
        );
        const absLoss = Math.abs(equityLoss ?? 0);
        const isPlayerBlunder =
            (verdict === 'blunder' || verdict === 'error') &&
            absLoss >= 0.08 &&
            boardSig.length > 0 &&
            boardSig !== lastBoardBeforeSigRef.current;

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
                let candidateText = decision.parsedMessage.cleanText;
                if (shownTextsRef.current.has(candidateText)) {
                    const pool = isPlayerBlunder ? VARIED_BLUNDER_COMMENTS : VARIED_DOUBLE_JOKER_COMMENTS;
                    const unseen = pool.find((line) => !shownTextsRef.current.has(line));
                    if (!unseen) return null;
                    candidateText = unseen;
                }
                shownTextsRef.current.add(candidateText);
                lastSpokenTurnRef.current = turnsCount;
                if (isPlayerBlunder) lastBoardBeforeSigRef.current = boardSig;
                if (isBotDoubleJoker) lastOpponentDiceSigRef.current = diceSig;

                return {
                    key: `musk-${turnsCount}-${isPlayerBlunder ? 'blunder' : 'joker'}`,
                    text: candidateText,
                    showKarmaSwap: decision.showKarmaSwapCta,
                    showReplay: decision.showOneTapReplayCta,
                };
            }
        }

        return null;
    }, [isPlayerThinking, opponentDice, equityLoss, verdict, boardBefore, boardAfter, difficulty, mode, turnsCount, persona, locale]);

    useEffect(() => {
        if (!bubbleState || turnsCount === 0) return;
        const timer = setTimeout(() => {
            setDismissedKey(bubbleState.key);
        }, 4500);
        return () => clearTimeout(timer);
    }, [bubbleState, turnsCount]);

    if (!bubbleState || dismissedKey === bubbleState.key || isMuted) return null;

    return (
        <div
            data-testid="board-bot-speech-bubble"
            className="fixed top-[4.5rem] sm:top-14 left-1/2 -translate-x-1/2 z-30 flex [@media(max-height:500px)]:hidden items-center gap-2 sm:gap-2.5 rounded-2xl border border-[#d4af37]/45 bg-[#120e09]/95 px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs text-[#f7f3e8] shadow-[0_10px_28px_rgba(0,0,0,0.85)] backdrop-blur-md max-w-[94vw] sm:max-w-md animate-in fade-in duration-200"
        >
            <BotPortraitMedallion character={difficulty} size="sm" isActive />
            <div className="min-w-0 flex-1 leading-snug">
                <span className="font-bold text-[#f3c65f] mr-1.5">{persona.shortName} :</span>
                <span className="text-[11px] text-amber-100/95 line-clamp-2 italic">« {bubbleState.text} »</span>
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
                data-testid="board-bot-mute-btn"
                title="Mode Zen : couper les bulles du Bot"
                aria-label="Couper les bulles du Bot"
                onClick={() => setIsMuted(true)}
                className="shrink-0 text-[11px] text-stone-400 hover:text-amber-300 px-1"
            >
                🔇
            </button>
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

