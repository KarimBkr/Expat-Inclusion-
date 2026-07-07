<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Language extends Model
{
    protected $fillable = ['code', 'name'];

    public function aeshProfiles(): BelongsToMany
    {
        return $this->belongsToMany(AeshProfile::class);
    }
}
