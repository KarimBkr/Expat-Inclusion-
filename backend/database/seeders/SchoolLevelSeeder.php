<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SchoolLevelSeeder extends Seeder
{
    public function run(): void
    {
        $levels = [
            ['slug' => 'maternelle',  'name' => 'Maternelle',         'cycle' => 'Cycle 1', 'order' => 1],
            ['slug' => 'cp',          'name' => 'CP',                  'cycle' => 'Cycle 2', 'order' => 2],
            ['slug' => 'ce1',         'name' => 'CE1',                 'cycle' => 'Cycle 2', 'order' => 3],
            ['slug' => 'ce2',         'name' => 'CE2',                 'cycle' => 'Cycle 2', 'order' => 4],
            ['slug' => 'cm1',         'name' => 'CM1',                 'cycle' => 'Cycle 3', 'order' => 5],
            ['slug' => 'cm2',         'name' => 'CM2',                 'cycle' => 'Cycle 3', 'order' => 6],
            ['slug' => '6eme',        'name' => '6ème',                'cycle' => 'Cycle 3', 'order' => 7],
            ['slug' => '5eme',        'name' => '5ème',                'cycle' => 'Cycle 4', 'order' => 8],
            ['slug' => '4eme',        'name' => '4ème',                'cycle' => 'Cycle 4', 'order' => 9],
            ['slug' => '3eme',        'name' => '3ème',                'cycle' => 'Cycle 4', 'order' => 10],
            ['slug' => '2nde',        'name' => 'Seconde',             'cycle' => 'Lycée',   'order' => 11],
            ['slug' => '1ere',        'name' => 'Première',            'cycle' => 'Lycée',   'order' => 12],
            ['slug' => 'terminale',   'name' => 'Terminale',           'cycle' => 'Lycée',   'order' => 13],
        ];

        foreach ($levels as $item) {
            DB::table('school_levels')->updateOrInsert(
                ['slug' => $item['slug']],
                array_merge($item, ['created_at' => now(), 'updated_at' => now()])
            );
        }
    }
}
