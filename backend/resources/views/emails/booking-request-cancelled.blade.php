@php
  $isRecipientParent = $recipient->id === $booking->parent_id;
  $counterpartName = $isRecipientParent ? $booking->aeshProfile->user->name : $booking->parent->name;
  $frontendUrl = rtrim(config('app.frontend_url', 'http://localhost:3000'), '/');
  $dashboardUrl = $frontendUrl.($isRecipientParent ? '/dashboard/parent/reservations' : '/dashboard/aesh/demandes');
@endphp
<x-emails.layout title="Une réservation a été annulée">
  <p style="margin:0 0 20px;font-size:14px;line-height:1.75;color:#374151;">
    <strong>{{ $counterpartName }}</strong> a annulé l'accompagnement
    précédemment accepté.
  </p>

  @if ($reason)
    <div style="background:#faf4ec;border-radius:10px;padding:18px;font-size:14px;line-height:1.75;color:#374151;margin-bottom:24px;">
      {!! nl2br(e($reason)) !!}
    </div>
  @endif

  <div style="text-align:center;margin:28px 0;">
    <a href="{{ $dashboardUrl }}"
       style="display:inline-block;background:#468157;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 28px;border-radius:10px;">
      Voir mes demandes
    </a>
  </div>
</x-emails.layout>
