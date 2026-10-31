<x-emails.layout title="Nouveau message de contact">
  <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:14px;">
    <tr>
      <td style="padding:8px 0;font-weight:600;color:#6b7280;width:100px;vertical-align:top;">Nom</td>
      <td style="padding:8px 0;color:#111827;">{{ $contact['name'] }}</td>
    </tr>
    <tr style="border-top:1px solid #f0f0f0;">
      <td style="padding:8px 0;font-weight:600;color:#6b7280;vertical-align:top;">Email</td>
      <td style="padding:8px 0;color:#111827;">{{ $contact['email'] }}</td>
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

  <div style="text-align:center;margin:28px 0 0;">
    <a href="mailto:{{ $contact['email'] }}?subject={{ rawurlencode('Re: '.$contact['subject']) }}"
       style="display:inline-block;background:#468157;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 28px;border-radius:10px;">
      Répondre
    </a>
  </div>
</x-emails.layout>
