<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Country extends Model
{
    protected $fillable = ['code', 'name', 'is_aefe_network'];

    protected function casts(): array
    {
        return [
            'is_aefe_network' => 'boolean',
        ];
    }

    public function parentProfiles(): HasMany
    {
        return $this->hasMany(ParentProfile::class);
    }
}
