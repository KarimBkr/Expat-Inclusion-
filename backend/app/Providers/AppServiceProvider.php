<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\ServiceProvider;
use Stripe\StripeClient;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(StripeClient::class, fn () => new StripeClient(
            config('services.stripe.secret'),
        ));
    }

    public function boot(): void
    {
        // Le lien de reset pointe vers le frontend, pas vers une route Laravel web.
        ResetPassword::createUrlUsing(function (object $user, string $token): string {
            $email = urlencode($user->email);
            $frontendUrl = rtrim(config('app.frontend_url', 'http://localhost:3000'), '/');

            return "{$frontendUrl}/reinitialiser-mot-de-passe?token={$token}&email={$email}";
        });
    }
}
