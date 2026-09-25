<x-emails.layout title="Invitation à un entretien complémentaire">
  <p style="margin:0 0 20px;font-size:14px;line-height:1.75;color:#374151;">
    Bonjour {{ $profile->user->name }},
  </p>

  <p style="margin:0 0 20px;font-size:14px;line-height:1.75;color:#374151;">
    Notre équipe souhaite échanger avec vous de vive voix pour compléter
    l'examen de votre candidature, à l'occasion d'un court entretien en
    visioconférence.
  </p>

  @if ($note)
    <p style="margin:0 0 20px;font-size:14px;line-height:1.75;color:#374151;background:#faf4ec;border-radius:10px;padding:16px;">
      {{ $note }}
    </p>
  @endif

  <div style="text-align:center;margin:28px 0;">
    <a href="{{ $meetingLink }}"
       style="display:inline-block;background:#468157;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 28px;border-radius:10px;">
      Rejoindre l'entretien
    </a>
  </div>

  <p style="margin:0;font-size:12px;line-height:1.6;color:#9ca3af;">
    Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
    {{ $meetingLink }}
  </p>
</x-emails.layout>
