<?php

namespace App\Mail;

use App\Models\AeshProfile;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class InterviewInvitationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly AeshProfile $profile,
        public readonly string $meetingLink,
        public readonly ?string $note,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: '[Expat Inclusion] Invitation à un entretien complémentaire');
    }

    public function content(): Content
    {
        return new Content(view: 'emails.interview-invitation');
    }
}
