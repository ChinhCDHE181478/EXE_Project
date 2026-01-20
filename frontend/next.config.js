/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'r-xx.bstatic.com',
        pathname: '/data/**',
      },
      {
        protocol: 'https',
        hostname: 'r-xx.bstatic.com',
        pathname: '/images/**',
      },
    ],
  },
};

module.exports = nextConfig;
