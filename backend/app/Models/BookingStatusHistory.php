<?php

namespace App\Models;

use App\Enums\BookingStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BookingStatusHistory extends Model
{
    protected $fillable = [
        'booking_request_id',
        'from_status',
        'to_status',
        'changed_by',
        'reason',
    ];

    protected function casts(): array
    {
        return [
            'from_status' => BookingStatus::class,
            'to_status' => BookingStatus::class,
        ];
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
