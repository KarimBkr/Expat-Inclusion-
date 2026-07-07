<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpsertAeshProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAesh() ?? false;
    }

    public function rules(): array
    {
        return [
            'bio'                => ['required', 'string', 'min:50', 'max:2000'],
            'hourly_rate'        => ['required', 'numeric', 'min:0', 'max:9999.99'],
            'experience_years'   => ['nullable', 'integer', 'min:0', 'max:60'],
            'timezone'           => ['required', 'string', 'timezone:all'],
            'phone'              => ['nullable', 'string', 'max:30', 'regex:/^\+?[0-9\s\-().]{6,30}$/'],
            'specialization_ids' => ['required', 'array', 'min:1'],
            'specialization_ids.*' => ['integer', 'exists:specializations,id'],
            'language_ids'       => ['required', 'array', 'min:1'],
            'language_ids.*'     => ['integer', 'exists:languages,id'],
            'modality_ids'       => ['required', 'array', 'min:1'],
            'modality_ids.*'     => ['integer', 'exists:modalities,id'],
            'country_ids'        => ['required', 'array', 'min:1'],
            'country_ids.*'      => ['integer', 'exists:countries,id'],
            'school_level_ids'   => ['nullable', 'array'],
            'school_level_ids.*' => ['integer', 'exists:school_levels,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'bio.required'                => 'La présentation est requise.',
            'bio.min'                     => 'La présentation doit contenir au moins 50 caractères.',
            'bio.max'                     => 'La présentation ne peut pas dépasser 2000 caractères.',
            'hourly_rate.required'        => 'Le tarif horaire est requis.',
            'hourly_rate.numeric'         => 'Le tarif horaire doit être un nombre.',
            'timezone.required'           => 'Le fuseau horaire est requis.',
            'timezone.timezone'           => 'Le fuseau horaire sélectionné est invalide.',
            'phone.regex'                 => 'Le numéro de téléphone est invalide.',
            'specialization_ids.required' => 'Sélectionnez au moins une spécialisation.',
            'specialization_ids.min'      => 'Sélectionnez au moins une spécialisation.',
            'language_ids.required'       => 'Sélectionnez au moins une langue.',
            'language_ids.min'            => 'Sélectionnez au moins une langue.',
            'modality_ids.required'       => 'Sélectionnez au moins une modalité.',
            'modality_ids.min'            => 'Sélectionnez au moins une modalité.',
            'country_ids.required'        => 'Sélectionnez au moins un pays d\'intervention.',
            'country_ids.min'             => 'Sélectionnez au moins un pays d\'intervention.',
        ];
    }
}
