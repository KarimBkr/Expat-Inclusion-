<?php

use App\Http\Middleware\EnsureRole;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Kreait\Firebase\Exception\FirebaseException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->statefulApi();
        $middleware->throttleApi();
        $middleware->alias(['role' => EnsureRole::class]);

        // API pure, aucune route web `login` : sans ceci, un visiteur non
        // authentifié qui omet l'en-tête Accept: application/json déclenche
        // une tentative de redirection vers une route inexistante — 500 avec
        // trace complète au lieu d'un 401 propre. Désactive la redirection
        // pour tout invité, quel que soit l'en-tête envoyé.
        $middleware->redirectGuestsTo(null);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );

        // Firebase non configuré ou en panne : la messagerie est indisponible, pas l'API entière.
        $exceptions->render(fn (FirebaseException $e, Request $request) => $request->is('api/*')
            ? response()->json(['message' => 'Messagerie momentanément indisponible.'], 503)
            : null);
    })->create();
