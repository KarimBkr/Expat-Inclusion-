<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AeshProfile extends Model
{
    public const STATUS_PENDING = 'pending';

    public const STATUS_APPROVED = 'approved';

    public const STATUS_REJECTED = 'rejected';

    public const STATUS_PUBLISHED = 'published';

    protected $fillable = [
        'user_id',
        'bio',
        'experience_years',
        'timezone',
        'phone',
        'verification_status',
        'rejection_reason',
        'published_at',
    ];

    protected $attributes = [
        'verification_status' => self::STATUS_PENDING,
    ];

    protected function casts(): array
    {
        return [
            'experience_years' => 'integer',
            'published_at' => 'datetime',
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

    public function adminNotes(): HasMany
    {
        return $this->hasMany(AdminNote::class);
    }

    public function isPending(): bool
    {
        return $this->verification_status === self::STATUS_PENDING;
    }

    public function isApproved(): bool
    {
        return $this->verification_status === self::STATUS_APPROVED;
    }

    /** @param  \Illuminate\Database\Eloquent\Builder<AeshProfile>  $query */
    public function scopePublished(Builder $query): void
    {
        $query->where('verification_status', self::STATUS_PUBLISHED);
    }

    public function isComplete(): bool
    {
        return filled($this->bio)
            && filled($this->timezone)
            && $this->specializations()->exists()
            && $this->languages()->exists()
            && $this->modalities()->exists()
            && $this->countries()->exists();
    }
}
