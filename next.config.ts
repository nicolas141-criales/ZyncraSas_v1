import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for Docker standalone deployment
  output: process.env.DOCKER_BUILD === "1" ? "standalone" : undefined,
};

export default nextConfig;
