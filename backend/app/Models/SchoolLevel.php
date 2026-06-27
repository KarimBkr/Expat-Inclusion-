<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SchoolLevel extends Model
{
    protected $fillable = ['slug', 'name', 'cycle', 'order'];

    public function parentProfiles(): HasMany
    {
        return $this->hasMany(ParentProfile::class);
    }
}
