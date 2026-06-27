"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const navLinks = [
  { label: "Concept", href: "/#concept" },
  { label: "Comment ça marche", href: "/#comment-ca-marche" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-card/90 backdrop-blur-sm border-b border-line">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white text-xs font-bold tracking-tight">
              EI
            </span>
            <span className="font-heading font-semibold text-ink text-lg">
              Expat<span className="text-primary">Inclusion</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-subtle hover:text-primary transition-colors font-medium"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/connexion"
              className="text-sm font-medium text-ink hover:text-primary transition-colors"
            >
              Connexion
            </Link>
            <Link
              href="/inscription"
              className="text-sm font-semibold px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors"
            >
              Inscription
            </Link>
          </div>

          <button
            type="button"
            className="md:hidden p-2 text-ink rounded-lg hover:bg-primary-light transition-colors"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={open}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden bg-card border-t border-line">
          <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="py-2.5 text-sm font-medium text-ink hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-line pt-3 mt-2 flex flex-col gap-2">
              <Link
                href="/connexion"
                onClick={() => setOpen(false)}
                className="py-2 text-sm font-medium text-subtle"
              >
                Connexion
              </Link>
              <Link
                href="/inscription"
                onClick={() => setOpen(false)}
                className="text-center text-sm font-semibold px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors"
              >
                Inscription
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
