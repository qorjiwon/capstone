import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://52.79.85.132:8080/api/:path*', 
      },
    ];
  },
};

export default nextConfig;