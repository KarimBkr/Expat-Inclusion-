<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CountrySeeder extends Seeder
{
    public function run(): void
    {
        $countries = [
            // Europe
            ['code' => 'FR', 'name' => 'France',              'is_aefe_network' => true],
            ['code' => 'BE', 'name' => 'Belgique',            'is_aefe_network' => true],
            ['code' => 'CH', 'name' => 'Suisse',              'is_aefe_network' => true],
            ['code' => 'DE', 'name' => 'Allemagne',           'is_aefe_network' => true],
            ['code' => 'ES', 'name' => 'Espagne',             'is_aefe_network' => true],
            ['code' => 'IT', 'name' => 'Italie',              'is_aefe_network' => true],
            ['code' => 'GB', 'name' => 'Royaume-Uni',         'is_aefe_network' => true],
            ['code' => 'NL', 'name' => 'Pays-Bas',            'is_aefe_network' => true],
            ['code' => 'PT', 'name' => 'Portugal',            'is_aefe_network' => true],
            ['code' => 'LU', 'name' => 'Luxembourg',          'is_aefe_network' => true],
            // Moyen-Orient / Afrique du Nord
            ['code' => 'MA', 'name' => 'Maroc',               'is_aefe_network' => true],
            ['code' => 'TN', 'name' => 'Tunisie',             'is_aefe_network' => true],
            ['code' => 'DZ', 'name' => 'Algérie',             'is_aefe_network' => true],
            ['code' => 'AE', 'name' => 'Émirats arabes unis', 'is_aefe_network' => true],
            ['code' => 'SA', 'name' => 'Arabie Saoudite',     'is_aefe_network' => true],
            ['code' => 'QA', 'name' => 'Qatar',               'is_aefe_network' => true],
            ['code' => 'EG', 'name' => 'Égypte',              'is_aefe_network' => true],
            ['code' => 'SN', 'name' => 'Sénégal',             'is_aefe_network' => true],
            ['code' => 'CI', 'name' => 'Côte d\'Ivoire',      'is_aefe_network' => true],
            ['code' => 'CM', 'name' => 'Cameroun',            'is_aefe_network' => true],
            // Asie-Pacifique
            ['code' => 'JP', 'name' => 'Japon',               'is_aefe_network' => true],
            ['code' => 'SG', 'name' => 'Singapour',           'is_aefe_network' => true],
            ['code' => 'HK', 'name' => 'Hong Kong',           'is_aefe_network' => true],
            ['code' => 'CN', 'name' => 'Chine',               'is_aefe_network' => true],
            ['code' => 'IN', 'name' => 'Inde',                'is_aefe_network' => true],
            // Amériques
            ['code' => 'US', 'name' => 'États-Unis',          'is_aefe_network' => true],
            ['code' => 'CA', 'name' => 'Canada',              'is_aefe_network' => true],
            ['code' => 'BR', 'name' => 'Brésil',              'is_aefe_network' => true],
            ['code' => 'MX', 'name' => 'Mexique',             'is_aefe_network' => true],
            ['code' => 'AR', 'name' => 'Argentine',           'is_aefe_network' => true],
        ];

        foreach ($countries as $item) {
            DB::table('countries')->updateOrInsert(
                ['code' => $item['code']],
                array_merge($item, ['created_at' => now(), 'updated_at' => now()])
            );
        }
    }
}
