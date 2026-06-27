<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nouveau message de contact</title>
</head>
<body style="margin:0;padding:24px;background:#faf4ec;font-family:sans-serif;color:#1f2937;">
  <div style="max-width:540px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #d1e5d8;">

    <div style="background:#468157;padding:24px 32px;">
      <p style="margin:0;color:#fff;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;font-weight:600;">
        Expat Inclusion
      </p>
      <h1 style="margin:8px 0 0;color:#fff;font-size:20px;font-weight:700;">
        Nouveau message de contact
      </h1>
    </div>

    <div style="padding:32px;">
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:14px;">
        <tr>
          <td style="padding:8px 0;font-weight:600;color:#6b7280;width:100px;vertical-align:top;">Nom</td>
          <td style="padding:8px 0;color:#111827;">{{ $contact['name'] }}</td>
        </tr>
        <tr style="border-top:1px solid #f0f0f0;">
          <td style="padding:8px 0;font-weight:600;color:#6b7280;vertical-align:top;">Email</td>
          <td style="padding:8px 0;">
            <a href="mailto:{{ $contact['email'] }}" style="color:#468157;text-decoration:none;">
              {{ $contact['email'] }}
            </a>
          </td>
        </tr>
        <tr style="border-top:1px solid #f0f0f0;">
          <td style="padding:8px 0;font-weight:600;color:#6b7280;vertical-align:top;">Profil</td>
          <td style="padding:8px 0;color:#111827;">{{ ucfirst($contact['role']) }}</td>
        </tr>
        <tr style="border-top:1px solid #f0f0f0;">
          <td style="padding:8px 0;font-weight:600;color:#6b7280;vertical-align:top;">Objet</td>
          <td style="padding:8px 0;color:#111827;">{{ $contact['subject'] }}</td>
        </tr>
      </table>

      <div style="background:#faf4ec;border-radius:10px;padding:18px;font-size:14px;line-height:1.75;color:#374151;">
        {!! nl2br(e($contact['message'])) !!}
      </div>
    </div>

    <div style="padding:16px 32px;border-top:1px solid #e5e7eb;text-align:center;">
      <p style="margin:0;font-size:11px;color:#9ca3af;">
        Expat Inclusion &mdash; contact@expat-inclusion.com
      </p>
    </div>
  </div>
</body>
</html>
