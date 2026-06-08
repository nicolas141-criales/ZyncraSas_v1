import type { MetadataRoute } from "next";
import { ARTICLE_LIST } from "./(zyncra)/blog/articles";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://zyncra.app";
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base,                  lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${base}/features`,    lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/pricing`,     lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/reviews`,     lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${base}/blog`,        lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
  ];

  const articleRoutes: MetadataRoute.Sitemap = ARTICLE_LIST.map((a) => ({
    url: `${base}/blog/${a.slug}`,
    lastModified: new Date(a.dateISO),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...articleRoutes];
}
