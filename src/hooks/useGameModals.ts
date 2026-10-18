/**
 * Hook de gestion de l'état des modales du jeu Backgammon.
 *
 * Rôle :
 *   Centralise l'ouverture, la fermeture et les identifiants actifs de toutes les fenêtres
 *   modales de l'application (Matchmaking, Bilan, Livre d'ouvertures, Export/Import, Théorie).
 *
 * Dépendances :
 *   `react` (`useState`, `useCallback`).
 *
 * Retrait :
 *   Supprimer ce fichier et réintégrer les états de modales dans `page.tsx`.
 */

import { useState, useCallback } from 'react';

export function useGameModals() {
    const [isMatchmakingModalOpen, setIsMatchmakingModalOpen] = useState(false);
    const [isGameReviewModalOpen, setIsGameReviewModalOpen] = useState(false);
    const [isOpeningBookModalOpen, setIsOpeningBookModalOpen] = useState(false);
    const [selectedOpeningIdForModal, setSelectedOpeningIdForModal] = useState<string | undefined>(undefined);
    const [isExportImportModalOpen, setIsExportImportModalOpen] = useState(false);
    const [isKnowledgeModalOpen, setIsKnowledgeModalOpen] = useState(false);
    const [selectedKnowledgeConceptId, setSelectedKnowledgeConceptId] = useState<string | undefined>(undefined);
    const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

    const openMatchmaking = useCallback(() => setIsMatchmakingModalOpen(true), []);
    const closeMatchmaking = useCallback(() => setIsMatchmakingModalOpen(false), []);

    const openGameReview = useCallback(() => setIsGameReviewModalOpen(true), []);
    const closeGameReview = useCallback(() => setIsGameReviewModalOpen(false), []);

    const openOpeningBook = useCallback((id?: string) => {
        setSelectedOpeningIdForModal(id);
        setIsOpeningBookModalOpen(true);
    }, []);
    const closeOpeningBook = useCallback(() => setIsOpeningBookModalOpen(false), []);

    const openExportImport = useCallback(() => setIsExportImportModalOpen(true), []);
    const closeExportImport = useCallback(() => setIsExportImportModalOpen(false), []);

    const openKnowledgeBase = useCallback((conceptId?: string) => {
        setSelectedKnowledgeConceptId(conceptId);
        setIsKnowledgeModalOpen(true);
    }, []);
    const closeKnowledgeBase = useCallback(() => setIsKnowledgeModalOpen(false), []);

    const openMobileDrawer = useCallback(() => setIsMobileDrawerOpen(true), []);
    const closeMobileDrawer = useCallback(() => setIsMobileDrawerOpen(false), []);

    return {
        // Matchmaking
        isMatchmakingModalOpen,
        openMatchmaking,
        closeMatchmaking,
        // Game Review
        isGameReviewModalOpen,
        openGameReview,
        closeGameReview,
        // Opening Book
        isOpeningBookModalOpen,
        selectedOpeningIdForModal,
        openOpeningBook,
        closeOpeningBook,
        // Export / Import
        isExportImportModalOpen,
        openExportImport,
        closeExportImport,
        // Knowledge Base
        isKnowledgeModalOpen,
        selectedKnowledgeConceptId,
        openKnowledgeBase,
        closeKnowledgeBase,
        // Mobile Drawer
        isMobileDrawerOpen,
        openMobileDrawer,
        closeMobileDrawer,
    };
}
