export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-cream border border-line rounded-2xl p-12 text-center">
      <p className="font-medium text-ink mb-1">{title}</p>
      <p className="text-sm text-subtle">{hint}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
