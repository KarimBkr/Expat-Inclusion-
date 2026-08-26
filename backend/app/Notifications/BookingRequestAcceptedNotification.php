<?php

namespace App\Notifications;

use App\Mail\BookingRequestAcceptedMail;
use App\Models\BookingRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Notifications\Notification;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

class BookingRequestAcceptedNotification extends Notification implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(private readonly BookingRequest $booking) {}

    /** @return array<int, string> */
    public function via(mixed $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(mixed $notifiable): Mailable
    {
        return (new BookingRequestAcceptedMail($this->booking))
            ->to($notifiable->email, $notifiable->name);
    }

    /** @return array<string, mixed> */
    public function toArray(mixed $notifiable): array
    {
        return [
            'type' => 'booking_request_accepted',
            'booking_id' => $this->booking->id,
            'message' => sprintf('%s a accepté votre demande.', $this->booking->aeshProfile->user->name),
            'url' => "/dashboard/parent/conversations/{$this->booking->id}",
        ];
    }

    public function failed(Throwable $exception): void
    {
        Log::error('Échec de l’envoi de la notification d’acceptation.', [
            'booking_id' => $this->booking->id,
            'exception' => $exception->getMessage(),
        ]);
    }
}
