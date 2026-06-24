<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SpecializationSeeder extends Seeder
{
    public function run(): void
    {
        $specializations = [
            ['slug' => 'tsa',         'name' => 'Trouble du Spectre de l\'Autisme (TSA)'],
            ['slug' => 'tdah',        'name' => 'Trouble Déficit de l\'Attention / Hyperactivité (TDA/H)'],
            ['slug' => 'dyslexie',    'name' => 'Dyslexie'],
            ['slug' => 'dysorthographie', 'name' => 'Dysorthographie'],
            ['slug' => 'dyscalculie', 'name' => 'Dyscalculie'],
            ['slug' => 'dyspraxie',   'name' => 'Dyspraxie'],
            ['slug' => 'dysphasie',   'name' => 'Dysphasie'],
            ['slug' => 'eip',         'name' => 'Élève Intellectuellement Précoce (EIP)'],
            ['slug' => 'troubles-comportement', 'name' => 'Troubles du comportement'],
            ['slug' => 'polyhandicap', 'name' => 'Polyhandicap'],
        ];

        foreach ($specializations as $item) {
            DB::table('specializations')->updateOrInsert(
                ['slug' => $item['slug']],
                array_merge($item, ['created_at' => now(), 'updated_at' => now()])
            );
        }
    }
}
