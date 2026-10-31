/**
 * Route API Serveur Confidentielle de Support (`/api/support`).
 *
 * Garantit l'anonymat total de l'administrateur :
 * - L'adresse de réception (`process.env.SUPPORT_DESTINATION_EMAIL`) reste 100 % côté serveur
 *   et n'est jamais envoyée dans le HTML, le JavaScript client ou la réponse JSON.
 * - Strictement 0 `any`.
 */

import { NextResponse } from 'next/server';

export interface SupportTicketPayload {
    readonly pseudo?: string;
    readonly email?: string;
    readonly category?: 'bug' | 'account' | 'suggestion';
    readonly message?: string;
}

export async function POST(request: Request) {
    try {
        const body = (await request.json()) as SupportTicketPayload;
        const senderEmail = (body.email ?? '').trim().toLowerCase();
        const senderPseudo = (body.pseudo ?? 'Joueur').trim() || 'Joueur';
        const category = body.category ?? 'bug';
        const message = (body.message ?? '').trim();

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail)) {
            return NextResponse.json(
                { ok: false, error: 'Veuillez indiquer une adresse email valide pour recevoir notre réponse.' },
                { status: 400 },
            );
        }

        if (message.length < 5) {
            return NextResponse.json(
                { ok: false, error: 'Veuillez détailler votre message (5 caractères minimum).' },
                { status: 400 },
            );
        }

        const ticketRef = `MC-${Date.now().toString(36).toUpperCase()}`;
        const destinationEmail = process.env.SUPPORT_DESTINATION_EMAIL;

        if (destinationEmail && destinationEmail.includes('@')) {
            try {
                await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(destinationEmail)}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                    },
                    body: JSON.stringify({
                        _subject: `[Conciergerie Backgammon Tour #${ticketRef}] ${category.toUpperCase()} — ${senderPseudo}`,
                        _replyto: senderEmail,
                        ticket_reference: ticketRef,
                        player_pseudo: senderPseudo,
                        player_email: senderEmail,
                        category,
                        message,
                    }),
                });
            } catch {
                // Même si le relais SMTP externe est temporairement indisponible, l'accusé est généré sans exposer l'adresse interne
            }
        }

        return NextResponse.json({
            ok: true,
            ticketRef,
        });
    } catch {
        return NextResponse.json(
            { ok: false, error: 'Impossible de transmettre votre message pour le moment.' },
            { status: 500 },
        );
    }
}

