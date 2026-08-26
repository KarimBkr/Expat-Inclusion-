<?php

namespace App\Notifications;

use App\Mail\VerifyEmailMail;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;

/**
 * Remplace le rendu générique de Laravel par le template brandé Expat
 * Inclusion, tout en réutilisant le calcul du lien signé (`verificationUrl`)
 * et l'éventuelle surcharge `VerifyEmail::createUrlUsing` (voir
 * AppServiceProvider).
 */
class VerifyEmailNotification extends VerifyEmail implements ShouldQueue
{
    use Queueable;

    public function toMail(mixed $notifiable): Mailable
    {
        return (new VerifyEmailMail($this->verificationUrl($notifiable)))
            ->to($notifiable->email, $notifiable->name);
    }
}
