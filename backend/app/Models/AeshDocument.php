<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AeshDocument extends Model
{
    public const STATUS_PENDING = 'pending';

    public const STATUS_APPROVED = 'approved';

    public const STATUS_REJECTED = 'rejected';

    public const TYPE_CV = 'cv';

    public const TYPE_COVER_LETTER = 'cover_letter';

    /**
     * Seules des pièces de candidature sont collectées — ni pièce d'identité,
     * ni diplôme : la plateforme ne traite aucun document à portée légale.
     */
    public const TYPES = [self::TYPE_CV, self::TYPE_COVER_LETTER];

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
