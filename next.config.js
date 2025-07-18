/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static exports for Netlify
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  
  // Ensure proper trailing slashes
  trailingSlash: false,
  
  // Image optimization for Netlify
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig