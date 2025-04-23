/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true
  },
  reactStrictMode: true,
  
  // Standalone build for API routes
  output: "standalone",
  
  // API route'lar için dinamik davranış
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcrypt']
  },

  // Veritabanı hatalarını yönetmek için timeout değerleri
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 45 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 8,
  }
}

module.exports = nextConfig 