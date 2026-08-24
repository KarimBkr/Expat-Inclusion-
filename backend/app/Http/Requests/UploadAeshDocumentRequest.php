<?php

namespace App\Http\Requests;

use App\Models\AeshDocument;
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
            'type' => ['required', 'string', Rule::in(AeshDocument::TYPES)],
            'file' => ['required', 'file', 'mimes:pdf,doc,docx', 'max:5120'],
        ];
    }

    public function messages(): array
    {
        return [
            'type.required' => 'Le type de document est requis.',
            'type.in'       => 'Seuls le CV et la lettre de motivation sont acceptés.',
            'file.required' => 'Un fichier est requis.',
            'file.mimes'    => 'Le fichier doit être au format PDF, DOC ou DOCX.',
            'file.max'      => 'Le fichier ne peut pas dépasser 5 Mo.',
        ];
    }
}
