<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SearchAeshRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isParent() ?? false;
    }

    public function rules(): array
    {
        return [
            'country_id'      => ['nullable', 'integer', 'exists:countries,id'],
            'modality_id'     => ['nullable', 'integer', 'exists:modalities,id'],
            'school_level_id' => ['nullable', 'integer', 'exists:school_levels,id'],
            'language_id'     => ['nullable', 'integer', 'exists:languages,id'],
            'sort'            => ['nullable', Rule::in(['recent', 'experience'])],
            'page'            => ['nullable', 'integer', 'min:1'],
        ];
    }
}
