import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center">
      <p className="text-5xl font-bold text-primary font-heading mb-4">404</p>
      <h1 className="text-2xl font-bold text-ink mb-3">Page introuvable</h1>
      <p className="text-subtle text-sm mb-8">
        Cette page n&apos;existe pas ou a été déplacée. Revenez à l&apos;accueil ou à votre espace.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <ButtonLink href="/">Accueil</ButtonLink>
        <ButtonLink href="/dashboard" variant="outline">
          Mon espace
        </ButtonLink>
      </div>
    </div>
  );
}
