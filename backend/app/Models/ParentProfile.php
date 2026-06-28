<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ParentProfile extends Model
{
    protected $fillable = [
        'user_id',
        'country_id',
        'timezone',
        'phone',
        'child_first_name',
        'school_level_id',
        'specialization_id',
        'child_brief',
        'consent_terms',
        'consent_data_processing',
        'consent_marketing',
        'consented_at',
    ];

    protected function casts(): array
    {
        return [
            'consent_terms' => 'boolean',
            'consent_data_processing' => 'boolean',
            'consent_marketing' => 'boolean',
            'consented_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class);
    }

    public function schoolLevel(): BelongsTo
    {
        return $this->belongsTo(SchoolLevel::class);
    }

    public function specialization(): BelongsTo
    {
        return $this->belongsTo(Specialization::class);
    }

    public function isComplete(): bool
    {
        return $this->country_id
            && $this->timezone
            && $this->child_first_name
            && $this->school_level_id
            && $this->specialization_id
            && $this->consent_terms
            && $this->consent_data_processing
            && $this->consented_at !== null;
    }
}
