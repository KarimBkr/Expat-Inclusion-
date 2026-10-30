<?php

namespace Database\Seeders;

use App\Models\AeshDocument;
use App\Models\AeshProfile;
use App\Models\Country;
use App\Models\Language;
use App\Models\Modality;
use App\Models\ParentProfile;
use App\Models\SchoolLevel;
use App\Models\Specialization;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

/**
 * Jeu de démonstration : comptes et profils prêts à projeter.
 *
 * Réservé au développement — les mots de passe sont connus et partagés.
 * À lancer avec : php artisan db:seed --class=DemoSeeder
 */
class DemoSeeder extends Seeder
{
    private const PASSWORD = 'Password1';

    public function run(): void
    {
        if (app()->isProduction()) {
            $this->command?->error('DemoSeeder ne s\'exécute pas en production.');

            return;
        }

        $this->call(AdminUserSeeder::class);

        $this->createFamily();

        foreach ($this->aeshFixtures() as $fixture) {
            $this->createAesh($fixture);
        }

        $this->summary();
    }

    private function createFamily(): void
    {
        $user = User::updateOrCreate(
            ['email' => 'famille@expat-inclusion.test'],
            [
                'name'              => 'Claire Delaunay',
                'password'          => Hash::make(self::PASSWORD),
                'role'              => 'parent',
                'email_verified_at' => now(),
            ]
        );

        ParentProfile::updateOrCreate(
            ['user_id' => $user->id],
            [
                'country_id'              => $this->countryId('AE'),
                'timezone'                => 'Asia/Dubai',
                'phone'                   => '+971501234567',
                'child_first_name'        => 'Léo',
                'school_level_id'         => $this->schoolLevelId('ce2'),
                'specialization_id'       => $this->specializationId('tsa'),
                'child_brief'             => 'Léo est scolarisé au lycée français de Dubaï. Il a besoin d\'un accompagnement pour la concentration en classe et l\'organisation du travail personnel.',
                'consent_terms'           => true,
                'consent_data_processing' => true,
                'consent_marketing'       => false,
                'consented_at'            => now()->subDays(12),
            ]
        );
    }

    /** @param  array<string, mixed>  $fixture */
    private function createAesh(array $fixture): void
    {
        $user = User::updateOrCreate(
            ['email' => $fixture['email']],
            [
                'name'              => $fixture['name'],
                'password'          => Hash::make(self::PASSWORD),
                'role'              => 'aesh',
                'email_verified_at' => now(),
            ]
        );

        $published = $fixture['status'] === AeshProfile::STATUS_PUBLISHED;

        $profile = AeshProfile::updateOrCreate(
            ['user_id' => $user->id],
            [
                'bio'                 => $fixture['bio'],
                'experience_years'    => $fixture['experience'],
                'timezone'            => $fixture['timezone'],
                'phone'               => $fixture['phone'],
                'verification_status' => $fixture['status'],
                'published_at'        => $published ? now()->subDays($fixture['published_days_ago']) : null,
            ]
        );

        $profile->specializations()->sync($this->ids(Specialization::class, $fixture['specializations']));
        $profile->languages()->sync($this->ids(Language::class, $fixture['languages'], 'code'));
        $profile->modalities()->sync($this->ids(Modality::class, $fixture['modalities']));
        $profile->countries()->sync($this->ids(Country::class, $fixture['countries'], 'code'));
        $profile->schoolLevels()->sync($this->ids(SchoolLevel::class, $fixture['school_levels']));

        $profile->documents()->delete();

        foreach ($fixture['documents'] as $type => $status) {
            $this->attachDocument($profile, $type, $status);
        }
    }

    /** Écrit un fichier réel pour que le téléchargement fonctionne pendant la démo. */
    private function attachDocument(AeshProfile $profile, string $type, string $status): void
    {
        $filename = "{$type}.pdf";
        $path     = "aesh-documents/{$profile->id}/{$filename}";

        Storage::disk('local')->put($path, "Document de démonstration — {$type}.\n");

        AeshDocument::create([
            'aesh_profile_id' => $profile->id,
            'type'            => $type,
            'original_name'   => $filename,
            'path'            => $path,
            'size'            => Storage::disk('local')->size($path),
            'status'          => $status,
        ]);
    }

