/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
      allowedOrigins: ['creations.adogrz.com'],
    },
  },
}

export default nextConfig
