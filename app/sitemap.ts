import type { MetadataRoute } from "next";

import { getAppBaseUrl } from "@/lib/site-url";

const routes = [
  "/",
  "/discover",
  "/opportunities",
  "/timeline",
  "/strategy",
  "/methodology",
  "/risk",
  "/privacy"
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getAppBaseUrl();
  const now = new Date();

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "/" || route === "/opportunities" ? "hourly" : "weekly",
    priority: route === "/" ? 1 : 0.7
  }));
}
