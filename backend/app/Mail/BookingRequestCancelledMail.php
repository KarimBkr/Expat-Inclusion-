<?php

namespace App\Mail;

use App\Models\BookingRequest;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class BookingRequestCancelledMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly BookingRequest $booking,
        public readonly User $recipient,
        public readonly ?string $reason,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: '[Expat Inclusion] Une réservation a été annulée');
    }

    public function content(): Content
    {
        return new Content(view: 'emails.booking-request-cancelled');
    }
}
