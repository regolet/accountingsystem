/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure proper trailing slashes
  trailingSlash: false,
  
  // External packages for server components
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
}

module.exports = nextConfig