/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure proper trailing slashes
  trailingSlash: false,
  
  // Image optimization for Netlify
  images: {
    unoptimized: true,
  },
  
  // Enable experimental features for Netlify
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
}

module.exports = nextConfig