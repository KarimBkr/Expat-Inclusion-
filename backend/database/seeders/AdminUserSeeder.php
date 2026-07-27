<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@expat-inclusion.test'],
            [
                'name'              => 'Admin Expat Inclusion',
                'password'          => Hash::make('Password1'),
                'role'              => 'admin',
                'email_verified_at' => now(),
            ]
        );
    }
}
