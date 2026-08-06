<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreBookingRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isParent() ?? false;
    }

    public function rules(): array
    {
        return [
            'aesh_profile_id' => ['required', 'integer', 'exists:aesh_profiles,id'],
            'message'         => ['required', 'string', 'min:20', 'max:1000'],
            'modality_id'     => ['required', 'integer', 'exists:modalities,id'],
            'school_level_id' => ['required', 'integer', 'exists:school_levels,id'],
            'start_date'      => ['required', 'date', 'after_or_equal:today'],
            'hours_per_week'  => ['required', 'integer', 'min:1', 'max:40'],
        ];
    }

    public function messages(): array
    {
        return [
            'aesh_profile_id.required' => 'L\'accompagnant est requis.',
            'aesh_profile_id.exists'   => 'Cet accompagnant est introuvable.',
            'message.required'         => 'Décrivez votre besoin en quelques mots.',
            'message.min'              => 'Décrivez votre besoin en 20 caractères minimum.',
            'message.max'              => 'Le message ne peut pas dépasser 1000 caractères.',
            'modality_id.required'     => 'La modalité d\'accompagnement est requise.',
            'modality_id.exists'       => 'La modalité sélectionnée est invalide.',
            'school_level_id.required' => 'Le niveau scolaire est requis.',
            'school_level_id.exists'   => 'Le niveau scolaire sélectionné est invalide.',
            'start_date.required'      => 'La date de début souhaitée est requise.',
            'start_date.after_or_equal' => 'La date de début ne peut pas être dans le passé.',
            'hours_per_week.required'  => 'Le nombre d\'heures par semaine est requis.',
            'hours_per_week.min'       => 'Indiquez au moins 1 heure par semaine.',
            'hours_per_week.max'       => 'Indiquez au maximum 40 heures par semaine.',
        ];
    }
}
