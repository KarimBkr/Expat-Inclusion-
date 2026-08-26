<?php

namespace App\Notifications;

use App\Mail\BookingRequestReceivedMail;
use App\Models\BookingRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Notifications\Notification;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

class BookingRequestReceivedNotification extends Notification implements ShouldQueue
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
        return (new BookingRequestReceivedMail($this->booking))
            ->to($notifiable->email, $notifiable->name);
    }

    /** @return array<string, mixed> */
    public function toArray(mixed $notifiable): array
    {
        return [
            'type' => 'booking_request_received',
            'booking_id' => $this->booking->id,
            'message' => sprintf('Nouvelle demande de %s.', $this->booking->parent->name),
            'url' => '/dashboard/aesh/demandes',
        ];
    }

    public function failed(Throwable $exception): void
    {
        Log::error('Échec de l’envoi de la notification de demande reçue.', [
            'booking_id' => $this->booking->id,
            'exception' => $exception->getMessage(),
        ]);
    }
}
