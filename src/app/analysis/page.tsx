import React from 'react';
import type { Metadata } from 'next';
import AnalysisStudioView from '../../components/analysis/AnalysisStudioView';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import { ProductionVelvetRouteGuard } from '../../components/lobby/LobbyPlayerHubSection';

export const metadata: Metadata = {
  title: 'Studio d\'Analyse Backgammon — Scanner XGID & Évaluation 3-Ply Open Sage',
  description: 'Laboratoire d\'analyse tactique de positions de Backgammon 3-ply avec matrice de probabilités neuronales et explications stratégiques.',
};

export default function AnalysisStudioPage() {
  return (
    <ProductionVelvetRouteGuard>
      <main className="flex h-dvh max-h-dvh w-screen overflow-hidden flex-col items-center bg-[#050505] text-[#fdf8eb]">
        <ErrorBoundary name="Studio d'Analyse">
          <AnalysisStudioView />
        </ErrorBoundary>
      </main>
    </ProductionVelvetRouteGuard>
  );
}

