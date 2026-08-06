<?php

namespace App\Http\Requests;

use App\Enums\BookingStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ListBookingRequestsRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null && ($user->isParent() || $user->isAesh());
    }

    public function rules(): array
    {
        return [
            'status' => ['nullable', Rule::enum(BookingStatus::class)],
        ];
    }

    public function messages(): array
    {
        return [
            'status.enum' => 'Le statut demandé est invalide.',
        ];
    }
}
