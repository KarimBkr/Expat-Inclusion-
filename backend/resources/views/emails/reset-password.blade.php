<x-emails.layout title="Réinitialisation de votre mot de passe">
  <p style="margin:0 0 20px;font-size:14px;line-height:1.75;color:#374151;">
    Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur
    le bouton ci-dessous pour en choisir un nouveau.
  </p>

  <div style="text-align:center;margin:28px 0;">
    <a href="{{ $resetUrl }}"
       style="display:inline-block;background:#468157;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 28px;border-radius:10px;">
      Réinitialiser mon mot de passe
    </a>
  </div>

  <p style="margin:0;font-size:12px;line-height:1.6;color:#9ca3af;">
    Ce lien expire dans 60 minutes. Si vous n'êtes pas à l'origine de cette
    demande, ignorez cet email — votre mot de passe reste inchangé.
  </p>
</x-emails.layout>
