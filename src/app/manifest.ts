import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Zyncra",
    short_name: "Zyncra",
    description: "Agenda, POS y Marketing para tu negocio de servicios",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0027fe",
    orientation: "portrait",
    icons: [
      {
        src: "/zyncra-icon.png",
        sizes: "any",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  };
}
