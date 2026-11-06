'use client';

/**
 * @file src/components/academy/BeginnerCourseVideoPlayer.tsx
 * @description Données des missions plateau + Lecteur vidéo Masterclass 5 chapitres pour `BeginnerInteractiveRulesCourse.tsx` (< 180 lignes, 0 any).
 */

import React from 'react';

export interface InteractiveBoardMission {
    readonly optimalMove: string;
    readonly highlightedPoints: ReadonlyArray<number>;
    readonly prompt: string;
    readonly successFeedback: string;
    readonly videoScriptBefore: string;
    readonly videoScriptAfter: string;
    readonly delta: Readonly<Record<number, number>>;
}

export const LESSON_BOARD_MISSIONS: Readonly<Record<string, InteractiveBoardMission>> = {
    'lesson-1-horseshoe': {
        optimalMove: '8/5 6/5',
        highlightedPoints: [8, 6, 5],
        prompt: '👆 Touchez la Case 5 (ou 8 / 6) sur le plateau pour avancer 2 dames et bâtir votre 1re Porte !',
        successFeedback: '✨ Coup joué sur le plateau (8/5 6/5) ! Vos deux dames se rejoignent sur la Case 5 en avançant vers votre Maison.',
        videoScriptBefore: 'Chapitre 1 sur 5 — Le Sens de Marche : vos 15 dames claires partent de la case 24 et descendent en fer à cheval jusqu’à votre Maison, cases 6 à 1.',
        videoScriptAfter: 'Regardez le plateau : avec le 3 et le 1, la dame de la case 8 et celle de la case 6 rejoignent la case 5 pour former votre première Porte !',
        delta: { 8: -1, 6: -1, 5: 2 },
    },
    'lesson-2-dice-doubles': {
        optimalMove: '24/18 13/7',
        highlightedPoints: [24, 18, 13, 7],
        prompt: '👆 Touchez la Case 18 ou 7 sur le plateau pour jouer votre Double 6 Turbo (4 déplacements de 6 cases) !',
        successFeedback: '🚀 Turbo Double 6 exécuté sur le plateau ! Vos 2 dames du fond (24→18) et 2 dames du milieu (13→7) ont bondi de 24 cases au total.',
        videoScriptBefore: 'Chapitre 2 sur 5 — Les Dés et les Doubles : au Backgammon, tirer deux dés identiques comme Double 6 vous offre quatre déplacements de 6 cases !',
        videoScriptAfter: 'Animation du Double 6 : vos deux dames du fond bondissent de 24 en 18, et deux dames du point 13 avancent en 7. Soit 24 cases d’un seul coup !',
        delta: { 24: -2, 18: 2, 13: -2, 7: 2 },
    },
    'lesson-3-doors-and-hits': {
        optimalMove: '6/3 6/5',
        highlightedPoints: [6, 5, 3, 1],
        prompt: '👆 Touchez la Case 5 (Porte blindée 🛡️) ou la Case 1 (Pion adverse isolé ⚠️) sur le plateau !',
        successFeedback: '🏰 Bien vu sur le plateau ! Vos Portes (2+ dames) forment un bouclier imprenable tandis que le pion adverse isolé est envoyé sur la Barre.',
        videoScriptBefore: 'Chapitre 3 sur 5 — Portes et Frappes : deux dames sur la même flèche créent une Porte infranchissable. Une dame seule est un pion isolé vulnérable.',
        videoScriptAfter: 'Exécution : vous consolidez vos portes en 5 et 3 tandis que le pion adverse isolé est frappé et envoyé en prison sur la Barre centrale !',
        delta: { 6: -2, 5: 1, 3: 1 },
    },
    'lesson-4-bearoff': {
        optimalMove: '6/0 4/0',
        highlightedPoints: [6, 4],
        prompt: '👆 Touchez la Case 6 ou la Case 4 sur le plateau pour sortir 2 dames hors du tablier avec le 6 et le 4 !',
        successFeedback: '🏁 Sortie effectuée sur le plateau ! Vos dames des cases 6 et 4 rejoignent le râtelier de victoire.',
        videoScriptBefore: 'Chapitre 4 sur 5 — La Sortie des Dames : dès que vos 15 dames sont toutes réunies dans votre Maison (cases 1 à 6), vous pouvez les sortir du plateau.',
        videoScriptAfter: 'Avec les dés 6 et 4, vos dames des cases 6 et 4 sortent définitivement hors du tablier : le premier qui sort ses 15 dames gagne !',
        delta: { 6: -1, 4: -1 },
    },
    'lesson-5-cube-and-gammon': {
        optimalMove: '3/0 2/0',
        highlightedPoints: [3, 2],
        prompt: '👆 Touchez la Case 3 ou la Case 2 sur le plateau pour vider votre Maison et décrocher le Gammon (x2) !',
        successFeedback: '💎 Coup gagnant simulé sur le plateau ! Vous sortez vos dames avant que l’adversaire n’en ait sorti une seule : c’est un Gammon (2 pts) !',
        videoScriptBefore: 'Chapitre 5 sur 5 — Le Videau et le Gammon : tournez le dé multiplicateur sur 2 pour doubler les enjeux, ou sortez tout avant l’adversaire pour un Gammon !',
        videoScriptAfter: 'Victoire par Gammon sur le plateau : vos dernières dames des cases 3 et 2 sortent alors que l’adversaire n’en a sorti aucune. Vous marquez double !',
        delta: { 3: -1, 2: -1 },
    },
};

