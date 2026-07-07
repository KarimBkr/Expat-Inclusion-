<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UploadAeshDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAesh() ?? false;
    }

    public function rules(): array
    {
        return [
            'type' => ['required', 'string', Rule::in(['diploma', 'identity', 'certification', 'other'])],
            'file' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
        ];
    }

    public function messages(): array
    {
        return [
            'type.required' => 'Le type de document est requis.',
            'type.in'       => 'Le type de document est invalide.',
            'file.required' => 'Un fichier est requis.',
            'file.mimes'    => 'Le fichier doit être au format PDF, JPG ou PNG.',
            'file.max'      => 'Le fichier ne peut pas dépasser 5 Mo.',
        ];
    }
}
