import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Mentions légales de la plateforme Expat Inclusion.",
};

export default function MentionsLegalesPage() {
  return (
    <div className="py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-ink mb-10">Mentions légales</h1>

        <div className="flex flex-col gap-10 text-sm text-ink leading-relaxed">
          <section>
            <h2 className="text-lg font-bold mb-3 text-ink">1. Éditeur du site</h2>
            <p>
              <strong>Expat Inclusion</strong>
              <br />
              Responsable de publication : Jihad BAKARI
              <br />
              Email : contact@expat-inclusion.com
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3 text-ink">2. Hébergement</h2>
            <p className="text-subtle">
              Les informations relatives à l&apos;hébergement seront mises à jour avant
              l&apos;ouverture publique de la plateforme.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3 text-ink">3. Propriété intellectuelle</h2>
            <p>
              L&apos;ensemble du contenu de ce site (textes, images, logos, icônes, structure) est
              la propriété exclusive d&apos;Expat Inclusion. Toute reproduction, représentation,
              modification ou exploitation, totale ou partielle, est strictement interdite sans
              autorisation préalable écrite.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3 text-ink">
              4. Protection des données personnelles (RGPD)
            </h2>
            <p className="mb-3">
              Expat Inclusion collecte et traite des données personnelles dans le cadre de la mise
              en relation entre familles et AESH. Ces données sont traitées conformément au
              Règlement Général sur la Protection des Données (RGPD — Règlement UE 2016/679).
            </p>
            <p className="mb-3">
              <strong>Données collectées :</strong> nom, adresse email, pays de résidence,
              informations professionnelles (pour les AESH). Aucune donnée médicale relative aux
              enfants n&apos;est collectée ni stockée.
            </p>
            <p className="mb-3">
              <strong>Durée de conservation :</strong> les données sont conservées pendant la durée
              d&apos;activité du compte et supprimées sur demande.
            </p>
            <p>
              <strong>Vos droits :</strong> vous disposez d&apos;un droit d&apos;accès, de
              rectification, d&apos;effacement et de portabilité de vos données. Pour exercer ces
              droits, contactez-nous à{" "}
              <a
                href="mailto:contact@expat-inclusion.com"
                className="text-primary hover:underline underline-offset-2"
              >
                contact@expat-inclusion.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3 text-ink">5. Cookies</h2>
            <p>
              Ce site utilise uniquement les cookies strictement nécessaires au fonctionnement de
              l&apos;authentification sécurisée (session Sanctum). Aucun cookie publicitaire ou de
              traçage tiers n&apos;est utilisé.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3 text-ink">6. Responsabilité</h2>
            <p>
              Expat Inclusion met tout en œuvre pour garantir l&apos;exactitude des informations
              publiées. Cependant, la plateforme ne peut être tenue responsable des erreurs ou
              omissions dans le contenu des profils fournis par les utilisateurs.
            </p>
          </section>

          <p className="text-subtle text-xs pt-4 border-t border-line">
            Dernière mise à jour : juin 2026
          </p>
        </div>
      </div>
    </div>
  );
}
