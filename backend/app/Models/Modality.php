<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Modality extends Model
{
    protected $fillable = ['slug', 'name'];

    public function aeshProfiles(): BelongsToMany
    {
        return $this->belongsToMany(AeshProfile::class);
    }
}
