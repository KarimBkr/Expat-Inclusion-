export default function Loading() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center" role="status" aria-label="Chargement">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
