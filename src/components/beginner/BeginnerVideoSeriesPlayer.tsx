'use client';

/**
 * @file src/components/beginner/BeginnerVideoSeriesPlayer.tsx
 * @description Ré-exportation et adaptation vers BeginnerAcademyAnimatedPlayer
 * avec plateau SVG cinématique temps réel.
 * Strictement <= 40 lignes, 0 `any`.
 */

import React from 'react';
import {
  BeginnerAcademyAnimatedPlayer,
  BeginnerAcademyAnimatedPlayerProps,
} from './BeginnerAcademyAnimatedPlayer';

export type BeginnerVideoSeriesPlayerProps = BeginnerAcademyAnimatedPlayerProps;

export const BeginnerVideoSeriesPlayer: React.FC<BeginnerVideoSeriesPlayerProps> = (props) => {
  return <BeginnerAcademyAnimatedPlayer {...props} />;
};

export default BeginnerVideoSeriesPlayer;
