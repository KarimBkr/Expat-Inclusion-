import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

// Static public pages only: AESH profiles are served to logged-in parents, no public endpoint lists them.
export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/faq", "/contact", "/mentions-legales"].map((path) => ({
    url: `${siteUrl}${path}`,
  }));
}
