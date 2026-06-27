<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class ResetPasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'token'    => ['required', 'string'],
            'email'    => ['required', 'email'],
            'password' => ['required', 'confirmed', Password::min(8)->letters()->numbers()],
        ];
    }

    public function messages(): array
    {
        return [
            'token.required'     => 'Le token de réinitialisation est requis.',
            'email.required'     => 'L\'adresse email est requise.',
            'password.required'  => 'Le nouveau mot de passe est requis.',
            'password.confirmed' => 'Les mots de passe ne correspondent pas.',
        ];
    }
}
