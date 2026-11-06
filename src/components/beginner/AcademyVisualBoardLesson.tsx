'use client';

/**
 * @file src/components/beginner/AcademyVisualBoardLesson.tsx
 * @description Plateau visuel interactif SVG pour les 10 leçons/quiz de l'Académie Débutant.
 * Affiche l'échiquier réel, les pions, la maison, la barre et les flèches d'action sans jargon.
 * Pilules sombres opaques anti-collision, zéro blur sur les pions blancs, hauteur <= 210px.
 * Strictement <= 260 lignes, 0 `any`.
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
          <marker id="lesson-arrow-gold" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
            <polygon points="0 0, 6 3, 0 6" fill="#D4AF37" />
          </marker>
          <marker id="lesson-arrow-red" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
            <polygon points="0 0, 6 3, 0 6" fill="#ef4444" />
          </marker>
        </defs>

        {/* Tapis de feutre émeraude & boiserie symétrique */}
        <rect x="0" y="0" width="600" height="260" fill="#091813" />
        <rect x="264" y="0" width="32" height="260" fill="#040b08" stroke="#D4AF37" strokeOpacity="0.3" />
        <rect x="536" y="0" width="64" height="260" fill="#050e0a" stroke="#D4AF37" strokeOpacity="0.4" />

        {/* 24 Flèches triangulaires strictement identiques (6 à gauche, barre 32px, 6 à droite) */}
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

        {/* Zone Votre Maison (Sortie) toujours visible en bas à droite (cases 1 à 6) */}
        <rect x="296" y="140" width="240" height="115" fill="rgba(16, 185, 129, 0.08)" stroke="#10B981" strokeDasharray="4 4" rx="6" />
        <g transform="translate(416, 155)">
          <rect x="-85" y="-10" width="170" height="18" rx="6" fill="#090B10" fillOpacity="0.94" stroke="#10B981" strokeWidth="0.75" />
          <text x="0" y="3" fill="#34D399" fontSize="10" fontWeight="bold" textAnchor="middle">
            {isEn ? 'Your Home Board (Cases 1 to 6)' : 'Votre Maison (Cases 1 à 6)'}
          </text>
        </g>

        {/* ================= SCÉNARIOS VISUELS 1 À 10 ================= */}

        {/* 1. SENS DE CIRCULATION EN FER À CHEVAL */}
        {quizId === 1 && (
          <g>
            <circle cx="516" cy="22" r="14" fill="#F8F5EE" stroke="#D4AF37" strokeWidth="1.5" />
            <circle cx="516" cy="22" r="8" fill="none" stroke="#D4AF37" strokeWidth="0.75" opacity="0.6" />
            <circle cx="516" cy="48" r="14" fill="#F8F5EE" stroke="#D4AF37" strokeWidth="1.5" />
            <circle cx="516" cy="48" r="8" fill="none" stroke="#D4AF37" strokeWidth="0.75" opacity="0.6" />

            <g transform="translate(516, 76)">
              <rect x="-44" y="-10" width="88" height="18" rx="6" fill="#090B10" fillOpacity="0.94" stroke="#D4AF37" strokeWidth="0.75" />
              <text x="0" y="3" fill="#F3E5AB" fontSize="9" fontWeight="bold" textAnchor="middle">
                {isEn ? 'Start: Pt 24' : 'Départ : Case 24'}
              </text>
            </g>

            <path
              d="M 498 48 L 44 48 C 10 48 10 220 44 220 L 460 220"
              fill="none"
              stroke="#D4AF37"
              strokeWidth="5"
              strokeDasharray="10 5"
              markerEnd="url(#lesson-arrow-gold)"
            />

            <g transform="translate(280, 32)">
              <rect x="-140" y="-12" width="280" height="22" rx="6" fill="#090B10" fillOpacity="0.94" stroke="#D4AF37" strokeWidth="0.75" />
              <text x="0" y="3.5" fill="#F3E5AB" fontSize="11" fontWeight="black" textAnchor="middle">
                {isEn ? 'Chemin en Fer à Cheval (Case 24 → Case 1)' : 'Chemin en Fer à Cheval (Case 24 → Case 1)'}
              </text>
            </g>
          </g>
        )}

        {/* 2. LE BUT DU JEU (Sortir ses 15 dames) */}
        {quizId === 2 && (
          <g>
            {Array.from({ length: 15 }).map((_, idx) => (
              <circle key={idx} cx={330 + (idx % 6) * 35} cy={235 - Math.floor(idx / 6) * 18} r="9" fill="#F8F5EE" stroke="#D4AF37" strokeWidth="1.5" />
            ))}
            <line x1="520" y1="220" x2="565" y2="220" stroke="#D4AF37" strokeWidth="4" markerEnd="url(#lesson-arrow-gold)" />
            <g transform="translate(424, 185)">
              <rect x="-115" y="-10" width="230" height="18" rx="6" fill="#090B10" fillOpacity="0.94" stroke="#D4AF37" strokeWidth="0.75" />
              <text x="0" y="3" fill="#F3E5AB" fontSize="10" fontWeight="black" textAnchor="middle">
                {isEn ? '15 Checkers Home → Bear Off into Tray' : '15 Dames à la Maison → Sortie au Sabot'}
              </text>
            </g>
          </g>
        )}

        {/* 3. PION SEUL VS PORTE (BOUCLIER) */}
        {quizId === 3 && (
          <g>
            {/* Pion seul en danger */}
            <circle cx="150" cy="245" r="12" fill="#F8F5EE" stroke="#ef4444" strokeWidth="2.5" />
            <circle cx="150" cy="245" r="18" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 3" />
            <g transform="translate(150, 192)">
              <rect x="-75" y="-10" width="150" height="20" rx="6" fill="#090B10" fillOpacity="0.94" stroke="#ef4444" strokeWidth="0.8" />
              <text x="0" y="3.5" fill="#f87171" fontSize="10" fontWeight="bold" textAnchor="middle">
                {isEn ? 'Single Checker (In danger)' : 'Pion Seul (En danger)'}
              </text>
            </g>

            {/* Porte de 2 pions = Bouclier */}
            <circle cx="420" cy="250" r="11" fill="#F8F5EE" stroke="#D4AF37" strokeWidth="1.5" />
            <circle cx="420" cy="230" r="11" fill="#F8F5EE" stroke="#D4AF37" strokeWidth="1.5" />
            <g transform="translate(420, 192)">
              <rect x="-85" y="-10" width="170" height="20" rx="6" fill="#090B10" fillOpacity="0.94" stroke="#10B981" strokeWidth="0.8" />
              <text x="0" y="3.5" fill="#34D399" fontSize="10.5" fontWeight="black" textAnchor="middle">
                {isEn ? 'Gate (2 Checkers = Shield)' : 'Porte (2 Pions = Bouclier)'}
              </text>
            </g>
          </g>
        )}

        {/* 4. CONSTRUIRE UNE PORTE AVEC LES DÉS */}
        {quizId === 4 && (
          <g>
            <circle cx="210" cy="250" r="11" fill="#F8F5EE" stroke="#D4AF37" strokeWidth="1.5" />
            <circle cx="460" cy="250" r="11" fill="#F8F5EE" stroke="#D4AF37" strokeWidth="1.5" />
            <path d="M 210 235 Q 280 180 345 225" fill="none" stroke="#D4AF37" strokeWidth="3" markerEnd="url(#lesson-arrow-gold)" />
            <path d="M 460 235 Q 400 180 347 225" fill="none" stroke="#D4AF37" strokeWidth="3" markerEnd="url(#lesson-arrow-gold)" />
            <circle cx="346" cy="250" r="11" fill="#F8F5EE" stroke="#D4AF37" strokeWidth="2" />
            <g transform="translate(346, 192)">
              <rect x="-105" y="-10" width="210" height="20" rx="6" fill="#090B10" fillOpacity="0.94" stroke="#10B981" strokeWidth="0.8" />
              <text x="0" y="3.5" fill="#34D399" fontSize="10.5" fontWeight="black" textAnchor="middle">
                {isEn ? 'Convergence = Impassable Gate' : 'Convergence = Bouclier Imprenable'}
              </text>
            </g>
          </g>
        )}

        {/* 5. FRAPPER UN PION ADVERSE ISOLÉ */}
        {quizId === 5 && (
          <g>
            <circle cx="120" cy="35" r="12" fill="#F8F5EE" stroke="#D4AF37" strokeWidth="2" />
            <line x1="135" y1="35" x2="265" y2="35" stroke="#D4AF37" strokeWidth="3" markerEnd="url(#lesson-arrow-gold)" />
            <circle cx="280" cy="35" r="12" fill="#18181b" stroke="#ef4444" strokeWidth="2" />
            <g transform="translate(280, 68)">
              <rect x="-65" y="-9" width="130" height="18" rx="6" fill="#090B10" fillOpacity="0.94" stroke="#ef4444" strokeWidth="0.75" />
              <text x="0" y="3" fill="#f87171" fontSize="9" fontWeight="bold" textAnchor="middle">
                {isEn ? 'Opponent blot' : 'Pion adverse seul'}
              </text>
            </g>
            <path d="M 280 35 Q 260 100 286 140" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeDasharray="4 3" markerEnd="url(#lesson-arrow-red)" />
            <g transform="translate(286, 160)">
              <rect x="-55" y="-9" width="110" height="18" rx="6" fill="#090B10" fillOpacity="0.94" stroke="#ef4444" strokeWidth="0.75" />
              <text x="0" y="3" fill="#ef4444" fontSize="10" fontWeight="black" textAnchor="middle">
                {isEn ? 'To the Bar!' : 'Barre Centrale'}
              </text>
            </g>
          </g>
        )}

        {/* 6. SORTIR DE LA BARRE CENTRALE EN PRIORITÉ */}
        {quizId === 6 && (
          <g>
            <rect x="272" y="100" width="28" height="80" fill="rgba(239, 68, 68, 0.25)" stroke="#ef4444" rx="4" />
            <circle cx="286" cy="140" r="12" fill="#F8F5EE" stroke="#ef4444" strokeWidth="2.5" />
            <path d="M 286 140 Q 320 80 430 35" fill="none" stroke="#D4AF37" strokeWidth="3" markerEnd="url(#lesson-arrow-gold)" />
            <g transform="translate(286, 195)">
              <rect x="-75" y="-10" width="150" height="20" rx="6" fill="#090B10" fillOpacity="0.94" stroke="#ef4444" strokeWidth="0.75" />
              <text x="0" y="3.5" fill="#fca5a5" fontSize="10" fontWeight="black" textAnchor="middle">
                {isEn ? 'Priority #1 : Enter first' : 'Priorité #1 : Rentrer en jeu'}
              </text>
            </g>
          </g>
        )}

        {/* 7. LE MUR DE PORTES (PRIME) */}
        {quizId === 7 && (
          <g>
            {[170, 208, 246, 326].map((x, i) => (
              <g key={i}>
                <circle cx={x} cy="250" r="10" fill="#F8F5EE" stroke="#D4AF37" strokeWidth="1" />
                <circle cx={x} cy="235" r="10" fill="#F8F5EE" stroke="#D4AF37" strokeWidth="1" />
                <rect x={x - 6} y="200" width="12" height="20" fill="rgba(212,175,55,0.4)" stroke="#D4AF37" rx="2" />
              </g>
            ))}
            <g transform="translate(250, 182)">
              <rect x="-105" y="-10" width="210" height="20" rx="6" fill="#090B10" fillOpacity="0.94" stroke="#D4AF37" strokeWidth="0.75" />
              <text x="0" y="3.5" fill="#F3E5AB" fontSize="10.5" fontWeight="black" textAnchor="middle">
                {isEn ? 'Continuous Wall of Gates (Prime)' : 'Mur Continu de Portes (Prime)'}
              </text>
            </g>
            <circle cx="120" cy="245" r="11" fill="#18181b" stroke="#ef4444" strokeWidth="2" />
            <g transform="translate(120, 215)">
              <rect x="-35" y="-9" width="70" height="18" rx="6" fill="#090B10" fillOpacity="0.94" stroke="#ef4444" strokeWidth="0.75" />
              <text x="0" y="3" fill="#fca5a5" fontSize="9" fontWeight="bold" textAnchor="middle">Bloqué !</text>
            </g>
          </g>
        )}

        {/* 8. QUAND A-T-ON LE DROIT DE SORTIR SES PIONS ? */}
        {quizId === 8 && (
          <g>
            {Array.from({ length: 14 }).map((_, idx) => (
              <circle key={idx} cx={340 + (idx % 5) * 36} cy={250 - Math.floor(idx / 5) * 18} r="9" fill="#F8F5EE" stroke="#D4AF37" strokeWidth="1" />
            ))}
            <circle cx="100" cy="245" r="12" fill="#F8F5EE" stroke="#ef4444" strokeWidth="3" />
            <g transform="translate(100, 215)">
              <rect x="-65" y="-9" width="130" height="18" rx="6" fill="#090B10" fillOpacity="0.94" stroke="#ef4444" strokeWidth="0.75" />
              <text x="0" y="3" fill="#fca5a5" fontSize="9.5" fontWeight="black" textAnchor="middle">
                {isEn ? '1 Laggard Outside!' : '1 Retardataire Dehors !'}
              </text>
            </g>
            <g transform="translate(424, 182)">
              <rect x="-120" y="-9" width="240" height="18" rx="6" fill="#090B10" fillOpacity="0.94" stroke="#ef4444" strokeWidth="0.75" />
              <text x="0" y="3" fill="#f87171" fontSize="9" fontWeight="bold" textAnchor="middle">
                {isEn ? 'Cannot bear off yet (All 15 must be home)' : 'Sortie interdite tant que les 15 ne sont pas rentrés'}
              </text>
            </g>
          </g>
        )}

        {/* 9. GAGNER DOUBLE (GAMMON X2) */}
        {quizId === 9 && (
          <g>
            {Array.from({ length: 15 }).map((_, idx) => (
              <rect key={idx} x="556" y={260 - idx * 16} width="38" height="11" rx="3" fill="#F8F5EE" stroke="#D4AF37" strokeWidth="1" />
            ))}
            <g transform="translate(270, 125)">
              <rect x="-115" y="-30" width="230" height="60" fill="#090B10" fillOpacity="0.94" stroke="#eab308" strokeWidth="1.5" rx="8" />
              <text x="0" y="-5" fill="#F3E5AB" fontSize="16" fontWeight="black" textAnchor="middle">×2 POINTS</text>
              <text x="0" y="15" fill="#fbbf24" fontSize="10" fontWeight="bold" textAnchor="middle">
                Gammon : {isEn ? 'Opponent bore off 0 checkers' : "L'adversaire n'en a sorti aucun"}
              </text>
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
              <rect x="-135" y="-10" width="270" height="20" rx="6" fill="#090B10" fillOpacity="0.94" stroke="#D4AF37" strokeWidth="0.75" />
              <text x="0" y="3.5" fill="#F3E5AB" fontSize="11" fontWeight="black" textAnchor="middle">
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
