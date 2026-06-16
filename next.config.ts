import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse relies on pdfjs-dist, which loads a separate "worker" file at
  // runtime. Next.js's server bundler needs to leave this package
  // unbundled (require it normally via node_modules) instead of trying to
  // trace/inline it, or the worker file can't be found.
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
