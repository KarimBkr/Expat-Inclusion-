<?php

namespace App\Mail;

use App\Models\BookingRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class BookingRequestAcceptedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public readonly BookingRequest $booking) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: '[Expat Inclusion] Votre demande a été acceptée');
    }

    public function content(): Content
    {
        return new Content(view: 'emails.booking-request-accepted');
    }
}
