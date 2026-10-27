import type { UseBackgammonGameReturn } from '../useBackgammonGame';
import type { CompleteGameAnalysis, RawGameTurn } from '../../features/rating';

export interface MatchSnapshotRestorePayload {
    gameId?: string;
    xgid?: string;
    turns?: RawGameTurn[];
    analysis?: CompleteGameAnalysis | null;
    cubeValue?: number;
    cubeOwner?: 'X' | 'O' | null;
}

export interface UseGamePersistenceOptions {
    game: UseBackgammonGameReturn;
    isMultiplayerActive: boolean;
    t: (key: string) => string;
}
