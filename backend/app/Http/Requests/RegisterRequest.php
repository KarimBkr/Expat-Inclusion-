<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'     => ['required', 'string', 'max:100'],
            'email'    => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::min(8)->letters()->numbers()],
            'role'     => ['required', 'in:parent,aesh'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'      => 'Votre nom est requis.',
            'email.required'     => 'Votre adresse email est requise.',
            'email.email'        => 'Le format de l\'email est invalide.',
            'email.unique'       => 'Cette adresse email est déjà utilisée.',
            'password.required'  => 'Le mot de passe est requis.',
            'password.confirmed' => 'Les mots de passe ne correspondent pas.',
            'role.required'      => 'Le rôle est requis.',
            'role.in'            => 'Le rôle doit être parent ou aesh.',
        ];
    }
}
