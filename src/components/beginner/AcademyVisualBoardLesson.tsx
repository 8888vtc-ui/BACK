'use client';

/**
 * @file src/components/beginner/AcademyVisualBoardLesson.tsx
 * @description Plateau visuel interactif SVG pour les 10 leçons/quiz de l'Académie Débutant.
 * Cartouches sombres opaques, dés 3-1 sur le Quiz 4, pions nets non coupés en bas.
 * Strictement <= 290 lignes, 0 `any`.
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
      className="relative w-full aspect-[600/260] max-h-[210px] rounded-xl border border-amber-400/30 bg-[#07130e] shadow-2xl overflow-hidden select-none"
    >
      <svg viewBox="0 0 600 260" className="w-full h-full object-contain">
        <defs>
          <marker id="lesson-arrow-gold" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><polygon points="0 0, 6 3, 0 6" fill="#D4AF37" /></marker>
          <marker id="lesson-arrow-red" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><polygon points="0 0, 6 3, 0 6" fill="#ef4444" /></marker>
        </defs>

        {/* Tapis de feutre émeraude & boiserie symétrique */}
        <rect x="0" y="0" width="600" height="260" fill="#091813" />
        <rect x="264" y="0" width="32" height="260" fill="#040b08" stroke="#D4AF37" strokeOpacity="0.3" />
        <rect x="536" y="0" width="64" height="260" fill="#050e0a" stroke="#D4AF37" strokeOpacity="0.4" />

        {/* 24 Flèches triangulaires */}
        {Array.from({ length: 24 }, (_, i) => i + 1).map((pt) => {
          const x = getPointX(pt);
          const isTop = pt >= 13;
          return (
            <polygon
              key={pt}
              points={`${x - 19},${isTop ? 0 : 260} ${x + 19},${isTop ? 0 : 260} ${x},${isTop ? 100 : 160}`}
              fill={pt % 2 === 1 ? '#42200f' : '#b28647'}
              opacity={pt <= 6 ? '0.9' : '0.6'}
            />
          );
        })}

        {/* Zone Votre Maison (Sortie) uniquement sur la leçon 1 */}
        {quizId === 1 && (
          <g>
            <rect x="296" y="140" width="240" height="115" fill="rgba(16, 185, 129, 0.08)" stroke="#10B981" strokeDasharray="4 4" rx="6" />
            <g transform="translate(416, 155)">
              <rect x="-85" y="-10" width="170" height="18" rx="6" fill="#090B10" fillOpacity="0.94" stroke="#10B981" strokeWidth="0.75" />
              <text x="0" y="3" fill="#34D399" fontSize="10" fontWeight="bold" textAnchor="middle">
                {isEn ? 'Your Home Board (Cases 1 to 6)' : 'Votre Maison (Cases 1 à 6)'}
              </text>
            </g>
          </g>
        )}

        {/* ================= SCÉNARIOS VISUELS 1 À 10 ================= */}

        {/* 1. SENS DE CIRCULATION EN FER À CHEVAL */}
        {quizId === 1 && (
          <g>
            <circle cx="516" cy="22" r="14" fill="#FAF6EE" stroke="#D4AF37" strokeWidth="1.5" />
            <circle cx="516" cy="48" r="14" fill="#FAF6EE" stroke="#D4AF37" strokeWidth="1.5" />
            <g transform="translate(516, 76)">
              <rect x="-44" y="-10" width="88" height="18" rx="6" fill="#090B10" fillOpacity="0.94" stroke="#D4AF37" strokeWidth="0.75" />
              <text x="0" y="3" fill="#F3E5AB" fontSize="9" fontWeight="bold" textAnchor="middle">{isEn ? 'Start: Pt 24' : 'Départ : Case 24'}</text>
            </g>
            <path d="M 498 48 L 44 48 C 10 48 10 220 44 220 L 460 220" fill="none" stroke="#D4AF37" strokeWidth="5" strokeDasharray="10 5" markerEnd="url(#lesson-arrow-gold)" />
            <g transform="translate(280, 32)">
              <rect x="-140" y="-12" width="280" height="22" rx="6" fill="#090B10" fillOpacity="0.94" stroke="#D4AF37" strokeWidth="0.75" />
              <text x="0" y="3.5" fill="#F3E5AB" fontSize="11" fontWeight="black" textAnchor="middle">{isEn ? 'Chemin en Fer à Cheval (Case 24 → Case 1)' : 'Chemin en Fer à Cheval (Case 24 → Case 1)'}</text>
            </g>
          </g>
        )}

        {/* 2. LE BUT DU JEU (Sortir ses 15 dames) */}
        {quizId === 2 && (
          <g>
            <rect x="296" y="140" width="240" height="115" fill="rgba(212, 175, 55, 0.05)" stroke="#D4AF37" strokeDasharray="4 4" rx="6" />
            <g transform="translate(416, 140)">
              <rect x="-95" y="-11" width="190" height="22" rx="6" fill="#090B10" fillOpacity="0.95" stroke="#D4AF37" strokeWidth="0.8" />
              <text x="0" y="3.5" fill="#F3E5AB" fontSize="10.5" fontWeight="black" textAnchor="middle">
                {isEn ? 'Home Board (Points 1 to 6) → Exit' : 'Maison (Cases 1 à 6) → Sortie'}
              </text>
            </g>

            {[316, 356, 396, 436, 476, 516].map((x, colIdx) => (
              <g key={colIdx}>
                <circle cx={x} cy="238" r="10" fill="#FAF6EE" stroke="#D4AF37" strokeWidth="1.2" />
                <circle cx={x} cy="218" r="10" fill="#FAF6EE" stroke="#D4AF37" strokeWidth="1.2" />
              </g>
            ))}

            <line x1="538" y1="228" x2="578" y2="228" stroke="#D4AF37" strokeWidth="3.5" markerEnd="url(#lesson-arrow-gold)" />
            <rect x="560" y="246" width="30" height="10" rx="3" fill="#FAF6EE" stroke="#D4AF37" strokeWidth="1" />
            <rect x="560" y="234" width="30" height="10" rx="3" fill="#FAF6EE" stroke="#D4AF37" strokeWidth="1" />
          </g>
        )}

        {/* 3. PION SEUL VS PORTE (BOUCLIER) */}
        {quizId === 3 && (
          <g>
            <circle cx="150" cy="238" r="11" fill="#FAF6EE" stroke="#ef4444" strokeWidth="2" />
            <g transform="translate(150, 175)">
              <rect x="-75" y="-10" width="150" height="20" rx="6" fill="#090B10" fillOpacity="0.95" stroke="#ef4444" strokeWidth="1" />
              <text x="0" y="3.5" fill="#f87171" fontSize="10" fontWeight="bold" textAnchor="middle">{isEn ? 'Single Checker (In danger)' : 'Pion Seul (En danger)'}</text>
            </g>
            <circle cx="420" cy="238" r="11" fill="#FAF6EE" stroke="#D4AF37" strokeWidth="1.5" />
            <circle cx="420" cy="218" r="11" fill="#FAF6EE" stroke="#D4AF37" strokeWidth="1.5" />
            <g transform="translate(420, 175)">
              <rect x="-85" y="-10" width="170" height="20" rx="6" fill="#090B10" fillOpacity="0.95" stroke="#10B981" strokeWidth="1" />
              <text x="0" y="3.5" fill="#34D399" fontSize="10.5" fontWeight="black" textAnchor="middle">{isEn ? 'Gate (2 Checkers = Shield)' : 'Porte (2 Pions = Bouclier)'}</text>
            </g>
          </g>
        )}

        {/* 4. CONSTRUIRE UNE PORTE AVEC LES DÉS (Dés 3 et 1 visibles au centre droit) */}
        {quizId === 4 && (
          <g>
            {/* 2 Dés (3 et 1) côte à côte dans le feutre droit, hors de la barre */}
            <g transform="translate(420, 115)">
              <rect x="-13" y="-13" width="26" height="26" rx="5" fill="#FAF6EE" stroke="#D4AF37" strokeWidth="1.5" />
              <circle cx="-6" cy="-6" r="2" fill="#18181b" /><circle cx="0" cy="0" r="2" fill="#18181b" /><circle cx="6" cy="6" r="2" fill="#18181b" />
            </g>
            <g transform="translate(456, 115)">
              <rect x="-13" y="-13" width="26" height="26" rx="5" fill="#FAF6EE" stroke="#D4AF37" strokeWidth="1.5" />
              <circle cx="0" cy="0" r="2.5" fill="#18181b" />
            </g>

            {/* Pions de départ relevés à cy=238 (hors bordure) */}
            <circle cx="210" cy="238" r="11" fill="#FAF6EE" stroke="#D4AF37" strokeWidth="1.5" />
            <circle cx="460" cy="238" r="11" fill="#FAF6EE" stroke="#D4AF37" strokeWidth="1.5" />

            {/* Flèches courbes qui convergent vers la flèche 5 */}
            <path d="M 210 224 Q 278 185 338 220" fill="none" stroke="#D4AF37" strokeWidth="3" markerEnd="url(#lesson-arrow-gold)" />
            <path d="M 460 224 Q 412 185 354 220" fill="none" stroke="#D4AF37" strokeWidth="3" markerEnd="url(#lesson-arrow-gold)" />

            {/* Porte résultante (2 pions sur flèche 5) */}
            <circle cx="346" cy="238" r="11" fill="#FAF6EE" stroke="#D4AF37" strokeWidth="1.5" />
            <circle cx="346" cy="220" r="11" fill="#FAF6EE" stroke="#D4AF37" strokeWidth="1.5" />

            {/* Cartouche opaque vert relevé à y=158 (au-dessus des flèches) */}
            <g transform="translate(346, 158)">
              <rect x="-110" y="-11" width="220" height="22" rx="6" fill="#090B10" fillOpacity="0.95" stroke="#10B981" strokeWidth="1" />
              <text x="0" y="4" fill="#34D399" fontSize="10.5" fontWeight="black" textAnchor="middle">
                {isEn ? 'Convergence = Impassable Gate' : 'Convergence = Bouclier Imprenable'}
              </text>
            </g>
          </g>
        )}

        {/* 5. FRAPPER UN PION ADVERSE ISOLÉ */}
        {quizId === 5 && (
          <g>
            <circle cx="120" cy="35" r="12" fill="#FAF6EE" stroke="#D4AF37" strokeWidth="2" />
            <line x1="135" y1="35" x2="265" y2="35" stroke="#D4AF37" strokeWidth="3" markerEnd="url(#lesson-arrow-gold)" />
            <circle cx="280" cy="35" r="12" fill="#18181B" stroke="#EF4444" strokeWidth="2" />
            <circle cx="280" cy="35" r="6" fill="none" stroke="#EF4444" strokeWidth="1" opacity="0.6" />
            <g transform="translate(360, 35)">
              <rect x="-65" y="-10" width="130" height="20" rx="5" fill="#090B10" fillOpacity="0.95" stroke="#EF4444" strokeOpacity="0.5" strokeWidth="0.8" />
              <text x="0" y="3.5" fill="#f87171" fontSize="9.5" fontWeight="bold" textAnchor="middle">{isEn ? 'Opponent blot' : 'Pion adverse seul'}</text>
            </g>
            <path d="M 280 47 Q 240 115 276 155" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeDasharray="4 3" markerEnd="url(#lesson-arrow-red)" />
            <g transform="translate(280, 185)">
              <rect x="-60" y="-10" width="120" height="20" rx="5" fill="#090B10" fillOpacity="0.95" stroke="#EF4444" strokeOpacity="0.6" strokeWidth="0.8" />
              <text x="0" y="3.5" fill="#ef4444" fontSize="10" fontWeight="black" textAnchor="middle">{isEn ? 'Central Bar' : 'Barre Centrale'}</text>
            </g>
          </g>
        )}

        {/* 6. SORTIR DE LA BARRE CENTRALE EN PRIORITÉ */}
        {quizId === 6 && (
          <g>
            {/* Zone de Rentrée en haut à droite (Cases 24 à 19) */}
            <rect x="296" y="5" width="240" height="115" fill="rgba(245, 158, 11, 0.08)" stroke="#F59E0B" strokeDasharray="4 4" rx="6" />
            <g transform="translate(416, 20)">
              <rect x="-85" y="-10" width="170" height="18" rx="6" fill="#090B10" fillOpacity="0.95" stroke="#F59E0B" strokeWidth="0.75" />
              <text x="0" y="3" fill="#FBBF24" fontSize="10" fontWeight="bold" textAnchor="middle">
                {isEn ? 'Re-entry Zone (Points 19 to 24)' : 'Zone de Rentrée (Cases 24 à 19)'}
              </text>
            </g>

            <rect x="268" y="95" width="24" height="85" fill="rgba(239, 68, 68, 0.25)" stroke="#ef4444" rx="4" />
            <circle cx="280" cy="135" r="12" fill="#FAF6EE" stroke="#ef4444" strokeWidth="2.5" />
            <path d="M 280 120 Q 330 65 410 40" fill="none" stroke="#D4AF37" strokeWidth="3" markerEnd="url(#lesson-arrow-gold)" />
            <g transform="translate(280, 195)">
              <rect x="-80" y="-10" width="160" height="20" rx="6" fill="#090B10" fillOpacity="0.95" stroke="#F59E0B" strokeOpacity="0.8" strokeWidth="1" />
              <text x="0" y="3.5" fill="#FBBF24" fontSize="10" fontWeight="black" textAnchor="middle">{isEn ? 'Priority #1 : Enter first' : 'Priorité #1 : Rentrer en jeu'}</text>
            </g>
          </g>
        )}

        {/* 7. LE MUR DE PORTES (INFRANCHISSABLE) */}
        {quizId === 7 && (
          <g>
            {[316, 356, 396, 436].map((x, i) => (
              <g key={i}>
                <circle cx={x} cy="238" r="11" fill="#FAF6EE" stroke="#D4AF37" strokeWidth="1.5" />
                <circle cx={x} cy="218" r="11" fill="#FAF6EE" stroke="#D4AF37" strokeWidth="1.5" />
                <rect x={x - 6} y="194" width="12" height="18" fill="rgba(212,175,55,0.4)" stroke="#D4AF37" rx="2" />
              </g>
            ))}
            <g transform="translate(376, 148)">
              <rect x="-105" y="-11" width="210" height="22" rx="6" fill="#090B10" fillOpacity="0.95" stroke="#D4AF37" strokeWidth="0.8" />
              <text x="0" y="3.5" fill="#F3E5AB" fontSize="10.5" fontWeight="black" textAnchor="middle">{isEn ? 'Wall of Gates (Unpassable)' : 'Mur de Portes (Infranchissable)'}</text>
            </g>
            <circle cx="476" cy="238" r="12" fill="#18181B" stroke="#EF4444" strokeWidth="2" />
            <circle cx="476" cy="238" r="5" fill="#EF4444" fillOpacity="0.3" />
            <g transform="translate(476, 190)">
              <rect x="-65" y="-10" width="130" height="20" rx="6" fill="#090B10" fillOpacity="0.95" stroke="#EF4444" strokeWidth="0.8" />
              <text x="0" y="3.5" fill="#FCA5A5" fontSize="10" fontWeight="bold" textAnchor="middle">{isEn ? 'Opponent checker blocked' : 'Pion adverse bloqué'}</text>
            </g>
          </g>
        )}

        {/* 8. QUAND A-T-ON LE DROIT DE SORTIR SES PIONS ? */}
        {quizId === 8 && (
          <g>
            <rect x="296" y="140" width="240" height="115" fill="rgba(239, 68, 68, 0.05)" stroke="#ef4444" strokeDasharray="4 4" rx="6" />

            {[
              [316, 238], [316, 218], [316, 198], [356, 238], [356, 218], [356, 198],
              [396, 238], [396, 218], [396, 198], [436, 238], [436, 218], [436, 198],
              [476, 238], [476, 218],
            ].map(([x, y], idx) => (
              <circle key={idx} cx={x} cy={y} r="10.5" fill="#FAF6EE" stroke="#D4AF37" strokeWidth="1.2" />
            ))}

            <g transform="translate(568, 200)">
              <rect x="-26" y="-12" width="52" height="24" rx="5" fill="#090B10" fillOpacity="0.95" stroke="#ef4444" strokeWidth="1" />
              <text x="0" y="4.5" fill="#ef4444" fontSize="10" fontWeight="black" textAnchor="middle">✕ BLOQUÉ</text>
            </g>

            <g transform="translate(416, 160)">
              <rect x="-105" y="-11" width="210" height="22" rx="6" fill="#090B10" fillOpacity="0.95" stroke="#ef4444" strokeWidth="1" />
              <text x="0" y="3.5" fill="#fca5a5" fontSize="10" fontWeight="black" textAnchor="middle">
                {isEn ? 'Bear-off blocked (14/15 Home)' : 'Sortie bloquée (14/15 dans la Maison)'}
              </text>
            </g>

            <circle cx="100" cy="238" r="11" fill="#FAF6EE" stroke="#ef4444" strokeWidth="2.5" />
            <g transform="translate(100, 195)">
              <rect x="-65" y="-10" width="130" height="20" rx="6" fill="#090B10" fillOpacity="0.95" stroke="#ef4444" strokeWidth="1" />
              <text x="0" y="3.5" fill="#fca5a5" fontSize="9.5" fontWeight="black" textAnchor="middle">
                {isEn ? '1 Laggard Outside!' : '1 Retardataire Dehors !'}
              </text>
            </g>
          </g>
        )}

        {/* 9. GAGNER DOUBLE (GAMMON X2) */}
        {quizId === 9 && (
          <g>
            {Array.from({ length: 15 }).map((_, idx) => (
              <rect key={idx} x="556" y={256 - idx * 16} width="38" height="11" rx="3" fill="#FAF6EE" stroke="#D4AF37" strokeWidth="1" />
            ))}
            <g transform="translate(270, 125)">
              <rect x="-115" y="-30" width="230" height="60" fill="#090B10" fillOpacity="0.95" stroke="#eab308" strokeWidth="1.5" rx="8" />
              <text x="0" y="-5" fill="#F3E5AB" fontSize="16" fontWeight="black" textAnchor="middle">×2 POINTS</text>
              <text x="0" y="15" fill="#fbbf24" fontSize="10" fontWeight="bold" textAnchor="middle">{isEn ? 'Gammon : Opponent bore off 0 checkers' : "Gammon : L'adversaire n'en a sorti aucun"}</text>
            </g>
          </g>
        )}

        {/* 10. LE DÉ MULTIPLICATEUR (VIDEAU) */}
        {quizId === 10 && (
          <g>
            <g transform="translate(286, 115)">
              <rect x="-26" y="-26" width="52" height="52" rx="10" fill="#18181b" stroke="#D4AF37" strokeWidth="2.5" />
              <text x="0" y="10" fill="#F3E5AB" fontSize="28" fontWeight="black" textAnchor="middle">2</text>
            </g>
            <g transform="translate(286, 185)">
              <rect x="-135" y="-10" width="270" height="20" rx="6" fill="#090B10" fillOpacity="0.95" stroke="#D4AF37" strokeWidth="0.75" />
              <text x="0" y="3.5" fill="#F3E5AB" fontSize="11" fontWeight="black" textAnchor="middle">{isEn ? 'Doubling Cube : Propose to Double Match Stakes' : 'Dé Multiplicateur : Proposez de Doubler la Mise'}</text>
            </g>
          </g>
        )}
      </svg>
    </div>
  );
});

AcademyVisualBoardLesson.displayName = 'AcademyVisualBoardLesson';
