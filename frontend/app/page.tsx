import {
  Briefcase,
  CalendarCheck,
  ChevronRight,
  CreditCard,
  Euro,
  Globe,
  MessageCircle,
  Search,
  Shield,
  User,
  UserPlus,
  Video,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "AESH qualifiés pour familles expatriées — Réseau AEFE mondial",
};

const steps = [
  {
    icon: UserPlus,
    step: "01",
    title: "Créez votre profil",
    description:
      "Décrivez le profil de votre enfant, ses besoins spécifiques et vos disponibilités.",
  },
  {
    icon: Search,
    step: "02",
    title: "Trouvez votre AESH",
    description:
      "Parcourez les profils examinés par notre équipe et filtrez selon le pays, le trouble et la modalité.",
  },
  {
    icon: CalendarCheck,
    step: "03",
    title: "Démarrez l'accompagnement",
    description: "Échangez directement via la messagerie sécurisée et réservez en toute confiance.",
  },
];

const familyPoints = [
  { icon: Shield, text: "Candidatures examinées une à une par notre équipe" },
  { icon: Globe, text: "Disponibles dans 30+ pays du réseau AEFE" },
  { icon: MessageCircle, text: "Messagerie directe et sécurisée" },
  { icon: CreditCard, text: "Paiement sécurisé via Stripe" },
];

const aeshPoints = [
  { icon: User, text: "Profil professionnel mis en valeur" },
  { icon: Globe, text: "Familles qualifiées du réseau AEFE" },
  { icon: Video, text: "Présentiel, distanciel ou hybride" },
  { icon: Euro, text: "Vous convenez librement de vos conditions" },
];

const stats = [
  { value: "30+", label: "Pays du réseau AEFE" },
  { value: "10", label: "Spécialisations couvertes" },
  { value: "100%", label: "Profils examinés avant publication" },
];

