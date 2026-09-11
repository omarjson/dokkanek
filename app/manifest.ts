import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "دكّانك — منظومة المبيعات",
    short_name: "دكّانك",
    description: "منظومة مبيعات ليبية مفتوحة المصدر: بيع، مخزون، صيانة، توصيل",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    dir: "rtl",
    lang: "ar",
    background_color: "#eef1f6",
    theme_color: "#0d6efd",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
