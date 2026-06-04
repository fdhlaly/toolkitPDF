import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "toolkitPDF",
    short_name: "toolkitPDF",
    description:
      "Free PDF tools for merging, splitting, compressing, and unlocking PDF files.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
