<?php

namespace App\Notifications;

use App\Mail\InterviewInvitationMail;
use App\Models\AeshProfile;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Notifications\Notification;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Invitation à l'entretien complémentaire (US-08 — vérification renforcée).
 * Le lien de visioconférence (Teams, Meet, autre) est fourni par l'admin et
 * transite uniquement par email — jamais de visioconférence intégrée à la
 * plateforme, hors périmètre MVP.
 */
class InterviewInvitationNotification extends Notification implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        private readonly AeshProfile $profile,
        private readonly string $meetingLink,
        private readonly ?string $note,
    ) {}

    /** @return array<int, string> */
    public function via(mixed $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(mixed $notifiable): Mailable
    {
        return (new InterviewInvitationMail($this->profile, $this->meetingLink, $this->note))
            ->to($notifiable->email, $notifiable->name);
    }

    /** @return array<string, mixed> */
    public function toArray(mixed $notifiable): array
    {
        return [
            'type' => 'interview_invitation',
            'message' => 'Notre équipe souhaite s’entretenir avec vous par visioconférence — le lien est dans votre boîte mail.',
            'url' => '/dashboard/aesh/profil',
        ];
    }

    public function failed(Throwable $exception): void
    {
        Log::error('Échec de l’envoi de l’invitation à l’entretien.', [
            'aesh_profile_id' => $this->profile->id,
            'exception' => $exception->getMessage(),
        ]);
    }
}
