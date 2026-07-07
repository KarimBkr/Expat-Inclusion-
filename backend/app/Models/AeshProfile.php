<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AeshProfile extends Model
{
    protected $fillable = [
        'user_id',
        'bio',
        'hourly_rate',
        'experience_years',
        'timezone',
        'phone',
        'verification_status',
        'is_published',
    ];

    protected $attributes = [
        'verification_status' => 'pending',
        'is_published' => false,
    ];

    protected function casts(): array
    {
        return [
            'hourly_rate' => 'decimal:2',
            'experience_years' => 'integer',
            'is_published' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function specializations(): BelongsToMany
    {
        return $this->belongsToMany(Specialization::class);
    }

    public function languages(): BelongsToMany
    {
        return $this->belongsToMany(Language::class);
    }

    public function modalities(): BelongsToMany
    {
        return $this->belongsToMany(Modality::class);
    }

    public function countries(): BelongsToMany
    {
        return $this->belongsToMany(Country::class);
    }

    public function schoolLevels(): BelongsToMany
    {
        return $this->belongsToMany(SchoolLevel::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(AeshDocument::class);
    }

    public function isComplete(): bool
    {
        return filled($this->bio)
            && $this->hourly_rate > 0
            && filled($this->timezone)
            && $this->specializations()->exists()
            && $this->languages()->exists()
            && $this->modalities()->exists()
            && $this->countries()->exists();
    }
}
