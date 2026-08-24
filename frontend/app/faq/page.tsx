import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ — Questions fréquentes",
  description:
    "Toutes les réponses à vos questions sur Expat Inclusion : comment ça marche, profils AESH, paiement, sécurité des données.",
};

const categories = [
  {
    title: "Général",
    items: [
      {
        q: "Qu'est-ce qu'Expat Inclusion ?",
        a: "Expat Inclusion est une plateforme de mise en relation entre des AESH (Accompagnants des Élèves en Situation de Handicap) expatriés et des familles francophones du réseau AEFE. Notre objectif : garantir à chaque enfant en situation de handicap ou à besoins particuliers l'accès à un accompagnement qualifié, où qu'il se trouve dans le monde.",
      },
      {
        q: "Qu'est-ce qu'un AESH ?",
        a: "Un AESH est un professionnel formé pour soutenir les enfants ayant des besoins éducatifs particuliers : troubles du spectre autistique (TSA), TDA/H, troubles Dys (dyslexie, dysorthographie, dyspraxie, dyscalculie, dysphasie), Enfants à Intelligence Précoce (EIP) ou polyhandicap. Il intervient en complémentarité des équipes pédagogiques.",
      },
      {
        q: "Pour qui est conçue la plateforme ?",
        a: "La plateforme s'adresse à deux types d'utilisateurs : les familles francophones expatriées dans le réseau AEFE qui recherchent un accompagnement spécialisé pour leur enfant, et les AESH expatriés qui souhaitent proposer leurs services à ces familles.",
      },
    ],
  },
  {
    title: "Pour les familles",
    items: [
      {
        q: "Comment créer mon profil parent ?",
        a: "Après votre inscription, vous accédez à votre espace parent où vous renseignez votre pays d'expatriation, votre fuseau horaire et un brief minimal sur votre enfant (niveau scolaire, besoins généraux). Aucune donnée médicale n'est demandée ni stockée sur la plateforme.",
      },
      {
        q: "Comment trouver un AESH adapté à mon enfant ?",
        a: "Utilisez le moteur de recherche pour filtrer les profils AESH selon le pays, le type de trouble, la modalité (présentiel, distanciel, hybride) et le niveau scolaire. Chaque profil publié a été examiné par notre équipe.",
      },
      {
        q: "Puis-je contacter un AESH avant de réserver ?",
        a: "Oui. Une fois votre demande de réservation acceptée par l'AESH, vous pouvez échanger directement via la messagerie sécurisée intégrée à la plateforme.",
      },
    ],
  },
  {
    title: "Pour les AESH",
    items: [
      {
        q: "Comment créer mon profil AESH ?",
        a: "Après votre inscription, renseignez vos spécialisations, langues parlées, pays d'exercice, modalités proposées et niveaux scolaires couverts. Votre profil ne sera visible qu'après validation par notre équipe.",
      },
      {
        q: "Quels documents dois-je fournir ?",
        a: "Uniquement votre CV et votre lettre de motivation, aux formats PDF, DOC ou DOCX. Nous ne demandons ni pièce d'identité, ni diplôme, ni document médical. Notre équipe examine votre candidature et met à jour son statut : en attente, approuvée ou refusée avec motif.",
      },
      {
        q: "Comment suis-je rémunéré ?",
        a: "Directement par la famille, selon les conditions que vous convenez ensemble une fois la demande acceptée. Expat Inclusion n'affiche aucun tarif sur votre profil et n'intervient pas dans votre rémunération.",
      },
      {
        q: "Puis-je exercer en distanciel ?",
        a: "Oui. Vous choisissez librement votre modalité : présentiel (dans le pays où vous résidez), distanciel (visioconférence avec les familles du monde entier) ou hybride. Vous pouvez modifier cette préférence à tout moment depuis votre profil.",
      },
    ],
  },
  {
    title: "Paiement & sécurité",
    items: [
      {
        q: "Comment fonctionne le paiement ?",
        a: "Le paiement est géré via Stripe Checkout, une solution sécurisée conforme PCI DSS. Lorsque l'AESH accepte une demande, le parent est invité à payer en ligne. Expat Inclusion ne stocke aucune donnée bancaire.",
      },
      {
        q: "Mes données personnelles sont-elles sécurisées ?",
        a: "Oui. Toutes les données sont hébergées en Europe et traitées conformément au RGPD. La messagerie est chiffrée et accessible uniquement aux participants de chaque conversation. Aucune donnée médicale sur les enfants n'est collectée.",
      },
      {
        q: "Puis-je annuler une réservation ?",
        a: "Oui. Les conditions d'annulation sont précisées sur chaque profil AESH. Contactez notre équipe via le formulaire de contact pour toute situation particulière.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <div className="py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-ink mb-4">Questions fréquentes</h1>
          <p className="text-subtle text-lg">
            Vous ne trouvez pas votre réponse ?{" "}
            <a
              href="/contact"
              className="text-primary font-medium hover:underline underline-offset-2"
            >
              Contactez-nous
            </a>
          </p>
        </div>

        <div className="flex flex-col gap-12">
          {categories.map(({ title, items }) => (
            <section key={title}>
              <h2 className="text-lg font-bold text-ink mb-4 pb-2 border-b border-line">{title}</h2>
              <div className="flex flex-col gap-3">
                {items.map(({ q, a }) => (
                  <details
                    key={q}
                    className="bg-card border border-line rounded-xl overflow-hidden"
                  >
                    <summary className="flex items-center justify-between px-6 py-4 cursor-pointer font-semibold text-ink hover:text-primary transition-colors">
                      {q}
                      <ChevronRight size={18} className="text-subtle accordion-chevron" />
                    </summary>
                    <div className="px-6 pb-5 pt-3 text-sm text-subtle leading-relaxed border-t border-line">
                      {a}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
