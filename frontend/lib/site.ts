import type { Metadata } from "next";

// Fallback = production domain, so canonical/OpenGraph URLs stay valid if the variable is forgotten.
const FALLBACK_URL = "https://app.expat-inclusion.com";

if (!process.env.NEXT_PUBLIC_APP_URL) {
  console.warn(`[seo] NEXT_PUBLIC_APP_URL is not set: absolute URLs fall back to ${FALLBACK_URL}`);
}

export const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || FALLBACK_URL).replace(/\/$/, "");

export const SITE_NAME = "Expat Inclusion";

/** Title, description, canonical and OpenGraph for a public page (child openGraph replaces the parent's). */
export function pageMetadata(title: string, description: string, path: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      siteName: SITE_NAME,
      locale: "fr_FR",
      type: "website",
    },
  };
}

export const noIndex: Metadata = { robots: { index: false, follow: false } };
