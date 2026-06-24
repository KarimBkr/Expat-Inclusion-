<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class LanguageSeeder extends Seeder
{
    public function run(): void
    {
        $languages = [
            ['code' => 'fr', 'name' => 'Français'],
            ['code' => 'en', 'name' => 'Anglais'],
            ['code' => 'ar', 'name' => 'Arabe'],
            ['code' => 'es', 'name' => 'Espagnol'],
            ['code' => 'de', 'name' => 'Allemand'],
            ['code' => 'it', 'name' => 'Italien'],
            ['code' => 'pt', 'name' => 'Portugais'],
            ['code' => 'zh', 'name' => 'Chinois (mandarin)'],
            ['code' => 'ja', 'name' => 'Japonais'],
            ['code' => 'ko', 'name' => 'Coréen'],
            ['code' => 'nl', 'name' => 'Néerlandais'],
            ['code' => 'ru', 'name' => 'Russe'],
        ];

        foreach ($languages as $item) {
            DB::table('languages')->updateOrInsert(
                ['code' => $item['code']],
                array_merge($item, ['created_at' => now(), 'updated_at' => now()])
            );
        }
    }
}
