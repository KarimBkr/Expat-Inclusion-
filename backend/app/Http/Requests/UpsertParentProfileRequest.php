<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpsertParentProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isParent() ?? false;
    }

    public function rules(): array
    {
        return [
            'country_id'              => ['required', 'integer', 'exists:countries,id'],
            'timezone'                => ['required', 'string', 'timezone:all'],
            'phone'                   => ['nullable', 'string', 'max:30', 'regex:/^\+?[0-9\s\-().]{6,30}$/'],
            'child_first_name'        => ['required', 'string', 'max:50'],
            'school_level_id'         => ['required', 'integer', 'exists:school_levels,id'],
            'specialization_id'       => ['required', 'integer', 'exists:specializations,id'],
            'child_brief'             => ['nullable', 'string', 'max:500'],
            'consent_terms'           => ['required', 'accepted'],
            'consent_data_processing' => ['required', 'accepted'],
            'consent_marketing'       => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'country_id.required'              => 'Le pays de résidence est requis.',
            'country_id.exists'                => 'Le pays sélectionné est invalide.',
            'timezone.required'                => 'Le fuseau horaire est requis.',
            'timezone.timezone'                => 'Le fuseau horaire sélectionné est invalide.',
            'phone.regex'                      => 'Le numéro de téléphone est invalide.',
            'child_first_name.required'        => 'Le prénom de l\'enfant est requis.',
            'school_level_id.required'         => 'Le niveau scolaire est requis.',
            'school_level_id.exists'           => 'Le niveau scolaire sélectionné est invalide.',
            'specialization_id.required'       => 'Le type de besoin est requis.',
            'specialization_id.exists'         => 'Le type de besoin sélectionné est invalide.',
            'child_brief.max'                  => 'Le brief ne peut pas dépasser 500 caractères.',
            'consent_terms.required'           => 'Vous devez accepter les conditions générales.',
            'consent_terms.accepted'           => 'Vous devez accepter les conditions générales.',
            'consent_data_processing.required' => 'Vous devez accepter le traitement des données.',
            'consent_data_processing.accepted' => 'Vous devez accepter le traitement des données.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('consent_marketing')) {
            $this->merge([
                'consent_marketing' => filter_var(
                    $this->input('consent_marketing'),
                    FILTER_VALIDATE_BOOLEAN,
                    FILTER_NULL_ON_FAILURE
                ) ?? false,
            ]);
        }
    }
}
