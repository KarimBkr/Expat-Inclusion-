@php
  $frontendUrl = rtrim(config('app.frontend_url', 'http://localhost:3000'), '/');
@endphp
<x-emails.layout title="Nouvelle demande de réservation">
  <p style="margin:0 0 20px;font-size:14px;line-height:1.75;color:#374151;">
    <strong>{{ $booking->parent->name }}</strong> souhaite faire appel à vous
    pour un accompagnement. Consultez la demande pour l'accepter ou la
    refuser.
  </p>

  <div style="text-align:center;margin:28px 0;">
    <a href="{{ $frontendUrl }}/dashboard/aesh/demandes"
       style="display:inline-block;background:#468157;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 28px;border-radius:10px;">
      Voir la demande
    </a>
  </div>
</x-emails.layout>
