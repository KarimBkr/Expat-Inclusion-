<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Specialization extends Model
{
    protected $fillable = ['slug', 'name'];

    public function parentProfiles(): HasMany
    {
        return $this->hasMany(ParentProfile::class);
    }
}
