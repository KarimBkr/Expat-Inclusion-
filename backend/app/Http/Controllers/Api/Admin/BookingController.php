<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreAdminNoteRequest;
use App\Http\Resources\AdminBookingResource;
use App\Http\Resources\AdminNoteResource;
use App\Models\AdminNote;
use App\Models\BookingRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Visibilité transverse sur toutes les demandes de réservation (US-19).
 * Lecture seule sur le state machine : l'admin consulte et note, elle
 * n'accepte/refuse/annule rien à la place du parent ou de l'AESH.
 */
class BookingController extends Controller
{
    private const RELATIONS = ['modality', 'schoolLevel', 'parent', 'aeshProfile.user', 'payments'];

    public function index(Request $request): AnonymousResourceCollection
    {
        $status = $request->query('status');

        $bookings = BookingRequest::query()
            ->with(self::RELATIONS)
            ->when($status, fn ($q) => $q->where('status', $status))
            ->latest()
            ->get();

        return AdminBookingResource::collection($bookings);
    }

    public function show(int $id): AdminBookingResource
    {
        $booking = BookingRequest::with([
            ...self::RELATIONS,
            'statusHistories.author',
            'adminNotes.admin',
        ])->findOrFail($id);

        return AdminBookingResource::make($booking);
    }

    public function storeNote(StoreAdminNoteRequest $request, int $id): JsonResponse
    {
        $booking = BookingRequest::findOrFail($id);

        $note = AdminNote::create([
            'admin_id'           => $request->user()->id,
            'booking_request_id' => $booking->id,
            'body'               => $request->validated('body'),
        ]);

        $note->load('admin');

        return response()->json([
            'message' => 'Note ajoutée.',
            'data'    => new AdminNoteResource($note),
        ], 201);
    }
}
