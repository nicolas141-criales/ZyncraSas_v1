import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://zyncra.app";
  const now = new Date();
  return [
    { url: base,              lastModified: now, changeFrequency: "weekly",  priority: 1 },
    { url: `${base}/features`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/pricing`,  lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/reviews`,  lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${base}/blog`,     lastModified: now, changeFrequency: "weekly",  priority: 0.6 },
  ];
}
