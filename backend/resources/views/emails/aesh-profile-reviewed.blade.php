@php
  $rejected = $profile->verification_status === \App\Models\AeshProfile::STATUS_REJECTED;
  $frontendUrl = rtrim(config('app.frontend_url', 'http://localhost:3000'), '/');
@endphp
<x-emails.layout :title="$rejected ? 'Votre candidature nécessite des compléments' : 'Votre candidature a été examinée'">
  <p style="margin:0 0 16px;font-size:14px;line-height:1.75;color:#374151;">
    Bonjour {{ $profile->user->name }},
  </p>

  @if ($rejected)
    <p style="margin:0 0 20px;font-size:14px;line-height:1.75;color:#374151;">
      Notre équipe a examiné votre candidature et a besoin de quelques compléments
      avant de pouvoir la retenir. Voici son message&nbsp;:
    </p>
    @if ($profile->rejection_reason)
      <div style="background:#faf4ec;border-radius:10px;padding:18px;font-size:14px;line-height:1.75;color:#374151;margin-bottom:24px;">
        {!! nl2br(e($profile->rejection_reason)) !!}
      </div>
    @endif
  @else
    <p style="margin:0 0 20px;font-size:14px;line-height:1.75;color:#374151;">
      Bonne nouvelle&nbsp;: votre candidature a été examinée par notre équipe et retenue.
      Votre profil sera visible des familles dès sa mise en ligne, et vous recevrez
      leurs demandes par email.
    </p>
  @endif

  <div style="text-align:center;margin:28px 0;">
    <a href="{{ $frontendUrl }}{{ $rejected ? '/dashboard/aesh/documents' : '/dashboard/aesh' }}"
       style="display:inline-block;background:#468157;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 28px;border-radius:10px;">
      {{ $rejected ? 'Compléter ma candidature' : 'Accéder à mon espace' }}
    </a>
  </div>
</x-emails.layout>
