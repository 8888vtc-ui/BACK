'use client';

/**
 * @file src/components/beginner/AcademyVisualBoardLesson.tsx
 * @description Plateau visuel interactif SVG grand format pour les 10 leçons/quiz de l'Académie Débutant.
 * Cartouches noirs opaques haute visibilité (fontSize 14-15px), pions nets sans flou (stroke #D4AF37).
 * Strictement <= 295 lignes, 0 `any`.
 */

import React from 'react';

export interface AcademyVisualBoardLessonProps {
  readonly quizId: number;
  readonly isEn: boolean;
}

function getPointX(pt: number): number {
  if (pt >= 13 && pt <= 18) return 24 + (pt - 13) * 40 + 20;
  if (pt >= 19 && pt <= 24) return 296 + (pt - 19) * 40 + 20;
  if (pt >= 7 && pt <= 12) return 24 + (12 - pt) * 40 + 20;
  return 296 + (6 - pt) * 40 + 20;
}

export const AcademyVisualBoardLesson: React.FC<AcademyVisualBoardLessonProps> = React.memo(({
  quizId,
  isEn,
}) => {
  return (
    <div
      data-testid="academy-visual-board-lesson"
      className="relative w-full h-[285px] md:h-[320px] rounded-xl border border-amber-400/40 bg-[#07130e] shadow-2xl overflow-hidden select-none"
    >
      <svg viewBox="0 0 600 260" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
        <defs>
          <marker id="lesson-arrow-gold" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
            <polygon points="0 0, 6 3, 0 6" fill="#D4AF37" />
          </marker>
          <marker id="lesson-arrow-red" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
            <polygon points="0 0, 6 3, 0 6" fill="#ef4444" />
          </marker>
        </defs>

        {/* Tapis de feutre émeraude & boiserie symétrique */}
        <rect x="0" y="0" width="600" height="260" fill="#091813" />
        <rect x="264" y="0" width="32" height="260" fill="#040b08" stroke="#D4AF37" strokeOpacity="0.35" />
        <rect x="536" y="0" width="64" height="260" fill="#050e0a" stroke="#D4AF37" strokeOpacity="0.45" />

        {/* 24 Flèches triangulaires */}
        {Array.from({ length: 24 }, (_, i) => i + 1).map((pt) => {
          const x = getPointX(pt);
          const isTop = pt >= 13;
          return (
            <polygon
              key={pt}
              points={`${x - 19},${isTop ? 0 : 260} ${x + 19},${isTop ? 0 : 260} ${x},${isTop ? 100 : 160}`}
              fill={pt % 2 === 1 ? '#42200f' : '#b28647'}
              opacity={pt <= 6 ? '0.92' : '0.62'}
            />
          );
        })}

        {/* Zone Votre Maison (Sortie) sur la leçon 1 */}
        {quizId === 1 && (
          <g>
            <rect x="296" y="138" width="240" height="117" fill="rgba(16, 185, 129, 0.10)" stroke="#10B981" strokeDasharray="4 4" rx="6" />
            <g transform="translate(416, 158)">
              <rect x="-125" y="-14" width="250" height="28" rx="7" fill="#090B10" fillOpacity="0.96" stroke="#10B981" strokeWidth="1.5" />
              <text x="0" y="5" fill="#34D399" fontSize="14" fontWeight="700" textAnchor="middle">
                {isEn ? 'Your Home Board (Points 1 to 6)' : 'Votre Maison (Cases 1 à 6)'}
              </text>
            </g>
          </g>
        )}

        {/* ================= SCÉNARIOS VISUELS 1 À 10 ================= */}

        {/* 1. SENS DE CIRCULATION EN FER À CHEVAL */}
        {quizId === 1 && (
          <g>
            <circle cx="516" cy="22" r="13" fill="#FAF6EE" stroke="#D4AF37" strokeWidth="1.5" />
            <circle cx="516" cy="48" r="13" fill="#FAF6EE" stroke="#D4AF37" strokeWidth="1.5" />
            <g transform="translate(485, 82)">
              <rect x="-76" y="-14" width="152" height="28" rx="7" fill="#090B10" fillOpacity="0.96" stroke="#D4AF37" strokeWidth="1.5" />
              <text x="0" y="5" fill="#F3E5AB" fontSize="14" fontWeight="700" textAnchor="middle">{isEn ? 'Start: Point 24' : 'Départ : Case 24'}</text>
            </g>
            <path d="M 498 48 L 44 48 C 12 48 12 222 44 222 L 460 222" fill="none" stroke="#D4AF37" strokeWidth="5" strokeDasharray="10 5" markerEnd="url(#lesson-arrow-gold)" />
            <g transform="translate(250, 32)">
              <rect x="-185" y="-14" width="370" height="28" rx="7" fill="#090B10" fillOpacity="0.96" stroke="#D4AF37" strokeWidth="1.5" />
              <text x="0" y="5" fill="#F3E5AB" fontSize="14" fontWeight="700" textAnchor="middle">{isEn ? 'Horseshoe Path (Point 24 → Point 1)' : 'Chemin en Fer à Cheval (Case 24 → Case 1)'}</text>
            </g>
          </g>
        )}

        {/* 2. LE BUT DU JEU (Sortir ses 15 dames) */}
        {quizId === 2 && (
          <g>
            <g transform="translate(416, 136)">
              <rect x="-145" y="-14" width="290" height="28" rx="7" fill="#090B10" fillOpacity="0.96" stroke="#D4AF37" strokeWidth="1.5" />
              <text x="0" y="5" fill="#F3E5AB" fontSize="14" fontWeight="700" textAnchor="middle">
                {isEn ? 'Home Board (Points 1 to 6) → Exit' : 'Maison (Cases 1 à 6) → Sortie'}
              </text>
            </g>
            {[316, 356, 396, 436, 476, 516].map((x, colIdx) => (
              <g key={colIdx}>
                <circle cx={x} cy="238" r="11" fill="#FAF6EE" stroke="#D4AF37" strokeWidth="1.5" />
                <circle cx={x} cy="214" r="11" fill="#FAF6EE" stroke="#D4AF37" strokeWidth="1.5" />
              </g>
            ))}
            <line x1="536" y1="226" x2="578" y2="226" stroke="#D4AF37" strokeWidth="4" markerEnd="url(#lesson-arrow-gold)" />
            <rect x="558" y="244" width="32" height="11" rx="3" fill="#FAF6EE" stroke="#D4AF37" strokeWidth="1.5" />
            <rect x="558" y="230" width="32" height="11" rx="3" fill="#FAF6EE" stroke="#D4AF37" strokeWidth="1.5" />
          </g>
        )}

        {/* 3. PION SEUL VS PORTE (BOUCLIER) */}
        {quizId === 3 && (
          <g>
            <circle cx="150" cy="236" r="12" fill="#FAF6EE" stroke="#ef4444" strokeWidth="2.5" />
            <g transform="translate(150, 168)">
              <rect x="-108" y="-14" width="216" height="28" rx="7" fill="#090B10" fillOpacity="0.96" stroke="#ef4444" strokeWidth="1.5" />
              <text x="0" y="5" fill="#fca5a5" fontSize="14" fontWeight="700" textAnchor="middle">{isEn ? 'Single Checker (In danger)' : 'Pion Seul (En danger)'}</text>
            </g>
            <circle cx="420" cy="236" r="12" fill="#FAF6EE" stroke="#D4AF37" strokeWidth="1.5" />
            <circle cx="420" cy="212" r="12" fill="#FAF6EE" stroke="#D4AF37" strokeWidth="1.5" />
            <g transform="translate(420, 168)">
              <rect x="-125" y="-14" width="250" height="28" rx="7" fill="#090B10" fillOpacity="0.96" stroke="#10B981" strokeWidth="1.5" />
              <text x="0" y="5" fill="#34D399" fontSize="14" fontWeight="700" textAnchor="middle">{isEn ? 'Gate (2 Checkers = Shield)' : 'Porte (2 Pions = Bouclier)'}</text>
            </g>
          </g>
        )}

        {/* 4. CONSTRUIRE UNE PORTE AVEC LES DÉS (Dés 3 et 1 visibles) */}
        {quizId === 4 && (
          <g>
            <g transform="translate(420, 102)">
              <rect x="-14" y="-14" width="28" height="28" rx="5" fill="#FAF6EE" stroke="#D4AF37" strokeWidth="1.5" />
              <circle cx="-6" cy="-6" r="2.2" fill="#18181b" /><circle cx="0" cy="0" r="2.2" fill="#18181b" /><circle cx="6" cy="6" r="2.2" fill="#18181b" />
            </g>
            <g transform="translate(458, 102)">
              <rect x="-14" y="-14" width="28" height="28" rx="5" fill="#FAF6EE" stroke="#D4AF37" strokeWidth="1.5" />
              <circle cx="0" cy="0" r="2.8" fill="#18181b" />
            </g>
            <circle cx="204" cy="236" r="11.5" fill="#FAF6EE" stroke="#D4AF37" strokeWidth="1.5" />
            <circle cx="476" cy="236" r="11.5" fill="#FAF6EE" stroke="#D4AF37" strokeWidth="1.5" />
            <path d="M 204 222 Q 275 182 342 216" fill="none" stroke="#D4AF37" strokeWidth="3.5" markerEnd="url(#lesson-arrow-gold)" />
            <path d="M 476 222 Q 420 182 364 216" fill="none" stroke="#D4AF37" strokeWidth="3.5" markerEnd="url(#lesson-arrow-gold)" />
            <circle cx="356" cy="236" r="11.5" fill="#FAF6EE" stroke="#D4AF37" strokeWidth="1.5" />
            <circle cx="356" cy="212" r="11.5" fill="#FAF6EE" stroke="#D4AF37" strokeWidth="1.5" />
            <g transform="translate(346, 146)">
              <rect x="-150" y="-14" width="300" height="28" rx="7" fill="#090B10" fillOpacity="0.96" stroke="#10B981" strokeWidth="1.5" />
              <text x="0" y="5" fill="#34D399" fontSize="14" fontWeight="700" textAnchor="middle">
                {isEn ? 'Convergence = Impassable Gate' : 'Convergence = Bouclier Imprenable'}
              </text>
            </g>
          </g>
        )}

        {/* 5. FRAPPER UN PION ADVERSE ISOLÉ */}
        {quizId === 5 && (
          <g>
            <circle cx="120" cy="35" r="12.5" fill="#FAF6EE" stroke="#D4AF37" strokeWidth="1.5" />
            <line x1="136" y1="35" x2="264" y2="35" stroke="#D4AF37" strokeWidth="3.5" markerEnd="url(#lesson-arrow-gold)" />
            <circle cx="280" cy="35" r="12.5" fill="#18181B" stroke="#EF4444" strokeWidth="2.5" />
            <g transform="translate(405, 35)">
              <rect x="-98" y="-14" width="196" height="28" rx="7" fill="#090B10" fillOpacity="0.96" stroke="#EF4444" strokeWidth="1.5" />
              <text x="0" y="5" fill="#fca5a5" fontSize="14" fontWeight="700" textAnchor="middle">{isEn ? 'Opponent blot' : 'Pion adverse seul'}</text>
            </g>
            <path d="M 280 49 Q 240 115 276 155" fill="none" stroke="#ef4444" strokeWidth="3" strokeDasharray="5 3" markerEnd="url(#lesson-arrow-red)" />
            <g transform="translate(280, 186)">
              <rect x="-86" y="-14" width="172" height="28" rx="7" fill="#090B10" fillOpacity="0.96" stroke="#EF4444" strokeWidth="1.5" />
              <text x="0" y="5" fill="#fca5a5" fontSize="14" fontWeight="700" textAnchor="middle">{isEn ? 'Central Bar' : 'Barre Centrale'}</text>
            </g>
          </g>
        )}

        {/* 6. SORTIR DE LA BARRE CENTRALE EN PRIORITÉ */}
        {quizId === 6 && (
          <g>
            <rect x="296" y="5" width="240" height="115" fill="rgba(245, 158, 11, 0.08)" stroke="#F59E0B" strokeDasharray="4 4" rx="6" />
            <g transform="translate(416, 24)">
              <rect x="-135" y="-14" width="270" height="28" rx="7" fill="#090B10" fillOpacity="0.96" stroke="#F59E0B" strokeWidth="1.5" />
              <text x="0" y="5" fill="#FBBF24" fontSize="14" fontWeight="700" textAnchor="middle">
                {isEn ? 'Re-entry Zone (Points 19 to 24)' : 'Zone de Rentrée (Cases 24 à 19)'}
              </text>
            </g>
            <rect x="266" y="92" width="28" height="86" fill="rgba(239, 68, 68, 0.25)" stroke="#ef4444" rx="4" />
            <circle cx="280" cy="135" r="12.5" fill="#FAF6EE" stroke="#ef4444" strokeWidth="2.5" />
            <path d="M 280 120 Q 332 68 410 48" fill="none" stroke="#D4AF37" strokeWidth="3.5" markerEnd="url(#lesson-arrow-gold)" />
            <g transform="translate(280, 204)">
              <rect x="-125" y="-14" width="250" height="28" rx="7" fill="#090B10" fillOpacity="0.96" stroke="#F59E0B" strokeWidth="1.5" />
              <text x="0" y="5" fill="#FBBF24" fontSize="14" fontWeight="700" textAnchor="middle">{isEn ? 'Priority #1 : Enter first' : 'Priorité #1 : Rentrer en jeu'}</text>
            </g>
          </g>
        )}

        {/* 7. LE MUR DE PORTES (INFRANCHISSABLE) */}
        {quizId === 7 && (
          <g>
            {[316, 356, 396, 436].map((x, i) => (
              <g key={i}>
                <circle cx={x} cy="236" r="11.5" fill="#FAF6EE" stroke="#D4AF37" strokeWidth="1.5" />
                <circle cx={x} cy="212" r="11.5" fill="#FAF6EE" stroke="#D4AF37" strokeWidth="1.5" />
                <rect x={x - 7} y="184" width="14" height="20" fill="rgba(212,175,55,0.4)" stroke="#D4AF37" rx="2" />
              </g>
            ))}
            <g transform="translate(366, 134)">
              <rect x="-145" y="-14" width="290" height="28" rx="7" fill="#090B10" fillOpacity="0.96" stroke="#D4AF37" strokeWidth="1.5" />
              <text x="0" y="5" fill="#F3E5AB" fontSize="14" fontWeight="700" textAnchor="middle">{isEn ? 'Wall of Gates (Unpassable)' : 'Mur de Portes (Infranchissable)'}</text>
            </g>
            <circle cx="476" cy="236" r="12.5" fill="#18181B" stroke="#EF4444" strokeWidth="2.5" />
            <g transform="translate(476, 182)">
              <rect x="-102" y="-14" width="204" height="28" rx="7" fill="#090B10" fillOpacity="0.96" stroke="#EF4444" strokeWidth="1.5" />
              <text x="0" y="5" fill="#FCA5A5" fontSize="14" fontWeight="700" textAnchor="middle">{isEn ? 'Opponent checker blocked' : 'Pion adverse bloqué'}</text>
            </g>
          </g>
        )}

        {/* 8. QUAND A-T-ON LE DROIT DE SORTIR SES PIONS ? (2 pions max par flèche, r=11, nets & espacés) */}
        {quizId === 8 && (
          <g>
            {[316, 356, 396, 436, 476, 516].map((x, idx) => (
              <g key={idx}>
                <circle cx={x} cy="236" r="11" fill="#FAF6EE" stroke="#D4AF37" strokeWidth="1.5" />
                <circle cx={x} cy="212" r="11" fill="#FAF6EE" stroke="#D4AF37" strokeWidth="1.5" />
              </g>
            ))}

            {/* Grand cartouche clair Sortie bloquée (14/15 dans la Maison) */}
            <g transform="translate(416, 126)">
              <rect x="-152" y="-14" width="304" height="28" rx="7" fill="#090B10" fillOpacity="0.96" stroke="#ef4444" strokeWidth="1.5" />
              <text x="0" y="5" fill="#fca5a5" fontSize="14" fontWeight="700" textAnchor="middle">
                {isEn ? 'Bear-off blocked (14/15 Home)' : 'Sortie bloquée (14/15 dans la Maison)'}
              </text>
            </g>

            {/* Grand cartouche clair 🚫 SORTIE INTERDITE */}
            <g transform="translate(492, 168)">
              <rect x="-98" y="-14" width="196" height="28" rx="7" fill="#090B10" fillOpacity="0.96" stroke="#ef4444" strokeWidth="1.5" />
              <text x="0" y="5" fill="#f87171" fontSize="14" fontWeight="700" textAnchor="middle">
                {isEn ? '🚫 EXIT FORBIDDEN' : '🚫 SORTIE INTERDITE'}
              </text>
            </g>

            {/* Pion retardataire dehors + grand cartouche 14px */}
            <circle cx="124" cy="236" r="12" fill="#FAF6EE" stroke="#ef4444" strokeWidth="2.5" />
            <g transform="translate(135, 182)">
              <rect x="-112" y="-14" width="224" height="28" rx="7" fill="#090B10" fillOpacity="0.96" stroke="#ef4444" strokeWidth="1.5" />
              <text x="0" y="5" fill="#fca5a5" fontSize="14" fontWeight="700" textAnchor="middle">
                {isEn ? '1 Laggard Outside!' : '1 Retardataire Dehors !'}
              </text>
            </g>
          </g>
        )}

        {/* 9. GAGNER DOUBLE (GAMMON X2) */}
        {quizId === 9 && (
          <g>
            {Array.from({ length: 15 }).map((_, idx) => (
              <rect key={idx} x="554" y={244 - idx * 15} width="36" height="11" rx="3" fill="#FAF6EE" stroke="#D4AF37" strokeWidth="1.5" />
            ))}
            <g transform="translate(275, 128)">
              <rect x="-175" y="-34" width="350" height="68" fill="#090B10" fillOpacity="0.96" stroke="#eab308" strokeWidth="1.5" rx="8" />
              <text x="0" y="-6" fill="#F3E5AB" fontSize="18" fontWeight="700" textAnchor="middle">×2 POINTS (GAMMON)</text>
              <text x="0" y="18" fill="#fbbf24" fontSize="14" fontWeight="700" textAnchor="middle">
                {isEn ? 'Gammon : Opponent bore off 0 checkers' : "Gammon : L'adversaire n'en a sorti aucun"}
              </text>
            </g>
          </g>
        )}

        {/* 10. LE DÉ MULTIPLICATEUR (VIDEAU) */}
        {quizId === 10 && (
          <g>
            <g transform="translate(286, 108)">
              <rect x="-28" y="-28" width="56" height="56" rx="10" fill="#18181b" stroke="#D4AF37" strokeWidth="2.5" />
              <text x="0" y="10" fill="#F3E5AB" fontSize="28" fontWeight="700" textAnchor="middle">2</text>
            </g>
            <g transform="translate(286, 186)">
              <rect x="-195" y="-14" width="390" height="28" rx="7" fill="#090B10" fillOpacity="0.96" stroke="#D4AF37" strokeWidth="1.5" />
              <text x="0" y="5" fill="#F3E5AB" fontSize="14" fontWeight="700" textAnchor="middle">
                {isEn ? 'Doubling Cube : Propose to Double Match Stakes' : 'Dé Multiplicateur : Proposez de Doubler la Mise'}
              </text>
            </g>
          </g>
        )}
      </svg>
    </div>
  );
});

AcademyVisualBoardLesson.displayName = 'AcademyVisualBoardLesson';
