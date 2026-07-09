/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  async rewrites() {
    return [
      {
        source: '/stats/:match*',
        destination: `${process.env.NEXT_PUBLIC_UMAMI_URL || 'https://analytics.adogrz.com'}/:match*`,
      },
    ]
  },
}

export default nextConfig
