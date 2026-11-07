'use client';

/**
 * @file src/components/beginner/AcademyBoardStageSvg.tsx
 * @description Plateau cinématique interactif SVG grand format pour la mini-série vidéo d'initiation.
 * Polices SVG >= 14px en fontWeight 700, cartouches noirs opaques (height 28, rx 7), pions nets sans flou.
 * Strictement <= 300 lignes, 0 `any`.
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

function ease(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
}

function renderDie(x: number, y: number, val: number, angle = 0) {
  const pips: Record<number, [number, number][]> = {
    1: [[0, 0]], 2: [[-4, -4], [4, 4]], 3: [[-4, -4], [0, 0], [4, 4]],
    4: [[-4, -4], [4, -4], [-4, 4], [4, 4]], 5: [[-4, -4], [4, -4], [0, 0], [-4, 4], [4, 4]],
    6: [[-4, -5], [4, -5], [-4, 0], [4, 0], [-4, 5], [4, 5]],
  };
  return (
    <g transform={`translate(${x}, ${y}) rotate(${angle})`}>
      <rect x="-12" y="-12" width="24" height="24" rx="4" fill="#FAF6EE" stroke="#D4AF37" strokeWidth="1.5" />
      {(pips[val] || [[0, 0]]).map(([px, py], i) => (
        <circle key={i} cx={px} cy={py} r="2" fill="#18181b" />
      ))}
    </g>
  );
}

export const AcademyBoardStageSvg: React.FC<AcademyBoardStageSvgProps> = React.memo(({
  episodeId, progress, isEn,
}) => {
  // Episode 1 : Course & But Ultime
  const ep1Dash = progress <= 0.35 ? (1 - progress / 0.35) * 1100 : 0;
  const ep1MoveT = progress > 0.35 && progress <= 0.75 ? ease((progress - 0.35) / 0.40) : progress > 0.75 ? 1 : 0;
  const ep1OffT = progress > 0.75 ? ease((progress - 0.75) / 0.25) : 0;
  const ep1BorneOff = progress > 0.75 ? Math.min(15, Math.floor(ep1OffT * 15) + 1) : 0;
  const ep1GlideX = 532 - (532 - 48) * Math.min(1, ep1MoveT * 2);
  const ep1GlideY = ep1MoveT < 0.5 ? 40 : 40 + (280 - 40) * Math.min(1, (ep1MoveT - 0.5) * 2);

  // Episode 2 : L'Attaque & La Barre Centrale
  const ep2HitT = progress <= 0.45 ? ease(progress / 0.45) : 1;
  const ep2AttX = 68 + (128 - 68) * ep2HitT;
  const ep2AttY = 40 + (285 - 40) * ep2HitT;
  const ep2FlyT = progress > 0.45 && progress <= 0.75 ? ease((progress - 0.45) / 0.30) : progress > 0.75 ? 1 : 0;
  const ep2FlyX = 128 + (290 - 128) * ep2FlyT;
  const ep2FlyY = 285 - (285 - 160) * ep2FlyT - Math.sin(ep2FlyT * Math.PI) * 80;
  const ep2ReT = progress > 0.75 ? ease((progress - 0.75) / 0.25) : 0;
  const ep2ReX = 290 + (432 - 290) * ep2ReT;
  const ep2ReY = 160 - (160 - 40) * ep2ReT;

  // Episode 3 : Construire une Porte Imprenable
  const ep3DoorT = progress > 0.30 && progress <= 0.65 ? ease((progress - 0.30) / 0.35) : progress > 0.65 ? 1 : 0;
  const ep3W1X = 208 + (372 - 208) * ep3DoorT;
  const ep3W2X = 332 + (372 - 332) * ep3DoorT;
  const ep3Bounce = progress > 0.65 ? Math.max(0, Math.sin((progress - 0.65) * 16) * 45) : 0;

  // Episode 4 : Le Mur de 5 Portes
  const ep4Doors = progress <= 0.60 ? Math.min(5, Math.floor((progress / 0.60) * 5) + 1) : 5;
  const ep4Jump = progress > 0.60 ? Math.abs(Math.sin((progress - 0.60) * 18)) : 0;

  // Episode 5 : Sortie & Videau
  const ep5Off = progress <= 0.50 ? Math.min(15, Math.floor((progress / 0.50) * 15)) : 15;
  const ep5CubeT = progress > 0.50 ? (progress - 0.50) / 0.50 : 0;
  const ep5Scale = progress > 0.50 ? 1 + Math.sin(ep5CubeT * Math.PI) * 0.35 : 1;

  return (
    <div className="relative w-full h-[270px] md:h-[310px] rounded-xl border border-[#D4AF37]/50 bg-[#07130e] shadow-2xl overflow-hidden">
      <svg viewBox="0 0 600 320" preserveAspectRatio="xMidYMid meet" data-testid="academy-animated-board-svg" className="w-full h-full select-none">
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
              d="M 532 40 L 48 40 C 12 40 12 280 48 280 L 532 280"
              fill="none" stroke="#D4AF37" strokeWidth="5" strokeDasharray="1100" strokeDashoffset={ep1Dash} strokeLinecap="round" opacity="0.85"
            />
            <rect x="306" y="175" width="250" height="140" fill="rgba(16, 185, 129, 0.12)" stroke="#10B981" strokeDasharray="4 4" rx="8" />
            <g transform="translate(430, 195)">
              <rect x="-112" y="-14" width="224" height="28" rx="7" fill="#090B10" fillOpacity="0.96" stroke="#10B981" strokeWidth="1.5" />
              <text x="0" y="5" fill="#34D399" fontSize="14" fontWeight="700" textAnchor="middle">{isEn ? '🏠 Home Board (Exit)' : '🏠 Votre Maison (Sortie)'}</text>
            </g>
            {progress > 0.35 && progress <= 0.75 && (
              <g>{renderDie(415, 110, 6, progress * 360)}{renderDie(448, 110, 5, -progress * 360)}</g>
            )}
            {progress <= 0.75 ? (
              <g>
                <circle cx={ep1GlideX} cy={ep1GlideY} r="12" fill="#FAF6EE" stroke="#D4AF37" strokeWidth="1.5" />
                <circle cx="332" cy="285" r="11" fill="#FAF6EE" stroke="#D4AF37" strokeWidth="1.5" />
                <circle cx="372" cy="285" r="11" fill="#FAF6EE" stroke="#D4AF37" strokeWidth="1.5" />
                <circle cx="412" cy="285" r="11" fill="#FAF6EE" stroke="#D4AF37" strokeWidth="1.5" />
              </g>
            ) : (
              <g transform="translate(430, 270)">
                <rect x="-95" y="-14" width="190" height="28" rx="7" fill="#090B10" fillOpacity="0.96" stroke="#D4AF37" strokeWidth="1.5" />
                <text x="0" y="5" fill="#F3E5AB" fontSize="14" fontWeight="700" textAnchor="middle">
                  {ep1BorneOff >= 15 ? (isEn ? '🏆 VICTORY!' : '🏆 VICTOIRE !') : `${ep1BorneOff} / 15 ${isEn ? 'borne off' : 'sortis'}`}
                </text>
              </g>
            )}
            {Array.from({ length: ep1BorneOff }).map((_, idx) => (
              <rect key={idx} x="566" y={304 - idx * 15} width="28" height="11" rx="3" fill="#FAF6EE" stroke="#D4AF37" strokeWidth="1.5" />
            ))}
          </g>
        )}

        {/* ================= ÉPISODE 2 : L'ATTAQUE & LA BARRE CENTRALE ================= */}
        {episodeId === 2 && (
          <g>
            <g>{renderDie(380, 110, 4)}{renderDie(412, 110, 2)}</g>
            <circle cx={ep2AttX} cy={ep2AttY} r="12" fill="#FAF6EE" stroke="#D4AF37" strokeWidth="1.5" />

            {progress <= 0.45 ? (
              <g>
                <circle cx="128" cy="285" r="12" fill="#18181b" stroke="#ef4444" strokeWidth="2.5" />
                <g transform="translate(150, 240)">
                  <rect x="-125" y="-14" width="250" height="28" rx="7" fill="#090B10" fillOpacity="0.96" stroke="#ef4444" strokeWidth="1.5" />
                  <text x="0" y="5" fill="#fca5a5" fontSize="14" fontWeight="700" textAnchor="middle">
                    {isEn ? '🎯 Opponent Checker (Target)' : '🎯 Pion adverse seul (Cible)'}
                  </text>
                </g>
              </g>
            ) : progress <= 0.75 ? (
              <g>
                <circle cx={ep2FlyX} cy={ep2FlyY} r="12" fill="#18181b" stroke="#ef4444" strokeWidth="2.5" />
                <g transform="translate(290, 205)">
                  <rect x="-112" y="-14" width="224" height="28" rx="7" fill="#090B10" fillOpacity="0.96" stroke="#ef4444" strokeWidth="1.5" />
                  <text x="0" y="5" fill="#fca5a5" fontSize="14" fontWeight="700" textAnchor="middle">
                    {isEn ? '🔒 Prisoner on the Bar!' : '🔒 Prisonnier sur la Barre'}
                  </text>
                </g>
              </g>
            ) : (
              <g>
                <circle cx={ep2ReX} cy={ep2ReY} r="12" fill="#18181b" stroke="#f59e0b" strokeWidth="2.5" />
                <g transform="translate(415, 78)">
                  <rect x="-140" y="-14" width="280" height="28" rx="7" fill="#090B10" fillOpacity="0.96" stroke="#f59e0b" strokeWidth="1.5" />
                  <text x="0" y="5" fill="#fde047" fontSize="14" fontWeight="700" textAnchor="middle">
                    {isEn ? 'Re-entry from point 22' : "L'adversaire recommence du début !"}
                  </text>
                </g>
              </g>
            )}
          </g>
        )}

        {/* ================= ÉPISODE 3 : CONSTRUIRE UNE PORTE IMPRENABLE ================= */}
        {episodeId === 3 && (
          <g>
            <g>{renderDie(415, 110, 3)}{renderDie(448, 110, 1)}</g>
            <circle cx={ep3W1X} cy="285" r="11" fill="#FAF6EE" stroke="#D4AF37" strokeWidth="1.5" />
            <circle cx={ep3W2X} cy="262" r="11" fill="#FAF6EE" stroke="#D4AF37" strokeWidth="1.5" />

            {progress > 0.65 && (
              <g transform="translate(372, 224)">
                <rect x="-125" y="-14" width="250" height="28" rx="7" fill="#090B10" fillOpacity="0.96" stroke="#10B981" strokeWidth="1.5" />
                <text x="0" y="5" fill="#34D399" fontSize="14" fontWeight="700" textAnchor="middle">
                  🛡️ {isEn ? 'Gate = Impassable Shield' : 'Porte = Bouclier Imprenable'}
                </text>
              </g>
            )}

            <g transform={`translate(${372 - ep3Bounce}, 172)`}>
              <circle cx="0" cy="0" r="12" fill="#18181b" stroke="#ef4444" strokeWidth="2.5" />
              {progress > 0.65 && (
                <g transform="translate(0, -28)">
                  <rect x="-86" y="-14" width="172" height="28" rx="7" fill="#090B10" fillOpacity="0.96" stroke="#ef4444" strokeWidth="1.5" />
                  <text x="0" y="5" fill="#fca5a5" fontSize="14" fontWeight="700" textAnchor="middle">{isEn ? '⛔ Blocked!' : '⛔ Passage bloqué !'}</text>
                </g>
              )}
            </g>
          </g>
        )}

        {/* ================= ÉPISODE 4 : LE MUR DE PORTES ================= */}
        {episodeId === 4 && (
          <g>
            {[168, 208, 332, 372, 412].slice(0, ep4Doors).map((x, idx) => (
              <g key={idx}>
                <circle cx={x} cy="285" r="11" fill="#FAF6EE" stroke="#D4AF37" strokeWidth="1.5" />
                <circle cx={x} cy="262" r="11" fill="#FAF6EE" stroke="#D4AF37" strokeWidth="1.5" />
                <rect x={x - 9} y="224" width="18" height="28" fill="rgba(212,175,55,0.4)" stroke="#D4AF37" rx="3" />
              </g>
            ))}
            {ep4Doors >= 5 && (
              <g transform="translate(310, 195)">
                <rect x="-150" y="-14" width="300" height="28" rx="7" fill="#090B10" fillOpacity="0.96" stroke="#D4AF37" strokeWidth="1.5" />
                <text x="0" y="5" fill="#F3E5AB" fontSize="14" fontWeight="700" textAnchor="middle">
                  {isEn ? '🧱 Opponent Blocked Behind Wall' : '🧱 Adversaire bloqué derrière le Mur'}
                </text>
              </g>
            )}
            <circle cx={88 + ep4Jump * 30} cy={285 - ep4Jump * 35} r="12" fill="#18181b" stroke="#ef4444" strokeWidth="2.5" />
            {progress > 0.60 && (
              <g transform="translate(115, 228)">
                <rect x="-95" y="-14" width="190" height="28" rx="7" fill="#090B10" fillOpacity="0.96" stroke="#ef4444" strokeWidth="1.5" />
                <text x="0" y="5" fill="#fca5a5" fontSize="14" fontWeight="700" textAnchor="middle">{isEn ? '⛔ Blocked by Wall!' : '⛔ Bloqué par le Mur !'}</text>
              </g>
            )}
          </g>
        )}

        {/* ================= ÉPISODE 5 : SORTIE & DÉ MULTIPLICATEUR ================= */}
        {episodeId === 5 && (
          <g>
            {Array.from({ length: Math.min(10, 15 - ep5Off) }).map((_, idx) => (
              <circle key={idx} cx={350 + (idx % 5) * 38} cy={285 - Math.floor(idx / 5) * 24} r="11" fill="#FAF6EE" stroke="#D4AF37" strokeWidth="1.5" />
            ))}
            {Array.from({ length: ep5Off }).map((_, idx) => (
              <rect key={idx} x="566" y={304 - idx * 15} width="28" height="11" rx="3" fill="#FAF6EE" stroke="#D4AF37" strokeWidth="1.5" />
            ))}
            <g transform={`translate(290, 112) scale(${ep5Scale})`}>
              <rect x="-24" y="-24" width="48" height="48" rx="8" fill="#18181b" stroke="#D4AF37" strokeWidth="2" />
              <text x="0" y="8" fill="#F3E5AB" fontSize="22" fontWeight="700" textAnchor="middle">{progress > 0.50 ? '2' : '64'}</text>
            </g>
            {progress > 0.50 && (
              <g transform="translate(290, 168)">
                <rect x="-118" y="-14" width="236" height="28" rx="7" fill="#090B10" fillOpacity="0.96" stroke="#D4AF37" strokeWidth="1.5" />
                <text x="0" y="5" fill="#F3E5AB" fontSize="14" fontWeight="700" textAnchor="middle">{isEn ? '🎲 Doubling Cube (×2)!' : '🎲 Dé Multiplicateur (×2)'}</text>
              </g>
            )}
          </g>
        )}
      </svg>
    </div>
  );
});

AcademyBoardStageSvg.displayName = 'AcademyBoardStageSvg';
