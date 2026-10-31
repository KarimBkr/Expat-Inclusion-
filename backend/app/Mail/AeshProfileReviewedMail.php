<?php

namespace App\Mail;

use App\Models\AeshProfile;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AeshProfileReviewedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public readonly AeshProfile $profile) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: $this->profile->verification_status === AeshProfile::STATUS_REJECTED
            ? '[Expat Inclusion] Votre candidature nécessite des compléments'
            : '[Expat Inclusion] Votre candidature a été examinée par notre équipe');
    }

    public function content(): Content
    {
        return new Content(view: 'emails.aesh-profile-reviewed');
    }
}
