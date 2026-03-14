// Next.js robots.txt 自動生成
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    sitemap: "https://global-flow-radar.vercel.app/sitemap.xml",
  };
}
