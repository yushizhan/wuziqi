import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Removed output: 'export' to support API Routes and Socket.IO
  trailingSlash: true,
  images: {
    unoptimized: true
  }
};

export default nextConfig;
