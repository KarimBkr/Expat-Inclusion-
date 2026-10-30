import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.expat-inclusion.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/dashboard/", "/aesh/"] },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