    /**
     * Cinq profils couvrant des pays, spécialités et modalités différents,
     * pour que les filtres de recherche donnent des résultats parlants.
     *
     * @return array<int, array<string, mixed>>
     */
    private function aeshFixtures(): array
    {
        return [
            [
                'email'      => 'samira.aesh@expat-inclusion.test',
                'name'       => 'Samira Benali',
                'bio'        => "Accompagnante spécialisée depuis onze ans, dont sept au sein du réseau AEFE au Moyen-Orient. J'interviens principalement auprès d'enfants porteurs de TSA et de TDA/H, en classe comme en soutien à domicile. Je travaille en lien étroit avec les enseignants et l'équipe pédagogique pour assurer la continuité des adaptations.",
                'experience' => 11,
                'timezone'   => 'Asia/Dubai',
                'phone'      => '+971502223344',
                'status'     => AeshProfile::STATUS_PUBLISHED,
                'published_days_ago' => 21,
                'specializations'    => ['tsa', 'tdah'],
                'languages'          => ['fr', 'en', 'ar'],
                'modalities'         => ['presentiel', 'hybride'],
                'countries'          => ['AE', 'QA'],
                'school_levels'      => ['cp', 'ce1', 'ce2', 'cm1'],
                'documents'          => [AeshDocument::TYPE_CV => AeshDocument::STATUS_APPROVED, AeshDocument::TYPE_COVER_LETTER => AeshDocument::STATUS_APPROVED],
            ],
            [
                'email'      => 'thomas.aesh@expat-inclusion.test',
                'name'       => 'Thomas Leroy',
                'bio'        => "Spécialisé dans l'accompagnement des troubles Dys au collège. Je propose un suivi à distance structuré, avec des outils de compensation numériques que je paramètre avec l'élève. Six ans d'expérience en Asie du Sud-Est auprès de familles francophones expatriées.",
                'experience' => 6,
                'timezone'   => 'Asia/Singapore',
                'phone'      => '+6591234567',
                'status'     => AeshProfile::STATUS_PUBLISHED,
                'published_days_ago' => 14,
                'specializations'    => ['dyslexie', 'dysorthographie', 'dyspraxie'],
                'languages'          => ['fr', 'en'],
                'modalities'         => ['distanciel'],
                'countries'          => ['SG', 'HK'],
                'school_levels'      => ['6eme', '5eme', '4eme', '3eme'],
                'documents'          => [AeshDocument::TYPE_CV => AeshDocument::STATUS_APPROVED],
            ],
            [
                'email'      => 'nadia.aesh@expat-inclusion.test',
                'name'       => 'Nadia Fassi',
                'bio'        => "Neuf ans d'accompagnement d'élèves à haut potentiel et d'enfants présentant des troubles du comportement. Mon approche s'appuie sur un cadre clair, des objectifs courts et une communication régulière avec la famille. J'interviens sur Casablanca et Dakar.",
                'experience' => 9,
                'timezone'   => 'Africa/Casablanca',
                'phone'      => '+212661122334',
                'status'     => AeshProfile::STATUS_PUBLISHED,
                'published_days_ago' => 9,
                'specializations'    => ['eip', 'troubles-comportement'],
                'languages'          => ['fr', 'ar'],
                'modalities'         => ['presentiel'],
                'countries'          => ['MA', 'SN'],
                'school_levels'      => ['cm1', 'cm2', '6eme', '5eme'],
                'documents'          => [AeshDocument::TYPE_CV => AeshDocument::STATUS_APPROVED, AeshDocument::TYPE_COVER_LETTER => AeshDocument::STATUS_PENDING],
            ],
            [
                'email'      => 'claire.aesh@expat-inclusion.test',
                'name'       => 'Claire Morvan',
                'bio'        => "Quatorze ans d'expérience, dont neuf au Japon et en Chine. Je suis spécialisée dans la dyspraxie et la dyscalculie, avec un travail important sur le geste graphique et la manipulation. Je propose un format hybride : présence en classe et séances de reprise à distance.",
                'experience' => 14,
                'timezone'   => 'Asia/Tokyo',
                'phone'      => '+819012345678',
                'status'     => AeshProfile::STATUS_PUBLISHED,
                'published_days_ago' => 4,
                'specializations'    => ['dyspraxie', 'dyscalculie'],
                'languages'          => ['fr', 'en', 'ja'],
                'modalities'         => ['hybride', 'distanciel'],
                'countries'          => ['JP', 'CN'],
                'school_levels'      => ['maternelle', 'cp', 'ce1', 'ce2'],
                'documents'          => [AeshDocument::TYPE_CV => AeshDocument::STATUS_APPROVED, AeshDocument::TYPE_COVER_LETTER => AeshDocument::STATUS_APPROVED],
            ],
            [
                'email'      => 'julien.aesh@expat-inclusion.test',
                'name'       => 'Julien Roux',
                'bio'        => "Trois ans d'accompagnement au lycée français de Madrid, auprès d'élèves porteurs de TSA. Je travaille surtout la méthodologie et la préparation aux examens, en visioconférence.",
                'experience' => 3,
                'timezone'   => 'Europe/Madrid',
                'phone'      => '+34611223344',
                'status'     => AeshProfile::STATUS_PENDING,
                'published_days_ago' => 0,
                'specializations'    => ['tsa'],
                'languages'          => ['fr', 'es'],
                'modalities'         => ['distanciel'],
                'countries'          => ['ES'],
                'school_levels'      => ['2nde', '1ere'],
                'documents'          => [AeshDocument::TYPE_CV => AeshDocument::STATUS_PENDING, AeshDocument::TYPE_COVER_LETTER => AeshDocument::STATUS_PENDING],
            ],
        ];
    }

    /**
     * @param  class-string<\Illuminate\Database\Eloquent\Model>  $model
     * @param  array<int, string>  $keys
     * @return array<int, int>
     */
    private function ids(string $model, array $keys, string $column = 'slug'): array
    {
        return $model::whereIn($column, $keys)->pluck('id')->all();
    }

    private function countryId(string $code): int
    {
        return Country::where('code', $code)->value('id');
    }

    private function schoolLevelId(string $slug): int
    {
        return SchoolLevel::where('slug', $slug)->value('id');
    }

    private function specializationId(string $slug): int
    {
        return Specialization::where('slug', $slug)->value('id');
    }

    private function summary(): void
    {
        $this->command?->newLine();
        $this->command?->info('Comptes de démonstration — mot de passe commun : '.self::PASSWORD);
        $this->command?->table(
            ['Rôle', 'Email', 'Ce qu\'il permet de montrer'],
            [
                ['Admin', 'admin@expat-inclusion.test', 'Taxonomies, file des candidatures, publication, notes'],
                ['Famille', 'famille@expat-inclusion.test', 'Profil complet, recherche, fiche, demande de réservation'],
                ['AESH', 'samira.aesh@expat-inclusion.test', 'Profil publié, CV et LM déposés, demandes reçues'],
                ['AESH', 'julien.aesh@expat-inclusion.test', 'Profil en attente — à valider en direct côté admin'],
            ]
        );
    }
}
