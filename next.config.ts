import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'uploadthing.com',
      },
      {
        protocol: 'https',
        hostname: 'utfs.io',
      },
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
      {
        protocol: 'https',
        hostname: 'subdomain', // Replace with the actual hostname if needed
      },
      {
        protocol: 'https',
        hostname: 'files.stripe.com',
      },
    ],
  },
};

export default nextConfig;
