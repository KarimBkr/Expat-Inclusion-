import type { BookingRequest } from "@/types/booking";

/** Bloc de détails partagé par les listes parent et AESH. */
export function BookingSummary({ booking }: { booking: BookingRequest }) {
  return (
    <>
      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <Detail label="Début souhaité" value={formatDate(booking.start_date)} />
        <Detail label="Volume" value={`${booking.hours_per_week} h / semaine`} />
        <Detail label="Modalité" value={booking.modality?.name ?? "—"} />
        <Detail label="Niveau" value={booking.school_level?.name ?? "—"} />
      </dl>

      <p className="text-sm text-subtle leading-relaxed mt-4 whitespace-pre-line">
        {booking.message}
      </p>

      {booking.response_reason && (
        <p className="text-sm text-subtle mt-4 p-3 bg-cream border border-line rounded-xl">
          <span className="font-medium text-ink">Motif : </span>
          {booking.response_reason}
        </p>
      )}
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-subtle">{label}</dt>
      <dd className="text-ink font-medium mt-0.5">{value}</dd>
    </div>
  );
}

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
