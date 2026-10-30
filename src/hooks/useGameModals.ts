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
import type { ReviewTab } from '../components/rating/GameReviewModal';

export function useGameModals() {
    const [isMatchmakingModalOpen, setIsMatchmakingModalOpen] = useState(false);
    const [isGameReviewModalOpen, setIsGameReviewModalOpen] = useState(false);
    const [reviewInitialTab, setReviewInitialTab] = useState<ReviewTab>('overview');
    const [isOpeningBookModalOpen, setIsOpeningBookModalOpen] = useState(false);
    const [selectedOpeningIdForModal, setSelectedOpeningIdForModal] = useState<string | undefined>(undefined);
    const [isExportImportModalOpen, setIsExportImportModalOpen] = useState(false);
    const [isKnowledgeModalOpen, setIsKnowledgeModalOpen] = useState(false);
    const [selectedKnowledgeConceptId, setSelectedKnowledgeConceptId] = useState<string | undefined>(undefined);
    const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
    const [isDiceAuditModalOpen, setIsDiceAuditModalOpen] = useState(false);
    const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
    const [isPrivateRoomModalOpen, setIsPrivateRoomModalOpen] = useState(false);
    const [privateRoomInitialCode, setPrivateRoomInitialCode] = useState<string | null>(null);

    const closeAllModals = useCallback(() => {
        setIsMatchmakingModalOpen(false);
        setIsPrivateRoomModalOpen(false);
        setIsGameReviewModalOpen(false);
        setIsOpeningBookModalOpen(false);
        setIsExportImportModalOpen(false);
        setIsKnowledgeModalOpen(false);
        setIsMobileDrawerOpen(false);
        setIsDiceAuditModalOpen(false);
        setIsSubscriptionModalOpen(false);
    }, []);

    const openMatchmaking = useCallback(() => {
        closeAllModals();
        setIsMatchmakingModalOpen(true);
    }, [closeAllModals]);
    const closeMatchmaking = useCallback(() => setIsMatchmakingModalOpen(false), []);

    const openPrivateRoomModal = useCallback((code?: string | null) => {
        closeAllModals();
        setPrivateRoomInitialCode(code ?? null);
        setIsPrivateRoomModalOpen(true);
    }, [closeAllModals]);
    const closePrivateRoomModal = useCallback(() => {
        setIsPrivateRoomModalOpen(false);
        setPrivateRoomInitialCode(null);
    }, []);

    const openGameReview = useCallback(() => {
        closeAllModals();
        setReviewInitialTab('overview');
        setIsGameReviewModalOpen(true);
    }, [closeAllModals]);
    const openGameCourse = useCallback(() => {
        closeAllModals();
        setReviewInitialTab('course');
        setIsGameReviewModalOpen(true);
    }, [closeAllModals]);
    const closeGameReview = useCallback(() => setIsGameReviewModalOpen(false), []);

    const openOpeningBook = useCallback((id?: string) => {
        closeAllModals();
        setSelectedOpeningIdForModal(id);
        setIsOpeningBookModalOpen(true);
    }, [closeAllModals]);
    const closeOpeningBook = useCallback(() => setIsOpeningBookModalOpen(false), []);

    const openExportImport = useCallback(() => {
        closeAllModals();
        setIsExportImportModalOpen(true);
    }, [closeAllModals]);
    const closeExportImport = useCallback(() => setIsExportImportModalOpen(false), []);

    const openKnowledgeBase = useCallback((conceptId?: string) => {
        closeAllModals();
        setSelectedKnowledgeConceptId(conceptId);
        setIsKnowledgeModalOpen(true);
    }, [closeAllModals]);
    const closeKnowledgeBase = useCallback(() => setIsKnowledgeModalOpen(false), []);

    const openMobileDrawer = useCallback(() => {
        closeAllModals();
        setIsMobileDrawerOpen(true);
    }, [closeAllModals]);
    const closeMobileDrawer = useCallback(() => setIsMobileDrawerOpen(false), []);

    const openDiceAudit = useCallback(() => {
        closeAllModals();
        setIsDiceAuditModalOpen(true);
    }, [closeAllModals]);
    const closeDiceAudit = useCallback(() => setIsDiceAuditModalOpen(false), []);

    const openSubscriptionModal = useCallback(() => {
        closeAllModals();
        setIsSubscriptionModalOpen(true);
    }, [closeAllModals]);
    const closeSubscriptionModal = useCallback(() => setIsSubscriptionModalOpen(false), []);

    return {
        // Matchmaking
        isMatchmakingModalOpen,
        openMatchmaking,
        closeMatchmaking,
        // Game Review
        isGameReviewModalOpen,
        reviewInitialTab,
        openGameReview,
        openGameCourse,
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
        // Dice Audit (Provably Fair SHA-256)
        isDiceAuditModalOpen,
        openDiceAudit,
        closeDiceAudit,
        // Subscription / Paywall Modal
        isSubscriptionModalOpen,
        openSubscriptionModal,
        closeSubscriptionModal,
        // Private Room Modal (Lien d'invitation directe 1-clic)
        isPrivateRoomModalOpen,
        privateRoomInitialCode,
        openPrivateRoomModal,
        closePrivateRoomModal,
    };
}
