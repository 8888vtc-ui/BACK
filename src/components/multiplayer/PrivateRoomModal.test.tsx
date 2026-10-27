// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import PrivateRoomModal from './PrivateRoomModal';

describe('PrivateRoomModal', () => {
    const mockOnCreateRoom = vi.fn().mockResolvedValue('BG-8888');
    const mockOnJoinRoom = vi.fn().mockResolvedValue(undefined);
    const mockOnClose = vi.fn();
    const mockOnCancelSearch = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    it('ne rend rien si isOpen est false', () => {
        const { container } = render(
            <PrivateRoomModal
                isOpen={false}
                onClose={mockOnClose}
                onCreatePrivateRoom={mockOnCreateRoom}
                onJoinPrivateRoom={mockOnJoinRoom}
                onCancelSearch={mockOnCancelSearch}
                privateRoomCode={null}
            />,
        );

        expect(container.firstChild).toBeNull();
    });

    it('affiche le formulaire de création par défaut et permet de créer un salon', async () => {
        render(
            <PrivateRoomModal
                isOpen={true}
                onClose={mockOnClose}
                onCreatePrivateRoom={mockOnCreateRoom}
                onJoinPrivateRoom={mockOnJoinRoom}
                onCancelSearch={mockOnCancelSearch}
                privateRoomCode={null}
            />,
        );

        expect(screen.getByText(/Salon Privé/i)).toBeTruthy();
        expect(screen.getByText('Créer un Salon')).toBeTruthy();

        const createButton = screen.getByTestId('create-room-btn');
        fireEvent.click(createButton);

        await waitFor(() => {
            expect(mockOnCreateRoom).toHaveBeenCalledTimes(1);
        });
    });

    it('affiche le code créé et les boutons de copie / partage direct', async () => {
        const writeTextMock = vi.fn().mockResolvedValue(undefined);
        Object.assign(navigator, {
            clipboard: { writeText: writeTextMock },
        });

        render(
            <PrivateRoomModal
                isOpen={true}
                onClose={mockOnClose}
                onCreatePrivateRoom={mockOnCreateRoom}
                onJoinPrivateRoom={mockOnJoinRoom}
                onCancelSearch={mockOnCancelSearch}
                privateRoomCode="BG-9999"
            />,
        );

        expect(screen.getByText('BG-9999')).toBeTruthy();
        expect(screen.getByText(/Votre Salon Privé est ouvert/i)).toBeTruthy();

        const copyLinkButton = screen.getByTestId('copy-invite-link-btn');
        fireEvent.click(copyLinkButton);

        await waitFor(() => {
            expect(writeTextMock).toHaveBeenCalledWith(expect.stringContaining('/?join=BG-9999'));
        });
    });

    it('pré-remplit le code et permet de rejoindre en 1 clic si initialRoomCode est fourni', () => {
        render(
            <PrivateRoomModal
                isOpen={true}
                onClose={mockOnClose}
                onCreatePrivateRoom={mockOnCreateRoom}
                onJoinPrivateRoom={mockOnJoinRoom}
                onCancelSearch={mockOnCancelSearch}
                privateRoomCode={null}
                initialRoomCode="BG-7XKZ"
            />,
        );

        const input = screen.getByRole('textbox') as HTMLInputElement;
        expect(input.value).toBe('BG-7XKZ');

        const joinButton = screen.getByTestId('join-room-btn');
        fireEvent.click(joinButton);

        expect(mockOnJoinRoom).toHaveBeenCalledWith('BG-7XKZ');
    });

    it('utilise navigator.share pour inviter via WhatsApp / Réseaux quand supporté', async () => {
        const shareMock = vi.fn().mockResolvedValue(undefined);
        Object.assign(navigator, {
            share: shareMock,
        });

        render(
            <PrivateRoomModal
                isOpen={true}
                onClose={mockOnClose}
                onCreatePrivateRoom={mockOnCreateRoom}
                onJoinPrivateRoom={mockOnJoinRoom}
                onCancelSearch={mockOnCancelSearch}
                privateRoomCode="BG-4A92"
            />,
        );

        const shareButton = screen.getByTestId('share-whatsapp-btn');
        fireEvent.click(shareButton);

        await waitFor(() => {
            expect(shareMock).toHaveBeenCalledWith(expect.objectContaining({
                title: expect.stringContaining('Backgammon'),
                url: expect.stringContaining('/?join=BG-4A92'),
            }));
        });
    });
});
