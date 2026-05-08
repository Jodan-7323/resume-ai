import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse uses Node.js native modules - keep it external
  serverExternalPackages: ["pdf-parse"],
  // Skip TypeScript type checking during build
  // (node_modules type conflicts with Next.js 16 + pdfjs-dist)
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
