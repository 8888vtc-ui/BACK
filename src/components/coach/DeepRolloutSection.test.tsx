// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import DeepRolloutSection from './DeepRolloutSection';
import * as rolloutClient from '../../lib/engine/rolloutClient';

describe('DeepRolloutSection', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('affiche le titre, les coups candidats et les options de trials', () => {
        render(
            <DeepRolloutSection
                playedMove="24/20 13/10"
                optimalMove="8/5 6/5"
            />
        );

        expect(screen.getByText('Rollout Profond Monte-Carlo')).toBeDefined();
        expect(screen.getByText('8/5 6/5')).toBeDefined();
        expect(screen.getByText('24/20 13/10')).toBeDefined();
        expect(screen.getByTestId('trial-opt-324')).toBeDefined();
        expect(screen.getByTestId('trial-opt-1296')).toBeDefined();
        expect(screen.getByTestId('trial-opt-2592')).toBeDefined();
        expect(screen.getByTestId('start-rollout-btn')).toBeDefined();
    });

    it('permet de changer le nombre de trials avant de lancer', () => {
        render(
            <DeepRolloutSection
                playedMove="24/20 13/10"
                optimalMove="8/5 6/5"
            />
        );

        const btn324 = screen.getByTestId('trial-opt-324');
        fireEvent.click(btn324);

        expect(screen.getByTestId('start-rollout-btn').textContent).toContain('324 parties');
    });

    it('affiche la barre de progression en temps réel lors du déroulement du rollout', async () => {
        let streamCallback: any = null;

        vi.spyOn(rolloutClient, 'submitRollout').mockResolvedValue({
            jobId: 'test-job-42',
            status: 'queued',
        });

        vi.spyOn(rolloutClient, 'subscribeRolloutProgress').mockImplementation((_jobId, callbacks) => {
            streamCallback = callbacks;
            return () => {};
        });

        render(
            <DeepRolloutSection
                playedMove="24/20 13/10"
                optimalMove="8/5 6/5"
            />
        );

        const startBtn = screen.getByTestId('start-rollout-btn');
        fireEvent.click(startBtn);

        await waitFor(() => {
            expect(rolloutClient.submitRollout).toHaveBeenCalled();
        });

        // Simulation d'une mise à jour de progression à 50%
        act(() => {
            streamCallback.onProgress({
                jobId: 'test-job-42',
                status: 'running',
                progress: 50.0,
                trialsDone: 648,
                totalTrials: 1296,
                currentMove: '8/5 6/5',
                etaSeconds: 2.1,
            });
        });

        expect(screen.getByTestId('rollout-progress-container')).toBeDefined();
        expect(screen.getByText('50.0%')).toBeDefined();
        expect(screen.getByText('648')).toBeDefined();
        expect(screen.getByTestId('rollout-cancel-btn')).toBeDefined();
    });

    it('permet d annuler un rollout en cours', async () => {
        vi.spyOn(rolloutClient, 'submitRollout').mockResolvedValue({
            jobId: 'test-job-cancel',
            status: 'queued',
        });

        const cancelSpy = vi.spyOn(rolloutClient, 'cancelRollout').mockResolvedValue(true);

        vi.spyOn(rolloutClient, 'subscribeRolloutProgress').mockReturnValue(() => {});

        render(
            <DeepRolloutSection
                playedMove="24/20 13/10"
                optimalMove="8/5 6/5"
            />
        );

        fireEvent.click(screen.getByTestId('start-rollout-btn'));

        await waitFor(() => {
            expect(screen.getByTestId('rollout-cancel-btn')).toBeDefined();
        });

        fireEvent.click(screen.getByTestId('rollout-cancel-btn'));

        await waitFor(() => {
            expect(cancelSpy).toHaveBeenCalledWith('test-job-cancel', '');
            expect(screen.getByTestId('rollout-error-msg').textContent).toContain('Rollout annulé');
        });
    });

    it('affiche le verdict final et la table comparative des résultats statistiques', async () => {
        let streamCallback: any = null;

        vi.spyOn(rolloutClient, 'submitRollout').mockResolvedValue({
            jobId: 'test-job-done',
            status: 'queued',
        });

        vi.spyOn(rolloutClient, 'subscribeRolloutProgress').mockImplementation((_jobId, callbacks) => {
            streamCallback = callbacks;
            return () => {};
        });

        const onCompleted = vi.fn();

        render(
            <DeepRolloutSection
                playedMove="24/20 13/10"
                optimalMove="8/5 6/5"
                onRolloutCompleted={onCompleted}
            />
        );

        fireEvent.click(screen.getByTestId('start-rollout-btn'));

        await waitFor(() => {
            expect(rolloutClient.submitRollout).toHaveBeenCalled();
        });

        // Émission du résultat final
        act(() => {
            streamCallback.onComplete({
                jobId: 'test-job-done',
                xgid: 'XGID=...',
                trials: 1296,
                ply: 2,
                durationSeconds: 1.25,
                confirmedBestMove: '8/5 6/5',
                equityDifference: 0.086,
                moves: [
                    {
                        rank: 1,
                        notation: '8/5 6/5',
                        equity: 0.158,
                        standardError: 0.0062,
                        confidenceInterval: 0.012,
                        probabilities: {
                            win: 0.54,
                            winGammon: 0.162,
                            winBackgammon: 0.006,
                            loseWin: 0.46,
                            loseGammon: 0.122,
                            loseBackgammon: 0.004,
                        },
                        isConfirmed: true,
                        trials: 1296,
                    },
                    {
                        rank: 2,
                        notation: '24/20 13/10',
                        equity: 0.072,
                        standardError: 0.0065,
                        confidenceInterval: 0.013,
                        probabilities: {
                            win: 0.518,
                            winGammon: 0.144,
                            winBackgammon: 0.005,
                            loseWin: 0.482,
                            loseGammon: 0.133,
                            loseBackgammon: 0.005,
                        },
                        isConfirmed: false,
                        trials: 1296,
                    },
                ],
            });
        });

        expect(screen.getByTestId('rollout-results')).toBeDefined();
        expect(screen.getByTestId('rollout-verdict').textContent).toContain('Coup Optimal Confirmé !');
        expect(screen.getByText('+0.158')).toBeDefined();
        expect(screen.getByText('(±0.012)')).toBeDefined();
        expect(onCompleted).toHaveBeenCalled();
    });
});
