<?php

namespace App\Policies;

use App\Models\ParentProfile;
use App\Models\User;

class ParentProfilePolicy
{
    public function view(User $user, ParentProfile $profile): bool
    {
        return $user->isParent() && $profile->user_id === $user->id;
    }

    public function update(User $user, ParentProfile $profile): bool
    {
        return $user->isParent() && $profile->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->isParent() && ! $user->parentProfile()->exists();
    }
}
