'use client';

/**
 * @file src/components/beginner/AcademyVisualBoardLesson.tsx
 * @description Plateau visuel interactif SVG pour les 10 leçons/quiz de l'Académie Débutant.
 * Affiche l'échiquier réel, les pions, la maison, la barre et les flèches d'action sans jargon.
 * Strictement <= 250 lignes, 0 `any`.
 */

import React from 'react';

export interface AcademyVisualBoardLessonProps {
  readonly quizId: number;
  readonly isEn: boolean;
}

function getPointX(pt: number): number {
  if (pt >= 13 && pt <= 18) return 30 + (pt - 13) * 38 + 19;
  if (pt >= 19 && pt <= 24) return 308 + (pt - 19) * 38 + 19;
  if (pt >= 7 && pt <= 12) return 30 + (12 - pt) * 38 + 19;
  return 308 + (6 - pt) * 38 + 19;
}

export const AcademyVisualBoardLesson: React.FC<AcademyVisualBoardLessonProps> = React.memo(({
  quizId,
  isEn,
}) => {
  return (
    <div
      data-testid="academy-visual-board-lesson"
      className="relative w-full aspect-[600/280] min-h-[220px] rounded-xl border border-amber-400/30 bg-[#07130e] shadow-2xl overflow-hidden select-none"
    >
      <svg viewBox="0 0 600 280" className="w-full h-full">
        <defs>
          <marker id="lesson-arrow-gold" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
            <polygon points="0 0, 6 3, 0 6" fill="#D4AF37" />
          </marker>
          <marker id="lesson-arrow-red" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
            <polygon points="0 0, 6 3, 0 6" fill="#ef4444" />
          </marker>
          <filter id="lesson-gold-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Tapis de feutre émeraude & boiserie */}
        <rect x="0" y="0" width="600" height="280" fill="#091813" />
        <rect x="272" y="0" width="28" height="280" fill="#040b08" stroke="#D4AF37" strokeOpacity="0.3" />
        <rect x="552" y="0" width="48" height="280" fill="#050e0a" stroke="#D4AF37" strokeOpacity="0.4" />

        {/* 24 Flèches triangulaires */}
        {Array.from({ length: 24 }, (_, i) => i + 1).map((pt) => {
          const x = getPointX(pt);
          const isTop = pt >= 13;
          return (
            <polygon
              key={pt}
              points={`${x - 17},${isTop ? 0 : 280} ${x + 17},${isTop ? 0 : 280} ${x},${isTop ? 105 : 175}`}
              fill={pt % 2 === 1 ? '#42200f' : '#b28647'}
              opacity={pt <= 6 ? '0.85' : '0.55'}
            />
          );
        })}

        {/* Zone Votre Maison (Sortie) toujours visible en bas à droite */}
        <rect x="300" y="145" width="248" height="130" fill="rgba(16, 185, 129, 0.12)" stroke="#10B981" strokeDasharray="4 4" rx="6" />
        <text x="424" y="165" fill="#34D399" fontSize="11" fontWeight="bold" textAnchor="middle">
          🏠 {isEn ? 'Your Home Board (Exit)' : 'Votre Maison (Sortie)'}
        </text>

        {/* ================= SCÉNARIOS VISUELS 1 À 10 ================= */}

        {/* 1. SENS DE MARCHE */}
        {quizId === 1 && (
          <g>
            <path
              d="M 515 35 L 45 35 C 10 35 10 245 45 245 L 480 245"
              fill="none"
              stroke="#D4AF37"
              strokeWidth="5"
              strokeDasharray="10 5"
              markerEnd="url(#lesson-arrow-gold)"
              filter="url(#lesson-gold-glow)"
            />
            <text x="260" y="25" fill="#F3E5AB" fontSize="11" fontWeight="black" textAnchor="middle">
              ✨ {isEn ? 'Chemin A : Sens en Fer à Cheval vers Votre Maison' : 'Chemin A : Sens en Fer à Cheval vers Votre Maison'}
            </text>
            <path d="M 460 220 L 320 220" fill="none" stroke="#ef4444" strokeWidth="2.5" markerEnd="url(#lesson-arrow-red)" />
            <text x="390" y="210" fill="#f87171" fontSize="9" fontWeight="bold" textAnchor="middle">❌ Mauvais sens</text>
          </g>
        )}

        {/* 2. LE BUT DU JEU (Sortir ses 15 dames) */}
        {quizId === 2 && (
          <g>
            {Array.from({ length: 15 }).map((_, idx) => (
              <circle key={idx} cx={330 + (idx % 6) * 35} cy={250 - Math.floor(idx / 6) * 20} r="10" fill="#ffffff" stroke="#D4AF37" strokeWidth="1.5" />
            ))}
            <line x1="520" y1="240" x2="565" y2="240" stroke="#D4AF37" strokeWidth="4" markerEnd="url(#lesson-arrow-gold)" filter="url(#lesson-gold-glow)" />
            <text x="424" y="190" fill="#F3E5AB" fontSize="12" fontWeight="black" textAnchor="middle">
              🏆 {isEn ? '15 Checkers Home -> Bear Off into Tray' : '15 Dames à la Maison -> Sortie au Sabot'}
            </text>
          </g>
        )}

        {/* 3. PION SEUL VS PORTE (BOUCLIER) */}
        {quizId === 3 && (
          <g>
            {/* Pion seul en danger */}
            <circle cx="150" cy="245" r="13" fill="#ffffff" stroke="#ef4444" strokeWidth="3" />
            <circle cx="150" cy="245" r="20" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 3" />
            <text x="150" y="215" fill="#f87171" fontSize="10" fontWeight="bold" textAnchor="middle">⚠️ {isEn ? 'Single Checker (In danger)' : 'Pion Seul (En danger)'}</text>

            {/* Porte de 2 pions = Bouclier */}
            <circle cx="420" cy="250" r="12" fill="#ffffff" stroke="#D4AF37" strokeWidth="2" />
            <circle cx="420" cy="230" r="12" fill="#ffffff" stroke="#D4AF37" strokeWidth="2" />
            <text x="420" y="205" fill="#34D399" fontSize="11" fontWeight="black" textAnchor="middle">🛡️ {isEn ? 'Gate (2 Checkers = Shield)' : 'Porte (2 Pions = Bouclier)'}</text>
          </g>
        )}

        {/* 4. CONSTRUIRE UNE PORTE AVEC LES DÉS */}
        {quizId === 4 && (
          <g>
            <circle cx="210" cy="250" r="11" fill="#ffffff" stroke="#D4AF37" strokeWidth="1.5" />
            <circle cx="460" cy="250" r="11" fill="#ffffff" stroke="#D4AF37" strokeWidth="1.5" />
            <path d="M 210 235 Q 280 180 345 225" fill="none" stroke="#D4AF37" strokeWidth="3" markerEnd="url(#lesson-arrow-gold)" />
            <path d="M 460 235 Q 400 180 347 225" fill="none" stroke="#D4AF37" strokeWidth="3" markerEnd="url(#lesson-arrow-gold)" />
            <circle cx="346" cy="250" r="12" fill="#ffffff" stroke="#D4AF37" strokeWidth="2" />
            <text x="346" y="200" fill="#34D399" fontSize="11" fontWeight="black" textAnchor="middle">🛡️ {isEn ? 'Convergence = Impassable Gate' : 'Convergence = Bouclier Imprenable'}</text>
          </g>
        )}

        {/* 5. FRAPPER UN PION ADVERSE ISOLÉ */}
        {quizId === 5 && (
          <g>
            <circle cx="120" cy="35" r="12" fill="#ffffff" stroke="#D4AF37" strokeWidth="2" />
            <line x1="135" y1="35" x2="265" y2="35" stroke="#D4AF37" strokeWidth="3" markerEnd="url(#lesson-arrow-gold)" />
            <circle cx="280" cy="35" r="12" fill="#18181b" stroke="#ef4444" strokeWidth="2" />
            <text x="280" y="60" fill="#f87171" fontSize="9" fontWeight="bold" textAnchor="middle">🎯 {isEn ? 'Opponent blot' : 'Pion adverse seul'}</text>
            <path d="M 280 35 Q 260 100 286 140" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeDasharray="4 3" markerEnd="url(#lesson-arrow-red)" />
            <text x="286" y="160" fill="#ef4444" fontSize="10" fontWeight="black" textAnchor="middle">🔒 {isEn ? 'To the Bar!' : 'Barre Centrale'}</text>
          </g>
        )}

        {/* 6. SORTIR DE LA BARRE CENTRALE EN PRIORITÉ */}
        {quizId === 6 && (
          <g>
            <rect x="272" y="100" width="28" height="80" fill="rgba(239, 68, 68, 0.25)" stroke="#ef4444" rx="4" />
            <circle cx="286" cy="140" r="12" fill="#ffffff" stroke="#ef4444" strokeWidth="2.5" />
            <path d="M 286 140 Q 320 80 430 35" fill="none" stroke="#D4AF37" strokeWidth="3" markerEnd="url(#lesson-arrow-gold)" />
            <text x="286" y="195" fill="#fca5a5" fontSize="10" fontWeight="black" textAnchor="middle">🔒 {isEn ? 'Priority #1 : Enter first' : 'Priorité #1 : Rentrer en jeu'}</text>
          </g>
        )}

        {/* 7. LE MUR DE PORTES (PRIME) */}
        {quizId === 7 && (
          <g>
            {[170, 208, 246, 326].map((x, i) => (
              <g key={i}>
                <circle cx={x} cy="250" r="10" fill="#ffffff" stroke="#D4AF37" strokeWidth="1" />
                <circle cx={x} cy="235" r="10" fill="#ffffff" stroke="#D4AF37" strokeWidth="1" />
                <rect x={x - 6} y="200" width="12" height="20" fill="rgba(212,175,55,0.4)" stroke="#D4AF37" rx="2" />
              </g>
            ))}
            <text x="250" y="190" fill="#F3E5AB" fontSize="11" fontWeight="black" textAnchor="middle">🧱 {isEn ? 'Continuous Wall of Gates (Prime)' : 'Mur Continu de Portes (Prime)'}</text>
            <circle cx="120" cy="245" r="11" fill="#18181b" stroke="#ef4444" strokeWidth="2" />
            <text x="120" y="215" fill="#fca5a5" fontSize="9" fontWeight="bold" textAnchor="middle">⛔ Bloqué !</text>
          </g>
        )}

        {/* 8. QUAND A-T-ON LE DROIT DE SORTIR SES PIONS ? */}
        {quizId === 8 && (
          <g>
            {Array.from({ length: 14 }).map((_, idx) => (
              <circle key={idx} cx={340 + (idx % 5) * 36} cy={250 - Math.floor(idx / 5) * 18} r="9" fill="#ffffff" stroke="#D4AF37" strokeWidth="1" />
            ))}
            {/* 1 pion retardataire dehors */}
            <circle cx="100" cy="245" r="12" fill="#ffffff" stroke="#ef4444" strokeWidth="3" />
            <text x="100" y="215" fill="#fca5a5" fontSize="10" fontWeight="black" textAnchor="middle">⏳ {isEn ? '1 Laggard Outside!' : '1 Retardataire Dehors !'}</text>
            <text x="424" y="185" fill="#f87171" fontSize="11" fontWeight="bold" textAnchor="middle">⛔ {isEn ? 'Cannot bear off yet (All 15 must be home)' : 'Sortie interdite tant que les 15 ne sont pas rentrés'}</text>
          </g>
        )}

        {/* 9. GAGNER DOUBLE (GAMMON X2) */}
        {quizId === 9 && (
          <g>
            {/* Sabot plein 15/15 */}
            {Array.from({ length: 15 }).map((_, idx) => (
              <rect key={idx} x="556" y={260 - idx * 16} width="38" height="11" rx="3" fill="#ffffff" stroke="#D4AF37" strokeWidth="1" />
            ))}
            <rect x="180" y="90" width="180" height="70" fill="rgba(234, 179, 8, 0.15)" stroke="#eab308" strokeWidth="2" rx="8" />
            <text x="270" y="125" fill="#F3E5AB" fontSize="16" fontWeight="black" textAnchor="middle">🔥 ×2 POINTS</text>
            <text x="270" y="145" fill="#fbbf24" fontSize="10" fontWeight="bold" textAnchor="middle">Gammon : {isEn ? 'Opponent bore off 0 checkers' : "L'adversaire n'en a sorti aucun"}</text>
          </g>
        )}

        {/* 10. LE DÉ MULTIPLICATEUR (VIDEAU) */}
        {quizId === 10 && (
          <g>
            <g transform="translate(286, 120)">
              <rect x="-26" y="-26" width="52" height="52" rx="10" fill="#18181b" stroke="#D4AF37" strokeWidth="3" filter="url(#lesson-gold-glow)" />
              <text x="0" y="10" fill="#F3E5AB" fontSize="28" fontWeight="black" textAnchor="middle">2</text>
            </g>
            <text x="286" y="180" fill="#F3E5AB" fontSize="12" fontWeight="black" textAnchor="middle">
              🎲 {isEn ? 'Doubling Cube : Propose to Double Match Stakes' : 'Dé Multiplicateur : Proposez de Doubler la Mise'}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
});

AcademyVisualBoardLesson.displayName = 'AcademyVisualBoardLesson';

