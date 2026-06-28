<?php

namespace App\Support;

use App\Models\Country;
use App\Models\Language;
use App\Models\Modality;
use App\Models\SchoolLevel;
use App\Models\Specialization;
use Illuminate\Database\Eloquent\Model;
use InvalidArgumentException;

class TaxonomyRegistry
{
    /** @var array<string, class-string<Model>> */
    private const MODELS = [
        'countries'       => Country::class,
        'specializations' => Specialization::class,
        'languages'       => Language::class,
        'school-levels'   => SchoolLevel::class,
        'modalities'      => Modality::class,
    ];

    public static function types(): array
    {
        return array_keys(self::MODELS);
    }

    public static function model(string $type): string
    {
        if (! isset(self::MODELS[$type])) {
            throw new InvalidArgumentException("Type de taxonomie inconnu : {$type}.");
        }

        return self::MODELS[$type];
    }

    /** @return array<string, mixed> */
    public static function rules(string $type, ?int $id = null): array
    {
        $uniqueSlug = fn (string $table) => $id
            ? "unique:{$table},slug,{$id}"
            : "unique:{$table},slug";

        $uniqueCode = fn (string $table, int $max) => $id
            ? "unique:{$table},code,{$id}"
            : "unique:{$table},code";

        return match ($type) {
            'countries' => [
                'code'            => ['required', 'string', 'size:2', 'alpha', $uniqueCode('countries', 2)],
                'name'            => ['required', 'string', 'max:100'],
                'is_aefe_network' => ['required', 'boolean'],
            ],
            'specializations' => [
                'slug' => ['required', 'string', 'max:50', 'regex:/^[a-z0-9-]+$/', $uniqueSlug('specializations')],
                'name' => ['required', 'string', 'max:150'],
            ],
            'languages' => [
                'code' => ['required', 'string', 'min:2', 'max:5', $uniqueCode('languages', 5)],
                'name' => ['required', 'string', 'max:100'],
            ],
            'school-levels' => [
                'slug'  => ['required', 'string', 'max:50', 'regex:/^[a-z0-9-]+$/', $uniqueSlug('school_levels')],
                'name'  => ['required', 'string', 'max:100'],
                'cycle' => ['required', 'string', 'max:50'],
                'order' => ['required', 'integer', 'min:0', 'max:255'],
            ],
            'modalities' => [
                'slug' => ['required', 'string', 'max:50', 'regex:/^[a-z0-9-]+$/', $uniqueSlug('modalities')],
                'name' => ['required', 'string', 'max:150'],
            ],
            default => throw new InvalidArgumentException("Type de taxonomie inconnu : {$type}."),
        };
    }

    public static function isInUse(string $type, Model $record): bool
    {
        return match ($type) {
            'countries' => $record instanceof Country && $record->parentProfiles()->exists(),
            'specializations', 'school-levels' => false,
            'languages', 'modalities' => false,
            default => false,
        };
    }
}
