@php
  $frontendUrl = rtrim(config('app.frontend_url', 'http://localhost:3000'), '/');
@endphp
<x-emails.layout title="Votre demande a été acceptée">
  <p style="margin:0 0 20px;font-size:14px;line-height:1.75;color:#374151;">
    <strong>{{ $booking->aeshProfile->user->name }}</strong> a accepté votre
    demande d'accompagnement. Vous pouvez désormais échanger directement pour
    organiser la suite.
  </p>

  <div style="text-align:center;margin:28px 0;">
    <a href="{{ $frontendUrl }}/dashboard/parent/conversations/{{ $booking->id }}"
       style="display:inline-block;background:#468157;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 28px;border-radius:10px;">
      Ouvrir la conversation
    </a>
  </div>
</x-emails.layout>
