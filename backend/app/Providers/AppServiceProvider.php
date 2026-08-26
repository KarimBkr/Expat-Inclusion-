<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Support\Facades\URL;
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

        // Le lien de vérification pointe vers une page frontend qui affiche un
        // résultat lisible, plutôt que vers l'endpoint API qui renvoie du JSON
        // brut. La page relaie ensuite les mêmes paramètres signés à l'API.
        VerifyEmail::createUrlUsing(function (object $user): string {
            $backendUrl = URL::temporarySignedRoute(
                'verification.verify',
                now()->addMinutes(60),
                ['id' => $user->getKey(), 'hash' => sha1($user->getEmailForVerification())],
            );

            $query = parse_url($backendUrl, PHP_URL_QUERY);
            $frontendUrl = rtrim(config('app.frontend_url', 'http://localhost:3000'), '/');

            return "{$frontendUrl}/verifier-email/confirmer/{$user->getKey()}/".sha1($user->getEmailForVerification())."?{$query}";
        });
    }
}
