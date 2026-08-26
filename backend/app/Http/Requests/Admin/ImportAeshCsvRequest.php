<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class ImportAeshCsvRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:2048'],
        ];
    }

    public function messages(): array
    {
        return [
            'file.required' => 'Un fichier CSV est requis.',
            'file.mimes' => 'Le fichier doit être au format CSV.',
            'file.max' => 'Le fichier ne peut pas dépasser 2 Mo.',
        ];
    }
}
