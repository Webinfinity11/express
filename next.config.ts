import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ["100.71.189.109"],
  cacheComponents: true,
  experimental: {
    serverActions: { bodySizeLimit: "4mb" },
    agentUpgrade: "security",
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
