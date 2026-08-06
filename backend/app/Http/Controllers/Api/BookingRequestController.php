<?php

namespace App\Http\Controllers\Api;

use App\Enums\BookingStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\ListBookingRequestsRequest;
use App\Http\Requests\RespondBookingRequestRequest;
use App\Http\Requests\StoreBookingRequestRequest;
use App\Http\Resources\BookingRequestResource;
use App\Models\BookingRequest;
use App\Models\User;
use App\Services\BookingRequestService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class BookingRequestController extends Controller
{
    private const RELATIONS = ['modality', 'schoolLevel', 'parent', 'aeshProfile.user'];

    public function __construct(private readonly BookingRequestService $service) {}

    /** Demandes de l'utilisateur courant : envoyées côté parent, reçues côté AESH. */
    public function index(ListBookingRequestsRequest $request): AnonymousResourceCollection
    {
        $status = $request->validated('status');

        $bookings = $this->scopedToUser($request->user())
            ->with(self::RELATIONS)
            ->when($status, fn ($q) => $q->where('status', $status))
            ->latest()
            ->get();

        return BookingRequestResource::collection($bookings);
    }

    public function show(BookingRequest $booking): BookingRequestResource
    {
        $this->authorize('view', $booking);

        $booking->load([...self::RELATIONS, 'statusHistories.author']);

        return BookingRequestResource::make($booking);
    }

    public function store(StoreBookingRequestRequest $request): JsonResponse
    {
        $booking = $this->service->create($request->validated(), $request->user());

        return BookingRequestResource::make($booking->load(self::RELATIONS))
            ->response()
            ->setStatusCode(201);
    }

    public function accept(Request $request, BookingRequest $booking): BookingRequestResource
    {
        $this->authorize('respond', $booking);

        $booking = $this->service->transition($booking, BookingStatus::Accepted, $request->user());

        return BookingRequestResource::make($booking->load(self::RELATIONS));
    }

    public function decline(RespondBookingRequestRequest $request, BookingRequest $booking): BookingRequestResource
    {
        $this->authorize('respond', $booking);

        $booking = $this->service->transition(
            $booking,
            BookingStatus::Declined,
            $request->user(),
            $request->validated('reason'),
        );

        return BookingRequestResource::make($booking->load(self::RELATIONS));
    }

    public function cancel(RespondBookingRequestRequest $request, BookingRequest $booking): BookingRequestResource
    {
        $this->authorize('cancel', $booking);

        $booking = $this->service->transition(
            $booking,
            BookingStatus::Cancelled,
            $request->user(),
            $request->validated('reason'),
        );

        return BookingRequestResource::make($booking->load(self::RELATIONS));
    }

    /** @return \Illuminate\Database\Eloquent\Builder<BookingRequest> */
    private function scopedToUser(User $user)
    {
        if ($user->isAesh()) {
            return BookingRequest::whereHas('aeshProfile', fn ($q) => $q->where('user_id', $user->id));
        }

        return BookingRequest::where('parent_id', $user->id);
    }
}
