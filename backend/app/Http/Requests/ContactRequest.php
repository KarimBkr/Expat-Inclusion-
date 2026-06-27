<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ContactRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'    => ['required', 'string', 'max:100'],
            'email'   => ['required', 'email:rfc', 'max:255'],
            'role'    => ['required', 'in:parent,aesh,autre'],
            'subject' => ['required', 'string', 'max:200'],
            'message' => ['required', 'string', 'min:20', 'max:2000'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'    => 'Votre nom est requis.',
            'name.max'         => 'Le nom ne peut pas dépasser 100 caractères.',
            'email.required'   => 'Votre adresse email est requise.',
            'email.email'      => "L'adresse email n'est pas valide.",
            'role.required'    => 'Veuillez indiquer votre profil.',
            'role.in'          => 'Profil invalide.',
            'subject.required' => "L'objet est requis.",
            'subject.max'      => "L'objet ne peut pas dépasser 200 caractères.",
            'message.required' => 'Votre message est requis.',
            'message.min'      => 'Le message doit contenir au moins 20 caractères.',
            'message.max'      => 'Le message ne peut pas dépasser 2000 caractères.',
        ];
    }
}
