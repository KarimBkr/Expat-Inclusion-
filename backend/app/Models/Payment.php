<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    public const STATUS_PENDING = 'pending';

    public const STATUS_PAID = 'paid';

    public const STATUS_FAILED = 'failed';

    protected $fillable = [
        'booking_request_id',
        'stripe_checkout_session_id',
        'stripe_payment_intent_id',
        'amount',
        'currency',
        'status',
        'paid_at',
    ];

    protected $attributes = [
        'status' => self::STATUS_PENDING,
        'currency' => 'eur',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'integer',
            'paid_at' => 'datetime',
        ];
    }

    public function bookingRequest(): BelongsTo
    {
        return $this->belongsTo(BookingRequest::class);
    }

    public function isPaid(): bool
    {
        return $this->status === self::STATUS_PAID;
    }
}
