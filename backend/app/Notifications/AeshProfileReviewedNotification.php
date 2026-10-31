<?php

namespace App\Notifications;

use App\Mail\AeshProfileReviewedMail;
use App\Models\AeshProfile;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Notifications\Notification;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

/** Envoyée à l'AESH quand l'admin approuve ou rejette sa candidature. */
class AeshProfileReviewedNotification extends Notification implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(private readonly AeshProfile $profile) {}

    /** @return array<int, string> */
    public function via(mixed $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(mixed $notifiable): Mailable
    {
        return (new AeshProfileReviewedMail($this->profile))
            ->to($notifiable->email, $notifiable->name);
    }

    /** @return array<string, mixed> */
    public function toArray(mixed $notifiable): array
    {
        $rejected = $this->profile->verification_status === AeshProfile::STATUS_REJECTED;

        return [
            'type' => $rejected ? 'aesh_profile_rejected' : 'aesh_profile_approved',
            'message' => $rejected
                ? 'Votre candidature nécessite des compléments.'
                : 'Votre candidature a été examinée par notre équipe.',
            'url' => $rejected ? '/dashboard/aesh/documents' : '/dashboard/aesh',
        ];
    }

    public function failed(Throwable $exception): void
    {
        Log::error('Échec de l’envoi de la notification d’examen de candidature.', [
            'aesh_profile_id' => $this->profile->id,
            'exception' => $exception->getMessage(),
        ]);
    }
}
