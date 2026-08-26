<?php

namespace App\Notifications;

use App\Mail\ResetPasswordMail;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;

/**
 * Remplace le rendu générique de Laravel par le template brandé Expat
 * Inclusion, tout en réutilisant `resetUrl` et la surcharge
 * `ResetPassword::createUrlUsing` déjà configurée dans AppServiceProvider
 * (lien pointant vers le frontend).
 */
class ResetPasswordNotification extends ResetPassword implements ShouldQueue
{
    use Queueable;

    public function toMail(mixed $notifiable): Mailable
    {
        return (new ResetPasswordMail($this->resetUrl($notifiable)))
            ->to($notifiable->email, $notifiable->name);
    }
}
