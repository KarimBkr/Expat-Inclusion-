import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import FicheAesh from "./FicheAesh";

// The profile itself is only served to logged-in parents, so the metadata stays generic.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return pageMetadata(
    "Profil AESH vérifié",
    "Fiche d'un AESH vérifié par l'équipe Expat Inclusion : spécialités, langues et disponibilités.",
    `/aesh/${id}`
  );
}

export default function FicheAeshPage() {
  return <FicheAesh />;
}
