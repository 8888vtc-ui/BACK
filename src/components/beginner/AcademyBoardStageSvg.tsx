'use client';

/**
 * @file src/components/beginner/AcademyBoardStageSvg.tsx
 * @description Plateau cinématique interactif SVG pour la mini-série vidéo d'initiation.
 * Cartouches opaques anti-collision, pions relevés nets, zéro blur.
 * Strictement <= 260 lignes, 0 `any`.
 */

import React from 'react';

export interface AcademyBoardStageSvgProps {
  readonly episodeId: number;
  readonly progress: number; // 0.0 à 1.0
  readonly isEn: boolean;
}

export function getStagePointCoord(pt: number): { x: number; isTop: boolean } {
  if (pt >= 13 && pt <= 18) return { x: 28 + (pt - 13) * 40 + 20, isTop: true };
  if (pt >= 19 && pt <= 24) return { x: 312 + (pt - 19) * 40 + 20, isTop: true };
  if (pt >= 7 && pt <= 12) return { x: 28 + (12 - pt) * 40 + 20, isTop: false };
  return { x: 312 + (6 - pt) * 40 + 20, isTop: false };
}

export const AcademyBoardStageSvg: React.FC<AcademyBoardStageSvgProps> = React.memo(({
  episodeId,
  progress,
  isEn,
}) => {
  // 1. Épisode 1 : Course en fer à cheval
  const ep1Dist = Math.min(1, Math.max(0, (progress - 0.25) / 0.45));
  const ep1CheckerX = ep1Dist < 0.4 ? 532 - (ep1Dist / 0.4) * 480 : ep1Dist < 0.6 ? 48 : 48 + ((ep1Dist - 0.6) / 0.4) * 484;
  const ep1CheckerY = ep1Dist < 0.4 ? 40 : ep1Dist < 0.6 ? 40 + ((ep1Dist - 0.4) / 0.2) * 248 : 288;
  const ep1BorneOff = progress > 0.75 ? Math.min(15, Math.floor((progress - 0.75) * 60)) : 0;

  // 2. Épisode 2 : Construction de porte flèche 5
  const ep2Move = Math.min(1, Math.max(0, (progress - 0.35) / 0.3));
  const ep2White1X = 208 + (372 - 208) * ep2Move;
  const ep2White2X = 332 + (372 - 332) * ep2Move;
  const ep2BlockedBounce = progress > 0.7 ? Math.sin((progress - 0.7) * 20) * 18 : 0;

  // 3. Épisode 3 : Frappe et expulsion vers la barre
  const ep3WhiteMove = Math.min(1, Math.max(0, (progress - 0.3) / 0.25));
  const ep3AttackerX = 532 - (532 - 372) * ep3WhiteMove;
  const ep3AttackerY = 40;
  const ep3HitFly = Math.min(1, Math.max(0, (progress - 0.55) / 0.25));
  const ep3TargetX = 372 - (372 - 290) * ep3HitFly;
  const ep3TargetY = 40 + (170 - 40) * ep3HitFly - Math.sin(ep3HitFly * Math.PI) * 55;

  // 4. Épisode 4 : Mur de prime & 5. Videau
  const ep4WallGates = Math.min(6, Math.floor(progress * 8));
  const ep4JumperBounce = progress > 0.55 ? Math.abs(Math.sin((progress - 0.55) * 22)) * 30 : 0;
  const ep5BorneOff = Math.min(15, Math.floor(progress * 18));
  const ep5CubeScale = progress > 0.5 ? 1 + Math.min(0.5, (progress - 0.5) * 1.5) : 1;

  return (
    <div className="relative w-full aspect-[600/320] max-h-[240px] rounded-xl border border-[#D4AF37]/50 bg-[#07130e] shadow-2xl overflow-hidden">
      <svg
        viewBox="0 0 600 320"
        data-testid="academy-animated-board-svg"
        className="w-full h-full select-none object-contain"
      >
        <defs>
          <marker id="stage-arrow" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
            <polygon points="0 0, 6 3, 0 6" fill="#D4AF37" />
          </marker>
        </defs>

        {/* Tapis de feutre émeraude, barre & sabot de sortie */}
        <rect x="0" y="0" width="600" height="340" fill="#091813" />
        <rect x="276" y="0" width="28" height="340" fill="#040b08" stroke="#D4AF37" strokeOpacity="0.25" />
        <rect x="560" y="0" width="40" height="340" fill="#050e0a" stroke="#D4AF37" strokeOpacity="0.3" />

        {/* 24 Pointes du plateau */}
        {Array.from({ length: 24 }, (_, i) => i + 1).map((pt) => {
          const { x, isTop } = getStagePointCoord(pt);
          return (
            <polygon
              key={pt}
              points={`${x - 18},${isTop ? 0 : 340} ${x + 18},${isTop ? 0 : 340} ${x},${isTop ? 130 : 210}`}
              fill={pt % 2 === 1 ? '#42200f' : '#b28647'}
              opacity={pt <= 6 ? '0.9' : '0.55'}
            />
          );
        })}

        {/* ================= ÉPISODE 1 : SENS DE MARCHE & BUT ULTIME ================= */}
        {episodeId === 1 && (
          <g>
            <path
              d="M 532 40 L 48 40 C 12 40 12 288 48 288 L 532 288"
              fill="none"
              stroke="#D4AF37"
              strokeWidth="5"
              strokeDasharray="12 6"
              strokeLinecap="round"
              opacity="0.85"
            />
            <rect x="306" y="180" width="250" height="135" fill="rgba(16, 185, 129, 0.12)" stroke="#10B981" strokeDasharray="4 4" rx="8" />
            <g transform="translate(430, 200)">
              <rect x="-80" y="-10" width="160" height="20" rx="6" fill="#090B10" fillOpacity="0.94" stroke="#10B981" strokeOpacity="0.4" />
              <text x="0" y="3.5" fill="#34D399" fontSize="11" fontWeight="bold" textAnchor="middle">{isEn ? 'Home Board (Exit)' : 'Votre Maison (Sortie)'}</text>
            </g>

            {progress <= 0.75 ? (
              <g transform={`translate(${ep1CheckerX}, ${ep1CheckerY})`}>
                <circle cx="0" cy="0" r="13" fill="#FAF6EE" stroke="#D4AF37" strokeWidth="2" />
                <circle cx="0" cy="0" r="7" fill="#e5e5e5" />
              </g>
            ) : (
              <g className="animate-bounce" transform="translate(430, 270)">
                <rect x="-80" y="-12" width="160" height="24" rx="6" fill="#090B10" fillOpacity="0.95" stroke="#D4AF37" strokeWidth="1" />
                <text x="0" y="5" fill="#F3E5AB" fontSize="13" fontWeight="black" textAnchor="middle">
                  {isEn ? '🏆 VICTORY!' : '🏆 VICTOIRE !'}
                </text>
              </g>
            )}
            {/* Sabot de sortie */}
            {Array.from({ length: ep1BorneOff }).map((_, idx) => (
              <rect key={idx} x="566" y={320 - idx * 16} width="28" height="12" rx="4" fill="#FAF6EE" stroke="#D4AF37" strokeWidth="1" />
            ))}
          </g>
        )}

        {/* ================= ÉPISODE 2 : SÉCURITÉ & CONSTRUCTION DE PORTES ================= */}
        {episodeId === 2 && (
          <g>
            {/* Flèche 5 avec porte en formation */}
            {progress < 0.4 ? (
              <g>
                <circle cx="372" cy="288" r="13" fill="#FAF6EE" stroke="#ef4444" strokeWidth="2.5" />
                <g transform="translate(372, 255)">
                  <rect x="-65" y="-9" width="130" height="18" rx="6" fill="#090B10" fillOpacity="0.94" stroke="#ef4444" strokeWidth="0.75" />
                  <text x="0" y="3" fill="#f87171" fontSize="10" fontWeight="bold" textAnchor="middle">⚠️ {isEn ? 'Vulnerable Blot' : 'Pion Vulnérable'}</text>
                </g>
              </g>
            ) : (
              <g>
                <circle cx={ep2White1X} cy="288" r="12" fill="#FAF6EE" stroke="#D4AF37" strokeWidth="1.5" />
                <circle cx={ep2White2X} cy="270" r="12" fill="#FAF6EE" stroke="#D4AF37" strokeWidth="1.5" />
                <g transform="translate(372, 240)">
                  <rect x="-70" y="-10" width="140" height="20" rx="6" fill="#090B10" fillOpacity="0.94" stroke="#10B981" strokeWidth="0.8" />
                  <text x="0" y="3.5" fill="#34D399" fontSize="11" fontWeight="black" textAnchor="middle">🛡️ {isEn ? 'Safe Gate Made' : 'Porte Imprenable'}</text>
                </g>
              </g>
            )}

            {/* Pion adverse bloqué */}
            <g transform={`translate(${372 + ep2BlockedBounce}, 180)`}>
              <circle cx="0" cy="0" r="12" fill="#18181b" stroke="#ef4444" strokeWidth="2" />
              {progress > 0.7 && (
                <g transform="translate(0, -22)">
                  <rect x="-60" y="-8" width="120" height="16" rx="5" fill="#090B10" fillOpacity="0.94" stroke="#ef4444" strokeWidth="0.75" />
                  <text x="0" y="3" fill="#fca5a5" fontSize="10" fontWeight="bold" textAnchor="middle">
                    {isEn ? '⛔ Blocked!' : '⛔ Passage bloqué !'}
                  </text>
                </g>
              )}
            </g>
          </g>
        )}

        {/* ================= ÉPISODE 3 : L'ATTAQUE & LA BARRE (PRISON) ================= */}
        {episodeId === 3 && (
          <g>
            <circle cx={ep3AttackerX} cy={ep3AttackerY} r="12" fill="#FAF6EE" stroke="#D4AF37" strokeWidth="1.5" />

            {progress < 0.55 ? (
              <g>
                <circle cx="372" cy="40" r="12" fill="#18181b" stroke="#eab308" strokeWidth="2" />
                <g transform="translate(372, 70)">
                  <rect x="-50" y="-8" width="100" height="16" rx="5" fill="#090B10" fillOpacity="0.94" stroke="#eab308" strokeWidth="0.75" />
                  <text x="0" y="3" fill="#fde047" fontSize="10" fontWeight="bold" textAnchor="middle">{isEn ? 'Blot Target' : 'Cible isolée'}</text>
                </g>
              </g>
            ) : (
              <g>
                <circle cx={ep3TargetX} cy={ep3TargetY} r="12" fill="#18181b" stroke="#ef4444" strokeWidth="2" />
                {progress > 0.75 && (
                  <g transform="translate(290, 200)">
                    <rect x="-65" y="-9" width="130" height="18" rx="6" fill="#090B10" fillOpacity="0.94" stroke="#ef4444" strokeWidth="0.75" />
                    <text x="0" y="3" fill="#f87171" fontSize="11" fontWeight="black" textAnchor="middle">
                      {isEn ? '🔒 On the Bar!' : '🔒 Prison de la Barre'}
                    </text>
                  </g>
                )}
              </g>
            )}
          </g>
        )}

        {/* ================= ÉPISODE 4 : LE MUR DE 6 PORTES (LA PRIME) ================= */}
        {episodeId === 4 && (
          <g>
            {Array.from({ length: ep4WallGates }).map((_, idx) => {
              const x = 168 + idx * 40;
              return (
                <g key={idx}>
                  <circle cx={x} cy="288" r="11" fill="#FAF6EE" stroke="#D4AF37" strokeWidth="1.5" />
                  <circle cx={x} cy="270" r="11" fill="#FAF6EE" stroke="#D4AF37" strokeWidth="1.5" />
                  <rect x={x - 8} y="225" width="16" height="30" fill="rgba(212,175,55,0.4)" stroke="#D4AF37" rx="3" />
                </g>
              );
            })}
            {ep4WallGates >= 6 && (
              <g transform="translate(270, 210)">
                <rect x="-95" y="-10" width="190" height="20" rx="6" fill="#090B10" fillOpacity="0.94" stroke="#D4AF37" strokeWidth="0.75" />
                <text x="0" y="3.5" fill="#F3E5AB" fontSize="11" fontWeight="black" textAnchor="middle">
                  {isEn ? '🧱 6-Prime Wall (Impassable)' : '🧱 Mur de 6 Portes (Prime)'}
                </text>
              </g>
            )}
            <circle cx="128" cy={280 - ep4JumperBounce} r="12" fill="#18181b" stroke="#ef4444" strokeWidth="2" />
            {progress > 0.55 && (
              <g transform="translate(128, 240)">
                <rect x="-40" y="-8" width="80" height="16" rx="5" fill="#090B10" fillOpacity="0.94" stroke="#ef4444" strokeWidth="0.75" />
                <text x="0" y="3" fill="#fca5a5" fontSize="10" fontWeight="bold" textAnchor="middle">⛔ Bloqué !</text>
              </g>
            )}
          </g>
        )}

        {/* ================= ÉPISODE 5 : SORTIE & DÉ MULTIPLICATEUR (VIDEAU) ================= */}
        {episodeId === 5 && (
          <g>
            {Array.from({ length: 15 - ep5BorneOff }).map((_, idx) => (
              <circle key={idx} cx={350 + (idx % 5) * 35} cy={288 - Math.floor(idx / 5) * 16} r="10" fill="#FAF6EE" stroke="#D4AF37" strokeWidth="1" />
            ))}
            {Array.from({ length: ep5BorneOff }).map((_, idx) => (
              <rect key={idx} x="566" y={320 - idx * 16} width="28" height="12" rx="4" fill="#FAF6EE" stroke="#D4AF37" strokeWidth="1" />
            ))}
            <g transform={`translate(290, 110) scale(${ep5CubeScale})`}>
              <rect x="-24" y="-24" width="48" height="48" rx="8" fill="#18181b" stroke="#D4AF37" strokeWidth="2.5" />
              <text x="0" y="8" fill="#F3E5AB" fontSize="24" fontWeight="black" textAnchor="middle">
                {progress > 0.5 ? '2' : '1'}
              </text>
            </g>
            {progress > 0.5 && (
              <g transform="translate(290, 165)">
                <rect x="-85" y="-10" width="170" height="20" rx="6" fill="#090B10" fillOpacity="0.94" stroke="#D4AF37" strokeWidth="0.75" />
                <text x="0" y="3.5" fill="#F3E5AB" fontSize="12" fontWeight="black" textAnchor="middle">
                  {isEn ? 'Double Stakes (x2)!' : 'Doublez la mise (x2) !'}
                </text>
              </g>
            )}
          </g>
        )}
      </svg>
    </div>
  );
});

AcademyBoardStageSvg.displayName = 'AcademyBoardStageSvg';
