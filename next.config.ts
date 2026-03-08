import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["youtubei.js", "youtube-dl-exec"],
  outputFileTracingIncludes: {
    "/api/**/*": ["./node_modules/youtube-dl-exec/bin/**/*"],
  },
};

export default nextConfig;