const faqPreview = [
  {
    q: "Qu'est-ce qu'un AESH ?",
    a: "Un AESH (Accompagnant des Élèves en Situation de Handicap) est un professionnel formé pour soutenir les enfants ayant des besoins éducatifs particuliers : TSA, TDA/H, troubles Dys, EIP. Il intervient en complémentarité de l'équipe pédagogique.",
  },
  {
    q: "Les profils AESH sont-ils contrôlés ?",
    a: "Chaque candidature — CV, lettre de motivation et parcours déclaré — est examinée par notre équipe avant toute publication de profil. Un profil non approuvé n'apparaît jamais dans la recherche. Nous ne collectons en revanche ni pièce d'identité, ni diplôme : il vous revient de vérifier ces éléments lors de vos échanges avec l'accompagnant.",
  },
  {
    q: "Dans quels pays êtes-vous disponibles ?",
    a: "Expat Inclusion couvre les 30+ pays du réseau AEFE (Agence pour l'Enseignement Français à l'Étranger), avec une priorité sur l'Europe, le Moyen-Orient et l'Asie.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="bg-card h-hero flex items-center px-4 overflow-hidden">
        <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-8">
          {/* Texte */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-light text-primary text-sm font-semibold rounded-full mb-8">
              <span className="w-1.5 h-1.5 bg-primary rounded-full" />
              Réseau AEFE — 30+ pays
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-ink mb-6 leading-tight">
              Un AESH qualifié pour votre enfant,{" "}
              <span className="text-primary">partout dans le monde</span>
            </h1>

            <p className="text-lg text-subtle mb-10 leading-relaxed max-w-lg">
              Expat Inclusion connecte les familles francophones du réseau AEFE avec des
              accompagnants spécialisés — TSA, TDA/H, troubles Dys, EIP — quel que soit votre pays
              d&apos;expatriation.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <ButtonLink href="/inscription" size="lg">
                Trouver un AESH
              </ButtonLink>
              <ButtonLink href="/inscription" variant="outline" size="lg">
                Je suis AESH
              </ButtonLink>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-subtle">
              <span className="flex items-center gap-1.5">
                <Shield size={15} className="text-primary shrink-0" />
                Profils examinés
              </span>
              <span className="flex items-center gap-1.5">
                <Globe size={15} className="text-primary shrink-0" />
                30+ pays AEFE
              </span>
              <span className="flex items-center gap-1.5">
                <CreditCard size={15} className="text-primary shrink-0" />
                Paiement sécurisé
              </span>
            </div>
          </div>

          {/* Image — visible uniquement desktop */}
          <div className="relative hidden lg:block aspect-4/3 w-full rounded-2xl overflow-hidden shadow-xl">
            <Image
              src="/hero.png"
              alt="Famille et accompagnant spécialisé"
              fill
              className="object-cover object-center"
              priority
            />
          </div>
        </div>
      </section>

      {/* ── Comment ça marche ────────────────────────────────────── */}
      <section id="comment-ca-marche" className="py-20 px-4 bg-cream">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-ink mb-4">Comment ça marche</h2>
            <p className="text-subtle text-lg max-w-xl mx-auto">
              Un accompagnement spécialisé en 3 étapes simples
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map(({ icon: Icon, step, title, description }) => (
              <div
                key={step}
                className="bg-card rounded-2xl p-8 border border-line hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-11 h-11 bg-primary-light rounded-xl flex items-center justify-center shrink-0">
                    <Icon size={20} className="text-primary" />
                  </div>
                  <span className="text-5xl font-bold text-line leading-none pt-0.5 font-heading">
                    {step}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-ink mb-2">{title}</h3>
                <p className="text-subtle text-sm leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pour les familles & Pour les AESH ───────────────────── */}
      <section id="concept" className="py-20 px-4 bg-card">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Familles */}
            <div className="bg-cream rounded-2xl p-8 border border-line">
              <div className="w-11 h-11 bg-primary rounded-xl flex items-center justify-center mb-6">
                <User size={20} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-ink mb-3">Pour les familles expatriées</h2>
              <p className="text-subtle text-sm leading-relaxed mb-7">
                Votre enfant a des besoins spécifiques et vous êtes à l&apos;étranger ? Accédez à un
                réseau d&apos;AESH qualifiés dans votre pays d&apos;expatriation.
              </p>
              <ul className="flex flex-col gap-3.5 mb-8">
                {familyPoints.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-center gap-3 text-sm text-ink">
                    <Icon size={16} className="text-primary shrink-0" />
                    {text}
                  </li>
                ))}
              </ul>
              <ButtonLink href="/inscription">
                Trouver un AESH
                <ChevronRight size={16} className="ml-1" />
              </ButtonLink>
            </div>

            {/* AESH */}
            <div className="bg-primary-900 rounded-2xl p-8 text-white">
              <div className="w-11 h-11 bg-white/15 rounded-xl flex items-center justify-center mb-6">
                <Briefcase size={20} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-3">Pour les AESH expatriés</h2>
              <p className="text-white/70 text-sm leading-relaxed mb-7">
                Vous accompagnez des élèves à l&apos;étranger et souhaitez valoriser votre expertise
                ? Rejoignez notre réseau et accédez aux familles qui ont besoin de vous.
              </p>
              <ul className="flex flex-col gap-3.5 mb-8">
                {aeshPoints.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-center gap-3 text-sm text-white/90">
                    <Icon size={16} className="text-white/50 shrink-0" />
                    {text}
                  </li>
                ))}
              </ul>
              <ButtonLink href="/inscription" variant="outline-white">
                Proposer mes services
                <ChevronRight size={16} className="ml-1" />
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-primary">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center text-white">
            {stats.map(({ value, label }) => (
              <div key={label}>
                <div className="text-5xl font-bold mb-2 font-heading">{value}</div>
                <div className="text-white/70 text-sm font-medium">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ preview ──────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-cream">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-ink mb-4">Questions fréquentes</h2>
            <p className="text-subtle">Les réponses aux questions les plus courantes</p>
          </div>

          <div className="flex flex-col gap-3 mb-10">
            {faqPreview.map(({ q, a }) => (
              <details key={q} className="bg-card border border-line rounded-xl overflow-hidden">
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

          <div className="text-center">
            <Link
              href="/faq"
              className="text-primary font-semibold hover:underline underline-offset-2 inline-flex items-center gap-1"
            >
              Voir toutes les questions
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA final ────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-card border-t border-line">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-ink mb-4">
            Prêt à rejoindre Expat Inclusion ?
          </h2>
          <p className="text-subtle text-lg mb-10 leading-relaxed max-w-2xl mx-auto">
            Que vous soyez une famille à la recherche d&apos;un AESH qualifié ou un accompagnant
            souhaitant valoriser votre expertise, nous sommes là pour vous.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <ButtonLink href="/inscription" size="lg">
              Trouver un AESH
            </ButtonLink>
            <ButtonLink href="/inscription" variant="outline" size="lg">
              Proposer mes services
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
