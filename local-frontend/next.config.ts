import type { NextConfig } from "next";

const withPWA = require("next-pwa")({
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
