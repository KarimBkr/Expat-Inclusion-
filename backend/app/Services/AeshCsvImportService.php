<?php

namespace App\Services;

use App\Models\AeshProfile;
use App\Models\Country;
use App\Models\Language;
use App\Models\Modality;
use App\Models\SchoolLevel;
use App\Models\Specialization;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use InvalidArgumentException;

/**
 * Importe des profils AESH depuis un CSV issu du sourcing terrain.
 *
 * Chaque ligne crée un compte (mot de passe aléatoire, jamais transmis :
 * l'AESH l'initialise via « mot de passe oublié » sur son email réel — on
 * réutilise le circuit existant plutôt que d'en inventer un, faute d'emails
 * transactionnels dédiés à ce jour) et un profil au statut `pending`.
 * L'import ne contourne jamais le circuit de vérification admin (US-08) :
 * un profil importé suit exactement le même chemin qu'un profil auto-créé.
 *
 * Une ligne invalide n'interrompt pas l'import des suivantes — le rapport
 * final liste séparément les lignes importées et les lignes en erreur.
 */
class AeshCsvImportService
{
    private const REQUIRED_COLUMNS = [
        'name', 'email', 'bio', 'timezone',
        'specialization_slugs', 'language_codes', 'modality_slugs', 'country_codes',
    ];

    private const LIST_SEPARATOR = ';';

    /**
     * @return array{
     *     imported: list<array{row: int, email: string, user_id: int}>,
     *     errors: list<array{row: int, errors: list<string>}>,
     * }
     */
    public function import(UploadedFile $file): array
    {
        [$header, $rows] = $this->parse($file);

        $missingColumns = array_diff(self::REQUIRED_COLUMNS, $header);
        if ($missingColumns !== []) {
            throw new InvalidArgumentException(
                'Colonnes manquantes dans le CSV : '.implode(', ', $missingColumns),
            );
        }

        $imported = [];
        $errors = [];

        foreach ($rows as $index => $row) {
            $lineNumber = $index + 2; // ligne 1 = en-tête
            $data = array_combine($header, array_pad($row, count($header), null));

            try {
                $user = DB::transaction(fn () => $this->importRow($data));
                $imported[] = ['row' => $lineNumber, 'email' => $data['email'], 'user_id' => $user->id];
            } catch (ValidationException $e) {
                $errors[] = ['row' => $lineNumber, 'errors' => array_merge(...array_values($e->errors()))];
            }
        }

        return ['imported' => $imported, 'errors' => $errors];
    }

    /** @param  array<string, string|null>  $data */
    private function importRow(array $data): User
    {
        $validated = Validator::make($data, [
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'bio' => ['required', 'string', 'min:50', 'max:2000'],
            'experience_years' => ['nullable', 'integer', 'min:0', 'max:60'],
            'timezone' => ['required', 'string', 'timezone:all'],
            'phone' => ['nullable', 'string', 'max:30'],
            'specialization_slugs' => ['required', 'string'],
            'language_codes' => ['required', 'string'],
            'modality_slugs' => ['required', 'string'],
            'country_codes' => ['required', 'string'],
            'school_level_slugs' => ['nullable', 'string'],
        ])->validate();

        $specializationIds = $this->resolveTaxonomyIds(Specialization::class, 'slug', $validated['specialization_slugs']);
        $languageIds = $this->resolveTaxonomyIds(Language::class, 'code', $validated['language_codes']);
        $modalityIds = $this->resolveTaxonomyIds(Modality::class, 'slug', $validated['modality_slugs']);
        $countryIds = $this->resolveTaxonomyIds(Country::class, 'code', $validated['country_codes']);
        $schoolLevelIds = filled($validated['school_level_slugs'] ?? null)
            ? $this->resolveTaxonomyIds(SchoolLevel::class, 'slug', $validated['school_level_slugs'])
            : [];

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Str::password(40),
            'role' => 'aesh',
        ]);

        event(new Registered($user));

        $profile = AeshProfile::create([
            'user_id' => $user->id,
            'bio' => $validated['bio'],
            'experience_years' => $validated['experience_years'] ?: null,
            'timezone' => $validated['timezone'],
            'phone' => $validated['phone'] ?: null,
        ]);

        $profile->specializations()->sync($specializationIds);
        $profile->languages()->sync($languageIds);
        $profile->modalities()->sync($modalityIds);
        $profile->countries()->sync($countryIds);
        if ($schoolLevelIds !== []) {
            $profile->schoolLevels()->sync($schoolLevelIds);
        }

        return $user;
    }

    /**
     * @param  class-string<Model>  $model
     * @return list<int>
     */
    private function resolveTaxonomyIds(string $model, string $column, string $rawValue): array
    {
        $values = array_values(array_filter(array_map('trim', explode(self::LIST_SEPARATOR, $rawValue))));

        if ($values === []) {
            throw ValidationException::withMessages([$column => ["Aucune valeur fournie pour {$column}."]]);
        }

        $found = $model::whereIn($column, $values)->pluck($column, 'id');
        $unknown = array_diff($values, $found->values()->all());

        if ($unknown !== []) {
            throw ValidationException::withMessages([
                $column => [sprintf('Valeurs inconnues pour %s : %s', $column, implode(', ', $unknown))],
            ]);
        }

        return $found->keys()->all();
    }

    /** @return array{0: list<string>, 1: list<list<string|null>>} */
    private function parse(UploadedFile $file): array
    {
        $handle = fopen($file->getRealPath(), 'r');
        if ($handle === false) {
            throw new InvalidArgumentException('Impossible de lire le fichier.');
        }

        $header = fgetcsv($handle, escape: '\\');
        if ($header === false || $header === [null]) {
            fclose($handle);
            throw new InvalidArgumentException('Le fichier CSV est vide.');
        }
        $header = array_map(fn (?string $col) => trim((string) $col), $header);

        $rows = [];
        while (($row = fgetcsv($handle, escape: '\\')) !== false) {
            if ($row === [null]) {
                continue; // ligne vide
            }
            $rows[] = $row;
        }
        fclose($handle);

        return [$header, $rows];
    }
}
