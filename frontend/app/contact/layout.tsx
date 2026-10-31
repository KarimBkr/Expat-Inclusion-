import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata(
  "Contact",
  "Une question sur Expat Inclusion ? Écrivez à l'équipe : familles, AESH ou partenaires du réseau AEFE.",
  "/contact"
);

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
