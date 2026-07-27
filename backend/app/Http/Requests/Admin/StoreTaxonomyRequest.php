<?php

namespace App\Http\Requests\Admin;

use App\Support\TaxonomyRegistry;
use Illuminate\Foundation\Http\FormRequest;

class StoreTaxonomyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        $type = $this->route('type');

        return TaxonomyRegistry::rules($type);
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('is_aefe_network')) {
            $this->merge([
                'is_aefe_network' => filter_var(
                    $this->input('is_aefe_network'),
                    FILTER_VALIDATE_BOOLEAN,
                    FILTER_NULL_ON_FAILURE
                ) ?? false,
            ]);
        }

        if ($this->has('code') && is_string($this->input('code'))) {
            $this->merge(['code' => strtoupper($this->input('code'))]);
        }
    }

    public function messages(): array
    {
        return [
            'slug.regex' => 'Le slug ne peut contenir que des minuscules, chiffres et tirets.',
            'code.size'  => 'Le code pays doit contenir exactement 2 lettres.',
        ];
    }
}
