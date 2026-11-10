import type { MetadataRoute } from "next";

/** Το admin μπαίνει στην αρχική οθόνη του κινητού και ανοίγει σαν εφαρμογή. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AutoDiag Συνεργείο",
    short_name: "AutoDiag",
    description: "Ραντεβού, πίνακας ημέρας και ψηφιακό βιβλιάριο οχημάτων.",
    lang: "el",
    start_url: "/admin",
    scope: "/",
    display: "standalone",
    background_color: "#eceeef",
    theme_color: "#1e5fb8",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
    shortcuts: [
      { name: "Νέο ραντεβού", url: "/admin/calendar?new=1" },
      { name: "Πελάτες", url: "/admin/customers" },
    ],
  };
}
