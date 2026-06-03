import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep native/heavy Node libraries out of the server bundle so they load at
  // runtime (pdf-parse pulls in pdfjs-dist; mammoth is CJS).
  serverExternalPackages: ["pdf-parse", "mammoth"],
};

export default nextConfig;
