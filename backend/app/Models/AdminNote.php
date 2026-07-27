<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdminNote extends Model
{
    protected $fillable = ['admin_id', 'aesh_profile_id', 'body'];

    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    public function aeshProfile(): BelongsTo
    {
        return $this->belongsTo(AeshProfile::class);
    }
}
