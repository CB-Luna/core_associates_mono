import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9002',
        pathname: '/core-associates-**',
      },
    ],
  },
};

export default nextConfig;
