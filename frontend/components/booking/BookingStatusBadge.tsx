import type { BookingStatus } from "@/types/booking";

const STYLES: Record<BookingStatus, string> = {
  requested: "bg-amber-50 text-amber-800 border-amber-200",
  accepted: "bg-primary-light text-primary border-primary/20",
  declined: "bg-danger/10 text-danger border-danger/20",
  cancelled: "bg-cream text-subtle border-line",
};

export function BookingStatusBadge({ status, label }: { status: BookingStatus; label: string }) {
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${STYLES[status]}`}>
      {label}
    </span>
  );
}
