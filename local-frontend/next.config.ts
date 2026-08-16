import type { NextConfig } from "next";

// @ts-expect-error: next-pwa missing type definitions
import nextPWA from "next-pwa";

const withPWA = nextPWA({
  dest: "public",
  disable: process.env.NODE_ENV === 'development', // Disabled in dev to stop infinite reload loops
  register: true,
  skipWaiting: true,
});

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/proxy/:path*",
        destination: "http://backend:8080/api/:path*", // Proxy to Backend in Docker (was localhost)
      },
    ];
  },
  allowedDevOrigins: ['hotel-hub.local']
};

export default withPWA(nextConfig);
