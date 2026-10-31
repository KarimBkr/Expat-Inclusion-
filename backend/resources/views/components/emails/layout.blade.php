@props(['title'])
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ $title }}</title>
</head>
<body style="margin:0;padding:24px;background:#faf4ec;font-family:sans-serif;color:#1f2937;">
  <div style="max-width:540px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #d1e5d8;">

    <div style="background:#468157;padding:24px 32px;">
      <p style="margin:0;color:#fff;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;font-weight:600;">
        Expat Inclusion
      </p>
      <h1 style="margin:8px 0 0;color:#fff;font-size:20px;font-weight:700;">
        {{ $title }}
      </h1>
    </div>

    <div style="padding:32px;">
      {{ $slot }}
    </div>

    <div style="padding:16px 32px;border-top:1px solid #e5e7eb;text-align:center;">
      <p style="margin:0 0 8px;font-size:11px;color:#9ca3af;">
        Expat Inclusion &mdash; contact@expat-inclusion.com
      </p>
      <p style="margin:0;font-size:11px;line-height:1.6;color:#9ca3af;">
        Vous recevez cet email car une action a été effectuée avec votre adresse sur Expat Inclusion.
        Vos données sont traitées conformément au RGPD&nbsp;: vous pouvez y accéder, les corriger
        ou les supprimer à tout moment (<a href="{{ rtrim(config('app.frontend_url'), '/') }}/mentions-legales#donnees" style="color:#9ca3af;">vos données personnelles</a>).
      </p>
    </div>
  </div>
</body>
</html>
