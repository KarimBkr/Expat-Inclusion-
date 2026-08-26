<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /** Notifications de l'utilisateur courant, les plus récentes d'abord. */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'data' => $user->notifications()->latest()->paginate(20),
            'unread_count' => $user->unreadNotifications()->count(),
        ]);
    }

    /**
     * Marque une notification comme lue. Le scope sur `$user->notifications()`
     * garantit qu'on ne peut jamais atteindre celle d'un autre utilisateur
     * (404, pas 403 : son existence même n'est pas révélée).
     */
    public function markRead(Request $request, string $notification): JsonResponse
    {
        $request->user()->notifications()->findOrFail($notification)->markAsRead();

        return response()->json(['message' => 'Notification marquée comme lue.']);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications->markAsRead();

        return response()->json(['message' => 'Notifications marquées comme lues.']);
    }
}
