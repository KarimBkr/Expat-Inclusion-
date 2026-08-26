<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\FirebaseTokenService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FirebaseTokenController extends Controller
{
    public function __construct(private readonly FirebaseTokenService $tokens) {}

    /**
     * Émet un custom token Firebase pour l'utilisateur Sanctum courant.
     * Le front s'authentifie ensuite via signInWithCustomToken.
     */
    public function store(Request $request): JsonResponse
    {
        $payload = $this->tokens->issueFor($request->user());

        return response()->json([
            'token' => $payload['token'],
            'uid' => $payload['uid'],
        ]);
    }
}
