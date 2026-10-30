export function Spinner({ label = "Chargement…" }: { label?: string }) {
  return (
    <div role="status" className="py-16 flex flex-col items-center justify-center gap-3">
      <div
        aria-hidden="true"
        className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"
      />
      <p className="text-sm text-subtle">{label}</p>
    </div>
  );
}
