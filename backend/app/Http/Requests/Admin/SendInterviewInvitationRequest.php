<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class SendInterviewInvitationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'meeting_link' => ['required', 'url', 'max:500'],
            'message'      => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'meeting_link.required' => 'Le lien de la visioconférence est requis.',
            'meeting_link.url'      => 'Le lien doit être une URL valide (Teams, Google Meet, ou autre).',
        ];
    }
}
