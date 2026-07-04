import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Study Flow - Learn Your Way",
    short_name: "Study Flow",
    description: "Personalised study packs, quizzes and Study Spheres for every learning style.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#7c3aed",
    icons: [
      { src: "/brand/study-flow-logo-light.png", sizes: "963x993", type: "image/png", purpose: "any" },
      { src: "/brand/study-flow-logo-dark.png", sizes: "1254x1254", type: "image/png", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