export function speakNarration(text: string, enabled: boolean): void {
    if (!enabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'fr-FR';
        utterance.rate = 1.04;
        window.speechSynthesis.speak(utterance);
    } catch {
        // Ignore speech synthesis errors
    }
}

export interface BeginnerMasterclassVideoPlayerProps {
    readonly isVideoPlaying: boolean;
    readonly isVoiceEnabled: boolean;
    readonly activeStepIdx: number;
    readonly isBoardSimulated: boolean;
    readonly videoStepProgressPct: number;
    readonly activeVideoSubtitle: string;
    readonly onToggleVideo: () => void;
    readonly onToggleVoice: () => void;
}

export const BeginnerMasterclassVideoPlayer: React.FC<BeginnerMasterclassVideoPlayerProps> = ({
    isVideoPlaying,
    isVoiceEnabled,
    activeStepIdx,
    isBoardSimulated,
    videoStepProgressPct,
    activeVideoSubtitle,
    onToggleVideo,
    onToggleVoice,
}) => (
    <div
        data-testid="beginner-masterclass-video-player"
        className="rounded-2xl border border-[#f3c65f]/50 bg-gradient-to-r from-[#140e05] via-[#0e1525] to-[#140e05] p-3.5 sm:p-4 shadow-[0_0_24px_rgba(243,198,95,0.15)] space-y-2.5"
    >
        <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
                <button
                    type="button"
                    onClick={onToggleVideo}
                    data-testid="masterclass-play-pause-btn"
                    className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-xs sm:text-sm font-black uppercase tracking-wider shadow transition ${
                        isVideoPlaying
                            ? 'border-amber-300 bg-amber-400 text-slate-950'
                            : 'border-[#f3c65f] bg-gradient-to-r from-amber-500/30 to-yellow-500/20 text-[#fef08a] hover:brightness-110'
                    }`}
                >
                    <span>{isVideoPlaying ? '⏸ Pause Vidéo' : '🎬 Lancer la Vidéo Complète (5 Chapitres)'}</span>
                </button>
                <button
                    type="button"
                    onClick={onToggleVoice}
                    data-testid="masterclass-voice-toggle-btn"
                    className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${
                        isVoiceEnabled ? 'border-emerald-400/60 bg-emerald-950/60 text-emerald-200' : 'border-white/10 bg-white/5 text-slate-400'
                    }`}
                >
                    {isVoiceEnabled ? '🔊 Voix-Off ON' : '🔇 Muet'}
                </button>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-amber-300">
                <span>Chapitre {activeStepIdx + 1}/5 · {isBoardSimulated ? 'Coup en cours' : 'Position initiale'}</span>
                <span className="rounded bg-white/10 px-2 py-0.5 text-[11px] font-bold text-white">{videoStepProgressPct}%</span>
            </div>
        </div>

        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
                className="h-full bg-gradient-to-r from-amber-400 via-yellow-300 to-emerald-400 transition-all duration-500"
                style={{ width: `${videoStepProgressPct}%` }}
            />
        </div>

        <div
            data-testid="masterclass-video-subtitles"
            className="rounded-xl border border-white/10 bg-black/60 px-3.5 py-2 text-xs sm:text-sm font-medium text-amber-100 leading-relaxed flex items-center gap-2"
        >
            <span className="text-amber-400 shrink-0">🎙️</span>
            <span>{activeVideoSubtitle}</span>
        </div>
    </div>
);

