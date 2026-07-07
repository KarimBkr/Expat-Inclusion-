<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AeshDocument extends Model
{
    protected $fillable = [
        'aesh_profile_id',
        'type',
        'original_name',
        'path',
        'size',
        'status',
        'rejection_reason',
    ];

    protected $attributes = [
        'status' => 'pending',
    ];

    protected function casts(): array
    {
        return [
            'size' => 'integer',
        ];
    }

    public function aeshProfile(): BelongsTo
    {
        return $this->belongsTo(AeshProfile::class);
    }
}
