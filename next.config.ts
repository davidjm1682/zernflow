import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server build (see Dockerfile): the image ships only the
  // files the app actually imports instead of the whole node_modules.
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
