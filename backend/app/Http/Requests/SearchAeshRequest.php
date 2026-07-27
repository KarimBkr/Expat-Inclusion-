<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SearchAeshRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isParent() ?? false;
    }

    public function rules(): array
    {
        return [
            'country_id'        => ['nullable', 'integer', 'exists:countries,id'],
            'specialization_id' => ['nullable', 'integer', 'exists:specializations,id'],
            'modality_id'       => ['nullable', 'integer', 'exists:modalities,id'],
            'school_level_id'   => ['nullable', 'integer', 'exists:school_levels,id'],
            'language_id'       => ['nullable', 'integer', 'exists:languages,id'],
            'page'              => ['nullable', 'integer', 'min:1'],
        ];
    }
}
