<?php

namespace App\Notifications;

use App\Mail\BookingRequestCancelledMail;
use App\Models\BookingRequest;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Notifications\Notification;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

class BookingRequestCancelledNotification extends Notification implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        private readonly BookingRequest $booking,
        private readonly ?string $reason,
    ) {}

    /** @return array<int, string> */
    public function via(mixed $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(User $notifiable): Mailable
    {
        return (new BookingRequestCancelledMail($this->booking, $notifiable, $this->reason))
            ->to($notifiable->email, $notifiable->name);
    }

    /** @return array<string, mixed> */
    public function toArray(User $notifiable): array
    {
        $isRecipientParent = $notifiable->id === $this->booking->parent_id;
        $counterpartName = $isRecipientParent
            ? $this->booking->aeshProfile->user->name
            : $this->booking->parent->name;

        return [
            'type' => 'booking_request_cancelled',
            'booking_id' => $this->booking->id,
            'message' => sprintf('%s a annulé l’accompagnement.', $counterpartName),
            'url' => $isRecipientParent ? '/dashboard/parent/reservations' : '/dashboard/aesh/demandes',
        ];
    }

    public function failed(Throwable $exception): void
    {
        Log::error('Échec de l’envoi de la notification d’annulation.', [
            'booking_id' => $this->booking->id,
            'exception' => $exception->getMessage(),
        ]);
    }
}
