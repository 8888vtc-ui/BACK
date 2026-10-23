'use client';

/**
 * Barre d'action contextuelle de tour — version minimale.
 *
 * Rôle :
 *   Ne s'affiche QUE lorsqu'une proposition de videau est en cours
 *   (`DoublingControls` : Prendre / Passer). Le bandeau « Tirage au sort
 *   d'ouverture », le bouton « Lancer les dés » et le rappel du dernier coup
 *   ont été définitivement retirés : ils vivent désormais dans le HUD unique
 *   (`MatchHud`) et les contrôles centraux du plateau.
 *
 * Dépendances :
 *   `DoublingControls`.
 *
 * Retrait :
 *   Supprimer ce fichier et son import dans `MatchHeader.tsx`.
 */

import React from 'react';
import DoublingControls from '../board/DoublingControls';
import type { Player } from '../../engine/backgammonEngine';
import type { GamePhase } from '../../hooks/useBackgammonGame';

export interface MatchTurnBarProps {
    /** Phase actuelle du jeu */
    phase: GamePhase;
    /** Valeur actuelle du videau */
    cubeValue: number;
    /** Possesseur du videau */
    cubeOwner: Player | null;
    /** Règle de Crawford active */
    crawford: boolean;
    /** Joueur ayant proposé le double (null si aucun) */
    doublingOfferedBy: Player | null;
    /** Joueur au trait */
    currentTurn: Player;
    /** Le joueur peut-il doubler ? */
    canDouble: boolean;
    /** Action d'acceptation du videau */
    onTakeDouble: () => void;
    /** Action de refus du videau */
    onPassDouble: () => void;
    /** Action de proposition du videau */
    onOfferDouble: () => void;
}

const MatchTurnBarComponent: React.FC<MatchTurnBarProps> = ({
    phase,
    cubeValue,
    cubeOwner,
    crawford,
    doublingOfferedBy,
    currentTurn,
    canDouble,
    onTakeDouble,
    onPassDouble,
    onOfferDouble,
}) => {
    // Aucune proposition de videau en cours → rien à afficher.
    if (!doublingOfferedBy) return null;

    return (
        <div className="w-full">
            <DoublingControls
                standalone={false}
                phase={phase}
                cubeValue={cubeValue}
                cubeOwner={cubeOwner}
                canDouble={canDouble}
                crawford={crawford}
                doublingOfferedBy={doublingOfferedBy}
                currentTurn={currentTurn}
                onOfferDouble={onOfferDouble}
                onTakeDouble={onTakeDouble}
                onPassDouble={onPassDouble}
            />
        </div>
    );
};

export const MatchTurnBar = React.memo(MatchTurnBarComponent);
export default MatchTurnBar;
