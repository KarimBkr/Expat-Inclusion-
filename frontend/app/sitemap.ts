import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.expat-inclusion.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/faq", "/contact", "/mentions-legales", "/inscription", "/connexion"].map(
    (path) => ({ url: `${baseUrl}${path}` }),
  );
}
