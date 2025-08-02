import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  distDir: 'out',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  allowedDevOrigins: [
    'local-origin.dev', 
    '*.local-origin.dev',
    '10.62.64.8',
    'localhost',
    '127.0.0.1'
  ]
};

export default nextConfig;
