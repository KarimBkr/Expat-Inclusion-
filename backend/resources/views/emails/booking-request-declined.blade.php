@php
  $frontendUrl = rtrim(config('app.frontend_url', 'http://localhost:3000'), '/');
@endphp
<x-emails.layout title="Votre demande a été refusée">
  <p style="margin:0 0 20px;font-size:14px;line-height:1.75;color:#374151;">
    <strong>{{ $booking->aeshProfile->user->name }}</strong> n'est pas en
    mesure de donner suite à votre demande d'accompagnement.
  </p>

  @if ($reason)
    <div style="background:#faf4ec;border-radius:10px;padding:18px;font-size:14px;line-height:1.75;color:#374151;margin-bottom:24px;">
      {!! nl2br(e($reason)) !!}
    </div>
  @endif

  <div style="text-align:center;margin:28px 0;">
    <a href="{{ $frontendUrl }}/dashboard/parent/recherche"
       style="display:inline-block;background:#468157;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 28px;border-radius:10px;">
      Chercher un autre accompagnant
    </a>
  </div>
</x-emails.layout>
