import Link from "next/link";

const links = [
  { label: "Concept", href: "/#concept" },
  { label: "Comment ça marche", href: "/#comment-ca-marche" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
  { label: "Mentions légales", href: "/mentions-legales" },
];

export default function Footer() {
  return (
    <footer className="bg-primary-900 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-white text-xs font-bold tracking-tight">
                EI
              </span>
              <span className="font-heading font-semibold text-lg">Expat Inclusion</span>
            </div>
            <p className="text-white/65 text-sm leading-relaxed">
              Un pont entre l&apos;accompagnement spécialisé et les familles expatriées du réseau
              AEFE.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-5">
              Navigation
            </h3>
            <ul className="flex flex-col gap-2.5">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/65 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-5">
              Nous contacter
            </h3>
            <p className="text-sm text-white/65 leading-relaxed">
              Une question ?{" "}
              <Link
                href="/contact"
                className="text-white underline underline-offset-2 hover:no-underline"
              >
                Écrivez-nous
              </Link>
            </p>
            <p className="text-sm text-white/50 mt-2">contact@expat-inclusion.com</p>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-6 text-center text-xs text-white/35">
          © {new Date().getFullYear()} Expat Inclusion — Tous droits réservés
        </div>
      </div>
    </footer>
  );
}
