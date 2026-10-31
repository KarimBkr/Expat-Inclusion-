import { Button } from "@/components/ui/Button";

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="bg-danger/10 rounded-2xl p-6 text-center">
      <p className="text-sm text-danger mb-4">{message}</p>
      {onRetry && (
        <Button size="sm" variant="outline" className="bg-card" onClick={onRetry}>
          Réessayer
        </Button>
      )}
    </div>
  );
}
