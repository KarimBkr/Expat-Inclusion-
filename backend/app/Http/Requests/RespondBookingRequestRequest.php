<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/** Motif transmis lors d'un refus ou d'une annulation. */
class RespondBookingRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'reason' => ['required', 'string', 'min:5', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'reason.required' => 'Un motif est requis pour informer l\'autre partie.',
            'reason.min'      => 'Le motif doit contenir au moins 5 caractères.',
            'reason.max'      => 'Le motif ne peut pas dépasser 500 caractères.',
        ];
    }
}
