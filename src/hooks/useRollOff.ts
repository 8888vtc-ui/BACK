/**
 * Hook de tirage au sort initial (Roll-off) pour déterminer le premier joueur.
 *
 * Rôle :
 *   Gère le lancer de dés simultané de début de match pour X et O et détermine qui commence.
 *
 * Dépendances :
 *   `rollOff` (`performRollOff`), `toast`.
 *
 * Retrait :
 *   Supprimer ce fichier et réintégrer le roll-off dans `page.tsx`.
 */

import { useState, useCallback } from 'react';
import { performRollOff } from '../components/board/rollOff';
import type { Player } from '../engine/backgammonEngine';
import { toast } from '../components/toast/ToastContext';

export interface UseRollOffOptions {
    onSuccess?: (winner: Player, dice: [number, number]) => void;
}

export function useRollOff(options?: UseRollOffOptions) {
    const [rollOff, setRollOff] = useState<{
        xDie: number | null;
        oDie: number | null;
        winner: Player | null;
    }>({ xDie: null, oDie: null, winner: null });
    const [rollOffDone, setRollOffDone] = useState(false);

    const handleRollOff = useCallback(() => {
        const result = performRollOff();
        setRollOff({ xDie: result.xDie, oDie: result.oDie, winner: result.winner });
        if (result.winner) {
            setRollOffDone(true);
            options?.onSuccess?.(result.winner, [result.xDie, result.oDie]);
            toast.info(`Le joueur ${result.winner} commence (X: ${result.xDie}, O: ${result.oDie}).`, 'Dé de démarrage');
        } else {
            toast.info(`Égalité (${result.xDie} - ${result.oDie}) — relancez les dés.`, 'Dé de démarrage');
        }
    }, [options]);

    const resetRollOff = useCallback(() => {
        setRollOff({ xDie: null, oDie: null, winner: null });
        setRollOffDone(false);
    }, []);

    return { rollOff, rollOffDone, handleRollOff, resetRollOff };
}

