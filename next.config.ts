import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep heavy/CJS Node libraries out of the server bundle (mammoth is CJS).
  // PDF extraction uses unpdf, which is serverless-safe and bundles fine.
  serverExternalPackages: ["mammoth"],
};

export default nextConfig;
