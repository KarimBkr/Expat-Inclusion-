import {
  Briefcase,
  ChevronRight,
  Globe,
  HeartHandshake,
  Inbox,
  Lock,
  MessageCircle,
  Search,
  Shield,
  ShieldCheck,
  User,
  UserPlus,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "AESH qualifiés pour familles expatriées — Réseau AEFE mondial",
  description:
    "Un pont entre l'accompagnement spécialisé et les familles expatriées : AESH vérifiés dans le réseau AEFE, mise en relation gratuite.",
};

const parentSteps = [
  {
    icon: UserPlus,
    title: "Créer son compte",
    description: "Inscrivez-vous en quelques minutes et indiquez votre pays d'expatriation.",
  },
  {
    icon: Search,
    title: "Trouver un AESH vérifié",
    description:
      "Filtrez les profils examinés par notre équipe selon le pays, le besoin et la modalité.",
  },
  {
    icon: MessageCircle,
    title: "Échanger et convenir ensemble",
    description:
      "Une fois votre demande acceptée, échangez via la messagerie et organisez l'accompagnement.",
  },
];

const aeshSteps = [
  {
    icon: UserPlus,
    title: "S'inscrire",
    description: "Créez votre compte et décrivez vos spécialisations, langues et modalités.",
  },
  {
    icon: ShieldCheck,
    title: "Faire vérifier son profil",
    description:
      "Déposez votre CV et votre lettre de motivation : notre équipe examine votre candidature.",
  },
  {
    icon: Inbox,
    title: "Recevoir des demandes",
    description: "Votre profil publié, les familles vous contactent ; vous acceptez ou refusez.",
  },
];

const trustPoints = [
  { icon: ShieldCheck, text: "Profils vérifiés par l'équipe avant publication" },
  { icon: HeartHandshake, text: "Aucune donnée médicale demandée ni stockée" },
  { icon: Lock, text: "Messagerie réservée aux participants de chaque échange" },
];

const MONEY_LINE =
  "Mise en relation gratuite — le tarif se convient directement entre la famille et l'AESH, hors plateforme.";

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

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-ink mb-6 leading-tight">
              Un pont entre l&apos;accompagnement spécialisé et{" "}
              <span className="text-primary">les familles expatriées</span>
            </h1>

            <p className="text-lg text-subtle mb-10 leading-relaxed max-w-lg">
              Expat Inclusion connecte les familles francophones du réseau AEFE avec des AESH
              accompagnants spécialisés — TSA, TDA/H, troubles Dys, EIP — quel que soit votre pays
              d&apos;expatriation.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <ButtonLink href="/inscription?role=parent" size="lg">
                Je suis parent
              </ButtonLink>
              <ButtonLink href="/inscription?role=aesh" variant="outline" size="lg">
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
                <HeartHandshake size={15} className="text-primary shrink-0" />
                Mise en relation gratuite
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
              Trois étapes, que vous soyez famille ou AESH
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[
              {
                id: "parent",
                title: "Pour les familles",
                icon: User,
                items: parentSteps,
                href: "/inscription?role=parent",
                cta: "Je suis parent",
              },
              {
                id: "aesh",
                title: "Pour les AESH",
                icon: Briefcase,
                items: aeshSteps,
                href: "/inscription?role=aesh",
                cta: "Je suis AESH",
              },
            ].map(({ id, title, icon: RoleIcon, items, href, cta }) => (
              <div
                key={id}
                data-testid={`steps-${id}`}
                className="bg-card rounded-2xl p-8 border border-line"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-11 h-11 bg-primary rounded-xl flex items-center justify-center shrink-0">
                    <RoleIcon size={20} className="text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-ink">{title}</h3>
                </div>
                <ol className="flex flex-col gap-5 mb-8">
                  {items.map(({ icon: Icon, title: stepTitle, description }, i) => (
                    <li key={stepTitle} className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-primary-light rounded-xl flex items-center justify-center shrink-0">
                        <Icon size={18} className="text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-ink">
                          <span className="text-subtle font-heading mr-2">{i + 1}.</span>
                          {stepTitle}
                        </p>
                        <p className="text-subtle text-sm leading-relaxed">{description}</p>
                      </div>
                    </li>
                  ))}
                </ol>
                <ButtonLink href={href} variant="outline">
                  {cta}
                  <ChevronRight size={16} className="ml-1" />
                </ButtonLink>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Confiance ────────────────────────────────────────────── */}
      <section id="confiance" className="py-20 px-4 bg-primary-900 text-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold mb-10 text-center">
            Une mise en relation de confiance
          </h2>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {trustPoints.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 bg-white/10 rounded-2xl p-6">
                <Icon size={20} className="text-white shrink-0 mt-0.5" />
                <span className="text-white/90 leading-relaxed">{text}</span>
              </li>
            ))}
          </ul>
          <p className="text-center text-white/80 max-w-2xl mx-auto">{MONEY_LINE}</p>
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
            <ButtonLink href="/inscription?role=parent" size="lg">
              Je suis parent
            </ButtonLink>
            <ButtonLink href="/inscription?role=aesh" variant="outline" size="lg">
              Je suis AESH
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
