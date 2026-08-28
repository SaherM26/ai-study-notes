import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    root: process.cwd(),
  },

  serverExternalPackages: ["pdf-parse", "@napi-rs/canvas"],
};
export default nextConfig;