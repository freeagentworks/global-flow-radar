import { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.mapbox.com",
      },
    ],
  },
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["recharts", "d3"],
  },
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");
export default withNextIntl(nextConfig);
