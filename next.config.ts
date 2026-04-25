import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/PROJECT_MANAGER/:path*",
        destination: "/manager/:path*",
        permanent: true,
      },
      {
        source: "/api/PROJECT_MANAGER/:path*",
        destination: "/api/manager/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
