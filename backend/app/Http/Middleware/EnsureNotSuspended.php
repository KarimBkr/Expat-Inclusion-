<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureNotSuspended
{
    // Une session ouverte avant la suspension ne doit plus donner accès à l'API.
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()?->isSuspended()) {
            abort(403, 'Ce compte a été suspendu. Contactez l\'administration.');
        }

        return $next($request);
    }
}
