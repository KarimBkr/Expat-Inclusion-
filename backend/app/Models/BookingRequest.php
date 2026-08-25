<?php

namespace App\Models;

use App\Enums\BookingStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BookingRequest extends Model
{
    protected $fillable = [
        'parent_id',
        'aesh_profile_id',
        'status',
        'message',
        'modality_id',
        'school_level_id',
        'start_date',
        'hours_per_week',
        'response_reason',
        'responded_at',
    ];

    protected $attributes = [
        'status' => BookingStatus::Requested->value,
    ];

    protected function casts(): array
    {
        return [
            'status' => BookingStatus::class,
            'start_date' => 'date',
            'hours_per_week' => 'integer',
            'responded_at' => 'datetime',
        ];
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'parent_id');
    }

    public function aeshProfile(): BelongsTo
    {
        return $this->belongsTo(AeshProfile::class);
    }

    public function modality(): BelongsTo
    {
        return $this->belongsTo(Modality::class);
    }

    public function schoolLevel(): BelongsTo
    {
        return $this->belongsTo(SchoolLevel::class);
    }

    public function statusHistories(): HasMany
    {
        return $this->hasMany(BookingStatusHistory::class);
    }

    /** @param  \Illuminate\Database\Eloquent\Builder<BookingRequest>  $query */
    public function scopePending(Builder $query): void
    {
        $query->where('status', BookingStatus::Requested);
    }

    /**
     * La demande a-t-elle un jour été acceptée — y compris si elle a ensuite
     * été annulée. Contrairement à `status === Accepted`, ce test survit à
     * une annulation : c'est la condition d'accès à la messagerie, pas le
     * statut courant.
     *
     * Utilise la relation déjà chargée si disponible (listes de demandes) pour
     * éviter une requête par ligne ; retombe sur une requête ciblée sinon
     * (vérification ponctuelle, ex. policy).
     */
    public function wasAccepted(): bool
    {
        if ($this->relationLoaded('statusHistories')) {
            return $this->statusHistories->contains(
                fn (BookingStatusHistory $history) => $history->to_status === BookingStatus::Accepted,
            );
        }

        return $this->statusHistories()->where('to_status', BookingStatus::Accepted)->exists();
    }
}
