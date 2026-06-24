<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ModalitySeeder extends Seeder
{
    public function run(): void
    {
        $modalities = [
            ['slug' => 'presentiel',  'name' => 'Présentiel'],
            ['slug' => 'distanciel',  'name' => 'Distanciel'],
            ['slug' => 'hybride',     'name' => 'Hybride (présentiel + distanciel)'],
        ];

        foreach ($modalities as $item) {
            DB::table('modalities')->updateOrInsert(
                ['slug' => $item['slug']],
                array_merge($item, ['created_at' => now(), 'updated_at' => now()])
            );
        }
    }
}
