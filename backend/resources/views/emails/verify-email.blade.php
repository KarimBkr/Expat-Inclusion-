<x-emails.layout title="Vérifiez votre adresse email">
  <p style="margin:0 0 16px;font-size:14px;line-height:1.75;color:#374151;">
    Bonjour,
  </p>
  <p style="margin:0 0 20px;font-size:14px;line-height:1.75;color:#374151;">
    Bienvenue sur Expat Inclusion&nbsp;! Il ne reste qu'une étape&nbsp;: confirmez votre
    adresse email pour activer votre compte.
  </p>

  <div style="text-align:center;margin:28px 0;">
    <a href="{{ $verificationUrl }}"
       style="display:inline-block;background:#468157;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 28px;border-radius:10px;">
      Vérifier mon adresse email
    </a>
  </div>

  <p style="margin:0;font-size:12px;line-height:1.6;color:#9ca3af;">
    Ce lien est valable 60 minutes. Si vous n'êtes pas à l'origine de cette inscription,
    ignorez simplement cet email&nbsp;: aucun compte ne sera activé.
  </p>
</x-emails.layout>
